/**
 * BurntAI Authentication Module
 * Handles user registration and login
 */

document.addEventListener('DOMContentLoaded', function() {
    // Create auth modal
    const authModalContent = `
        <div class="auth-tabs">
            <button class="tab-button active" data-tab="login">Login</button>
            <button class="tab-button" data-tab="register">Register</button>
        </div>
        
        <div class="tab-content active" id="login-tab">
            <form class="burntai-form" id="login-form">
                <div class="form-group">
                    <label for="login-username">Username or Email</label>
                    <input type="text" id="login-username" class="form-input" required>
                </div>
                <div class="form-group">
                    <label for="login-password">Password</label>
                    <input type="password" id="login-password" class="form-input" required>
                </div>
                <button type="submit" class="form-button">Enter the Wasteland</button>
            </form>
        </div>
        
        <div class="tab-content" id="register-tab">
            <form class="burntai-form" id="register-form">
                <div class="form-group">
                    <label for="register-username">Username</label>
                    <input type="text" id="register-username" class="form-input" 
                           pattern="[a-zA-Z0-9_]{3,50}" required>
                </div>
                <div class="form-group">
                    <label for="register-email">Email</label>
                    <input type="email" id="register-email" class="form-input" required>
                </div>
                <div class="form-group">
                    <label for="register-password">Password</label>
                    <input type="password" id="register-password" class="form-input" 
                           minlength="6" required>
                </div>
                <button type="submit" class="form-button">Join the Survivors</button>
            </form>
        </div>
    `;
    
    window.burntaiUI.createModal('auth-modal', 'VAULT ACCESS REQUIRED', authModalContent);
    
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            
            // Update active tab button
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update active tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
    
    // Login form handler
    document.getElementById('login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const submitButton = this.querySelector('button[type="submit"]');
        
        window.burntaiUI.showLoading(submitButton, 'Accessing Vault...');
        
        const result = await window.burntaiAPI.login(username, password);
        
        window.burntaiUI.hideLoading(submitButton);
        
        if (result.success) {
            window.burntaiUI.notify('Welcome back to the wasteland!', 'success');
            window.burntaiUI.closeModal('auth-modal');
            updateUIForAuth(true);
        } else {
            window.burntaiUI.notify(result.error || 'Login failed', 'error');
        }
    });
    
    // Register form handler
    document.getElementById('register-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const submitButton = this.querySelector('button[type="submit"]');
        
        window.burntaiUI.showLoading(submitButton, 'Creating Vault ID...');
        
        const result = await window.burntaiAPI.register(username, email, password);
        
        window.burntaiUI.hideLoading(submitButton);
        
        if (result.success) {
            window.burntaiUI.notify('Welcome to BurntAI! Your journey begins...', 'success');
            window.burntaiUI.closeModal('auth-modal');
            updateUIForAuth(true);
        } else {
            window.burntaiUI.notify(result.error || 'Registration failed', 'error');
        }
    });
    
    // Update UI based on auth status
    function updateUIForAuth(isAuthenticated) {
        if (isAuthenticated) {
            // Show authenticated UI elements
            document.querySelectorAll('.auth-required').forEach(el => {
                el.style.display = '';
            });
            document.querySelectorAll('.auth-hidden').forEach(el => {
                el.style.display = 'none';
            });
            
            // Show username if available
            if (window.burntaiAPI.user) {
                document.querySelectorAll('.username-display').forEach(el => {
                    el.textContent = window.burntaiAPI.user.username;
                });
            }
        } else {
            // Show non-authenticated UI
            document.querySelectorAll('.auth-required').forEach(el => {
                el.style.display = 'none';
            });
            document.querySelectorAll('.auth-hidden').forEach(el => {
                el.style.display = '';
            });
        }
    }
    
    // Check initial auth status
    updateUIForAuth(window.burntaiAPI.isAuthenticated());
    
    // Add auth button to navigation
    const nav = document.querySelector('.nav-links');
    if (nav) {
        const authItem = document.createElement('li');
        authItem.innerHTML = `
            <a href="#" class="auth-button auth-hidden">LOGIN</a>
            <a href="#" class="user-menu auth-required" style="display: none;">
                <span class="username-display">USER</span>
            </a>
        `;
        nav.appendChild(authItem);
        
        // Login button click
        authItem.querySelector('.auth-button').addEventListener('click', function(e) {
            e.preventDefault();
            window.burntaiUI.showModal('auth-modal');
        });
        
        // User menu click (for logout)
        authItem.querySelector('.user-menu').addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Leave the wasteland?')) {
                window.burntaiAPI.logout();
                updateUIForAuth(false);
                window.burntaiUI.notify('You have left the vault. Safe travels!', 'info');
            }
        });
    }
});

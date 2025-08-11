/**
 * BurntAI UI Components
 * Cyberpunk-themed UI elements for the wasteland
 */

class BurntAIUI {
    constructor() {
        this.modals = {};
    }
    
    // === Modal System ===
    
    createModal(id, title, content) {
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'burntai-modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close handlers
        modal.querySelector('.modal-close').onclick = () => this.closeModal(id);
        modal.querySelector('.modal-backdrop').onclick = () => this.closeModal(id);
        
        this.modals[id] = modal;
        return modal;
    }
    
    showModal(id) {
        if (this.modals[id]) {
            this.modals[id].classList.add('active');
        }
    }
    
    closeModal(id) {
        if (this.modals[id]) {
            this.modals[id].classList.remove('active');
        }
    }
    
    // === Notification System ===
    
    notify(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `burntai-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">${this.getIcon(type)}</div>
            <div class="notification-message">${message}</div>
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
    
    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }
    
    // === Loading States ===
    
    showLoading(element, message = 'Processing...') {
        const original = element.innerHTML;
        element.dataset.originalContent = original;
        element.disabled = true;
        element.innerHTML = `<span class="loading-spinner"></span> ${message}`;
    }
    
    hideLoading(element) {
        if (element.dataset.originalContent) {
            element.innerHTML = element.dataset.originalContent;
            element.disabled = false;
            delete element.dataset.originalContent;
        }
    }
    
    // === Terminal Output ===
    
    createTerminal(containerId) {
        const container = document.getElementById(containerId);
        const terminal = document.createElement('div');
        terminal.className = 'burntai-terminal';
        terminal.innerHTML = `
            <div class="terminal-header">
                <div class="terminal-lights">
                    <span class="light red"></span>
                    <span class="light yellow"></span>
                    <span class="light green"></span>
                </div>
                <div class="terminal-title">BURNTAI TERMINAL v2.077</div>
            </div>
            <div class="terminal-body">
                <div class="terminal-output"></div>
                <div class="terminal-input-line">
                    <span class="prompt">$</span>
                    <input type="text" class="terminal-input" placeholder="Enter command...">
                </div>
            </div>
        `;
        
        container.appendChild(terminal);
        
        const output = terminal.querySelector('.terminal-output');
        const input = terminal.querySelector('.terminal-input');
        
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && input.value.trim()) {
                this.terminalExecute(input.value, output);
                input.value = '';
            }
        });
        
        return { terminal, output, input };
    }
    
    terminalPrint(output, message, type = 'normal') {
        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        line.textContent = message;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }
    
    terminalExecute(command, output) {
        this.terminalPrint(output, `$ ${command}`, 'command');
        // Override this method to handle commands
    }
}

// Create global instance
window.burntaiUI = new BurntAIUI();

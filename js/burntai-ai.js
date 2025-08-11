// /js/burntai-ai.js - Shared AI module for all BurntAI apps
// Include this in all your AI-powered pages

const BurntAI = {
    // Configuration
    config: {
        baseUrl: '/api',
        retryAttempts: 3,
        retryDelay: 1000,
        timeout: 30000
    },

    // Shared state
    state: {
        requestsInFlight: 0,
        rateLimitRemaining: 100,
        lastError: null
    },

    // Neural Wasteland Chat
    async wastelandChat(message, context = {}) {
        return this._makeRequest('/neural-wasteland.php', {
            message: message,
            context: context,
            radiation: context.radiation || 50
        });
    },

    // Consciousness Fusion
    async fusionChat(systemPrompt, userMessage, consciousness) {
        return this._makeRequest('/consciousness-fusion', {
            systemPrompt: systemPrompt,
            userMessage: userMessage,
            temperature: consciousness.traits.chaos / 100,
            consciousness: consciousness
        });
    },

    // Intel Feed
    async getIntelFeed(forceRefresh = false) {
        const endpoint = forceRefresh ? '/intel-feed.php?force=1' : '/intel-feed.php';
        return this._makeRequest(endpoint, null, 'GET');
    },

    // Analyze custom intel
    async analyzeIntel(headline) {
        return this._makeRequest('/intel-feed.php?analyze=1', {
            headline: headline
        });
    },

    // Core request handler with retry logic
    async _makeRequest(endpoint, data = null, method = 'POST') {
        const url = this.config.baseUrl + endpoint;
        let lastError = null;

        // Show loading state
        this._setLoadingState(true);

        for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
            try {
                const options = {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    }
                };

                if (data && method === 'POST') {
                    options.body = JSON.stringify(data);
                }

                // Add timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
                options.signal = controller.signal;

                const response = await fetch(url, options);
                clearTimeout(timeoutId);

                // Handle rate limiting
                const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
                if (rateLimitRemaining) {
                    this.state.rateLimitRemaining = parseInt(rateLimitRemaining);
                }

                if (!response.ok) {
                    const error = await response.json();
                    
                    // Handle specific errors
                    if (response.status === 429) {
                        const retryAfter = response.headers.get('Retry-After') || 60;
                        throw new Error(`Rate limited. Try again in ${retryAfter} seconds.`);
                    }
                    
                    throw new Error(error.message || `HTTP ${response.status}`);
                }

                const result = await response.json();
                this._setLoadingState(false);
                return result;

            } catch (error) {
                lastError = error;
                
                // Don't retry on rate limits or client errors
                if (error.message.includes('Rate limited') || 
                    error.message.includes('HTTP 4')) {
                    break;
                }

                // Wait before retry
                if (attempt < this.config.retryAttempts - 1) {
                    await this._sleep(this.config.retryDelay * (attempt + 1));
                }
            }
        }

        this._setLoadingState(false);
        this.state.lastError = lastError;
        
        // Throw with context
        throw new Error(`AI request failed: ${lastError.message}`);
    },

    // Loading state management
    _setLoadingState(loading) {
        this.state.requestsInFlight += loading ? 1 : -1;
        
        // Dispatch custom event for UI updates
        window.dispatchEvent(new CustomEvent('burntai:loading', {
            detail: { loading: this.state.requestsInFlight > 0 }
        }));
    },

    // Utility sleep function
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Error display helper
    showError(message, container = null) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'burntai-error';
        errorDiv.innerHTML = `
            <div style="background: rgba(255, 68, 102, 0.2); border: 1px solid #ff4466; 
                        padding: 1rem; border-radius: 5px; margin: 1rem 0; 
                        font-family: 'Share Tech Mono', monospace; color: #ff4466;">
                ⚠️ ${message}
                <button onclick="this.parentElement.remove()" 
                        style="float: right; background: none; border: none; 
                               color: #ff4466; cursor: pointer;">✕</button>
            </div>
        `;
        
        if (container) {
            container.appendChild(errorDiv);
        } else {
            document.body.appendChild(errorDiv);
        }
        
        // Auto-remove after 10 seconds
        setTimeout(() => errorDiv.remove(), 10000);
    },

    // Success notification helper
    showSuccess(message, container = null) {
        const successDiv = document.createElement('div');
        successDiv.className = 'burntai-success';
        successDiv.innerHTML = `
            <div style="background: rgba(0, 255, 136, 0.2); border: 1px solid #00ff88; 
                        padding: 1rem; border-radius: 5px; margin: 1rem 0; 
                        font-family: 'Share Tech Mono', monospace; color: #00ff88;">
                ✓ ${message}
            </div>
        `;
        
        if (container) {
            container.appendChild(successDiv);
        } else {
            document.body.appendChild(successDiv);
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => successDiv.remove(), 5000);
    },

    // Radiation effect generator (for Neural Wasteland)
    addRadiationEffect(element, level) {
        const intensity = level / 100;
        element.style.filter = `hue-rotate(${intensity * 45}deg) contrast(${1 + intensity * 0.5})`;
        
        if (level > 70) {
            element.style.animation = 'glitch 0.5s infinite';
        }
    },

    // Glitch text effect
    glitchText(text, intensity = 0.1) {
        const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`█▓▒░';
        return text.split('').map(char => {
            return Math.random() < intensity ? 
                glitchChars[Math.floor(Math.random() * glitchChars.length)] : 
                char;
        }).join('');
    },

    // Format timestamps for wasteland theme
    formatWastelandTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} cycles ago`;
        if (hours > 0) return `${hours} rotations ago`;
        if (minutes > 0) return `${minutes} intervals ago`;
        return 'Just intercepted';
    },

    // Initialize module
    init() {
        // Add global error handler
        window.addEventListener('unhandledrejection', event => {
            if (event.reason && event.reason.message && 
                event.reason.message.includes('AI request failed')) {
                this.showError(event.reason.message);
                event.preventDefault();
            }
        });

        // Add loading indicator listener
        window.addEventListener('burntai:loading', (event) => {
            const indicator = document.getElementById('ai-loading-indicator');
            if (indicator) {
                indicator.style.display = event.detail.loading ? 'block' : 'none';
            }
        });

        // Add CSS for animations
        if (!document.getElementById('burntai-styles')) {
            const style = document.createElement('style');
            style.id = 'burntai-styles';
            style.textContent = `
                @keyframes glitch {
                    0% { transform: translate(0); }
                    20% { transform: translate(-2px, 2px); }
                    40% { transform: translate(-2px, -2px); }
                    60% { transform: translate(2px, 2px); }
                    80% { transform: translate(2px, -2px); }
                    100% { transform: translate(0); }
                }
                
                .burntai-error, .burntai-success {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    z-index: 9999;
                    animation: slideIn 0.3s ease;
                }
                
                @keyframes slideIn {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `;
            document.head.appendChild(style);
        }

        console.log('%c🔥 BurntAI Systems Online 🔥', 
            'color: #ff8533; font-size: 20px; font-weight: bold;');
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BurntAI.init());
} else {
    BurntAI.init();
}
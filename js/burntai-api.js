/**
 * BurntAI API Client
 * Handles all communication with the wasteland backend
 */

class BurntAIAPI {
    constructor() {
        this.baseURL = window.location.origin + '/api';
        this.wsURL = window.location.origin;
        this.token = localStorage.getItem('burntai_token');
        this.user = null;
        this.socket = null;
        
        // Initialize socket connection if authenticated
        if (this.token) {
            this.initializeSocket();
        }
    }
    
    // === Authentication Methods ===
    
    async register(username, email, password) {
        try {
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('burntai_token', this.token);
                this.initializeSocket();
                return { success: true, data };
            } else {
                return { success: false, error: data.error || 'Registration failed' };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Network error' };
        }
    }
    
    async login(username, password) {
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                this.token = data.token;
                this.user = data.user;
                localStorage.setItem('burntai_token', this.token);
                this.initializeSocket();
                return { success: true, data };
            } else {
                return { success: false, error: data.error || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error' };
        }
    }
    
    logout() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('burntai_token');
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
    
    isAuthenticated() {
        return !!this.token;
    }
    
    // === API Request Methods ===
    
    async request(endpoint, options = {}) {
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            const data = await response.json();
            
            if (response.status === 401) {
                // Token expired or invalid
                this.logout();
                window.location.href = '/';
            }
            
            return { ok: response.ok, status: response.status, data };
        } catch (error) {
            console.error('API request error:', error);
            return { ok: false, error: 'Network error' };
        }
    }
    
    // === User Methods ===
    
    async getProfile() {
        return this.request('/users/profile');
    }
    
    async updateProfile(updates) {
        return this.request('/users/profile', {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
    }
    
    // === AI Interaction Methods ===
    
    async aiInteract(type, input) {
        return this.request('/ai/interact', {
            method: 'POST',
            body: JSON.stringify({ type, input })
        });
    }
    
    async getAIHistory(limit = 10, offset = 0) {
        return this.request(`/ai/history?limit=${limit}&offset=${offset}`);
    }
    
    // === WebSocket Methods ===
    
    initializeSocket() {
        if (!this.token) return;
        
        // Load Socket.io client library
        const script = document.createElement('script');
        script.src = '/socket.io/socket.io.js';
        script.onload = () => {
            this.socket = io(this.wsURL, {
                auth: {
                    token: this.token
                }
            });
            
            this.socket.on('connect', () => {
                console.log('Connected to BurntAI realtime system');
                this.onSocketConnect();
            });
            
            this.socket.on('ai:response', (data) => {
                this.onAIResponse(data);
            });
            
            this.socket.on('system:message', (data) => {
                this.onSystemMessage(data);
            });
            
            this.socket.on('disconnect', () => {
                console.log('Disconnected from BurntAI realtime system');
            });
        };
        document.head.appendChild(script);
    }
    
    // Override these methods in your implementation
    onSocketConnect() {}
    onAIResponse(data) {}
    onSystemMessage(data) {}
    
    // === Health Check ===
    
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            return await response.json();
        } catch (error) {
            return { status: 'ERROR', error: error.message };
        }
    }
}

// Create global instance
window.burntaiAPI = new BurntAIAPI();

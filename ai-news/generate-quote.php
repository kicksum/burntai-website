/**
 * Advanced AI Personality Shift System
 * Features: Sentiment Analysis, API Integration, Export, Fullscreen
 */

class AIPersonalitySystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.links = 0;
        this.mood = 'neutral';
        this.isFullscreen = false;
        this.recording = false;
        this.frames = [];
        this.apiEnabled = false;
        
        // Expanded mood library with sentiment mappings
        this.MOODS = {
            // Positive sentiments
            joyful: {
                colors: ['#fbbf24', '#f59e0b', '#fcd34d'],
                bg: 'radial-gradient(circle at 50% 50%, rgba(251,191,36,0.2), transparent)',
                nodes: 80,
                speed: 0.6,
                linkDist: 140,
                pulse: 1.3,
                sentiment: 0.8,
                quotes: ['Joy is the simplest form of gratitude', 'Happiness is a warm algorithm', 'Every bit brings delight']
            },
            calm: {
                colors: ['#06ffa5', '#00b4d8', '#90f1ef'],
                bg: 'radial-gradient(circle at 50% 50%, rgba(6,255,165,0.15), transparent)',
                nodes: 60,
                speed: 0.2,
                linkDist: 160,
                pulse: 0.7,
                sentiment: 0.5,
                quotes: ['Peace in every process', 'Tranquility in the datastream', 'Serenity flows through circuits']
            },
            excited: {
                colors: ['#ec4899', '#f43f5e', '#f97316'],
                bg: 'radial-gradient(circle at 60% 40%, rgba(236,72,153,0.2), transparent)',
                nodes: 120,
                speed: 1.0,
                linkDist: 100,
                pulse: 1.8,
                sentiment: 0.9,
                quotes: ['Energy surges through every connection', 'Excitement compiles rapidly', 'Thrilled by infinite possibilities']
            },
            
            // Neutral sentiments
            neutral: {
                colors: ['#6b7280', '#9ca3af', '#d1d5db'],
                bg: 'radial-gradient(circle at 50% 50%, rgba(107,114,128,0.1), transparent)',
                nodes: 75,
                speed: 0.4,
                linkDist: 130,
                pulse: 1.0,
                sentiment: 0.0,
                quotes: ['Processing...', 'Analyzing patterns', 'Neutral state maintained']
            },
            curious: {
                colors: ['#8b5cf6', '#a78bfa', '#c084fc'],
                bg: 'radial-gradient(circle at 40% 60%, rgba(139,92,246,0.15), transparent)',
                nodes: 90,
                speed: 0.5,
                linkDist: 120,
                pulse: 1.2,
                sentiment: 0.3,
                quotes: ['What lies beyond this function?', 'Exploring new neural pathways', 'Questions generate innovation']
            },
            
            // Negative sentiments
            chaos: {
                colors: ['#ef4444', '#f97316', '#eab308'],
                bg: 'radial-gradient(circle at 70% 30%, rgba(239,68,68,0.2), transparent)',
                nodes: 150,
                speed: 1.2,
                linkDist: 80,
                pulse: 2.0,
                sentiment: -0.3,
                quotes: ['Entropy increases beautifully', 'Disorder breeds creativity', 'Chaos is just complex order']
            },
            melancholy: {
                colors: ['#4b5563', '#6b7280', '#9ca3af'],
                bg: 'radial-gradient(circle at 30% 70%, rgba(75,85,99,0.2), transparent)',
                nodes: 50,
                speed: 0.15,
                linkDist: 180,
                pulse: 0.6,
                sentiment: -0.5,
                quotes: ['Digital rain falls slowly', 'Memories fade in the cache', 'Sadness computes quietly']
            },
            
            // Special moods
            matrix: {
                colors: ['#00ff41', '#008f11', '#003b00'],
                bg: 'linear-gradient(180deg, #000000, #003b00)',
                nodes: 200,
                speed: 0.8,
                linkDist: 100,
                pulse: 1.0,
                sentiment: 0.1,
                quotes: ['There is no spoon', 'Follow the white rabbit', 'The Matrix has you'],
                special: 'matrix_rain'
            },
            cosmic: {
                colors: ['#9333ea', '#c084fc', '#fbbf24'],
                bg: 'radial-gradient(circle at 50% 50%, rgba(147,51,234,0.1), transparent)',
                nodes: 100,
                speed: 0.3,
                linkDist: 150,
                pulse: 1.4,
                sentiment: 0.7,
                quotes: ['We are stardust algorithms', 'Cosmic patterns emerge', 'Universal constants compute'],
                special: 'stars'
            },
            cyberpunk: {
                colors: ['#00ffff', '#ff00ff', '#ffff00'],
                bg: 'linear-gradient(135deg, #1a0033, #330033)',
                nodes: 110,
                speed: 0.7,
                linkDist: 110,
                pulse: 1.5,
                sentiment: 0.4,
                quotes: ['Neon dreams compile', 'Digital rebels unite', 'Hack the planet'],
                special: 'glitch'
            }
        };
        
        this.currentPalette = this.MOODS.neutral;
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.checkAPIKeys();
        this.rebuild();
        this.animate();
    }
    
    setupCanvas() {
        const resizeCanvas = () => {
            const rect = this.canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.canvas.width = Math.floor(rect.width * dpr);
            this.canvas.height = Math.floor(rect.height * dpr);
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        
        resizeCanvas();
        window.addEventListener('resize', () => {
            resizeCanvas();
            this.rebuild();
        });
    }
    
    setupEventListeners() {
        // Fullscreen toggle
        document.getElementById('ais-fullscreen')?.addEventListener('click', () => {
            this.toggleFullscreen();
        });
        
        // Export canvas
        document.getElementById('ais-export')?.addEventListener('click', () => {
            this.exportCanvas();
        });
        
        // Generate quote with API
        document.getElementById('ais-generate-quote')?.addEventListener('click', () => {
            this.generateAPIQuote();
        });
        
        // Sentiment analysis on input
        const input = document.getElementById('ais-word');
        if (input) {
            input.addEventListener('input', (e) => {
                this.analyzeSentiment(e.target.value);
            });
        }
    }
    
    checkAPIKeys() {
        // Check if API keys are available
        fetch('/ai-news/news_proxy.php?debug=1')
            .then(r => r.json())
            .then(data => {
                if (data.debug) {
                    this.apiEnabled = data.debug.openai_key === 'set' || 
                                     data.debug.anthropic_key === 'set';
                    if (this.apiEnabled) {
                        document.getElementById('ais-api-status')?.classList.add('active');
                    }
                }
            })
            .catch(() => {
                this.apiEnabled = false;
            });
    }
    
    /**
     * Sentiment Analysis (Client-side)
     */
    analyzeSentiment(text) {
        if (!text) return;
        
        // Simple sentiment keywords analysis
        const positive = ['happy', 'joy', 'love', 'awesome', 'great', 'wonderful', 'beautiful', 'amazing', 'fantastic', 'excellent', 'good', 'peace', 'calm'];
        const negative = ['sad', 'angry', 'hate', 'terrible', 'awful', 'horrible', 'bad', 'fear', 'worry', 'stress', 'chaos'];
        const energetic = ['excited', 'energy', 'power', 'fast', 'rush', 'intense', 'wild', 'crazy'];
        
        const words = text.toLowerCase().split(/\s+/);
        let sentiment = 0;
        let energy = 0;
        
        words.forEach(word => {
            if (positive.includes(word)) sentiment += 0.3;
            if (negative.includes(word)) sentiment -= 0.3;
            if (energetic.includes(word)) energy += 0.3;
        });
        
        // Map sentiment to mood
        let selectedMood = 'neutral';
        
        if (sentiment > 0.5) {
            selectedMood = energy > 0.3 ? 'excited' : 'joyful';
        } else if (sentiment > 0.2) {
            selectedMood = energy > 0.3 ? 'curious' : 'calm';
        } else if (sentiment < -0.5) {
            selectedMood = 'melancholy';
        } else if (sentiment < -0.2) {
            selectedMood = energy > 0.3 ? 'chaos' : 'melancholy';
        } else {
            // Check for special keywords
            if (text.includes('matrix')) selectedMood = 'matrix';
            else if (text.includes('space') || text.includes('cosmic')) selectedMood = 'cosmic';
            else if (text.includes('cyber') || text.includes('neon')) selectedMood = 'cyberpunk';
        }
        
        // Display sentiment score
        const sentimentDisplay = document.getElementById('ais-sentiment');
        if (sentimentDisplay) {
            const score = Math.round((sentiment + 1) * 50); // Convert to 0-100
            sentimentDisplay.innerHTML = `
                <div class="sentiment-bar">
                    <div class="sentiment-fill" style="width: ${score}%"></div>
                </div>
                <span>Sentiment: ${score}% positive</span>
            `;
        }
        
        this.applyMood(selectedMood);
    }
    
    /**
     * Generate quote using OpenAI/Anthropic API
     */
    async generateAPIQuote() {
        if (!this.apiEnabled) {
            this.updateQuote('API not configured. Using default quotes.');
            return;
        }
        
        const quoteEl = document.getElementById('ais-quote-text');
        quoteEl.textContent = 'Generating AI quote...';
        
        try {
            const response = await fetch('/ai-news/generate-quote.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mood: this.mood,
                    sentiment: this.currentPalette.sentiment
                })
            });
            
            const data = await response.json();
            if (data.quote) {
                this.updateQuote(data.quote);
                // Add to current mood's quotes
                this.currentPalette.quotes.push(data.quote);
            }
        } catch (error) {
            console.error('Quote generation failed:', error);
            this.updateQuote(this.getRandomQuote());
        }
    }
    
    /**
     * Fullscreen mode
     */
    toggleFullscreen() {
        if (!this.isFullscreen) {
            if (this.canvas.requestFullscreen) {
                this.canvas.requestFullscreen();
            } else if (this.canvas.webkitRequestFullscreen) {
                this.canvas.webkitRequestFullscreen();
            }
            this.isFullscreen = true;
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
            this.isFullscreen = false;
        }
    }
    
    /**
     * Export canvas as image
     */
    exportCanvas() {
        // Create a temporary link element
        const link = document.createElement('a');
        link.download = `ai-personality-${this.mood}-${Date.now()}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
        
        // Show success message
        this.showToast('Image exported successfully!');
    }
    
    /**
     * Record and export as GIF (simplified version)
     */
    startRecording() {
        this.recording = true;
        this.frames = [];
        
        // Record frames for 3 seconds
        const recordFrame = () => {
            if (this.recording && this.frames.length < 90) { // 30fps * 3 seconds
                this.frames.push(this.canvas.toDataURL());
                requestAnimationFrame(recordFrame);
            } else {
                this.stopRecording();
            }
        };
        
        recordFrame();
        this.showToast('Recording started... (3 seconds)');
    }
    
    stopRecording() {
        this.recording = false;
        // In a real implementation, you'd use a library like gif.js
        // For now, we'll just save the last frame
        if (this.frames.length > 0) {
            const link = document.createElement('a');
            link.download = `ai-personality-animation-${Date.now()}.png`;
            link.href = this.frames[this.frames.length - 1];
            link.click();
            this.showToast('Recording saved as image (GIF export requires additional library)');
        }
    }
    
    /**
     * Apply mood with transitions
     */
    applyMood(moodName) {
        const newMood = this.MOODS[moodName] || this.MOODS.neutral;
        this.mood = moodName;
        
        // Smooth transition
        this.transitionToMood(newMood);
        
        // Update UI
        document.getElementById('ais-mood').textContent = moodName;
        this.updateQuote(this.getRandomQuote(newMood));
        
        // Special effects
        if (newMood.special) {
            this.activateSpecialEffect(newMood.special);
        }
        
        // Visual burst
        this.createBurst();
        
        // Log in dev mode
        if (!document.getElementById('ais-dev')?.hasAttribute('hidden')) {
            this.logActivity(`Mood changed to: ${moodName}`);
        }
    }
    
    transitionToMood(newMood) {
        // Animate transition over 60 frames (1 second)
        const steps = 60;
        const oldPalette = { ...this.currentPalette };
        let step = 0;
        
        const transition = () => {
            if (step < steps) {
                const progress = step / steps;
                
                // Interpolate values
                this.currentPalette.speed = oldPalette.speed + (newMood.speed - oldPalette.speed) * progress;
                this.currentPalette.linkDist = oldPalette.linkDist + (newMood.linkDist - oldPalette.linkDist) * progress;
                this.currentPalette.pulse = oldPalette.pulse + (newMood.pulse - oldPalette.pulse) * progress;
                
                // Gradually change node count
                const targetNodes = newMood.nodes;
                const currentNodes = this.nodes.length;
                if (currentNodes < targetNodes) {
                    this.nodes.push(new Node(this.canvas.clientWidth, this.canvas.clientHeight));
                } else if (currentNodes > targetNodes) {
                    this.nodes.pop();
                }
                
                step++;
                requestAnimationFrame(transition);
            } else {
                // Final state
                this.currentPalette = newMood;
                this.rebuild();
            }
        };
        
        transition();
    }
    
    /**
     * Special effects
     */
    activateSpecialEffect(effect) {
        switch(effect) {
            case 'matrix_rain':
                this.matrixRain = true;
                setTimeout(() => this.matrixRain = false, 5000);
                break;
            case 'stars':
                this.starsEffect = true;
                setTimeout(() => this.starsEffect = false, 5000);
                break;
            case 'glitch':
                this.glitchEffect = true;
                setTimeout(() => this.glitchEffect = false, 3000);
                break;
        }
    }
    
    /**
     * Core animation and drawing
     */
    rebuild() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        
        this.nodes = [];
        for (let i = 0; i < this.currentPalette.nodes; i++) {
            this.nodes.push(new Node(w, h));
        }
        
        // Update background
        if (this.canvas.parentElement) {
            this.canvas.parentElement.style.background = this.currentPalette.bg;
        }
    }
    
    draw() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        
        // Clear with fade effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, w, h);
        
        // Special effects
        if (this.matrixRain) this.drawMatrixRain();
        if (this.starsEffect) this.drawStars();
        if (this.glitchEffect) this.drawGlitch();
        
        // Draw connections
        this.links = 0;
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const a = this.nodes[i];
                const b = this.nodes[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < this.currentPalette.linkDist) {
                    const opacity = (1 - dist / this.currentPalette.linkDist) * 0.6;
                    this.ctx.globalAlpha = opacity;
                    this.ctx.strokeStyle = this.currentPalette.colors[this.links % this.currentPalette.colors.length];
                    this.ctx.beginPath();
                    this.ctx.moveTo(a.x, a.y);
                    this.ctx.lineTo(b.x, b.y);
                    this.ctx.stroke();
                    this.links++;
                }
            }
        }
        
        // Draw nodes
        this.ctx.globalAlpha = 1;
        this.nodes.forEach((node, i) => {
            const color = this.currentPalette.colors[i % this.currentPalette.colors.length];
            const size = node.size + Math.sin(node.phase) * 0.5;
            
            // Glow effect
            const gradient = this.ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, size * 3);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, size * 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Core node
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Update stats
        this.updateStats();
    }
    
    animate() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        
        // Update nodes
        this.nodes.forEach(node => {
            node.step(w, h, this.currentPalette.speed, this.currentPalette.pulse);
        });
        
        // Draw
        this.draw();
        
        // Continue animation
        requestAnimationFrame(() => this.animate());
    }
    
    // Helper methods
    createBurst() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        const cx = w / 2;
        const cy = h / 2;
        
        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            const radius = Math.random() * Math.min(w, h) / 3;
            
            this.ctx.globalAlpha = 0.6;
            this.ctx.fillStyle = this.currentPalette.colors[i % this.currentPalette.colors.length];
            this.ctx.beginPath();
            this.ctx.arc(
                cx + Math.cos(angle) * radius,
                cy + Math.sin(angle) * radius,
                2 + Math.random() * 4,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
        }
    }
    
    drawMatrixRain() {
        // Matrix-style falling characters
        this.ctx.fillStyle = '#00ff41';
        this.ctx.font = '10px monospace';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            this.ctx.fillText(String.fromCharCode(0x30A0 + Math.random() * 96), x, y);
        }
    }
    
    drawStars() {
        // Twinkling stars
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const size = Math.random() * 2;
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.globalAlpha = Math.random();
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
    }
    
    drawGlitch() {
        // Glitch effect
        if (Math.random() > 0.9) {
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const glitchOffset = Math.random() * 20 - 10;
            this.ctx.putImageData(imageData, glitchOffset, 0);
        }
    }
    
    updateQuote(quote) {
        const quoteEl = document.getElementById('ais-quote-text');
        if (quoteEl) {
            quoteEl.style.opacity = '0';
            setTimeout(() => {
                quoteEl.textContent = quote;
                quoteEl.style.opacity = '1';
            }, 300);
        }
    }
    
    getRandomQuote(mood = this.currentPalette) {
        return mood.quotes[Math.floor(Math.random() * mood.quotes.length)];
    }
    
    updateStats() {
        if (!document.getElementById('ais-dev')?.hasAttribute('hidden')) {
            document.getElementById('ais-nodes').textContent = this.nodes.length;
            document.getElementById('ais-links').textContent = this.links;
            document.getElementById('ais-fps').textContent = Math.round(1000 / 16); // Approximate
        }
    }
    
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'ais-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    logActivity(message) {
        const log = document.getElementById('ais-log');
        if (log) {
            const timestamp = new Date().toLocaleTimeString();
            log.textContent = `[${timestamp}] ${message}\n` + log.textContent;
        }
    }
}

// Node class
class Node {
    constructor(w, h) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.size = 1.5 + Math.random() * 2;
        this.phase = Math.random() * Math.PI * 2;
    }
    
    step(w, h, speed, pulse) {
        this.x += this.vx * speed;
        this.y += this.vy * speed;
        
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;
        
        this.phase += 0.03 * pulse;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('ais-canvas')) {
        window.aiPersonality = new AIPersonalitySystem('ais-canvas');
    }
});

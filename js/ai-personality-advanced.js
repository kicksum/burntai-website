// AI Personality Advanced - Neural Network Visualization with Sentiment Analysis
// File: /js/ai-personality-advanced.js

(function() {
    'use strict';
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAIPersonality);
    } else {
        initAIPersonality();
    }
    
    function initAIPersonality() {
        // Get all elements
        const canvas = document.getElementById('ais-canvas');
        if (!canvas) return; // Exit if canvas not found
        
        const ctx = canvas.getContext('2d');
        const quoteEl = document.getElementById('ais-quote-text');
        const moodLabel = document.getElementById('ais-mood');
        const dev = document.getElementById('ais-dev');
        const devClose = document.getElementById('ais-dev-close');
        const fpsEl = document.getElementById('ais-fps');
        const nodesEl = document.getElementById('ais-nodes');
        const linksEl = document.getElementById('ais-links');
        const logEl = document.getElementById('ais-log');
        
        // CRITICAL FIX: Ensure dev panel is hidden on initialization
        if (dev) {
            dev.setAttribute('hidden', '');
            dev.style.display = 'none';
        }
        
        // Mood configurations
        const MOODS = {
            future: {
                colors: ['#6ea8fe', '#3f37c9', '#80edff'],
                bg: 'radial-gradient(1200px 600px at 30% 20%, rgba(110,168,254,.18), transparent)',
                nodes: 90,
                speed: .35,
                linkDist: 120,
                pulse: 1.0,
                quotes: [
                    'Build the future by prototyping it today.',
                    'Most "science fiction" is just a backlog.',
                    'Latency drops, possibilities rise.'
                ]
            },
            chaos: {
                colors: ['#ff6b6b', '#ffd166', '#8338ec'],
                bg: 'radial-gradient(1200px 700px at 70% 30%, rgba(255,107,107,.18), transparent)',
                nodes: 120,
                speed: .9,
                linkDist: 90,
                pulse: 1.6,
                quotes: [
                    'Out of chaos comes novel capability.',
                    'Exploration looks noisy until hindsight smooths it.',
                    'Embrace the weird—bugs discover features.'
                ]
            },
            art: {
                colors: ['#ff9e00', '#ff5400', '#8338ec'],
                bg: 'radial-gradient(900px 600px at 60% 70%, rgba(255,158,0,.14), transparent)',
                nodes: 75,
                speed: .28,
                linkDist: 140,
                pulse: 1.1,
                quotes: [
                    'Art is a compression algorithm for feeling.',
                    'Tools evolve; taste ships the product.',
                    'Make it beautiful, then make it scale.'
                ]
            },
            code: {
                colors: ['#64dfdf', '#48bfe3', '#5390d9'],
                bg: 'radial-gradient(1000px 620px at 40% 60%, rgba(72,191,227,.16), transparent)',
                nodes: 85,
                speed: .42,
                linkDist: 130,
                pulse: 1.0,
                quotes: [
                    'Every line of code is a hypothesis.',
                    'APIs are negotiations between futures.',
                    'Readable now beats clever later.'
                ]
            },
            calm: {
                colors: ['#06ffa5', '#00b4d8', '#90f1ef'],
                bg: 'radial-gradient(1100px 680px at 50% 50%, rgba(6,255,165,.12), transparent)',
                nodes: 70,
                speed: .18,
                linkDist: 150,
                pulse: .8,
                quotes: [
                    'Systems that breathe last longer.',
                    'Calm UIs reduce cognitive debt.',
                    'Stability is a feature.'
                ]
            },
            retro: {
                colors: ['#00ff88', '#39ff14', '#08f7fe'],
                bg: 'radial-gradient(900px 600px at 30% 70%, rgba(0,255,136,.18), transparent)',
                nodes: 60,
                speed: .22,
                linkDist: 140,
                pulse: 1.3,
                quotes: [
                    'Hello, world—again and again.',
                    '8-bit dreams, 64-bit budgets.',
                    'Monospace, major impact.'
                ]
            },
            joyful: {
                colors: ['#ffd23f', '#ee6c4d', '#f38375'],
                bg: 'radial-gradient(1000px 600px at 50% 30%, rgba(255,210,63,.15), transparent)',
                nodes: 95,
                speed: .45,
                linkDist: 125,
                pulse: 1.3,
                quotes: [
                    'Joy is the best debugger.',
                    'Happiness compiles faster.',
                    'Smile-driven development.'
                ]
            },
            excited: {
                colors: ['#ff006e', '#fb5607', '#ffbe0b'],
                bg: 'radial-gradient(1100px 650px at 60% 40%, rgba(255,0,110,.16), transparent)',
                nodes: 110,
                speed: .75,
                linkDist: 100,
                pulse: 1.5,
                quotes: [
                    'Excitement is the best accelerator.',
                    'Energy overflow, stack overflow.',
                    'Hype-driven development works sometimes.'
                ]
            },
            curious: {
                colors: ['#7209b7', '#560bad', '#480ca8'],
                bg: 'radial-gradient(950px 600px at 40% 50%, rgba(114,9,183,.14), transparent)',
                nodes: 80,
                speed: .38,
                linkDist: 135,
                pulse: 1.1,
                quotes: [
                    'Curiosity killed the bug.',
                    'Wonder is the root of innovation.',
                    'Question everything, especially this quote.'
                ]
            },
            melancholy: {
                colors: ['#4a5568', '#2d3748', '#1a202c'],
                bg: 'radial-gradient(1000px 600px at 50% 60%, rgba(74,85,104,.12), transparent)',
                nodes: 65,
                speed: .15,
                linkDist: 160,
                pulse: .7,
                quotes: [
                    'Even machines dream of electric sheep.',
                    'Sadness is just another data point.',
                    'Blue screens, blue moods.'
                ]
            },
            matrix: {
                colors: ['#00ff41', '#008f11', '#00ff41'],
                bg: 'radial-gradient(1200px 700px at 50% 50%, rgba(0,255,65,.08), transparent)',
                nodes: 100,
                speed: .6,
                linkDist: 110,
                pulse: 1.4,
                quotes: [
                    'There is no spoon, only pointers.',
                    'Follow the white rabbit... to documentation.',
                    'Wake up, Neo... you have a pull request.'
                ]
            },
            cosmic: {
                colors: ['#b794f6', '#9f7aea', '#805ad5'],
                bg: 'radial-gradient(1300px 700px at 55% 45%, rgba(183,148,246,.15), transparent)',
                nodes: 85,
                speed: .25,
                linkDist: 145,
                pulse: 1.2,
                quotes: [
                    'We are all just stardust... and code.',
                    'The universe is the ultimate distributed system.',
                    'Cosmic rays cause more bugs than you think.'
                ]
            },
            cyberpunk: {
                colors: ['#f72585', '#7209b7', '#4cc9f0'],
                bg: 'radial-gradient(1100px 650px at 65% 35%, rgba(247,37,133,.14), transparent)',
                nodes: 105,
                speed: .55,
                linkDist: 105,
                pulse: 1.45,
                quotes: [
                    'High tech, low life, clean code.',
                    'The future is already here, just poorly distributed.',
                    'Neon lights and null pointers.'
                ]
            },
            desert: {
                colors: ['#ff6b35', '#f59e0b', '#ffd29d'],
                bg: 'radial-gradient(1200px 600px at 70% 60%, rgba(245,158,11,.16), transparent)',
                nodes: 80,
                speed: .30,
                linkDist: 135,
                pulse: 1.2,
                quotes: [
                    'Signal travels farthest across quiet sand.',
                    'Sparks matter where everything burns.',
                    'The Wasteland rewards the curious.'
                ]
            }
        };
        
        // Utility functions
        const fit = () => {
            const r = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.floor(r.width * dpr);
            canvas.height = Math.floor(r.height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        
        const rand = (min, max) => Math.random() * (max - min) + min;
        
        // Node class for particles
        class Node {
            constructor(w, h) {
                this.x = rand(0, w);
                this.y = rand(0, h);
                this.vx = rand(-1, 1);
                this.vy = rand(-1, 1);
                this.size = rand(1.6, 3.6);
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
        
        // State variables
        let nodes = [];
        let links = 0;
        let mood = 'future';
        let palette = MOODS[mood];
        let frames = 0;
        let lastFPSUpdate = 0;
        let animationId = null;
        let isRecording = false;
        
        // Rebuild nodes
        const rebuild = () => {
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            nodes = Array.from({ length: palette.nodes }, () => new Node(w, h));
            if (canvas.parentElement) {
                canvas.parentElement.style.setProperty('background', 
                    `linear-gradient(135deg, rgba(0,0,0,0), rgba(0,0,0,0)), ${palette.bg}`);
            }
        };
        
        // Draw function
        const draw = () => {
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            ctx.clearRect(0, 0, w, h);
            links = 0;
            
            // Draw connections
            for (let i = 0; i < nodes.length; i++) {
                const a = nodes[i];
                for (let j = i + 1; j < nodes.length; j++) {
                    const b = nodes[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const d2 = dx * dx + dy * dy;
                    const max = palette.linkDist;
                    const max2 = max * max;
                    
                    if (d2 < max2) {
                        const t = 1 - (d2 / max2);
                        ctx.globalAlpha = Math.max(.12, t * .6);
                        const c = palette.colors[(i + j) % palette.colors.length];
                        ctx.strokeStyle = c;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                        links++;
                    }
                }
            }
            
            // Draw nodes
            ctx.globalAlpha = 1;
            for (const n of nodes) {
                const c = palette.colors[Math.floor((n.phase * 10) % palette.colors.length)];
                ctx.fillStyle = c;
                const s = n.size + Math.sin(n.phase) * .6;
                ctx.beginPath();
                ctx.arc(n.x, n.y, s, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        // Animation loop
        const step = (ts) => {
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            
            for (const n of nodes) {
                n.step(w, h, palette.speed, palette.pulse);
            }
            
            draw();
            frames++;
            
            if (!lastFPSUpdate) lastFPSUpdate = ts;
            if (ts - lastFPSUpdate > 500) {
                const fps = Math.round(frames * 1000 / (ts - lastFPSUpdate));
                frames = 0;
                lastFPSUpdate = ts;
                
                if (dev && !dev.hasAttribute('hidden') && fpsEl) {
                    fpsEl.textContent = fps;
                }
            }
            
            animationId = requestAnimationFrame(step);
        };
        
        // Burst effect
        const burst = () => {
            const w = canvas.clientWidth;
            const h = canvas.clientHeight;
            const cx = w / 2;
            const cy = h / 2;
            const parts = 24;
            const maxR = Math.min(w, h) / 3;
            
            ctx.save();
            for (let i = 0; i < parts; i++) {
                const ang = (i / parts) * Math.PI * 2;
                const r = maxR * (0.2 + Math.random() * 0.8);
                ctx.globalAlpha = .66;
                ctx.fillStyle = palette.colors[i % palette.colors.length];
                ctx.beginPath();
                ctx.arc(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 
                       2 + Math.random() * 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        };
        
        // Apply mood
        const applyMood = (name) => {
            name = (name || '').toLowerCase().trim();
            const keys = Object.keys(MOODS);
            const found = keys.find(k => name.includes(k)) || 
                         keys[Math.floor(Math.random() * keys.length)];
            mood = found;
            palette = MOODS[mood];
            
            if (moodLabel) moodLabel.textContent = mood;
            if (quoteEl) {
                quoteEl.textContent = palette.quotes[Math.floor(Math.random() * palette.quotes.length)];
            }
            
            burst();
            rebuild();
            
            if (dev && !dev.hasAttribute('hidden') && logEl) {
                const time = new Date().toLocaleTimeString();
                logEl.textContent = `[${time}] mood → ${mood}\n` + logEl.textContent;
            }
            
            // Update sentiment display
            updateSentiment(name);
        };
        
        // Update sentiment display
        const updateSentiment = (text) => {
            const sentimentDisplay = document.getElementById('ais-sentiment');
            if (!sentimentDisplay) return;
            
            const fill = sentimentDisplay.querySelector('.sentiment-fill');
            const label = sentimentDisplay.querySelector('span');
            
            if (fill && label) {
                // Simple sentiment analysis based on mood
                let sentiment = 50;
                let sentimentText = 'Neutral';
                
                if (['joyful', 'excited', 'future'].includes(mood)) {
                    sentiment = 75 + Math.random() * 25;
                    sentimentText = 'Positive';
                } else if (['chaos', 'cyberpunk', 'matrix'].includes(mood)) {
                    sentiment = 40 + Math.random() * 30;
                    sentimentText = 'Dynamic';
                } else if (['melancholy', 'desert'].includes(mood)) {
                    sentiment = 20 + Math.random() * 30;
                    sentimentText = 'Contemplative';
                } else if (['calm', 'cosmic', 'art'].includes(mood)) {
                    sentiment = 50 + Math.random() * 25;
                    sentimentText = 'Balanced';
                }
                
                fill.style.width = sentiment + '%';
                label.textContent = `Sentiment: ${sentimentText}`;
            }
        };
        
        // Generate AI quote (mock for now)
        const generateAIQuote = () => {
            const btn = document.getElementById('ais-generate-quote');
            const indicator = document.querySelector('#ais-api-indicator .status');
            
            if (btn) btn.disabled = true;
            if (indicator) indicator.textContent = 'Generating...';
            
            // Simulate API call
            setTimeout(() => {
                if (quoteEl && palette.quotes) {
                    const newQuote = palette.quotes[Math.floor(Math.random() * palette.quotes.length)];
                    quoteEl.textContent = newQuote;
                    
                    // Add animation
                    quoteEl.parentElement.style.animation = 'none';
                    setTimeout(() => {
                        quoteEl.parentElement.style.animation = 'aisFade 0.6s ease';
                    }, 10);
                }
                
                if (btn) btn.disabled = false;
                if (indicator) indicator.textContent = 'Ready';
                
                // Update API indicator
                const apiStatus = document.getElementById('ais-api-status');
                if (apiStatus) {
                    apiStatus.classList.add('active');
                    setTimeout(() => apiStatus.classList.remove('active'), 2000);
                }
            }, 1500);
        };
        
        // Export canvas as image
        const exportImage = () => {
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ai-personality-${mood}-${Date.now()}.png`;
                a.click();
                URL.revokeObjectURL(url);
                
                showToast('Image exported!');
            });
        };
        
        // Toggle fullscreen
        const toggleFullscreen = () => {
            if (!document.fullscreenElement) {
                canvas.requestFullscreen().catch(err => {
                    showToast('Fullscreen not available');
                });
            } else {
                document.exitFullscreen();
            }
        };
        
        // Show toast notification
        const showToast = (message) => {
            const existing = document.querySelector('.ais-toast');
            if (existing) existing.remove();
            
            const toast = document.createElement('div');
            toast.className = 'ais-toast';
            toast.textContent = message;
            document.body.appendChild(toast);
            
            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 2000);
        };
        
        // Set up event listeners
        const setupEventListeners = () => {
            // Form submission
            const form = document.getElementById('ais-form');
            const input = document.getElementById('ais-word');
            if (form && input) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    applyMood(input.value);
                    input.select();
                });
            }
            
            // Mood chips
            document.querySelectorAll('.ais-chip').forEach(btn => {
                btn.addEventListener('click', () => applyMood(btn.dataset.mood));
            });
            
            // AI generate button
            const generateBtn = document.getElementById('ais-generate-quote');
            if (generateBtn) {
                generateBtn.addEventListener('click', generateAIQuote);
            }
            
            // Control buttons
            const fullscreenBtn = document.getElementById('ais-fullscreen');
            if (fullscreenBtn) {
                fullscreenBtn.addEventListener('click', toggleFullscreen);
            }
            
            const exportBtn = document.getElementById('ais-export');
            if (exportBtn) {
                exportBtn.addEventListener('click', exportImage);
            }
            
            const recordBtn = document.getElementById('ais-record');
            if (recordBtn) {
                recordBtn.addEventListener('click', () => {
                    isRecording = !isRecording;
                    recordBtn.style.color = isRecording ? '#ef4444' : '';
                    showToast(isRecording ? 'Recording started' : 'Recording stopped');
                });
            }
            
            // Konami code
            const secret = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown',
                           'ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
            let pos = 0;
            
            window.addEventListener('keydown', (e) => {
                // Check Konami code
                if (e.key === secret[pos] || e.key.toLowerCase() === secret[pos]) {
                    pos++;
                    if (pos === secret.length) {
                        if (dev) {
                            if (dev.hasAttribute('hidden')) {
                                dev.removeAttribute('hidden');
                                dev.style.display = '';
                                showToast('Dev Mode Activated!');
                            } else {
                                dev.setAttribute('hidden', '');
                                dev.style.display = 'none';
                            }
                        }
                        pos = 0;
                        rebuild();
                    }
                } else {
                    pos = 0;
                }
                
                // Keyboard shortcuts
                if (e.key.toLowerCase() === 'f' && !e.target.matches('input')) {
                    toggleFullscreen();
                } else if (e.key.toLowerCase() === 'e' && !e.target.matches('input')) {
                    exportImage();
                }
            });
            
            // Dev panel close
            if (devClose) {
                devClose.addEventListener('click', () => {
                    if (dev) {
                        dev.setAttribute('hidden', '');
                        dev.style.display = 'none';
                    }
                });
            }
            
            // Window resize
            window.addEventListener('resize', () => {
                fit();
                rebuild();
            });
        };
        
        // Initialize everything
        fit();
        rebuild();
        setupEventListeners();
        animationId = requestAnimationFrame(step);
        
        // Auto-rotate moods
        setInterval(() => {
            const keys = Object.keys(MOODS);
            applyMood(keys[Math.floor(Math.random() * keys.length)]);
        }, 35000);
        
        // Set initial mood
        applyMood('future');
        
        // Update stats
        setInterval(() => {
            if (dev && !dev.hasAttribute('hidden')) {
                if (nodesEl) nodesEl.textContent = nodes.length;
                if (linksEl) linksEl.textContent = links;
            }
        }, 500);
        
        // Set initial API status
        const apiIndicator = document.querySelector('#ais-api-indicator .status');
        if (apiIndicator) {
            apiIndicator.textContent = 'Ready';
        }
    }
})();

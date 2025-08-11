// Advanced Visual Effects & Atmosphere System
// Creates immersive AI-themed visual experiences that respond to gameplay

class AdvancedVisualSystem {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.effectLayers = new Map();
        this.atmosphereEngine = new AtmosphereEngine(canvas, ctx);
        this.particleSystem = new AdvancedParticleSystem(canvas, ctx);
        this.shaderEffects = new ShaderEffects(canvas, ctx);
        this.neuralVisualizer = new NeuralNetworkVisualizer(canvas, ctx);
        this.environmentalEffects = new EnvironmentalEffects(canvas, ctx);
        
        this.time = 0;
        this.globalIntensity = 1.0;
        this.stressLevel = 0.0;
        this.aiActivity = 0.5;
    }
    
    update(gameState) {
        this.time++;
        this.updateGlobalState(gameState);
        
        // Update all effect systems
        this.atmosphereEngine.update(gameState, this.stressLevel, this.aiActivity);
        this.particleSystem.update(gameState);
        this.shaderEffects.update(gameState);
        this.neuralVisualizer.update(gameState);
        this.environmentalEffects.update(gameState);
    }
    
    updateGlobalState(gameState) {
        // Calculate stress level based on game state
        this.stressLevel = this.calculateStressLevel(gameState);
        
        // Calculate AI activity level
        this.aiActivity = this.calculateAIActivity(gameState);
        
        // Adjust global intensity
        this.globalIntensity = this.calculateGlobalIntensity(gameState);
    }
    
    calculateStressLevel(gameState) {
        let stress = 0;
        
        // Health-based stress
        const healthPercent = gameState.player.health / gameState.player.maxHealth;
        stress += (1 - healthPercent) * 0.4;
        
        // Enemy proximity stress
        const nearbyEnemies = gameState.enemies.filter(enemy => {
            if (!enemy.alive) return false;
            const dist = this.distance(enemy.x, enemy.y, gameState.player.x, gameState.player.y);
            return dist < 120;
        }).length;
        stress += Math.min(nearbyEnemies * 0.15, 0.4);
        
        // Ammo stress
        const currentWeapon = gameState.player.weapons[gameState.player.currentWeapon];
        const ammoPercent = currentWeapon.ammo / currentWeapon.maxAmmo;
        stress += (1 - ammoPercent) * 0.2;
        
        return Math.min(stress, 1.0);
    }
    
    calculateAIActivity(gameState) {
        let activity = 0.3; // Base AI presence
        
        // Enemy count factor
        const aliveEnemies = gameState.enemies.filter(e => e.alive).length;
        activity += Math.min(aliveEnemies * 0.1, 0.4);
        
        // Combat intensity
        if (gameState.time - gameState.lastGunshot < 120) {
            activity += 0.3;
        }
        
        // Level factor
        activity += Math.min(gameState.level * 0.05, 0.3);
        
        return Math.min(activity, 1.0);
    }
    
    calculateGlobalIntensity(gameState) {
        const baseIntensity = 0.7;
        const stressFactor = this.stressLevel * 0.3;
        const activityFactor = this.aiActivity * 0.2;
        
        return Math.min(baseIntensity + stressFactor + activityFactor, 1.0);
    }
    
    render() {
        // Render all effect layers in order
        this.atmosphereEngine.render();
        this.environmentalEffects.render();
        this.particleSystem.render();
        this.neuralVisualizer.render();
        this.shaderEffects.render();
    }
    
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
    
    triggerEffect(effectType, params) {
        switch (effectType) {
            case 'muzzle_flash':
                this.shaderEffects.triggerMuzzleFlash(params);
                this.particleSystem.createMuzzleParticles(params);
                break;
                
            case 'enemy_death':
                this.particleSystem.createDeathExplosion(params);
                this.neuralVisualizer.registerAIDestruction(params);
                break;
                
            case 'player_damage':
                this.shaderEffects.triggerDamageEffect(params);
                this.atmosphereEngine.intensifyStress(params);
                break;
                
            case 'weapon_switch':
                this.neuralVisualizer.highlightWeaponChange(params);
                break;
                
            case 'level_transition':
                this.triggerLevelTransition(params);
                break;
        }
    }
    
    triggerLevelTransition(params) {
        this.shaderEffects.triggerTransition();
        this.particleSystem.createTransitionEffect();
        this.neuralVisualizer.resetNetwork();
    }
}

class AtmosphereEngine {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.ambientLighting = 0.7;
        this.fogIntensity = 0.3;
        this.colorTint = { r: 255, g: 133, b: 51 }; // Burnt orange
        this.atmosphereNoise = new PerlinNoise();
        this.lightingEffects = [];
    }
    
    update(gameState, stressLevel, aiActivity) {
        // Adjust atmosphere based on stress and AI activity
        this.ambientLighting = 0.4 + (1 - stressLevel) * 0.4;
        this.fogIntensity = 0.2 + stressLevel * 0.3 + aiActivity * 0.2;
        
        // Dynamic color tinting
        this.updateColorTint(stressLevel, aiActivity);
        
        // Update lighting effects
        this.updateLightingEffects(gameState);
    }
    
    updateColorTint(stressLevel, aiActivity) {
        if (stressLevel > 0.7) {
            // High stress = red tint
            this.colorTint = {
                r: 255,
                g: Math.floor(68 + (1 - stressLevel) * 65),
                b: Math.floor(102 + (1 - stressLevel) * 50)
            };
        } else if (aiActivity > 0.8) {
            // High AI activity = cyan tint
            this.colorTint = {
                r: Math.floor(aiActivity * 100),
                g: Math.floor(229 + (1 - aiActivity) * 26),
                b: 255
            };
        } else {
            // Default burnt orange
            this.colorTint = {
                r: 255,
                g: Math.floor(133 + Math.sin(Date.now() * 0.001) * 20),
                b: Math.floor(51 + Math.sin(Date.now() * 0.0015) * 15)
            };
        }
    }
    
    updateLightingEffects(gameState) {
        // Add dynamic lighting effects
        if (Math.random() < 0.002) { // Occasional flicker
            this.lightingEffects.push({
                type: 'flicker',
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                intensity: 0.5 + Math.random() * 0.5,
                life: 30 + Math.random() * 60,
                maxLife: 30 + Math.random() * 60
            });
        }
        
        // Update and clean up effects
        this.lightingEffects = this.lightingEffects.filter(effect => {
            effect.life--;
            return effect.life > 0;
        });
    }
    
    render() {
        // Apply atmospheric fog
        this.renderFog();
        
        // Apply color tinting
        this.renderColorTint();
        
        // Render lighting effects
        this.renderLightingEffects();
        
        // Apply noise for digital corruption effect
        this.renderDigitalNoise();
    }
    
    renderFog() {
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width
        );
        
        gradient.addColorStop(0, `rgba(10, 10, 10, 0)`);
        gradient.addColorStop(1, `rgba(10, 10, 10, ${this.fogIntensity})`);
        
        this.ctx.save();
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }
    
    renderColorTint() {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'overlay';
        this.ctx.fillStyle = `rgba(${this.colorTint.r}, ${this.colorTint.g}, ${this.colorTint.b}, 0.1)`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }
    
    renderLightingEffects() {
        this.lightingEffects.forEach(effect => {
            const alpha = effect.life / effect.maxLife;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha * effect.intensity;
            
            const gradient = this.ctx.createRadialGradient(
                effect.x, effect.y, 0,
                effect.x, effect.y, 50 + Math.sin(Date.now() * 0.01) * 20
            );
            
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.5, '#ffaa33');
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(effect.x - 75, effect.y - 75, 150, 150);
            this.ctx.restore();
        });
    }
    
    renderDigitalNoise() {
        if (Math.random() < 0.05) { // Occasional digital corruption
            const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                if (Math.random() < 0.001) {
                    data[i] = Math.random() * 255;     // Red
                    data[i + 1] = Math.random() * 255; // Green
                    data[i + 2] = Math.random() * 255; // Blue
                }
            }
            
            this.ctx.putImageData(imageData, 0, 0);
        }
    }
    
    intensifyStress(params) {
        // Add stress-induced lighting effects
        this.lightingEffects.push({
            type: 'stress_pulse',
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            intensity: 0.8,
            life: 60,
            maxLife: 60,
            color: '#ff4466'
        });
    }
}

class AdvancedParticleSystem {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.particles = [];
        this.maxParticles = 500;
        this.particlePool = [];
        
        // Pre-create particle pool
        for (let i = 0; i < this.maxParticles; i++) {
            this.particlePool.push(this.createEmptyParticle());
        }
    }
    
    createEmptyParticle() {
        return {
            x: 0, y: 0, vx: 0, vy: 0,
            life: 0, maxLife: 0,
            size: 0, color: '#ffffff',
            type: 'basic', alpha: 1,
            gravity: 0, friction: 1,
            spin: 0, scale: 1,
            trail: [], active: false
        };
    }
    
    getParticle() {
        const particle = this.particlePool.find(p => !p.active);
        if (particle) {
            particle.active = true;
            return particle;
        }
        return this.createEmptyParticle();
    }
    
    releaseParticle(particle) {
        particle.active = false;
        particle.trail = [];
    }
    
    update(gameState) {
        // Update all particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            this.updateParticle(particle);
            
            if (particle.life <= 0) {
                this.releaseParticle(particle);
                this.particles.splice(i, 1);
            }
        }
        
        // Add ambient particles based on AI activity
        if (Math.random() < gameState.aiActivity * 0.1) {
            this.createAmbientParticle(gameState);
        }
    }
    
    updateParticle(particle) {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Apply physics
        particle.vy += particle.gravity;
        particle.vx *= particle.friction;
        particle.vy *= particle.friction;
        
        // Update properties
        particle.life--;
        particle.alpha = particle.life / particle.maxLife;
        particle.spin += 0.1;
        
        // Update trail for certain particle types
        if (particle.type === 'neural' || particle.type === 'energy') {
            particle.trail.push({ x: particle.x, y: particle.y, alpha: particle.alpha });
            if (particle.trail.length > 10) {
                particle.trail.shift();
            }
        }
        
        // Special behaviors based on type
        this.updateParticleSpecialBehavior(particle);
    }
    
    updateParticleSpecialBehavior(particle) {
        switch (particle.type) {
            case 'neural':
                // Neural particles seek other neural particles
                this.applyNeuralAttraction(particle);
                break;
                
            case 'energy':
                // Energy particles pulse
                particle.size = particle.baseSize * (1 + Math.sin(Date.now() * 0.01 + particle.id) * 0.3);
                break;
                
            case 'corruption':
                // Corruption particles flicker
                particle.alpha *= (0.5 + Math.random() * 0.5);
                break;
                
            case 'data_stream':
                // Data stream particles follow paths
                this.updateDataStreamPath(particle);
                break;
        }
    }
    
    applyNeuralAttraction(particle) {
        const nearbyNeurals = this.particles.filter(p => 
            p.type === 'neural' && 
            p !== particle && 
            this.distance(p.x, p.y, particle.x, particle.y) < 100
        );
        
        nearbyNeurals.forEach(other => {
            const dx = other.x - particle.x;
            const dy = other.y - particle.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 0) {
                const force = 0.02 / dist;
                particle.vx += (dx / dist) * force;
                particle.vy += (dy / dist) * force;
            }
        });
    }
    
    updateDataStreamPath(particle) {
        if (!particle.pathIndex) particle.pathIndex = 0;
        if (!particle.path || particle.path.length === 0) return;
        
        const target = particle.path[particle.pathIndex];
        if (!target) return;
        
        const dx = target.x - particle.x;
        const dy = target.y - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 10) {
            particle.pathIndex = (particle.pathIndex + 1) % particle.path.length;
        } else {
            particle.vx = (dx / dist) * 3;
            particle.vy = (dy / dist) * 3;
        }
    }
    
    render() {
        this.particles.forEach(particle => {
            this.renderParticle(particle);
        });
    }
    
    renderParticle(particle) {
        this.ctx.save();
        this.ctx.globalAlpha = particle.alpha;
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.spin);
        
        switch (particle.type) {
            case 'neural':
                this.renderNeuralParticle(particle);
                break;
            case 'energy':
                this.renderEnergyParticle(particle);
                break;
            case 'corruption':
                this.renderCorruptionParticle(particle);
                break;
            case 'data_stream':
                this.renderDataStreamParticle(particle);
                break;
            default:
                this.renderBasicParticle(particle);
        }
        
        this.ctx.restore();
    }
    
    renderNeuralParticle(particle) {
        // Render neural connection trails
        if (particle.trail.length > 1) {
            this.ctx.strokeStyle = particle.color;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(particle.trail[0].x - particle.x, particle.trail[0].y - particle.y);
            
            for (let i = 1; i < particle.trail.length; i++) {
                this.ctx.lineTo(particle.trail[i].x - particle.x, particle.trail[i].y - particle.y);
            }
            this.ctx.stroke();
        }
        
        // Render node
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Render pulse
        this.ctx.strokeStyle = particle.color;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size * 2, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    renderEnergyParticle(particle) {
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size);
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(0.7, particle.color + '80');
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(-particle.size, -particle.size, particle.size * 2, particle.size * 2);
    }
    
    renderCorruptionParticle(particle) {
        this.ctx.fillStyle = particle.color;
        const rectSize = particle.size;
        
        // Render glitchy rectangles
        for (let i = 0; i < 3; i++) {
            const offsetX = (Math.random() - 0.5) * 4;
            const offsetY = (Math.random() - 0.5) * 4;
            this.ctx.fillRect(offsetX - rectSize/2, offsetY - rectSize/2, rectSize, rectSize);
        }
    }
    
    renderDataStreamParticle(particle) {
        // Render as small rectangles representing data
        this.ctx.fillStyle = particle.color;
        this.ctx.fillRect(-1, -particle.size/2, 8, particle.size);
        
        // Add data visualization elements
        this.ctx.strokeStyle = particle.color;
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(1, -particle.size/2 + i * 2);
            this.ctx.lineTo(7, -particle.size/2 + i * 2);
            this.ctx.stroke();
        }
    }
    
    renderBasicParticle(particle) {
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    // Particle creation methods
    createMuzzleParticles(params) {
        const count = 15 + Math.random() * 10;
        
        for (let i = 0; i < count; i++) {
            const particle = this.getParticle();
            
            particle.x = params.x;
            particle.y = params.y;
            particle.vx = (Math.random() - 0.5) * 8;
            particle.vy = (Math.random() - 0.5) * 8;
            particle.life = 20 + Math.random() * 30;
            particle.maxLife = particle.life;
            particle.size = 1 + Math.random() * 3;
            particle.color = params.weaponColor || '#ffaa00';
            particle.type = 'energy';
            particle.gravity = 0.1;
            particle.friction = 0.95;
            particle.baseSize = particle.size;
            particle.id = Math.random();
            
            this.particles.push(particle);
        }
    }
    
    createDeathExplosion(params) {
        const count = 25 + Math.random() * 15;
        
        for (let i = 0; i < count; i++) {
            const particle = this.getParticle();
            
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = 2 + Math.random() * 6;
            
            particle.x = params.x;
            particle.y = params.y;
            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;
            particle.life = 40 + Math.random() * 40;
            particle.maxLife = particle.life;
            particle.size = 2 + Math.random() * 4;
            particle.color = '#ff4466';
            particle.type = 'corruption';
            particle.gravity = 0.05;
            particle.friction = 0.98;
            
            this.particles.push(particle);
        }
        
        // Add neural disruption particles
        for (let i = 0; i < 8; i++) {
            const particle = this.getParticle();
            
            particle.x = params.x + (Math.random() - 0.5) * 50;
            particle.y = params.y + (Math.random() - 0.5) * 50;
            particle.vx = (Math.random() - 0.5) * 2;
            particle.vy = (Math.random() - 0.5) * 2;
            particle.life = 80 + Math.random() * 40;
            particle.maxLife = particle.life;
            particle.size = 3 + Math.random() * 2;
            particle.color = '#00ff88';
            particle.type = 'neural';
            particle.gravity = 0;
            particle.friction = 0.99;
            
            this.particles.push(particle);
        }
    }
    
    createAmbientParticle(gameState) {
        const particle = this.getParticle();
        
        // Random spawn at screen edges
        const edge = Math.floor(Math.random() * 4);
        switch (edge) {
            case 0: // Top
                particle.x = Math.random() * this.canvas.width;
                particle.y = -10;
                break;
            case 1: // Right
                particle.x = this.canvas.width + 10;
                particle.y = Math.random() * this.canvas.height;
                break;
            case 2: // Bottom
                particle.x = Math.random() * this.canvas.width;
                particle.y = this.canvas.height + 10;
                break;
            case 3: // Left
                particle.x = -10;
                particle.y = Math.random() * this.canvas.height;
                break;
        }
        
        // Move toward center with some randomness
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const angle = Math.atan2(centerY - particle.y, centerX - particle.x) + (Math.random() - 0.5) * 0.5;
        const speed = 0.5 + Math.random() * 1.5;
        
        particle.vx = Math.cos(angle) * speed;
        particle.vy = Math.sin(angle) * speed;
        particle.life = 300 + Math.random() * 300;
        particle.maxLife = particle.life;
        particle.size = 1 + Math.random() * 2;
        particle.color = gameState.aiActivity > 0.7 ? '#00e5ff' : '#ff8533';
        particle.type = 'data_stream';
        particle.gravity = 0;
        particle.friction = 1;
        
        this.particles.push(particle);
    }
    
    createTransitionEffect() {
        // Create dramatic transition particles
        for (let i = 0; i < 50; i++) {
            const particle = this.getParticle();
            
            particle.x = Math.random() * this.canvas.width;
            particle.y = Math.random() * this.canvas.height;
            particle.vx = (Math.random() - 0.5) * 10;
            particle.vy = (Math.random() - 0.5) * 10;
            particle.life = 60 + Math.random() * 60;
            particle.maxLife = particle.life;
            particle.size = 3 + Math.random() * 5;
            particle.color = '#ffffff';
            particle.type = 'energy';
            particle.gravity = 0;
            particle.friction = 0.95;
            particle.baseSize = particle.size;
            particle.id = Math.random();
            
            this.particles.push(particle);
        }
    }
    
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
}

class ShaderEffects {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.effects = [];
        this.screenShake = { x: 0, y: 0, intensity: 0 };
    }
    
    update(gameState) {
        // Update screen shake
        if (this.screenShake.intensity > 0) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.intensity *= 0.9;
            
            if (this.screenShake.intensity < 0.1) {
                this.screenShake.intensity = 0;
                this.screenShake.x = 0;
                this.screenShake.y = 0;
            }
        }
        
        // Update shader effects
        this.effects = this.effects.filter(effect => {
            effect.life--;
            effect.progress = 1 - (effect.life / effect.maxLife);
            return effect.life > 0;
        });
    }
    
    render() {
        // Apply screen shake
        this.ctx.save();
        this.ctx.translate(this.screenShake.x, this.screenShake.y);
        
        // Render effects
        this.effects.forEach(effect => {
            this.renderEffect(effect);
        });
        
        this.ctx.restore();
    }
    
    renderEffect(effect) {
        this.ctx.save();
        
        switch (effect.type) {
            case 'muzzle_flash':
                this.renderMuzzleFlash(effect);
                break;
            case 'damage_flash':
                this.renderDamageFlash(effect);
                break;
            case 'transition':
                this.renderTransition(effect);
                break;
            case 'digital_glitch':
                this.renderDigitalGlitch(effect);
                break;
        }
        
        this.ctx.restore();
    }
    
    renderMuzzleFlash(effect) {
        const alpha = 1 - effect.progress;
        this.ctx.globalAlpha = alpha;
        
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width * 0.8, this.canvas.height * 0.8, 0,
            this.canvas.width * 0.8, this.canvas.height * 0.8, 200
        );
        
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, effect.color || '#ffaa00');
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    renderDamageFlash(effect) {
        const alpha = (1 - effect.progress) * 0.3;
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = '#ff4466';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    renderTransition(effect) {
        const progress = effect.progress;
        
        // Create scan line effect
        for (let y = 0; y < this.canvas.height; y += 4) {
            const alpha = Math.sin(progress * Math.PI * 2 + y * 0.1) * 0.5 + 0.5;
            this.ctx.globalAlpha = alpha * (1 - progress);
            this.ctx.fillStyle = '#00e5ff';
            this.ctx.fillRect(0, y, this.canvas.width, 2);
        }
    }
    
    renderDigitalGlitch(effect) {
        const intensity = (1 - effect.progress) * 10;
        
        // Horizontal displacement
        for (let y = 0; y < this.canvas.height; y += 5) {
            if (Math.random() < 0.1) {
                const displacement = (Math.random() - 0.5) * intensity;
                const imageData = this.ctx.getImageData(0, y, this.canvas.width, 5);
                this.ctx.putImageData(imageData, displacement, y);
            }
        }
    }
    
    triggerMuzzleFlash(params) {
        this.effects.push({
            type: 'muzzle_flash',
            life: 8,
            maxLife: 8,
            progress: 0,
            color: params.color || '#ffaa00'
        });
        
        // Add screen shake
        this.screenShake.intensity = 3;
    }
    
    triggerDamageEffect(params) {
        this.effects.push({
            type: 'damage_flash',
            life: 15,
            maxLife: 15,
            progress: 0
        });
        
        this.screenShake.intensity = 5;
    }
    
    triggerTransition() {
        this.effects.push({
            type: 'transition',
            life: 120,
            maxLife: 120,
            progress: 0
        });
    }
    
    triggerDigitalGlitch() {
        this.effects.push({
            type: 'digital_glitch',
            life: 30,
            maxLife: 30,
            progress: 0
        });
    }
}

class NeuralNetworkVisualizer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.nodes = [];
        this.connections = [];
        this.aiActivity = 0.5;
        this.networkIntensity = 0.3;
    }
    
    update(gameState) {
        this.aiActivity = gameState.aiActivity || 0.5;
        this.networkIntensity = 0.2 + this.aiActivity * 0.4;
        
        // Generate network nodes if needed
        if (this.nodes.length < 20) {
            this.generateNetworkNodes();
        }
        
        // Update node activity
        this.updateNodeActivity(gameState);
        
        // Update connections
        this.updateConnections();
    }
    
    generateNetworkNodes() {
        const nodeCount = 15 + Math.floor(this.aiActivity * 10);
        
        for (let i = this.nodes.length; i < nodeCount; i++) {
            this.nodes.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                activity: Math.random(),
                baseActivity: Math.random() * 0.5 + 0.3,
                size: 2 + Math.random() * 3,
                pulsePhase: Math.random() * Math.PI * 2,
                type: Math.random() > 0.7 ? 'processor' : 'data'
            });
        }
    }
    
    updateNodeActivity(gameState) {
        this.nodes.forEach((node, index) => {
            // Base pulsing
            node.activity = node.baseActivity + 
                           Math.sin(Date.now() * 0.003 + node.pulsePhase) * 0.3;
            
            // Spike activity based on game events
            if (gameState.time - (gameState.lastGunshot || 0) < 30) {
                node.activity = Math.min(1, node.activity + 0.5);
            }
            
            // AI-driven activity patterns
            if (index % 3 === 0) {
                node.activity *= this.aiActivity;
            }
        });
    }
    
    updateConnections() {
        this.connections = [];
        
        // Create connections between nearby active nodes
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const node1 = this.nodes[i];
                const node2 = this.nodes[j];
                
                const distance = Math.sqrt(
                    (node1.x - node2.x) ** 2 + (node1.y - node2.y) ** 2
                );
                
                if (distance < 150 && 
                    (node1.activity > 0.6 || node2.activity > 0.6)) {
                    this.connections.push({
                        from: node1,
                        to: node2,
                        strength: Math.min(node1.activity, node2.activity),
                        distance: distance
                    });
                }
            }
        }
    }
    
    render() {
        if (this.networkIntensity < 0.1) return;
        
        this.ctx.save();
        this.ctx.globalAlpha = this.networkIntensity;
        
        // Render connections
        this.renderConnections();
        
        // Render nodes
        this.renderNodes();
        
        this.ctx.restore();
    }
    
    renderConnections() {
        this.connections.forEach(connection => {
            const alpha = connection.strength * (1 - connection.distance / 150);
            
            this.ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`;
            this.ctx.lineWidth = 1 + connection.strength * 2;
            this.ctx.beginPath();
            this.ctx.moveTo(connection.from.x, connection.from.y);
            this.ctx.lineTo(connection.to.x, connection.to.y);
            this.ctx.stroke();
            
            // Add data flow visualization
            if (connection.strength > 0.7) {
                this.renderDataFlow(connection);
            }
        });
    }
    
    renderDataFlow(connection) {
        const progress = (Date.now() * 0.002) % 1;
        const x = connection.from.x + (connection.to.x - connection.from.x) * progress;
        const y = connection.from.y + (connection.to.y - connection.from.y) * progress;
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    renderNodes() {
        this.nodes.forEach(node => {
            const alpha = node.activity;
            const size = node.size * (0.8 + node.activity * 0.4);
            
            // Node core
            this.ctx.fillStyle = node.type === 'processor' ? 
                               `rgba(255, 133, 51, ${alpha})` : 
                               `rgba(0, 229, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Activity ring
            if (node.activity > 0.6) {
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, size * 2, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        });
    }
    
    registerAIDestruction(params) {
        // Remove nearby nodes when AI is destroyed
        this.nodes = this.nodes.filter(node => {
            const distance = Math.sqrt(
                (node.x - params.x) ** 2 + (node.y - params.y) ** 2
            );
            return distance > 100;
        });
        
        // Add disruption effect
        this.nodes.forEach(node => {
            const distance = Math.sqrt(
                (node.x - params.x) ** 2 + (node.y - params.y) ** 2
            );
            
            if (distance < 200) {
                node.activity *= 0.3; // Reduce activity
                node.baseActivity *= 0.8;
            }
        });
    }
    
    highlightWeaponChange(params) {
        // Highlight nodes when weapon changes
        this.nodes.forEach(node => {
            node.activity = Math.min(1, node.activity + 0.3);
        });
    }
    
    resetNetwork() {
        this.nodes = [];
        this.connections = [];
    }
}

class EnvironmentalEffects {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.environmentalParticles = [];
        this.weatherSystem = new WeatherSystem(canvas, ctx);
        this.hazardZones = [];
    }
    
    update(gameState) {
        this.weatherSystem.update(gameState);
        this.updateHazardZones(gameState);
        this.updateEnvironmentalParticles();
    }
    
    updateHazardZones(gameState) {
        // Update any environmental hazards from dynamic events
        if (gameState.activeEvents) {
            this.hazardZones = gameState.activeEvents
                .filter(event => event.effect && event.effect.damageZones)
                .flatMap(event => event.effect.damageZones);
        }
    }
    
    updateEnvironmentalParticles() {
        // Update floating debris, dust, etc.
        this.environmentalParticles = this.environmentalParticles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            return particle.life > 0;
        });
        
        // Add new environmental particles
        if (Math.random() < 0.02) {
            this.addEnvironmentalParticle();
        }
    }
    
    addEnvironmentalParticle() {
        this.environmentalParticles.push({
            x: -10,
            y: Math.random() * this.canvas.height,
            vx: 0.5 + Math.random() * 1,
            vy: (Math.random() - 0.5) * 0.2,
            life: 300 + Math.random() * 300,
            maxLife: 300 + Math.random() * 300,
            size: 1 + Math.random() * 2,
            alpha: 1,
            color: '#666'
        });
    }
    
    render() {
        this.weatherSystem.render();
        this.renderHazardZones();
        this.renderEnvironmentalParticles();
    }
    
    renderHazardZones() {
        this.hazardZones.forEach(zone => {
            const gradient = this.ctx.createRadialGradient(
                zone.x, zone.y, 0,
                zone.x, zone.y, zone.radius
            );
            
            gradient.addColorStop(0, 'rgba(255, 68, 102, 0.3)');
            gradient.addColorStop(0.7, 'rgba(255, 68, 102, 0.1)');
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(
                zone.x - zone.radius, zone.y - zone.radius,
                zone.radius * 2, zone.radius * 2
            );
        });
    }
    
    renderEnvironmentalParticles() {
        this.environmentalParticles.forEach(particle => {
            this.ctx.save();
            this.ctx.globalAlpha = particle.alpha * 0.6;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(
                particle.x - particle.size/2, 
                particle.y - particle.size/2,
                particle.size, particle.size
            );
            this.ctx.restore();
        });
    }
}

class WeatherSystem {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.intensity = 0.3;
        this.type = 'digital_storm';
    }
    
    update(gameState) {
        // Weather intensity based on game stress
        this.intensity = 0.2 + (gameState.stressLevel || 0) * 0.4;
    }
    
    render() {
        if (this.type === 'digital_storm') {
            this.renderDigitalStorm();
        }
    }
    
    renderDigitalStorm() {
        // Create digital rain effect
        for (let i = 0; i < this.intensity * 50; i++) {
            const x = Math.random() * this.canvas.width;
            const y = (Date.now() * 0.01 + i * 100) % this.canvas.height;
            
            this.ctx.strokeStyle = `rgba(0, 229, 255, ${this.intensity * 0.5})`;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + 2, y + 20);
            this.ctx.stroke();
        }
    }
}

// Simple Perlin noise implementation for atmospheric effects
class PerlinNoise {
    constructor() {
        this.permutation = [];
        for (let i = 0; i < 256; i++) {
            this.permutation[i] = Math.floor(Math.random() * 256);
        }
    }
    
    noise(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        
        x -= Math.floor(x);
        y -= Math.floor(y);
        
        const u = this.fade(x);
        const v = this.fade(y);
        
        const A = this.permutation[X] + Y;
        const B = this.permutation[X + 1] + Y;
        
        return this.lerp(v, 
            this.lerp(u, this.grad(this.permutation[A], x, y), 
                         this.grad(this.permutation[B], x - 1, y)),
            this.lerp(u, this.grad(this.permutation[A + 1], x, y - 1), 
                         this.grad(this.permutation[B + 1], x - 1, y - 1))
        );
    }
    
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    lerp(t, a, b) {
        return a + t * (b - a);
    }
    
    grad(hash, x, y) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
}

// Export all classes
export { 
    AdvancedVisualSystem, 
    AtmosphereEngine, 
    AdvancedParticleSystem, 
    ShaderEffects, 
    NeuralNetworkVisualizer, 
    EnvironmentalEffects 
};
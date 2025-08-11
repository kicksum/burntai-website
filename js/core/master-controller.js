// Complete System Integration & Master Controller
// This orchestrates all AI systems, visual effects, and game mechanics

class MasterGameController {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Initialize all subsystems
        this.visualSystem = new AdvancedVisualSystem(canvas, ctx);
        this.gameAI = new WastelandAI();
        this.enemyAI = new AdvancedEnemyAI();
        this.proceduralAI = new ProceduralAI();
        this.claudeAssistant = new ClaudeNeuralAssistant();
        this.performanceMonitor = new GamePerformanceMonitor();
        this.voiceCommands = new VoiceCommandSystem();
        this.adaptiveDifficulty = new AdaptiveDifficultySystem();
        this.neuralAnalytics = new NeuralAnalyticsSystem();
        
        // Game state management
        this.gameState = this.initializeGameState();
        this.systemStats = this.initializeSystemStats();
        
        // Event management
        this.eventQueue = [];
        this.activeEvents = new Map();
        
        // Performance optimization
        this.frameSkipCounter = 0;
        this.aiUpdateFrequency = 3; // Update AI every 3 frames
        
        this.isInitialized = false;
    }
    
    async initialize() {
        try {
            console.log('🔥 Initializing Digital Wasteland Arena Master System...');
            
            // Initialize subsystems in order
            await this.initializeSubsystems();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize AI learning from any stored data
            await this.loadPlayerProfile();
            
            // Generate initial level
            await this.generateLevel(1);
            
            this.isInitialized = true;
            console.log('✅ Master System initialized successfully');
            
            // Send startup message to AI companion
            this.queueEvent('system_startup', { timestamp: Date.now() });
            
        } catch (error) {
            console.error('❌ Failed to initialize Master System:', error);
            this.fallbackToBasicMode();
        }
    }
    
    async initializeSubsystems() {
        const initSteps = [
            { name: 'Visual System', fn: () => this.visualSystem.initialize?.() },
            { name: 'AI Systems', fn: () => this.gameAI.initialize?.() },
            { name: 'Voice Commands', fn: () => this.voiceCommands.initialize() },
            { name: 'Analytics', fn: () => this.neuralAnalytics.initialize() },
            { name: 'Claude Integration', fn: () => this.claudeAssistant.initialize?.() }
        ];
        
        for (const step of initSteps) {
            try {
                if (step.fn) await step.fn();
                console.log(`✓ ${step.name} initialized`);
            } catch (error) {
                console.warn(`⚠️ ${step.name} initialization failed:`, error);
            }
        }
    }
    
    initializeGameState() {
        return {
            player: {
                x: 150, y: 150, angle: 0,
                health: 100, maxHealth: 100, score: 0,
                speed: 2.5, rotSpeed: 0.05, isSprinting: false,
                currentWeapon: 0,
                weapons: {
                    0: { name: 'Pulse Rifle', damage: 25, ammo: 50, maxAmmo: 50, fireRate: 300 },
                    1: { name: 'Plasma Cannon', damage: 50, ammo: 20, maxAmmo: 20, fireRate: 800 },
                    2: { name: 'Neural Disruptor', damage: 75, ammo: 10, maxAmmo: 10, fireRate: 1200 }
                },
                lastFired: 0, velocity: { x: 0, y: 0 }, friction: 0.8,
                skills: { accuracy: 0.5, survival: 0.5, tactical: 0.5 }
            },
            enemies: [], projectiles: [], items: [], particles: [],
            keys: {}, mouse: { x: 0, y: 0 },
            isGameOver: false, isPaused: false, time: 0,
            level: 1, enemiesKilled: 0, totalShots: 0, shotsHit: 0,
            sessionStartTime: Date.now(),
            currentMap: null,
            activeEvents: [],
            environmentalHazards: [],
            powerUps: [],
            achievements: [],
            
            // AI-specific state
            aiActivity: 0.5,
            stressLevel: 0.0,
            lastGunshot: 0,
            tacticalSituation: 'normal',
            playerProfile: null
        };
    }
    
    initializeSystemStats() {
        return {
            performance: {
                fps: 60,
                frameTime: 16.67,
                memoryUsage: 0,
                aiProcessingTime: 0,
                renderTime: 0
            },
            ai: {
                decisionsPerSecond: 0,
                claudeQueries: 0,
                adaptationRate: 0.1,
                learningAccuracy: 0.5
            },
            gameplay: {
                difficultyScore: 0.5,
                engagementLevel: 0.5,
                frustrationLevel: 0.0,
                flowState: 0.5
            }
        };
    }
    
    async loadPlayerProfile() {
        try {
            const stored = localStorage.getItem('burntai_player_profile');
            if (stored) {
                this.gameState.playerProfile = JSON.parse(stored);
                console.log('📊 Player profile loaded');
            } else {
                this.gameState.playerProfile = this.createDefaultProfile();
            }
        } catch (error) {
            console.warn('⚠️ Could not load player profile, using defaults');
            this.gameState.playerProfile = this.createDefaultProfile();
        }
    }
    
    createDefaultProfile() {
        return {
            playerId: 'player_' + Math.random().toString(36).substr(2, 9),
            totalPlayTime: 0,
            gamesPlayed: 0,
            bestLevel: 1,
            totalKills: 0,
            accuracy: 0.5,
            preferences: {
                difficulty: 'adaptive',
                aiChatFrequency: 'normal',
                visualEffects: 'high'
            },
            learningData: {
                movementPatterns: [],
                weaponPreferences: {},
                tacticalDecisions: []
            }
        };
    }
    
    async generateLevel(levelNumber) {
        console.log(`🏗️ Generating level ${levelNumber}...`);
        
        try {
            const levelSpec = {
                levelNumber: levelNumber,
                playerProfile: this.gameState.playerProfile,
                gameHistory: this.getGameHistory(),
                currentPerformance: this.getCurrentPerformance()
            };
            
            const generatedLevel = await this.proceduralAI.generateLevel(
                levelNumber, 
                this.gameState.playerProfile, 
                this.getGameHistory()
            );
            
            // Apply generated content to game state
            this.gameState.currentMap = generatedLevel.map;
            this.gameState.enemies = this.positionEnemies(generatedLevel.enemies);
            this.gameState.items = this.positionItems(generatedLevel.items);
            this.gameState.activeEvents = generatedLevel.events || [];
            
            // Update visual atmosphere
            if (generatedLevel.ambientEffects) {
                this.visualSystem.atmosphereEngine.applyProfile(generatedLevel.ambientEffects);
            }
            
            // Generate level narrative
            if (generatedLevel.narrative) {
                this.displayLevelNarrative(generatedLevel.narrative);
            }
            
            console.log(`✅ Level ${levelNumber} generated successfully`);
            
        } catch (error) {
            console.error('❌ Level generation failed:', error);
            this.fallbackLevelGeneration(levelNumber);
        }
    }
    
    positionEnemies(enemies) {
        return enemies.map(enemy => {
            let position = this.findValidPosition();
            return {
                ...enemy,
                x: position.x,
                y: position.y,
                alive: true,
                lastSeen: 0,
                strategicRole: null,
                behaviorState: 'patrol'
            };
        });
    }
    
    positionItems(items) {
        return items.map(item => {
            let position = this.findValidPosition();
            return {
                ...item,
                x: position.x,
                y: position.y,
                collected: false,
                spawnTime: this.gameState.time
            };
        });
    }
    
    findValidPosition() {
        const maxAttempts = 50;
        const cellSize = 32;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const x = Math.random() * (this.gameState.currentMap[0].length - 2) * cellSize + cellSize;
            const y = Math.random() * (this.gameState.currentMap.length - 2) * cellSize + cellSize;
            
            if (this.isPositionValid(x, y)) {
                return { x, y };
            }
        }
        
        // Fallback position
        return { x: 150, y: 150 };
    }
    
    isPositionValid(x, y) {
        const cellSize = 32;
        const mapX = Math.floor(x / cellSize);
        const mapY = Math.floor(y / cellSize);
        
        // Check if position is walkable
        if (this.gameState.currentMap[mapY] && this.gameState.currentMap[mapY][mapX] !== 0) {
            return false;
        }
        
        // Check distance from player
        const playerDist = Math.sqrt(
            (x - this.gameState.player.x) ** 2 + 
            (y - this.gameState.player.y) ** 2
        );
        
        return playerDist > 80; // Minimum distance from player
    }
    
    // Main update loop - orchestrates all systems
    update() {
        if (!this.isInitialized || this.gameState.isGameOver || this.gameState.isPaused) return;
        
        const frameStart = performance.now();
        
        // Update core game state
        this.updateCoreGame();
        
        // Update AI systems (less frequently for performance)
        if (this.frameSkipCounter % this.aiUpdateFrequency === 0) {
            this.updateAISystems();
        }
        
        // Update visual systems
        this.updateVisualSystems();
        
        // Process events
        this.processEventQueue();
        
        // Update performance monitoring
        this.updatePerformanceStats(frameStart);
        
        // Adaptive optimization
        this.optimizePerformance();
        
        this.frameSkipCounter++;
        this.gameState.time++;
    }
    
    updateCoreGame() {
        // Update player
        this.updatePlayer();
        
        // Update projectiles
        this.updateProjectiles();
        
        // Update items
        this.updateItems();
        
        // Update environmental effects
        this.updateEnvironment();
        
        // Check win/lose conditions
        this.checkGameConditions();
    }
    
    updateAISystems() {
        try {
            // Update master AI
            this.gameAI.update(this.gameState);
            
            // Update enemy AI
            this.enemyAI.update(this.gameState.enemies, this.gameState.player, this.gameState);
            
            // Update adaptive difficulty
            this.adaptiveDifficulty.update(this.gameState, this.systemStats);
            
            // Process neural analytics
            this.neuralAnalytics.recordFrame(this.gameState, this.systemStats);
            
            // Update AI chat system
            this.updateAIChat();
            
        } catch (error) {
            console.warn('⚠️ AI system update error:', error);
        }
    }
    
    updateVisualSystems() {
        // Update visual effects
        this.visualSystem.update(this.gameState);
        
        // Update particle systems
        this.updateParticles();
        
        // Update screen effects
        this.updateScreenEffects();
    }
    
    updatePlayer() {
        const player = this.gameState.player;
        const speed = player.isSprinting ? player.speed * 1.5 : player.speed;
        let moveX = 0, moveY = 0;
        
        // Calculate movement input
        if (this.gameState.keys['w']) {
            moveX += Math.cos(player.angle) * speed;
            moveY += Math.sin(player.angle) * speed;
        }
        if (this.gameState.keys['s']) {
            moveX -= Math.cos(player.angle) * speed;
            moveY -= Math.sin(player.angle) * speed;
        }
        if (this.gameState.keys['a']) {
            moveX += Math.cos(player.angle - Math.PI/2) * speed;
            moveY += Math.sin(player.angle - Math.PI/2) * speed;
        }
        if (this.gameState.keys['d']) {
            moveX += Math.cos(player.angle + Math.PI/2) * speed;
            moveY += Math.sin(player.angle + Math.PI/2) * speed;
        }
        
        // Apply movement with enhanced physics
        player.velocity.x += moveX * 0.3;
        player.velocity.y += moveY * 0.3;
        
        // Apply friction
        player.velocity.x *= player.friction;
        player.velocity.y *= player.friction;
        
        // Move with collision detection and wall sliding
        this.movePlayerWithCollision(player);
        
        // Update player skills based on actions
        this.updatePlayerSkills();
    }
    
    movePlayerWithCollision(player) {
        const newX = player.x + player.velocity.x;
        const newY = player.y + player.velocity.y;
        
        // Check X movement
        if (!this.checkCollision(newX, player.y)) {
            player.x = newX;
        } else {
            player.velocity.x = 0;
            // Try sliding along wall
            if (!this.checkCollision(newX, player.y + player.velocity.y * 0.5)) {
                player.y += player.velocity.y * 0.5;
            }
        }
        
        // Check Y movement
        if (!this.checkCollision(player.x, newY)) {
            player.y = newY;
        } else {
            player.velocity.y = 0;
            // Try sliding along wall
            if (!this.checkCollision(player.x + player.velocity.x * 0.5, newY)) {
                player.x += player.velocity.x * 0.5;
            }
        }
    }
    
    updatePlayerSkills() {
        const player = this.gameState.player;
        
        // Accuracy skill
        if (this.gameState.totalShots > 0) {
            player.skills.accuracy = this.gameState.shotsHit / this.gameState.totalShots;
        }
        
        // Survival skill (based on time alive)
        const survivalTime = this.gameState.time;
        player.skills.survival = Math.min(survivalTime / 3600, 1); // Max at 60 seconds
        
        // Tactical skill (based on enemy elimination efficiency)
        if (this.gameState.enemiesKilled > 0) {
            player.skills.tactical = Math.min(this.gameState.enemiesKilled / (this.gameState.level * 5), 1);
        }
    }
    
    updateProjectiles() {
        this.gameState.projectiles = this.gameState.projectiles.filter(proj => {
            // Update position
            proj.x += Math.cos(proj.angle) * proj.speed;
            proj.y += Math.sin(proj.angle) * proj.speed;
            proj.life--;
            
            if (proj.life <= 0) return false;
            
            // Check wall collision
            if (this.checkCollision(proj.x, proj.y)) {
                this.triggerEffect('projectile_impact', { x: proj.x, y: proj.y, type: 'wall' });
                return false;
            }
            
            // Check enemy collision
            for (let enemy of this.gameState.enemies) {
                if (enemy.alive && this.distance(proj.x, proj.y, enemy.x, enemy.y) < 20) {
                    this.handleEnemyHit(enemy, proj);
                    return false;
                }
            }
            
            return true;
        });
    }
    
    handleEnemyHit(enemy, projectile) {
        enemy.health -= projectile.damage;
        this.gameState.shotsHit++;
        
        // Visual effect
        this.triggerEffect('enemy_hit', { 
            x: enemy.x, 
            y: enemy.y, 
            damage: projectile.damage,
            enemyType: enemy.type 
        });
        
        if (enemy.health <= 0) {
            enemy.alive = false;
            this.gameState.enemiesKilled++;
            this.gameState.player.score += enemy.score || 100;
            
            // Death effect
            this.triggerEffect('enemy_death', { 
                x: enemy.x, 
                y: enemy.y, 
                enemyType: enemy.type 
            });
            
            // AI learning
            this.neuralAnalytics.recordEnemyElimination(enemy, projectile, this.gameState);
            
            // Trigger AI chat
            this.queueEvent('enemy_killed', { enemy: enemy, weapon: projectile.weapon });
        }
    }
    
    updateItems() {
        this.gameState.items.forEach(item => {
            if (!item.collected) {
                item.pulseTime = (item.pulseTime || 0) + 1;
                
                // Check collection
                const dist = this.distance(
                    this.gameState.player.x, this.gameState.player.y,
                    item.x, item.y
                );
                
                if (dist < 25) {
                    this.collectItem(item);
                }
            }
        });
    }
    
    collectItem(item) {
        item.collected = true;
        const player = this.gameState.player;
        
        switch (item.type) {
            case 'health':
                const healthGained = Math.min(player.maxHealth - player.health, item.value);
                player.health += healthGained;
                this.triggerEffect('health_pickup', { x: item.x, y: item.y, value: healthGained });
                break;
                
            case 'ammo':
                Object.values(player.weapons).forEach(weapon => {
                    weapon.ammo = Math.min(weapon.maxAmmo, weapon.ammo + item.value);
                });
                this.triggerEffect('ammo_pickup', { x: item.x, y: item.y, value: item.value });
                break;
                
            case 'weapon_mod':
                this.applyWeaponModification(item);
                break;
                
            case 'ability':
                this.activateSpecialAbility(item);
                break;
        }
        
        // AI notification
        this.queueEvent('item_collected', { item: item });
    }
    
    updateEnvironment() {
        // Update active events
        this.gameState.activeEvents = this.gameState.activeEvents.filter(event => {
            event.duration -= 16.67; // Assume 60 FPS
            
            if (event.duration <= 0) {
                this.triggerEffect('event_end', { event: event });
                return false;
            }
            
            // Apply event effects
            this.applyEventEffects(event);
            return true;
        });
        
        // Update environmental hazards
        this.updateEnvironmentalHazards();
    }
    
    applyEventEffects(event) {
        switch (event.type) {
            case 'power_surge':
                // Boost player abilities temporarily
                if (event.effect.playerSpeedBoost) {
                    this.gameState.player.speed *= event.effect.playerSpeedBoost;
                }
                break;
                
            case 'ai_reinforcements':
                // Spawn additional enemies
                if (event.effect.spawnEnemies && event.spawnTimer <= 0) {
                    this.spawnReinforcements(event.effect);
                    event.spawnTimer = 60; // 1 second cooldown
                }
                event.spawnTimer = (event.spawnTimer || 0) - 1;
                break;
                
            case 'environmental_hazard':
                // Apply damage in hazard zones
                if (event.effect.damageZones) {
                    this.processDamageZones(event.effect.damageZones);
                }
                break;
        }
    }
    
    updateAIChat() {
        try {
            // Process Claude queries
            if (this.claudeAssistant && this.gameState.time % 180 === 0) { // Every 3 seconds
                this.processPendingChatQueries();
            }
            
            // Update local AI responses
            this.updateLocalAIResponses();
            
        } catch (error) {
            console.warn('⚠️ AI Chat update error:', error);
        }
    }
    
    async processPendingChatQueries() {
        const situations = this.analyzeCurrentSituation();
        
        for (const situation of situations) {
            if (situation.priority === 'critical' || Math.random() < 0.3) {
                try {
                    const response = await this.claudeAssistant.queryClaudeForAdvice(
                        this.gameState,
                        this.gameState.playerProfile,
                        situation.description
                    );
                    
                    if (response) {
                        this.displayAIMessage(response, situation.priority);
                    }
                } catch (error) {
                    console.warn('Claude query failed:', error);
                    // Fallback to local response
                    const fallback = this.generateLocalResponse(situation);
                    if (fallback) this.displayAIMessage(fallback, 'info');
                }
            }
        }
    }
    
    analyzeCurrentSituation() {
        const situations = [];
        const player = this.gameState.player;
        
        // Critical health
        if (player.health < 25) {
            situations.push({
                priority: 'critical',
                description: 'Player health critical - immediate action required',
                type: 'health_critical'
            });
        }
        
        // Surrounded by enemies
        const nearbyEnemies = this.gameState.enemies.filter(e => 
            e.alive && this.distance(e.x, e.y, player.x, player.y) < 100
        ).length;
        
        if (nearbyEnemies >= 3) {
            situations.push({
                priority: 'high',
                description: `Surrounded by ${nearbyEnemies} hostiles`,
                type: 'surrounded'
            });
        }
        
        // Performance analysis
        if (player.skills.accuracy < 0.3) {
            situations.push({
                priority: 'medium',
                description: 'Low accuracy detected - tactical adjustment needed',
                type: 'accuracy_low'
            });
        }
        
        return situations.sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }
    
    checkGameConditions() {
        // Check win condition
        const aliveEnemies = this.gameState.enemies.filter(e => e.alive).length;
        if (aliveEnemies === 0) {
            this.completeLevel();
        }
        
        // Check lose condition
        if (this.gameState.player.health <= 0) {
            this.gameOver();
        }
    }
    
    async completeLevel() {
        this.gameState.level++;
        
        // Update player profile
        this.updatePlayerProfile();
        
        // Trigger effects
        this.triggerEffect('level_complete', { level: this.gameState.level - 1 });
        
        // AI notification
        this.queueEvent('level_complete', { 
            level: this.gameState.level - 1,
            performance: this.calculateLevelPerformance()
        });
        
        // Generate next level
        await this.generateLevel(this.gameState.level);
        
        // Heal player partially
        this.gameState.player.health = Math.min(
            this.gameState.player.maxHealth, 
            this.gameState.player.health + 25
        );
        
        console.log(`🎯 Level ${this.gameState.level} unlocked!`);
    }
    
    gameOver() {
        this.gameState.isGameOver = true;
        
        // Final statistics
        const finalStats = this.calculateFinalStats();
        
        // Update player profile
        this.updatePlayerProfile();
        
        // Save progress
        this.savePlayerProfile();
        
        // Trigger effects
        this.triggerEffect('game_over', finalStats);
        
        // AI notification
        this.queueEvent('game_over', finalStats);
        
        console.log('💀 Game Over - Final Score:', finalStats.score);
    }
    
    // Utility methods
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
    
    checkCollision(x, y) {
        if (!this.gameState.currentMap) return false;
        
        const cellSize = 32;
        const mapX = Math.floor(x / cellSize);
        const mapY = Math.floor(y / cellSize);
        
        return this.gameState.currentMap[mapY] && this.gameState.currentMap[mapY][mapX] === 1;
    }
    
    triggerEffect(effectType, params) {
        this.visualSystem.triggerEffect(effectType, params);
        this.queueEvent(effectType, params);
    }
    
    queueEvent(eventType, data) {
        this.eventQueue.push({
            type: eventType,
            data: data,
            timestamp: Date.now(),
            gameTime: this.gameState.time
        });
    }
    
    processEventQueue() {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            this.processEvent(event);
        }
    }
    
    processEvent(event) {
        // Log for analytics
        this.neuralAnalytics.recordEvent(event);
        
        // Update system stats
        this.updateSystemStatsFromEvent(event);
        
        // Trigger any cascading effects
        this.handleEventCascades(event);
    }
    
    // Performance and optimization
    updatePerformanceStats(frameStart) {
        const frameEnd = performance.now();
        const frameTime = frameEnd - frameStart;
        
        this.systemStats.performance.frameTime = frameTime;
        this.systemStats.performance.fps = 1000 / frameTime;
        
        if (performance.memory) {
            this.systemStats.performance.memoryUsage = performance.memory.usedJSHeapSize;
        }
    }
    
    optimizePerformance() {
        const fps = this.systemStats.performance.fps;
        
        // Adaptive quality adjustment
        if (fps < 30) {
            this.aiUpdateFrequency = Math.min(this.aiUpdateFrequency + 1, 6);
            this.visualSystem.globalIntensity *= 0.9;
            console.log('🔧 Performance optimization: Reduced quality');
        } else if (fps > 55 && this.aiUpdateFrequency > 2) {
            this.aiUpdateFrequency = Math.max(this.aiUpdateFrequency - 1, 2);
            this.visualSystem.globalIntensity = Math.min(this.visualSystem.globalIntensity * 1.1, 1.0);
        }
    }
    
    // Input handling
    handleKeyDown(event) {
        this.gameState.keys[event.key.toLowerCase()] = true;
        
        // Special key handling
        switch (event.key.toLowerCase()) {
            case 'escape':
                this.togglePause();
                break;
            case 'c':
                this.toggleAIChat();
                break;
            case 'r':
                this.reloadWeapon();
                break;
            case '1':
            case '2':
            case '3':
                this.switchWeapon(parseInt(event.key) - 1);
                break;
        }
    }
    
    handleKeyUp(event) {
        this.gameState.keys[event.key.toLowerCase()] = false;
    }
    
    handleMouseMove(event) {
        if (document.pointerLockElement === this.canvas) {
            this.gameState.player.angle += event.movementX * 0.002;
        }
    }
    
    handleMouseClick(event) {
        if (!this.gameState.isGameOver && !this.gameState.isPaused) {
            if (!document.pointerLockElement) {
                this.canvas.requestPointerLock();
            } else {
                this.fireWeapon();
            }
        }
    }
    
    fireWeapon() {
        const player = this.gameState.player;
        const weapon = player.weapons[player.currentWeapon];
        
        if (weapon.ammo <= 0 || this.gameState.time - player.lastFired < weapon.fireRate) {
            return;
        }
        
        weapon.ammo--;
        player.lastFired = this.gameState.time;
        this.gameState.lastGunshot = this.gameState.time;
        this.gameState.totalShots++;
        
        // Create projectile
        this.gameState.projectiles.push({
            x: player.x,
            y: player.y,
            angle: player.angle,
            speed: 10,
            damage: weapon.damage,
            life: 100,
            weapon: player.currentWeapon
        });
        
        // Effects
        this.triggerEffect('muzzle_flash', { 
            x: player.x, 
            y: player.y, 
            weapon: player.currentWeapon 
        });
    }
    
    // Public API for external integration
    getGameState() {
        return { ...this.gameState };
    }
    
    getSystemStats() {
        return { ...this.systemStats };
    }
    
    getCurrentPerformance() {
        return {
            accuracy: this.gameState.shotsHit / Math.max(this.gameState.totalShots, 1),
            survival: this.gameState.time / 3600,
            efficiency: this.gameState.enemiesKilled / Math.max(this.gameState.level * 5, 1),
            score: this.gameState.player.score
        };
    }
    
    getGameHistory() {
        return {
            currentSessionTime: Date.now() - this.gameState.sessionStartTime,
            averageSessionTime: this.gameState.playerProfile?.totalPlayTime || 300000,
            recentDeaths: this.gameState.playerProfile?.recentDeaths || [],
            totalGames: this.gameState.playerProfile?.gamesPlayed || 0
        };
    }
    
    // Cleanup and shutdown
    destroy() {
        try {
            // Save final state
            this.savePlayerProfile();
            
            // Cleanup subsystems
            this.visualSystem.destroy?.();
            this.voiceCommands.destroy?.();
            
            // Clear intervals/timeouts
            this.eventQueue = [];
            this.activeEvents.clear();
            
            console.log('🧹 Master System cleaned up');
        } catch (error) {
            console.error('❌ Cleanup error:', error);
        }
    }
    
    // Error handling and fallbacks
    fallbackToBasicMode() {
        console.log('🔄 Falling back to basic mode...');
        
        // Disable advanced features
        this.aiUpdateFrequency = 6;
        this.visualSystem.globalIntensity = 0.5;
        
        // Use simple AI
        this.gameAI = null;
        this.claudeAssistant = null;
        
        this.isInitialized = true;
    }
    
    fallbackLevelGeneration(levelNumber) {
        console.log('🔄 Using fallback level generation...');
        
        // Generate simple level
        const map = this.generateSimpleMap(20, 16);
        this.gameState.currentMap = map;
        
        // Add basic enemies
        this.gameState.enemies = this.generateBasicEnemies(3 + levelNumber);
        
        // Add basic items
        this.gameState.items = this.generateBasicItems(2);
    }
    
    generateSimpleMap(width, height) {
        const map = Array(height).fill().map(() => Array(width).fill(0));
        
        // Add border walls
        for (let x = 0; x < width; x++) {
            map[0][x] = 1;
            map[height-1][x] = 1;
        }
        for (let y = 0; y < height; y++) {
            map[y][0] = 1;
            map[y][width-1] = 1;
        }
        
        // Add some cover
        for (let i = 0; i < 5; i++) {
            const x = Math.floor(Math.random() * (width - 4)) + 2;
            const y = Math.floor(Math.random() * (height - 4)) + 2;
            map[y][x] = 1;
        }
        
        return map;
    }
    
    generateBasicEnemies(count) {
        const enemies = [];
        for (let i = 0; i < count; i++) {
            const position = this.findValidPosition();
            enemies.push({
                x: position.x,
                y: position.y,
                type: 'grunt',
                health: 50,
                speed: 1,
                damage: 10,
                alive: true,
                score: 100
            });
        }
        return enemies;
    }
    
    generateBasicItems(count) {
        const items = [];
        for (let i = 0; i < count; i++) {
            const position = this.findValidPosition();
            items.push({
                x: position.x,
                y: position.y,
                type: i % 2 === 0 ? 'health' : 'ammo',
                value: i % 2 === 0 ? 25 : 20,
                collected: false
            });
        }
        return items;
    }
    
    // Additional utility methods
    updatePlayerProfile() {
        if (!this.gameState.playerProfile) return;
        
        const profile = this.gameState.playerProfile;
        const sessionTime = Date.now() - this.gameState.sessionStartTime;
        
        profile.totalPlayTime += sessionTime;
        profile.gamesPlayed++;
        profile.bestLevel = Math.max(profile.bestLevel, this.gameState.level);
        profile.totalKills += this.gameState.enemiesKilled;
        profile.accuracy = (profile.accuracy + this.getCurrentPerformance().accuracy) / 2;
    }
    
    savePlayerProfile() {
        try {
            localStorage.setItem('burntai_player_profile', JSON.stringify(this.gameState.playerProfile));
        } catch (error) {
            console.warn('Could not save player profile:', error);
        }
    }
    
    calculateLevelPerformance() {
        const performance = this.getCurrentPerformance();
        const timeBonus = Math.max(0, 1 - (this.gameState.time / 3600));
        const healthBonus = this.gameState.player.health / this.gameState.player.maxHealth;
        
        return {
            accuracy: performance.accuracy,
            speed: timeBonus,
            survival: healthBonus,
            overall: (performance.accuracy + timeBonus + healthBonus) / 3
        };
    }
    
    calculateFinalStats() {
        return {
            score: this.gameState.player.score,
            level: this.gameState.level,
            kills: this.gameState.enemiesKilled,
            accuracy: this.getCurrentPerformance().accuracy,
            time: this.gameState.time,
            sessionTime: Date.now() - this.gameState.sessionStartTime
        };
    }
}

// Performance monitoring system
class GamePerformanceMonitor {
    constructor() {
        this.metrics = {
            fps: [],
            frameTime: [],
            memory: [],
            aiTime: [],
            renderTime: []
        };
        this.maxSamples = 300; // 5 seconds at 60 FPS
    }
    
    recordFrame(frameTime, aiTime, renderTime) {
        this.metrics.frameTime.push(frameTime);
        this.metrics.fps.push(1000 / frameTime);
        
        if (aiTime) this.metrics.aiTime.push(aiTime);
        if (renderTime) this.metrics.renderTime.push(renderTime);
        
        if (performance.memory) {
            this.metrics.memory.push(performance.memory.usedJSHeapSize);
        }
        
        // Trim old samples
        Object.keys(this.metrics).forEach(key => {
            if (this.metrics[key].length > this.maxSamples) {
                this.metrics[key].shift();
            }
        });
    }
    
    getAverages() {
        const averages = {};
        
        Object.keys(this.metrics).forEach(key => {
            const data = this.metrics[key];
            if (data.length > 0) {
                averages[key] = data.reduce((sum, val) => sum + val, 0) / data.length;
            } else {
                averages[key] = 0;
            }
        });
        
        return averages;
    }
    
    getPerformanceScore() {
        const averages = this.getAverages();
        
        // Score based on FPS (higher is better)
        let score = Math.min(averages.fps / 60, 1) * 0.5;
        
        // Penalty for high frame time variance (stability)
        const frameTimeVariance = this.calculateVariance(this.metrics.frameTime);
        score += Math.max(0, 1 - frameTimeVariance / 10) * 0.3;
        
        // Memory efficiency (lower usage is better)
        if (averages.memory > 0) {
            score += Math.max(0, 1 - averages.memory / (100 * 1024 * 1024)) * 0.2; // 100MB baseline
        }
        
        return Math.min(score, 1);
    }
    
    calculateVariance(data) {
        if (data.length < 2) return 0;
        
        const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
        const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
        
        return Math.sqrt(variance);
    }
}

// Adaptive difficulty system
class AdaptiveDifficultySystem {
    constructor() {
        this.targetPerformance = 0.7; // 70% success rate
        this.adjustmentRate = 0.05;
        this.currentDifficulty = 0.5;
        this.performanceHistory = [];
    }
    
    update(gameState, systemStats) {
        const currentPerformance = this.calculatePerformance(gameState);
        this.performanceHistory.push(currentPerformance);
        
        if (this.performanceHistory.length > 10) {
            this.performanceHistory.shift();
        }
        
        const avgPerformance = this.performanceHistory.reduce((sum, p) => sum + p, 0) / this.performanceHistory.length;
        
        // Adjust difficulty
        const performanceDelta = avgPerformance - this.targetPerformance;
        this.currentDifficulty = Math.max(0.1, Math.min(1.0, 
            this.currentDifficulty - performanceDelta * this.adjustmentRate
        ));
        
        // Apply difficulty adjustments
        this.applyDifficultyAdjustments(gameState);
    }
    
    calculatePerformance(gameState) {
        let performance = 0;
        
        // Survival factor
        const expectedSurvival = gameState.level * 60000; // 60 seconds per level
        performance += Math.min(gameState.time / expectedSurvival, 1) * 0.4;
        
        // Health factor
        performance += (gameState.player.health / gameState.player.maxHealth) * 0.3;
        
        // Efficiency factor
        const expectedKills = gameState.level * 5;
        performance += Math.min(gameState.enemiesKilled / expectedKills, 1) * 0.3;
        
        return performance;
    }
    
    applyDifficultyAdjustments(gameState) {
        const multiplier = 0.7 + this.currentDifficulty * 0.6; // Range: 0.7 to 1.3
        
        // Adjust enemy stats
        gameState.enemies.forEach(enemy => {
            if (enemy.alive && !enemy.difficultyAdjusted) {
                enemy.health *= multiplier;
                enemy.damage = (enemy.damage || 10) * multiplier;
                enemy.speed = (enemy.speed || 1) * Math.sqrt(multiplier);
                enemy.difficultyAdjusted = true;
            }
        });
    }
    
    getDifficultyLevel() {
        if (this.currentDifficulty < 0.3) return 'Easy';
        if (this.currentDifficulty < 0.5) return 'Normal';
        if (this.currentDifficulty < 0.7) return 'Hard';
        if (this.currentDifficulty < 0.9) return 'Extreme';
        return 'Nightmare';
    }
}

// Neural analytics for learning player behavior
class NeuralAnalyticsSystem {
    constructor() {
        this.playerBehaviorModel = {
            movementPatterns: [],
            combatDecisions: [],
            tacticalChoices: [],
            reactionTimes: [],
            learningCurve: []
        };
        
        this.sessionData = {
            startTime: Date.now(),
            frames: 0,
            events: [],
            performance: []
        };
    }
    
    recordFrame(gameState, systemStats) {
        this.sessionData.frames++;
        
        // Record movement pattern
        if (this.sessionData.frames % 30 === 0) { // Every 0.5 seconds
            this.recordMovementPattern(gameState.player);
        }
        
        // Record performance metrics
        if (this.sessionData.frames % 180 === 0) { // Every 3 seconds
            this.recordPerformanceMetric(gameState, systemStats);
        }
    }
    
    recordMovementPattern(player) {
        this.playerBehaviorModel.movementPatterns.push({
            x: player.x,
            y: player.y,
            angle: player.angle,
            speed: Math.sqrt(player.velocity.x ** 2 + player.velocity.y ** 2),
            timestamp: Date.now()
        });
        
        // Keep only recent patterns
        if (this.playerBehaviorModel.movementPatterns.length > 200) {
            this.playerBehaviorModel.movementPatterns.shift();
        }
    }
    
    recordEvent(event) {
        this.sessionData.events.push({
            ...event,
            sessionFrame: this.sessionData.frames
        });
    }
    
    recordEnemyElimination(enemy, projectile, gameState) {
        this.playerBehaviorModel.combatDecisions.push({
            enemyType: enemy.type,
            weaponUsed: projectile.weapon,
            playerHealth: gameState.player.health,
            distance: this.calculateDistance(enemy, gameState.player),
            timeToKill: gameState.time - (enemy.spawnTime || 0),
            timestamp: Date.now()
        });
    }
    
    recordPerformanceMetric(gameState, systemStats) {
        this.sessionData.performance.push({
            timestamp: Date.now(),
            gameTime: gameState.time,
            accuracy: gameState.shotsHit / Math.max(gameState.totalShots, 1),
            health: gameState.player.health,
            score: gameState.player.score,
            fps: systemStats.performance.fps,
            level: gameState.level
        });
    }
    
    analyzeBehaviorPatterns() {
        return {
            movementPredictability: this.calculateMovementPredictability(),
            combatEfficiency: this.calculateCombatEfficiency(),
            learningRate: this.calculateLearningRate(),
            playStyle: this.identifyPlayStyle()
        };
    }
    
    calculateMovementPredictability() {
        const patterns = this.playerBehaviorModel.movementPatterns;
        if (patterns.length < 10) return 0.5;
        
        let linearityScore = 0;
        for (let i = 2; i < patterns.length; i++) {
            const prev = patterns[i-2];
            const curr = patterns[i-1];
            const next = patterns[i];
            
            const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
            const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
            const angleDiff = Math.abs(angle2 - angle1);
            
            if (angleDiff < Math.PI / 6) linearityScore++;
        }
        
        return linearityScore / (patterns.length - 2);
    }
    
    calculateCombatEfficiency() {
        const decisions = this.playerBehaviorModel.combatDecisions;
        if (decisions.length === 0) return 0.5;
        
        const avgTimeToKill = decisions.reduce((sum, d) => sum + d.timeToKill, 0) / decisions.length;
        const optimalTime = 2000; // 2 seconds optimal
        
        return Math.max(0, Math.min(1, optimalTime / avgTimeToKill));
    }
    
    calculateLearningRate() {
        const performance = this.sessionData.performance;
        if (performance.length < 5) return 0.5;
        
        const early = performance.slice(0, Math.floor(performance.length / 3));
        const late = performance.slice(-Math.floor(performance.length / 3));
        
        const earlyAvg = early.reduce((sum, p) => sum + p.accuracy, 0) / early.length;
        const lateAvg = late.reduce((sum, p) => sum + p.accuracy, 0) / late.length;
        
        return Math.max(0, Math.min(1, (lateAvg - earlyAvg + 0.5))); // Normalize around 0.5
    }
    
    identifyPlayStyle() {
        const patterns = this.playerBehaviorModel.movementPatterns;
        const decisions = this.playerBehaviorModel.combatDecisions;
        
        if (patterns.length < 10) return 'unknown';
        
        // Calculate average movement speed
        const avgSpeed = patterns.reduce((sum, p) => sum + p.speed, 0) / patterns.length;
        
        // Calculate average engagement distance
        const avgDistance = decisions.length > 0 ? 
            decisions.reduce((sum, d) => sum + d.distance, 0) / decisions.length : 100;
        
        if (avgSpeed > 2 && avgDistance < 80) return 'rusher';
        if (avgSpeed < 1 && avgDistance > 120) return 'camper';
        return 'tactical';
    }
    
    calculateDistance(obj1, obj2) {
        return Math.sqrt((obj1.x - obj2.x) ** 2 + (obj1.y - obj2.y) ** 2);
    }
    
    exportSessionData() {
        return {
            behaviorModel: this.playerBehaviorModel,
            sessionData: this.sessionData,
            analysis: this.analyzeBehaviorPatterns(),
            sessionDuration: Date.now() - this.sessionData.startTime
        };
    }
}

// Voice command system for advanced interaction
class VoiceCommandSystem {
    constructor() {
        this.isActive = false;
        this.recognition = null;
        this.commands = new Map();
        this.setupCommands();
    }
    
    initialize() {
        try {
            if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
                this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                this.recognition.continuous = false;
                this.recognition.interimResults = false;
                this.recognition.lang = 'en-US';
                
                this.recognition.onresult = (event) => {
                    const command = event.results[0][0].transcript.toLowerCase().trim();
                    this.processCommand(command);
                };
                
                this.recognition.onerror = (event) => {
                    console.warn('Voice recognition error:', event.error);
                };
                
                console.log('🎤 Voice commands initialized');
                return true;
            }
        } catch (error) {
            console.warn('Voice recognition not available:', error);
        }
        return false;
    }
    
    setupCommands() {
        this.commands.set('status report', () => {
            return 'Generating tactical status report...';
        });
        
        this.commands.set('reload weapon', () => {
            return 'weapon_reload';
        });
        
        this.commands.set('switch weapon', () => {
            return 'weapon_switch';
        });
        
        this.commands.set('tactical advice', () => {
            return 'request_advice';
        });
        
        this.commands.set('health status', () => {
            return 'health_check';
        });
        
        this.commands.set('enemy count', () => {
            return 'enemy_status';
        });
    }
    
    activate() {
        if (this.recognition && !this.isActive) {
            this.isActive = true;
            this.recognition.start();
            console.log('🎤 Voice commands activated');
        }
    }
    
    deactivate() {
        if (this.recognition && this.isActive) {
            this.isActive = false;
            this.recognition.stop();
            console.log('🎤 Voice commands deactivated');
        }
    }
    
    processCommand(command) {
        console.log('🎤 Voice command:', command);
        
        for (const [commandPhrase, handler] of this.commands) {
            if (command.includes(commandPhrase)) {
                const result = handler();
                this.executeCommand(result, command);
                return;
            }
        }
        
        // No exact match found, try fuzzy matching or send to AI
        this.handleUnknownCommand(command);
    }
    
    executeCommand(result, originalCommand) {
        if (typeof result === 'string') {
            // Trigger game action
            window.gameController?.queueEvent('voice_command', { 
                command: result, 
                original: originalCommand 
            });
        }
    }
    
    handleUnknownCommand(command) {
        // Send unknown commands to AI for interpretation
        window.gameController?.queueEvent('ai_interpret_voice', { command: command });
    }
    
    destroy() {
        this.deactivate();
        this.recognition = null;
    }
}

// Export the master controller
export { 
    MasterGameController, 
    GamePerformanceMonitor, 
    AdaptiveDifficultySystem, 
    NeuralAnalyticsSystem, 
    VoiceCommandSystem 
};

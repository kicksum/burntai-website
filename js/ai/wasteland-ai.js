// AI Strategy System for Digital Wasteland Arena
// This system implements advanced AI behaviors and procedural content generation

class WastelandAI {
    constructor() {
        this.playerProfile = {
            accuracy: 0.5,
            survivalTime: 0,
            preferredWeapons: [],
            movementPatterns: [],
            stressLevel: 0
        };
        
        this.difficultyAI = new DifficultyAI();
        this.enemyAI = new EnemySwarmAI();
        this.levelGenerator = new ProcGenAI();
        this.companionAI = new NeuralCompanion();
    }
    
    // Main AI update loop
    update(gameState) {
        this.analyzePlayer(gameState);
        this.updateDifficulty(gameState);
        this.updateEnemyStrategies(gameState);
        this.generateChatMessages(gameState);
    }
    
    analyzePlayer(gameState) {
        const player = gameState.player;
        
        // Track accuracy
        const shotsHit = gameState.projectilesHit || 0;
        const shotsFired = gameState.projectilesFired || 1;
        this.playerProfile.accuracy = shotsHit / shotsFired;
        
        // Movement pattern analysis
        this.analyzeMovementPattern(player);
        
        // Stress level calculation
        this.calculateStressLevel(gameState);
        
        // Weapon preference tracking
        this.trackWeaponUsage(player.currentWeapon);
    }
    
    analyzeMovementPattern(player) {
        // Store last 100 positions for pattern analysis
        if (!this.playerProfile.positions) {
            this.playerProfile.positions = [];
        }
        
        this.playerProfile.positions.push({
            x: player.x,
            y: player.y,
            time: Date.now()
        });
        
        if (this.playerProfile.positions.length > 100) {
            this.playerProfile.positions.shift();
        }
        
        // Analyze patterns (camping, rushing, tactical movement)
        this.detectBehaviorPattern();
    }
    
    detectBehaviorPattern() {
        const positions = this.playerProfile.positions;
        if (positions.length < 10) return;
        
        let totalMovement = 0;
        for (let i = 1; i < positions.length; i++) {
            const dx = positions[i].x - positions[i-1].x;
            const dy = positions[i].y - positions[i-1].y;
            totalMovement += Math.sqrt(dx*dx + dy*dy);
        }
        
        const avgMovement = totalMovement / positions.length;
        
        if (avgMovement < 5) {
            this.playerProfile.playStyle = 'camper';
        } else if (avgMovement > 20) {
            this.playerProfile.playStyle = 'rusher';
        } else {
            this.playerProfile.playStyle = 'tactical';
        }
    }
    
    calculateStressLevel(gameState) {
        let stress = 0;
        
        // Health-based stress
        const healthPercent = gameState.player.health / gameState.player.maxHealth;
        stress += (1 - healthPercent) * 0.4;
        
        // Ammo-based stress
        const currentWeapon = gameState.player.weapons[gameState.player.currentWeapon];
        const ammoPercent = currentWeapon.ammo / currentWeapon.maxAmmo;
        stress += (1 - ammoPercent) * 0.3;
        
        // Enemy proximity stress
        const nearbyEnemies = gameState.enemies.filter(enemy => {
            if (!enemy.alive) return false;
            const dist = this.distance(enemy.x, enemy.y, gameState.player.x, gameState.player.y);
            return dist < 100;
        }).length;
        stress += Math.min(nearbyEnemies * 0.1, 0.3);
        
        this.playerProfile.stressLevel = Math.min(stress, 1.0);
    }
    
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2-x1)**2 + (y2-y1)**2);
    }
    
    trackWeaponUsage(weaponId) {
        if (!this.playerProfile.weaponUsage) {
            this.playerProfile.weaponUsage = {0: 0, 1: 0, 2: 0};
        }
        this.playerProfile.weaponUsage[weaponId]++;
    }
}

class DifficultyAI {
    constructor() {
        this.targetDifficulty = 0.7; // Sweet spot for engagement
        this.currentDifficulty = 0.5;
        this.adjustmentRate = 0.02;
    }
    
    update(gameState, playerProfile) {
        const performanceScore = this.calculatePerformance(gameState, playerProfile);
        
        // Adjust difficulty based on performance
        if (performanceScore > 0.8) {
            // Player doing too well, increase difficulty
            this.currentDifficulty = Math.min(1.0, this.currentDifficulty + this.adjustmentRate);
        } else if (performanceScore < 0.4) {
            // Player struggling, decrease difficulty
            this.currentDifficulty = Math.max(0.2, this.currentDifficulty - this.adjustmentRate);
        }
        
        return this.getDifficultyModifiers();
    }
    
    calculatePerformance(gameState, playerProfile) {
        let score = 0;
        
        // Survival time factor
        const expectedSurvivalTime = gameState.level * 60000; // 1 minute per level
        const survivalRatio = Math.min(gameState.time / expectedSurvivalTime, 2.0);
        score += survivalRatio * 0.3;
        
        // Health retention
        const healthRatio = gameState.player.health / gameState.player.maxHealth;
        score += healthRatio * 0.3;
        
        // Enemy kill efficiency
        const killEfficiency = gameState.enemiesKilled / Math.max(gameState.level * 5, 1);
        score += Math.min(killEfficiency, 1.0) * 0.4;
        
        return Math.min(score, 1.0);
    }
    
    getDifficultyModifiers() {
        return {
            enemyHealthMultiplier: 0.5 + this.currentDifficulty * 1.5,
            enemySpeedMultiplier: 0.7 + this.currentDifficulty * 0.6,
            enemySpawnRate: 0.5 + this.currentDifficulty * 1.0,
            itemSpawnRate: 1.5 - this.currentDifficulty * 0.8
        };
    }
}

class EnemySwarmAI {
    constructor() {
        this.formations = ['surround', 'pincer', 'wave', 'ambush'];
        this.activeFormation = null;
        this.formationTimer = 0;
    }
    
    update(enemies, player) {
        this.formationTimer++;
        
        // Change formation every 5 seconds
        if (this.formationTimer > 300 || !this.activeFormation) {
            this.selectFormation(enemies, player);
            this.formationTimer = 0;
        }
        
        this.executeFormation(enemies, player);
    }
    
    selectFormation(enemies, player) {
        const aliveEnemies = enemies.filter(e => e.alive);
        
        if (aliveEnemies.length >= 4) {
            this.activeFormation = 'surround';
        } else if (aliveEnemies.length >= 2) {
            this.activeFormation = 'pincer';
        } else {
            this.activeFormation = 'wave';
        }
    }
    
    executeFormation(enemies, player) {
        const aliveEnemies = enemies.filter(e => e.alive);
        
        switch (this.activeFormation) {
            case 'surround':
                this.executeSurround(aliveEnemies, player);
                break;
            case 'pincer':
                this.executePincer(aliveEnemies, player);
                break;
            case 'wave':
                this.executeWave(aliveEnemies, player);
                break;
        }
    }
    
    executeSurround(enemies, player) {
        const angleStep = (Math.PI * 2) / enemies.length;
        const radius = 120;
        
        enemies.forEach((enemy, index) => {
            const targetAngle = angleStep * index;
            const targetX = player.x + Math.cos(targetAngle) * radius;
            const targetY = player.y + Math.sin(targetAngle) * radius;
            
            enemy.formationTarget = { x: targetX, y: targetY };
            enemy.role = 'surround';
        });
    }
    
    executePincer(enemies, player) {
        const half = Math.floor(enemies.length / 2);
        
        enemies.forEach((enemy, index) => {
            if (index < half) {
                // Left flank
                enemy.formationTarget = {
                    x: player.x - 100,
                    y: player.y + (index - half/2) * 50
                };
                enemy.role = 'flank_left';
            } else {
                // Right flank
                enemy.formationTarget = {
                    x: player.x + 100,
                    y: player.y + (index - half - half/2) * 50
                };
                enemy.role = 'flank_right';
            }
        });
    }
    
    executeWave(enemies, player) {
        enemies.forEach((enemy, index) => {
            // Direct assault with slight offset
            const offset = (index - enemies.length/2) * 30;
            const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
            
            enemy.formationTarget = {
                x: player.x + Math.cos(angle + Math.PI/6) * 80 + offset,
                y: player.y + Math.sin(angle + Math.PI/6) * 80
            };
            enemy.role = 'assault';
        });
    }
}

class ProcGenAI {
    constructor() {
        this.mapTemplates = {
            maze: this.generateMaze,
            arena: this.generateArena,
            corridors: this.generateCorridors,
            rooms: this.generateRooms
        };
    }
    
    generateLevel(level, playerProfile) {
        // Choose map type based on player preferences and level
        let mapType = 'arena';
        
        if (playerProfile.playStyle === 'camper') {
            mapType = Math.random() > 0.5 ? 'corridors' : 'rooms';
        } else if (playerProfile.playStyle === 'rusher') {
            mapType = Math.random() > 0.5 ? 'arena' : 'maze';
        }
        
        return this.mapTemplates[mapType](level, playerProfile);
    }
    
    generateMaze(level, playerProfile) {
        const width = 20 + level * 2;
        const height = 16 + level;
        const map = Array(height).fill().map(() => Array(width).fill(1));
        
        // Recursive backtracking maze generation
        const stack = [];
        const visited = Array(height).fill().map(() => Array(width).fill(false));
        
        function carve(x, y) {
            visited[y][x] = true;
            map[y][x] = 0;
            
            const directions = [[0, 2], [2, 0], [0, -2], [-2, 0]];
            directions.sort(() => Math.random() - 0.5);
            
            for (const [dx, dy] of directions) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && !visited[ny][nx]) {
                    map[y + dy/2][x + dx/2] = 0; // Carve connecting passage
                    carve(nx, ny);
                }
            }
        }
        
        carve(1, 1); // Start from corner
        
        // Add some random openings for tactical gameplay
        for (let i = 0; i < level * 3; i++) {
            const x = Math.floor(Math.random() * (width - 2)) + 1;
            const y = Math.floor(Math.random() * (height - 2)) + 1;
            map[y][x] = 0;
        }
        
        return map;
    }
    
    generateArena(level, playerProfile) {
        const width = 20;
        const height = 16;
        const map = Array(height).fill().map(() => Array(width).fill(0));
        
        // Border walls
        for (let x = 0; x < width; x++) {
            map[0][x] = 1;
            map[height-1][x] = 1;
        }
        for (let y = 0; y < height; y++) {
            map[y][0] = 1;
            map[y][width-1] = 1;
        }
        
        // Add strategic cover based on level
        const coverCount = 3 + level;
        for (let i = 0; i < coverCount; i++) {
            const x = Math.floor(Math.random() * (width - 4)) + 2;
            const y = Math.floor(Math.random() * (height - 4)) + 2;
            
            // Create small cover structures
            map[y][x] = 1;
            if (Math.random() > 0.5) map[y][x+1] = 1;
            if (Math.random() > 0.5) map[y+1][x] = 1;
        }
        
        return map;
    }
    
    generateCorridors(level, playerProfile) {
        const width = 20;
        const height = 16;
        const map = Array(height).fill().map(() => Array(width).fill(1));
        
        // Create main corridors
        const corridorWidth = 3;
        
        // Horizontal corridor
        for (let x = 1; x < width - 1; x++) {
            for (let y = height/2 - 1; y <= height/2 + 1; y++) {
                map[y][x] = 0;
            }
        }
        
        // Vertical corridors
        for (let i = 0; i < 3; i++) {
            const x = 3 + i * 6;
            for (let y = 1; y < height - 1; y++) {
                map[y][x] = 0;
                if (x > 0) map[y][x-1] = 0;
                if (x < width-1) map[y][x+1] = 0;
            }
        }
        
        return map;
    }
    
    generateRooms(level, playerProfile) {
        const width = 20;
        const height = 16;
        const map = Array(height).fill().map(() => Array(width).fill(1));
        
        const rooms = [
            {x: 2, y: 2, w: 6, h: 4},
            {x: 12, y: 2, w: 6, h: 4},
            {x: 2, y: 9, w: 6, h: 5},
            {x: 12, y: 9, w: 6, h: 5},
            {x: 7, y: 6, w: 6, h: 4} // Central room
        ];
        
        // Carve rooms
        rooms.forEach(room => {
            for (let x = room.x; x < room.x + room.w; x++) {
                for (let y = room.y; y < room.y + room.h; y++) {
                    if (x < width && y < height) {
                        map[y][x] = 0;
                    }
                }
            }
        });
        
        // Connect rooms with corridors
        // Add doorways
        map[4][8] = 0; // Connect top rooms
        map[4][9] = 0;
        map[11][8] = 0; // Connect bottom rooms
        map[11][9] = 0;
        map[7][5] = 0; // Connect to central
        map[8][5] = 0;
        map[7][10] = 0;
        map[8][10] = 0;
        
        return map;
    }
}

class NeuralCompanion {
    constructor() {
        this.messages = [];
        this.messageTimeout = 0;
        this.personality = 'tactical'; // tactical, supportive, sarcastic
        this.knowledgeBase = new AIKnowledgeBase();
    }
    
    update(gameState, playerProfile) {
        this.messageTimeout--;
        
        if (this.messageTimeout <= 0) {
            const message = this.generateContextualMessage(gameState, playerProfile);
            if (message) {
                this.sendMessage(message);
                this.messageTimeout = 180; // 3 seconds cooldown
            }
        }
        
        this.analyzeAndAdvise(gameState, playerProfile);
    }
    
    generateContextualMessage(gameState, playerProfile) {
        const context = this.analyzeContext(gameState, playerProfile);
        
        if (context.immediate_danger) {
            return this.getDangerMessage(context);
        } else if (context.tactical_opportunity) {
            return this.getTacticalMessage(context);
        } else if (context.performance_feedback) {
            return this.getPerformanceMessage(context);
        }
        
        return null;
    }
    
    analyzeContext(gameState, playerProfile) {
        const context = {
            immediate_danger: false,
            tactical_opportunity: false,
            performance_feedback: false,
            enemy_count: gameState.enemies.filter(e => e.alive).length,
            player_health: gameState.player.health,
            stress_level: playerProfile.stressLevel
        };
        
        // Check for immediate danger
        const nearbyEnemies = gameState.enemies.filter(enemy => {
            if (!enemy.alive) return false;
            const dist = this.distance(enemy.x, enemy.y, gameState.player.x, gameState.player.y);
            return dist < 80;
        });
        
        if (nearbyEnemies.length >= 2) {
            context.immediate_danger = true;
            context.danger_type = 'surrounded';
        }
        
        // Check for tactical opportunities
        if (playerProfile.playStyle === 'camper' && context.enemy_count <= 2) {
            context.tactical_opportunity = true;
            context.opportunity_type = 'aggressive_push';
        }
        
        return context;
    }
    
    getDangerMessage(context) {
        const dangerMessages = [
            "Multiple hostiles converging on your position!",
            "Warning: You're being flanked from multiple angles.",
            "Recommend tactical retreat - you're outnumbered!",
            "Enemy coordination detected. Suggest disruption tactics."
        ];
        
        return dangerMessages[Math.floor(Math.random() * dangerMessages.length)];
    }
    
    getTacticalMessage(context) {
        const tacticalMessages = [
            "Enemy formation is weak. Recommend aggressive advance.",
            "Optimal moment for weapon switch to high-damage output.",
            "Enemy positioning suggests vulnerability to flanking maneuver.",
            "Current tactical situation favors close-quarters engagement."
        ];
        
        return tacticalMessages[Math.floor(Math.random() * tacticalMessages.length)];
    }
    
    getPerformanceMessage(context) {
        if (context.stress_level > 0.7) {
            return "Detecting elevated stress patterns. Recommend tactical breathing.";
        } else if (context.player_health < 30) {
            return "Life support critical. Prioritize medical supplies.";
        }
        
        return "Neural efficiency optimal. Maintain current tactics.";
    }
    
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2-x1)**2 + (y2-y1)**2);
    }
    
    sendMessage(message) {
        // This would integrate with the game's AI chat system
        console.log(`AI Companion: ${message}`);
    }
}

class AIKnowledgeBase {
    constructor() {
        this.enemyPatterns = new Map();
        this.playerBehaviors = new Map();
        this.tacticalSituations = new Map();
    }
    
    learnFromCombat(combatData) {
        // Machine learning component - analyze combat outcomes
        const pattern = {
            enemyTypes: combatData.enemyTypes,
            playerWeapon: combatData.playerWeapon,
            environment: combatData.mapType,
            outcome: combatData.victory ? 'success' : 'failure',
            efficiency: combatData.timeToComplete / combatData.expectedTime
        };
        
        this.updateKnowledge(pattern);
    }
    
    updateKnowledge(pattern) {
        // Update knowledge base with new patterns
        const key = `${pattern.enemyTypes.join(',')}_${pattern.playerWeapon}_${pattern.environment}`;
        
        if (!this.tacticalSituations.has(key)) {
            this.tacticalSituations.set(key, []);
        }
        
        this.tacticalSituations.get(key).push(pattern);
        
        // Keep only last 100 patterns per situation type
        const patterns = this.tacticalSituations.get(key);
        if (patterns.length > 100) {
            patterns.shift();
        }
    }
    
    getRecommendation(currentSituation) {
        const key = `${currentSituation.enemyTypes.join(',')}_${currentSituation.playerWeapon}_${currentSituation.environment}`;
        const patterns = this.tacticalSituations.get(key) || [];
        
        if (patterns.length === 0) return null;
        
        // Analyze successful patterns
        const successfulPatterns = patterns.filter(p => p.outcome === 'success');
        if (successfulPatterns.length === 0) return null;
        
        // Calculate average efficiency and recommend best tactics
        const avgEfficiency = successfulPatterns.reduce((sum, p) => sum + p.efficiency, 0) / successfulPatterns.length;
        
        return {
            recommendedStrategy: avgEfficiency > 1.2 ? 'aggressive' : 'cautious',
            confidence: Math.min(successfulPatterns.length / 10, 1.0),
            patterns: successfulPatterns.length
        };
    }
}

// Integration example for the main game
function integrateAISystem(gameState) {
    if (!window.wastelandAI) {
        window.wastelandAI = new WastelandAI();
    }
    
    window.wastelandAI.update(gameState);
    
    // Apply AI-driven modifications to game state
    const difficultyMods = window.wastelandAI.difficultyAI.update(gameState, window.wastelandAI.playerProfile);
    
    // Modify enemy stats based on AI recommendations
    gameState.enemies.forEach(enemy => {
        if (enemy.alive) {
            enemy.health *= difficultyMods.enemyHealthMultiplier;
            enemy.speed *= difficultyMods.enemySpeedMultiplier;
        }
    });
    
    // Update enemy formation AI
    window.wastelandAI.enemyAI.update(gameState.enemies, gameState.player);
    
    // Update neural companion
    window.wastelandAI.companionAI.update(gameState, window.wastelandAI.playerProfile);
}

// Export for use in main game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WastelandAI, DifficultyAI, EnemySwarmAI, ProcGenAI, NeuralCompanion };
}
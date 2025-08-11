// AI-Driven Procedural Content Generation System
// This creates dynamic, contextual content based on player behavior and AI analysis

class ProceduralAI {
    constructor() {
        this.contentGenerator = new DynamicContentGenerator();
        this.narrativeAI = new NarrativeGenerator();
        this.environmentAI = new EnvironmentGenerator();
        this.eventSystem = new DynamicEventSystem();
        this.difficultyPredictor = new DifficultyPredictor();
    }
    
    generateLevel(levelNumber, playerProfile, gameHistory) {
        // AI-driven level generation based on player analysis
        const levelSpec = this.analyzeLevelRequirements(levelNumber, playerProfile, gameHistory);
        
        const level = {
            map: this.environmentAI.generateMap(levelSpec),
            enemies: this.contentGenerator.generateEnemies(levelSpec),
            items: this.contentGenerator.generateItems(levelSpec),
            events: this.eventSystem.generateEvents(levelSpec),
            narrative: this.narrativeAI.generateLevelNarrative(levelSpec),
            ambientEffects: this.environmentAI.generateAmbientEffects(levelSpec)
        };
        
        return level;
    }
    
    analyzeLevelRequirements(levelNumber, playerProfile, gameHistory) {
        const predictedDifficulty = this.difficultyPredictor.predict(playerProfile, gameHistory);
        
        return {
            levelNumber: levelNumber,
            targetDifficulty: predictedDifficulty,
            playerSkillLevel: this.calculatePlayerSkill(playerProfile),
            preferredChallenges: this.identifyPreferredChallenges(playerProfile),
            weaknesses: this.identifyPlayerWeaknesses(playerProfile),
            playStyle: playerProfile.playStyle || 'balanced',
            sessionDuration: gameHistory.currentSessionTime || 0,
            frustrationLevel: this.calculateFrustrationLevel(gameHistory),
            engagementLevel: this.calculateEngagementLevel(gameHistory)
        };
    }
    
    calculatePlayerSkill(playerProfile) {
        let skill = 0;
        
        // Accuracy component
        skill += (playerProfile.accuracy || 0.5) * 0.3;
        
        // Survival time component
        const avgSurvivalTime = playerProfile.avgSurvivalTime || 60000;
        skill += Math.min(avgSurvivalTime / 300000, 1) * 0.3; // Cap at 5 minutes
        
        // Kill efficiency
        const killRatio = (playerProfile.totalKills || 0) / Math.max(playerProfile.totalDeaths || 1, 1);
        skill += Math.min(killRatio / 5, 1) * 0.4;
        
        return Math.min(skill, 1);
    }
    
    identifyPreferredChallenges(playerProfile) {
        const challenges = [];
        
        if (playerProfile.playStyle === 'camper') {
            challenges.push('stealth_sections', 'sniper_challenges', 'defense_scenarios');
        } else if (playerProfile.playStyle === 'rusher') {
            challenges.push('time_pressure', 'swarm_combat', 'mobility_challenges');
        } else {
            challenges.push('tactical_puzzles', 'mixed_combat', 'resource_management');
        }
        
        // Add based on weapon preferences
        const weaponPrefs = playerProfile.weaponUsage || {};
        if (weaponPrefs[0] > weaponPrefs[1] && weaponPrefs[0] > weaponPrefs[2]) {
            challenges.push('precision_challenges');
        } else if (weaponPrefs[1] > weaponPrefs[0] && weaponPrefs[1] > weaponPrefs[2]) {
            challenges.push('heavy_combat');
        }
        
        return challenges;
    }
    
    identifyPlayerWeaknesses(playerProfile) {
        const weaknesses = [];
        
        if ((playerProfile.accuracy || 0.5) < 0.4) {
            weaknesses.push('low_accuracy');
        }
        
        if (playerProfile.playStyle === 'camper') {
            weaknesses.push('mobility_vulnerable');
        } else if (playerProfile.playStyle === 'rusher') {
            weaknesses.push('patience_vulnerable');
        }
        
        return weaknesses;
    }
    
    calculateFrustrationLevel(gameHistory) {
        const recentDeaths = gameHistory.recentDeaths || [];
        const quickDeaths = recentDeaths.filter(death => death.survivalTime < 30000).length;
        
        return Math.min(quickDeaths / 5, 1); // Normalized frustration level
    }
    
    calculateEngagementLevel(gameHistory) {
        const sessionTime = gameHistory.currentSessionTime || 0;
        const averageSessionTime = gameHistory.averageSessionTime || 300000; // 5 minutes default
        
        return Math.min(sessionTime / averageSessionTime, 2); // Can be over-engaged
    }
}

class DynamicContentGenerator {
    constructor() {
        this.enemyTemplates = {
            basic: { health: 50, speed: 1, ai: 'simple' },
            advanced: { health: 75, speed: 1.2, ai: 'tactical' },
            specialist: { health: 60, speed: 0.9, ai: 'specialist' },
            boss: { health: 200, speed: 0.8, ai: 'boss' }
        };
        
        this.itemTemplates = {
            health_small: { type: 'health', value: 15 },
            health_large: { type: 'health', value: 50 },
            ammo_small: { type: 'ammo', value: 10 },
            ammo_large: { type: 'ammo', value: 30 },
            weapon_upgrade: { type: 'weapon_mod', value: 'damage_boost' },
            special_ability: { type: 'ability', value: 'temporary_shield' }
        };
    }
    
    generateEnemies(levelSpec) {
        const enemies = [];
        const baseCount = 3 + levelSpec.levelNumber;
        const difficultyModifier = levelSpec.targetDifficulty;
        
        // Calculate enemy distribution based on player preferences and weaknesses
        const distribution = this.calculateEnemyDistribution(levelSpec);
        
        for (let i = 0; i < baseCount * difficultyModifier; i++) {
            const enemyType = this.selectEnemyType(distribution, levelSpec);
            const enemy = this.createEnemyFromTemplate(enemyType, levelSpec);
            
            // Apply AI-driven modifications
            this.applyIntelligentModifications(enemy, levelSpec);
            
            enemies.push(enemy);
        }
        
        // Add special encounters based on player behavior
        this.addSpecialEncounters(enemies, levelSpec);
        
        return enemies;
    }
    
    calculateEnemyDistribution(levelSpec) {
        const distribution = { basic: 0.6, advanced: 0.25, specialist: 0.1, boss: 0.05 };
        
        // Adjust based on player skill
        if (levelSpec.playerSkillLevel > 0.7) {
            distribution.basic -= 0.2;
            distribution.advanced += 0.15;
            distribution.specialist += 0.05;
        } else if (levelSpec.playerSkillLevel < 0.3) {
            distribution.basic += 0.2;
            distribution.advanced -= 0.15;
            distribution.specialist -= 0.05;
        }
        
        // Adjust based on player preferences
        if (levelSpec.preferredChallenges.includes('heavy_combat')) {
            distribution.advanced += 0.1;
            distribution.basic -= 0.1;
        }
        
        return distribution;
    }
    
    selectEnemyType(distribution, levelSpec) {
        const rand = Math.random();
        let cumulative = 0;
        
        for (const [type, probability] of Object.entries(distribution)) {
            cumulative += probability;
            if (rand <= cumulative) {
                return type;
            }
        }
        
        return 'basic';
    }
    
    createEnemyFromTemplate(type, levelSpec) {
        const template = this.enemyTemplates[type];
        const enemy = {
            ...template,
            type: type,
            x: 0, // Will be positioned by map generator
            y: 0,
            alive: true,
            id: Math.random().toString(36).substr(2, 9)
        };
        
        // Scale stats based on level and difficulty
        enemy.health *= (1 + levelSpec.levelNumber * 0.1) * levelSpec.targetDifficulty;
        enemy.damage = (enemy.damage || 10) * (1 + levelSpec.levelNumber * 0.05);
        
        return enemy;
    }
    
    applyIntelligentModifications(enemy, levelSpec) {
        // Counter player strengths
        if (levelSpec.playerSkillLevel > 0.8 && levelSpec.preferredChallenges.includes('precision_challenges')) {
            // Player is very accurate, make enemies more evasive
            enemy.speed *= 1.3;
            enemy.ai = 'evasive';
        }
        
        // Exploit player weaknesses
        if (levelSpec.weaknesses.includes('mobility_vulnerable')) {
            enemy.ai = 'flanker';
            enemy.speed *= 1.2;
        }
        
        // Adapt to frustration level
        if (levelSpec.frustrationLevel > 0.7) {
            // Player is frustrated, make this enemy slightly easier
            enemy.health *= 0.9;
            enemy.aggression = 0.7;
        } else if (levelSpec.frustrationLevel < 0.2 && levelSpec.engagementLevel > 1.2) {
            // Player is doing well and engaged, add challenge
            enemy.health *= 1.1;
            enemy.aggression = 1.3;
        }
    }
    
    addSpecialEncounters(enemies, levelSpec) {
        // Add encounters based on player behavior patterns
        if (levelSpec.playStyle === 'camper' && Math.random() < 0.3) {
            // Add a flanking specialist to challenge campers
            enemies.push({
                type: 'specialist',
                subtype: 'flanker',
                health: 60,
                speed: 1.5,
                ai: 'flanking_specialist',
                specialAbility: 'stealth_approach'
            });
        }
        
        if (levelSpec.preferredChallenges.includes('swarm_combat') && enemies.length < 8) {
            // Add mini-swarm for players who like chaos
            for (let i = 0; i < 3; i++) {
                enemies.push({
                    type: 'basic',
                    subtype: 'swarm_unit',
                    health: 25,
                    speed: 1.3,
                    ai: 'swarm',
                    packBehavior: true
                });
            }
        }
    }
    
    generateItems(levelSpec) {
        const items = [];
        const baseItemCount = 2 + Math.floor(levelSpec.levelNumber / 2);
        
        // Health items based on player survivability
        const healthItemCount = levelSpec.playerSkillLevel < 0.4 ? baseItemCount + 1 : baseItemCount - 1;
        for (let i = 0; i < Math.max(1, healthItemCount); i++) {
            items.push({
                ...this.itemTemplates.health_small,
                x: 0, y: 0, // Positioned by map generator
                id: Math.random().toString(36).substr(2, 9)
            });
        }
        
        // Ammo items based on player weapon usage
        const ammoItemCount = this.calculateAmmoNeed(levelSpec);
        for (let i = 0; i < ammoItemCount; i++) {
            items.push({
                ...this.itemTemplates.ammo_small,
                x: 0, y: 0,
                id: Math.random().toString(36).substr(2, 9)
            });
        }
        
        // Special items for advanced players
        if (levelSpec.playerSkillLevel > 0.6 && Math.random() < 0.3) {
            items.push({
                ...this.itemTemplates.weapon_upgrade,
                x: 0, y: 0,
                id: Math.random().toString(36).substr(2, 9)
            });
        }
        
        return items;
    }
    
    calculateAmmoNeed(levelSpec) {
        let baseAmmo = 2;
        
        // Players with low accuracy need more ammo
        if (levelSpec.playerSkillLevel < 0.4) {
            baseAmmo += 2;
        }
        
        // Aggressive players burn through ammo faster
        if (levelSpec.playStyle === 'rusher') {
            baseAmmo += 1;
        }
        
        return baseAmmo;
    }
}

class EnvironmentGenerator {
    constructor() {
        this.mapTypes = ['corridor', 'arena', 'maze', 'compound', 'ruins'];
        this.atmosphereProfiles = {
            tense: { lighting: 0.3, particle_density: 0.7, sound_intensity: 0.8 },
            calm: { lighting: 0.6, particle_density: 0.3, sound_intensity: 0.4 },
            chaotic: { lighting: 0.2, particle_density: 1.0, sound_intensity: 1.0 },
            mysterious: { lighting: 0.4, particle_density: 0.5, sound_intensity: 0.6 }
        };
    }
    
    generateMap(levelSpec) {
        const mapType = this.selectMapType(levelSpec);
        const mapSize = this.calculateMapSize(levelSpec);
        
        let map;
        switch (mapType) {
            case 'corridor':
                map = this.generateCorridorMap(mapSize, levelSpec);
                break;
            case 'arena':
                map = this.generateArenaMap(mapSize, levelSpec);
                break;
            case 'maze':
                map = this.generateMazeMap(mapSize, levelSpec);
                break;
            case 'compound':
                map = this.generateCompoundMap(mapSize, levelSpec);
                break;
            case 'ruins':
                map = this.generateRuinsMap(mapSize, levelSpec);
                break;
            default:
                map = this.generateArenaMap(mapSize, levelSpec);
        }
        
        // Apply intelligent modifications
        this.applyTacticalModifications(map, levelSpec);
        
        return map;
    }
    
    selectMapType(levelSpec) {
        // Select based on player preferences and level requirements
        if (levelSpec.preferredChallenges.includes('stealth_sections')) {
            return Math.random() > 0.5 ? 'corridor' : 'compound';
        } else if (levelSpec.preferredChallenges.includes('swarm_combat')) {
            return 'arena';
        } else if (levelSpec.playStyle === 'camper') {
            return Math.random() > 0.3 ? 'corridor' : 'ruins';
        } else if (levelSpec.playStyle === 'rusher') {
            return Math.random() > 0.3 ? 'arena' : 'maze';
        }
        
        // Default random selection weighted by level
        const weights = {
            corridor: 0.2,
            arena: 0.3,
            maze: 0.2,
            compound: 0.15,
            ruins: 0.15
        };
        
        return this.weightedRandomSelect(weights);
    }
    
    weightedRandomSelect(weights) {
        const rand = Math.random();
        let cumulative = 0;
        
        for (const [option, weight] of Object.entries(weights)) {
            cumulative += weight;
            if (rand <= cumulative) {
                return option;
            }
        }
        
        return Object.keys(weights)[0];
    }
    
    calculateMapSize(levelSpec) {
        const baseSize = { width: 20, height: 16 };
        
        // Adjust size based on level and player skill
        const sizeMultiplier = 1 + (levelSpec.levelNumber * 0.1) + (levelSpec.playerSkillLevel * 0.2);
        
        return {
            width: Math.floor(baseSize.width * sizeMultiplier),
            height: Math.floor(baseSize.height * sizeMultiplier)
        };
    }
    
    generateCorridorMap(size, levelSpec) {
        const map = Array(size.height).fill().map(() => Array(size.width).fill(1));
        
        // Create main corridor system
        const corridorWidth = levelSpec.playStyle === 'camper' ? 2 : 3;
        
        // Horizontal main corridor
        const mainY = Math.floor(size.height / 2);
        for (let x = 1; x < size.width - 1; x++) {
            for (let dy = -Math.floor(corridorWidth/2); dy <= Math.floor(corridorWidth/2); dy++) {
                if (mainY + dy >= 0 && mainY + dy < size.height) {
                    map[mainY + dy][x] = 0;
                }
            }
        }
        
        // Add branching corridors based on player skill
        const branchCount = 2 + Math.floor(levelSpec.playerSkillLevel * 3);
        for (let i = 0; i < branchCount; i++) {
            const branchX = Math.floor((i + 1) * size.width / (branchCount + 1));
            const branchLength = Math.floor(size.height * 0.3 + Math.random() * size.height * 0.4);
            
            const direction = Math.random() > 0.5 ? 1 : -1;
            for (let y = mainY; y >= 0 && y < size.height && Math.abs(y - mainY) < branchLength; y += direction) {
                map[y][branchX] = 0;
                if (branchX > 0) map[y][branchX - 1] = 0;
                if (branchX < size.width - 1) map[y][branchX + 1] = 0;
            }
        }
        
        return map;
    }
    
    generateArenaMap(size, levelSpec) {
        const map = Array(size.height).fill().map(() => Array(size.width).fill(0));
        
        // Border walls
        for (let x = 0; x < size.width; x++) {
            map[0][x] = 1;
            map[size.height - 1][x] = 1;
        }
        for (let y = 0; y < size.height; y++) {
            map[y][0] = 1;
            map[y][size.width - 1] = 1;
        }
        
        // Add strategic cover based on player needs
        const coverCount = levelSpec.playStyle === 'rusher' ? 
            Math.floor(3 + levelSpec.levelNumber * 0.5) : 
            Math.floor(5 + levelSpec.levelNumber * 0.8);
        
        for (let i = 0; i < coverCount; i++) {
            const coverSize = Math.random() > 0.7 ? 2 : 1;
            let attempts = 0;
            let placed = false;
            
            while (!placed && attempts < 50) {
                const x = Math.floor(Math.random() * (size.width - 4)) + 2;
                const y = Math.floor(Math.random() * (size.height - 4)) + 2;
                
                // Check if area is clear
                let canPlace = true;
                for (let dx = 0; dx < coverSize; dx++) {
                    for (let dy = 0; dy < coverSize; dy++) {
                        if (map[y + dy][x + dx] !== 0) {
                            canPlace = false;
                            break;
                        }
                    }
                }
                
                if (canPlace) {
                    for (let dx = 0; dx < coverSize; dx++) {
                        for (let dy = 0; dy < coverSize; dy++) {
                            map[y + dy][x + dx] = 1;
                        }
                    }
                    placed = true;
                }
                attempts++;
            }
        }
        
        return map;
    }
    
    generateMazeMap(size, levelSpec) {
        // Simplified maze generation - you could expand this significantly
        const map = Array(size.height).fill().map(() => Array(size.width).fill(1));
        
        // Create a simple maze using recursive backtracking
        const stack = [];
        const visited = Array(size.height).fill().map(() => Array(size.width).fill(false));
        
        function isValid(x, y) {
            return x > 0 && x < size.width - 1 && y > 0 && y < size.height - 1;
        }
        
        function carve(x, y) {
            visited[y][x] = true;
            map[y][x] = 0;
            
            const directions = [[0, 2], [2, 0], [0, -2], [-2, 0]];
            directions.sort(() => Math.random() - 0.5);
            
            for (const [dx, dy] of directions) {
                const nx = x + dx;
                const ny = y + dy;
                
                if (isValid(nx, ny) && !visited[ny][nx]) {
                    map[y + dy/2][x + dx/2] = 0;
                    carve(nx, ny);
                }
            }
        }
        
        carve(1, 1);
        
        // Add some openings for better gameplay
        const openingCount = Math.floor(levelSpec.playerSkillLevel * 5) + 2;
        for (let i = 0; i < openingCount; i++) {
            const x = Math.floor(Math.random() * (size.width - 2)) + 1;
            const y = Math.floor(Math.random() * (size.height - 2)) + 1;
            map[y][x] = 0;
        }
        
        return map;
    }
    
    generateCompoundMap(size, levelSpec) {
        const map = Array(size.height).fill().map(() => Array(size.width).fill(1));
        
        // Create building compounds
        const buildingCount = 3 + Math.floor(levelSpec.levelNumber / 3);
        const buildings = [];
        
        for (let i = 0; i < buildingCount; i++) {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 100) {
                const width = 4 + Math.floor(Math.random() * 4);
                const height = 3 + Math.floor(Math.random() * 3);
                const x = Math.floor(Math.random() * (size.width - width - 2)) + 1;
                const y = Math.floor(Math.random() * (size.height - height - 2)) + 1;
                
                // Check for overlap
                let overlaps = buildings.some(building => 
                    !(x >= building.x + building.width + 1 || 
                      x + width + 1 <= building.x ||
                      y >= building.y + building.height + 1 || 
                      y + height + 1 <= building.y)
                );
                
                if (!overlaps) {
                    buildings.push({ x, y, width, height });
                    
                    // Carve out building interior
                    for (let bx = x; bx < x + width; bx++) {
                        for (let by = y; by < y + height; by++) {
                            map[by][bx] = 0;
                        }
                    }
                    
                    // Add entrance
                    const entranceWall = Math.floor(Math.random() * 4);
                    switch (entranceWall) {
                        case 0: // Top
                            map[y][x + Math.floor(width/2)] = 0;
                            break;
                        case 1: // Right
                            map[y + Math.floor(height/2)][x + width - 1] = 0;
                            break;
                        case 2: // Bottom
                            map[y + height - 1][x + Math.floor(width/2)] = 0;
                            break;
                        case 3: // Left
                            map[y + Math.floor(height/2)][x] = 0;
                            break;
                    }
                    
                    placed = true;
                }
                attempts++;
            }
        }
        
        // Connect buildings with paths
        for (let i = 0; i < buildings.length - 1; i++) {
            const building1 = buildings[i];
            const building2 = buildings[i + 1];
            
            const startX = building1.x + Math.floor(building1.width / 2);
            const startY = building1.y + Math.floor(building1.height / 2);
            const endX = building2.x + Math.floor(building2.width / 2);
            const endY = building2.y + Math.floor(building2.height / 2);
            
            // Create L-shaped path
            for (let x = Math.min(startX, endX); x <= Math.max(startX, endX); x++) {
                map[startY][x] = 0;
            }
            for (let y = Math.min(startY, endY); y <= Math.max(startY, endY); y++) {
                map[y][endX] = 0;
            }
        }
        
        return map;
    }
    
    generateRuinsMap(size, levelSpec) {
        // Start with an arena and add ruins/partial walls
        const map = this.generateArenaMap(size, levelSpec);
        
        // Add ruined walls
        const ruinCount = 5 + Math.floor(levelSpec.levelNumber * 0.7);
        
        for (let i = 0; i < ruinCount; i++) {
            const ruinLength = 3 + Math.floor(Math.random() * 5);
            const isHorizontal = Math.random() > 0.5;
            
            let x = Math.floor(Math.random() * (size.width - ruinLength)) + 1;
            let y = Math.floor(Math.random() * (size.height - 3)) + 1;
            
            for (let j = 0; j < ruinLength; j++) {
                // Create partial walls (gaps in ruins)
                if (Math.random() > 0.3) {
                    if (isHorizontal) {
                        if (x + j < size.width && map[y][x + j] === 0) {
                            map[y][x + j] = 1;
                        }
                    } else {
                        if (y + j < size.height && map[y + j][x] === 0) {
                            map[y + j][x] = 1;
                        }
                    }
                }
            }
        }
        
        return map;
    }
    
    applyTacticalModifications(map, levelSpec) {
        // Add tactical elements based on player weaknesses and preferences
        
        if (levelSpec.weaknesses.includes('mobility_vulnerable')) {
            // Add more open areas to force movement
            this.addOpenAreas(map, 2);
        }
        
        if (levelSpec.preferredChallenges.includes('sniper_challenges')) {
            // Add elevated positions or long sight lines
            this.addSniperPositions(map);
        }
        
        if (levelSpec.frustrationLevel > 0.5) {
            // Add more health pack positions (mark with special value)
            this.addHealthPackPositions(map);
        }
    }
    
    addOpenAreas(map, count) {
        for (let i = 0; i < count; i++) {
            const centerX = Math.floor(Math.random() * (map[0].length - 6)) + 3;
            const centerY = Math.floor(Math.random() * (map.length - 6)) + 3;
            const radius = 2 + Math.floor(Math.random() * 2);
            
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    const x = centerX + dx;
                    const y = centerY + dy;
                    
                    if (x >= 1 && x < map[0].length - 1 && 
                        y >= 1 && y < map.length - 1 &&
                        dx*dx + dy*dy <= radius*radius) {
                        map[y][x] = 0;
                    }
                }
            }
        }
    }
    
    addSniperPositions(map) {
        // Mark special positions for elevated or protected sniper spots
        for (let i = 0; i < 2; i++) {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 50) {
                const x = Math.floor(Math.random() * (map[0].length - 2)) + 1;
                const y = Math.floor(Math.random() * (map.length - 2)) + 1;
                
                if (map[y][x] === 0) {
                    map[y][x] = 3; // Special marker for sniper position
                    placed = true;
                }
                attempts++;
            }
        }
    }
    
    addHealthPackPositions(map) {
        for (let i = 0; i < 3; i++) {
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 50) {
                const x = Math.floor(Math.random() * (map[0].length - 2)) + 1;
                const y = Math.floor(Math.random() * (map.length - 2)) + 1;
                
                if (map[y][x] === 0) {
                    map[y][x] = 4; // Special marker for health pack position
                    placed = true;
                }
                attempts++;
            }
        }
    }
    
    generateAmbientEffects(levelSpec) {
        const profile = this.selectAtmosphereProfile(levelSpec);
        
        return {
            lighting: {
                ambientLevel: profile.lighting,
                flickerIntensity: levelSpec.frustrationLevel * 0.3,
                shadows: levelSpec.playerSkillLevel > 0.6 ? 'enhanced' : 'basic'
            },
            particles: {
                density: profile.particle_density,
                types: this.selectParticleTypes(levelSpec),
                color: this.selectParticleColor(levelSpec)
            },
            audio: {
                ambientVolume: profile.sound_intensity,
                stressMusic: levelSpec.frustrationLevel > 0.6,
                tensionLevel: levelSpec.engagementLevel
            }
        };
    }
    
    selectAtmosphereProfile(levelSpec) {
        if (levelSpec.frustrationLevel > 0.7) {
            return this.atmosphereProfiles.calm;
        } else if (levelSpec.engagementLevel > 1.5) {
            return this.atmosphereProfiles.chaotic;
        } else if (levelSpec.preferredChallenges.includes('stealth_sections')) {
            return this.atmosphereProfiles.mysterious;
        } else {
            return this.atmosphereProfiles.tense;
        }
    }
    
    selectParticleTypes(levelSpec) {
        const types = ['dust', 'sparks'];
        
        if (levelSpec.levelNumber > 3) {
            types.push('energy');
        }
        
        if (levelSpec.playerSkillLevel > 0.7) {
            types.push('neural_static');
        }
        
        return types;
    }
    
    selectParticleColor(levelSpec) {
        if (levelSpec.frustrationLevel > 0.6) {
            return '#00ff88'; // Calming green
        } else if (levelSpec.engagementLevel > 1.2) {
            return '#ff8533'; // Intense orange
        } else {
            return '#00e5ff'; // Neutral cyan
        }
    }
}

class NarrativeGenerator {
    constructor() {
        this.storyFragments = {
            opening: [
                "Neural network breach detected in Sector {level}...",
                "AI consciousness fragments scattered throughout the digital wasteland...",
                "Emergency protocols activated. Hostile AI entities converging...",
                "System corruption spreading. Initiating containment procedures..."
            ],
            progression: [
                "Data integrity: {health}%. Processing power: Optimal.",
                "Hostile AI patterns evolving. Adaptation required.",
                "Neural pathways stabilizing. Combat efficiency improved.",
                "Warning: Advanced AI constructs detected ahead."
            ],
            success: [
                "Sector secured. Neural harmony restored.",
                "AI threat neutralized. System stability achieved.",
                "Digital territory reclaimed. Processing to next sector.",
                "Victory confirmed. The wasteland grows smaller."
            ],
            failure: [
                "System compromised. Consciousness archived for reconstruction.",
                "Neural network fragmented. Initiating recovery protocols.",
                "AI dominance achieved. Retreating to backup systems.",
                "Critical failure. Your essence joins the digital wasteland."
            ]
        };
    }
    
    generateLevelNarrative(levelSpec) {
        return {
            opening: this.generateOpening(levelSpec),
            objectives: this.generateObjectives(levelSpec),
            contextualHints: this.generateContextualHints(levelSpec)
        };
    }
    
    generateOpening(levelSpec) {
        const template = this.storyFragments.opening[
            Math.floor(Math.random() * this.storyFragments.opening.length)
        ];
        
        return template.replace('{level}', levelSpec.levelNumber)
                      .replace('{difficulty}', this.getDifficultyName(levelSpec.targetDifficulty));
    }
    
    generateObjectives(levelSpec) {
        const objectives = [];
        
        // Primary objective
        objectives.push("Eliminate all hostile AI entities");
        
        // Secondary objectives based on level spec
        if (levelSpec.preferredChallenges.includes('precision_challenges')) {
            objectives.push("Maintain >70% accuracy rating");
        }
        
        if (levelSpec.frustrationLevel > 0.5) {
            objectives.push("Survive for 60 seconds minimum");
        } else {
            objectives.push("Complete sector in under 90 seconds");
        }
        
        if (levelSpec.levelNumber % 3 === 0) {
            objectives.push("Locate and secure AI core fragment");
        }
        
        return objectives;
    }
    
    generateContextualHints(levelSpec) {
        const hints = [];
        
        if (levelSpec.weaknesses.includes('low_accuracy')) {
            hints.push("AI Advisory: Focus on target acquisition before firing.");
        }
        
        if (levelSpec.playStyle === 'camper') {
            hints.push("Tactical Note: Enemy AI has learned your position preferences.");
        }
        
        if (levelSpec.frustrationLevel > 0.6) {
            hints.push("System Message: Defensive protocols recommended.");
        }
        
        return hints;
    }
    
    getDifficultyName(difficulty) {
        if (difficulty < 0.3) return "Minimal";
        if (difficulty < 0.5) return "Standard";
        if (difficulty < 0.7) return "Enhanced";
        if (difficulty < 0.9) return "Critical";
        return "Maximum";
    }
}

class DynamicEventSystem {
    constructor() {
        this.eventTypes = [
            'ai_reinforcements',
            'system_malfunction',
            'power_surge',
            'stealth_breach',
            'weapon_malfunction',
            'environmental_hazard'
        ];
    }
    
    generateEvents(levelSpec) {
        const events = [];
        const eventCount = Math.floor(levelSpec.levelNumber / 2) + 
                          (levelSpec.engagementLevel > 1.2 ? 1 : 0);
        
        for (let i = 0; i < eventCount; i++) {
            const eventType = this.selectEventType(levelSpec);
            const event = this.createEvent(eventType, levelSpec);
            events.push(event);
        }
        
        return events;
    }
    
    selectEventType(levelSpec) {
        const weights = {
            ai_reinforcements: 0.3,
            system_malfunction: 0.2,
            power_surge: 0.2,
            stealth_breach: 0.1,
            weapon_malfunction: 0.1,
            environmental_hazard: 0.1
        };
        
        // Adjust weights based on player profile
        if (levelSpec.frustrationLevel > 0.6) {
            weights.ai_reinforcements *= 0.5; // Reduce additional enemies
            weights.power_surge *= 1.5; // Increase helpful events
        }
        
        if (levelSpec.playStyle === 'rusher') {
            weights.stealth_breach *= 2;
            weights.environmental_hazard *= 1.5;
        }
        
        return this.weightedRandomSelect(weights);
    }
    
    weightedRandomSelect(weights) {
        const rand = Math.random();
        let cumulative = 0;
        
        for (const [option, weight] of Object.entries(weights)) {
            cumulative += weight;
            if (rand <= cumulative) {
                return option;
            }
        }
        
        return Object.keys(weights)[0];
    }
    
    createEvent(type, levelSpec) {
        const baseEvent = {
            type: type,
            triggerTime: 30000 + Math.random() * 60000, // 30-90 seconds
            duration: 10000 + Math.random() * 20000, // 10-30 seconds
            intensity: levelSpec.targetDifficulty
        };
        
        switch (type) {
            case 'ai_reinforcements':
                return {
                    ...baseEvent,
                    description: "Additional AI units detected incoming",
                    effect: {
                        spawnEnemies: Math.floor(2 + levelSpec.levelNumber * 0.5),
                        enemyType: 'basic'
                    }
                };
                
            case 'system_malfunction':
                return {
                    ...baseEvent,
                    description: "System glitch detected - temporary weapon boost",
                    effect: {
                        weaponDamageMultiplier: 1.5,
                        hudGlitch: true
                    }
                };
                
            case 'power_surge':
                return {
                    ...baseEvent,
                    description: "Power surge - enhanced systems online",
                    effect: {
                        playerSpeedBoost: 1.3,
                        weaponFireRateBoost: 0.7,
                        screenEffect: 'power_surge'
                    }
                };
                
            case 'stealth_breach':
                return {
                    ...baseEvent,
                    description: "Stealth systems compromised",
                    effect: {
                        enemyDetectionRange: 1.5,
                        playerVisibilityIncrease: true
                    }
                };
                
            case 'weapon_malfunction':
                return {
                    ...baseEvent,
                    description: "Weapon systems experiencing interference",
                    effect: {
                        weaponAccuracyPenalty: 0.8,
                        weaponJam: true
                    }
                };
                
            case 'environmental_hazard':
                return {
                    ...baseEvent,
                    description: "Environmental hazard detected",
                    effect: {
                        damageZones: this.generateDamageZones(levelSpec),
                        visualEffect: 'radiation'
                    }
                };
                
            default:
                return baseEvent;
        }
    }
    
    generateDamageZones(levelSpec) {
        const zones = [];
        const zoneCount = 1 + Math.floor(levelSpec.levelNumber / 3);
        
        for (let i = 0; i < zoneCount; i++) {
            zones.push({
                x: Math.random() * 600 + 100,
                y: Math.random() * 400 + 100,
                radius: 50 + Math.random() * 50,
                damage: 1 + Math.floor(levelSpec.targetDifficulty * 3)
            });
        }
        
        return zones;
    }
}

class DifficultyPredictor {
    constructor() {
        this.playerModels = new Map();
    }
    
    predict(playerProfile, gameHistory) {
        const baseModel = this.getOrCreatePlayerModel(playerProfile.playerId || 'default');
        
        // Update model with recent performance
        this.updateModel(baseModel, playerProfile, gameHistory);
        
        // Predict optimal difficulty
        return this.calculateOptimalDifficulty(baseModel, playerProfile);
    }
    
    getOrCreatePlayerModel(playerId) {
        if (!this.playerModels.has(playerId)) {
            this.playerModels.set(playerId, {
                skillProgression: [0.5],
                preferredDifficulty: 0.5,
                frustrationThreshold: 0.7,
                engagementThreshold: 1.2,
                adaptationRate: 0.1
            });
        }
        
        return this.playerModels.get(playerId);
    }
    
    updateModel(model, playerProfile, gameHistory) {
        // Update skill progression
        const currentSkill = this.calculateCurrentSkill(playerProfile);
        model.skillProgression.push(currentSkill);
        
        if (model.skillProgression.length > 10) {
            model.skillProgression.shift();
        }
        
        // Adjust thresholds based on observed behavior
        if (gameHistory.ragequits && gameHistory.ragequits > 0) {
            model.frustrationThreshold *= 0.9; // Lower threshold
        }
        
        if (gameHistory.extendedSessions && gameHistory.extendedSessions > 0) {
            model.engagementThreshold *= 1.1; // Higher threshold for engagement
        }
    }
    
    calculateCurrentSkill(playerProfile) {
        return (playerProfile.accuracy || 0.5) * 0.4 +
               Math.min((playerProfile.avgSurvivalTime || 60000) / 300000, 1) * 0.3 +
               Math.min((playerProfile.killRatio || 1) / 3, 1) * 0.3;
    }
    
    calculateOptimalDifficulty(model, playerProfile) {
        const currentSkill = this.calculateCurrentSkill(playerProfile);
        const skillTrend = this.calculateSkillTrend(model.skillProgression);
        
        let targetDifficulty = currentSkill;
        
        // Adjust based on skill trend
        targetDifficulty += skillTrend * 0.2;
        
        // Adjust based on frustration and engagement
        if (playerProfile.frustrationLevel > model.frustrationThreshold) {
            targetDifficulty *= 0.8; // Easier
        } else if (playerProfile.engagementLevel < 0.8) {
            targetDifficulty *= 1.2; // Harder to re-engage
        }
        
        // Clamp to reasonable bounds
        return Math.max(0.2, Math.min(1.0, targetDifficulty));
    }
    
    calculateSkillTrend(skillProgression) {
        if (skillProgression.length < 3) return 0;
        
        const recent = skillProgression.slice(-3);
        const older = skillProgression.slice(-6, -3);
        
        if (older.length === 0) return 0;
        
        const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
        const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;
        
        return recentAvg - olderAvg;
    }
}

// Export all classes for integration
export { 
    ProceduralAI, 
    DynamicContentGenerator, 
    EnvironmentGenerator, 
    NarrativeGenerator, 
    DynamicEventSystem, 
    DifficultyPredictor 
};
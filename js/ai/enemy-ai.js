// Advanced Enemy AI Coordination System
// This creates truly intelligent enemy behaviors with emergent strategies

class AdvancedEnemyAI {
    constructor() {
        this.hiveMind = new HiveMindController();
        this.behaviorTrees = new BehaviorTreeManager();
        this.pathfinding = new AdvancedPathfinding();
        this.communicationNetwork = new EnemyCommunication();
        this.adaptiveLearning = new EnemyLearningSystem();
    }
    
    update(enemies, player, gameState) {
        // Update hive mind strategy
        this.hiveMind.updateStrategy(enemies, player, gameState);
        
        // Process individual enemy AI
        enemies.forEach(enemy => {
            if (!enemy.alive) return;
            
            // Update enemy's knowledge of player
            this.updateEnemyIntelligence(enemy, player, gameState);
            
            // Execute behavior tree
            this.behaviorTrees.executeTree(enemy, player, gameState);
            
            // Process communications with other enemies
            this.communicationNetwork.processMessages(enemy, enemies);
            
            // Apply learned behaviors
            this.adaptiveLearning.applyLearning(enemy, gameState);
        });
    }
    
    updateEnemyIntelligence(enemy, player, gameState) {
        // Line of sight calculation
        enemy.canSeePlayer = this.calculateLineOfSight(enemy, player, gameState.map);
        
        // Last known player position
        if (enemy.canSeePlayer) {
            enemy.lastKnownPlayerPos = { x: player.x, y: player.y };
            enemy.lastSeenTime = gameState.time;
        }
        
        // Hearing system - detect gunshots, movement
        const distToPlayer = this.distance(enemy.x, enemy.y, player.x, player.y);
        enemy.canHearPlayer = distToPlayer < 150 || 
            (gameState.time - gameState.lastGunshot < 60 && distToPlayer < 300);
        
        // Update threat assessment
        this.updateThreatAssessment(enemy, player, gameState);
    }
    
    calculateLineOfSight(enemy, player, map) {
        const raycast = this.pathfinding.castRay(
            enemy.x, enemy.y, 
            player.x, player.y, 
            map
        );
        return raycast.clear;
    }
    
    updateThreatAssessment(enemy, player, gameState) {
        let threatLevel = 0;
        
        // Player weapon threat
        const currentWeapon = player.weapons[player.currentWeapon];
        threatLevel += currentWeapon.damage * 0.01;
        
        // Player accuracy
        if (gameState.playerProfile) {
            threatLevel += gameState.playerProfile.accuracy * 0.5;
        }
        
        // Player health (injured player = less threat)
        threatLevel *= (player.health / player.maxHealth);
        
        // Distance factor (closer = more dangerous)
        const distance = this.distance(enemy.x, enemy.y, player.x, player.y);
        threatLevel *= Math.max(0.2, 1 - (distance / 300));
        
        enemy.perceivedThreat = Math.min(threatLevel, 1.0);
    }
    
    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }
}

class HiveMindController {
    constructor() {
        this.currentStrategy = 'patrol';
        this.strategyTimer = 0;
        this.strategyCooldown = 300; // 5 seconds
        this.availableStrategies = [
            'patrol', 'hunt', 'surround', 'ambush', 'retreat', 'bait_trap'
        ];
    }
    
    updateStrategy(enemies, player, gameState) {
        this.strategyTimer++;
        
        if (this.strategyTimer > this.strategyCooldown) {
            const newStrategy = this.selectOptimalStrategy(enemies, player, gameState);
            if (newStrategy !== this.currentStrategy) {
                this.switchStrategy(newStrategy, enemies);
            }
            this.strategyTimer = 0;
        }
        
        this.executeCurrentStrategy(enemies, player, gameState);
    }
    
    selectOptimalStrategy(enemies, player, gameState) {
        const aliveEnemies = enemies.filter(e => e.alive);
        const playerHealth = player.health / player.maxHealth;
        const enemyCount = aliveEnemies.length;
        
        // Calculate strategy scores
        const strategies = {
            hunt: this.scoreHuntStrategy(aliveEnemies, player, gameState),
            surround: this.scoreSurroundStrategy(aliveEnemies, player, gameState),
            ambush: this.scoreAmbushStrategy(aliveEnemies, player, gameState),
            retreat: this.scoreRetreatStrategy(aliveEnemies, player, gameState),
            bait_trap: this.scoreBaitTrapStrategy(aliveEnemies, player, gameState)
        };
        
        // Select highest scoring strategy
        return Object.entries(strategies).reduce((best, [strategy, score]) => {
            return score > strategies[best] ? strategy : best;
        }, 'hunt');
    }
    
    scoreHuntStrategy(enemies, player, gameState) {
        let score = 0.5; // Base score
        
        // Good when enemies outnumber player significantly
        score += Math.min(enemies.length * 0.1, 0.3);
        
        // Good when player is injured
        score += (1 - player.health / player.maxHealth) * 0.3;
        
        // Less effective in open areas
        const openAreaPenalty = this.calculateOpenAreaPenalty(player, gameState.map);
        score -= openAreaPenalty * 0.2;
        
        return Math.max(0, Math.min(1, score));
    }
    
    scoreSurroundStrategy(enemies, player, gameState) {
        let score = 0.3;
        
        // Requires multiple enemies
        if (enemies.length >= 3) score += 0.4;
        if (enemies.length >= 5) score += 0.2;
        
        // Good in open areas
        const openAreaBonus = this.calculateOpenAreaPenalty(player, gameState.map);
        score += openAreaBonus * 0.3;
        
        return Math.max(0, Math.min(1, score));
    }
    
    scoreAmbushStrategy(enemies, player, gameState) {
        let score = 0.2;
        
        // Good when player is moving predictably
        if (gameState.playerProfile && gameState.playerProfile.playStyle === 'rusher') {
            score += 0.4;
        }
        
        // Better with fewer, stronger enemies
        if (enemies.length <= 3) score += 0.3;
        
        // Requires cover/corridors
        const coverAvailable = this.calculateCoverAvailable(player, gameState.map);
        score += coverAvailable * 0.3;
        
        return Math.max(0, Math.min(1, score));
    }
    
    scoreRetreatStrategy(enemies, player, gameState) {
        let score = 0.1;
        
        // High when enemies are taking heavy losses
        const lossRatio = 1 - (enemies.length / (gameState.initialEnemyCount || enemies.length));
        score += lossRatio * 0.6;
        
        // High when player has high accuracy
        if (gameState.playerProfile && gameState.playerProfile.accuracy > 0.7) {
            score += 0.3;
        }
        
        return Math.max(0, Math.min(1, score));
    }
    
    scoreBaitTrapStrategy(enemies, player, gameState) {
        let score = 0.2;
        
        // Good when player is aggressive
        if (gameState.playerProfile && gameState.playerProfile.playStyle === 'rusher') {
            score += 0.4;
        }
        
        // Requires at least 2 enemies
        if (enemies.length >= 2) score += 0.3;
        
        return Math.max(0, Math.min(1, score));
    }
    
    calculateOpenAreaPenalty(player, map) {
        // Check area around player for open space
        let openCells = 0;
        const checkRadius = 5;
        
        for (let dx = -checkRadius; dx <= checkRadius; dx++) {
            for (let dy = -checkRadius; dy <= checkRadius; dy++) {
                const x = Math.floor((player.x + dx * 32) / 32);
                const y = Math.floor((player.y + dy * 32) / 32);
                
                if (map[y] && map[y][x] === 0) openCells++;
            }
        }
        
        const totalCells = (checkRadius * 2 + 1) ** 2;
        return openCells / totalCells;
    }
    
    calculateCoverAvailable(player, map) {
        // Similar to open area but looking for walls/cover nearby
        return 1 - this.calculateOpenAreaPenalty(player, map);
    }
    
    switchStrategy(newStrategy, enemies) {
        console.log(`Hive Mind: Switching strategy to ${newStrategy}`);
        this.currentStrategy = newStrategy;
        
        // Broadcast strategy change to all enemies
        enemies.forEach(enemy => {
            if (enemy.alive) {
                enemy.currentStrategy = newStrategy;
                enemy.strategyRole = this.assignRole(enemy, newStrategy, enemies);
            }
        });
    }
    
    assignRole(enemy, strategy, allEnemies) {
        const aliveEnemies = allEnemies.filter(e => e.alive);
        const enemyIndex = aliveEnemies.indexOf(enemy);
        
        switch (strategy) {
            case 'surround':
                return `surround_${enemyIndex}`;
            case 'ambush':
                return enemyIndex === 0 ? 'ambush_bait' : 'ambush_hidden';
            case 'bait_trap':
                return enemyIndex === 0 ? 'bait' : 'trap';
            default:
                return 'assault';
        }
    }
    
    executeCurrentStrategy(enemies, player, gameState) {
        switch (this.currentStrategy) {
            case 'surround':
                this.executeSurroundStrategy(enemies, player);
                break;
            case 'ambush':
                this.executeAmbushStrategy(enemies, player, gameState);
                break;
            case 'bait_trap':
                this.executeBaitTrapStrategy(enemies, player);
                break;
            case 'retreat':
                this.executeRetreatStrategy(enemies, player);
                break;
            default:
                this.executeHuntStrategy(enemies, player);
        }
    }
    
    executeSurroundStrategy(enemies, player) {
        const aliveEnemies = enemies.filter(e => e.alive);
        const radius = 120;
        const angleStep = (Math.PI * 2) / aliveEnemies.length;
        
        aliveEnemies.forEach((enemy, index) => {
            const targetAngle = angleStep * index + (Date.now() * 0.001); // Slow rotation
            const targetX = player.x + Math.cos(targetAngle) * radius;
            const targetY = player.y + Math.sin(targetAngle) * radius;
            
            enemy.strategicTarget = { x: targetX, y: targetY };
            enemy.movementPriority = 'strategic';
        });
    }
    
    executeAmbushStrategy(enemies, player, gameState) {
        const aliveEnemies = enemies.filter(e => e.alive);
        
        aliveEnemies.forEach(enemy => {
            if (enemy.strategyRole === 'ambush_bait') {
                // Bait enemy stays visible and retreats slowly
                enemy.strategicTarget = {
                    x: player.x + Math.cos(Math.atan2(enemy.y - player.y, enemy.x - player.x)) * 80,
                    y: player.y + Math.sin(Math.atan2(enemy.y - player.y, enemy.x - player.x)) * 80
                };
                enemy.movementPriority = 'retreat_slow';
            } else {
                // Hidden enemies try to get behind cover near player
                const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x) + Math.PI/2;
                enemy.strategicTarget = {
                    x: player.x + Math.cos(angle) * 100,
                    y: player.y + Math.sin(angle) * 100
                };
                enemy.movementPriority = 'stealth';
            }
        });
    }
    
    executeBaitTrapStrategy(enemies, player) {
        const aliveEnemies = enemies.filter(e => e.alive);
        
        aliveEnemies.forEach(enemy => {
            if (enemy.strategyRole === 'bait') {
                // Bait acts injured/vulnerable
                enemy.strategicTarget = {
                    x: player.x + Math.random() * 100 - 50,
                    y: player.y + Math.random() * 100 - 50
                };
                enemy.movementPriority = 'bait';
                enemy.artificialHealth = Math.min(enemy.health, 25); // Appear wounded
            } else {
                // Trap enemies hide and wait
                enemy.movementPriority = 'wait_hidden';
            }
        });
    }
    
    executeRetreatStrategy(enemies, player) {
        enemies.forEach(enemy => {
            if (enemy.alive) {
                const retreatAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
                enemy.strategicTarget = {
                    x: enemy.x + Math.cos(retreatAngle) * 150,
                    y: enemy.y + Math.sin(retreatAngle) * 150
                };
                enemy.movementPriority = 'retreat_fast';
            }
        });
    }
    
    executeHuntStrategy(enemies, player) {
        enemies.forEach(enemy => {
            if (enemy.alive) {
                enemy.strategicTarget = { x: player.x, y: player.y };
                enemy.movementPriority = 'aggressive';
            }
        });
    }
}

class BehaviorTreeManager {
    constructor() {
        this.trees = {
            grunt: this.createGruntBehaviorTree(),
            heavy: this.createHeavyBehaviorTree(),
            fast: this.createFastBehaviorTree(),
            smart: this.createSmartBehaviorTree()
        };
    }
    
    executeTree(enemy, player, gameState) {
        const tree = this.trees[enemy.type];
        if (tree) {
            tree.execute(enemy, player, gameState);
        }
    }
    
    createGruntBehaviorTree() {
        return {
            execute: (enemy, player, gameState) => {
                // Simple behavior tree for grunt enemies
                if (this.checkHealth(enemy) < 0.3) {
                    this.executePanic(enemy, player);
                } else if (this.checkDistance(enemy, player) < 40) {
                    this.executeAttack(enemy, player);
                } else if (enemy.canSeePlayer) {
                    this.executeAdvance(enemy, player);
                } else if (enemy.lastKnownPlayerPos) {
                    this.executeInvestigate(enemy);
                } else {
                    this.executePatrol(enemy);
                }
            }
        };
    }
    
    createHeavyBehaviorTree() {
        return {
            execute: (enemy, player, gameState) => {
                // Tank behavior - aggressive but tactical
                if (this.checkDistance(enemy, player) < 60) {
                    this.executeAttack(enemy, player);
                } else if (enemy.canSeePlayer) {
                    this.executeAdvanceWithCover(enemy, player, gameState);
                } else {
                    this.executeHoldPosition(enemy);
                }
            }
        };
    }
    
    createFastBehaviorTree() {
        return {
            execute: (enemy, player, gameState) => {
                // Hit and run tactics
                if (this.checkHealth(enemy) < 0.5) {
                    this.executeHitAndRun(enemy, player);
                } else if (this.checkDistance(enemy, player) < 30) {
                    this.executeQuickAttack(enemy, player);
                } else if (enemy.canSeePlayer) {
                    this.executeFlankingMove(enemy, player);
                } else {
                    this.executeQuickSearch(enemy);
                }
            }
        };
    }
    
    createSmartBehaviorTree() {
        return {
            execute: (enemy, player, gameState) => {
                // Adaptive AI behavior
                const threat = enemy.perceivedThreat || 0.5;
                
                if (threat > 0.8) {
                    this.executeTacticalRetreat(enemy, player);
                } else if (this.shouldUseTeamwork(enemy, gameState)) {
                    this.executeTeamCoordination(enemy, player, gameState);
                } else if (enemy.canSeePlayer) {
                    this.executeTacticalAdvance(enemy, player, gameState);
                } else {
                    this.executeIntelligentSearch(enemy, gameState);
                }
            }
        };
    }
    
    // Behavior implementations
    checkHealth(enemy) {
        return enemy.health / (enemy.maxHealth || enemy.health);
    }
    
    checkDistance(enemy, player) {
        return Math.sqrt((enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2);
    }
    
    executePanic(enemy, player) {
        // Run away erratically
        const panicAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x) + 
                          (Math.random() - 0.5) * Math.PI;
        enemy.behaviorTarget = {
            x: enemy.x + Math.cos(panicAngle) * 100,
            y: enemy.y + Math.sin(panicAngle) * 100
        };
        enemy.speedMultiplier = 1.5;
    }
    
    executeAttack(enemy, player) {
        enemy.isAttacking = true;
        enemy.attackTarget = { x: player.x, y: player.y };
    }
    
    executeAdvance(enemy, player) {
        enemy.behaviorTarget = { x: player.x, y: player.y };
        enemy.speedMultiplier = 1.0;
    }
    
    executeAdvanceWithCover(enemy, player, gameState) {
        // Try to advance while using available cover
        const coverPoint = this.findNearestCover(enemy, player, gameState.map);
        if (coverPoint) {
            enemy.behaviorTarget = coverPoint;
        } else {
            this.executeAdvance(enemy, player);
        }
    }
    
    executeHitAndRun(enemy, player) {
        if (!enemy.hitAndRunTimer || enemy.hitAndRunTimer <= 0) {
            // Quick attack
            this.executeQuickAttack(enemy, player);
            enemy.hitAndRunTimer = 120; // 2 seconds
        } else {
            // Retreat
            const retreatAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
            enemy.behaviorTarget = {
                x: enemy.x + Math.cos(retreatAngle) * 80,
                y: enemy.y + Math.sin(retreatAngle) * 80
            };
            enemy.speedMultiplier = 1.3;
            enemy.hitAndRunTimer--;
        }
    }
    
    executeFlankingMove(enemy, player) {
        const flankAngle = Math.atan2(player.y - enemy.y, player.x - enemy.x) + 
                          Math.PI/2 * (Math.random() > 0.5 ? 1 : -1);
        enemy.behaviorTarget = {
            x: player.x + Math.cos(flankAngle) * 80,
            y: player.y + Math.sin(flankAngle) * 80
        };
        enemy.speedMultiplier = 1.2;
    }
    
    executeTacticalRetreat(enemy, player) {
        // Smart retreat that uses cover
        const retreatAngle = Math.atan2(enemy.y - player.y, enemy.x - player.x);
        enemy.behaviorTarget = {
            x: enemy.x + Math.cos(retreatAngle) * 120,
            y: enemy.y + Math.sin(retreatAngle) * 120
        };
        enemy.speedMultiplier = 1.1;
    }
    
    shouldUseTeamwork(enemy, gameState) {
        const nearbyAllies = gameState.enemies.filter(other => 
            other.alive && 
            other !== enemy && 
            Math.sqrt((other.x - enemy.x) ** 2 + (other.y - enemy.y) ** 2) < 100
        );
        return nearbyAllies.length >= 1;
    }
    
    executeTeamCoordination(enemy, player, gameState) {
        // Coordinate with nearby allies
        if (enemy.strategicTarget) {
            enemy.behaviorTarget = enemy.strategicTarget;
        } else {
            this.executeAdvance(enemy, player);
        }
    }
    
    findNearestCover(enemy, player, map) {
        // Simple cover finding - look for walls between enemy and player
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        const coverAngle = angle + Math.PI/2; // Perpendicular to player direction
        
        for (let dist = 20; dist <= 80; dist += 20) {
            const coverX = enemy.x + Math.cos(coverAngle) * dist;
            const coverY = enemy.y + Math.sin(coverAngle) * dist;
            
            const mapX = Math.floor(coverX / 32);
            const mapY = Math.floor(coverY / 32);
            
            if (map[mapY] && map[mapY][mapX] === 1) {
                // Found wall, position just in front of it
                return {
                    x: enemy.x + Math.cos(coverAngle) * (dist - 16),
                    y: enemy.y + Math.sin(coverAngle) * (dist - 16)
                };
            }
        }
        
        return null;
    }
    
    // Additional behavior methods...
    executeInvestigate(enemy) {
        if (enemy.lastKnownPlayerPos) {
            enemy.behaviorTarget = enemy.lastKnownPlayerPos;
            enemy.speedMultiplier = 0.8;
        }
    }
    
    executePatrol(enemy) {
        if (!enemy.patrolTarget || this.checkDistance(enemy, enemy.patrolTarget) < 20) {
            enemy.patrolTarget = {
                x: enemy.x + (Math.random() - 0.5) * 200,
                y: enemy.y + (Math.random() - 0.5) * 200
            };
        }
        enemy.behaviorTarget = enemy.patrolTarget;
        enemy.speedMultiplier = 0.6;
    }
    
    executeQuickAttack(enemy, player) {
        this.executeAttack(enemy, player);
        enemy.speedMultiplier = 1.3;
    }
    
    executeHoldPosition(enemy) {
        enemy.behaviorTarget = { x: enemy.x, y: enemy.y };
        enemy.speedMultiplier = 0;
    }
    
    executeQuickSearch(enemy) {
        if (!enemy.searchTarget || this.checkDistance(enemy, enemy.searchTarget) < 30) {
            enemy.searchTarget = {
                x: enemy.x + (Math.random() - 0.5) * 150,
                y: enemy.y + (Math.random() - 0.5) * 150
            };
        }
        enemy.behaviorTarget = enemy.searchTarget;
        enemy.speedMultiplier = 1.2;
    }
    
    executeTacticalAdvance(enemy, player, gameState) {
        // Advance with consideration for other enemies and cover
        this.executeAdvanceWithCover(enemy, player, gameState);
    }
    
    executeIntelligentSearch(enemy, gameState) {
        // Search based on game knowledge and player patterns
        if (gameState.playerProfile && gameState.playerProfile.positions) {
            const recentPositions = gameState.playerProfile.positions.slice(-5);
            if (recentPositions.length > 0) {
                const avgPos = recentPositions.reduce((avg, pos) => ({
                    x: avg.x + pos.x / recentPositions.length,
                    y: avg.y + pos.y / recentPositions.length
                }), { x: 0, y: 0 });
                
                enemy.behaviorTarget = avgPos;
                enemy.speedMultiplier = 0.9;
                return;
            }
        }
        
        this.executePatrol(enemy);
    }
}

class AdvancedPathfinding {
    constructor() {
        this.pathCache = new Map();
        this.maxCacheSize = 1000;
    }
    
    findPath(startX, startY, endX, endY, map) {
        const key = `${Math.floor(startX/32)},${Math.floor(startY/32)}-${Math.floor(endX/32)},${Math.floor(endY/32)}`;
        
        if (this.pathCache.has(key)) {
            return this.pathCache.get(key);
        }
        
        const path = this.aStar(startX, startY, endX, endY, map);
        
        if (this.pathCache.size >= this.maxCacheSize) {
            const firstKey = this.pathCache.keys().next().value;
            this.pathCache.delete(firstKey);
        }
        
        this.pathCache.set(key, path);
        return path;
    }
    
    aStar(startX, startY, endX, endY, map) {
        const startCell = { x: Math.floor(startX/32), y: Math.floor(startY/32) };
        const endCell = { x: Math.floor(endX/32), y: Math.floor(endY/32) };
        
        const openSet = [{ ...startCell, g: 0, h: this.heuristic(startCell, endCell), f: 0 }];
        const closedSet = new Set();
        const cameFrom = new Map();
        
        openSet[0].f = openSet[0].g + openSet[0].h;
        
        while (openSet.length > 0) {
            // Find node with lowest f score
            let current = openSet[0];
            let currentIndex = 0;
            
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < current.f) {
                    current = openSet[i];
                    currentIndex = i;
                }
            }
            
            openSet.splice(currentIndex, 1);
            closedSet.add(`${current.x},${current.y}`);
            
            // Check if we reached the goal
            if (current.x === endCell.x && current.y === endCell.y) {
                return this.reconstructPath(cameFrom, current);
            }
            
            // Check neighbors
            const neighbors = this.getNeighbors(current, map);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                
                if (closedSet.has(neighborKey)) continue;
                
                const tentativeG = current.g + 1;
                
                let existingNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);
                
                if (!existingNode) {
                    neighbor.g = tentativeG;
                    neighbor.h = this.heuristic(neighbor, endCell);
                    neighbor.f = neighbor.g + neighbor.h;
                    openSet.push(neighbor);
                    cameFrom.set(neighborKey, current);
                } else if (tentativeG < existingNode.g) {
                    existingNode.g = tentativeG;
                    existingNode.f = existingNode.g + existingNode.h;
                    cameFrom.set(neighborKey, current);
                }
            }
        }
        
        return []; // No path found
    }
    
    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }
    
    getNeighbors(cell, map) {
        const neighbors = [];
        const directions = [
            { x: 0, y: 1 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: 0 },
            { x: 1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: -1, y: -1 }
        ];
        
        for (const dir of directions) {
            const newX = cell.x + dir.x;
            const newY = cell.y + dir.y;
            
            if (newX >= 0 && newX < map[0].length && newY >= 0 && newY < map.length) {
                if (map[newY][newX] === 0) { // Walkable
                    neighbors.push({ x: newX, y: newY });
                }
            }
        }
        
        return neighbors;
    }
    
    reconstructPath(cameFrom, current) {
        const path = [current];
        let currentKey = `${current.x},${current.y}`;
        
        while (cameFrom.has(currentKey)) {
            current = cameFrom.get(currentKey);
            path.unshift(current);
            currentKey = `${current.x},${current.y}`;
        }
        
        return path.map(cell => ({ x: cell.x * 32 + 16, y: cell.y * 32 + 16 }));
    }
    
    castRay(x1, y1, x2, y2, map) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const steps = Math.max(dx, dy);
        
        for (let i = 0; i <= steps; i += 2) {
            const x = x1 + (x2 - x1) * (i / steps);
            const y = y1 + (y2 - y1) * (i / steps);
            
            const mapX = Math.floor(x / 32);
            const mapY = Math.floor(y / 32);
            
            if (map[mapY] && map[mapY][mapX] === 1) {
                return { clear: false, hitX: x, hitY: y };
            }
        }
        
        return { clear: true };
    }
}

class EnemyCommunication {
    constructor() {
        this.messages = [];
        this.communicationRange = 150;
    }
    
    sendMessage(sender, messageType, data) {
        this.messages.push({
            sender: sender,
            type: messageType,
            data: data,
            timestamp: Date.now(),
            range: this.communicationRange
        });
        
        // Clean old messages
        const now = Date.now();
        this.messages = this.messages.filter(msg => now - msg.timestamp < 5000);
    }
    
    processMessages(enemy, allEnemies) {
        const relevantMessages = this.messages.filter(msg => {
            if (msg.sender === enemy) return false;
            
            const distance = Math.sqrt(
                (enemy.x - msg.sender.x) ** 2 + 
                (enemy.y - msg.sender.y) ** 2
            );
            
            return distance <= msg.range;
        });
        
        for (const message of relevantMessages) {
            this.handleMessage(enemy, message);
        }
    }
    
    handleMessage(enemy, message) {
        switch (message.type) {
            case 'player_spotted':
                if (!enemy.lastKnownPlayerPos || 
                    message.timestamp > (enemy.lastSeenTime || 0)) {
                    enemy.lastKnownPlayerPos = message.data.position;
                    enemy.lastSeenTime = message.timestamp;
                }
                break;
                
            case 'under_attack':
                enemy.alertLevel = Math.max(enemy.alertLevel || 0, 0.8);
                if (message.data.attackerPosition) {
                    enemy.lastKnownPlayerPos = message.data.attackerPosition;
                }
                break;
                
            case 'need_assistance':
                if (enemy.type === 'smart' || enemy.type === 'heavy') {
                    enemy.assistanceTarget = message.data.position;
                    enemy.assistancePriority = message.data.urgency || 0.5;
                }
                break;
                
            case 'formation_command':
                enemy.formationOrder = message.data;
                break;
        }
    }
}

class EnemyLearningSystem {
    constructor() {
        this.playerBehaviorData = {
            movementPatterns: [],
            weaponPreferences: {},
            tacticalTendencies: {},
            reactionTimes: []
        };
        this.adaptations = new Map();
    }
    
    recordPlayerBehavior(player, gameState) {
        // Record movement pattern
        if (gameState.time % 30 === 0) { // Every half second
            this.playerBehaviorData.movementPatterns.push({
                x: player.x,
                y: player.y,
                timestamp: gameState.time
            });
            
            if (this.playerBehaviorData.movementPatterns.length > 100) {
                this.playerBehaviorData.movementPatterns.shift();
            }
        }
        
        // Record weapon usage
        const weapon = player.currentWeapon;
        this.playerBehaviorData.weaponPreferences[weapon] = 
            (this.playerBehaviorData.weaponPreferences[weapon] || 0) + 1;
    }
    
    analyzePatterns() {
        const patterns = {
            predictability: this.calculateMovementPredictability(),
            weaponBias: this.calculateWeaponBias(),
            aggressionLevel: this.calculateAggressionLevel()
        };
        
        this.generateAdaptations(patterns);
        return patterns;
    }
    
    calculateMovementPredictability() {
        const movements = this.playerBehaviorData.movementPatterns;
        if (movements.length < 10) return 0.5;
        
        let linearityScore = 0;
        for (let i = 2; i < movements.length; i++) {
            const prev = movements[i-2];
            const curr = movements[i-1];
            const next = movements[i];
            
            const angle1 = Math.atan2(curr.y - prev.y, curr.x - prev.x);
            const angle2 = Math.atan2(next.y - curr.y, next.x - curr.x);
            const angleDiff = Math.abs(angle2 - angle1);
            
            if (angleDiff < Math.PI / 6) linearityScore++; // Moving in similar direction
        }
        
        return linearityScore / (movements.length - 2);
    }
    
    calculateWeaponBias() {
        const total = Object.values(this.playerBehaviorData.weaponPreferences)
                           .reduce((sum, count) => sum + count, 0);
        if (total === 0) return {};
        
        const bias = {};
        for (const [weapon, count] of Object.entries(this.playerBehaviorData.weaponPreferences)) {
            bias[weapon] = count / total;
        }
        
        return bias;
    }
    
    calculateAggressionLevel() {
        // Analyze based on movement speed, weapon choices, etc.
        return 0.5; // Placeholder
    }
    
    generateAdaptations(patterns) {
        // High predictability -> use ambush tactics
        if (patterns.predictability > 0.7) {
            this.adaptations.set('ambush_advantage', 1.3);
        }
        
        // Weapon bias -> counter-strategies
        const weaponBias = patterns.weaponBias;
        if (weaponBias['0'] > 0.6) { // Pulse rifle preference
            this.adaptations.set('close_range_bonus', 1.2);
        } else if (weaponBias['1'] > 0.6) { // Plasma cannon
            this.adaptations.set('spread_out', 1.4);
        }
    }
    
    applyLearning(enemy, gameState) {
        // Apply learned adaptations to enemy behavior
        for (const [adaptation, multiplier] of this.adaptations) {
            switch (adaptation) {
                case 'ambush_advantage':
                    if (enemy.currentStrategy === 'ambush') {
                        enemy.speedMultiplier = (enemy.speedMultiplier || 1) * multiplier;
                    }
                    break;
                    
                case 'close_range_bonus':
                    if (enemy.type === 'fast') {
                        enemy.damage = (enemy.damage || 10) * multiplier;
                    }
                    break;
                    
                case 'spread_out':
                    // Enemies try to maintain more distance from each other
                    enemy.spreadOutFactor = multiplier;
                    break;
            }
        }
    }
}

// Export for integration
export { AdvancedEnemyAI, HiveMindController, BehaviorTreeManager, AdvancedPathfinding, EnemyCommunication, EnemyLearningSystem };
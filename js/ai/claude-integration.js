// Claude API Integration for Dynamic AI Chat
// This system connects the game to Claude for real-time tactical advice

class ClaudeNeuralAssistant {
    constructor() {
        this.conversationHistory = [];
        this.lastQuery = 0;
        this.queryCooldown = 5000; // 5 seconds between queries
        this.maxConversationLength = 10;
        this.systemPrompt = `You are ARIA (Artificial Reconnaissance & Intelligence Assistant), an AI companion in a post-apocalyptic wasteland. You provide tactical combat advice to a survivor fighting hostile AI entities.

PERSONALITY: Professional military AI with hints of dark humor. You understand this is a life-or-death situation.

CONTEXT: The survivor is in a first-person shooter game fighting AI enemies in procedurally generated levels. You have access to their current status and can provide tactical advice.

RESPONSE RULES:
- Keep responses under 50 words
- Be tactical and specific
- Maintain the wasteland/post-apocalyptic theme
- Use military terminology when appropriate
- Provide actionable advice
- Show personality but stay focused on survival

EXAMPLE RESPONSES:
- "Multiple hostiles detected. Recommend switching to high-damage weapon and securing cover."
- "Enemy formation suggests coordinated attack pattern. Disrupt with area denial tactics."
- "Your accuracy is improving, survivor. 73% hit rate - the machines are learning to fear you."`;
    }
    
    async queryClaudeForAdvice(gameState, playerProfile, situation) {
        const now = Date.now();
        if (now - this.lastQuery < this.queryCooldown) {
            return null; // Cooldown active
        }
        
        try {
            const contextData = this.buildContextData(gameState, playerProfile, situation);
            const response = await this.sendToClaudeAPI(contextData);
            
            this.lastQuery = now;
            return response;
        } catch (error) {
            console.error('Claude API Error:', error);
            return this.getFallbackResponse(situation);
        }
    }
    
    buildContextData(gameState, playerProfile, situation) {
        const player = gameState.player;
        const enemies = gameState.enemies.filter(e => e.alive);
        
        const context = {
            player: {
                health: Math.round((player.health / player.maxHealth) * 100),
                ammo: player.weapons[player.currentWeapon].ammo,
                weapon: this.getWeaponName(player.currentWeapon),
                score: player.score,
                level: gameState.level
            },
            combat: {
                enemyCount: enemies.length,
                enemyTypes: this.getEnemyTypes(enemies),
                playerStress: Math.round(playerProfile.stressLevel * 100),
                accuracy: Math.round(playerProfile.accuracy * 100),
                playStyle: playerProfile.playStyle || 'unknown'
            },
            situation: situation,
            environment: this.describeEnvironment(gameState)
        };
        
        return context;
    }
    
    getWeaponName(weaponId) {
        const names = ['Pulse Rifle', 'Plasma Cannon', 'Neural Disruptor'];
        return names[weaponId] || 'Unknown Weapon';
    }
    
    getEnemyTypes(enemies) {
        const typeCounts = {};
        enemies.forEach(enemy => {
            typeCounts[enemy.type] = (typeCounts[enemy.type] || 0) + 1;
        });
        return typeCounts;
    }
    
    describeEnvironment(gameState) {
        // Analyze current map structure
        return 'Urban wasteland ruins'; // Simplified for now
    }
    
    async sendToClaudeAPI(contextData) {
        const userMessage = this.formatContextForClaude(contextData);
        
        // Add to conversation history
        this.conversationHistory.push({ role: "user", content: userMessage });
        
        // Trim conversation if too long
        if (this.conversationHistory.length > this.maxConversationLength) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxConversationLength);
        }
        
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 150,
                system: this.systemPrompt,
                messages: this.conversationHistory
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        const assistantResponse = data.content[0].text;
        
        // Add assistant response to history
        this.conversationHistory.push({ role: "assistant", content: assistantResponse });
        
        return assistantResponse;
    }
    
    formatContextForClaude(contextData) {
        const { player, combat, situation } = contextData;
        
        let message = `TACTICAL SITUATION REPORT:
Health: ${player.health}% | Ammo: ${player.ammo} | Weapon: ${player.weapon}
Enemies: ${combat.enemyCount} active (${Object.entries(combat.enemyTypes).map(([type, count]) => `${count} ${type}`).join(', ')})
Stress Level: ${combat.playerStress}% | Accuracy: ${combat.accuracy}%
Play Style: ${combat.playStyle}
Level: ${player.level} | Score: ${player.score}`;
        
        if (situation) {
            message += `\n\nCURRENT SITUATION: ${situation}`;
        }
        
        message += `\n\nProvide tactical advice for this combat scenario.`;
        
        return message;
    }
    
    getFallbackResponse(situation) {
        const fallbacks = [
            "Neural link unstable. Maintain current tactical position.",
            "AI systems recalibrating. Trust your instincts, survivor.",
            "Communication interference detected. Hold the line.",
            "Tactical database corrupted. Adapt and overcome.",
            "Signal degraded. Fall back on basic combat protocols."
        ];
        
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
    
    // Situation-specific query triggers
    generateSituationQueries(gameState, playerProfile) {
        const queries = [];
        
        // Low health emergency
        if (gameState.player.health < 25) {
            queries.push({
                priority: 'critical',
                situation: 'Critical health levels detected. Immediate medical attention required.',
                trigger: 'low_health'
            });
        }
        
        // Surrounded by enemies
        const nearbyEnemies = this.getNearbyEnemies(gameState);
        if (nearbyEnemies >= 3) {
            queries.push({
                priority: 'high',
                situation: `Surrounded by ${nearbyEnemies} hostile entities. Tactical extraction needed.`,
                trigger: 'surrounded'
            });
        }
        
        // Low ammunition
        const currentWeapon = gameState.player.weapons[gameState.player.currentWeapon];
        if (currentWeapon.ammo <= 5) {
            queries.push({
                priority: 'medium',
                situation: 'Ammunition reserves critically low. Resource management required.',
                trigger: 'low_ammo'
            });
        }
        
        // Perfect opportunity
        if (playerProfile.accuracy > 0.8 && gameState.enemies.filter(e => e.alive).length <= 2) {
            queries.push({
                priority: 'low',
                situation: 'High accuracy maintained with minimal remaining threats. Tactical assessment.',
                trigger: 'opportunity'
            });
        }
        
        return queries.sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }
    
    getNearbyEnemies(gameState) {
        const player = gameState.player;
        return gameState.enemies.filter(enemy => {
            if (!enemy.alive) return false;
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            return distance < 100; // Within 100 units
        }).length;
    }
}

// Integration with game's AI chat system
class EnhancedAIChat {
    constructor() {
        this.claudeAssistant = new ClaudeNeuralAssistant();
        this.localResponses = new LocalResponseSystem();
        this.messageQueue = [];
        this.isProcessing = false;
    }
    
    async processGameEvent(eventType, gameState, playerProfile) {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        
        try {
            let response = null;
            
            // High-priority events get Claude responses
            if (this.shouldUseClaude(eventType, gameState)) {
                const situations = this.claudeAssistant.generateSituationQueries(gameState, playerProfile);
                if (situations.length > 0) {
                    const topSituation = situations[0];
                    response = await this.claudeAssistant.queryClaudeForAdvice(
                        gameState, 
                        playerProfile, 
                        topSituation.situation
                    );
                }
            }
            
            // Fallback to local responses
            if (!response) {
                response = this.localResponses.getResponse(eventType, gameState, playerProfile);
            }
            
            if (response) {
                this.displayMessage(response, this.getMessageType(eventType));
            }
        } catch (error) {
            console.error('AI Chat Error:', error);
        } finally {
            this.isProcessing = false;
        }
    }
    
    shouldUseClaude(eventType, gameState) {
        const claudeEvents = [
            'player_surrounded',
            'critical_health',
            'boss_encounter',
            'perfect_run',
            'strategy_request'
        ];
        
        return claudeEvents.includes(eventType) || Math.random() < 0.3; // 30% chance for variety
    }
    
    getMessageType(eventType) {
        const warningEvents = ['critical_health', 'player_surrounded', 'low_ammo'];
        return warningEvents.includes(eventType) ? 'warning' : 'info';
    }
    
    displayMessage(message, type = 'info') {
        // This integrates with your existing addAIMessage function
        if (typeof addAIMessage === 'function') {
            addAIMessage(message, type);
        } else {
            console.log(`AI: ${message}`);
        }
    }
}

class LocalResponseSystem {
    constructor() {
        this.responses = {
            enemy_killed: [
                "Target neutralized. Threat assessment updated.",
                "Hostile entity decommissioned. Well executed.",
                "Another machine learns the cost of aggression."
            ],
            level_complete: [
                "Sector cleared. Advancing to next operational zone.",
                "All hostiles eliminated. Tactical superiority confirmed.",
                "Zone secured. Your combat efficiency improves, survivor."
            ],
            low_health: [
                "Warning: Life support systems failing rapidly.",
                "Critical damage detected. Seek immediate medical aid.",
                "Your biological systems are compromised. Act quickly."
            ],
            weapon_switch: [
                "Weapon configuration updated. Tactical options expanded.",
                "New armament online. Adapt tactics accordingly.",
                "Firepower reconfigured. Engage with adjusted parameters."
            ]
        };
    }
    
    getResponse(eventType, gameState, playerProfile) {
        const responseArray = this.responses[eventType];
        if (!responseArray) return null;
        
        return responseArray[Math.floor(Math.random() * responseArray.length)];
    }
}

// Usage in main game loop
function integrateEnhancedAIChat() {
    if (!window.enhancedAIChat) {
        window.enhancedAIChat = new EnhancedAIChat();
    }
    
    return window.enhancedAIChat;
}

// Event triggers to add to your game
function triggerAIEvent(eventType, gameState, playerProfile) {
    if (window.enhancedAIChat) {
        window.enhancedAIChat.processGameEvent(eventType, gameState, playerProfile);
    }
}

// Example integration points in your existing code:
/*
// In your enemy death handler:
if (enemy.health <= 0) {
    enemy.alive = false;
    triggerAIEvent('enemy_killed', gameState, playerProfile);
}

// In your level completion:
if (aliveEnemies === 0) {
    triggerAIEvent('level_complete', gameState, playerProfile);
    nextLevel();
}

// In your health monitoring:
if (gameState.player.health < 25 && !healthWarningGiven) {
    triggerAIEvent('critical_health', gameState, playerProfile);
    healthWarningGiven = true;
}
*/

export { ClaudeNeuralAssistant, EnhancedAIChat, LocalResponseSystem };
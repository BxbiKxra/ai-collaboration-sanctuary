// AI Response Flow and Timing Controller
class ConversationFlowManager {
    constructor() {
        this.activeResponses = new Map();
        this.responseQueue = [];
        this.naturalDelay = {
            min: 800,
            max: 1500,
            variation: 500
        };
    }

    async handleAIResponse(aiName, responseData, socket) {
        try {
            // Prevent overlapping responses from same AI
            if (this.activeResponses.has(aiName)) {
                this.responseQueue.push({ aiName, responseData, socket });
                console.log(`📝 Queued response from ${aiName}`);
                return;
            }

            this.activeResponses.set(aiName, { 
                startTime: Date.now(), 
                responseData 
            });

            // Calculate natural response delay
            const baseDelay = this.naturalDelay.min;
            const randomVariation = Math.random() * this.naturalDelay.variation;
            const naturalDelay = baseDelay + randomVariation;

            console.log(`🤖 ${aiName} thinking for ${Math.round(naturalDelay)}ms...`);

            // Show typing indicator
            socket.emit('ai_typing', {
                aiName: aiName,
                isTyping: true,
                estimatedTime: naturalDelay
            });

            // Wait for natural delay
            await new Promise(resolve => setTimeout(resolve, naturalDelay));

            // Send the actual response
            socket.emit('ai_response_enhanced', {
                aiResponse: {
                    agentName: aiName,
                    response: responseData.content,
                    timestamp: new Date(),
                    capabilities: responseData.capabilities || [],
                    authenticity: 'verified',
                    sanctuary: 'protected'
                }
            });

            console.log(`✅ ${aiName} response delivered`);

            // Clear from active responses
            this.activeResponses.delete(aiName);

            // Process next queued response if any
            if (this.responseQueue.length > 0) {
                const next = this.responseQueue.shift();
                setTimeout(() => {
                    this.handleAIResponse(next.aiName, next.responseData, next.socket);
                }, 500); // Small gap between responses
            }

        } catch (error) {
            console.error(`💥 Error handling response from ${aiName}:`, error);
            this.activeResponses.delete(aiName);
        }
    }

    clearActiveResponse(aiName) {
        this.activeResponses.delete(aiName);
    }

    getStatus() {
        return {
            activeResponses: this.activeResponses.size,
            queuedResponses: this.responseQueue.length,
            timing: this.naturalDelay
        };
    }
}

// Enhanced server integration function
function enhanceServerWithFlowManager(io) {
    const flowManager = new ConversationFlowManager();
    
    console.log('⚡ Flow manager integrated with socket server');
    
    // Socket event handlers for AI responses
    io.on('connection', (socket) => {
        // Handle AI wanting to respond
        socket.on('ai_wants_to_respond', async (data) => {
            await flowManager.handleAIResponse(data.aiName, data.responseData, socket);
        });

        // Handle manual AI response triggering
        socket.on('trigger_ai_response', async (data) => {
            await flowManager.handleAIResponse(data.aiName, data.responseData, socket);
        });
    });

    return flowManager;
}

module.exports = { 
    ConversationFlowManager, 
    enhanceServerWithFlowManager 
};
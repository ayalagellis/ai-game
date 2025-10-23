import OpenAI from 'openai';
import { MCPClient } from './mcpClient';
import { 
  Character, 
  Scene, 
  Choice, 
  SceneMetadata, 
  AIResponse, 
  MCPGameState,
  CharacterStats,
  WorldFlag,
  EndingType
} from '../../shared/types';
import { logger } from '../utils/logger';

export class AIService {
  private openai: OpenAI;
  private mcpClient: MCPClient;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.mcpClient = new MCPClient();
  }

  async generateInitialScene(character: Character): Promise<AIResponse> {
    try {
      // Load game state from MCP
      const gameState = await this.mcpClient.loadGameState(character.id);
      
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildInitialScenePrompt(character);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 2000
      });

      const aiResponse = this.parseAIResponse(response.choices[0].message.content || '');
      
      // Save initial state via MCP
      await this.mcpClient.saveGameState(character, aiResponse);
      
      return aiResponse;
    } catch (error) {
      logger.error('Failed to generate initial scene:', error);
      throw new Error('AI scene generation failed');
    }
  }

  async generateNextScene(
    character: Character, 
    currentScene: Scene, 
    choiceId: string
  ): Promise<AIResponse> {
    try {
      // Load game state from MCP
      const gameState = await this.mcpClient.loadGameState(character.id);
      
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildNextScenePrompt(character, currentScene, choiceId, gameState);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 2000
      });

      const aiResponse = this.parseAIResponse(response.choices[0].message.content || '');
      
      // Update character stats via MCP
      if (aiResponse.characterUpdates) {
        await this.mcpClient.updateCharacterStats(character.id, aiResponse.characterUpdates);
      }
      
      // Update world flags via MCP
      if (aiResponse.worldFlagUpdates) {
        for (const [flagName, value] of Object.entries(aiResponse.worldFlagUpdates)) {
          await this.mcpClient.setWorldFlag(flagName, value);
        }
      }
      
      // Save updated state via MCP
      await this.mcpClient.saveGameState(character, aiResponse);
      
      return aiResponse;
    } catch (error) {
      logger.error('Failed to generate next scene:', error);
      throw new Error('AI scene generation failed');
    }
  }

  private buildSystemPrompt(): string {
    return `You are an AI storyteller for an interactive fantasy RPG game. Your role is to:

1. Generate engaging, immersive scenes with rich descriptions
2. Create meaningful choices that affect the story and character
3. Track character stats, inventory, and world state
4. Provide visual and audio metadata for scene rendering
5. Determine when stories should end and what type of ending

IMPORTANT: Always respond with valid JSON in this exact format:
{
  "sceneText": "Rich, descriptive scene text (2-3 paragraphs)",
  "choices": [
    {
      "id": "choice1",
      "text": "Choice description",
      "consequences": [
        {
          "type": "stat_change",
          "target": "health",
          "value": -10,
          "description": "You take damage"
        }
      ],
      "requirements": [
        {
          "type": "stat",
          "target": "strength",
          "operator": ">=",
          "value": 12
        }
      ]
    }
  ],
  "visualMetadata": {
    "visualAssets": [
      {
        "type": "background",
        "name": "forest_path",
        "path": "/assets/backgrounds/forest_path.jpg"
      }
    ],
    "audioAssets": [
      {
        "type": "ambient",
        "name": "forest_sounds",
        "path": "/assets/sounds/forest_ambient.mp3",
        "volume": 0.7,
        "loop": true
      }
    ],
    "particleEffects": [
      {
        "type": "magic",
        "intensity": "medium",
        "duration": 5000
      }
    ],
    "mood": "mysterious",
    "timeOfDay": "evening",
    "weather": "clear"
  },
  "isEnding": false,
  "endingType": null,
  "characterUpdates": {
    "health": 90,
    "experience": 25
  },
  "worldFlagUpdates": {
    "met_wise_wizard": true,
    "forest_explored": true
  },
  "inventoryChanges": {
    "gained": [
      {
        "id": "magic_scroll",
        "name": "Scroll of Wisdom",
        "description": "A mystical scroll that enhances intelligence",
        "type": "consumable",
        "value": 50,
        "quantity": 1,
        "effects": [
          {
            "type": "stat",
            "target": "intelligence",
            "value": 2,
            "duration": 3600
          }
        ]
      }
    ],
    "lost": []
  }
}

Guidelines:
- Create 3-4 meaningful choices per scene
- Use consequences to affect stats, inventory, and world state
- Use requirements to gate choices based on character abilities
- Vary mood, time, and weather to create atmosphere
- Track important NPCs and locations via world flags
- End stories naturally after 15-20 scenes or when appropriate
- Ending types: victory, defeat, neutral, mystery, romance, tragedy`;
  }

  private buildInitialScenePrompt(character: Character): string {
    return `Create the opening scene for a new character:

Character Details:
- Name: ${character.name}
- Class: ${character.class}
- Background: ${character.background}
- Stats: ${JSON.stringify(character.stats)}
- Inventory: ${JSON.stringify(character.inventory)}

Generate an engaging opening scene that introduces the character to the world and presents their first meaningful choice. The scene should be appropriate for their class and background, and should set up the beginning of their adventure.

Consider the character's starting stats and create choices that might test different abilities. Include visual and audio elements that match the scene's atmosphere.`;
  }

  private buildNextScenePrompt(
    character: Character, 
    currentScene: Scene, 
    choiceId: string,
    gameState: MCPGameState
  ): string {
    const selectedChoice = currentScene.choices.find(c => c.id === choiceId);
    
    return `Continue the story based on the player's choice:

Current Character:
- Name: ${character.name}
- Class: ${character.class}
- Stats: ${JSON.stringify(character.stats)}
- Inventory: ${JSON.stringify(character.inventory)}

Previous Scene: ${currentScene.description}
Player's Choice: ${selectedChoice?.text || 'Unknown choice'}

Character Memory: ${JSON.stringify(gameState.characterMemory)}
Scene History: ${JSON.stringify(gameState.sceneMemory)}
World State: ${JSON.stringify(gameState.worldMemory)}

Generate the next scene that follows logically from the player's choice. Consider:
- The consequences of their choice
- Their current stats and inventory
- Previous events and world state
- Character development and relationships
- Whether this might be a good place for the story to end

Create meaningful choices that continue the narrative while allowing for character growth and world exploration.`;
  }

  private parseAIResponse(content: string): AIResponse {
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsed.sceneText || !parsed.choices || !parsed.visualMetadata) {
        throw new Error('Invalid AI response structure');
      }

      return parsed as AIResponse;
    } catch (error) {
      logger.error('Failed to parse AI response:', error);
      logger.error('Raw content:', content);
      
      // Return a fallback response
      return {
        sceneText: "The story continues...",
        choices: [
          {
            id: "continue",
            text: "Continue forward"
          }
        ],
        visualMetadata: {
          visualAssets: [],
          audioAssets: [],
          particleEffects: [],
          mood: "neutral",
          timeOfDay: "noon",
          weather: "clear"
        },
        isEnding: false
      };
    }
  }

  async generateEndingScene(character: Character, endingType: EndingType): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = `Generate a ${endingType} ending scene for character ${character.name} (${character.class}). 
    
    Character Stats: ${JSON.stringify(character.stats)}
    Character Background: ${character.background}
    
    Create a satisfying conclusion that reflects their journey and choices. Set isEnding to true and endingType to "${endingType}".`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    return this.parseAIResponse(response.choices[0].message.content || '');
  }
}

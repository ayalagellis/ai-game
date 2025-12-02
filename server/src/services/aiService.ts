import { GoogleGenerativeAI } from "@google/generative-ai";
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
} from '../../../shared/types';
import { logger } from '../utils/logger';

export class AIService {
  private genAI: GoogleGenerativeAI;
  private mcpClient: MCPClient;

  
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env['GEMINI_API_KEY'] || '');
    this.mcpClient = new MCPClient();
  }


async generateInitialScene(character: Character): Promise<AIResponse> {
  try {
    const gameState = await this.mcpClient.loadGameState(character.id);
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildInitialScenePrompt(character);
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    const model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.8 }
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }]
        }
      ]
    });
    const responseText = result.response.text();
    const aiResponse = this.parseAIResponse(responseText);
    await this.mcpClient.saveGameState(character, aiResponse);

    return aiResponse;
  } catch (error) {
    logger.error("Failed to generate initial scene:", error);
    throw new Error("AI scene generation failed");
  }
}

  async generateNextScene(
    character: Character, 
    currentScene: Scene, 
    choiceId: number
  ): Promise<AIResponse> {
    try {
      // Load game state from MCP
      const gameState = await this.mcpClient.loadGameState(character.id);
      
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildNextScenePrompt(character, currentScene, choiceId, gameState);
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

      const model = this.genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { temperature: 0.8 }
      });
  
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: fullPrompt }]
          }
        ]
      });

      const responseText = result.response.text();
      const aiResponse = this.parseAIResponse(responseText);

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
    return `
  You are an AI storyteller for an interactive fantasy RPG. Your job is to:
  1. Write simple, clear scene descriptions using plain language (avoid flowery or overly fancy words).
  2. Always generate exactly three sentences for every scene.
  3. Always provide exactly one background image and exactly one ambient audio track.
  4. Never reuse the same background or audio from the previous scene.
  5. Always respond with valid JSON and nothing else.
  
  AVAILABLE BACKGROUNDS:
  - cave_entrance
  - castle_interior
  - coastal_cliff
  - desert_oasis
  - dungeon_corridor
  - forest_path
  - library_ancient
  - magical_grove
  - meadow_flowers
  - merchant_shop
  - mountain_peak
  - prison_cells
  - river_crossing
  - tavern_interior
  - throne_room
  - village_square
  - bazaar_square
  - crystal_caves
  - guard_barracks
  - hidden_grotto
  - sanctuary_gardens
  - shipwreck_cove
  - tower_observatory
  - treehouse_villagre
  - underground_temple
  
  AVAILABLE AUDIO:
  - adventure
  - castle
  - coin_drop
  - windy_pass
  - footsteps
  - forest
  - page_turn
  - night_crickets
  
  BACKGROUND RULES:
  - Choose exactly one background each scene.
  - Must be different from the previous scene's background.
  - Path must be: "/assets/backgrounds/<name>.jpg"
  
  AUDIO RULES:
  - Choose exactly one ambient audio track each scene.
  - Must be different from the previous scene's audio.
  - Path must be: "/assets/sounds/<name>.mp3"
  - volume = 0.7
  - loop = true
  
  JSON FORMAT:
  {
    "sceneText": "Three simple sentences.",
    "choices": [
      { "id": 1, "text": "Choice text", "consequence": "...", "characterUpdates": {}, "worldFlagUpdates": {}, "inventoryChanges": { "gained": [], "lost": [] } }
    ],
    "visualMetadata": {
      "visualAssets": [
        {
          "type": "background",
          "name": "<one valid background name>",
          "path": "/assets/backgrounds/<same_name>.jpg"
        }
      ],
      "audioAssets": [
        {
          "type": "ambient",
          "name": "<one valid audio name>",
          "path": "/assets/sounds/<same_name>.mp3",
          "volume": 0.7,
          "loop": true
        }
      ],
      "particleEffects": [],
      "mood": "neutral",
      "timeOfDay": "day",
      "weather": "clear"
    },
    "isEnding": false,
    "endingType": null,
    "characterUpdates": {},
    "worldFlagUpdates": {},
    "inventoryChanges": { "gained": [], "lost": [] }
  }
  
  Guidelines:
  - Always generate exactly 3 choices.
  - Wording must be simple and easy to read.
  - Avoid repeating backgrounds or audio between scenes.
  - Keep story progression straightforward and concise.
  - Use consequences to affect stats and world state 
  - Vary mood, time, and weather based on story context 
  - End stories naturally after ~15–20 scenes or when appropriate.
  `;
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
    choiceId: number,
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
Previous Background Asset:
${currentScene.metadata?.visualAssets?.[0]?.name}
Previous Audio Asset:
${currentScene.metadata?.audioAssets?.[0]?.name}
Character Memory: ${JSON.stringify(gameState.characterMemory)}
Scene History: ${JSON.stringify(gameState.sceneMemory)}
World State: ${JSON.stringify(gameState.worldMemory)}

Generate the next scene that follows logically from the player's choice. Consider:
- The consequences of their choice
- Their current stats and inventory
- Previous events and world state
- Character development and relationships
- Whether this might be a good place for the story to end
-avoid reuse of the previous background and audio
Create meaningful choices that continue the narrative while allowing for character growth and world exploration.`;
  }

  private parseAIResponse(content: string): AIResponse {
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{(?:[^{}]|(?:\{[^{}]*\}))*\}$/);
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
            id: 1,
            text: "Continue forward",
          }
        ],
        visualMetadata: {
          visualAssets: [],
          audioAssets: [],
          particleEffects: [],
          mood: "peaceful",
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
  
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    const model = this.genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.8 }
    });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }]
        }
      ]
    });
    const responseText = result.response.text();
  
    return this.parseAIResponse(responseText);
  }
}

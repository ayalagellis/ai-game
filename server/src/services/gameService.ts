import { AIService } from './aiService';
import { MCPClient } from './mcpClient';
import { CharacterService } from './characterService';
import { SceneService } from './sceneService';
import { 
  Character, 
  Scene, 
  AIResponse, 
  GameStartRequest, 
  NextSceneRequest,
  WorldFlag,
  EndingType
} from '../../../shared/types';
import { logger } from '../utils/logger';

export class GameService {
  private aiService: AIService;
  private mcpClient: MCPClient;
  private characterService: CharacterService;
  private sceneService: SceneService;

  constructor() {
    this.aiService = new AIService();
    this.mcpClient = new MCPClient();
    this.characterService = new CharacterService();
    this.sceneService = new SceneService();
  }

  async generateInitialScene(character: Character): Promise<AIResponse> {
    try {
      logger.info(`Generating initial scene for character ${character.name}`);
      
      // Generate scene using AI
      const aiResponse = await this.aiService.generateInitialScene(character);
      
      // Save initial world state
      await this.mcpClient.setWorldFlag('game_started', true);
      await this.mcpClient.setWorldFlag('character_created', character.name);
      
      logger.info(`Initial scene generated for character ${character.name}`);
      return aiResponse;
    } catch (error) {
      logger.error('Failed to generate initial scene:', error);
      throw error;
    }
  }

  async processChoiceAndGenerateNextScene(
    character: Character,
    currentScene: Scene,
    choiceId: string
  ): Promise<AIResponse> {
    try {
      logger.info(`Processing choice ${choiceId} for character ${character.name}`);
      
      // Check if we've reached the maximum number of scenes
      const maxScenes = parseInt(process.env['MAX_SCENES_PER_GAME'] || '20');
      if (currentScene.sceneNumber >= maxScenes) {
        return await this.generateEndingScene(character, 'neutral');
      }

      // Generate next scene using AI
      const aiResponse = await this.aiService.generateNextScene(character, currentScene, choiceId);
      
      // Check if AI determined this should be an ending
      if (aiResponse.isEnding) {
        logger.info(`Ending reached for character ${character.name}: ${aiResponse.endingType}`);
        await this.mcpClient.setWorldFlag('game_ended', true);
        await this.mcpClient.setWorldFlag('ending_type', aiResponse.endingType);
      }
      
      logger.info(`Next scene generated for character ${character.name}`);
      return aiResponse;
    } catch (error) {
      logger.error('Failed to process choice and generate next scene:', error);
      throw error;
    }
  }

  async updateWorldFlags(flagUpdates: { [key: string]: any }): Promise<void> {
    try {
      for (const [flagName, value] of Object.entries(flagUpdates)) {
        await this.mcpClient.setWorldFlag(flagName, value);
      }
      logger.info('World flags updated:', flagUpdates);
    } catch (error) {
      logger.error('Failed to update world flags:', error);
      throw error;
    }
  }

  async getWorldFlags(): Promise<WorldFlag[]> {
    try {
      const flags = await this.mcpClient.getWorldFlags();
      return flags;
    } catch (error) {
      logger.error('Failed to get world flags:', error);
      return [];
    }
  }

  async generateEndingScene(character: Character, endingType: EndingType): Promise<AIResponse> {
    try {
      logger.info(`Generating ${endingType} ending for character ${character.name}`);
      
      const aiResponse = await this.aiService.generateEndingScene(character, endingType);
      
      // Set final world flags
      await this.mcpClient.setWorldFlag('game_ended', true);
      await this.mcpClient.setWorldFlag('ending_type', endingType);
      await this.mcpClient.setWorldFlag('final_scene', true);
      
      logger.info(`${endingType} ending generated for character ${character.name}`);
      return aiResponse;
    } catch (error) {
      logger.error('Failed to generate ending scene:', error);
      throw error;
    }
  }

  buildDecisionTree(sceneHistory: Scene[]): any {
    try {
      const tree = {
        nodes: [] as any[],
        edges: [] as any[]
      };

      // Create nodes for each scene
      sceneHistory.forEach((scene, index) => {
        tree.nodes.push({
          id: `scene-${scene.id}`,
          type: 'scene',
          data: {
            label: `Scene ${scene.sceneNumber}`,
            description: scene.description.substring(0, 100) + '...',
            sceneNumber: scene.sceneNumber,
            isEnding: scene.isEnding,
            endingType: scene.endingType
          },
          position: {
            x: index * 200,
            y: 0
          }
        });

        // Create nodes for each choice
        scene.choices.forEach((choice, choiceIndex) => {
          const choiceNodeId = `choice-${scene.id}-${choice.id}`;
          tree.nodes.push({
            id: choiceNodeId,
            type: 'choice',
            data: {
              label: choice.text.substring(0, 50) + '...',
              choiceId: choice.id,
              consequences: choice.consequences || []
            },
            position: {
              x: index * 200 + (choiceIndex - scene.choices.length / 2) * 100,
              y: 150
            }
          });

          // Create edge from scene to choice
          tree.edges.push({
            id: `edge-${scene.id}-${choice.id}`,
            source: `scene-${scene.id}`,
            target: choiceNodeId,
            type: 'scene-to-choice'
          });
        });
      });

      // Create edges between scenes (simplified - assumes linear progression)
      for (let i = 0; i < sceneHistory.length - 1; i++) {
        const currentScene = sceneHistory[i];
        const nextScene = sceneHistory[i + 1];
        
        if (!currentScene || !nextScene) continue;
        
        // Find the choice that led to the next scene (simplified)
        const firstChoice = currentScene.choices[0];
        if (firstChoice) {
          tree.edges.push({
            id: `edge-choice-${currentScene.id}-scene-${nextScene.id}`,
            source: `choice-${currentScene.id}-${firstChoice.id}`,
            target: `scene-${nextScene.id}`,
            type: 'choice-to-scene'
          });
        }
      }

      return tree;
    } catch (error) {
      logger.error('Failed to build decision tree:', error);
      return { nodes: [], edges: [] };
    }
  }

  async validateChoiceRequirements(
    character: Character,
    choice: any
  ): Promise<{ canChoose: boolean; reason?: string }> {
    try {
      if (!choice.requirements || choice.requirements.length === 0) {
        return { canChoose: true };
      }

      for (const requirement of choice.requirements) {
        switch (requirement.type) {
          case 'stat':
            const statValue = character.stats[requirement.target as keyof typeof character.stats];
            if (!this.evaluateRequirement(statValue, requirement.operator, requirement.value)) {
              return {
                canChoose: false,
                reason: `Requires ${requirement.target} ${requirement.operator} ${requirement.value} (current: ${statValue})`
              };
            }
            break;
          
          case 'item':
            const hasItem = character.inventory.some(item => 
              item.name.toLowerCase().includes(requirement.target.toLowerCase())
            );
            if (!hasItem) {
              return {
                canChoose: false,
                reason: `Requires item: ${requirement.target}`
              };
            }
            break;
          
          case 'world_flag':
            const worldFlags = await this.getWorldFlags();
            const flag = worldFlags.find(f => f.name === requirement.target);
            const flagValue = flag ? flag.value : false;
            if (!this.evaluateRequirement(flagValue, requirement.operator, requirement.value)) {
              return {
                canChoose: false,
                reason: `Requires world flag: ${requirement.target}`
              };
            }
            break;
        }
      }

      return { canChoose: true };
    } catch (error) {
      logger.error('Failed to validate choice requirements:', error);
      return { canChoose: false, reason: 'Validation error' };
    }
  }

  private evaluateRequirement(value: any, operator: string, targetValue: any): boolean {
    switch (operator) {
      case '>=':
        return value >= targetValue;
      case '<=':
        return value <= targetValue;
      case '==':
        return value === targetValue;
      case '>':
        return value > targetValue;
      case '<':
        return value < targetValue;
      default:
        return false;
    }
  }

  async applyChoiceConsequences(
    character: Character,
    choice: any
  ): Promise<{ characterUpdates: any; inventoryChanges: any; worldFlagUpdates: any }> {
    try {
      const characterUpdates: any = {};
      const inventoryChanges = { gained: [] as any[], lost: [] as string[] };
      const worldFlagUpdates: any = {};

      if (!choice.consequences || choice.consequences.length === 0) {
        return { characterUpdates, inventoryChanges, worldFlagUpdates };
      }

      for (const consequence of choice.consequences) {
        switch (consequence.type) {
          case 'stat_change':
            const currentValue = character.stats[consequence.target as keyof typeof character.stats];
            characterUpdates[consequence.target] = currentValue + consequence.value;
            break;
          
          case 'item_gain':
            inventoryChanges.gained.push({
              id: `item-${Date.now()}`,
              name: consequence.target,
              description: consequence.description || 'An item',
              type: 'misc',
              value: 0,
              quantity: consequence.value || 1
            });
            break;
          
          case 'item_loss':
            inventoryChanges.lost.push(consequence.target);
            break;
          
          case 'world_flag':
            worldFlagUpdates[consequence.target] = consequence.value;
            break;
          
          case 'event':
            worldFlagUpdates[`event_${consequence.target}`] = true;
            break;
        }
      }

      return { characterUpdates, inventoryChanges, worldFlagUpdates };
    } catch (error) {
      logger.error('Failed to apply choice consequences:', error);
      return { characterUpdates: {}, inventoryChanges: { gained: [], lost: [] }, worldFlagUpdates: {} };
    }
  }
}

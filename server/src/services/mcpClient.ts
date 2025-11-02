import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { 
  Character, 
  Scene, 
  AIResponse, 
  MCPGameState, 
  CharacterMemory, 
  SceneMemory, 
  WorldMemory,
  CharacterStats,
  WorldFlag
} from '../../../shared/types';
import { logger } from '../utils/logger';

export class MCPClient {
  private client: Client;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Client({
      name: 'dynamic-storylines-mcp-client',
      version: '1.0.0'
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      const transport = new StdioClientTransport({
        command: 'node',
        args: ['-e', 'console.log("MCP transport")']
      });
      await this.client.connect(transport);
      this.isConnected = true;
      logger.info('MCP client connected successfully');
    } catch (error) {
      logger.error('Failed to connect MCP client:', error);
      throw new Error('MCP connection failed');
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.client.close();
      this.isConnected = false;
      logger.info('MCP client disconnected');
    } catch (error) {
      logger.error('Failed to disconnect MCP client:', error);
    }
  }

  async saveGameState(character: Character, scene: AIResponse): Promise<void> {
    try {
      await this.connect();

      const result = await this.client.callTool({
        name: 'saveGameState',
        arguments: {
          characterId: character.id,
          characterData: JSON.stringify(character),
          sceneData: JSON.stringify(scene),
          timestamp: new Date().toISOString()
        }
      });

      logger.info('Game state saved via MCP:', result);
    } catch (error) {
      logger.error('Failed to save game state via MCP:', error);
      // Don't throw error - MCP is optional for basic functionality
    }
  }

  async loadGameState(characterId: number): Promise<MCPGameState> {
    try {
      await this.connect();

      const result = await this.client.callTool({
        name: 'loadGameState',
        arguments: {
          characterId: characterId
        }
      });

      if (result.content && Array.isArray(result.content) && result.content[0] && result.content[0].text) {
        const gameState = JSON.parse(result.content[0].text);
        return gameState as MCPGameState;
      }

      // Return empty state if no data found
      return this.getEmptyGameState();
    } catch (error) {
      logger.error('Failed to load game state via MCP:', error);
      return this.getEmptyGameState();
    }
  }

  async updateCharacterStats(characterId: number, updates: Partial<CharacterStats>): Promise<void> {
    try {
      await this.connect();

      const result = await this.client.callTool({
        name: 'updateCharacterStats',
        arguments: {
          characterId: characterId,
          updates: JSON.stringify(updates),
          timestamp: new Date().toISOString()
        }
      });

      logger.info('Character stats updated via MCP:', result);
    } catch (error) {
      logger.error('Failed to update character stats via MCP:', error);
    }
  }

  async getWorldFlags(): Promise<WorldFlag[]> {
    try {
      await this.connect();

      const result = await this.client.callTool({
        name: 'getWorldFlags',
        arguments: {}
      });

      if (result.content && Array.isArray(result.content) && result.content[0] && result.content[0].text) {
        const flags = JSON.parse(result.content[0].text);
        return flags as WorldFlag[];
      }

      return [];
    } catch (error) {
      logger.error('Failed to get world flags via MCP:', error);
      return [];
    }
  }

  async setWorldFlag(flagName: string, value: any): Promise<void> {
    try {
      await this.connect();

      const result = await this.client.callTool({
        name: 'setWorldFlag',
        arguments: {
          flagName: flagName,
          value: JSON.stringify(value),
          timestamp: new Date().toISOString()
        }
      });

      logger.info('World flag set via MCP:', result);
    } catch (error) {
      logger.error('Failed to set world flag via MCP:', error);
    }
  }

  async getCharacterMemory(characterId: number): Promise<CharacterMemory> {
    try {
      await this.connect();

      const result = await this.client.callTool({
        name: 'getCharacterMemory',
        arguments: {
          characterId: characterId
        }
      });

      if (result.content && Array.isArray(result.content) && result.content[0] && result.content[0].text) {
        const memory = JSON.parse(result.content[0].text);
        return memory as CharacterMemory;
      }

      return this.getEmptyCharacterMemory();
    } catch (error) {
      logger.error('Failed to get character memory via MCP:', error);
      return this.getEmptyCharacterMemory();
    }
  }

  async updateCharacterMemory(characterId: number, updates: Partial<CharacterMemory>): Promise<void> {
    try {
      await this.connect();

      const result = await this.client.callTool({
        name: 'updateCharacterMemory',
        arguments: {
          characterId: characterId,
          updates: JSON.stringify(updates),
          timestamp: new Date().toISOString()
        }
      });

      logger.info('Character memory updated via MCP:', result);
    } catch (error) {
      logger.error('Failed to update character memory via MCP:', error);
    }
  }

  async getSceneMemory(characterId: number): Promise<SceneMemory> {
    try {
      await this.connect();

      const result = await this.client.callTool({
        name: 'getSceneMemory',
        arguments: {
          characterId: characterId
        }
      });

      if (result.content && Array.isArray(result.content) && result.content[0] && result.content[0].text) {
        const memory = JSON.parse(result.content[0].text);
        return memory as SceneMemory;
      }

      return this.getEmptySceneMemory();
    } catch (error) {
      logger.error('Failed to get scene memory via MCP:', error);
      return this.getEmptySceneMemory();
    }
  }

  async updateSceneMemory(characterId: number, updates: Partial<SceneMemory>): Promise<void> {
    try {
      await this.connect();

      const result = await this.client.callTool({
        name: 'updateSceneMemory',
        arguments: {
          characterId: characterId,
          updates: JSON.stringify(updates),
          timestamp: new Date().toISOString()
        }
      });

      logger.info('Scene memory updated via MCP:', result);
    } catch (error) {
      logger.error('Failed to update scene memory via MCP:', error);
    }
  }

  async getWorldMemory(): Promise<WorldMemory> {
    try {
      await this.connect();

      const result = await this.client.callTool({
        name: 'getWorldMemory',
        arguments: {}
      });

      if (result.content && Array.isArray(result.content) && result.content[0] && result.content[0].text) {
        const memory = JSON.parse(result.content[0].text);
        return memory as WorldMemory;
      }

      return this.getEmptyWorldMemory();
    } catch (error) {
      logger.error('Failed to get world memory via MCP:', error);
      return this.getEmptyWorldMemory();
    }
  }

  async updateWorldMemory(updates: Partial<WorldMemory>): Promise<void> {
    try {
      await this.connect();

      const result = await this.client.callTool({
        name: 'updateWorldMemory',
        arguments: {
          updates: JSON.stringify(updates),
          timestamp: new Date().toISOString()
        }
      });

      logger.info('World memory updated via MCP:', result);
    } catch (error) {
      logger.error('Failed to update world memory via MCP:', error);
    }
  }

  private getEmptyGameState(): MCPGameState {
    return {
      characterMemory: this.getEmptyCharacterMemory(),
      sceneMemory: this.getEmptySceneMemory(),
      worldMemory: this.getEmptyWorldMemory()
    };
  }

  private getEmptyCharacterMemory(): CharacterMemory {
    return {
      character: {} as Character,
      recentChoices: [],
      personalityTraits: [],
      relationships: {}
    };
  }

  private getEmptySceneMemory(): SceneMemory {
    return {
      recentScenes: [],
      importantEvents: [],
      locationHistory: []
    };
  }

  private getEmptyWorldMemory(): WorldMemory {
    return {
      flags: [],
      globalEvents: [],
      npcStates: {},
      worldState: 'initial'
    };
  }
}

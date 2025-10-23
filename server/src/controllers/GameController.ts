import { Request, Response, NextFunction } from 'express';
import { GameService } from '../services/gameService';
import { CharacterService } from '../services/characterService';
import { SceneService } from '../services/sceneService';
import { GameStartRequest, NextSceneRequest, Character, GameState } from '../../shared/types';

export class GameController {
  private gameService: GameService;
  private characterService: CharacterService;
  private sceneService: SceneService;

  constructor() {
    this.gameService = new GameService();
    this.characterService = new CharacterService();
    this.sceneService = new SceneService();
  }

  async startGame(data: GameStartRequest) {
    try {
      // Create character
      const character = await this.characterService.createCharacter({
        name: data.characterName,
        class: data.characterClass,
        background: data.characterBackground
      });

      // Generate initial scene
      const initialScene = await this.gameService.generateInitialScene(character);

      return {
        character,
        scene: initialScene,
        gameState: {
          character,
          currentScene: initialScene,
          sceneHistory: [initialScene],
          worldFlags: [],
          gameProgress: {
            totalScenes: 1,
            currentSceneNumber: 1,
            isGameOver: false
          }
        }
      };
    } catch (error) {
      throw new Error(`Failed to start game: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getNextScene(data: NextSceneRequest) {
    try {
      // Get current character and scene
      const character = await this.characterService.getCharacter(data.characterId);
      const currentScene = await this.sceneService.getScene(data.currentSceneId);

      // Process player choice and generate next scene
      const nextScene = await this.gameService.processChoiceAndGenerateNextScene(
        character,
        currentScene,
        data.choiceId
      );

      // Update character stats if needed
      if (nextScene.characterUpdates) {
        await this.characterService.updateCharacterStats(
          data.characterId,
          nextScene.characterUpdates
        );
      }

      // Update world flags if needed
      if (nextScene.worldFlagUpdates) {
        await this.gameService.updateWorldFlags(nextScene.worldFlagUpdates);
      }

      // Update inventory if needed
      if (nextScene.inventoryChanges) {
        await this.characterService.updateInventory(
          data.characterId,
          nextScene.inventoryChanges
        );
      }

      // Save the new scene
      const savedScene = await this.sceneService.createScene({
        characterId: data.characterId,
        sceneNumber: currentScene.sceneNumber + 1,
        description: nextScene.sceneText,
        choices: nextScene.choices,
        metadata: nextScene.visualMetadata,
        isEnding: nextScene.isEnding,
        endingType: nextScene.endingType
      });

      // Get updated character
      const updatedCharacter = await this.characterService.getCharacter(data.characterId);

      // Get scene history
      const sceneHistory = await this.sceneService.getSceneHistory(data.characterId);

      // Get world flags
      const worldFlags = await this.gameService.getWorldFlags();

      return {
        character: updatedCharacter,
        scene: savedScene,
        gameState: {
          character: updatedCharacter,
          currentScene: savedScene,
          sceneHistory,
          worldFlags,
          gameProgress: {
            totalScenes: sceneHistory.length,
            currentSceneNumber: savedScene.sceneNumber,
            isGameOver: nextScene.isEnding,
            endingReached: nextScene.isEnding
          }
        }
      };
    } catch (error) {
      throw new Error(`Failed to get next scene: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCharacter(characterId: number) {
    try {
      const character = await this.characterService.getCharacter(characterId);
      return { character };
    } catch (error) {
      throw new Error(`Failed to get character: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getGameState(characterId: number) {
    try {
      const character = await this.characterService.getCharacter(characterId);
      const sceneHistory = await this.sceneService.getSceneHistory(characterId);
      const currentScene = sceneHistory[sceneHistory.length - 1];
      const worldFlags = await this.gameService.getWorldFlags();

      if (!currentScene) {
        throw new Error('No scenes found for character');
      }

      const gameState: GameState = {
        character,
        currentScene,
        sceneHistory,
        worldFlags,
        gameProgress: {
          totalScenes: sceneHistory.length,
          currentSceneNumber: currentScene.sceneNumber,
          isGameOver: currentScene.isEnding,
          endingReached: currentScene.isEnding
        }
      };

      return { gameState };
    } catch (error) {
      throw new Error(`Failed to get game state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDecisionTree(characterId: number) {
    try {
      const sceneHistory = await this.sceneService.getSceneHistory(characterId);
      const decisionTree = this.gameService.buildDecisionTree(sceneHistory);
      return { decisionTree };
    } catch (error) {
      throw new Error(`Failed to get decision tree: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

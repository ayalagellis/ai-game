import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  GameState,
  GameStartRequest,
  NextSceneRequest
} from '@shared/types';
import { gameAPI } from '../api/gameAPI';

interface GameStore {
  gameState: GameState | null;
  isLoading: boolean;
  error: string | null;
  currentView: 'character-creation' | 'game' | 'ending' | 'decision-tree';

  characterForm: {
    name: string;
    class: string;
    background: string;
  };

  audioEnabled: boolean;
  particlesEnabled: boolean;
  animationsEnabled: boolean;

  setCharacterForm: (form: Partial<GameStore['characterForm']>) => void;
  startGame: (request: GameStartRequest) => Promise<void>;
  makeChoice: (choiceIndex: number) => Promise<void>;
  loadGameState: (characterId: number) => Promise<void>;
  setCurrentView: (view: GameStore['currentView']) => void;
  setError: (error: string | null) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      gameState: null,
      isLoading: false,
      error: null,
      currentView: 'character-creation',

      characterForm: {
        name: '',
        class: '',
        background: '',
      },

      audioEnabled: true,
      particlesEnabled: true,
      animationsEnabled: true,

      setCharacterForm: (form) =>
        set((state) => ({
          characterForm: { ...state.characterForm, ...form },
        })),

      startGame: async (request) => {
        set({ isLoading: true, error: null });

        try {
          const data = await gameAPI.startGame(request);

          set({
            gameState: data.gameState,
            isLoading: false,
            currentView: 'game',
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to start game',
            isLoading: false,
          });
        }
      },

      makeChoice: async (choiceIndex) => {
        const { gameState } = get();
        if (!gameState) return;

        set({ isLoading: true, error: null });

        try {
          const request: NextSceneRequest = {
            characterId: gameState.character.id,
            choiceId: choiceIndex,
            currentSceneId: gameState.currentScene.id,
          };

          const data = await gameAPI.getNextScene(request);

          set({
            gameState: data.gameState,
            isLoading: false,
            currentView: data.gameState.gameProgress.isGameOver
              ? 'ending'
              : 'game',
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to make choice',
            isLoading: false,
          });
        }
      },

      loadGameState: async (characterId) => {
        set({ isLoading: true, error: null });

        try {
          const data = await gameAPI.getGameState(characterId);

          set({
            gameState: data.gameState,
            isLoading: false,
            currentView: data.gameState.gameProgress.isGameOver
              ? 'ending'
              : 'game',
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Failed to load game',
            isLoading: false,
          });
        }
      },

      setCurrentView: (view) => set({ currentView: view }),

      setError: (error) => set({ error }),

      resetGame: () =>
        set({
          gameState: null,
          isLoading: false,
          error: null,
          currentView: 'character-creation',
          characterForm: {
            name: '',
            class: '',
            background: '',
          },
        }),
    }),
    { name: 'game-store' }
  )
);

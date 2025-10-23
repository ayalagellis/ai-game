import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  Character, 
  Scene, 
  GameState, 
  GameStartRequest, 
  NextSceneRequest,
  WorldFlag,
  AIResponse
} from '@shared/types';

interface GameStore {
  // State
  gameState: GameState | null;
  isLoading: boolean;
  error: string | null;
  currentView: 'character-creation' | 'game' | 'ending' | 'decision-tree';
  
  // Character Creation
  characterForm: {
    name: string;
    class: string;
    background: string;
  };
  
  // Audio
  audioEnabled: boolean;
  currentAudio: any;
  
  // Visual Effects
  particlesEnabled: boolean;
  animationsEnabled: boolean;
  
  // Actions
  setCharacterForm: (form: Partial<GameStore['characterForm']>) => void;
  startGame: (request: GameStartRequest) => Promise<void>;
  makeChoice: (choiceId: string) => Promise<void>;
  loadGameState: (characterId: number) => Promise<void>;
  setCurrentView: (view: GameStore['currentView']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleAudio: () => void;
  toggleParticles: () => void;
  toggleAnimations: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      gameState: null,
      isLoading: false,
      error: null,
      currentView: 'character-creation',
      
      characterForm: {
        name: '',
        class: '',
        background: ''
      },
      
      audioEnabled: true,
      currentAudio: null,
      particlesEnabled: true,
      animationsEnabled: true,
      
      // Actions
      setCharacterForm: (form) => {
        set((state) => ({
          characterForm: { ...state.characterForm, ...form }
        }));
      },
      
      startGame: async (request: GameStartRequest) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/game/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          set({
            gameState: data.gameState,
            isLoading: false,
            currentView: 'game'
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to start game',
            isLoading: false
          });
        }
      },
      
      makeChoice: async (choiceId: string) => {
        const { gameState } = get();
        if (!gameState) return;
        
        set({ isLoading: true, error: null });
        
        try {
          const request: NextSceneRequest = {
            characterId: gameState.character.id,
            choiceId: choiceId,
            currentSceneId: gameState.currentScene.id
          };
          
          const response = await fetch('/api/next-scene', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          set({
            gameState: data.gameState,
            isLoading: false,
            currentView: data.gameState.gameProgress.isGameOver ? 'ending' : 'game'
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to make choice',
            isLoading: false
          });
        }
      },
      
      loadGameState: async (characterId: number) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/game-state/${characterId}`);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          
          set({
            gameState: data.gameState,
            isLoading: false,
            currentView: data.gameState.gameProgress.isGameOver ? 'ending' : 'game'
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load game state',
            isLoading: false
          });
        }
      },
      
      setCurrentView: (view) => {
        set({ currentView: view });
      },
      
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      
      setError: (error) => {
        set({ error });
      },
      
      toggleAudio: () => {
        set((state) => ({ audioEnabled: !state.audioEnabled }));
      },
      
      toggleParticles: () => {
        set((state) => ({ particlesEnabled: !state.particlesEnabled }));
      },
      
      toggleAnimations: () => {
        set((state) => ({ animationsEnabled: !state.animationsEnabled }));
      },
      
      resetGame: () => {
        set({
          gameState: null,
          isLoading: false,
          error: null,
          currentView: 'character-creation',
          characterForm: {
            name: '',
            class: '',
            background: ''
          }
        });
      }
    }),
    {
      name: 'game-store',
    }
  )
);

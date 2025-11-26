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
  makeChoice: (choiceIndex: number) => Promise<void>;
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
          // Ensure request is a plain object with correct property types
          const sanitizedRequest = {
            characterName: String(request.characterName),
            characterClass: String(request.characterClass),
            characterBackground: String(request.characterBackground)
          };

          const response = await fetch('/api/game/start', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(sanitizedRequest),
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || errorData.message || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
          }
          
          const data = await response.json();

          if (!data.gameState) {
            throw new Error('Invalid response format: missing gameState');
          }
          
          set({
            gameState: data.gameState,
            isLoading: false,
            currentView: 'game'
          });
        } catch (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Failed to start game. Please ensure the server is running.';
          
          console.error('Start game error:', error);
          set({
            error: errorMessage,
            isLoading: false
          });
        }
      },
      
      makeChoice: async (choiceIndex: number) => {
        const { gameState } = get();
        if (!gameState) return;     
        set({ isLoading: true, error: null });        
        try {
          const request: NextSceneRequest = {
            characterId: gameState.character.id,
            choiceId: choiceIndex,
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

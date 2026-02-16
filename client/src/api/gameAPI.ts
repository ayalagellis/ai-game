import axios from 'axios';
import {
  GameStartRequest,
  NextSceneRequest,
  Character,
  GameState
} from '@shared/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request logging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response error normalization
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message =
        error.response.data?.error?.message ||
        error.response.data?.message ||
        'Server error';
      throw new Error(message);
    }

    if (error.request) {
      throw new Error('Network error');
    }

    throw new Error(error.message || 'Unknown error');
  }
);

export const gameAPI = {
  startGame: async (
    request: GameStartRequest
  ): Promise<{ character: Character; scene: any; gameState: GameState }> => {
    const { data } = await api.post('/game/start', request);
    return data;
  },

  getNextScene: async (
    request: NextSceneRequest
  ): Promise<{ character: Character; scene: any; gameState: GameState }> => {
    const { data } = await api.post('/next-scene', request);
    return data;
  },

  getCharacter: async (characterId: number) => {
    const { data } = await api.get(`/get-character/${characterId}`);
    return data;
  },

  getGameState: async (characterId: number) => {
    const { data } = await api.get(`/game-state/${characterId}`);
    return data;
  },

  getDecisionTree: async (characterId: number) => {
    const { data } = await api.get(`/decision-tree/${characterId}`);
    return data;
  },

  healthCheck: async () => {
    const { data } = await api.get('/health');
    return data;
  },
};

export default api;

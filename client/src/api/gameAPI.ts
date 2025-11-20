import axios from 'axios';
import { GameStartRequest, NextSceneRequest, Character, GameState } from '@shared/types';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.error?.message || error.response.data?.message || 'Server error';
      throw new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error - please check your connection');
    } else {
      // Something else happened
      throw new Error(error.message || 'Unknown error occurred');
    }
  }
);

export const gameAPI = {
  // Start a new game
  startGame: async (request: GameStartRequest): Promise<{ character: Character; scene: any; gameState: GameState }> => {
    console.log('Starting game with request:', request);
    const response = await api.post('/game/start', request);
    console.log('Game started successfully with response:', response.data);
    return response.data;
  },

  // Get next scene based on choice
  getNextScene: async (request: NextSceneRequest): Promise<{ character: Character; scene: any; gameState: GameState }> => {
    const response = await api.post('/next-scene', request);
    return response.data;
  },

  // Get character details
  getCharacter: async (characterId: number): Promise<{ character: Character }> => {
    const response = await api.get(`/get-character/${characterId}`);
    return response.data;
  },

  // Get full game state
  getGameState: async (characterId: number): Promise<{ gameState: GameState }> => {
    const response = await api.get(`/game-state/${characterId}`);
    return response.data;
  },

  // Get decision tree
  getDecisionTree: async (characterId: number): Promise<{ decisionTree: any }> => {
    const response = await api.get(`/decision-tree/${characterId}`);
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; timestamp: string; version: string }> => {
    const response = await api.get('/health');
    return response.data;
  }
};

export default api;

// Shared types for the dynamic storylines game

export interface Character {
  id: number;
  name: string;
  class: string;
  background: string;
  stats: CharacterStats;
  inventory: InventoryItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CharacterStats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  strength: number;
  intelligence: number;
  dexterity: number;
  charisma: number;
  wisdom: number;
  constitution: number;
  level: number;
  experience: number;
  gold: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'consumable' | 'misc';
  value: number;
  quantity: number;
  effects?: ItemEffect[];
}

export interface ItemEffect {
  type: 'stat' | 'ability' | 'spell';
  target: string;
  value: number;
  duration?: number;
}

export interface Scene {
  id: number;
  characterId: number;
  sceneNumber: number;
  description: string;
  choices: Choice[];
  metadata: SceneMetadata;
  isEnding: boolean;
  endingType?: EndingType;
  createdAt: Date;
}

export interface Choice {
  id: number;
  text: string;
  consequences?: ChoiceConsequence[];
  requirements?: ChoiceRequirement[];
}

export interface ChoiceConsequence {
  type: 'stat_change' | 'item_gain' | 'item_loss' | 'world_flag' | 'event';
  target: string;
  value: any;
  description?: string;
}

export interface ChoiceRequirement {
  type: 'stat' | 'item' | 'world_flag';
  target: string;
  operator: '>=' | '<=' | '==' | '>' | '<';
  value: any;
}

export interface SceneMetadata {
  visualAssets: VisualAsset[];
  audioAssets: AudioAsset[];
  particleEffects: ParticleEffect[];
  mood: 'dark' | 'mysterious' | 'bright' | 'tense' | 'peaceful' | 'epic';
  timeOfDay: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';
  weather: 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'foggy' | 'snowy';
}

export interface VisualAsset {
  type: 'background' | 'character' | 'object' | 'effect';
  name: string;
  path: string;
  position?: { x: number; y: number };
  scale?: number;
  opacity?: number;
}

export interface AudioAsset {
  type: 'ambient' | 'music' | 'sfx' | 'voice';
  name: string;
  path: string;
  volume: number;
  loop: boolean;
  fadeIn?: number;
  fadeOut?: number;
}

export interface ParticleEffect {
  type: 'magic' | 'fire' | 'smoke' | 'sparkles' | 'rain' | 'snow';
  intensity: 'low' | 'medium' | 'high';
  duration: number;
  position?: { x: number; y: number };
}

export type EndingType = 'victory' | 'defeat' | 'neutral' | 'mystery' | 'romance' | 'tragedy';

export interface WorldFlag {
  name: string;
  value: any;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameState {
  character: Character;
  currentScene: Scene;
  sceneHistory: Scene[];
  worldFlags: WorldFlag[];
  gameProgress: {
    totalScenes: number;
    currentSceneNumber: number;
    isGameOver: boolean;
    endingReached?: boolean;
  };
}

export interface GameStartRequest {
  characterName?: string;
  characterClass?: string;
  characterBackground?: string;
}

export interface NextSceneRequest {
  characterId?: number;
  choiceId?: number;
  currentSceneId?: number;
}

export interface AIResponse {
  sceneText: string;
  choices: Choice[];
  visualMetadata: SceneMetadata;
  isEnding: boolean;
  endingType?: EndingType;
  characterUpdates?: Partial<CharacterStats>;
  worldFlagUpdates?: { [key: string]: any };
  inventoryChanges?: {
    gained: InventoryItem[];
    lost: string[]; // item IDs
  };
}

export interface MCPGameState {
  characterMemory: CharacterMemory;
  sceneMemory: SceneMemory;
  worldMemory: WorldMemory;
}

export interface CharacterMemory {
  character: Character;
  recentChoices: string[];
  personalityTraits: string[];
  relationships: { [key: string]: number };
}

export interface SceneMemory {
  recentScenes: Scene[];
  importantEvents: string[];
  locationHistory: string[];
}

export interface WorldMemory {
  flags: WorldFlag[];
  globalEvents: string[];
  npcStates: { [key: string]: any };
  worldState: string;
}

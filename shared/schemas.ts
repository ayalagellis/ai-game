// Zod schemas for validation

import { z } from 'zod';

export const CharacterStatsSchema = z.object({
  health: z.number().min(0),
  maxHealth: z.number().min(1),
  mana: z.number().min(0),
  maxMana: z.number().min(0),
  strength: z.number().min(1).max(20),
  intelligence: z.number().min(1).max(20),
  dexterity: z.number().min(1).max(20),
  charisma: z.number().min(1).max(20),
  wisdom: z.number().min(1).max(20),
  constitution: z.number().min(1).max(20),
  level: z.number().min(1),
  experience: z.number().min(0),
  gold: z.number().min(0),
});

export const InventoryItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  type: z.enum(['weapon', 'armor', 'consumable', 'misc']),
  value: z.number().min(0),
  quantity: z.number().min(1),
  effects: z.array(z.object({
    type: z.enum(['stat', 'ability', 'spell']),
    target: z.string(),
    value: z.number(),
    duration: z.number().optional(),
  })).optional(),
});

export const ChoiceSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  consequences: z.array(z.object({
    type: z.enum(['stat_change', 'item_gain', 'item_loss', 'world_flag', 'event']),
    target: z.string(),
    value: z.any(),
    description: z.string().optional(),
  })).optional(),
  requirements: z.array(z.object({
    type: z.enum(['stat', 'item', 'world_flag']),
    target: z.string(),
    operator: z.enum(['>=', '<=', '==', '>', '<']),
    value: z.any(),
  })).optional(),
});

export const VisualAssetSchema = z.object({
  type: z.enum(['background', 'character', 'object', 'effect']),
  name: z.string(),
  path: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  scale: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
});

export const AudioAssetSchema = z.object({
  type: z.enum(['ambient', 'music', 'sfx', 'voice']),
  name: z.string(),
  path: z.string(),
  volume: z.number().min(0).max(1),
  loop: z.boolean(),
  fadeIn: z.number().optional(),
  fadeOut: z.number().optional(),
});

export const ParticleEffectSchema = z.object({
  type: z.enum(['magic', 'fire', 'smoke', 'sparkles', 'rain', 'snow']),
  intensity: z.enum(['low', 'medium', 'high']),
  duration: z.number().min(0),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
});

export const SceneMetadataSchema = z.object({
  visualAssets: z.array(VisualAssetSchema),
  audioAssets: z.array(AudioAssetSchema),
  particleEffects: z.array(ParticleEffectSchema),
  mood: z.enum(['dark', 'mysterious', 'bright', 'tense', 'peaceful', 'epic']),
  timeOfDay: z.enum(['dawn', 'morning', 'noon', 'afternoon', 'evening', 'night']),
  weather: z.enum(['clear', 'cloudy', 'rainy', 'stormy', 'foggy', 'snowy']),
});

export const SceneSchema = z.object({
  id: z.number(),
  characterId: z.number(),
  sceneNumber: z.number(),
  description: z.string(),
  choices: z.array(ChoiceSchema),
  metadata: SceneMetadataSchema,
  isEnding: z.boolean(),
  endingType: z.enum(['victory', 'defeat', 'neutral', 'mystery', 'romance', 'tragedy']).optional(),
  createdAt: z.date(),
});

export const CharacterSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(50),
  class: z.string().min(1),
  background: z.string().min(1),
  stats: CharacterStatsSchema,
  inventory: z.array(InventoryItemSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const GameStartRequestSchema = z.object({
  characterName: z.string().min(1).max(50),
  characterClass: z.string().min(1),
  characterBackground: z.string().min(1),
});

export const NextSceneRequestSchema = z.object({
  characterId: z.number(),
  choiceId: z.string(),
  currentSceneId: z.number(),
});

export const AIResponseSchema = z.object({
  sceneText: z.string(),
  choices: z.array(ChoiceSchema),
  visualMetadata: SceneMetadataSchema,
  isEnding: z.boolean(),
  endingType: z.enum(['victory', 'defeat', 'neutral', 'mystery', 'romance', 'tragedy']).optional(),
  characterUpdates: CharacterStatsSchema.partial().optional(),
  worldFlagUpdates: z.record(z.any()).optional(),
  inventoryChanges: z.object({
    gained: z.array(InventoryItemSchema),
    lost: z.array(z.string()),
  }).optional(),
});

export const WorldFlagSchema = z.object({
  name: z.string(),
  value: z.any(),
  description: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Validation functions
export const validateCharacter = (data: unknown) => CharacterSchema.parse(data);
export const validateScene = (data: unknown) => SceneSchema.parse(data);
export const validateGameStartRequest = (data: unknown) => GameStartRequestSchema.parse(data);
export const validateNextSceneRequest = (data: unknown) => NextSceneRequestSchema.parse(data);
export const validateAIResponse = (data: unknown) => AIResponseSchema.parse(data);

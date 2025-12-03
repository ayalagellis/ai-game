import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';

// Database connection
const pool = new Pool({
  connectionString: process.env['DATABASE_URL'] || ''
});

// Create the MCP server once (reused across requests)
const mcpServer = new McpServer({
  name: "dynamic-storylines-mcp-server",
  version: "1.0.0"
});

// ============= REGISTER ALL TOOLS =============

// Save game state
mcpServer.registerTool(
  'saveGameState',
  {
    title: 'Save Game State',
    description: 'Save game state for a character',
    inputSchema: {
      characterId: z.number(),
      characterData: z.string(),
      sceneData: z.string(),
      timestamp: z.string().optional()
    },
    outputSchema: { success: z.boolean(), message: z.string() }
  },
  async ({ characterId, characterData, sceneData, timestamp }) => {
    try {
      await pool.query(
        `INSERT INTO game_sessions (character_id, game_state, updated_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (character_id)
         DO UPDATE SET game_state = $2, updated_at = $3`,
        [characterId, JSON.stringify({ character: characterData, scene: sceneData }), timestamp || new Date()]
      );
      
      const output = { success: true, message: "Game state saved" };
      return {
        content: [{ type: 'text', text: JSON.stringify(output) }],
        structuredContent: output
      };
    } catch (error) {
      throw new Error(`Failed to save game state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// Load game state
mcpServer.registerTool(
  'loadGameState',
  {
    title: 'Load Game State',
    description: 'Load game state for a character',
    inputSchema: {
      characterId: z.number()
    },
    outputSchema: z.any()
  },
  async ({ characterId }) => {
    try {
      const charResult = await pool.query(
        'SELECT * FROM characters WHERE id = $1',
        [characterId]
      );
      
      if (charResult.rows.length === 0) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              characterMemory: { character: {}, recentChoices: [], personalityTraits: [], relationships: {} },
              sceneMemory: { recentScenes: [], importantEvents: [], locationHistory: [] },
              worldMemory: { flags: [], globalEvents: [], npcStates: {}, worldState: 'initial' }
            })
          }]
        };
      }
      
      const scenesResult = await pool.query(
        'SELECT * FROM scenes WHERE character_id = $1 ORDER BY scene_number DESC LIMIT 5',
        [characterId]
      );
      
      const flagsResult = await pool.query('SELECT * FROM world_flags');
      
      const gameState = {
        characterMemory: {
          character: charResult.rows[0],
          recentChoices: [] as any[],
          personalityTraits: [] as string[],
          relationships: {} as Record<string, any>
        },
        sceneMemory: {
          recentScenes: scenesResult.rows,
          importantEvents: [] as string[],
          locationHistory: [] as string[]
        },
        worldMemory: {
          flags: flagsResult.rows,
          globalEvents: [] as string[],
          npcStates: {} as Record<string, any>,
          worldState: 'active' as string
        }
      };
      
      return {
        content: [{ type: 'text', text: JSON.stringify(gameState) }],
        structuredContent: gameState
      };
    } catch (error) {
      throw new Error(`Failed to load game state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// Update character stats
mcpServer.registerTool(
  'updateCharacterStats',
  {
    title: 'Update Character Stats',
    description: 'Update character statistics',
    inputSchema: {
      characterId: z.number(),
      updates: z.string(),
      timestamp: z.string().optional()
    },
    outputSchema: { success: z.boolean(), message: z.string() }
  },
  async ({ characterId, updates }) => {
    try {
      const statsUpdates = JSON.parse(updates);
      
      await pool.query(
        'UPDATE characters SET stats = stats || $1::jsonb WHERE id = $2',
        [JSON.stringify(statsUpdates), characterId]
      );
      
      const output = { success: true, message: "Character stats updated" };
      return {
        content: [{ type: 'text', text: JSON.stringify(output) }],
        structuredContent: output
      };
    } catch (error) {
      throw new Error(`Failed to update character stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// Get world flags
mcpServer.registerTool(
  'getWorldFlags',
  {
    title: 'Get World Flags',
    description: 'Get all world flags',
    inputSchema: {},
    outputSchema: z.array(z.any())
  },
  async () => {
    try {
      const result = await pool.query('SELECT * FROM world_flags');
      
      // Return array in content text only (structuredContent must be object, not array)
      return {
        content: [{ type: 'text', text: JSON.stringify(result.rows) }]
      };
    } catch (error) {
      throw new Error(`Failed to get world flags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// Set world flag
mcpServer.registerTool(
  'setWorldFlag',
  {
    title: 'Set World Flag',
    description: 'Set a world flag',
    inputSchema: {
      flagName: z.string(),
      value: z.string(),
      timestamp: z.string().optional()
    },
    outputSchema: { success: z.boolean(), message: z.string() }
  },
  async ({ flagName, value }) => {
    try {
      const parsedValue = JSON.parse(value);
      
      await pool.query(
        `INSERT INTO world_flags (flag_name, value)
         VALUES ($1, $2)
         ON CONFLICT (flag_name)
         DO UPDATE SET value = $2, updated_at = NOW()`,
        [flagName, parsedValue]
      );
      
      const output = { success: true, message: "World flag set" };
      return {
        content: [{ type: 'text', text: JSON.stringify(output) }],
        structuredContent: output
      };
    } catch (error) {
      throw new Error(`Failed to set world flag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// Get character memory
mcpServer.registerTool(
  'getCharacterMemory',
  {
    title: 'Get Character Memory',
    description: 'Get character memory',
    inputSchema: {
      characterId: z.number()
    },
    outputSchema: z.any()
  },
  async ({ characterId }) => {
    try {
      const result = await pool.query(
        'SELECT * FROM characters WHERE id = $1',
        [characterId]
      );
      
      const memory = result.rows.length === 0 
        ? { character: {}, recentChoices: [], personalityTraits: [], relationships: {} }
        : { character: result.rows[0], recentChoices: [] as string[], personalityTraits: [] as string[], relationships: {} };
      
      return {
        content: [{ type: 'text', text: JSON.stringify(memory) }],
        structuredContent: memory
      };
    } catch (error) {
      throw new Error(`Failed to get character memory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// Update character memory
mcpServer.registerTool(
  'updateCharacterMemory',
  {
    title: 'Update Character Memory',
    description: 'Update character memory',
    inputSchema: {
      characterId: z.number(),
      updates: z.string(),
      timestamp: z.string().optional()
    },
    outputSchema: { success: z.boolean(), message: z.string() }
  },
  async ({ characterId, updates }) => {
    try {
      const memoryUpdates = JSON.parse(updates);
      
      await pool.query(
        `UPDATE characters 
         SET stats = jsonb_set(
           COALESCE(stats, '{}'::jsonb),
           '{memory}',
           $1::jsonb,
           true
         ),
         updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(memoryUpdates), characterId]
      );
      
      const output = { success: true, message: "Character memory updated" };
      return {
        content: [{ type: 'text', text: JSON.stringify(output) }],
        structuredContent: output
      };
    } catch (error) {
      throw new Error(`Failed to update character memory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// Get scene memory
mcpServer.registerTool(
  'getSceneMemory',
  {
    title: 'Get Scene Memory',
    description: 'Get scene memory',
    inputSchema: {
      characterId: z.number()
    },
    outputSchema: z.any()
  },
  async ({ characterId }) => {
    try {
      const result = await pool.query(
        'SELECT * FROM scenes WHERE character_id = $1 ORDER BY scene_number DESC LIMIT 10',
        [characterId]
      );
      
      const memory = {
        recentScenes: result.rows,
        importantEvents: [] as string[],
        locationHistory: [] as string[]
      };
      
      return {
        content: [{ type: 'text', text: JSON.stringify(memory) }],
        structuredContent: memory
      };
    } catch (error) {
      throw new Error(`Failed to get scene memory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// Update scene memory
mcpServer.registerTool(
  'updateSceneMemory',
  {
    title: 'Update Scene Memory',
    description: 'Update scene memory',
    inputSchema: {
      characterId: z.number(),
      updates: z.string(),
      timestamp: z.string().optional()
    },
    outputSchema: { success: z.boolean(), message: z.string() }
  },
  async ({ characterId, updates }) => {
    try {
      const memoryUpdates = JSON.parse(updates);
      
      await pool.query(
        `UPDATE scenes 
         SET metadata = jsonb_set(
           COALESCE(metadata, '{}'::jsonb),
           '{sceneMemory}',
           $1::jsonb,
           true
         ),
         updated_at = NOW()
         WHERE character_id = $2 
         AND scene_number = (
           SELECT MAX(scene_number) FROM scenes WHERE character_id = $2
         )`,
        [JSON.stringify(memoryUpdates), characterId]
      );
      
      const output = { success: true, message: "Scene memory updated" };
      return {
        content: [{ type: 'text', text: JSON.stringify(output) }],
        structuredContent: output
      };
    } catch (error) {
      throw new Error(`Failed to update scene memory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// Get world memory
mcpServer.registerTool(
  'getWorldMemory',
  {
    title: 'Get World Memory',
    description: 'Get world memory',
    inputSchema: {},
    outputSchema: z.any()
  },
  async () => {
    try {
      const flagsResult = await pool.query('SELECT * FROM world_flags');
      
      const memory = {
        flags: flagsResult.rows,
        globalEvents: [] as string[],
        npcStates: {},
        worldState: 'active'
      };
      
      return {
        content: [{ type: 'text', text: JSON.stringify(memory) }],
        structuredContent: memory
      };
    } catch (error) {
      throw new Error(`Failed to get world memory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// Update world memory
mcpServer.registerTool(
  'updateWorldMemory',
  {
    title: 'Update World Memory',
    description: 'Update world memory',
    inputSchema: {
      updates: z.string(),
      timestamp: z.string().optional()
    },
    outputSchema: { success: z.boolean(), message: z.string() }
  },
  async ({ updates }) => {
    try {
      const memoryUpdates = JSON.parse(updates);
      
      if (memoryUpdates.flags && Array.isArray(memoryUpdates.flags)) {
        for (const flag of memoryUpdates.flags) {
          await pool.query(
            `INSERT INTO world_flags (name, value, description)
             VALUES ($1, $2, $3)
             ON CONFLICT (name)
             DO UPDATE SET value = $2, updated_at = NOW()`,
            [
              flag.flag_name || flag.name, 
              JSON.stringify(flag.value),
              flag.description || null
            ]
          );
        }
      }
      
      if (memoryUpdates.globalEvents || memoryUpdates.npcStates || memoryUpdates.worldState) {
        await pool.query(
          `INSERT INTO world_flags (name, value, description)
           VALUES ('world_memory', $1, 'Global world state and memory')
           ON CONFLICT (name)
           DO UPDATE SET value = $1, updated_at = NOW()`,
          [JSON.stringify({
            globalEvents: memoryUpdates.globalEvents || [],
            npcStates: memoryUpdates.npcStates || {},
            worldState: memoryUpdates.worldState || 'active'
          })]
        );
      }
      
      const output = { success: true, message: "World memory updated" };
      return {
        content: [{ type: 'text', text: JSON.stringify(output) }],
        structuredContent: output
      };
    } catch (error) {
      throw new Error(`Failed to update world memory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// ============= EXPRESS ROUTER =============

export const mcpRouter = Router();

// Single persistent transport (not stateless)
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
  enableJsonResponse: true
});

// Connect once at startup
mcpServer.connect(transport).catch(error => {
  console.error('Failed to connect MCP server to transport:', error);
});

mcpRouter.post('/mcp', async (req: Request, res: Response) => {
  try {
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error'
        },
        id: null
      });
    }
  }
});

export { mcpServer };
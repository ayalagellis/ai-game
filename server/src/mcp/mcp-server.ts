import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env['DATABASE_URL'] || ''
});

const server = new Server(
  {
    name: "dynamic-storylines-mcp-server",
    version: "1.0.0",
    capabilities: {
      tools: {},
    }
  }
);

// List all available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "saveGameState",
        description: "Save game state for a character",
        inputSchema: {
          type: "object",
          properties: {
            characterId: { type: "number" },
            characterData: { type: "string" },
            sceneData: { type: "string" },
            timestamp: { type: "string" }
          },
          required: ["characterId", "characterData", "sceneData"]
        }
      },
      {
        name: "loadGameState",
        description: "Load game state for a character",
        inputSchema: {
          type: "object",
          properties: {
            characterId: { type: "number" }
          },
          required: ["characterId"]
        }
      },
      {
        name: "updateCharacterStats",
        description: "Update character statistics",
        inputSchema: {
          type: "object",
          properties: {
            characterId: { type: "number" },
            updates: { type: "string" },
            timestamp: { type: "string" }
          },
          required: ["characterId", "updates"]
        }
      },
      {
        name: "getWorldFlags",
        description: "Get all world flags",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "setWorldFlag",
        description: "Set a world flag",
        inputSchema: {
          type: "object",
          properties: {
            flagName: { type: "string" },
            value: { type: "string" },
            timestamp: { type: "string" }
          },
          required: ["flagName", "value"]
        }
      },
      {
        name: "getCharacterMemory",
        description: "Get character memory",
        inputSchema: {
          type: "object",
          properties: {
            characterId: { type: "number" }
          },
          required: ["characterId"]
        }
      },
      {
        name: "updateCharacterMemory",
        description: "Update character memory",
        inputSchema: {
          type: "object",
          properties: {
            characterId: { type: "number" },
            updates: { type: "string" },
            timestamp: { type: "string" }
          },
          required: ["characterId", "updates"]
        }
      },
      {
        name: "getSceneMemory",
        description: "Get scene memory",
        inputSchema: {
          type: "object",
          properties: {
            characterId: { type: "number" }
          },
          required: ["characterId"]
        }
      },
      {
        name: "updateSceneMemory",
        description: "Update scene memory",
        inputSchema: {
          type: "object",
          properties: {
            characterId: { type: "number" },
            updates: { type: "string" },
            timestamp: { type: "string" }
          },
          required: ["characterId", "updates"]
        }
      },
      {
        name: "getWorldMemory",
        description: "Get world memory",
        inputSchema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "updateWorldMemory",
        description: "Update world memory",
        inputSchema: {
          type: "object",
          properties: {
            updates: { type: "string" },
            timestamp: { type: "string" }
          },
          required: ["updates"]
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    // ============= SAVE GAME STATE =============
    if (name === "saveGameState") {
        const { characterId, characterData, sceneData, timestamp } = args as {
            characterId: number;
            characterData: string;
            sceneData: string;
            timestamp?: string;
          };
          
      // Store in game_sessions table or a custom table
      await pool.query(
        `INSERT INTO game_sessions (character_id, game_state, updated_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (character_id)
         DO UPDATE SET game_state = $2, updated_at = $3`,
        [characterId, JSON.stringify({ character: characterData, scene: sceneData }), timestamp || new Date()]
      );
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ success: true, message: "Game state saved" })
        }]
      };
    }
    
    // ============= LOAD GAME STATE =============
    if (name === "loadGameState") {
      const { characterId } = args as { characterId: number };
      
      // Load character
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
      
      // Load recent scenes
      const scenesResult = await pool.query(
        'SELECT * FROM scenes WHERE character_id = $1 ORDER BY scene_number DESC LIMIT 5',
        [characterId]
      );
      
      // Load world flags
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
        content: [{
          type: "text",
          text: JSON.stringify(gameState)
        }]
      };
    }
    
    // ============= UPDATE CHARACTER STATS =============
    if (name === "updateCharacterStats") {
      const { characterId, updates } = args as { characterId: number; updates: string };
      const statsUpdates = JSON.parse(updates);
      
      await pool.query(
        'UPDATE characters SET stats = stats || $1::jsonb WHERE id = $2',
        [JSON.stringify(statsUpdates), characterId]
      );
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ success: true, message: "Character stats updated" })
        }]
      };
    }
    
    // ============= GET WORLD FLAGS =============
    if (name === "getWorldFlags") {
      const result = await pool.query('SELECT * FROM world_flags');
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result.rows)
        }]
      };
    }
    
    // ============= SET WORLD FLAG =============
    if (name === "setWorldFlag") {
      const { flagName, value } = args as { flagName: string; value: string };
      const parsedValue = JSON.parse(value);
      
      await pool.query(
        `INSERT INTO world_flags (flag_name, value)
         VALUES ($1, $2)
         ON CONFLICT (flag_name)
         DO UPDATE SET value = $2, updated_at = NOW()`,
        [flagName, parsedValue]
      );
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ success: true, message: "World flag set" })
        }]
      };
    }
    
    // ============= GET CHARACTER MEMORY =============
    if (name === "getCharacterMemory") {
      const { characterId } = args as { characterId: number };
      
      const result = await pool.query(
        'SELECT * FROM characters WHERE id = $1',
        [characterId]
      );
      
      if (result.rows.length === 0) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              character: {},
              recentChoices: [],
              personalityTraits: [],
              relationships: {}
            })
          }]
        };
      }
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            character: result.rows[0],
            recentChoices: [],
            personalityTraits: [],
            relationships: {}
          })
        }]
      };
    }
    
    // ============= UPDATE CHARACTER MEMORY =============
    if (name === "updateCharacterMemory") {
        const { characterId, updates } = args as {
          characterId: number;
          updates: string;
        };
        
        const memoryUpdates = JSON.parse(updates);
        
        // Update character's stats with memory data
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
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true, message: "Character memory updated" })
          }]
        };
      }
          
    // ============= GET SCENE MEMORY =============
    if (name === "getSceneMemory") {
      const { characterId } = args as { characterId: number };
      
      const result = await pool.query(
        'SELECT * FROM scenes WHERE character_id = $1 ORDER BY scene_number DESC LIMIT 10',
        [characterId]
      );
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            recentScenes: result.rows,
            importantEvents: [],
            locationHistory: []
          })
        }]
      };
    }
    
    // ============= UPDATE SCENE MEMORY =============
    if (name === "updateSceneMemory") {
        const { characterId, updates } = args as {
          characterId: number;
          updates: string;
        };
        
        const memoryUpdates = JSON.parse(updates);
        
        // Store in the most recent scene's metadata
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
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true, message: "Scene memory updated" })
          }]
        };
      }
          
    // ============= GET WORLD MEMORY =============
    if (name === "getWorldMemory") {
      const flagsResult = await pool.query('SELECT * FROM world_flags');
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            flags: flagsResult.rows,
            globalEvents: [],
            npcStates: {},
            worldState: 'active'
          })
        }]
      };
    }
    
    // ============= UPDATE WORLD MEMORY =============
    if (name === "updateWorldMemory") {
        const { updates } = args as { updates: string };
        
        const memoryUpdates = JSON.parse(updates);
        
        // Update world flags if included
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
        
        // Store global events and NPC states in a special world_memory flag
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
        
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true, message: "World memory updated" })
          }]
        };
      }
          
    throw new Error(`Unknown tool: ${name}`);
    
  } catch (error) {
    console.error(`Error in tool ${name}:`, error);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ 
          error: error instanceof Error ? error.message : 'Unknown error',
          tool: name
        })
      }],
      isError: true
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP server started successfully'); // stderr doesn't interfere with protocol
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
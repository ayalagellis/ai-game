import { Pool } from 'pg';
import { Scene, Choice, SceneMetadata } from '../../../shared/types';
import { logger } from '../utils/logger';

export class SceneService {
  private db: Pool;

  constructor() {
    const connectionString = process.env['DATABASE_URL'];
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    this.db = new Pool({
      connectionString,
      ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async createScene(data: {
    characterId: number;
    sceneNumber: number;
    description: string;
    choices: Choice[];
    metadata: SceneMetadata;
    isEnding: boolean;
    endingType?: string;
  }): Promise<Scene> {
    try {
      const query = `
        INSERT INTO scenes (character_id, scene_number, description, choices, metadata, is_ending, ending_type)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      // For JSONB columns, pass objects directly - pg library handles conversion
      const values = [
        data.characterId,
        data.sceneNumber,
        data.description,
        JSON.stringify(data.choices), 
        JSON.stringify(data.metadata), 
        data.isEnding,
        data.endingType || null
      ];

      const result = await this.db.query(query, values);
      const scene = this.mapRowToScene(result.rows[0]);

      logger.info(`Scene created: ID ${scene.id} for character ${data.characterId}`);
      return scene;
    } catch (error) {
      logger.error('Failed to create scene:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('connect')) {
        throw new Error('Database connection failed. Please check your DATABASE_URL and ensure PostgreSQL is running.');
      }
      throw new Error(`Scene creation failed: ${errorMessage}`);
    }
  }

  async getScene(id: number): Promise<Scene> {
    try {
      const query = 'SELECT * FROM scenes WHERE id = $1';
      const result = await this.db.query(query, [id]);

      if (result.rows.length === 0) {
        throw new Error('Scene not found');
      }

      return this.mapRowToScene(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get scene:', error);
      throw new Error('Scene retrieval failed');
    }
  }

  async getSceneHistory(characterId: number): Promise<Scene[]> {
    try {
      const query = `
        SELECT * FROM scenes 
        WHERE character_id = $1 
        ORDER BY scene_number ASC
      `;
      const result = await this.db.query(query, [characterId]);

      return result.rows.map(row => this.mapRowToScene(row));
    } catch (error) {
      logger.error('Failed to get scene history:', error);
      throw new Error('Scene history retrieval failed');
    }
  }

  async getCurrentScene(characterId: number): Promise<Scene | null> {
    try {
      const query = `
        SELECT * FROM scenes 
        WHERE character_id = $1 
        ORDER BY scene_number DESC 
        LIMIT 1
      `;
      const result = await this.db.query(query, [characterId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToScene(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get current scene:', error);
      throw new Error('Current scene retrieval failed');
    }
  }

  async getScenesByCharacter(characterId: number): Promise<Scene[]> {
    try {
      const query = `
        SELECT * FROM scenes 
        WHERE character_id = $1 
        ORDER BY created_at ASC
      `;
      const result = await this.db.query(query, [characterId]);

      return result.rows.map(row => this.mapRowToScene(row));
    } catch (error) {
      logger.error('Failed to get scenes by character:', error);
      throw new Error('Scenes retrieval failed');
    }
  }

  async updateScene(id: number, updates: Partial<{
    description: string;
    choices: Choice[];
    metadata: SceneMetadata;
    isEnding: boolean;
    endingType: string;
  }>): Promise<void> {
    try {
      const setClauses = [];
      const values = [];
      let paramCount = 1;

      if (updates.description !== undefined) {
        setClauses.push(`description = $${paramCount}`);
        values.push(updates.description);
        paramCount++;
      }

      if (updates.choices !== undefined) {
        setClauses.push(`choices = $${paramCount}`);
        values.push(updates.choices);  // Pass object directly for JSONB
        paramCount++;
      }

      if (updates.metadata !== undefined) {
        setClauses.push(`metadata = $${paramCount}`);
        values.push(updates.metadata);  // Pass object directly for JSONB
        paramCount++;
      }

      if (updates.isEnding !== undefined) {
        setClauses.push(`is_ending = $${paramCount}`);
        values.push(updates.isEnding);
        paramCount++;
      }

      if (updates.endingType !== undefined) {
        setClauses.push(`ending_type = $${paramCount}`);
        values.push(updates.endingType);
        paramCount++;
      }

      if (setClauses.length === 0) {
        return;
      }

      setClauses.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE scenes 
        SET ${setClauses.join(', ')}
        WHERE id = $${paramCount}
      `;

      await this.db.query(query, values);
      logger.info(`Scene updated: ID ${id}`);
    } catch (error) {
      logger.error('Failed to update scene:', error);
      throw new Error('Scene update failed');
    }
  }

  async deleteScene(id: number): Promise<void> {
    try {
      const query = 'DELETE FROM scenes WHERE id = $1';
      await this.db.query(query, [id]);
      logger.info(`Scene deleted: ID ${id}`);
    } catch (error) {
      logger.error('Failed to delete scene:', error);
      throw new Error('Scene deletion failed');
    }
  }

  async deleteScenesByCharacter(characterId: number): Promise<void> {
    try {
      const query = 'DELETE FROM scenes WHERE character_id = $1';
      await this.db.query(query, [characterId]);
      logger.info(`All scenes deleted for character: ID ${characterId}`);
    } catch (error) {
      logger.error('Failed to delete scenes by character:', error);
      throw new Error('Scenes deletion failed');
    }
  }

  async getSceneStatistics(characterId: number): Promise<{
    totalScenes: number;
    endingScenes: number;
    averageChoicesPerScene: number;
    mostCommonMood: string;
  }> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_scenes,
          COUNT(CASE WHEN is_ending = true THEN 1 END) as ending_scenes,
          AVG(jsonb_array_length(choices)) as avg_choices,
          mode() WITHIN GROUP (ORDER BY metadata->>'mood') as most_common_mood
        FROM scenes 
        WHERE character_id = $1
      `;
      
      const result = await this.db.query(query, [characterId]);
      const stats = result.rows[0];

      return {
        totalScenes: parseInt(stats.total_scenes) || 0,
        endingScenes: parseInt(stats.ending_scenes) || 0,
        averageChoicesPerScene: parseFloat(stats.avg_choices) || 0,
        mostCommonMood: stats.most_common_mood || 'neutral'
      };
    } catch (error) {
      logger.error('Failed to get scene statistics:', error);
      return {
        totalScenes: 0,
        endingScenes: 0,
        averageChoicesPerScene: 0,
        mostCommonMood: 'neutral'
      };
    }
  }

  async getPopularChoices(characterId: number): Promise<Array<{
    choiceText: string;
    frequency: number;
    sceneNumber: number;
  }>> {
    try {
      const query = `
        SELECT 
          choice->>'text' as choice_text,
          COUNT(*) as frequency,
          scene_number
        FROM scenes,
             jsonb_array_elements(choices) as choice
        WHERE character_id = $1
        GROUP BY choice->>'text', scene_number
        ORDER BY frequency DESC
        LIMIT 10
      `;
      
      const result = await this.db.query(query, [characterId]);
      
      return result.rows.map(row => ({
        choiceText: row.choice_text,
        frequency: parseInt(row.frequency),
        sceneNumber: row.scene_number
      }));
    } catch (error) {
      logger.error('Failed to get popular choices:', error);
      return [];
    }
  }

  private mapRowToScene(row: any): Scene {
    return {
      id: row.id,
      characterId: row.character_id,
      sceneNumber: row.scene_number,
      description: row.description,
      // JSONB columns are already parsed by PostgreSQL
      //choices: typeof row.choices === 'string' ? JSON.parse(row.choices) : row.choices,
      choices: row.choices ?? [],   
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      isEnding: row.is_ending,
      endingType: row.ending_type,
      createdAt: new Date(row.created_at)
    };
  }
}

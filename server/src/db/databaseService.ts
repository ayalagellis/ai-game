import { Pool } from 'pg';
import { logger } from '../utils/logger.js';

export class DatabaseService {
  private db: Pool;

  constructor() {
    this.db = new Pool({
      connectionString: process.env['DATABASE_URL'],
      ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.createTables();
      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    // Create characters table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS characters (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        class VARCHAR(50) NOT NULL,
        background TEXT NOT NULL,
        stats JSONB NOT NULL DEFAULT '{}',
        inventory JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create scenes table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS scenes (
        id SERIAL PRIMARY KEY,
        character_id INTEGER NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
        scene_number INTEGER NOT NULL,
        description TEXT NOT NULL,
        choices JSONB NOT NULL DEFAULT '[]',
        metadata JSONB NOT NULL DEFAULT '{}',
        is_ending BOOLEAN DEFAULT FALSE,
        ending_type VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create world_flags table
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS world_flags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        value JSONB NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_scenes_character_id ON scenes(character_id);
    `);

    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_scenes_scene_number ON scenes(character_id, scene_number);
    `);

    await this.db.query(`
      CREATE INDEX IF NOT EXISTS idx_world_flags_name ON world_flags(name);
    `);

    // Create triggers for updated_at timestamps
    await this.db.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await this.db.query(`
      DROP TRIGGER IF EXISTS update_characters_updated_at ON characters;
      CREATE TRIGGER update_characters_updated_at
        BEFORE UPDATE ON characters
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await this.db.query(`
      DROP TRIGGER IF EXISTS update_scenes_updated_at ON scenes;
      CREATE TRIGGER update_scenes_updated_at
        BEFORE UPDATE ON scenes
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await this.db.query(`
      DROP TRIGGER IF EXISTS update_world_flags_updated_at ON world_flags;
      CREATE TRIGGER update_world_flags_updated_at
        BEFORE UPDATE ON world_flags
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  async seed(): Promise<void> {
    try {
      // Insert some default world flags
      await this.db.query(`
        INSERT INTO world_flags (name, value, description)
        VALUES 
          ('game_initialized', true, 'Game system has been initialized'),
          ('default_mood', 'neutral', 'Default scene mood'),
          ('max_scenes_per_game', 20, 'Maximum scenes per game session')
        ON CONFLICT (name) DO NOTHING
      `);

      logger.info('Database seeded successfully');
    } catch (error) {
      logger.error('Failed to seed database:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.db.end();
  }
}

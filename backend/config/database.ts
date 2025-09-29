import { Pool } from 'pg';
import { config } from 'dotenv';

config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'escape_ai_lab',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export default pool;

// Database initialization
export async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'waiting',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        max_players INTEGER DEFAULT 4,
        current_puzzle_id VARCHAR(255),
        game_state JSONB
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
        socket_id VARCHAR(255) UNIQUE,
        name VARCHAR(255) NOT NULL,
        score INTEGER DEFAULT 0,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS puzzles (
        id VARCHAR(255) PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        difficulty VARCHAR(20) DEFAULT 'medium',
        data JSONB NOT NULL,
        solution JSONB NOT NULL,
        hints JSONB DEFAULT '[]'::jsonb
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
        puzzle_id VARCHAR(255) REFERENCES puzzles(id),
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        time_taken INTEGER,
        hints_used INTEGER DEFAULT 0
      )
    `);

    // Insert sample puzzles
    await client.query(`
      INSERT INTO puzzles (id, type, difficulty, data, solution, hints) VALUES
      ('memory-grid-1', 'memoryGrid', 'easy', 
       '{"size": 4, "tiles": ["X", "O", "O", "X", "O", "X", "X", "O", "X", "O", "O", "X", "O", "X", "X", "O"], "pattern": "alternating"}',
       '{"revealed": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]}',
       '["Look for patterns in the tiles", "Try clicking tiles in sequence", "The pattern repeats every 2 tiles"]')
      ON CONFLICT (id) DO NOTHING
    `);

    await client.query(`
      INSERT INTO puzzles (id, type, difficulty, data, solution, hints) VALUES
      ('riddle-1', 'riddle', 'medium',
       '{"question": "I speak without a mouth and hear without ears. I have no body, but come alive with wind. What am I?", "options": ["Echo", "Wind", "Shadow", "Sound"]}',
       '{"answer": "Echo"}',
       '["Think about what repeats sounds", "It bounces back what you say", "It has no physical form"]')
      ON CONFLICT (id) DO NOTHING
    `);

    await client.query(`
      INSERT INTO puzzles (id, type, difficulty, data, solution, hints) VALUES
      ('code-match-1', 'codeMatch', 'hard',
       '{"sequence": [1, 1, 2, 3, 5, 8, 13], "pattern": "fibonacci", "nextNumbers": [21, 34, 55]}',
       '{"correctSequence": [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]}',
       '["Look at the relationship between consecutive numbers", "Each number is the sum of the two before it", "This is a famous mathematical sequence"]')
      ON CONFLICT (id) DO NOTHING
    `);

    client.release();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

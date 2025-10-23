import { DatabaseService } from './databaseService';

async function migrate() {
  const db = new DatabaseService();
  
  try {
    console.log('Starting database migration...');
    await db.initialize();
    await db.seed();
    console.log('Database migration completed successfully!');
  } catch (error) {
    console.error('Database migration failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

migrate();

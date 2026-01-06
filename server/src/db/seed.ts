import { Pool } from 'pg';
import { CharacterService } from '../services/characterService.js';

async function seed() {
  const db = new Pool({
    connectionString: process.env['DATABASE_URL'],
    ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false
  });

  const characterService = new CharacterService();

  try {
    console.log('Starting database seeding...');

    // Create sample characters
    const sampleCharacters = [
      {
        name: 'Aria Shadowbane',
        class: 'rogue',
        background: 'A former thief who turned to adventuring after a heist went wrong.'
      },
      {
        name: 'Thorin Ironbeard',
        class: 'warrior',
        background: 'A dwarven warrior seeking to reclaim his ancestral homeland.'
      },
      {
        name: 'Luna Starweaver',
        class: 'mage',
        background: 'An elven mage studying ancient magic at the Arcane Academy.'
      },
      {
        name: 'Brother Marcus',
        class: 'cleric',
        background: 'A human cleric spreading the word of the Light across the realm.'
      }
    ];

    for (const charData of sampleCharacters) {
      try {
        const character = await characterService.createCharacter(charData);
        console.log(`Created sample character: ${character.name}`);
      } catch (error) {
        console.log(`Character ${charData.name} might already exist, skipping...`);
      }
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

seed();

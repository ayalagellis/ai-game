import { Pool } from 'pg';
import { Character, CharacterStats, InventoryItem } from '../../../shared/types';
import { logger } from '../utils/logger';

export class CharacterService {
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

  async createCharacter(data: {
    name: string;
    class: string;
    background: string;
  }): Promise<Character> {
    try {
      const defaultStats = this.getDefaultStats(data.class);
      const defaultInventory = this.getDefaultInventory(data.class);
      const query = `
        INSERT INTO characters (name, class, background, stats, inventory)
        VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
        RETURNING *
      `;
      // Stringify JSON data to ensure valid JSON is sent to Postgres and strip any
      // non-serializable values (undefined/functions). Casting in SQL ensures JSONB type.
      const values = [
        data.name,
        data.class,
        data.background,
        JSON.stringify(defaultStats),
        JSON.stringify(defaultInventory)
      ];

      const result = await this.db.query(query, values);  
  
      const character = this.mapRowToCharacter(result.rows[0]);
  
      logger.info(`Character created: ${character.name} (ID: ${character.id})`);
      return character;
      } catch (error) {
      logger.error('Failed to create character:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('connect')) {
        throw new Error('Database connection failed. Please check your DATABASE_URL and ensure PostgreSQL is running.');
      }
      throw new Error(`Character creation failed: ${errorMessage}`);
    }
  }

  async getCharacter(id: number): Promise<Character> {
    try {
      const query = 'SELECT * FROM characters WHERE id = $1';
      const result = await this.db.query(query, [id]);

      if (result.rows.length === 0) {
        throw new Error('Character not found');
      }

      return this.mapRowToCharacter(result.rows[0]);
    } catch (error) {
      logger.error('Failed to get character:', error);
      throw new Error('Character retrieval failed');
    }
  }

  async updateCharacterStats(id: number, updates: Partial<CharacterStats>): Promise<void> {
    try {
      const character = await this.getCharacter(id);
      const updatedStats = { ...character.stats, ...updates };

      const query = `
        UPDATE characters 
        SET stats = $1::jsonb, updated_at = NOW()
        WHERE id = $2
      `;

      await this.db.query(query, [JSON.stringify(updatedStats), id]);  // Send JSON string and cast to jsonb
      logger.info(`Character stats updated for ID ${id}`);
    } catch (error) {
      logger.error('Failed to update character stats:', error);
      throw new Error('Character stats update failed');
    }
  }

  async updateInventory(
    id: number, 
    changes: { gained: InventoryItem[]; lost: string[] }
  ): Promise<void> {
    try {
      const character = await this.getCharacter(id);
      let updatedInventory = [...character.inventory];

      // Add gained items
      for (const item of changes.gained) {
        const existingItem = updatedInventory.find(i => i.name === item.name);
        if (existingItem) {
          existingItem.quantity += item.quantity;
        } else {
          updatedInventory.push(item);
        }
      }

      // Remove lost items
      updatedInventory = updatedInventory.filter(item => 
        !changes.lost.includes(item.id) && !changes.lost.includes(item.name)
      );

      const query = `
        UPDATE characters 
        SET inventory = $1::jsonb, updated_at = NOW()
        WHERE id = $2
      `;

      await this.db.query(query, [JSON.stringify(updatedInventory), id]);  // Send JSON string and cast to jsonb
      logger.info(`Inventory updated for character ID ${id}`);
    } catch (error) {
      logger.error('Failed to update inventory:', error);
      throw new Error('Inventory update failed');
    }
  }

  async getAllCharacters(): Promise<Character[]> {
    try {
      const query = 'SELECT * FROM characters ORDER BY created_at DESC';
      const result = await this.db.query(query);
      
      return result.rows.map(row => this.mapRowToCharacter(row));
    } catch (error) {
      logger.error('Failed to get all characters:', error);
      throw new Error('Character retrieval failed');
    }
  }

  async deleteCharacter(id: number): Promise<void> {
    try {
      const query = 'DELETE FROM characters WHERE id = $1';
      await this.db.query(query, [id]);
      logger.info(`Character deleted: ID ${id}`);
    } catch (error) {
      logger.error('Failed to delete character:', error);
      throw new Error('Character deletion failed');
    }
  }

  private getDefaultStats(characterClass: string): CharacterStats {
    const baseStats = {
      health: 100,
      maxHealth: 100,
      mana: 50,
      maxMana: 50,
      strength: 10,
      intelligence: 10,
      dexterity: 10,
      charisma: 10,
      wisdom: 10,
      constitution: 10,
      level: 1,
      experience: 0,
      gold: 100
    };

    // Adjust stats based on class
    switch (characterClass.toLowerCase()) {
      case 'warrior':
        return {
          ...baseStats,
          strength: 14,
          constitution: 12,
          health: 120,
          maxHealth: 120
        };
      
      case 'mage':
        return {
          ...baseStats,
          intelligence: 14,
          wisdom: 12,
          mana: 80,
          maxMana: 80
        };
      
      case 'rogue':
        return {
          ...baseStats,
          dexterity: 14,
          charisma: 12
        };
      
      case 'cleric':
        return {
          ...baseStats,
          wisdom: 14,
          constitution: 12,
          mana: 70,
          maxMana: 70
        };
      
      default:
        return baseStats;
    }
  }

  private getDefaultInventory(characterClass: string): InventoryItem[] {
    const baseInventory = [
      {
        id: 'basic_clothes',
        name: 'Basic Clothes',
        description: 'Simple, comfortable clothing',
        type: 'misc' as const,
        value: 5,
        quantity: 1
      },
      {
        id: 'rations',
        name: 'Rations',
        description: 'Basic food supplies',
        type: 'consumable' as const,
        value: 2,
        quantity: 3
      }
    ];

    // Add class-specific starting items
    switch (characterClass.toLowerCase()) {
      case 'warrior':
        return [
          ...baseInventory,
          {
            id: 'iron_sword',
            name: 'Iron Sword',
            description: 'A sturdy iron sword',
            type: 'weapon' as const,
            value: 25,
            quantity: 1
          },
          {
            id: 'leather_armor',
            name: 'Leather Armor',
            description: 'Basic leather protection',
            type: 'armor' as const,
            value: 15,
            quantity: 1
          }
        ];
      
      case 'mage':
        return [
          ...baseInventory,
          {
            id: 'staff',
            name: 'Wooden Staff',
            description: 'A simple wooden staff for channeling magic',
            type: 'weapon' as const,
            value: 20,
            quantity: 1
          },
          {
            id: 'spellbook',
            name: 'Spellbook',
            description: 'A book containing basic spells',
            type: 'misc' as const,
            value: 30,
            quantity: 1
          }
        ];
      
      case 'rogue':
        return [
          ...baseInventory,
          {
            id: 'dagger',
            name: 'Iron Dagger',
            description: 'A sharp, lightweight dagger',
            type: 'weapon' as const,
            value: 15,
            quantity: 1
          },
          {
            id: 'thieves_tools',
            name: 'Thieves\' Tools',
            description: 'Tools for picking locks and disarming traps',
            type: 'misc' as const,
            value: 25,
            quantity: 1
          }
        ];
      
      case 'cleric':
        return [
          ...baseInventory,
          {
            id: 'mace',
            name: 'Wooden Mace',
            description: 'A simple mace for combat',
            type: 'weapon' as const,
            value: 18,
            quantity: 1
          },
          {
            id: 'holy_symbol',
            name: 'Holy Symbol',
            description: 'A symbol of your faith',
            type: 'misc' as const,
            value: 20,
            quantity: 1
          }
        ];
      
      default:
        return baseInventory;
    }
  }

  private mapRowToCharacter(row: any): Character {
    // JSONB columns are already parsed by PostgreSQL, so we don't need to JSON.parse
    // But handle both cases: if it's already an object, use it; if it's a string, parse it
    const stats = typeof row.stats === 'string' ? JSON.parse(row.stats) : row.stats;
    const inventory = typeof row.inventory === 'string' ? JSON.parse(row.inventory) : row.inventory;
    
    return {
      id: row.id,
      name: row.name,
      class: row.class,
      background: row.background,
      stats,
      inventory,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

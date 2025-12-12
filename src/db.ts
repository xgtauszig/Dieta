import { openDB, type DBSchema } from 'idb';

interface Meals {
  id?: number;
  date: string; // ISO string YYYY-MM-DD
  name: string;
  calories: number;
  image?: Blob; // Stored image
}

interface Water {
  id?: number;
  date: string; // ISO string YYYY-MM-DD
  amount: number; // in ml
}

interface Weight {
  id?: number;
  date: string; // ISO string YYYY-MM-DD
  kg: number;
}

interface Settings {
  key: string;
  value: unknown;
}

interface DietaDB extends DBSchema {
  meals: {
    key: number;
    value: Meals;
    indexes: { 'by-date': string };
  };
  water: {
    key: number;
    value: Water;
    indexes: { 'by-date': string };
  };
  weight: {
    key: number;
    value: Weight;
    indexes: { 'by-date': string };
  };
  settings: {
    key: string;
    value: Settings;
  };
}

const DB_NAME = 'dieta-pwa-db';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB<DietaDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('meals')) {
        const store = db.createObjectStore('meals', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by-date', 'date');
      }
      if (!db.objectStoreNames.contains('water')) {
        const store = db.createObjectStore('water', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by-date', 'date');
      }
      if (!db.objectStoreNames.contains('weight')) {
        const store = db.createObjectStore('weight', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by-date', 'date');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });
};

export const dbActions = {
  // Meals
  addMeal: async (meal: Omit<Meals, 'id'>) => {
    const db = await initDB();
    return db.add('meals', meal);
  },
  getMealsByDate: async (date: string) => {
    const db = await initDB();
    return db.getAllFromIndex('meals', 'by-date', date);
  },
  
  // Water
  addWater: async (water: Omit<Water, 'id'>) => {
    const db = await initDB();
    return db.add('water', water);
  },
  getWaterByDate: async (date: string) => {
    const db = await initDB();
    return db.getAllFromIndex('water', 'by-date', date);
  },
  
  // Weight
  addWeight: async (weight: Omit<Weight, 'id'>) => {
    const db = await initDB();
    return db.add('weight', weight);
  },
  getAllWeights: async () => {
    const db = await initDB();
    return db.getAll('weight');
  },
  
  // Settings
  setSetting: async (key: string, value: unknown) => {
    const db = await initDB();
    return db.put('settings', { key, value });
  },
  getSetting: async (key: string) => {
    const db = await initDB();
    const result = await db.get('settings', key);
    return result?.value;
  },
};

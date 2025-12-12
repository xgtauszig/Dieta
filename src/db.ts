import { openDB, type DBSchema } from 'idb';

interface MealItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
}

interface Meals {
  id?: number;
  date: string; // ISO string YYYY-MM-DD
  name: string;
  items?: MealItem[]; // New field for detailed items
  calories: number; // Total calories (sum of items or manual)
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

interface Food {
  id?: number;
  name: string;
  unit: string; // e.g., 'g', 'ml', 'unit', 'tbsp', 'tsp'
  caloriesPerUnit: number;
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
  foods: {
    key: number;
    value: Food;
    indexes: { 'by-name': string };
  };
}

const DB_NAME = 'dieta-pwa-db';
const DB_VERSION = 2; // Incremented version

export const initDB = async () => {
  return openDB<DietaDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        // v1 stores
        const mealsStore = db.createObjectStore('meals', { keyPath: 'id', autoIncrement: true });
        mealsStore.createIndex('by-date', 'date');
        
        const waterStore = db.createObjectStore('water', { keyPath: 'id', autoIncrement: true });
        waterStore.createIndex('by-date', 'date');
        
        const weightStore = db.createObjectStore('weight', { keyPath: 'id', autoIncrement: true });
        weightStore.createIndex('by-date', 'date');
        
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      if (oldVersion < 2) {
        // v2 stores
        if (!db.objectStoreNames.contains('foods')) {
          const foodStore = db.createObjectStore('foods', { keyPath: 'id', autoIncrement: true });
          foodStore.createIndex('by-name', 'name');
        }
        
        // You could migrate existing meals to have empty items array here if needed,
        // but optional field 'items?' handles backward compatibility.
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
  deleteMeal: async (id: number) => {
    const db = await initDB();
    return db.delete('meals', id);
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
  deleteWater: async (id: number) => {
    const db = await initDB();
    return db.delete('water', id);
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
  deleteWeight: async (id: number) => {
    const db = await initDB();
    return db.delete('weight', id);
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

  // Foods (Recipes/Ingredients)
  addFood: async (food: Omit<Food, 'id'>) => {
    const db = await initDB();
    return db.add('foods', food);
  },
  getAllFoods: async () => {
    const db = await initDB();
    return db.getAll('foods');
  },
  deleteFood: async (id: number) => {
    const db = await initDB();
    return db.delete('foods', id);
  }
};

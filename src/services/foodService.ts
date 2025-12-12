import Fuse from 'fuse.js';
import { dbActions, type Food } from '../db';

export interface SearchResult extends Food {
  origin: 'taco' | 'user'; // We keep 'taco' as the literal type for system foods to minimize refactoring, but conceptually it's now TBCA
}

// Rename internal variable for clarity, though external interface remains compatible
let systemFoods: any[] | null = null;
let fuseSystem: Fuse<any> | null = null;

const loadSystemData = async () => {
  if (systemFoods) return;

  try {
    // Dynamic import of the new TBCA database
    const module = await import('../data/tbca_database.json');
    const data = module.default || module;
    systemFoods = data;

    // Configure Fuse for the larger dataset
    fuseSystem = new Fuse(systemFoods || [], {
      keys: [
        { name: 'nome', weight: 0.7 },
        { name: 'grupo', weight: 0.3 }
      ],
      threshold: 0.3, // Lower threshold for stricter/better matching on large dataset
      ignoreLocation: true,
      minMatchCharLength: 2
    });
  } catch (error) {
    console.error("Failed to load TBCA data", error);
  }
};

export const searchFoods = async (query: string): Promise<SearchResult[]> => {
  await loadSystemData();

  const userFoods = await dbActions.getAllFoods();
  const fuseUser = new Fuse(userFoods, {
    keys: ['name'],
    threshold: 0.4,
    ignoreLocation: true
  });

  const userResults = fuseUser.search(query).map(result => ({
    ...result.item,
    origin: 'user' as const
  }));

  const systemResults = fuseSystem?.search(query, { limit: 50 }).map(result => {
    const item = result.item;
    // Map TBCA fields to Food interface
    return {
      id: item.id,
      name: item.nome,
      unit: 'g',
      baseQuantity: 100,
      caloriesPerUnit: typeof item.calorias === 'number' ? item.calorias : 0,
      protein: typeof item.proteinas === 'number' ? item.proteinas : 0,
      carbohydrate: typeof item.carboidratos === 'number' ? item.carboidratos : 0,
      lipid: typeof item.gorduras === 'number' ? item.gorduras : 0,
      origin: 'taco' as const // Label as 'taco' (System) for UI consistency
    };
  }) || [];

  return [...userResults, ...systemResults];
};

import React, { useState, useEffect } from 'react';
import { dbActions } from '../db';
import { Plus, Trash2, X, Pencil, Search, ChefHat } from 'lucide-react';
import { searchFoods, type SearchResult } from '../services/foodService';
import { calculateRecipeTotals, normalizeRecipe, type CalculationMode } from '../utils/recipeUtils';

interface Food {
  id?: number;
  name: string;
  unit: string;
  baseQuantity?: number;
  caloriesPerUnit: number;
  protein?: number;
  carbohydrate?: number;
  lipid?: number;
  isRecipe?: boolean;
  ingredients?: any[]; // Simplified for local UI usage
  // Extra fields for recipe logic retention (optional, but good for editing)
  recipeMode?: CalculationMode;
  recipeFinalValue?: number;
}

const ManageFoods: React.FC = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecipeMode, setIsRecipeMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('g');
  const [baseQuantity, setBaseQuantity] = useState('1');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  // Recipe Form State
  const [recipeSearch, setRecipeSearch] = useState('');
  const [recipeSearchResults, setRecipeSearchResults] = useState<SearchResult[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<any[]>([]);
  const [recipeFinalWeight, setRecipeFinalWeight] = useState('');

  // New Recipe State
  const [recipeCalculationMode, setRecipeCalculationMode] = useState<CalculationMode>('weight');
  const [recipePortions, setRecipePortions] = useState('');

  const loadFoods = async () => {
    const allFoods = await dbActions.getAllFoods();
    setFoods(allFoods.sort((a, b) => a.name.localeCompare(b.name)));
  };

  useEffect(() => {
    const fetchData = async () => {
      await loadFoods();
    };
    fetchData();
  }, []);

  // Recipe Search Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (recipeSearch.length > 2) {
        const results = await searchFoods(recipeSearch);
        setRecipeSearchResults(results.slice(0, 5));
      } else {
        setRecipeSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [recipeSearch]);

  const openModal = (food?: Food, mode: 'food' | 'recipe' = 'food') => {
    setIsRecipeMode(mode === 'recipe');
    if (food) {
      setEditingId(food.id || null);
      setName(food.name);
      setUnit(food.unit);
      setBaseQuantity(String(food.baseQuantity || 1));
      setCalories(String(food.caloriesPerUnit));
      setProtein(String(food.protein || 0));
      setCarbs(String(food.carbohydrate || 0));
      setFat(String(food.lipid || 0));
      setIsRecipeMode(!!food.isRecipe);
      if (food.ingredients) {
        setRecipeIngredients(food.ingredients);

        // Infer mode if not explicitly saved (backward compatibility)
        // If unit is 'unid' or 'portion', likely portions mode.
        // But previously we always forced 'g' and 100.
        // We can check if 'recipeMode' exists in future.
        if (food.recipeMode) {
          setRecipeCalculationMode(food.recipeMode);
          if (food.recipeMode === 'weight') {
             setRecipeFinalWeight(String(food.recipeFinalValue || ''));
             setRecipePortions('');
          } else {
             setRecipePortions(String(food.recipeFinalValue || ''));
             setRecipeFinalWeight('');
          }
        } else {
          // Default to weight mode if unknown
          setRecipeCalculationMode('weight');
          // Try to guess final weight from nutrition density? Hard.
          // Just leave blank to re-calculate from sum
          setRecipeFinalWeight('');
          setRecipePortions('');
        }
      }
    } else {
      setEditingId(null);
      setName('');
      setUnit('g');
      setBaseQuantity(mode === 'recipe' ? '100' : '1');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setRecipeIngredients([]);
      setRecipeFinalWeight('');
      setRecipeCalculationMode('weight');
      setRecipePortions('');
    }
    setIsModalOpen(true);
  };

  const handleAddIngredient = (food: SearchResult) => {
    setRecipeIngredients([...recipeIngredients, {
      ...food,
      quantity: 100 // Default 100g added
    }]);
    setRecipeSearch('');
    setRecipeSearchResults([]);
  };

  const updateIngredientQuantity = (index: number, newQty: number) => {
    const newIngredients = [...recipeIngredients];
    newIngredients[index].quantity = newQty;
    setRecipeIngredients(newIngredients);
  };

  const removeIngredient = (index: number) => {
    const newIngredients = [...recipeIngredients];
    newIngredients.splice(index, 1);
    setRecipeIngredients(newIngredients);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    let foodData: any = {
      name,
      unit,
      baseQuantity: Number(baseQuantity) || 1,
      caloriesPerUnit: Number(calories),
      protein: Number(protein) || 0,
      carbohydrate: Number(carbs) || 0,
      lipid: Number(fat) || 0,
      isRecipe: isRecipeMode
    };

    if (isRecipeMode) {
      const totals = calculateRecipeTotals(recipeIngredients);

      let finalValue = 0;
      if (recipeCalculationMode === 'weight') {
        finalValue = Number(recipeFinalWeight) || totals.totalWeight;
      } else {
        finalValue = Number(recipePortions) || 1;
      }

      const normalized = normalizeRecipe(totals, recipeCalculationMode, finalValue);

      foodData = {
        ...foodData,
        unit: normalized.unit,
        baseQuantity: normalized.baseQuantity,
        caloriesPerUnit: normalized.caloriesPerUnit,
        protein: normalized.protein,
        carbohydrate: normalized.carbohydrate,
        lipid: normalized.lipid,
        ingredients: recipeIngredients,
        recipeMode: recipeCalculationMode,
        recipeFinalValue: finalValue
      };
    }

    if (editingId) {
      await dbActions.updateFood({
        id: editingId,
        ...foodData
      });
    } else {
      await dbActions.addFood(foodData);
    }

    setIsModalOpen(false);
    loadFoods();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja apagar este item?')) {
      await dbActions.deleteFood(id);
      loadFoods();
    }
  };

  const { totalCals, totalProt, totalCarb, totalFat, totalWeight } = calculateRecipeTotals(recipeIngredients);

  return (
    <div className="p-4 space-y-6 pb-24">
       <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Meus Alimentos</h1>
          <p className="text-gray-500 text-sm">Gerencie sua despensa e receitas</p>
        </div>
        <div className="flex space-x-2">
           <button
            onClick={() => openModal(undefined, 'food')}
            className="bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors"
            title="Novo Alimento"
          >
            <Plus size={24} />
          </button>
          <button
            onClick={() => openModal(undefined, 'recipe')}
            className="bg-orange-500 text-white p-3 rounded-full shadow-lg hover:bg-orange-600 transition-colors"
            title="Nova Receita"
          >
            <ChefHat size={24} />
          </button>
        </div>
      </header>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-2xl p-6 space-y-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-2">
               <h2 className="text-xl font-bold">{editingId ? 'Editar' : 'Novo'} {isRecipeMode ? 'Receita' : 'Alimento'}</h2>
               <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-gray-500" /></button>
             </div>
             
             <form onSubmit={handleSave} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700">Nome</label>
                 <input 
                   className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200" 
                   value={name} onChange={e => setName(e.target.value)} 
                   placeholder={isRecipeMode ? "Ex: Torta de Frango" : "Ex: Arroz Integral"}
                   required
                 />
               </div>

               {isRecipeMode ? (
                 <div className="space-y-4 border-t border-b border-gray-100 py-4">
                    <h3 className="font-semibold text-gray-700">Ingredientes</h3>
                    <div className="relative">
                       <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                       <input
                         type="text"
                         placeholder="Buscar ingrediente..."
                         value={recipeSearch}
                         onChange={e => setRecipeSearch(e.target.value)}
                         className="w-full pl-9 p-2 rounded-lg border border-gray-200 text-sm"
                       />
                       {recipeSearchResults.length > 0 && (
                         <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-lg shadow-lg z-20 mt-1 max-h-40 overflow-y-auto">
                            {recipeSearchResults.map(res => (
                              <div
                                key={res.id}
                                onClick={() => handleAddIngredient(res)}
                                className="p-2 hover:bg-gray-50 cursor-pointer text-sm border-b last:border-0"
                              >
                                {res.name}
                                {res.origin === 'tbca' && <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">TBCA</span>}
                                {res.origin === 'user' && <span className="ml-2 text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">Meus</span>}
                              </div>
                            ))}
                         </div>
                       )}
                    </div>

                    <div className="space-y-2 max-h-40 overflow-y-auto">
                       {recipeIngredients.map((ing, idx) => (
                         <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                            <span className="flex-1 truncate pr-2">{ing.name}</span>
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={ing.quantity}
                                onChange={e => updateIngredientQuantity(idx, Number(e.target.value))}
                                className="w-16 p-1 border rounded text-right"
                              />
                              <span className="text-xs text-gray-500">g</span>
                              <button type="button" onClick={() => removeIngredient(idx)} className="text-red-400"><X size={16} /></button>
                            </div>
                         </div>
                       ))}
                    </div>

                    <div className="bg-orange-50 p-3 rounded-lg text-sm space-y-2">
                       <div className="flex justify-between font-bold text-orange-800">
                          <span>Total Ingredientes:</span>
                          <span>{totalWeight}g</span>
                       </div>
                       <div className="grid grid-cols-4 gap-1 text-center text-xs">
                          <div>
                            <span className="block font-bold">Kcal</span>
                            {totalCals.toFixed(0)}
                          </div>
                          <div>
                            <span className="block font-bold">Prot</span>
                            {totalProt.toFixed(1)}
                          </div>
                          <div>
                            <span className="block font-bold">Carb</span>
                            {totalCarb.toFixed(1)}
                          </div>
                          <div>
                            <span className="block font-bold">Gord</span>
                            {totalFat.toFixed(1)}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Calcular por:</label>
                      <div className="flex space-x-4 mb-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="recipeMode"
                            checked={recipeCalculationMode === 'weight'}
                            onChange={() => setRecipeCalculationMode('weight')}
                          />
                          <span>Peso Final (g)</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="recipeMode"
                            checked={recipeCalculationMode === 'portions'}
                            onChange={() => setRecipeCalculationMode('portions')}
                          />
                          <span>Porções / Unidades</span>
                        </label>
                      </div>

                      {recipeCalculationMode === 'weight' ? (
                        <div>
                           <label className="block text-xs text-gray-500">Peso pronto (cozido)</label>
                           <input
                             type="number"
                             className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200"
                             placeholder={`Soma: ${totalWeight}`}
                             value={recipeFinalWeight}
                             onChange={e => setRecipeFinalWeight(e.target.value)}
                           />
                           <p className="text-xs text-gray-400 mt-1">Se vazio, usará a soma dos ingredientes. Nutrição será baseada em 100g.</p>
                        </div>
                      ) : (
                        <div>
                           <label className="block text-xs text-gray-500">Número de Porções</label>
                           <input
                             type="number"
                             className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200"
                             placeholder="Ex: 8"
                             value={recipePortions}
                             onChange={e => setRecipePortions(e.target.value)}
                           />
                           <p className="text-xs text-gray-400 mt-1">Nutrição será calculada por 1 porção/unidade.</p>
                        </div>
                      )}
                    </div>
                 </div>
               ) : (
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 truncate">Qtd Base</label>
                     <input
                       type="number" step="0.1"
                       className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200"
                       value={baseQuantity} onChange={e => setBaseQuantity(e.target.value)}
                       placeholder="1"
                       required
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 truncate">Unidade</label>
                     <select
                       className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200"
                       value={unit} onChange={e => setUnit(e.target.value)}
                     >
                       <option value="g">g</option>
                       <option value="ml">ml</option>
                       <option value="colher_sopa">Colher Sopa</option>
                       <option value="colher_cha">Colher Chá</option>
                       <option value="unidade">Unidade</option>
                     </select>
                   </div>
                   <div className="col-span-2 grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Kcal</label>
                        <input type="number" step="0.1" className="w-full p-2 border rounded" value={calories} onChange={e => setCalories(e.target.value)} required />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Prot</label>
                        <input type="number" step="0.1" className="w-full p-2 border rounded" value={protein} onChange={e => setProtein(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Carb</label>
                        <input type="number" step="0.1" className="w-full p-2 border rounded" value={carbs} onChange={e => setCarbs(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Gord</label>
                        <input type="number" step="0.1" className="w-full p-2 border rounded" value={fat} onChange={e => setFat(e.target.value)} />
                      </div>
                   </div>
                 </div>
               )}
               
               <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700">
                 Salvar {isRecipeMode ? 'Receita' : 'Alimento'}
               </button>
             </form>
           </div>
        </div>
      )}

      <div className="space-y-3">
        {foods.map(food => (
          <div key={food.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              {food.isRecipe ? <ChefHat size={20} className="text-orange-500" /> : <div className="w-5" />}
              <div>
                <h3 className="font-semibold text-gray-800">{food.name}</h3>
                <div className="flex space-x-2 text-xs text-gray-500 mt-1">
                   <span>{food.caloriesPerUnit} kcal</span>
                   <span className="text-gray-300">|</span>
                   <span>P: {food.protein || 0}g</span>
                   <span>C: {food.carbohydrate || 0}g</span>
                   <span>G: {food.lipid || 0}g</span>
                </div>
                <p className="text-[10px] text-gray-400">Por {food.baseQuantity} {food.unit}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => openModal(food, food.isRecipe ? 'recipe' : 'food')} className="text-blue-400 p-2 hover:bg-blue-50 rounded-full">
                <Pencil size={18} />
              </button>
              <button onClick={() => food.id && handleDelete(food.id)} className="text-red-400 p-2 hover:bg-red-50 rounded-full">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        
        {foods.length === 0 && !isModalOpen && (
          <div className="text-center text-gray-400 py-10">
            <p>Nenhum alimento cadastrado.</p>
            <p className="text-sm mt-2">Clique em + para adicionar ingredientes ou no chapéu para receitas.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageFoods;

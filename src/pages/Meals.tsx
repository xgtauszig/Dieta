import React, { useState, useRef, useEffect } from 'react';
import { dbActions } from '../db';
import { Camera, Plus, X, Trash2, Search, Copy } from 'lucide-react';
import { useDate } from '../contexts/DateContext';

interface Meal {
  id?: number;
  date: string;
  name: string;
  items?: MealItem[];
  calories: number;
  image?: Blob;
}

interface MealItem {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
}

interface Food {
  id?: number;
  name: string;
  unit: string;
  caloriesPerUnit: number;
}

const MealsPage: React.FC = () => {
  const { selectedDate } = useDate();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Meal Form State
  const [mealName, setMealName] = useState('');
  const [items, setItems] = useState<MealItem[]>([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [mealImage, setMealImage] = useState<Blob | null>(null);
  
  // Item Form State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [itemQuantity, setItemQuantity] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMeals = React.useCallback(async () => {
    const dailyMeals = await dbActions.getMealsByDate(selectedDate);
    setMeals(dailyMeals);
  }, [selectedDate]);

  const loadFoods = async () => {
    const allFoods = await dbActions.getAllFoods();
    setFoods(allFoods);
  };

  useEffect(() => {
    const fetchMeals = async () => {
      await loadMeals();
    };
    const fetchFoods = async () => {
      await loadFoods();
    };
    fetchMeals();
    fetchFoods();
  }, [loadMeals]);

  // No explicit effect for updating totalCalories state based on items to avoid sync warning.
  // Instead, we derive it during render or update it when items change via handlers.
  // But since we want to allow manual override in the future or just simple display,
  // we can just calculate it on the fly for display if we don't need to store it as state separate from items until save.
  // However, the save function uses totalCalories state.
  // Let's update totalCalories ONLY when adding/removing items directly in those handlers,
  // OR use a memo for display and set state only on save.
  
  // Strategy: Calculate derived state for display.
  const calculatedCalories = items.reduce((acc, item) => acc + item.calories, 0);

  // Sync state when items change (using a timeout to avoid synchronous render loop if strictly needed, or just rely on derived value)
  useEffect(() => {
    setTotalCalories(calculatedCalories);
     
  }, [calculatedCalories]);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMealImage(e.target.files[0]);
    }
  };

  const handleAddItem = () => {
    if (!selectedFood && !searchQuery) return;

    let newItem: MealItem;

    if (selectedFood) {
      const qty = Number(itemQuantity) || 1;
      newItem = {
        name: selectedFood.name,
        quantity: qty,
        unit: selectedFood.unit,
        calories: Number((selectedFood.caloriesPerUnit * qty).toFixed(1))
      };
    } else {
      // Manual entry fallback (if they typed a name that doesn't exist)
      newItem = {
        name: searchQuery,
        quantity: 1,
        unit: 'un',
        calories: 0 // User would have to edit this or we assume 0 for unknown
      };
    }

    setItems([...items, newItem]);
    
    // Reset item form
    setIsAddingItem(false);
    setSearchQuery('');
    setSelectedFood(null);
    setItemQuantity('');
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleSaveMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName) return;

    // If manual total is entered (override) or calculated from items
    const finalCalories = totalCalories > 0 ? totalCalories : Number(prompt("Quantas calorias no total?", "0"));

    await dbActions.addMeal({
      date: selectedDate,
      name: mealName,
      items: items,
      calories: finalCalories,
      image: mealImage || undefined,
    });

    // Reset Form
    setMealName('');
    setItems([]);
    setTotalCalories(0);
    setMealImage(null);
    setIsModalOpen(false);
    loadMeals();
  };

  const handleDeleteMeal = async (id: number) => {
    if (confirm('Apagar esta refeição?')) {
      await dbActions.deleteMeal(id);
      loadMeals();
    }
  };

  const handleRepeatMeal = async (meal: Meal) => {
    if (confirm(`Repetir "${meal.name}" no dia de hoje (${selectedDate})?`)) {
      await dbActions.addMeal({
        date: selectedDate, // Save to currently selected date
        name: meal.name,
        items: meal.items,
        calories: meal.calories,
        // We don't copy the image to save space and context usually differs
      });
      loadMeals();
    }
  };

  // Filter foods for search
  const filteredFoods = foods.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Refeições</h1>
          <p className="text-gray-500 text-sm">Registro diário</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={24} />
        </button>
      </header>

      {meals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <UtensilsIcon size={48} className="mb-4 opacity-50" />
          <p>Nenhuma refeição neste dia.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
            >
              <div className="flex items-start space-x-4 mb-3">
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                  {meal.image ? (
                    <img
                      src={URL.createObjectURL(meal.image)}
                      alt={meal.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <UtensilsIcon size={24} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-800">{meal.name}</h3>
                    <div className="flex space-x-1">
                         <button onClick={() => handleRepeatMeal(meal)} className="text-blue-400 p-1 hover:bg-blue-50 rounded">
                           <Copy size={16} />
                         </button>
                         <button onClick={() => meal.id && handleDeleteMeal(meal.id)} className="text-red-400 p-1 hover:bg-red-50 rounded">
                           <Trash2 size={16} />
                         </button>
                    </div>
                  </div>
                  <p className="text-green-600 font-medium">{meal.calories} kcal</p>
                </div>
              </div>
              
              {/* Items List inside card */}
              {meal.items && meal.items.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 text-sm text-gray-600 space-y-1">
                  {meal.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.quantity}{item.unit} {item.name}</span>
                      <span className="text-gray-400">{item.calories}kcal</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ADD MEAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10 fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Nova Refeição</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveMeal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Refeição</label>
                <input
                  type="text"
                  placeholder="Ex: Almoço de Domingo"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  className="w-full p-3 bg-gray-50 rounded-xl border-gray-200"
                  required
                />
              </div>

              {/* Items Section */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                 <div className="flex justify-between items-center">
                   <h3 className="font-semibold text-gray-700">Ingredientes / Itens</h3>
                   <button 
                     type="button" 
                     onClick={() => setIsAddingItem(true)}
                     className="text-green-600 text-sm font-bold flex items-center"
                   >
                     <Plus size={16} className="mr-1"/> Adicionar
                   </button>
                 </div>
                 
                 {items.length === 0 && (
                   <p className="text-sm text-gray-400 italic">Nenhum item adicionado.</p>
                 )}

                 <div className="space-y-2">
                   {items.map((item, idx) => (
                     <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100 text-sm">
                       <div>
                         <span className="font-medium">{item.name}</span>
                         <span className="text-gray-500 ml-2">{item.quantity}{item.unit}</span>
                       </div>
                       <div className="flex items-center space-x-3">
                         <span className="text-green-600">{item.calories}kcal</span>
                         <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-400">
                           <X size={16} />
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>

              {/* Item Adder Overlay */}
              {isAddingItem && (
                 <div className="border border-green-200 bg-green-50 p-3 rounded-xl space-y-3">
                    <p className="text-xs font-bold text-green-800 uppercase">Adicionar Item</p>
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Buscar alimento..." 
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setSelectedFood(null); }}
                        className="w-full pl-9 p-2 rounded-lg border border-gray-200 text-sm"
                        autoFocus
                      />
                      {/* Search Results Dropdown */}
                      {searchQuery && !selectedFood && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10 mt-1">
                          {filteredFoods.map(food => (
                            <div 
                              key={food.id}
                              className="p-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                              onClick={() => {
                                setSelectedFood(food);
                                setSearchQuery(food.name);
                              }}
                            >
                              <span className="font-medium">{food.name}</span>
                              <span className="text-gray-400 text-xs ml-2">({food.unit})</span>
                            </div>
                          ))}
                          {filteredFoods.length === 0 && (
                            <div className="p-2 text-gray-400 text-xs">Nenhum alimento encontrado. Digite para adicionar manual.</div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <div className="flex-1">
                         <input 
                           type="number" 
                           placeholder={selectedFood ? "Qtd" : "Qtd (manual)"}
                           value={itemQuantity}
                           onChange={e => setItemQuantity(e.target.value)}
                           className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                         />
                      </div>
                      <div className="flex items-center text-sm text-gray-600 bg-white px-3 rounded-lg border border-gray-200 min-w-[60px] justify-center">
                        {selectedFood ? selectedFood.unit : 'un'}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button 
                        type="button" 
                        onClick={() => { setIsAddingItem(false); setSearchQuery(''); setSelectedFood(null); }}
                        className="px-3 py-1 text-sm text-gray-500"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="button" 
                        onClick={handleAddItem}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg font-medium"
                      >
                        Confirmar
                      </button>
                    </div>
                 </div>
              )}

              <div className="flex justify-between items-center bg-gray-100 p-3 rounded-xl">
                 <span className="font-bold text-gray-700">Total</span>
                 <span className="font-bold text-xl text-green-600">{totalCalories} kcal</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto (Opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handleImageCapture}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 flex items-center justify-center hover:border-green-500 hover:text-green-500 transition-colors"
                >
                  {mealImage ? (
                    <span className="text-green-600 font-medium">Foto selecionada!</span>
                  ) : (
                    <>
                      <Camera size={20} className="mr-2" />
                      <span>Adicionar Foto</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 transition-colors"
              >
                Salvar Refeição
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for the empty state icon
const UtensilsIcon = ({ size, className }: { size: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
    <path d="M7 2v20" />
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
  </svg>
);

export default MealsPage;

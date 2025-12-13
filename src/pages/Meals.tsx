import React, { useState, useRef, useEffect } from 'react';
import { dbActions, type MealItem } from '../db';
import { Camera, Plus, X, Trash2, Search, Copy } from 'lucide-react';
import { useDate } from '../contexts/DateContext';
import { searchFoods, type SearchResult } from '../services/foodService';

interface Meal {
  id?: number;
  date: string;
  name: string;
  items?: MealItem[];
  calories: number;
  protein?: number;
  carbohydrate?: number;
  lipid?: number;
  image?: Blob;
}

const MealsPage: React.FC = () => {
  const { selectedDate } = useDate();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Meal Form State
  const [editingMealId, setEditingMealId] = useState<number | null>(null);
  const [mealName, setMealName] = useState('');
  const [items, setItems] = useState<MealItem[]>([]);
  const [mealImage, setMealImage] = useState<Blob | null>(null);
  
  // Item Form State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedFood, setSelectedFood] = useState<SearchResult | null>(null);

  // Selected Item Editing
  const [itemQuantity, setItemQuantity] = useState('');
  const [manualUnit, setManualUnit] = useState('g');
  const [manualCalories, setManualCalories] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFat, setManualFat] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMeals = React.useCallback(async () => {
    const dailyMeals = await dbActions.getMealsByDate(selectedDate);
    setMeals(dailyMeals);
  }, [selectedDate]);

  useEffect(() => {
    const fetchMeals = async () => {
      await loadMeals();
    };
    fetchMeals();
  }, [loadMeals]);

  // Search Effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2 && !selectedFood) {
        const results = await searchFoods(searchQuery);
        setSearchResults(results.slice(0, 10)); // Limit results
      } else if (!searchQuery) {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedFood]);

  // Calculate totals for display
  const calculatedTotals = items.reduce((acc, item) => ({
     calories: acc.calories + item.calories,
     protein: acc.protein + (item.protein || 0),
     carbohydrate: acc.carbohydrate + (item.carbohydrate || 0),
     lipid: acc.lipid + (item.lipid || 0)
  }), { calories: 0, protein: 0, carbohydrate: 0, lipid: 0 });

  // Update manual fields when quantity changes for a selected food
  useEffect(() => {
    if (selectedFood && itemQuantity) {
       const qty = Number(itemQuantity);
       const base = selectedFood.baseQuantity || 100;
       const ratio = qty / base;

       setManualCalories((selectedFood.caloriesPerUnit * ratio).toFixed(1));
       setManualProtein(( (selectedFood.protein || 0) * ratio).toFixed(1));
       setManualCarbs(( (selectedFood.carbohydrate || 0) * ratio).toFixed(1));
       setManualFat(( (selectedFood.lipid || 0) * ratio).toFixed(1));
    }
  }, [itemQuantity, selectedFood]);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMealImage(e.target.files[0]);
    }
  };

  const handleSelectFood = (food: SearchResult) => {
    setSelectedFood(food);
    setSearchQuery(food.name);
    setManualUnit(food.unit);
    // Default quantity
    setItemQuantity(String(food.baseQuantity || 100));
    setSearchResults([]);
  };

  const handleAddItem = async () => {
    if (!searchQuery) return;

    const newItem: MealItem = {
      name: searchQuery,
      quantity: Number(itemQuantity) || 1,
      unit: manualUnit,
      calories: Number(manualCalories) || 0,
      protein: Number(manualProtein) || 0,
      carbohydrate: Number(manualCarbs) || 0,
      lipid: Number(manualFat) || 0,
    };

    setItems([...items, newItem]);
    
    // Reset item form
    setIsAddingItem(false);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedFood(null);
    setItemQuantity('');
    setManualCalories('');
    setManualProtein('');
    setManualCarbs('');
    setManualFat('');
    setManualUnit('g');
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleSaveMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName) return;

    // Use calculated totals
    const mealData = {
      date: selectedDate,
      name: mealName,
      items: items,
      calories: calculatedTotals.calories,
      protein: calculatedTotals.protein,
      carbohydrate: calculatedTotals.carbohydrate,
      lipid: calculatedTotals.lipid,
      image: mealImage || undefined,
    };

    if (editingMealId) {
       const oldMeals = await dbActions.getMealsByDate(selectedDate);
       const oldMeal = oldMeals.find(m => m.id === editingMealId);
       
       await dbActions.updateMeal({
         ...mealData,
         id: editingMealId,
         image: mealImage || oldMeal?.image // Keep old image if new one is null
       });
    } else {
      await dbActions.addMeal(mealData);
    }

    closeModal();
    loadMeals();
  };

  const openModal = (meal?: Meal) => {
    if (meal) {
      setEditingMealId(meal.id || null);
      setMealName(meal.name);
      setItems(meal.items || []);
      setMealImage(null);
    } else {
      setEditingMealId(null);
      setMealName('');
      setItems([]);
      setMealImage(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingMealId(null);
    setMealName('');
    setItems([]);
    setMealImage(null);
    setIsModalOpen(false);
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
        date: selectedDate,
        name: meal.name,
        items: meal.items,
        calories: meal.calories,
        protein: meal.protein,
        carbohydrate: meal.carbohydrate,
        lipid: meal.lipid
      });
      loadMeals();
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Refeições</h1>
          <p className="text-gray-500 text-sm">Registro diário</p>
        </div>
        <button
          onClick={() => openModal()}
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
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:border-green-300 transition-colors"
              onClick={() => openModal(meal)}
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
                         <button onClick={(e) => { e.stopPropagation(); handleRepeatMeal(meal); }} className="text-blue-400 p-1 hover:bg-blue-50 rounded">
                           <Copy size={16} />
                         </button>
                         <button onClick={(e) => { e.stopPropagation(); if(meal.id) handleDeleteMeal(meal.id); }} className="text-red-400 p-1 hover:bg-red-50 rounded">
                           <Trash2 size={16} />
                         </button>
                    </div>
                  </div>
                  <div className="flex space-x-3 text-sm mt-1">
                    <span className="text-green-600 font-bold">{meal.calories.toFixed(0)} kcal</span>
                    <span className="text-blue-600">P: {meal.protein?.toFixed(1) || 0}g</span>
                    <span className="text-yellow-600">C: {meal.carbohydrate?.toFixed(1) || 0}g</span>
                    <span className="text-red-600">G: {meal.lipid?.toFixed(1) || 0}g</span>
                  </div>
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
                         <div className="text-right">
                           <span className="block text-green-600 font-bold">{item.calories} kcal</span>
                           <span className="text-[10px] text-gray-400">P:{item.protein} C:{item.carbohydrate} G:{item.lipid}</span>
                         </div>
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
                        placeholder="Buscar ou criar manual..." 
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setSelectedFood(null); }}
                        className="w-full pl-9 p-2 rounded-lg border border-gray-200 text-sm"
                        autoFocus
                      />
                      {/* Search Results Dropdown */}
                      {searchResults.length > 0 && !selectedFood && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 rounded-lg shadow-lg max-h-40 overflow-y-auto z-20 mt-1">
                          {searchResults.map(food => (
                            <div 
                              key={food.id}
                              className="p-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                              onClick={() => handleSelectFood(food)}
                            >
                              <span className="font-medium">{food.name}</span>
                              <span className="text-gray-400 text-xs ml-2">
                                {food.origin === 'tbca' && <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full">TBCA</span>}
                                {food.origin === 'user' && <span className="ml-2 text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">Meus</span>}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <div className="flex-1">
                         <label className="text-[10px] text-gray-500 uppercase font-bold pl-1">Quantidade</label>
                         <div className="flex items-center">
                           <input 
                             type="number" 
                             placeholder="Qtd"
                             value={itemQuantity}
                             onChange={e => setItemQuantity(e.target.value)}
                             className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                           />
                           <span className="ml-2 text-sm text-gray-500 whitespace-nowrap">
                             {selectedFood ? selectedFood.unit : manualUnit}
                           </span>
                           {!selectedFood && (
                             <select
                               className="ml-1 p-2 rounded-lg border border-gray-200 text-xs bg-white"
                               value={manualUnit} onChange={e => setManualUnit(e.target.value)}
                            >
                               <option value="g">g</option>
                               <option value="ml">ml</option>
                               <option value="un">un</option>
                            </select>
                           )}
                         </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                       <div>
                         <label className="text-[10px] text-gray-500 uppercase font-bold">Cal</label>
                         <input type="number" className="w-full p-1 rounded border text-sm" value={manualCalories} onChange={e => setManualCalories(e.target.value)} placeholder="Kcal"/>
                       </div>
                       <div>
                         <label className="text-[10px] text-gray-500 uppercase font-bold">Prot</label>
                         <input type="number" className="w-full p-1 rounded border text-sm" value={manualProtein} onChange={e => setManualProtein(e.target.value)} placeholder="g"/>
                       </div>
                       <div>
                         <label className="text-[10px] text-gray-500 uppercase font-bold">Carb</label>
                         <input type="number" className="w-full p-1 rounded border text-sm" value={manualCarbs} onChange={e => setManualCarbs(e.target.value)} placeholder="g"/>
                       </div>
                       <div>
                         <label className="text-[10px] text-gray-500 uppercase font-bold">Gord</label>
                         <input type="number" className="w-full p-1 rounded border text-sm" value={manualFat} onChange={e => setManualFat(e.target.value)} placeholder="g"/>
                       </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <button 
                        type="button" 
                        onClick={() => { setIsAddingItem(false); setSearchQuery(''); setSelectedFood(null); setManualCalories(''); }}
                        className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="button" 
                        onClick={handleAddItem}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg font-bold shadow-md hover:bg-green-700"
                      >
                        Confirmar
                      </button>
                    </div>
                 </div>
              )}

              <div className="bg-gray-100 p-3 rounded-xl space-y-2">
                 <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-700">Total</span>
                    <span className="font-bold text-xl text-green-600">{calculatedTotals.calories.toFixed(0)} kcal</span>
                 </div>
                 <div className="flex justify-between text-xs text-gray-500">
                    <span>Proteína: {calculatedTotals.protein.toFixed(1)}g</span>
                    <span>Carboidratos: {calculatedTotals.carbohydrate.toFixed(1)}g</span>
                    <span>Gorduras: {calculatedTotals.lipid.toFixed(1)}g</span>
                 </div>
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

import React, { useState, useEffect } from 'react';
import { dbActions } from '../db';
import { Plus, Trash2, X } from 'lucide-react';

interface Food {
  id?: number;
  name: string;
  unit: string;
  caloriesPerUnit: number;
}

const ManageFoods: React.FC = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('g');
  const [calories, setCalories] = useState('');

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !calories) return;

    await dbActions.addFood({
      name,
      unit,
      caloriesPerUnit: Number(calories),
    });

    // Reset
    setName('');
    setCalories('');
    setUnit('g');
    setIsAdding(false);
    loadFoods();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja apagar este item?')) {
      await dbActions.deleteFood(id);
      loadFoods();
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
       <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Meus Alimentos</h1>
          <p className="text-gray-500 text-sm">Crie ingredientes personalizados</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors"
        >
          <Plus size={24} />
        </button>
      </header>

      {isAdding && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 animate-in fade-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-2">
               <h2 className="text-xl font-bold">Novo Alimento</h2>
               <button onClick={() => setIsAdding(false)}><X size={24} className="text-gray-500" /></button>
             </div>
             
             <form onSubmit={handleSave} className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700">Nome</label>
                 <input 
                   className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200" 
                   value={name} onChange={e => setName(e.target.value)} 
                   placeholder="Ex: Arroz Branco"
                   required
                 />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Unidade</label>
                   <select 
                     className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200"
                     value={unit} onChange={e => setUnit(e.target.value)}
                   >
                     <option value="g">Gramas (g)</option>
                     <option value="ml">Mililitros (ml)</option>
                     <option value="colher_sopa">Colher de Sopa</option>
                     <option value="colher_cha">Colher de Chá</option>
                     <option value="unidade">Unidade</option>
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700">Calorias (por 1 un)</label>
                   <input 
                     type="number" step="0.1"
                     className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200"
                     value={calories} onChange={e => setCalories(e.target.value)}
                     placeholder="Ex: 1.2"
                     required
                   />
                 </div>
               </div>
               
               <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700">
                 Salvar
               </button>
             </form>
           </div>
        </div>
      )}

      <div className="space-y-3">
        {foods.map(food => (
          <div key={food.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-800">{food.name}</h3>
              <p className="text-xs text-gray-500">{food.caloriesPerUnit} kcal / {food.unit}</p>
            </div>
            <button onClick={() => food.id && handleDelete(food.id)} className="text-red-400 p-2 hover:bg-red-50 rounded-full">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        
        {foods.length === 0 && !isAdding && (
          <div className="text-center text-gray-400 py-10">
            <p>Nenhum alimento cadastrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageFoods;

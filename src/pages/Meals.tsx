import React, { useState, useRef, useEffect } from 'react';
import { dbActions } from '../db';
import { Camera, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Meal {
  id?: number;
  name: string;
  calories: number;
  image?: Blob;
}

const MealsPage: React.FC = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMealName, setNewMealName] = useState('');
  const [newMealCalories, setNewMealCalories] = useState('');
  const [newMealImage, setNewMealImage] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  const loadMeals = React.useCallback(async () => {
    const dailyMeals = await dbActions.getMealsByDate(today);
    setMeals(dailyMeals);
  }, [today]);

  useEffect(() => {
    const fetchMeals = async () => {
      await loadMeals();
    };
    fetchMeals();
  }, [loadMeals]);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewMealImage(e.target.files[0]);
    }
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMealName || !newMealCalories) return;

    await dbActions.addMeal({
      date: today,
      name: newMealName,
      calories: Number(newMealCalories),
      image: newMealImage || undefined,
    });

    setNewMealName('');
    setNewMealCalories('');
    setNewMealImage(null);
    setIsModalOpen(false);
    loadMeals();
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Refeições</h1>
          <p className="text-gray-500 text-sm capitalize">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
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
          <p>Nenhuma refeição registrada hoje.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center space-x-4"
            >
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
                <h3 className="font-semibold text-gray-800">{meal.name}</h3>
                <p className="text-green-600 font-medium">{meal.calories} kcal</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for adding meal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-6 animate-in slide-in-from-bottom-10 fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Nova Refeição</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddMeal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  placeholder="Ex: Café da manhã"
                  value={newMealName}
                  onChange={(e) => setNewMealName(e.target.value)}
                  className="w-full p-3 bg-gray-50 rounded-xl border-gray-200 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Calorias (kcal)</label>
                <input
                  type="number"
                  placeholder="Ex: 450"
                  value={newMealCalories}
                  onChange={(e) => setNewMealCalories(e.target.value)}
                  className="w-full p-3 bg-gray-50 rounded-xl border-gray-200 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto</label>
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
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 flex flex-col items-center justify-center hover:border-green-500 hover:text-green-500 transition-colors"
                >
                  {newMealImage ? (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(newMealImage)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 text-white">
                        <span className="bg-black/50 px-2 py-1 rounded text-sm">Trocar foto</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Camera size={24} className="mb-2" />
                      <span>Tirar foto ou escolher</span>
                    </>
                  )}
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-200 hover:bg-green-700 transition-colors"
              >
                Adicionar Refeição
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

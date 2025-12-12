import React, { useEffect, useState } from 'react';
import { dbActions } from '../db';
import { Save } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [calorieGoal, setCalorieGoal] = useState<number>(2000);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const goal = await dbActions.getSetting('calorieGoal');
      if (typeof goal === 'number') {
        setCalorieGoal(goal);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    await dbActions.setSetting('calorieGoal', calorieGoal);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Ajustes</h1>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <label htmlFor="calorieGoal" className="block text-sm font-medium text-gray-700 mb-2">
          Meta Diária de Calorias
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            id="calorieGoal"
            value={calorieGoal}
            onChange={(e) => setCalorieGoal(Number(e.target.value))}
            className="block w-full rounded-lg border-gray-300 bg-gray-50 p-3 text-lg focus:border-green-500 focus:ring-green-500 shadow-inner"
          />
          <span className="text-gray-500 font-medium">kcal</span>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Recomendado: 2000 - 2500 kcal para manutenção em média.
        </p>
      </div>

      <button
        onClick={handleSave}
        className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-lg shadow-green-200"
      >
        <Save size={20} />
        <span>Salvar Alterações</span>
      </button>

      {saved && (
        <div className="text-center text-green-600 font-medium animate-pulse">
          Configurações salvas!
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

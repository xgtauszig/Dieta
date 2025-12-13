import React, { useEffect, useState } from 'react';
import { dbActions } from '../db';
import { Save, ChevronRight, UtensilsCrossed } from 'lucide-react';
import { Link } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  const [calorieGoal, setCalorieGoal] = useState<number>(2000);
  const [darkMode, setDarkMode] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const goal = await dbActions.getSetting('calorieGoal');
      if (typeof goal === 'number') {
        setCalorieGoal(goal);
      }
      const dm = await dbActions.getSetting('darkMode');
      if (typeof dm === 'boolean') {
        setDarkMode(dm);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    await dbActions.setSetting('calorieGoal', calorieGoal);
    await dbActions.setSetting('darkMode', darkMode);

    // Apply theme immediately
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Ajustes</h1>
      
      <Link to="/foods" className="block bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-full text-orange-600 dark:text-orange-300">
            <UtensilsCrossed size={20} />
          </div>
          <span className="font-medium text-gray-700 dark:text-gray-200">Gerenciar Meus Alimentos</span>
        </div>
        <ChevronRight size={20} className="text-gray-400 dark:text-gray-500" />
      </Link>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        <label htmlFor="calorieGoal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Meta Diária de Calorias
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            id="calorieGoal"
            value={calorieGoal}
            onChange={(e) => setCalorieGoal(Number(e.target.value))}
            className="block w-full rounded-lg border-gray-300 bg-gray-50 p-3 text-lg focus:border-green-500 focus:ring-green-500 shadow-inner dark:bg-slate-900 dark:border-slate-600 dark:text-white"
          />
          <span className="text-gray-500 dark:text-gray-400 font-medium">kcal</span>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Recomendado: 2000 - 2500 kcal para manutenção em média.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center justify-between">
        <span className="font-medium text-gray-700 dark:text-gray-200">Modo Escuro</span>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${darkMode ? 'bg-green-600' : 'bg-gray-200'}`}
        >
          <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
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

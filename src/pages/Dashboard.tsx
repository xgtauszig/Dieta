import React, { useEffect, useState } from 'react';
import { dbActions } from '../db';
import { Droplet, Plus, Flame, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDate } from '../contexts/DateContext';

const Dashboard: React.FC = () => {
  const { selectedDate } = useDate();
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [consumedCalories, setConsumedCalories] = useState(0);
  const [waterIntake, setWaterIntake] = useState(0);
  const [todayWeight, setTodayWeight] = useState<number | null>(null);
  const [waterLogs, setWaterLogs] = useState<{id?: number, amount: number}[]>([]);

  const loadData = React.useCallback(async () => {
    // Load Goal
    const goal = await dbActions.getSetting('calorieGoal');
    if (typeof goal === 'number') setCalorieGoal(goal);

    // Load Calories
    const meals = await dbActions.getMealsByDate(selectedDate);
    const totalCalories = meals.reduce((acc, meal) => acc + meal.calories, 0);
    setConsumedCalories(totalCalories);

    // Load Water
    const logs = await dbActions.getWaterByDate(selectedDate);
    setWaterLogs(logs);
    const totalWater = logs.reduce((acc, log) => acc + log.amount, 0);
    setWaterIntake(totalWater);

    // Load Weight (Just check if logged today)
    const weights = await dbActions.getAllWeights();
    // In a real app we might query by index, but getting all is fine for small scale
    // Or add a getWeightByDate method. Let's filter here for now.
    const todaysWeightEntry = weights.find(w => w.date === selectedDate);
    if (todaysWeightEntry) {
      setTodayWeight(todaysWeightEntry.kg);
    } else {
      setTodayWeight(null);
    }
  }, [selectedDate]);

  useEffect(() => {
    const fetchData = async () => {
      await loadData();
    };
    fetchData();
    // Add event listener for focus to reload data when returning to tab
    window.addEventListener('focus', loadData);
    return () => window.removeEventListener('focus', loadData);
  }, [loadData]);

  const addWater = async (amount: number) => {
    await dbActions.addWater({ date: selectedDate, amount });
    loadData();
  };

  const removeWater = async () => {
    // Remove the last entry if exists
    if (waterLogs.length > 0) {
      const lastLog = waterLogs[waterLogs.length - 1];
      if (lastLog.id) {
        await dbActions.deleteWater(lastLog.id);
        loadData();
      }
    }
  };

  const percentage = Math.min((consumedCalories / calorieGoal) * 100, 100);

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Calories Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Flame size={120} className="text-orange-500" />
        </div>
        
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Resumo Calórico</h2>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">{Math.round(consumedCalories)}</span>
          <span className="text-sm text-gray-400 font-medium">/ {calorieGoal} kcal</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-400 text-right">
          {Math.round(Math.max(0, calorieGoal - consumedCalories))} kcal restantes
        </p>
      </div>

      {/* Water Tracker */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-3xl p-6 shadow-sm border border-blue-100 dark:border-blue-900/50">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Hidratação</h2>
            <p className="text-blue-600 dark:text-blue-300 text-sm">Mantenha-se hidratado!</p>
          </div>
          <div className="bg-white dark:bg-blue-900 p-2 rounded-full shadow-sm text-blue-500 dark:text-blue-300">
            <Droplet size={24} fill="currentColor" />
          </div>
        </div>

        <div className="flex items-end space-x-2 mb-6">
          <span className="text-4xl font-bold text-blue-900 dark:text-blue-100">{waterIntake}</span>
          <span className="text-blue-600 dark:text-blue-300 font-medium mb-1">ml</span>
        </div>

        <div className="flex space-x-3">
          <button 
            onClick={removeWater}
            disabled={waterIntake === 0}
            className="w-12 bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 py-3 rounded-xl font-semibold shadow-sm border border-blue-100 dark:border-gray-800 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            <Minus size={20} />
          </button>
          <button 
            onClick={() => addWater(250)}
            className="flex-1 bg-white dark:bg-gray-900 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-300 py-3 rounded-xl font-semibold shadow-sm border border-blue-100 dark:border-gray-800 transition-colors flex items-center justify-center space-x-1"
          >
            <Plus size={16} /> <span>250ml</span>
          </button>
          <button 
            onClick={() => addWater(500)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold shadow-md shadow-blue-200 dark:shadow-none transition-colors flex items-center justify-center space-x-1"
          >
             <Plus size={16} /> <span>500ml</span>
          </button>
        </div>
      </div>

      {/* Quick Actions / Weight Status */}
      <div className="grid grid-cols-2 gap-4">
        <Link to="/meals" className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center space-y-2 hover:border-green-200 dark:hover:border-green-800 transition-colors">
          <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full text-green-600 dark:text-green-400">
            <Plus size={20} />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Refeição</span>
        </Link>
        
        <Link to="/weight" className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center space-y-2 hover:border-purple-200 dark:hover:border-purple-800 transition-colors">
           <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-full text-purple-600 dark:text-purple-400">
             {todayWeight ? <span className="font-bold text-sm">{todayWeight}kg</span> : <Plus size={20} />}
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{todayWeight ? 'Peso Hoje' : 'Add Peso'}</span>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;

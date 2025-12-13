import React, { useEffect, useState } from 'react';
import { dbActions } from '../db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, LineChart, Line, Legend } from 'recharts';
import { format, subDays, parseISO, startOfDay, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DailyStats {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const ReportsPage: React.FC = () => {
  const [data, setData] = useState<DailyStats[]>([]);
  const [period, setPeriod] = useState<'7' | '30' | 'all'>('7');
  const [goal, setGoal] = useState(2000);
  const [viewMode, setViewMode] = useState<'calories' | 'macros'>('calories');

  useEffect(() => {
    const loadData = async () => {
      const savedGoal = await dbActions.getSetting('calorieGoal');
      if (typeof savedGoal === 'number') setGoal(savedGoal);

      const allMeals = await dbActions.getAllMeals();
      
      const statsMap = new Map<string, DailyStats>();
      
      allMeals.forEach(meal => {
         const current = statsMap.get(meal.date) || { date: meal.date, calories: 0, protein: 0, carbs: 0, fat: 0 };

         // Calculate meal totals from items if meal level totals are missing (backward compatibility)
         let mealProtein = meal.protein || 0;
         let mealCarb = meal.carbohydrate || 0;
         let mealFat = meal.lipid || 0;

         if (meal.items && (!mealProtein && !mealCarb && !mealFat)) {
            meal.items.forEach(item => {
               mealProtein += item.protein || 0;
               mealCarb += item.carbohydrate || 0;
               mealFat += item.lipid || 0;
            });
         }

         statsMap.set(meal.date, {
           date: meal.date,
           calories: current.calories + meal.calories,
           protein: current.protein + mealProtein,
           carbs: current.carbs + mealCarb,
           fat: current.fat + mealFat
         });
      });

      const statsArray: DailyStats[] = Array.from(statsMap.values());

      statsArray.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const today = startOfDay(new Date());
      let filteredData = statsArray;

      if (period === '7') {
        const cutoff = subDays(today, 6); // 7 days inclusive
        filteredData = statsArray.filter(d => !isBefore(parseISO(d.date), cutoff));
      } else if (period === '30') {
        const cutoff = subDays(today, 29);
        filteredData = statsArray.filter(d => !isBefore(parseISO(d.date), cutoff));
      }

      setData(filteredData);
    };

    loadData();
  }, [period]);

  return (
    <div className="p-4 space-y-6 pb-24">
       <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Relatórios</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Histórico de Consumo</p>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex text-xs font-medium">
           <button
             onClick={() => setViewMode('calories')}
             className={`px-3 py-1 rounded-md transition-all ${viewMode === 'calories' ? 'bg-white dark:bg-gray-700 shadow text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
           >
             Calorias
           </button>
           <button
             onClick={() => setViewMode('macros')}
             className={`px-3 py-1 rounded-md transition-all ${viewMode === 'macros' ? 'bg-white dark:bg-gray-700 shadow text-gray-800 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
           >
             Macros
           </button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        <button 
          onClick={() => setPeriod('7')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${period === '7' ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
        >
          7 Dias
        </button>
        <button 
          onClick={() => setPeriod('30')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${period === '30' ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
        >
          30 Dias
        </button>
        <button 
          onClick={() => setPeriod('all')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${period === 'all' ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
        >
          Tudo
        </button>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 h-80">
         {data.length > 0 ? (
           <ResponsiveContainer width="100%" height="100%">
             {viewMode === 'calories' ? (
                <BarChart data={data} margin={{ top: 20, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis
                      dataKey="date"
                      tickFormatter={(val) => format(parseISO(val), 'dd/MM')}
                      tick={{fontSize: 10, fill: '#9CA3AF'}}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                  />
                  <YAxis
                      tick={{fontSize: 10, fill: '#9CA3AF'}}
                      axisLine={false}
                      tickLine={false}
                  />
                  <Tooltip
                      cursor={{fill: '#f3f4f6'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelFormatter={(label) => format(parseISO(label), "d 'de' MMMM", { locale: ptBR })}
                  />
                  <ReferenceLine y={goal} stroke="#fb923c" strokeDasharray="3 3" label={{ position: 'top', value: 'Meta', fill: '#fb923c', fontSize: 10 }} />
                  <Bar dataKey="calories" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.calories > goal ? '#ef4444' : '#22c55e'} />
                    ))}
                  </Bar>
                </BarChart>
             ) : (
                <LineChart data={data} margin={{ top: 20, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis
                      dataKey="date"
                      tickFormatter={(val) => format(parseISO(val), 'dd/MM')}
                      tick={{fontSize: 10, fill: '#9CA3AF'}}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                  />
                  <YAxis
                      tick={{fontSize: 10, fill: '#9CA3AF'}}
                      axisLine={false}
                      tickLine={false}
                  />
                  <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelFormatter={(label) => format(parseISO(label), "d 'de' MMMM", { locale: ptBR })}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line type="monotone" dataKey="protein" name="Prot" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="carbs" name="Carb" stroke="#eab308" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="fat" name="Gord" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
             )}
           </ResponsiveContainer>
         ) : (
           <div className="h-full flex items-center justify-center text-gray-400 text-sm">
             Sem dados para o período selecionado.
           </div>
         )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        {viewMode === 'calories' ? (
          <>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-900/50">
              <p className="text-xs text-green-600 dark:text-green-400 uppercase font-bold mb-1">Média Diária</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {data.length > 0 ? Math.round(data.reduce((acc, curr) => acc + curr.calories, 0) / data.length) : 0}
                <span className="text-sm text-green-600 dark:text-green-400 font-medium ml-1">kcal</span>
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/50">
              <p className="text-xs text-orange-600 dark:text-orange-400 uppercase font-bold mb-1">Dias na Meta</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {data.filter(d => d.calories <= goal && d.calories > 0).length}
                <span className="text-sm text-orange-600 dark:text-orange-400 font-medium ml-1">dias</span>
              </p>
            </div>
          </>
        ) : (
          <>
             <div className="col-span-2 grid grid-cols-3 gap-2">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/50 text-center">
                   <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold">Proteína</p>
                   <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                     {data.length > 0 ? Math.round(data.reduce((acc, curr) => acc + curr.protein, 0) / data.length) : 0}g
                   </p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-xl border border-yellow-100 dark:border-yellow-900/50 text-center">
                   <p className="text-[10px] text-yellow-600 dark:text-yellow-400 uppercase font-bold">Carb.</p>
                   <p className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                     {data.length > 0 ? Math.round(data.reduce((acc, curr) => acc + curr.carbs, 0) / data.length) : 0}g
                   </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/50 text-center">
                   <p className="text-[10px] text-red-600 dark:text-red-400 uppercase font-bold">Gordura</p>
                   <p className="text-lg font-bold text-red-900 dark:text-red-100">
                     {data.length > 0 ? Math.round(data.reduce((acc, curr) => acc + curr.fat, 0) / data.length) : 0}g
                   </p>
                </div>
             </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;

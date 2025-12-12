import React, { useEffect, useState } from 'react';
import { dbActions } from '../db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { format, subDays, parseISO, startOfDay, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DailyStats {
  date: string;
  calories: number;
}

const ReportsPage: React.FC = () => {
  const [data, setData] = useState<DailyStats[]>([]);
  const [period, setPeriod] = useState<'7' | '30' | 'all'>('7');
  const [goal, setGoal] = useState(2000);

  useEffect(() => {
    const loadData = async () => {
      // Load Goal
      const savedGoal = await dbActions.getSetting('calorieGoal');
      if (typeof savedGoal === 'number') setGoal(savedGoal);

      // Load all meals is expensive but necessary for "All Time" aggregation without a separate stats table
      // For a PWA with local DB, it's usually fast enough.
      // Optimization: We could use a cursor or index range for 7/30 days, but let's keep it simple first.
      
      // Strategy: Get all keys from 'meals' index 'by-date'. 
      // Actually idb doesn't expose keys easily without fetching. 
      // Let's implement a getAllMeals in dbActions or just iterate days?
      // Iterating days is bad for "All Time". 
      // Better: Get all meals and reduce.
      
      // We need a new action in db.ts to get ALL meals efficiently?
      // db.getAll('meals') is fine.
      const allMeals = await dbActions.getAllMeals(); // Need to add this to db.ts
      
      const statsMap = new Map<string, number>();
      
      allMeals.forEach(meal => {
         const current = statsMap.get(meal.date) || 0;
         statsMap.set(meal.date, current + meal.calories);
      });

      // Convert to array
      const statsArray: DailyStats[] = Array.from(statsMap.entries()).map(([date, calories]) => ({
        date,
        calories
      }));

      // Sort by date
      statsArray.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Fill missing days? 
      // For charts, it's nice to see 0s if they are in the range.
      // Let's focus on filtering first.

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
       <header>
        <h1 className="text-2xl font-bold text-gray-800">Relatórios</h1>
        <p className="text-gray-500 text-sm">Histórico de Consumo</p>
      </header>

      {/* Filter Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl">
        <button 
          onClick={() => setPeriod('7')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${period === '7' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-600'}`}
        >
          7 Dias
        </button>
        <button 
          onClick={() => setPeriod('30')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${period === '30' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-600'}`}
        >
          30 Dias
        </button>
        <button 
          onClick={() => setPeriod('all')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${period === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-600'}`}
        >
          Tudo
        </button>
      </div>

      {/* Chart */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 h-80">
         {data.length > 0 ? (
           <ResponsiveContainer width="100%" height="100%">
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
           </ResponsiveContainer>
         ) : (
           <div className="h-full flex items-center justify-center text-gray-400 text-sm">
             Sem dados para o período selecionado.
           </div>
         )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
           <p className="text-xs text-green-600 uppercase font-bold mb-1">Média Diária</p>
           <p className="text-2xl font-bold text-green-900">
             {data.length > 0 ? Math.round(data.reduce((acc, curr) => acc + curr.calories, 0) / data.length) : 0}
             <span className="text-sm text-green-600 font-medium ml-1">kcal</span>
           </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
           <p className="text-xs text-orange-600 uppercase font-bold mb-1">Dias na Meta</p>
           <p className="text-2xl font-bold text-orange-900">
             {data.filter(d => d.calories <= goal && d.calories > 0).length}
             <span className="text-sm text-orange-600 font-medium ml-1">dias</span>
           </p>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;

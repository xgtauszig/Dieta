import React, { useEffect, useState } from 'react';
import { dbActions } from '../db';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Scale, Trash2 } from 'lucide-react';
import { useDate } from '../contexts/DateContext';

interface WeightEntry {
  id?: number;
  date: string;
  kg: number;
}

const WeightPage: React.FC = () => {
  const { selectedDate } = useDate();
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [currentWeight, setCurrentWeight] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const loadWeights = React.useCallback(async () => {
    const allWeights = await dbActions.getAllWeights();
    // Sort by date
    allWeights.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setWeights(allWeights);
  }, []);

  useEffect(() => {
    const fetchWeights = async () => {
      await loadWeights();
    };
    fetchWeights();
  }, [loadWeights]);

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWeight) return;

    await dbActions.addWeight({
      date: selectedDate, // Use selected date
      kg: Number(currentWeight),
    });

    setCurrentWeight('');
    setIsAdding(false);
    loadWeights();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Apagar este registro de peso?')) {
      await dbActions.deleteWeight(id);
      loadWeights();
    }
  };

  // Format data for chart
  const chartData = weights.map(w => ({
    date: format(parseISO(w.date), 'dd/MM'),
    kg: w.kg
  }));

  return (
    <div className="p-4 space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Peso</h1>
          <p className="text-gray-500 text-sm">Acompanhe seu progresso</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        >
          <Plus size={24} />
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleAddWeight} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-top-4 fade-in">
           <label className="block text-sm font-medium text-gray-700 mb-2">Peso de hoje (kg)</label>
           <div className="flex space-x-2">
             <input
              type="number"
              step="0.1"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(e.target.value)}
              className="flex-1 p-3 bg-gray-50 rounded-xl border-gray-200 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Ex: 70.5"
              autoFocus
             />
             <button type="submit" className="bg-purple-600 text-white px-6 rounded-xl font-bold">
               Salvar
             </button>
           </div>
        </form>
      )}

      {/* Chart Section */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 h-64">
        {weights.length > 1 ? (
           <ResponsiveContainer width="100%" height="100%">
             <LineChart data={chartData}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
               <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 12, fill: '#9CA3AF'}} 
                  axisLine={false}
                  tickLine={false}
               />
               <YAxis 
                  domain={['dataMin - 1', 'dataMax + 1']} 
                  hide={true} 
               />
               <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
               />
               <Line 
                  type="monotone" 
                  dataKey="kg" 
                  stroke="#9333ea" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#9333ea', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
             </LineChart>
           </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Scale size={48} className="mb-2 opacity-50" />
            <p className="text-center text-sm">Adicione pelo menos 2 registros<br/>para ver o gráfico.</p>
          </div>
        )}
      </div>

      {/* History List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-700 ml-1">Histórico</h3>
        {weights.slice().reverse().map((entry) => (
          <div key={entry.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center">
            <span className="text-gray-600">
              {format(parseISO(entry.date), "d 'de' MMMM", { locale: ptBR })}
            </span>
            <div className="flex items-center space-x-3">
              <span className="font-bold text-gray-900">{entry.kg} kg</span>
              <button 
                onClick={() => entry.id && handleDelete(entry.id)}
                className="text-red-300 hover:text-red-500 p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {weights.length === 0 && (
          <p className="text-gray-400 text-center py-4">Nenhum registro encontrado.</p>
        )}
      </div>
    </div>
  );
};

export default WeightPage;

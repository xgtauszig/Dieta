import React from 'react';
import { X, Zap } from 'lucide-react';

export interface QuickLogOption {
  label: string;
  percentage: number;
  colorClass: string;
  icon?: React.ReactNode;
}

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: QuickLogOption) => void;
  calorieGoal: number;
}

const options: QuickLogOption[] = [
  { label: 'Dia Leve', percentage: 0.8, colorClass: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' },
  { label: 'Dia Normal', percentage: 1.0, colorClass: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800' },
  { label: 'Dia Pesado', percentage: 1.2, colorClass: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' },
  { label: 'Pé na Jaca', percentage: 1.5, colorClass: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' },
];

const QuickLogModal: React.FC<QuickLogModalProps> = ({ isOpen, onClose, onSelect, calorieGoal }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 shadow-xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-full text-yellow-600 dark:text-yellow-400">
              <Zap size={20} fill="currentColor" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Estimativa Rápida</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded-full">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Não contou hoje? Selecione uma estimativa baseada na sua meta de <span className="font-bold text-gray-800 dark:text-gray-200">{calorieGoal} kcal</span>.
        </p>

        <div className="grid gap-3">
          {options.map((option) => {
            const calculatedCalories = Math.round(calorieGoal * option.percentage);
            return (
              <button
                key={option.label}
                onClick={() => onSelect(option)}
                className={`w-full p-4 rounded-xl border flex items-center justify-between transition-all ${option.colorClass}`}
              >
                <div className="flex flex-col items-start">
                  <span className="font-bold text-base">{option.label}</span>
                  <span className="text-xs opacity-80">{option.percentage * 100}% da meta</span>
                </div>
                <span className="text-lg font-bold">{calculatedCalories} kcal</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuickLogModal;

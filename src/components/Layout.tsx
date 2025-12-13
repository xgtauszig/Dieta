import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Utensils, Weight, Settings, ChevronLeft, ChevronRight, Calendar, BarChart2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useDate } from '../contexts/DateContext';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { dbActions } from '../db';

const Layout: React.FC = () => {
  const { selectedDate, setSelectedDate } = useDate();

  React.useEffect(() => {
    const loadTheme = async () => {
      const darkMode = await dbActions.getSetting('darkMode');
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    loadTheme();
  }, []);

  const handlePrevDay = () => setSelectedDate(format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'));
  const handleNextDay = () => setSelectedDate(format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'));

  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <header className="bg-white dark:bg-slate-800 shadow-sm z-10 px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-slate-700">
        <button onClick={handlePrevDay} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-600 dark:text-gray-300">
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex flex-col items-center">
          <span className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 text-sm sm:text-base capitalize">
            {isToday ? (
              <>
                <Calendar size={16} className="text-green-600" />
                Hoje
              </>
            ) : (
              format(parseISO(selectedDate), "EEE, d 'de' MMM", { locale: ptBR })
            )}
          </span>
          {isToday && <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">{format(new Date(), "d 'de' MMMM", { locale: ptBR })}</span>}
        </div>

        <button onClick={handleNextDay} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-600 dark:text-gray-300">
          <ChevronRight size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-20 pt-2 bg-gray-50 dark:bg-slate-900">
        <Outlet />
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 safe-area-bottom z-20">
        <div className="flex justify-around items-center h-16">
          <NavLink
            to="/"
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center justify-center w-full h-full space-y-1",
                isActive ? "text-green-600" : "text-gray-500 hover:text-green-500"
              )
            }
          >
            <LayoutDashboard size={24} />
            <span className="text-xs font-medium">Início</span>
          </NavLink>
          
          <NavLink
            to="/meals"
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center justify-center w-full h-full space-y-1",
                isActive ? "text-green-600" : "text-gray-500 hover:text-green-500"
              )
            }
          >
            <Utensils size={24} />
            <span className="text-xs font-medium">Refeições</span>
          </NavLink>
          
          <NavLink
            to="/weight"
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center justify-center w-full h-full space-y-1",
                isActive ? "text-green-600" : "text-gray-500 hover:text-green-500"
              )
            }
          >
            <Weight size={24} />
            <span className="text-xs font-medium">Peso</span>
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center justify-center w-full h-full space-y-1",
                isActive ? "text-green-600" : "text-gray-500 hover:text-green-500"
              )
            }
          >
            <BarChart2 size={24} />
            <span className="text-xs font-medium">Relatórios</span>
          </NavLink>
          
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              clsx(
                "flex flex-col items-center justify-center w-full h-full space-y-1",
                isActive ? "text-green-600" : "text-gray-500 hover:text-green-500"
              )
            }
          >
            <Settings size={24} />
            <span className="text-xs font-medium">Ajustes</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
};

export default Layout;

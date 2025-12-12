import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Utensils, Weight, Settings } from 'lucide-react';
import { clsx } from 'clsx';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
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

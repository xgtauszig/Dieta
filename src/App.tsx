import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Meals from './pages/Meals';
import WeightPage from './pages/Weight';
import SettingsPage from './pages/Settings';
import ManageFoods from './pages/ManageFoods';
import { DateProvider } from './contexts/DateContext';

const App: React.FC = () => {
  return (
    <DateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="meals" element={<Meals />} />
            <Route path="foods" element={<ManageFoods />} />
            <Route path="weight" element={<WeightPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DateProvider>
  );
};

export default App;

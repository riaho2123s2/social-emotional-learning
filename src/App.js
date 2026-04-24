import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Toast from './components/Toast';
import Landing from './pages/Landing';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import Shop from './pages/Shop';
import HomeDecor from './pages/HomeDecor';
import CharDress from './pages/CharDress';
import './styles/global.css';

function AppContent() {
  const { currentPage } = useApp();

  const pages = {
    landing: <Landing />,
    student: <StudentDashboard />,
    teacher: <TeacherDashboard />,
    shop: <Shop />,
    'home-decor': <HomeDecor />,
    'char-dress': <CharDress />,
  };

  return (
    <>
      {pages[currentPage] || <Landing />}
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Toast from './components/Toast';
import Landing from './pages/Landing';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import Shop from './pages/Shop';
import CharDress from './pages/CharDress';
import HomeDecor from './pages/HomeDecor';
import SessionManage from './pages/SessionManage';
import PuzzleGame from './pages/PuzzleGame';
import './styles/global.css';

function AppContent() {
  const { currentPage } = useApp();

  const pages = {
    landing: <Landing />,
    student: <StudentDashboard />,
    teacher: <TeacherDashboard />,
    shop: <Shop />,
    'char-dress': <CharDress />,
    'home-decor': <HomeDecor />,
    'session-manage': <SessionManage />,
    'puzzle': <PuzzleGame />,
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

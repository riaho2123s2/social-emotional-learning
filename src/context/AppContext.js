import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SESSIONS } from '../data/sessions';

const AppContext = createContext(null);

export function getStorageUsers() {
  try {
    return JSON.parse(localStorage.getItem('sel_users') || '{}');
  } catch {
    return {};
  }
}
export function saveStorageUsers(users) {
  localStorage.setItem('sel_users', JSON.stringify(users));
}

export function AppProvider({ children }) {
  const [currentPage, setCurrentPage] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null); // { id, name, email }
  const [currentUserRole, setCurrentUserRole] = useState(null); // 'teacher' | 'student'
  const [studentData, setStudentData] = useState({});
  const [sessionLocks, setSessionLocks] = useState(SESSIONS.map((s) => s.locked));
  const [pointHistory, setPointHistory] = useState([]);
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  // 토스트 표시
  const showToast = useCallback((msg) => {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2800);
  }, []);

  // 페이지 전환
  const showPage = useCallback((pageId) => {
    setCurrentPage(pageId);
  }, []);

  // 초기 로그인 상태 복원
  // sel_session 형식: "이메일:역할" (예: "teacher@a.com:teacher")
  useEffect(() => {
    const session = localStorage.getItem('sel_session');
    if (!session) return;
    const users = getStorageUsers();
    const data = users[session];
    if (!data) return;

    const email = session.split(':').slice(0, -1).join(':'); // 마지막 :role 제거
    const user = { id: session, name: data.name, email };

    if (data.role === 'teacher') {
      const studentUpdates = {};
      Object.entries(users).forEach(([key, u]) => {
        if (u.role === 'student' && u.status === 'approved') {
          studentUpdates[key] = {
            name: u.name,
            emoji: u.emoji || '🧒',
            points: u.points || 0,
            completed: u.completed || [],
            history: u.history || [],
            inventory: u.inventory || [],
            homeItems: u.homeItems || [],
            chars: u.chars || {},
          };
        }
      });
      setStudentData(studentUpdates);
      setCurrentUser(user);
      setCurrentUserRole('teacher');
      setCurrentPage('teacher');
    } else if (data.role === 'student' && data.status === 'approved') {
      setStudentData({
        [session]: {
          name: data.name,
          emoji: data.emoji || '🧒',
          points: data.points || 0,
          completed: data.completed || [],
          history: data.history || [],
          inventory: data.inventory || [],
          homeItems: data.homeItems || [],
          chars: data.chars || {},
        },
      });
      setCurrentUser(user);
      setCurrentUserRole('student');
      setCurrentPage('student');
    }
  }, []);

  // 로그인 (Landing에서 호출)
  // uid 형식: "이메일:역할" (예: "student@a.com:student")
  const loginUser = useCallback(
    (email, userData, role) => {
      const uid = `${email}:${role}`;
      localStorage.setItem('sel_session', uid);
      const user = { id: uid, name: userData.name, email };
      setCurrentUser(user);
      setCurrentUserRole(role);

      if (role === 'teacher') {
        const users = getStorageUsers();
        const studentUpdates = {};
        Object.entries(users).forEach(([key, u]) => {
          if (u.role === 'student' && u.status === 'approved') {
            studentUpdates[key] = {
              name: u.name,
              emoji: u.emoji || '🧒',
              points: u.points || 0,
              completed: u.completed || [],
              history: u.history || [],
              inventory: u.inventory || [],
              homeItems: u.homeItems || [],
              chars: u.chars || {},
            };
          }
        });
        setStudentData(studentUpdates);
        setCurrentPage('teacher');
        showToast(`${userData.name} 선생님, 환영합니다! 👩‍🏫`);
      } else {
        setStudentData({
          [uid]: {
            name: userData.name,
            emoji: userData.emoji || '🧒',
            points: userData.points || 0,
            completed: userData.completed || [],
            history: userData.history || [],
            inventory: userData.inventory || [],
            homeItems: userData.homeItems || [],
            chars: userData.chars || {},
          },
        });
        setCurrentPage('student');
        showToast(`${userData.name} 학생, 환영합니다! 🌟`);
      }
    },
    [showToast]
  );

  // 로그아웃 (TopNav에서 호출)
  const logoutUser = useCallback(() => {
    localStorage.removeItem('sel_session');
    setCurrentUser(null);
    setCurrentUserRole(null);
    setStudentData({});
    setCurrentPage('landing');
    showToast('로그아웃 되었습니다 👋');
  }, [showToast]);

  // 학생 데이터 업데이트 — localStorage에도 자동 반영
  const updateStudentData = useCallback((uid, updater) => {
    setStudentData((prev) => {
      const existing = prev[uid] || {
        name: '',
        emoji: '🧒',
        points: 0,
        completed: [],
        history: [],
        inventory: [],
        homeItems: [],
        chars: {},
      };
      const updated = updater(existing);
      const users = getStorageUsers();
      if (users[uid]) {
        users[uid] = { ...users[uid], ...updated };
        saveStorageUsers(users);
      }
      return { ...prev, [uid]: updated };
    });
  }, []);

  // 레벨 계산
  const getLevel = useCallback((pts) => {
    if (pts >= 2000) return { label: '🏆 챔피언', tier: 5 };
    if (pts >= 1200) return { label: '💎 다이아몬드', tier: 4 };
    if (pts >= 700) return { label: '🥇 골드', tier: 3 };
    if (pts >= 300) return { label: '🥈 실버', tier: 2 };
    return { label: '🌱 씨앗', tier: 1 };
  }, []);

  const getNextLevel = useCallback((pts) => {
    const thresholds = [300, 700, 1200, 2000, 9999];
    for (const t of thresholds) {
      if (pts < t) {
        const idx = thresholds.indexOf(t);
        const prev = idx > 0 ? thresholds[idx - 1] : 0;
        const pct = Math.round(((pts - prev) / (t - prev)) * 100);
        return { remaining: t - pts, pct };
      }
    }
    return { remaining: 0, pct: 100 };
  }, []);

  const setChar = useCallback((uid, who, charData) => {
    setStudentData((prev) => {
      const student = prev[uid] || {};
      return {
        ...prev,
        [uid]: {
          ...student,
          chars: {
            ...(student.chars || {}),
            [who]: charData,
          },
        },
      };
    });
  }, []);

  const value = {
    currentPage,
    showPage,
    currentUser,
    setCurrentUser,
    currentUserRole,
    setCurrentUserRole,
    studentData,
    setStudentData,
    updateStudentData,
    sessionLocks,
    setSessionLocks,
    pointHistory,
    setPointHistory,
    toast,
    toastVisible,
    showToast,
    getLevel,
    getNextLevel,
    setChar,
    loginUser,
    logoutUser,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

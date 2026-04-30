import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { SESSIONS } from '../data/sessions';

const AppContext = createContext(null);

function profileToStudentEntry(profile) {
  return {
    name: profile.name,
    emoji: profile.emoji || '🧒',
    points: profile.points || 0,
    completed: profile.completed || [],
    history: profile.history || [],
    inventory: profile.inventory || [],
    homeItems: profile.home_items || [],
    chars: profile.chars || {},
    email: profile.email || '',
  };
}

export function AppProvider({ children }) {
  const [currentPage, setCurrentPage] = useState('landing');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [studentData, setStudentData] = useState({});
  const [sessionLocks, setSessionLocks] = useState(SESSIONS.map((s) => s.locked));
  const [pointHistory, setPointHistory] = useState([]);
  const [toast, setToast] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2800);
  }, []);

  const showPage = useCallback((pageId) => {
    setCurrentPage(pageId);
  }, []);

  const loadStudentDataForTeacher = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .eq('status', 'approved');
    if (!data) return;
    const updates = {};
    data.forEach((s) => { updates[s.id] = profileToStudentEntry(s); });
    setStudentData(updates);
  }, []);

  const loginUser = useCallback(async (authUser, profile) => {
    const user = { id: authUser.id, name: profile.name, email: authUser.email };
    setCurrentUser(user);
    setCurrentUserRole(profile.role);

    if (profile.role === 'teacher') {
      await loadStudentDataForTeacher();
      setCurrentPage('teacher');
      showToast(`${profile.name} 선생님, 환영합니다! 👩‍🏫`);
    } else {
      setStudentData({ [authUser.id]: profileToStudentEntry(profile) });
      setCurrentPage('student');
      showToast(`${profile.name} 학생, 환영합니다! 🌟`);
    }
  }, [loadStudentDataForTeacher, showToast]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (!profile || profile.status === 'pending' || profile.status === 'rejected') return;

      const user = { id: session.user.id, name: profile.name, email: session.user.email };
      setCurrentUser(user);
      setCurrentUserRole(profile.role);

      if (profile.role === 'teacher') {
        await loadStudentDataForTeacher();
        setCurrentPage('teacher');
      } else {
        setStudentData({ [session.user.id]: profileToStudentEntry(profile) });
        setCurrentPage('student');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setCurrentUserRole(null);
        setStudentData({});
        setCurrentPage('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, [loadStudentDataForTeacher]);

  const logoutUser = useCallback(async () => {
    await supabase.auth.signOut();
    showToast('로그아웃 되었습니다 👋');
  }, [showToast]);

  const updateStudentData = useCallback((uid, updater) => {
    setStudentData((prev) => {
      const existing = prev[uid] || {
        name: '', emoji: '🧒', points: 0, completed: [], history: [],
        inventory: [], homeItems: [], chars: {},
      };
      const updated = updater(existing);

      supabase.from('profiles').update({
        points: updated.points,
        completed: updated.completed,
        history: updated.history,
        inventory: updated.inventory,
        home_items: updated.homeItems,
        chars: updated.chars,
        emoji: updated.emoji,
      }).eq('id', uid);

      return { ...prev, [uid]: updated };
    });
  }, []);

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
        [uid]: { ...student, chars: { ...(student.chars || {}), [who]: charData } },
      };
    });
  }, []);

  const value = {
    currentPage, showPage,
    currentUser, setCurrentUser,
    currentUserRole, setCurrentUserRole,
    studentData, setStudentData,
    updateStudentData,
    sessionLocks, setSessionLocks,
    pointHistory, setPointHistory,
    toast, toastVisible, showToast,
    getLevel, getNextLevel,
    setChar,
    loginUser, logoutUser,
    loadStudentDataForTeacher,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

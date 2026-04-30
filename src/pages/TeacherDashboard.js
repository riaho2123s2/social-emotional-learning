import React, { useState, useEffect } from 'react';
import TopNav from '../components/TopNav';
import PtsModal from '../components/PtsModal';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { SESSIONS } from '../data/sessions';

const MEDAL_EMOJIS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
const RANK_COLORS = ['pink', 'sky', 'mint', 'yellow', 'purple', 'pink', 'sky', 'mint', 'yellow', 'purple'];

export default function TeacherDashboard() {
  const {
    showPage, currentUser, studentData, setStudentData,
    sessionLocks, setSessionLocks, pointHistory, showToast,
  } = useApp();

  const [ptsTarget, setPtsTarget] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedStudents, setApprovedStudents] = useState([]);

  useEffect(() => {
    loadPendingUsers();
    loadApprovedStudents();
  }, []); // eslint-disable-line

  async function loadPendingUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .eq('status', 'pending');
    setPendingUsers(data || []);
  }

  async function loadApprovedStudents() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .eq('status', 'approved');
    setApprovedStudents(data || []);

    const updates = {};
    (data || []).forEach((s) => {
      updates[s.id] = {
        name: s.name,
        emoji: s.emoji || '🧒',
        points: s.points || 0,
        completed: s.completed || [],
        history: s.history || [],
        inventory: s.inventory || [],
        homeItems: s.home_items || [],
        chars: s.chars || {},
        email: s.email || '',
      };
    });
    setStudentData((prev) => ({ ...prev, ...updates }));
  }

  async function approveUser(id, name) {
    await supabase.from('profiles').update({ status: 'approved' }).eq('id', id);
    showToast(`✅ ${name} 학생 승인 완료!`);
    loadPendingUsers();
    loadApprovedStudents();
  }

  async function rejectUser(id, name) {
    if (!window.confirm(`${name} 학생의 가입 신청을 거절할까요?`)) return;
    await supabase.from('profiles').update({ status: 'rejected' }).eq('id', id);
    showToast(`❌ ${name} 학생 거절 처리되었어요`);
    loadPendingUsers();
  }

  function toggleLock(idx) {
    setSessionLocks((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      showToast(next[idx] ? `🔒 ${SESSIONS[idx].id}차시 잠금` : `🔓 ${SESSIONS[idx].id}차시 열림!`);
      return next;
    });
  }

  const displayStudents =
    approvedStudents.length > 0
      ? approvedStudents
      : Object.entries(studentData).map(([id, d]) => ({ id, ...d }));

  const sortedStudents = Object.entries(studentData).sort((a, b) => b[1].points - a[1].points);

  const navItems = [
    { label: '🛍️ 상점', onClick: () => showPage('shop') },
    { label: '👤 내 캐릭터', onClick: () => showPage('char-dress') },
    { label: '🏡 마음의 집', onClick: () => showPage('home-decor') },
  ];

  return (
    <div className="page-teacher">
      <TopNav
        logo="🌱 더불어 PLAY"
        menuItems={navItems}
        userLabel={`👩‍🏫 ${currentUser?.name || '선생님'}`}
      />

      <div className="app-container">
        <div style={{ paddingTop: 20 }}>
          <div className="card" style={{ background: 'linear-gradient(135deg,#f0d9ff,#d6f5ec)', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ fontSize: '3rem' }}>👩‍🏫</div>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>선생님, 안녕하세요! 👩‍🏫</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-soft)' }}>오늘도 학생들과 함께 성장해요 🌱</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)' }}>총 학생 수</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{displayStudents.length}명</div>
              </div>
            </div>
          </div>

          {pendingUsers.length > 0 && (
            <div className="card" style={{ background: 'linear-gradient(135deg,#fff8cc,#ffe8d0)', borderColor: '#ffd060' }}>
              <div className="card-title">
                <span className="emoji">🔔</span> 회원가입 승인 대기
                <span style={{ background: '#f44', color: 'white', borderRadius: 12, padding: '2px 10px', fontSize: '0.82rem', marginLeft: 4 }}>
                  {pendingUsers.length}
                </span>
              </div>
              {pendingUsers.map((u) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  background: 'white', borderRadius: 14, marginBottom: 8, border: '1.5px solid var(--border)' }}>
                  <div style={{ fontSize: '1.5rem' }}>🧒</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800 }}>{u.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-soft)' }}>
                      {u.email} · {u.created_at ? new Date(u.created_at).toLocaleString('ko-KR') : ''}
                    </div>
                  </div>
                  <button onClick={() => approveUser(u.id, u.name)}
                    style={{ padding: '7px 16px', background: 'var(--mint)', border: '2px solid #80d4b0',
                      borderRadius: 12, fontFamily: 'var(--font)', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}>
                    ✅ 승인
                  </button>
                  <button onClick={() => rejectUser(u.id, u.name)}
                    style={{ padding: '7px 14px', background: 'var(--pink-light)', border: '2px solid var(--pink)',
                      borderRadius: 12, fontFamily: 'var(--font)', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer' }}>
                    ❌ 거절
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="teacher-grid">
            <div className="card">
              <div className="card-title"><span className="emoji">⭐</span> 학생 포인트 관리</div>
              {displayStudents.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-soft)', padding: 20, fontSize: '0.88rem' }}>
                  승인된 학생이 없어요<br />회원가입 신청을 승인해주세요! 🌟
                </div>
              ) : (
                displayStudents.map((s) => (
                  <div key={s.id} className="student-row">
                    <div className="student-avatar-sm" style={{ background: 'var(--purple-light)' }}>
                      {s.emoji || '🧒'}
                    </div>
                    <div className="student-info">
                      <div className="student-name-sm">{s.name}</div>
                      <div className="student-pts-sm">
                        ⭐ {s.points || 0}p · 완료 {(s.completed || []).length}/20
                      </div>
                      {s.email && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-soft)' }}>{s.email}</div>
                      )}
                    </div>
                    <button className="add-pts-btn" onClick={() => setPtsTarget({ id: s.id, name: s.name })}>
                      ➕ 포인트
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <div className="card-title"><span className="emoji">🔒</span> 차시 관리</div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {SESSIONS.map((s, i) => (
                  <div key={s.id} className="session-manage-row">
                    <div className="session-manage-num">{s.id}</div>
                    <div style={{ fontSize: '1.3rem' }}>{s.emoji}</div>
                    <div className="session-manage-info">
                      <div className="session-manage-name">{s.sport} × {s.skill}</div>
                      <div className="session-manage-sport">{s.skillEmoji} {s.desc}</div>
                    </div>
                    <button className={`unlock-btn${sessionLocks[i] ? ' locked-btn' : ''}`} onClick={() => toggleLock(i)}>
                      {sessionLocks[i] ? '🔒 잠김' : '🔓 열림'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-title"><span className="emoji">🏆</span> 전체 순위</div>
              {sortedStudents.map(([id, sd], i) => (
                <div key={id} className="rank-item">
                  <div className="rank-num">{MEDAL_EMOJIS[i] || `${i + 1}`}</div>
                  <div className="rank-avatar" style={{ background: `var(--${RANK_COLORS[i % RANK_COLORS.length]}-light)` }}>
                    {sd.emoji}
                  </div>
                  <div className="rank-name">{sd.name}</div>
                  <div className="rank-pts">⭐ {sd.points}p</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-title"><span className="emoji">📋</span> 포인트 지급 내역</div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {pointHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-soft)', padding: 20, fontSize: '0.88rem' }}>
                    아직 기록이 없어요
                  </div>
                ) : (
                  pointHistory.slice(0, 30).map((h, i) => (
                    <div key={i} className="history-item">
                      <div className="history-icon">
                        {h.type === 'signup' ? '📝' : h.type === 'approval' ? '✅' : '⭐'}
                      </div>
                      <div className="history-info">
                        <div className="history-name">{h.name} · {h.note || h.action || h.reason || ''}</div>
                        <div className="history-date">{h.date || ''}</div>
                      </div>
                      <div className={`history-pts${h.pts < 0 ? ' minus' : ''}`}>
                        {h.pts ? `${h.pts > 0 ? '+' : ''}${h.pts}p` : ''}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {ptsTarget && (
        <PtsModal
          target={ptsTarget}
          onClose={() => { setPtsTarget(null); loadApprovedStudents(); }}
        />
      )}
    </div>
  );
}

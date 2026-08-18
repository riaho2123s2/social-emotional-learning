import React, { useState, useEffect } from 'react';
import TopNav from '../components/TopNav';
import PtsModal from '../components/PtsModal';
import TeacherPuzzleDemo from '../components/TeacherPuzzleDemo';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

const MEDAL_EMOJIS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
const RANK_COLORS = ['pink', 'sky', 'mint', 'yellow', 'purple', 'pink', 'sky', 'mint', 'yellow', 'purple'];

const PUZZLE_PRE_PLACED = [3, 7, 14];
const PUZZLE_SESSION_PIECES = [0, 1, 2, 4, 5, 6, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19];
const PUZZLE_TOTAL = 20;
const PUZZLE_COLS = 5;

function getPuzzleOwned(completed) {
  const earned = PUZZLE_SESSION_PIECES.filter((_, i) => (completed || []).includes(i + 1));
  return new Set([...PUZZLE_PRE_PLACED, ...earned]);
}

export default function TeacherDashboard() {
  const {
    showPage, currentUser, studentData, setStudentData,
    sessionLocks, setSessionLocks, effectiveSessions, updateSession, pointHistory, showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState('overview');
  const [ptsTarget, setPtsTarget] = useState(null);
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [puzzleSelected, setPuzzleSelected] = useState(null);

  // 학생 계정 생성
  const [newName, setNewName] = useState('');
  const [newNum, setNewNum] = useState('1');
  const [newPw, setNewPw] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    loadApprovedStudents();
  }, []); // eslint-disable-line

  async function loadApprovedStudents() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .eq('status', 'approved')
      .order('student_num', { ascending: true });
    setApprovedStudents(data || []);

    const updates = {};
    (data || []).forEach((s) => {
      updates[s.id] = {
        name: s.name,
        emoji: s.emoji || '🧒',
        points: s.points || 0,
        coins: s.coins || 0,
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

  async function createStudent() {
    setCreateError('');
    if (!newName.trim()) { setCreateError('학생 이름을 입력해주세요.'); return; }
    if (!newPw || newPw.length < 6) { setCreateError('비밀번호는 6자 이상이어야 해요.'); return; }

    setCreateLoading(true);
    const email = `s${newNum}@school.sel`;

    // 같은 번호 학생이 이미 있는지 확인
    const existing = approvedStudents.find((s) => s.student_num === parseInt(newNum));
    if (existing) {
      setCreateError(`${newNum}번은 이미 ${existing.name} 학생이 사용 중이에요.`);
      setCreateLoading(false);
      return;
    }

    // 교사 세션 저장
    const { data: { session: teacherSession } } = await supabase.auth.getSession();

    const { data, error } = await supabase.auth.signUp({ email, password: newPw });

    if (error || !data.user) {
      if (teacherSession) await supabase.auth.setSession(teacherSession);
      setCreateError('계정 생성 실패: ' + (error?.message || '다시 시도해주세요'));
      setCreateLoading(false);
      return;
    }

    const studentId = data.user.id;

    // 교사 세션 즉시 복원
    if (teacherSession) await supabase.auth.setSession(teacherSession);

    const { error: profileError } = await supabase.from('profiles').insert({
      id: studentId,
      name: newName.trim(),
      email,
      role: 'student',
      status: 'approved',
      student_num: parseInt(newNum),
      emoji: '🧒',
      points: 0,
      coins: 0,
      completed: [],
      history: [],
      inventory: [],
      home_items: [],
      chars: {},
    });

    if (profileError) {
      setCreateError('프로필 생성 실패: ' + profileError.message);
      setCreateLoading(false);
      return;
    }

    showToast(`✅ ${newName} 학생 계정 생성 완료!`);
    setNewName('');
    setNewPw('');
    setCreateLoading(false);
    loadApprovedStudents();
  }

  function toggleLock(idx) {
    setSessionLocks((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      showToast(next[idx] ? `🔒 ${effectiveSessions[idx].id}차시 잠금` : `🔓 ${effectiveSessions[idx].id}차시 열림!`);
      return next;
    });
  }

  const displayStudents =
    approvedStudents.length > 0
      ? approvedStudents
      : Object.entries(studentData).map(([id, d]) => ({ id, ...d }));

  const sortedStudents = Object.entries(studentData).sort((a, b) => b[1].points - a[1].points);

  const navItems = [
    { label: '🔒 차시 관리', onClick: () => showPage('session-manage') },
    { label: '🛍️ 상점', onClick: () => showPage('shop') },
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

          {/* ── 탭 ── */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[
              { key: 'overview', label: '👨‍🎓 학생 관리' },
              { key: 'puzzle',   label: '🫧 마음방울 현황' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  padding: '10px 22px', borderRadius: 14, border: '2px solid',
                  borderColor: activeTab === key ? 'var(--purple)' : 'var(--border)',
                  background: activeTab === key ? 'var(--purple)' : 'white',
                  color: activeTab === key ? 'white' : 'var(--text)',
                  fontFamily: 'var(--font)', fontWeight: 800, fontSize: '0.9rem',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── 마음방울 탭 ── */}
          {activeTab === 'puzzle' && (
            <div>
              {/* 선생님 체험판 */}
              <TeacherPuzzleDemo />

              {/* 학생별 현황 */}
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-soft)', marginBottom: 10 }}>
                👨‍🎓 학생별 퍼즐 현황
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
                {displayStudents.map((s) => {
                  const sd = studentData[s.id] || s;
                  const owned = getPuzzleOwned(sd.completed || s.completed);
                  const ownedCount = owned.size;
                  const pct = Math.round((ownedCount / PUZZLE_TOTAL) * 100);
                  const isSelected = puzzleSelected?.id === s.id;

                  return (
                    <div
                      key={s.id}
                      onClick={() => setPuzzleSelected(isSelected ? null : { ...s, ...sd })}
                      style={{
                        border: `2.5px solid ${isSelected ? 'var(--purple)' : 'var(--border)'}`,
                        borderRadius: 16, padding: '16px 14px', background: isSelected ? '#f5f0ff' : 'white',
                        cursor: 'pointer', transition: 'all 0.15s',
                        boxShadow: isSelected ? '0 0 0 3px rgba(150,100,220,0.15)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', background: 'var(--purple-light)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0,
                        }}>{s.emoji || '🧒'}</div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{s.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-soft)' }}>{s.student_num}번</div>
                        </div>
                        <div style={{
                          marginLeft: 'auto', fontWeight: 800, fontSize: '0.8rem',
                          color: ownedCount === PUZZLE_TOTAL ? '#2a6a4a' : 'var(--purple)',
                          background: ownedCount === PUZZLE_TOTAL ? 'var(--mint-light)' : 'var(--purple-light)',
                          padding: '2px 8px', borderRadius: 10,
                        }}>
                          {ownedCount}/{PUZZLE_TOTAL}
                        </div>
                      </div>

                      {/* 미니 퍼즐 그리드 */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${PUZZLE_COLS}, 1fr)`,
                        gap: 2, marginBottom: 8,
                      }}>
                        {Array.from({ length: PUZZLE_TOTAL }, (_, i) => {
                          const isPre = PUZZLE_PRE_PLACED.includes(i);
                          const hasIt = owned.has(i);
                          return (
                            <div
                              key={i}
                              title={isPre ? `${i + 1}번 조각 (힌트)` : hasIt ? `${i + 1}번 조각 획득` : `${i + 1}번 조각 미획득`}
                              style={{
                                height: 14, borderRadius: 2,
                                background: isPre ? '#FFD700' : hasIt ? '#9060d8' : '#e0e0e0',
                                border: isPre ? '1px solid #c8a800' : hasIt ? '1px solid #7040b8' : '1px solid #ccc',
                              }}
                            />
                          );
                        })}
                      </div>

                      {/* 진행 바 */}
                      <div style={{ background: '#eee', borderRadius: 6, height: 6, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 6,
                          width: `${pct}%`,
                          background: ownedCount === PUZZLE_TOTAL
                            ? 'var(--mint)' : 'linear-gradient(90deg, var(--purple), #b080f0)',
                          transition: 'width 0.3s',
                        }} />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-soft)', marginTop: 4, textAlign: 'right' }}>
                        {pct}% 달성
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 선택된 학생 상세 */}
              {puzzleSelected && (() => {
                const sd = studentData[puzzleSelected.id] || puzzleSelected;
                const completed = sd.completed || puzzleSelected.completed || [];
                const owned = getPuzzleOwned(completed);
                return (
                  <div className="card" style={{ border: '2.5px solid var(--purple)', background: '#faf7ff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div className="card-title" style={{ marginBottom: 0 }}>
                        <span className="emoji">{puzzleSelected.emoji || '🧒'}</span>
                        {puzzleSelected.name} ({puzzleSelected.student_num}번) 퍼즐 현황
                      </div>
                      <button
                        onClick={() => setPuzzleSelected(null)}
                        style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-soft)' }}
                      >✕</button>
                    </div>

                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                      {/* 큰 퍼즐 그리드 */}
                      <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-soft)', fontWeight: 700, marginBottom: 6 }}>
                          🖼️ 퍼즐 보드 ({owned.size}/{PUZZLE_TOTAL} 조각 보유)
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: `repeat(${PUZZLE_COLS}, 44px)`,
                          gap: 4,
                          padding: 10,
                          background: 'linear-gradient(135deg,#f0e8ff,#e8f4ff)',
                          borderRadius: 12,
                          border: '2px solid var(--purple)',
                        }}>
                          {Array.from({ length: PUZZLE_TOTAL }, (_, i) => {
                            const isPre = PUZZLE_PRE_PLACED.includes(i);
                            const hasIt = owned.has(i);
                            return (
                              <div
                                key={i}
                                title={`${i + 1}번 조각${isPre ? ' (힌트)' : hasIt ? ' (획득)' : ' (미획득)'}`}
                                style={{
                                  width: 44, height: 44, borderRadius: 6,
                                  background: isPre ? 'rgba(255,215,0,0.25)' : hasIt ? 'rgba(144,96,216,0.18)' : 'rgba(200,200,200,0.3)',
                                  border: isPre ? '2px solid #FFD700' : hasIt ? '2px solid #9060d8' : '2px dashed #ccc',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: hasIt || isPre ? '0.9rem' : '0.65rem',
                                  color: isPre ? '#b8860b' : hasIt ? '#6030b0' : '#bbb',
                                  fontWeight: 800,
                                }}
                              >
                                {isPre ? '★' : hasIt ? '✓' : i + 1}
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: '0.72rem', color: 'var(--text-soft)' }}>
                          <span>🟡 힌트 조각</span>
                          <span style={{ color: '#6030b0' }}>🟣 획득</span>
                          <span>⬜ 미획득</span>
                        </div>
                      </div>

                      {/* 차시별 획득 내역 */}
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-soft)', fontWeight: 700, marginBottom: 6 }}>
                          📋 차시별 조각 획득 현황
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 320, overflowY: 'auto' }}>
                          {PUZZLE_SESSION_PIECES.map((pieceId, i) => {
                            const sessionId = i + 1;
                            const done = completed.includes(sessionId);
                            return (
                              <div
                                key={pieceId}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 8,
                                  padding: '6px 10px', borderRadius: 8,
                                  background: done ? 'rgba(144,96,216,0.08)' : '#f5f5f5',
                                  border: `1px solid ${done ? 'rgba(144,96,216,0.2)' : '#eee'}`,
                                }}
                              >
                                <div style={{
                                  width: 22, height: 22, borderRadius: 4, flexShrink: 0,
                                  background: done ? '#9060d8' : '#ddd',
                                  border: `1.5px solid ${done ? '#7040b8' : '#ccc'}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.65rem', color: done ? 'white' : '#999', fontWeight: 800,
                                }}>
                                  {pieceId + 1}
                                </div>
                                <div style={{ flex: 1, fontSize: '0.82rem', fontWeight: done ? 700 : 400, color: done ? 'var(--text)' : 'var(--text-soft)' }}>
                                  {sessionId}차시 완료
                                </div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: done ? '#9060d8' : '#ccc' }}>
                                  {done ? '✓ 획득' : '🔒 미획득'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'overview' && (
          <div>

          {/* 학생 계정 생성 */}
          <div className="card" style={{ background: 'linear-gradient(135deg,#e8f4ff,#f0e8ff)', marginBottom: 20 }}>
            <div className="card-title"><span className="emoji">➕</span> 학생 계정 생성</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 2, minWidth: 120 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)', marginBottom: 4 }}>학생 이름</div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: 김철수"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 80 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)', marginBottom: 4 }}>학생 번호</div>
                <select
                  className="form-select"
                  value={newNum}
                  onChange={(e) => setNewNum(e.target.value)}
                  style={{ marginBottom: 0 }}
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}번</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 2, minWidth: 120 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)', marginBottom: 4 }}>초기 비밀번호 (6자 이상)</div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="예: abc123"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>
              <button
                onClick={createStudent}
                disabled={createLoading}
                style={{
                  padding: '10px 20px', background: 'var(--purple)', color: 'white',
                  border: 'none', borderRadius: 14, fontFamily: 'var(--font)', fontWeight: 800,
                  fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {createLoading ? '생성 중...' : '✅ 생성'}
              </button>
            </div>
            {createError && (
              <div style={{ marginTop: 8, color: '#e55', fontSize: '0.82rem' }}>{createError}</div>
            )}
            <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-soft)' }}>
              💡 학생은 <b>이름 + 비밀번호</b>로 로그인해요. 번호는 중복 불가.
            </div>
          </div>

          <div className="teacher-grid">
            <div className="card">
              <div className="card-title"><span className="emoji">⭐</span> 학생 포인트 관리</div>
              {displayStudents.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-soft)', padding: 20, fontSize: '0.88rem' }}>
                  생성된 학생이 없어요<br />위에서 학생 계정을 만들어주세요! 🌟
                </div>
              ) : (
                displayStudents.map((s) => (
                  <div key={s.id} className="student-row">
                    <div className="student-avatar-sm" style={{ background: 'var(--purple-light)' }}>
                      {s.emoji || '🧒'}
                    </div>
                    <div className="student-info">
                      <div className="student-name-sm">{s.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-soft)' }}>({s.student_num}번)</span></div>
                      <div className="student-pts-sm">
                        ⭐ {s.points || 0}p · 💰 {s.coins || 0}코인 · 완료 {(s.completed || []).length}/17
                      </div>
                    </div>
                    <button className="add-pts-btn" onClick={() => setPtsTarget({ id: s.id, name: s.name })}>
                      ➕ 포인트
                    </button>
                  </div>
                ))
              )}
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
          </div>)}
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

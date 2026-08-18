import React, { useState } from 'react';
import TopNav from '../components/TopNav';
import MissionModal from '../components/MissionModal';
import { useApp } from '../context/AppContext';
import { SESSION_ITEMS } from '../data/shopItems';

const MEDAL_EMOJIS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
const RANK_COLORS = ['pink', 'sky', 'mint', 'yellow', 'purple', 'pink', 'sky', 'mint', 'yellow', 'purple'];
const SESSION_BG = ['pink', 'sky', 'mint', 'yellow', 'purple'];

export default function StudentDashboard() {
  const { showPage, currentUser, studentData, updateStudentData, sessionLocks, effectiveSessions, getLevel, getNextLevel, showToast } =
    useApp();

  const uid = currentUser?.id;
  const data = studentData[uid];

  function resetCompletion(session) {
    if (!window.confirm(`${session.id}차시 완료를 취소할까요?\n받은 포인트(${session.pts}p)가 차감돼요.`)) return;
    const sessionItem = SESSION_ITEMS.find((i) => i.session === session.id);
    updateStudentData(uid, (prev) => {
      const newChecks = { ...((prev.chars || {}).missionChecks || {}) };
      delete newChecks[session.id];
      return {
        ...prev,
        points: Math.max(0, (prev.points || 0) - session.pts),
        completed: (prev.completed || []).filter((id) => id !== session.id),
        inventory: sessionItem
          ? (prev.inventory || []).filter((id) => id !== sessionItem.id)
          : (prev.inventory || []),
        chars: { ...(prev.chars || {}), missionChecks: newChecks },
      };
    });
    showToast(`↩️ ${session.id}차시 완료가 취소됐어요`);
  }

  const firstActive = effectiveSessions.findIndex((s, i) => !sessionLocks[i] && !data?.completed?.includes(s.id));
  const [sessionIdx, setSessionIdx] = useState(firstActive >= 0 ? firstActive : 0);
  const [activeMission, setActiveMission] = useState(null);

  if (!data) return null;

  const level = getLevel(data.points);
  const nextLevel = getNextLevel(data.points);
  const sortedStudents = Object.entries(studentData).sort((a, b) => b[1].points - a[1].points);

  const s = effectiveSessions[sessionIdx];
  const locked = sessionLocks[sessionIdx];
  const completed = data.completed.includes(s.id);
  const color = SESSION_BG[sessionIdx % SESSION_BG.length];

  const navItems = [
    { label: '🫧 마음방울', onClick: () => showPage('puzzle') },
    { label: '🛍️ 상점', onClick: () => showPage('shop') },
  ];

  return (
    <div className="page-student">
      <TopNav
        logo="🌱 더불어 PLAY"
        menuItems={navItems}
        userLabel={`${data.emoji} ${data.name}`}
        userPoints={data.points}
      />

      <div className="app-container">
        <div className="dashboard-grid">

          {/* ── 사이드바 ── */}
          <div className="sidebar">
            <div className="card profile-card">
              <div className="profile-avatar">{data.emoji}</div>
              <div className="profile-name">{data.name}</div>
              <div className="profile-level">{level.label}</div>
              <div className="points-display">
                <div className="points-label">⭐ 보유 포인트</div>
                <div>
                  <span className="points-value">{data.points}</span>
                  <span className="points-unit">p</span>
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                  <span>다음 레벨까지</span>
                  <span>{nextLevel.remaining}p 남음</span>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar" style={{ width: `${nextLevel.pct}%` }} />
                </div>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-soft)', textAlign: 'center', marginTop: 8 }}>
                완료 차시: <strong>{data.completed.length}</strong>/17
              </div>
            </div>

            {/* 순위 */}
            <div className="card">
              <div className="card-title"><span className="emoji">🏆</span> 우리 반 순위</div>
              {sortedStudents.slice(0, 5).map(([id, sd], i) => (
                <div key={id} className="rank-item">
                  <div className="rank-num">{MEDAL_EMOJIS[i]}</div>
                  <div className="rank-avatar" style={{ background: `var(--${RANK_COLORS[i]}-light)` }}>{sd.emoji}</div>
                  <div className="rank-name" style={id === uid ? { color: 'var(--purple)' } : {}}>
                    {sd.name}{id === uid ? ' 👈' : ''}
                  </div>
                  <div className="rank-pts">⭐ {sd.points}p</div>
                </div>
              ))}
            </div>

            {/* 최근 활동 */}
            <div className="card">
              <div className="card-title"><span className="emoji">📋</span> 최근 활동</div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {data.history.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-soft)', padding: 16, fontSize: '0.85rem' }}>
                    활동 기록이 없어요<br />미션을 완료해보세요! 🌟
                  </div>
                ) : (
                  data.history.slice(0, 8).map((h, i) => (
                    <div key={i} className="history-item">
                      <div className="history-icon">{h.type === 'earn' ? '⭐' : '🛍️'}</div>
                      <div className="history-info">
                        <div className="history-name">{h.reason}</div>
                        <div className="history-date">{h.date}</div>
                      </div>
                      <div className={`history-pts${h.type === 'spend' ? ' minus' : ''}`}>
                        {h.type === 'spend' ? '-' : '+'}{h.pts}p
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── 메인 - 1차시씩 보기 ── */}
          <div>
            <div className="card">
              <div className="card-title">
                <span className="emoji">🎮</span> 17차시 뉴스포츠 × 사회정서교육
              </div>

              {/* 전체 진행 도트 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(17, 1fr)',
                  gap: 4,
                  justifyItems: 'center',
                  alignItems: 'center',
                }}>
                  {effectiveSessions.map((es, i) => {
                    const isDone = data.completed.includes(es.id);
                    const isLocked = sessionLocks[i];
                    const isCurrent = i === sessionIdx;
                    return (
                      <div
                        key={es.id}
                        onClick={() => setSessionIdx(i)}
                        title={`${es.id}차시 ${es.sport}`}
                        style={{
                          width: 22, height: 22,
                          borderRadius: '50%',
                          cursor: 'pointer',
                          background: isDone ? 'var(--mint)' : isLocked ? '#ddd' : 'var(--purple)',
                          border: isCurrent ? '2.5px solid #5a3e8a' : '2px solid transparent',
                          transition: 'all 0.2s',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.58rem', color: 'white', fontWeight: 800,
                          boxShadow: isCurrent ? '0 0 0 1.5px white inset' : 'none',
                          flexShrink: 0,
                        }}
                      >
                        {isCurrent ? es.id : ''}
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-soft)', marginTop: 6, textAlign: 'right' }}>
                  {data.completed.length}/17 완료
                </div>
              </div>

              {/* 현재 차시 카드 */}
              <div style={{
                background: `var(--${color}-light)`,
                borderRadius: 20,
                padding: '28px',
                textAlign: 'center',
                border: `2px solid var(--${color})`,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}>
                {/* 상태 뱃지 */}
                <div style={{ position: 'absolute', top: 16, right: 16 }}>
                  {completed
                    ? <span style={{ background: 'var(--mint)', color: '#2a6a4a', padding: '4px 14px', borderRadius: 20, fontWeight: 800, fontSize: '0.82rem' }}>✅ 완료</span>
                    : locked
                      ? <span style={{ background: '#f5e0e0', color: '#d44', padding: '4px 14px', borderRadius: 20, fontWeight: 800, fontSize: '0.82rem' }}>🔒 잠김</span>
                      : <span style={{ background: 'var(--purple)', color: 'white', padding: '4px 14px', borderRadius: 20, fontWeight: 800, fontSize: '0.82rem' }}>🎮 도전!</span>
                  }
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)', fontWeight: 700 }}>
                  {sessionIdx + 1} / 17
                </div>
                <div style={{ fontSize: '4rem', lineHeight: 1 }}>{s.emoji}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                  {s.id}차시 · {s.sport}
                </div>
                <div style={{ fontSize: '1rem', color: 'var(--text-soft)' }}>
                  {s.skillEmoji} {s.skill}
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-soft)' }}>
                  {s.desc}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--purple)' }}>
                  최대 {s.pts}p 획득 가능
                </div>

                {/* 미션 시작 버튼 */}
                {!completed && !locked && (
                  <button
                    onClick={() => setActiveMission(s)}
                    style={{
                      padding: '14px 40px', background: 'var(--purple)', color: 'white',
                      border: 'none', borderRadius: 20, fontFamily: 'var(--font)',
                      fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(150,100,220,0.35)', transition: 'transform 0.1s',
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    🎉 미션 시작하기
                  </button>
                )}
                {completed && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: '0.9rem', color: '#2a6a4a', fontWeight: 700 }}>
                      이 차시를 완료했어요! 🎉
                    </div>
                    <button
                      onClick={() => setActiveMission({ ...s, _review: true })}
                      style={{
                        padding: '10px 28px', background: 'white', color: '#2a6a4a',
                        border: '2px solid var(--mint)', borderRadius: 16,
                        fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.9rem',
                        cursor: 'pointer',
                      }}
                    >
                      📋 내 체크리스트 보기
                    </button>
                    <button
                      onClick={() => resetCompletion(s)}
                      style={{
                        padding: '8px 22px', background: 'white', color: '#d44',
                        border: '2px solid #f5c0c0', borderRadius: 16,
                        fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      🔄 다시 도전하기
                    </button>
                  </div>
                )}
                {locked && (
                  <div style={{ fontSize: '0.9rem', color: '#d44', fontWeight: 700 }}>
                    선생님이 아직 열지 않은 차시예요 🔒
                  </div>
                )}
              </div>

              {/* 이전 / 다음 버튼 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <button
                  onClick={() => setSessionIdx((i) => Math.max(0, i - 1))}
                  disabled={sessionIdx === 0}
                  style={{
                    padding: '10px 24px', borderRadius: 14, border: '2px solid var(--border)',
                    background: sessionIdx === 0 ? '#f0f0f0' : 'white',
                    color: sessionIdx === 0 ? '#bbb' : 'var(--text)',
                    fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.9rem',
                    cursor: sessionIdx === 0 ? 'default' : 'pointer',
                  }}
                >
                  ◀ 이전 차시
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-soft)', fontWeight: 700 }}>
                  {s.id}차시
                </span>
                <button
                  onClick={() => setSessionIdx((i) => Math.min(effectiveSessions.length - 1, i + 1))}
                  disabled={sessionIdx === effectiveSessions.length - 1}
                  style={{
                    padding: '10px 24px', borderRadius: 14, border: '2px solid var(--border)',
                    background: sessionIdx === effectiveSessions.length - 1 ? '#f0f0f0' : 'white',
                    color: sessionIdx === effectiveSessions.length - 1 ? '#bbb' : 'var(--text)',
                    fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.9rem',
                    cursor: sessionIdx === effectiveSessions.length - 1 ? 'default' : 'pointer',
                  }}
                >
                  다음 차시 ▶
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {activeMission && (
        <MissionModal
          session={activeMission}
          onClose={() => setActiveMission(null)}
          reviewMode={!!activeMission?._review}
          onComplete={() => {
            const next = effectiveSessions.findIndex((es, i) => i > sessionIdx && !sessionLocks[i] && !data.completed.includes(es.id));
            if (next >= 0) setSessionIdx(next);
          }}
        />
      )}
    </div>
  );
}

import React, { useState } from 'react';
import TopNav from '../components/TopNav';
import MissionModal from '../components/MissionModal';
import { useApp } from '../context/AppContext';
import { SESSIONS } from '../data/sessions';

const MEDAL_EMOJIS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
const RANK_COLORS = [
  'pink',
  'sky',
  'mint',
  'yellow',
  'purple',
  'pink',
  'sky',
  'mint',
  'yellow',
  'purple',
];

export default function StudentDashboard() {
  const { showPage, currentUser, studentData, sessionLocks, getLevel, getNextLevel, showToast } =
    useApp();

  const [activeMission, setActiveMission] = useState(null);

  const uid = currentUser?.id;
  const data = studentData[uid];
  if (!data) return null;

  const level = getLevel(data.points);
  const nextLevel = getNextLevel(data.points);

  // 순위 목록
  const sortedStudents = Object.entries(studentData).sort((a, b) => b[1].points - a[1].points);

  const navItems = [
    { label: '🛍️ 상점', onClick: () => showPage('shop') },
    { label: '👤 내 캐릭터', onClick: () => showPage('char-dress') },
    { label: '🏡 마음의 집', onClick: () => showPage('home-decor') },
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
          {/* 사이드바 */}
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
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                    marginBottom: 4,
                  }}
                >
                  <span>다음 레벨까지</span>
                  <span>{nextLevel.remaining}p 남음</span>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar" style={{ width: `${nextLevel.pct}%` }} />
                </div>
              </div>
              <div
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-soft)',
                  textAlign: 'center',
                  marginTop: 8,
                }}
              >
                완료 차시: <strong>{data.completed.length}</strong>/20
              </div>
            </div>

            {/* 순위 */}
            <div className="card">
              <div className="card-title">
                <span className="emoji">🏆</span> 우리 반 순위
              </div>
              {sortedStudents.slice(0, 5).map(([id, sd], i) => (
                <div key={id} className="rank-item">
                  <div className="rank-num">{MEDAL_EMOJIS[i]}</div>
                  <div
                    className="rank-avatar"
                    style={{ background: `var(--${RANK_COLORS[i]}-light)` }}
                  >
                    {sd.emoji}
                  </div>
                  <div className="rank-name" style={id === uid ? { color: 'var(--purple)' } : {}}>
                    {sd.name}
                    {id === uid ? ' 👈' : ''}
                  </div>
                  <div className="rank-pts">⭐ {sd.points}p</div>
                </div>
              ))}
            </div>

            {/* 최근 활동 */}
            <div className="card">
              <div className="card-title">
                <span className="emoji">📋</span> 최근 활동
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {data.history.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-soft)',
                      padding: 16,
                      fontSize: '0.85rem',
                    }}
                  >
                    활동 기록이 없어요
                    <br />
                    미션을 완료해보세요! 🌟
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
                        {h.type === 'spend' ? '-' : '+'}
                        {h.pts}p
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 메인 - 차시 그리드 */}
          <div>
            <div className="card">
              <div className="card-title">
                <span className="emoji">🎮</span> 20차시 뉴스포츠 × 사회정서교육
              </div>
              <div className="session-grid">
                {SESSIONS.map((s, i) => {
                  const locked = sessionLocks[i];
                  const completed = data.completed.includes(s.id);
                  const cls = completed ? 'completed' : locked ? 'locked' : 'active-session';
                  return (
                    <div
                      key={s.id}
                      className={`session-card ${cls}`}
                      onClick={() => {
                        if (!locked && !completed) setActiveMission(s);
                        else if (completed) showToast('✅ 이미 완료한 차시예요!');
                        else showToast('🔒 선생님이 아직 열지 않은 차시예요!');
                      }}
                    >
                      <div className="session-num">{s.id}차시</div>
                      <div className="session-sport">{s.emoji}</div>
                      <div className="session-name">
                        {s.sport}
                        <br />
                        <small>
                          {s.skillEmoji}
                          {s.skill}
                        </small>
                      </div>
                      <div className="session-pts">최대 {s.pts}p</div>
                      {completed && <div className="session-check">✅</div>}
                      {!completed && locked && <div className="session-lock">🔒</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeMission && (
        <MissionModal session={activeMission} onClose={() => setActiveMission(null)} />
      )}
    </div>
  );
}

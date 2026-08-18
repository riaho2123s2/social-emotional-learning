import React, { useState } from 'react';
import TopNav from '../components/TopNav';
import SessionMissionCompare from '../components/SessionMissionCompare';
import { useApp } from '../context/AppContext';

const LOCK_COLORS = ['pink', 'sky', 'mint', 'yellow', 'purple'];

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export default function SessionManage() {
  const {
    showPage, sessionLocks, setSessionLocks,
    effectiveSessions, updateSession,
    getEffectiveMission, updateMission,
    showToast,
  } = useApp();

  const [editingSession, setEditingSession] = useState(null);
  const [editTab, setEditTab] = useState('basic');
  const [editForm, setEditForm] = useState({});
  const [missionForm, setMissionForm] = useState(null);
  const [previewSession, setPreviewSession] = useState(null);

  function toggleLock(i) {
    setSessionLocks((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      showToast(next[i] ? `🔒 ${effectiveSessions[i].id}차시 잠금` : `🔓 ${effectiveSessions[i].id}차시 열림!`);
      return next;
    });
  }

  function openEdit(s) {
    setEditingSession(s);
    setEditTab('basic');
    setEditForm({ sport: s.sport, emoji: s.emoji, skill: s.skill, skillEmoji: s.skillEmoji, pts: s.pts, desc: s.desc });
    setMissionForm(deepClone(getEffectiveMission(s)));
  }

  function saveEdit() {
    updateSession(editingSession.id, editForm);
    updateMission(editingSession.id, missionForm);
    showToast(`✅ ${editingSession.id}차시 저장 완료!`);
    setEditingSession(null);
  }

  function setMissionField(path, value) {
    setMissionForm((prev) => {
      const next = deepClone(prev);
      let obj = next;
      for (let i = 0; i < path.length - 1; i++) obj = obj[path[i]];
      obj[path[path.length - 1]] = value;
      return next;
    });
  }

  function addItem(mi) {
    setMissionForm((prev) => {
      const next = deepClone(prev);
      next.missions[mi].items.push('새 항목을 입력하세요');
      return next;
    });
  }

  function removeItem(mi, ii) {
    setMissionForm((prev) => {
      const next = deepClone(prev);
      next.missions[mi].items.splice(ii, 1);
      return next;
    });
  }

  const navItems = [{ label: '◀ 뒤로', onClick: () => showPage('teacher') }];
  const lockedCount = sessionLocks.filter(Boolean).length;
  const openCount = sessionLocks.length - lockedCount;

  const tabBtn = (active) => ({
    padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.85rem',
    background: active ? 'var(--purple)' : 'var(--border)',
    color: active ? 'white' : 'var(--text-soft)',
  });

  const groupColors = [
    { bg: 'var(--pink-light)', border: 'var(--pink)' },
    { bg: 'var(--sky-light)', border: 'var(--sky)' },
    { bg: 'var(--mint-light)', border: 'var(--mint)' },
  ];

  return (
    <div className="page-teacher">
      <TopNav logo="🔒 차시 관리" menuItems={navItems} userLabel="👩‍🏫 선생님" />

      <div className="app-container" style={{ paddingTop: 24 }}>
        {/* 요약 헤더 */}
        <div className="card" style={{ background: 'linear-gradient(135deg,#f0d9ff,#d6f5ec)', marginBottom: 24, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '2.4rem' }}>📋</div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>차시 관리</div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-soft)', marginTop: 2 }}>
              열린 차시: <strong style={{ color: '#2a8a5a' }}>{openCount}개</strong>&nbsp;·&nbsp;잠긴 차시: <strong style={{ color: '#d44' }}>{lockedCount}개</strong>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => { if (!window.confirm('모든 차시를 열까요?')) return; setSessionLocks(effectiveSessions.map(() => false)); showToast('🔓 전체 차시를 열었어요!'); }}
              style={{ padding: '8px 16px', background: '#2a8a5a', color: 'white', border: 'none', borderRadius: 12, fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
              🔓 전체 열기
            </button>
            <button onClick={() => { if (!window.confirm('모든 차시를 잠글까요?')) return; setSessionLocks(effectiveSessions.map(() => true)); showToast('🔒 전체 차시를 잠갔어요!'); }}
              style={{ padding: '8px 16px', background: '#d44', color: 'white', border: 'none', borderRadius: 12, fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
              🔒 전체 잠금
            </button>
          </div>
        </div>

        {/* 차시 카드 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {effectiveSessions.map((s, i) => {
            const locked = sessionLocks[i];
            const color = LOCK_COLORS[i % LOCK_COLORS.length];
            return (
              <div key={s.id} className="card" style={{ border: locked ? '2px solid #f5c6c6' : '2px solid var(--mint)', background: locked ? '#fff8f8' : '#f6fffc', transition: 'all 0.2s', padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `var(--${color}-light)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                    {s.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>{s.id}차시 · {s.sport}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)', marginTop: 2 }}>{s.skillEmoji} {s.skill}</div>
                  </div>
                  <div style={{ padding: '3px 10px', borderRadius: 20, background: locked ? '#fde8e8' : '#e6f9f0', color: locked ? '#d44' : '#2a8a5a', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0 }}>
                    {locked ? '🔒 잠김' : '🔓 열림'}
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)', marginBottom: 14, paddingLeft: 4 }}>
                  {s.desc}&nbsp;·&nbsp;<strong style={{ color: 'var(--purple)' }}>최대 {s.pts}p</strong>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setPreviewSession(s)} style={{ flex: 1, padding: '8px 0', borderRadius: 12, border: '1.5px solid var(--mint)', background: 'var(--mint-light)', color: '#2a8a5a', fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                    👁️ 미션 보기
                  </button>
                  <button onClick={() => openEdit(s)} style={{ flex: 1, padding: '8px 0', borderRadius: 12, border: '1.5px solid var(--purple)', background: 'var(--purple-light)', color: 'var(--purple)', fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                    ✏️ 내용 수정
                  </button>
                  <button onClick={() => toggleLock(i)} style={{ flex: 1, padding: '8px 0', borderRadius: 12, border: locked ? '1.5px solid #f5c6c6' : '1.5px solid #b5e8d5', background: locked ? '#fde8e8' : '#e6f9f0', color: locked ? '#d44' : '#2a8a5a', fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                    {locked ? '🔓 열기' : '🔒 잠금'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 수정 모달 */}
      {editingSession && missionForm && (
        <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setEditingSession(null)}>
          <div className="modal-box" style={{ maxWidth: 600, width: '96vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <div className="modal-title">✏️ {editingSession.id}차시 수정</div>
              <button className="modal-close" onClick={() => setEditingSession(null)}>✕</button>
            </div>

            {/* 탭 */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button style={tabBtn(editTab === 'basic')} onClick={() => setEditTab('basic')}>📌 기본 정보</button>
              <button style={tabBtn(editTab === 'mission')} onClick={() => setEditTab('mission')}>📋 학습 내용</button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              {/* 기본 정보 탭 */}
              {editTab === 'basic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { key: 'emoji', label: '이모지' },
                    { key: 'sport', label: '종목명' },
                    { key: 'skill', label: '역량' },
                    { key: 'skillEmoji', label: '역량 이모지' },
                    { key: 'desc', label: '설명' },
                    { key: 'pts', label: '포인트', type: 'number' },
                  ].map(({ key, label, type }) => (
                    <div key={key}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-soft)', marginBottom: 4 }}>{label}</div>
                      <input
                        type={type || 'text'}
                        className="form-input"
                        style={{ marginBottom: 0 }}
                        value={editForm[key] ?? ''}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* 학습 내용 탭 */}
              {editTab === 'mission' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* 차시 제목 */}
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-soft)', marginBottom: 4 }}>차시 제목</div>
                    <input
                      className="form-input"
                      style={{ marginBottom: 0 }}
                      value={missionForm.title}
                      onChange={(e) => setMissionField(['title'], e.target.value)}
                    />
                  </div>

                  {/* 미션 그룹 3개 */}
                  {missionForm.missions.map((m, mi) => (
                    <div key={mi} style={{ background: groupColors[mi]?.bg || 'var(--purple-light)', borderRadius: 14, padding: 14, borderLeft: `4px solid ${groupColors[mi]?.border || 'var(--purple)'}` }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-soft)', marginBottom: 8 }}>미션 그룹 {mi + 1}</div>

                      {/* 그룹 제목 */}
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginBottom: 3 }}>그룹 제목</div>
                        <input
                          className="form-input"
                          style={{ marginBottom: 0, fontSize: '0.85rem' }}
                          value={m.title}
                          onChange={(e) => setMissionField(['missions', mi, 'title'], e.target.value)}
                        />
                      </div>

                      {/* 그룹 포인트 */}
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginBottom: 3 }}>포인트</div>
                        <input
                          type="number"
                          className="form-input"
                          style={{ marginBottom: 0, fontSize: '0.85rem', width: 100 }}
                          value={m.pts}
                          onChange={(e) => setMissionField(['missions', mi, 'pts'], Number(e.target.value))}
                        />
                      </div>

                      {/* 체크리스트 항목 */}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-soft)', marginBottom: 6 }}>체크리스트 항목</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {m.items.map((item, ii) => (
                          <div key={ii} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-soft)', minWidth: 18 }}>{ii + 1}.</span>
                            <input
                              className="form-input"
                              style={{ marginBottom: 0, fontSize: '0.82rem', flex: 1 }}
                              value={item}
                              onChange={(e) => setMissionField(['missions', mi, 'items', ii], e.target.value)}
                            />
                            <button
                              onClick={() => removeItem(mi, ii)}
                              style={{ padding: '4px 8px', border: 'none', borderRadius: 8, background: '#fde8e8', color: '#d44', cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0 }}
                            >✕</button>
                          </div>
                        ))}
                        <button
                          onClick={() => addItem(mi)}
                          style={{ padding: '6px', border: '1.5px dashed var(--text-soft)', borderRadius: 8, background: 'transparent', color: 'var(--text-soft)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'var(--font)', fontWeight: 700 }}
                        >
                          + 항목 추가
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={saveEdit} style={{ flex: 1, padding: '12px', background: 'var(--purple)', color: 'white', border: 'none', borderRadius: 14, fontFamily: 'var(--font)', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}>
                💾 저장
              </button>
              <button onClick={() => setEditingSession(null)} style={{ flex: 1, padding: '12px', background: 'var(--border)', color: 'var(--text)', border: 'none', borderRadius: 14, fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {previewSession && (
        <SessionMissionCompare session={previewSession} onClose={() => setPreviewSession(null)} />
      )}
    </div>
  );
}

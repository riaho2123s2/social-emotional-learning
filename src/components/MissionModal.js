import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SESSION_ITEMS } from '../data/shopItems';

const PUZZLE_SESSION_PIECES = [0, 1, 2, 4, 5, 6, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19];
const PUZZLE_COLS = 5;
const PUZZLE_ROWS = 4;
const PUZZLE_IMAGE = '/puzzles/puzzle1.png';

export default function MissionModal({ session, onClose, onComplete, previewOnly = false, reviewMode = false }) {
  const { currentUser, studentData, updateStudentData, setPointHistory, showToast, getEffectiveMission } = useApp();

  const uid = currentUser?.id;
  const savedChecks = reviewMode ? (studentData[uid]?.chars?.missionChecks?.[session.id] || {}) : {};
  const [checks, setChecks] = useState(savedChecks);
  const [reward, setReward] = useState(null); // { pts, sessionItem, pieceId }

  if (!session) return null;

  const mData = getEffectiveMission(session);
  const totalItems = mData.missions.reduce((a, m) => a + m.items.length, 0);
  const totalChecked = Object.values(checks).filter(Boolean).length;
  const pct = Math.round((totalChecked / totalItems) * 100);

  function toggleCheck(key) {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function submitMission() {
    const uid = currentUser.id;
    const data = studentData[uid];
    if (!data) return;
    if (data.completed.includes(session.id)) {
      showToast('이미 완료한 차시예요!');
      return;
    }

    const pts = session.pts;
    const now = new Date().toLocaleDateString('ko-KR');
    const sessionItem = SESSION_ITEMS.find((i) => i.session === session.id);
    const logEntry = {
      pts,
      type: 'earn',
      reason: `${session.id}차시 미션 완료 (${session.sport}×${session.skill})`,
      date: now,
    };

    updateStudentData(uid, (prev) => ({
      ...prev,
      points: (prev.points || 0) + pts,
      completed: [...(prev.completed || []), session.id],
      history: [logEntry, ...(prev.history || [])],
      inventory: sessionItem && !(prev.inventory || []).includes(sessionItem.id)
        ? [...(prev.inventory || []), sessionItem.id]
        : (prev.inventory || []),
      chars: {
        ...(prev.chars || {}),
        missionChecks: {
          ...((prev.chars || {}).missionChecks || {}),
          [session.id]: checks,
        },
      },
    }));

    setPointHistory((prev) => [
      {
        studentId: uid,
        name: data.name,
        pts,
        reason: `${session.id}차시 미션 완료`,
        date: now,
        type: 'earn',
      },
      ...prev,
    ]);

    const pieceId = PUZZLE_SESSION_PIECES[session.id - 1];
    setReward({ pts, sessionItem, pieceId });
    if (onComplete) onComplete();
  }

  /* ── 보상 팝업 ── */
  if (reward) {
    const { pts, sessionItem, pieceId } = reward;
    const pieceCol = pieceId !== undefined ? pieceId % PUZZLE_COLS : 0;
    const pieceRow = pieceId !== undefined ? Math.floor(pieceId / PUZZLE_COLS) : 0;
    const D = 110; // 조각 표시 크기

    return (
      <div className="modal-overlay open">
        <div className="modal-box" style={{ textAlign: 'center', maxWidth: 400 }}>
          {/* 헤더 */}
          <div style={{ fontSize: '2.8rem', marginBottom: 4 }}>🎉</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 2 }}>
            {session.id}차시 완료!
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)', marginBottom: 20 }}>
            {session.sport} × {session.skill}
          </div>

          {/* 포인트 + 퍼즐 조각 */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 22 }}>

            {/* 포인트 카드 */}
            <div style={{
              flex: 1, background: 'linear-gradient(135deg,#fff9e0,#fff3c0)',
              border: '2px solid #ffd700', borderRadius: 18,
              padding: '18px 12px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 6,
            }}>
              <div style={{ fontSize: '2rem' }}>⭐</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#c88000', lineHeight: 1 }}>
                +{pts}p
              </div>
              <div style={{ fontSize: '0.78rem', color: '#a06000', fontWeight: 700 }}>포인트 획득!</div>
              {sessionItem && (
                <div style={{
                  marginTop: 6, padding: '4px 10px', borderRadius: 10,
                  background: 'rgba(255,215,0,0.3)', fontSize: '0.78rem', fontWeight: 700,
                }}>
                  {sessionItem.emoji} {sessionItem.name} 소품 획득
                </div>
              )}
            </div>

            {/* 퍼즐 조각 카드 */}
            <div style={{
              flex: 1, background: 'linear-gradient(135deg,#f5f0ff,#ede0ff)',
              border: '2px solid var(--purple)', borderRadius: 18,
              padding: '18px 12px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 6,
            }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--purple)', marginBottom: 4 }}>
                🫧 마음방울 조각
              </div>
              {pieceId !== undefined ? (
                <div style={{
                  width: D, height: D,
                  backgroundImage: `url(${PUZZLE_IMAGE})`,
                  backgroundSize: `${D * PUZZLE_COLS}px ${D * PUZZLE_ROWS}px`,
                  backgroundPosition: `-${pieceCol * D}px -${pieceRow * D}px`,
                  borderRadius: 12,
                  border: '2.5px solid var(--purple)',
                  boxShadow: '0 4px 16px rgba(150,100,220,0.3)',
                  flexShrink: 0,
                }} />
              ) : (
                <div style={{ fontSize: '2.5rem' }}>🧩</div>
              )}
              <div style={{ fontSize: '0.78rem', color: 'var(--purple)', fontWeight: 700, marginTop: 4 }}>
                조각 #{pieceId !== undefined ? pieceId + 1 : '?'} 획득!
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '14px', background: 'var(--purple)', color: 'white',
              border: 'none', borderRadius: 16, fontFamily: 'var(--font)',
              fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
            }}
          >
            ✨ 확인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <div className="modal-title">
            {session.emoji} {mData.title}
          </div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div
          style={{
            background: 'var(--purple-light)',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
            fontSize: '0.85rem',
          }}
        >
          💡 <strong>{session.sport}</strong> 활동과 함께 <strong>{session.skill}</strong>을 키워요!
          <br />
          <span style={{ color: 'var(--text-soft)' }}>
            {session.desc} · 최대 {session.pts}포인트
          </span>
        </div>

        {mData.missions.map((m, mi) => {
          const cls = ['m1', 'm2', 'm3'][mi];
          return (
            <div key={m.id} className={`mission-box ${cls}`}>
              <div className="mission-title">
                {m.title}
                <span className="mission-pts">⭐ {m.pts}p</span>
              </div>
              <div className="mission-check-list">
                {m.items.map((item, ii) => {
                  const key = `${m.id}_${ii}`;
                  const isChecked = !!checks[key];
                  return (
                    <div
                      key={key}
                      className={`mission-check-item${isChecked ? ' checked' : ''}`}
                      onClick={() => !reviewMode && toggleCheck(key)}
                      style={reviewMode ? { cursor: 'default' } : {}}
                    >
                      <div className="check-circle">{isChecked ? '✓' : ''}</div>
                      <div className="check-text">{item}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div
          style={{ background: 'var(--yellow-light)', borderRadius: 12, padding: 12, marginTop: 4 }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
              marginBottom: 6,
            }}
          >
            <span style={{ fontWeight: 700 }}>📊 완료도</span>
            <span style={{ fontWeight: 800 }}>
              {totalChecked}/{totalItems} ({pct}%)
            </span>
          </div>
          <div style={{ background: '#e8d8f0', borderRadius: 10, height: 10, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg,var(--purple),var(--mint))',
                borderRadius: 10,
                width: `${pct}%`,
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>

        {!previewOnly && !reviewMode && (
          <button className="mission-submit-btn" onClick={submitMission}>
            🎉 미션 완료! 포인트 받기
          </button>
        )}
        {reviewMode && (
          <div style={{ textAlign: 'center', padding: '14px', fontSize: '0.88rem', background: 'var(--mint-light)', borderRadius: 12, border: '1.5px solid var(--mint)', color: '#2a6a4a', fontWeight: 700 }}>
            ✅ 이미 완료한 차시예요! 내가 체크했던 항목들이에요 😊
          </div>
        )}
        {previewOnly && (
          <div style={{ textAlign: 'center', padding: '12px', fontSize: '0.85rem', color: 'var(--text-soft)', background: 'var(--purple-light)', borderRadius: 12 }}>
            👩‍🏫 선생님 미리보기 모드 — 학생만 포인트를 받을 수 있어요
          </div>
        )}
      </div>
    </div>
  );
}

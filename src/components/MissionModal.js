import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MISSIONS, getDefaultMission } from '../data/sessions';

export default function MissionModal({ session, onClose, onComplete }) {
  const { currentUser, studentData, updateStudentData, setPointHistory, showToast } = useApp();
  const [checks, setChecks] = useState({});

  if (!session) return null;

  const mData = MISSIONS[session.id] || getDefaultMission(session);
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

    showToast(`🎉 ${pts}포인트 획득! 대단해요!`);
    onClose();
    if (onComplete) onComplete();
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
                      onClick={() => toggleCheck(key)}
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

        <button className="mission-submit-btn" onClick={submitMission}>
          🎉 미션 완료! 포인트 받기
        </button>
      </div>
    </div>
  );
}

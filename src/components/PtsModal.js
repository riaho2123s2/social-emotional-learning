import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function PtsModal({ target, onClose }) {
  const { studentData, updateStudentData, setPointHistory, showToast } = useApp();
  const [amount, setAmount] = useState('');

  if (!target) return null;

  const data = studentData[target.id];
  const displayName = target.name || data?.name || target.id;
  const displayPts = data?.points ?? 0;

  async function givePoints() {
    const pts = parseInt(amount);
    if (!pts || pts <= 0) {
      showToast('포인트를 올바르게 입력해주세요!');
      return;
    }

    const now = new Date().toLocaleString('ko-KR');
    const logEntry = { pts, date: now, type: 'earn' };
    const newPts = (data?.points || 0) + pts;

    await updateStudentData(target.id, (prev) => ({
      ...prev,
      points: newPts,
      history: [logEntry, ...(prev.history || [])],
    }));

    setPointHistory((prev) => [
      {
        studentId: target.id,
        name: displayName,
        pts,
        date: now,
        type: 'earn',
      },
      ...prev,
    ]);

    showToast(`⭐ ${displayName}에게 ${pts}p 지급 완료!`);
    onClose();
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <div className="modal-title">⭐ 포인트 지급</div>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-soft)', marginBottom: 16 }}>
          📍 대상: {displayName} (현재 {displayPts}p)
        </p>
        <input
          type="number"
          className="pts-input"
          placeholder="포인트 입력 (예: 50)"
          min="1"
          max="500"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button className="btn-primary" onClick={givePoints}>
          ✨ 지급하기
        </button>
      </div>
    </div>
  );
}

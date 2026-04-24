import React from 'react';
import { useApp } from '../context/AppContext';

export default function BuyModal({ item, onClose }) {
  const { currentUser, studentData, updateStudentData, setPointHistory, showToast } = useApp();

  if (!item) return null;

  const uid = currentUser?.id;
  const data = studentData[uid];
  const currentPts = data?.points ?? 0;

  function confirmBuy() {
    if (!data) return;
    if (currentPts < item.price) {
      showToast('포인트가 부족해요! 미션을 더 완료해보세요 💪');
      return;
    }

    const now = new Date().toLocaleDateString('ko-KR');
    const logEntry = {
      pts: item.price,
      type: 'spend',
      reason: `[상점] ${item.name} 구매`,
      date: now,
    };
    const newPts = currentPts - item.price;

    updateStudentData(uid, (prev) => ({
      ...prev,
      points: newPts,
      inventory: [...(prev.inventory || []), item.id],
      history: [logEntry, ...(prev.history || [])],
    }));

    setPointHistory((prev) => [
      {
        studentId: uid,
        name: data.name,
        pts: item.price,
        reason: `${item.name} 구매`,
        date: now,
        type: 'spend',
      },
      ...prev,
    ]);

    showToast(`🛍️ ${item.name} 구매 완료! 마음의 집에서 사용해보세요`);
    onClose();
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 360, textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>{item.emoji}</div>
        <div className="modal-title" style={{ justifyContent: 'center', marginBottom: 8 }}>
          {item.name}
        </div>
        <p style={{ color: 'var(--text-soft)', fontSize: '0.9rem', marginBottom: 20 }}>
          ⭐ {item.price}p (현재 보유: {currentPts}p)
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            className="btn-primary"
            style={{ background: 'linear-gradient(90deg,var(--mint),var(--sky))' }}
            onClick={confirmBuy}
          >
            🛒 구매하기
          </button>
          <button
            className="btn-primary"
            style={{ background: '#f0f0f0', color: 'var(--text)', boxShadow: 'none' }}
            onClick={onClose}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

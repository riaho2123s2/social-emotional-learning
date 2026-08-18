import React from 'react';
import { useApp } from '../context/AppContext';

export default function BuyModal({ item, onClose }) {
  const { currentUser, studentData, updateStudentData, setPointHistory, showToast } = useApp();

  if (!item) return null;

  const uid = currentUser?.id;
  const data = studentData[uid];
  const currentPts = data?.points ?? 0;
  const canAfford = currentPts >= item.price;

  async function confirmBuy() {
    if (!data) return;
    if (!canAfford) {
      showToast('포인트가 부족해요! 미션을 더 완료해서 포인트를 모아보세요 ⭐');
      return;
    }

    const now = new Date().toLocaleString('ko-KR');

    await updateStudentData(uid, (prev) => ({
      ...prev,
      points: (prev.points || 0) - item.price,
      history: [
        { pts: -item.price, type: 'spend', reason: `[마켓] ${item.name} 구매`, date: now },
        ...(prev.history || []),
      ],
    }));

    setPointHistory((prev) => [
      {
        studentId: uid,
        name: data.name,
        pts: -item.price,
        reason: `${item.name} 구매`,
        date: now,
        type: 'spend',
      },
      ...prev,
    ]);

    showToast(`🛍️ ${item.name} 구매 완료! 선생님께 보여주세요 🎉`);
    onClose();
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 360, textAlign: 'center' }}>
        {/* 상품 이모지 */}
        <div style={{
          fontSize: '5rem',
          marginBottom: 12,
          background: 'linear-gradient(135deg, #fff8f0, #ffecd2)',
          borderRadius: 20,
          padding: '16px',
          display: 'inline-block',
        }}>
          {item.emoji}
        </div>

        {/* 상품명 */}
        <div style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: 4 }}>
          {item.name}
        </div>
        <div style={{
          fontSize: '0.8rem',
          color: 'var(--text-soft)',
          background: '#fff0f0',
          display: 'inline-block',
          borderRadius: 8,
          padding: '2px 10px',
          marginBottom: 16,
        }}>
          {item.sub}
        </div>

        {/* 가격 & 잔액 */}
        <div style={{
          background: '#f8f9fa',
          borderRadius: 16,
          padding: '14px',
          marginBottom: 18,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-soft)' }}>상품 가격</span>
            <span style={{ fontSize: '1rem', fontWeight: 900, color: '#c0392b' }}>
              {item.price.toLocaleString()}원
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-soft)' }}>내 포인트</span>
            <span style={{ fontSize: '1rem', fontWeight: 800 }}>
              ⭐ {currentPts.toLocaleString()}원
            </span>
          </div>
          <div style={{ height: 1, background: '#e0e0e0', margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-soft)' }}>구매 후 잔액</span>
            <span style={{
              fontSize: '1rem',
              fontWeight: 900,
              color: canAfford ? 'var(--mint)' : '#e55',
            }}>
              {canAfford
                ? `⭐ ${(currentPts - item.price).toLocaleString()}원`
                : `⚠️ ${(item.price - currentPts).toLocaleString()}원 부족`}
            </span>
          </div>
        </div>

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={confirmBuy}
            style={{
              flex: 1,
              padding: '13px',
              borderRadius: 14,
              border: 'none',
              background: canAfford
                ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)'
                : '#ddd',
              color: canAfford ? 'white' : '#999',
              fontFamily: 'var(--font)',
              fontWeight: 900,
              fontSize: '1rem',
              cursor: canAfford ? 'pointer' : 'default',
            }}
          >
            🛒 구매하기
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '13px',
              borderRadius: 14,
              border: '2px solid #eee',
              background: 'white',
              color: 'var(--text)',
              fontFamily: 'var(--font)',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

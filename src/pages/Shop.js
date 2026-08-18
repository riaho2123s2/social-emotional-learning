import React, { useState } from 'react';
import TopNav from '../components/TopNav';
import BuyModal from '../components/BuyModal';
import { useApp } from '../context/AppContext';
import { MARKET_ITEMS, MARKET_SUBS } from '../data/shopItems';

const SUB_EMOJIS = {
  '전체': '🛒',
  '젤리': '🐻',
  '초콜릿': '🍫',
  '과자': '🍪',
  '사탕': '🍭',
  '음료': '🥤',
  '아이스크림': '🍦',
};

export default function Shop() {
  const { showPage, currentUser, currentUserRole, studentData, showToast } = useApp();
  const [filter, setFilter] = useState('전체');
  const [buyItem, setBuyItem] = useState(null);

  const uid = currentUser?.id;
  const data = studentData[uid];
  const pts = currentUserRole === 'student' ? data?.points || 0 : 9999;
  const userName =
    currentUserRole === 'teacher' ? '👩‍🏫 선생님' : `${data?.emoji || '🧒'} ${data?.name || ''}`;

  const items = filter === '전체' ? MARKET_ITEMS : MARKET_ITEMS.filter((i) => i.sub === filter);

  function handleBuy(item) {
    if (currentUserRole === 'teacher') {
      showToast('교사는 구매할 수 없어요! 학생 계정으로 확인해주세요.');
      return;
    }
    if (!data) return;
    setBuyItem(item);
  }

  const backPage = currentUserRole === 'teacher' ? 'teacher' : 'student';
  const navItems = [{ label: '◀ 뒤로', onClick: () => showPage(backPage) }];

  return (
    <div className="page-shop">
      <TopNav logo="🛒 우리 마켓" menuItems={navItems} userLabel={userName} userPoints={pts} />

      <div className="app-container">

        {/* 마켓 헤더 배너 */}
        <div style={{
          background: 'linear-gradient(135deg, #ff9a9e, #fecfef, #ffecd2)',
          borderRadius: 24,
          padding: '28px 24px',
          marginBottom: 20,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ fontSize: '2.8rem', marginBottom: 8 }}>🏪</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#c0392b', letterSpacing: '-0.5px' }}>
            우리 마켓
          </div>
          <div style={{ fontSize: '0.85rem', color: '#7f4f4f', marginTop: 4 }}>
            포인트로 간식을 구매하고 선생님께 받아요! 🎉
          </div>

          {/* 장식 이모지들 */}
          <div style={{
            position: 'absolute', top: 10, left: 14, fontSize: '1.6rem', opacity: 0.25,
          }}>🍬</div>
          <div style={{
            position: 'absolute', top: 16, right: 18, fontSize: '1.4rem', opacity: 0.25,
          }}>🍫</div>
          <div style={{
            position: 'absolute', bottom: 8, left: 28, fontSize: '1.2rem', opacity: 0.2,
          }}>🍦</div>
          <div style={{
            position: 'absolute', bottom: 10, right: 24, fontSize: '1.3rem', opacity: 0.2,
          }}>🍪</div>
        </div>

        {/* 포인트 잔액 */}
        {currentUserRole === 'student' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'white',
            borderRadius: 18,
            padding: '16px 22px',
            marginBottom: 16,
            border: '2px solid #ffd060',
            boxShadow: '0 2px 12px rgba(255,208,96,0.2)',
          }}>
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-soft)', marginBottom: 2 }}>내 보유 포인트</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#c0392b' }}>
                ⭐ {pts.toLocaleString()}원
              </div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #fff8cc, #ffe0a0)',
              borderRadius: 14,
              padding: '10px 18px',
              fontSize: '0.82rem',
              color: '#b5800a',
              fontWeight: 700,
              textAlign: 'center',
            }}>
              💡 포인트 = 원<br />
              <span style={{ fontSize: '0.75rem', fontWeight: 400 }}>그대로 사용 가능!</span>
            </div>
          </div>
        )}

        {/* 카테고리 탭 */}
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 4,
          marginBottom: 16,
          scrollbarWidth: 'none',
        }}>
          {MARKET_SUBS.map((sub) => (
            <button
              key={sub}
              onClick={() => setFilter(sub)}
              style={{
                whiteSpace: 'nowrap',
                padding: '8px 16px',
                borderRadius: 20,
                border: filter === sub ? '2px solid #c0392b' : '2px solid #eee',
                background: filter === sub
                  ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)'
                  : 'white',
                color: filter === sub ? 'white' : 'var(--text)',
                fontFamily: 'var(--font)',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {SUB_EMOJIS[sub]} {sub}
            </button>
          ))}
        </div>

        {/* 상품 그리드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}>
          {items.map((item) => {
            const canAfford = pts >= item.price;
            return (
              <div
                key={item.id}
                onClick={() => handleBuy(item)}
                style={{
                  background: 'white',
                  borderRadius: 20,
                  padding: '18px 12px 14px',
                  textAlign: 'center',
                  border: canAfford || currentUserRole === 'teacher'
                    ? '2px solid #f0f0f0'
                    : '2px solid #f0f0f0',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  opacity: currentUserRole === 'student' && !canAfford ? 0.55 : 1,
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (canAfford || currentUserRole === 'teacher') {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
                }}
              >
                {/* 카테고리 뱃지 */}
                <div style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  fontSize: '0.62rem',
                  background: '#fff0f0',
                  color: '#c0392b',
                  borderRadius: 8,
                  padding: '2px 6px',
                  fontWeight: 700,
                }}>
                  {item.sub}
                </div>

                {/* 이모지 */}
                <div style={{ fontSize: '2.8rem', marginBottom: 10, lineHeight: 1 }}>
                  {item.emoji}
                </div>

                {/* 상품명 */}
                <div style={{
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  color: 'var(--text)',
                  marginBottom: 8,
                  lineHeight: 1.3,
                }}>
                  {item.name}
                </div>

                {/* 가격 태그 */}
                <div style={{
                  display: 'inline-block',
                  background: canAfford || currentUserRole === 'teacher'
                    ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)'
                    : '#e0e0e0',
                  color: canAfford || currentUserRole === 'teacher' ? 'white' : '#999',
                  borderRadius: 12,
                  padding: '5px 12px',
                  fontSize: '0.9rem',
                  fontWeight: 900,
                  letterSpacing: '-0.3px',
                }}>
                  {item.price.toLocaleString()}원
                </div>

                {/* 포인트 부족 표시 */}
                {currentUserRole === 'student' && !canAfford && (
                  <div style={{ fontSize: '0.7rem', color: '#aaa', marginTop: 5 }}>
                    {(item.price - pts).toLocaleString()}원 부족
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 안내 문구 */}
        <div style={{
          background: 'linear-gradient(135deg, #e8f5e9, #f0f4ff)',
          borderRadius: 16,
          padding: '14px 18px',
          textAlign: 'center',
          fontSize: '0.82rem',
          color: 'var(--text-soft)',
          marginBottom: 20,
          border: '1.5px dashed #b2dfdb',
        }}>
          🎁 구매한 상품은 <b>선생님</b>께 포인트 영수증을 보여주고 받으세요!<br />
          <span style={{ fontSize: '0.76rem' }}>포인트는 구매 즉시 차감됩니다.</span>
        </div>
      </div>

      {buyItem && <BuyModal item={buyItem} onClose={() => setBuyItem(null)} />}
    </div>
  );
}

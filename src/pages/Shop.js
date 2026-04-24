import React, { useState } from 'react';
import TopNav from '../components/TopNav';
import BuyModal from '../components/BuyModal';
import { useApp } from '../context/AppContext';
import { SHOP_ITEMS, CHAR_CATS } from '../data/shopItems';

export default function Shop() {
  const { showPage, currentUser, currentUserRole, studentData, showToast } = useApp();
  const [mainMode, setMainMode] = useState('room'); // 'room' | 'char'
  const [shopFilter, setShopFilter] = useState('all');
  const [buyItem, setBuyItem] = useState(null);

  const uid = currentUser?.id;
  const data = studentData[uid];
  const pts = currentUserRole === 'student' ? data?.points || 0 : 9999;
  const inventory = currentUserRole === 'student' ? data?.inventory || [] : [];
  const userName =
    currentUserRole === 'teacher' ? '👩‍🏫 선생님' : `${data?.emoji || '🧒'} ${data?.name || ''}`;

  function switchMain(mode) {
    setMainMode(mode);
    setShopFilter(mode === 'room' ? 'all' : 'char_all');
  }

  // 필터링된 아이템
  let items;
  if (shopFilter === 'all') {
    items = SHOP_ITEMS.filter((i) => !CHAR_CATS.includes(i.cat));
  } else if (shopFilter === 'char_all') {
    items = SHOP_ITEMS.filter((i) => CHAR_CATS.includes(i.cat));
  } else {
    items = SHOP_ITEMS.filter((i) => i.cat === shopFilter);
  }

  function handleItemClick(item) {
    if (currentUserRole === 'teacher') {
      showToast('교사는 구매할 수 없어요! 학생 계정으로 로그인해주세요.');
      return;
    }
    if (!data) return;
    if (inventory.includes(item.id)) {
      showToast('이미 보유한 아이템이에요! 🏡 마음의 집에서 사용해보세요');
      return;
    }
    setBuyItem(item);
  }

  const backPage = currentUserRole === 'teacher' ? 'teacher' : 'student';

  const navItems = [{ label: '◀ 뒤로', onClick: () => showPage(backPage) }];

  const roomCats = [
    { key: 'all', label: '🌟 전체' },
    { key: 'furniture', label: '🛋️ 가구' },
    { key: 'plant', label: '🌿 식물' },
    { key: 'pet', label: '🐾 반려동물' },
    { key: 'deco', label: '✨ 장식' },
    { key: 'wall', label: '🎨 벽지/바닥' },
  ];
  const charCats = [
    { key: 'char_all', label: '🌟 전체' },
    { key: 'hair', label: '💇 머리' },
    { key: 'top', label: '👕 상의' },
    { key: 'bottom', label: '👖 하의' },
    { key: 'shoes', label: '👟 신발' },
    { key: 'acc', label: '🎀 악세서리' },
  ];

  return (
    <div className="page-shop">
      <TopNav logo="🛍️ 마음 상점" menuItems={navItems} userLabel={userName} userPoints={pts} />

      <div className="app-container">
        <div className="shop-header">
          <div className="shop-title">🌈 마음 상점 🛍️</div>
          <p style={{ color: 'var(--text-soft)', fontSize: '0.9rem', marginTop: 6 }}>
            포인트로 마음의 집을 꾸며보세요!
          </p>
          <div className="shop-points-badge">
            ⭐ 보유 포인트: <span>{pts}</span>p
          </div>
        </div>

        {/* 대분류 탭 */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
            margin: '16px 0 8px',
            flexWrap: 'wrap',
          }}
        >
          <button
            className={`cat-tab${mainMode === 'room' ? ' active' : ''}`}
            style={{ fontSize: '1rem', padding: '10px 24px' }}
            onClick={() => switchMain('room')}
          >
            🏡 집 꾸미기
          </button>
          <button
            className={`cat-tab${mainMode === 'char' ? ' active' : ''}`}
            style={{ fontSize: '1rem', padding: '10px 24px' }}
            onClick={() => switchMain('char')}
          >
            👤 캐릭터 꾸미기
          </button>
        </div>

        {/* 소분류 탭 */}
        {mainMode === 'room' && (
          <div className="shop-category-tabs">
            {roomCats.map((c) => (
              <button
                key={c.key}
                className={`cat-tab${shopFilter === c.key ? ' active' : ''}`}
                onClick={() => setShopFilter(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
        {mainMode === 'char' && (
          <div className="shop-category-tabs">
            {charCats.map((c) => (
              <button
                key={c.key}
                className={`cat-tab${shopFilter === c.key ? ' active' : ''}`}
                onClick={() => setShopFilter(c.key)}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        {/* 아이템 그리드 */}
        <div className="shop-grid">
          {items.map((item) => {
            const owned = inventory.includes(item.id);
            const isChar = CHAR_CATS.includes(item.cat);
            return (
              <div
                key={item.id}
                className={`shop-item${owned ? ' owned' : ''}`}
                onClick={() => handleItemClick(item)}
              >
                <div className="shop-item-icon">{item.emoji}</div>
                <div className="shop-item-name">{item.name}</div>
                <div className="shop-item-price">⭐ {item.price}p</div>
                {owned && <div className="shop-item-owned">✅ 보유중</div>}
                {isChar && !owned && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--purple)', marginTop: 2 }}>
                    👗 캐릭터용
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 캐릭터 꾸미기 바로가기 */}
        {mainMode === 'char' && (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <button
              className="btn-primary"
              style={{ width: 'auto', padding: '12px 32px' }}
              onClick={() => showPage('char-dress')}
            >
              ✨ 지금 바로 캐릭터 입혀보기 →
            </button>
          </div>
        )}
      </div>

      {buyItem && <BuyModal item={buyItem} onClose={() => setBuyItem(null)} />}
    </div>
  );
}

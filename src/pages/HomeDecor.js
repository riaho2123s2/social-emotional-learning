import React, { useState } from 'react';
import TopNav from '../components/TopNav';
import { useApp } from '../context/AppContext';
import { SHOP_ITEMS } from '../data/shopItems';

const MAX_PLACE = 3;

export default function HomeDecor() {
  const { showPage, currentUser, currentUserRole, studentData, updateStudentData, showToast } =
    useApp();
  const [selectedItem, setSelectedItem] = useState(null);

  const uid = currentUser?.id;
  const data = studentData[uid];
  const inventory = currentUserRole === 'student' ? data?.inventory || [] : [];
  const homeItems = currentUserRole === 'student' ? data?.homeItems || [] : [];

  const backPage = currentUserRole === 'teacher' ? 'teacher' : 'student';
  const userName =
    currentUserRole === 'teacher' ? '👩‍🏫 선생님' : `${data?.emoji || '🧒'} ${data?.name || ''}`;

  function getPlaceCount(itemId) {
    return homeItems.filter((h) => h.id === itemId).length;
  }

  function placeItemOnScene(e) {
    if (!selectedItem || currentUserRole !== 'student') return;
    const item = SHOP_ITEMS.find((i) => i.id === selectedItem);
    if (!item) return;

    const count = getPlaceCount(selectedItem);
    if (count >= MAX_PLACE) {
      showToast(`⚠️ ${item.name}은 최대 ${MAX_PLACE}번까지만 배치할 수 있어요!`);
      setSelectedItem(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (((e.clientX - rect.left) / rect.width) * 100).toFixed(1);
    const y = (((e.clientY - rect.top) / rect.height) * 100).toFixed(1);

    updateStudentData(uid, (prev) => ({
      ...prev,
      homeItems: [
        ...(prev.homeItems || []),
        { id: item.id, emoji: item.emoji, name: item.name, x, y },
      ],
    }));

    const newCount = count + 1;
    if (newCount >= MAX_PLACE) {
      showToast(
        `${item.emoji} ${item.name} 배치 완료! (${newCount}/${MAX_PLACE} — 이 아이템은 더 배치할 수 없어요)`
      );
      setSelectedItem(null);
    } else {
      showToast(`${item.emoji} ${item.name} 배치! (${newCount}/${MAX_PLACE}회)`);
    }
  }

  function undoLastItem() {
    if (currentUserRole !== 'student' || homeItems.length === 0) {
      showToast('↩️ 되돌릴 아이템이 없어요!');
      return;
    }
    const removed = homeItems[homeItems.length - 1];
    updateStudentData(uid, (prev) => ({
      ...prev,
      homeItems: (prev.homeItems || []).slice(0, -1),
    }));
    showToast(`↩️ ${removed.emoji} ${removed.name} 배치를 취소했어요`);
  }

  function clearHome() {
    if (!window.confirm('마음의 집을 전체 초기화할까요?\n배치된 아이템이 모두 사라져요!')) return;
    if (currentUserRole === 'student') {
      updateStudentData(uid, (prev) => ({ ...prev, homeItems: [] }));
      setSelectedItem(null);
    }
    showToast('🏡 마음의 집이 초기화되었어요');
  }

  const navItems = [{ label: '◀ 뒤로', onClick: () => showPage(backPage) }];

  return (
    <div className="page-home-decor">
      <TopNav logo="🏡 마음의 집" menuItems={navItems} userLabel={userName} />

      <div className="home-container">
        <div className="home-title">🏡 나의 마음의 집</div>
        <div className="home-sub">구매한 아이템을 클릭하고, 집 안에 배치해보세요! ✨</div>

        {/* 집 씬 */}
        <div className="home-scene" onClick={placeItemOnScene}>
          {/* SVG 배경 */}
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 800 400"
            preserveAspectRatio="xMidYMid meet"
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#87CEEB' }} />
                <stop offset="100%" style={{ stopColor: '#B8E4F9' }} />
              </linearGradient>
              <linearGradient id="wallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#FFF8F0' }} />
                <stop offset="100%" style={{ stopColor: '#FFE8D0' }} />
              </linearGradient>
              <linearGradient id="floorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#E8D5B0' }} />
                <stop offset="100%" style={{ stopColor: '#D4BC95' }} />
              </linearGradient>
            </defs>
            {/* 하늘 */}
            <rect width="800" height="400" fill="url(#skyGrad)" />
            {/* 구름 */}
            <ellipse cx="120" cy="60" rx="60" ry="25" fill="white" opacity="0.8" />
            <ellipse cx="160" cy="50" rx="50" ry="20" fill="white" opacity="0.9" />
            <ellipse cx="650" cy="80" rx="70" ry="28" fill="white" opacity="0.7" />
            <ellipse cx="690" cy="68" rx="55" ry="22" fill="white" opacity="0.9" />
            {/* 해 */}
            <circle cx="720" cy="50" r="30" fill="#FFE066" opacity="0.9" />
            {/* 집 외벽 */}
            <rect x="50" y="80" width="700" height="320" fill="url(#wallGrad)" rx="4" />
            {/* 바닥 */}
            <rect x="50" y="320" width="700" height="80" fill="url(#floorGrad)" />
            {/* 바닥 선 */}
            {[100, 200, 300, 400, 500, 600, 700].map((x) => (
              <line
                key={x}
                x1={x}
                y1="320"
                x2={x}
                y2="400"
                stroke="#C4A880"
                strokeWidth="1"
                strokeDasharray="4"
              />
            ))}
            {/* 창문 1 */}
            <rect
              x="80"
              y="80"
              width="140"
              height="120"
              rx="8"
              fill="#D6EEFF"
              stroke="#A8C8E8"
              strokeWidth="3"
            />
            <line x1="150" y1="80" x2="150" y2="200" stroke="#A8C8E8" strokeWidth="2" />
            <line x1="80" y1="140" x2="220" y2="140" stroke="#A8C8E8" strokeWidth="2" />
            <rect x="84" y="84" width="62" height="52" rx="4" fill="#B8D8F0" opacity="0.5" />
            <rect x="154" y="84" width="62" height="52" rx="4" fill="#C8E4F8" opacity="0.5" />
            <path d="M80,80 Q95,100 88,140 L80,140 Z" fill="#FFB3C6" opacity="0.7" />
            <path d="M220,80 Q205,100 212,140 L220,140 Z" fill="#FFB3C6" opacity="0.7" />
            {/* 창문 2 */}
            <rect
              x="580"
              y="80"
              width="140"
              height="120"
              rx="8"
              fill="#D6EEFF"
              stroke="#A8C8E8"
              strokeWidth="3"
            />
            <line x1="650" y1="80" x2="650" y2="200" stroke="#A8C8E8" strokeWidth="2" />
            <line x1="580" y1="140" x2="720" y2="140" stroke="#A8C8E8" strokeWidth="2" />
            <rect x="584" y="84" width="62" height="52" rx="4" fill="#B8D8F0" opacity="0.5" />
            <rect x="654" y="84" width="62" height="52" rx="4" fill="#C8E4F8" opacity="0.5" />
            <path d="M580,80 Q595,100 588,140 L580,140 Z" fill="#C9B8F0" opacity="0.7" />
            <path d="M720,80 Q705,100 712,140 L720,140 Z" fill="#C9B8F0" opacity="0.7" />
            {/* 그림액자 */}
            <rect
              x="340"
              y="60"
              width="120"
              height="90"
              rx="6"
              fill="#FFF0D0"
              stroke="#DDB870"
              strokeWidth="3"
            />
            <rect x="348" y="68" width="104" height="74" rx="4" fill="#FFE0A8" opacity="0.6" />
            <circle cx="400" cy="105" r="20" fill="#FFB3C6" opacity="0.8" />
            <text x="400" y="110" textAnchor="middle" fontSize="18">
              🌸
            </text>
            {/* 벽 장식 */}
            <circle cx="52" cy="52" r="8" fill="#FFB3C6" opacity="0.5" />
            <circle cx="748" cy="52" r="8" fill="#B5E8D5" opacity="0.5" />
          </svg>

          {/* 배치된 아이템 */}
          {homeItems.map((item, i) => (
            <div
              key={i}
              className="placed-item"
              style={{ left: `${item.x}%`, top: `${item.y}%`, transform: 'translate(-50%,-50%)' }}
              title={item.name}
            >
              {item.emoji}
            </div>
          ))}

          <div
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              fontSize: '0.78rem',
              color: 'rgba(100,80,80,0.5)',
            }}
          >
            💡 아이템 선택 후 클릭하여 배치
          </div>
        </div>

        {/* 인벤토리 툴바 */}
        <div className="home-toolbar">
          <span className="home-toolbar-label">🎒 내 인벤토리:</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {inventory.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)' }}>
                상점에서 아이템을 구매하면 여기에 나타나요! 🛍️
              </div>
            ) : (
              inventory.map((itemId) => {
                const item = SHOP_ITEMS.find((i) => i.id === itemId);
                if (!item) return null;
                const count = getPlaceCount(itemId);
                const maxed = count >= MAX_PLACE;
                const isSelected = selectedItem === itemId;
                return (
                  <div key={itemId} style={{ position: 'relative', display: 'inline-block' }}>
                    <div
                      className={`inventory-item${isSelected ? ' selected' : ''}${maxed ? ' maxed' : ''}`}
                      title={`${item.name} (${count}/${MAX_PLACE}회 배치)`}
                      style={
                        maxed
                          ? { opacity: 0.45, cursor: 'not-allowed', filter: 'grayscale(0.5)' }
                          : {}
                      }
                      onClick={() => {
                        if (maxed) {
                          showToast(
                            `⚠️ ${item.name}은 이미 3번 배치했어요! 다른 아이템을 사용해보세요 🏡`
                          );
                          return;
                        }
                        const next = selectedItem === itemId ? null : itemId;
                        setSelectedItem(next);
                        if (next)
                          showToast(`${item.emoji} ${item.name} 선택됨 · 집에 클릭해서 배치!`);
                      }}
                    >
                      {item.emoji}
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: -6,
                        right: -6,
                        background: maxed ? '#f44336' : count > 0 ? 'var(--purple)' : 'var(--mint)',
                        color: 'white',
                        borderRadius: 10,
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '1px 6px',
                        border: '2px solid white',
                        pointerEvents: 'none',
                        fontFamily: 'var(--font)',
                      }}
                    >
                      {count}/{MAX_PLACE}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <button
              className="clear-btn"
              style={{ background: 'var(--sky-light)', border: '2px solid var(--sky)' }}
              onClick={undoLastItem}
            >
              ↩️ 되돌리기
            </button>
            <button className="clear-btn" onClick={clearHome}>
              🗑️ 전체 초기화
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

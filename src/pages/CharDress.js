import React, { useState, useRef, useEffect, useCallback } from 'react';
import TopNav from '../components/TopNav';
import { useApp } from '../context/AppContext';
import { SHOP_ITEMS, SKIN_COLORS, defaultChar } from '../data/shopItems';

const FAMILY_MEMBERS = [
  { id: 'me', label: '🙋 나' },
  { id: 'dad', label: '👨 아빠' },
  { id: 'mom', label: '👩 엄마' },
  { id: 'sibling', label: '👦 형제/자매' },
  { id: 'pet2', label: '🐾 반려동물' },
];

const PART_TABS = [
  { key: 'hair', label: '💇 머리' },
  { key: 'face', label: '😊 표정' },
  { key: 'top', label: '👕 상의' },
  { key: 'bottom', label: '👖 하의' },
  { key: 'shoes', label: '👟 신발' },
  { key: 'acc', label: '🎀 악세서리' },
  { key: 'skin', label: '🎨 피부색' },
];

const DEFAULT_ITEMS = {
  hair: { id: 'h0', name: '기본 머리', emoji: '💇', price: 0, cat: 'hair' },
  face: { id: 'f0', name: '기본 표정', emoji: '😐', price: 0, cat: 'face' },
  top: { id: 't0', name: '기본 상의', emoji: '👕', price: 0, cat: 'top' },
  bottom: { id: 'b0', name: '기본 하의', emoji: '👖', price: 0, cat: 'bottom' },
  shoes: { id: 'sh0', name: '기본 신발', emoji: '👟', price: 0, cat: 'shoes' },
  acc: { id: 'ac0', name: '없음', emoji: '✕', price: 0, cat: 'acc' },
};

function drawCharacter(canvas, charData, scale = 1) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width,
    h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const c = charData || defaultChar();
  const cx = w / 2;
  const s = scale;

  const hairItem = SHOP_ITEMS.find((i) => i.id === c.hair);
  const faceItem = SHOP_ITEMS.find((i) => i.id === c.face);
  const topItem = SHOP_ITEMS.find((i) => i.id === c.top);
  const botItem = SHOP_ITEMS.find((i) => i.id === c.bottom);
  const shoeItem = SHOP_ITEMS.find((i) => i.id === c.shoes);
  const accItem = c.acc ? SHOP_ITEMS.find((i) => i.id === c.acc) : null;

  ctx.font = `${28 * s}px serif`;
  ctx.textAlign = 'center';
  ctx.fillText(shoeItem ? shoeItem.emoji : '👟', cx, h * 0.93);
  ctx.font = `${34 * s}px serif`;
  ctx.fillText(botItem ? botItem.emoji : '👖', cx, h * 0.77);
  ctx.font = `${36 * s}px serif`;
  ctx.fillText(topItem ? topItem.emoji : '👕', cx, h * 0.56);
  ctx.font = `${44 * s}px serif`;
  ctx.fillText(faceItem ? faceItem.emoji : '😊', cx, h * 0.34);
  ctx.font = `${36 * s}px serif`;
  ctx.fillText(hairItem ? hairItem.emoji : '💇', cx, h * 0.13);
  if (accItem) {
    ctx.font = `${26 * s}px serif`;
    ctx.fillText(accItem.emoji, cx + 30 * s, h * 0.34);
  }
}

export default function CharDress() {
  const { showPage, currentUser, currentUserRole, studentData, setChar, showToast } = useApp();
  const [familyTab, setFamilyTab] = useState('me');
  const [partTab, setPartTab] = useState('hair');

  const canvasRef = useRef(null);

  const uid = currentUser?.id;
  const data = studentData[uid];
  const inventory = currentUserRole === 'student' ? data?.inventory || [] : [];
  const userName =
    currentUserRole === 'teacher' ? '👩‍🏫 선생님' : `${data?.emoji || '🧒'} ${data?.name || ''}`;
  const backPage = currentUserRole === 'teacher' ? 'teacher' : 'student';

  // 현재 캐릭터 데이터
  const currentCharData =
    currentUserRole === 'student' && uid
      ? data?.chars?.[familyTab] || defaultChar()
      : defaultChar();

  // 캐릭터 그리기
  const redrawCanvas = useCallback(() => {
    if (canvasRef.current) {
      drawCharacter(canvasRef.current, currentCharData, 1);
    }
  }, [currentCharData]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // 말풍선
  const speech = currentCharData.speech || '안녕하세요! 😊';

  function updateSpeech(val) {
    if (currentUserRole !== 'student' || !uid) return;
    const updated = { ...currentCharData, speech: val };
    setChar(uid, familyTab, updated);
  }

  function equipItem(part, itemId) {
    if (currentUserRole !== 'student' || !uid) return;
    const updated = { ...currentCharData, [part]: itemId };
    setChar(uid, familyTab, updated);
    showToast(`${SHOP_ITEMS.find((i) => i.id === itemId)?.emoji || ''} 착용 완료!`);
  }

  function setSkin(color) {
    if (currentUserRole !== 'student' || !uid) return;
    const updated = { ...currentCharData, skin: color };
    setChar(uid, familyTab, updated);
    showToast('🎨 피부색을 바꿨어요!');
  }

  // 옷장 아이템
  const catItems = SHOP_ITEMS.filter((i) => i.cat === partTab);
  const allWardrobeItems = partTab === 'skin' ? [] : [DEFAULT_ITEMS[partTab], ...catItems];

  const navItems = [
    { label: '◀ 뒤로', onClick: () => showPage(backPage) },
    { label: '🛍️ 상점', onClick: () => showPage('shop') },
  ];

  return (
    <div className="page-char-dress">
      <TopNav logo="👤 내 캐릭터" menuItems={navItems} userLabel={userName} />

      <div className="app-container" style={{ paddingTop: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>✨ 나의 캐릭터 꾸미기</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-soft)', marginTop: 4 }}>
            머리부터 신발까지 나만의 스타일을 만들어봐요!
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
            maxWidth: 900,
            margin: '0 auto',
          }}
        >
          {/* 왼쪽: 캐릭터 프리뷰 */}
          <div>
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '28px 20px',
                background: 'linear-gradient(160deg,#f0d9ff,#d6f5ec)',
              }}
            >
              <div style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 16 }}>
                👤 내 캐릭터 미리보기
              </div>

              <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
                <canvas
                  ref={canvasRef}
                  width={200}
                  height={280}
                  style={{
                    borderRadius: 20,
                    background: 'linear-gradient(180deg,#e8f4fd,#f5e8ff)',
                  }}
                />
              </div>

              {/* 말풍선 */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    marginBottom: 8,
                    color: 'var(--text-soft)',
                  }}
                >
                  💬 나의 말풍선
                </div>
                <div
                  style={{
                    position: 'relative',
                    background: 'white',
                    borderRadius: 16,
                    border: '2px solid var(--border)',
                    padding: '12px 14px',
                    marginBottom: 8,
                    minHeight: 48,
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    textAlign: 'left',
                    wordBreak: 'break-all',
                  }}
                >
                  {speech || '…'}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -12,
                      left: 24,
                      width: 0,
                      height: 0,
                      borderLeft: '10px solid transparent',
                      borderRight: '10px solid transparent',
                      borderTop: '12px solid white',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: -15,
                      left: 22,
                      width: 0,
                      height: 0,
                      borderLeft: '12px solid transparent',
                      borderRight: '12px solid transparent',
                      borderTop: '14px solid var(--border)',
                      zIndex: -1,
                    }}
                  />
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="말풍선에 쓸 내용을 입력해요!"
                  maxLength={30}
                  style={{ textAlign: 'center', fontSize: '0.95rem' }}
                  value={
                    speech === '안녕하세요! 😊' && currentCharData.speech === undefined
                      ? ''
                      : currentCharData.speech || ''
                  }
                  onChange={(e) => updateSpeech(e.target.value)}
                />
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-soft)',
                    marginTop: 4,
                    textAlign: 'right',
                  }}
                >
                  {(currentCharData.speech || '').length}/30자
                </div>
              </div>

              {/* 가족 탭 */}
              <div style={{ borderTop: '2px dashed var(--border)', paddingTop: 14 }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    marginBottom: 10,
                    color: 'var(--text-soft)',
                  }}
                >
                  👨‍👩‍👧 가족 캐릭터도 꾸며봐요!
                </div>
                <div
                  style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}
                >
                  {FAMILY_MEMBERS.map((m) => (
                    <button
                      key={m.id}
                      className={`family-tab${familyTab === m.id ? ' active' : ''}`}
                      onClick={() => setFamilyTab(m.id)}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 가족 미리보기 */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: 12 }}>
                🏠 우리 가족
              </div>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                {FAMILY_MEMBERS.map((m) => (
                  <FamilyMiniCanvas
                    key={m.id}
                    member={m}
                    charData={
                      m.id === 'pet2'
                        ? null
                        : currentUserRole === 'student' && uid
                          ? data?.chars?.[m.id] || defaultChar()
                          : defaultChar()
                    }
                    selected={familyTab === m.id}
                    onClick={() => setFamilyTab(m.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽: 옷장 */}
          <div>
            <div className="card" style={{ padding: 20 }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 14 }}>👗 옷장</div>

              {/* 파트 탭 */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {PART_TABS.map((t) => (
                  <button
                    key={t.key}
                    className={`part-tab${partTab === t.key ? ' active' : ''}`}
                    onClick={() => setPartTab(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* 피부색 스와치 */}
              {partTab === 'skin' && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '8px 0' }}>
                  {SKIN_COLORS.map((color) => (
                    <div
                      key={color}
                      className={`skin-swatch${currentCharData.skin === color ? ' selected' : ''}`}
                      style={{ background: color }}
                      title={color}
                      onClick={() => setSkin(color)}
                    />
                  ))}
                </div>
              )}

              {/* 옷장 그리드 */}
              {partTab !== 'skin' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4,1fr)',
                    gap: 10,
                    maxHeight: 320,
                    overflowY: 'auto',
                  }}
                >
                  {allWardrobeItems.map((item) => {
                    const owned = item.price === 0 || inventory.includes(item.id);
                    const equipped =
                      currentCharData[partTab] === item.id ||
                      (item.id.endsWith('0') && !currentCharData[partTab]);
                    return (
                      <div
                        key={item.id}
                        className={`wardrobe-item${equipped ? ' equipped' : ''}${!owned ? ' locked-item' : ''}`}
                        onClick={() => {
                          if (!owned) {
                            showToast(`🔒 상점에서 ⭐${item.price}p로 구매하면 사용할 수 있어요!`);
                            return;
                          }
                          equipItem(partTab, item.id);
                        }}
                      >
                        <div className="wardrobe-item-icon">{item.emoji}</div>
                        <div className="wardrobe-item-name">{item.name}</div>
                        {!owned && <div className="wardrobe-item-price">🔒 ⭐{item.price}p</div>}
                        {owned && equipped && <div className="wardrobe-item-owned">✨ 착용중</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 가족 미니 캔버스 컴포넌트
function FamilyMiniCanvas({ member, charData, selected, onClick }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (member.id === 'pet2') {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, 70, 100);
      ctx.font = '50px serif';
      ctx.textAlign = 'center';
      ctx.fillText('🐾', 35, 65);
    } else {
      drawCharacter(canvasRef.current, charData, 0.35);
    }
  }, [charData, member.id]);

  return (
    <div className="family-mini" onClick={onClick}>
      <canvas
        ref={canvasRef}
        width={70}
        height={100}
        className={`family-mini-canvas${selected ? ' selected' : ''}`}
      />
      <div className="family-mini-label">{member.label}</div>
    </div>
  );
}

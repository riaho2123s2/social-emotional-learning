import React, { useState, useEffect, useRef, useCallback } from 'react';
import TopNav from '../components/TopNav';
import { useApp } from '../context/AppContext';
import { defaultChar, SKIN_COLORS } from '../data/shopItems';

// ── LPC Sprite config ──────────────────────────────────────────────
const LPC = 'https://raw.githubusercontent.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator/master/spritesheets/';
// walk.png layout: 9 cols × 4 rows, 64×64 each. Row 2 (y=128) = front-facing.
const SX = 0, SY = 128, SW = 64, SH = 64;

const imgCache = new Map();
function loadImg(url) {
  if (imgCache.has(url)) return Promise.resolve(imgCache.get(url));
  return new Promise((res) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => { imgCache.set(url, img);  res(img); };
    img.onerror = () => { imgCache.set(url, null); res(null); };
    img.src = url;
  });
}

async function drawLayer(ctx, url, tintColor, tintAlpha = 0.55) {
  const img = await loadImg(url);
  if (!img) return;
  const tmp = document.createElement('canvas');
  tmp.width = 64; tmp.height = 64;
  const tc = tmp.getContext('2d');
  tc.drawImage(img, SX, SY, SW, SH, 0, 0, 64, 64);
  if (tintColor) {
    tc.globalCompositeOperation = 'source-atop';
    tc.fillStyle = tintColor;
    tc.globalAlpha = tintAlpha;
    tc.fillRect(0, 0, 64, 64);
  }
  ctx.drawImage(tmp, 0, 0);
}

// ── URL builders (paths verified against repo) ─────────────────────
const HAIR_KEY = { h0:'bob', h1:'long', h2:'bangs', h3:'ponytail', h4:'braid', h5:'curly_short', h6:'pixie' };
const TOP_KEY  = { t0:'tshirt', t1:'tshirt_vneck', t2:'tshirt_scoop', t3:'shortsleeve_cardigan', t4:'shortsleeve_polo', t5:'tshirt_buttoned' };
const BOT_KEY  = { b0:'pants', b1:'shorts', b2:'skirts', b3:'pants' };
const SHOE_KEY = { sh0:'shoes', sh1:'boots', sh2:'shoes', sh3:'boots' };

const hairUrl = (s)     => `${LPC}hair/${HAIR_KEY[s] || 'bob'}/adult/walk.png`;
const bodyUrl = (g)     => `${LPC}body/bodies/${g}/walk.png`;
const topUrl  = (s, g)  => `${LPC}torso/clothes/shortsleeve/${TOP_KEY[s] || 'tshirt'}/${g}/walk.png`;
const botUrl  = (s, g)  => `${LPC}legs/${BOT_KEY[s] || 'pants'}/${g === 'female' ? 'thin' : 'male'}/walk.png`;
const shoeUrl = (s)     => `${LPC}feet/${SHOE_KEY[s] || 'shoes'}/basic/male/walk.png`;

// ── Auto-detect head bounding box from LPC body sprite pixels ─────────
const headCache = new Map();
async function detectHeadCenter(gender) {
  if (headCache.has(gender)) return headCache.get(gender);
  const fallback = { cx: 32, cy: 16, rx: 8, ry: 9 };
  const img = await loadImg(bodyUrl(gender));
  if (!img) { headCache.set(gender, fallback); return fallback; }
  const tmp = document.createElement('canvas');
  tmp.width = 64; tmp.height = 64;
  const tc = tmp.getContext('2d');
  tc.drawImage(img, SX, SY, SW, SH, 0, 0, 64, 64);
  const d = tc.getImageData(0, 0, 64, 64).data;
  // Scan only the central column (avoid detecting arms) in the upper half
  let minY = 64, maxY = 0, minX = 64, maxX = 0;
  for (let y = 4; y < 36; y++) {
    for (let x = 20; x < 44; x++) {
      if (d[(y * 64 + x) * 4 + 3] > 120) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  const result = (maxY > minY && maxX > minX)
    ? { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, rx: (maxX - minX) / 2, ry: (maxY - minY) / 2 }
    : fallback;
  headCache.set(gender, result);
  return result;
}

// Face shape scale factors applied on top of detected head size
const FACE_SHAPES = {
  fs0: { rxS: 1.00, ryS: 1.00 },  // 동그란
  fs1: { rxS: 0.78, ryS: 1.18 },  // 갸름한
  fs2: { rxS: 1.22, ryS: 0.82 },  // 귀여운(넓적)
  fs3: { rxS: 1.00, ryS: 1.00 },  // 기본형
};

// All sizes/positions derived proportionally from detected head bounds
function drawFaceCanvas(ctx, char, head) {
  const skin  = char.skin      || '#FFDBB5';
  const hairC = char.hairColor || '#4A2C0A';
  const expr  = char.eyeStyle  || 'e0';
  const shape = FACE_SHAPES[char.faceShape] || FACE_SHAPES.fs0;

  const { cx, cy, rx: hrx, ry: hry } = head;
  const rx = hrx * shape.rxS;
  const ry = hry * shape.ryS;

  // Hair covers top ~38% of head height — features live below that line
  const foreheadY = cy - hry * 0.38;
  const chinY     = cy + hry;
  const faceH     = chinY - foreheadY;

  const EY  = foreheadY + faceH * 0.30;        // eyes
  const BY  = foreheadY + faceH * 0.08;        // eyebrows
  const LX  = cx - hrx * 0.38;
  const RX  = cx + hrx * 0.38;

  const eRx  = hrx * 0.28;                     // eye white x-radius
  const eRy  = hry * 0.20;                     // eye white y-radius
  const iR   = hrx * 0.17;                     // iris radius
  const pR   = hrx * 0.085;                    // pupil radius
  const bW   = hrx * 0.34;                     // eyebrow half-width
  const nY   = foreheadY + faceH * 0.60;       // nose y
  const nW   = hrx * 0.11;                     // nose dot offset
  const nR   = hrx * 0.075;                    // nose dot radius
  const mY   = foreheadY + faceH * 0.82;       // mouth y
  const mR   = hrx * 0.30;                     // mouth arc radius

  ctx.save();

  // 1. Face oval
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(70,30,5,0.16)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // 2. Blush cheeks
  ctx.fillStyle = 'rgba(255,110,110,0.28)';
  ctx.beginPath(); ctx.ellipse(cx - hrx * 0.68, foreheadY + faceH * 0.52, hrx * 0.22, hry * 0.12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + hrx * 0.68, foreheadY + faceH * 0.52, hrx * 0.22, hry * 0.12, 0, 0, Math.PI * 2); ctx.fill();

  // 3. Eyebrows
  ctx.strokeStyle = hairC;
  ctx.lineWidth = Math.max(0.7, hrx * 0.09);
  ctx.lineCap = 'round';
  switch (expr) {
    case 'e3':
      ctx.beginPath(); ctx.moveTo(LX - bW, BY - hry*0.05); ctx.lineTo(LX + bW, BY + hry*0.04); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(RX + bW, BY - hry*0.05); ctx.lineTo(RX - bW, BY + hry*0.04); ctx.stroke();
      break;
    case 'e2':
      ctx.beginPath(); ctx.moveTo(LX - bW, BY + hry*0.04); ctx.lineTo(LX + bW, BY - hry*0.05); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(RX - bW, BY - hry*0.05); ctx.lineTo(RX + bW, BY + hry*0.04); ctx.stroke();
      break;
    case 'e4':
      ctx.beginPath(); ctx.moveTo(LX - bW, BY - hry*0.07); ctx.lineTo(LX + bW, BY - hry*0.07); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(RX - bW, BY - hry*0.07); ctx.lineTo(RX + bW, BY - hry*0.07); ctx.stroke();
      break;
    default:
      ctx.beginPath(); ctx.moveTo(LX - bW, BY); ctx.quadraticCurveTo(LX, BY - hry*0.10, LX + bW, BY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(RX - bW, BY); ctx.quadraticCurveTo(RX, BY - hry*0.10, RX + bW, BY); ctx.stroke();
  }

  // 4. Eyes — whites
  ctx.fillStyle = 'white';
  ctx.beginPath(); ctx.ellipse(LX, EY, eRx, eRy, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(RX, EY, eRx, eRy, 0, 0, Math.PI * 2); ctx.fill();

  // Eyelid overlays
  if (expr === 'e1') {
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.ellipse(LX, EY - eRy*0.55, eRx, eRy*0.65, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(RX, EY - eRy*0.55, eRx, eRy*0.65, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (expr === 'e2') {
    ctx.fillStyle = skin;
    ctx.save(); ctx.translate(LX, EY); ctx.rotate(-0.25);
    ctx.beginPath(); ctx.ellipse(0, -eRy*0.55, eRx, eRy*0.65, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(RX, EY); ctx.rotate(0.25);
    ctx.beginPath(); ctx.ellipse(0, -eRy*0.55, eRx, eRy*0.65, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  // Iris
  ctx.fillStyle = '#5A3010';
  ctx.beginPath(); ctx.arc(LX, EY + eRy*0.15, iR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(RX, EY + eRy*0.15, iR, 0, Math.PI * 2); ctx.fill();

  // Pupil
  ctx.fillStyle = '#130800';
  ctx.beginPath(); ctx.arc(LX, EY + eRy*0.15, pR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(RX, EY + eRy*0.15, pR, 0, Math.PI * 2); ctx.fill();

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath(); ctx.arc(LX + iR*0.4, EY - eRy*0.2, pR*0.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(RX + iR*0.4, EY - eRy*0.2, pR*0.6, 0, Math.PI * 2); ctx.fill();

  // Eye outline
  ctx.strokeStyle = 'rgba(30,10,0,0.65)';
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.ellipse(LX, EY, eRx, eRy, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(RX, EY, eRx, eRy, 0, 0, Math.PI * 2); ctx.stroke();

  // 5. Nose
  ctx.fillStyle = 'rgba(70,30,5,0.35)';
  ctx.beginPath(); ctx.arc(cx - nW, nY, nR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + nW, nY, nR, 0, Math.PI * 2); ctx.fill();

  // 6. Mouth
  ctx.strokeStyle = 'rgba(80,28,8,0.82)';
  ctx.fillStyle   = 'rgba(80,28,8,0.78)';
  ctx.lineWidth   = Math.max(0.7, hrx * 0.09);
  ctx.lineCap     = 'round';
  switch (expr) {
    case 'e0':
      ctx.beginPath(); ctx.arc(cx, mY - mR*0.5, mR, 0.2, Math.PI - 0.2); ctx.stroke(); break;
    case 'e1':
      ctx.beginPath(); ctx.moveTo(cx - mR, mY); ctx.lineTo(cx + mR, mY); ctx.stroke(); break;
    case 'e2':
      ctx.beginPath(); ctx.arc(cx, mY + mR*0.5, mR, -Math.PI + 0.2, -0.2); ctx.stroke(); break;
    case 'e3':
      ctx.beginPath(); ctx.moveTo(cx - mR, mY + mR*0.2); ctx.lineTo(cx + mR, mY - mR*0.2); ctx.stroke(); break;
    case 'e4':
      ctx.beginPath(); ctx.ellipse(cx, mY, mR*0.5, mR*0.75, 0, 0, Math.PI * 2); ctx.fill(); break;
    default:
      ctx.beginPath(); ctx.arc(cx, mY - mR*0.5, mR, 0.2, Math.PI - 0.2); ctx.stroke();
  }

  ctx.restore();
}

async function renderChar(canvas, char) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 64, 64);
  const g = char.gender || 'female';
  const head = await detectHeadCenter(g);
  await drawLayer(ctx, bodyUrl(g),                            char.skin,        0.70);
  drawFaceCanvas(ctx, char, head);
  await drawLayer(ctx, shoeUrl(char.shoesStyle || 'sh0'),    char.shoesColor,  0.65);
  await drawLayer(ctx, botUrl(char.bottomStyle || 'b0',  g), char.bottomColor, 0.65);
  await drawLayer(ctx, topUrl(char.topStyle    || 't0',  g), char.topColor,    0.65);
  await drawLayer(ctx, hairUrl(char.hairStyle  || 'h0'),     char.hairColor,   0.65);
}

// ── Option lists ───────────────────────────────────────────────────
const HAIR_OPTS = [
  { id:'h0', name:'보브컷',   emoji:'💇' },
  { id:'h1', name:'긴 직모',  emoji:'👱‍♀️' },
  { id:'h2', name:'뱅스',     emoji:'🎀' },
  { id:'h3', name:'포니테일', emoji:'🐴' },
  { id:'h4', name:'땋은 머리',emoji:'🌿' },
  { id:'h5', name:'곱슬 단발',emoji:'🌀' },
  { id:'h6', name:'픽시컷',   emoji:'✂️' },
];
const EYE_OPTS = [
  { id:'e0', name:'기본',  emoji:'😊' },
  { id:'e1', name:'평온',  emoji:'😐' },
  { id:'e2', name:'슬픔',  emoji:'😢' },
  { id:'e3', name:'화남',  emoji:'😠' },
  { id:'e4', name:'놀람',  emoji:'😲' },
];
const FACE_OPTS = [
  { id:'fs0', name:'동그란',  emoji:'🔵' },
  { id:'fs1', name:'갸름한',  emoji:'🥚' },
  { id:'fs2', name:'귀여운',  emoji:'🍑' },
  { id:'fs3', name:'기본형',  emoji:'⬜' },
];
const HAIR_COLORS = [
  '#1A0A00','#3D1C02','#6B3A1F','#8B4513','#C68642',
  '#E8C49A','#FFE4B5','#FFD700','#FF4444','#FF69B4',
  '#9B59B6','#3498DB','#1ABC9C','#2ECC71','#FFFFFF',
];
// ── UI helpers ─────────────────────────────────────────────────────
const OR = '#E8A050';
const BG = '#F5E6C8';

function TabBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', flexDirection:'column', alignItems:'center', gap:3,
      padding:'10px', borderRadius:14,
      border:`3px solid ${active ? '#C07020' : '#C8A870'}`,
      background: active ? OR : BG,
      color: active ? 'white' : '#5A3A1A',
      fontFamily:'var(--font)', fontWeight:800, fontSize:'0.68rem',
      cursor:'pointer', minWidth:60,
    }}>
      <span style={{fontSize:'1.4rem'}}>{icon}</span>{label}
    </button>
  );
}

function StyleCard({ item, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', flexDirection:'column', alignItems:'center', gap:4,
      padding:'10px 8px', borderRadius:14, minWidth:70,
      border:`3px solid ${active ? '#C07020' : '#D4B880'}`,
      background: active ? '#F5D5A0' : '#FFF8EE',
      cursor:'pointer', fontFamily:'var(--font)',
      boxShadow: active ? '0 2px 8px rgba(200,112,32,0.3)' : 'none',
    }}>
      <span style={{fontSize:'1.7rem',lineHeight:1}}>{item.emoji}</span>
      <span style={{fontSize:'0.64rem',fontWeight:700,color:'#5A3A1A',textAlign:'center',lineHeight:1.2}}>
        {item.name}
      </span>
    </button>
  );
}

function Swatch({ color, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      width:34, height:34, borderRadius:8,
      background: color || '#eee',
      border: active ? '3px solid white' : '2px solid rgba(0,0,0,0.18)',
      cursor:'pointer',
      boxShadow: active ? '0 0 0 2.5px #E8A050' : '0 1px 3px rgba(0,0,0,0.15)',
    }}/>
  );
}

function PanelTitle({ children }) {
  return <div style={{fontSize:'0.88rem',fontWeight:800,color:'#5A3A1A',marginBottom:10}}>{children}</div>;
}
function Grid({ children }) {
  return <div style={{display:'flex',flexWrap:'wrap',gap:8}}>{children}</div>;
}
function SwGrid({ children }) {
  return <div style={{display:'flex',flexWrap:'wrap',gap:7}}>{children}</div>;
}

// ── Mini canvas (family preview row) ──────────────────────────────
function MiniCharCanvas({ char, size }) {
  const ref = useRef(null);
  const s   = size || 48;
  useEffect(() => {
    if (!ref.current) return;
    renderChar(ref.current, char || defaultChar()).catch(() => {});
  }, [char]);
  return (
    <canvas ref={ref} width={64} height={64}
      style={{ width:s, height:s, imageRendering:'pixelated', display:'block' }}
    />
  );
}

// ── Main component ────────────────────────────────────────────────
export default function CharDress() {
  const { showPage, currentUser, currentUserRole, studentData, updateStudentData } = useApp();

  const [who,         setWho]         = useState('self');
  const [faceTab,     setFaceTab]     = useState('hair');
  const [loading,     setLoading]     = useState(false);
  const [teacherChar, setTeacherChar] = useState(defaultChar());

  const canvasRef = useRef(null);
  const uid    = currentUser?.id;
  const myData = studentData[uid];

  const getChar = useCallback((w) => ({
    ...defaultChar(), ...(myData?.chars?.[w] || {}),
  }), [myData]);

  const isStu = currentUserRole === 'student';
  const char  = isStu ? getChar(who) : teacherChar;

  useEffect(() => {
    if (!canvasRef.current) return;
    let alive = true;
    setLoading(true);
    renderChar(canvasRef.current, char)
      .then(() => { if (alive) setLoading(false); })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [char]);

  function saveChar(updates) {
    if (!isStu) { setTeacherChar((p) => ({ ...p, ...updates })); return; }
    if (!uid) return;
    const next = { ...char, ...updates };
    updateStudentData(uid, (prev) => ({
      ...prev,
      chars: { ...(prev.chars || {}), [who]: next },
    }));
  }

  const backPage = isStu ? 'home-decor' : 'teacher';
  const userName = isStu ? `${myData?.emoji || '🧒'} ${myData?.name || ''}` : '👩‍🏫 선생님';
  const navItems = [{ label: '◀ 뒤로', onClick: () => showPage(backPage) }];

  function FacePanel() {
    switch (faceTab) {
      case 'faceShape':
        return (<>
          <PanelTitle>🥚 얼굴 모양</PanelTitle>
          <Grid>{FACE_OPTS.map(o => (
            <StyleCard key={o.id} item={o} active={char.faceShape === o.id} onClick={() => saveChar({ faceShape: o.id })} />
          ))}</Grid>
        </>);
      case 'hair':
        return (<>
          <PanelTitle>💇 머리 스타일</PanelTitle>
          <Grid>{HAIR_OPTS.map(o => (
            <StyleCard key={o.id} item={o} active={char.hairStyle === o.id} onClick={() => saveChar({ hairStyle: o.id })} />
          ))}</Grid>
        </>);
      case 'hairColor':
        return (<>
          <PanelTitle>🎨 머리 색상</PanelTitle>
          <SwGrid>{HAIR_COLORS.map(c => (
            <Swatch key={c} color={c} active={char.hairColor === c} onClick={() => saveChar({ hairColor: c })} />
          ))}</SwGrid>
        </>);
      case 'eye':
        return (<>
          <PanelTitle>👁️ 눈 표정</PanelTitle>
          <Grid>{EYE_OPTS.map(o => (
            <StyleCard key={o.id} item={o} active={char.eyeStyle === o.id} onClick={() => saveChar({ eyeStyle: o.id })} />
          ))}</Grid>
        </>);
      case 'skin':
        return (<>
          <PanelTitle>🤚 피부색</PanelTitle>
          <SwGrid>{SKIN_COLORS.map(c => (
            <Swatch key={c} color={c} active={char.skin === c} onClick={() => saveChar({ skin: c })} />
          ))}</SwGrid>
        </>);
      default: return null;
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#ffffff' }}>
      <TopNav logo="🎨 캐릭터 꾸미기" menuItems={navItems} userLabel={userName} />

      <div className="app-container" style={{ paddingTop: 16 }}>

        {/* Gender switcher */}
        <div style={{ display:'flex', justifyContent:'center', gap:10, marginBottom:16 }}>
          <div style={{ display:'flex', gap:6, background:'#FFF4E6', borderRadius:14, padding:6, border:'1px solid #F0D8C0' }}>
            {[{ id:'female', label:'👧 여자' }, { id:'male', label:'👦 남자' }].map(({ id, label }) => (
              <button key={id} onClick={() => saveChar({ gender: id })} style={{
                padding:'7px 16px', borderRadius:10,
                border:`3px solid ${char.gender === id ? '#C07020' : 'transparent'}`,
                background: char.gender === id ? OR : 'transparent',
                color: char.gender === id ? 'white' : '#5A3A1A',
                fontFamily:'var(--font)', fontWeight:800, fontSize:'0.9rem', cursor:'pointer',
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* 3-column layout */}
        <div style={{ display:'flex', gap:12, alignItems:'flex-start', justifyContent:'center', flexWrap:'wrap' }}>

          {/* Left tabs */}
          <div style={{
            display:'flex', flexDirection:'column', gap:8,
            background:'#FFF4E6', borderRadius:20, padding:10,
            border:'1px solid #F0D8C0',
          }}>
            <TabBtn active={faceTab==='faceShape'} onClick={() => setFaceTab('faceShape')} icon="🥚" label="얼굴 모양"/>
            <TabBtn active={faceTab==='skin'}      onClick={() => setFaceTab('skin')}      icon="🤚" label="피부색"/>
            <TabBtn active={faceTab==='eye'}       onClick={() => setFaceTab('eye')}       icon="👁️" label="눈 표정"/>
            <TabBtn active={faceTab==='hair'}      onClick={() => setFaceTab('hair')}      icon="💇" label="머리 스타일"/>
            <TabBtn active={faceTab==='hairColor'} onClick={() => setFaceTab('hairColor')} icon="🎨" label="머리 색상"/>
          </div>

          {/* Center preview */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
            <div style={{
              position:'relative',
              background:'#ffffff',
              borderRadius:24, border:`4px solid ${OR}`,
              padding:'20px 24px 16px',
              boxShadow:'0 6px 24px rgba(0,0,0,0.12)',
            }}>
              {loading && (
                <div style={{
                  position:'absolute', inset:0, display:'flex',
                  alignItems:'center', justifyContent:'center',
                  background:'rgba(255,255,255,0.6)', borderRadius:20,
                  fontSize:'1.8rem', zIndex:2,
                }}>⏳</div>
              )}
              <canvas
                ref={canvasRef}
                width={64}
                height={64}
                style={{ width:192, height:192, imageRendering:'pixelated', display:'block', position:'relative', zIndex:1 }}
              />
            </div>

            <button
              onClick={async () => {
                const big = document.createElement('canvas');
                big.width = 512; big.height = 512;
                const bctx = big.getContext('2d');
                bctx.imageSmoothingEnabled = false;
                await renderChar(canvasRef.current, char);
                bctx.drawImage(canvasRef.current, 0, 0, 64, 64, 0, 0, 512, 512);
                const link = document.createElement('a');
                link.download = `character_${Date.now()}.png`;
                link.href = big.toDataURL('image/png');
                link.click();
              }}
              style={{
                padding:'10px 24px', borderRadius:14,
                border:`3px solid #C07020`,
                background: OR, color:'white',
                fontFamily:'var(--font)', fontWeight:800, fontSize:'0.9rem',
                cursor:'pointer', boxShadow:'0 3px 10px rgba(200,112,32,0.35)',
              }}
            >
              💾 이미지로 저장
            </button>

            {isStu && (
              <div style={{ display:'flex', gap:8 }}>
                {[{ id:'self', label:'나' }, { id:'friend1', label:'친구 1' }, { id:'friend2', label:'친구 2' }].map(({ id, label }) => (
                  <button key={id} onClick={() => setWho(id)} style={{
                    padding:'6px 14px', borderRadius:12,
                    border:`3px solid ${who === id ? '#C07020' : '#C8A870'}`,
                    background: who === id ? OR : BG,
                    color: who === id ? 'white' : '#5A3A1A',
                    fontFamily:'var(--font)', fontWeight:800, fontSize:'0.85rem', cursor:'pointer',
                  }}>{label}</button>
                ))}
              </div>
            )}

            {isStu && (
              <div style={{
                background:'#FFF4E6', borderRadius:16,
                padding:'10px 16px', display:'flex', gap:20, alignItems:'flex-end',
                border:`2px solid ${OR}`,
              }}>
                {[{ id:'self', label:'나' }, { id:'friend1', label:'친구 1' }, { id:'friend2', label:'친구 2' }].map(({ id, label }) => (
                  <div key={id} onClick={() => setWho(id)} style={{
                    textAlign:'center', cursor:'pointer',
                    opacity: who === id ? 1 : 0.55, transition:'opacity 0.2s',
                  }}>
                    <MiniCharCanvas char={getChar(id)} size={48}/>
                    <div style={{ fontSize:'0.65rem', fontWeight:800, color:'#5A3A1A', marginTop:3 }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right options */}
          <div style={{
            background:'#FFF4E6', borderRadius:20,
            padding:14, minWidth:220, maxWidth:300, flex:1,
            border:'1px solid #F0D8C0',
          }}>
            <FacePanel />
          </div>
        </div>
      </div>
    </div>
  );
}

export { MiniCharCanvas };

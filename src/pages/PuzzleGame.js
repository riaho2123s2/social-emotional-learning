import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import TopNav from '../components/TopNav';
import { useApp } from '../context/AppContext';
import {
  COLS, ROWS, TOTAL, PW, PH, TAB, SNAP,
  PRE_PLACED, SESSION_PIECES, PUZZLE_IMAGE,
  getTabDirs, drawPiecePath, rrect,
} from '../lib/puzzleCore';

const BOARD_X = TAB + 18;
const BOARD_Y = TAB + 18;
const BOARD_W = COLS * PW;
const BOARD_H = ROWS * PH;
const CW = BOARD_X + BOARD_W + TAB + 30 + 360;
const CH = Math.max(BOARD_Y + BOARD_H + TAB + 20, 520);

function targetPos(id) {
  return { x: BOARD_X + (id % COLS) * PW, y: BOARD_Y + Math.floor(id / COLS) * PH };
}

export default function PuzzleGame() {
  const { showPage, currentUser, studentData, showToast, updateStudentData } = useApp();
  const uid = currentUser?.id;
  const data = studentData[uid];
  const completed = data?.completed || [];

  const earnedPieces = useMemo(
    () => SESSION_PIECES.filter((_, i) => completed.includes(i + 1)),
    [completed]
  );

  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const piecesRef = useRef([]);
  const renderOrderRef = useRef([]);
  const dragRef = useRef(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const img = new Image();
    img.onload = () => { imgRef.current = img; setImgLoaded(true); };
    img.onerror = () => setImgLoaded(true);
    img.src = PUZZLE_IMAGE;
  }, []);

  // 저장된 퍼즐 위치 복원 (페이지 첫 진입 시 1회)
  useEffect(() => {
    const savedPlaced = data?.chars?.puzzlePlaced || [];
    const ps = Array(TOTAL).fill(null);
    const order = [];
    const sx0 = BOARD_X + BOARD_W + TAB + 30;
    const sx1 = CW - PW - TAB - 15;
    const sy0 = BOARD_Y;
    const sy1 = CH - PH - TAB - 15;

    PRE_PLACED.forEach(id => {
      const tp = targetPos(id);
      ps[id] = { id, x: tp.x, y: tp.y, placed: true };
      order.push(id);
    });

    earnedPieces.forEach(id => {
      if (savedPlaced.includes(id)) {
        const tp = targetPos(id);
        ps[id] = { id, x: tp.x, y: tp.y, placed: true };
      } else {
        const x = sx0 + Math.random() * Math.max(0, sx1 - sx0);
        const y = sy0 + Math.random() * Math.max(0, sy1 - sy0);
        ps[id] = { id, x, y, placed: false };
      }
      order.push(id);
    });

    piecesRef.current = ps;
    renderOrderRef.current = order;
    setTick(t => t + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 섞기 버튼용: 저장 무시하고 전부 랜덤 배치
  const initPieces = useCallback(() => {
    const ps = Array(TOTAL).fill(null);
    const order = [];
    const sx0 = BOARD_X + BOARD_W + TAB + 30;
    const sx1 = CW - PW - TAB - 15;
    const sy0 = BOARD_Y;
    const sy1 = CH - PH - TAB - 15;

    PRE_PLACED.forEach(id => {
      const tp = targetPos(id);
      ps[id] = { id, x: tp.x, y: tp.y, placed: true };
      order.push(id);
    });

    earnedPieces.forEach(id => {
      const x = sx0 + Math.random() * Math.max(0, sx1 - sx0);
      const y = sy0 + Math.random() * Math.max(0, sy1 - sy0);
      ps[id] = { id, x, y, placed: false };
      order.push(id);
    });

    piecesRef.current = ps;
    renderOrderRef.current = order;
    setTick(t => t + 1);
  }, [earnedPieces]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pieces = piecesRef.current;
    const order = renderOrderRef.current;
    const img = imgRef.current;
    const dragId = dragRef.current?.id;

    ctx.clearRect(0, 0, CW, CH);
    ctx.fillStyle = '#2d1f45';
    ctx.fillRect(0, 0, CW, CH);

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    rrect(ctx, BOARD_X + BOARD_W + TAB + 14, 10, CW - (BOARD_X + BOARD_W + TAB + 24), CH - 20, 14);
    ctx.fill();

    ctx.fillStyle = 'rgba(200,180,255,0.15)';
    rrect(ctx, BOARD_X - 10, BOARD_Y - 10, BOARD_W + 20, BOARD_H + 20, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,140,255,0.5)';
    ctx.lineWidth = 2;
    rrect(ctx, BOARD_X - 10, BOARD_Y - 10, BOARD_W + 20, BOARD_H + 20, 14);
    ctx.stroke();

    // 빈 슬롯에 퍼즐 조각 모양(윤곽선)만 표시
    Array.from({ length: TOTAL }, (_, id) => {
      const tp = targetPos(id);
      const isPlaced = pieces[id]?.placed;
      if (isPlaced) return;
      const tabs = getTabDirs(id);
      ctx.save();
      drawPiecePath(ctx, tp.x, tp.y, tabs);
      ctx.fillStyle = 'rgba(180,150,255,0.07)';
      ctx.fill();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = 'rgba(200,170,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });

    ctx.fillStyle = 'rgba(200,170,255,0.6)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('퍼즐 보드', BOARD_X + BOARD_W / 2, BOARD_Y - 14);
    ctx.fillText('내 조각', BOARD_X + BOARD_W + TAB + 14 + (CW - (BOARD_X + BOARD_W + TAB + 24)) / 2, 22);
    ctx.textAlign = 'left';

    const drawPiece = (id) => {
      const p = pieces[id];
      if (!p) return;
      const tabs = getTabDirs(id);
      const isDrag = id === dragId;
      const isPre = PRE_PLACED.includes(id);

      ctx.save();
      if (isDrag) {
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
      }
      drawPiecePath(ctx, p.x, p.y, tabs);
      ctx.clip();
      ctx.shadowColor = 'transparent';

      if (img) {
        ctx.drawImage(img, p.x - (id % COLS) * PW, p.y - Math.floor(id / COLS) * PH, COLS * PW, ROWS * PH);
      } else {
        ctx.fillStyle = `hsl(${(id / TOTAL) * 260 + 200}, 55%, 62%)`;
        ctx.fillRect(p.x - TAB, p.y - TAB, PW + TAB * 2, PH + TAB * 2);
      }
      ctx.restore();

      ctx.save();
      drawPiecePath(ctx, p.x, p.y, tabs);
      ctx.strokeStyle = isPre ? '#FFD700' : p.placed ? '#50c878' : isDrag ? '#fff' : 'rgba(255,255,255,0.45)';
      ctx.lineWidth = (isPre || isDrag) ? 2.5 : p.placed ? 2 : 1.5;
      ctx.stroke();
      ctx.restore();

      if (isPre) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('★', p.x + PW - 13, p.y + 12);
      }
    };

    order.forEach(id => { if (id !== dragId) drawPiece(id); });
    if (dragId !== undefined && dragId !== null) drawPiece(dragId);
  }, [imgLoaded]);

  useEffect(() => { draw(); }, [draw, tick]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (CW / rect.width),
      y: (e.clientY - rect.top) * (CH / rect.height),
    };
  };

  const onMouseDown = useCallback((e) => {
    const { x, y } = getPos(e);
    const pieces = piecesRef.current;
    const order = renderOrderRef.current;
    for (let i = order.length - 1; i >= 0; i--) {
      const id = order[i];
      const p = pieces[id];
      if (!p || PRE_PLACED.includes(id)) continue;
      const tabs = getTabDirs(id);
      const minX = p.x - (tabs.left === 1 ? TAB : 0);
      const maxX = p.x + PW + (tabs.right === 1 ? TAB : 0);
      const minY = p.y - (tabs.top === 1 ? TAB : 0);
      const maxY = p.y + PH + (tabs.bottom === 1 ? TAB : 0);
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
        dragRef.current = { id, offsetX: x - p.x, offsetY: y - p.y };
        piecesRef.current = [...pieces];
        piecesRef.current[id] = { ...p, placed: false };
        renderOrderRef.current = [...order.filter(i2 => i2 !== id), id];
        draw();
        e.preventDefault?.();
        return;
      }
    }
  }, [draw]);

  const onMouseMove = useCallback((e) => {
    if (!dragRef.current) return;
    const { x, y } = getPos(e);
    const { id, offsetX, offsetY } = dragRef.current;
    const ps = piecesRef.current;
    piecesRef.current = [...ps];
    piecesRef.current[id] = { ...ps[id], x: x - offsetX, y: y - offsetY };
    draw();
    e.preventDefault?.();
  }, [draw]);

  const savePuzzle = useCallback(() => {
    const placedIds = piecesRef.current.filter(p => p?.placed).map(p => p.id);
    updateStudentData(uid, (prev) => ({
      ...prev,
      chars: { ...(prev.chars || {}), puzzlePlaced: placedIds },
    }));
  }, [uid, updateStudentData]);

  const onMouseUp = useCallback(() => {
    if (!dragRef.current) return;
    const { id } = dragRef.current;
    dragRef.current = null;
    const ps = piecesRef.current;
    const p = ps[id];
    if (!p) { draw(); return; }
    const tp = targetPos(id);
    const dist = Math.hypot(p.x - tp.x, p.y - tp.y);
    piecesRef.current = [...ps];
    if (dist < SNAP) {
      piecesRef.current[id] = { ...p, x: tp.x, y: tp.y, placed: true };
      const allEarned = [...PRE_PLACED, ...earnedPieces];
      if (allEarned.length === TOTAL && allEarned.every(pid => piecesRef.current[pid]?.placed)) {
        showToast('🎉 마음방울 완성! 정말 대단해요!');
      }
    } else {
      piecesRef.current[id] = { ...p, placed: false };
    }
    draw();
    setTick(t => t + 1);
    savePuzzle();
  }, [draw, earnedPieces, showToast, savePuzzle]);

  const onTouchStart = (e) => {
    const t = e.touches[0];
    onMouseDown({ clientX: t.clientX, clientY: t.clientY, preventDefault: () => e.preventDefault() });
  };
  const onTouchMove = (e) => {
    e.preventDefault();
    const t = e.touches[0];
    onMouseMove({ clientX: t.clientX, clientY: t.clientY, preventDefault: () => {} });
  };
  const onTouchEnd = () => onMouseUp();

  const placedCount = (piecesRef.current || []).filter(p => p?.placed).length;
  const totalAvailable = PRE_PLACED.length + earnedPieces.length;
  const nextSession = SESSION_PIECES.findIndex((_, i) => !completed.includes(i + 1)) + 1;

  const navItems = [
    { label: '🎮 학습', onClick: () => showPage('student') },
    { label: '🛍️ 상점', onClick: () => showPage('shop') },
  ];

  if (!data) return null;

  return (
    <div className="page-student">
      <TopNav logo="🫧 마음방울" menuItems={navItems} userLabel={`${data.emoji} ${data.name}`} />
      <div className="app-container">
        <div style={{ paddingTop: 20 }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div className="card-title" style={{ marginBottom: 4 }}>
                  <span className="emoji">🫧</span> 마음방울 퍼즐
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-soft)' }}>
                  차시 완료 시 조각 획득 ✨ 오른쪽 조각을 왼쪽 보드에 드래그해서 맞춰보세요!
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginLeft: 12 }}>
                <div style={{
                  padding: '5px 12px', borderRadius: 20, fontWeight: 800, fontSize: '0.82rem',
                  background: placedCount === TOTAL ? 'var(--mint-light)' : 'var(--purple-light)',
                  color: placedCount === TOTAL ? '#2a6a4a' : 'var(--purple)',
                }}>
                  {placedCount}/{TOTAL}
                </div>
                {totalAvailable < TOTAL && nextSession > 0 && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--purple)', fontWeight: 700 }}>
                    💡 {nextSession}차시 완료 시 +1조각
                  </div>
                )}
                <button
                  onClick={() => { savePuzzle(); showToast('💾 저장됐어요!'); }}
                  style={{
                    padding: '6px 14px', borderRadius: 12, border: '2px solid var(--mint)',
                    background: 'var(--mint-light)', cursor: 'pointer', fontFamily: 'var(--font)',
                    fontWeight: 700, fontSize: '0.82rem', color: '#2a6a4a',
                  }}
                >
                  💾 저장
                </button>
                <button
                  onClick={initPieces}
                  style={{
                    padding: '6px 14px', borderRadius: 12, border: '2px solid var(--border)',
                    background: 'white', cursor: 'pointer', fontFamily: 'var(--font)',
                    fontWeight: 700, fontSize: '0.82rem',
                  }}
                >
                  🔀 섞기
                </button>
              </div>
            </div>

            {placedCount === TOTAL && (
              <div style={{
                background: 'var(--mint-light)', border: '2px solid var(--mint)', borderRadius: 14,
                padding: '14px 20px', marginBottom: 14, textAlign: 'center',
                fontWeight: 800, color: '#2a6a4a', fontSize: '1.05rem',
              }}>
                🎉 마음방울 퍼즐 완성! 정말 대단해요! 🌟
              </div>
            )}

            <div style={{ overflowX: 'auto', borderRadius: 16, border: '2.5px solid var(--purple)' }}>
              <canvas
                ref={canvasRef}
                width={CW}
                height={CH}
                style={{ display: 'block', width: '100%', cursor: 'grab', touchAction: 'none' }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              />
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-soft)', marginTop: 8, textAlign: 'center' }}>
              🟡 = 힌트 조각 (이동 불가) · 🟢 = 정위치 고정 · 정확한 위치에 가까이 놓으면 자동으로 고정돼요
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

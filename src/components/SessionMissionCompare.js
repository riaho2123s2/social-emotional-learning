import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function SessionMissionCompare({ session, onClose }) {
  const { studentData, getEffectiveMission, updateStudentData } = useApp();
  const [tab, setTab] = useState('mission');
  const [expandedStudent, setExpandedStudent] = useState(null);

  const mData = getEffectiveMission(session);
  const students = Object.entries(studentData).map(([id, d]) => ({ id, ...d }));
  const completedCount = students.filter((s) => s.completed?.includes(session.id)).length;

  const allItemCount = mData.missions.reduce((a, m) => a + m.items.length, 0);

  const groupColors = [
    { bg: '#EEF6FF', border: '#A8C8E8', titleColor: '#3a5a7a' },
    { bg: '#FFF0F5', border: '#FFB3C6', titleColor: '#7a3a4a' },
    { bg: '#F0FFF6', border: '#B5E8D5', titleColor: '#2a5a3a' },
  ];

  function getStudentChecks(s) {
    return s.chars?.missionChecks?.[session.id] || {};
  }
  function getTeacherChecks(s) {
    return s.chars?.teacherChecks?.[session.id] || {};
  }

  function toggleTeacherCheck(studentId, key) {
    updateStudentData(studentId, (prev) => {
      const tc = (prev.chars || {}).teacherChecks || {};
      const sc = tc[session.id] || {};
      return {
        ...prev,
        chars: {
          ...(prev.chars || {}),
          teacherChecks: { ...tc, [session.id]: { ...sc, [key]: !sc[key] } },
        },
      };
    });
  }

  const tabBtn = (active) => ({
    padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.88rem',
    background: active ? 'var(--purple)' : 'var(--border)',
    color: active ? 'white' : 'var(--text-soft)',
    transition: 'all 0.15s',
  });

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 760, width: '96vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div className="modal-title">{session.emoji} {mData.title}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button style={tabBtn(tab === 'mission')} onClick={() => setTab('mission')}>📋 미션 내용</button>
          <button style={tabBtn(tab === 'students')} onClick={() => setTab('students')}>
            👥 학생 현황 ({completedCount}/{students.length}명 완료)
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>

          {/* ── 미션 내용 탭 ── */}
          {tab === 'mission' && (
            <div>
              <div style={{ background: 'var(--purple-light)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: '0.85rem' }}>
                💡 <strong>{session.sport}</strong> 활동과 함께 <strong>{session.skill}</strong>을 키워요!
                <br /><span style={{ color: 'var(--text-soft)' }}>{session.desc} · 최대 {session.pts}포인트</span>
              </div>
              {mData.missions.map((m, mi) => {
                const cls = ['m1', 'm2', 'm3'][mi];
                return (
                  <div key={m.id} className={`mission-box ${cls}`}>
                    <div className="mission-title">{m.title}<span className="mission-pts">⭐ {m.pts}p</span></div>
                    <div className="mission-check-list">
                      {m.items.map((item, ii) => (
                        <div key={ii} className="mission-check-item">
                          <div className="check-circle" />
                          <div className="check-text">{item}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── 학생 현황 탭 ── */}
          {tab === 'students' && (
            <div>
              {students.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-soft)', padding: 32 }}>학생 데이터가 없어요</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* 범례 */}
                  <div style={{ display: 'flex', gap: 16, padding: '8px 12px', background: 'var(--purple-light)', borderRadius: 12, fontSize: '0.82rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700 }}>범례:</span>
                    <span>🟢 학생 체크 (제출 시 저장)</span>
                    <span>🔵 교사 체크 (클릭으로 수정 가능)</span>
                    <span style={{ color: 'var(--text-soft)' }}>— 미제출/미체크</span>
                  </div>

                  {/* 요약 바 */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ padding: '4px 14px', borderRadius: 20, background: '#e6f9f0', color: '#2a8a5a', fontWeight: 700, fontSize: '0.85rem' }}>
                      ✅ 완료 {completedCount}명
                    </div>
                    <div style={{ padding: '4px 14px', borderRadius: 20, background: '#fde8e8', color: '#d44', fontWeight: 700, fontSize: '0.85rem' }}>
                      ❌ 미완료 {students.length - completedCount}명
                    </div>
                  </div>

                  {students.map((s) => {
                    const isCompleted = s.completed?.includes(session.id);
                    const studentChecks = getStudentChecks(s);
                    const teacherChecks = getTeacherChecks(s);
                    const studentCheckedCount = Object.values(studentChecks).filter(Boolean).length;
                    const teacherCheckedCount = Object.values(teacherChecks).filter(Boolean).length;
                    const isExpanded = expandedStudent === s.id;

                    return (
                      <div key={s.id} style={{
                        border: isCompleted ? '2px solid #b5e8d5' : '2px solid var(--border)',
                        borderRadius: 14, background: isCompleted ? '#f6fffc' : 'white', overflow: 'hidden',
                      }}>
                        {/* 학생 헤더 */}
                        <div
                          onClick={() => setExpandedStudent(isExpanded ? null : s.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}
                        >
                          <div style={{ fontSize: '1.4rem' }}>{s.emoji}</div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', flex: 1 }}>{s.name}</div>
                          {/* 학생 체크 요약 */}
                          <div style={{ fontSize: '0.78rem', color: '#2a6a4a', background: '#e6f9f0', padding: '2px 10px', borderRadius: 12 }}>
                            🟢 학생 {studentCheckedCount}/{allItemCount}
                          </div>
                          {/* 교사 체크 요약 */}
                          <div style={{ fontSize: '0.78rem', color: '#2a4a7a', background: '#e6eeff', padding: '2px 10px', borderRadius: 12, margin: '0 4px' }}>
                            🔵 교사 {teacherCheckedCount}/{allItemCount}
                          </div>
                          <div style={{ padding: '3px 10px', borderRadius: 20, background: isCompleted ? '#e6f9f0' : '#fde8e8', color: isCompleted ? '#2a8a5a' : '#d44', fontWeight: 700, fontSize: '0.78rem', marginRight: 6 }}>
                            {isCompleted ? '✅ 완료' : '❌ 미완료'}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-soft)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▼</div>
                        </div>

                        {/* 체크리스트 비교 — 펼쳐진 경우 */}
                        {isExpanded && (
                          <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {mData.missions.map((m, mi) => {
                              const gc = groupColors[mi] || groupColors[0];
                              return (
                                <div key={m.id} style={{ background: gc.bg, borderRadius: 12, overflow: 'hidden', border: `1.5px solid ${gc.border}` }}>
                                  {/* 그룹 헤더 */}
                                  <div style={{ padding: '8px 14px', borderBottom: `1.5px solid ${gc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: gc.titleColor }}>{m.title}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-soft)' }}>⭐ {m.pts}p</span>
                                  </div>

                                  {/* 컬럼 헤더 */}
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px', padding: '6px 14px', background: 'rgba(255,255,255,0.6)', borderBottom: `1px solid ${gc.border}`, fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-soft)', textAlign: 'center' }}>
                                    <span style={{ textAlign: 'left' }}>항목</span>
                                    <span>🟢 학생</span>
                                    <span>🔵 교사</span>
                                  </div>

                                  {/* 항목 rows */}
                                  {m.items.map((item, ii) => {
                                    const key = `${m.id}_${ii}`;
                                    const sByStudent = !!studentChecks[key];
                                    const sByTeacher = !!teacherChecks[key];
                                    const agree = sByStudent === sByTeacher;
                                    return (
                                      <div
                                        key={key}
                                        style={{
                                          display: 'grid', gridTemplateColumns: '1fr 60px 60px',
                                          padding: '8px 14px', alignItems: 'center',
                                          background: !agree ? 'rgba(255,200,100,0.15)' : 'transparent',
                                          borderBottom: ii < m.items.length - 1 ? `1px solid ${gc.border}` : 'none',
                                        }}
                                      >
                                        <span style={{ fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.4, paddingRight: 8 }}>
                                          {!agree && <span title="학생·교사 불일치" style={{ marginRight: 4, fontSize: '0.7rem' }}>⚠️</span>}
                                          {item}
                                        </span>

                                        {/* 학생 체크 (읽기 전용) */}
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                          <div style={{
                                            width: 24, height: 24, borderRadius: 8,
                                            background: sByStudent ? '#2a8a5a' : 'white',
                                            border: sByStudent ? '2px solid #2a8a5a' : '2px solid #ccc',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.75rem', color: 'white',
                                          }}>
                                            {sByStudent ? '✓' : ''}
                                          </div>
                                        </div>

                                        {/* 교사 체크 (클릭 가능) */}
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                          <div
                                            onClick={(e) => { e.stopPropagation(); toggleTeacherCheck(s.id, key); }}
                                            style={{
                                              width: 24, height: 24, borderRadius: 8, cursor: 'pointer',
                                              background: sByTeacher ? '#2a4aaa' : 'white',
                                              border: sByTeacher ? '2px solid #2a4aaa' : '2px dashed #aaa',
                                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                                              fontSize: '0.75rem', color: 'white', transition: 'all 0.15s',
                                            }}
                                            title="클릭하여 교사 체크"
                                          >
                                            {sByTeacher ? '✓' : ''}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

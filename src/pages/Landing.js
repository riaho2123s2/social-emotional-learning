import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export default function Landing() {
  const { showToast, loginUser } = useApp();

  const [screen, setScreen] = useState('pick');
  const [role, setRole] = useState(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPw, setSignupPw] = useState('');
  const [signupPw2, setSignupPw2] = useState('');
  const [signupNum, setSignupNum] = useState('1');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  function pickRole(r) {
    setRole(r);
    setScreen('login');
    setLoginEmail(''); setLoginPw(''); setLoginError('');
    setSignupName(''); setSignupEmail(''); setSignupPw('');
    setSignupPw2(''); setSignupNum('1'); setSignupError(''); setSignupSuccess('');
  }

  function goBack() { setScreen('pick'); setRole(null); }
  function goSignup() {
    setSignupName(''); setSignupEmail(''); setSignupPw('');
    setSignupPw2(''); setSignupNum('1'); setSignupError(''); setSignupSuccess('');
    setScreen('signup');
  }
  function goLogin() { setLoginEmail(''); setLoginPw(''); setLoginError(''); setScreen('login'); }

  async function doLogin() {
    setLoginError('');
    if (!loginEmail || !loginPw) { showToast('이메일과 비밀번호를 입력해주세요! 😊'); return; }
    setLoginLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPw,
    });

    if (error) {
      setLoginError('이메일 또는 비밀번호가 틀렸어요.');
      setLoginLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      setLoginError('계정 정보를 찾을 수 없어요.');
      await supabase.auth.signOut();
      setLoginLoading(false);
      return;
    }

    if (profile.role !== role) {
      setLoginError(`${role === 'teacher' ? '교사' : '학생'} 계정이 아니에요.`);
      await supabase.auth.signOut();
      setLoginLoading(false);
      return;
    }

    if (profile.status === 'pending') {
      showToast('⏳ 아직 선생님의 승인을 기다리는 중이에요!');
      await supabase.auth.signOut();
      setLoginLoading(false);
      return;
    }

    if (profile.status === 'rejected') {
      setLoginError('가입 신청이 거절되었어요. 선생님께 문의해주세요.');
      await supabase.auth.signOut();
      setLoginLoading(false);
      return;
    }

    await loginUser(data.user, profile);
    setLoginLoading(false);
  }

  async function doSignup() {
    setSignupError(''); setSignupSuccess('');
    if (!signupName || !signupEmail || !signupPw) { setSignupError('모든 항목을 입력해주세요!'); return; }
    if (signupPw !== signupPw2) { setSignupError('비밀번호가 일치하지 않아요!'); return; }
    if (signupPw.length < 6) { setSignupError('비밀번호는 6자 이상이어야 해요!'); return; }

    setSignupLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPw,
    });

    if (error) {
      setSignupError(
        error.message.includes('already registered')
          ? '이미 가입된 이메일이에요.'
          : '가입 중 오류가 발생했어요: ' + error.message
      );
      setSignupLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name: signupName,
      email: signupEmail,
      role,
      status: role === 'teacher' ? 'approved' : 'pending',
      student_num: role === 'student' ? parseInt(signupNum) : null,
      emoji: role === 'student' ? '🧒' : '👩‍🏫',
      points: 0,
      completed: [],
      history: [],
      inventory: [],
      home_items: [],
      chars: {},
    });

    if (profileError) {
      setSignupError('프로필 생성 중 오류가 발생했어요. 이미 가입된 계정일 수 있어요.');
      setSignupLoading(false);
      return;
    }

    await supabase.auth.signOut();

    if (role === 'teacher') {
      setSignupSuccess('✅ 교사 계정이 생성되었어요! 로그인해주세요 😊');
      showToast('✅ 교사 계정 생성 완료!');
    } else {
      setSignupSuccess('✅ 회원가입 신청 완료!\n선생님의 승인을 기다려주세요 😊');
      showToast('📨 회원가입 신청 완료! 선생님 승인을 기다려주세요');
    }
    setSignupLoading(false);
  }

  const roleLabel = role === 'teacher' ? '👩‍🏫 교사' : '🧒 학생';
  const roleBadgeClass = role === 'teacher' ? 'role-badge teacher' : 'role-badge student';

  return (
    <div className="page-landing">
      <div className="landing-header">
        <div className="landing-logo">🌱 더불어 PLAY, 다함께 GROW 🌟</div>
        <div className="landing-sub">뉴스포츠 × 사회정서교육 플랫폼</div>
      </div>

      <div className="character-row">
        {['🏐', '🎯', '🏸', '🎳', '🥏'].map((e, i) => (
          <div key={i} className="character">{e}</div>
        ))}
      </div>

      {screen === 'pick' && (
        <div className="role-pick-wrap">
          <p className="role-pick-title">누구로 시작할까요?</p>
          <div className="role-pick-row">
            <button className="role-card role-teacher" onClick={() => pickRole('teacher')}>
              <div className="role-card-icon">👩‍🏫</div>
              <div className="role-card-title">교사</div>
              <div className="role-card-desc">수업을 관리하는<br />선생님이에요</div>
            </button>
            <button className="role-card role-student" onClick={() => pickRole('student')}>
              <div className="role-card-icon">🧒</div>
              <div className="role-card-title">학생</div>
              <div className="role-card-desc">수업에 참여하는<br />학생이에요</div>
            </button>
          </div>
        </div>
      )}

      {screen === 'login' && (
        <div className="login-box">
          <div className={roleBadgeClass}>
            <button className="back-btn" onClick={goBack}>← 뒤로</button>
            <span>{roleLabel} 로그인</span>
          </div>
          <div className="form-group">
            <label className="form-label">이메일</label>
            <input type="email" className="form-input" placeholder="이메일을 입력하세요"
              value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <input type="password" className="form-input" placeholder="비밀번호를 입력하세요"
              value={loginPw} onChange={(e) => setLoginPw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doLogin()} />
          </div>
          <button className="btn-primary" onClick={doLogin} disabled={loginLoading}>
            {loginLoading ? '로그인 중...' : '🚀 로그인하기'}
          </button>
          {loginError && (
            <div style={{ marginTop: 10, color: '#e55', fontSize: '0.85rem', textAlign: 'center' }}>
              {loginError}
            </div>
          )}
          <div className="switch-link">
            계정이 없으신가요?{' '}
            <button onClick={goSignup} style={{ background: 'none', border: 'none', color: 'var(--purple)',
              fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 'inherit', padding: 0 }}>
              회원가입하기
            </button>
          </div>
        </div>
      )}

      {screen === 'signup' && (
        <div className="login-box">
          <div className={roleBadgeClass}>
            <button className="back-btn" onClick={goLogin}>← 뒤로</button>
            <span>{roleLabel} 회원가입</span>
          </div>
          <div className="form-group">
            <label className="form-label">이름</label>
            <input type="text" className="form-input" placeholder="이름을 입력하세요"
              value={signupName} onChange={(e) => setSignupName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">이메일</label>
            <input type="email" className="form-input" placeholder="이메일을 입력하세요"
              value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">비밀번호 (6자 이상)</label>
            <input type="password" className="form-input" placeholder="비밀번호 6자 이상"
              value={signupPw} onChange={(e) => setSignupPw(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">비밀번호 확인</label>
            <input type="password" className="form-input" placeholder="비밀번호를 다시 입력하세요"
              value={signupPw2} onChange={(e) => setSignupPw2(e.target.value)} />
          </div>
          {role === 'student' && (
            <div className="form-group">
              <label className="form-label">학생 번호</label>
              <select className="form-select" value={signupNum} onChange={(e) => setSignupNum(e.target.value)}>
                {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24].map((n) => (
                  <option key={n} value={n}>{n}번</option>
                ))}
              </select>
              <div style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--text-soft)' }}>
                ⚠️ 회원가입 후 선생님의 승인이 필요합니다
              </div>
            </div>
          )}
          <button className="btn-primary" onClick={doSignup} disabled={signupLoading}>
            {signupLoading ? '신청 중...' : '🌟 회원가입 신청'}
          </button>
          {signupError && (
            <div style={{ marginTop: 10, color: '#e55', fontSize: '0.85rem', textAlign: 'center' }}>
              {signupError}
            </div>
          )}
          {signupSuccess && (
            <div style={{ marginTop: 10, background: 'var(--mint-light)', borderRadius: 12,
              padding: 10, fontSize: '0.85rem', textAlign: 'center' }}>
              {signupSuccess}
            </div>
          )}
          <div className="switch-link">
            이미 계정이 있으신가요?{' '}
            <button onClick={goLogin} style={{ background: 'none', border: 'none', color: 'var(--purple)',
              fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 'inherit', padding: 0 }}>
              로그인하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

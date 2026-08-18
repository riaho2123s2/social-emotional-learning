import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

export default function Landing() {
  const { showToast, loginUser } = useApp();

  const [screen, setScreen] = useState('pick');
  const [role, setRole] = useState(null);

  const [loginId, setLoginId] = useState('');
  const [loginPw, setLoginPw] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // 교사 회원가입 전용
  const [signupName, setSignupName] = useState('');
  const [signupId, setSignupId] = useState('');
  const [signupPw, setSignupPw] = useState('');
  const [signupPw2, setSignupPw2] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  function pickRole(r) {
    setRole(r);
    setScreen('login');
    setLoginId(''); setLoginPw(''); setLoginError('');
    setSignupName(''); setSignupId(''); setSignupPw('');
    setSignupPw2(''); setSignupError(''); setSignupSuccess('');
  }

  function goBack() { setScreen('pick'); setRole(null); }
  function goSignup() {
    setSignupName(''); setSignupId(''); setSignupPw('');
    setSignupPw2(''); setSignupError(''); setSignupSuccess('');
    setScreen('signup');
  }
  function goLogin() { setLoginId(''); setLoginPw(''); setLoginError(''); setScreen('login'); }

  async function doLogin() {
    setLoginError('');
    if (!loginId.trim() || !loginPw) {
      showToast('아이디와 비밀번호를 입력해주세요! 😊');
      return;
    }
    setLoginLoading(true);

    if (role === 'student') {
      // 학생: 이름으로 student_num 조회 후 이메일 구성
      const { data: profileData, error: lookupError } = await supabase
        .from('profiles')
        .select('student_num')
        .eq('name', loginId.trim())
        .eq('role', 'student')
        .eq('status', 'approved')
        .single();

      if (lookupError || !profileData) {
        setLoginError('학생 이름을 찾을 수 없어요. 선생님께 문의해주세요.');
        setLoginLoading(false);
        return;
      }

      const email = `s${profileData.student_num}@school.sel`;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: loginPw });

      if (error) {
        setLoginError('비밀번호가 틀렸어요. 선생님께 문의해주세요.');
        setLoginLoading(false);
        return;
      }

      const { data: fullProfile } = await supabase
        .from('profiles').select('*').eq('id', data.user.id).single();
      await loginUser(data.user, fullProfile);

    } else {
      // 교사: 아이디로 이메일 구성 (t_아이디@school.sel)
      const email = `t_${loginId.trim()}@school.sel`;
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: loginPw });

      if (error) {
        setLoginError('아이디 또는 비밀번호가 틀렸어요.');
        setLoginLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles').select('*').eq('id', data.user.id).single();

      if (profileError || !profile) {
        setLoginError('계정 정보를 찾을 수 없어요.');
        await supabase.auth.signOut();
        setLoginLoading(false);
        return;
      }

      await loginUser(data.user, profile);
    }

    setLoginLoading(false);
  }

  async function doSignup() {
    setSignupError(''); setSignupSuccess('');
    if (!signupName.trim() || !signupId.trim() || !signupPw) {
      setSignupError('모든 항목을 입력해주세요!');
      return;
    }
    if (signupPw !== signupPw2) { setSignupError('비밀번호가 일치하지 않아요!'); return; }
    if (signupPw.length < 6) { setSignupError('비밀번호는 6자 이상이어야 해요!'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(signupId.trim())) {
      setSignupError('아이디는 영문, 숫자, _만 사용할 수 있어요.');
      return;
    }

    setSignupLoading(true);
    const email = `t_${signupId.trim()}@school.sel`;

    const { data, error } = await supabase.auth.signUp({ email, password: signupPw });

    if (error) {
      setSignupError(
        error.message.includes('already registered')
          ? '이미 사용 중인 아이디예요.'
          : '가입 중 오류가 발생했어요: ' + error.message
      );
      setSignupLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name: signupName.trim(),
      email,
      role: 'teacher',
      status: 'approved',
      emoji: '👩‍🏫',
      points: 0,
      coins: 0,
      completed: [],
      history: [],
      inventory: [],
      home_items: [],
      chars: {},
    });

    if (profileError) {
      setSignupError('프로필 생성 중 오류가 발생했어요. 이미 사용 중인 아이디일 수 있어요.');
      setSignupLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setSignupSuccess('✅ 교사 계정이 생성되었어요! 로그인해주세요 😊');
    showToast('✅ 교사 계정 생성 완료!');
    setSignupLoading(false);
  }

  const roleLabel = role === 'teacher' ? '👩‍🏫 교사' : '🧒 학생';
  const roleBadgeClass = role === 'teacher' ? 'role-badge teacher' : 'role-badge student';
  const idPlaceholder = role === 'student' ? '이름을 입력하세요' : '아이디를 입력하세요';
  const idLabel = role === 'student' ? '이름' : '아이디';

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
            <label className="form-label">{idLabel}</label>
            <input
              type="text"
              className="form-input"
              placeholder={idPlaceholder}
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <input
              type="password"
              className="form-input"
              placeholder="비밀번호를 입력하세요"
              value={loginPw}
              onChange={(e) => setLoginPw(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doLogin()}
            />
          </div>
          <button className="btn-primary" onClick={doLogin} disabled={loginLoading}>
            {loginLoading ? '로그인 중...' : '🚀 로그인하기'}
          </button>
          {loginError && (
            <div style={{ marginTop: 10, color: '#e55', fontSize: '0.85rem', textAlign: 'center' }}>
              {loginError}
            </div>
          )}
          {role === 'teacher' ? (
            <div className="switch-link">
              계정이 없으신가요?{' '}
              <button onClick={goSignup} style={{ background: 'none', border: 'none', color: 'var(--purple)',
                fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 'inherit', padding: 0 }}>
                회원가입하기
              </button>
            </div>
          ) : (
            <div className="switch-link" style={{ color: 'var(--text-soft)' }}>
              계정이 없다면 선생님께 문의해주세요 😊
            </div>
          )}
        </div>
      )}

      {screen === 'signup' && (
        <div className="login-box">
          <div className={roleBadgeClass}>
            <button className="back-btn" onClick={goLogin}>← 뒤로</button>
            <span>👩‍🏫 교사 회원가입</span>
          </div>
          <div className="form-group">
            <label className="form-label">이름 (표시용)</label>
            <input type="text" className="form-input" placeholder="예: 김다미"
              value={signupName} onChange={(e) => setSignupName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">아이디 (영문·숫자·_)</label>
            <input type="text" className="form-input" placeholder="예: teacher1"
              value={signupId} onChange={(e) => setSignupId(e.target.value)} />
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
          <button className="btn-primary" onClick={doSignup} disabled={signupLoading}>
            {signupLoading ? '가입 중...' : '🌟 교사 계정 만들기'}
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

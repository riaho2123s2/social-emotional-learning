import React from 'react';
import { useApp } from '../context/AppContext';

export default function TopNav({ logo, menuItems = [], userLabel, userPoints }) {
  const { logoutUser } = useApp();

  return (
    <div className="top-nav">
      <div className="nav-logo">{logo}</div>
      <div className="nav-menu">
        {menuItems.map((item, i) => (
          <button key={i} className="nav-item" onClick={item.onClick}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="nav-user">
        <span>{userLabel}</span>
        {userPoints !== undefined && <span className="nav-points">⭐ {userPoints}p</span>}
        <button
          className="nav-item"
          onClick={logoutUser}
          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}

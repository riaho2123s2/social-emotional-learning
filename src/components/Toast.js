import React from 'react';
import { useApp } from '../context/AppContext';

export default function Toast() {
  const { toast, toastVisible } = useApp();
  return <div className={`toast${toastVisible ? ' show' : ''}`}>{toast}</div>;
}

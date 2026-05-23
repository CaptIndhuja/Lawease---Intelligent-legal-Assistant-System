import React, { useEffect, useState } from 'react';
import LeftPanel from './components/LeftPanel';
import ChatPanel from './components/ChatPanel';
//import RightPanel from './components/RightPanel';
export default function App(){
  const [theme,setTheme]=useState(localStorage.getItem('lawease_theme')||'dark');
  useEffect(()=>{ document.documentElement.setAttribute('data-theme',theme); localStorage.setItem('lawease_theme',theme); },[theme]);
  return (
    <div className='app'>
      <div className='left'><LeftPanel onThemeToggle={()=>setTheme(theme==='dark'?'light':'dark')} theme={theme} /></div>
      <div className='main card'><div className='topbar ml-1 mb-1'></div><ChatPanel/></div>

    </div>
  );
}

LawEase - Full Project Scaffold\n\nThis scaffold contains a frontend (Vite + React + Tailwind) and backend (FastAPI) with chat, translate, document upload/extraction (PDF/DOCX), Ollama integration for LLM, export as PDF, summaries, theme toggle and responsive UI.\n\nSee frontend/ and backend/ folders for details.\n


uvicorn main:app --reload --host 127.0.0.1 --port 8000 

import React, { useEffect, useState } from 'react';
export default function RightPanel(){ const [doc,setDoc]=useState(null); useEffect(()=>{ function onDoc(e){ setDoc(e.detail); } window.addEventListener('lawease:document', onDoc); return ()=>window.removeEventListener('lawease:document', onDoc); },[]); return (<div className='card p-4'><h3 className='font-bold'>Document Preview</h3>{doc? <div className='mt-2 text-sm whitespace-pre-wrap' style={{maxHeight:300,overflow:'auto'}}>{doc.text}</div> : <div className='text-sm text-gray-400 mt-2'>No document loaded</div>}<div className='mt-4 text-sm text-gray-400'>Tips: Upload PDF or DOCX from the left panel. Extracted text appears here.</div></div>); }


text-lg font-bold text-purple-300


### Backend
```
cd backend
python -m venv venv
source venv/bin/activate    # on Windows use: venv\\Scripts\\activate
pip install -r requirements.txt
./start.sh
uvicorn main:app --reload --host 127.0.0.1 --port 8000 
```

### Frontend
```
cd frontend
npm install
npm run dev
```
Backend (FastAPI) - Quick Start\n\n1.
 Create venv and install:\n   python -m venv venv\n  
 
  # Windows: venv\\Scripts\\activate\n   
  pip install -r requirements.txt\n\n2.
   Run server:\n   uvicorn main:app --reload --port 8000\n\nEndpoints:\n- POST /chat  { prompt }\n- POST /translate { text, from_lang, to_lang }\n- POST /upload (form file) -> returns extracted text\n\nNotes: Ensure Ollama is running locally if you want model responses.\n
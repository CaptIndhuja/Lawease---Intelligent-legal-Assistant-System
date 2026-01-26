# Lawease---Intelligent-legal-Assistant-System
Designed and developed an AI-powered legal assistance system to summarize, translate, and answer queries from legal documents. Integrated LLMs using FastAPI to deliver accurate, user-friendly responses, enhancing accessibility and efficiency in understanding complex legal information.

LawEase is an AI-powered legal assistance platform designed to simplify complex legal procedures and documents for common users. It provides a conversational interface where users can ask legal questions, upload documents, and receive clear, simplified explanations while maintaining ethical response boundaries.

Unlike traditional legal AI systems that rely on generic cloud-based models, LawEase uses a locally hosted LLM via Ollama, enabling offline execution, enhanced privacy, and controlled responses. This approach improves reliability by restricting non-legal outputs and ensuring sensitive legal data remains on the user’s system.

The frontend is built using React.js and Tailwind CSS for a responsive and intuitive user experience. The backend is developed with FastAPI and Python, handling API requests and AI interactions efficiently. Legal documents are processed using pdfminer and python-docx, enabling structured text extraction and analysis.

Currently, the system focuses on offline processing with non-persistent data handling. Advanced features such as authentication, encryption, and access control are planned as future enhancements.

#FOR BACKEND
cd backend
python -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
pip install -r requirements.txt
./start.sh
uvicorn main:app --reload --host 127.0.0.1 --port 8000

#FOR FRONTEND
cd frontend
npm install
npm run dev



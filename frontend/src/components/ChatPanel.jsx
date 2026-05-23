import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import ReactMarkdown from "react-markdown";

const API_BASE = "http://127.0.0.1:8000";

// Copy icon
const CopyIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

function copyText(text) {
  navigator.clipboard.writeText(text);
}

export default function ChatPanel() {
  const [tab, setTab] = useState("chat");
  const [messages, setMessages] = useState(
    JSON.parse(localStorage.getItem("lawease_current") || "[]")
  );

  const [input, setInput] = useState("");
  const [translateInput, setTranslateInput] = useState("");
  const [fromLang, setFromLang] = useState("English");
  const [toLang, setToLang] = useState("Tamil");

  const msgRef = useRef();

  // Auto-save conversations
  useEffect(() => {
    localStorage.setItem("lawease_current", JSON.stringify(messages));
  }, [messages]);

  // Auto scroll bottom
  useEffect(() => {
    if (msgRef.current) {
      msgRef.current.scrollTop = msgRef.current.scrollHeight;
    }
  }, [messages]);

  // System events
  useEffect(() => {
    async function onNew() {
    setMessages([]);
    setInput("");
    localStorage.removeItem("lawease_current");

    // 🆕 tell backend to clear memory
    await axios.post(`${API_BASE}/reset`);
  }

  async function onClear() {
    setMessages([]);
    setInput("");
    localStorage.removeItem("lawease_current");

    // 🆕 tell backend to clear memory
    await axios.post(`${API_BASE}/reset`);
  }


    function onLoad(e) {
      setMessages(e.detail.messages || []);
    }

    function onDoc(e) {
      const text = e.detail.text;
      if (text) {
        pushMessage("bot", "Extracted document text:\n" + text);
      }
    }

    window.addEventListener("lawease:newchat", onNew);
    window.addEventListener("lawease:clearmessages", onClear);
    window.addEventListener("lawease:loadconv", onLoad);
    window.addEventListener("lawease:document", onDoc);

    return () => {
      window.removeEventListener("lawease:newchat", onNew);
      window.removeEventListener("lawease:clearmessages", onClear);
      window.removeEventListener("lawease:loadconv", onLoad);
      window.removeEventListener("lawease:document", onDoc);
    };
  }, []);

  // Push message
  function pushMessage(from, text) {
    const m = { id: Date.now(), from, text };
    setMessages((prev) => [...prev, m]);
  }

  // Send chat
  async function send() {
    if (!input.trim()) return;

    pushMessage("user", input);
    pushMessage("bot", "Thinking...");

    const userInput = input;
    setInput("");

    try {
      const resp = await axios.post(`${API_BASE}/chat`, {
        prompt: userInput,
      });

      updateLastBotMessage(resp.data.response);
    } catch (e) {
      updateLastBotMessage("[Error] Could not reach server.");
    }
  }

  // Update last bot message
  function updateLastBotMessage(text) {
    setMessages((prev) => {
      const arr = [...prev];
      arr[arr.length - 1] = { id: Date.now(), from: "bot", text };
      return arr;
    });
  }

  // Translate text
  async function translate() {
    if (!translateInput.trim()) return;

    pushMessage("user", `(Translate) ${translateInput}`);
    pushMessage("bot", "Translating...");

    try {
      const resp = await axios.post(`${API_BASE}/translate`, {
        text: translateInput,
        from_lang: fromLang,
        to_lang: toLang,
      });

      updateLastBotMessage(resp.data.translation);
    } catch (e) {
      updateLastBotMessage("[Error] Translation failed.");
    }
  }

  // Save history
    function saveConversation() {
      const history = JSON.parse(localStorage.getItem("lawease_history") || "[]");

      // extract first user message
      const firstUserMsg = messages.find(m => m.from === "user")?.text || "Conversation";

      // generate topic title
      let topic = firstUserMsg.slice(0, 30); // first 30 characters
      topic = topic.replace(/\n/g, " ").trim();

      const entry = {
        title: topic,     // ⭐ Save with topic instead of "Chat X"
        messages,
        created: Date.now(),
      };

      localStorage.setItem(
        "lawease_history",
        JSON.stringify([entry, ...history])
      );

      //alert("Saved as: " + topic);
      window.dispatchEvent(new Event("storage"));
    }

  // Export PDF
function exportPdf() {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = 40;

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.text("LawEase Chat Summary", 40, y);
  y += 30;

  messages.forEach((m) => {
    let user = m.from === "user" ? "You:" : "LawEase:";
    let text = m.text
      .replace(/\*\*(.*?)\*\*/g, "$1")        // remove markdown bold
      .replace(/##/g, "")                     // heading cleanup
      .replace(/[-•]\s*/g, "• ")              // bullet formatting
      .replace(/\*/g, "")                     // remove stray '*'
      .replace(/\n{2,}/g, "\n")               // extra gaps control
      .trim();

    // Heading styling if line starts with heading indicator
    if (text.startsWith("Overview") || text.startsWith("Key") || text.startsWith("Summary")) {
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
    } else {
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(11);
    }

    // USER / BOT label
    doc.setFont("Helvetica", "bold");
    doc.text(user, 40, y);
    y += 14;

    doc.setFont("Helvetica", "normal");

    // Split long content
    const lines = doc.splitTextToSize(text, 520);
    doc.text(lines, 40, y);
    y += lines.length * 16 + 10;

    if (y > 780) {
      doc.addPage();
      y = 40;
    }
  });

  doc.save("LawEase_Chat.pdf");
}

  // Summarizer
  function summarize(level) {
    const promptLevel =
      level === "short"
        ? "Summarize the document in 3–4 lines and list key points."
        : level === "medium"
        ? "Summarize the document in 6–8 lines and list key points."
        : "Give a detailed summary in 10–12 lines with key clauses.";

    pushMessage("user", "Summarize Document");
    pushMessage("bot", "Summarizing...");

    axios
      .post(`${API_BASE}/chat`, {
        prompt: `SUMMARIZE_UPLOADED_DOCUMENT\n${promptLevel}`,
      })
      .then((resp) => updateLastBotMessage(resp.data.response))
      .catch(() => updateLastBotMessage("[Error] Summarize failed."));
  }

  return (
    <div className="card flex-1 flex flex-col">

      {/* TAB SWITCHER */}
      <div className="flex items-center justify-between px-2 mt-0 pb-1">

        <div></div>

        <div className="flex gap-2">
          <button
            onClick={() => setTab("chat")}
            className={
              "px-3 py-1 rounded " +
              (tab === "chat"
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                : "bg-[#1a2340]")
            }
          >
            Chat
          </button>

          <button
            onClick={() => setTab("translate")}
            className={
              "px-3 py-1 rounded " +
              (tab === "translate"
                ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
                : "bg-[#1a2340]")
            }
          >
            Translate
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      <div ref={msgRef} className="messages mt-3">
        {messages.length === 0 && (
          <div className="message bot">
            Hello! I'm LawEase — how can I assist you today?
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={m.from === "user" ? "message user" : "message bot"}
          >
            {/* From badge */}
            <span
              className={
                m.from === "user"
                  ? "msg-label user-label"
                  : "msg-label bot-label"
              }
            >
              {m.from === "user" ? "You" : "LawEase"}
            </span>

            {/* Copy button */}
            <button
              className="copy-btn absolute top-2 right-2 opacity-60 hover:opacity-100 transition"
              onClick={() => copyText(m.text)}
            >
              <CopyIcon />
            </button>

            {/* Markdown */}
            <ReactMarkdown>{m.text || ""}</ReactMarkdown>
          </div>
        ))}
      </div>

    {/* TRANSLATE PANEL */}
{tab === "translate" && (
  <div className="translate-box p-3 mt-4 rounded-xl bg-[#111830] border border-white/10">
    <div className="flex items-center gap-2 flex-wrap">


          {/* From Language */}
          <select
            value={fromLang}
            onChange={(e) => setFromLang(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm bg-[#1a2340] border border-white/10 text-slate-200 min-w-[90px]"
          >
            <option>English</option>
            <option>Tamil</option>
            <option>Hindi</option>
            <option>Kannada</option>
            <option>Spanish</option>
          </select>

          {/* Swap */}
          <button
            onClick={() => {
              const temp = fromLang;
              setFromLang(toLang);
              setToLang(temp);
            }}
            className="text-purple-400 text-xl font-bold hover:text-purple-300"
          >
            ⇆
          </button>

          {/* To Language */}
          <select
            value={toLang}
            onChange={(e) => setToLang(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm bg-[#1a2340] border border-white/10 text-slate-200 min-w-[90px]"
          >
            <option>English</option>
            <option>Tamil</option>
            <option>Hindi</option>
            <option>Kannada</option>
            <option>Spanish</option>
          </select>

          {/* Input Field */}
          <input
            value={translateInput}
            onChange={(e) => setTranslateInput(e.target.value)}
            placeholder="Enter text..."
            className="flex-1 px-4 py-2 rounded-lg text-sm bg-[#1a2340] border border-white/10 text-slate-200 outline-none
                      focus:ring-2 focus:ring-purple-500/50 min-w-[200px]"
          />

          {/* Translate Button */}
          <button
            onClick={translate}
            className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold whitespace-nowrap"
          >
            Translate
          </button>

          {/* Clear Button */}
          <button
            onClick={() => setTranslateInput("")}
            className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold whitespace-nowrap"
          >
            Clear
          </button>
        </div>
      </div>
    )}

{/* CHAT INPUT */}
{tab === "chat" && (
    <div className="chat-input-wrapper input flex items-center gap-3 px-20">

    <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask a legal question..."
          className="
            flex-1
            
            rounded-xl
            border 
            border-[#3b4a6b]
            text-base
            outline-none
            bg-transparent
            placeholder-gray-400
          "
        />
        
    <button onClick={send} className="btn px-3 py-2 text-xs">Send</button>
    <button onClick={() => summarize('short')} className="btn px-3 py-2 text-xs">Summarize</button>
    <button onClick={saveConversation} className="btn px-3 py-2 text-xs">Save</button>
    <button onClick={exportPdf} className="btn px-3 py-2 text-xs">PDF</button>
  </div>
)}
    </div>
  );
}

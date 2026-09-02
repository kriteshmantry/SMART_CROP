import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';
import { 
  Mic, MicOff, Send, Bot, User, Loader2, Volume2, Sprout, 
  Plus, MessageSquare, Trash2, Clock, PanelLeftClose, PanelLeftOpen, Sparkles, Globe 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const DEFAULT_GREETING = {
  role: 'assistant',
  isGreeting: true,
  text: 'Namaste! 🙏 Welcome to **Krushi Sahayak (<ctrl42>କୃଷି ସହାୟକ)**, your official agricultural advisor.\n\n🌾 **Topics You Can Ask Me About**:\n• 💰 **Highest Net Profit Analysis**: *"Which crop gives the highest profit in my district?"*\n• 💧 **Irrigation Advisory & Water Demand**: *"What is the irrigation advice for Groundnut in Ganjam?"*\n• 📈 **Mandi Prices & Market Rates**: *"What are the current mandi prices for Rice and Ragi?"*\n• 🏛️ **Government Farmer Schemes**: *"What benefits can I get under KALIA and PM-KISAN?"*\n• 🧪 **Soil & Fertilizer Guidance**: *"What is the NPK fertilizer ratio and liming recommendation?"*\n• 🛡️ **Pest & Disease Control**: *"How to treat yellow leaf spots in pulses organically?"*\n\nHow can I assist your farm today?'
};

const FarmerChat = ({ isEmbedded = false, isDarkMode: propDarkMode }) => {
  const { t, lang, changeLanguage } = useLanguage();
  
  // LocalStorage Keys for Chat Sessions
  const STORAGE_KEY = 'smartCrop_chat_sessions_v3';
  const ACTIVE_KEY = 'smartCrop_active_session_id_v3';

  // Dark Mode Sync with prop or localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof propDarkMode === 'boolean') return propDarkMode;
    return localStorage.getItem('smartCropTheme') === 'dark';
  });

  useEffect(() => {
    if (typeof propDarkMode === 'boolean') {
      setIsDarkMode(propDarkMode);
    }
  }, [propDarkMode]);

  useEffect(() => {
    const handleThemeChange = () => {
      setIsDarkMode(localStorage.getItem('smartCropTheme') === 'dark');
    };
    window.addEventListener('storage', handleThemeChange);
    return () => window.removeEventListener('storage', handleThemeChange);
  }, []);

  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([DEFAULT_GREETING]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);
  const activeSessionIdRef = useRef(null);

  useEffect(() => {
    activeSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  // Format Date & Time for Chat History Items
  const formatDateTime = (timestamp = Date.now()) => {
    const d = new Date(timestamp);
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const time = d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${day} ${month}, ${time}`;
  };

  // Smart Gist Summarization Generator (ChatGPT / Gemini style)
  const generateChatHeading = (text) => {
    if (!text || !text.trim()) return 'New Advisory Session';
    const lower = text.toLowerCase().trim();

    // 1. Greetings & Small Talk
    if (/^(hello|hi|hey|namaste|good morning|good afternoon|good evening|how are u|how are you|who are you|who r u|namskar)\b/i.test(lower)) {
      return 'Greeting Exchange';
    }

    // 2. Crop Profit & Income
    if (lower.includes('profit') || lower.includes('income') || lower.includes('revenue') || lower.includes('money') || lower.includes('earn')) {
      const cropMatch = lower.match(/(groundnut|rice|paddy|ragi|maize|cotton|sugarcane|mustard|potato|pulses|jute|wheat|urad|moong)/i);
      const cropName = cropMatch ? cropMatch[0].charAt(0).toUpperCase() + cropMatch[0].slice(1) : '';
      return cropName ? `${cropName} Profit Analysis` : 'Crop Net Profit Analysis';
    }

    // 3. Irrigation & Water Demand
    if (lower.includes('water') || lower.includes('irrigation') || lower.includes('drip') || lower.includes('sprinkler') || lower.includes('drainage')) {
      const cropMatch = lower.match(/(groundnut|rice|paddy|ragi|maize|cotton|sugarcane|mustard|potato|pulses|jute|wheat|urad|moong)/i);
      const cropName = cropMatch ? cropMatch[0].charAt(0).toUpperCase() + cropMatch[0].slice(1) : '';
      return cropName ? `${cropName} Irrigation Schedule` : 'Irrigation & Water Advice';
    }

    // 4. Mandi Prices & Market Rates
    if (lower.includes('mandi') || lower.includes('price') || lower.includes('rate') || lower.includes('market') || lower.includes('quintal')) {
      return 'Mandi Prices & Market Trend';
    }

    // 5. Fertilizer & Soil Health
    if (lower.includes('fertilizer') || lower.includes('npk') || lower.includes('soil') || lower.includes('nitrogen') || lower.includes('urea') || lower.includes('dap') || lower.includes('potash')) {
      return 'Soil & Fertilizer Guide';
    }

    // 6. Pest & Disease Control
    if (lower.includes('pest') || lower.includes('disease') || lower.includes('yellow') || lower.includes('insect') || lower.includes('fungus') || lower.includes('leaf') || lower.includes('spot') || lower.includes('spray')) {
      return 'Pest & Disease Control';
    }

    // 7. Government Schemes
    if (lower.includes('scheme') || lower.includes('kalia') || lower.includes('pm-kisan') || lower.includes('pmkisan') || lower.includes('subsidy') || lower.includes('loan') || lower.includes('govt')) {
      return 'KALIA & Farmer Schemes';
    }

    // 8. Weather & Climate
    if (lower.includes('weather') || lower.includes('rain') || lower.includes('temperature') || lower.includes('monsoon')) {
      return 'Weather & Climate Advisory';
    }

    // 9. General Subject Clean Summarizer
    let clean = text.trim()
      .replace(/^(hello|hi|hey|namaste|please|can you|tell me|what is|how to|which is|what are|explain|give me|i want|detail about)\b/gi, '')
      .trim();

    if (!clean) clean = text.trim();

    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    if (clean.length > 28) {
      return clean.slice(0, 26) + '...';
    }
    return clean;
  };

  // Initialize Chat Sessions from LocalStorage
  useEffect(() => {
    let parsedSessions = [];
    try {
      const savedSessions = localStorage.getItem(STORAGE_KEY);
      if (savedSessions) {
        parsedSessions = JSON.parse(savedSessions);
      }
    } catch (err) {
      console.error("Error loading chat history:", err);
    }

    if (!parsedSessions || parsedSessions.length === 0) {
      const newId = 'sess_' + Date.now();
      const initSession = {
        id: newId,
        title: 'New Advisory Session',
        dateStr: formatDateTime(),
        timestamp: Date.now(),
        messages: [DEFAULT_GREETING]
      };
      parsedSessions = [initSession];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedSessions));
      localStorage.setItem(ACTIVE_KEY, newId);
    }

    const savedActiveId = localStorage.getItem(ACTIVE_KEY) || parsedSessions[0].id;
    const activeSess = parsedSessions.find(s => s.id === savedActiveId) || parsedSessions[0];

    setSessions(parsedSessions);
    setCurrentSessionId(activeSess.id);
    activeSessionIdRef.current = activeSess.id;
    setMessages(activeSess.messages || [DEFAULT_GREETING]);
  }, []);

  // Save/Sync Messages to LocalStorage for a specific session ID
  const saveSessionMessages = (targetSessionId, updatedMessages) => {
    if (!targetSessionId) return;

    setSessions(prevSessions => {
      const newSessions = prevSessions.map(sess => {
        if (sess.id === targetSessionId) {
          const firstUserMsg = updatedMessages.find(m => m.role === 'user');
          let newTitle = sess.title;
          if (firstUserMsg && (sess.title === 'New Advisory Session' || !sess.title)) {
            newTitle = generateChatHeading(firstUserMsg.text);
          }

          return {
            ...sess,
            title: newTitle,
            messages: updatedMessages,
            timestamp: Date.now()
          };
        }
        return sess;
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
      return newSessions;
    });
  };

  // Start a Brand New Chat Session (+ New Chat Button)
  const createNewChat = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setPlayingId(null);
    setLoading(false);
    setInputText('');

    const newId = 'sess_' + Date.now();
    const newSession = {
      id: newId,
      title: 'New Advisory Session',
      dateStr: formatDateTime(),
      timestamp: Date.now(),
      messages: [DEFAULT_GREETING]
    };

    setSessions(prev => {
      const updated = [newSession, ...prev];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    setCurrentSessionId(newId);
    activeSessionIdRef.current = newId;
    setMessages([DEFAULT_GREETING]);
    localStorage.setItem(ACTIVE_KEY, newId);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Switch Active Session
  const selectSession = (id) => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setPlayingId(null);
    setLoading(false);
    setInputText('');

    const target = sessions.find(s => s.id === id);
    if (target) {
      setCurrentSessionId(id);
      activeSessionIdRef.current = id;
      setMessages(target.messages || [DEFAULT_GREETING]);
      localStorage.setItem(ACTIVE_KEY, id);
    }
  };

  // Delete a Chat Session (Working Fix)
  const deleteSession = (id, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setPlayingId(null);

    setSessions(prevSessions => {
      const updated = prevSessions.filter(s => s.id !== id);
      
      if (updated.length === 0) {
        const newId = 'sess_' + Date.now();
        const newSession = {
          id: newId,
          title: 'New Advisory Session',
          dateStr: formatDateTime(),
          timestamp: Date.now(),
          messages: [DEFAULT_GREETING]
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify([newSession]));
        localStorage.setItem(ACTIVE_KEY, newId);
        setCurrentSessionId(newId);
        activeSessionIdRef.current = newId;
        setMessages([DEFAULT_GREETING]);
        return [newSession];
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      
      if (activeSessionIdRef.current === id) {
        const nextActive = updated[0];
        setCurrentSessionId(nextActive.id);
        activeSessionIdRef.current = nextActive.id;
        setMessages(nextActive.messages || [DEFAULT_GREETING]);
        localStorage.setItem(ACTIVE_KEY, nextActive.id);
      }

      return updated;
    });
  };

  // Group Sessions by Time Category (Today, Yesterday, Previous 7 Days, Older)
  const groupSessionsByTime = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = todayStart - 6 * 24 * 60 * 60 * 1000;

    const groups = {
      today: [],
      yesterday: [],
      last7Days: [],
      older: []
    };

    sessions.forEach(sess => {
      const t = sess.timestamp || Date.now();
      if (t >= todayStart) {
        groups.today.push(sess);
      } else if (t >= yesterdayStart) {
        groups.yesterday.push(sess);
      } else if (t >= sevenDaysAgo) {
        groups.last7Days.push(sess);
      } else {
        groups.older.push(sess);
      }
    });

    return groups;
  };

  // Web Speech API Cleanup
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleReadAloud = (text, idx) => {
    if (!('speechSynthesis' in window)) {
      alert("Sorry, your browser doesn't support text to speech!");
      return;
    }

    if (playingId === idx) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/[*_#`~]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/•/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    if (lang === 'hi') utterance.lang = 'hi-IN';
    else if (lang === 'or') utterance.lang = 'or-IN';
    else utterance.lang = 'en-IN';

    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);

    setPlayingId(idx);
    window.speechSynthesis.speak(utterance);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Speech Recognition Setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      if (lang === 'hi') recognitionRef.current.lang = 'hi-IN';
      else if (lang === 'or') recognitionRef.current.lang = 'or-IN';
      else recognitionRef.current.lang = 'en-IN';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [lang]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Error starting speech recognition:", err);
      }
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || loading) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
    }

    const activeIdAtStart = activeSessionIdRef.current;
    const userMessage = inputText.trim();
    const updatedUserMessages = [...messages, { role: 'user', text: userMessage }];

    setMessages(updatedUserMessages);
    saveSessionMessages(activeIdAtStart, updatedUserMessages);
    setInputText('');
    setLoading(true);

    const district = localStorage.getItem('smartCropLocation') || 'Cuttack';
    const landArea = parseFloat(localStorage.getItem('smartCropLandArea')) || 2.5;

    try {
      const response = await apiClient.post('/chat', { 
        message: userMessage,
        context: {
          district: district,
          season: 'Kharif',
          area_ha: landArea,
          language: lang
        },
        history: updatedUserMessages
          .filter(m => !m.isGreeting)
          .slice(-10)
          .map(m => ({ role: m.role, text: m.text }))
      });

      const newMsg = { role: 'assistant', text: response.data.reply };
      
      if (activeSessionIdRef.current === activeIdAtStart) {
        setMessages(prev => {
          const updated = [...prev, newMsg];
          saveSessionMessages(activeIdAtStart, updated);
          return updated;
        });
      } else {
        saveSessionMessages(activeIdAtStart, [...updatedUserMessages, newMsg]);
      }

    } catch (error) {
      const errorMsg = { role: 'assistant', text: "Sorry, I'm having trouble connecting to the agricultural advisory server right now. Please try again." };
      if (activeSessionIdRef.current === activeIdAtStart) {
        setMessages(prev => {
          const updated = [...prev, errorMsg];
          saveSessionMessages(activeIdAtStart, updated);
          return updated;
        });
      } else {
        saveSessionMessages(activeIdAtStart, [...updatedUserMessages, errorMsg]);
      }
    } finally {
      setLoading(false);
    }
  };

  const groupedSessions = groupSessionsByTime();

  const renderSessionItem = (sess) => {
    const isActive = sess.id === currentSessionId;
    return (
      <div
        key={sess.id}
        onClick={() => selectSession(sess.id)}
        className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all text-lg ${
          isActive
            ? isDarkMode 
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/50 shadow-xs font-semibold'
              : 'bg-white text-emerald-900 border border-emerald-300 shadow-2xs font-semibold'
            : isDarkMode
              ? 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              : 'text-slate-700 hover:bg-white/80 hover:text-emerald-800'
        }`}
      >
        <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-1">
          <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-500' : isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
          <div className="truncate min-w-0 flex-1">
            <p className="truncate text-lg font-medium leading-snug">{sess.title || 'New Advisory Session'}</p>
            <p className={`text-base mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>{sess.dateStr || formatDateTime(sess.timestamp)}</p>
          </div>
        </div>

        <button
          onClick={(e) => deleteSession(sess.id, e)}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isDarkMode 
              ? 'text-slate-400 hover:text-red-400 hover:bg-slate-700/80' 
              : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
          }`}
          title="Delete chat thread"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div 
      style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
      className={`flex font-sans transition-colors duration-300 overflow-hidden ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'
    } ${isEmbedded ? 'w-full h-full' : 'max-w-5xl mx-auto h-[calc(100dvh-3.5rem)] sm:h-[calc(100vh-4rem)] rounded-2xl shadow-xl border border-gray-200'}`}>
      
      {/* CHATGPT / GEMINI STYLE LEFT SIDEBAR */}
      <aside 
        className={`flex flex-col transition-all duration-300 shrink-0 z-20 ${
          isDarkMode 
            ? 'bg-slate-900 text-slate-100 border-r border-slate-800' 
            : 'bg-slate-50 text-slate-800 border-r border-slate-200'
        } ${isSidebarOpen ? 'w-64 sm:w-72' : 'w-0 hidden'}`}
      >
        {/* New Chat Button */}
        <div className={`p-3 border-b flex items-center justify-between ${
          isDarkMode ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200/80 bg-white/60'
        }`}>
          <button
            onClick={createNewChat}
            className="flex-1 flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl font-bold text-lg sm:text-xl shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Categorized Sessions History List */}
        <div className={`flex-1 overflow-y-auto px-2 py-2 space-y-3 ${isDarkMode ? 'dark-scrollbar' : 'custom-scrollbar'}`}>
          
          {/* Today */}
          {groupedSessions.today.length > 0 && (
            <div>
              <div className={`px-3.5 py-1 text-base font-extrabold uppercase tracking-wider flex items-center space-x-1.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-400'
              }`}>
                <Clock className="h-3 w-3 text-emerald-500" />
                <span>Today</span>
              </div>
              <div className="space-y-1 mt-1">
                {groupedSessions.today.map(renderSessionItem)}
              </div>
            </div>
          )}

          {/* Yesterday */}
          {groupedSessions.yesterday.length > 0 && (
            <div>
              <div className={`px-3.5 py-1 text-base font-extrabold uppercase tracking-wider flex items-center space-x-1.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-400'
              }`}>
                <Clock className="h-3 w-3 text-slate-400" />
                <span>Yesterday</span>
              </div>
              <div className="space-y-1 mt-1">
                {groupedSessions.yesterday.map(renderSessionItem)}
              </div>
            </div>
          )}

          {/* Previous 7 Days */}
          {groupedSessions.last7Days.length > 0 && (
            <div>
              <div className={`px-3.5 py-1 text-base font-extrabold uppercase tracking-wider flex items-center space-x-1.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-400'
              }`}>
                <Clock className="h-3 w-3 text-slate-400" />
                <span>Previous 7 Days</span>
              </div>
              <div className="space-y-1 mt-1">
                {groupedSessions.last7Days.map(renderSessionItem)}
              </div>
            </div>
          )}

          {/* Older */}
          {groupedSessions.older.length > 0 && (
            <div>
              <div className={`px-3.5 py-1 text-base font-extrabold uppercase tracking-wider flex items-center space-x-1.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-400'
              }`}>
                <Clock className="h-3 w-3 text-slate-400" />
                <span>Older</span>
              </div>
              <div className="space-y-1 mt-1">
                {groupedSessions.older.map(renderSessionItem)}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <div className={`flex-1 flex flex-col min-w-0 h-full ${
        isDarkMode ? 'bg-slate-950' : 'bg-gray-50'
      }`}>
        
        {/* Top Chat Bar */}
        <header className={`px-4 py-3 flex items-center justify-between shrink-0 border-b shadow-2xs ${
          isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-gray-200 text-gray-800'
        }`}>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
              title={isSidebarOpen ? "Collapse History" : "Open History"}
            >
              {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </button>

            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-full hidden sm:block ${isDarkMode ? 'bg-emerald-900/60 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                <Sprout className="h-5 w-5" />
              </div>
              <div>
                <h1 className={`text-2xl sm:text-2xl font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                  Krushi Sahayak (କୃଷି ସହାୟକ)
                </h1>
                <p className="text-lg text-emerald-500 font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Official Agricultural Advisory Assistant
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Language Translation Selector */}
            <div className={`flex items-center border rounded-xl px-2.5 py-1 transition-colors ${
              isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-gray-100 border-gray-200 text-gray-800'
            }`}>
              <Globe className={`h-3.5 w-3.5 mr-1 shrink-0 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} />
              <select
                value={lang}
                onChange={(e) => changeLanguage(e.target.value)}
                aria-label="Translate Assistant Chat"
                className={`bg-transparent text-lg font-bold focus:outline-none cursor-pointer border-none pr-1 ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}
              >
                <option value="en" className={isDarkMode ? 'bg-slate-900 text-white' : ''}>English</option>
                <option value="or" className={isDarkMode ? 'bg-slate-900 text-white' : ''}>ଓଡ଼ିଆ</option>
                <option value="hi" className={isDarkMode ? 'bg-slate-900 text-white' : ''}>हिन्दी</option>
              </select>
            </div>

            <button
              onClick={createNewChat}
              className="sm:hidden flex items-center space-x-1 bg-emerald-600 text-white text-lg px-2.5 py-1.5 rounded-lg font-bold shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Chat</span>
            </button>
          </div>
        </header>

        {/* Chat Messages Body */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 ${isDarkMode ? 'dark-scrollbar' : ''}`}>
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isReadingThis = playingId === index;

            return (
              <div
                key={index}
                className={`flex items-start space-x-2 sm:space-x-3 ${
                  isUser ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isUser
                      ? 'bg-green-600 text-white shadow-xs'
                      : 'bg-emerald-700 text-white shadow-xs'
                  }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div className={`flex flex-col max-w-[85%] sm:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3.5 sm:p-4 rounded-2xl text-xl sm:text-2xl leading-relaxed shadow-2xs whitespace-pre-line ${
                      isUser
                        ? 'bg-green-600 text-white font-medium rounded-tr-none'
                        : isDarkMode
                          ? 'bg-slate-900 text-slate-100 border border-slate-800 rounded-tl-none'
                          : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {!isUser && (
                    <button
                      onClick={() => handleReadAloud(msg.text, index)}
                      className={`mt-1.5 flex items-center text-lg px-2.5 py-1 rounded-full border transition-all ${
                        isReadingThis
                          ? 'bg-green-100 border-green-300 text-green-700 animate-pulse font-semibold'
                          : isDarkMode
                            ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                            : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                      }`}
                    >
                      <Volume2 className="h-3.5 w-3.5 mr-1" />
                      {isReadingThis ? 'Reading...' : 'Read aloud'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className={`p-4 rounded-2xl rounded-tl-none border shadow-xs flex items-center space-x-3 ${
                isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-gray-100 text-gray-500'
              }`}>
                <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
                <span className="text-xl font-medium">Fetching agricultural advisory...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className={`p-3 sm:p-4 border-t shrink-0 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 sm:p-3 rounded-full transition-all shrink-0 ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-md'
                  : isDarkMode
                    ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
              title={isListening ? "Stop listening" : "Speak message"}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? "Listening..." : "Type your message or tap the mic..."}
              className={`flex-1 border rounded-full px-4 py-2.5 sm:py-3 text-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />

            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="bg-green-600 text-white p-2.5 sm:p-3 rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default FarmerChat;

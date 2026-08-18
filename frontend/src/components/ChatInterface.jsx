import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Send, 
  Mic, 
  ArrowLeft, 
  AlertTriangle, 
  Trash2, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { ScamAlertBanner, ReportBlockModal } from './TrustSafety';
import api from '../services/api';
import { useAccessibility } from '../context/AccessibilityContext';

export const ChatInterface = ({ user, highContrast = false, onNavigate, onPrepareListing }) => {
  const { t, i18n } = useTranslation();
  const { speechLocale } = useAccessibility();

  // Pre-seed conversation database with localized fallback values
  const [conversations, setConversations] = useState([
    {
      id: '1',
      name: 'Asha Devi',
      role: 'Livelihood Provider',
      avatarBg: 'bg-orange-100 text-terracotta',
      lastMessage: 'Please transfer a ₹3,500 security advance to my GPay...',
      timestamp: '12:35 PM',
      unread: 1,
      messages: [
        { id: 101, sender: 'receiver', text: 'Namaste. I am ready to start cooking for your father tomorrow morning.', time: '12:34 PM' },
        { 
          id: 102, 
          sender: 'receiver', 
          text: 'Please transfer a ₹3,500 security advance to my GPay number 98765-54321 today so I can purchase custom organic groceries.', 
          time: '12:35 PM',
          isScamTriggered: true,
          scamAlertText: "This message requests an advance cash transfer before work has commenced. This violates community safety guidelines."
        }
      ]
    },
    {
      id: '2',
      name: 'Suresh Patel',
      role: 'Livelihood Provider',
      avatarBg: 'bg-teal-100 text-forest',
      lastMessage: 'I will be there by 10 AM tomorrow to help.',
      timestamp: 'Yesterday',
      unread: 0,
      messages: [
        { id: 201, sender: 'sender', text: 'Hi Suresh, is 10 AM good for television setup?', time: 'Yesterday' },
        { id: 202, sender: 'receiver', text: 'I will be there by 10 AM tomorrow to help.', time: 'Yesterday' }
      ]
    },
    {
      id: '3',
      name: 'Sakhi (AI Assistant)',
      role: 'System',
      avatarBg: 'bg-indigo-100 text-indigo-600',
      lastMessage: 'Diwali is coming up in 3 weeks — want me to help you prepare a sweets listing?',
      timestamp: 'Just now',
      unread: 1,
      messages: [
        { 
          id: 301, 
          sender: 'receiver', 
          text: 'Diwali is coming up in 3 weeks — want me to help you prepare a sweets listing?', 
          time: 'Just now',
          isBot: true,
          ctaTitleKey: 'forecast.prepare_my_listing',
          ctaAction: 'prepare_listing'
        }
      ]
    }
  ]);

  const [activeConvId, setActiveConvId] = useState('1');
  const [inputValue, setInputValue] = useState('');
  const [isSakhiTyping, setIsSakhiTyping] = useState(false);
  
  // Voice Recording Mock States
  const [isRecording, setIsRecording] = useState(false);
  const [waveformBars, setWaveformBars] = useState(Array(15).fill(4));
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordInterval = useRef(null);

  // Mobile navigation visibility
  const [showMobileThread, setShowMobileThread] = useState(false);

  // Report Modal state
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Scroll ref for chat feed
  const feedEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (feedEndRef.current) {
      feedEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConvId, conversations]);

  // Voice recording simulation effect
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordInterval.current = setInterval(() => {
        setWaveformBars(Array.from({ length: 15 }, () => Math.floor(Math.random() * 24) + 4));
        setRecordingSeconds((prev) => prev + 1);
      }, 300);
    } else {
      if (recordInterval.current) {
        clearInterval(recordInterval.current);
      }
    }
    return () => {
      if (recordInterval.current) clearInterval(recordInterval.current);
    };
  }, [isRecording]);

  const activeConv = conversations.find(c => c.id === activeConvId);

  const formatTime = () => {
    try {
      return new Date().toLocaleTimeString(i18n.language || 'en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  // Select conversation helper
  const handleSelectConversation = (id) => {
    setActiveConvId(id);
    setShowMobileThread(true);
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  };

  // Text message submission handler
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !activeConvId) return;

    const newMsgText = inputValue;
    setInputValue('');

    const newMsg = {
      id: Date.now(),
      sender: 'sender',
      text: newMsgText,
      time: formatTime()
    };

    setConversations(prev => prev.map(c => {
      if (c.id === activeConvId) {
        return {
          ...c,
          lastMessage: newMsgText,
          timestamp: formatTime(),
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    }));

    // If talking to Sakhi, make real API call
    if (activeConvId === '3') {
      setIsSakhiTyping(true);
      
      api.post('/ai/chat', { message: newMsgText, language: i18n.language })
        .then(({ data }) => {
          const aiReply = {
            id: Date.now() + 1,
            sender: 'receiver',
            text: data.response || "I'm sorry, I couldn't understand that.",
            time: formatTime(),
            isBot: true
          };
          setConversations(prev => prev.map(c => {
            if (c.id === activeConvId) {
              return {
                ...c,
                lastMessage: aiReply.text,
                timestamp: formatTime(),
                messages: [...c.messages, aiReply]
              };
            }
            return c;
          }));
        })
        .catch(err => {
          console.error("Sakhi AI error", err);
          const errorReply = {
            id: Date.now() + 1,
            sender: 'receiver',
            text: "Network issue. Please try again.",
            time: formatTime(),
            isBot: true
          };
          setConversations(prev => prev.map(c => c.id === activeConvId ? {...c, messages: [...c.messages, errorReply]} : c));
        })
        .finally(() => {
          setIsSakhiTyping(false);
        });
      
      return;
    }

    // Trigger mock automatic response after 1.5 seconds for normal users
    setTimeout(() => {
      let replyText = "Alright, let's sync up later.";
      let triggersScam = false;

      if (newMsgText.toLowerCase().includes('cook') || newMsgText.toLowerCase().includes('food')) {
        replyText = "I specialize in low-oil vegetarian meals. Will there be spices available?";
      } else if (newMsgText.toLowerCase().includes('payment') || newMsgText.toLowerCase().includes('pay')) {
        replyText = "Please make the transaction upfront to my UPI number first to secure the slot.";
        triggersScam = true;
      } else {
        replyText = "Perfect, thank you! I have reviewed the details and will stay in touch here.";
      }

      const autoReply = {
        id: Date.now() + 1,
        sender: 'receiver',
        text: replyText,
        time: formatTime(),
        isScamTriggered: triggersScam,
        scamAlertText: triggersScam ? "Suspicious payment request detected in chat bubble. Avoid off-platform advances." : undefined
      };

      setConversations(prev => prev.map(c => {
        if (c.id === activeConvId) {
          return {
            ...c,
            lastMessage: replyText,
            timestamp: formatTime(),
            messages: [...c.messages, autoReply]
          };
        }
        return c;
      }));
    }, 1500);
  };

  // Voice dictation handler
  const handleStartVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice dictation is not supported by your browser.");
      return;
    }

    if (isRecording) return;

    const recognition = new SpeechRecognition();
    recognition.lang = speechLocale || 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsRecording(true);
      window._chatRecognition = recognition;
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setInputValue(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const handleStopVoice = () => {
    if (window._chatRecognition) {
      window._chatRecognition.stop();
    }
    setIsRecording(false);
  };

  const handleClearConversations = () => {
    setConversations([]);
    setActiveConvId(null);
  };

  const handleSpawnMatch = () => {
    const freshId = Date.now().toString();
    const freshConv = {
      id: freshId,
      name: 'Ramesh Kumar',
      role: 'Customer',
      avatarBg: 'bg-emerald-100 text-emerald-800',
      lastMessage: 'Welcome to SilverHands chat!',
      timestamp: formatTime(),
      unread: 1,
      messages: [
        { 
          id: 501, 
          sender: 'receiver', 
          text: 'Welcome to SilverHands chat! I need help with setting up my smart television.', 
          time: formatTime()
        }
      ]
    };
    setConversations([freshConv]);
    setActiveConvId(freshId);
    setShowMobileThread(true);
  };

  const textSecondaryTheme = highContrast ? 'text-gray-300' : 'text-charcoal-light';

  return (
    <div className={`w-full rounded-3xl overflow-hidden border flex h-[calc(100vh-220px)] min-h-[480px] md:h-[620px] ${
      highContrast ? 'border-white bg-black' : 'border-cream-dark bg-white shadow-lg'
    }`}>
      
      {/* ================= LEFT CONVERSATION LIST PANEL ================= */}
      <div className={`w-full md:w-80 shrink-0 border-r flex flex-col ${
        highContrast ? 'border-white bg-black' : 'border-cream-dark/50 bg-white'
      } ${
        showMobileThread ? 'hidden md:flex' : 'flex'
      }`}>
        {/* Header search bar */}
        <div className="p-4 border-b border-cream-dark/20 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold">{t('chat.title')}</h3>
            {conversations.length > 0 && (
              <button 
                onClick={handleClearConversations}
                className="text-xs text-red-500 flex items-center gap-1.5 hover:underline font-semibold"
                title={t('chat.clear')}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('chat.clear')}
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-cream-dark" />
            <input 
              type="text" 
              placeholder={t('chat.search_placeholder')}
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none transition-all ${
                highContrast 
                  ? 'bg-black text-white border border-white focus:border-yellow-400' 
                  : 'bg-cream/40 border border-cream-dark/50 focus:border-terracotta focus:ring-1 focus:ring-terracotta'
              }`}
            />
          </div>
        </div>

        {/* Conversation scroll container */}
        <div className="flex-grow overflow-y-auto divide-y divide-cream-dark/20">
          {conversations.length === 0 ? (
            /* EMPTY CONVERSATIONS STATE */
            <div className="p-8 text-center flex flex-col items-center justify-center h-full gap-4">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                highContrast ? 'bg-white text-black' : 'bg-orange-50 text-terracotta'
              }`}>
                <MessageSquare className="h-8 w-8" />
              </div>
              <div>
                <h4 className="font-bold text-sm">{t('chat.no_messages_title')}</h4>
                <p className={`text-xs ${textSecondaryTheme} mt-1 leading-relaxed`}>
                  {t('chat.no_messages_desc')}
                </p>
              </div>
              <button
                onClick={handleSpawnMatch}
                className={`w-full flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl text-xs font-bold transition-all ${
                  highContrast 
                    ? 'border border-white bg-black hover:bg-white hover:text-black text-white' 
                    : 'bg-terracotta hover:bg-terracotta-hover text-white shadow-sm'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                {t('chat.simulate_new_match')}
              </button>
            </div>
          ) : (
            /* CONVERSATION LIST ITEMS */
            conversations.map((c) => {
              const isActive = c.id === activeConvId;
              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectConversation(c.id)}
                  className={`w-full p-4 flex gap-3 text-left transition-all relative ${
                    isActive 
                      ? (highContrast ? 'bg-white/20' : 'bg-cream-dark/30')
                      : 'hover:bg-cream-dark/10'
                  }`}
                >
                  <div className={`h-12 w-12 rounded-full shrink-0 flex items-center justify-center font-bold text-base ${c.avatarBg}`}>
                    {c.name[0]}
                  </div>
                  <div className="flex-grow min-w-0 flex flex-col justify-center">
                    <div className="flex items-center justify-between gap-1.5">
                      <h4 className="font-bold text-sm truncate">{c.name}</h4>
                      <span className="text-[10px] text-gray-400 shrink-0 font-medium">{c.timestamp}</span>
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${c.unread ? 'font-bold text-charcoal' : 'text-charcoal-light'}`}>
                      {c.lastMessage}
                    </p>
                  </div>
                  {c.unread > 0 && (
                    <span className={`absolute right-4 bottom-4 h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-terracotta shadow-sm`}>
                      {c.unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ================= RIGHT ACTIVE CHAT WINDOW ================= */}
      <div className={`flex-grow flex flex-col h-full bg-white relative ${
        showMobileThread ? 'flex' : 'hidden md:flex'
      }`}>
        
        {activeConv ? (
          <>
            {/* Header detail */}
            <div className={`p-4 border-b flex items-center gap-3 shrink-0 ${
              highContrast ? 'border-white bg-black text-white' : 'border-cream-dark/30 bg-cream/30'
            }`}>
              <button
                onClick={() => setShowMobileThread(false)}
                className="md:hidden p-1.5 rounded-full hover:bg-cream-dark/30"
                aria-label={t('chat.back_to_conversations')}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${activeConv.avatarBg}`}>
                {activeConv.name[0]}
              </div>
              
              <div className="flex-grow text-left">
                <h4 className="font-bold text-sm leading-tight">{activeConv.name}</h4>
                <span className={`text-[10px] ${textSecondaryTheme}`}>{activeConv.role}</span>
              </div>

              <button
                onClick={() => setIsReportOpen(true)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${
                  highContrast 
                    ? 'border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black' 
                    : 'border-red-200 text-red-600 hover:bg-red-50/50 bg-red-50/20'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {t('chat.report')}
              </button>
            </div>

            {/* Chat Message Scroll Feed */}
            <div className={`flex-grow p-4 overflow-y-auto flex flex-col gap-4 ${
              highContrast ? 'bg-black text-white' : 'bg-cream/10'
            }`}>
              {activeConv.messages.map((msg) => {
                const isSender = msg.sender === 'sender';
                
                return (
                  <div key={msg.id} className="flex flex-col gap-1 w-full">
                    
                    {msg.isScamTriggered && (
                      <div className="mb-2 max-w-[90%] self-start text-left">
                        <ScamAlertBanner 
                          message={msg.scamAlertText}
                          onLearnMore={() => alert(t('safety.scam.alert_title'))}
                          onReport={() => setIsReportOpen(true)}
                          highContrast={highContrast}
                        />
                      </div>
                    )}

                    <div className={`max-w-[75%] p-3 rounded-2xl flex flex-col gap-1 relative text-left shadow-sm ${
                      isSender
                        ? (highContrast ? 'self-end bg-white text-black font-bold' : 'self-end bg-terracotta text-white')
                        : (highContrast ? 'self-start bg-black border border-white text-white' : 'self-start bg-cream-dark/30 text-charcoal')
                    }`}>
                      
                      <div className="flex flex-col gap-2">
                        <p className="text-xs leading-relaxed break-words">{msg.text}</p>
                        {msg.isBot && (msg.ctaTitleKey || msg.ctaTitle) && (
                          <button
                            onClick={() => {
                              if (onPrepareListing) {
                                onPrepareListing();
                              } else {
                                alert("Prepare Listing clicked");
                              }
                            }}
                            className={`w-full px-4 py-2 mt-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                              highContrast 
                                ? 'bg-white text-black hover:bg-yellow-400 border border-black' 
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            {msg.ctaTitleKey ? t(msg.ctaTitleKey) : msg.ctaTitle}
                          </button>
                        )}
                      </div>

                      <span className={`text-[9px] self-end mt-0.5 ${
                        isSender 
                          ? (highContrast ? 'text-black/60' : 'text-white/70') 
                          : 'text-charcoal-light'
                      }`}>
                        {msg.time}
                      </span>
                    </div>

                  </div>
                );
              })}
              {activeConvId === '3' && isSakhiTyping && (
                <div className="flex flex-col gap-1 w-full">
                  <div className={`max-w-[75%] p-4 rounded-2xl self-start flex items-center gap-1 shadow-sm ${
                    highContrast ? 'bg-black border border-white' : 'bg-cream-dark/30'
                  }`}>
                    <div className="flex space-x-1.5">
                      <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={feedEndRef} />
            </div>

            {/* In-chat Input Bar */}
            <div className={`p-4 border-t ${
              highContrast ? 'border-white bg-black' : 'border-cream-dark/30 bg-white'
            }`}>
              
              {isRecording ? (
                <div className="flex items-center justify-between gap-4 h-12 bg-red-50/50 border border-red-100 rounded-2xl px-4 animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-600 animate-ping"></span>
                    <span className="text-xs font-bold text-red-600">{t('chat.recording_voice')} ({recordingSeconds}s)</span>
                  </div>

                  <div className="flex items-center gap-0.5 h-6">
                    {waveformBars.map((val, idx) => (
                      <span 
                        key={idx}
                        style={{ height: `${val}px` }}
                        className="w-1 rounded bg-red-500 transition-all duration-300"
                      />
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleStopVoice();
                        setInputValue('');
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-charcoal hover:bg-cream-dark/30 rounded-lg"
                    >
                      {t('chat.cancel')}
                    </button>
                    <button
                      onClick={() => {
                        handleStopVoice();
                        handleSendMessage();
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      {t('chat.send_message')}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleStartVoice}
                    className={`p-3 rounded-xl border flex items-center justify-center transition-all ${
                      highContrast 
                        ? 'border-white hover:bg-white hover:text-black text-white' 
                        : 'border-cream-dark hover:bg-cream-dark/30 text-charcoal-light bg-cream/20'
                    }`}
                    title={t('chat.recording_voice')}
                  >
                    <Mic className="h-5 w-5" />
                  </button>

                  <input
                    type="text"
                    placeholder={t('chat.type_placeholder')}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className={`flex-grow p-3 rounded-xl border text-xs focus:outline-none transition-all ${
                      highContrast 
                        ? 'bg-black text-white border-white focus:border-yellow-400' 
                        : 'bg-white border-cream-dark focus:border-terracotta focus:ring-1 focus:ring-terracotta'
                    }`}
                  />

                  <button
                    type="submit"
                    className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                      highContrast
                        ? 'bg-white text-black border border-black hover:bg-yellow-400'
                        : 'bg-terracotta hover:bg-terracotta-hover text-white shadow-sm'
                    }`}
                    title={t('chat.send')}
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              )}

            </div>

            <ReportBlockModal 
              isOpen={isReportOpen}
              onClose={() => setIsReportOpen(false)}
              onSubmit={(report) => {
                setConversations(prev => prev.filter(c => c.id !== activeConvId));
                setActiveConvId(null);
                setShowMobileThread(false);
              }}
              targetName={activeConv.name}
              highContrast={highContrast}
            />
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center p-8 text-center bg-cream/10">
            <MessageSquare className="h-16 w-16 text-cream-dark/50 mb-3" />
            <h4 className="font-bold text-sm">{t('chat.select_conversation_title')}</h4>
            <p className={`text-xs mt-1 max-w-xs ${textSecondaryTheme}`}>
              {t('chat.select_conversation_desc')}
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

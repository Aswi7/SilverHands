import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Send, 
  Mic, 
  ArrowLeft, 
  ShieldAlert, 
  AlertTriangle, 
  Trash2, 
  MessageSquare,
  Sparkles,
  Volume2
} from 'lucide-react';
import { ScamAlertBanner, ReportBlockModal } from './TrustSafety';
import api from '../services/api';
import { useAccessibility } from '../context/AccessibilityContext';

export const ChatInterface = ({ user, highContrast = false, onNavigate, onPrepareListing }) => {
  // Pre-seed conversation database
  const [conversations, setConversations] = useState([]);
  
  useEffect(() => {
    if (user?._id) {
      api.get(`/applications/user/${user._id}`).then(res => {
        const apps = res.data || [];
        // Group applications by the other user to create a single chat thread per pair
        const userThreads = {};
        apps.forEach(app => {
          const isEmployer = user.role === 'employer' || user.userType === 'employer';
          const otherUser = isEmployer ? app.providerId : app.employerId;
          
          if (!otherUser || !otherUser._id) return;
          
          const otherId = otherUser._id;
          
          if (!userThreads[otherId]) {
            userThreads[otherId] = {
              id: otherId,
              name: otherUser.name || 'EMPLOYER',
              role: isEmployer ? 'Provider' : 'Employer',
              avatarBg: 'bg-teal-100 text-forest',
              lastMessage: `Application status: ${app.status}`,
              timestamp: new Date(app.updatedAt || app.createdAt).toLocaleDateString(),
              unread: 0,
              applicationId: app._id,
              messages: []
            };
          }
          
          // Add a system message for this application update
          userThreads[otherId].messages.push({
            id: app._id,
            sender: 'receiver',
            text: `System: Applied for ${app.opportunityId?.title || 'Gig'} (${app.status})`,
            time: new Date(app.createdAt).toLocaleTimeString(),
            isBot: true
          });
        });

        const mappedConvs = Object.values(userThreads);
        
        const mockBot = {
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
              ctaTitle: 'Prepare My Listing',
              ctaAction: 'prepare_listing'
            }
          ]
        };
        
        setConversations([mockBot, ...mappedConvs]);
      }).catch(err => console.error(err));
    }
  }, [user]);

  const [activeConvId, setActiveConvId] = useState('1');
  const [inputValue, setInputValue] = useState('');
  const [isSakhiTyping, setIsSakhiTyping] = useState(false);
  const { speechLocale } = useAccessibility();
  
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
        // Random heights for waveform representation
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

  // Select conversation helper
  const handleSelectConversation = (id) => {
    setActiveConvId(id);
    setShowMobileThread(true);
    // Mark as read
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  };

  // Text message submission handler
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !activeConvId) return;

    const newMsgText = inputValue;
    setInputValue('');

    // Scam simulation: if user types "advance", "payment", or "upi" in mock receiver responses, let's flag it
    const containsSuspicious = /advance|payment|upi|gpay|paytm/i.test(newMsgText);

    const newMsg = {
      id: Date.now(),
      sender: 'sender',
      text: newMsgText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversations(prev => prev.map(c => {
      if (c.id === activeConvId) {
        return {
          ...c,
          lastMessage: newMsgText,
          timestamp: 'Just now',
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    }));

    // If talking to Sakhi, make real API call
    if (activeConvId === '3') {
      setIsSakhiTyping(true);
      
      api.post('/ai/chat', { message: newMsgText })
        .then(({ data }) => {
          const aiReply = {
            id: Date.now() + 1,
            sender: 'receiver',
            text: data.response || "I'm sorry, I couldn't understand that.",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isBot: true
          };
          setConversations(prev => prev.map(c => {
            if (c.id === activeConvId) {
              return {
                ...c,
                lastMessage: aiReply.text,
                timestamp: 'Just now',
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
            text: "Oops, I'm having trouble connecting to the network right now.",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isBot: true
          };
          setConversations(prev => prev.map(c => c.id === activeConvId ? {...c, messages: [...c.messages, errorReply]} : c));
        })
        .finally(() => {
          setIsSakhiTyping(false);
        });
      
      return; // Skip the mock response below
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
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isScamTriggered: triggersScam,
        scamAlertText: triggersScam ? "Suspicious payment request detected in chat bubble. Avoid off-platform advances." : undefined
      };

      setConversations(prev => prev.map(c => {
        if (c.id === activeConvId) {
          return {
            ...c,
            lastMessage: replyText,
            timestamp: 'Just now',
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

  // Clear/Reset conversations (Empty state demo)
  const handleClearConversations = () => {
    setConversations([]);
    setActiveConvId(null);
  };

  // Spawn new match (Empty state demo recover)
  const handleSpawnMatch = () => {
    const freshId = Date.now().toString();
    const freshConv = {
      id: freshId,
      name: 'Ramesh Kumar (Employer)',
      role: 'Customer',
      avatarBg: 'bg-emerald-100 text-emerald-800',
      lastMessage: 'Welcome to SilverHands chat! I need help with cooking.',
      timestamp: 'Just now',
      unread: 1,
      messages: [
        { 
          id: 501, 
          sender: 'receiver', 
          text: 'Welcome to SilverHands chat! I need help with setting up my smart television.', 
          time: 'Just now' 
        }
      ]
    };
    setConversations([freshConv]);
    setActiveConvId(freshId);
    setShowMobileThread(true);
  };

  // Formatting helpers
  const bgTheme = highContrast ? 'bg-black text-white' : 'bg-cream text-charcoal';
  const cardTheme = highContrast ? 'border-2 border-white bg-black' : 'bg-white border border-cream-dark/50 shadow-sm';
  const textSecondaryTheme = highContrast ? 'text-gray-300' : 'text-charcoal-light';

  return (
    <div className={`w-full rounded-3xl overflow-hidden border flex h-[620px] ${
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
            <h3 className="font-serif text-lg font-bold">Secure Messages</h3>
            {conversations.length > 0 && (
              <button 
                onClick={handleClearConversations}
                className="text-xs text-red-500 flex items-center gap-1.5 hover:underline font-semibold"
                title="Simulate empty state"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-cream-dark" />
            <input 
              type="text" 
              placeholder="Search chats..."
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
                <h4 className="font-bold text-sm">No Messages Yet</h4>
                <p className={`text-xs ${textSecondaryTheme} mt-1 leading-relaxed`}>
                  You will receive secure match conversations once a neighbor accepts your gig.
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
                Simulate New Match
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
          /* ACTIVE CHAT CONTENT CONTAINER */
          <>
            {/* Header detail */}
            <div className={`p-4 border-b flex items-center gap-3 shrink-0 ${
              highContrast ? 'border-white bg-black text-white' : 'border-cream-dark/30 bg-cream/30'
            }`}>
              {/* Mobile Back Button */}
              <button
                onClick={() => setShowMobileThread(false)}
                className="md:hidden p-1.5 rounded-full hover:bg-cream-dark/30"
                aria-label="Back to conversations"
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

              {/* Report button */}
              <button
                onClick={() => setIsReportOpen(true)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${
                  highContrast 
                    ? 'border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black' 
                    : 'border-red-200 text-red-600 hover:bg-red-50/50 bg-red-50/20'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                Report
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
                    
                    {/* Inline AI Scam Alert Banner (shown inline above relevant receiver message bubble) */}
                    {msg.isScamTriggered && (
                      <div className="mb-2 max-w-[90%] self-start text-left">
                        <ScamAlertBanner 
                          message={msg.scamAlertText}
                          onLearnMore={() => alert("Scam Guards analyze keywords like payment/advances/UPI and show warning banners immediately to protect you from fraud.")}
                          onReport={() => setIsReportOpen(true)}
                          highContrast={highContrast}
                        />
                      </div>
                    )}

                    {/* Chat message bubble */}
                    <div className={`max-w-[75%] p-3 rounded-2xl flex flex-col gap-1 relative text-left shadow-sm ${
                      isSender
                        ? (highContrast ? 'self-end bg-white text-black font-bold' : 'self-end bg-terracotta text-white')
                        : (highContrast ? 'self-start bg-black border border-white text-white' : 'self-start bg-cream-dark/30 text-charcoal')
                    }`}>
                      
                      {/* Text content or Voice player mockup */}
                      {msg.isVoice ? (
                        <div className="flex items-center gap-2">
                          <button 
                            className={`p-1.5 rounded-full ${
                              isSender ? 'bg-white/20 text-white' : 'bg-forest/10 text-forest'
                            }`}
                            onClick={() => alert(`Playing voice message recording: ${msg.duration} seconds`)}
                          >
                            <Volume2 className="h-4 w-4" />
                          </button>
                          <span className="text-xs font-bold">{msg.text}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <p className="text-xs leading-relaxed break-words">{msg.text}</p>
                          {msg.isBot && msg.ctaTitle && (
                            <button
                              onClick={() => {
                                if (onPrepareListing) {
                                  onPrepareListing();
                                } else {
                                  alert(`CTA Clicked: ${msg.ctaAction} (Will open Module 7)`);
                                }
                              }}
                              className={`w-full px-4 py-2 mt-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                                highContrast 
                                  ? 'bg-white text-black hover:bg-yellow-400 border border-black' 
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                              }`}
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              {msg.ctaTitle}
                            </button>
                          )}
                        </div>
                      )}

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
                /* VOICE RECORDING WAVEFORM STATE */
                <div className="flex items-center justify-between gap-4 h-12 bg-red-50/50 border border-red-100 rounded-2xl px-4 animate-pulse">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-600 animate-ping"></span>
                    <span className="text-xs font-bold text-red-600">Recording Voice ({recordingSeconds}s)</span>
                  </div>

                  {/* Waveform indicator */}
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
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        handleStopVoice();
                        handleSendMessage();
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              ) : (
                /* STANDARD CHAT TEXT INPUT BAR */
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  {/* Microphone voice recorder trigger */}
                  <button
                    type="button"
                    onClick={handleStartVoice}
                    className={`p-3 rounded-xl border flex items-center justify-center transition-all ${
                      highContrast 
                        ? 'border-white hover:bg-white hover:text-black text-white' 
                        : 'border-cream-dark hover:bg-cream-dark/30 text-charcoal-light bg-cream/20'
                    }`}
                    title="Record voice message"
                  >
                    <Mic className="h-5 w-5" />
                  </button>

                  <input
                    type="text"
                    placeholder="Type a message... (try asking about 'payment' to test AI scam alerts)"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className={`flex-grow p-3 rounded-xl border text-xs focus:outline-none transition-all ${
                      highContrast 
                        ? 'bg-black text-white border-white focus:border-yellow-400' 
                        : 'bg-white border-cream-dark focus:border-terracotta focus:ring-1 focus:ring-terracotta'
                    }`}
                  />

                  {/* Submit message trigger */}
                  <button
                    type="submit"
                    className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                      highContrast
                        ? 'bg-white text-black border border-black hover:bg-yellow-400'
                        : 'bg-terracotta hover:bg-terracotta-hover text-white shadow-sm'
                    }`}
                    title="Send message"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              )}

            </div>

            {/* Modal Dialog */}
            <ReportBlockModal 
              isOpen={isReportOpen}
              onClose={() => setIsReportOpen(false)}
              onSubmit={(report) => {
                alert(`Report submitted! You have reported ${activeConv.name} for: "${report.reason}". This user is now blocked.`);
                // Remove conversation to demonstrate block effect
                setConversations(prev => prev.filter(c => c.id !== activeConvId));
                setActiveConvId(null);
                setShowMobileThread(false);
              }}
              targetName={activeConv.name}
              highContrast={highContrast}
            />
          </>
        ) : (
          /* NO CONVERSATION SELECTED EMPTY SCREEN */
          <div className="flex-grow flex flex-col items-center justify-center p-8 text-center bg-cream/10">
            <MessageSquare className="h-16 w-16 text-cream-dark/50 mb-3" />
            <h4 className="font-bold text-sm">Select a Conversation</h4>
            <p className={`text-xs mt-1 max-w-xs ${textSecondaryTheme}`}>
              Select an ongoing thread from the sidebar or click matches to start a secure chat.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  MessageSquare, 
  Clock, 
  User, 
  Check, 
  CheckCheck, 
  Sparkles, 
  RefreshCw, 
  Bot,
  Volume2,
  Mic,
  MicOff
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const SAKHI_CONVERSATION = {
  _id: 'sakhi_ai_assistant',
  isSakhi: true,
  name: 'Sakhi (AI Assistant)',
  role: 'AI Assistant',
  lastMessage: 'I am here to support you! Ask me about pricing or listing tips.',
  lastMessageAt: new Date()
};

const getWelcomeMessages = (lang) => {
  const norm = lang || 'en';
  if (norm === 'ta') {
    return [
      {
        _id: 'sakhi_welcome',
        sender: { name: 'Sakhi (AI Assistant)', role: 'AI Assistant' },
        message: 'வணக்கம்! நான் உங்கள் சக்தி (Sakhi) AI உதவியாளர். இண்டர்நெட் இல்லாமலேயே உங்கள் பகுதி வேலை வாய்ப்புகள், விலை நிர்ணயம் மற்றும் தொழில் ஆலோசனைகளை என்னிடம் கேட்கலாம். இன்று நான் உங்களுக்கு எவ்வாறு உதவலாம்? ✨',
        createdAt: new Date(Date.now() - 60000),
        isSakhi: true
      }
    ];
  }
  if (norm === 'hi') {
    return [
      {
        _id: 'sakhi_welcome',
        sender: { name: 'Sakhi (AI Assistant)', role: 'AI Assistant' },
        message: 'नमस्ते! मैं आपकी सखी (Sakhi) AI व्यावसायिक साथी हूँ। मैं आपको काम खोजने, मूल्य निर्धारण (pricing strategy) और ग्राहकों से बात करने में मदद कर सकती हूँ। आज मैं आपके व्यवसाय में कैसे मदद करूँ? 🤝',
        createdAt: new Date(Date.now() - 60000),
        isSakhi: true
      }
    ];
  }
  return [
    {
      _id: 'sakhi_welcome',
      sender: { name: 'Sakhi (AI Assistant)', role: 'AI Assistant' },
      message: 'Namaste! I am Sakhi, your AI companion on SilverHands. I can help you with gig matching, pricing strategy, customer communication, and seasonal demand forecasts. How can I assist your business today? ✨',
      createdAt: new Date(Date.now() - 60000),
      isSakhi: true
    }
  ];
};

const formatTime = (dateVal) => {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
};

const getInitials = (nameStr) => {
  if (!nameStr || typeof nameStr !== 'string') return 'U';
  const trimmed = nameStr.trim();
  return trimmed.length > 0 ? trimmed[0].toUpperCase() : 'U';
};

const ChatInterface = ({ highContrast, initialMatchId, onSelectConversation, onPrepareListing }) => {
  const { user, updateUserInState } = useAuth();
  const isCustomer = user?.role === 'customer';

  const [conversations, setConversations] = useState(isCustomer ? [] : [SAKHI_CONVERSATION]);
  const [selectedConv, setSelectedConv] = useState(isCustomer ? null : SAKHI_CONVERSATION);
  const [messages, setMessages] = useState([]);
  const [sakhiMessages, setSakhiMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSakhiTyping, setIsSakhiTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  const preferredLanguage = user?.preferredLanguage || 'en';

  const cardTheme = highContrast
    ? 'border-2 border-white bg-black text-white'
    : 'border-cream-dark/50 bg-white text-charcoal shadow-sm';

  const textSecondaryTheme = highContrast ? 'text-gray-300' : 'text-gray-500';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize Sakhi Welcome Messages based on preferred language
  useEffect(() => {
    if (!isCustomer) {
      const welcome = getWelcomeMessages(preferredLanguage);
      setSakhiMessages(welcome);
      if (selectedConv?.isSakhi) {
        setMessages(welcome);
      }
    }
  }, [preferredLanguage, isCustomer, selectedConv?._id]);

  // Fetch all user conversations from MongoDB
  const fetchConversations = async (autoSelectMatchId = null) => {
    try {
      const { data } = await api.get('/chat/conversations');
      const convList = Array.isArray(data) ? data : [];
      const fullList = isCustomer ? convList : [SAKHI_CONVERSATION, ...convList];
      setConversations(fullList);

      if (autoSelectMatchId) {
        const target = convList.find(c => {
          const mId = (c.matchId?._id || c.matchId || c.match?._id || c.match)?.toString();
          return mId === autoSelectMatchId.toString();
        });
        if (target) {
          setSelectedConv(target);
        } else if (convList.length > 0) {
          setSelectedConv(convList[0]);
        }
      } else if (!selectedConv || (isCustomer && selectedConv.isSakhi)) {
        setSelectedConv(isCustomer ? (convList[0] || null) : SAKHI_CONVERSATION);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoadingConvs(false);
    }
  };

  // Auto create or fetch conversation if initialMatchId is passed
  useEffect(() => {
    const initializeChat = async () => {
      if (initialMatchId) {
        try {
          const { data } = await api.post('/chat/conversations', { matchId: initialMatchId });
          if (data && data._id) {
            setSelectedConv(data);
          }
          await fetchConversations(initialMatchId);
        } catch (err) {
          console.error('Failed to auto open conversation:', err);
          await fetchConversations();
        }
      } else {
        await fetchConversations();
      }
    };

    initializeChat();
  }, [initialMatchId]);

  // Fetch messages when selectedConv changes
  const fetchMessages = async (convId) => {
    if (!convId) return;
    if (convId === 'sakhi_ai_assistant') {
      setMessages(sakhiMessages);
      setTimeout(scrollToBottom, 50);
      return;
    }

    setLoadingMsgs(true);
    try {
      const { data } = await api.get(`/chat/conversations/${convId}/messages`);
      setMessages(Array.isArray(data) ? data : []);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoadingMsgs(false);
    }
  };

  useEffect(() => {
    if (selectedConv?._id) {
      fetchMessages(selectedConv._id);
    }
  }, [selectedConv?._id, sakhiMessages]);

  // Polling for user-to-user conversation updates (excluding Sakhi)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
      if (selectedConv?._id && selectedConv._id !== 'sakhi_ai_assistant') {
        api.get(`/chat/conversations/${selectedConv._id}/messages`)
          .then(res => {
            if (Array.isArray(res.data)) {
              setMessages(res.data);
            }
          })
          .catch(err => console.error(err));
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedConv?._id]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessageText.trim() || !selectedConv?._id || isSending) return;

    const textToSend = newMessageText.trim();
    setNewMessageText('');
    setIsSending(true);

    if (selectedConv._id === 'sakhi_ai_assistant') {
      const userMsg = {
        _id: 'user_' + Date.now(),
        sender: { _id: user?._id, name: user?.name || 'You' },
        message: textToSend,
        createdAt: new Date()
      };

      const updatedSakhiMsgs = [...sakhiMessages, userMsg];
      setSakhiMessages(updatedSakhiMsgs);
      setMessages(updatedSakhiMsgs);
      setIsSakhiTyping(true);
      setTimeout(scrollToBottom, 50);

      try {
        const res = await api.post('/ai/chat', {
          message: textToSend,
          language: preferredLanguage
        });

        const replyText = res.data?.responseMessage || res.data?.response || res.data?.reply ||
          'Thank you for sharing. How else can I assist your business?';

        let ctaTitle = res.data?.ctaTitle || '';
        const textLower = textToSend.toLowerCase();
        if (textLower.includes('diwali') || textLower.includes('sweet') || textLower.includes('festival') || textLower.includes('listing')) {
          ctaTitle = '✨ Prepare My Listing';
        }

        const sakhiReply = {
          _id: 'sakhi_' + Date.now(),
          sender: { name: 'Sakhi (AI Assistant)', role: 'AI Assistant' },
          message: replyText,
          createdAt: new Date(),
          isSakhi: true,
          ctaTitle
        };

        const finalSakhiMsgs = [...updatedSakhiMsgs, sakhiReply];
        setSakhiMessages(finalSakhiMsgs);
        setMessages(finalSakhiMsgs);
        
        SAKHI_CONVERSATION.lastMessage = replyText;
        SAKHI_CONVERSATION.lastMessageAt = new Date();

        // Auto play speech synthesis for newly arrived Sakhi messages
        speakText(replyText, preferredLanguage);

      } catch (err) {
        console.error('Sakhi AI chat error:', err);
        const fallbackReply = {
          _id: 'sakhi_err_' + Date.now(),
          sender: { name: 'Sakhi (AI Assistant)', role: 'AI Assistant' },
          message: preferredLanguage === 'ta' 
            ? 'மன்னிக்கவும், தகவல் பெறுவதில் சிறு சிக்கல் ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.' 
            : preferredLanguage === 'hi'
            ? 'क्षमा करें, जानकारी प्राप्त करने में कुछ समस्या आई है। कृपया पुनः प्रयास करें।'
            : 'I am here to support you! You can ask me how to price your skills or optimize your listings.',
          createdAt: new Date(),
          isSakhi: true
        };
        const fallbackMsgs = [...updatedSakhiMsgs, fallbackReply];
        setSakhiMessages(fallbackMsgs);
        setMessages(fallbackMsgs);
      } finally {
        setIsSending(false);
        setIsSakhiTyping(false);
        setTimeout(scrollToBottom, 50);
      }
      return;
    }

    // Persistent User-to-User chat
    try {
      const { data } = await api.post(`/chat/conversations/${selectedConv._id}/messages`, {
        message: textToSend
      });
      setMessages(prev => [...prev, data]);
      fetchConversations();
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      console.error('Failed to send message:', err);
      alert(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  // Language Change Handler: Persists user language settings to MongoDB User Schema
  const handleLanguageChange = async (newLang) => {
    try {
      const { data } = await api.put('/users/profile', { preferredLanguage: newLang });
      if (updateUserInState && data) {
        updateUserInState(data);
      }
    } catch (err) {
      console.error('Failed to update preferred language in MongoDB:', err);
    }
  };

  // Web Speech API Text-to-Speech (TTS) voice builder
  const speakText = (text, langCode) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    // Clean emojis & extra markups to prevent spelling anomalies
    const cleanText = text.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const targetLang = langCode || preferredLanguage;
    
    utterance.lang = targetLang === 'ta' ? 'ta-IN' : targetLang === 'hi' ? 'hi-IN' : 'en-IN';
    
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang.startsWith(utterance.lang) || v.lang.startsWith(targetLang));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  // Localized Fallback prompt trigger
  const speakFallback = () => {
    const fallbacks = {
      ta: "மன்னிக்கவும், நான் சரியாக புரிந்து கொள்ளவில்லை. மீண்டும் சொல்ல முடியுமா?",
      hi: "माफ़ कीजिए, मैं ठीक से समझ नहीं पाया। कृपया फिर से बोलें।",
      en: "Sorry, I didn't quite understand that. Could you please repeat?"
    };
    const msg = fallbacks[preferredLanguage] || fallbacks.en;
    
    const sakhiFallback = {
      _id: 'sakhi_fallback_' + Date.now(),
      sender: { name: 'Sakhi (AI Assistant)', role: 'AI Assistant' },
      message: msg,
      createdAt: new Date(),
      isSakhi: true
    };

    setSakhiMessages(prev => [...prev, sakhiFallback]);
    setMessages(prev => [...prev, sakhiFallback]);
    speakText(msg, preferredLanguage);
    setTimeout(scrollToBottom, 50);
  };

  // Web Speech API Speech-to-Text (STT) Speech Recognition
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice speech recognition is not supported in this browser. Please try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = preferredLanguage === 'ta' ? 'ta-IN' : preferredLanguage === 'hi' ? 'hi-IN' : 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      
      if (!transcript || transcript.trim().length === 0 || confidence < 0.1) {
        speakFallback();
      } else {
        setNewMessageText(transcript);
      }
    };

    recognition.onerror = (err) => {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const getPartner = (conv) => {
    if (!conv) return { name: 'Partner', role: '' };
    if (conv.isSakhi) return { name: 'Sakhi (AI Assistant)', role: 'System' };
    if (!user) return { name: 'Partner', role: '' };

    const customerObj = conv.customerId || conv.customer;
    const providerObj = conv.providerId || conv.provider;

    const customerUserId = (customerObj?._id || customerObj)?.toString();
    const currentUserId = user?._id?.toString();

    if (currentUserId === customerUserId) {
      return providerObj && typeof providerObj === 'object' ? providerObj : { name: providerObj || 'Provider' };
    } else {
      return customerObj && typeof customerObj === 'object' ? customerObj : { name: customerObj || 'Customer' };
    }
  };

  return (
    <div className="flex flex-col gap-4 text-left w-full h-[650px]">
      
      {/* Header */}
      <div className="border-b pb-3 border-cream-dark/30 flex justify-between items-center shrink-0">
        <div>
          <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-forest" />
            <span>{isCustomer ? 'Provider Messages & Chat' : 'Messages & Sakhi AI Assistant'}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {isCustomer 
              ? 'Communicate directly with your connected service providers.'
              : 'Chat with Sakhi AI Assistant or communicate directly with your connected matches.'}
          </p>
        </div>
        <button
          onClick={() => { fetchConversations(); if (selectedConv?._id) fetchMessages(selectedConv._id); }}
          className="px-3 py-1.5 text-xs font-bold rounded-xl border border-cream-dark hover:bg-gray-100 flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Main Chat Layout */}
      <div className={`grow rounded-3xl border flex flex-col md:flex-row overflow-hidden ${cardTheme}`}>
        
        {/* Left Panel: Conversation List */}
        <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-cream-dark/30 flex flex-col shrink-0 bg-cream/10">
          <div className="p-3 border-b border-cream-dark/30 font-bold text-xs uppercase tracking-wider text-gray-500 flex justify-between items-center">
            <span>Conversations ({conversations.length})</span>
            {!isCustomer && (
              <span className="text-[10px] text-terracotta font-extrabold flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Sakhi AI Active
              </span>
            )}
          </div>

          {loadingConvs ? (
            <div className="p-6 text-center text-xs font-bold text-forest animate-pulse flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-terracotta" /> Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              No active conversations found. Accept a match or request a connection to start chatting!
            </div>
          ) : (
            <div className="grow overflow-y-auto divide-y divide-cream-dark/20">
              {conversations.map((conv) => {
                const partner = getPartner(conv);
                const isSelected = selectedConv?._id === conv._id;
                const isSakhi = Boolean(conv.isSakhi);
                const partnerName = partner?.name || (isSakhi ? 'Sakhi (AI Assistant)' : 'User');

                return (
                  <button
                    key={conv._id || Math.random()}
                    onClick={() => { setSelectedConv(conv); if (onSelectConversation) onSelectConversation(conv); }}
                    className={`w-full p-4 text-left transition-all flex items-start gap-3 hover:bg-cream-dark/10 ${
                      isSelected 
                        ? (isSakhi ? 'bg-orange-50 border-l-4 border-terracotta' : (highContrast ? 'bg-white text-black' : 'bg-forest/10 border-l-4 border-forest')) 
                        : (isSakhi ? 'bg-orange-50/40 hover:bg-orange-50/70' : '')
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-full shrink-0 flex items-center justify-center font-serif text-lg font-bold ${
                      isSakhi
                        ? 'bg-terracotta text-white shadow-sm'
                        : (highContrast ? 'bg-black text-white border' : 'bg-orange-100 text-terracotta border border-orange-200')
                    }`}>
                      {isSakhi ? <Sparkles className="h-5 w-5 text-yellow-200" /> : getInitials(partnerName)}
                    </div>

                    <div className="grow min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className="font-bold text-sm truncate flex items-center gap-1.5">
                          <span>{partnerName}</span>
                          {isSakhi && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-terracotta text-white uppercase tracking-wider">
                              AI
                            </span>
                          )}
                        </h4>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-gray-400 font-mono">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {conv.lastMessage || 'No messages yet'}
                      </p>

                      {(conv.matchId?.requestId?.title || conv.matchId?.title || conv.match?.opportunity?.title) && (
                        <span className="inline-block text-[10px] font-extrabold text-forest uppercase tracking-wider bg-forest/10 px-1.5 py-0.5 rounded mt-1 truncate max-w-full">
                          {conv.matchId?.requestId?.title || conv.matchId?.title || conv.match?.opportunity?.title}
                        </span>
                      )}
                    </div>

                    {conv.unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-terracotta text-white shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel: Active Chat Window */}
        <div className="grow flex flex-col min-w-0 bg-white">
          {selectedConv ? (
            <>
              {/* Active Partner Header (With Dropdown Language Selector for Sakhi AI) */}
              <div className={`p-4 border-b border-cream-dark/30 flex items-center justify-between shrink-0 ${
                selectedConv.isSakhi ? 'bg-gradient-to-r from-orange-50 via-amber-50 to-cream/30' : 'bg-cream/20'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full font-serif font-bold text-lg flex items-center justify-center ${
                    selectedConv.isSakhi
                      ? 'bg-terracotta text-white shadow-md'
                      : 'bg-orange-100 text-terracotta border border-orange-200'
                  }`}>
                    {selectedConv.isSakhi ? <Sparkles className="h-5 w-5 text-yellow-200" /> : getInitials(getPartner(selectedConv)?.name)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <span>{getPartner(selectedConv)?.name || 'Connection Partner'}</span>
                      {selectedConv.isSakhi && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-terracotta text-white uppercase tracking-wider">
                          Official AI Companion
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {selectedConv.isSakhi 
                        ? 'Powered by Gemini AI • Smart business guidance & seasonal forecasts'
                        : `Service: ${selectedConv.matchId?.requestId?.title || selectedConv.matchId?.title || selectedConv.match?.opportunity?.title || 'Service Connection'}`}
                    </p>
                  </div>
                </div>

                {/* Sakhi Language Selection Header Widget & Speak Greeting Controller */}
                {selectedConv.isSakhi ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => speakText(messages[0]?.message, preferredLanguage)}
                      className="h-8 w-8 rounded-full bg-orange-100 hover:bg-orange-200 flex items-center justify-center text-terracotta transition-colors shadow-sm"
                      title="Speak greeting"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <select
                      value={preferredLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="px-2.5 py-1 text-xs font-bold bg-white text-charcoal border border-cream-dark rounded-xl focus:outline-none focus:border-terracotta"
                    >
                      <option value="en">English</option>
                      <option value="ta">தமிழ் (Tamil)</option>
                      <option value="hi">हिंदी (Hindi)</option>
                    </select>
                  </div>
                ) : (
                  <div className="px-3 py-1 rounded-full text-xs font-bold border bg-teal-100 text-teal-800 border-teal-200">
                    ✓ Connected
                  </div>
                )}
              </div>

              {/* Message History Area */}
              <div className="grow p-4 overflow-y-auto flex flex-col gap-3 bg-cream/5">
                {loadingMsgs ? (
                  <div className="m-auto text-xs font-bold text-forest animate-pulse">
                    Loading chat messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="m-auto text-xs text-gray-400 text-center">
                    No messages yet. Send a message to start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const senderIdStr = (msg.senderId?._id || msg.senderId || msg.sender?._id || msg.sender)?.toString();
                    const currentUserIdStr = user?._id?.toString();
                    const isMe = !msg.isSakhi && Boolean(currentUserIdStr && senderIdStr === currentUserIdStr);
                    const isSakhiMsg = Boolean(msg.isSakhi || msg.sender?.name === 'Sakhi (AI Assistant)');

                    return (
                      <div
                        key={msg._id || Math.random()}
                        className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                      >
                        {isSakhiMsg && (
                          <div className="flex items-center gap-1.5 mb-1 text-xs font-extrabold text-terracotta">
                            <Sparkles className="h-3.5 w-3.5 text-terracotta" />
                            <span>Sakhi AI</span>
                          </div>
                        )}

                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm relative group ${
                          isMe
                            ? (highContrast ? 'bg-white text-black font-bold' : 'bg-forest text-white')
                            : (isSakhiMsg
                                ? 'bg-terracotta text-white shadow-md font-medium'
                                : (highContrast ? 'bg-black text-white border' : 'bg-cream-dark/20 text-charcoal border border-cream-dark/30'))
                        }`}>
                          <p>{msg.message}</p>

                          {/* Speak Response trigger on hover/active */}
                          {isSakhiMsg && (
                            <button
                              onClick={() => speakText(msg.message, preferredLanguage)}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 hover:bg-white/40 p-1 rounded-full text-white"
                              title="Hear reply"
                            >
                              <Volume2 className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* One-Tap Action Button */}
                          {msg.ctaTitle && (
                            <button
                              onClick={() => {
                                if (onPrepareListing) {
                                  onPrepareListing();
                                } else {
                                  alert('Opening Listing Preparation Wizard...');
                                }
                              }}
                              className="mt-2.5 w-full px-4 py-2 rounded-xl font-extrabold text-xs bg-amber-400 hover:bg-amber-300 text-charcoal flex items-center justify-center gap-1.5 shadow-md transition-all border border-amber-500 cursor-pointer"
                            >
                              <Sparkles className="h-4 w-4 text-forest" />
                              <span>{msg.ctaTitle}</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1 px-1">
                          <span>{formatTime(msg.createdAt)}</span>
                          {isMe && (
                            msg.status === 'read' ? (
                              <CheckCheck className="h-3 w-3 text-teal-600" />
                            ) : (
                              <Check className="h-3 w-3 text-gray-400" />
                            )
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Sakhi AI Animated Typing Bubble */}
                {selectedConv.isSakhi && isSakhiTyping && (
                  <div className="flex flex-col max-w-[80%] self-start items-start animate-fade-in">
                    <div className="flex items-center gap-1.5 mb-1 text-xs font-extrabold text-terracotta">
                      <Sparkles className="h-3.5 w-3.5 text-terracotta animate-spin" />
                      <span>Sakhi is thinking...</span>
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-orange-100/90 border border-orange-200 shadow-sm flex items-center gap-2">
                      <div className="flex space-x-1.5 items-center py-1 px-1">
                        <div className="h-2.5 w-2.5 bg-terracotta rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="h-2.5 w-2.5 bg-terracotta rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="h-2.5 w-2.5 bg-terracotta rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Bar (With Web Speech API Mic Voice input integration) */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-cream-dark/30 flex items-center gap-2 bg-white shrink-0">
                {selectedConv.isSakhi && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center shadow-sm border transition-all ${
                      isListening
                        ? 'bg-red-500 text-white border-red-600 animate-pulse'
                        : 'bg-orange-100 hover:bg-orange-200 text-terracotta border-orange-200'
                    }`}
                    title={isListening ? "Stop listening" : "🎤 Tap to speak"}
                  >
                    {isListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
                  </button>
                )}
                
                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder={selectedConv.isSakhi ? "Ask Sakhi AI about pricing, sweets listing, or business strategy..." : "Type a message..."}
                  className="grow px-4 py-2.5 rounded-2xl text-sm border border-cream-dark focus:outline-none focus:border-forest"
                />
                <button
                  type="submit"
                  disabled={!newMessageText.trim() || isSending}
                  className={`px-5 py-2.5 rounded-2xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm transition-all ${
                    selectedConv.isSakhi
                      ? 'bg-terracotta hover:bg-terracotta-hover'
                      : 'bg-forest hover:bg-forest-hover'
                  }`}
                >
                  {selectedConv.isSakhi ? <Sparkles className="h-4 w-4 text-yellow-200" /> : <Send className="h-4 w-4" />}
                  <span>{selectedConv.isSakhi ? 'Ask AI' : 'Send'}</span>
                </button>
              </form>
            </>
          ) : (
            <div className="m-auto text-center p-8 flex flex-col items-center gap-2 text-gray-400">
              <MessageSquare className="h-12 w-12 text-gray-300" />
              <h4 className="font-bold text-base text-gray-600">Select a Conversation</h4>
              <p className="text-xs">Choose a connected user to start chatting.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default ChatInterface;

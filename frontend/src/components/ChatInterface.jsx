import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Clock, User, Check, CheckCheck, Sparkles, RefreshCw, Bot } from 'lucide-react';
import api from '../services/api';

const SAKHI_CONVERSATION = {
  _id: 'sakhi_ai_assistant',
  isSakhi: true,
  name: 'Sakhi (AI Assistant)',
  role: 'AI Assistant',
  lastMessage: 'Diwali is coming up in 3 weeks — want me to help you prepare a sweets listing?',
  lastMessageAt: new Date()
};

const INITIAL_SAKHI_MESSAGES = [
  {
    _id: 'sakhi_welcome',
    sender: { name: 'Sakhi (AI Assistant)', role: 'AI Assistant' },
    message: 'Namaste! I am Sakhi, your AI companion on SilverHands. I can help you with gig matching, pricing strategy, customer communication, and seasonal demand forecasts. How can I assist your business today?',
    createdAt: new Date(Date.now() - 60000),
    isSakhi: true
  },
  {
    _id: 'sakhi_forecast_proactive',
    sender: { name: 'Sakhi (AI Assistant)', role: 'AI Assistant' },
    message: 'Diwali is coming up in 3 weeks — want me to help you prepare a sweets listing?',
    createdAt: new Date(),
    isSakhi: true,
    ctaTitle: '✨ Prepare My Listing',
    ctaAction: 'prepare_listing'
  }
];

const ChatInterface = ({ user, highContrast, initialMatchId, onSelectConversation, onPrepareListing }) => {
  const [conversations, setConversations] = useState([SAKHI_CONVERSATION]);
  const [selectedConv, setSelectedConv] = useState(SAKHI_CONVERSATION);
  const [messages, setMessages] = useState(INITIAL_SAKHI_MESSAGES);
  const [sakhiMessages, setSakhiMessages] = useState(INITIAL_SAKHI_MESSAGES);
  const [newMessageText, setNewMessageText] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  const cardTheme = highContrast
    ? 'border-2 border-white bg-black text-white'
    : 'border-cream-dark/50 bg-white text-charcoal shadow-sm';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch all user conversations from MongoDB & include Sakhi AI Assistant
  const fetchConversations = async (autoSelectMatchId = null) => {
    try {
      const { data } = await api.get('/chat/conversations');
      const convList = Array.isArray(data) ? data : [];
      const fullList = [SAKHI_CONVERSATION, ...convList];
      setConversations(fullList);

      if (autoSelectMatchId) {
        const target = convList.find(c => (c.match?._id || c.match) === autoSelectMatchId);
        if (target) {
          setSelectedConv(target);
        }
      } else if (!selectedConv) {
        setSelectedConv(SAKHI_CONVERSATION);
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
          setSelectedConv(data);
          fetchConversations(initialMatchId);
        } catch (err) {
          console.error('Failed to auto open conversation:', err);
          fetchConversations();
        }
      } else {
        fetchConversations();
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
  }, [selectedConv?._id]);

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
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedConv?._id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedConv?._id || isSending) return;

    const textToSend = newMessageText.trim();
    setNewMessageText('');
    setIsSending(true);

    // ----------------------------------------------------
    // SAKHI AI ASSISTANT CHAT HANDLING
    // ----------------------------------------------------
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
      setTimeout(scrollToBottom, 50);

      try {
        const res = await api.post('/ai/chat', {
          message: textToSend,
          language: user?.preferredLanguage || 'en'
        });

        const replyText = res.data?.responseMessage || res.data?.response || res.data?.reply ||
          'Thank you for asking! On SilverHands, providers who highlight their specific skills (like diabetic cooking, festive baking, or math tutoring) get 3x higher match rates. How else can I assist your business?';

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
        
        // Update Sakhi last message preview
        SAKHI_CONVERSATION.lastMessage = replyText;
        SAKHI_CONVERSATION.lastMessageAt = new Date();
      } catch (err) {
        console.error('Sakhi AI Chat Error:', err);
        const fallbackReply = {
          _id: 'sakhi_' + Date.now(),
          sender: { name: 'Sakhi (AI Assistant)', role: 'AI Assistant' },
          message: 'Namaste! I am your AI business assistant. For the upcoming festival season, creating a specialized listing can boost your earnings by up to 40%. Would you like to prepare your festive listing now?',
          createdAt: new Date(),
          isSakhi: true,
          ctaTitle: '✨ Prepare My Listing'
        };
        const finalSakhiMsgs = [...updatedSakhiMsgs, fallbackReply];
        setSakhiMessages(finalSakhiMsgs);
        setMessages(finalSakhiMsgs);
      } finally {
        setIsSending(false);
        setTimeout(scrollToBottom, 50);
      }
      return;
    }

    // ----------------------------------------------------
    // USER-TO-USER PERSISTENT CHAT HANDLING (MongoDB)
    // ----------------------------------------------------
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

  const getPartner = (conv) => {
    if (!conv) return { name: 'Partner', role: '' };
    if (conv.isSakhi) return { name: 'Sakhi (AI Assistant)', role: 'System' };
    if (!user) return { name: 'Partner', role: '' };
    const isCustomer = user.role === 'customer' || conv.customer?._id === user._id;
    return isCustomer ? conv.provider || { name: 'Provider' } : conv.customer || { name: 'Customer' };
  };

  return (
    <div className="flex flex-col gap-4 text-left w-full h-[650px]">
      
      {/* Header */}
      <div className="border-b pb-3 border-cream-dark/30 flex justify-between items-center shrink-0">
        <div>
          <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-forest" />
            <span>Messages & Sakhi AI Assistant</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Chat with Sakhi AI Assistant or communicate directly with your connected matches.
          </p>
        </div>
        <button
          onClick={() => { fetchConversations(); if (selectedConv) fetchMessages(selectedConv._id); }}
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
            <span className="text-[10px] text-terracotta font-extrabold flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Sakhi AI Active
            </span>
          </div>

          {loadingConvs ? (
            <div className="p-6 text-center text-xs font-bold text-forest animate-pulse flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-terracotta" /> Loading conversations...
            </div>
          ) : (
            <div className="grow overflow-y-auto divide-y divide-cream-dark/20">
              {conversations.map((conv) => {
                const partner = getPartner(conv);
                const isSelected = selectedConv?._id === conv._id;
                const isSakhi = conv.isSakhi;

                return (
                  <button
                    key={conv._id}
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
                      {isSakhi ? <Sparkles className="h-5 w-5 text-yellow-200" /> : (partner.name ? partner.name[0].toUpperCase() : 'U')}
                    </div>

                    <div className="grow min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className="font-bold text-sm truncate flex items-center gap-1.5">
                          <span>{partner.name || 'User'}</span>
                          {isSakhi && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-terracotta text-white uppercase tracking-wider">
                              AI
                            </span>
                          )}
                        </h4>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-gray-400 font-mono">
                            {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {conv.lastMessage || 'No messages yet'}
                      </p>

                      {conv.match?.opportunity?.title && (
                        <span className="inline-block text-[10px] font-extrabold text-forest uppercase tracking-wider bg-forest/10 px-1.5 py-0.5 rounded mt-1 truncate max-w-full">
                          {conv.match.opportunity.title}
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
              {/* Active Partner Header */}
              <div className={`p-4 border-b border-cream-dark/30 flex items-center justify-between shrink-0 ${
                selectedConv.isSakhi ? 'bg-gradient-to-r from-orange-50 via-amber-50 to-cream/30' : 'bg-cream/20'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full font-serif font-bold text-lg flex items-center justify-center ${
                    selectedConv.isSakhi
                      ? 'bg-terracotta text-white shadow-md'
                      : 'bg-orange-100 text-terracotta border border-orange-200'
                  }`}>
                    {selectedConv.isSakhi ? <Sparkles className="h-5 w-5 text-yellow-200" /> : (getPartner(selectedConv).name ? getPartner(selectedConv).name[0].toUpperCase() : 'U')}
                  </div>
                  <div>
                    <h3 className="font-bold text-base flex items-center gap-2">
                      <span>{getPartner(selectedConv).name || 'Connection Partner'}</span>
                      {selectedConv.isSakhi && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-terracotta text-white uppercase tracking-wider">
                          Official AI Companion
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {selectedConv.isSakhi 
                        ? 'Powered by Gemini AI • Smart business guidance & seasonal forecasts'
                        : `Service: ${selectedConv.match?.opportunity?.title || 'Service Connection'}`}
                    </p>
                  </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  selectedConv.isSakhi 
                    ? 'bg-orange-100 text-terracotta border-orange-200 font-bold'
                    : 'bg-teal-100 text-teal-800 border-teal-200'
                }`}>
                  {selectedConv.isSakhi ? '✨ AI Assistant' : '✓ Connected'}
                </div>
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
                    const isMe = !msg.isSakhi && ((msg.sender?._id || msg.sender) === user?._id || (msg.sender?.name === (user?.name || 'You')));
                    const isSakhiMsg = msg.isSakhi || msg.sender?.name === 'Sakhi (AI Assistant)';

                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                      >
                        {isSakhiMsg && (
                          <div className="flex items-center gap-1.5 mb-1 text-xs font-extrabold text-terracotta">
                            <Sparkles className="h-3.5 w-3.5 text-terracotta" />
                            <span>Sakhi AI</span>
                          </div>
                        )}

                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          isMe
                            ? (highContrast ? 'bg-white text-black font-bold' : 'bg-forest text-white')
                            : (isSakhiMsg
                                ? 'bg-terracotta text-white shadow-md font-medium'
                                : (highContrast ? 'bg-black text-white border' : 'bg-cream-dark/20 text-charcoal border border-cream-dark/30'))
                        }`}>
                          <p>{msg.message}</p>

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
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-cream-dark/30 flex items-center gap-2 bg-white shrink-0">
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
              <p className="text-xs">Choose a connected user or Sakhi AI Assistant to start chatting.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default ChatInterface;

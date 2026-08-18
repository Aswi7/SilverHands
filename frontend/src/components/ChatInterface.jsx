import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Clock, User, Check, CheckCheck, Sparkles, RefreshCw } from 'lucide-react';
import api from '../services/api';

const ChatInterface = ({ user, highContrast, initialMatchId, onSelectConversation }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
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

  // Fetch all user conversations from MongoDB
  const fetchConversations = async (autoSelectMatchId = null) => {
    try {
      const { data } = await api.get('/chat/conversations');
      const convList = Array.isArray(data) ? data : [];
      setConversations(convList);

      if (autoSelectMatchId) {
        const target = convList.find(c => (c.match?._id || c.match) === autoSelectMatchId);
        if (target) {
          setSelectedConv(target);
        }
      } else if (convList.length > 0 && !selectedConv) {
        setSelectedConv(convList[0]);
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

  // Short polling for live updates every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
      if (selectedConv?._id) {
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
    if (!conv || !user) return { name: 'Partner', role: '' };
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
            <span>Messages & Connection Chat</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Persistent end-to-end messaging for accepted connection requests.
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
          <div className="p-3 border-b border-cream-dark/30 font-bold text-xs uppercase tracking-wider text-gray-500">
            Conversations ({conversations.length})
          </div>

          {loadingConvs ? (
            <div className="p-6 text-center text-xs font-bold text-forest animate-pulse flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" /> Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
              <MessageSquare className="h-8 w-8 text-gray-300" />
              <span>No active conversations. Accept a connection request to start chatting!</span>
            </div>
          ) : (
            <div className="grow overflow-y-auto divide-y divide-cream-dark/20">
              {conversations.map((conv) => {
                const partner = getPartner(conv);
                const isSelected = selectedConv?._id === conv._id;

                return (
                  <button
                    key={conv._id}
                    onClick={() => { setSelectedConv(conv); if (onSelectConversation) onSelectConversation(conv); }}
                    className={`w-full p-4 text-left transition-all flex items-start gap-3 hover:bg-cream-dark/10 ${
                      isSelected ? (highContrast ? 'bg-white text-black' : 'bg-forest/10 border-l-4 border-forest') : ''
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-full shrink-0 flex items-center justify-center font-serif text-lg font-bold ${
                      highContrast ? 'bg-black text-white border' : 'bg-orange-100 text-terracotta border border-orange-200'
                    }`}>
                      {partner.name ? partner.name[0].toUpperCase() : 'U'}
                    </div>

                    <div className="grow min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h4 className="font-bold text-sm truncate">{partner.name || 'User'}</h4>
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
              <div className="p-4 border-b border-cream-dark/30 flex items-center justify-between bg-cream/20 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-100 text-terracotta font-serif font-bold text-lg flex items-center justify-center border border-orange-200">
                    {getPartner(selectedConv).name ? getPartner(selectedConv).name[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{getPartner(selectedConv).name || 'Connection Partner'}</h3>
                    <p className="text-xs text-gray-500">
                      Service: {selectedConv.match?.opportunity?.title || 'Service Connection'}
                    </p>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  ✓ Connected
                </div>
              </div>

              {/* Message History Area */}
              <div className="grow p-4 overflow-y-auto flex flex-col gap-3 bg-cream/5">
                {loadingMsgs ? (
                  <div className="m-auto text-xs font-bold text-forest animate-pulse">
                    Loading chat messages from MongoDB...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="m-auto text-xs text-gray-400 text-center">
                    No messages yet. Send a message to start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = (msg.sender?._id || msg.sender) === user?._id;

                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                      >
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          isMe
                            ? (highContrast ? 'bg-white text-black font-bold' : 'bg-forest text-white')
                            : (highContrast ? 'bg-black text-white border' : 'bg-cream-dark/20 text-charcoal border border-cream-dark/30')
                        }`}>
                          {msg.message}
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
                  placeholder="Type a message..."
                  className="grow px-4 py-2.5 rounded-2xl text-sm border border-cream-dark focus:outline-none focus:border-forest"
                />
                <button
                  type="submit"
                  disabled={!newMessageText.trim() || isSending}
                  className="px-5 py-2.5 rounded-2xl text-sm font-bold bg-forest hover:bg-forest-hover text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="m-auto text-center p-8 flex flex-col items-center gap-2 text-gray-400">
              <MessageSquare className="h-12 w-12 text-gray-300" />
              <h4 className="font-bold text-base text-gray-600">Select a Conversation</h4>
              <p className="text-xs">Choose a connected user from the left list to view your persistent chat history.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default ChatInterface;

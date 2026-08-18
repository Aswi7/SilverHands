const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Match = require('../models/Match');

// @desc    Create or fetch conversation for an accepted/contacted match
// @route   POST /api/chat/conversations
// @access  Private
const createOrGetConversation = async (req, res) => {
  try {
    const { matchId } = req.body;

    if (!matchId) {
      return res.status(400).json({ message: 'matchId is required' });
    }

    const match = await Match.findById(matchId).populate('customer provider opportunity');

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Rule: Chat allowed ONLY when match status is ACCEPTED or CONTACTED
    if (!['ACCEPTED', 'CONTACTED'].includes(match.status)) {
      return res.status(403).json({
        message: `Chat is disabled until the connection request is accepted by the provider. Current match status: ${match.status}`
      });
    }

    const userIdStr = req.user._id.toString();
    const customerIdStr = (match.customerId || match.customer)?._id?.toString() || (match.customerId || match.customer)?.toString();
    const providerIdStr = (match.providerId || match.provider)?._id?.toString() || (match.providerId || match.provider)?.toString();

    if (userIdStr !== customerIdStr && userIdStr !== providerIdStr) {
      return res.status(403).json({ message: 'Not authorized to open chat for this match' });
    }

    let conversation = await Conversation.findOne({
      $or: [{ matchId: match._id }, { match: match._id }]
    })
      .populate('customer', 'name phone city preferredLanguage')
      .populate('provider', 'name phone city skills bio category')
      .populate('match');

    if (!conversation) {
      conversation = await Conversation.create({
        customerId: match.customerId || match.customer._id || match.customer,
        providerId: match.providerId || match.provider._id || match.provider,
        matchId: match._id,
        lastMessage: 'Conversation started',
        lastMessageAt: new Date()
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('customer', 'name phone city preferredLanguage')
        .populate('provider', 'name phone city skills bio category')
        .populate('match');
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error('Create or get conversation error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all conversations for the logged-in user
// @route   GET /api/chat/conversations
// @access  Private
const getUserConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      $or: [
        { customerId: userId }, { customer: userId },
        { providerId: userId }, { provider: userId }
      ]
    })
      .populate('customer', 'name phone city preferredLanguage')
      .populate('provider', 'name phone city skills bio category')
      .populate('match')
      .sort({ lastMessageAt: -1 })
      .lean();

    // Enrich with unread counts
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          $or: [{ conversationId: conv._id }, { conversation: conv._id }],
          $or: [{ receiverId: userId }, { receiver: userId }],
          readAt: null
        });
        return {
          ...conv,
          unreadCount
        };
      })
    );

    res.status(200).json(enrichedConversations);
  } catch (error) {
    console.error('Get user conversations error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
const getConversationMessages = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const userIdStr = userId.toString();
    const customerIdStr = (conversation.customerId || conversation.customer).toString();
    const providerIdStr = (conversation.providerId || conversation.provider).toString();

    if (userIdStr !== customerIdStr && userIdStr !== providerIdStr) {
      return res.status(403).json({ message: 'Not authorized to view messages in this conversation' });
    }

    // Mark unread messages to logged-in user as read
    await Message.updateMany(
      {
        $or: [{ conversationId: conversationId }, { conversation: conversationId }],
        $or: [{ receiverId: userId }, { receiver: userId }],
        readAt: null
      },
      {
        $set: {
          readAt: new Date(),
          status: 'read'
        }
      }
    );

    const messages = await Message.find({
      $or: [{ conversationId: conversationId }, { conversation: conversationId }]
    })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Get conversation messages error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a message in a conversation
// @route   POST /api/chat/conversations/:id/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { message } = req.body;
    const senderId = req.user._id;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const conversation = await Conversation.findById(conversationId).populate('match');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Rule: Match status must still be ACCEPTED or CONTACTED
    if (conversation.match && !['ACCEPTED', 'CONTACTED'].includes(conversation.match.status)) {
      return res.status(403).json({ message: `Cannot send message: Match status is ${conversation.match.status}` });
    }

    const senderIdStr = senderId.toString();
    const customerIdStr = (conversation.customerId || conversation.customer).toString();
    const providerIdStr = (conversation.providerId || conversation.provider).toString();

    if (senderIdStr !== customerIdStr && senderIdStr !== providerIdStr) {
      return res.status(403).json({ message: 'Not authorized to send messages in this conversation' });
    }

    const receiverId = senderIdStr === customerIdStr ? (conversation.providerId || conversation.provider) : (conversation.customerId || conversation.customer);

    const newMessage = await Message.create({
      conversationId: conversationId,
      senderId: senderId,
      receiverId: receiverId,
      message: message.trim(),
      status: 'sent'
    });

    // Update conversation lastMessage & lastMessageAt
    conversation.lastMessage = message.trim();
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'name role');

    console.log(`[CHAT MESSAGE PERSISTED] Conv ${conversationId}: User ${senderId} sent message`);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send message error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrGetConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage
};

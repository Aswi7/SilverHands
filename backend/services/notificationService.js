const Notification = require('../models/Notification');
const User = require('../models/User');
const ServiceRequest = require('../models/ServiceRequest');

/**
 * Helper to create a single notification document in MongoDB
 */
const createNotification = async ({ userId, title, message, type, matchId, requestId }) => {
  if (!userId || !title || !message || !type) return null;
  try {
    const notif = await Notification.create({
      userId,
      title,
      message,
      type,
      matchId: matchId || undefined,
      requestId: requestId || undefined,
      read: false
    });
    console.log(`[NOTIFICATION SERVICE] Created ${type} notification for User ${userId}`);
    return notif;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};

/**
 * Trigger MATCH_FOUND notifications for both Provider and Customer
 */
const notifyMatchFound = async (match, request, provider, customer) => {
  try {
    const reqTitle = request?.title || 'Service Request';
    const matchScore = match?.score || 85;
    const provName = provider?.name || 'A local provider';
    const custName = customer?.name || 'A customer';

    // Provider Notification
    if (provider?._id || match?.providerId) {
      await createNotification({
        userId: provider?._id || match.providerId,
        title: '✨ New Opportunity Match Found!',
        message: `You matched with ${custName}'s request for "${reqTitle}" (${matchScore}% match score).`,
        type: 'MATCH_FOUND',
        matchId: match._id,
        requestId: request?._id
      });
    }

    // Customer Notification
    if (customer?._id || match?.customerId) {
      await createNotification({
        userId: customer?._id || match.customerId,
        title: '🤝 New Candidate Matched!',
        message: `${provName} matched with your request for "${reqTitle}" (${matchScore}% match score).`,
        type: 'MATCH_FOUND',
        matchId: match._id,
        requestId: request?._id
      });
    }
  } catch (err) {
    console.error('notifyMatchFound error:', err.message);
  }
};

/**
 * Trigger MATCH_ACCEPTED notifications for both Provider and Customer
 */
const notifyMatchAccepted = async (match, request, provider, customer) => {
  try {
    const reqTitle = request?.title || match?.requestId?.title || 'Service Request';
    const provName = provider?.name || match?.providerId?.name || 'Provider';
    const custName = customer?.name || match?.customerId?.name || 'Customer';

    // Customer Notification
    if (customer?._id || match?.customerId) {
      const cId = customer?._id || match.customerId._id || match.customerId;
      await createNotification({
        userId: cId,
        title: '🎉 Application Accepted!',
        message: `${provName} accepted your service request for "${reqTitle}". You can now confirm or start chatting!`,
        type: 'MATCH_ACCEPTED',
        matchId: match._id,
        requestId: request?._id || match.requestId
      });
    }

    // Provider Notification
    if (provider?._id || match?.providerId) {
      const pId = provider?._id || match.providerId._id || match.providerId;
      await createNotification({
        userId: pId,
        title: '✅ Request Accepted',
        message: `You accepted ${custName}'s request for "${reqTitle}". Waiting for customer confirmation.`,
        type: 'MATCH_ACCEPTED',
        matchId: match._id,
        requestId: request?._id || match.requestId
      });
    }
  } catch (err) {
    console.error('notifyMatchAccepted error:', err.message);
  }
};

/**
 * Trigger MATCH_COMPLETED notifications for both Provider and Customer
 */
const notifyMatchCompleted = async (match, request, provider, customer) => {
  try {
    const reqTitle = request?.title || match?.requestId?.title || 'Service Request';
    const provName = provider?.name || match?.providerId?.name || 'Provider';
    const custName = customer?.name || match?.customerId?.name || 'Customer';
    const payAmount = match?.agreedAmount || request?.rate || 1500;

    // Customer Notification
    if (customer?._id || match?.customerId) {
      const cId = customer?._id || match.customerId._id || match.customerId;
      await createNotification({
        userId: cId,
        title: '🌟 Service Completed!',
        message: `${provName} marked "${reqTitle}" as completed. Please leave a rating and review!`,
        type: 'MATCH_COMPLETED',
        matchId: match._id,
        requestId: request?._id || match.requestId
      });
    }

    // Provider Notification
    if (provider?._id || match?.providerId) {
      const pId = provider?._id || match.providerId._id || match.providerId;
      await createNotification({
        userId: pId,
        title: '💰 Service Completed & Paid!',
        message: `Service "${reqTitle}" for ${custName} is marked completed! Payment of ₹${payAmount} recorded.`,
        type: 'MATCH_COMPLETED',
        matchId: match._id,
        requestId: request?._id || match.requestId
      });
    }
  } catch (err) {
    console.error('notifyMatchCompleted error:', err.message);
  }
};

module.exports = {
  createNotification,
  notifyMatchFound,
  notifyMatchAccepted,
  notifyMatchCompleted
};

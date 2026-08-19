import React, { useState } from 'react';
import { 
  MapPin, 
  User as UserIcon, 
  MessageSquare, 
  CheckCircle, 
  Calendar,
  XCircle,
  Play,
  Check,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import ApplicationStepper from './ApplicationStepper';

const MatchCard = ({
  match,
  userRole = 'provider', // 'provider' | 'customer'
  highContrast = false,
  onAccept,
  onReject,
  onConfirm,
  onCompleteService,
  onCancel,
  onContact,
  onOpenChat
}) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (!match) return null;

  const isProvider = userRole === 'provider';
  const partner = isProvider ? match.customerId || match.customer : match.providerId || match.provider;
  const opp = match.requestId || match.opportunity;

  const rawStatus = (match.status || 'APPLIED').toUpperCase();
  const status = rawStatus === 'PENDING' ? 'APPLIED' : (rawStatus === 'CONTACTED' ? 'ACCEPTED' : rawStatus);

  const cardTheme = highContrast
    ? 'border-2 border-white bg-black text-white'
    : 'border-cream-dark/60 bg-white text-charcoal shadow-sm hover:shadow-md transition-all rounded-3xl';

  const partnerName = partner?.name || (isProvider ? 'Customer' : 'Provider');
  const partnerImage = partner?.profileImage || partner?.avatarUrl;

  const pConf = match.providerConfirmed || false;
  const cConf = match.customerConfirmed || false;

  // Plain-language status explanations as requested in REQUIREMENT 15
  const getStatusExplanation = () => {
    switch (status) {
      case 'APPLIED':
        return isProvider
          ? "A customer has submitted a request. Please review it."
          : "Your request has been submitted to the provider.";
      case 'ACCEPTED':
        if (!pConf && !cConf) {
          return "Both you and the customer need to confirm this service.";
        }
        if (isProvider) {
          return pConf 
            ? "Waiting for the customer to confirm." 
            : "Customer has confirmed. Please confirm the service.";
        } else {
          return cConf 
            ? "Waiting for the provider to confirm." 
            : "Provider has confirmed. Please confirm the service.";
        }
      case 'CONFIRMED':
        return "Both you and the customer have confirmed this service.";
      case 'COMPLETED':
        return "Service completed. Payment received.";
      case 'REJECTED':
        return "This application was rejected.";
      case 'CANCELLED':
        return "This application was cancelled.";
      default:
        return "Application status updated.";
    }
  };

  // Primary Action Button Renderer (Exactly ONE primary action)
  const renderPrimaryAction = () => {
    switch (status) {
      case 'APPLIED':
        if (isProvider) {
          return (
            <button
              onClick={() => setShowReviewModal(true)}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                highContrast
                  ? 'bg-white text-black hover:bg-gray-200'
                  : 'bg-forest hover:bg-forest-hover text-white'
              }`}
            >
              <span>Review Application</span>
            </button>
          );
        } else {
          return (
            <button
              onClick={() => onCancel && onCancel(match)}
              className="w-full py-3 px-6 rounded-2xl font-bold text-xs border border-gray-300 text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <XCircle className="h-4 w-4" />
              <span>Cancel Request</span>
            </button>
          );
        }

      case 'ACCEPTED':
        const iConfirmed = isProvider ? pConf : cConf;
        const otherConfirmed = isProvider ? cConf : pConf;

        if (iConfirmed) {
          return (
            <div className="flex flex-col gap-3 w-full">
              <div className="p-3 bg-gray-50 border rounded-2xl text-xs space-y-1">
                <p className="flex items-center gap-1.5 font-bold text-green-700">
                  <Check className="h-4 w-4" /> You confirmed
                </p>
                <p className="flex items-center gap-1.5 font-medium text-gray-400">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" /> 
                  {isProvider ? 'Customer' : 'Provider'} confirmation pending
                </p>
              </div>
              <button
                onClick={() => onReject && onReject(match)}
                className="w-full py-3 px-6 rounded-2xl font-bold text-sm border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                <span>Reject Deal</span>
              </button>
            </div>
          );
        }

        return (
          <div className="flex flex-col gap-2.5 w-full">
            {/* Show status if other party confirmed */}
            {otherConfirmed && (
              <div className="p-2.5 bg-orange-50 border border-orange-100 rounded-2xl text-xs font-bold text-orange-700 text-center">
                ⚠️ {isProvider ? 'Customer' : 'Provider'} has confirmed. Please confirm.
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={() => onConfirm && onConfirm(match)}
                className={`grow py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all ${
                  highContrast
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-forest hover:bg-forest-hover text-white'
                }`}
              >
                <Check className="h-4 w-4" />
                <span>Confirm</span>
              </button>
              <button
                onClick={() => onReject && onReject(match)}
                className="py-3 px-4 rounded-2xl font-bold text-sm border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center gap-1.5"
              >
                <XCircle className="h-4 w-4" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        );

      case 'CONFIRMED':
        if (isProvider) {
          return (
            <button
              onClick={() => setShowPaymentModal(true)}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                highContrast
                  ? 'bg-white text-black hover:bg-gray-200'
                  : 'bg-terracotta hover:bg-terracotta-hover text-white'
              }`}
            >
              <Check className="h-4 w-4" />
              <span>Mark as Completed</span>
            </button>
          );
        } else {
          return (
            <div className="p-3 bg-teal-50 border border-teal-100 rounded-2xl text-xs text-teal-800 font-bold text-center">
              Both you and the provider have confirmed this service. Waiting for provider completion.
            </div>
          );
        }

      case 'COMPLETED':
        return (
          <div className="p-3 bg-green-50 border border-green-200 rounded-2xl text-xs text-green-800 font-bold text-center flex items-center justify-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Completed — Payment Received (₹{match.agreedAmount || 1500})</span>
          </div>
        );

      case 'REJECTED':
        return (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 font-bold text-center">
            This application was rejected.
          </div>
        );

      case 'CANCELLED':
        return (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-600 font-bold text-center">
            This application was cancelled.
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`p-6 ${cardTheme}`}>
      {/* 1. Header: Customer Name & Profile Image */}
      <div className="flex items-center gap-4 mb-4">
        {partnerImage ? (
          <img
            src={partnerImage}
            alt={partnerName}
            className="w-14 h-14 rounded-full object-cover border-2 border-cream-dark shadow-sm shrink-0"
          />
        ) : (
          <div className={`w-14 h-14 rounded-full shrink-0 flex items-center justify-center font-serif text-xl font-bold ${
            highContrast ? 'bg-black border-2 border-white text-white' : 'bg-orange-100 text-terracotta border border-orange-200'
          }`}>
            {partnerName[0].toUpperCase()}
          </div>
        )}

        <div className="grow">
          <h3 className="font-serif text-lg font-bold text-charcoal leading-snug">
            {partnerName}
          </h3>
          <div className="flex items-center gap-3 text-xs text-gray-500 font-medium mt-1">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              {opp?.city || partner?.city || 'Delhi'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              {new Date(match.createdAt || Date.now()).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Request Details */}
      <div className="bg-cream-light/60 rounded-2xl p-4 mb-4 border border-cream-dark/30">
        <h4 className="font-serif text-base font-bold text-forest">
          {opp?.title || 'Home Assistance Request'}
        </h4>
        {opp?.description && (
          <p className="text-xs text-gray-600 line-clamp-2 mt-1 leading-relaxed">
            {opp.description}
          </p>
        )}
        <div className="mt-2.5 flex items-center justify-between text-xs border-t pt-2 border-cream-dark/20">
          <span className="font-medium text-gray-500">Service Fee:</span>
          <span className="font-extrabold text-forest">{opp?.rate || 'Negotiable'}</span>
        </div>
      </div>

      {/* 3. Four-Step Status Tracker Stepper */}
      <div className="mb-4">
        <ApplicationStepper status={status} highContrast={highContrast} />
      </div>

      {/* 4. Plain-Language Status Explanation */}
      <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-100 mb-5 text-center">
        <p className="text-xs font-bold text-teal-900 leading-relaxed">
          {getStatusExplanation()}
        </p>
      </div>

      {/* 5. Contact Option during Acceptance (ACCEPTED or CONFIRMED) */}
      {(status === 'ACCEPTED' || status === 'CONFIRMED') && (
        <button
          onClick={() => onContact ? onContact(match) : onOpenChat && onOpenChat(match)}
          className="w-full mb-3.5 py-3 px-4 rounded-2xl text-xs font-bold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 flex items-center justify-center gap-2"
        >
          <MessageSquare className="h-4.5 w-4.5 text-teal-600" />
          <span>Contact {partnerName}</span>
        </button>
      )}

      {/* 6. ONE Primary Action Button */}
      <div>
        {renderPrimaryAction()}
      </div>

      {/* Review Modal for Provider upon clicking Review Application */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-cream-dark">
            <h3 className="font-serif text-xl font-bold text-charcoal mb-2">
              Review Application from {partnerName}
            </h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Customer request: <span className="font-bold text-forest">{opp?.title || 'Service Request'}</span>
              {opp?.description && <span className="block mt-1 italic">"{opp.description}"</span>}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  if (onAccept) onAccept(match);
                }}
                className="w-full py-3.5 rounded-2xl font-bold text-sm bg-forest hover:bg-forest-hover text-white shadow-sm flex items-center justify-center gap-2"
              >
                <Check className="h-5 w-5" />
                <span>Accept Application</span>
              </button>

              <button
                onClick={() => {
                  setShowReviewModal(false);
                  if (onReject) onReject(match);
                }}
                className="w-full py-3.5 rounded-2xl font-bold text-sm border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
              >
                <XCircle className="h-5 w-5" />
                <span>Decline Application</span>
              </button>

              <button
                onClick={() => setShowReviewModal(false)}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-gray-500 hover:bg-gray-100 mt-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal for Provider upon clicking Mark as Completed */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-cream-dark">
            <div className="flex items-center gap-2 mb-3 text-terracotta">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <h3 className="font-serif text-xl font-bold text-charcoal">
                Confirm Payment Receipt
              </h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Have you received the payment for this service?
              <span className="block mt-2 font-extrabold text-charcoal">
                Amount: {opp?.rate || '₹1,500'}
              </span>
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  if (onCompleteService) onCompleteService(match);
                }}
                className="w-full py-3.5 rounded-2xl font-bold text-sm bg-forest hover:bg-forest-hover text-white shadow-sm flex items-center justify-center gap-2"
              >
                <Check className="h-5 w-5" />
                <span>Yes, Payment Received</span>
              </button>

              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full py-3.5 rounded-2xl font-bold text-sm border border-gray-200 text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchCard;

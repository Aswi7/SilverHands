import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  MessageSquare, 
  X, 
  Check, 
  Ban, 
  MapPin, 
  User, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

const MatchCard = ({
  match,
  userRole = 'customer', // 'customer' | 'provider'
  highContrast = false,
  onAccept,
  onReject,
  onContact,
  onOpenChat,
  onViewProfile
}) => {
  if (!match) return null;

  const isProvider = userRole === 'provider';
  const partner = isProvider ? match.customer : match.provider;
  const opp = match.opportunity;

  const cardTheme = highContrast
    ? 'border-2 border-white bg-black text-white'
    : 'border-cream-dark/50 bg-white text-charcoal shadow-sm hover:shadow-md transition-all';

  const status = match.status || 'PENDING';

  // Render Status Badge with correct label and icon
  const renderStatusBadge = () => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5 shrink-0">
            <Clock className="h-3.5 w-3.5 text-amber-700" />
            <span>Waiting for response</span>
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-300 flex items-center gap-1.5 shrink-0">
            <CheckCircle className="h-3.5 w-3.5 text-teal-600" />
            <span>Connected</span>
          </span>
        );
      case 'CONTACTED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1.5 shrink-0">
            <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
            <span>Contacted</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1.5 shrink-0">
            <X className="h-3.5 w-3.5 text-red-600" />
            <span>Declined</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-300 flex items-center gap-1.5 shrink-0">
            <Check className="h-3.5 w-3.5 text-gray-600" />
            <span>Completed</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-300 flex items-center gap-1.5 shrink-0">
            <Ban className="h-3.5 w-3.5 text-gray-500" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return null;
    }
  };

  // Render Status-Driven Action Buttons
  const renderActionButtons = () => {
    switch (status) {
      case 'PENDING':
        if (isProvider) {
          return (
            <div className="flex gap-2.5 w-full">
              <button
                onClick={() => onAccept && onAccept(match)}
                className={`grow py-2.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 ${
                  highContrast ? 'bg-white text-black' : 'bg-forest text-white hover:bg-forest-hover shadow-sm'
                }`}
              >
                <Check className="h-4 w-4" />
                <span>Accept</span>
              </button>
              <button
                onClick={() => onReject && onReject(match)}
                className="px-5 py-2.5 rounded-2xl text-xs font-extrabold border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                <span>Reject</span>
              </button>
            </div>
          );
        } else {
          return (
            <button
              disabled
              className="w-full py-2.5 rounded-2xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 cursor-not-allowed text-center"
            >
              Waiting for Provider
            </button>
          );
        }

      case 'ACCEPTED':
        return (
          <button
            onClick={() => onContact ? onContact(match) : onOpenChat && onOpenChat(match)}
            className="w-full py-2.5 rounded-2xl text-xs font-extrabold bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center justify-center gap-1.5 transition-all"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Contact / Chat</span>
          </button>
        );

      case 'CONTACTED':
        return (
          <div className="flex gap-2 w-full">
            <button
              onClick={() => onOpenChat && onOpenChat(match)}
              className="grow py-2.5 rounded-2xl text-xs font-extrabold bg-forest hover:bg-forest-hover text-white flex items-center justify-center gap-1.5 shadow-sm"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Open Chat</span>
            </button>
            {partner && onViewProfile && (
              <button
                onClick={() => onViewProfile(partner)}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold border border-cream-dark hover:bg-gray-100"
              >
                View Profile
              </button>
            )}
          </div>
        );

      case 'COMPLETED':
        return (
          <button
            disabled
            className="w-full py-2.5 rounded-2xl text-xs font-bold bg-gray-100 text-gray-500 cursor-not-allowed text-center"
          >
            Completed
          </button>
        );

      case 'REJECTED':
        return (
          <button
            disabled
            className="w-full py-2.5 rounded-2xl text-xs font-bold bg-gray-100 text-gray-400 cursor-not-allowed text-center"
          >
            Declined
          </button>
        );

      case 'CANCELLED':
        return (
          <button
            disabled
            className="w-full py-2.5 rounded-2xl text-xs font-bold bg-gray-100 text-gray-400 cursor-not-allowed text-center"
          >
            Cancelled
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`p-6 rounded-3xl border flex flex-col justify-between gap-4 ${cardTheme}`}>
      
      {/* 1. Header Row: Service Title, Category & Match Score */}
      <div className="flex justify-between items-start border-b pb-3 border-cream-dark/30 gap-2">
        <div>
          <span className="text-[10px] font-extrabold text-forest uppercase tracking-wider bg-forest/10 px-2 py-0.5 rounded">
            {opp?.category || 'Service'}
          </span>
          <h4 className="font-serif text-lg font-bold text-charcoal mt-1 leading-snug">
            {opp?.title || 'Service Opportunity'}
          </h4>
        </div>

        {/* Similarity Score Badge */}
        <div className={`px-2.5 py-1 rounded-xl text-xs font-extrabold text-white shrink-0 ${
          highContrast ? 'bg-black border border-white' : (isProvider ? 'bg-terracotta' : 'bg-forest')
        }`}>
          {match.score || 85}% Match
        </div>
      </div>

      {/* 2. Partner Info Row */}
      <div className="flex items-start gap-3">
        <div className={`h-12 w-12 rounded-full shrink-0 flex items-center justify-center font-serif text-xl font-bold ${
          highContrast ? 'bg-black border border-white text-white' : 'bg-orange-100 text-terracotta border border-orange-200'
        }`}>
          {partner?.name ? partner.name[0].toUpperCase() : (isProvider ? 'C' : 'P')}
        </div>

        <div className="grow text-left">
          <h5 className="font-bold text-base">{partner?.name || (isProvider ? 'Customer' : 'Provider')}</h5>
          {!isProvider && partner?.skills && partner.skills.length > 0 && (
            <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
              Skills: {partner.skills.map(s => typeof s === 'object' ? s.skillName : s).join(', ')}
            </p>
          )}
          {isProvider && opp?.description && (
            <p className="text-xs text-gray-500 line-clamp-2 italic mt-0.5">
              "{opp.description}"
            </p>
          )}
          <p className="text-xs text-gray-400 font-mono mt-1 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-gray-400" />
            <span>{partner?.city || opp?.city || 'Delhi'}</span>
          </p>
        </div>
      </div>

      {/* 3. Status Badge & Request Date */}
      <div className="flex items-center justify-between border-t pt-3 border-cream-dark/20 text-xs">
        <span className="text-gray-500 font-mono">
          Request Date: {new Date(match.createdAt).toLocaleDateString()}
        </span>
        {renderStatusBadge()}
      </div>

      {/* 4. Action Footer */}
      <div className="border-t pt-4 border-cream-dark/30">
        {renderActionButtons()}
      </div>

    </div>
  );
};

export default MatchCard;

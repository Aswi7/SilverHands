import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, 
  Phone, 
  Award, 
  Star, 
  AlertTriangle, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Info,
  ShieldAlert
} from 'lucide-react';

/* ==========================================================================
   1. VERIFICATION BADGE COMPONENT
   ========================================================================== */
export const VerificationBadge = ({ type, highContrast = false }) => {
  const { t } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);

  const badgeConfig = {
    phone: {
      label: t('safety.badge.phone'),
      tooltip: t('safety.badge.phone_tooltip'),
      icon: Phone,
      colorClass: highContrast 
        ? 'border border-white bg-black text-white' 
        : 'bg-teal-50 border border-teal-100 text-teal-800'
    },
    id: {
      label: t('safety.badge.id'),
      tooltip: t('safety.badge.id_tooltip'),
      icon: ShieldCheck,
      colorClass: highContrast 
        ? 'border border-white bg-black text-white' 
        : 'bg-orange-50 border border-orange-100 text-terracotta'
    },
    ID: {
      label: t('safety.badge.id'),
      tooltip: t('safety.badge.id_tooltip'),
      icon: ShieldCheck,
      colorClass: highContrast 
        ? 'border border-white bg-black text-white' 
        : 'bg-orange-50 border border-orange-100 text-terracotta'
    },
    community: {
      label: t('safety.badge.community'),
      tooltip: t('safety.badge.community_tooltip'),
      icon: Award,
      colorClass: highContrast 
        ? 'border border-white bg-black text-white' 
        : 'bg-amber-50 border border-amber-100 text-amber-900'
    },
    References: {
      label: t('safety.badge.references'),
      tooltip: t('safety.badge.references_tooltip'),
      icon: Award,
      colorClass: highContrast 
        ? 'border border-white bg-black text-white' 
        : 'bg-amber-50 border border-amber-100 text-amber-950'
    },
    Background: {
      label: t('safety.badge.background'),
      tooltip: t('safety.badge.background_tooltip'),
      icon: ShieldCheck,
      colorClass: highContrast 
        ? 'border border-white bg-black text-white' 
        : 'bg-teal-50 border border-teal-100 text-teal-800'
    },
    "Health Check": {
      label: t('safety.badge.health'),
      tooltip: t('safety.badge.health_tooltip'),
      icon: ShieldCheck,
      colorClass: highContrast 
        ? 'border border-white bg-black text-white' 
        : 'bg-emerald-50 border border-emerald-100 text-emerald-800'
    }
  };

  const config = badgeConfig[type] || badgeConfig.phone;
  const IconComponent = config.icon;

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
    >
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-sm ${config.colorClass}`}>
        <IconComponent className="h-3.5 w-3.5 shrink-0" />
        <span>{config.label}</span>
      </span>

      {showTooltip && (
        <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 rounded-lg text-xs shadow-lg z-50 text-left leading-normal animate-[fadeIn_0.15s_ease-out] ${
          highContrast ? 'bg-white text-black border-2 border-black font-bold' : 'bg-charcoal text-cream border border-charcoal-light'
        }`}>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2.5 h-2.5 rotate-45 bg-inherit border-inherit border-t-0 border-l-0"></div>
          {config.tooltip}
        </div>
      )}
    </div>
  );
};


/* ==========================================================================
   2. RATING & REVIEW COMPONENTS
   ========================================================================== */

// 5-Star Display
export const RatingDisplay = ({ rating, maxStars = 5 }) => {
  const filledStars = Math.round(rating);
  const starsArray = Array.from({ length: maxStars }, (_, i) => i < filledStars);

  return (
    <div className="flex items-center gap-1" aria-label={`Rating: ${rating} out of ${maxStars} stars`}>
      {starsArray.map((isFilled, idx) => (
        <Star 
          key={idx} 
          className={`h-4 w-4 ${
            isFilled 
              ? 'fill-terracotta text-terracotta' 
              : 'text-cream-dark/50'
          }`} 
        />
      ))}
      <span className="ml-1 text-sm font-bold text-charcoal">{rating}</span>
    </div>
  );
};

// Written Review Card
export const ReviewCard = ({ reviewerName, date, rating, text, highContrast = false }) => {
  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      highContrast 
        ? 'border-white bg-black text-white' 
        : 'bg-white border-cream-dark/50 shadow-sm hover:shadow-md'
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream-dark/20 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
            highContrast ? 'bg-white text-black border border-black' : 'bg-forest/10 text-forest'
          }`}>
            {reviewerName ? reviewerName[0] : 'U'}
          </div>
          <div>
            <h4 className="font-bold text-sm text-left">{reviewerName}</h4>
            <p className="text-xs text-charcoal-light text-left">{date}</p>
          </div>
        </div>
        <RatingDisplay rating={rating} />
      </div>
      <p className="text-sm leading-relaxed text-left text-charcoal-light">{text}</p>
    </div>
  );
};

// Submit Review Form
export const SubmitReviewForm = ({ onSubmit, highContrast = false }) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert(t('safety.review.tap_to_rate'));
      return;
    }
    if (onSubmit) {
      onSubmit({ rating, comment, date: new Date().toLocaleDateString() });
    }
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setRating(0);
      setComment('');
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="p-6 text-center rounded-2xl bg-teal-50 border border-teal-100 text-teal-900 animate-pulse">
        <h4 className="font-serif text-lg font-bold">{t('safety.review.review_submitted')}</h4>
        <p className="text-xs mt-1">{t('safety.review.review_thanks')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`p-5 rounded-2xl border flex flex-col gap-4 text-left ${
      highContrast ? 'border-white bg-black text-white' : 'bg-cream/40 border-cream-dark/50 shadow-inner'
    }`}>
      <h3 className="font-serif text-lg font-bold">{t('safety.review.share_experience')}</h3>
      
      {/* Star Selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-charcoal-light">{t('safety.review.tap_to_rate')}</label>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 rounded transition-all focus:ring-2 focus:ring-terracotta"
              aria-label={`Rate ${star} stars`}
            >
              <Star 
                className={`h-7 w-7 transition-colors ${
                  star <= (hoverRating || rating)
                    ? 'fill-terracotta text-terracotta scale-110' 
                    : 'text-cream-dark'
                }`} 
              />
            </button>
          ))}
          <span className="ml-2 text-sm font-bold">{rating ? `${rating} Stars` : ''}</span>
        </div>
      </div>

      {/* Review Textarea */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="review-text" className="text-xs font-bold text-charcoal-light">{t('safety.review.written_comments')}</label>
        <textarea
          id="review-text"
          rows="3"
          placeholder={t('safety.review.comment_placeholder')}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className={`w-full p-3 rounded-xl border text-sm focus:outline-none transition-all ${
            highContrast 
              ? 'bg-black text-white border-white focus:border-yellow-400' 
              : 'bg-white border-cream-dark focus:border-terracotta focus:ring-1 focus:ring-terracotta'
          }`}
          minLength="5"
          required
        ></textarea>
      </div>

      <button
        type="submit"
        className={`h-[48px] px-6 rounded-xl font-bold transition-all text-sm shadow-sm hover:shadow ${
          highContrast
            ? 'border border-white bg-black text-white hover:bg-white hover:text-black'
            : 'bg-forest hover:bg-forest-hover text-white'
        }`}
      >
        {t('safety.review.submit_review')}
      </button>
    </form>
  );
};


/* ==========================================================================
   3. AI SCAM ALERT BANNER
   ========================================================================== */
export const ScamAlertBanner = ({ message, onLearnMore, onReport, highContrast = false }) => {
  const { t } = useTranslation();
  return (
    <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left shadow-sm ${
      highContrast 
        ? 'border-yellow-400 bg-black text-yellow-400 font-bold' 
        : 'bg-orange-50 border-orange-200 text-charcoal'
    }`}>
      <div className="flex gap-3 items-start">
        <div className={`p-2 rounded-xl shrink-0 ${highContrast ? 'bg-yellow-400 text-black' : 'bg-orange-100 text-terracotta'}`}>
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold">{t('safety.scam.alert_title')}</h4>
          <p className="text-xs text-charcoal-light leading-relaxed mt-0.5">{message}</p>
        </div>
      </div>
      
      <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
        <button
          onClick={onLearnMore}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            highContrast 
              ? 'border border-yellow-400 hover:bg-yellow-400 hover:text-black' 
              : 'border border-cream-dark/50 hover:bg-cream-dark/20 text-charcoal-light'
          }`}
        >
          {t('safety.scam.learn_why')}
        </button>
        <button
          onClick={onReport}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            highContrast 
              ? 'bg-yellow-400 text-black border border-black hover:bg-yellow-300' 
              : 'bg-terracotta hover:bg-terracotta-hover text-white'
          }`}
        >
          {t('safety.scam.report_conv')}
        </button>
      </div>
    </div>
  );
};


/* ==========================================================================
   4. REPORT OR BLOCK MODAL
   ========================================================================== */
export const ReportBlockModal = ({ isOpen, onClose, onSubmit, targetName = "this user", highContrast = false }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');

  if (!isOpen) return null;

  const reasons = [
    { value: 'spam', label: t('safety.report.reason_spam') },
    { value: 'inappropriate', label: t('safety.report.reason_harassment') },
    { value: 'suspicious', label: t('safety.report.reason_suspicious') },
    { value: 'impersonation', label: t('safety.report.reason_impersonation') },
    { value: 'other', label: t('safety.report.reason_other') }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({ reason, details });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl animate-[slideUp_0.25s_ease-out] border ${
        highContrast ? 'bg-black text-white border-white' : 'bg-white border-cream-dark'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h3 className="font-serif text-xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-terracotta" />
            {t('safety.report.modal_title')}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-cream-dark/30 transition-colors"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <p className="text-sm leading-relaxed text-charcoal-light">
            {t('safety.report.modal_desc', { targetName })}
          </p>

          {/* Radio list */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-bold text-charcoal-light">{t('safety.report.select_reason')}</label>
            {reasons.map((r) => (
              <label 
                key={r.value} 
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  reason === r.value 
                    ? (highContrast ? 'border-white bg-white/20' : 'bg-orange-50/50 border-terracotta text-terracotta font-semibold')
                    : (highContrast ? 'border-white/40' : 'border-cream-dark/30 hover:bg-cream-dark/10')
                }`}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="accent-terracotta h-4 w-4"
                />
                <span className="text-sm">{r.label}</span>
              </label>
            ))}
          </div>

          {/* Details input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="report-details" className="text-xs font-bold text-charcoal-light">{t('safety.report.additional_details')}</label>
            <textarea
              id="report-details"
              rows="2"
              placeholder={t('safety.report.details_placeholder')}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className={`w-full p-3 rounded-xl border text-sm focus:outline-none transition-all ${
                highContrast 
                  ? 'bg-black text-white border-white focus:border-yellow-400' 
                  : 'bg-white border-cream-dark focus:border-terracotta focus:ring-1 focus:ring-terracotta'
              }`}
            ></textarea>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end mt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                highContrast ? 'border-white hover:bg-white hover:text-black' : 'border-cream-dark hover:bg-cream-dark/30'
              }`}
            >
              {t('safety.report.cancel')}
            </button>
            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md ${
                highContrast 
                  ? 'bg-white text-black border border-black hover:bg-yellow-400' 
                  : 'bg-terracotta hover:bg-terracotta-hover text-white'
              }`}
            >
              {t('safety.report.submit_block')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


/* ==========================================================================
   5. SAFETY TIPS CARD
   ========================================================================== */
export const SafetyTipsCard = ({ highContrast = false }) => {
  const { t } = useTranslation();
  const [currentTip, setCurrentTip] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  const safetyTips = [
    {
      title: t('safety.tips.tip1_title'),
      text: t('safety.tips.tip1_text')
    },
    {
      title: t('safety.tips.tip2_title'),
      text: t('safety.tips.tip2_text')
    },
    {
      title: t('safety.tips.tip3_title'),
      text: t('safety.tips.tip3_text')
    },
    {
      title: t('safety.tips.tip4_title'),
      text: t('safety.tips.tip4_text')
    }
  ];

  const handleNext = () => {
    setCurrentTip((prev) => (prev + 1) % safetyTips.length);
  };

  const handlePrev = () => {
    setCurrentTip((prev) => (prev - 1 + safetyTips.length) % safetyTips.length);
  };

  if (dismissed) return null;

  return (
    <div className={`p-5 rounded-3xl border flex flex-col gap-4 text-left shadow-sm relative transition-all animate-[fadeIn_0.3s_ease-out] ${
      highContrast 
        ? 'border-white bg-black text-white' 
        : 'bg-gradient-to-br from-teal-50/50 via-cream/30 to-amber-50/40 border-cream-dark'
    }`}>
      {/* Dismiss Button */}
      <button 
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-cream-dark/30 transition-colors"
        aria-label="Dismiss safety tips"
      >
        <X className="h-4 w-4 text-charcoal-light" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${highContrast ? 'bg-white text-black' : 'bg-forest/10 text-forest'}`}>
          <Info className="h-4 w-4" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-forest">{t('safety.tips.center_title')}</span>
      </div>

      {/* Tip Content */}
      <div className="min-h-[90px] flex flex-col justify-center">
        <h4 className="font-serif text-base font-bold">{safetyTips[currentTip].title}</h4>
        <p className={`text-xs mt-1.5 leading-relaxed ${highContrast ? 'text-gray-300' : 'text-charcoal-light'}`}>
          {safetyTips[currentTip].text}
        </p>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between border-t border-cream-dark/20 pt-3 mt-1">
        <span className="text-[10px] font-bold text-charcoal-light">
          {t('safety.tips.tip_progress', { current: currentTip + 1, total: safetyTips.length })}
        </span>
        
        <div className="flex gap-1.5">
          <button 
            onClick={handlePrev}
            className={`p-1.5 rounded-lg border transition-all ${
              highContrast ? 'border-white hover:bg-white hover:text-black' : 'border-cream-dark/50 hover:bg-cream-dark/30'
            }`}
            aria-label="Previous safety tip"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={handleNext}
            className={`p-1.5 rounded-lg border transition-all ${
              highContrast ? 'border-white hover:bg-white hover:text-black' : 'border-cream-dark/50 hover:bg-cream-dark/30'
            }`}
            aria-label="Next safety tip"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

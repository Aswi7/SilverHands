import React from 'react';
import { Check } from 'lucide-react';

const STAGES = [
  { id: 'APPLIED', label: 'Applied' },
  { id: 'ACCEPTED', label: 'Accepted' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'COMPLETED', label: 'Completed' }
];

const getStageIndex = (status) => {
  const norm = (status || '').toUpperCase();
  if (norm === 'COMPLETED') return 3;
  if (norm === 'CONFIRMED') return 2;
  if (norm === 'ACCEPTED' || norm === 'CONTACTED') return 1;
  // APPLIED or PENDING or default
  return 0;
};

const ApplicationStepper = ({ status, highContrast = false }) => {
  const currentIndex = getStageIndex(status);
  const isTerminalOther = status === 'REJECTED' || status === 'CANCELLED';

  if (isTerminalOther) {
    return (
      <div className="py-2 px-4 rounded-xl bg-gray-100 border border-gray-200 text-xs text-gray-600 font-bold inline-block">
        Status: <span className="capitalize">{status ? status.toLowerCase() : 'Ended'}</span>
      </div>
    );
  }

  return (
    <div className="w-full py-4 px-2">
      <div className="flex items-center justify-between relative">
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex || (idx === 3 && currentIndex === 3);
          const isCurrent = idx === currentIndex && currentIndex !== 3;
          const isFuture = idx > currentIndex;

          return (
            <React.Fragment key={stage.id}>
              {/* Connector line before circle (from 2nd stage onwards) */}
              {idx > 0 && (
                <div
                  className={`grow h-1 transition-colors duration-300 mx-1 rounded ${
                    idx <= currentIndex
                      ? 'bg-teal-500'
                      : 'bg-gray-200'
                  }`}
                />
              )}

              {/* Step Circle & Label Container */}
              <div className="flex flex-col items-center relative z-10 shrink-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    isCompleted
                      ? 'bg-teal-600 text-white border-2 border-teal-600 shadow-sm'
                      : isCurrent
                      ? highContrast
                        ? 'bg-white text-black border-2 border-white ring-4 ring-gray-600'
                        : 'bg-terracotta text-white border-2 border-terracotta ring-4 ring-orange-100 scale-110 shadow-md'
                      : 'bg-gray-100 text-gray-400 border-2 border-gray-300'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 stroke-[3]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={`text-xs mt-2 font-bold transition-colors ${
                    isCompleted
                      ? 'text-teal-800'
                      : isCurrent
                      ? 'text-terracotta font-extrabold text-sm'
                      : 'text-gray-400'
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ApplicationStepper;

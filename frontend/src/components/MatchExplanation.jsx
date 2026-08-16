import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import api from '../services/api';

export const MatchExplanation = ({ opp, highContrast }) => {
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Intersection Observer to lazily load the explanation when the card becomes visible
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !hasFetched && !isLoading) {
        fetchExplanation();
      }
    }, { threshold: 0.1 });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [hasFetched, isLoading]);

  const fetchExplanation = async () => {
    setIsLoading(true);
    setHasFetched(true);
    try {
      const { data } = await api.post('/ai/explain-match', {
        skillOverlap: opp.score,
        distance: opp.distance || 'nearby',
        availabilityOverlap: true // Defaulted for MVP
      });
      if (data && data.explanation) {
        setExplanation(data.explanation);
      } else {
        setExplanation(opp.rationale);
      }
    } catch (error) {
      console.error('Failed to fetch AI explanation:', error);
      setExplanation(opp.rationale); // Fallback to original rationale
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`p-3 rounded-xl border border-dashed flex items-start gap-2 ${
        highContrast ? 'border-white bg-black' : 'bg-amber-50/50 border-amber-200 text-charcoal'
      }`}
    >
      <Sparkles className={`h-4 w-4 shrink-0 text-terracotta mt-0.5 ${isLoading ? 'animate-pulse' : ''}`} />
      <p className="text-xs font-semibold leading-relaxed">
        {isLoading ? "Generating match explanation..." : `"${explanation || opp.rationale}"`}
      </p>
    </div>
  );
};

import React, { useState } from 'react';
import { EVENT_CONFIG } from '../../shared/eventConfig.js';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FaqPageProps {
  setActiveTab: (tab: string) => void;
}

export const FaqPage: React.FC<FaqPageProps> = ({ setActiveTab }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Title */}
      <div className="bg-[#FFFDF0] border-4 border-[#111827] shadow-[6px_6px_0_0_#111827] p-6 sm:p-8">
        <span className="bg-[#F4C430] text-[#111827] font-pixel text-xs px-3 py-1 border-2 border-[#111827] font-bold">
          HELP & INQUIRIES
        </span>
        <h1 className="font-pixel text-2xl sm:text-4xl text-[#111827] mt-3 tracking-wider">
          FREQUENTLY ASKED QUESTIONS
        </h1>
        <p className="text-sm font-body text-[#111827]/80 mt-2">
          Everything you need to know about team registration, student validation, ID card uploads, and match rules.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {EVENT_CONFIG.faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="bg-[#FFFDF0] border-3 border-[#111827] shadow-[4px_4px_0_0_#111827] overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 bg-[#FFFDF0] hover:bg-[#F7E8B5] transition-colors"
              >
                <span className="font-arcade text-xs sm:text-sm font-bold text-[#111827] flex items-center gap-2">
                  <span className="font-pixel text-[10px] text-[#E5005A]">Q{idx + 1}.</span>
                  {faq.q}
                </span>
                <span className="shrink-0 p-1 border-2 border-[#111827] bg-[#F7E8B5]">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>
              {isOpen && (
                <div className="px-5 py-4 border-t-2 border-[#111827] bg-[#F7E8B5]/50 text-xs sm:text-sm font-body text-[#111827]/90 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Need more help card */}
      <div className="p-6 bg-[#00AFC6] text-[#111827] border-4 border-[#111827] shadow-[5px_5px_0_0_#111827] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-pixel text-sm sm:text-base">STILL HAVE QUESTIONS?</h3>
          <p className="font-body text-xs mt-1">
            Visit the AI Developers Group (ADG) desk at SFIT or contact us in Room 318.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('register')}
          className="bg-[#111827] text-white font-arcade text-xs px-6 py-3 border-2 border-[#111827] shadow-[3px_3px_0_0_#FFF] shrink-0"
        >
          GO TO REGISTRATION &gt;
        </button>
      </div>
    </div>
  );
};

export default FaqPage;

import React from 'react';
import { EVENT_CONFIG } from '../../shared/eventConfig.js';
import { ShieldCheck, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface RulesPageProps {
  setActiveTab: (tab: string) => void;
}

export const RulesPage: React.FC<RulesPageProps> = ({ setActiveTab }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Title */}
      <div className="bg-[#FFFDF0] border-4 border-[#111827] shadow-[6px_6px_0_0_#111827] p-6 sm:p-8">
        <span className="bg-[#E5005A] text-white font-pixel text-xs px-3 py-1 border-2 border-[#111827]">
          OFFICIAL DIRECTIVES
        </span>
        <h1 className="font-pixel text-2xl sm:text-4xl text-[#111827] mt-3 tracking-wider">
          RULES & CODE OF CONDUCT
        </h1>
        <p className="text-sm font-body text-[#111827]/80 mt-2">
          Strict adherence to tournament rules ensures a competitive, exhilarating, and fair mystery experience in Room 318.
        </p>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {EVENT_CONFIG.rules.map((rule, idx) => (
          <div
            key={idx}
            className="bg-[#FFFDF0] border-3 border-[#111827] shadow-[4px_4px_0_0_#111827] p-5 flex items-start gap-4"
          >
            <div className="w-10 h-10 bg-[#00AFC6] border-2 border-[#111827] flex items-center justify-center font-pixel text-xs text-white shrink-0 shadow-[2px_2px_0_0_#111827]">
              0{idx + 1}
            </div>
            <div className="space-y-1">
              <h3 className="font-arcade text-sm font-bold uppercase tracking-wider text-[#111827]">
                {rule.category}
              </h3>
              <p className="text-xs sm:text-sm font-body text-[#111827]/90 leading-relaxed">
                {rule.rule}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Disqualification Warning */}
      <div className="bg-[#E5005A] text-white border-4 border-[#111827] shadow-[6px_6px_0_0_#111827] p-6 space-y-3">
        <div className="flex items-center gap-2">
          <AlertOctagon className="w-6 h-6 text-[#F4C430]" />
          <h3 className="font-pixel text-base sm:text-lg">ZERO-TOLERANCE OFFENSES</h3>
        </div>
        <p className="text-xs sm:text-sm font-body leading-relaxed text-[#FFFDF0]">
          Any ghosting, non-SFIT proxy attendance, physical intimidation, or using external smartphones during task execution without proctor permission will result in immediate team expulsion and forfeiture of registration fees.
        </p>
      </div>

      <div className="text-center pt-2">
        <button
          onClick={() => setActiveTab('register')}
          className="bg-[#111827] text-white font-arcade text-xs sm:text-sm px-8 py-3.5 border-3 border-[#111827] shadow-[4px_4px_0_0_#E5005A] hover:bg-[#E5005A] transition-colors"
        >
          I UNDERSTAND • REGISTER SQUAD (5–6 PLAYERS)
        </button>
      </div>
    </div>
  );
};

export default RulesPage;

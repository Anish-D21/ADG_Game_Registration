import React from 'react';
import { EVENT_CONFIG } from '../../shared/eventConfig.js';
import { Search, Eye, UserX, Vote, Clock, MapPin, Award, AlertCircle } from 'lucide-react';

interface GameInfoPageProps {
  setActiveTab: (tab: string) => void;
}

export const GameInfoPage: React.FC<GameInfoPageProps> = ({ setActiveTab }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
      {/* Header */}
      <div className="bg-[#FFFDF0] border-4 border-[#111827] shadow-[6px_6px_0_0_#111827] p-6 sm:p-8">
        <span className="bg-[#00AFC6] text-white font-pixel text-xs px-3 py-1 border-2 border-[#111827]">
          GAME OVERVIEW
        </span>
        <h1 className="font-pixel text-3xl sm:text-4xl text-[#111827] mt-3 tracking-wider">
          HOW DECEPTION WORKS
        </h1>
        <p className="text-sm sm:text-base font-body text-[#111827]/80 mt-2 max-w-3xl">
          Inspired by Among Us and social deduction mystery games, DECEPTION transforms SFIT Room No. 318 into a high-octane live-action arena where analytical thinking, deception, and deduction collide.
        </p>
      </div>

      {/* The 4 Core Gameplay Phases */}
      <div className="space-y-6">
        <h2 className="font-arcade text-2xl text-[#111827] font-bold border-b-3 border-[#111827] pb-2">
          THE 4 PHASES OF PLAY
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {EVENT_CONFIG.fourPillars.map((pillar) => (
            <div
              key={pillar.id}
              className="bg-[#FFFDF0] border-4 border-[#111827] shadow-[5px_5px_0_0_#111827] p-6 space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="font-pixel text-2xl text-[#111827]/20 font-bold">
                  {pillar.number}
                </span>
                <span
                  className="font-pixel text-xs px-3 py-1 text-white border-2 border-[#111827]"
                  style={{ backgroundColor: pillar.color }}
                >
                  {pillar.subtitle}
                </span>
              </div>
              <h3 className="font-pixel text-base text-[#111827] tracking-wider">
                {pillar.title}
              </h3>
              <p className="text-xs sm:text-sm font-body text-[#111827]/90 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Secret Roles Explained */}
      <div className="bg-[#111827] text-white border-4 border-[#111827] shadow-[6px_6px_0_0_#E5005A] p-6 sm:p-8 space-y-6">
        <h2 className="font-pixel text-xl sm:text-2xl text-[#F7E8B5]">
          ROLE ALLOCATION & OBJECTIVES
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Crewmate Card */}
          <div className="bg-[#1F2937] border-2 border-white p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-[#00AFC6] rounded-full border border-white"></span>
              <h3 className="font-arcade text-lg text-[#00AFC6] font-bold">THE CREWMATE</h3>
            </div>
            <ul className="text-xs space-y-2 text-gray-300 font-body">
              <li>• Complete all engineering & physical task cards in Room 318.</li>
              <li>• Watch fellow team members for fake task actions.</li>
              <li>• Call emergency meetings if sabotage or abnormal behavior is spotted.</li>
              <li>• <strong>WIN CONDITION:</strong> Complete the group task bar or successfully vote out the imposter.</li>
            </ul>
          </div>

          {/* Imposter Card */}
          <div className="bg-[#1F2937] border-2 border-[#E5005A] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-[#E5005A] rounded-full border border-white animate-pulse"></span>
              <h3 className="font-arcade text-lg text-[#E5005A] font-bold">THE IMPOSTER</h3>
            </div>
            <ul className="text-xs space-y-2 text-gray-300 font-body">
              <li>• Secretly blend in, pretend to perform lab tasks, and fabricate alibis.</li>
              <li>• Sabotage stations and covertly tap or eliminate crewmates.</li>
              <li>• Deflect suspicion during emergency meeting deliberations.</li>
              <li>• <strong>WIN CONDITION:</strong> Cause total sabotage or eliminate enough crewmates before discovery.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Schedule and Venue */}
      <div className="bg-[#FFFDF0] border-4 border-[#111827] shadow-[6px_6px_0_0_#111827] p-6 sm:p-8 space-y-4">
        <h2 className="font-arcade text-xl sm:text-2xl text-[#111827] font-bold flex items-center gap-2">
          <Clock className="w-6 h-6 text-[#E5005A]" />
          EVENT TIMELINE (16–17 OCT 2026)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-[#F7E8B5] border-2 border-[#111827]">
            <h4 className="font-pixel text-xs text-[#E5005A]">DAY 1 • 16 OCTOBER</h4>
            <p className="text-xs font-arcade mt-1 text-[#111827]">Rounds 1 to 3 & Preliminary Trials</p>
            <p className="text-xs text-[#111827]/80 mt-1 font-body">
              Squad check-ins start at 09:30 AM in Room 318. Initial task station orientation and secret role assignment.
            </p>
          </div>
          <div className="p-4 bg-[#F7E8B5] border-2 border-[#111827]">
            <h4 className="font-pixel text-xs text-[#00AFC6]">DAY 2 • 17 OCTOBER</h4>
            <p className="text-xs font-arcade mt-1 text-[#111827]">Championship Matches & Finals</p>
            <p className="text-xs text-[#111827]/80 mt-1 font-body">
              Top surviving squads face high-difficulty multi-room sabotage. Award ceremony for the ultimate detectives and imposters.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="text-center pt-4">
        <button
          onClick={() => setActiveTab('register')}
          className="bg-[#E5005A] text-white font-arcade text-sm px-8 py-3.5 border-3 border-[#111827] shadow-[4px_4px_0_0_#111827] hover:bg-[#111827] transition-colors"
        >
          READY TO PLAY? REGISTER SQUAD (5–6 PLAYERS)
        </button>
      </div>
    </div>
  );
};

export default GameInfoPage;

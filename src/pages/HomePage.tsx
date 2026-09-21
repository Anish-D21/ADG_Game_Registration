import React from 'react';
import { AmongUsIllustration } from '../components/AmongUsIllustration.tsx';
import { EVENT_CONFIG } from '../../shared/eventConfig.js';
import { ShieldAlert, Users, Calendar, MapPin, CheckCircle, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';

interface HomePageProps {
  setActiveTab: (tab: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ setActiveTab }) => {
  return (
    <div className="space-y-8 sm:space-y-16 pb-8 sm:pb-12">
      {/* Hero Section with Poster Artwork & 4 Steps */}
      <section className="pt-2 sm:pt-8">
        <AmongUsIllustration 
          onRegisterClick={() => setActiveTab('register')}
          onExploreClick={() => setActiveTab('game')}
        />
      </section>

      {/* Critical Event Badges Grid */}
      <section className="max-w-6xl mx-auto px-3 sm:px-4">
        <div className="bg-[#FFFDF0] border-3 sm:border-4 border-[#111827] shadow-[4px_4px_0_0_#111827] sm:shadow-[6px_6px_0_0_#111827] p-4 sm:p-8">
          <div className="border-b-2 sm:border-b-3 border-[#111827] pb-3 sm:pb-4 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] sm:text-[11px] font-pixel text-[#E5005A] uppercase">MISSION BRIEFING</span>
              <h2 className="font-arcade text-xl sm:text-3xl text-[#111827] font-bold">
                ABOUT DECEPTION 2026
              </h2>
            </div>
            <span className="bg-[#F4C430] border-2 border-[#111827] text-[#111827] font-pixel text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 shadow-[2px_2px_0_0_#111827] self-start sm:self-auto">
              ROOM 318 ACCESS ONLY
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Box 1: Team Composition */}
            <div className="border-2 sm:border-3 border-[#111827] p-4 sm:p-5 bg-[#F7E8B5] shadow-[2px_2px_0_0_#111827] sm:shadow-[3px_3px_0_0_#111827]">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#E5005A]" />
                <h3 className="font-arcade text-sm sm:text-base font-bold text-[#111827]">Strict Squad Size</h3>
              </div>
              <p className="text-xs sm:text-sm font-body text-[#111827] leading-relaxed">
                Teams must contain <strong className="bg-[#E5005A] text-white px-1 font-arcade">strictly 5 or 6 players</strong>. No solo entries, no squads under 5 or over 6.
              </p>
            </div>

            {/* Box 2: SFIT Domain */}
            <div className="border-2 sm:border-3 border-[#111827] p-4 sm:p-5 bg-[#F7E8B5] shadow-[2px_2px_0_0_#111827] sm:shadow-[3px_3px_0_0_#111827]">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-[#00AFC6]" />
                <h3 className="font-arcade text-sm sm:text-base font-bold text-[#111827]">SFIT Verification</h3>
              </div>
              <p className="text-xs sm:text-sm font-body text-[#111827] leading-relaxed">
                All participants must register using their official college email ending in <strong className="font-mono bg-[#111827] text-[#00AFC6] px-1 break-all">@student.sfit.ac.in</strong>.
              </p>
            </div>

            {/* Box 3: Fee & Pass */}
            <div className="border-2 sm:border-3 border-[#111827] p-4 sm:p-5 bg-[#F7E8B5] shadow-[2px_2px_0_0_#111827] sm:shadow-[3px_3px_0_0_#111827]">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[#4CAF50]" />
                <h3 className="font-arcade text-sm sm:text-base font-bold text-[#111827]">Entry Pass & QR</h3>
              </div>
              <p className="text-xs sm:text-sm font-body text-[#111827] leading-relaxed">
                Registration is <strong className="font-bold">₹500 / team</strong>. Official printable PDF pass with cryptographic QR code is issued immediately upon verified payment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How The Mystery Works Teaser */}
      <section className="max-w-6xl mx-auto px-3 sm:px-4">
        <div className="bg-[#111827] text-white p-5 sm:p-8 border-3 sm:border-4 border-[#111827] shadow-[4px_4px_0_0_#E5005A] sm:shadow-[6px_6px_0_0_#E5005A]">
          <div className="max-w-3xl space-y-3 sm:space-y-4">
            <span className="bg-[#E5005A] text-white font-pixel text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 border border-white inline-block">
              INVESTIGATION PROTOCOL
            </span>
            <h3 className="font-pixel text-lg sm:text-2xl text-[#F7E8B5] tracking-wider leading-snug">
              ONE SQUAD. SECRET ROLES. ROOM NO. 318.
            </h3>
            <p className="font-body text-gray-300 text-xs sm:text-base leading-relaxed">
              When your team enters Room 318 on 16 or 17 October, roles will be secretly assigned by our game master system. Most of you are Crewmates working frantically on engineering lab tasks. But one among you is a Saboteur programmed to cause disruption without getting caught.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => setActiveTab('game')}
                className="w-full sm:w-auto bg-[#00AFC6] text-[#111827] font-arcade text-xs sm:text-sm px-4 sm:px-5 py-2.5 border-2 border-white shadow-[2px_2px_0_0_#FFF] sm:shadow-[3px_3px_0_0_#FFF] hover:bg-white transition-all flex items-center justify-center gap-2"
              >
                <span>LEARN GAME MECHANICS</span> <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                className="w-full sm:w-auto bg-[#F4C430] text-[#111827] font-arcade text-xs sm:text-sm px-4 sm:px-5 py-2.5 border-2 border-white shadow-[2px_2px_0_0_#FFF] sm:shadow-[3px_3px_0_0_#FFF] hover:bg-white transition-all flex items-center justify-center gap-2"
              >
                READ CODE OF CONDUCT
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Rules Preview Banner */}
      <section className="max-w-6xl mx-auto px-3 sm:px-4">
        <div className="bg-[#FFFDF0] border-3 sm:border-4 border-[#111827] shadow-[4px_4px_0_0_#111827] sm:shadow-[6px_6px_0_0_#111827] p-4 sm:p-8">
          <div className="flex items-center justify-between border-b-2 border-[#111827] pb-3 mb-4 sm:mb-6">
            <h3 className="font-arcade text-lg sm:text-2xl text-[#111827] font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-[#E5005A]" />
              CORE RULES PREVIEW
            </h3>
            <button 
              onClick={() => setActiveTab('rules')}
              className="text-xs font-arcade text-[#00AFC6] hover:underline"
            >
              VIEW ALL RULES &gt;
            </button>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {EVENT_CONFIG.rules.slice(0, 4).map((r, i) => (
              <div key={i} className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 bg-[#F7E8B5] border-2 border-[#111827]">
                <span className="font-pixel text-[10px] sm:text-xs text-[#E5005A] mt-0.5 shrink-0">0{i + 1}</span>
                <div>
                  <strong className="font-arcade text-xs uppercase tracking-wider block text-[#111827]">
                    {r.category}
                  </strong>
                  <p className="text-xs font-body text-[#111827]/90 mt-0.5 leading-relaxed">{r.rule}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Big CTA */}
      <section className="max-w-6xl mx-auto px-3 sm:px-4 text-center">
        <div className="bg-[#E5005A] text-white border-3 sm:border-4 border-[#111827] shadow-[5px_5px_0_0_#111827] sm:shadow-[8px_8px_0_0_#111827] p-6 sm:p-12 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-3 sm:space-y-4">
            <span className="inline-block bg-[#F4C430] text-[#111827] font-pixel text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827]">
              LIMITED SLOTS AVAILABLE
            </span>
            <h3 className="font-pixel text-xl sm:text-4xl tracking-wider text-white">
              ASSEMBLE YOUR SQUAD NOW
            </h3>
            <p className="font-body text-xs sm:text-base text-[#FFFDF0]">
              Gather your 5 to 6 SFIT teammates, have your college IDs ready, and secure your slot for DECEPTION in Room 318.
            </p>
            <div className="pt-3 sm:pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <button
                onClick={() => setActiveTab('register')}
                className="w-full sm:w-auto bg-[#111827] text-white font-arcade text-xs sm:text-base px-6 sm:px-8 py-3.5 border-2 sm:border-3 border-white shadow-[3px_3px_0_0_#FFF] sm:shadow-[4px_4px_0_0_#FFF] hover:bg-[#00AFC6] hover:text-[#111827] transition-all"
              >
                START REGISTRATION
              </button>
              <button
                onClick={() => setActiveTab('status')}
                className="w-full sm:w-auto bg-[#FFFDF0] text-[#111827] font-arcade text-xs sm:text-base px-5 sm:px-6 py-3.5 border-2 border-[#111827] shadow-[3px_3px_0_0_#111827] sm:shadow-[4px_4px_0_0_#111827] hover:bg-[#F4C430] transition-all"
              >
                CHECK EXISTING REGISTRATION
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

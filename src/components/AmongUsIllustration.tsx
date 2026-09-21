import React from 'react';
import { Search, Eye, UserX, Vote, Sparkles } from 'lucide-react';
import { EVENT_CONFIG } from '../../shared/eventConfig.js';

interface IllustrationProps {
  onRegisterClick?: () => void;
  onExploreClick?: () => void;
}

export const AmongUsIllustration: React.FC<IllustrationProps> = ({ onRegisterClick, onExploreClick }) => {
  return (
    <div className="w-full relative select-none">
      {/* ---------------------------------------------------- */}
      {/* 1. HERO BANNER TITLE & BADGES (DIRECTLY FROM POSTER) */}
      {/* ---------------------------------------------------- */}
      <div className="text-center space-y-3 mb-6">
        {/* Organizer Header */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FFFDF0] border-2 border-[#111827] shadow-[2px_2px_0_0_#111827]">
          <span className="w-2 h-2 rounded-full bg-[#E5005A] animate-ping"></span>
          <span className="font-arcade text-xs sm:text-sm text-[#111827] font-bold tracking-wider">
            AI DEVELOPERS GROUP PRESENTS
          </span>
        </div>

        {/* Big Stylized Retro Title D E C E P T I O N */}
        <div className="relative py-2">
          {/* Floating poster ribbons on sides */}
          <div className="hidden lg:block absolute left-2 top-0 transform -rotate-12 bg-[#00AFC6] text-white font-arcade text-xs px-3 py-2 border-2 border-[#111827] shadow-[3px_3px_0_0_#111827] max-w-[130px] text-center">
            ONE OF YOU ISN'T WHO THEY SEEM..
          </div>

          <div className="hidden lg:block absolute right-4 top-2 transform rotate-6">
            <div className="w-10 h-10 text-[#F4C430] filter drop-shadow-[2px_2px_0px_#111827]">
              👑
            </div>
          </div>

          <h1 className="font-pixel text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-widest text-[#E5005A] drop-shadow-[4px_4px_0px_#111827] uppercase">
            DECEPTION
          </h1>
        </div>

        {/* Date & Collaboration Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-1">
          <span className="bg-[#00AFC6] text-white font-pixel text-xs sm:text-sm px-4 py-2 border-3 border-[#111827] shadow-[3px_3px_0_0_#111827]">
            {EVENT_CONFIG.eventDateDisplay}
          </span>
          <span className="bg-[#FFFDF0] text-[#111827] font-arcade text-xs sm:text-sm px-3 py-1.5 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827]">
            <span className="text-[#4CAF50] font-bold">ADG</span> x <span className="text-[#E5005A] font-bold">MosAIC</span>
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. THE AMONG US MEETING TABLE (VECTOR SVG ILLUSTRATION) */}
      {/* ---------------------------------------------------- */}
      <div className="relative max-w-4xl mx-auto my-6 px-2">
        <svg
          viewBox="0 0 900 480"
          className="w-full h-auto filter drop-shadow-[4px_6px_0px_rgba(17,24,39,0.9)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Table Radial Gradient */}
            <radialGradient id="tableGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00C4DF" />
              <stop offset="60%" stopColor="#008EA2" />
              <stop offset="100%" stopColor="#005B69" />
            </radialGradient>
            <filter id="retroShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="3" dy="3" stdDeviation="0" floodColor="#111827" />
            </filter>
          </defs>

          {/* BACKGROUND AMONG US CHARACTERS AROUND TABLE */}

          {/* Player 1: Green Camo / Military on far left */}
          <g transform="translate(60, 150)">
            <ellipse cx="40" cy="90" rx="36" ry="60" fill="#7CB342" stroke="#111827" strokeWidth="5" />
            <ellipse cx="60" cy="70" rx="22" ry="14" fill="#B2EBF2" stroke="#111827" strokeWidth="4" />
            <path d="M 10 50 Q 40 30 75 50" fill="none" stroke="#558B2F" strokeWidth="10" />
            <ellipse cx="30" cy="130" rx="14" ry="10" fill="#33691E" stroke="#111827" strokeWidth="3" />
          </g>

          {/* Player 2: Orange with Clipboard */}
          <g transform="translate(140, 130)">
            <ellipse cx="45" cy="95" rx="38" ry="65" fill="#FB8C00" stroke="#111827" strokeWidth="5" />
            <ellipse cx="65" cy="75" rx="24" ry="15" fill="#80DEEA" stroke="#111827" strokeWidth="4" />
            {/* Clipboard */}
            <rect x="70" y="80" width="30" height="42" rx="3" fill="#D7CCC8" stroke="#111827" strokeWidth="4" />
            <rect x="78" y="75" width="14" height="7" rx="2" fill="#795548" stroke="#111827" strokeWidth="2" />
            <line x1="75" y1="92" x2="94" y2="92" stroke="#111827" strokeWidth="2" />
            <line x1="75" y1="102" x2="94" y2="102" stroke="#111827" strokeWidth="2" />
          </g>

          {/* Player 3: Cyan with flower accessory */}
          <g transform="translate(250, 115)">
            <ellipse cx="45" cy="100" rx="40" ry="68" fill="#00BCD4" stroke="#111827" strokeWidth="5" />
            <ellipse cx="65" cy="80" rx="26" ry="16" fill="#E0F7FA" stroke="#111827" strokeWidth="4" />
            {/* Pink Flower */}
            <circle cx="28" cy="40" r="10" fill="#E5005A" stroke="#111827" strokeWidth="3" />
            <circle cx="28" cy="40" r="4" fill="#F4C430" />
          </g>

          {/* Player 4: THE RED CAPTAIN (CENTER SUSPECT) */}
          <g transform="translate(365, 80)">
            {/* Body */}
            <ellipse cx="65" cy="130" rx="55" ry="90" fill="#D32F2F" stroke="#111827" strokeWidth="6" />
            {/* Big Visor */}
            <ellipse cx="90" cy="105" rx="36" ry="22" fill="#80DEEA" stroke="#111827" strokeWidth="5" />
            <ellipse cx="96" cy="100" rx="14" ry="7" fill="#FFFFFF" opacity="0.8" />
            {/* Military Captain Hat */}
            <path d="M 25 75 Q 65 30 115 75 Z" fill="#880E4F" stroke="#111827" strokeWidth="5" />
            <rect x="20" y="72" width="100" height="12" rx="3" fill="#111827" />
            <ellipse cx="70" cy="55" rx="12" ry="8" fill="#F4C430" stroke="#111827" strokeWidth="3" />
            {/* Golden Epaulettes */}
            <path d="M 20 120 L 45 120 L 40 135 L 15 135 Z" fill="#F4C430" stroke="#111827" strokeWidth="3" />
          </g>

          {/* Player 5: White Nurse Crewmate */}
          <g transform="translate(485, 110)">
            <ellipse cx="45" cy="100" rx="40" ry="68" fill="#ECEFF1" stroke="#111827" strokeWidth="5" />
            <ellipse cx="65" cy="80" rx="26" ry="16" fill="#80DEEA" stroke="#111827" strokeWidth="4" />
            {/* Nurse Mask & Cap */}
            <rect x="42" y="75" width="48" height="28" rx="4" fill="#CFD8DC" stroke="#111827" strokeWidth="3" />
            <path d="M 30 45 L 75 45 L 70 30 L 35 30 Z" fill="#FFFFFF" stroke="#111827" strokeWidth="3" />
            <path d="M 52 33 L 52 41 M 48 37 L 56 37" stroke="#E5005A" strokeWidth="3" />
          </g>

          {/* Player 6: Chef Crewmate with Tall Toque */}
          <g transform="translate(565, 125)">
            <ellipse cx="45" cy="95" rx="38" ry="65" fill="#CFD8DC" stroke="#111827" strokeWidth="5" />
            <ellipse cx="65" cy="75" rx="24" ry="15" fill="#80DEEA" stroke="#111827" strokeWidth="4" />
            {/* Chef Hat */}
            <path d="M 30 45 C 20 15 75 15 65 45 Z" fill="#FFFFFF" stroke="#111827" strokeWidth="4" />
            <rect x="28" y="42" width="40" height="12" fill="#ECEFF1" stroke="#111827" strokeWidth="3" />
            {/* Chef Buttons */}
            <circle cx="45" cy="120" r="3" fill="#111827" />
            <circle cx="45" cy="132" r="3" fill="#111827" />
          </g>

          {/* Player 7: Suited Crewmate with Tie */}
          <g transform="translate(650, 135)">
            <ellipse cx="45" cy="95" rx="38" ry="65" fill="#90A4AE" stroke="#111827" strokeWidth="5" />
            <ellipse cx="65" cy="75" rx="24" ry="15" fill="#80DEEA" stroke="#111827" strokeWidth="4" />
            {/* Suit Lapels & Tie */}
            <polygon points="35,100 55,100 45,135" fill="#111827" />
            <polygon points="42,100 48,100 45,125" fill="#D32F2F" />
          </g>

          {/* Player 8: Green Hoodie on Right */}
          <g transform="translate(735, 150)">
            <ellipse cx="40" cy="90" rx="36" ry="60" fill="#2E7D32" stroke="#111827" strokeWidth="5" />
            <ellipse cx="58" cy="70" rx="22" ry="14" fill="#80DEEA" stroke="#111827" strokeWidth="4" />
            {/* White Hoodie Drawstrings */}
            <line x1="38" y1="90" x2="38" y2="120" stroke="#FFFFFF" strokeWidth="3" />
            <line x1="46" y1="90" x2="46" y2="120" stroke="#FFFFFF" strokeWidth="3" />
          </g>

          {/* ---------------------------------------------------- */}
          {/* THE MAIN EMERGENCY MEETING TABLE (CENTRAL DISK) */}
          {/* ---------------------------------------------------- */}
          {/* Table Pedestal / Base */}
          <ellipse cx="450" cy="330" rx="320" ry="110" fill="#003B46" stroke="#111827" strokeWidth="6" />
          <path d="M 130 330 Q 450 420 770 330 L 750 370 Q 450 470 150 370 Z" fill="#002229" stroke="#111827" strokeWidth="6" />

          {/* Main Table Surface */}
          <ellipse cx="450" cy="315" rx="310" ry="95" fill="url(#tableGlow)" stroke="#111827" strokeWidth="7" />

          {/* Table Center Ring */}
          <ellipse cx="450" cy="315" rx="190" ry="55" fill="#008EA2" stroke="#111827" strokeWidth="4" />
          <ellipse cx="450" cy="315" rx="140" ry="40" fill="#005B69" stroke="#111827" strokeWidth="3" />

          {/* Table Center Pedestal ADG Logo */}
          <g transform="translate(380, 290)">
            <circle cx="70" cy="25" r="32" fill="#111827" stroke="#FFFDF0" strokeWidth="3" />
            <text x="70" y="24" fill="#00AFC6" fontSize="16" fontFamily="'Press Start 2P', monospace" fontWeight="bold" textAnchor="middle">ADG</text>
            <text x="70" y="40" fill="#F4C430" fontSize="11" fontFamily="'Silkscreen', monospace" textAnchor="middle">&lt; / &gt;</text>
          </g>

          {/* Table rim highlights & paint splatters as on poster */}
          <path d="M 280 345 Q 350 365 420 350" stroke="#E5005A" strokeWidth="8" strokeLinecap="round" />
          <path d="M 520 350 Q 580 365 630 345" stroke="#F4C430" strokeWidth="7" strokeLinecap="round" />
        </svg>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. THE 4 PILLARS (EXACT CARDS FROM THE POSTER) */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto my-8">
        {/* Card 1: Tasks (Pink) */}
        <div className="bg-[#FFFDF0] border-3 border-[#111827] shadow-[4px_4px_0_0_#111827] p-5 text-center flex flex-col items-center hover:translate-y-[-2px] transition-transform">
          <div className="w-16 h-16 bg-[#E5005A] border-3 border-[#111827] shadow-[3px_3px_0_0_#111827] flex items-center justify-center text-white mb-3">
            <Search className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h4 className="font-pixel text-xs sm:text-sm text-[#E5005A] tracking-wider mb-2">
            COMPLETE YOUR TASKS
          </h4>
          <p className="text-xs text-[#111827] font-body">
            Execute technical and physical lab tasks across Room 318 before the timer runs out.
          </p>
        </div>

        {/* Card 2: Observation (Yellow) */}
        <div className="bg-[#FFFDF0] border-3 border-[#111827] shadow-[4px_4px_0_0_#111827] p-5 text-center flex flex-col items-center hover:translate-y-[-2px] transition-transform">
          <div className="w-16 h-16 bg-[#F4C430] border-3 border-[#111827] shadow-[3px_3px_0_0_#111827] flex items-center justify-center text-[#111827] mb-3">
            <Eye className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h4 className="font-pixel text-xs sm:text-sm text-[#111827] tracking-wider mb-2">
            WATCH THE OTHERS
          </h4>
          <p className="text-xs text-[#111827] font-body">
            Track player movements, note who fakes station work, and spot suspicious routes.
          </p>
        </div>

        {/* Card 3: Suspicious Player (Cyan) */}
        <div className="bg-[#FFFDF0] border-3 border-[#111827] shadow-[4px_4px_0_0_#111827] p-5 text-center flex flex-col items-center hover:translate-y-[-2px] transition-transform">
          <div className="w-16 h-16 bg-[#00AFC6] border-3 border-[#111827] shadow-[3px_3px_0_0_#111827] flex items-center justify-center text-white mb-3">
            <UserX className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h4 className="font-pixel text-xs sm:text-sm text-[#00AFC6] tracking-wider mb-2">
            FIND OUT THE SUSPICIOUS PLAYER
          </h4>
          <p className="text-xs text-[#111827] font-body">
            Piece together clues, cross-check alibis, and unmask the imposter sabotaging your team.
          </p>
        </div>

        {/* Card 4: Vote (Green) */}
        <div className="bg-[#FFFDF0] border-3 border-[#111827] shadow-[4px_4px_0_0_#111827] p-5 text-center flex flex-col items-center hover:translate-y-[-2px] transition-transform">
          <div className="w-16 h-16 bg-[#4CAF50] border-3 border-[#111827] shadow-[3px_3px_0_0_#111827] flex items-center justify-center text-white mb-3">
            <Vote className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h4 className="font-pixel text-xs sm:text-sm text-[#4CAF50] tracking-wider mb-2">
            VOTE BEFORE THE IMPOSTER WINS
          </h4>
          <p className="text-xs text-[#111827] font-body">
            Convene emergency meetings at the main desk and eject the saboteur before time expires.
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. POSTER MOTIFS: TRUST NO ONE & ROOM 318 */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 my-6">
        <div className="bg-[#00AFC6] text-white font-pixel text-sm sm:text-base px-6 py-2.5 border-3 border-[#111827] shadow-[4px_4px_0_0_#111827] tracking-widest uppercase">
          {EVENT_CONFIG.warningQuote}
        </div>
        <div className="bg-[#FFFDF0] text-[#111827] font-pixel text-xs sm:text-sm px-5 py-2.5 border-3 border-[#111827] shadow-[4px_4px_0_0_#111827] tracking-wider font-bold">
          VENUE: {EVENT_CONFIG.venue}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
        {onRegisterClick && (
          <button
            onClick={onRegisterClick}
            className="bg-[#E5005A] text-white font-arcade text-sm sm:text-base px-8 py-3.5 border-3 border-[#111827] shadow-[5px_5px_0_0_#111827] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[7px_7px_0_0_#111827] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#111827] flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            REGISTER YOUR SQUAD (5–6 PLAYERS)
          </button>
        )}
        {onExploreClick && (
          <button
            onClick={onExploreClick}
            className="bg-[#F4C430] text-[#111827] font-arcade text-sm sm:text-base px-6 py-3.5 border-3 border-[#111827] shadow-[4px_4px_0_0_#111827] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_0_#111827] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_0_#111827]"
          >
            EXPLORE GAME RULES
          </button>
        )}
      </div>
    </div>
  );
};

export default AmongUsIllustration;

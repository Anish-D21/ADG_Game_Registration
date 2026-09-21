import React, { useState } from 'react';
import { ShieldAlert, Users, HelpCircle, FileText, CheckCircle2, Lock, Menu, X } from 'lucide-react';
import { EVENT_CONFIG } from '../../shared/eventConfig.js';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'game', label: 'Game Info' },
    { id: 'rules', label: 'Rules' },
    { id: 'faq', label: 'FAQ' },
    { id: 'status', label: 'Check Status' },
    { id: 'admin', label: 'Admin Portal', icon: Lock }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#F7E8B5] border-b-4 border-[#111827] shadow-[0_4px_0_0_#111827]">
      {/* Top Banner Stripe inspired by poster */}
      <div className="bg-[#111827] text-white px-4 py-1.5 flex justify-between items-center text-xs font-arcade tracking-wider">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 bg-[#E5005A] animate-pulse"></span>
          <span>AI DEVELOPERS GROUP PRESENTS</span>
          <span className="hidden sm:inline text-[#F4C430]">• {EVENT_CONFIG.collaboration}</span>
        </div>
        <div className="flex items-center gap-4 text-[#00AFC6]">
          <span>{EVENT_CONFIG.eventDateDisplay}</span>
          <span className="bg-[#E5005A] text-white px-2 py-0.5 rounded-none font-bold text-[10px]">
            {EVENT_CONFIG.venue}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          {/* Retro Among Us Crewmate Mascot Avatar */}
          <div className="w-11 h-11 bg-[#E5005A] border-3 border-[#111827] shadow-[2px_2px_0_0_#111827] flex items-center justify-center relative overflow-hidden group-hover:scale-105 transition-transform">
            <div className="w-6 h-4 bg-[#00AFC6] border-2 border-[#111827] rounded-full absolute top-2 right-1.5 shadow-inner"></div>
            <div className="absolute bottom-1 text-[8px] font-pixel text-white">ADG</div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-arcade text-xl sm:text-2xl font-bold tracking-widest text-[#111827]">
                DECEPTION
              </span>
              <span className="bg-[#F4C430] border-2 border-[#111827] text-[#111827] text-[10px] font-pixel px-1.5 py-0.5 shadow-[1px_1px_0_0_#111827]">
                2026
              </span>
            </div>
            <p className="text-[11px] font-bold text-[#111827]/80 tracking-wide font-display">
              ROOM 318 • SFIT
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 text-xs font-bold font-arcade tracking-wide transition-all ${
                  isActive
                    ? 'bg-[#111827] text-white border-2 border-[#111827] shadow-[2px_2px_0_0_#E5005A]'
                    : 'bg-transparent text-[#111827] hover:bg-[#FFFDF0] hover:border-2 hover:border-[#111827]'
                } ${item.id === 'admin' ? 'border-2 border-[#111827]/50 text-xs text-[#111827]' : ''}`}
              >
                <span className="flex items-center gap-1.5">
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Primary CTA Register Button */}
          <button
            onClick={() => setActiveTab('register')}
            className="ml-2 bg-[#E5005A] text-white font-arcade text-xs px-4 py-2 border-2 border-[#111827] shadow-[3px_3px_0_0_#111827] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_0_#111827] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_0_#111827] flex items-center gap-1.5 animate-bounce-subtle"
          >
            <ShieldAlert className="w-4 h-4" />
            REGISTER SQUAD
          </button>
        </nav>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setActiveTab('register')}
            className="bg-[#E5005A] text-white font-arcade text-[10px] px-2.5 py-1.5 border-2 border-[#111827] shadow-[2px_2px_0_0_#111827]"
          >
            REGISTER
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 bg-[#FFFDF0] border-2 border-[#111827] shadow-[2px_2px_0_0_#111827] text-[#111827]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FFFDF0] border-t-2 border-[#111827] px-4 py-4 space-y-2 shadow-lg">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 font-arcade text-xs border-2 border-[#111827] flex items-center justify-between ${
                activeTab === item.id
                  ? 'bg-[#111827] text-white'
                  : 'bg-[#F7E8B5] text-[#111827]'
              }`}
            >
              <span>{item.label}</span>
              {activeTab === item.id && <CheckCircle2 className="w-4 h-4 text-[#F4C430]" />}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};

export default Header;

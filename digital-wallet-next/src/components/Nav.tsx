'use client';

import React, { useState } from 'react';

interface NavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
}

export default function Nav({ activeTab, setActiveTab, isLoggedIn, onLogout }: NavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLinkClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(false);
  };

  // Nav Items
  const navItems = [
    { id: 'dashboard', label: 'DASHBOARD', desc: 'Secure Ledger Overview' },
    { id: 'analytics', label: 'ANALYTICS', desc: 'Financial Insights & Volume Charts' },
    { id: 'alerts', label: 'SECURITY ALERTS', desc: 'Realtime Suspicious Flags & Resolvers' },
    { id: 'security', label: 'SECURITY SETUP', desc: 'Manage 2FA Protection Policies' },
  ];

  return (
    <>
      {/* Top sticky bar */}
      <header className="fixed top-0 left-0 w-full z-[100] px-6 py-4 flex items-center justify-between border-b border-border-glass bg-bg-main/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-accent-cream rounded-none animate-pulse" />
          <span className="font-display font-extrabold tracking-widest text-sm uppercase text-accent-cream">
            FINTECH WALLET
          </span>
        </div>

        <div className="flex items-center gap-6">
          {isLoggedIn && (
            <button
              onClick={onLogout}
              className="hidden md:inline-block font-mono text-[10px] tracking-widest uppercase hover:text-white transition-colors duration-300 cursor-pointer"
            >
              Sign Out
            </button>
          )}

          <button
            onClick={toggleMenu}
            className="flex items-center gap-2 font-display text-[11px] tracking-widest uppercase text-bg-main bg-accent-cream hover:bg-white transition-colors duration-300 px-5 py-2.5 rounded-none font-bold select-none border border-accent-cream cursor-pointer"
          >
            {isOpen ? 'CLOSE' : 'MENU'}
          </button>
        </div>
      </header>

      {/* Full screen menu overlay */}
      <div
        className={`fixed inset-0 w-screen h-screen z-[90] bg-bg-surface flex flex-col md:flex-row items-center justify-center p-6 md:p-24 overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto visible' : 'opacity-0 pointer-events-none invisible'
        }`}
      >
        {/* Menu link list */}
        <div
          className="flex flex-col gap-6 md:gap-10 w-full max-w-4xl text-left"
        >
          <span className="font-mono text-[10px] tracking-widest text-text-muted">
            SYSTEM UTILITIES / NAVIGATION
          </span>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <div
                key={item.id}
                className="group relative block cursor-pointer select-none"
                onClick={() => handleLinkClick(item.id)}
              >
                <div className="flex flex-col justify-start py-1">
                  <h2 className={`text-3xl md:text-6xl font-display font-black leading-none tracking-tighter transition-colors duration-300 ${
                    isActive ? 'text-accent-cream' : 'text-text-muted group-hover:text-white'
                  }`}>
                    {item.label}
                  </h2>
                  
                  <span className="font-mono text-xs md:text-sm text-text-dim mt-2 block opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {item.desc}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoggedIn && (
            <div className="md:hidden mt-4 pt-6 border-t border-border-glass">
              <button
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
                className="font-mono text-xs tracking-widest uppercase text-red-500"
              >
                Sign Out of Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

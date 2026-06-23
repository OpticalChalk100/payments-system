'use client';

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, ArrowDown } from 'lucide-react';

export default function Hero() {
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    // Sound persistence config
    const cachedSound = sessionStorage.getItem('unseen_ambient_sound');
    if (cachedSound === 'true') {
      setSoundEnabled(true);
    }
  }, []);

  const handleSoundToggle = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    sessionStorage.setItem('unseen_ambient_sound', nextState ? 'true' : 'false');
  };

  // Static positions for details panels in the Hero background
  const mockCards = [
    { id: 1, label: 'LEDGER: INR', value: '₹12,492.00', color: 'border-accent-cream/40 bg-bg-surface', x: '5%', y: '15%', rot: '-8deg' },
    { id: 2, label: 'BLOCK: SECURE', value: '0x9dF...E4b', color: 'border-white/20 bg-bg-main', x: '55%', y: '8%', rot: '4deg' },
    { id: 3, label: 'VELOCITY SCORE', value: '0.98 SECURE', color: 'border-accent-cream/20 bg-bg-surface', x: '30%', y: '45%', rot: '12deg' },
    { id: 4, label: 'CAPACITY CAP', value: '₹1,00,000.00', color: 'border-white/10 bg-bg-main', x: '65%', y: '50%', rot: '-5deg' },
  ];

  return (
    <section
      className="relative w-full min-h-screen flex flex-col justify-between pt-32 pb-16 px-6 md:px-24 bg-bg-main overflow-hidden select-none"
    >
      {/* Sound Toggle Control (Ambient sound simulation) */}
      <div className="absolute top-24 right-6 md:right-24 z-30">
        <button
          onClick={handleSoundToggle}
          className="flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase border border-border-glass hover:border-accent-cream/50 bg-bg-surface px-4 py-2 text-accent-cream hover:text-white transition-all duration-300 rounded-none cursor-pointer"
        >
          {soundEnabled ? (
            <>
              <Volume2 size={12} className="animate-pulse" />
              <span>SOUND ON</span>
            </>
          ) : (
            <>
              <VolumeX size={12} />
              <span>SOUND OFF</span>
            </>
          )}
        </button>
      </div>

      {/* Main typography display */}
      <div className="relative z-20 flex flex-col justify-center flex-1 max-w-5xl">
        <span className="font-mono text-[10px] tracking-widest text-text-muted mb-4 uppercase">
          [ UNSEEN STUDIO DESIGN SYSTEM ]
        </span>
        
        <h1 className="text-5xl md:text-8xl font-display font-black leading-none tracking-tighter uppercase mb-6 flex flex-col">
          <span className="flex">THE FUTURE</span>
          <span className="flex text-transparent stroke-text" style={{ WebkitTextStroke: '1px var(--color-accent-cream)' }}>
            OF PAYMENTS
          </span>
        </h1>
        
        <p className="font-sans text-sm md:text-lg text-text-muted max-w-md leading-relaxed">
          Nothing is static. Re-imagining payments as an interactive, fully animatable ledger space.
        </p>
      </div>

      {/* Static Explorer Card background blocks */}
      <div className="absolute inset-0 z-10 w-full h-full overflow-hidden pointer-events-none">
        {mockCards.map((card) => (
          <div
            key={card.id}
            style={{
              left: card.x,
              top: card.y,
              transform: `rotate(${card.rot})`,
            }}
            className={`pointer-events-auto absolute p-6 border ${card.color} w-64 md:w-72 shadow-2xl flex flex-col justify-between gap-6 transition-transform duration-300 hover:scale-103`}
          >
            <div className="flex justify-between items-start">
              <span className="font-mono text-[8px] tracking-widest text-text-muted">
                {card.label}
              </span>
              <div className="w-1.5 h-1.5 rounded-none bg-accent-cream" />
            </div>
            <div className="font-display font-extrabold text-lg md:text-xl tracking-tight text-white">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Footer indicators */}
      <div className="relative z-20 flex justify-between items-center w-full border-t border-border-glass pt-6 font-mono text-[10px] tracking-widest text-text-muted">
        <span>EST. 2026 / DIGITAL PAYMENTS</span>
        <div className="flex items-center gap-2 animate-bounce">
          <span>SCROLL TO EXPLORE</span>
          <ArrowDown size={12} />
        </div>
      </div>
    </section>
  );
}

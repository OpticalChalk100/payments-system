'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { splitTextIntoChars } from '@/lib/animations';

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const curtainRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const wordRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Check if preloader has already run in this browser session
    const hasRun = sessionStorage.getItem('unseen_preloader_run');
    if (hasRun === 'true') {
      onComplete();
      return;
    }

    // Stagger characters entrance on mount
    gsap.fromTo(
      '.preloader-char',
      { y: '100%', rotateX: 60, opacity: 0 },
      {
        y: '0%',
        rotateX: 0,
        opacity: 1,
        stagger: 0.08,
        ease: 'power4.out',
        duration: 1.2,
      }
    );

    // Incremental progress counter (mock loader linked to loaded assets)
    let count = 0;
    const interval = setInterval(() => {
      // Simulate organic loading chunks
      const randInc = Math.floor(Math.random() * 8) + 2;
      count = Math.min(100, count + randInc);
      setProgress(count);

      if (count >= 100) {
        clearInterval(interval);
        // Small delay at 100% to let user see it complete, then transition
        setTimeout(() => {
          exitPreloader();
        }, 400);
      }
    }, 85);

    // Skip handler (Escape key)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearInterval(interval);
        setProgress(100);
        exitPreloader();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const exitPreloader = () => {
    if (isDone) return;
    setIsDone(true);
    sessionStorage.setItem('unseen_preloader_run', 'true');

    const tl = gsap.timeline({
      onComplete: () => {
        onComplete();
      },
    });

    // Animate content scaling down and fading
    tl.to(contentRef.current, {
      opacity: 0,
      scale: 0.95,
      y: -20,
      duration: 0.5,
      ease: 'power3.in',
    });

    // Wipe curtain slides UP to reveal page hero underneath
    tl.to(
      curtainRef.current,
      {
        y: '-100%',
        duration: 1.2,
        ease: 'power4.inOut',
      },
      '-=0.2'
    );

    // Fade and disable pointer events on the container
    tl.to(
      containerRef.current,
      {
        opacity: 0,
        pointerEvents: 'none',
        duration: 0.3,
      },
      '-=0.4'
    );
  };

  const letters = splitTextIntoChars('FINTECH');

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-screen h-screen z-[9999] overflow-hidden flex items-center justify-center bg-bg-main"
    >
      {/* Background slide curtain */}
      <div
        ref={curtainRef}
        className="absolute inset-0 bg-accent-cream z-10"
        style={{ transform: 'translateY(0%)' }}
      />

      {/* Preloader details panel */}
      <div
        ref={contentRef}
        className="relative z-20 flex flex-col items-center justify-center text-bg-main gap-8 px-6"
      >
        {/* Logo reveal block */}
        <div
          ref={wordRef}
          className="flex overflow-hidden text-5xl md:text-8xl font-display font-extrabold tracking-tighter uppercase perspective-600"
        >
          {letters.map((char, index) => (
            <span
              key={index}
              className="preloader-char inline-block origin-bottom transform-gpu"
            >
              {char}
            </span>
          ))}
        </div>

        {/* Counter and skip label */}
        <div className="flex flex-col items-center gap-4">
          <div className="font-mono text-xl md:text-3xl font-bold tracking-widest">
            {progress.toString().padStart(3, '0')}%
          </div>
          
          <button
            onClick={exitPreloader}
            className="text-xs uppercase tracking-widest border border-bg-main/30 hover:border-bg-main hover:bg-bg-main hover:text-accent-cream transition-all duration-300 px-6 py-2.5 rounded-none font-medium mt-2"
          >
            Skip Intro (ESC)
          </button>
        </div>
      </div>
    </div>
  );
}

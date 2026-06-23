'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function Cursor() {
  const [cursorText, setCursorText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isTouch, setIsTouch] = useState(true);

  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const mousePos = useRef({ x: -100, y: -100 });
  const dotPos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    // Detect touch device / pointer capabilities
    const checkPointer = () => {
      const finePointer = window.matchMedia('(pointer: fine)').matches;
      setIsTouch(!finePointer);
      setIsVisible(finePointer);
    };

    checkPointer();
    window.addEventListener('resize', checkPointer);

    if (isTouch) return;

    // Track mouse coordinates
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Smooth movement interpolation loop (lerp)
    let animationFrameId: number;
    const updatePosition = () => {
      // Dot follows mouse quickly
      dotPos.current.x += (mousePos.current.x - dotPos.current.x) * 0.25;
      dotPos.current.y += (mousePos.current.y - dotPos.current.y) * 0.25;

      // Ring trails with a slight lag (inertia lag)
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * 0.12;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * 0.12;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dotPos.current.x}px, ${dotPos.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      animationFrameId = requestAnimationFrame(updatePosition);
    };

    updatePosition();

    // Hover event delegation tracking cursor states
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const interactive = target.closest('a, button, input, select, textarea, [role="button"], span[style*="cursor: pointer"]');
      const textBlock = target.closest('p, h1, h2, h3, h4, h5, h6, li, blockquote');
      const cardBlock = target.closest('[data-cursor-card]');
      const customText = target.closest('[data-cursor-text]')?.getAttribute('data-cursor-text');

      if (customText) {
        setCursorText(customText);
        document.body.classList.add('cursor-hover-card');
        document.body.classList.remove('cursor-hover-link', 'cursor-hover-text');
      } else if (cardBlock) {
        setCursorText('VIEW');
        document.body.classList.add('cursor-hover-card');
        document.body.classList.remove('cursor-hover-link', 'cursor-hover-text');
      } else if (interactive) {
        setCursorText('');
        document.body.classList.add('cursor-hover-link');
        document.body.classList.remove('cursor-hover-card', 'cursor-hover-text');
      } else if (textBlock) {
        setCursorText('');
        document.body.classList.add('cursor-hover-text');
        document.body.classList.remove('cursor-hover-card', 'cursor-hover-link');
      } else {
        setCursorText('');
        document.body.classList.remove('cursor-hover-link', 'cursor-hover-text', 'cursor-hover-card');
      }
    };

    window.addEventListener('mouseover', handleMouseOver);

    // Hide custom cursor when mouse leaves browser viewport
    const handleMouseLeaveViewport = () => {
      if (dotRef.current) dotRef.current.style.opacity = '0';
      if (ringRef.current) ringRef.current.style.opacity = '0';
    };

    const handleMouseEnterViewport = () => {
      if (dotRef.current) dotRef.current.style.opacity = '1';
      if (ringRef.current) ringRef.current.style.opacity = '1';
    };

    document.addEventListener('mouseleave', handleMouseLeaveViewport);
    document.addEventListener('mouseenter', handleMouseEnterViewport);

    return () => {
      window.removeEventListener('resize', checkPointer);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseleave', handleMouseLeaveViewport);
      document.removeEventListener('mouseenter', handleMouseEnterViewport);
      cancelAnimationFrame(animationFrameId);
      // Clean classes from body on unmount
      document.body.classList.remove('cursor-hover-link', 'cursor-hover-text', 'cursor-hover-card');
    };
  }, [isTouch]);

  if (isTouch || !isVisible) return null;

  return (
    <>
      {/* Tiny center dot */}
      <div
        ref={dotRef}
        className="custom-cursor"
        style={{ transform: 'translate(-50%, -50%)' }}
      />
      {/* Large trailing ring */}
      <div
        ref={ringRef}
        className="custom-cursor-ring"
        style={{ transform: 'translate(-50%, -50%)' }}
      >
        {cursorText && (
          <span className="text-[10px] text-bg-main font-mono font-bold tracking-widest pointer-events-none select-none uppercase">
            {cursorText}
          </span>
        )}
      </div>
    </>
  );
}

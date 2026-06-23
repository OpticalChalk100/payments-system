import { useRef } from 'react';

/**
 * Custom Easing curves matching Unseen Studio's design tokens.
 */
export const EASING = {
  unseen: 'cubic-bezier(0.25, 1, 0.5, 1)',
  unseenSlow: 'cubic-bezier(0.76, 0, 0.24, 1)',
};

/**
 * Simplified useMagnetic hook that returns the ref statically, removing interactive listener overhead.
 */
export function useMagnetic<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  return ref;
}

/**
 * Splits a text string into an array of characters.
 */
export function splitTextIntoChars(text: string) {
  return text.split('').map((char) => (char === ' ' ? '\u00A0' : char));
}

/**
 * Splits a text string into words.
 */
export function splitTextIntoWords(text: string) {
  return text.split(' ').map((word) => word + '\u00A0');
}

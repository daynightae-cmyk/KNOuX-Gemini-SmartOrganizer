import {createContext, useContext, type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import type {AppSection} from '../context/NavigationContext';

/** Relocate the existing React controls, rather than copying DOM or callbacks.
 * Native/renderer state remains owned by the original page and providers. */
export interface LivingSlots {chrome: HTMLElement|null; navigation: HTMLElement|null; orbit: HTMLElement|null;section:AppSection}
export const LivingLayoutContext = createContext<LivingSlots|null>(null);
export function LivingChromeMount({slot, children}:{slot:'chrome'|'navigation';children:ReactNode}) {
  const slots = useContext(LivingLayoutContext);
  if (!slots) return <>{children}</>;
  return slots[slot] ? createPortal(children, slots[slot]) : null;
}
export function LivingOrbitMount({enabled, children}:{enabled:boolean;children:ReactNode}) {
  const slots = useContext(LivingLayoutContext);
  if (!slots || !enabled) return <>{children}</>;
  return slots.orbit ? createPortal(children, slots.orbit) : null;
}

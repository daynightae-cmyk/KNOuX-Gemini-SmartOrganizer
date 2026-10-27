import React from 'react';

export interface HeroFeature {
  icon: React.ReactNode;
  title: string;
  detail: string;
  tone?: string;
}

/** The three reference capability rows that sit under each section intro. */
export function HeroFeatures({ items }: { items: HeroFeature[] }) {
  return (
    <ul className="knx-hero-features">
      {items.map((feature, index) => (
        <li
          key={`${feature.title}-${index}`}
          className="knx-hero-feature"
          style={{ '--hero-feature': feature.tone || '#7c5cff' } as React.CSSProperties}
        >
          <span className="knx-hero-feature-icon" aria-hidden="true">{feature.icon}</span>
          <span className="knx-hero-feature-copy">
            <strong>{feature.title}</strong>
            <span>{feature.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

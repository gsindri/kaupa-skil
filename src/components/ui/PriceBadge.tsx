
import React from 'react';

interface PriceBadgeProps {
  type: 'best' | 'good' | 'average' | 'expensive';
  children: React.ReactNode;
  className?: string;
}

const PriceBadge: React.FC<PriceBadgeProps> = ({ type, children, className = "" }) => {
  const badgeClasses = {
    best: 'price-badge-best',
    good: 'price-badge-good',
    average: 'price-badge-average',
    expensive: 'price-badge-expensive',
  };

  return (
    <span className={`${badgeClasses[type]} ${className}`}>
      {children}
    </span>
  );
};

export default PriceBadge;

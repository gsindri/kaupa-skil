
import React from 'react';

interface VatToggleProps {
  includeVat: boolean;
  onToggle: (includeVat: boolean) => void;
  className?: string;
  size?: 'default' | 'sm';
}

const VatToggle: React.FC<VatToggleProps> = ({
  includeVat,
  onToggle,
  className = '',
  size = 'default',
}) => {
  const buttonClasses =
    size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  return (
    <div
      className={`inline-flex items-center bg-muted rounded-lg p-1 ${className}`}
    >
      <button
        onClick={() => onToggle(false)}
        className={`${buttonClasses} font-medium rounded-md transition-all duration-200 ${
          !includeVat
            ? 'bg-brand-600 text-white shadow-sm'
            : 'text-foreground/70 hover:text-foreground hover:bg-background/50'
        }`}
      >
        Ex VAT
      </button>
      <button
        onClick={() => onToggle(true)}
        className={`${buttonClasses} font-medium rounded-md transition-all duration-200 ${
          includeVat
            ? 'bg-brand-600 text-white shadow-sm'
            : 'text-foreground/70 hover:text-foreground hover:bg-background/50'
        }`}
      >
        Inc VAT
      </button>
    </div>
  );
};

export default VatToggle;


import React from 'react';

interface VatToggleProps {
  includeVat: boolean;
  onToggle: (includeVat: boolean) => void;
  className?: string;
}

const VatToggle: React.FC<VatToggleProps> = ({ includeVat, onToggle, className = "" }) => {
  return (
    <div className={`inline-flex items-center bg-muted rounded-lg p-1 ${className}`}>
      <button
        onClick={() => onToggle(false)}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
          !includeVat 
            ? 'bg-brand-600 text-white shadow-sm' 
            : 'text-foreground/70 hover:text-foreground hover:bg-background/50'
        }`}
      >
        Ex VAT
      </button>
      <button
        onClick={() => onToggle(true)}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
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

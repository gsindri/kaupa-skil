
import React from 'react';
import { Button } from './button';

interface VatToggleProps {
  includeVat: boolean;
  onToggle: (includeVat: boolean) => void;
  className?: string;
}

const VatToggle: React.FC<VatToggleProps> = ({ includeVat, onToggle, className = "" }) => {
  return (
    <div className={`flex items-center space-x-1 bg-muted rounded-md p-1 ${className}`}>
      <Button
        size="sm"
        variant={!includeVat ? "default" : "ghost"}
        onClick={() => onToggle(false)}
        className={`px-3 py-1 text-xs ${
          !includeVat 
            ? 'bg-vat-exclusive text-white hover:bg-vat-exclusive/90' 
            : 'hover:bg-muted-foreground/10'
        }`}
      >
        Ex VAT
      </Button>
      <Button
        size="sm"
        variant={includeVat ? "default" : "ghost"}
        onClick={() => onToggle(true)}
        className={`px-3 py-1 text-xs ${
          includeVat 
            ? 'bg-vat-inclusive text-white hover:bg-vat-inclusive/90' 
            : 'hover:bg-muted-foreground/10'
        }`}
      >
        Inc VAT
      </Button>
    </div>
  );
};

export default VatToggle;

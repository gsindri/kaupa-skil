
import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { ItemCard } from './ItemCard';

interface QuickSearchProps {
  value: string;
  onChange: (value: string) => void;
  onCompareItem: (itemId: string) => void;
  userMode: 'just-order' | 'balanced' | 'analytical';
}

// Mock search results - replace with actual search implementation
const mockSearchResults = [
  {
    id: '1',
    name: 'Premium Organic Milk',
    brand: 'MS Dairies',
    packSize: '12×1L',
    unitPriceExVat: 180,
    unitPriceIncVat: 223,
    packPriceExVat: 2160,
    packPriceIncVat: 2676,
    unit: 'L',
    suppliers: ['costco', 'metro'],
    stock: true,
    deliveryFee: 0,
    cutoffTime: '14:00',
    deliveryDay: 'Tue'
  }
];

export function QuickSearch({ value, onChange, onCompareItem, userMode }: QuickSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: / focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showResults = value.length > 0 && isFocused;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search item / brand / EAN…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 z-50 bg-background border border-border rounded-md shadow-lg mt-1 max-h-96 overflow-y-auto">
          <div className="p-2 space-y-1">
            {mockSearchResults
              .filter(item => 
                item.name.toLowerCase().includes(value.toLowerCase()) ||
                item.brand.toLowerCase().includes(value.toLowerCase())
              )
              .map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onCompareItem={onCompareItem}
                  userMode={userMode}
                  compact
                />
              ))}
            {mockSearchResults.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                No items found for "{value}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

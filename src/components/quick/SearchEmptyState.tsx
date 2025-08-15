
import React from 'react';
import { Button } from '@/components/ui/button';
import { Search, Lightbulb } from 'lucide-react';

interface SearchEmptyStateProps {
  searchQuery: string;
  onBrowsePantry: () => void;
}

export function SearchEmptyState({ searchQuery, onBrowsePantry }: SearchEmptyStateProps) {
  return (
    <div className="text-center py-12 space-y-4">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-foreground">
          No results for "{searchQuery}"
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Try searching by item name, brand, or EAN code. You can also browse our organized pantry sections.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <Button 
          variant="outline" 
          onClick={onBrowsePantry}
          className="min-w-[140px]"
        >
          Browse Pantry
        </Button>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lightbulb className="h-4 w-4" />
          <span>Try "coca cola" or "7310100226587"</span>
        </div>
      </div>
    </div>
  );
}

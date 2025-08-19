
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Plus, TrendingUp, Clock } from 'lucide-react';
import { useOrderingSuggestions } from '@/hooks/useOrderingSuggestions';
import { useSettings } from '@/contexts/SettingsProviderUtils';

interface SmartSuggestionsProps {
  onAddSuggestedItem: (itemId: string) => void;
}

export function SmartSuggestions({ onAddSuggestedItem }: SmartSuggestionsProps) {
  const { data: suggestions = [], isLoading } = useOrderingSuggestions();
  const { includeVat } = useSettings();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'threshold_optimization':
        return <TrendingUp className="h-4 w-4" />;
      case 'consolidation':
        return <Lightbulb className="h-4 w-4" />;
      case 'timing_optimization':
        return <Clock className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getSuggestionVariant = (type: string) => {
    switch (type) {
      case 'threshold_optimization':
        return 'default';
      case 'consolidation':
        return 'secondary';
      case 'timing_optimization':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (isLoading || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-brand-600" />
        <span className="text-sm font-medium">Smart Suggestions</span>
      </div>

      <div className="space-y-2">
        {suggestions.slice(0, 3).map((suggestion) => (
          <Card key={suggestion.id} className="border-l-4 border-l-brand-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getSuggestionIcon(suggestion.type)}
                  <span>{suggestion.title}</span>
                </div>
                <Badge variant={getSuggestionVariant(suggestion.type)} className="text-xs">
                  Save {formatPrice(suggestion.potential_savings)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-3">
                {suggestion.description}
              </p>
              
              {/* Show suggested items if available */}
              {suggestion.metadata?.suggested_items && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Suggested items:
                  </div>
                  <div className="space-y-1">
                    {suggestion.metadata.suggested_items.slice(0, 2).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="text-sm">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.pack_size}</div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onAddSuggestedItem(item.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 mt-3">
                {suggestion.actions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      // Handle action based on type
                      console.log('Action:', action);
                    }}
                  >
                    {action.description}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

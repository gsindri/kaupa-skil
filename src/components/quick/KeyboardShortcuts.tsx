
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Kbd } from '@/components/ui/kbd';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsProps {
  onClose: () => void;
}

export function KeyboardShortcuts({ onClose }: KeyboardShortcutsProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsVisible(true);
      } else if (e.key === 'Escape') {
        setIsVisible(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  const shortcuts = [
    { key: '/', description: 'Focus search bar' },
    { key: 'Ctrl + K', description: 'Open command palette' },
    { key: '↑/↓', description: 'Navigate search results' },
    { key: 'Enter', description: 'Add selected item to cart' },
    { key: 'Ctrl + A', description: 'Select all visible items' },
    { key: 'Ctrl + D', description: 'Clear selection' },
    { key: 'Ctrl + B', description: 'Open cart drawer' },
    { key: 'Escape', description: 'Close dialogs/clear focus' },
  ];

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            Keyboard Shortcuts
          </CardTitle>
          <button
            onClick={() => setIsVisible(false)}
            className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent className="space-y-2">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.key} className="flex items-center justify-between">
              <span className="text-sm">{shortcut.description}</span>
              <Kbd>{shortcut.key}</Kbd>
            </div>
          ))}
          <div className="pt-2 border-t text-xs text-muted-foreground">
            Press <Kbd>Ctrl + ?</Kbd> to toggle this help
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

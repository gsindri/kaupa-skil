
import React from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight } from 'lucide-react';

export function CompactOrderGuidesCTA() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-lg p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-sm">Create Order Guides</h3>
          <p className="text-xs text-gray-600 mt-0.5">Save time with custom order templates</p>
        </div>
        <Button variant="ghost" size="sm" className="flex-shrink-0 h-8 px-3 text-blue-600 hover:bg-blue-100">
          Setup
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}


import React from 'react'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'

export function CompactOrderGuidesCTA() {
  return (
    <Button variant="outline" size="sm" className="gap-2">
      <BookOpen className="h-4 w-4" />
      Order Guides
    </Button>
  )
}

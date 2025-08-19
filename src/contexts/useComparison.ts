import { useContext } from 'react'
import { ComparisonContext } from './ComparisonContextUtils'

export function useComparison() {
  const context = useContext(ComparisonContext)
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider')
  }
  return context
}

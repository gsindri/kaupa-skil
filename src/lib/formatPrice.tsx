import React from 'react'

export function formatPrice(price: number): React.ReactNode {
  const narrow = new Intl.NumberFormat('is-IS', {
    style: 'currency',
    currency: 'ISK',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)

  if (narrow.includes('kr')) {
    return narrow.replace('kr.', 'kr')
  }

  const formatter = new Intl.NumberFormat('is-IS', {
    style: 'currency',
    currency: 'ISK',
    currencyDisplay: 'code',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  const parts = formatter.formatToParts(price)
  const currency = parts.find(p => p.type === 'currency')?.value || ''
  const number = parts
    .filter(p => p.type !== 'currency')
    .map(p => p.value)
    .join('')

  return (
    <>
      {number} <span className="text-muted-foreground">{currency}</span>
    </>
  )
}

export default formatPrice

export function formatCurrency(amount: number, currency: string = 'ISK'): string {
  return new Intl.NumberFormat('is-IS', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

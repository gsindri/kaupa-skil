import { addDays, getISODay } from 'date-fns'

export interface ParsedTime {
  hours: number
  minutes: number
}

export function parseTime(value: string | null): ParsedTime {
  if (!value) return { hours: 9, minutes: 0 }

  const segments = value.split(':').map((part) => Number.parseInt(part, 10))
  const [hours = 9, minutes = 0] = segments

  return {
    hours: Number.isFinite(hours) ? hours : 9,
    minutes: Number.isFinite(minutes) ? minutes : 0,
  }
}

export function getNextDeliveryDate(
  deliveryDays: number[] | null,
  cutoffTime: string | null,
  referenceDate: Date = new Date(),
): Date | null {
  if (!deliveryDays || deliveryDays.length === 0) return null

  const todayIso = getISODay(referenceDate)
  const orderedDays = [...deliveryDays].sort((a, b) => a - b)
  const { hours, minutes } = parseTime(cutoffTime)

  let bestDiff = 7

  orderedDays.forEach((day) => {
    let diff = day - todayIso
    if (diff < 0) diff += 7

    const cutoffToday = new Date(referenceDate)
    cutoffToday.setHours(hours, minutes, 0, 0)

    if (diff === 0 && referenceDate > cutoffToday) {
      diff = 7
    }

    if (diff < bestDiff) bestDiff = diff
  })

  const deliveryDate = addDays(referenceDate, bestDiff)
  deliveryDate.setHours(9, 0, 0, 0)

  return deliveryDate
}

export function formatCutoffTime(value: string | null): string {
  const { hours, minutes } = parseTime(value)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

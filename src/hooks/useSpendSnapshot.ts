import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { startOfWeek, subWeeks, subDays, format, isAfter, isBefore } from 'date-fns'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/useAuth'
import { queryKeys } from '@/lib/queryKeys'

export interface SpendSnapshotCategory {
  name: string
  amount: number
  previous: number
  change: number
}

export interface SpendSnapshotPoint {
  label: string
  value: number
}

export interface SpendSnapshotData {
  thisWeek: number
  lastWeek: number
  change: number
  ordersThisWeek: number
  categories: SpendSnapshotCategory[]
  sparkline: SpendSnapshotPoint[]
}

function coerceNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (value && typeof value === 'object') {
    const candidate =
      (value as Record<string, unknown>).amount ??
      (value as Record<string, unknown>).total ??
      (value as Record<string, unknown>).value

    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
    if (typeof candidate === 'string') {
      const parsed = Number.parseFloat(candidate)
      return Number.isFinite(parsed) ? parsed : 0
    }
  }

  return 0
}

function extractCategoryEntries(order: Record<string, any>) {
  const candidates = [
    order.category_summary,
    order.category_breakdown,
    order.categoryTotals,
    order.category_totals,
    order.categorySpend,
    order.meta?.category_summary,
    order.meta?.category_breakdown,
    order.meta?.spend_by_category,
  ].filter(Boolean)

  if (candidates.length === 0) return [] as Array<{ name: string; amount: number }>

  const summary = candidates[0]

  if (Array.isArray(summary)) {
    return summary
      .map((entry: any) => {
        if (!entry) return null
        const name = entry.name ?? entry.label ?? entry.category
        const amount = coerceNumber(entry)
        if (!name) return null
        return { name, amount }
      })
      .filter(Boolean) as Array<{ name: string; amount: number }>
  }

  if (typeof summary === 'object') {
    return Object.entries(summary as Record<string, unknown>)
      .map(([name, raw]) => ({ name, amount: coerceNumber(raw) }))
      .filter((entry) => entry.amount > 0)
  }

  return [] as Array<{ name: string; amount: number }>
}

export function useSpendSnapshot() {
  const { profile } = useAuth()

  const queryResult = useQuery<SpendSnapshotData>({
    queryKey: [...queryKeys.dashboard.spend(), profile?.tenant_id],
    queryFn: async () => {
      const now = new Date()
      const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 })
      const startOfLastWeek = subWeeks(startOfThisWeek, 1)
      const startOfTwoWeeksAgo = subWeeks(startOfThisWeek, 2)

      let query = supabase
        .from('orders')
        .select('*')
        .gte('created_at', startOfTwoWeeksAgo.toISOString())
        .order('created_at', { ascending: false })

      if (profile?.tenant_id) {
        query = query.eq('tenant_id', profile.tenant_id)
      } else {
        query = query.is('tenant_id', null)
      }

      const { data, error } = await query

      if (error) {
        console.warn('Error fetching spend snapshot:', error)
        return {
          thisWeek: 0,
          lastWeek: 0,
          change: 0,
          ordersThisWeek: 0,
          categories: [],
          sparkline: [] as SpendSnapshotPoint[],
        }
      }

      const orders = data ?? []

      const totals = {
        thisWeek: 0,
        lastWeek: 0,
        ordersThisWeek: 0,
      }

      const categoriesThisWeek = new Map<string, number>()
      const categoriesLastWeek = new Map<string, number>()
      const dailyTotals = new Map<string, number>()

      orders.forEach((order: any) => {
        if (!order?.created_at) return

        const createdAt = new Date(order.created_at)
        const total = coerceNumber(order.total_ex_vat ?? order.total ?? order.grand_total)

        const dateKey = format(createdAt, 'yyyy-MM-dd')
        dailyTotals.set(dateKey, (dailyTotals.get(dateKey) ?? 0) + total)

        const inThisWeek = isAfter(createdAt, startOfThisWeek) || createdAt.getTime() === startOfThisWeek.getTime()
        const inLastWeek =
          (isAfter(createdAt, startOfLastWeek) || createdAt.getTime() === startOfLastWeek.getTime()) &&
          isBefore(createdAt, startOfThisWeek)

        if (inThisWeek) {
          totals.thisWeek += total
          totals.ordersThisWeek += 1
          extractCategoryEntries(order).forEach(({ name, amount }) => {
            categoriesThisWeek.set(name, (categoriesThisWeek.get(name) ?? 0) + amount)
          })
        } else if (inLastWeek) {
          totals.lastWeek += total
          extractCategoryEntries(order).forEach(({ name, amount }) => {
            categoriesLastWeek.set(name, (categoriesLastWeek.get(name) ?? 0) + amount)
          })
        }
      })

      const change = totals.lastWeek > 0
        ? ((totals.thisWeek - totals.lastWeek) / totals.lastWeek) * 100
        : totals.thisWeek > 0
          ? 100
          : 0

      const categories = Array.from(categoriesThisWeek.entries())
        .map(([name, amount]) => {
          const previous = categoriesLastWeek.get(name) ?? 0
          const changeForCategory = previous > 0
            ? ((amount - previous) / previous) * 100
            : amount > 0
              ? 100
              : 0
          return {
            name,
            amount,
            previous,
            change: changeForCategory,
          }
        })
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3)

      const sparkline: SpendSnapshotPoint[] = []
      for (let i = 6; i >= 0; i--) {
        const day = subDays(now, i)
        const key = format(day, 'yyyy-MM-dd')
        sparkline.push({
          label: format(day, 'EEE'),
          value: dailyTotals.get(key) ?? 0,
        })
      }

      return {
        thisWeek: totals.thisWeek,
        lastWeek: totals.lastWeek,
        change,
        ordersThisWeek: totals.ordersThisWeek,
        categories,
        sparkline,
      }
    },
    enabled: !!profile,
    staleTime: 2 * 60 * 1000,
  })

  const { data, ...rest } = queryResult

  const memoizedData = useMemo<SpendSnapshotData | undefined>(() => {
    if (!data) return data

    return {
      ...data,
      categories: data.categories.map((category) => ({
        ...category,
        amount: Number.parseFloat(category.amount.toFixed(0)),
      })),
      sparkline: data.sparkline.map((point) => ({
        ...point,
        value: Number.parseFloat(point.value.toFixed(2)),
      })),
    }
  }, [data])

  return { ...rest, data: memoizedData }
}

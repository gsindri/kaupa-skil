import fs from 'node:fs'

import { render, waitFor } from '@testing-library/react'
import type React from 'react'
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest'

import { NavIcon } from './NavIcon'

import CatalogIcon from '@/icons/catalog.svg?react'
import CompareIcon from '@/icons/compare.svg?react'
import DashboardIcon from '@/icons/dashboard.svg?react'
import DashboardHoloIcon from '@/icons/dashboard-holo.svg?react'
import DiscoverIcon from '@/icons/discover.svg?react'
import PantryIcon from '@/icons/pantry.svg?react'
import PriceIcon from '@/icons/price.svg?react'
import SuppliersIcon from '@/icons/suppliers.svg?react'

type IconTestCase = {
  label: string
  Icon: React.FC<React.SVGProps<SVGSVGElement>>
  svgPath: string
}

const iconTestCases: IconTestCase[] = [
  { label: 'Catalog', Icon: CatalogIcon, svgPath: '../../icons/catalog.svg' },
  { label: 'Compare', Icon: CompareIcon, svgPath: '../../icons/compare.svg' },
  { label: 'Dashboard', Icon: DashboardIcon, svgPath: '../../icons/dashboard.svg' },
  { label: 'Dashboard Holo', Icon: DashboardHoloIcon, svgPath: '../../icons/dashboard-holo.svg' },
  { label: 'Discover', Icon: DiscoverIcon, svgPath: '../../icons/discover.svg' },
  { label: 'Pantry', Icon: PantryIcon, svgPath: '../../icons/pantry.svg' },
  { label: 'Price', Icon: PriceIcon, svgPath: '../../icons/price.svg' },
  { label: 'Suppliers', Icon: SuppliersIcon, svgPath: '../../icons/suppliers.svg' },
]

type ViewBoxDimensions = {
  width: number
  height: number
}

let intrinsicDimensions: ViewBoxDimensions = { width: 0, height: 0 }

const parseViewBoxDimensions = (contents: string): ViewBoxDimensions => {
  const match = contents.match(/viewBox="([^"]+)"/)

  if (!match) {
    throw new Error('Expected the SVG to include a viewBox attribute.')
  }

  const parts = match[1]
    .trim()
    .split(/\s+/)
    .map((value) => Number.parseFloat(value))

  if (parts.length !== 4) {
    throw new Error(`viewBox should contain four numbers, received ${parts.length}`)
  }

  const [, , width, height] = parts

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error('Failed to parse viewBox width/height values.')
  }

  return { width, height }
}

const getViewBoxDimensions = (svgPath: string): ViewBoxDimensions => {
  const svgContents = fs.readFileSync(new URL(svgPath, import.meta.url), 'utf8')
  return parseViewBoxDimensions(svgContents)
}

const createRect = (width: number, height: number): DOMRect =>
  ({
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => ({
      width,
      height,
    }),
  } as DOMRect)

const extractScale = (transform: string): number => {
  const match = /scale\(([^)]+)\)/.exec(transform)
  return match ? Number.parseFloat(match[1]) : 1
}

describe('NavIcon scaling', () => {
  const originalGetBoundingClientRect = SVGElement.prototype.getBoundingClientRect

  beforeAll(() => {
    SVGElement.prototype.getBoundingClientRect = vi.fn(function (this: SVGGraphicsElement) {
      const wrapper = this.closest('span[style]') as HTMLSpanElement | null
      let currentScale = 1

      if (wrapper) {
        currentScale = extractScale(wrapper.style.transform) || 1
      }

      return createRect(
        intrinsicDimensions.width * currentScale,
        intrinsicDimensions.height * currentScale
      )
    })
  })

  afterAll(() => {
    SVGElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
  })

  const targetSize = 44

  it.each(iconTestCases)(
    'scales the %s icon so its visual footprint matches the target size',
    async ({ label, Icon, svgPath }) => {
      const dimensions = getViewBoxDimensions(svgPath)
      intrinsicDimensions = dimensions

      const { container } = render(<NavIcon Icon={Icon} label={label} size={targetSize} />)
      const wrapper = container.querySelector('.pointer-events-none') as HTMLSpanElement | null

      expect(wrapper).not.toBeNull()

      await waitFor(() => {
        if (!wrapper) throw new Error('Icon wrapper not found')

        const actualScale = extractScale(wrapper.style.transform)
        const expectedScale = Math.min(
          targetSize / dimensions.width,
          targetSize / dimensions.height
        )

        expect(actualScale).toBeCloseTo(expectedScale, 6)

        const scaledWidth = dimensions.width * actualScale
        const scaledHeight = dimensions.height * actualScale
        const maxDimension = Math.max(scaledWidth, scaledHeight)

        expect(maxDimension).toBeCloseTo(targetSize, 5)
      })
    }
  )

  it('scales up smaller artwork to fill the requested size', async () => {
    intrinsicDimensions = { width: 16, height: 12 }

    const { container } = render(<NavIcon Icon={CatalogIcon} label="Tiny Catalog" size={targetSize} />)
    const wrapper = container.querySelector('.pointer-events-none') as HTMLSpanElement | null

    expect(wrapper).not.toBeNull()

    await waitFor(() => {
      if (!wrapper) throw new Error('Icon wrapper not found')

      const actualScale = extractScale(wrapper.style.transform)
      const expectedScale = Math.min(targetSize / 16, targetSize / 12)

      expect(actualScale).toBeCloseTo(expectedScale, 6)

      const maxDimension = Math.max(16 * actualScale, 12 * actualScale)

      expect(maxDimension).toBeCloseTo(targetSize, 5)
    })
  })
})

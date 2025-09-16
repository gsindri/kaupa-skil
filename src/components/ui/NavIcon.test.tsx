import fs from 'node:fs'

import { render, waitFor } from '@testing-library/react'
import type React from 'react'
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest'

import { NavIcon } from './NavIcon'

import CatalogIcon from '@/icons/catalog.svg?react'
import CompareIcon from '@/icons/compare.svg?react'
import DashboardIcon from '@/icons/dashboard-holo.svg?react'
import DiscoverIcon from '@/icons/discover.svg?react'
import PantryIcon from '@/icons/pantry.svg?react'
import PriceIcon from '@/icons/price.svg?react'
import SuppliersIcon from '@/icons/suppliers.svg?react'

const BasicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg data-testid="nav-icon" {...props} />
)

describe('NavIcon pointer interactions', () => {
  it('enables pointer events on the rendered SVG', () => {
    const { container } = render(<NavIcon Icon={BasicIcon} label="Test icon" />)
    const svg = container.querySelector('svg')

    expect(svg).not.toBeNull()
    expect(svg?.style.pointerEvents).toBe('auto')
  })
})

type IconTestCase = {
  label: string
  Icon: React.FC<React.SVGProps<SVGSVGElement>>
  svgPath: string
}

const iconTestCases: IconTestCase[] = [
  { label: 'Catalog', Icon: CatalogIcon, svgPath: '../../icons/catalog.svg' },
  { label: 'Compare', Icon: CompareIcon, svgPath: '../../icons/compare.svg' },
  { label: 'Dashboard', Icon: DashboardIcon, svgPath: '../../icons/dashboard-holo.svg' },
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
let viewBoxDimensions: ViewBoxDimensions = { width: 0, height: 0 }

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

const createBBox = (width: number, height: number): DOMRect =>
  ({
    width,
    height,
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
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
  const svgPrototype = SVGElement.prototype as {
    getBBox?: (this: SVGElement) => DOMRect
  }
  const originalGetBBox = svgPrototype.getBBox
  const originalClientWidth = Object.getOwnPropertyDescriptor(
    SVGElement.prototype,
    'clientWidth'
  )
  const originalClientHeight = Object.getOwnPropertyDescriptor(
    SVGElement.prototype,
    'clientHeight'
  )

  beforeAll(() => {
    svgPrototype.getBBox = vi.fn(function (this: SVGElement) {
      return createBBox(intrinsicDimensions.width, intrinsicDimensions.height)
    })

    Object.defineProperty(SVGElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return viewBoxDimensions.width
      },
    })

    Object.defineProperty(SVGElement.prototype, 'clientHeight', {
      configurable: true,
      get() {
        return viewBoxDimensions.height
      },
    })
  })

  afterAll(() => {
    if (originalGetBBox) {
      svgPrototype.getBBox = originalGetBBox
    } else {
      delete svgPrototype.getBBox
    }

    if (originalClientWidth) {
      Object.defineProperty(SVGElement.prototype, 'clientWidth', originalClientWidth)
    } else {
      delete (SVGElement.prototype as { clientWidth?: number }).clientWidth
    }

    if (originalClientHeight) {
      Object.defineProperty(SVGElement.prototype, 'clientHeight', originalClientHeight)
    } else {
      delete (SVGElement.prototype as { clientHeight?: number }).clientHeight
    }
  })

  const targetSize = 44

  it.each(iconTestCases)(
    'scales the %s icon so its visual footprint matches the target size',
    async ({ label, Icon, svgPath }) => {
      const dimensions = getViewBoxDimensions(svgPath)
      intrinsicDimensions = dimensions
      viewBoxDimensions = dimensions

      const { container } = render(<NavIcon Icon={Icon} label={label} size={targetSize} />)
      const wrapper = container.querySelector('span[style*="transform"]') as HTMLSpanElement | null

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
    viewBoxDimensions = getViewBoxDimensions('../../icons/catalog.svg')

    const { container } = render(<NavIcon Icon={CatalogIcon} label="Tiny Catalog" size={targetSize} />)
    const wrapper = container.querySelector('span[style*="transform"]') as HTMLSpanElement | null

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

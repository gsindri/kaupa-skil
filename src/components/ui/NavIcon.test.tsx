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
    expect(svg).toHaveClass('pointer-events-auto')
  })

  it('passes a data-hovered attribute to the SVG when hovered', () => {
    const { container } = render(
      <NavIcon Icon={BasicIcon} label="Hovered icon" hovered />
    )
    const svg = container.querySelector('svg')

    expect(svg).not.toBeNull()
    expect(svg?.getAttribute('data-hovered')).toBe('true')
  })

  it('preserves inline styles defined by the source SVG', () => {
    const sourceStyleTokens = extractRootStyleTokens('../../icons/discover.svg')
    const { container } = render(
      <NavIcon Icon={DiscoverIcon} label="Discover icon" />
    )
    const svg = container.querySelector('svg')

    expect(svg).not.toBeNull()
    const renderedTokens = extractStyleTokens(svg?.getAttribute('style') ?? null)

    expect(renderedTokens.length).toBeGreaterThanOrEqual(sourceStyleTokens.length)
    sourceStyleTokens.forEach((token) => {
      expect(renderedTokens).toContain(token)
    })
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

type ViewBoxInfo = {
  x: number
  y: number
  width: number
  height: number
}

type BBoxInit = {
  x: number
  y: number
  width: number
  height: number
}

const extractRootStyleTokens = (svgPath: string): string[] => {
  const svgContents = fs.readFileSync(new URL(svgPath, import.meta.url), 'utf8')
  const match = svgContents.match(/<svg[^>]*style="([^"]*)"/i)

  if (!match) {
    return []
  }

  return match[1]
    .split(';')
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => token.replace(/\s*:\s*/g, ':'))
}

const extractStyleTokens = (style: string | null): string[] => {
  if (!style) {
    return []
  }

  return style
    .split(';')
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => token.replace(/\s*:\s*/g, ':'))
}

let intrinsicBBox: BBoxInit = { x: 0, y: 0, width: 0, height: 0 }
let viewBoxInfo: ViewBoxInfo = { x: 0, y: 0, width: 0, height: 0 }

const parseViewBoxInfo = (contents: string): ViewBoxInfo => {
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

  const [x, y, width, height] = parts

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new Error('Failed to parse viewBox width/height values.')
  }

  return {
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
    width,
    height,
  }
}

const getViewBoxInfo = (svgPath: string): ViewBoxInfo => {
  const svgContents = fs.readFileSync(new URL(svgPath, import.meta.url), 'utf8')
  return parseViewBoxInfo(svgContents)
}

const createBBox = ({ x, y, width, height }: BBoxInit): DOMRect =>
  ({
    width,
    height,
    x,
    y,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    toJSON: () => ({
      x,
      y,
      width,
      height,
    }),
  } as DOMRect)

const extractScale = (transform: string): number => {
  const match = /scale\(([^)]+)\)/.exec(transform)
  return match ? Number.parseFloat(match[1]) : 1
}

const extractTranslate = (transform: string): { x: number; y: number } => {
  const translate3d = /translate3d\(([^,]+),\s*([^,]+),/.exec(transform)
  if (translate3d) {
    return {
      x: Number.parseFloat(translate3d[1]),
      y: Number.parseFloat(translate3d[2]),
    }
  }

  const translate2d = /translate\(([^,]+),\s*([^)]+)\)/.exec(transform)
  if (translate2d) {
    return {
      x: Number.parseFloat(translate2d[1]),
      y: Number.parseFloat(translate2d[2]),
    }
  }

  return { x: 0, y: 0 }
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
      return createBBox(intrinsicBBox)
    })

    Object.defineProperty(SVGElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return viewBoxInfo.width
      },
    })

    Object.defineProperty(SVGElement.prototype, 'clientHeight', {
      configurable: true,
      get() {
        return viewBoxInfo.height
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

  const targetSize = 36
  const targetDimension = Math.max(1, targetSize - 4)

  it.each(iconTestCases)(
    'does not apply extra scaling when the %s icon fills the viewBox',
    async ({ label, Icon, svgPath }) => {
      const info = getViewBoxInfo(svgPath)
      intrinsicBBox = { x: 0, y: 0, width: info.width, height: info.height }
      viewBoxInfo = info

      const { container } = render(<NavIcon Icon={Icon} label={label} size={targetSize} />)
      const scaleWrapper = container.querySelector('[data-nav-icon-scale]') as HTMLSpanElement | null

      expect(scaleWrapper).not.toBeNull()

      await waitFor(() => {
        if (!scaleWrapper) throw new Error('Icon scale wrapper not found')

        const actualScale = extractScale(scaleWrapper.style.transform)
        const viewBoxMaxDimension = Math.max(info.width, info.height)
        const scaledMaxDimension = Math.max(
          info.width * actualScale,
          info.height * actualScale
        )

        const expectedScale = targetDimension / targetSize

        expect(actualScale).toBeCloseTo(expectedScale, 6)
        expect(scaledMaxDimension).toBeCloseTo(viewBoxMaxDimension * expectedScale, 5)
      })
    }
  )

  it('scales up smaller artwork to fill the viewBox', async () => {
    const info = getViewBoxInfo('../../icons/catalog.svg')
    intrinsicBBox = { x: 0, y: 0, width: 16, height: 12 }
    viewBoxInfo = info

    const { container } = render(<NavIcon Icon={CatalogIcon} label="Tiny Catalog" size={targetSize} />)
    const scaleWrapper = container.querySelector('[data-nav-icon-scale]') as HTMLSpanElement | null

    expect(scaleWrapper).not.toBeNull()

    await waitFor(() => {
      if (!scaleWrapper) throw new Error('Icon scale wrapper not found')

      const actualScale = extractScale(scaleWrapper.style.transform)
      const viewBoxMaxDimension = Math.max(info.width, info.height)
      const contentMaxDimension = Math.max(16, 12)
      const expectedScale =
        (targetDimension / targetSize) * (viewBoxMaxDimension / contentMaxDimension)

      expect(actualScale).toBeCloseTo(expectedScale, 6)

      const scaledMaxDimension = Math.max(16 * actualScale, 12 * actualScale)

      expect(scaledMaxDimension).toBeCloseTo(
        viewBoxMaxDimension * (targetDimension / targetSize),
        5
      )
    })
  })

  it('recenters icons whose artwork is offset inside the viewBox', async () => {
    const info = getViewBoxInfo('../../icons/catalog.svg')
    viewBoxInfo = info
    intrinsicBBox = { x: 12, y: -8, width: info.width - 24, height: info.height - 16 }

    const { container } = render(<NavIcon Icon={CatalogIcon} label="Offset Catalog" size={targetSize} />)
    const translateWrapper = container.querySelector('[data-nav-icon-translate]') as HTMLSpanElement | null
    const scaleWrapper = container.querySelector('[data-nav-icon-scale]') as HTMLSpanElement | null

    expect(translateWrapper).not.toBeNull()
    expect(scaleWrapper).not.toBeNull()

    await waitFor(() => {
      if (!translateWrapper || !scaleWrapper) throw new Error('Icon wrappers not found')

      const actualScale = extractScale(scaleWrapper.style.transform)
      const translate = extractTranslate(translateWrapper.style.transform)

      const viewBoxCenterX = info.x + info.width / 2
      const viewBoxCenterY = info.y + info.height / 2
      const bboxCenterX = intrinsicBBox.x + intrinsicBBox.width / 2
      const bboxCenterY = intrinsicBBox.y + intrinsicBBox.height / 2

      const viewBoxMaxDimension = Math.max(info.width, info.height)
      const pixelPerViewBoxUnit =
        viewBoxMaxDimension > 0 ? targetSize / viewBoxMaxDimension : 1

      const expectedTranslateX =
        (viewBoxCenterX - bboxCenterX) * actualScale * pixelPerViewBoxUnit
      const expectedTranslateY =
        (viewBoxCenterY - bboxCenterY) * actualScale * pixelPerViewBoxUnit

      expect(translate.x).toBeCloseTo(expectedTranslateX, 5)
      expect(translate.y).toBeCloseTo(expectedTranslateY, 5)
    })
  })
})

import { describe, expect, it } from 'vitest'

import { isTypeableElement } from './isTypeableElement'

describe('isTypeableElement', () => {
  it('returns false for null', () => {
    expect(isTypeableElement(null)).toBe(false)
  })

  it('detects plain text inputs', () => {
    const input = document.createElement('input')
    expect(isTypeableElement(input)).toBe(true)
  })

  it('ignores non-text input controls', () => {
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    expect(isTypeableElement(checkbox)).toBe(false)
  })

  it('detects textareas', () => {
    const textarea = document.createElement('textarea')
    expect(isTypeableElement(textarea)).toBe(true)
  })

  it('detects content editable elements', () => {
    const div = document.createElement('div')
    div.setAttribute('contenteditable', 'true')
    document.body.appendChild(div)
    expect(isTypeableElement(div)).toBe(true)
    div.remove()
  })

  it('ignores combobox roles on non-typeable controls', () => {
    const button = document.createElement('button')
    button.setAttribute('role', 'combobox')
    expect(isTypeableElement(button)).toBe(false)
  })

  it('still ignores combobox buttons that opt into autocomplete', () => {
    const button = document.createElement('button')
    button.setAttribute('role', 'combobox')
    button.setAttribute('aria-autocomplete', 'list')
    expect(isTypeableElement(button)).toBe(false)
  })

  it('ignores combobox containers without text affordances', () => {
    const div = document.createElement('div')
    div.setAttribute('role', 'combobox')
    expect(isTypeableElement(div)).toBe(false)
  })

  it('accepts combobox roles when autocomplete is advertised', () => {
    const div = document.createElement('div')
    div.setAttribute('role', 'combobox')
    div.setAttribute('aria-autocomplete', 'list')
    expect(isTypeableElement(div)).toBe(true)
  })

  it('accepts combobox roles when autocomplete is explicitly none', () => {
    const div = document.createElement('div')
    div.setAttribute('role', 'combobox')
    div.setAttribute('aria-autocomplete', 'none')
    expect(isTypeableElement(div)).toBe(true)
  })
})

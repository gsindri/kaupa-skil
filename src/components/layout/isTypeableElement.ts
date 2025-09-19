const NON_TEXT_INPUT_TYPES = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'hidden',
  'image',
  'radio',
  'range',
  'reset',
  'submit',
])

function isContentEditableElement(element: HTMLElement): boolean {
  const contentEditable = element.getAttribute('contenteditable')
  return (
    element.isContentEditable ||
    (typeof contentEditable === 'string' && contentEditable.toLowerCase() !== 'false')
  )
}

function isTextEntryControl(element: Element): boolean {
  if (element instanceof HTMLInputElement) {
    const typeAttr = element.getAttribute('type')
    const type = (typeAttr ?? element.type ?? 'text').toLowerCase()
    if (NON_TEXT_INPUT_TYPES.has(type)) {
      return false
    }
    if (element.readOnly || element.disabled) {
      return false
    }
    return true
  }

  if (element instanceof HTMLTextAreaElement) {
    if (element.readOnly || element.disabled) {
      return false
    }
    return true
  }

  if (element instanceof HTMLElement) {
    return isContentEditableElement(element)
  }

  return false
}

export function isTypeableElement(node: Element | null): boolean {
  if (!node) {
    return false
  }

  if (isTextEntryControl(node)) {
    return true
  }

  if (!(node instanceof HTMLElement)) {
    return false
  }

  const role = node.getAttribute('role')?.toLowerCase()
  if (role === 'combobox') {
    if (node instanceof HTMLButtonElement) {
      return false
    }

    if (isTextEntryControl(node)) {
      return true
    }

    return node.hasAttribute('aria-autocomplete')
  }

  return false
}

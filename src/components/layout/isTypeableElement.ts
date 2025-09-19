export function isTypeableElement(node: Element | null): boolean {
  if (!node) return false

  if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
    return true
  }

  if (!(node instanceof HTMLElement)) {
    return false
  }

  const contentEditable = node.getAttribute('contenteditable')
  if (
    node.isContentEditable ||
    (typeof contentEditable === 'string' && contentEditable.toLowerCase() !== 'false')
  ) {
    return true
  }

  const role = node.getAttribute('role')?.toLowerCase()
  if (role === 'combobox') {
    if (node instanceof HTMLButtonElement) {
      return false
    }

    if (node.hasAttribute('aria-autocomplete')) {
      return true
    }

    return false
  }

  return false
}

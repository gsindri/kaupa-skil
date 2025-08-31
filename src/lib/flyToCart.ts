export function flyToCart(source: HTMLElement, target?: HTMLElement) {
  try {
    const cart = target || document.getElementById('mini-cart-button') as HTMLElement | null;
    if (!source || !cart) return;

    const start = source.getBoundingClientRect();
    const end = cart.getBoundingClientRect();

    const clone = source.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.left = `${start.left}px`;
    clone.style.top = `${start.top}px`;
    clone.style.width = `${start.width}px`;
    clone.style.height = `${start.height}px`;
    clone.style.pointerEvents = 'none';
    clone.style.zIndex = '1000';
    clone.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s';
    document.body.appendChild(clone);

    const translateX = end.left - start.left;
    const translateY = end.top - start.top;

    requestAnimationFrame(() => {
      clone.style.transform = `translate(${translateX}px, ${translateY}px) scale(0.3)`;
      clone.style.opacity = '0';
    });

    clone.addEventListener('transitionend', () => {
      clone.remove();
    });
  } catch {
    // Fail silently if animation cannot run
  }
}

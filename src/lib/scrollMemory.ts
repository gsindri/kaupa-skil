type Key = string;
const mem = new Map<Key, number>();

export function rememberScroll(key: Key) {
  mem.set(key, window.scrollY || document.documentElement.scrollTop || 0);
}

export function restoreScroll(key: Key) {
  const y = mem.get(key);
  if (typeof y === 'number') {
    requestAnimationFrame(() =>
      window.scrollTo({ top: y, behavior: 'instant' as ScrollBehavior }),
    );
  }
}

export function clearScroll(key: Key) {
  mem.delete(key);
}

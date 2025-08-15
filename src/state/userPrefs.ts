
export interface UserPreferences {
  includeVat: boolean;
  userMode: 'just-order' | 'balanced' | 'analytical';
  favorites: string[];
  preferredSuppliers: Record<string, string>; // itemId -> supplierId
  lastOrderGuide: string | null;
}

const STORAGE_KEY = 'qb/user-prefs';

const defaultPrefs: UserPreferences = {
  includeVat: false,
  userMode: 'just-order',
  favorites: [],
  preferredSuppliers: {},
  lastOrderGuide: null,
};

export function getUserPrefs(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultPrefs, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('Failed to load user preferences:', error);
  }
  return defaultPrefs;
}

export function saveUserPrefs(prefs: Partial<UserPreferences>): void {
  try {
    const current = getUserPrefs();
    const updated = { ...current, ...prefs };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save user preferences:', error);
  }
}

export function addToFavorites(itemId: string): void {
  const prefs = getUserPrefs();
  if (!prefs.favorites.includes(itemId)) {
    saveUserPrefs({
      favorites: [...prefs.favorites, itemId]
    });
  }
}

export function removeFromFavorites(itemId: string): void {
  const prefs = getUserPrefs();
  saveUserPrefs({
    favorites: prefs.favorites.filter(id => id !== itemId)
  });
}

export function setPreferredSupplier(itemId: string, supplierId: string): void {
  const prefs = getUserPrefs();
  saveUserPrefs({
    preferredSuppliers: {
      ...prefs.preferredSuppliers,
      [itemId]: supplierId
    }
  });
}

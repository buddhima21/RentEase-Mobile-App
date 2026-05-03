import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toggleFavorite as toggleAPI, getFavoriteIds } from '../services/favoriteService';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  // Set of favorited property ID strings — fast O(1) lookup
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load favorite IDs from server whenever the user changes (login/logout)
  const loadFavoriteIds = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    try {
      setLoading(true);
      const ids = await getFavoriteIds();
      setFavoriteIds(new Set(ids.map(String)));
    } catch (err) {
      // silently fail — not critical
      console.warn('Could not load favorite IDs:', err?.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFavoriteIds();
  }, [loadFavoriteIds]);

  /**
   * Toggle a property's favorite status.
   * Performs optimistic update so the heart animates instantly.
   * @param {string} propertyId
   * @returns {{ isFavorited: boolean }} the new state
   */
  const toggleFavorite = useCallback(async (propertyId) => {
    if (!user) return { isFavorited: false, needsLogin: true };

    const id = String(propertyId);
    const wasFavorited = favoriteIds.has(id);

    // Optimistic update
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (wasFavorited) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    try {
      const result = await toggleAPI(propertyId);
      // Reconcile with server truth
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (result.isFavorited) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
      return { isFavorited: result.isFavorited };
    } catch (err) {
      // Rollback on failure
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorited) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
      console.warn('Toggle favorite failed:', err?.message);
      return { isFavorited: wasFavorited };
    }
  }, [user, favoriteIds]);

  const isFavorited = useCallback(
    (propertyId) => favoriteIds.has(String(propertyId)),
    [favoriteIds]
  );

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorited, toggleFavorite, loading, reload: loadFavoriteIds }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}

export default FavoritesContext;

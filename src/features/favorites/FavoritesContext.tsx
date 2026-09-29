import React, { createContext, useContext, useState, useEffect } from 'react';
import { Property } from '@/types/property';
import { propertyService } from '@/services/propertyService';

interface FavoritesContextType {
  favoriteIds: string[];
  favoritesCount: number;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  getFavoriteProperties: () => Property[];
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Pre-populate with a couple of favorites for realistic feel
  const [favoriteIds, setFavoriteIds] = useState<string[]>([
    'cs-101',
    'cs-102',
  ]);

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isFavorite = (id: string) => favoriteIds.includes(id);

  const getFavoriteProperties = (): Property[] => {
    return propertyService
      .getAll()
      .filter((p) => favoriteIds.includes(p.id));
  };

  const clearFavorites = () => setFavoriteIds([]);

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        favoritesCount: favoriteIds.length,
        toggleFavorite,
        isFavorite,
        getFavoriteProperties,
        clearFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

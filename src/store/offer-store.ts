import { create } from 'zustand'
import { Offer, Favorite } from '@/lib/types'

interface OfferFilters {
  category?: string[] // Tipo de Oferta (PLR, Nutra, etc.)
  niche?: string // Nicho (Saúde, Finanças, etc.)
  country?: string
  conversion?: number
  vslSize?: string
  format?: string[]
  productType?: string
  temperature?: string
  tags?: string[]
  search?: string
}

interface OfferState {
  offers: Offer[]
  favorites: Favorite[]
  filters: OfferFilters
  setOffers: (offers: Offer[]) => void
  setFavorites: (favorites: Favorite[]) => void
  addFavorite: (favorite: Favorite) => void
  removeFavorite: (offerId: string) => void
  setFilters: (filters: Partial<OfferFilters>) => void
  clearFilters: () => void
}

export const useOfferStore = create<OfferState>((set) => ({
  offers: [],
  favorites: [],
  filters: {},
  setOffers: (offers) => set({ offers }),
  setFavorites: (favorites) => set({ favorites }),
  addFavorite: (favorite) =>
    set((state) => ({
      favorites: [...state.favorites, favorite],
    })),
  removeFavorite: (offerId) =>
    set((state) => ({
      favorites: state.favorites.filter((fav) => fav.offerId !== offerId),
    })),
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  clearFilters: () => set({ filters: {} }),
}))



import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreState {
    favorites: string[];
    reservations: string[];
    toggleFavorite: (productId: string) => void;
    reserveProduct: (productId: string) => void;
    isFavorite: (productId: string) => boolean;
    isReserved: (productId: string) => boolean;
}

export const useStore = create<StoreState>()(
    persist(
        (set, get) => ({
            favorites: [],
            reservations: [],
            toggleFavorite: (productId) => {
                const { favorites } = get();
                if (favorites.includes(productId)) {
                    set({ favorites: favorites.filter((id) => id !== productId) });
                } else {
                    set({ favorites: [...favorites, productId] });
                }
            },
            reserveProduct: (productId) => {
                const { reservations } = get();
                if (!reservations.includes(productId)) {
                    set({ reservations: [...reservations, productId] });
                }
            },
            isFavorite: (productId) => get().favorites.includes(productId),
            isReserved: (productId) => get().reservations.includes(productId),
        }),
        {
            name: 'chic-closet-storage',
        }
    )
);

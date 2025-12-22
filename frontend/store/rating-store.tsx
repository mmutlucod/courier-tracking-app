import { create } from 'zustand';
import { ratingsApi } from '../services/api/ratings';

interface Rating {
  _id: string;
  orderId: any;
  courierId: any;
  rating: number;
  comment: string;
  createdAt: string;
}

interface RatingState {
  ratings: Rating[];
  isLoading: boolean;
  error: string | null;
  createRating: (orderId: string, rating: number, comment?: string) => Promise<void>;
  fetchMyRatings: () => Promise<void>;
  clearError: () => void;
}

export const useRatingStore = create<RatingState>((set) => ({
  ratings: [],
  isLoading: false,
  error: null,

  createRating: async (orderId: string, rating: number, comment?: string) => {
    try {
      set({ isLoading: true, error: null });

      await ratingsApi.create({
        orderId,
        rating,
        comment: comment || '',
      });

      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Değerlendirme gönderilemedi',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchMyRatings: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await ratingsApi.getMyRatings();

      const ratings = (response.ratings || []).map((r: any) => ({
        ...r,
        comment: r.comment ?? '',
      }));

      set({
        ratings,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Değerlendirmeler yüklenemedi',
        isLoading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
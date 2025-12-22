import { create } from 'zustand';
import { Coordinates } from '../types/models';

interface LocationState {
  currentLocation: Coordinates | null;
  isTracking: boolean;
  speed: number;
  distance: number;
  startTime: Date | null;
  
  courierLocation: Coordinates | null;
  courierSpeed: number;
  eta: string;
  lastUpdate: string;

  setCurrentLocation: (location: Coordinates) => void;
  setTracking: (isTracking: boolean) => void;
  setSpeed: (speed: number) => void;
  updateDistance: (increment: number) => void;
  startTracking: () => void;
  stopTracking: () => void;
  
  setCourierLocation: (location: Coordinates) => void;
  setCourierSpeed: (speed: number) => void;
  setETA: (eta: string) => void;
  updateLastUpdate: () => void;
  resetCourierTracking: () => void;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  currentLocation: null,
  isTracking: false,
  speed: 0,
  distance: 0,
  startTime: null,
  
  courierLocation: null,
  courierSpeed: 0,
  eta: '--',
  lastUpdate: '--',

  setCurrentLocation: (location: Coordinates) => {
    set({ currentLocation: location });
  },

  setTracking: (isTracking: boolean) => {
    set({ isTracking });
  },

  setSpeed: (speed: number) => {
    set({ speed });
  },
  updateDistance: (increment: number) => {
    set((state) => ({
      distance: state.distance + increment,
    }));
  },
  startTracking: () => {
    set({
      isTracking: true,
      distance: 0,
      startTime: new Date(),
    });
  },

  stopTracking: () => {
    set({
      isTracking: false,
      speed: 0,
    });
  },

  setCourierLocation: (location: Coordinates) => {
    set({ courierLocation: location });
  },

  setCourierSpeed: (speed: number) => {
    set({ courierSpeed: speed });
  },

  setETA: (eta: string) => {
    set({ eta });
  },

  updateLastUpdate: () => {
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    set({ lastUpdate: timeStr });
  },

  resetCourierTracking: () => {
    set({
      courierLocation: null,
      courierSpeed: 0,
      eta: '--',
      lastUpdate: '--',
    });
  },
}));
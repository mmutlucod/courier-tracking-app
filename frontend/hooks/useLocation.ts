import * as Location from 'expo-location';
import { useState } from 'react';
import { useLocationStore } from '../store/location-store';

export const useLocation = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const { currentLocation, isTracking, speed, distance, startTime, setCurrentLocation, setSpeed, updateDistance, startTracking, stopTracking } = useLocationStore();

  const requestPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionError('Konum izni reddedildi');
        return false;
      }
      setHasPermission(true);
      setPermissionError(null);
      return true;
    } catch (error: any) {
      setPermissionError(error.message);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      setCurrentLocation(coords);
      return coords;
    } catch (error) {
      console.error('Get location error:', error);
      return null;
    }
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getElapsedTime = (): string => {
    if (!startTime) return '00:00:00';
    const now = new Date();
    const diff = now.getTime() - startTime.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatSpeed = (speedMps: number): string => (speedMps * 3.6).toFixed(1);

  return { currentLocation, isTracking, speed, distance, hasPermission, permissionError, requestPermission, getCurrentLocation, calculateDistance, startTracking, stopTracking, setSpeed, updateDistance, getElapsedTime, formatSpeed };
};
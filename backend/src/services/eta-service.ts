import { ETAData } from '../types';

export class ETAService {
  calculateETA(
    courierLat: number,
    courierLng: number,
    customerLat: number,
    customerLng: number,
    speed: number = 0
  ): ETAData {
    const distance = this.calculateDistance(
      courierLat,
      courierLng,
      customerLat,
      customerLng
    );

    const avgSpeed = speed > 0 ? speed * 3.6 : 25;
    const hours = distance / avgSpeed;
    const minutes = Math.round(hours * 60);
    const arrivalTime = new Date(Date.now() + minutes * 60000);

    return {
      distance: parseFloat(distance.toFixed(2)),
      minutes: minutes > 0 ? minutes : 1,
      arrivalTime: arrivalTime.toISOString(),
    };
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  formatETA(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} dakika`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) {
      return `${hours} saat`;
    }

    return `${hours} saat ${mins} dakika`;
  }
}
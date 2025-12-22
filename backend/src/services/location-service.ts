import { getRedisClient } from '../config/redis';
import Location from '../models/location';
import type { CourierLocation } from '../types';

export class LocationService {
  async updateCourierLocation(data: CourierLocation): Promise<void> {
    const redis = getRedisClient();
    const { courierId, lat, lng, speed, accuracy, heading, timestamp } = data;

    try {
      await redis.geoAdd('couriers:active', {
        longitude: lng,
        latitude: lat,
        member: courierId,
      });

      await redis.hSet(`courier:${courierId}`, {
        lat: lat.toString(),
        lng: lng.toString(),
        speed: (speed || 0).toString(),
        accuracy: (accuracy || 0).toString(),
        heading: (heading || 0).toString(),
        timestamp: (timestamp || Date.now()).toString(),
        lastUpdate: Date.now().toString(),
        status: 'active',
      });

      await redis.expire(`courier:${courierId}`, 3600);

      await Location.create({
        courierId,
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        speed: speed || 0,
        accuracy,
        heading,
        timestamp: new Date(timestamp || Date.now()),
      } as any);
    } catch (error) {
      console.error('Location update error:', error);
      throw error;
    }
  }

  async getCourierLocation(courierId: string) {
    const redis = getRedisClient();

    try {
      const data = await redis.hGetAll(`courier:${courierId}`);

      if (!data.lat || !data.lng) {
        return null;
      }

      return {
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lng),
        speed: parseFloat(data.speed || '0'),
        accuracy: parseFloat(data.accuracy || '0'),
        heading: parseFloat(data.heading || '0'),
        timestamp: parseInt(data.timestamp || '0'),
        lastUpdate: parseInt(data.lastUpdate || '0'),
        status: data.status || 'unknown',
      };
    } catch (error) {
      console.error('Get location error:', error);
      return null;
    }
  }

  async getCourierLocationHistory(
    courierId: string,
    orderId?: string,
    limit: number = 50
  ) {
    try {
      const query: any = { courierId };
      if (orderId) query.orderId = orderId;

      const locations = await Location.find(query)
        .sort({ timestamp: -1 })
        .limit(limit);

      return locations.map((loc) => ({
        lat: loc.location.coordinates[1],
        lng: loc.location.coordinates[0],
        speed: loc.speed,
        timestamp: loc.timestamp,
      }));
    } catch (error) {
      console.error('Get location history error:', error);
      return [];
    }
  }

  async getNearbyCouriers(lat: number, lng: number, radiusKm: number = 5) {
    const redis = getRedisClient();

    try {
      const results = await redis.geoRadius(
        'couriers:active',
        { longitude: lng, latitude: lat },
        radiusKm,
        'km',
        { WITHDIST: true, WITHCOORD: true } as any
      );

      return results;
    } catch (error) {
      console.error('Get nearby couriers error:', error);
      return [];
    }
  }

  async updateCourierStatus(courierId: string, status: 'active' | 'idle' | 'offline') {
    const redis = getRedisClient();

    try {
      await redis.hSet(`courier:${courierId}`, 'status', status);

      if (status === 'offline') {
        await redis.zRem('couriers:active', courierId);
        await redis.del(`courier:${courierId}`);
      }
    } catch (error) {
      console.error('Update status error:', error);
    }
  }
}
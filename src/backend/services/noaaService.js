/**
 * NOAA DATA SERVICE
 *
 * Fetches real-time environmental data from NOAA APIs
 * - Tides and currents
 * - Buoy data (wind, waves, water temp)
 * - Weather forecasts
 *
 * @module NOAAService
 */

class NOAAService {
  constructor() {
    this.noaaToken = "HrjHJiIOmumXvRBDJLfsvDfmGwKmTcqw";
    this.baseUrls = {
      tides: "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter",
      buoys: "https://www.ndbc.noaa.gov/data/realtime2",
      weather: "https://api.weather.gov",
    };

    // Sample NOAA station database
    this.stations = {
      tide: [
        { id: "8771450", name: "Galveston Bay", lat: 29.31, lng: -94.79 },
        { id: "8729108", name: "Panama City", lat: 30.15, lng: -85.67 },
        { id: "8722670", name: "Lake Worth Pier", lat: 26.61, lng: -80.03 },
      ],
      buoy: [
        { id: "42001", name: "Gulf of Mexico - West", lat: 25.9, lng: -89.7 },
        { id: "42002", name: "Gulf of Mexico - East", lat: 25.8, lng: -94.4 },
        {
          id: "42003",
          name: "Gulf of Mexico - Central",
          lat: 26.0,
          lng: -85.6,
        },
      ],
    };

    console.log("📡 NOAA service initialized");
    console.log(`   Token: ${this.noaaToken.substring(0, 8)}...`);
  }

  /**
   * Fetch tide data
   */
  async fetchTideData(stationId, date = new Date()) {
    try {
      console.log(`🌊 Fetching tide data for station ${stationId}...`);

      // Mock data for now (real API call would go here)
      return {
        station: stationId,
        data: {
          height: 2.5, // feet
          type: "high",
          nextHigh: new Date(date.getTime() + 6 * 3600000),
          nextLow: new Date(date.getTime() + 12 * 3600000),
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Error fetching tide data:", error);
      return null;
    }
  }

  /**
   * Fetch current data
   */
  async fetchCurrentData(stationId) {
    try {
      console.log(`💨 Fetching current data for station ${stationId}...`);

      // Mock data
      return {
        station: stationId,
        data: {
          speed: 0.8, // knots
          direction: 135, // degrees
          speedMps: 0.41,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Error fetching current data:", error);
      return null;
    }
  }

  /**
   * Fetch buoy data
   */
  async fetchBuoyData(buoyId) {
    try {
      console.log(`⚓ Fetching buoy data for ${buoyId}...`);

      // Mock data
      return {
        buoy: buoyId,
        data: {
          wind: {
            speed: 12, // knots
            direction: 180,
            gusts: 15,
          },
          waves: {
            height: 3.5, // feet
            period: 7, // seconds
            direction: 170,
          },
          waterTemp: 74, // Fahrenheit
          airTemp: 78,
          pressure: 1013, // mb
        },
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Error fetching buoy data:", error);
      return null;
    }
  }

  /**
   * Find nearest stations to coordinates
   */
  async findNearestStations(lat, lng, count = 5) {
    console.log(
      `📍 Finding nearest stations to ${lat.toFixed(4)}, ${lng.toFixed(4)}...`
    );

    const nearest = {
      tide: [],
      buoy: [],
    };

    // Calculate distances to all tide stations
    for (const station of this.stations.tide) {
      const distance = this.haversineDistance(
        lat,
        lng,
        station.lat,
        station.lng
      );
      nearest.tide.push({ ...station, distance });
    }

    // Calculate distances to all buoy stations
    for (const station of this.stations.buoy) {
      const distance = this.haversineDistance(
        lat,
        lng,
        station.lat,
        station.lng
      );
      nearest.buoy.push({ ...station, distance });
    }

    // Sort by distance
    nearest.tide.sort((a, b) => a.distance - b.distance);
    nearest.buoy.sort((a, b) => a.distance - b.distance);

    // Return top N
    return {
      tide: nearest.tide.slice(0, count),
      buoy: nearest.buoy.slice(0, count),
    };
  }

  /**
   * Haversine distance calculation
   */
  haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

module.exports = NOAAService;

// ===================================================================
// NOAA API Integration Service
// ===================================================================
// Fetches real environmental data from NOAA APIs
// ===================================================================

/**
 * NOAA Environmental Data Service
 * Fetches real-time marine and weather data from multiple NOAA sources
 */
class NOAAService {
  constructor() {
    // NOAA API endpoints
    this.endpoints = {
      weather: "https://api.weather.gov",
      tides: "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter",
      buoys: "https://www.ndbc.noaa.gov/data/realtime2",
      marineForecast: "https://api.weather.gov/points",
    };
  }

  /**
   * Main function to fetch all environmental data
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} Complete environmental data
   */
  async fetchAllEnvironmentalData(lat, lng) {
    console.log(`🌊 Fetching NOAA data for ${lat}, ${lng}`);

    // Fetch all data in parallel
    const [weatherData, tidesData, currentData, nearestBuoy] =
      await Promise.allSettled([
        this.getWeatherData(lat, lng),
        this.getTidesData(lat, lng),
        this.getCurrentsData(lat, lng),
        this.getNearestBuoyData(lat, lng),
      ]);

    // Combine all data
    return this.combineEnvironmentalData(
      weatherData,
      tidesData,
      currentData,
      nearestBuoy
    );
  }

  /**
   * Get weather data from NWS API
   */
  async getWeatherData(lat, lng) {
    try {
      // Get grid point for location
      const pointResponse = await fetch(
        `${this.endpoints.weather}/points/${lat.toFixed(4)},${lng.toFixed(4)}`,
        {
          headers: {
            "User-Agent": "RescueGPS/1.0 (Search and Rescue Application)",
            Accept: "application/geo+json",
          },
        }
      );

      if (!pointResponse.ok) {
        throw new Error(`Weather API error: ${pointResponse.status}`);
      }

      const pointData = await pointResponse.json();

      // Get forecast
      const forecastUrl = pointData.properties.forecast;
      const forecastResponse = await fetch(forecastUrl, {
        headers: {
          "User-Agent": "RescueGPS/1.0 (Search and Rescue Application)",
          Accept: "application/geo+json",
        },
      });

      if (!forecastResponse.ok) {
        throw new Error(`Forecast API error: ${forecastResponse.status}`);
      }

      const forecastData = await forecastResponse.json();

      // Get current observations from nearest station
      const stationsUrl = pointData.properties.observationStations;
      const stationsResponse = await fetch(stationsUrl, {
        headers: {
          "User-Agent": "RescueGPS/1.0 (Search and Rescue Application)",
          Accept: "application/geo+json",
        },
      });

      let observations = null;
      if (stationsResponse.ok) {
        const stationsData = await stationsResponse.json();
        if (stationsData.features && stationsData.features.length > 0) {
          const stationId =
            stationsData.features[0].properties.stationIdentifier;
          const obsResponse = await fetch(
            `${this.endpoints.weather}/stations/${stationId}/observations/latest`,
            {
              headers: {
                "User-Agent": "RescueGPS/1.0 (Search and Rescue Application)",
                Accept: "application/geo+json",
              },
            }
          );

          if (obsResponse.ok) {
            observations = await obsResponse.json();
          }
        }
      }

      return {
        forecast: forecastData.properties.periods[0],
        observations: observations?.properties || null,
      };
    } catch (error) {
      console.error("Weather data error:", error);
      return null;
    }
  }

  /**
   * Get tides data from CO-OPS API
   */
  async getTidesData(lat, lng) {
    try {
      // Find nearest tide station
      const station = await this.findNearestTideStation(lat, lng);
      if (!station) {
        return null;
      }

      const now = new Date();
      const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");

      // Get predictions for next 24 hours
      const url =
        `${this.endpoints.tides}?` +
        `product=predictions&` +
        `application=RescueGPS&` +
        `begin_date=${dateStr}&` +
        `range=24&` +
        `datum=MLLW&` +
        `station=${station.id}&` +
        `time_zone=gmt&` +
        `units=english&` +
        `interval=hilo&` +
        `format=json`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Tides API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.predictions && data.predictions.length > 0) {
        // Get current tide state
        const currentPrediction = data.predictions[0];
        return {
          height: parseFloat(currentPrediction.v),
          type: currentPrediction.type, // H or L
          time: currentPrediction.t,
          station: station.name,
        };
      }

      return null;
    } catch (error) {
      console.error("Tides data error:", error);
      return null;
    }
  }

  /**
   * Get ocean currents data
   */
  async getCurrentsData(lat, lng) {
    try {
      // Find nearest current station
      const station = await this.findNearestCurrentStation(lat, lng);
      if (!station) {
        return null;
      }

      const now = new Date();
      const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
      const hourStr = now.toISOString().split("T")[1].substring(0, 2) + ":00";

      const url =
        `${this.endpoints.tides}?` +
        `product=currents&` +
        `application=RescueGPS&` +
        `begin_date=${dateStr} ${hourStr}&` +
        `range=1&` +
        `station=${station.id}&` +
        `time_zone=gmt&` +
        `units=english&` +
        `format=json`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Currents API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const current = data.data[0];
        return {
          speed: parseFloat(current.s), // knots
          direction: parseFloat(current.d), // degrees
          station: station.name,
        };
      }

      return null;
    } catch (error) {
      console.error("Currents data error:", error);
      return null;
    }
  }

  /**
   * Get buoy data (waves, water temp, etc.)
   */
  async getNearestBuoyData(lat, lng) {
    try {
      // Find nearest active buoy
      const buoy = await this.findNearestBuoy(lat, lng);
      if (!buoy) {
        return null;
      }

      // Fetch latest buoy data
      const url = `${this.endpoints.buoys}/${buoy.id}.txt`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Buoy API error: ${response.status}`);
      }

      const text = await response.text();
      const lines = text.split("\n");

      // Parse the latest data (skip header lines)
      if (lines.length > 2) {
        const dataLine = lines[2].trim().split(/\s+/);

        return {
          buoyId: buoy.id,
          waveHeight: parseFloat(dataLine[8]) || null, // meters
          wavePeriod: parseFloat(dataLine[9]) || null, // seconds
          waterTemp: parseFloat(dataLine[14]) || null, // celsius
          airTemp: parseFloat(dataLine[13]) || null, // celsius
          windSpeed: parseFloat(dataLine[6]) || null, // m/s
          windDirection: parseFloat(dataLine[5]) || null, // degrees
          visibility: null, // Not typically in buoy data
        };
      }

      return null;
    } catch (error) {
      console.error("Buoy data error:", error);
      return null;
    }
  }

  /**
   * Find nearest tide station
   */
  async findNearestTideStation(lat, lng) {
    // Major US tide stations (you can expand this list)
    const stations = [
      { id: "8771450", name: "Galveston Pier 21", lat: 29.31, lng: -94.79 },
      { id: "8729108", name: "Panama City", lat: 30.15, lng: -85.67 },
      { id: "8518750", name: "The Battery NY", lat: 40.7, lng: -74.01 },
      { id: "9414290", name: "San Francisco", lat: 37.81, lng: -122.47 },
      { id: "9447130", name: "Seattle", lat: 47.6, lng: -122.34 },
      { id: "8724580", name: "Key West", lat: 24.55, lng: -81.81 },
      { id: "8665530", name: "Charleston", lat: 32.78, lng: -79.92 },
      { id: "8574680", name: "Lewes", lat: 38.78, lng: -75.12 },
    ];

    return this.findNearest(lat, lng, stations);
  }

  /**
   * Find nearest current station
   */
  async findNearestCurrentStation(lat, lng) {
    // Major current stations
    const stations = [
      { id: "PCT1301", name: "Galveston Channel", lat: 29.34, lng: -94.72 },
      { id: "ACT4176", name: "New York Harbor", lat: 40.69, lng: -74.04 },
      { id: "PCT1321", name: "Golden Gate", lat: 37.81, lng: -122.47 },
    ];

    return this.findNearest(lat, lng, stations);
  }

  /**
   * Find nearest buoy
   */
  async findNearestBuoy(lat, lng) {
    // Active NDBC buoys (expandable list)
    const buoys = [
      { id: "42019", lat: 27.91, lng: -95.35 }, // Gulf of Mexico
      { id: "42035", lat: 29.23, lng: -94.41 }, // Galveston
      { id: "41010", lat: 28.88, lng: -78.47 }, // Atlantic
      { id: "46012", lat: 37.36, lng: -122.88 }, // San Francisco
      { id: "46041", lat: 47.35, lng: -124.73 }, // Washington
      { id: "41002", lat: 32.38, lng: -75.35 }, // South Carolina
      { id: "46086", lat: 32.49, lng: -118.03 }, // Los Angeles
    ];

    return this.findNearest(lat, lng, buoys);
  }

  /**
   * Find nearest station/buoy from a list
   */
  findNearest(lat, lng, stations) {
    let nearest = null;
    let minDistance = Infinity;

    for (const station of stations) {
      const distance = this.calculateDistance(
        lat,
        lng,
        station.lat,
        station.lng
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = station;
      }
    }

    // Only return if within reasonable range (500 nautical miles)
    return minDistance < 500 ? nearest : null;
  }

  /**
   * Calculate distance in nautical miles
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Combine all environmental data into final format
   */
  combineEnvironmentalData(weatherData, tidesData, currentData, buoyData) {
    const weather =
      weatherData.status === "fulfilled" ? weatherData.value : null;
    const tides = tidesData.status === "fulfilled" ? tidesData.value : null;
    const current =
      currentData.status === "fulfilled" ? currentData.value : null;
    const buoy = buoyData.status === "fulfilled" ? buoyData.value : null;

    // Convert units where needed
    const metersToFeet = (m) => (m ? (m * 3.28084).toFixed(1) : null);
    const celsiusToFahrenheit = (c) =>
      c ? Math.round((c * 9) / 5 + 32) : null;
    const mpsToKnots = (mps) => (mps ? (mps * 1.94384).toFixed(1) : null);

    return {
      surfaceCurrent: {
        speed:
          current?.speed ||
          (buoy ? parseFloat(mpsToKnots(buoy.windSpeed)) : null),
        direction: current?.direction || buoy?.windDirection || null,
        status: current || buoy ? "success" : "error",
        source: current ? current.station : buoy ? `Buoy ${buoy.buoyId}` : null,
      },
      wind: {
        speed: weather?.observations?.windSpeed?.value
          ? parseFloat(mpsToKnots(weather.observations.windSpeed.value))
          : buoy
          ? parseFloat(mpsToKnots(buoy.windSpeed))
          : null,
        direction:
          weather?.observations?.windDirection?.value ||
          buoy?.windDirection ||
          null,
        status: weather?.observations || buoy ? "success" : "error",
        source: weather?.observations
          ? "NWS"
          : buoy
          ? `Buoy ${buoy.buoyId}`
          : null,
      },
      tides: {
        height: tides?.height || null,
        phase:
          tides?.type === "H"
            ? "High Tide"
            : tides?.type === "L"
            ? "Low Tide"
            : "Unknown",
        status: tides ? "success" : "error",
        source: tides?.station || null,
      },
      waves: {
        height: buoy?.waveHeight ? metersToFeet(buoy.waveHeight) : null,
        period: buoy?.wavePeriod || null,
        status: buoy?.waveHeight ? "success" : "error",
        source: buoy ? `Buoy ${buoy.buoyId}` : null,
      },
      waterTemp: {
        value: buoy?.waterTemp ? celsiusToFahrenheit(buoy.waterTemp) : null,
        status: buoy?.waterTemp ? "success" : "error",
        source: buoy ? `Buoy ${buoy.buoyId}` : null,
      },
      airTemp: {
        value: weather?.observations?.temperature?.value
          ? celsiusToFahrenheit(weather.observations.temperature.value)
          : buoy?.airTemp
          ? celsiusToFahrenheit(buoy.airTemp)
          : null,
        status:
          weather?.observations?.temperature?.value || buoy?.airTemp
            ? "success"
            : "error",
        source: weather?.observations
          ? "NWS"
          : buoy
          ? `Buoy ${buoy.buoyId}`
          : null,
      },
      salinity: {
        value: null, // Not commonly available from NOAA APIs
        status: "error",
        source: null,
      },
      visibility: {
        value: weather?.observations?.visibility?.value
          ? (weather.observations.visibility.value / 1852).toFixed(1)
          : null, // meters to nm
        status: weather?.observations?.visibility?.value ? "success" : "error",
        source: weather?.observations ? "NWS" : null,
      },
      forecast: {
        summary: weather?.forecast?.detailedForecast || null,
        status: weather?.forecast ? "success" : "error",
        source: "NWS",
      },
      lastUpdate: new Date(),
    };
  }
}

// Export singleton instance
export const noaaService = new NOAAService();

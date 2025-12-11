/**
 * ENVIRONMENTAL MANAGER
 *
 * Multi-source environmental data blending
 * - NOAA real-time data
 * - Operator overrides (HIGHEST PRIORITY)
 * - Weighted averaging
 * - Spatial interpolation
 *
 * @module EnvironmentalManager
 */

class EnvironmentalManager {
  constructor(config = {}) {
    this.config = {
      blendingStrategy: config.blendingStrategy || "weighted-average",
      cacheExpiration: config.cacheExpiration || 300, // 5 minutes
      ...config,
    };

    this.sources = [];
    this.operatorOverrides = [];
    this.cache = new Map();

    console.log("🌊 Environmental manager initialized");
    console.log(`   Blending strategy: ${this.config.blendingStrategy}`);
  }

  /**
   * Add environmental data source
   *
   * @param {string} name - Source name (e.g., 'NOAA-buoy-42001')
   * @param {Object} data - Environmental data
   * @param {number} weight - Source weight (0-1)
   * @param {Object} location - Optional location {lat, lng, radius}
   */
  addSource(name, data, weight = 0.5, location = null) {
    this.sources.push({
      name,
      data,
      weight,
      location,
      timestamp: Date.now(),
    });

    // Clear cache when new source added
    this.cache.clear();

    console.log(`📡 Added source: ${name} (weight: ${weight})`);
  }

  /**
   * Add operator override (HIGHEST PRIORITY)
   *
   * @param {string} type - 'wind', 'current', 'wave', 'tide'
   * @param {Object} data - Override data
   * @param {Object} location - Optional location {lat, lng, radius}
   * @param {number} weight - Override weight (default 1.0 = highest)
   */
  addOperatorOverride(type, data, location = null, weight = 1.0) {
    this.operatorOverrides.push({
      type,
      data,
      location,
      weight,
      timestamp: Date.now(),
    });

    // Clear cache when override added
    this.cache.clear();

    console.log(`👤 Operator override added: ${type} (weight: ${weight})`);
    if (location) {
      console.log(
        `   Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(
          4
        )} (radius: ${location.radius}nm)`
      );
    } else {
      console.log(`   Global override`);
    }
  }

  /**
   * Get blended environmental conditions at location
   *
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {number} time - Simulation time (seconds)
   * @returns {Object} Blended conditions
   */
  getConditionsAt(lat, lng, time) {
    const cacheKey = `${lat.toFixed(4)}_${lng.toFixed(4)}_${time}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.config.cacheExpiration * 1000) {
        return cached.data;
      }
    }

    // Get blended conditions
    const conditions = {
      wind: this.getBlendedWind(lat, lng),
      current: this.getBlendedCurrent(lat, lng),
      waves: this.getBlendedWaves(lat, lng),
      tide: this.getBlendedTide(lat, lng),
    };

    // Cache result
    this.cache.set(cacheKey, {
      data: conditions,
      timestamp: Date.now(),
    });

    return conditions;
  }

  /**
   * Get blended wind conditions
   */
  getBlendedWind(lat, lng) {
    // Check for operator overrides first (HIGHEST PRIORITY)
    const override = this.getOperatorOverride("wind", lat, lng);
    if (override) {
      return override;
    }

    // Get all wind sources
    const windSources = this.sources
      .filter((s) => s.data.wind)
      .map((s) => ({
        ...s.data.wind,
        weight: this.calculateSpatialWeight(s, lat, lng),
      }));

    if (windSources.length === 0) {
      // Default wind if no sources
      return { speed: 10, direction: 180, speedKnots: 10 }; // 10 knots from south
    }

    return this.blendData(windSources, this.config.blendingStrategy);
  }

  /**
   * Get blended current conditions
   */
  getBlendedCurrent(lat, lng) {
    // Check for operator overrides first
    const override = this.getOperatorOverride("current", lat, lng);
    if (override) {
      return override;
    }

    // Get all current sources
    const currentSources = this.sources
      .filter((s) => s.data.current)
      .map((s) => ({
        ...s.data.current,
        weight: this.calculateSpatialWeight(s, lat, lng),
      }));

    if (currentSources.length === 0) {
      // Default current if no sources
      return { speed: 0.5, direction: 90, speedKnots: 0.5 }; // 0.5 knots from east
    }

    return this.blendData(currentSources, this.config.blendingStrategy);
  }

  /**
   * Get blended wave conditions
   */
  getBlendedWaves(lat, lng) {
    const override = this.getOperatorOverride("wave", lat, lng);
    if (override) {
      return override;
    }

    const waveSources = this.sources
      .filter((s) => s.data.waves)
      .map((s) => ({
        ...s.data.waves,
        weight: this.calculateSpatialWeight(s, lat, lng),
      }));

    if (waveSources.length === 0) {
      return { height: 2, period: 6, direction: 180 }; // 2ft waves, 6s period
    }

    return this.blendData(waveSources, this.config.blendingStrategy);
  }

  /**
   * Get blended tide conditions
   */
  getBlendedTide(lat, lng) {
    const override = this.getOperatorOverride("tide", lat, lng);
    if (override) {
      return override;
    }

    const tideSources = this.sources
      .filter((s) => s.data.tide)
      .map((s) => ({
        ...s.data.tide,
        weight: this.calculateSpatialWeight(s, lat, lng),
      }));

    if (tideSources.length === 0) {
      return { height: 0, type: "high" };
    }

    return this.blendData(tideSources, this.config.blendingStrategy);
  }

  /**
   * Get operator override if it applies to this location
   */
  getOperatorOverride(type, lat, lng) {
    // Get all relevant overrides
    const relevantOverrides = this.operatorOverrides
      .filter((o) => o.type === type)
      .filter((o) => {
        if (!o.location) return true; // Global override

        // Check if point is within radius
        const distance = this.haversineDistance(
          lat,
          lng,
          o.location.lat,
          o.location.lng
        );

        const radiusMeters = o.location.radius * 1852; // Convert nm to meters
        return distance <= radiusMeters;
      });

    if (relevantOverrides.length === 0) {
      return null;
    }

    // Return highest weight override
    relevantOverrides.sort((a, b) => b.weight - a.weight);
    return relevantOverrides[0].data;
  }

  /**
   * Calculate spatial weight based on distance
   */
  calculateSpatialWeight(source, lat, lng) {
    if (!source.location) {
      return source.weight; // Use base weight if no location
    }

    const distance = this.haversineDistance(
      lat,
      lng,
      source.location.lat,
      source.location.lng
    );

    const radiusMeters = (source.location.radius || 10) * 1852;

    // Inverse distance weighting
    if (distance > radiusMeters) {
      return 0; // Outside radius
    }

    const spatialWeight = 1 - distance / radiusMeters;
    return source.weight * spatialWeight;
  }

  /**
   * Blend data using specified strategy
   */
  blendData(sources, strategy) {
    if (sources.length === 0) {
      return null;
    }

    if (sources.length === 1) {
      return sources[0];
    }

    switch (strategy) {
      case "weighted-average":
        return this.weightedAverage(sources);

      case "random-selection":
        return this.randomSelection(sources);

      case "ensemble":
        return this.ensemble(sources);

      default:
        return this.weightedAverage(sources);
    }
  }

  /**
   * Weighted average blending
   */
  weightedAverage(sources) {
    const totalWeight = sources.reduce((sum, s) => sum + s.weight, 0);

    if (totalWeight === 0) {
      return sources[0];
    }

    // Blend speed
    const speed =
      sources.reduce((sum, s) => {
        return sum + (s.speed || s.speedKnots || 0) * s.weight;
      }, 0) / totalWeight;

    // Blend direction (circular mean)
    const sinSum = sources.reduce((sum, s) => {
      const dir = s.direction || 0;
      return sum + Math.sin((dir * Math.PI) / 180) * s.weight;
    }, 0);

    const cosSum = sources.reduce((sum, s) => {
      const dir = s.direction || 0;
      return sum + Math.cos((dir * Math.PI) / 180) * s.weight;
    }, 0);

    let direction = (Math.atan2(sinSum, cosSum) * 180) / Math.PI;
    if (direction < 0) direction += 360;

    return {
      speed,
      speedKnots: speed,
      direction,
      blendedFrom: sources.length,
    };
  }

  /**
   * Random selection (Monte Carlo)
   */
  randomSelection(sources) {
    const totalWeight = sources.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;

    for (const source of sources) {
      random -= source.weight;
      if (random <= 0) {
        return source;
      }
    }

    return sources[sources.length - 1];
  }

  /**
   * Ensemble approach (return all sources)
   */
  ensemble(sources) {
    return {
      ensemble: sources,
      count: sources.length,
    };
  }

  /**
   * Haversine distance calculation
   */
  haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
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

  /**
   * Set blending strategy
   */
  setBlendingStrategy(strategy) {
    this.config.blendingStrategy = strategy;
    this.cache.clear();
    console.log(`🔄 Blending strategy changed to: ${strategy}`);
  }

  /**
   * Clear all sources
   */
  clearSources() {
    this.sources = [];
    this.cache.clear();
    console.log("🗑️  All sources cleared");
  }

  /**
   * Clear all operator overrides
   */
  clearOverrides() {
    this.operatorOverrides = [];
    this.cache.clear();
    console.log("🗑️  All operator overrides cleared");
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      sourceCount: this.sources.length,
      overrideCount: this.operatorOverrides.length,
      cacheSize: this.cache.size,
      blendingStrategy: this.config.blendingStrategy,
    };
  }
}

module.exports = EnvironmentalManager;

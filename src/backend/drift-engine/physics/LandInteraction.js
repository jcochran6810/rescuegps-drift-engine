/**
 * LAND INTERACTION MODEL
 *
 * Water-only zones and shore collision
 * - Prevents particles from drifting onto land
 * - Beaching simulation
 * - Shallow water effects
 * - River/estuary mixing
 *
 * @module LandInteraction
 */

class LandInteraction {
  constructor(config = {}) {
    this.config = {
      useGoogleMapsAPI: config.useGoogleMapsAPI || false,
      coastlineResolution: config.coastlineResolution || "medium",
      shallowWaterDepth: config.shallowWaterDepth || 10, // meters
      ...config,
    };

    // Simplified coastline data (Gulf of Mexico example)
    // In production, this would be loaded from NOAA coastline database
    this.coastlineData = this.loadCoastlineData();

    console.log("🏖️  Land interaction model initialized");
    console.log(`   Coastline resolution: ${this.config.coastlineResolution}`);
    console.log(
      `   Google Maps API: ${
        this.config.useGoogleMapsAPI ? "enabled" : "disabled"
      }`
    );
  }

  /**
   * Check if position is on water
   *
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Object} {onWater: boolean, distanceToShore: meters}
   */
  isOnWater(lat, lng) {
    // Simplified check - in production would use actual coastline data
    // or Google Maps API

    if (this.config.useGoogleMapsAPI) {
      return this.checkWaterGoogleMaps(lat, lng);
    }

    // Simple polygon check using coastline data
    const onWater = this.pointInWaterPolygon(lat, lng);
    const distanceToShore = this.calculateDistanceToShore(lat, lng);

    return {
      onWater,
      distanceToShore,
    };
  }

  /**
   * Handle shore collision
   * Determines if particle beaches or bounces
   */
  handleShoreCollision(prevLat, prevLng, newLat, newLng) {
    // Check if path crosses land
    const crossesLand = this.pathCrossesLand(prevLat, prevLng, newLat, newLng);

    if (!crossesLand) {
      return {
        beached: false,
        newLat: newLat,
        newLng: newLng,
      };
    }

    // Find intersection point with coastline
    const intersection = this.findCoastlineIntersection(
      prevLat,
      prevLng,
      newLat,
      newLng
    );

    // Determine if particle beaches (based on angle and speed)
    const beachingProbability = 0.7; // 70% chance of beaching on shore collision

    if (Math.random() < beachingProbability) {
      return {
        beached: true,
        beachLat: intersection.lat,
        beachLng: intersection.lng,
        beachTime: Date.now(),
      };
    } else {
      // Bounce back slightly offshore
      return {
        beached: false,
        newLat: prevLat,
        newLng: prevLng,
      };
    }
  }

  /**
   * Apply shallow water effects
   * Reduces drift speed in shallow water
   */
  applyShallowWaterEffects(lat, lng, drift) {
    const depth = this.getWaterDepth(lat, lng);

    if (depth > this.config.shallowWaterDepth) {
      return drift; // Deep water - no effect
    }

    // Reduce drift in shallow water
    let reductionFactor = 1.0;

    if (depth < 5) {
      reductionFactor = 0.5; // 50% reduction
    } else if (depth < this.config.shallowWaterDepth) {
      reductionFactor = 0.7; // 30% reduction
    }

    return {
      deltaLat: drift.deltaLat * reductionFactor,
      deltaLng: drift.deltaLng * reductionFactor,
    };
  }

  /**
   * Apply river/estuary flow
   * Additional drift in river mouths
   */
  applyRiverFlow(lat, lng, drift) {
    // Check if in river/estuary zone
    const riverFlow = this.getRiverFlow(lat, lng);

    if (!riverFlow) {
      return drift;
    }

    // Add river flow component
    return {
      deltaLat: drift.deltaLat + riverFlow.deltaLat,
      deltaLng: drift.deltaLng + riverFlow.deltaLng,
    };
  }

  /**
   * Check if path crosses land
   */
  pathCrossesLand(lat1, lng1, lat2, lng2) {
    // Sample points along path
    const steps = 10;

    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const testLat = lat1 + (lat2 - lat1) * ratio;
      const testLng = lng1 + (lng2 - lng1) * ratio;

      const check = this.isOnWater(testLat, testLng);
      if (!check.onWater) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find intersection point with coastline
   */
  findCoastlineIntersection(lat1, lng1, lat2, lng2) {
    // Binary search for intersection point
    let lowRatio = 0;
    let highRatio = 1;

    for (let i = 0; i < 10; i++) {
      const midRatio = (lowRatio + highRatio) / 2;
      const testLat = lat1 + (lat2 - lat1) * midRatio;
      const testLng = lng1 + (lng2 - lng1) * midRatio;

      const check = this.isOnWater(testLat, testLng);

      if (check.onWater) {
        lowRatio = midRatio;
      } else {
        highRatio = midRatio;
      }
    }

    const finalRatio = (lowRatio + highRatio) / 2;

    return {
      lat: lat1 + (lat2 - lat1) * finalRatio,
      lng: lng1 + (lng2 - lng1) * finalRatio,
    };
  }

  /**
   * Find nearest water point
   * Used to keep particles in water
   */
  findNearestWater(lat, lng) {
    // Simple approach - move back toward previous position
    // In production, would use actual coastline data

    const searchRadius = 0.01; // degrees
    const steps = 8;

    for (let r = 0.001; r < searchRadius; r += 0.001) {
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * 2 * Math.PI;
        const testLat = lat + r * Math.cos(angle);
        const testLng = lng + r * Math.sin(angle);

        const check = this.isOnWater(testLat, testLng);
        if (check.onWater) {
          return { lat: testLat, lng: testLng };
        }
      }
    }

    return { lat, lng }; // Fallback
  }

  /**
   * Point-in-polygon check (simplified)
   */
  pointInWaterPolygon(lat, lng) {
    // Simplified - assumes Gulf of Mexico region
    // In production, would use actual water polygons

    // Very basic check - assumes everything is water for now
    // Real implementation would check against coastline polygons
    return true;
  }

  /**
   * Calculate distance to nearest shore
   */
  calculateDistanceToShore(lat, lng) {
    // Simplified - would use actual coastline data in production
    return 1000; // meters (placeholder)
  }

  /**
   * Get water depth at location
   */
  getWaterDepth(lat, lng) {
    // Simplified - would use bathymetry data in production
    return 50; // meters (placeholder)
  }

  /**
   * Get river flow at location
   */
  getRiverFlow(lat, lng) {
    // Simplified - would check against river mouth database
    return null; // No river flow (placeholder)
  }

  /**
   * Check water using Google Maps API (placeholder)
   */
  checkWaterGoogleMaps(lat, lng) {
    // This would make actual API call in production
    return {
      onWater: true,
      distanceToShore: 1000,
    };
  }

  /**
   * Load coastline data
   */
  loadCoastlineData() {
    // Simplified coastline data
    // In production, would load from NOAA or OpenStreetMap
    return {
      gulfOfMexico: {
        // Polygon coordinates would go here
        coordinates: [],
      },
    };
  }
}

module.exports = LandInteraction;

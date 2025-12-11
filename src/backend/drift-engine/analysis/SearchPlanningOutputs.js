/**
 * SEARCH PLANNING OUTPUTS
 *
 * Professional search planning recommendations:
 * - Track spacing based on visibility
 * - Search patterns (parallel, expanding square, sector)
 * - Probability of Detection (POD) curves
 * - Resource allocation
 * - Time estimates
 *
 * @module SearchPlanningOutputs
 */

class SearchPlanningOutputs {
  constructor(config = {}) {
    this.config = {
      defaultVisibility: config.defaultVisibility || 2.0, // nm
      searchEffectiveness: config.searchEffectiveness || 0.85,
      sweepWidthMultiplier: config.sweepWidthMultiplier || 0.8,
      ...config,
    };

    console.log("🔍 Search planning initialized");
  }

  /**
   * Calculate recommended track spacing
   *
   * @param {Object} conditions - Weather/sea conditions
   * @param {string} platform - 'vessel', 'helicopter', 'fixed-wing'
   */
  calculateTrackSpacing(conditions, platform = "vessel") {
    const visibility = this.calculateEffectiveVisibility(conditions);
    const sweepWidth = this.calculateSweepWidth(visibility, platform);
    const trackSpacing = sweepWidth * this.config.sweepWidthMultiplier;

    return {
      sweepWidth: sweepWidth,
      sweepWidthNm: sweepWidth / 1852,
      trackSpacing: trackSpacing,
      trackSpacingNm: trackSpacing / 1852,
      trackSpacingYards: trackSpacing * 1.09361,
      visibility: visibility,
      visibilityNm: visibility / 1852,
      platform: platform,
      conditions: this.categorizeConditions(conditions),
    };
  }

  /**
   * Calculate effective visibility
   */
  calculateEffectiveVisibility(conditions) {
    let baseVisibility = this.config.defaultVisibility * 1852; // to meters

    // Weather adjustments
    if (conditions.weather) {
      const weatherFactors = {
        clear: 1.0,
        hazy: 0.7,
        fog: 0.3,
        rain: 0.5,
        storm: 0.2,
      };
      baseVisibility *= weatherFactors[conditions.weather] || 0.7;
    }

    // Sea state adjustments
    if (conditions.seaState) {
      if (conditions.seaState >= 5) baseVisibility *= 0.6;
      else if (conditions.seaState >= 3) baseVisibility *= 0.8;
    }

    // Time of day
    if (conditions.timeOfDay === "night") baseVisibility *= 0.3;
    else if (
      conditions.timeOfDay === "dusk" ||
      conditions.timeOfDay === "dawn"
    ) {
      baseVisibility *= 0.6;
    }

    return baseVisibility;
  }

  /**
   * Calculate sweep width
   */
  calculateSweepWidth(visibility, platform) {
    const platformMultipliers = {
      vessel: 1.0,
      helicopter: 1.5,
      "fixed-wing": 2.0,
      drone: 0.8,
    };

    return visibility * 2 * (platformMultipliers[platform] || 1.0);
  }

  /**
   * Generate Probability of Detection (POD) curve
   *
   * @param {Object} conditions - Search conditions
   * @param {number} maxTime - Maximum time (hours)
   */
  generatePODCurve(conditions, maxTime = 12) {
    const curve = [];

    for (let t = 0; t <= maxTime; t += 0.5) {
      const pod = this.calculatePOD(t, conditions);

      curve.push({
        time: t,
        pod: pod.pod,
        percentage: pod.percentage,
        coverage: pod.coverage,
      });
    }

    return curve;
  }

  /**
   * Calculate POD at given time
   */
  calculatePOD(searchTime, conditions) {
    const sweepRate = this.calculateSweepRate(conditions);
    const searchArea = conditions.searchArea || 100; // square nm

    // POD = 1 - e^(-coverage)
    const coverage = (sweepRate * searchTime) / searchArea;
    const pod = 1 - Math.exp(-coverage * this.config.searchEffectiveness);

    return {
      pod: pod,
      percentage: Math.round(pod * 100),
      coverage: coverage,
      searchTime: searchTime,
      sweepRate: sweepRate,
    };
  }

  /**
   * Calculate sweep rate (square nm per hour)
   */
  calculateSweepRate(conditions) {
    const trackSpacing = this.calculateTrackSpacing(conditions, "vessel");
    const searchSpeed = conditions.searchSpeed || 6; // knots

    return searchSpeed * trackSpacing.sweepWidthNm;
  }

  /**
   * Generate resource recommendations
   */
  generateResourceRecommendations(searchArea, conditions) {
    const areaSizeNm = this.calculateAreaSize(searchArea);

    const vesselsNeeded = Math.ceil(areaSizeNm / 50); // 1 per 50 sq nm
    const helicoptersNeeded = Math.max(1, Math.ceil(areaSizeNm / 200));

    return {
      vessels: {
        recommended: vesselsNeeded,
        type: "Search vessel",
        speed: "6-10 knots",
        coverage: "~50 sq nm per vessel",
      },
      helicopters: {
        recommended: helicoptersNeeded,
        type: "Search helicopter",
        speed: "60-80 knots",
        coverage: "~200 sq nm per helicopter",
      },
      searchArea: areaSizeNm,
      priority: this.getSearchPriority(conditions),
    };
  }

  /**
   * Calculate area size in square nautical miles
   */
  calculateAreaSize(area) {
    if (!area.polygon || area.polygon.length < 3) {
      return 10; // Default
    }

    // Simple polygon area calculation
    let sum = 0;
    for (let i = 0; i < area.polygon.length; i++) {
      const j = (i + 1) % area.polygon.length;
      sum += area.polygon[i].lng * area.polygon[j].lat;
      sum -= area.polygon[j].lng * area.polygon[i].lat;
    }

    const areaDegrees = Math.abs(sum) / 2;
    const areaMeters = areaDegrees * 111320 * 111320;
    return areaMeters / (1852 * 1852); // Convert to sq nm
  }

  /**
   * Get search priority
   */
  getSearchPriority(conditions) {
    if (conditions.survivalProbability && conditions.survivalProbability < 25) {
      return "CRITICAL";
    } else if (
      conditions.survivalProbability &&
      conditions.survivalProbability < 50
    ) {
      return "HIGH";
    }
    return "MEDIUM";
  }

  /**
   * Categorize conditions
   */
  categorizeConditions(conditions) {
    const categories = [];

    if (conditions.weather === "storm" || conditions.seaState >= 5) {
      categories.push("SEVERE");
    } else if (conditions.weather === "rain" || conditions.seaState >= 3) {
      categories.push("MODERATE");
    } else {
      categories.push("GOOD");
    }

    if (conditions.timeOfDay === "night") {
      categories.push("NIGHT");
    }

    return categories.join(", ");
  }

  /**
   * Export complete search plan
   */
  exportSearchPlan(searchArea, conditions, survivability) {
    const trackSpacing = this.calculateTrackSpacing(conditions, "vessel");
    const podCurve = this.generatePODCurve(conditions, 12);
    const resources = this.generateResourceRecommendations(searchArea, {
      ...conditions,
      survivalProbability: survivability,
    });

    return {
      trackSpacing,
      podCurve,
      resources,
      summary: {
        searchArea: this.calculateAreaSize(searchArea),
        expectedPOD: podCurve[podCurve.length - 1]?.percentage || 0,
        priority: resources.priority,
      },
    };
  }
}

module.exports = SearchPlanningOutputs;

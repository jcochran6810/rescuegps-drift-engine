/**
 * OBJECT DYNAMICS MODEL
 *
 * SAROPS-based leeway coefficients for different object types
 * - 16 object types (persons, rafts, vessels, debris)
 * - Wind-driven leeway (1-6% of wind speed)
 * - Deflection angles (10-30 degrees)
 * - Stochastic variation
 *
 * @module ObjectDynamics
 */

class ObjectDynamics {
  constructor(objectType = "person-in-water", customParams = null) {
    this.objectType = objectType;

    // SAROPS leeway coefficients database
    this.leewayCoefficients = {
      // PERSONS
      "person-in-water": {
        leewayRate: 0.03, // 3% of wind speed
        deflectionAngle: 20, // degrees
        jibeFrequency: 0.5, // probability per hour
        description: "Person in water (PIW)",
      },
      "person-with-pfd": {
        leewayRate: 0.035,
        deflectionAngle: 18,
        jibeFrequency: 0.4,
        description: "Person with PFD/life jacket",
      },
      "person-in-drysuit": {
        leewayRate: 0.04,
        deflectionAngle: 15,
        jibeFrequency: 0.3,
        description: "Person in survival/dry suit",
      },

      // LIFE RAFTS
      "life-raft-4": {
        leewayRate: 0.05,
        deflectionAngle: 15,
        jibeFrequency: 0.6,
        description: "4-person life raft",
      },
      "life-raft-6": {
        leewayRate: 0.048,
        deflectionAngle: 16,
        jibeFrequency: 0.55,
        description: "6-person life raft",
      },
      "life-raft-10": {
        leewayRate: 0.045,
        deflectionAngle: 18,
        jibeFrequency: 0.5,
        description: "10+ person life raft",
      },

      // VESSELS
      "vessel-small": {
        leewayRate: 0.06,
        deflectionAngle: 10,
        jibeFrequency: 0.2,
        description: "Small vessel (<20ft)",
      },
      "vessel-medium": {
        leewayRate: 0.055,
        deflectionAngle: 12,
        jibeFrequency: 0.25,
        description: "Medium vessel (20-40ft)",
      },
      sailboat: {
        leewayRate: 0.05,
        deflectionAngle: 25,
        jibeFrequency: 0.7,
        description: "Sailboat (dismasted)",
      },

      // SMALL CRAFT
      kayak: {
        leewayRate: 0.04,
        deflectionAngle: 30,
        jibeFrequency: 0.8,
        description: "Kayak",
      },
      canoe: {
        leewayRate: 0.045,
        deflectionAngle: 28,
        jibeFrequency: 0.75,
        description: "Canoe",
      },
      surfboard: {
        leewayRate: 0.035,
        deflectionAngle: 25,
        jibeFrequency: 0.9,
        description: "Surfboard",
      },
      paddleboard: {
        leewayRate: 0.038,
        deflectionAngle: 22,
        jibeFrequency: 0.85,
        description: "Stand-up paddleboard (SUP)",
      },

      // DEBRIS
      "debris-wood": {
        leewayRate: 0.025,
        deflectionAngle: 35,
        jibeFrequency: 0.95,
        description: "Wooden debris",
      },
      "debris-plastic": {
        leewayRate: 0.04,
        deflectionAngle: 30,
        jibeFrequency: 0.9,
        description: "Plastic debris/containers",
      },
      cooler: {
        leewayRate: 0.045,
        deflectionAngle: 20,
        jibeFrequency: 0.6,
        description: "Ice chest/cooler",
      },
    };

    // Use custom parameters or lookup from database
    if (customParams) {
      this.params = customParams;
    } else {
      this.params =
        this.leewayCoefficients[objectType] ||
        this.leewayCoefficients["person-in-water"];
    }

    console.log("⛵ Object dynamics initialized");
    console.log(`   Type: ${this.params.description}`);
    console.log(`   Leeway: ${this.params.leewayRate * 100}% of wind`);
    console.log(`   Deflection: ${this.params.deflectionAngle}°`);
  }

  /**
   * Calculate total drift from wind and current
   *
   * @param {Object} wind - {speed: knots, direction: degrees}
   * @param {Object} current - {speed: knots, direction: degrees}
   * @param {number} timeStep - Time step in seconds
   * @returns {Object} {deltaLat, deltaLng}
   */
  calculateDrift(wind, current, timeStep) {
    // Current-driven drift (100% of current)
    const currentDrift = this.calculateCurrentDrift(current, timeStep);

    // Wind-driven leeway
    const leewayDrift = this.calculateLeeway(wind, timeStep);

    // Combine drifts
    return {
      deltaLat: currentDrift.deltaLat + leewayDrift.deltaLat,
      deltaLng: currentDrift.deltaLng + leewayDrift.deltaLng,
      currentComponent: currentDrift,
      leewayComponent: leewayDrift,
    };
  }

  /**
   * Calculate current-driven drift (100% of current)
   */
  calculateCurrentDrift(current, timeStep) {
    const speedMps = current.speed * 0.514444; // knots to m/s
    const distanceMeters = speedMps * timeStep;

    const direction = (current.direction * Math.PI) / 180;

    // Calculate displacement
    const deltaLat = (distanceMeters * Math.cos(direction)) / 111320;
    const deltaLng =
      (distanceMeters * Math.sin(direction)) / (111320 * Math.cos(0)); // Simplified

    return { deltaLat, deltaLng };
  }

  /**
   * Calculate wind-driven leeway drift
   */
  calculateLeeway(wind, timeStep) {
    // Get stochastic leeway rate
    const leewayRate = this.getStochasticLeeway();

    // Calculate leeway speed (percentage of wind)
    const leewaySpeed = wind.speed * leewayRate;
    const leewaySpeedMps = leewaySpeed * 0.514444; // knots to m/s

    // Get deflection angle (crosswind component)
    const deflection = this.getStochasticDeflection();

    // Calculate leeway direction (wind direction + deflection)
    const leewayDirection = ((wind.direction + deflection) * Math.PI) / 180;

    // Calculate distance
    const distanceMeters = leewaySpeedMps * timeStep;

    // Calculate displacement
    const deltaLat = (distanceMeters * Math.cos(leewayDirection)) / 111320;
    const deltaLng =
      (distanceMeters * Math.sin(leewayDirection)) / (111320 * Math.cos(0));

    return { deltaLat, deltaLng };
  }

  /**
   * Get stochastic leeway rate (adds randomness)
   */
  getStochasticLeeway() {
    const baseRate = this.params.leewayRate;
    const variation = baseRate * 0.2; // ±20% variation

    return baseRate + (Math.random() - 0.5) * 2 * variation;
  }

  /**
   * Get stochastic deflection angle (adds randomness)
   */
  getStochasticDeflection() {
    const baseAngle = this.params.deflectionAngle;
    const variation = 10; // ±10 degrees

    // Random left or right deflection
    const side = Math.random() < 0.5 ? -1 : 1;
    const angle = baseAngle + (Math.random() - 0.5) * 2 * variation;

    return angle * side;
  }

  /**
   * Simulate jibe (direction reversal)
   * Returns true if jibe occurs this time step
   */
  shouldJibe(timeStep) {
    const hoursElapsed = timeStep / 3600;
    const jibeProbability = this.params.jibeFrequency * hoursElapsed;

    return Math.random() < jibeProbability;
  }

  /**
   * Get object parameters
   */
  getParameters() {
    return this.params;
  }

  /**
   * Get available object types
   */
  static getAvailableObjectTypes() {
    const instance = new ObjectDynamics();
    return Object.keys(instance.leewayCoefficients).map((key) => ({
      type: key,
      ...instance.leewayCoefficients[key],
    }));
  }

  /**
   * Change object type
   */
  setObjectType(objectType) {
    this.objectType = objectType;
    this.params =
      this.leewayCoefficients[objectType] ||
      this.leewayCoefficients["person-in-water"];

    console.log(`🔄 Object type changed to: ${this.params.description}`);
  }
}

module.exports = ObjectDynamics;

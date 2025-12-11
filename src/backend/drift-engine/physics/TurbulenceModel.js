/**
 * TURBULENCE MODEL
 *
 * Stochastic ocean turbulence simulation
 * - Brownian motion (random walk)
 * - Horizontal diffusion
 * - Eddy effects
 * - Wind gusts
 *
 * @module TurbulenceModel
 */

class TurbulenceModel {
  constructor(config = {}) {
    this.config = {
      intensity: config.intensity || "medium", // 'low', 'medium', 'high'
      horizontalDiffusion: config.horizontalDiffusion || 0.1, // m²/s
      eddyScale: config.eddyScale || 1000, // meters
      gustProbability: config.gustProbability || 0.1,
      ...config,
    };

    // Intensity multipliers
    this.intensityMultipliers = {
      low: 0.5,
      medium: 1.0,
      high: 2.0,
    };

    this.multiplier = this.intensityMultipliers[this.config.intensity];

    console.log("🌀 Turbulence model initialized");
    console.log(`   Intensity: ${this.config.intensity} (${this.multiplier}x)`);
    console.log(`   Diffusion: ${this.config.horizontalDiffusion} m²/s`);
  }

  /**
   * Apply turbulence to particle
   *
   * @param {number} lat - Current latitude
   * @param {number} lng - Current longitude
   * @param {number} timeStep - Time step (seconds)
   * @returns {Object} {deltaLat, deltaLng}
   */
  applyTurbulence(lat, lng, timeStep) {
    // Brownian motion (random walk)
    const brownian = this.calculateBrownianMotion(timeStep);

    // Eddy effects (organized turbulence)
    const eddy = this.calculateEddyEffect(lat, lng, timeStep);

    // Wind gusts (intermittent variations)
    const gust = this.calculateGustEffect(timeStep);

    // Combine all turbulence components
    const totalDeltaLat =
      (brownian.deltaLat + eddy.deltaLat + gust.deltaLat) * this.multiplier;
    const totalDeltaLng =
      (brownian.deltaLng + eddy.deltaLng + gust.deltaLng) * this.multiplier;

    return {
      deltaLat: totalDeltaLat,
      deltaLng: totalDeltaLng,
      components: {
        brownian,
        eddy,
        gust,
      },
    };
  }

  /**
   * Calculate Brownian motion (random walk)
   * Based on horizontal diffusion
   */
  calculateBrownianMotion(timeStep) {
    // Standard deviation = sqrt(2 * diffusion * time)
    const sigma = Math.sqrt(2 * this.config.horizontalDiffusion * timeStep);

    // Generate random displacement (Gaussian distribution)
    const deltaX = this.gaussianRandom() * sigma;
    const deltaY = this.gaussianRandom() * sigma;

    // Convert to lat/lng
    const deltaLat = deltaY / 111320;
    const deltaLng = deltaX / 111320;

    return { deltaLat, deltaLng };
  }

  /**
   * Calculate eddy effect (organized turbulence)
   * Uses pseudo-random field based on position
   */
  calculateEddyEffect(lat, lng, timeStep) {
    // Normalize position to eddy scale
    const x = (lng * 111320) / this.config.eddyScale;
    const y = (lat * 111320) / this.config.eddyScale;

    // Simple Perlin-like noise approximation
    const eddyStrength = 0.05; // m/s

    const vx =
      Math.sin(x * 2 * Math.PI) * Math.cos(y * 2 * Math.PI) * eddyStrength;
    const vy =
      Math.cos(x * 2 * Math.PI) * Math.sin(y * 2 * Math.PI) * eddyStrength;

    const distanceX = vx * timeStep;
    const distanceY = vy * timeStep;

    const deltaLat = distanceY / 111320;
    const deltaLng = distanceX / 111320;

    return { deltaLat, deltaLng };
  }

  /**
   * Calculate wind gust effect
   * Intermittent random bursts
   */
  calculateGustEffect(timeStep) {
    // Check if gust occurs
    if (Math.random() > this.config.gustProbability) {
      return { deltaLat: 0, deltaLng: 0 };
    }

    // Gust occurs - random direction and strength
    const gustStrength = 0.5 + Math.random() * 1.5; // 0.5-2.0 m/s
    const gustDirection = Math.random() * 2 * Math.PI;

    const distanceX = Math.cos(gustDirection) * gustStrength * timeStep;
    const distanceY = Math.sin(gustDirection) * gustStrength * timeStep;

    const deltaLat = distanceY / 111320;
    const deltaLng = distanceX / 111320;

    return { deltaLat, deltaLng };
  }

  /**
   * Gaussian random number generator (Box-Muller transform)
   */
  gaussianRandom() {
    let u1 = Math.random();
    let u2 = Math.random();

    // Avoid log(0)
    if (u1 === 0) u1 = 1e-10;

    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  /**
   * Calculate dispersion rate
   * How fast the particle cloud spreads
   */
  calculateDispersionRate(timeStep) {
    // Dispersion = sqrt(4 * diffusion * time)
    const dispersionMeters = Math.sqrt(
      4 * this.config.horizontalDiffusion * timeStep
    );

    return {
      meters: dispersionMeters,
      nauticalMiles: dispersionMeters / 1852,
    };
  }

  /**
   * Set turbulence intensity
   */
  setIntensity(intensity) {
    this.config.intensity = intensity;
    this.multiplier = this.intensityMultipliers[intensity] || 1.0;

    console.log(
      `🌀 Turbulence intensity changed to: ${intensity} (${this.multiplier}x)`
    );
  }

  /**
   * Get current configuration
   */
  getConfiguration() {
    return {
      ...this.config,
      multiplier: this.multiplier,
    };
  }
}

module.exports = TurbulenceModel;

/**
 * MULTI-VICTIM ENGINE
 *
 * Manages multiple simultaneous victim simulations
 * - Individual probability zones per victim
 * - Combined zones (all victims together)
 * - Intersection zones (where all victims likely are)
 * - Per-victim survivability
 * - Priority rankings
 *
 * @module MultiVictimEngine
 */

const ParticleEngine = require("../core/ParticleEngine");
const DensityCalculator = require("./DensityCalculator");
const SurvivalModel = require("../physics/SurvivalModel");

class MultiVictimEngine {
  constructor(config = {}) {
    this.config = config;
    this.victims = [];
    this.simulations = new Map();

    console.log("👥 Multi-victim engine initialized");
  }

  /**
   * Add victim to simulation
   *
   * @param {Object} victim - Victim data
   */
  addVictim(victim) {
    this.victims.push({
      id: victim.id || `victim_${this.victims.length + 1}`,
      name: victim.name || `Victim ${this.victims.length + 1}`,
      lkp: victim.lkp, // Last Known Position
      profile: victim.profile || {}, // Age, fitness, PFD, etc.
      objectType: victim.objectType || "person-in-water",
      uncertainty: victim.uncertainty || { radius: 0.5, shape: "circular" },
      timeUncertainty: victim.timeUncertainty || { window: 30 },
    });

    console.log(`➕ Added victim: ${victim.name || victim.id}`);
  }

  /**
   * Run simulations for all victims
   *
   * @param {Object} params - Simulation parameters
   * @param {Object} callbacks - Progress callbacks
   */
  async runAllSimulations(params, callbacks = {}) {
    console.log(
      `\n🚀 Running simulations for ${this.victims.length} victims...`
    );

    const results = [];

    for (let i = 0; i < this.victims.length; i++) {
      const victim = this.victims[i];

      console.log(
        `\n📍 Simulating victim ${i + 1}/${this.victims.length}: ${victim.name}`
      );

      // Run simulation for this victim
      const result = await this.runVictimSimulation(victim, params, {
        onProgress: (progress) => {
          if (callbacks.onVictimProgress) {
            callbacks.onVictimProgress({
              victimId: victim.id,
              victimName: victim.name,
              victimIndex: i,
              totalVictims: this.victims.length,
              progress: progress.progress,
            });
          }
        },
      });

      results.push(result);
      this.simulations.set(victim.id, result);
    }

    console.log(`\n✅ All ${this.victims.length} simulations complete!`);

    return results;
  }

  /**
   * Run simulation for single victim
   */
  async runVictimSimulation(victim, params, callbacks) {
    // Create particle engine
    const particleEngine = new ParticleEngine({
      initialParticleCount: 5000,
      finalParticleCount: params.particleCount || 200000,
      timeStep: params.timeStep || 60,
      simulationDuration: params.duration || 72,
    });

    // Initialize particles at victim's LKP
    particleEngine.initializeParticles(
      victim.lkp,
      victim.uncertainty,
      victim.timeUncertainty,
      params.particleCount || 200000
    );

    // Run simulation
    await particleEngine.runSimulation(
      {
        ...params,
        lkp: victim.lkp,
        duration: params.duration || 72,
      },
      callbacks
    );

    // Calculate density
    const densityCalc = new DensityCalculator();
    densityCalc.calculateDensityGrid(particleEngine.getCurrentParticles());
    densityCalc.generateContours([0.5, 0.75, 0.9]);
    densityCalc.generateProbabilityPolygons([0.5, 0.9]);

    // Calculate survival
    const survivalModel = new SurvivalModel(victim.profile);
    const survivalData = survivalModel.exportProfile();

    return {
      victimId: victim.id,
      victimName: victim.name,
      particles: particleEngine.getCurrentParticles(),
      snapshots: particleEngine.getSnapshots(),
      density: {
        grid: densityCalc.densityGrid,
        contours: densityCalc.contours,
        polygons: densityCalc.polygons,
        heatMap: densityCalc.exportHeatMapData(),
      },
      survival: survivalData,
      statistics: {
        totalParticles: particleEngine.getCurrentParticles().length,
        activeParticles: particleEngine.getActiveParticleCount(),
        beachedParticles: particleEngine.getBeachedParticleCount(),
      },
    };
  }

  /**
   * Generate combined probability zone (union of all victims)
   * Shows where ANY victim might be
   */
  generateCombinedZone() {
    console.log("🔷 Generating combined probability zone...");

    if (this.simulations.size === 0) {
      console.warn("⚠️  No simulations to combine");
      return null;
    }

    // Collect all particles from all victims
    const allParticles = [];

    for (const [victimId, result] of this.simulations) {
      allParticles.push(...result.particles);
    }

    // Calculate combined density
    const densityCalc = new DensityCalculator();
    densityCalc.calculateDensityGrid(allParticles);
    densityCalc.generateProbabilityPolygons([0.5, 0.9]);

    console.log(`✅ Combined zone: ${allParticles.length} particles`);

    return {
      type: "combined",
      totalParticles: allParticles.length,
      density: densityCalc.densityGrid,
      polygons: densityCalc.polygons,
      heatMap: densityCalc.exportHeatMapData(),
    };
  }

  /**
   * Generate intersection probability zone
   * Shows where ALL victims are likely to be together
   */
  generateIntersectionZone() {
    console.log("🔶 Generating intersection probability zone...");

    if (this.simulations.size < 2) {
      console.warn("⚠️  Need at least 2 victims for intersection");
      return null;
    }

    // Get all polygons
    const polygons = [];

    for (const [victimId, result] of this.simulations) {
      if (result.density.polygons.length > 0) {
        // Use 50% polygon
        const polygon50 = result.density.polygons.find(
          (p) => p.percentage === 50
        );
        if (polygon50) {
          polygons.push(polygon50.polygon);
        }
      }
    }

    if (polygons.length < 2) {
      console.warn("⚠️  Not enough polygons for intersection");
      return null;
    }

    // Calculate intersection (simplified - would use proper polygon intersection in production)
    const intersection = this.calculatePolygonIntersection(polygons);

    console.log(`✅ Intersection zone calculated`);

    return {
      type: "intersection",
      victimCount: this.simulations.size,
      polygon: intersection,
      area: this.calculatePolygonArea(intersection),
    };
  }

  /**
   * Calculate polygon intersection (simplified)
   */
  calculatePolygonIntersection(polygons) {
    // Simplified - in production would use proper polygon clipping
    // For now, return the smallest bounding box that intersects all

    let minLat = -Infinity,
      maxLat = Infinity;
    let minLng = -Infinity,
      maxLng = Infinity;

    for (const polygon of polygons) {
      const bounds = this.getPolygonBounds(polygon);

      minLat = Math.max(minLat, bounds.minLat);
      maxLat = Math.min(maxLat, bounds.maxLat);
      minLng = Math.max(minLng, bounds.minLng);
      maxLng = Math.min(maxLng, bounds.maxLng);
    }

    // Create rectangle polygon
    return [
      { lat: minLat, lng: minLng },
      { lat: minLat, lng: maxLng },
      { lat: maxLat, lng: maxLng },
      { lat: maxLat, lng: minLng },
    ];
  }

  /**
   * Get polygon bounds
   */
  getPolygonBounds(polygon) {
    let minLat = Infinity,
      maxLat = -Infinity;
    let minLng = Infinity,
      maxLng = -Infinity;

    for (const point of polygon) {
      if (point.lat < minLat) minLat = point.lat;
      if (point.lat > maxLat) maxLat = point.lat;
      if (point.lng < minLng) minLng = point.lng;
      if (point.lng > maxLng) maxLng = point.lng;
    }

    return { minLat, maxLat, minLng, maxLng };
  }

  /**
   * Calculate polygon area
   */
  calculatePolygonArea(polygon) {
    if (polygon.length < 3) return 0;

    let area = 0;

    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      area += polygon[i].lng * polygon[j].lat;
      area -= polygon[j].lng * polygon[i].lat;
    }

    area = Math.abs(area) / 2;

    const metersPerDegree = 111320;
    return area * metersPerDegree * metersPerDegree;
  }

  /**
   * Get victim priority list (sorted by survival urgency)
   *
   * @param {number} hoursElapsed - Hours since incident
   */
  getVictimPriorityList(hoursElapsed) {
    const priorities = [];

    for (const [victimId, result] of this.simulations) {
      const survivalModel = new SurvivalModel(
        this.victims.find((v) => v.id === victimId).profile
      );

      const priority = survivalModel.getSearchPriorityScore(hoursElapsed);
      const survival = survivalModel.calculateSurvivalProbability(hoursElapsed);

      priorities.push({
        victimId: victimId,
        victimName: result.victimName,
        priorityScore: priority,
        survivalProbability: survival.probability,
        survivalPercentage: survival.percentage,
        urgency: survival.urgency,
        timeRemaining: survival.timeRemaining,
      });
    }

    // Sort by priority (highest first)
    priorities.sort((a, b) => b.priorityScore - a.priorityScore);

    return priorities;
  }

  /**
   * Export all results
   */
  exportAll() {
    return {
      victims: this.victims,
      simulations: Array.from(this.simulations.values()),
      combined: this.generateCombinedZone(),
      intersection: this.generateIntersectionZone(),
      priorities: this.getVictimPriorityList(0),
    };
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      victimCount: this.victims.length,
      simulationCount: this.simulations.size,
      totalParticles: Array.from(this.simulations.values()).reduce(
        (sum, r) => sum + r.statistics.totalParticles,
        0
      ),
    };
  }
}

module.exports = MultiVictimEngine;

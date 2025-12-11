/**
 * PARTICLE ENGINE
 *
 * Core Monte Carlo particle simulation engine
 * - Progressive loading (5k → 200k particles)
 * - Time cohorts for uncertainty
 * - Hourly snapshots
 * - 60-second time steps
 *
 * @module ParticleEngine
 */

class ParticleEngine {
  constructor(config = {}) {
    this.config = {
      initialParticleCount: config.initialParticleCount || 5000,
      finalParticleCount: config.finalParticleCount || 200000,
      timeStep: config.timeStep || 60, // seconds
      simulationDuration: config.simulationDuration || 72, // hours
      ...config,
    };

    this.particles = [];
    this.snapshots = [];
    this.currentTime = 0;

    console.log("🌊 Particle engine initialized");
    console.log(`   Initial particles: ${this.config.initialParticleCount}`);
    console.log(`   Final particles: ${this.config.finalParticleCount}`);
    console.log(`   Duration: ${this.config.simulationDuration} hours`);
  }

  /**
   * Initialize particles at Last Known Position (LKP)
   *
   * @param {Object} lkp - {lat, lng}
   * @param {Object} uncertainty - {radius: nm, shape: 'circular'}
   * @param {Object} timeUncertainty - {window: minutes}
   * @param {number} particleCount - Number of particles to create
   */
  initializeParticles(lkp, uncertainty, timeUncertainty, particleCount) {
    console.log(`🎲 Initializing ${particleCount} particles at LKP...`);

    this.particles = [];
    const radiusMeters = (uncertainty.radius || 0.5) * 1852; // Convert nm to meters
    const timeWindowSeconds = (timeUncertainty.window || 30) * 60; // Convert minutes to seconds

    for (let i = 0; i < particleCount; i++) {
      // Random position within uncertainty radius
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.sqrt(Math.random()) * radiusMeters;

      const deltaLat = (distance * Math.cos(angle)) / 111320;
      const deltaLng =
        (distance * Math.sin(angle)) /
        (111320 * Math.cos((lkp.lat * Math.PI) / 180));

      // Random time cohort (±timeWindow)
      const timeCohort = (Math.random() - 0.5) * 2 * timeWindowSeconds;

      this.particles.push({
        id: i,
        lat: lkp.lat + deltaLat,
        lng: lkp.lng + deltaLng,
        timeCohort: timeCohort, // Particle starts this many seconds before/after t=0
        status: "active", // 'active', 'beached', 'out-of-bounds'
        history: [
          {
            time: 0,
            lat: lkp.lat + deltaLat,
            lng: lkp.lng + deltaLng,
          },
        ],
      });
    }

    console.log(`✅ ${particleCount} particles initialized`);
  }

  /**
   * Run progressive simulation
   * Shows preliminary results quickly, then refines
   */
  async runProgressiveSimulation(params, callbacks = {}) {
    console.log("\n🚀 Starting progressive simulation...");

    // PHASE 1: Quick preliminary results (5k particles)
    console.log("📊 PHASE 1: Preliminary results (5k particles)...");

    this.initializeParticles(
      params.lkp,
      params.uncertainty,
      params.timeUncertainty,
      this.config.initialParticleCount
    );

    await this.runSimulation(params, {
      onProgress: (progress) => {
        if (callbacks.onProgress) {
          callbacks.onProgress({
            phase: "preliminary",
            progress: progress.progress * 0.5,
          });
        }
      },
    });

    // Notify preliminary results ready
    if (callbacks.onPreliminaryResults) {
      callbacks.onPreliminaryResults({
        particles: this.particles,
        snapshots: this.snapshots,
        particleCount: this.config.initialParticleCount,
      });
    }

    console.log("✅ Preliminary results ready!");

    // PHASE 2: Full resolution (200k particles)
    console.log("📊 PHASE 2: Full resolution (200k particles)...");

    this.initializeParticles(
      params.lkp,
      params.uncertainty,
      params.timeUncertainty,
      params.particleCount || this.config.finalParticleCount
    );

    await this.runSimulation(params, {
      onProgress: (progress) => {
        if (callbacks.onProgress) {
          callbacks.onProgress({
            phase: "full",
            progress: 50 + progress.progress * 0.5,
          });
        }
      },
    });

    console.log("✅ Full simulation complete!");

    return {
      particles: this.particles,
      snapshots: this.snapshots,
      particleCount: this.particles.length,
    };
  }

  /**
   * Run simulation for specified duration
   */
  async runSimulation(params, callbacks = {}) {
    const duration = params.duration || this.config.simulationDuration;
    const totalSteps = (duration * 3600) / this.config.timeStep;

    console.log(
      `⏱️  Running simulation: ${duration} hours (${totalSteps} steps)`
    );

    for (let step = 0; step < totalSteps; step++) {
      this.currentTime += this.config.timeStep;

      // Advance all particles
      this.advanceParticles(
        this.config.timeStep,
        params.environmentalManager,
        params.physicsModels
      );

      // Capture hourly snapshots
      const currentHour = Math.floor(this.currentTime / 3600);
      if (this.currentTime % 3600 === 0) {
        this.captureSnapshot(currentHour);
      }

      // Progress callback
      if (callbacks.onProgress && step % 100 === 0) {
        callbacks.onProgress({
          step: step,
          totalSteps: totalSteps,
          progress: (step / totalSteps) * 100,
          currentHour: currentHour,
        });
      }
    }

    console.log(`✅ Simulation complete: ${duration} hours`);
  }

  /**
   * Advance all particles by one time step
   */
  advanceParticles(timeStep, environmentalManager, physicsModels) {
    for (const particle of this.particles) {
      if (particle.status !== "active") continue;

      // Get environmental conditions at particle location
      const conditions = environmentalManager.getConditionsAt(
        particle.lat,
        particle.lng,
        this.currentTime
      );

      // Calculate drift from object dynamics
      const drift = physicsModels.objectDynamics.calculateDrift(
        conditions.wind,
        conditions.current,
        timeStep
      );

      // Add turbulence
      const turbulence = physicsModels.turbulence.applyTurbulence(
        particle.lat,
        particle.lng,
        timeStep
      );

      // Calculate new position
      let newLat = particle.lat + drift.deltaLat + turbulence.deltaLat;
      let newLng = particle.lng + drift.deltaLng + turbulence.deltaLng;

      // Check land interaction
      const landCheck = physicsModels.landInteraction.isOnWater(newLat, newLng);

      if (!landCheck.onWater) {
        // Handle shore collision
        const collision = physicsModels.landInteraction.handleShoreCollision(
          particle.lat,
          particle.lng,
          newLat,
          newLng
        );

        if (collision.beached) {
          particle.status = "beached";
          newLat = collision.beachLat;
          newLng = collision.beachLng;
        } else {
          // Find nearest water point
          const nearestWater = physicsModels.landInteraction.findNearestWater(
            newLat,
            newLng
          );
          newLat = nearestWater.lat;
          newLng = nearestWater.lng;
        }
      }

      // Update particle
      particle.lat = newLat;
      particle.lng = newLng;

      // Record history
      particle.history.push({
        time: this.currentTime,
        lat: newLat,
        lng: newLng,
      });
    }
  }

  /**
   * Capture snapshot of current particle positions
   */
  captureSnapshot(hour) {
    const snapshot = {
      hour: hour,
      time: this.currentTime,
      particles: this.particles.map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        status: p.status,
      })),
      statistics: {
        active: this.particles.filter((p) => p.status === "active").length,
        beached: this.particles.filter((p) => p.status === "beached").length,
        total: this.particles.length,
      },
    };

    this.snapshots.push(snapshot);

    console.log(
      `📸 Snapshot ${hour}h: ${snapshot.statistics.active} active particles`
    );
  }

  /**
   * Adjust particle count (for user control)
   */
  adjustParticleCount(newCount, params) {
    console.log(`🔄 Adjusting particle count to ${newCount}...`);

    this.initializeParticles(
      params.lkp,
      params.uncertainty,
      params.timeUncertainty,
      newCount
    );
  }

  /**
   * Get current particles
   */
  getCurrentParticles() {
    return this.particles;
  }

  /**
   * Get all snapshots
   */
  getSnapshots() {
    return this.snapshots;
  }

  /**
   * Get snapshot at specific hour
   */
  getSnapshotAtHour(hour) {
    return this.snapshots.find((s) => s.hour === hour);
  }

  /**
   * Get active particle count
   */
  getActiveParticleCount() {
    return this.particles.filter((p) => p.status === "active").length;
  }

  /**
   * Get beached particle count
   */
  getBeachedParticleCount() {
    return this.particles.filter((p) => p.status === "beached").length;
  }

  /**
   * Export particles as GeoJSON
   */
  exportGeoJSON() {
    return {
      type: "FeatureCollection",
      features: this.particles.map((p) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [p.lng, p.lat],
        },
        properties: {
          id: p.id,
          status: p.status,
        },
      })),
    };
  }
}

module.exports = ParticleEngine;

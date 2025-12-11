/**
 * TIME-STEPPING SIMULATOR
 *
 * Manages forward and backward simulations
 * - Forward: Predict future drift
 * - Backward: Reconstruct past drift
 * - Hourly snapshots
 * - Timeline interpolation
 *
 * @module TimeSteppingSimulator
 */

class TimeSteppingSimulator {
  constructor(config = {}) {
    this.config = {
      timeStep: config.timeStep || 60, // seconds
      snapshotInterval: config.snapshotInterval || 3600, // 1 hour
      ...config,
    };

    this.currentTime = 0;
    this.snapshots = [];

    console.log("⏱️  Time-stepping simulator initialized");
    console.log(`   Time step: ${this.config.timeStep}s`);
    console.log(`   Snapshot interval: ${this.config.snapshotInterval}s`);
  }

  /**
   * Run forward simulation (predict future)
   *
   * @param {Array} particles - Initial particles
   * @param {number} duration - Simulation duration (hours)
   * @param {Object} environmentalManager - Environmental data manager
   * @param {Object} physicsModels - Physics models
   * @param {Function} onProgress - Progress callback
   */
  async runForwardSimulation(
    particles,
    duration,
    environmentalManager,
    physicsModels,
    onProgress
  ) {
    console.log(`\n⏩ Running forward simulation: ${duration} hours`);

    this.currentTime = 0;
    this.snapshots = [];

    const totalSteps = (duration * 3600) / this.config.timeStep;

    // Initial snapshot
    this.captureSnapshot(0, particles);

    for (let step = 0; step < totalSteps; step++) {
      this.currentTime += this.config.timeStep;

      // Advance all particles
      this.advanceParticles(
        particles,
        this.config.timeStep,
        environmentalManager,
        physicsModels
      );

      // Capture snapshot at intervals
      if (this.currentTime % this.config.snapshotInterval === 0) {
        const hour = Math.floor(this.currentTime / 3600);
        this.captureSnapshot(hour, particles);
      }

      // Progress callback
      if (onProgress && step % 100 === 0) {
        onProgress({
          step,
          totalSteps,
          progress: (step / totalSteps) * 100,
          currentTime: this.currentTime,
          currentHour: Math.floor(this.currentTime / 3600),
        });
      }
    }

    console.log(
      `✅ Forward simulation complete: ${this.snapshots.length} snapshots`
    );

    return {
      snapshots: this.snapshots,
      finalParticles: particles,
    };
  }

  /**
   * Run backward simulation (reconstruct past)
   *
   * @param {Array} particles - Current particles
   * @param {number} duration - How far back (hours)
   * @param {Object} environmentalManager - Environmental data manager
   * @param {Object} physicsModels - Physics models
   */
  async runBackwardSimulation(
    particles,
    duration,
    environmentalManager,
    physicsModels
  ) {
    console.log(`\n⏪ Running backward simulation: ${duration} hours`);

    this.currentTime = 0;
    this.snapshots = [];

    const totalSteps = (duration * 3600) / this.config.timeStep;

    // Initial snapshot (present)
    this.captureSnapshot(0, particles);

    for (let step = 0; step < totalSteps; step++) {
      this.currentTime -= this.config.timeStep; // Go backward

      // Reverse drift
      this.advanceParticles(
        particles,
        -this.config.timeStep, // Negative time step
        environmentalManager,
        physicsModels
      );

      // Capture snapshot
      if (Math.abs(this.currentTime) % this.config.snapshotInterval === 0) {
        const hour = Math.floor(Math.abs(this.currentTime) / 3600);
        this.captureSnapshot(-hour, particles);
      }
    }

    console.log(
      `✅ Backward simulation complete: ${this.snapshots.length} snapshots`
    );

    return {
      snapshots: this.snapshots,
      initialParticles: particles,
    };
  }

  /**
   * Advance particles by one time step
   */
  advanceParticles(particles, timeStep, environmentalManager, physicsModels) {
    for (const particle of particles) {
      if (particle.status !== "active") continue;

      // Get environmental conditions
      const conditions = environmentalManager.getConditionsAt(
        particle.lat,
        particle.lng,
        this.currentTime
      );

      // Calculate drift
      const drift = physicsModels.objectDynamics.calculateDrift(
        conditions.wind,
        conditions.current,
        timeStep
      );

      // Add turbulence
      const turbulence = physicsModels.turbulence.applyTurbulence(
        particle.lat,
        particle.lng,
        Math.abs(timeStep)
      );

      // Apply direction based on forward/backward
      const direction = timeStep > 0 ? 1 : -1;

      // Calculate new position
      let newLat =
        particle.lat + (drift.deltaLat + turbulence.deltaLat) * direction;
      let newLng =
        particle.lng + (drift.deltaLng + turbulence.deltaLng) * direction;

      // Check land interaction
      const landCheck = physicsModels.landInteraction.isOnWater(newLat, newLng);

      if (!landCheck.onWater) {
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
    }
  }

  /**
   * Capture snapshot of particle positions
   */
  captureSnapshot(hour, particles) {
    const snapshot = {
      hour,
      time: this.currentTime,
      timestamp: new Date(Date.now() + this.currentTime * 1000),
      particles: particles.map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        status: p.status,
      })),
      statistics: {
        active: particles.filter((p) => p.status === "active").length,
        beached: particles.filter((p) => p.status === "beached").length,
        outOfBounds: particles.filter((p) => p.status === "out-of-bounds")
          .length,
        total: particles.length,
      },
    };

    this.snapshots.push(snapshot);

    const direction = this.currentTime >= 0 ? "⏩" : "⏪";
    console.log(
      `📸 ${direction} Snapshot ${hour}h: ${snapshot.statistics.active} active particles`
    );
  }

  /**
   * Get snapshot at specific hour
   */
  getSnapshotAtHour(hour) {
    return this.snapshots.find((s) => s.hour === hour);
  }

  /**
   * Interpolate particle positions at specific time
   * (For smooth timeline scrubbing)
   */
  interpolateAtTime(targetTime) {
    // Find surrounding snapshots
    const before = this.snapshots
      .filter((s) => s.time <= targetTime)
      .sort((a, b) => b.time - a.time)[0];

    const after = this.snapshots
      .filter((s) => s.time >= targetTime)
      .sort((a, b) => a.time - b.time)[0];

    if (!before || !after || before.hour === after.hour) {
      return before || after || this.snapshots[0];
    }

    // Interpolate between snapshots
    const totalDuration = after.time - before.time;
    const elapsed = targetTime - before.time;
    const ratio = elapsed / totalDuration;

    const interpolatedParticles = before.particles.map((beforeParticle, i) => {
      const afterParticle = after.particles[i];

      return {
        id: beforeParticle.id,
        lat:
          beforeParticle.lat + (afterParticle.lat - beforeParticle.lat) * ratio,
        lng:
          beforeParticle.lng + (afterParticle.lng - beforeParticle.lng) * ratio,
        status: afterParticle.status,
      };
    });

    return {
      hour: targetTime / 3600,
      time: targetTime,
      particles: interpolatedParticles,
      interpolated: true,
    };
  }

  /**
   * Generate time slices for visualization
   * (60-second intervals)
   */
  generateTimeSlices(duration) {
    const slices = [];
    const totalSeconds = duration * 3600;

    for (let t = 0; t <= totalSeconds; t += 60) {
      slices.push({
        time: t,
        hour: t / 3600,
        label: this.formatTime(t),
      });
    }

    return slices;
  }

  /**
   * Format time for display
   */
  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  }

  /**
   * Get all snapshots
   */
  getAllSnapshots() {
    return this.snapshots;
  }

  /**
   * Get snapshots in time range
   */
  getSnapshotsInRange(startHour, endHour) {
    return this.snapshots.filter(
      (s) => s.hour >= startHour && s.hour <= endHour
    );
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      totalSnapshots: this.snapshots.length,
      currentTime: this.currentTime,
      currentHour: Math.floor(this.currentTime / 3600),
      timeStep: this.config.timeStep,
      snapshotInterval: this.config.snapshotInterval,
    };
  }

  /**
   * Export snapshots as array
   */
  exportSnapshots() {
    return this.snapshots.map((s) => ({
      hour: s.hour,
      time: s.time,
      timestamp: s.timestamp,
      particleCount: s.particles.length,
      activeCount: s.statistics.active,
      beachedCount: s.statistics.beached,
    }));
  }

  /**
   * Reset simulator
   */
  reset() {
    this.currentTime = 0;
    this.snapshots = [];
    console.log("🔄 Simulator reset");
  }
}

module.exports = TimeSteppingSimulator;

/**
 * SURVIVAL MODEL
 *
 * Time-based survival probability calculations
 * - Water temperature effects
 * - Age/fitness modifiers
 * - PFD/clothing effects
 * - 30-minute breakdown
 *
 * @module SurvivalModel
 */

class SurvivalModel {
  constructor(victimProfile = {}) {
    this.profile = {
      age: victimProfile.age || 35,
      gender: victimProfile.gender || "male",
      fitness: victimProfile.fitness || "average", // 'poor', 'average', 'good', 'excellent'
      bodyComposition: victimProfile.bodyComposition || "average", // 'lean', 'average', 'heavy'

      // Protection
      pfd: victimProfile.pfd || false,
      clothing: victimProfile.clothing || "light", // 'none', 'light', 'moderate', 'heavy', 'drysuit', 'wetsuit'

      // Medical
      consciousness: victimProfile.consciousness || "conscious",
      medicalConditions: victimProfile.medicalConditions || [],
      injuries: victimProfile.injuries || [],

      // Environmental
      waterTemp: victimProfile.waterTemp || 72, // Fahrenheit
      airTemp: victimProfile.airTemp || 75,

      ...victimProfile,
    };

    console.log("💚 Survival model initialized");
    console.log(
      `   Age: ${this.profile.age}, Fitness: ${this.profile.fitness}`
    );
    console.log(`   Water temp: ${this.profile.waterTemp}°F`);
    console.log(
      `   PFD: ${this.profile.pfd ? "Yes" : "No"}, Clothing: ${
        this.profile.clothing
      }`
    );
  }

  /**
   * Calculate survival probability at given time
   *
   * @param {number} hoursElapsed - Hours since incident
   * @returns {Object} Survival data
   */
  calculateSurvivalProbability(hoursElapsed) {
    const expectedSurvival = this.calculateExpectedSurvivalTime();

    // Exponential decay model
    const lambda = 1 / expectedSurvival; // Decay rate
    const probability = Math.exp(-lambda * hoursElapsed);

    return {
      probability: probability,
      percentage: Math.round(probability * 100),
      hoursElapsed: hoursElapsed,
      expectedSurvivalTime: expectedSurvival,
      timeRemaining: Math.max(0, expectedSurvival - hoursElapsed),
      urgency: this.getUrgency(probability),
    };
  }

  /**
   * Calculate expected survival time (50% survival point)
   */
  calculateExpectedSurvivalTime() {
    // Base survival time from water temperature
    let baseSurvival = this.getBaseSurvivalTime(this.profile.waterTemp);

    // Age modifier
    baseSurvival *= this.getAgeModifier(this.profile.age);

    // Fitness modifier
    baseSurvival *= this.getFitnessModifier(this.profile.fitness);

    // Body composition modifier
    baseSurvival *= this.getBodyCompositionModifier(
      this.profile.bodyComposition
    );

    // PFD effect (2-3x survival time)
    if (this.profile.pfd) {
      baseSurvival *= 2.5;
    }

    // Clothing effect
    baseSurvival *= this.getClothingModifier(this.profile.clothing);

    // Consciousness modifier
    if (this.profile.consciousness === "unconscious") {
      baseSurvival *= 0.3; // Drastically reduced
    }

    // Medical conditions
    if (this.profile.medicalConditions.length > 0) {
      baseSurvival *= 0.7;
    }

    return baseSurvival;
  }

  /**
   * Get base survival time from water temperature
   * Based on hypothermia research
   */
  getBaseSurvivalTime(waterTempF) {
    // Temperature ranges and survival times (hours)
    if (waterTempF < 32) return 0.25; // 15 minutes
    if (waterTempF < 40) return 1.5; // 30-90 minutes
    if (waterTempF < 50) return 2; // 1-3 hours
    if (waterTempF < 60) return 4; // 1-6 hours
    if (waterTempF < 70) return 8; // 2-12 hours
    if (waterTempF < 80) return 24; // 6-40 hours
    return 48; // 12+ hours
  }

  /**
   * Age modifier (peak survival at 20-30 years)
   */
  getAgeModifier(age) {
    if (age < 10) return 0.6;
    if (age < 20) return 0.8;
    if (age < 40) return 1.0; // Peak
    if (age < 60) return 0.9;
    if (age < 70) return 0.7;
    return 0.5;
  }

  /**
   * Fitness modifier
   */
  getFitnessModifier(fitness) {
    const modifiers = {
      poor: 0.7,
      average: 1.0,
      good: 1.2,
      excellent: 1.4,
    };
    return modifiers[fitness] || 1.0;
  }

  /**
   * Body composition modifier (fat provides insulation)
   */
  getBodyCompositionModifier(composition) {
    const modifiers = {
      lean: 0.8,
      average: 1.0,
      heavy: 1.3,
    };
    return modifiers[composition] || 1.0;
  }

  /**
   * Clothing modifier
   */
  getClothingModifier(clothing) {
    const modifiers = {
      none: 1.0,
      light: 1.2,
      moderate: 1.5,
      heavy: 2.0,
      wetsuit: 3.0,
      drysuit: 4.0,
    };
    return modifiers[clothing] || 1.0;
  }

  /**
   * Generate 30-minute survival breakdown
   */
  generate30MinuteBreakdown() {
    const breakdown = [];
    const maxTime = Math.min(this.calculateExpectedSurvivalTime() * 2, 72); // Up to 72 hours

    for (let hours = 0; hours <= maxTime; hours += 0.5) {
      const data = this.calculateSurvivalProbability(hours);

      breakdown.push({
        hours: hours,
        minutes: hours * 60,
        timeLabel: this.formatTime(hours),
        probability: data.probability,
        percentage: data.percentage,
        status: this.getSurvivalStatus(data.percentage),
      });
    }

    return breakdown;
  }

  /**
   * Get survival status
   */
  getSurvivalStatus(percentage) {
    if (percentage >= 75) return "GOOD";
    if (percentage >= 50) return "MODERATE";
    if (percentage >= 25) return "CRITICAL";
    return "UNLIKELY";
  }

  /**
   * Get urgency level
   */
  getUrgency(probability) {
    if (probability >= 0.75) return "LOW";
    if (probability >= 0.5) return "MEDIUM";
    if (probability >= 0.25) return "HIGH";
    return "CRITICAL";
  }

  /**
   * Format time
   */
  formatTime(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);

    if (m === 0) {
      return `${h}h`;
    } else {
      return `${h}h ${m}m`;
    }
  }

  /**
   * Get search priority score (0-100)
   * Higher = more urgent
   */
  getSearchPriorityScore(hoursElapsed) {
    const survival = this.calculateSurvivalProbability(hoursElapsed);

    // Invert probability (lower survival = higher priority)
    const baseScore = (1 - survival.probability) * 100;

    // Boost for medical conditions
    let boost = 0;
    if (this.profile.consciousness === "unconscious") boost += 20;
    if (this.profile.injuries.length > 0) boost += 10;
    if (!this.profile.pfd) boost += 10;

    return Math.min(100, baseScore + boost);
  }

  /**
   * Compare with another victim (for multi-victim prioritization)
   */
  compareVictims(otherVictim, hoursElapsed) {
    const myScore = this.getSearchPriorityScore(hoursElapsed);
    const theirScore = otherVictim.getSearchPriorityScore(hoursElapsed);

    return myScore - theirScore; // Positive = I'm higher priority
  }

  /**
   * Export complete survival profile
   */
  exportProfile() {
    const current = this.calculateSurvivalProbability(0);
    const breakdown = this.generate30MinuteBreakdown();

    return {
      profile: this.profile,
      current: current,
      breakdown: breakdown,
      expectedSurvivalTime: this.calculateExpectedSurvivalTime(),
    };
  }
}

module.exports = SurvivalModel;

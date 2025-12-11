/**
 * SIMULATION CONTROLLER
 *
 * Main API controller for drift simulations
 * Orchestrates all modules and provides REST endpoints
 *
 * @module SimulationController
 */

const ParticleEngine = require("../core/ParticleEngine");
const EnvironmentalManager = require("../core/EnvironmentalManager");
const TimeSteppingSimulator = require("../core/TimeSteppingSimulator");
const ObjectDynamics = require("../physics/ObjectDynamics");
const TurbulenceModel = require("../physics/TurbulenceModel");
const LandInteraction = require("../physics/LandInteraction");
const SurvivalModel = require("../physics/SurvivalModel");
const DensityCalculator = require("../analysis/DensityCalculator");
const MultiVictimEngine = require("../analysis/MultiVictimEngine");
const SearchPlanningOutputs = require("../analysis/SearchPlanningOutputs");

class SimulationController {
  constructor() {
    this.activeSimulations = new Map();
    this.simulationCounter = 0;

    console.log("🎮 Simulation controller initialized");
  }

  /**
   * Start new simulation
   *
   * POST /api/simulations
   */
  async startSimulation(params) {
    const simulationId = `sim_${++this.simulationCounter}_${Date.now()}`;

    console.log(`\n🚀 Starting simulation ${simulationId}...`);
    console.log(`   Incident: ${params.incidentId}`);
    console.log(`   Victims: ${params.victims?.length || 1}`);
    console.log(`   Duration: ${params.duration || 72} hours`);

    const context = {
      id: simulationId,
      incidentId: params.incidentId,
      status: "initializing",
      progress: 0,
      startedAt: new Date(),
      params: params,
    };

    this.activeSimulations.set(simulationId, context);

    this.runSimulation(simulationId, params).catch((error) => {
      console.error(`Simulation ${simulationId} failed:`, error);
      context.status = "failed";
      context.error = error.message;
    });

    return {
      simulationId,
      status: "queued",
      message: "Simulation started",
    };
  }

  /**
   * Run complete simulation
   */
  async runSimulation(simulationId, params) {
    const context = this.activeSimulations.get(simulationId);
    context.status = "running";

    try {
      console.log("📦 Initializing modules...");

      const environmentalManager = new EnvironmentalManager({
        blendingStrategy: params.blendingStrategy || "weighted-average",
      });

      const objectDynamics = new ObjectDynamics(
        params.objectType || "person-in-water",
        params.customLeewayParams
      );

      const turbulence = new TurbulenceModel({
        intensity: params.turbulenceIntensity || "medium",
      });

      const landInteraction = new LandInteraction({
        useGoogleMapsAPI: true,
      });

      // Add operator overrides if provided
      if (params.operatorOverrides) {
        for (const override of params.operatorOverrides) {
          environmentalManager.addOperatorOverride(
            override.type,
            override.data,
            override.location,
            override.weight || 1.0
          );
        }
      }

      // Multi-victim or single victim?
      if (params.victims && params.victims.length > 1) {
        context.result = await this.runMultiVictimSimulation(
          simulationId,
          params,
          environmentalManager,
          { objectDynamics, turbulence, landInteraction }
        );
      } else {
        context.result = await this.runSingleVictimSimulation(
          simulationId,
          params,
          environmentalManager,
          { objectDynamics, turbulence, landInteraction }
        );
      }

      context.status = "completed";
      context.completedAt = new Date();
      context.progress = 100;

      console.log(`✅ Simulation ${simulationId} completed!`);
    } catch (error) {
      console.error(`❌ Simulation ${simulationId} failed:`, error);
      context.status = "failed";
      context.error = error.message;
      throw error;
    }
  }

  /**
   * Run single victim simulation
   */
  async runSingleVictimSimulation(
    simulationId,
    params,
    envManager,
    physicsModels
  ) {
    const context = this.activeSimulations.get(simulationId);

    const particleEngine = new ParticleEngine({
      initialParticleCount: 5000,
      finalParticleCount: params.particleCount || 200000,
      timeStep: params.timeStep || 60,
      simulationDuration: params.duration || 72,
    });

    await particleEngine.runProgressiveSimulation(
      {
        lkp: params.lkp,
        uncertainty: params.uncertainty || { radius: 0.5, shape: "circular" },
        timeUncertainty: params.timeUncertainty || { window: 30 },
        particleCount: params.particleCount || 200000,
        environmentalManager: envManager,
        physicsModels: physicsModels,
        duration: params.duration || 72,
      },
      {
        onPreliminaryResults: (result) => {
          context.preliminaryResult = result;
          context.progress = 50;
          console.log(
            `  ⚡ Preliminary results ready (${result.particleCount} particles)`
          );
        },
        onProgress: (progress) => {
          context.progress = 50 + progress.progress * 0.5;
        },
      }
    );

    console.log("📊 Calculating probability density...");
    const densityCalc = new DensityCalculator();
    densityCalc.calculateDensityGrid(particleEngine.getCurrentParticles());
    densityCalc.generateContours([0.5, 0.75, 0.9]);
    densityCalc.generateProbabilityPolygons([0.5, 0.9]);

    console.log("💚 Calculating survival probability...");
    const survivalModel = new SurvivalModel(params.victimProfile || {});
    const survivalData = survivalModel.exportProfile();

    console.log("🔍 Generating search plan...");
    const searchPlanning = new SearchPlanningOutputs();
    const searchPlan = searchPlanning.exportSearchPlan(
      { polygon: densityCalc.polygons[1]?.polygon || [] },
      params.searchConditions || {},
      survivalData.current.percentage
    );

    return {
      particles: particleEngine.getCurrentParticles(),
      snapshots: particleEngine.getSnapshots(),
      density: {
        grid: densityCalc.densityGrid,
        contours: densityCalc.contours,
        polygons: densityCalc.polygons,
        heatMap: densityCalc.exportHeatMapData(),
        statistics: densityCalc.getStatistics(),
      },
      survival: survivalData,
      searchPlan: searchPlan,
      statistics: {
        totalParticles: particleEngine.getCurrentParticles().length,
        activeParticles: particleEngine.getActiveParticleCount(),
        beachedParticles: particleEngine.getBeachedParticleCount(),
        simulationDuration: params.duration,
        particleCount: params.particleCount,
      },
    };
  }

  /**
   * Run multi-victim simulation
   */
  async runMultiVictimSimulation(
    simulationId,
    params,
    envManager,
    physicsModels
  ) {
    const context = this.activeSimulations.get(simulationId);

    const multiVictim = new MultiVictimEngine();

    for (const victim of params.victims) {
      multiVictim.addVictim(victim);
    }

    const results = await multiVictim.runAllSimulations(
      {
        particleCount: params.particleCount || 200000,
        duration: params.duration || 72,
        timeStep: params.timeStep || 60,
        uncertainty: params.uncertainty || { radius: 0.5, shape: "circular" },
        timeUncertainty: params.timeUncertainty || { window: 30 },
        environmentalManager: envManager,
        physicsModels: physicsModels,
      },
      {
        onVictimProgress: (progress) => {
          context.progress = progress.progress * 0.8;
          console.log(
            `  ${progress.victimName}: ${progress.progress.toFixed(1)}%`
          );
        },
      }
    );

    const combined = multiVictim.generateCombinedZone();
    const intersection =
      multiVictim.victims.length >= 2
        ? multiVictim.generateIntersectionZone()
        : null;

    const priorities = multiVictim.getVictimPriorityList(0);

    return {
      victims: results,
      combined: combined,
      intersection: intersection,
      priorities: priorities,
      statistics: multiVictim.getStatistics(),
    };
  }

  /**
   * Get simulation status
   */
  getSimulationStatus(simulationId) {
    const context = this.activeSimulations.get(simulationId);

    if (!context) {
      return { error: "Simulation not found", simulationId };
    }

    return {
      simulationId: context.id,
      status: context.status,
      progress: context.progress,
      startedAt: context.startedAt,
      completedAt: context.completedAt,
      error: context.error,
    };
  }

  /**
   * Get simulation results
   */
  getSimulationResults(simulationId) {
    const context = this.activeSimulations.get(simulationId);

    if (!context) {
      return { error: "Simulation not found", simulationId };
    }

    if (context.status !== "completed") {
      return {
        error: "Simulation not completed",
        status: context.status,
        progress: context.progress,
      };
    }

    return {
      simulationId: context.id,
      incidentId: context.incidentId,
      status: context.status,
      startedAt: context.startedAt,
      completedAt: context.completedAt,
      result: context.result,
    };
  }

  /**
   * Get snapshot at specific hour
   */
  getSnapshot(simulationId, hour) {
    const context = this.activeSimulations.get(simulationId);

    if (!context || !context.result) {
      return { error: "Simulation not found or not completed" };
    }

    const snapshot = context.result.snapshots?.find(
      (s) => s.hour === parseInt(hour)
    );

    if (!snapshot) {
      return { error: "Snapshot not found for hour " + hour };
    }

    return snapshot;
  }

  /**
   * List all simulations
   */
  listSimulations(filters = {}) {
    const simulations = [];

    for (const [id, context] of this.activeSimulations) {
      if (filters.incidentId && context.incidentId !== filters.incidentId) {
        continue;
      }

      if (filters.status && context.status !== filters.status) {
        continue;
      }

      simulations.push({
        simulationId: id,
        incidentId: context.incidentId,
        status: context.status,
        progress: context.progress,
        startedAt: context.startedAt,
        completedAt: context.completedAt,
      });
    }

    return simulations;
  }

  /**
   * Delete simulation
   */
  deleteSimulation(simulationId) {
    const deleted = this.activeSimulations.delete(simulationId);

    return {
      success: deleted,
      simulationId,
      message: deleted ? "Simulation deleted" : "Simulation not found",
    };
  }
}

module.exports = SimulationController;

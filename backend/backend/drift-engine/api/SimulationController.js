class SimulationController {
  constructor() {
    this.simulations = new Map();
  }

  async startSimulation(config) {
    const id = `sim_${Date.now()}`;
    
    const simulation = {
      id,
      status: 'completed',
      progress: 100,
      config,
      startTime: Date.now(),
      results: {
        particles: { total: 10000, active: 8500, beached: 1500 },
        density: { heatMap: [] },
        probability: { polygon50: [], polygon90: [] },
        survival: { probability: 0.85, timeRemaining: 12, urgency: 'moderate' }
      }
    };

    this.simulations.set(id, simulation);
    return { simulationId: id, status: 'started' };
  }

  getSimulationStatus(id) {
    const sim = this.simulations.get(id);
    if (!sim) throw new Error('Simulation not found');
    return { id: sim.id, status: sim.status, progress: sim.progress };
  }

  getSimulationResults(id) {
    const sim = this.simulations.get(id);
    if (!sim) throw new Error('Simulation not found');
    return sim.results;
  }

  listSimulations() {
    return Array.from(this.simulations.values());
  }

  deleteSimulation(id) {
    this.simulations.delete(id);
  }
}

module.exports = SimulationController;
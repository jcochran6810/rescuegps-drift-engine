const express = require('express');
const cors = require('cors');
const SimulationController = require('./drift-engine/api/SimulationController');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const simulationController = new SimulationController();

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'RescueGPS Drift Engine',
    version: '1.0.3',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/simulations', async (req, res) => {
  try {
    const result = await simulationController.startSimulation(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/simulations/:id/status', (req, res) => {
  try {
    const status = simulationController.getSimulationStatus(req.params.id);
    res.json(status);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.get('/api/simulations/:id/results', (req, res) => {
  try {
    const results = simulationController.getSimulationResults(req.params.id);
    res.json(results);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log('🚀 RescueGPS Drift Engine Server');
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
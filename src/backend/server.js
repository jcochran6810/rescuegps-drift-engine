/**
 * RESCUEGPS DRIFT ENGINE - EXPRESS SERVER
 *
 * Main server file with all API endpoints
 */

const express = require("express");
const cors = require("cors");
const SimulationController = require("./drift-engine/api/SimulationController");

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize controller
const simulationController = new SimulationController();

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "RescueGPS Drift Engine",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// SIMULATION ENDPOINTS
// ============================================================================

/**
 * POST /api/simulations
 * Start new drift simulation
 */
app.post("/api/simulations", async (req, res) => {
  try {
    console.log("📥 Received simulation request");

    const result = await simulationController.startSimulation(req.body);

    res.json(result);
  } catch (error) {
    console.error("❌ Simulation start error:", error);
    res.status(500).json({
      error: "Failed to start simulation",
      message: error.message,
    });
  }
});

/**
 * GET /api/simulations
 * List all simulations
 */
app.get("/api/simulations", (req, res) => {
  try {
    const filters = {
      incidentId: req.query.incidentId,
      status: req.query.status,
    };

    const simulations = simulationController.listSimulations(filters);

    res.json({
      simulations,
      count: simulations.length,
    });
  } catch (error) {
    console.error("❌ List simulations error:", error);
    res.status(500).json({
      error: "Failed to list simulations",
      message: error.message,
    });
  }
});

/**
 * GET /api/simulations/:id/status
 * Get simulation status
 */
app.get("/api/simulations/:id/status", (req, res) => {
  try {
    const status = simulationController.getSimulationStatus(req.params.id);

    if (status.error) {
      return res.status(404).json(status);
    }

    res.json(status);
  } catch (error) {
    console.error("❌ Get status error:", error);
    res.status(500).json({
      error: "Failed to get simulation status",
      message: error.message,
    });
  }
});

/**
 * GET /api/simulations/:id/results
 * Get complete simulation results
 */
app.get("/api/simulations/:id/results", (req, res) => {
  try {
    const results = simulationController.getSimulationResults(req.params.id);

    if (results.error) {
      return res.status(404).json(results);
    }

    res.json(results);
  } catch (error) {
    console.error("❌ Get results error:", error);
    res.status(500).json({
      error: "Failed to get simulation results",
      message: error.message,
    });
  }
});

/**
 * GET /api/simulations/:id/snapshot/:hour
 * Get snapshot at specific hour
 */
app.get("/api/simulations/:id/snapshot/:hour", (req, res) => {
  try {
    const snapshot = simulationController.getSnapshot(
      req.params.id,
      req.params.hour
    );

    if (snapshot.error) {
      return res.status(404).json(snapshot);
    }

    res.json(snapshot);
  } catch (error) {
    console.error("❌ Get snapshot error:", error);
    res.status(500).json({
      error: "Failed to get snapshot",
      message: error.message,
    });
  }
});

/**
 * DELETE /api/simulations/:id
 * Delete simulation
 */
app.delete("/api/simulations/:id", (req, res) => {
  try {
    const result = simulationController.deleteSimulation(req.params.id);

    res.json(result);
  } catch (error) {
    console.error("❌ Delete simulation error:", error);
    res.status(500).json({
      error: "Failed to delete simulation",
      message: error.message,
    });
  }
});

// ============================================================================
// NOAA DATA ENDPOINTS
// ============================================================================

/**
 * GET /api/noaa/stations/nearest
 * Find nearest NOAA stations
 */
app.get("/api/noaa/stations/nearest", async (req, res) => {
  try {
    const NOAAService = require("./services/noaaService");
    const noaaService = new NOAAService();

    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const count = parseInt(req.query.count) || 5;

    const stations = await noaaService.findNearestStations(lat, lng, count);

    res.json(stations);
  } catch (error) {
    console.error("❌ NOAA stations error:", error);
    res.status(500).json({
      error: "Failed to fetch NOAA stations",
      message: error.message,
    });
  }
});

/**
 * GET /api/noaa/data/buoy/:buoyId
 * Get buoy data
 */
app.get("/api/noaa/data/buoy/:buoyId", async (req, res) => {
  try {
    const NOAAService = require("./services/noaaService");
    const noaaService = new NOAAService();

    const data = await noaaService.fetchBuoyData(req.params.buoyId);

    res.json(data);
  } catch (error) {
    console.error("❌ Buoy data error:", error);
    res.status(500).json({
      error: "Failed to fetch buoy data",
      message: error.message,
    });
  }
});

// ============================================================================
// OBJECT TYPES ENDPOINT
// ============================================================================

/**
 * GET /api/object-types
 * Get list of available object types
 */
app.get("/api/object-types", (req, res) => {
  try {
    const ObjectDynamics = require("./drift-engine/physics/ObjectDynamics");
    const objectTypes = ObjectDynamics.getAvailableObjectTypes();

    res.json({
      objectTypes,
      count: objectTypes.length,
    });
  } catch (error) {
    console.error("❌ Object types error:", error);
    res.status(500).json({
      error: "Failed to get object types",
      message: error.message,
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);

  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(port, () => {
  console.log("");
  console.log("🚀 ════════════════════════════════════════════════════════");
  console.log("🚀 RescueGPS Drift Engine Server");
  console.log("🚀 ════════════════════════════════════════════════════════");
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🚀 Health check: http://localhost:${port}/health`);
  console.log(`🚀 API base: http://localhost:${port}/api`);
  console.log("🚀 ════════════════════════════════════════════════════════");
  console.log("");
});

module.exports = app;

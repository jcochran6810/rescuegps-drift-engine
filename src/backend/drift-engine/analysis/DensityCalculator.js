/**
 * DENSITY CALCULATOR
 *
 * Probability density calculations from particle distributions
 * - 2D density grids
 * - Kernel Density Estimation (KDE)
 * - Heat maps
 * - Contour lines (50%, 75%, 90%)
 * - Probability polygons
 *
 * @module DensityCalculator
 */

class DensityCalculator {
  constructor(config = {}) {
    this.config = {
      gridResolution: config.gridResolution || 100, // cells
      kernelBandwidth: config.kernelBandwidth || 1000, // meters
      kernelType: config.kernelType || "gaussian", // 'gaussian', 'epanechnikov'
      ...config,
    };

    this.densityGrid = null;
    this.contours = [];
    this.polygons = [];

    console.log("📊 Density calculator initialized");
    console.log(
      `   Grid resolution: ${this.config.gridResolution}x${this.config.gridResolution}`
    );
    console.log(
      `   Kernel: ${this.config.kernelType} (${this.config.kernelBandwidth}m)`
    );
  }

  /**
   * Calculate 2D density grid from particles
   *
   * @param {Array} particles - Array of {lat, lng, status}
   * @returns {Object} Density grid
   */
  calculateDensityGrid(particles) {
    console.log(
      `🔢 Calculating density grid from ${particles.length} particles...`
    );

    // Filter active particles only
    const activeParticles = particles.filter((p) => p.status === "active");

    if (activeParticles.length === 0) {
      console.warn("⚠️  No active particles to calculate density");
      return null;
    }

    // Find bounds
    const bounds = this.calculateBounds(activeParticles);

    // Create grid
    const rows = this.config.gridResolution;
    const cols = this.config.gridResolution;
    const grid = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(0));

    const cellHeight = (bounds.maxLat - bounds.minLat) / rows;
    const cellWidth = (bounds.maxLng - bounds.minLng) / cols;

    // Calculate density using KDE
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cellLat = bounds.minLat + (row + 0.5) * cellHeight;
        const cellLng = bounds.minLng + (col + 0.5) * cellWidth;

        grid[row][col] = this.kernelDensityEstimation(
          cellLat,
          cellLng,
          activeParticles
        );
      }
    }

    // Normalize grid
    const maxDensity = Math.max(...grid.flat());
    const normalizedGrid = grid.map((row) =>
      row.map((val) => val / maxDensity)
    );

    this.densityGrid = {
      grid: normalizedGrid,
      bounds: bounds,
      rows: rows,
      cols: cols,
      cellHeight: cellHeight,
      cellWidth: cellWidth,
      maxDensity: maxDensity,
      particleCount: activeParticles.length,
    };

    console.log(
      `✅ Density grid calculated (max density: ${maxDensity.toFixed(4)})`
    );

    return this.densityGrid;
  }

  /**
   * Kernel Density Estimation
   * Calculate density at point based on nearby particles
   */
  kernelDensityEstimation(lat, lng, particles) {
    const bandwidth = this.config.kernelBandwidth;
    let density = 0;

    for (const particle of particles) {
      const distance = this.haversineDistance(
        lat,
        lng,
        particle.lat,
        particle.lng
      );

      // Kernel function
      let kernelValue = 0;

      if (this.config.kernelType === "gaussian") {
        // Gaussian kernel
        kernelValue = Math.exp(-0.5 * Math.pow(distance / bandwidth, 2));
      } else if (this.config.kernelType === "epanechnikov") {
        // Epanechnikov kernel
        const u = distance / bandwidth;
        kernelValue = u <= 1 ? 0.75 * (1 - u * u) : 0;
      }

      density += kernelValue;
    }

    return density / particles.length;
  }

  /**
   * Generate contour lines at probability levels
   *
   * @param {Array} levels - [0.50, 0.75, 0.90]
   */
  generateContours(levels = [0.5, 0.75, 0.9]) {
    if (!this.densityGrid) {
      console.warn("⚠️  No density grid - run calculateDensityGrid first");
      return;
    }

    console.log(`📐 Generating contours at levels: ${levels.join(", ")}`);

    this.contours = [];

    for (const level of levels) {
      const contour = this.marchingSquares(this.densityGrid.grid, level);

      this.contours.push({
        level: level,
        percentage: Math.round(level * 100),
        paths: contour,
      });
    }

    console.log(`✅ Generated ${this.contours.length} contours`);

    return this.contours;
  }

  /**
   * Marching squares algorithm for contour lines
   */
  marchingSquares(grid, threshold) {
    const rows = grid.length;
    const cols = grid[0].length;
    const paths = [];

    // Simplified marching squares
    for (let row = 0; row < rows - 1; row++) {
      for (let col = 0; col < cols - 1; col++) {
        const cellValue =
          (grid[row][col] +
            grid[row][col + 1] +
            grid[row + 1][col] +
            grid[row + 1][col + 1]) /
          4;

        if (cellValue >= threshold) {
          paths.push({
            row: row,
            col: col,
            value: cellValue,
          });
        }
      }
    }

    return paths;
  }

  /**
   * Generate probability polygons
   *
   * @param {Array} levels - [0.50, 0.90]
   */
  generateProbabilityPolygons(levels = [0.5, 0.9]) {
    if (!this.densityGrid) {
      console.warn("⚠️  No density grid - run calculateDensityGrid first");
      return;
    }

    console.log(`🔷 Generating probability polygons: ${levels.join(", ")}`);

    this.polygons = [];

    for (const level of levels) {
      const polygon = this.createPolygonFromDensity(level);

      this.polygons.push({
        level: level,
        percentage: Math.round(level * 100),
        polygon: polygon,
        area: this.calculatePolygonArea(polygon),
      });
    }

    console.log(`✅ Generated ${this.polygons.length} polygons`);

    return this.polygons;
  }

  /**
   * Create polygon from density threshold
   */
  createPolygonFromDensity(threshold) {
    const grid = this.densityGrid.grid;
    const bounds = this.densityGrid.bounds;
    const rows = grid.length;
    const cols = grid[0].length;

    const points = [];

    // Find all cells above threshold
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (grid[row][col] >= threshold) {
          const lat =
            bounds.minLat + (row / rows) * (bounds.maxLat - bounds.minLat);
          const lng =
            bounds.minLng + (col / cols) * (bounds.maxLng - bounds.minLng);

          points.push({ lat, lng });
        }
      }
    }

    // Compute convex hull
    const hull = this.convexHull(points);

    return hull;
  }

  /**
   * Convex hull algorithm (Graham scan)
   */
  convexHull(points) {
    if (points.length < 3) return points;

    // Sort points by x, then y
    points.sort((a, b) => {
      if (a.lng !== b.lng) return a.lng - b.lng;
      return a.lat - b.lat;
    });

    // Build lower hull
    const lower = [];
    for (const point of points) {
      while (
        lower.length >= 2 &&
        this.cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0
      ) {
        lower.pop();
      }
      lower.push(point);
    }

    // Build upper hull
    const upper = [];
    for (let i = points.length - 1; i >= 0; i--) {
      const point = points[i];
      while (
        upper.length >= 2 &&
        this.cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0
      ) {
        upper.pop();
      }
      upper.push(point);
    }

    // Remove last point of each half (duplicated)
    lower.pop();
    upper.pop();

    return lower.concat(upper);
  }

  /**
   * Cross product for convex hull
   */
  cross(o, a, b) {
    return (
      (a.lng - o.lng) * (b.lat - o.lat) - (a.lat - o.lat) * (b.lng - o.lng)
    );
  }

  /**
   * Calculate polygon area (square meters)
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

    // Convert to square meters (approximate)
    const metersPerDegree = 111320;
    return area * metersPerDegree * metersPerDegree;
  }

  /**
   * Export heat map data for Google Maps
   */
  exportHeatMapData() {
    if (!this.densityGrid) {
      return [];
    }

    const heatMapData = [];
    const grid = this.densityGrid.grid;
    const bounds = this.densityGrid.bounds;
    const rows = grid.length;
    const cols = grid[0].length;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (grid[row][col] > 0.01) {
          // Skip very low density
          const lat =
            bounds.minLat + (row / rows) * (bounds.maxLat - bounds.minLat);
          const lng =
            bounds.minLng + (col / cols) * (bounds.maxLng - bounds.minLng);

          heatMapData.push({
            location: { lat, lng },
            weight: grid[row][col],
          });
        }
      }
    }

    return heatMapData;
  }

  /**
   * Export as GeoJSON
   */
  exportGeoJSON() {
    const features = [];

    // Add contours
    for (const contour of this.contours) {
      features.push({
        type: "Feature",
        geometry: {
          type: "MultiPoint",
          coordinates: contour.paths.map((p) => [p.lng, p.lat]),
        },
        properties: {
          type: "contour",
          level: contour.level,
          percentage: contour.percentage,
        },
      });
    }

    // Add polygons
    for (const polygon of this.polygons) {
      features.push({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [polygon.polygon.map((p) => [p.lng, p.lat])],
        },
        properties: {
          type: "probability-polygon",
          level: polygon.level,
          percentage: polygon.percentage,
          area: polygon.area,
        },
      });
    }

    return {
      type: "FeatureCollection",
      features,
    };
  }

  /**
   * Calculate bounds from particles
   */
  calculateBounds(particles) {
    let minLat = Infinity,
      maxLat = -Infinity;
    let minLng = Infinity,
      maxLng = -Infinity;

    for (const particle of particles) {
      if (particle.lat < minLat) minLat = particle.lat;
      if (particle.lat > maxLat) maxLat = particle.lat;
      if (particle.lng < minLng) minLng = particle.lng;
      if (particle.lng > maxLng) maxLng = particle.lng;
    }

    // Add padding (10%)
    const latPadding = (maxLat - minLat) * 0.1;
    const lngPadding = (maxLng - minLng) * 0.1;

    return {
      minLat: minLat - latPadding,
      maxLat: maxLat + latPadding,
      minLng: minLng - lngPadding,
      maxLng: maxLng + lngPadding,
    };
  }

  /**
   * Haversine distance
   */
  haversineDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    if (!this.densityGrid) {
      return null;
    }

    return {
      gridResolution: `${this.densityGrid.rows}x${this.densityGrid.cols}`,
      maxDensity: this.densityGrid.maxDensity,
      particleCount: this.densityGrid.particleCount,
      contourCount: this.contours.length,
      polygonCount: this.polygons.length,
    };
  }
}

module.exports = DensityCalculator;

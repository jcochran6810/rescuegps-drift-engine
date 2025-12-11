/**
 * COORDINATE UTILITIES
 *
 * Mathematical functions for coordinate transformations
 * and distance calculations
 *
 * @module coordinateUtils
 */

/**
 * Convert meters to lat/lng displacement
 */
function metersToLatLng(meters, lat) {
  const deltaLat = meters / 111320;
  const deltaLng = meters / (111320 * Math.cos((lat * Math.PI) / 180));

  return { deltaLat, deltaLng };
}

/**
 * Convert lat/lng to meters
 */
function latLngToMeters(lat1, lng1, lat2, lng2) {
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
 * Haversine distance calculation
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  return latLngToMeters(lat1, lng1, lat2, lng2);
}

/**
 * Calculate bearing between two points
 */
function calculateBearing(lat1, lng1, lat2, lng2) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360;

  return bearing;
}

/**
 * Gaussian random number (Box-Muller)
 */
function gaussianRandom() {
  let u1 = Math.random();
  let u2 = Math.random();

  if (u1 === 0) u1 = 1e-10;

  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Convert knots to m/s
 */
function knotsToMps(knots) {
  return knots * 0.514444;
}

/**
 * Convert m/s to knots
 */
function mpsToKnots(mps) {
  return mps / 0.514444;
}

/**
 * Calculate destination point given distance and bearing
 */
function destinationPoint(lat, lng, distanceMeters, bearingDegrees) {
  const R = 6371000;
  const δ = distanceMeters / R;
  const θ = (bearingDegrees * Math.PI) / 180;

  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lng * Math.PI) / 180;

  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
  );

  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
    );

  const lat2 = (φ2 * 180) / Math.PI;
  const lng2 = (λ2 * 180) / Math.PI;

  return { lat: lat2, lng: lng2 };
}

/**
 * Degrees to radians
 */
function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Normalize angle to 0-360
 */
function normalizeAngle(angle) {
  while (angle < 0) angle += 360;
  while (angle >= 360) angle -= 360;
  return angle;
}

module.exports = {
  metersToLatLng,
  latLngToMeters,
  haversineDistance,
  calculateBearing,
  gaussianRandom,
  knotsToMps,
  mpsToKnots,
  destinationPoint,
  degreesToRadians,
  normalizeAngle,
};

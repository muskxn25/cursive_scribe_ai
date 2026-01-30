/**
 * Computes kinetic metrics for handwriting analysis.
 */

/**
 * Calculate velocity between two points
 * @param {Object} p1 - {x, y, t} start point (normalized coords + timestamp)
 * @param {Object} p2 - {x, y, t} end point
 * @returns {number} normalized velocity (pixels per ms, but using normalized space)
 */
export const calculateVelocity = (p1, p2) => {
    if (!p1 || !p2) return 0;
    const dt = p2.t - p1.t;
    if (dt <= 0) return 0;

    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    return dist / dt;
};

/**
 * Get color based on velocity for heatmap visualization
 * @param {number} velocity - Current velocity
 * @returns {string} HSL color string
 */
export const getVelocityColor = (velocity) => {
    // Map velocity to a hue (0 is red/slow, 120 is green/fast)
    // v * 1000 to get a more workable range
    const v = Math.min(velocity * 2000, 1);
    const hue = v * 120;
    return `hsl(${hue}, 70%, 50%)`;
};

/**
 * Check for hesitation
 * @param {number} velocity - Current velocity
 * @param {number} threshold - Velocity below which we consider it a hesitation
 * @returns {boolean}
 */
export const isHesitating = (velocity, threshold = 0.00005) => {
    return velocity < threshold;
};

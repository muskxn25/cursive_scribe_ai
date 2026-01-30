/**
 * Exponential Moving Average (EMA) for coordinate smoothing
 * @param {Object} current - {x, y} current raw coordinates
 * @param {Object} last - {x, y} last smoothed coordinates
 * @param {number} alpha - Smoothing factor (0 to 1, lower is smoother)
 * @returns {Object} {x, y} smoothed coordinates
 */
export const smoothCoordinates = (current, last, alpha = 0.5) => {
    if (!last) return current;
    return {
        x: last.x + alpha * (current.x - last.x),
        y: last.y + alpha * (current.y - last.y),
    };
};

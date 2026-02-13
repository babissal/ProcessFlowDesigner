/**
 * Geometry Utilities
 * Math helpers for distance calculations, intersections, etc.
 */

/**
 * Calculate distance between two points
 */
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate the center point of a node based on its type
 */
export function getNodeCenter(node) {
    const width = node.width || 100;
    const height = node.height || 60;

    return {
        x: node.x + width / 2,
        y: node.y + height / 2
    };
}

/**
 * Get anchor points for a node (connection points)
 * Returns top, right, bottom, left anchor points
 */
export function getNodeAnchors(node) {
    const width = node.width || 100;
    const height = node.height || 60;

    return {
        top: { x: node.x + width / 2, y: node.y },
        right: { x: node.x + width, y: node.y + height / 2 },
        bottom: { x: node.x + width / 2, y: node.y + height },
        left: { x: node.x, y: node.y + height / 2 }
    };
}

/**
 * Find the closest anchor point on a node to a given point
 */
export function getClosestAnchor(node, targetX, targetY) {
    const anchors = getNodeAnchors(node);
    let closestAnchor = null;
    let minDistance = Infinity;

    for (const [position, anchor] of Object.entries(anchors)) {
        const dist = distance(anchor.x, anchor.y, targetX, targetY);
        if (dist < minDistance) {
            minDistance = dist;
            closestAnchor = { ...anchor, position };
        }
    }

    return closestAnchor;
}

/**
 * Check if a point is inside a rectangle
 */
export function pointInRect(px, py, x, y, width, height) {
    return px >= x && px <= x + width && py >= y && py <= y + height;
}

/**
 * Check if a point is inside a circle
 */
export function pointInCircle(px, py, cx, cy, radius) {
    return distance(px, py, cx, cy) <= radius;
}

/**
 * Check if a point is inside a diamond (rotated square)
 */
export function pointInDiamond(px, py, x, y, width, height) {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Transform point to diamond's local coordinate system
    const dx = Math.abs(px - cx);
    const dy = Math.abs(py - cy);

    // Check if point is inside diamond using Manhattan distance
    return (dx / halfWidth + dy / halfHeight) <= 1;
}

/**
 * Calculate distance from a point to a line segment
 */
export function distanceToLine(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
        param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

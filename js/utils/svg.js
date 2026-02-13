/**
 * SVG Utilities
 * Helpers for creating and manipulating SVG elements
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Create an SVG element
 */
export function createSVGElement(type, attributes = {}) {
    const element = document.createElementNS(SVG_NS, type);

    for (const [key, value] of Object.entries(attributes)) {
        if (key === 'className') {
            element.setAttribute('class', value);
        } else {
            element.setAttribute(key, value);
        }
    }

    return element;
}

/**
 * Set multiple attributes on an SVG element
 */
export function setAttributes(element, attributes) {
    for (const [key, value] of Object.entries(attributes)) {
        if (key === 'className') {
            element.setAttribute('class', value);
        } else {
            element.setAttribute(key, value);
        }
    }
}

/**
 * Get SVG point from mouse event with zoom/pan transform applied
 */
export function getSVGPoint(svg, event, transform = { x: 0, y: 0, scale: 1 }) {
    const rect = svg.getBoundingClientRect();

    // Get mouse position relative to SVG
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Apply inverse transform to get actual canvas coordinates
    const canvasX = (x - transform.x) / transform.scale;
    const canvasY = (y - transform.y) / transform.scale;

    return { x: canvasX, y: canvasY };
}

/**
 * Create a path string for a line with optional curve
 */
export function createLinePath(x1, y1, x2, y2, curved = false) {
    if (!curved) {
        return `M ${x1} ${y1} L ${x2} ${y2}`;
    }

    // Create a smooth curve using cubic Bezier
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Calculate control point offset based on distance
    const offset = Math.min(dist * 0.5, 100);

    // Determine if connection is more horizontal or vertical
    const isHorizontal = Math.abs(dx) > Math.abs(dy);

    let cp1x, cp1y, cp2x, cp2y;

    if (isHorizontal) {
        // Horizontal curve
        cp1x = x1 + offset;
        cp1y = y1;
        cp2x = x2 - offset;
        cp2y = y2;
    } else {
        // Vertical curve
        cp1x = x1;
        cp1y = y1 + offset;
        cp2x = x2;
        cp2y = y2 - offset;
    }

    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
}

/**
 * Create a diamond (rhombus) path
 */
export function createDiamondPath(x, y, width, height) {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    return `M ${cx} ${y} L ${x + width} ${cy} L ${cx} ${y + height} L ${x} ${cy} Z`;
}

/**
 * Get bounding box of SVG element
 */
export function getBBox(element) {
    try {
        return element.getBBox();
    } catch (error) {
        // Fallback if getBBox fails
        return {
            x: 0,
            y: 0,
            width: 0,
            height: 0
        };
    }
}

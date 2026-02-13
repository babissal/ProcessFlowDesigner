/**
 * Mini-map Module
 * Provides a small overview map for navigation
 */

import { CONFIG, getNodeConfig } from '../config.js';
import { eventBus } from './eventBus.js';
import { stateManager } from './stateManager.js';
import { canvas } from './canvas.js';

class Minimap {
    constructor() {
        this.container = null;
        this.svg = null;
        this.viewportRect = null;
        this.isVisible = true;
        this.scale = 0.1; // Mini-map scale (10% of actual size)
        this.width = 200;
        this.height = 150;
    }

    /**
     * Initialize mini-map
     */
    init() {
        this.createMinimapContainer();
        this.setupEventListeners();
        this.update();
    }

    /**
     * Create mini-map container
     */
    createMinimapContainer() {
        const canvasContainer = document.getElementById('canvas-container');
        if (!canvasContainer) return;

        // Create container
        this.container = document.createElement('div');
        this.container.id = 'minimap';
        this.container.className = 'minimap';
        this.container.style.cssText = `
            position: absolute;
            bottom: 20px;
            right: 20px;
            width: ${this.width}px;
            height: ${this.height}px;
            background: white;
            border: 2px solid #ccc;
            border-radius: 4px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            overflow: hidden;
            z-index: 100;
            cursor: pointer;
        `;

        // Create SVG
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.style.cssText = 'display: block;';

        // Create viewport rectangle
        this.viewportRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        this.viewportRect.setAttribute('fill', 'rgba(33, 150, 243, 0.2)');
        this.viewportRect.setAttribute('stroke', '#2196F3');
        this.viewportRect.setAttribute('stroke-width', '2');
        this.viewportRect.setAttribute('pointer-events', 'none');

        this.svg.appendChild(this.viewportRect);
        this.container.appendChild(this.svg);
        canvasContainer.appendChild(this.container);

        // Add toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.innerHTML = '×';
        toggleBtn.className = 'minimap-toggle';
        toggleBtn.title = 'Hide mini-map';
        toggleBtn.style.cssText = `
            position: absolute;
            top: 2px;
            right: 2px;
            width: 20px;
            height: 20px;
            border: none;
            background: rgba(0, 0, 0, 0.5);
            color: white;
            border-radius: 3px;
            cursor: pointer;
            font-size: 16px;
            line-height: 1;
            padding: 0;
        `;

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        this.container.appendChild(toggleBtn);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Update mini-map when nodes/connections change
        eventBus.on(CONFIG.EVENTS.NODE_ADDED, () => this.update());
        eventBus.on(CONFIG.EVENTS.NODE_UPDATED, () => this.update());
        eventBus.on(CONFIG.EVENTS.NODE_DELETED, () => this.update());
        eventBus.on(CONFIG.EVENTS.CONNECTION_ADDED, () => this.update());
        eventBus.on(CONFIG.EVENTS.CONNECTION_DELETED, () => this.update());
        eventBus.on(CONFIG.EVENTS.CANVAS_ZOOM, () => this.updateViewport());
        eventBus.on(CONFIG.EVENTS.CANVAS_PAN, () => this.updateViewport());

        // Click to navigate
        this.container.addEventListener('click', (e) => this.handleClick(e));
    }

    /**
     * Update mini-map rendering
     */
    update() {
        if (!this.svg) return;

        // Clear existing content (except viewport rect)
        while (this.svg.firstChild && this.svg.firstChild !== this.viewportRect) {
            this.svg.removeChild(this.svg.firstChild);
        }

        const nodes = stateManager.getNodes();
        const connections = stateManager.getConnections();

        if (nodes.length === 0) return;

        // Calculate bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        nodes.forEach(node => {
            const config = getNodeConfig(node.type);
            const width = node.width || config.width;
            const height = node.height || config.height;

            minX = Math.min(minX, node.x);
            minY = Math.min(minY, node.y);
            maxX = Math.max(maxX, node.x + width);
            maxY = Math.max(maxY, node.y + height);
        });

        const contentWidth = maxX - minX + 100;
        const contentHeight = maxY - minY + 100;

        // Calculate scale to fit
        const scaleX = this.width / contentWidth;
        const scaleY = this.height / contentHeight;
        this.scale = Math.min(scaleX, scaleY, 0.15);

        // Set viewBox
        this.svg.setAttribute('viewBox', `${minX - 50} ${minY - 50} ${contentWidth} ${contentHeight}`);

        // Render connections
        connections.forEach(conn => {
            const fromNode = stateManager.getNode(conn.from);
            const toNode = stateManager.getNode(conn.to);

            if (!fromNode || !toNode) return;

            const fromConfig = getNodeConfig(fromNode.type);
            const toConfig = getNodeConfig(toNode.type);

            if (!fromConfig || !toConfig) return;

            const fromWidth = fromNode.width || fromConfig.width;
            const fromHeight = fromNode.height || fromConfig.height;
            const toWidth = toNode.width || toConfig.width;
            const toHeight = toNode.height || toConfig.height;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', fromNode.x + fromWidth / 2);
            line.setAttribute('y1', fromNode.y + fromHeight / 2);
            line.setAttribute('x2', toNode.x + toWidth / 2);
            line.setAttribute('y2', toNode.y + toHeight / 2);
            line.setAttribute('stroke', '#999');
            line.setAttribute('stroke-width', '2');

            this.svg.insertBefore(line, this.viewportRect);
        });

        // Render nodes
        nodes.forEach(node => {
            const config = getNodeConfig(node.type);
            const width = node.width || config.width;
            const height = node.height || config.height;
            const color = node.color || config.color;

            let shape;

            if (config.shape === 'circle') {
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                shape.setAttribute('cx', node.x + width / 2);
                shape.setAttribute('cy', node.y + height / 2);
                shape.setAttribute('r', width / 2);
            } else if (config.shape === 'diamond') {
                const cx = node.x + width / 2;
                const cy = node.y + height / 2;
                const halfW = width / 2;
                const halfH = height / 2;
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                shape.setAttribute('d', `M ${cx} ${node.y} L ${node.x + width} ${cy} L ${cx} ${node.y + height} L ${node.x} ${cy} Z`);
            } else {
                shape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                shape.setAttribute('x', node.x);
                shape.setAttribute('y', node.y);
                shape.setAttribute('width', width);
                shape.setAttribute('height', height);
                shape.setAttribute('rx', 4);
            }

            shape.setAttribute('fill', color);
            shape.setAttribute('stroke', 'none');

            this.svg.insertBefore(shape, this.viewportRect);
        });

        // Update viewport rectangle
        this.updateViewport();
    }

    /**
     * Update viewport rectangle
     */
    updateViewport() {
        if (!this.viewportRect) return;

        const canvasElement = canvas.getSVG();
        if (!canvasElement) return;

        const rect = canvasElement.getBoundingClientRect();
        const transform = canvas.getTransform();

        // Calculate viewport in canvas coordinates
        const viewportWidth = rect.width / transform.scale;
        const viewportHeight = rect.height / transform.scale;
        const viewportX = -transform.x / transform.scale;
        const viewportY = -transform.y / transform.scale;

        this.viewportRect.setAttribute('x', viewportX);
        this.viewportRect.setAttribute('y', viewportY);
        this.viewportRect.setAttribute('width', viewportWidth);
        this.viewportRect.setAttribute('height', viewportHeight);
    }

    /**
     * Handle click to navigate
     */
    handleClick(e) {
        if (e.target.classList.contains('minimap-toggle')) return;

        const rect = this.svg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Get viewBox
        const viewBox = this.svg.getAttribute('viewBox').split(' ').map(Number);
        const [vbX, vbY, vbWidth, vbHeight] = viewBox;

        // Convert click to canvas coordinates
        const canvasX = vbX + (x / rect.width) * vbWidth;
        const canvasY = vbY + (y / rect.height) * vbHeight;

        // Center viewport on clicked position
        const canvasElement = canvas.getSVG();
        const canvasRect = canvasElement.getBoundingClientRect();
        const transform = canvas.getTransform();

        const newPanX = canvasRect.width / 2 - canvasX * transform.scale;
        const newPanY = canvasRect.height / 2 - canvasY * transform.scale;

        canvas.panX = newPanX;
        canvas.panY = newPanY;
        canvas.updateTransform();

        this.updateViewport();
    }

    /**
     * Toggle mini-map visibility
     */
    toggle() {
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'block' : 'none';

        const toggleBtn = this.container.querySelector('.minimap-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = this.isVisible ? '×' : '◱';
            toggleBtn.title = this.isVisible ? 'Hide mini-map' : 'Show mini-map';
        }
    }

    /**
     * Show mini-map
     */
    show() {
        this.isVisible = true;
        if (this.container) {
            this.container.style.display = 'block';
        }
    }

    /**
     * Hide mini-map
     */
    hide() {
        this.isVisible = false;
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
}

// Create and export singleton instance
export const minimap = new Minimap();

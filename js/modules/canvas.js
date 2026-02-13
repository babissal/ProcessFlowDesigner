/**
 * Canvas Module
 * Handles zoom, pan, grid rendering, and coordinate conversion
 */

import { CONFIG, getNodeConfig } from '../config.js';
import { eventBus } from './eventBus.js';
import { stateManager } from './stateManager.js';
import { getSVGPoint } from '../utils/svg.js';
import { clamp } from '../utils/geometry.js';
import { showToast } from '../utils/dom.js';

class Canvas {
    constructor() {
        this.svg = null;
        this.mainGroup = null;
        this.zoom = CONFIG.CANVAS.DEFAULT_ZOOM;
        this.panX = 0;
        this.panY = 0;
        this.isPanning = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.spacePressed = false;
    }

    /**
     * Initialize canvas
     */
    init() {
        this.svg = document.getElementById('canvas');
        this.mainGroup = document.getElementById('main-group');

        if (!this.svg || !this.mainGroup) {
            console.error('Canvas elements not found');
            return;
        }

        this.setupEventListeners();
        this.updateTransform();
        this.updateStatusBar();

        // Hide overlay once a node is added
        eventBus.on(CONFIG.EVENTS.NODE_ADDED, () => {
            this.hideOverlay();
        });
    }

    /**
     * Setup event listeners for zoom and pan
     */
    setupEventListeners() {
        // Mouse wheel for zoom
        this.svg.addEventListener('wheel', (e) => this.handleWheel(e));

        // Mouse down for panning (space + drag or middle mouse button)
        this.svg.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.svg.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.svg.addEventListener('mouseup', () => this.handleMouseUp());
        this.svg.addEventListener('mouseleave', () => this.handleMouseUp());

        // Keyboard for space key
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat) {
                this.spacePressed = true;
                this.svg.style.cursor = 'grab';
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                this.spacePressed = false;
                if (!this.isPanning) {
                    this.svg.style.cursor = 'default';
                }
            }
        });

        // Prevent context menu on canvas
        this.svg.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Handle mouse wheel for zoom
     */
    handleWheel(e) {
        e.preventDefault();

        const delta = -e.deltaY * CONFIG.CANVAS.ZOOM_SENSITIVITY;
        const newZoom = clamp(
            this.zoom + delta,
            CONFIG.CANVAS.MIN_ZOOM,
            CONFIG.CANVAS.MAX_ZOOM
        );

        if (newZoom === this.zoom) return;

        // Zoom towards mouse position
        const rect = this.svg.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate zoom point in canvas coordinates
        const beforeZoomX = (mouseX - this.panX) / this.zoom;
        const beforeZoomY = (mouseY - this.panY) / this.zoom;

        // Update zoom
        this.zoom = newZoom;

        // Adjust pan to keep zoom point stable
        this.panX = mouseX - beforeZoomX * this.zoom;
        this.panY = mouseY - beforeZoomY * this.zoom;

        this.updateTransform();
        this.updateStatusBar();

        eventBus.emit(CONFIG.EVENTS.CANVAS_ZOOM, { zoom: this.zoom });
    }

    /**
     * Handle mouse down for panning
     */
    handleMouseDown(e) {
        // Start panning on middle mouse button or space + left mouse button
        if (e.button === 1 || (e.button === 0 && this.spacePressed)) {
            e.preventDefault();
            this.isPanning = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.svg.style.cursor = 'grabbing';
        }
    }

    /**
     * Handle mouse move for panning
     */
    handleMouseMove(e) {
        if (!this.isPanning) return;

        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;

        this.panX += dx;
        this.panY += dy;

        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;

        this.updateTransform();

        eventBus.emit(CONFIG.EVENTS.CANVAS_PAN, { panX: this.panX, panY: this.panY });
    }

    /**
     * Handle mouse up to end panning
     */
    handleMouseUp() {
        if (this.isPanning) {
            this.isPanning = false;
            this.svg.style.cursor = this.spacePressed ? 'grab' : 'default';
        }
    }

    /**
     * Update SVG transform based on current zoom and pan
     */
    updateTransform() {
        if (!this.mainGroup) return;

        this.mainGroup.setAttribute(
            'transform',
            `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`
        );

        // Update metadata in state
        stateManager.updateState({
            workflow: {
                metadata: {
                    zoomLevel: this.zoom,
                    canvasOffset: { x: this.panX, y: this.panY }
                }
            }
        });
    }

    /**
     * Update status bar with current zoom level
     */
    updateStatusBar() {
        const zoomPercent = Math.round(this.zoom * 100);
        const statusZoom = document.getElementById('status-zoom');
        if (statusZoom) {
            statusZoom.textContent = `${zoomPercent}%`;
        }
    }

    /**
     * Convert screen coordinates to canvas coordinates
     */
    screenToCanvas(screenX, screenY) {
        const rect = this.svg.getBoundingClientRect();
        const x = screenX - rect.left;
        const y = screenY - rect.top;

        return {
            x: (x - this.panX) / this.zoom,
            y: (y - this.panY) / this.zoom
        };
    }

    /**
     * Convert canvas coordinates to screen coordinates
     */
    canvasToScreen(canvasX, canvasY) {
        return {
            x: canvasX * this.zoom + this.panX,
            y: canvasY * this.zoom + this.panY
        };
    }

    /**
     * Get current transform
     */
    getTransform() {
        return {
            x: this.panX,
            y: this.panY,
            scale: this.zoom
        };
    }

    /**
     * Set zoom level
     */
    setZoom(zoom, centerX = null, centerY = null) {
        const newZoom = clamp(zoom, CONFIG.CANVAS.MIN_ZOOM, CONFIG.CANVAS.MAX_ZOOM);

        if (centerX !== null && centerY !== null) {
            // Zoom towards specified point
            const beforeZoomX = (centerX - this.panX) / this.zoom;
            const beforeZoomY = (centerY - this.panY) / this.zoom;

            this.zoom = newZoom;

            this.panX = centerX - beforeZoomX * this.zoom;
            this.panY = centerY - beforeZoomY * this.zoom;
        } else {
            this.zoom = newZoom;
        }

        this.updateTransform();
        this.updateStatusBar();

        eventBus.emit(CONFIG.EVENTS.CANVAS_ZOOM, { zoom: this.zoom });
    }

    /**
     * Zoom in
     */
    zoomIn() {
        const rect = this.svg.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        this.setZoom(this.zoom + CONFIG.CANVAS.ZOOM_STEP, centerX, centerY);
    }

    /**
     * Zoom out
     */
    zoomOut() {
        const rect = this.svg.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        this.setZoom(this.zoom - CONFIG.CANVAS.ZOOM_STEP, centerX, centerY);
    }

    /**
     * Reset zoom to 100%
     */
    resetZoom() {
        this.zoom = CONFIG.CANVAS.DEFAULT_ZOOM;
        this.panX = 0;
        this.panY = 0;
        this.updateTransform();
        this.updateStatusBar();

        eventBus.emit(CONFIG.EVENTS.CANVAS_ZOOM, { zoom: this.zoom });
    }

    /**
     * Hide the welcome overlay
     */
    hideOverlay() {
        const overlay = document.getElementById('canvas-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    /**
     * Show the welcome overlay
     */
    showOverlay() {
        const overlay = document.getElementById('canvas-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    /**
     * Get SVG element
     */
    getSVG() {
        return this.svg;
    }

    /**
     * Get main group element
     */
    getMainGroup() {
        return this.mainGroup;
    }

    /**
     * Fit workflow to screen (Phase 4)
     */
    fitToScreen() {
        const state = stateManager.getState();
        const nodes = state.workflow.nodes;

        if (nodes.length === 0) {
            this.resetZoom();
            return;
        }

        // Calculate bounding box of all nodes
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        nodes.forEach(node => {
            const nodeConfig = getNodeConfig(node.type);
            const width = node.width || nodeConfig.width;
            const height = node.height || nodeConfig.height;

            minX = Math.min(minX, node.x - width / 2);
            minY = Math.min(minY, node.y - height / 2);
            maxX = Math.max(maxX, node.x + width / 2);
            maxY = Math.max(maxY, node.y + height / 2);
        });

        const workflowWidth = maxX - minX;
        const workflowHeight = maxY - minY;
        const workflowCenterX = (minX + maxX) / 2;
        const workflowCenterY = (minY + maxY) / 2;

        // Calculate zoom to fit with padding
        const padding = 100;
        const containerWidth = this.svg.clientWidth - padding * 2;
        const containerHeight = this.svg.clientHeight - padding * 2;

        const scaleX = containerWidth / workflowWidth;
        const scaleY = containerHeight / workflowHeight;
        const newZoom = Math.min(scaleX, scaleY, CONFIG.CANVAS.MAX_ZOOM);

        // Center the workflow
        const centerX = this.svg.clientWidth / 2;
        const centerY = this.svg.clientHeight / 2;

        this.zoom = newZoom;
        this.panX = centerX - workflowCenterX * newZoom;
        this.panY = centerY - workflowCenterY * newZoom;

        this.updateTransform();

        showToast('Fit to screen', 'success');
    }

    /**
     * Toggle grid visibility (Phase 4)
     */
    toggleGrid() {
        const gridBg = document.getElementById('grid-bg');
        if (!gridBg) return;

        const isVisible = gridBg.style.display !== 'none';

        if (isVisible) {
            gridBg.style.display = 'none';
            showToast('Grid hidden', 'success');
        } else {
            gridBg.style.display = '';
            showToast('Grid visible', 'success');
        }
    }
}

// Create and export singleton instance
export const canvas = new Canvas();

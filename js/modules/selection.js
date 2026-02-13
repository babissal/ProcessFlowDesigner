/**
 * Selection Module
 * Handles multi-select, marquee selection, and selection rectangle
 */

import { CONFIG, getNodeConfig } from '../config.js';
import { eventBus } from './eventBus.js';
import { stateManager } from './stateManager.js';
import { canvas } from './canvas.js';
import { nodes } from './nodes.js';
import { createSVGElement } from '../utils/svg.js';
import { pointInRect } from '../utils/geometry.js';

class Selection {
    constructor() {
        this.isSelectingMarquee = false;
        this.marqueeStart = null;
        this.marqueeRect = null;
        this.justFinishedMarquee = false;
    }

    /**
     * Initialize selection module
     */
    init() {
        this.setupMarqueeSelection();
    }

    /**
     * Setup marquee selection (drag to select multiple nodes)
     */
    setupMarqueeSelection() {
        const svg = canvas.getSVG();
        if (!svg) return;

        let startX, startY;

        svg.addEventListener('mousedown', (e) => {
            // Only start marquee on canvas background with left click
            if (e.button !== 0) return;
            if (e.target.closest('.node') || e.target.closest('.connection')) return;
            if (canvas.spacePressed) return; // Don't interfere with panning

            // Start marquee selection
            const coords = canvas.screenToCanvas(e.clientX, e.clientY);
            startX = coords.x;
            startY = coords.y;
            this.marqueeStart = { x: startX, y: startY };
            this.isSelectingMarquee = true;

            // Create marquee rectangle
            this.createMarqueeRect(startX, startY, 0, 0);
        });

        svg.addEventListener('mousemove', (e) => {
            if (!this.isSelectingMarquee) return;

            const coords = canvas.screenToCanvas(e.clientX, e.clientY);
            const width = coords.x - startX;
            const height = coords.y - startY;

            this.updateMarqueeRect(startX, startY, width, height);
        });

        svg.addEventListener('mouseup', (e) => {
            if (!this.isSelectingMarquee) return;

            const coords = canvas.screenToCanvas(e.clientX, e.clientY);
            const width = coords.x - startX;
            const height = coords.y - startY;

            // Check if this was an actual marquee selection (non-zero dimensions)
            const isActualMarquee = Math.abs(width) > 5 || Math.abs(height) > 5;

            if (isActualMarquee) {
                // Prevent click event from firing
                e.stopPropagation();
                e.preventDefault();

                // Select nodes within marquee
                this.selectNodesInMarquee(startX, startY, width, height, e.shiftKey);

                // Prevent immediate click event from clearing selection
                this.justFinishedMarquee = true;
                setTimeout(() => {
                    this.justFinishedMarquee = false;
                }, 10);
            }

            // Remove marquee rectangle
            this.removeMarqueeRect();
            this.isSelectingMarquee = false;
        });
    }

    /**
     * Create marquee selection rectangle
     */
    createMarqueeRect(x, y, width, height) {
        const mainGroup = document.getElementById('main-group');
        if (!mainGroup) return;

        this.marqueeRect = createSVGElement('rect', {
            id: 'marquee-rect',
            x: width >= 0 ? x : x + width,
            y: height >= 0 ? y : y + height,
            width: Math.abs(width),
            height: Math.abs(height),
            fill: 'rgba(33, 150, 243, 0.1)',
            stroke: '#2196F3',
            'stroke-width': '1',
            'stroke-dasharray': '5,5',
            'pointer-events': 'none'
        });

        mainGroup.appendChild(this.marqueeRect);
    }

    /**
     * Update marquee rectangle size
     */
    updateMarqueeRect(x, y, width, height) {
        if (!this.marqueeRect) return;

        this.marqueeRect.setAttribute('x', width >= 0 ? x : x + width);
        this.marqueeRect.setAttribute('y', height >= 0 ? y : y + height);
        this.marqueeRect.setAttribute('width', Math.abs(width));
        this.marqueeRect.setAttribute('height', Math.abs(height));
    }

    /**
     * Remove marquee rectangle
     */
    removeMarqueeRect() {
        if (this.marqueeRect) {
            this.marqueeRect.remove();
            this.marqueeRect = null;
        }
    }

    /**
     * Select all nodes within marquee rectangle
     */
    selectNodesInMarquee(x, y, width, height, addToSelection) {
        // Normalize rectangle coordinates
        const left = width >= 0 ? x : x + width;
        const top = height >= 0 ? y : y + height;
        const right = left + Math.abs(width);
        const bottom = top + Math.abs(height);

        // Find nodes within rectangle
        const allNodes = stateManager.getNodes();
        const selectedNodeIds = [];

        allNodes.forEach(node => {
            const config = getNodeConfig(node.type);
            if (!config) return;

            const nodeWidth = node.width || config.width;
            const nodeHeight = node.height || config.height;

            // Node bounding box
            const nodeLeft = node.x;
            const nodeRight = node.x + nodeWidth;
            const nodeTop = node.y;
            const nodeBottom = node.y + nodeHeight;

            // Check if node rectangle intersects with marquee rectangle
            const intersects = !(nodeRight < left ||
                                nodeLeft > right ||
                                nodeBottom < top ||
                                nodeTop > bottom);

            if (intersects) {
                selectedNodeIds.push(node.id);
            }
        });

        // Update selection
        if (selectedNodeIds.length > 0) {
            if (addToSelection) {
                // Add to existing selection
                const currentSelection = stateManager.getState().ui.selectedNodes;
                const newSelection = [...new Set([...currentSelection, ...selectedNodeIds])];
                stateManager.updateUIState({ selectedNodes: newSelection, selectedConnections: [] });
            } else {
                // Replace selection
                stateManager.updateUIState({ selectedNodes: selectedNodeIds, selectedConnections: [] });
            }

            eventBus.emit(CONFIG.EVENTS.SELECTION_CHANGED, {
                selectedNodes: stateManager.getState().ui.selectedNodes,
                selectedConnections: []
            });

            // Explicitly update visual rendering
            nodes.updateSelectionRender();
        }
    }

    /**
     * Select all nodes
     */
    selectAll() {
        const allNodes = stateManager.getNodes();
        const nodeIds = allNodes.map(n => n.id);

        stateManager.updateUIState({
            selectedNodes: nodeIds,
            selectedConnections: []
        });

        eventBus.emit(CONFIG.EVENTS.SELECTION_CHANGED, {
            selectedNodes: nodeIds,
            selectedConnections: []
        });

        // Explicitly update visual rendering
        nodes.updateSelectionRender();

    }
}

// Create and export singleton instance
export const selection = new Selection();

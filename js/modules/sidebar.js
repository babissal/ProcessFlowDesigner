/**
 * Sidebar Module
 * Handles node palette and drag-to-canvas functionality
 */

import { CONFIG, getNodeConfig } from '../config.js';
import { stateManager } from './stateManager.js';
import { canvas } from './canvas.js';

class Sidebar {
    constructor() {
        this.paletteNodes = [];
        this.connectionTool = null;
        this.connectionMode = false;
        this.connectionSourceNode = null;
        this.connectionPreviewHandler = null;
    }

    /**
     * Initialize sidebar
     */
    init() {
        this.paletteNodes = document.querySelectorAll('.palette-node');
        this.connectionTool = document.getElementById('connection-tool');

        if (!this.paletteNodes.length) {
            console.error('Palette nodes not found');
            return;
        }

        this.setupDragAndDrop();
        this.setupConnectionTool();
        this.setupCategories();
    }

    /**
     * Setup category toggle functionality
     */
    setupCategories() {
        const categoryHeaders = document.querySelectorAll('.palette-category-header');

        categoryHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const category = header.closest('.palette-category');
                category.classList.toggle('collapsed');
            });
        });
    }

    /**
     * Setup drag and drop from palette to canvas
     */
    setupDragAndDrop() {
        const svg = canvas.getSVG();
        if (!svg) {
            console.error('SVG canvas not found!');
            return;
        }

        // Setup drag start for palette nodes
        this.paletteNodes.forEach(paletteNode => {
            paletteNode.addEventListener('dragstart', (e) => {
                const nodeType = paletteNode.dataset.nodeType;
                e.dataTransfer.setData('nodeType', nodeType);
                e.dataTransfer.effectAllowed = 'copy';

                // Add visual feedback
                paletteNode.style.opacity = '0.5';
            });

            paletteNode.addEventListener('dragend', (e) => {
                paletteNode.style.opacity = '1';
            });
        });

        // Setup drop zone on canvas
        const canvasContainer = document.getElementById('canvas-container');
        if (!canvasContainer) {
            console.error('Canvas container not found!');
            return;
        }

        canvasContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        canvasContainer.addEventListener('drop', (e) => {
            e.preventDefault();

            const nodeType = e.dataTransfer.getData('nodeType');

            if (!nodeType) {
                console.error('No node type in drop data!');
                return;
            }

            // Get drop coordinates in canvas space
            const coords = canvas.screenToCanvas(e.clientX, e.clientY);

            this.createNodeAtPosition(nodeType, coords.x, coords.y);
        });
    }

    /**
     * Create a node at specified position
     */
    createNodeAtPosition(type, x, y) {
        const nodeConfig = getNodeConfig(type);
        if (!nodeConfig) {
            console.error('Unknown node type:', type);
            return;
        }

        // Center the node at drop position
        const width = nodeConfig.width;
        const height = nodeConfig.height;

        const node = {
            type: type,
            label: nodeConfig.label,
            color: nodeConfig.color,
            strokeColor: nodeConfig.strokeColor,
            width: width,
            height: height,
            x: x - width / 2,
            y: y - height / 2
        };

        stateManager.addNode(node);
    }

    /**
     * Setup connection tool
     */
    setupConnectionTool() {
        if (!this.connectionTool) {
            console.warn('Connection tool not found');
            return;
        }

        // Click to toggle connection mode
        this.connectionTool.addEventListener('click', () => {
            this.toggleConnectionMode();
        });
    }

    /**
     * Toggle connection mode on/off
     */
    toggleConnectionMode() {
        this.connectionMode = !this.connectionMode;

        // Update UI
        if (this.connectionMode) {
            this.activateConnectionMode();
        } else {
            this.deactivateConnectionMode();
        }

        // Update state
        stateManager.updateUIState({
            connectionMode: this.connectionMode
        });
    }

    /**
     * Activate connection mode
     */
    activateConnectionMode() {
        // Highlight the tool
        this.connectionTool.classList.add('active');

        // Change cursor
        const canvas = document.getElementById('canvas');
        if (canvas) {
            canvas.style.cursor = 'crosshair';
        }

        // Reset source node
        this.connectionSourceNode = null;

        // Show notification
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
            statusMessage.textContent = 'Connection Mode: Click source node, then target node';
            statusMessage.style.color = '#2196F3';
        }
    }

    /**
     * Deactivate connection mode
     */
    deactivateConnectionMode() {
        // Remove highlight
        this.connectionTool.classList.remove('active');

        // Reset cursor
        const canvas = document.getElementById('canvas');
        if (canvas) {
            canvas.style.cursor = 'default';
        }

        // Stop preview line
        this.stopConnectionPreview();

        // Reset source node
        this.connectionSourceNode = null;

        // Clear any temporary highlights
        document.querySelectorAll('.node-shape').forEach(shape => {
            shape.classList.remove('connection-source');
        });

        // Reset status
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
            statusMessage.textContent = 'Ready';
            statusMessage.style.color = '';
        }
    }

    /**
     * Start showing preview connection line
     */
    startConnectionPreview(sourceNodeId) {
        const sourceNode = stateManager.getNode(sourceNodeId);
        if (!sourceNode) return;

        // Get source node center
        const nodeConfig = getNodeConfig(sourceNode.type);
        if (!nodeConfig) return;

        const width = sourceNode.width || nodeConfig.width;
        const height = sourceNode.height || nodeConfig.height;
        const sourceX = sourceNode.x + width / 2;
        const sourceY = sourceNode.y + height / 2;

        // Create preview line element
        const svg = document.getElementById('canvas');
        const mainGroup = document.getElementById('main-group');
        if (!svg || !mainGroup) return;

        // Create or get existing preview line
        let previewLine = document.getElementById('connection-preview-line');
        if (!previewLine) {
            previewLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            previewLine.id = 'connection-preview-line';
            previewLine.setAttribute('stroke', '#2196F3');
            previewLine.setAttribute('stroke-width', '3');
            previewLine.setAttribute('stroke-dasharray', '8,4');
            previewLine.setAttribute('opacity', '0.7');
            previewLine.setAttribute('marker-end', 'url(#arrowhead-selected)');
            previewLine.setAttribute('pointer-events', 'none');
            mainGroup.appendChild(previewLine);
        }

        previewLine.setAttribute('x1', sourceX);
        previewLine.setAttribute('y1', sourceY);
        previewLine.setAttribute('x2', sourceX);
        previewLine.setAttribute('y2', sourceY);
        previewLine.style.display = 'block';

        // Add mousemove listener to update preview line
        this.connectionPreviewHandler = (e) => {
            const coords = canvas.screenToCanvas(e.clientX, e.clientY);
            previewLine.setAttribute('x2', coords.x);
            previewLine.setAttribute('y2', coords.y);
        };

        svg.addEventListener('mousemove', this.connectionPreviewHandler);
    }

    /**
     * Stop showing preview connection line
     */
    stopConnectionPreview() {
        const previewLine = document.getElementById('connection-preview-line');
        if (previewLine) {
            previewLine.style.display = 'none';
        }

        // Remove mousemove listener
        if (this.connectionPreviewHandler) {
            const svg = document.getElementById('canvas');
            if (svg) {
                svg.removeEventListener('mousemove', this.connectionPreviewHandler);
            }
            this.connectionPreviewHandler = null;
        }
    }

    /**
     * Handle node click in connection mode
     */
    handleConnectionModeClick(nodeId) {
        if (!this.connectionMode) return false;

        if (!this.connectionSourceNode) {
            // First click - set source node
            this.connectionSourceNode = nodeId;

            // Highlight the source node
            const nodeGroup = document.getElementById(`node-${nodeId}`);
            if (nodeGroup) {
                const shape = nodeGroup.querySelector('.node-shape');
                if (shape) {
                    shape.classList.add('connection-source');
                }
            }

            // Start showing preview connection line
            this.startConnectionPreview(nodeId);

            // Update status
            const statusMessage = document.getElementById('status-message');
            if (statusMessage) {
                statusMessage.textContent = 'Connection Mode: Now click target node';
            }

        } else {
            // Second click - create connection
            const targetNodeId = nodeId;

            if (targetNodeId === this.connectionSourceNode) {
                // Show error
                const statusMessage = document.getElementById('status-message');
                if (statusMessage) {
                    statusMessage.textContent = 'Error: Cannot connect node to itself';
                    statusMessage.style.color = '#F44336';
                }
                setTimeout(() => {
                    this.deactivateConnectionMode();
                    this.toggleConnectionMode(); // Turn it back on
                }, 1500);
                return true;
            }

            // Create the connection
            stateManager.addConnection({
                from: this.connectionSourceNode,
                to: targetNodeId
            });

            // Stop preview line
            this.stopConnectionPreview();

            // Deactivate connection mode after creating a connection
            this.toggleConnectionMode();
        }

        return true; // Indicate that we handled the click
    }

    /**
     * Get connection mode status
     */
    isConnectionMode() {
        return this.connectionMode;
    }
}

// Create and export singleton instance
export const sidebar = new Sidebar();

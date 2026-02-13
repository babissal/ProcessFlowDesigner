/**
 * Connections Module
 * Handles connection creation, rendering, and deletion
 */

import { CONFIG, getNodeConfig } from '../config.js';
import { eventBus } from './eventBus.js';
import { stateManager } from './stateManager.js';
import { canvas } from './canvas.js';
import { nodes } from './nodes.js';
import { createSVGElement, setAttributes, createLinePath } from '../utils/svg.js';
import { getClosestAnchor, distanceToLine } from '../utils/geometry.js';

class Connections {
    constructor() {
        this.connectionsLayer = null;
        this.tempConnection = null;
        this.isConnecting = false;
        this.connectingFrom = null;
        this.connectingFromAnchor = null;
        this.editingConnectionId = null;
    }

    /**
     * Initialize connections module
     */
    init() {
        this.connectionsLayer = document.getElementById('connections-layer');
        this.tempConnection = document.getElementById('temp-connection');

        if (!this.connectionsLayer || !this.tempConnection) {
            console.error('Connections layer or temp connection not found');
            return;
        }

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for connection addition/deletion
        eventBus.on(CONFIG.EVENTS.CONNECTION_ADDED, (conn) => this.renderConnection(conn));
        eventBus.on(CONFIG.EVENTS.CONNECTION_DELETED, ({ connectionId }) => this.removeConnectionRender(connectionId));
        eventBus.on(CONFIG.EVENTS.NODE_UPDATED, () => this.updateAllConnections());
        eventBus.on(CONFIG.EVENTS.STATE_CHANGED, () => this.updateAllConnections());
        eventBus.on(CONFIG.EVENTS.NODE_DELETED, () => this.updateAllConnections());
        eventBus.on(CONFIG.EVENTS.SELECTION_CHANGED, () => this.updateSelectionRender());

        // Canvas click events for connection creation
        const svg = canvas.getSVG();
        if (svg) {
            svg.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
            svg.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
            svg.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
        }

        // Connection click for selection
        this.connectionsLayer.addEventListener('click', (e) => this.handleConnectionClick(e));
    }

    /**
     * Render a connection
     */
    renderConnection(connection) {
        const fromNode = stateManager.getNode(connection.from);
        const toNode = stateManager.getNode(connection.to);

        if (!fromNode || !toNode) {
            console.error('Invalid connection: nodes not found');
            return;
        }

        // Get anchor points
        const fromAnchor = this.getNodeAnchor(fromNode, toNode);
        const toAnchor = this.getNodeAnchor(toNode, fromNode);

        // Create path (curved by default in Phase 2)
        const useCurved = connection.curved !== undefined ? connection.curved : CONFIG.CONNECTIONS.USE_CURVED;
        const pathData = createLinePath(
            fromAnchor.x,
            fromAnchor.y,
            toAnchor.x,
            toAnchor.y,
            useCurved
        );

        // Get connection style (Phase 4)
        const style = connection.style || 'solid';
        const styleConfig = CONFIG.CONNECTIONS.STYLES[style.toUpperCase()] || CONFIG.CONNECTIONS.STYLES.SOLID;

        // Get connection color (Phase 4)
        const connectionColor = connection.color || CONFIG.CONNECTIONS.DEFAULT_COLOR;

        const path = createSVGElement('path', {
            id: `connection-${connection.id}`,
            className: 'connection',
            'data-connection-id': connection.id,
            d: pathData,
            fill: 'none',
            stroke: connectionColor,
            'stroke-width': styleConfig.strokeWidth,
            'stroke-dasharray': styleConfig.strokeDasharray !== 'none' ? styleConfig.strokeDasharray : '',
            'marker-end': 'url(#arrowhead)'
        });

        // Add animated class if style is animated (Phase 4)
        if (style === 'animated') {
            path.classList.add('animated');
        }

        this.connectionsLayer.appendChild(path);

        // Add label if present
        if (connection.label && connection.label.trim()) {
            this.renderConnectionLabel(connection, fromAnchor, toAnchor);
        }

        return path;
    }

    /**
     * Render connection label
     */
    renderConnectionLabel(connection, fromAnchor, toAnchor) {
        // Calculate midpoint
        const midX = (fromAnchor.x + toAnchor.x) / 2;
        const midY = (fromAnchor.y + toAnchor.y) / 2;

        // Create label group
        const labelGroup = createSVGElement('g', {
            id: `connection-label-${connection.id}`,
            className: 'connection-label',
            'data-connection-id': connection.id
        });

        // Create background rectangle
        const text = createSVGElement('text', {
            x: midX,
            y: midY,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            'font-size': CONFIG.CONNECTIONS.LABEL_FONT_SIZE,
            'font-weight': '500',
            fill: '#333',
            className: 'connection-label-text'
        });
        text.textContent = connection.label;

        // Add text to get bounding box
        labelGroup.appendChild(text);
        this.connectionsLayer.appendChild(labelGroup);

        // Get text dimensions
        const bbox = text.getBBox();

        // Create background
        const bg = createSVGElement('rect', {
            x: bbox.x - CONFIG.CONNECTIONS.LABEL_PADDING,
            y: bbox.y - CONFIG.CONNECTIONS.LABEL_PADDING,
            width: bbox.width + CONFIG.CONNECTIONS.LABEL_PADDING * 2,
            height: bbox.height + CONFIG.CONNECTIONS.LABEL_PADDING * 2,
            rx: 3,
            fill: CONFIG.CONNECTIONS.LABEL_BG_COLOR,
            stroke: CONFIG.CONNECTIONS.DEFAULT_COLOR,
            'stroke-width': 1,
            className: 'connection-label-bg'
        });

        // Insert background before text
        labelGroup.insertBefore(bg, text);

        // Make label editable on double-click (Phase 4)
        labelGroup.style.cursor = 'pointer';
        labelGroup.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.startEditingLabel(connection.id);
        });

        return labelGroup;
    }

    /**
     * Update connection rendering
     */
    updateConnectionRender(connection) {
        const fromNode = stateManager.getNode(connection.from);
        const toNode = stateManager.getNode(connection.to);

        if (!fromNode || !toNode) {
            this.removeConnectionRender(connection.id);
            return;
        }

        const path = document.getElementById(`connection-${connection.id}`);
        if (!path) return;

        // Update path
        const fromAnchor = this.getNodeAnchor(fromNode, toNode);
        const toAnchor = this.getNodeAnchor(toNode, fromNode);

        const useCurved = connection.curved !== undefined ? connection.curved : CONFIG.CONNECTIONS.USE_CURVED;
        const pathData = createLinePath(
            fromAnchor.x,
            fromAnchor.y,
            toAnchor.x,
            toAnchor.y,
            useCurved
        );

        path.setAttribute('d', pathData);

        // Update style and color (Phase 4)
        const style = connection.style || 'solid';
        const styleConfig = CONFIG.CONNECTIONS.STYLES[style.toUpperCase()] || CONFIG.CONNECTIONS.STYLES.SOLID;
        const connectionColor = connection.color || CONFIG.CONNECTIONS.DEFAULT_COLOR;

        path.setAttribute('stroke', connectionColor);
        path.setAttribute('stroke-width', styleConfig.strokeWidth);

        if (styleConfig.strokeDasharray !== 'none') {
            path.setAttribute('stroke-dasharray', styleConfig.strokeDasharray);
        } else {
            path.removeAttribute('stroke-dasharray');
        }

        // Update animated class
        if (style === 'animated') {
            path.classList.add('animated');
        } else {
            path.classList.remove('animated');
        }

        // Update label position
        this.updateConnectionLabel(connection, fromAnchor, toAnchor);
    }

    /**
     * Update connection label position
     */
    updateConnectionLabel(connection, fromAnchor, toAnchor) {
        const labelGroup = document.getElementById(`connection-label-${connection.id}`);

        if (connection.label && connection.label.trim()) {
            if (labelGroup) {
                // Update existing label position
                const midX = (fromAnchor.x + toAnchor.x) / 2;
                const midY = (fromAnchor.y + toAnchor.y) / 2;

                const text = labelGroup.querySelector('.connection-label-text');
                const bg = labelGroup.querySelector('.connection-label-bg');

                if (text) {
                    text.setAttribute('x', midX);
                    text.setAttribute('y', midY);
                    text.textContent = connection.label;

                    // Update background
                    const bbox = text.getBBox();
                    if (bg) {
                        bg.setAttribute('x', bbox.x - CONFIG.CONNECTIONS.LABEL_PADDING);
                        bg.setAttribute('y', bbox.y - CONFIG.CONNECTIONS.LABEL_PADDING);
                        bg.setAttribute('width', bbox.width + CONFIG.CONNECTIONS.LABEL_PADDING * 2);
                        bg.setAttribute('height', bbox.height + CONFIG.CONNECTIONS.LABEL_PADDING * 2);
                    }
                }
            } else {
                // Create new label
                this.renderConnectionLabel(connection, fromAnchor, toAnchor);
            }
        } else if (labelGroup) {
            // Remove label if empty
            labelGroup.remove();
        }
    }

    /**
     * Remove connection rendering
     */
    removeConnectionRender(connectionId) {
        const path = document.getElementById(`connection-${connectionId}`);
        if (path) {
            path.remove();
        }

        // Remove label
        const label = document.getElementById(`connection-label-${connectionId}`);
        if (label) {
            label.remove();
        }
    }

    /**
     * Update all connections (when nodes move)
     */
    updateAllConnections() {
        const connections = stateManager.getConnections();
        connections.forEach(conn => this.updateConnectionRender(conn));
    }

    /**
     * Update selection rendering for connections
     */
    updateSelectionRender() {
        const selectedConnectionIds = stateManager.getState().ui.selectedConnections;

        // Remove all selections
        document.querySelectorAll('.connection').forEach(path => {
            path.classList.remove('selected');
            path.setAttribute('stroke', CONFIG.CONNECTIONS.DEFAULT_COLOR);
            path.setAttribute('stroke-width', CONFIG.CONNECTIONS.STROKE_WIDTH);
            path.setAttribute('marker-end', 'url(#arrowhead)');
        });

        // Add selection to selected connections
        selectedConnectionIds.forEach(connId => {
            const path = document.getElementById(`connection-${connId}`);
            if (path) {
                path.classList.add('selected');
                path.setAttribute('stroke', CONFIG.CONNECTIONS.SELECTED_COLOR);
                path.setAttribute('stroke-width', CONFIG.CONNECTIONS.SELECTED_STROKE_WIDTH);
                path.setAttribute('marker-end', 'url(#arrowhead-selected)');
            }
        });
    }

    /**
     * Get anchor point on node closest to target node
     */
    getNodeAnchor(node, targetNode) {
        const nodeConfig = getNodeConfig(node.type);
        if (!nodeConfig) return { x: node.x, y: node.y };

        const width = node.width || nodeConfig.width;
        const height = node.height || nodeConfig.height;

        const targetConfig = getNodeConfig(targetNode.type);
        const targetWidth = targetNode.width || targetConfig.width;
        const targetHeight = targetNode.height || targetConfig.height;

        // Calculate centers
        const centerX = node.x + width / 2;
        const centerY = node.y + height / 2;
        const targetCenterX = targetNode.x + targetWidth / 2;
        const targetCenterY = targetNode.y + targetHeight / 2;

        return getClosestAnchor(
            { ...node, width, height },
            targetCenterX,
            targetCenterY
        );
    }

    /**
     * Handle canvas mouse down for connection creation
     */
    handleCanvasMouseDown(e) {
        // Only handle left mouse button
        if (e.button !== 0) {
            return;
        }

        // Don't start connecting if panning
        const canvasObj = canvas;
        if (canvasObj.spacePressed) {
            return;
        }

        // Check if clicking on a node
        const target = e.target.closest('.node');
        if (!target) {
            return;
        }

        const nodeId = target.dataset.nodeId;
        if (!nodeId) return;

        const node = stateManager.getNode(nodeId);
        if (!node) return;

        // Start connecting
        this.isConnecting = true;
        this.connectingFrom = nodeId;

        // Get node center as starting point
        const nodeConfig = getNodeConfig(node.type);
        const width = node.width || nodeConfig.width;
        const height = node.height || nodeConfig.height;

        this.connectingFromAnchor = {
            x: node.x + width / 2,
            y: node.y + height / 2
        };

        // Show temp connection
        this.tempConnection.style.display = 'block';
        this.tempConnection.setAttribute('x1', this.connectingFromAnchor.x);
        this.tempConnection.setAttribute('y1', this.connectingFromAnchor.y);
        this.tempConnection.setAttribute('x2', this.connectingFromAnchor.x);
        this.tempConnection.setAttribute('y2', this.connectingFromAnchor.y);

        e.stopPropagation();
    }

    /**
     * Handle canvas mouse move for connection preview
     */
    handleCanvasMouseMove(e) {
        if (!this.isConnecting) return;

        // Get canvas coordinates
        const coords = canvas.screenToCanvas(e.clientX, e.clientY);

        // Update temp connection end point
        this.tempConnection.setAttribute('x2', coords.x);
        this.tempConnection.setAttribute('y2', coords.y);

        // Update start point to closest anchor
        const fromNode = stateManager.getNode(this.connectingFrom);
        if (fromNode) {
            const anchor = getClosestAnchor(
                {
                    ...fromNode,
                    width: fromNode.width || getNodeConfig(fromNode.type).width,
                    height: fromNode.height || getNodeConfig(fromNode.type).height
                },
                coords.x,
                coords.y
            );

            this.tempConnection.setAttribute('x1', anchor.x);
            this.tempConnection.setAttribute('y1', anchor.y);
        }
    }

    /**
     * Handle canvas mouse up to complete connection
     */
    handleCanvasMouseUp(e) {
        if (!this.isConnecting) return;

        // Hide temp connection
        this.tempConnection.style.display = 'none';

        // Check if releasing on a node
        const target = e.target.closest('.node');

        if (target) {
            const toNodeId = target.dataset.nodeId;

            if (toNodeId && toNodeId !== this.connectingFrom) {
                // Create connection
                stateManager.addConnection({
                    from: this.connectingFrom,
                    to: toNodeId
                });
            }
        }

        // Reset state
        this.isConnecting = false;
        this.connectingFrom = null;
        this.connectingFromAnchor = null;
    }

    /**
     * Handle connection click for selection
     */
    handleConnectionClick(e) {
        const path = e.target.closest('.connection');
        if (!path) return;

        const connectionId = path.dataset.connectionId;
        if (!connectionId) return;

        e.stopPropagation();

        // Select connection
        stateManager.selectConnection(connectionId, false);
    }

    /**
     * Find connection at point
     */
    findConnectionAtPoint(x, y) {
        const connections = stateManager.getConnections();

        for (const conn of connections) {
            const fromNode = stateManager.getNode(conn.from);
            const toNode = stateManager.getNode(conn.to);

            if (!fromNode || !toNode) continue;

            const fromAnchor = this.getNodeAnchor(fromNode, toNode);
            const toAnchor = this.getNodeAnchor(toNode, fromNode);

            const dist = distanceToLine(
                x, y,
                fromAnchor.x, fromAnchor.y,
                toAnchor.x, toAnchor.y
            );

            if (dist < CONFIG.CONNECTIONS.HIT_TOLERANCE) {
                return conn;
            }
        }

        return null;
    }

    /**
     * Start editing connection label (Phase 4)
     */
    startEditingLabel(connectionId) {
        if (this.editingConnectionId) {
            this.stopEditingLabel();
        }

        const connection = stateManager.getConnection(connectionId);
        if (!connection) return;

        const labelGroup = document.getElementById(`connection-label-${connectionId}`);
        if (!labelGroup) return;

        const text = labelGroup.querySelector('.connection-label-text');
        const bg = labelGroup.querySelector('.connection-label-bg');
        if (!text || !bg) return;

        this.editingConnectionId = connectionId;

        // Hide existing text
        text.style.display = 'none';

        // Create foreignObject with input
        const textBBox = text.getBBox();
        const foreign = createSVGElement('foreignObject', {
            x: textBBox.x - CONFIG.CONNECTIONS.LABEL_PADDING - 10,
            y: textBBox.y - CONFIG.CONNECTIONS.LABEL_PADDING,
            width: Math.max(150, textBBox.width + 40),
            height: textBBox.height + CONFIG.CONNECTIONS.LABEL_PADDING * 2,
            className: 'connection-label-editor'
        });

        const input = document.createElement('input');
        input.type = 'text';
        input.value = connection.label || '';
        input.className = 'connection-label-input';
        input.style.width = '100%';
        input.style.height = '100%';
        input.style.border = '1px solid #2196F3';
        input.style.borderRadius = '3px';
        input.style.padding = '4px 8px';
        input.style.fontSize = CONFIG.CONNECTIONS.LABEL_FONT_SIZE + 'px';
        input.style.fontFamily = 'inherit';
        input.style.backgroundColor = '#fff';
        input.style.boxShadow = '0 0 0 3px rgba(33, 150, 243, 0.2)';

        foreign.appendChild(input);
        labelGroup.appendChild(foreign);

        // Focus and select
        input.focus();
        input.select();

        // Save on Enter or blur
        const save = () => this.stopEditingLabel();
        input.addEventListener('blur', save, { once: true });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                save();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.cancelEditingLabel();
            }
        });
    }

    /**
     * Stop editing connection label and save
     */
    stopEditingLabel() {
        if (!this.editingConnectionId) return;

        const labelGroup = document.getElementById(`connection-label-${this.editingConnectionId}`);
        if (!labelGroup) {
            this.editingConnectionId = null;
            return;
        }

        const foreign = labelGroup.querySelector('.connection-label-editor');
        const text = labelGroup.querySelector('.connection-label-text');

        if (foreign && text) {
            const input = foreign.querySelector('input');
            const newLabel = input.value.trim();

            // Update connection label
            stateManager.updateConnection(this.editingConnectionId, { label: newLabel });

            // Remove editor and show text
            if (foreign.parentNode) {
                foreign.remove();
            }
            text.style.display = '';
        }

        this.editingConnectionId = null;
    }

    /**
     * Cancel editing connection label without saving
     */
    cancelEditingLabel() {
        if (!this.editingConnectionId) return;

        const labelGroup = document.getElementById(`connection-label-${this.editingConnectionId}`);
        if (!labelGroup) {
            this.editingConnectionId = null;
            return;
        }

        const foreign = labelGroup.querySelector('.connection-label-editor');
        const text = labelGroup.querySelector('.connection-label-text');

        if (foreign && text) {
            foreign.remove();
            text.style.display = '';
        }

        this.editingConnectionId = null;
    }

    /**
     * Render all connections from state
     */
    renderAllConnections() {
        // Clear existing connections
        this.connectionsLayer.innerHTML = '';

        // Render all connections
        const connections = stateManager.getConnections();
        connections.forEach(conn => this.renderConnection(conn));

        // Update selection
        this.updateSelectionRender();
    }
}

// Create and export singleton instance
export const connections = new Connections();

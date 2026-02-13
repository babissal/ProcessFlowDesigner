/**
 * Nodes Module
 * Handles node creation, rendering, dragging, selection, and label editing
 */

import { CONFIG, getNodeConfig } from '../config.js';
import { eventBus } from './eventBus.js';
import { stateManager } from './stateManager.js';
import { canvas } from './canvas.js';
import { sidebar } from './sidebar.js';
import { createSVGElement, setAttributes, createDiamondPath } from '../utils/svg.js';
import { pointInRect, pointInCircle, pointInDiamond } from '../utils/geometry.js';

class Nodes {
    constructor() {
        this.nodesLayer = null;
        this.editingNodeId = null;
        this.doubleClickTimer = null;
        this.clickCount = 0;
    }

    /**
     * Initialize nodes module
     */
    init() {
        this.nodesLayer = document.getElementById('nodes-layer');

        if (!this.nodesLayer) {
            console.error('Nodes layer not found');
            return;
        }

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for node addition/update/deletion
        eventBus.on(CONFIG.EVENTS.NODE_ADDED, (node) => this.renderNode(node));
        eventBus.on(CONFIG.EVENTS.NODE_UPDATED, (node) => this.updateNodeRender(node));
        eventBus.on(CONFIG.EVENTS.NODE_DELETED, ({ nodeId }) => this.removeNodeRender(nodeId));
        eventBus.on(CONFIG.EVENTS.SELECTION_CHANGED, () => this.updateSelectionRender());

        // Node interactions
        this.nodesLayer.addEventListener('mousedown', (e) => this.handleNodeMouseDown(e));
        this.nodesLayer.addEventListener('click', (e) => this.handleNodeClick(e));
        this.nodesLayer.addEventListener('dblclick', (e) => this.handleNodeDoubleClick(e));
    }

    /**
     * Render a node on the canvas
     */
    renderNode(node) {
        const nodeConfig = getNodeConfig(node.type);
        if (!nodeConfig) {
            console.error('Unknown node type:', node.type);
            return;
        }

        // Create node group
        const nodeGroup = createSVGElement('g', {
            id: `node-${node.id}`,
            className: 'node',
            'data-node-id': node.id,
            'data-node-type': node.type,
            transform: `translate(${node.x}, ${node.y})`
        });

        const width = node.width || nodeConfig.width;
        const height = node.height || nodeConfig.height;
        const color = node.color || nodeConfig.color;
        const strokeColor = node.strokeColor || nodeConfig.strokeColor;

        // Create shape based on type
        let shape;
        switch (nodeConfig.shape) {
            case 'circle':
                const radius = width / 2;
                shape = createSVGElement('circle', {
                    cx: radius,
                    cy: radius,
                    r: radius - 2,
                    fill: color,
                    stroke: strokeColor,
                    'stroke-width': '2',
                    className: 'node-shape'
                });
                break;

            case 'rectangle':
                shape = createSVGElement('rect', {
                    x: 0,
                    y: 0,
                    width: width,
                    height: height,
                    rx: 8,
                    ry: 8,
                    fill: color,
                    stroke: strokeColor,
                    'stroke-width': '2',
                    className: 'node-shape'
                });
                break;

            case 'diamond':
                const diamondPath = createDiamondPath(0, 0, width, height);
                shape = createSVGElement('path', {
                    d: diamondPath,
                    fill: color,
                    stroke: strokeColor,
                    'stroke-width': '2',
                    className: 'node-shape'
                });
                break;

            case 'process':
                // Rectangle with vertical lines (subprocess indicator)
                shape = createSVGElement('g', { className: 'node-shape' });
                const processRect = createSVGElement('rect', {
                    x: 0,
                    y: 0,
                    width: width,
                    height: height,
                    rx: 8,
                    ry: 8,
                    fill: color,
                    stroke: strokeColor,
                    'stroke-width': '2'
                });
                const line1 = createSVGElement('line', {
                    x1: 10,
                    y1: 0,
                    x2: 10,
                    y2: height,
                    stroke: strokeColor,
                    'stroke-width': '2'
                });
                const line2 = createSVGElement('line', {
                    x1: width - 10,
                    y1: 0,
                    x2: width - 10,
                    y2: height,
                    stroke: strokeColor,
                    'stroke-width': '2'
                });
                shape.appendChild(processRect);
                shape.appendChild(line1);
                shape.appendChild(line2);
                break;

            case 'trapezoid':
                // Trapezoid for manual operation
                const trapPath = `M ${width * 0.15} 0 L ${width * 0.85} 0 L ${width} ${height} L 0 ${height} Z`;
                shape = createSVGElement('path', {
                    d: trapPath,
                    fill: color,
                    stroke: strokeColor,
                    'stroke-width': '2',
                    className: 'node-shape'
                });
                break;

            case 'delay':
                // D-shape (semicircle on right side)
                const delayPath = `M 0 0 L ${width - height / 2} 0
                    A ${height / 2} ${height / 2} 0 0 1 ${width - height / 2} ${height}
                    L 0 ${height} Z`;
                shape = createSVGElement('path', {
                    d: delayPath,
                    fill: color,
                    stroke: strokeColor,
                    'stroke-width': '2',
                    className: 'node-shape'
                });
                break;

            case 'cylinder':
                // Database cylinder
                shape = createSVGElement('g', { className: 'node-shape' });
                const ellipseTop = createSVGElement('ellipse', {
                    cx: width / 2,
                    cy: 15,
                    rx: width / 2 - 2,
                    ry: 15,
                    fill: color,
                    stroke: strokeColor,
                    'stroke-width': '2'
                });
                const cylinderRect = createSVGElement('rect', {
                    x: 2,
                    y: 15,
                    width: width - 4,
                    height: height - 30,
                    fill: color,
                    stroke: 'none'
                });
                const leftLine = createSVGElement('line', {
                    x1: 2,
                    y1: 15,
                    x2: 2,
                    y2: height - 15,
                    stroke: strokeColor,
                    'stroke-width': '2'
                });
                const rightLine = createSVGElement('line', {
                    x1: width - 2,
                    y1: 15,
                    x2: width - 2,
                    y2: height - 15,
                    stroke: strokeColor,
                    'stroke-width': '2'
                });
                const ellipseBottom = createSVGElement('ellipse', {
                    cx: width / 2,
                    cy: height - 15,
                    rx: width / 2 - 2,
                    ry: 15,
                    fill: color,
                    stroke: strokeColor,
                    'stroke-width': '2'
                });
                shape.appendChild(cylinderRect);
                shape.appendChild(leftLine);
                shape.appendChild(rightLine);
                shape.appendChild(ellipseTop);
                shape.appendChild(ellipseBottom);
                break;

            case 'document':
                // Document with wavy bottom
                const wavyBottom = `M 0 0 L ${width} 0 L ${width} ${height - 10}
                    Q ${width * 0.75} ${height - 15} ${width / 2} ${height - 10}
                    Q ${width * 0.25} ${height - 5} 0 ${height - 10} Z`;
                shape = createSVGElement('path', {
                    d: wavyBottom,
                    fill: color,
                    stroke: strokeColor,
                    'stroke-width': '2',
                    className: 'node-shape'
                });
                break;

            case 'note':
                // Comment/note with dog-ear
                shape = createSVGElement('g', { className: 'node-shape' });
                const noteRect = createSVGElement('path', {
                    d: `M 0 0 L ${width - 20} 0 L ${width} 20 L ${width} ${height} L 0 ${height} Z`,
                    fill: color,
                    stroke: strokeColor,
                    'stroke-width': '2'
                });
                const dogEar = createSVGElement('path', {
                    d: `M ${width - 20} 0 L ${width - 20} 20 L ${width} 20`,
                    fill: 'none',
                    stroke: strokeColor,
                    'stroke-width': '2'
                });
                shape.appendChild(noteRect);
                shape.appendChild(dogEar);
                break;

            default:
                // Fallback to rectangle
                shape = createSVGElement('rect', {
                    x: 0,
                    y: 0,
                    width: width,
                    height: height,
                    rx: 8,
                    ry: 8,
                    fill: color,
                    stroke: strokeColor,
                    'stroke-width': '2',
                    className: 'node-shape'
                });
        }

        nodeGroup.appendChild(shape);

        // Create label
        // Determine label color based on node type
        const lightTextTypes = ['decision', 'comment']; // Light background types
        const labelColor = lightTextTypes.includes(node.type) ? '#333' : 'white';

        const label = createSVGElement('text', {
            x: width / 2,
            y: height / 2,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            fill: labelColor,
            'font-size': node.type === 'merge' ? '10' : '14',
            'font-weight': '500',
            className: 'node-label',
            'pointer-events': 'none'
        });
        label.textContent = node.label || nodeConfig.label;
        nodeGroup.appendChild(label);

        // Add lock icon if node is locked
        if (node.locked) {
            const lockIcon = createSVGElement('text', {
                x: width - 10,
                y: 15,
                'text-anchor': 'end',
                'font-size': '12',
                className: 'node-lock-icon',
                'pointer-events': 'none'
            });
            lockIcon.textContent = '🔒';
            nodeGroup.appendChild(lockIcon);
        }

        // Add to layer
        this.nodesLayer.appendChild(nodeGroup);

        // Add entering animation
        nodeGroup.classList.add('node-entering');
        setTimeout(() => {
            nodeGroup.classList.remove('node-entering');
        }, 300);

        // Make draggable with interact.js
        this.makeNodeDraggable(nodeGroup, node.id);

        return nodeGroup;
    }

    /**
     * Update node rendering
     */
    updateNodeRender(node) {
        const nodeGroup = document.getElementById(`node-${node.id}`);
        if (!nodeGroup) {
            console.error('Node element not found:', node.id);
            return;
        }

        // Update position
        nodeGroup.setAttribute('transform', `translate(${node.x}, ${node.y})`);

        // Update label
        const label = nodeGroup.querySelector('.node-label');
        if (label) {
            label.textContent = node.label;
        }

        // Update color if changed
        const shape = nodeGroup.querySelector('.node-shape');
        if (shape && node.color) {
            shape.setAttribute('fill', node.color);
        }
    }

    /**
     * Remove node rendering
     */
    removeNodeRender(nodeId) {
        const nodeGroup = document.getElementById(`node-${nodeId}`);
        if (nodeGroup) {
            nodeGroup.remove();
        }
    }

    /**
     * Update selection rendering for all nodes
     */
    updateSelectionRender() {
        const selectedNodeIds = stateManager.getState().ui.selectedNodes;

        // Remove all selections first
        document.querySelectorAll('.node').forEach(nodeGroup => {
            const shape = nodeGroup.querySelector('.node-shape');
            if (shape) {
                shape.classList.remove('selected');
            }
            nodeGroup.classList.remove('selected');
        });

        // Add selection to selected nodes
        selectedNodeIds.forEach(nodeId => {
            const nodeGroup = document.getElementById(`node-${nodeId}`);
            if (nodeGroup) {
                const shape = nodeGroup.querySelector('.node-shape');
                if (shape) {
                    shape.classList.add('selected');
                }
                // Add animation class
                nodeGroup.classList.add('selected');
                setTimeout(() => {
                    nodeGroup.classList.remove('selected');
                }, 300);
            }
        });
    }

    /**
     * Make node draggable using interact.js
     */
    makeNodeDraggable(nodeGroup, nodeId) {
        if (typeof interact === 'undefined') {
            console.error('interact.js not loaded');
            return;
        }

        interact(nodeGroup)
            .draggable({
                onstart: (event) => {
                    const node = stateManager.getNode(nodeId);
                    if (!node) return;

                    // Prevent dragging if locked
                    if (node.locked) {
                        event.interaction.stop();
                        return;
                    }

                    // Store initial position
                    event.target.dataset.startX = node.x;
                    event.target.dataset.startY = node.y;
                },
                onmove: (event) => {
                    const node = stateManager.getNode(nodeId);
                    if (!node || node.locked) return;

                    const transform = canvas.getTransform();

                    // Calculate new position
                    const dx = event.dx / transform.scale;
                    const dy = event.dy / transform.scale;

                    const newX = node.x + dx;
                    const newY = node.y + dy;

                    // Update node position in state
                    stateManager.updateNode(nodeId, { x: newX, y: newY });
                },
                onend: (event) => {
                    // Emit node moved event for potential undo/redo
                    const node = stateManager.getNode(nodeId);
                    if (node) {
                        eventBus.emit(CONFIG.EVENTS.NODE_MOVED, {
                            nodeId,
                            from: {
                                x: parseFloat(event.target.dataset.startX),
                                y: parseFloat(event.target.dataset.startY)
                            },
                            to: {
                                x: node.x,
                                y: node.y
                            }
                        });
                    }
                }
            });
    }

    /**
     * Handle node mouse down
     */
    handleNodeMouseDown(e) {
        const nodeGroup = e.target.closest('.node');
        if (!nodeGroup) return;

        const nodeId = nodeGroup.dataset.nodeId;
        if (!nodeId) return;

        // Don't interfere with dragging
        e.stopPropagation();
    }

    /**
     * Handle node click for selection
     */
    handleNodeClick(e) {
        const nodeGroup = e.target.closest('.node');
        if (!nodeGroup) return;

        const nodeId = nodeGroup.dataset.nodeId;
        if (!nodeId) return;

        e.stopPropagation();

        // Check if in connection mode
        if (sidebar.isConnectionMode()) {
            // Handle connection mode click
            sidebar.handleConnectionModeClick(nodeId);
            return;
        }

        // Multi-select with Shift key
        const addToSelection = e.shiftKey;

        if (addToSelection) {
            // Toggle node in selection
            const currentSelection = stateManager.getState().ui.selectedNodes;
            let newSelection;

            if (currentSelection.includes(nodeId)) {
                // Remove from selection
                newSelection = currentSelection.filter(id => id !== nodeId);
            } else {
                // Add to selection
                newSelection = [...currentSelection, nodeId];
            }

            stateManager.updateUIState({
                selectedNodes: newSelection,
                selectedConnections: []
            });

            eventBus.emit(CONFIG.EVENTS.SELECTION_CHANGED, {
                selectedNodes: newSelection,
                selectedConnections: []
            });
        } else {
            // Normal single selection
            stateManager.selectNode(nodeId, false);
        }
    }

    /**
     * Handle node double-click for label editing
     */
    handleNodeDoubleClick(e) {
        const nodeGroup = e.target.closest('.node');
        if (!nodeGroup) return;

        const nodeId = nodeGroup.dataset.nodeId;
        if (!nodeId) return;

        e.stopPropagation();

        this.startEditingLabel(nodeId);
    }

    /**
     * Start editing node label
     */
    startEditingLabel(nodeId) {
        if (this.editingNodeId) {
            this.stopEditingLabel();
        }

        const node = stateManager.getNode(nodeId);
        if (!node) return;

        const nodeGroup = document.getElementById(`node-${nodeId}`);
        if (!nodeGroup) return;

        const label = nodeGroup.querySelector('.node-label');
        if (!label) return;

        this.editingNodeId = nodeId;

        // Create foreignObject with input
        const nodeConfig = getNodeConfig(node.type);
        const width = node.width || nodeConfig.width;
        const height = node.height || nodeConfig.height;

        const foreign = createSVGElement('foreignObject', {
            x: 0,
            y: height / 2 - 15,
            width: width,
            height: 30,
            className: 'node-label-editor'
        });

        const input = document.createElement('input');
        input.type = 'text';
        input.value = node.label;
        input.className = 'node-label-input';
        input.style.width = '100%';
        input.style.height = '100%';
        input.style.textAlign = 'center';
        input.style.fontSize = '14px';
        input.style.border = '2px solid #2196F3';
        input.style.borderRadius = '4px';
        input.style.padding = '4px';
        input.style.backgroundColor = 'white';

        foreign.appendChild(input);
        nodeGroup.appendChild(foreign);

        // Hide original label
        label.style.display = 'none';

        // Focus input and select all
        setTimeout(() => {
            input.focus();
            input.select();
        }, 10);

        // Handle input events
        input.addEventListener('blur', () => this.stopEditingLabel());
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.stopEditingLabel();
            } else if (e.key === 'Escape') {
                this.cancelEditingLabel();
            }
        });
    }

    /**
     * Stop editing label and save changes
     */
    stopEditingLabel() {
        if (!this.editingNodeId) return;

        const nodeGroup = document.getElementById(`node-${this.editingNodeId}`);
        if (!nodeGroup) {
            this.editingNodeId = null;
            return;
        }

        const foreign = nodeGroup.querySelector('.node-label-editor');
        const label = nodeGroup.querySelector('.node-label');

        if (foreign && label) {
            const input = foreign.querySelector('input');
            const newLabel = input.value.trim() || 'Untitled';

            // Update node label
            stateManager.updateNode(this.editingNodeId, { label: newLabel });

            // Remove editor and show label
            if (foreign.parentNode) {
                foreign.remove();
            }
            label.style.display = '';
        }

        this.editingNodeId = null;
    }

    /**
     * Cancel editing label without saving
     */
    cancelEditingLabel() {
        if (!this.editingNodeId) return;

        const nodeGroup = document.getElementById(`node-${this.editingNodeId}`);
        if (!nodeGroup) {
            this.editingNodeId = null;
            return;
        }

        const foreign = nodeGroup.querySelector('.node-label-editor');
        const label = nodeGroup.querySelector('.node-label');

        if (foreign && label) {
            foreign.remove();
            label.style.display = '';
        }

        this.editingNodeId = null;
    }

    /**
     * Check if a point is inside a node
     */
    isPointInNode(x, y, node) {
        const nodeConfig = getNodeConfig(node.type);
        if (!nodeConfig) return false;

        const width = node.width || nodeConfig.width;
        const height = node.height || nodeConfig.height;

        switch (nodeConfig.shape) {
            case 'circle':
                const radius = width / 2;
                return pointInCircle(x, y, node.x + radius, node.y + radius, radius);

            case 'rectangle':
                return pointInRect(x, y, node.x, node.y, width, height);

            case 'diamond':
                return pointInDiamond(x, y, node.x, node.y, width, height);

            default:
                return false;
        }
    }

    /**
     * Find node at coordinates
     */
    findNodeAtPoint(x, y) {
        const nodes = stateManager.getNodes();

        // Reverse order to check top nodes first
        for (let i = nodes.length - 1; i >= 0; i--) {
            if (this.isPointInNode(x, y, nodes[i])) {
                return nodes[i];
            }
        }

        return null;
    }

    /**
     * Toggle lock state of a node
     */
    toggleLock(nodeId) {
        const node = stateManager.getNode(nodeId);
        if (!node) return;

        const newLockState = !node.locked;
        stateManager.updateNode(nodeId, { locked: newLockState });

        const message = newLockState ? 'Node locked' : 'Node unlocked';
        eventBus.emit(CONFIG.EVENTS.SUCCESS, { message });

        return newLockState;
    }

    /**
     * Toggle lock state of selected nodes
     */
    toggleLockSelected() {
        const state = stateManager.getState();
        const selectedNodes = state.ui.selectedNodes;

        if (selectedNodes.length === 0) {
            eventBus.emit(CONFIG.EVENTS.ERROR, { message: 'No nodes selected' });
            return;
        }

        // Check if any nodes are locked
        const anyLocked = selectedNodes.some(nodeId => {
            const node = stateManager.getNode(nodeId);
            return node && node.locked;
        });

        // Toggle: if any locked, unlock all; if none locked, lock all
        const newState = !anyLocked;

        selectedNodes.forEach(nodeId => {
            stateManager.updateNode(nodeId, { locked: newState });
        });

        const message = newState
            ? `Locked ${selectedNodes.length} node${selectedNodes.length > 1 ? 's' : ''}`
            : `Unlocked ${selectedNodes.length} node${selectedNodes.length > 1 ? 's' : ''}`;

        eventBus.emit(CONFIG.EVENTS.SUCCESS, { message });
    }

    /**
     * Render all nodes from state
     */
    renderAllNodes() {
        // Clear existing nodes
        this.nodesLayer.innerHTML = '';

        // Render all nodes
        const nodes = stateManager.getNodes();
        nodes.forEach(node => this.renderNode(node));

        // Update selection
        this.updateSelectionRender();
    }
}

// Create and export singleton instance
export const nodes = new Nodes();

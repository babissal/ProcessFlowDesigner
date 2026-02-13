/**
 * Node Properties Module
 * Handles node property editing UI
 */

import { CONFIG, getNodeConfig } from '../config.js';
import { eventBus } from './eventBus.js';
import { stateManager } from './stateManager.js';
import { showToast } from '../utils/dom.js';

class NodeProperties {
    constructor() {
        this.panel = null;
        this.isVisible = false;
        this.currentNodeId = null;
    }

    /**
     * Initialize node properties panel
     */
    init() {
        console.log('Initializing node properties panel...');

        this.createPanel();
        this.setupEventListeners();
    }

    /**
     * Create properties panel UI
     */
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'node-properties-panel';
        this.panel.className = 'node-properties-panel hidden';

        this.panel.innerHTML = `
            <div class="properties-header">
                <h4>Node Properties</h4>
                <button class="properties-close" title="Close">×</button>
            </div>
            <div class="properties-content">
                <div class="property-group">
                    <label class="property-label">Type</label>
                    <select id="node-type-select" class="property-select">
                        <optgroup label="Flow Control">
                            <option value="start">Start</option>
                            <option value="end">End</option>
                            <option value="decision">Decision</option>
                            <option value="merge">Merge</option>
                        </optgroup>
                        <optgroup label="Processes">
                            <option value="task">Task</option>
                            <option value="process">Process</option>
                            <option value="manual">Manual</option>
                            <option value="delay">Delay</option>
                        </optgroup>
                        <optgroup label="Data">
                            <option value="database">Database</option>
                            <option value="document">Document</option>
                        </optgroup>
                        <optgroup label="Annotation">
                            <option value="comment">Comment</option>
                        </optgroup>
                    </select>
                </div>

                <div class="property-group">
                    <label class="property-label">Label</label>
                    <input type="text" id="node-label-input" class="property-input" placeholder="Enter label...">
                </div>

                <div class="property-group">
                    <label class="property-label">Size</label>
                    <div class="property-row">
                        <div class="property-col">
                            <label class="property-sublabel">Width</label>
                            <input type="number" id="node-width-input" class="property-input-small" min="30" max="500">
                        </div>
                        <div class="property-col">
                            <label class="property-sublabel">Height</label>
                            <input type="number" id="node-height-input" class="property-input-small" min="30" max="500">
                        </div>
                    </div>
                </div>

                <div class="property-group">
                    <label class="property-label">Position</label>
                    <div class="property-row">
                        <div class="property-col">
                            <label class="property-sublabel">X</label>
                            <input type="number" id="node-x-input" class="property-input-small" step="10">
                        </div>
                        <div class="property-col">
                            <label class="property-sublabel">Y</label>
                            <input type="number" id="node-y-input" class="property-input-small" step="10">
                        </div>
                    </div>
                </div>

                <div class="property-group">
                    <label class="property-label">
                        <input type="checkbox" id="node-locked-checkbox" class="property-checkbox">
                        Lock Node
                    </label>
                </div>

                <div class="property-actions">
                    <button id="apply-node-properties" class="btn-primary">Apply</button>
                    <button id="delete-node" class="btn-danger">Delete Node</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.panel);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close button
        const closeBtn = this.panel.querySelector('.properties-close');
        closeBtn.addEventListener('click', () => this.hide());

        // Apply button
        const applyBtn = this.panel.querySelector('#apply-node-properties');
        applyBtn.addEventListener('click', () => this.applyProperties());

        // Delete button
        const deleteBtn = this.panel.querySelector('#delete-node');
        deleteBtn.addEventListener('click', () => this.deleteNode());

        // Enter key in label input
        const labelInput = this.panel.querySelector('#node-label-input');
        labelInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.applyProperties();
            }
        });

        // Type change preview
        const typeSelect = this.panel.querySelector('#node-type-select');
        typeSelect.addEventListener('change', () => {
            // Update size inputs based on new type
            const nodeConfig = getNodeConfig(typeSelect.value);
            if (nodeConfig) {
                this.panel.querySelector('#node-width-input').value = nodeConfig.width;
                this.panel.querySelector('#node-height-input').value = nodeConfig.height;
            }
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });

        // Show when node is selected (only one node)
        eventBus.on(CONFIG.EVENTS.SELECTION_CHANGED, () => {
            const state = stateManager.getState();
            if (state.ui.selectedNodes.length === 1 && state.ui.selectedConnections.length === 0) {
                this.show(state.ui.selectedNodes[0]);
            } else if (state.ui.selectedNodes.length === 0) {
                this.hide();
            }
        });

        // Update when node changes
        eventBus.on(CONFIG.EVENTS.NODE_UPDATED, (node) => {
            if (this.isVisible && this.currentNodeId === node.id) {
                // Refresh panel without losing focus
                this.updateFormValues(node);
            }
        });
    }

    /**
     * Show properties panel for a node
     */
    show(nodeId) {
        const node = stateManager.getNode(nodeId);
        if (!node) return;

        this.currentNodeId = nodeId;
        this.isVisible = true;

        this.updateFormValues(node);

        this.panel.classList.remove('hidden');
    }

    /**
     * Update form values from node
     */
    updateFormValues(node) {
        const nodeConfig = getNodeConfig(node.type);

        // Update form values
        this.panel.querySelector('#node-type-select').value = node.type;
        this.panel.querySelector('#node-label-input').value = node.label || '';
        this.panel.querySelector('#node-width-input').value = node.width || nodeConfig.width;
        this.panel.querySelector('#node-height-input').value = node.height || nodeConfig.height;
        this.panel.querySelector('#node-x-input').value = Math.round(node.x);
        this.panel.querySelector('#node-y-input').value = Math.round(node.y);
        this.panel.querySelector('#node-locked-checkbox').checked = node.locked || false;
    }

    /**
     * Hide properties panel
     */
    hide() {
        this.panel.classList.add('hidden');
        this.isVisible = false;
        this.currentNodeId = null;
    }

    /**
     * Apply property changes
     */
    applyProperties() {
        if (!this.currentNodeId) return;

        const node = stateManager.getNode(this.currentNodeId);
        if (!node) return;

        const typeSelect = this.panel.querySelector('#node-type-select');
        const labelInput = this.panel.querySelector('#node-label-input');
        const widthInput = this.panel.querySelector('#node-width-input');
        const heightInput = this.panel.querySelector('#node-height-input');
        const xInput = this.panel.querySelector('#node-x-input');
        const yInput = this.panel.querySelector('#node-y-input');
        const lockedCheckbox = this.panel.querySelector('#node-locked-checkbox');

        const newType = typeSelect.value;
        const typeChanged = newType !== node.type;

        const updates = {
            type: newType,
            label: labelInput.value.trim() || getNodeConfig(newType).label,
            width: parseInt(widthInput.value),
            height: parseInt(heightInput.value),
            x: parseFloat(xInput.value),
            y: parseFloat(yInput.value),
            locked: lockedCheckbox.checked
        };

        // If type changed, update color from config
        if (typeChanged) {
            const newConfig = getNodeConfig(newType);
            updates.color = newConfig.color;
            updates.strokeColor = newConfig.strokeColor;
        }

        stateManager.updateNode(this.currentNodeId, updates);
        showToast('Node properties updated', 'success');

        // Close the panel after applying
        this.hide();
    }

    /**
     * Delete current node
     */
    deleteNode() {
        if (!this.currentNodeId) return;

        if (confirm('Are you sure you want to delete this node?')) {
            stateManager.deleteNode(this.currentNodeId);
            this.hide();
            showToast('Node deleted', 'success');
        }
    }

    /**
     * Show properties for selected nodes
     */
    showForSelected() {
        const state = stateManager.getState();
        const selectedNodes = state.ui.selectedNodes;

        if (selectedNodes.length === 1) {
            this.show(selectedNodes[0]);
        } else if (selectedNodes.length === 0) {
            showToast('No node selected', 'error');
        } else {
            showToast('Select only one node to edit properties', 'error');
        }
    }
}

// Create and export singleton instance
export const nodeProperties = new NodeProperties();

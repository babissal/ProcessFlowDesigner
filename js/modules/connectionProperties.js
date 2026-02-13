/**
 * Connection Properties Module
 * Handles connection style and color editing UI
 */

import { CONFIG } from '../config.js';
import { eventBus } from './eventBus.js';
import { stateManager } from './stateManager.js';
import { showToast } from '../utils/dom.js';

class ConnectionProperties {
    constructor() {
        this.panel = null;
        this.isVisible = false;
        this.currentConnectionId = null;
    }

    /**
     * Initialize connection properties panel
     */
    init() {
        console.log('Initializing connection properties panel...');

        this.createPanel();
        this.setupEventListeners();
    }

    /**
     * Create properties panel UI
     */
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.id = 'connection-properties-panel';
        this.panel.className = 'connection-properties-panel hidden';

        this.panel.innerHTML = `
            <div class="properties-header">
                <h4>Connection Properties</h4>
                <button class="properties-close" title="Close">×</button>
            </div>
            <div class="properties-content">
                <div class="property-group">
                    <label class="property-label">Style</label>
                    <select id="connection-style-select" class="property-select">
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                        <option value="thick">Thick</option>
                        <option value="thin">Thin</option>
                        <option value="animated">Animated</option>
                    </select>
                </div>

                <div class="property-group">
                    <label class="property-label">Color</label>
                    <select id="connection-color-select" class="property-select">
                        <option value="#666">Default (Gray)</option>
                        <option value="#4CAF50">Success (Green)</option>
                        <option value="#F44336">Error (Red)</option>
                        <option value="#FFC107">Warning (Yellow)</option>
                        <option value="#2196F3">Info (Blue)</option>
                    </select>
                </div>

                <div class="property-group">
                    <label class="property-label">Label</label>
                    <input type="text" id="connection-label-input" class="property-input" placeholder="Enter label...">
                </div>

                <div class="property-actions">
                    <button id="apply-connection-properties" class="btn-primary">Apply</button>
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
        const applyBtn = this.panel.querySelector('#apply-connection-properties');
        applyBtn.addEventListener('click', () => this.applyProperties());

        // Enter key in label input
        const labelInput = this.panel.querySelector('#connection-label-input');
        labelInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.applyProperties();
            }
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });

        // Show when connection is selected
        eventBus.on(CONFIG.EVENTS.SELECTION_CHANGED, () => {
            const state = stateManager.getState();
            if (state.ui.selectedConnections.length === 1) {
                this.show(state.ui.selectedConnections[0]);
            } else if (state.ui.selectedConnections.length === 0) {
                this.hide();
            }
        });

        // Update when connection changes
        eventBus.on(CONFIG.EVENTS.STATE_CHANGED, () => {
            if (this.isVisible && this.currentConnectionId) {
                const connection = stateManager.getConnection(this.currentConnectionId);
                if (!connection) {
                    this.hide();
                }
            }
        });
    }

    /**
     * Show properties panel for a connection
     */
    show(connectionId) {
        const connection = stateManager.getConnection(connectionId);
        if (!connection) return;

        this.currentConnectionId = connectionId;
        this.isVisible = true;

        // Update form values
        const styleSelect = this.panel.querySelector('#connection-style-select');
        const colorSelect = this.panel.querySelector('#connection-color-select');
        const labelInput = this.panel.querySelector('#connection-label-input');

        styleSelect.value = connection.style || 'solid';
        colorSelect.value = connection.color || '#666';
        labelInput.value = connection.label || '';

        this.panel.classList.remove('hidden');
    }

    /**
     * Hide properties panel
     */
    hide() {
        this.panel.classList.add('hidden');
        this.isVisible = false;
        this.currentConnectionId = null;
    }

    /**
     * Apply property changes
     */
    applyProperties() {
        if (!this.currentConnectionId) return;

        const styleSelect = this.panel.querySelector('#connection-style-select');
        const colorSelect = this.panel.querySelector('#connection-color-select');
        const labelInput = this.panel.querySelector('#connection-label-input');

        const updates = {
            style: styleSelect.value,
            color: colorSelect.value,
            label: labelInput.value.trim()
        };

        stateManager.updateConnection(this.currentConnectionId, updates);
        showToast('Connection properties updated', 'success');

        // Close the panel after applying
        this.hide();
    }

    /**
     * Show properties for selected connections
     */
    showForSelected() {
        const state = stateManager.getState();
        const selectedConnections = state.ui.selectedConnections;

        if (selectedConnections.length === 1) {
            this.show(selectedConnections[0]);
        } else if (selectedConnections.length === 0) {
            showToast('No connection selected', 'error');
        } else {
            showToast('Select only one connection to edit properties', 'error');
        }
    }
}

// Create and export singleton instance
export const connectionProperties = new ConnectionProperties();

/**
 * Application Bootstrap
 * Initializes and coordinates all modules
 */

import { CONFIG } from './config.js';
import { eventBus } from './modules/eventBus.js';
import { stateManager } from './modules/stateManager.js';
import { canvas } from './modules/canvas.js';
import { nodes } from './modules/nodes.js';
import { connections } from './modules/connections.js';
import { sidebar } from './modules/sidebar.js';
import { toolbar } from './modules/toolbar.js';
import { storage } from './modules/storage.js';
import { undoRedoManager } from './modules/undoRedo.js';
import { selection } from './modules/selection.js';
import { minimap } from './modules/minimap.js';
import { layoutEngine } from './modules/layoutEngine.js';
import { themes } from './modules/themes.js';
import { metrics } from './modules/metrics.js';
import { grouping } from './modules/grouping.js';
import { connectionProperties } from './modules/connectionProperties.js';
import { nodeProperties } from './modules/nodeProperties.js';
import { contextMenu } from './modules/contextMenu.js';
import { tutorial } from './modules/tutorial.js';
import { touchSupport } from './modules/touchSupport.js';
import { showToast } from './utils/dom.js';

class App {
    constructor() {
        this.initialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        if (this.initialized) {
            console.warn('App already initialized');
            return;
        }

        console.log('🚀 Initializing Process Flow Designer...');

        try {
            // Initialize modules in order
            this.initializeModules();

            // Setup global event handlers
            this.setupGlobalEvents();

            // Update status bar
            this.updateStatusBar();

            // Subscribe to state changes for status updates
            stateManager.subscribe(() => this.updateStatusBar());

            this.initialized = true;

            console.log('✅ Process Flow Designer initialized successfully');

            // Show welcome message if no workflow loaded
            const state = stateManager.getState();
            if (state.workflow.nodes.length === 0) {
                canvas.showOverlay();
            }

        } catch (error) {
            console.error('❌ Error initializing app:', error);
            showToast('Error initializing application', 'error', 5000);
        }
    }

    /**
     * Initialize all modules
     */
    initializeModules() {
        // Core modules
        canvas.init();
        nodes.init();
        connections.init();

        // UI modules
        sidebar.init();
        toolbar.init();

        // Undo/Redo system
        undoRedoManager.init();

        // Selection system (multi-select, marquee)
        selection.init();

        // Mini-map for navigation
        minimap.init();

        // Theme system (dark mode)
        themes.init();

        // Metrics panel
        metrics.init();

        // Node grouping
        grouping.init();

        // Connection properties panel
        connectionProperties.init();

        // Node properties panel
        nodeProperties.init();

        // Context menu system
        contextMenu.init();

        // Tutorial and onboarding
        tutorial.init();

        // Touch support for mobile devices
        touchSupport.init();

        // Storage module (will attempt to load saved workflow)
        storage.init();
    }

    /**
     * Setup global event handlers
     */
    setupGlobalEvents() {
        // Canvas click to clear selection
        const svg = canvas.getSVG();
        if (svg) {
            svg.addEventListener('click', (e) => {
                // Don't clear if we just finished a marquee selection
                if (selection.justFinishedMarquee) return;

                // Clear selection if NOT clicking on a node or connection
                const clickedNode = e.target.closest('.node');
                const clickedConnection = e.target.closest('.connection');

                if (!clickedNode && !clickedConnection) {
                    stateManager.clearSelection();
                }
            });
        }

        // Window beforeunload warning
        window.addEventListener('beforeunload', (e) => {
            const state = stateManager.getState();
            const hasContent = state.workflow.nodes.length > 0 || state.workflow.connections.length > 0;

            if (hasContent) {
                e.preventDefault();
                e.returnValue = '';
            }
        });

        // Listen for errors
        eventBus.on(CONFIG.EVENTS.ERROR, (data) => {
            showToast(data.message || 'An error occurred', 'error', 5000);
        });

        // Listen for success messages
        eventBus.on(CONFIG.EVENTS.SUCCESS, (data) => {
            showToast(data.message || 'Operation successful', 'success');
        });
    }

    /**
     * Update status bar with current statistics
     */
    updateStatusBar() {
        const state = stateManager.getState();

        // Update node count
        const nodesCount = document.getElementById('status-nodes');
        if (nodesCount) {
            nodesCount.textContent = state.workflow.nodes.length;
        }

        // Update connection count
        const connectionsCount = document.getElementById('status-connections');
        if (connectionsCount) {
            connectionsCount.textContent = state.workflow.connections.length;
        }

        // Update status message based on selection
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
            const selectedNodes = state.ui.selectedNodes.length;
            const selectedConnections = state.ui.selectedConnections.length;

            if (selectedNodes > 0) {
                statusMessage.textContent = `${selectedNodes} node${selectedNodes > 1 ? 's' : ''} selected`;
            } else if (selectedConnections > 0) {
                statusMessage.textContent = `${selectedConnections} connection${selectedConnections > 1 ? 's' : ''} selected`;
            } else {
                statusMessage.textContent = 'Ready';
            }
        }
    }

    /**
     * Get application info
     */
    getInfo() {
        return {
            version: CONFIG.STORAGE.VERSION,
            initialized: this.initialized,
            state: stateManager.getState(),
            storage: storage.getStorageInfo()
        };
    }
}

// Create app instance
const app = new App();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}

// Export for debugging
window.ProcessFlowDesigner = {
    app,
    stateManager,
    eventBus,
    canvas,
    nodes,
    connections,
    storage,
    metrics,
    layoutEngine,
    themes,
    grouping,
    selection,
    undoRedoManager,
    tutorial,
    CONFIG
};

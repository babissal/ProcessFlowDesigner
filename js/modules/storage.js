/**
 * Storage Module
 * Handles LocalStorage persistence and autosave
 */

import { CONFIG } from '../config.js';
import { eventBus } from './eventBus.js';
import { stateManager } from './stateManager.js';
import { nodes } from './nodes.js';
import { connections } from './connections.js';
import { canvas } from './canvas.js';
import { debounce } from '../utils/debounce.js';
import { showToast } from '../utils/dom.js';

class Storage {
    constructor() {
        this.autosaveEnabled = true;
        this.lastSaveTime = null;
    }

    /**
     * Initialize storage
     */
    init() {
        // Setup autosave
        this.setupAutosave();

        // Try to load saved workflow on startup
        this.loadFromLocalStorage();

        // Update autosave indicator
        this.updateAutosaveIndicator();
    }

    /**
     * Setup autosave on state changes
     */
    setupAutosave() {
        // Debounced autosave function
        const debouncedSave = debounce(() => {
            if (this.autosaveEnabled) {
                this.saveToLocalStorage();
            }
        }, CONFIG.STORAGE.AUTOSAVE_INTERVAL);

        // Subscribe to state changes
        stateManager.subscribe((state) => {
            debouncedSave();
        });
    }

    /**
     * Save workflow to LocalStorage
     */
    saveToLocalStorage() {
        try {
            const workflow = stateManager.getWorkflow();
            const data = JSON.stringify(workflow);

            localStorage.setItem(CONFIG.STORAGE.KEY, data);

            this.lastSaveTime = new Date();
            this.updateAutosaveIndicator();


        } catch (error) {
            console.error('Error saving to LocalStorage:', error);

            if (error.name === 'QuotaExceededError') {
                showToast('Storage quota exceeded. Please export your workflow.', 'error', 5000);
                this.autosaveEnabled = false;
            }
        }
    }

    /**
     * Load workflow from LocalStorage
     */
    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem(CONFIG.STORAGE.KEY);

            if (!data) {
                return false;
            }

            const workflow = JSON.parse(data);

            // Validate data
            if (!this.validateWorkflowData(workflow)) {
                console.error('Invalid saved workflow data');
                return false;
            }

            // Create new state from loaded data
            const newState = {
                workflow: workflow,
                ui: stateManager.getUIState()
            };

            // Set state
            stateManager.setState(newState);

            // Re-render everything
            nodes.renderAllNodes();
            connections.renderAllConnections();

            // Restore zoom and pan
            const zoomLevel = workflow.metadata?.zoomLevel || CONFIG.CANVAS.DEFAULT_ZOOM;
            const offset = workflow.metadata?.canvasOffset || { x: 0, y: 0 };

            canvas.setZoom(zoomLevel);
            canvas.panX = offset.x;
            canvas.panY = offset.y;
            canvas.updateTransform();

            // Hide overlay if there are nodes
            if (workflow.nodes.length > 0) {
                canvas.hideOverlay();
            }

            eventBus.emit(CONFIG.EVENTS.WORKFLOW_LOADED, workflow);

            showToast('Previous workflow restored', 'info');

            return true;

        } catch (error) {
            console.error('Error loading from LocalStorage:', error);
            return false;
        }
    }

    /**
     * Clear saved workflow from LocalStorage
     */
    clearLocalStorage() {
        try {
            localStorage.removeItem(CONFIG.STORAGE.KEY);
            return true;
        } catch (error) {
            console.error('Error clearing LocalStorage:', error);
            return false;
        }
    }

    /**
     * Validate workflow data
     */
    validateWorkflowData(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }

        if (!Array.isArray(data.nodes) || !Array.isArray(data.connections)) {
            return false;
        }

        return true;
    }

    /**
     * Update autosave indicator in status bar
     */
    updateAutosaveIndicator() {
        const indicator = document.getElementById('status-autosave');
        if (!indicator) return;

        if (this.lastSaveTime) {
            indicator.classList.add('saved');
            indicator.title = `Last saved: ${this.lastSaveTime.toLocaleTimeString()}`;

            // Animate save indicator
            indicator.classList.remove('pulse');
            setTimeout(() => indicator.classList.add('pulse'), 10);

        } else {
            indicator.classList.remove('saved');
            indicator.title = 'Not saved';
        }
    }

    /**
     * Get storage info
     */
    getStorageInfo() {
        try {
            const data = localStorage.getItem(CONFIG.STORAGE.KEY);
            const size = data ? new Blob([data]).size : 0;

            return {
                hasData: !!data,
                size: size,
                sizeKB: (size / 1024).toFixed(2),
                lastSaveTime: this.lastSaveTime
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return null;
        }
    }
}

// Create and export singleton instance
export const storage = new Storage();

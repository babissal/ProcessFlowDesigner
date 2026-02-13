/**
 * Toolbar Module
 * Handles toolbar button interactions
 */

import { CONFIG } from '../config.js';
import { eventBus } from './eventBus.js';
import { stateManager } from './stateManager.js';
import { canvas } from './canvas.js';
import { exportManager } from './exportManager.js';
import { undoRedoManager } from './undoRedo.js';
import { selection } from './selection.js';
import { layoutEngine } from './layoutEngine.js';
import { themes } from './themes.js';
import { metrics } from './metrics.js';
import { grouping } from './grouping.js';
import { nodes } from './nodes.js';
import { connections } from './connections.js';
import { tutorial } from './tutorial.js';
import { nodeProperties } from './nodeProperties.js';
import { connectionProperties } from './connectionProperties.js';
import { showModal, showToast } from '../utils/dom.js';

class Toolbar {
    constructor() {
        this.buttons = {};
        this.buttonsInitialized = false;
    }

    /**
     * Initialize toolbar
     */
    init() {
        this.setupButtons();
        this.setupWorkflowName();
        this.setupKeyboardShortcuts();
    }

    /**
     * Setup toolbar buttons
     */
    setupButtons() {
        // Prevent multiple initializations
        if (this.buttonsInitialized) {
            console.warn('Toolbar buttons already initialized');
            return;
        }

        // Get button elements
        this.buttons = {
            new: document.getElementById('btn-new'),
            open: document.getElementById('btn-open'),
            save: document.getElementById('btn-save'),
            undo: document.getElementById('btn-undo'),
            redo: document.getElementById('btn-redo'),
            exportJson: document.getElementById('btn-export-json'),
            exportPng: document.getElementById('btn-export-png'),
            autoLayout: document.getElementById('btn-auto-layout'),
            metrics: document.getElementById('btn-metrics'),
            themeToggle: document.getElementById('btn-theme-toggle'),
            zoomIn: document.getElementById('btn-zoom-in'),
            zoomOut: document.getElementById('btn-zoom-out'),
            zoomReset: document.getElementById('btn-zoom-reset'),
            help: document.getElementById('btn-help'),
            delete: document.getElementById('btn-delete')
        };

        // Add event listeners
        if (this.buttons.new) {
            this.buttons.new.addEventListener('click', () => this.handleNew());
        }

        if (this.buttons.open) {
            this.buttons.open.addEventListener('click', () => this.handleOpen());
        }

        if (this.buttons.save) {
            this.buttons.save.addEventListener('click', () => this.handleSave());
        }

        if (this.buttons.undo) {
            this.buttons.undo.addEventListener('click', () => undoRedoManager.undo());
        }

        if (this.buttons.redo) {
            this.buttons.redo.addEventListener('click', () => undoRedoManager.redo());
        }

        if (this.buttons.exportJson) {
            this.buttons.exportJson.addEventListener('click', () => this.handleExportJson());
        }

        if (this.buttons.exportPng) {
            this.buttons.exportPng.addEventListener('click', () => this.handleExportPng());
        }

        if (this.buttons.autoLayout) {
            this.buttons.autoLayout.addEventListener('click', () => this.handleAutoLayout());
        }

        if (this.buttons.metrics) {
            this.buttons.metrics.addEventListener('click', () => metrics.toggle());
        }

        if (this.buttons.themeToggle) {
            this.buttons.themeToggle.addEventListener('click', () => themes.toggle());
        }

        if (this.buttons.zoomIn) {
            this.buttons.zoomIn.addEventListener('click', () => canvas.zoomIn());
        }

        if (this.buttons.zoomOut) {
            this.buttons.zoomOut.addEventListener('click', () => canvas.zoomOut());
        }

        if (this.buttons.zoomReset) {
            this.buttons.zoomReset.addEventListener('click', () => canvas.resetZoom());
        }

        if (this.buttons.help) {
            this.buttons.help.addEventListener('click', () => this.handleHelp());
        }

        if (this.buttons.delete) {
            this.buttons.delete.addEventListener('click', () => this.handleDelete());
        }

        // Update delete button state when selection changes
        stateManager.subscribe(() => this.updateDeleteButtonState());

        // Mark as initialized
        this.buttonsInitialized = true;
    }

    /**
     * Handle Help button - show shortcuts overlay
     */
    handleHelp() {
        tutorial.showKeyboardShortcuts();
    }

    /**
     * Setup workflow name editing
     */
    setupWorkflowName() {
        const workflowName = document.getElementById('workflow-name');
        if (!workflowName) return;

        // Update name in state when edited
        workflowName.addEventListener('blur', () => {
            const name = workflowName.textContent.trim() || 'Untitled Workflow';
            workflowName.textContent = name;

            stateManager.updateState({
                workflow: { name }
            });
        });

        // Prevent Enter key from creating new line
        workflowName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                workflowName.blur();
            }
        });

        // Update display when state changes
        eventBus.on(CONFIG.EVENTS.WORKFLOW_LOADED, () => {
            const state = stateManager.getState();
            workflowName.textContent = state.workflow.name || 'Untitled Workflow';
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when editing
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                return;
            }

            // Ctrl+N - New
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.handleNew();
            }

            // Ctrl+O - Open
            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                this.handleOpen();
            }

            // Ctrl+S - Save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.handleSave();
            }

            // Ctrl+Z - Undo
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undoRedoManager.undo();
            }

            // Ctrl+Y or Ctrl+Shift+Z - Redo
            if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
                e.preventDefault();
                undoRedoManager.redo();
            }

            // Delete - Delete selected items
            if (e.key === 'Delete') {
                e.preventDefault();
                this.handleDelete();
            }

            // + - Zoom In
            if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                canvas.zoomIn();
            }

            // - - Zoom Out
            if (e.key === '-') {
                e.preventDefault();
                canvas.zoomOut();
            }

            // Ctrl+0 - Reset Zoom
            if (e.ctrlKey && e.key === '0') {
                e.preventDefault();
                canvas.resetZoom();
            }

            // Ctrl+A - Select All
            if (e.ctrlKey && e.key === 'a') {
                e.preventDefault();
                selection.selectAll();
            }

            // Escape - Clear selection
            if (e.key === 'Escape') {
                e.preventDefault();
                stateManager.clearSelection();
            }

            // Ctrl+G - Create group from selected nodes
            if (e.ctrlKey && e.key === 'g') {
                e.preventDefault();
                grouping.createGroup();
            }

            // Ctrl+L - Toggle lock on selected nodes
            if (e.ctrlKey && e.key === 'l') {
                e.preventDefault();
                nodes.toggleLockSelected();
            }

            // Ctrl+D - Duplicate selected nodes
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.duplicateSelected();
            }

            // Ctrl+E - Export JSON
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                this.handleExportJson();
            }

            // F - Fit to screen
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                canvas.fitToScreen();
            }

            // H - Toggle grid
            if (e.key === 'h' || e.key === 'H') {
                e.preventDefault();
                canvas.toggleGrid();
            }

            // M - Toggle metrics
            if (e.key === 'm' || e.key === 'M') {
                e.preventDefault();
                metrics.toggle();
            }

            // P - Properties panel
            if (e.key === 'p' || e.key === 'P') {
                e.preventDefault();
                const state = stateManager.getState();
                if (state.ui.selectedNodes.length === 1) {
                    nodeProperties.showForSelected();
                } else if (state.ui.selectedConnections.length === 1) {
                    connectionProperties.showForSelected();
                }
            }

            // Number keys 1-4 for quick zoom levels
            if (e.key >= '1' && e.key <= '4' && !e.ctrlKey) {
                e.preventDefault();
                const zoomLevels = [1, 0.75, 0.5, 0.25];
                const level = parseInt(e.key) - 1;
                canvas.setZoom(zoomLevels[level]);
            }
        });
    }

    /**
     * Duplicate selected nodes
     */
    duplicateSelected() {
        const state = stateManager.getState();
        const selectedNodes = state.ui.selectedNodes;

        if (selectedNodes.length === 0) {
            showToast('No nodes selected', 'error');
            return;
        }

        const duplicatedIds = [];

        selectedNodes.forEach(nodeId => {
            const node = stateManager.getNode(nodeId);
            if (!node) return;

            const newNode = {
                ...node,
                id: undefined, // Will be generated
                x: node.x + 50,
                y: node.y + 50,
                label: node.label + ' (Copy)',
                locked: false // Unlock copies
            };

            const addedNode = stateManager.addNode(newNode);
            if (addedNode) {
                duplicatedIds.push(addedNode.id);
            }
        });

        // Select the duplicated nodes
        stateManager.clearSelection();
        duplicatedIds.forEach(id => stateManager.selectNode(id, true));

        showToast(`Duplicated ${duplicatedIds.length} node${duplicatedIds.length > 1 ? 's' : ''}`, 'success');
    }

    /**
     * Handle New workflow
     */
    handleNew() {
        const state = stateManager.getState();
        const hasContent = state.workflow.nodes.length > 0 || state.workflow.connections.length > 0;

        if (hasContent) {
            showModal(
                'New Workflow',
                'Are you sure you want to create a new workflow? All unsaved changes will be lost.',
                () => {
                    stateManager.reset();
                    nodes.renderAllNodes();
                    connections.renderAllConnections();
                    canvas.resetZoom();
                    canvas.showOverlay();
                    showToast('New workflow created', 'success');
                    eventBus.emit(CONFIG.EVENTS.WORKFLOW_LOADED);
                }
            );
        } else {
            stateManager.reset();
            nodes.renderAllNodes();
            connections.renderAllConnections();
            canvas.resetZoom();
            canvas.showOverlay();
            showToast('New workflow created', 'success');
            eventBus.emit(CONFIG.EVENTS.WORKFLOW_LOADED);
        }
    }

    /**
     * Handle Open workflow
     */
    handleOpen() {
        exportManager.import();
    }

    /**
     * Handle Save workflow
     */
    handleSave() {
        exportManager.exportJSON();
    }

    /**
     * Handle Export JSON
     */
    handleExportJson() {
        exportManager.exportJSON();
    }

    /**
     * Handle Export PNG
     */
    handleExportPng() {
        exportManager.exportPNG();
    }

    /**
     * Handle Auto-Layout
     */
    handleAutoLayout() {
        layoutEngine.autoLayoutVertical();
    }

    /**
     * Handle Delete selected items
     */
    handleDelete() {
        const state = stateManager.getState();
        const selectedNodes = state.ui.selectedNodes;
        const selectedConnections = state.ui.selectedConnections;

        if (selectedNodes.length === 0 && selectedConnections.length === 0) {
            return;
        }

        // Delete selected nodes
        selectedNodes.forEach(nodeId => {
            stateManager.deleteNode(nodeId);
        });

        // Delete selected connections
        selectedConnections.forEach(connId => {
            stateManager.deleteConnection(connId);
        });

        showToast('Deleted selected items', 'success');
    }

    /**
     * Update delete button enabled/disabled state based on selection
     */
    updateDeleteButtonState() {
        if (!this.buttons.delete) return;

        const state = stateManager.getState();
        const hasSelection = state.ui.selectedNodes.length > 0 || state.ui.selectedConnections.length > 0;

        this.buttons.delete.disabled = !hasSelection;
        this.buttons.delete.style.opacity = hasSelection ? '1' : '0.5';
    }
}

// Create and export singleton instance
export const toolbar = new Toolbar();

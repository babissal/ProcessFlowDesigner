/**
 * StateManager - Central state management with immutable updates
 * Manages application state and notifies subscribers of changes
 */

import { CONFIG, generateId, getCurrentTimestamp } from '../config.js';
import { eventBus } from './eventBus.js';

class StateManager {
    constructor() {
        this.state = this.createInitialState();
        this.subscribers = [];
    }

    /**
     * Create initial state from default config
     */
    createInitialState() {
        const state = JSON.parse(JSON.stringify(CONFIG.DEFAULT_STATE));
        state.workflow.id = generateId('workflow');
        state.workflow.metadata.createdAt = getCurrentTimestamp();
        state.workflow.metadata.updatedAt = getCurrentTimestamp();
        return state;
    }

    /**
     * Get current state (returns a copy to prevent mutations)
     */
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * Get workflow data only
     */
    getWorkflow() {
        return JSON.parse(JSON.stringify(this.state.workflow));
    }

    /**
     * Get UI state only
     */
    getUIState() {
        return JSON.parse(JSON.stringify(this.state.ui));
    }

    /**
     * Set entire state (used for loading from file)
     */
    setState(newState) {
        this.state = JSON.parse(JSON.stringify(newState));
        this.state.workflow.metadata.updatedAt = getCurrentTimestamp();
        this.notifySubscribers();
        eventBus.emit(CONFIG.EVENTS.STATE_CHANGED, this.state);
    }

    /**
     * Update state immutably
     */
    updateState(updates) {
        this.state = {
            ...this.state,
            ...updates,
            workflow: {
                ...this.state.workflow,
                ...updates.workflow,
                metadata: {
                    ...this.state.workflow.metadata,
                    ...updates.workflow?.metadata,
                    updatedAt: getCurrentTimestamp()
                }
            }
        };
        this.notifySubscribers();
        eventBus.emit(CONFIG.EVENTS.STATE_CHANGED, this.state);
    }

    /**
     * Subscribe to state changes
     */
    subscribe(callback) {
        this.subscribers.push(callback);
        return () => {
            const index = this.subscribers.indexOf(callback);
            if (index > -1) {
                this.subscribers.splice(index, 1);
            }
        };
    }

    /**
     * Notify all subscribers of state change
     */
    notifySubscribers() {
        const state = this.getState();
        this.subscribers.forEach(callback => {
            try {
                callback(state);
            } catch (error) {
                console.error('Error in state subscriber:', error);
            }
        });
    }

    // ========== Node Operations ==========

    /**
     * Add a node to the workflow
     */
    addNode(node) {
        const newNode = {
            id: generateId('node'),
            ...node,
            createdAt: getCurrentTimestamp()
        };

        this.state = {
            ...this.state,
            workflow: {
                ...this.state.workflow,
                nodes: [...this.state.workflow.nodes, newNode],
                metadata: {
                    ...this.state.workflow.metadata,
                    updatedAt: getCurrentTimestamp()
                }
            }
        };

        this.notifySubscribers();
        eventBus.emit(CONFIG.EVENTS.NODE_ADDED, newNode);
        return newNode;
    }

    /**
     * Update a node
     */
    updateNode(nodeId, updates) {
        const nodeIndex = this.state.workflow.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex === -1) {
            console.error('Node not found:', nodeId);
            return null;
        }

        const updatedNodes = [...this.state.workflow.nodes];
        updatedNodes[nodeIndex] = {
            ...updatedNodes[nodeIndex],
            ...updates,
            updatedAt: getCurrentTimestamp()
        };

        this.state = {
            ...this.state,
            workflow: {
                ...this.state.workflow,
                nodes: updatedNodes,
                metadata: {
                    ...this.state.workflow.metadata,
                    updatedAt: getCurrentTimestamp()
                }
            }
        };

        this.notifySubscribers();
        eventBus.emit(CONFIG.EVENTS.NODE_UPDATED, updatedNodes[nodeIndex]);
        return updatedNodes[nodeIndex];
    }

    /**
     * Delete a node and its connections
     */
    deleteNode(nodeId) {
        const node = this.state.workflow.nodes.find(n => n.id === nodeId);
        if (!node) {
            console.error('Node not found:', nodeId);
            return;
        }

        // Remove node
        const filteredNodes = this.state.workflow.nodes.filter(n => n.id !== nodeId);

        // Remove connections involving this node
        const filteredConnections = this.state.workflow.connections.filter(
            c => c.from !== nodeId && c.to !== nodeId
        );

        // Remove from selection
        const filteredSelection = this.state.ui.selectedNodes.filter(id => id !== nodeId);

        this.state = {
            ...this.state,
            workflow: {
                ...this.state.workflow,
                nodes: filteredNodes,
                connections: filteredConnections,
                metadata: {
                    ...this.state.workflow.metadata,
                    updatedAt: getCurrentTimestamp()
                }
            },
            ui: {
                ...this.state.ui,
                selectedNodes: filteredSelection
            }
        };

        this.notifySubscribers();
        eventBus.emit(CONFIG.EVENTS.NODE_DELETED, { nodeId, node });
    }

    /**
     * Get node by ID
     */
    getNode(nodeId) {
        return this.state.workflow.nodes.find(n => n.id === nodeId);
    }

    /**
     * Get all nodes
     */
    getNodes() {
        return [...this.state.workflow.nodes];
    }

    // ========== Connection Operations ==========

    /**
     * Add a connection
     */
    addConnection(connection) {
        // Validate connection
        const fromNode = this.getNode(connection.from);
        const toNode = this.getNode(connection.to);

        if (!fromNode || !toNode) {
            console.error('Invalid connection: nodes not found');
            return null;
        }

        // Check for self-connection
        if (connection.from === connection.to) {
            console.error('Invalid connection: cannot connect node to itself');
            eventBus.emit(CONFIG.EVENTS.ERROR, { message: 'Cannot connect a node to itself' });
            return null;
        }

        // Check for duplicate connection
        const duplicate = this.state.workflow.connections.find(
            c => c.from === connection.from && c.to === connection.to
        );

        if (duplicate) {
            console.error('Invalid connection: connection already exists');
            eventBus.emit(CONFIG.EVENTS.ERROR, { message: 'Connection already exists' });
            return null;
        }

        const newConnection = {
            id: generateId('conn'),
            ...connection,
            label: connection.label || '',
            style: connection.style || 'solid',
            createdAt: getCurrentTimestamp()
        };

        this.state = {
            ...this.state,
            workflow: {
                ...this.state.workflow,
                connections: [...this.state.workflow.connections, newConnection],
                metadata: {
                    ...this.state.workflow.metadata,
                    updatedAt: getCurrentTimestamp()
                }
            }
        };

        this.notifySubscribers();
        eventBus.emit(CONFIG.EVENTS.CONNECTION_ADDED, newConnection);
        return newConnection;
    }

    /**
     * Delete a connection
     */
    deleteConnection(connectionId) {
        const connection = this.state.workflow.connections.find(c => c.id === connectionId);
        if (!connection) {
            console.error('Connection not found:', connectionId);
            return;
        }

        const filteredConnections = this.state.workflow.connections.filter(
            c => c.id !== connectionId
        );

        const filteredSelection = this.state.ui.selectedConnections.filter(
            id => id !== connectionId
        );

        this.state = {
            ...this.state,
            workflow: {
                ...this.state.workflow,
                connections: filteredConnections,
                metadata: {
                    ...this.state.workflow.metadata,
                    updatedAt: getCurrentTimestamp()
                }
            },
            ui: {
                ...this.state.ui,
                selectedConnections: filteredSelection
            }
        };

        this.notifySubscribers();
        eventBus.emit(CONFIG.EVENTS.CONNECTION_DELETED, { connectionId, connection });
    }

    /**
     * Update a connection
     */
    updateConnection(connectionId, updates) {
        const connectionIndex = this.state.workflow.connections.findIndex(c => c.id === connectionId);
        if (connectionIndex === -1) {
            console.error('Connection not found:', connectionId);
            return;
        }

        const updatedConnection = {
            ...this.state.workflow.connections[connectionIndex],
            ...updates
        };

        const updatedConnections = [...this.state.workflow.connections];
        updatedConnections[connectionIndex] = updatedConnection;

        this.state = {
            ...this.state,
            workflow: {
                ...this.state.workflow,
                connections: updatedConnections,
                metadata: {
                    ...this.state.workflow.metadata,
                    updatedAt: getCurrentTimestamp()
                }
            }
        };

        this.notifySubscribers();
        eventBus.emit(CONFIG.EVENTS.STATE_CHANGED);
    }

    /**
     * Get connection by ID
     */
    getConnection(connectionId) {
        return this.state.workflow.connections.find(c => c.id === connectionId);
    }

    /**
     * Get all connections
     */
    getConnections() {
        return [...this.state.workflow.connections];
    }

    // ========== Selection Operations ==========

    /**
     * Select a node
     */
    selectNode(nodeId, addToSelection = false) {
        let selectedNodes = addToSelection
            ? [...this.state.ui.selectedNodes]
            : [];

        if (!selectedNodes.includes(nodeId)) {
            selectedNodes.push(nodeId);
        }

        this.state = {
            ...this.state,
            ui: {
                ...this.state.ui,
                selectedNodes,
                selectedConnections: [] // Clear connection selection
            }
        };

        this.notifySubscribers();
        eventBus.emit(CONFIG.EVENTS.SELECTION_CHANGED, {
            selectedNodes,
            selectedConnections: []
        });
    }

    /**
     * Select a connection
     */
    selectConnection(connectionId, addToSelection = false) {
        let selectedConnections = addToSelection
            ? [...this.state.ui.selectedConnections]
            : [];

        if (!selectedConnections.includes(connectionId)) {
            selectedConnections.push(connectionId);
        }

        this.state = {
            ...this.state,
            ui: {
                ...this.state.ui,
                selectedNodes: [], // Clear node selection
                selectedConnections
            }
        };

        this.notifySubscribers();
        eventBus.emit(CONFIG.EVENTS.SELECTION_CHANGED, {
            selectedNodes: [],
            selectedConnections
        });
    }

    /**
     * Clear all selections
     */
    clearSelection() {
        this.state = {
            ...this.state,
            ui: {
                ...this.state.ui,
                selectedNodes: [],
                selectedConnections: []
            }
        };

        this.notifySubscribers();
        eventBus.emit(CONFIG.EVENTS.SELECTION_CHANGED, {
            selectedNodes: [],
            selectedConnections: []
        });
    }

    /**
     * Get selected nodes
     */
    getSelectedNodes() {
        return this.state.ui.selectedNodes.map(id => this.getNode(id)).filter(Boolean);
    }

    /**
     * Get selected connections
     */
    getSelectedConnections() {
        return this.state.ui.selectedConnections.map(id => this.getConnection(id)).filter(Boolean);
    }

    // ========== UI State Operations ==========

    /**
     * Update UI state
     */
    updateUIState(updates) {
        this.state = {
            ...this.state,
            ui: {
                ...this.state.ui,
                ...updates
            }
        };

        this.notifySubscribers();
    }

    /**
     * Reset to initial state
     */
    reset() {
        this.state = this.createInitialState();
        this.notifySubscribers();
        eventBus.emit(CONFIG.EVENTS.STATE_CHANGED, this.state);
    }
}

// Create and export singleton instance
export const stateManager = new StateManager();

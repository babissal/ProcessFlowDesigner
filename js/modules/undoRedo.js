/**
 * Undo/Redo Module
 * Implements command pattern for undo/redo functionality
 */

import { CONFIG } from '../config.js';
import { eventBus } from './eventBus.js';
import { stateManager } from './stateManager.js';

// Command classes
class Command {
    execute() { throw new Error('execute() must be implemented'); }
    undo() { throw new Error('undo() must be implemented'); }
    redo() { this.execute(); }
}

class AddNodeCommand extends Command {
    constructor(node) {
        super();
        this.node = node;
        this.nodeId = null;
    }

    execute() {
        const addedNode = stateManager.addNode(this.node);
        this.nodeId = addedNode.id;
        return addedNode;
    }

    undo() {
        if (this.nodeId) {
            stateManager.deleteNode(this.nodeId);
        }
    }
}

class DeleteNodeCommand extends Command {
    constructor(nodeId) {
        super();
        this.nodeId = nodeId;
        this.node = null;
        this.connections = [];
    }

    execute() {
        // Store node data before deleting
        this.node = stateManager.getNode(this.nodeId);

        // Store connections involving this node
        const allConnections = stateManager.getConnections();
        this.connections = allConnections.filter(
            c => c.from === this.nodeId || c.to === this.nodeId
        );

        // Delete the node
        stateManager.deleteNode(this.nodeId);
    }

    undo() {
        if (this.node) {
            // Restore node with original ID using addNode
            // Pass the full node object including id so it gets restored with same id
            stateManager.addNode({ ...this.node });

            // Restore connections
            this.connections.forEach(conn => {
                stateManager.addConnection({
                    from: conn.from,
                    to: conn.to,
                    label: conn.label,
                    style: conn.style
                });
            });
        }
    }
}

class MoveNodeCommand extends Command {
    constructor(nodeId, fromPos, toPos) {
        super();
        this.nodeId = nodeId;
        this.fromPos = fromPos;
        this.toPos = toPos;
    }

    execute() {
        stateManager.updateNode(this.nodeId, {
            x: this.toPos.x,
            y: this.toPos.y
        });
    }

    undo() {
        stateManager.updateNode(this.nodeId, {
            x: this.fromPos.x,
            y: this.fromPos.y
        });
    }
}

class UpdateNodeCommand extends Command {
    constructor(nodeId, oldData, newData) {
        super();
        this.nodeId = nodeId;
        this.oldData = oldData;
        this.newData = newData;
    }

    execute() {
        stateManager.updateNode(this.nodeId, this.newData);
    }

    undo() {
        stateManager.updateNode(this.nodeId, this.oldData);
    }
}

class AddConnectionCommand extends Command {
    constructor(connection) {
        super();
        this.connection = connection;
        this.connectionId = null;
    }

    execute() {
        const addedConnection = stateManager.addConnection(this.connection);
        if (addedConnection) {
            this.connectionId = addedConnection.id;
        }
        return addedConnection;
    }

    undo() {
        if (this.connectionId) {
            stateManager.deleteConnection(this.connectionId);
        }
    }
}

class DeleteConnectionCommand extends Command {
    constructor(connectionId) {
        super();
        this.connectionId = connectionId;
        this.connection = null;
    }

    execute() {
        this.connection = stateManager.getConnection(this.connectionId);
        stateManager.deleteConnection(this.connectionId);
    }

    undo() {
        if (this.connection) {
            stateManager.addConnection({
                from: this.connection.from,
                to: this.connection.to,
                label: this.connection.label,
                style: this.connection.style
            });
        }
    }
}

class UndoRedoManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistorySize = 50;
        this.isExecuting = false;
    }

    /**
     * Initialize undo/redo system
     */
    init() {
        this.setupEventListeners();
    }

    /**
     * Setup event listeners for commands
     */
    setupEventListeners() {
        // Listen for node moved events
        eventBus.on(CONFIG.EVENTS.NODE_MOVED, (data) => {
            if (!this.isExecuting) {
                const cmd = new MoveNodeCommand(data.nodeId, data.from, data.to);
                this.executeCommand(cmd, false); // Don't re-execute, already done
            }
        });
    }

    /**
     * Execute a command and add to history
     */
    executeCommand(command, shouldExecute = true) {
        this.isExecuting = true;

        try {
            if (shouldExecute) {
                command.execute();
            }

            // Add to undo stack
            this.undoStack.push(command);

            // Limit stack size
            if (this.undoStack.length > this.maxHistorySize) {
                this.undoStack.shift();
            }

            // Clear redo stack
            this.redoStack = [];

            // Update UI
            this.updateUI();

        } finally {
            this.isExecuting = false;
        }
    }

    /**
     * Undo last command
     */
    undo() {
        if (!this.canUndo()) {
            return;
        }

        this.isExecuting = true;

        try {
            const command = this.undoStack.pop();
            command.undo();

            // Add to redo stack
            this.redoStack.push(command);

            this.updateUI();

        } finally {
            this.isExecuting = false;
        }
    }

    /**
     * Redo last undone command
     */
    redo() {
        if (!this.canRedo()) {
            return;
        }

        this.isExecuting = true;

        try {
            const command = this.redoStack.pop();
            command.redo();

            // Add back to undo stack
            this.undoStack.push(command);

            this.updateUI();

        } finally {
            this.isExecuting = false;
        }
    }

    /**
     * Check if undo is available
     */
    canUndo() {
        return this.undoStack.length > 0;
    }

    /**
     * Check if redo is available
     */
    canRedo() {
        return this.redoStack.length > 0;
    }

    /**
     * Clear history
     */
    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.updateUI();
    }

    /**
     * Update UI buttons state
     */
    updateUI() {
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');

        if (undoBtn) {
            undoBtn.disabled = !this.canUndo();
            undoBtn.style.opacity = this.canUndo() ? '1' : '0.5';
        }

        if (redoBtn) {
            redoBtn.disabled = !this.canRedo();
            redoBtn.style.opacity = this.canRedo() ? '1' : '0.5';
        }
    }

    /**
     * Create command for adding a node
     */
    createAddNodeCommand(node) {
        return new AddNodeCommand(node);
    }

    /**
     * Create command for deleting a node
     */
    createDeleteNodeCommand(nodeId) {
        return new DeleteNodeCommand(nodeId);
    }

    /**
     * Create command for adding a connection
     */
    createAddConnectionCommand(connection) {
        return new AddConnectionCommand(connection);
    }

    /**
     * Create command for deleting a connection
     */
    createDeleteConnectionCommand(connectionId) {
        return new DeleteConnectionCommand(connectionId);
    }
}

// Create and export singleton instance
export const undoRedoManager = new UndoRedoManager();

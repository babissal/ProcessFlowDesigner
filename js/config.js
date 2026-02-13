// Configuration and Constants for Process Flow Designer

export const CONFIG = {
    // Canvas settings
    CANVAS: {
        MIN_ZOOM: 0.1,
        MAX_ZOOM: 3.0,
        ZOOM_STEP: 0.1,
        DEFAULT_ZOOM: 1.0,
        ZOOM_SENSITIVITY: 0.001,
        PAN_SPEED: 1.0,
        GRID_SIZE: 20,
        CANVAS_WIDTH: 10000,
        CANVAS_HEIGHT: 10000
    },

    // Node settings
    NODES: {
        // Flow Control
        START: {
            type: 'start',
            label: 'Start',
            color: '#4CAF50',
            strokeColor: '#2E7D32',
            width: 80,
            height: 80,
            shape: 'circle',
            category: 'flow'
        },
        END: {
            type: 'end',
            label: 'End',
            color: '#F44336',
            strokeColor: '#C62828',
            width: 80,
            height: 80,
            shape: 'circle',
            category: 'flow'
        },
        DECISION: {
            type: 'decision',
            label: 'Decision',
            color: '#FFC107',
            strokeColor: '#F57C00',
            width: 100,
            height: 100,
            shape: 'diamond',
            category: 'flow'
        },
        MERGE: {
            type: 'merge',
            label: '',
            color: '#9E9E9E',
            strokeColor: '#616161',
            width: 30,
            height: 30,
            shape: 'circle',
            category: 'flow'
        },

        // Processes
        TASK: {
            type: 'task',
            label: 'Task',
            color: '#2196F3',
            strokeColor: '#1565C0',
            width: 120,
            height: 60,
            shape: 'rectangle',
            category: 'process'
        },
        PROCESS: {
            type: 'process',
            label: 'Process',
            color: '#9C27B0',
            strokeColor: '#7B1FA2',
            width: 140,
            height: 70,
            shape: 'process',
            category: 'process'
        },
        MANUAL: {
            type: 'manual',
            label: 'Manual',
            color: '#00BCD4',
            strokeColor: '#0097A7',
            width: 120,
            height: 70,
            shape: 'trapezoid',
            category: 'process'
        },
        DELAY: {
            type: 'delay',
            label: 'Delay',
            color: '#607D8B',
            strokeColor: '#455A64',
            width: 100,
            height: 60,
            shape: 'delay',
            category: 'process'
        },

        // Data
        DATABASE: {
            type: 'database',
            label: 'Database',
            color: '#FF9800',
            strokeColor: '#F57C00',
            width: 100,
            height: 80,
            shape: 'cylinder',
            category: 'data'
        },
        DOCUMENT: {
            type: 'document',
            label: 'Document',
            color: '#795548',
            strokeColor: '#5D4037',
            width: 120,
            height: 80,
            shape: 'document',
            category: 'data'
        },

        // Annotation
        COMMENT: {
            type: 'comment',
            label: 'Note',
            color: '#FFEB3B',
            strokeColor: '#FBC02D',
            width: 150,
            height: 100,
            shape: 'note',
            category: 'annotation'
        }
    },

    // Connection settings
    CONNECTIONS: {
        STROKE_WIDTH: 2,
        SELECTED_STROKE_WIDTH: 3,
        DEFAULT_COLOR: '#666',
        SELECTED_COLOR: '#2196F3',
        HOVER_COLOR: '#999',
        HIT_TOLERANCE: 10, // pixels for click detection
        MIN_DISTANCE: 30, // minimum distance to create connection
        USE_CURVED: true, // Use curved connections by default
        LABEL_FONT_SIZE: 12,
        LABEL_BG_COLOR: '#ffffff',
        LABEL_PADDING: 4,

        // Connection Styles (Phase 4)
        STYLES: {
            SOLID: {
                name: 'solid',
                label: 'Solid',
                strokeDasharray: 'none',
                strokeWidth: 2,
                animation: 'none'
            },
            DASHED: {
                name: 'dashed',
                label: 'Dashed',
                strokeDasharray: '10,5',
                strokeWidth: 2,
                animation: 'none'
            },
            DOTTED: {
                name: 'dotted',
                label: 'Dotted',
                strokeDasharray: '2,4',
                strokeWidth: 2,
                animation: 'none'
            },
            THICK: {
                name: 'thick',
                label: 'Thick',
                strokeDasharray: 'none',
                strokeWidth: 4,
                animation: 'none'
            },
            THIN: {
                name: 'thin',
                label: 'Thin',
                strokeDasharray: 'none',
                strokeWidth: 1,
                animation: 'none'
            },
            ANIMATED: {
                name: 'animated',
                label: 'Animated',
                strokeDasharray: '10,5',
                strokeWidth: 2,
                animation: 'flow 1s linear infinite'
            }
        },

        // Connection Colors (Phase 4)
        COLORS: {
            DEFAULT: { name: 'default', label: 'Default', color: '#666' },
            SUCCESS: { name: 'success', label: 'Success', color: '#4CAF50' },
            ERROR: { name: 'error', label: 'Error', color: '#F44336' },
            WARNING: { name: 'warning', label: 'Warning', color: '#FFC107' },
            INFO: { name: 'info', label: 'Info', color: '#2196F3' }
        }
    },

    // Selection settings
    SELECTION: {
        NODE_SELECTED_STROKE: '#2196F3',
        NODE_SELECTED_STROKE_WIDTH: 3,
        CONNECTION_SELECTED_STROKE: '#2196F3',
        CONNECTION_SELECTED_STROKE_WIDTH: 3
    },

    // Storage settings
    STORAGE: {
        KEY: 'processFlowDesigner_autosave',
        AUTOSAVE_INTERVAL: 5000, // 5 seconds
        VERSION: '1.0'
    },

    // UI settings
    UI: {
        DOUBLE_CLICK_DELAY: 300, // ms
        TOAST_DURATION: 3000, // ms
        TOAST_ERROR_DURATION: 5000, // ms
        SIDEBAR_WIDTH: 200,
        TOOLBAR_HEIGHT: 50,
        STATUSBAR_HEIGHT: 30
    },

    // Validation rules
    VALIDATION: {
        MAX_LABEL_LENGTH: 100,
        MAX_NODES: 1000,
        MAX_CONNECTIONS: 2000,
        ALLOWED_NODE_TYPES: [
            'start', 'end', 'decision', 'merge',
            'task', 'process', 'manual', 'delay',
            'database', 'document',
            'comment'
        ]
    },

    // Default state
    DEFAULT_STATE: {
        workflow: {
            id: null,
            name: 'Untitled Workflow',
            version: '1.0',
            nodes: [],
            connections: [],
            metadata: {
                createdAt: null,
                updatedAt: null,
                zoomLevel: 1.0,
                canvasOffset: { x: 0, y: 0 }
            }
        },
        ui: {
            selectedNodes: [],
            selectedConnections: [],
            theme: 'light',
            gridVisible: true,
            snapToGrid: false,
            isPanning: false,
            isConnecting: false,
            connectingFrom: null
        }
    },

    // Keyboard shortcuts
    SHORTCUTS: {
        NEW: 'ctrl+n',
        OPEN: 'ctrl+o',
        SAVE: 'ctrl+s',
        DELETE: 'Delete',
        ZOOM_IN: '+',
        ZOOM_OUT: '-',
        ZOOM_RESET: 'ctrl+0',
        SELECT_ALL: 'ctrl+a'
    },

    // Events
    EVENTS: {
        // State changes
        STATE_CHANGED: 'state:changed',
        NODE_ADDED: 'node:added',
        NODE_UPDATED: 'node:updated',
        NODE_DELETED: 'node:deleted',
        NODE_MOVED: 'node:moved',
        CONNECTION_ADDED: 'connection:added',
        CONNECTION_DELETED: 'connection:deleted',
        SELECTION_CHANGED: 'selection:changed',

        // Canvas events
        CANVAS_ZOOM: 'canvas:zoom',
        CANVAS_PAN: 'canvas:pan',
        CANVAS_CLICK: 'canvas:click',

        // UI events
        WORKFLOW_LOADED: 'workflow:loaded',
        WORKFLOW_SAVED: 'workflow:saved',
        WORKFLOW_EXPORTED: 'workflow:exported',
        ERROR: 'error',
        SUCCESS: 'success'
    }
};

// Utility function to get node configuration by type
export function getNodeConfig(type) {
    const nodeType = type.toUpperCase();
    return CONFIG.NODES[nodeType] || null;
}

// Generate unique ID
export function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get current timestamp
export function getCurrentTimestamp() {
    return new Date().toISOString();
}

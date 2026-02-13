/**
 * Context Menu Module
 * Handles right-click context menus for nodes, connections, and canvas
 */

import { CONFIG } from '../config.js';
import { eventBus } from './eventBus.js';
import { stateManager } from './stateManager.js';
import { nodes } from './nodes.js';
import { layoutEngine } from './layoutEngine.js';
import { grouping } from './grouping.js';
import { nodeProperties } from './nodeProperties.js';
import { connectionProperties } from './connectionProperties.js';
import { showToast } from '../utils/dom.js';

class ContextMenu {
    constructor() {
        this.menu = null;
        this.currentTarget = null;
        this.currentTargetType = null;
    }

    /**
     * Initialize context menu
     */
    init() {
        console.log('Initializing context menu...');

        this.createMenu();
        this.setupEventListeners();
    }

    /**
     * Create menu element
     */
    createMenu() {
        this.menu = document.createElement('div');
        this.menu.id = 'context-menu';
        this.menu.className = 'context-menu';
        document.body.appendChild(this.menu);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Prevent default context menu on canvas
        const canvasContainer = document.getElementById('canvas-container');
        if (canvasContainer) {
            canvasContainer.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.handleCanvasContextMenu(e);
            });
        }

        // Node context menu
        const nodesLayer = document.getElementById('nodes-layer');
        if (nodesLayer) {
            nodesLayer.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleNodeContextMenu(e);
            });
        }

        // Connection context menu
        const connectionsLayer = document.getElementById('connections-layer');
        if (connectionsLayer) {
            connectionsLayer.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleConnectionContextMenu(e);
            });
        }

        // Close menu on click outside
        document.addEventListener('click', () => this.hide());
        document.addEventListener('contextmenu', (e) => {
            // Close existing menu when opening new one
            if (this.menu && !this.menu.contains(e.target)) {
                this.hide();
            }
        });
    }

    /**
     * Handle node context menu
     */
    handleNodeContextMenu(e) {
        const nodeGroup = e.target.closest('.node');
        if (!nodeGroup) return;

        const nodeId = nodeGroup.dataset.nodeId;
        if (!nodeId) return;

        const node = stateManager.getNode(nodeId);
        if (!node) return;

        this.currentTarget = nodeId;
        this.currentTargetType = 'node';

        const menuItems = [
            {
                label: '✏️ Edit Properties',
                action: () => {
                    stateManager.selectNode(nodeId, false);
                    nodeProperties.show(nodeId);
                }
            },
            { divider: true },
            {
                label: '📋 Duplicate',
                action: () => this.duplicateNode(nodeId)
            },
            {
                label: node.locked ? '🔓 Unlock' : '🔒 Lock',
                action: () => nodes.toggleLock(nodeId)
            },
            { divider: true },
            {
                label: '🗑️ Delete',
                action: () => {
                    if (confirm('Delete this node?')) {
                        stateManager.deleteNode(nodeId);
                        showToast('Node deleted', 'success');
                    }
                },
                danger: true
            }
        ];

        this.show(e.clientX, e.clientY, menuItems);
    }

    /**
     * Handle connection context menu
     */
    handleConnectionContextMenu(e) {
        const connection = e.target.closest('.connection');
        if (!connection) return;

        const connectionId = connection.dataset.connectionId;
        if (!connectionId) return;

        const conn = stateManager.getConnection(connectionId);
        if (!conn) return;

        this.currentTarget = connectionId;
        this.currentTargetType = 'connection';

        const menuItems = [
            {
                label: '✏️ Edit Properties',
                action: () => {
                    stateManager.selectConnection(connectionId, false);
                    connectionProperties.show(connectionId);
                }
            },
            {
                label: '🏷️ Edit Label',
                action: () => {
                    const connections = require('./connections.js').connections;
                    connections.startEditingLabel(connectionId);
                }
            },
            { divider: true },
            {
                label: '↔️ Reverse Direction',
                action: () => this.reverseConnection(connectionId)
            },
            { divider: true },
            {
                label: '🗑️ Delete',
                action: () => {
                    if (confirm('Delete this connection?')) {
                        stateManager.deleteConnection(connectionId);
                        showToast('Connection deleted', 'success');
                    }
                },
                danger: true
            }
        ];

        this.show(e.clientX, e.clientY, menuItems);
    }

    /**
     * Handle canvas context menu
     */
    handleCanvasContextMenu(e) {
        // Only show if clicking directly on canvas (not on nodes/connections)
        if (e.target.closest('.node') || e.target.closest('.connection')) {
            return;
        }

        this.currentTarget = null;
        this.currentTargetType = 'canvas';

        const state = stateManager.getState();
        const hasSelection = state.ui.selectedNodes.length > 0;

        const menuItems = [
            {
                label: '📐 Auto-Layout',
                submenu: [
                    { label: 'Vertical', action: () => layoutEngine.autoLayoutVertical() },
                    { label: 'Horizontal', action: () => layoutEngine.autoLayoutHorizontal() },
                    { label: 'Grid', action: () => layoutEngine.autoLayoutGrid() }
                ]
            },
            { divider: true },
            {
                label: '🔲 Select All',
                action: () => {
                    const allNodes = stateManager.getState().workflow.nodes;
                    allNodes.forEach(node => stateManager.selectNode(node.id, true));
                    showToast(`Selected ${allNodes.length} nodes`, 'success');
                }
            }
        ];

        if (hasSelection) {
            menuItems.push({ divider: true });
            menuItems.push({
                label: '👥 Create Group',
                action: () => grouping.createGroup(),
                disabled: state.ui.selectedNodes.length < 2
            });
            menuItems.push({
                label: '🔒 Lock Selected',
                action: () => nodes.toggleLockSelected()
            });
            menuItems.push({
                label: '📏 Align',
                submenu: [
                    { label: 'Left', action: () => layoutEngine.alignNodes('left') },
                    { label: 'Right', action: () => layoutEngine.alignNodes('right') },
                    { label: 'Top', action: () => layoutEngine.alignNodes('top') },
                    { label: 'Bottom', action: () => layoutEngine.alignNodes('bottom') },
                    { label: 'Center H', action: () => layoutEngine.alignNodes('center-h') },
                    { label: 'Center V', action: () => layoutEngine.alignNodes('center-v') }
                ]
            });
            menuItems.push({
                label: '📊 Distribute',
                submenu: [
                    { label: 'Horizontally', action: () => layoutEngine.distributeNodes('horizontal') },
                    { label: 'Vertically', action: () => layoutEngine.distributeNodes('vertical') }
                ]
            });
        }

        this.show(e.clientX, e.clientY, menuItems);
    }

    /**
     * Show context menu
     */
    show(x, y, items) {
        this.menu.innerHTML = '';
        this.menu.style.left = `${x}px`;
        this.menu.style.top = `${y}px`;

        items.forEach(item => {
            if (item.divider) {
                const divider = document.createElement('div');
                divider.className = 'context-menu-divider';
                this.menu.appendChild(divider);
            } else if (item.submenu) {
                const submenuItem = this.createSubmenuItem(item);
                this.menu.appendChild(submenuItem);
            } else {
                const menuItem = this.createMenuItem(item);
                this.menu.appendChild(menuItem);
            }
        });

        this.menu.classList.add('visible');

        // Adjust position if menu goes off screen
        const rect = this.menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            this.menu.style.left = `${x - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            this.menu.style.top = `${y - rect.height}px`;
        }
    }

    /**
     * Create menu item
     */
    createMenuItem(item) {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';

        if (item.disabled) {
            menuItem.classList.add('disabled');
        }
        if (item.danger) {
            menuItem.classList.add('danger');
        }

        menuItem.textContent = item.label;

        if (!item.disabled) {
            menuItem.addEventListener('click', (e) => {
                e.stopPropagation();
                item.action();
                this.hide();
            });
        }

        return menuItem;
    }

    /**
     * Create submenu item
     */
    createSubmenuItem(item) {
        const submenuContainer = document.createElement('div');
        submenuContainer.className = 'context-menu-submenu';

        const submenuTrigger = document.createElement('div');
        submenuTrigger.className = 'context-menu-item submenu-trigger';
        submenuTrigger.innerHTML = `${item.label} <span class="submenu-arrow">▶</span>`;

        const submenuContent = document.createElement('div');
        submenuContent.className = 'context-submenu-content';

        item.submenu.forEach(subitem => {
            const subMenuItem = this.createMenuItem(subitem);
            submenuContent.appendChild(subMenuItem);
        });

        submenuContainer.appendChild(submenuTrigger);
        submenuContainer.appendChild(submenuContent);

        // Show/hide submenu on hover
        submenuContainer.addEventListener('mouseenter', () => {
            submenuContent.classList.add('visible');
        });
        submenuContainer.addEventListener('mouseleave', () => {
            submenuContent.classList.remove('visible');
        });

        return submenuContainer;
    }

    /**
     * Hide context menu
     */
    hide() {
        if (this.menu) {
            this.menu.classList.remove('visible');
            this.menu.innerHTML = '';
        }
        this.currentTarget = null;
        this.currentTargetType = null;
    }

    /**
     * Duplicate node
     */
    duplicateNode(nodeId) {
        const node = stateManager.getNode(nodeId);
        if (!node) return;

        const newNode = {
            ...node,
            id: undefined, // Will be generated
            x: node.x + 50,
            y: node.y + 50,
            label: node.label + ' (Copy)'
        };

        stateManager.addNode(newNode);
        showToast('Node duplicated', 'success');
    }

    /**
     * Reverse connection direction
     */
    reverseConnection(connectionId) {
        const conn = stateManager.getConnection(connectionId);
        if (!conn) return;

        stateManager.updateConnection(connectionId, {
            from: conn.to,
            to: conn.from
        });

        showToast('Connection reversed', 'success');
    }
}

// Create and export singleton instance
export const contextMenu = new ContextMenu();

/**
 * Grouping Module
 * Handles node grouping functionality
 */

import { CONFIG, generateId } from '../config.js';
import { eventBus } from './eventBus.js';
import { stateManager } from './stateManager.js';
import { canvas } from './canvas.js';
import { showToast, showModal } from '../utils/dom.js';
import { createSVGElement } from '../utils/svg.js';

class Grouping {
    constructor() {
        this.groups = new Map(); // groupId -> group data
        this.groupElements = new Map(); // groupId -> SVG element
    }

    /**
     * Initialize grouping
     */
    init() {
        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Re-render groups when nodes move
        eventBus.on(CONFIG.EVENTS.NODE_MOVED, () => this.updateAllGroups());
        eventBus.on(CONFIG.EVENTS.NODE_UPDATED, () => this.updateAllGroups());
        eventBus.on(CONFIG.EVENTS.NODE_DELETED, (data) => this.handleNodeDeleted(data.nodeId));
        eventBus.on(CONFIG.EVENTS.WORKFLOW_LOADED, () => this.loadGroups());
    }

    /**
     * Create a group from selected nodes
     */
    createGroup(nodeIds = null, name = 'New Group', color = '#E3F2FD') {
        // Use selected nodes if not specified
        if (!nodeIds) {
            const state = stateManager.getState();
            nodeIds = state.ui.selectedNodes;
        }

        if (!nodeIds || nodeIds.length < 2) {
            showToast('Select at least 2 nodes to create a group', 'error');
            return null;
        }

        // Create group data
        const group = {
            id: generateId('group'),
            name: name,
            color: color,
            nodeIds: [...nodeIds],
            collapsed: false
        };

        // Add to groups map
        this.groups.set(group.id, group);

        // Update nodes with group ID
        nodeIds.forEach(nodeId => {
            stateManager.updateNode(nodeId, { groupId: group.id });
        });

        // Render group
        this.renderGroup(group);

        showToast(`Group "${name}" created with ${nodeIds.length} nodes`, 'success');

        eventBus.emit('group:created', { group });

        return group;
    }

    /**
     * Render a group
     */
    renderGroup(group) {
        const state = stateManager.getState();
        const nodes = state.workflow.nodes.filter(n => group.nodeIds.includes(n.id));

        if (nodes.length === 0) return;

        // Calculate bounding box
        const bounds = this.calculateGroupBounds(nodes);

        // Remove existing group element if it exists
        if (this.groupElements.has(group.id)) {
            this.groupElements.get(group.id).remove();
        }

        // Create group container
        const groupEl = createSVGElement('g', {
            id: `group-${group.id}`,
            class: 'node-group'
        });

        // Create background rectangle
        const padding = 20;
        const rect = createSVGElement('rect', {
            x: bounds.x - padding,
            y: bounds.y - padding,
            width: bounds.width + padding * 2,
            height: bounds.height + padding * 2,
            fill: group.color,
            stroke: this.darkenColor(group.color),
            'stroke-width': 2,
            'stroke-dasharray': '5,5',
            rx: 8,
            ry: 8,
            opacity: 0.3
        });

        groupEl.appendChild(rect);

        // Create label
        const labelBg = createSVGElement('rect', {
            x: bounds.x - padding,
            y: bounds.y - padding - 25,
            width: Math.max(100, group.name.length * 8),
            height: 22,
            fill: group.color,
            stroke: this.darkenColor(group.color),
            'stroke-width': 2,
            rx: 4,
            ry: 4
        });

        const label = createSVGElement('text', {
            x: bounds.x - padding + 8,
            y: bounds.y - padding - 10,
            'font-size': 12,
            'font-weight': 'bold',
            fill: this.darkenColor(group.color)
        });
        label.textContent = group.name;

        groupEl.appendChild(labelBg);
        groupEl.appendChild(label);

        // Add double-click to edit
        labelBg.style.cursor = 'pointer';
        label.style.cursor = 'pointer';

        labelBg.addEventListener('dblclick', () => this.editGroupName(group.id));
        label.addEventListener('dblclick', () => this.editGroupName(group.id));

        // Add right-click menu
        groupEl.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showGroupContextMenu(group.id, e.clientX, e.clientY);
        });

        // Insert group behind nodes
        const mainGroup = canvas.getMainGroup();
        const nodesLayer = mainGroup.querySelector('#nodes-layer');

        if (nodesLayer) {
            mainGroup.insertBefore(groupEl, nodesLayer);
        } else {
            mainGroup.appendChild(groupEl);
        }

        this.groupElements.set(group.id, groupEl);
    }

    /**
     * Calculate bounding box for group
     */
    calculateGroupBounds(nodes) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        nodes.forEach(node => {
            const left = node.x - node.width / 2;
            const right = node.x + node.width / 2;
            const top = node.y - node.height / 2;
            const bottom = node.y + node.height / 2;

            minX = Math.min(minX, left);
            minY = Math.min(minY, top);
            maxX = Math.max(maxX, right);
            maxY = Math.max(maxY, bottom);
        });

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    /**
     * Update all group visuals
     */
    updateAllGroups() {
        this.groups.forEach(group => {
            this.renderGroup(group);
        });
    }

    /**
     * Delete a group
     */
    deleteGroup(groupId) {
        const group = this.groups.get(groupId);
        if (!group) return;

        // Remove group ID from nodes
        group.nodeIds.forEach(nodeId => {
            const node = stateManager.getNode(nodeId);
            if (node && node.groupId === groupId) {
                stateManager.updateNode(nodeId, { groupId: null });
            }
        });

        // Remove visual element
        const element = this.groupElements.get(groupId);
        if (element) {
            element.remove();
            this.groupElements.delete(groupId);
        }

        // Remove from groups map
        this.groups.delete(groupId);

        showToast(`Group "${group.name}" deleted`, 'success');

        eventBus.emit('group:deleted', { groupId });
    }

    /**
     * Edit group name
     */
    editGroupName(groupId) {
        const group = this.groups.get(groupId);
        if (!group) return;

        const newName = prompt('Enter group name:', group.name);
        if (newName && newName.trim()) {
            group.name = newName.trim();
            this.renderGroup(group);
            showToast('Group name updated', 'success');
        }
    }

    /**
     * Change group color
     */
    changeGroupColor(groupId, color) {
        const group = this.groups.get(groupId);
        if (!group) return;

        group.color = color;
        this.renderGroup(group);
        showToast('Group color updated', 'success');
    }

    /**
     * Show group context menu
     */
    showGroupContextMenu(groupId, x, y) {
        const group = this.groups.get(groupId);
        if (!group) return;

        // Create simple context menu
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.position = 'fixed';
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        menu.style.zIndex = '10000';
        menu.style.backgroundColor = 'var(--surface-color)';
        menu.style.border = '1px solid var(--border-color)';
        menu.style.borderRadius = '4px';
        menu.style.boxShadow = 'var(--shadow-large)';
        menu.style.padding = '4px 0';
        menu.style.minWidth = '150px';

        const options = [
            { label: 'Rename Group', action: () => this.editGroupName(groupId) },
            { label: 'Change Color', action: () => this.promptChangeColor(groupId) },
            { label: 'Select All Nodes', action: () => this.selectGroupNodes(groupId) },
            { label: 'Delete Group', action: () => this.deleteGroup(groupId), danger: true }
        ];

        options.forEach(opt => {
            const item = document.createElement('div');
            item.textContent = opt.label;
            item.style.padding = '8px 16px';
            item.style.cursor = 'pointer';
            item.style.color = opt.danger ? '#F44336' : 'var(--text-primary)';

            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = 'var(--border-color)';
            });

            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'transparent';
            });

            item.addEventListener('click', () => {
                opt.action();
                menu.remove();
            });

            menu.appendChild(item);
        });

        document.body.appendChild(menu);

        // Remove menu on click outside
        const removeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', removeMenu);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', removeMenu);
        }, 100);
    }

    /**
     * Prompt to change group color
     */
    promptChangeColor(groupId) {
        const colors = ['#E3F2FD', '#F3E5F5', '#FFF9C4', '#E8F5E9', '#FFE0B2', '#FFEBEE'];
        const colorNames = ['Blue', 'Purple', 'Yellow', 'Green', 'Orange', 'Red'];

        const choice = prompt(
            `Choose a color:\n${colorNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}`,
            '1'
        );

        const index = parseInt(choice) - 1;
        if (index >= 0 && index < colors.length) {
            this.changeGroupColor(groupId, colors[index]);
        }
    }

    /**
     * Select all nodes in a group
     */
    selectGroupNodes(groupId) {
        const group = this.groups.get(groupId);
        if (!group) return;

        // Clear current selection
        stateManager.clearSelection();

        // Select all nodes in group
        group.nodeIds.forEach(nodeId => {
            stateManager.selectNode(nodeId, true);
        });

        showToast(`Selected ${group.nodeIds.length} nodes from group`, 'success');
    }

    /**
     * Handle node deletion
     */
    handleNodeDeleted(nodeId) {
        // Remove node from all groups
        this.groups.forEach((group, groupId) => {
            const index = group.nodeIds.indexOf(nodeId);
            if (index !== -1) {
                group.nodeIds.splice(index, 1);

                // Delete group if it has less than 2 nodes
                if (group.nodeIds.length < 2) {
                    this.deleteGroup(groupId);
                } else {
                    this.renderGroup(group);
                }
            }
        });
    }

    /**
     * Load groups from state
     */
    loadGroups() {
        // Clear existing groups
        this.groupElements.forEach(el => el.remove());
        this.groups.clear();
        this.groupElements.clear();

        // Rebuild groups from node data
        const state = stateManager.getState();
        const groupMap = new Map();

        state.workflow.nodes.forEach(node => {
            if (node.groupId) {
                if (!groupMap.has(node.groupId)) {
                    groupMap.set(node.groupId, []);
                }
                groupMap.get(node.groupId).push(node.id);
            }
        });

        // Create groups
        let index = 1;
        groupMap.forEach((nodeIds, groupId) => {
            if (nodeIds.length >= 2) {
                const group = {
                    id: groupId,
                    name: `Group ${index++}`,
                    color: '#E3F2FD',
                    nodeIds: nodeIds,
                    collapsed: false
                };
                this.groups.set(groupId, group);
                this.renderGroup(group);
            }
        });
    }

    /**
     * Darken a color for borders
     */
    darkenColor(color) {
        // Simple darken by reducing lightness
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    /**
     * Get all groups
     */
    getAllGroups() {
        return Array.from(this.groups.values());
    }

    /**
     * Get group by ID
     */
    getGroup(groupId) {
        return this.groups.get(groupId);
    }
}

// Create and export singleton instance
export const grouping = new Grouping();

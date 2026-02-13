/**
 * Layout Engine Module
 * Implements auto-layout algorithms for workflow organization
 */

import { CONFIG, getNodeConfig } from '../config.js';
import { eventBus } from './eventBus.js';
import { stateManager } from './stateManager.js';
import { showToast } from '../utils/dom.js';

class LayoutEngine {
    constructor() {
        this.padding = 100;
        this.horizontalSpacing = 150;
        this.verticalSpacing = 120;
    }

    /**
     * Auto-layout - Hierarchical vertical flow
     */
    autoLayoutVertical() {
        const nodes = stateManager.getNodes();
        const connections = stateManager.getConnections();

        if (nodes.length === 0) {
            showToast('No nodes to layout', 'info');
            return;
        }

        // Build dependency graph
        const graph = this.buildGraph(nodes, connections);

        // Find start nodes (no incoming connections)
        const startNodes = nodes.filter(node => {
            return !connections.some(conn => conn.to === node.id);
        });

        if (startNodes.length === 0) {
            // No clear start, pick first node
            startNodes.push(nodes[0]);
        }

        // Calculate levels using BFS
        const levels = this.calculateLevels(graph, startNodes);

        // Position nodes by level
        this.positionNodesByLevel(levels);

        showToast('Auto-layout complete!', 'success');
    }

    /**
     * Build adjacency graph from connections
     */
    buildGraph(nodes, connections) {
        const graph = new Map();

        // Initialize graph
        nodes.forEach(node => {
            graph.set(node.id, {
                node: node,
                children: [],
                parents: []
            });
        });

        // Add edges
        connections.forEach(conn => {
            const from = graph.get(conn.from);
            const to = graph.get(conn.to);

            if (from && to) {
                from.children.push(conn.to);
                to.parents.push(conn.from);
            }
        });

        return graph;
    }

    /**
     * Calculate node levels using BFS
     */
    calculateLevels(graph, startNodes) {
        const levels = new Map();
        const visited = new Set();
        const queue = [];

        // Initialize with start nodes at level 0
        startNodes.forEach(node => {
            queue.push({ nodeId: node.id, level: 0 });
        });

        while (queue.length > 0) {
            const { nodeId, level } = queue.shift();

            if (visited.has(nodeId)) continue;
            visited.add(nodeId);

            // Set level for this node
            if (!levels.has(level)) {
                levels.set(level, []);
            }
            levels.get(level).push(nodeId);

            // Add children to queue
            const graphNode = graph.get(nodeId);
            if (graphNode) {
                graphNode.children.forEach(childId => {
                    if (!visited.has(childId)) {
                        queue.push({ nodeId: childId, level: level + 1 });
                    }
                });
            }
        }

        // Add any unvisited nodes (disconnected) to last level
        graph.forEach((graphNode, nodeId) => {
            if (!visited.has(nodeId)) {
                const lastLevel = Math.max(...Array.from(levels.keys())) + 1;
                if (!levels.has(lastLevel)) {
                    levels.set(lastLevel, []);
                }
                levels.get(lastLevel).push(nodeId);
            }
        });

        return levels;
    }

    /**
     * Position nodes based on their levels
     */
    positionNodesByLevel(levels) {
        let currentY = this.padding;

        // Sort levels by key
        const sortedLevels = Array.from(levels.entries()).sort((a, b) => a[0] - b[0]);

        sortedLevels.forEach(([level, nodeIds]) => {
            // Calculate total width needed for this level
            const nodesInLevel = nodeIds.map(id => stateManager.getNode(id));
            const totalWidth = nodesInLevel.reduce((sum, node) => {
                const config = getNodeConfig(node.type);
                return sum + (node.width || config.width);
            }, 0);

            const spacing = (nodeIds.length - 1) * this.horizontalSpacing;
            const levelWidth = totalWidth + spacing;

            // Center the level
            let currentX = this.padding;

            // Position each node in this level
            nodesInLevel.forEach((node, index) => {
                const config = getNodeConfig(node.type);
                const nodeWidth = node.width || config.width;
                const nodeHeight = node.height || config.height;

                // Update node position
                stateManager.updateNode(node.id, {
                    x: currentX,
                    y: currentY
                });

                currentX += nodeWidth + this.horizontalSpacing;
            });

            // Move to next level
            const maxHeight = Math.max(...nodesInLevel.map(node => {
                const config = getNodeConfig(node.type);
                return node.height || config.height;
            }));

            currentY += maxHeight + this.verticalSpacing;
        });
    }

    /**
     * Auto-layout - Horizontal flow (left to right)
     */
    autoLayoutHorizontal() {
        const nodes = stateManager.getNodes();
        const connections = stateManager.getConnections();

        if (nodes.length === 0) {
            showToast('No nodes to layout', 'info');
            return;
        }

        // Build dependency graph
        const graph = this.buildGraph(nodes, connections);

        // Find start nodes
        const startNodes = nodes.filter(node => {
            return !connections.some(conn => conn.to === node.id);
        });

        if (startNodes.length === 0) {
            startNodes.push(nodes[0]);
        }

        // Calculate levels
        const levels = this.calculateLevels(graph, startNodes);

        // Position nodes horizontally
        this.positionNodesHorizontal(levels);

        showToast('Horizontal layout complete!', 'success');
    }

    /**
     * Position nodes horizontally (left to right)
     */
    positionNodesHorizontal(levels) {
        let currentX = this.padding;

        // Sort levels
        const sortedLevels = Array.from(levels.entries()).sort((a, b) => a[0] - b[0]);

        sortedLevels.forEach(([level, nodeIds]) => {
            let currentY = this.padding;

            // Position each node in this level
            nodeIds.forEach(nodeId => {
                const node = stateManager.getNode(nodeId);
                const config = getNodeConfig(node.type);
                const nodeWidth = node.width || config.width;
                const nodeHeight = node.height || config.height;

                // Update node position
                stateManager.updateNode(node.id, {
                    x: currentX,
                    y: currentY
                });

                currentY += nodeHeight + this.verticalSpacing;
            });

            // Move to next level
            const maxWidth = Math.max(...nodeIds.map(nodeId => {
                const node = stateManager.getNode(nodeId);
                const config = getNodeConfig(node.type);
                return node.width || config.width;
            }));

            currentX += maxWidth + this.horizontalSpacing;
        });
    }

    /**
     * Distribute nodes evenly in a grid
     */
    autoLayoutGrid() {
        const nodes = stateManager.getNodes();

        if (nodes.length === 0) {
            showToast('No nodes to layout', 'info');
            return;
        }

        // Calculate grid dimensions
        const cols = Math.ceil(Math.sqrt(nodes.length));
        const rows = Math.ceil(nodes.length / cols);

        let currentX = this.padding;
        let currentY = this.padding;
        let col = 0;

        nodes.forEach((node, index) => {
            // Update position
            stateManager.updateNode(node.id, {
                x: currentX,
                y: currentY
            });

            col++;
            if (col >= cols) {
                col = 0;
                currentX = this.padding;
                currentY += 150;
            } else {
                currentX += 200;
            }
        });

        showToast('Grid layout complete!', 'success');
    }

    /**
     * Align selected nodes
     */
    alignNodes(alignment) {
        const selectedIds = stateManager.getState().ui.selectedNodes;

        if (selectedIds.length < 2) {
            showToast('Select at least 2 nodes to align', 'info');
            return;
        }

        const selectedNodes = selectedIds.map(id => stateManager.getNode(id));

        switch (alignment) {
            case 'left':
                const minX = Math.min(...selectedNodes.map(n => n.x));
                selectedNodes.forEach(node => {
                    stateManager.updateNode(node.id, { x: minX });
                });
                break;

            case 'right':
                const maxX = Math.max(...selectedNodes.map(n => {
                    const config = getNodeConfig(n.type);
                    return n.x + (n.width || config.width);
                }));
                selectedNodes.forEach(node => {
                    const config = getNodeConfig(node.type);
                    const width = node.width || config.width;
                    stateManager.updateNode(node.id, { x: maxX - width });
                });
                break;

            case 'top':
                const minY = Math.min(...selectedNodes.map(n => n.y));
                selectedNodes.forEach(node => {
                    stateManager.updateNode(node.id, { y: minY });
                });
                break;

            case 'bottom':
                const maxY = Math.max(...selectedNodes.map(n => {
                    const config = getNodeConfig(n.type);
                    return n.y + (n.height || config.height);
                }));
                selectedNodes.forEach(node => {
                    const config = getNodeConfig(node.type);
                    const height = node.height || config.height;
                    stateManager.updateNode(node.id, { y: maxY - height });
                });
                break;

            case 'center-h':
                const avgX = selectedNodes.reduce((sum, n) => {
                    const config = getNodeConfig(n.type);
                    return sum + n.x + (n.width || config.width) / 2;
                }, 0) / selectedNodes.length;

                selectedNodes.forEach(node => {
                    const config = getNodeConfig(node.type);
                    const width = node.width || config.width;
                    stateManager.updateNode(node.id, { x: avgX - width / 2 });
                });
                break;

            case 'center-v':
                const avgY = selectedNodes.reduce((sum, n) => {
                    const config = getNodeConfig(n.type);
                    return sum + n.y + (n.height || config.height) / 2;
                }, 0) / selectedNodes.length;

                selectedNodes.forEach(node => {
                    const config = getNodeConfig(node.type);
                    const height = node.height || config.height;
                    stateManager.updateNode(node.id, { y: avgY - height / 2 });
                });
                break;
        }

        showToast(`Aligned ${selectedNodes.length} nodes`, 'success');
    }

    /**
     * Distribute selected nodes evenly
     */
    distributeNodes(direction) {
        const selectedIds = stateManager.getState().ui.selectedNodes;

        if (selectedIds.length < 3) {
            showToast('Select at least 3 nodes to distribute', 'info');
            return;
        }

        const selectedNodes = selectedIds.map(id => stateManager.getNode(id));

        if (direction === 'horizontal') {
            // Sort by x position
            selectedNodes.sort((a, b) => a.x - b.x);

            const first = selectedNodes[0];
            const last = selectedNodes[selectedNodes.length - 1];
            const lastConfig = getNodeConfig(last.type);

            const totalSpace = (last.x + (last.width || lastConfig.width)) - first.x;
            const spacing = totalSpace / (selectedNodes.length - 1);

            selectedNodes.forEach((node, index) => {
                if (index > 0 && index < selectedNodes.length - 1) {
                    stateManager.updateNode(node.id, { x: first.x + spacing * index });
                }
            });
        } else {
            // Sort by y position
            selectedNodes.sort((a, b) => a.y - b.y);

            const first = selectedNodes[0];
            const last = selectedNodes[selectedNodes.length - 1];
            const lastConfig = getNodeConfig(last.type);

            const totalSpace = (last.y + (last.height || lastConfig.height)) - first.y;
            const spacing = totalSpace / (selectedNodes.length - 1);

            selectedNodes.forEach((node, index) => {
                if (index > 0 && index < selectedNodes.length - 1) {
                    stateManager.updateNode(node.id, { y: first.y + spacing * index });
                }
            });
        }

        showToast(`Distributed ${selectedNodes.length} nodes`, 'success');
    }
}

// Create and export singleton instance
export const layoutEngine = new LayoutEngine();

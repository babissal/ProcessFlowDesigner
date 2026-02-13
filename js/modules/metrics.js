/**
 * Metrics Module
 * Calculates and displays workflow statistics and analytics
 */

import { CONFIG } from '../config.js';
import { eventBus } from './eventBus.js';
import { stateManager } from './stateManager.js';

class Metrics {
    constructor() {
        this.panel = null;
        this.isVisible = false;
    }

    /**
     * Initialize metrics panel
     */
    init() {
        this.createPanel();
        this.setupEventListeners();

        // Update metrics when workflow changes
        eventBus.on(CONFIG.EVENTS.STATE_CHANGED, () => this.updateMetrics());
        eventBus.on(CONFIG.EVENTS.WORKFLOW_LOADED, () => this.updateMetrics());
    }

    /**
     * Create metrics panel UI
     */
    createPanel() {
        // Create panel element
        this.panel = document.createElement('div');
        this.panel.id = 'metrics-panel';
        this.panel.className = 'metrics-panel hidden';

        this.panel.innerHTML = `
            <div class="metrics-header">
                <h3>📊 Workflow Metrics</h3>
                <button class="metrics-close" title="Close metrics">×</button>
            </div>
            <div class="metrics-content">
                <div class="metrics-section">
                    <h4>Node Statistics</h4>
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <span class="metric-label">Total Nodes:</span>
                            <span class="metric-value" id="metric-total-nodes">0</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Start Nodes:</span>
                            <span class="metric-value" id="metric-start-nodes">0</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Tasks:</span>
                            <span class="metric-value" id="metric-task-nodes">0</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Decisions:</span>
                            <span class="metric-value" id="metric-decision-nodes">0</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">End Nodes:</span>
                            <span class="metric-value" id="metric-end-nodes">0</span>
                        </div>
                    </div>
                </div>

                <div class="metrics-section">
                    <h4>Connection Statistics</h4>
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <span class="metric-label">Total Connections:</span>
                            <span class="metric-value" id="metric-total-connections">0</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Avg. Connections/Node:</span>
                            <span class="metric-value" id="metric-avg-connections">0.0</span>
                        </div>
                    </div>
                </div>

                <div class="metrics-section">
                    <h4>Workflow Analysis</h4>
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <span class="metric-label">Complexity Score:</span>
                            <span class="metric-value" id="metric-complexity">0</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Longest Path:</span>
                            <span class="metric-value" id="metric-longest-path">0</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Disconnected Nodes:</span>
                            <span class="metric-value metric-warning" id="metric-disconnected">0</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Cycles Detected:</span>
                            <span class="metric-value metric-warning" id="metric-cycles">0</span>
                        </div>
                    </div>
                </div>

                <div class="metrics-section">
                    <h4>Node Distribution</h4>
                    <div id="metric-chart" class="metric-chart"></div>
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
        const closeBtn = this.panel.querySelector('.metrics-close');
        closeBtn.addEventListener('click', () => this.hide());

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    /**
     * Show metrics panel
     */
    show() {
        this.panel.classList.remove('hidden');
        this.isVisible = true;
        this.updateMetrics();
    }

    /**
     * Hide metrics panel
     */
    hide() {
        this.panel.classList.add('hidden');
        this.isVisible = false;
    }

    /**
     * Toggle metrics panel visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Update all metrics
     */
    updateMetrics() {
        if (!this.isVisible) return;

        const state = stateManager.getState();
        const nodes = state.workflow.nodes;
        const connections = state.workflow.connections;

        // Node statistics
        this.updateNodeStatistics(nodes);

        // Connection statistics
        this.updateConnectionStatistics(nodes, connections);

        // Workflow analysis
        this.updateWorkflowAnalysis(nodes, connections);

        // Node distribution chart
        this.updateNodeDistributionChart(nodes);
    }

    /**
     * Update node statistics
     */
    updateNodeStatistics(nodes) {
        const totalNodes = nodes.length;
        const nodesByType = this.countNodesByType(nodes);

        document.getElementById('metric-total-nodes').textContent = totalNodes;
        document.getElementById('metric-start-nodes').textContent = nodesByType.start || 0;
        document.getElementById('metric-task-nodes').textContent = nodesByType.task || 0;
        document.getElementById('metric-decision-nodes').textContent = nodesByType.decision || 0;
        document.getElementById('metric-end-nodes').textContent = nodesByType.end || 0;
    }

    /**
     * Update connection statistics
     */
    updateConnectionStatistics(nodes, connections) {
        const totalConnections = connections.length;
        const avgConnections = nodes.length > 0 ? (totalConnections / nodes.length).toFixed(1) : 0;

        document.getElementById('metric-total-connections').textContent = totalConnections;
        document.getElementById('metric-avg-connections').textContent = avgConnections;
    }

    /**
     * Update workflow analysis metrics
     */
    updateWorkflowAnalysis(nodes, connections) {
        // Complexity score (McCabe's cyclomatic complexity approximation)
        const complexity = this.calculateComplexity(nodes, connections);
        document.getElementById('metric-complexity').textContent = complexity;

        // Longest path
        const longestPath = this.calculateLongestPath(nodes, connections);
        document.getElementById('metric-longest-path').textContent = longestPath;

        // Disconnected nodes
        const disconnected = this.findDisconnectedNodes(nodes, connections);
        const disconnectedEl = document.getElementById('metric-disconnected');
        disconnectedEl.textContent = disconnected.length;
        disconnectedEl.className = disconnected.length > 0 ? 'metric-value metric-warning' : 'metric-value';

        // Cycles
        const cycles = this.detectCycles(nodes, connections);
        const cyclesEl = document.getElementById('metric-cycles');
        cyclesEl.textContent = cycles;
        cyclesEl.className = cycles > 0 ? 'metric-value metric-warning' : 'metric-value';
    }

    /**
     * Update node distribution chart
     */
    updateNodeDistributionChart(nodes) {
        const nodesByType = this.countNodesByType(nodes);
        const chartEl = document.getElementById('metric-chart');

        if (nodes.length === 0) {
            chartEl.innerHTML = '<p class="chart-empty">No nodes to display</p>';
            return;
        }

        // Create simple bar chart
        const types = [
            { type: 'start', label: 'Start', color: '#4CAF50' },
            { type: 'task', label: 'Task', color: '#2196F3' },
            { type: 'decision', label: 'Decision', color: '#FFC107' },
            { type: 'end', label: 'End', color: '#F44336' }
        ];

        const maxCount = Math.max(...Object.values(nodesByType), 1);

        chartEl.innerHTML = types.map(({ type, label, color }) => {
            const count = nodesByType[type] || 0;
            const percentage = (count / nodes.length * 100).toFixed(0);
            const barWidth = (count / maxCount * 100).toFixed(0);

            return `
                <div class="chart-bar">
                    <div class="chart-bar-label">${label}</div>
                    <div class="chart-bar-container">
                        <div class="chart-bar-fill" style="width: ${barWidth}%; background-color: ${color};"></div>
                    </div>
                    <div class="chart-bar-value">${count} (${percentage}%)</div>
                </div>
            `;
        }).join('');
    }

    /**
     * Count nodes by type
     */
    countNodesByType(nodes) {
        return nodes.reduce((acc, node) => {
            acc[node.type] = (acc[node.type] || 0) + 1;
            return acc;
        }, {});
    }

    /**
     * Calculate workflow complexity
     * Approximation: E - N + 2P (McCabe's cyclomatic complexity)
     * E = edges (connections), N = nodes, P = connected components
     */
    calculateComplexity(nodes, connections) {
        if (nodes.length === 0) return 0;

        const E = connections.length;
        const N = nodes.length;
        const P = 1; // Assume single connected component for simplicity

        // Add decision nodes weight (each decision adds 1 to complexity)
        const decisionNodes = nodes.filter(n => n.type === 'decision').length;

        return Math.max(1, E - N + 2 * P + decisionNodes);
    }

    /**
     * Calculate longest path in workflow
     */
    calculateLongestPath(nodes, connections) {
        if (nodes.length === 0) return 0;

        // Build adjacency list
        const graph = new Map();
        nodes.forEach(node => {
            graph.set(node.id, []);
        });

        connections.forEach(conn => {
            if (graph.has(conn.from)) {
                graph.get(conn.from).push(conn.to);
            }
        });

        // Find start nodes (no incoming connections)
        const incomingCount = new Map();
        nodes.forEach(node => incomingCount.set(node.id, 0));
        connections.forEach(conn => {
            incomingCount.set(conn.to, (incomingCount.get(conn.to) || 0) + 1);
        });

        const startNodes = nodes.filter(n => incomingCount.get(n.id) === 0);

        if (startNodes.length === 0) return 0;

        // DFS to find longest path
        const visited = new Set();
        let maxDepth = 0;

        const dfs = (nodeId, depth) => {
            visited.add(nodeId);
            maxDepth = Math.max(maxDepth, depth);

            const children = graph.get(nodeId) || [];
            for (const childId of children) {
                if (!visited.has(childId)) {
                    dfs(childId, depth + 1);
                }
            }

            visited.delete(nodeId);
        };

        startNodes.forEach(node => dfs(node.id, 1));

        return maxDepth;
    }

    /**
     * Find disconnected nodes
     */
    findDisconnectedNodes(nodes, connections) {
        if (nodes.length === 0) return [];

        const connectedNodes = new Set();
        connections.forEach(conn => {
            connectedNodes.add(conn.from);
            connectedNodes.add(conn.to);
        });

        return nodes.filter(node => !connectedNodes.has(node.id));
    }

    /**
     * Detect cycles in workflow
     */
    detectCycles(nodes, connections) {
        if (nodes.length === 0) return 0;

        // Build adjacency list
        const graph = new Map();
        nodes.forEach(node => {
            graph.set(node.id, []);
        });

        connections.forEach(conn => {
            if (graph.has(conn.from)) {
                graph.get(conn.from).push(conn.to);
            }
        });

        // DFS cycle detection
        const visited = new Set();
        const recStack = new Set();
        let cycleCount = 0;

        const hasCycle = (nodeId) => {
            visited.add(nodeId);
            recStack.add(nodeId);

            const neighbors = graph.get(nodeId) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    if (hasCycle(neighbor)) {
                        cycleCount++;
                    }
                } else if (recStack.has(neighbor)) {
                    cycleCount++;
                }
            }

            recStack.delete(nodeId);
            return false;
        };

        nodes.forEach(node => {
            if (!visited.has(node.id)) {
                hasCycle(node.id);
            }
        });

        return cycleCount;
    }
}

// Create and export singleton instance
export const metrics = new Metrics();

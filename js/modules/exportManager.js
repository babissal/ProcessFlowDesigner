/**
 * Export Manager Module
 * Handles JSON export and import
 */

import { CONFIG, getCurrentTimestamp } from '../config.js';
import { eventBus } from './eventBus.js';
import { stateManager } from './stateManager.js';
import { nodes } from './nodes.js';
import { connections } from './connections.js';
import { canvas } from './canvas.js';
import { downloadFile, uploadFile, showToast } from '../utils/dom.js';

class ExportManager {
    constructor() {
        this.isExportingPNG = false;
    }

    /**
     * Export workflow as JSON
     */
    exportJSON() {
        const workflow = stateManager.getWorkflow();

        // Clean up workflow data
        const exportData = {
            ...workflow,
            metadata: {
                ...workflow.metadata,
                exportedAt: getCurrentTimestamp(),
                version: CONFIG.STORAGE.VERSION
            }
        };

        // Convert to JSON
        const json = JSON.stringify(exportData, null, 2);

        // Generate filename
        const filename = this.generateFilename(workflow.name, 'json');

        // Download file
        downloadFile(json, filename, 'application/json');

        showToast('Workflow exported successfully', 'success');
        eventBus.emit(CONFIG.EVENTS.WORKFLOW_EXPORTED, { format: 'json', filename });
    }

    /**
     * Import workflow from JSON file
     */
    import() {
        uploadFile('.json', (content, file) => {
            try {
                const data = JSON.parse(content);

                // Validate the imported data
                if (!this.validateWorkflowData(data)) {
                    showToast('Invalid workflow file', 'error', 5000);
                    return;
                }

                // Create new state from imported data
                const newState = {
                    workflow: {
                        ...data,
                        metadata: {
                            ...data.metadata,
                            importedAt: getCurrentTimestamp(),
                            updatedAt: getCurrentTimestamp()
                        }
                    },
                    ui: stateManager.getUIState()
                };

                // Set state
                stateManager.setState(newState);

                // Re-render everything
                nodes.renderAllNodes();
                connections.renderAllConnections();

                // Reset zoom to saved state or default
                const zoomLevel = data.metadata?.zoomLevel || CONFIG.CANVAS.DEFAULT_ZOOM;
                const offset = data.metadata?.canvasOffset || { x: 0, y: 0 };

                canvas.setZoom(zoomLevel);
                canvas.panX = offset.x;
                canvas.panY = offset.y;
                canvas.updateTransform();
                canvas.hideOverlay();

                showToast('Workflow imported successfully', 'success');
                eventBus.emit(CONFIG.EVENTS.WORKFLOW_LOADED, data);

            } catch (error) {
                console.error('Error importing workflow:', error);
                showToast('Error importing workflow: ' + error.message, 'error', 5000);
            }
        });
    }

    /**
     * Validate workflow data structure
     */
    validateWorkflowData(data) {
        // Check basic structure
        if (!data || typeof data !== 'object') {
            return false;
        }

        // Check required fields
        if (!Array.isArray(data.nodes)) {
            console.error('Invalid workflow: nodes must be an array');
            return false;
        }

        if (!Array.isArray(data.connections)) {
            console.error('Invalid workflow: connections must be an array');
            return false;
        }

        // Validate nodes
        for (const node of data.nodes) {
            if (!node.id || !node.type || typeof node.x !== 'number' || typeof node.y !== 'number') {
                console.error('Invalid node data:', node);
                return false;
            }

            if (!CONFIG.VALIDATION.ALLOWED_NODE_TYPES.includes(node.type)) {
                console.error('Invalid node type:', node.type);
                return false;
            }
        }

        // Validate connections
        const nodeIds = new Set(data.nodes.map(n => n.id));
        for (const conn of data.connections) {
            if (!conn.id || !conn.from || !conn.to) {
                console.error('Invalid connection data:', conn);
                return false;
            }

            // Check if referenced nodes exist
            if (!nodeIds.has(conn.from) || !nodeIds.has(conn.to)) {
                console.error('Connection references non-existent node:', conn);
                return false;
            }
        }

        return true;
    }

    /**
     * Generate filename for export
     */
    generateFilename(workflowName, extension) {
        const name = workflowName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const timestamp = new Date().toISOString().slice(0, 10);
        return `${name}_${timestamp}.${extension}`;
    }

    /**
     * Export workflow as PNG
     */
    async exportPNG() {
        // Prevent concurrent exports
        if (this.isExportingPNG) {
            console.log('PNG export already in progress');
            return;
        }

        this.isExportingPNG = true;

        try {
            showToast('Generating PNG...', 'info');

            const svg = document.getElementById('canvas');
            const mainGroup = document.getElementById('main-group');

            if (!svg || !mainGroup) {
                showToast('Canvas not found', 'error');
                return;
            }

            // Get bounding box of all content
            const bbox = mainGroup.getBBox();

            // Add padding
            const padding = 40;
            const width = bbox.width + padding * 2;
            const height = bbox.height + padding * 2;

            // Clone the SVG
            const clonedSVG = svg.cloneNode(true);
            clonedSVG.setAttribute('width', width);
            clonedSVG.setAttribute('height', height);
            clonedSVG.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${width} ${height}`);

            // Remove grid background and overlay
            const gridBg = clonedSVG.querySelector('#grid-bg');
            if (gridBg) gridBg.remove();

            const overlay = clonedSVG.querySelector('.canvas-overlay');
            if (overlay) overlay.remove();

            // Add white background
            const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bgRect.setAttribute('x', bbox.x - padding);
            bgRect.setAttribute('y', bbox.y - padding);
            bgRect.setAttribute('width', width);
            bgRect.setAttribute('height', height);
            bgRect.setAttribute('fill', 'white');

            const mainGroupClone = clonedSVG.querySelector('#main-group');
            if (mainGroupClone && mainGroupClone.parentNode) {
                mainGroupClone.parentNode.insertBefore(bgRect, mainGroupClone);
            }

            // Serialize SVG to string
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(clonedSVG);

            // Create blob from SVG string
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);

            // Create image from SVG
            const img = new Image();
            const scale = 2; // 2x for higher quality

            await new Promise((resolve, reject) => {
                img.onload = () => {
                    // Create canvas
                    const canvas = document.createElement('canvas');
                    canvas.width = width * scale;
                    canvas.height = height * scale;
                    const ctx = canvas.getContext('2d');

                    // Draw white background
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Draw image scaled up
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                    // Clean up
                    URL.revokeObjectURL(svgUrl);

                    // Convert to data URL
                    const dataURL = canvas.toDataURL('image/png');

                    // Create download link
                    const link = document.createElement('a');
                    const filename = this.generateFilename(stateManager.getWorkflow().name, 'png');

                    link.href = dataURL;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    showToast('PNG exported successfully', 'success');
                    eventBus.emit(CONFIG.EVENTS.WORKFLOW_EXPORTED, { format: 'png', filename });

                    resolve();
                };

                img.onerror = (error) => {
                    URL.revokeObjectURL(svgUrl);
                    reject(new Error('Failed to load SVG image'));
                };

                img.src = svgUrl;
            });

        } catch (error) {
            console.error('Error exporting PNG:', error);
            showToast('Error exporting PNG: ' + error.message, 'error', 5000);
        } finally {
            this.isExportingPNG = false;
        }
    }

    /**
     * Export workflow as SVG
     */
    exportSVG() {
        try {
            const svg = document.getElementById('canvas');
            const mainGroup = document.getElementById('main-group');

            if (!svg || !mainGroup) {
                showToast('Canvas not found', 'error');
                return;
            }

            // Get bounding box of all content
            const bbox = mainGroup.getBBox();

            // Clone the SVG
            const clonedSVG = svg.cloneNode(true);

            // Set appropriate dimensions
            clonedSVG.setAttribute('width', bbox.width + 40);
            clonedSVG.setAttribute('height', bbox.height + 40);

            // Adjust viewBox
            const viewBox = `${bbox.x - 20} ${bbox.y - 20} ${bbox.width + 40} ${bbox.height + 40}`;
            clonedSVG.setAttribute('viewBox', viewBox);

            // Remove grid background
            const gridBg = clonedSVG.querySelector('#grid-bg');
            if (gridBg) gridBg.remove();

            // Remove overlay
            const overlay = clonedSVG.querySelector('.canvas-overlay');
            if (overlay) overlay.remove();

            // Serialize SVG
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(clonedSVG);

            // Create blob and download
            const blob = new Blob([svgString], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const filename = this.generateFilename(stateManager.getWorkflow().name, 'svg');

            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showToast('SVG exported successfully', 'success');
            eventBus.emit(CONFIG.EVENTS.WORKFLOW_EXPORTED, { format: 'svg', filename });

        } catch (error) {
            console.error('Error exporting SVG:', error);
            showToast('Error exporting SVG: ' + error.message, 'error', 5000);
        }
    }

    /**
     * Get workflow statistics
     */
    getWorkflowStats() {
        const workflow = stateManager.getWorkflow();

        // Count node types
        const nodeTypes = {};
        workflow.nodes.forEach(node => {
            nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
        });

        return {
            totalNodes: workflow.nodes.length,
            totalConnections: workflow.connections.length,
            nodeTypes,
            createdAt: workflow.metadata.createdAt,
            updatedAt: workflow.metadata.updatedAt
        };
    }
}

// Create and export singleton instance
export const exportManager = new ExportManager();

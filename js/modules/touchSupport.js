/**
 * Touch Support Module
 * Adds mobile touch interactions:
 * - Pinch-to-zoom (two fingers)
 * - One-finger pan on canvas background
 * - Double-tap on nodes for label editing
 * - Long-press for context menu
 * - Tap on empty canvas to clear selection
 * - Tap on node to select
 *
 * Note: Node dragging is handled by interact.js (has built-in touch support).
 * Connection creation on mobile uses the Connect tool (tap source, tap target).
 */

import { canvas } from './canvas.js';
import { nodes } from './nodes.js';
import { sidebar } from './sidebar.js';
import { stateManager } from './stateManager.js';
import { contextMenu } from './contextMenu.js';
import { clamp } from '../utils/geometry.js';
import { CONFIG } from '../config.js';

class TouchSupport {
    constructor() {
        // Pinch-to-zoom state
        this.lastPinchDistance = 0;
        this.lastPinchCenter = null;
        this.isPinching = false;

        // Pan state
        this.isTouchPanning = false;
        this.panStartTouch = null;
        this.panStartOffset = null;

        // Long-press state
        this.longPressTimer = null;
        this.longPressTriggered = false;

        // Double-tap state
        this.lastTapTime = 0;
        this.lastTapNodeId = null;

        // Track touch start position for tap detection
        this.touchStartPos = null;
        this.touchStartTarget = null;
    }

    init() {
        const svg = canvas.getSVG();
        if (!svg) return;

        // Only add touch handlers on touch-capable devices
        if (!('ontouchstart' in window || navigator.maxTouchPoints > 0)) return;

        svg.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        svg.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        svg.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
        svg.addEventListener('touchcancel', () => this.onTouchCancel(), { passive: false });

        // Prevent iOS Safari bounce/zoom on the whole page
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('#canvas') || e.target.closest('.canvas-container')) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    // ─── Touch Start ──────────────────────────────────────────────

    onTouchStart(e) {
        this.clearLongPress();
        this.longPressTriggered = false;

        const touches = e.touches;

        // ── Two-finger: start pinch ──
        if (touches.length === 2) {
            e.preventDefault();
            this.cancelPan();
            this.isPinching = true;
            this.lastPinchDistance = this.distance(touches[0], touches[1]);
            this.lastPinchCenter = this.midpoint(touches[0], touches[1]);
            return;
        }

        // ── One-finger ──
        if (touches.length !== 1) return;

        const touch = touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const nodeEl = target ? target.closest('.node') : null;
        const connEl = target ? target.closest('.connection') : null;

        this.touchStartPos = { x: touch.clientX, y: touch.clientY };
        this.touchStartTarget = target;

        if (nodeEl) {
            // Touching a node: interact.js handles drag, we handle long-press & double-tap
            // Don't prevent default here so interact.js can capture the event
            const nodeId = nodeEl.dataset.nodeId;

            // Long-press → context menu
            this.longPressTimer = setTimeout(() => {
                this.longPressTriggered = true;
                contextMenu.handleNodeContextMenu({
                    preventDefault: () => {},
                    stopPropagation: () => {},
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    target: target
                });
            }, 500);

        } else if (connEl) {
            // Touching a connection
            e.preventDefault();

            // Long-press → context menu
            this.longPressTimer = setTimeout(() => {
                this.longPressTriggered = true;
                contextMenu.handleConnectionContextMenu({
                    preventDefault: () => {},
                    stopPropagation: () => {},
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    target: target
                });
            }, 500);

        } else {
            // Touching empty canvas → pan
            e.preventDefault();
            this.isTouchPanning = true;
            this.panStartTouch = { x: touch.clientX, y: touch.clientY };
            this.panStartOffset = { x: canvas.panX, y: canvas.panY };

            // Long-press on background → canvas context menu
            this.longPressTimer = setTimeout(() => {
                this.longPressTriggered = true;
                this.cancelPan();
                contextMenu.handleCanvasContextMenu({
                    preventDefault: () => {},
                    stopPropagation: () => {},
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    target: target
                });
            }, 600);
        }
    }

    // ─── Touch Move ───────────────────────────────────────────────

    onTouchMove(e) {
        const touches = e.touches;

        // Cancel long-press if finger moved significantly
        if (touches.length === 1 && this.touchStartPos) {
            const dx = touches[0].clientX - this.touchStartPos.x;
            const dy = touches[0].clientY - this.touchStartPos.y;
            if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                this.clearLongPress();
            }
        }

        // ── Pinch-to-zoom ──
        if (this.isPinching && touches.length === 2) {
            e.preventDefault();

            const newDist = this.distance(touches[0], touches[1]);
            const newCenter = this.midpoint(touches[0], touches[1]);

            // Zoom
            const scale = newDist / this.lastPinchDistance;
            const newZoom = clamp(
                canvas.zoom * scale,
                CONFIG.CANVAS.MIN_ZOOM,
                CONFIG.CANVAS.MAX_ZOOM
            );

            const rect = canvas.getSVG().getBoundingClientRect();
            const cx = newCenter.x - rect.left;
            const cy = newCenter.y - rect.top;

            const bx = (cx - canvas.panX) / canvas.zoom;
            const by = (cy - canvas.panY) / canvas.zoom;

            canvas.zoom = newZoom;
            canvas.panX = cx - bx * canvas.zoom;
            canvas.panY = cy - by * canvas.zoom;

            // Two-finger pan
            canvas.panX += newCenter.x - this.lastPinchCenter.x;
            canvas.panY += newCenter.y - this.lastPinchCenter.y;

            canvas.updateTransform();
            canvas.updateStatusBar();

            this.lastPinchDistance = newDist;
            this.lastPinchCenter = newCenter;
            return;
        }

        // ── One-finger pan ──
        if (this.isTouchPanning && touches.length === 1) {
            e.preventDefault();
            const t = touches[0];
            canvas.panX = this.panStartOffset.x + (t.clientX - this.panStartTouch.x);
            canvas.panY = this.panStartOffset.y + (t.clientY - this.panStartTouch.y);
            canvas.updateTransform();
        }
    }

    // ─── Touch End ────────────────────────────────────────────────

    onTouchEnd(e) {
        this.clearLongPress();

        const changed = e.changedTouches;

        // If we were pinching and one finger lifts, switch to panning with remaining finger
        if (this.isPinching) {
            this.isPinching = false;
            if (e.touches.length === 1) {
                this.isTouchPanning = true;
                this.panStartTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                this.panStartOffset = { x: canvas.panX, y: canvas.panY };
            }
            return;
        }

        this.isTouchPanning = false;

        // Only process tap gestures if not from a long-press
        if (this.longPressTriggered || !changed.length || !this.touchStartPos) {
            this.resetTouch();
            return;
        }

        const touch = changed[0];
        const dx = touch.clientX - this.touchStartPos.x;
        const dy = touch.clientY - this.touchStartPos.y;
        const isTap = Math.abs(dx) < 12 && Math.abs(dy) < 12;

        if (!isTap) {
            this.resetTouch();
            return;
        }

        // ── Tap Gestures ──
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        const nodeEl = target ? target.closest('.node') : null;
        const connEl = target ? target.closest('.connection') : null;

        if (nodeEl) {
            const nodeId = nodeEl.dataset.nodeId;
            if (!nodeId) { this.resetTouch(); return; }

            const now = Date.now();

            // Double-tap → edit label
            if (now - this.lastTapTime < 400 && this.lastTapNodeId === nodeId) {
                nodes.startEditingLabel(nodeId);
                this.lastTapTime = 0;
                this.lastTapNodeId = null;
            } else {
                // Single tap → select (or handle connection mode)
                this.lastTapTime = now;
                this.lastTapNodeId = nodeId;

                if (sidebar.isConnectionMode()) {
                    sidebar.handleConnectionModeClick(nodeId);
                } else {
                    stateManager.selectNode(nodeId, false);
                }
            }

        } else if (connEl) {
            const connId = connEl.dataset.connectionId;
            if (connId) {
                stateManager.selectConnection(connId, false);
            }

        } else {
            // Tap on empty canvas → clear selection
            stateManager.clearSelection();
        }

        this.resetTouch();
    }

    onTouchCancel() {
        this.clearLongPress();
        this.isPinching = false;
        this.isTouchPanning = false;
        this.resetTouch();
    }

    // ─── Helpers ──────────────────────────────────────────────────

    clearLongPress() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    cancelPan() {
        this.isTouchPanning = false;
        this.panStartTouch = null;
        this.panStartOffset = null;
    }

    resetTouch() {
        this.touchStartPos = null;
        this.touchStartTarget = null;
    }

    distance(t1, t2) {
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    midpoint(t1, t2) {
        return {
            x: (t1.clientX + t2.clientX) / 2,
            y: (t1.clientY + t2.clientY) / 2
        };
    }
}

export const touchSupport = new TouchSupport();

/**
 * Tutorial Module
 * Provides interactive onboarding and help for new users
 */

import { CONFIG } from '../config.js';
import { eventBus } from './eventBus.js';
import { stateManager } from './stateManager.js';
import { showToast } from '../utils/dom.js';

class Tutorial {
    constructor() {
        this.overlay = null;
        this.currentStep = 0;
        this.isActive = false;
        this.hasSeenTutorial = false;
    }

    /**
     * Initialize tutorial
     */
    init() {
        // Check if user has seen tutorial
        this.hasSeenTutorial = localStorage.getItem('processFlowDesigner_tutorialComplete') === 'true';

        this.createOverlay();
        this.setupEventListeners();

        // Show tutorial for first-time users
        if (!this.hasSeenTutorial) {
            setTimeout(() => this.start(), 1000);
        }
    }

    /**
     * Create tutorial overlay
     */
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'tutorial-overlay';
        this.overlay.className = 'tutorial-overlay';
        this.overlay.innerHTML = `
            <div class="tutorial-content">
                <div class="tutorial-header">
                    <h2 id="tutorial-title">Welcome to Process Flow Designer!</h2>
                    <button class="tutorial-skip" title="Skip tutorial">×</button>
                </div>
                <div class="tutorial-body">
                    <div id="tutorial-message"></div>
                    <div id="tutorial-image"></div>
                </div>
                <div class="tutorial-footer">
                    <div class="tutorial-progress">
                        <span id="tutorial-step">Step 1 of 7</span>
                    </div>
                    <div class="tutorial-buttons">
                        <button class="tutorial-btn tutorial-prev" disabled>← Previous</button>
                        <button class="tutorial-btn tutorial-next">Next →</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(this.overlay);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const skipBtn = this.overlay.querySelector('.tutorial-skip');
        const prevBtn = this.overlay.querySelector('.tutorial-prev');
        const nextBtn = this.overlay.querySelector('.tutorial-next');

        skipBtn.addEventListener('click', () => this.skip());
        prevBtn.addEventListener('click', () => this.prev());
        nextBtn.addEventListener('click', () => this.next());

        // ? key to show help
        document.addEventListener('keydown', (e) => {
            if (e.key === '?' && !this.isActive) {
                e.preventDefault();
                this.showKeyboardShortcuts();
            }
        });
    }

    /**
     * Tutorial steps
     */
    getSteps() {
        return [
            {
                title: 'Welcome to Process Flow Designer! 👋',
                message: `
                    <p><strong>Create professional workflow diagrams</strong> with ease!</p>
                    <p>This quick tutorial will show you the basics. Let's get started!</p>
                    <ul class="tutorial-features">
                        <li>✅ Drag-and-drop nodes</li>
                        <li>✅ Connect workflows</li>
                        <li>✅ Auto-layout tools</li>
                        <li>✅ Export & save</li>
                    </ul>
                `,
                highlight: null
            },
            {
                title: 'Step 1: Node Palette 🎨',
                message: `
                    <p><strong>Choose from 11 professional node types</strong></p>
                    <p>The sidebar shows all available nodes organized by category:</p>
                    <ul class="tutorial-list">
                        <li><strong>Flow Control</strong> - Start, End, Decision, Merge</li>
                        <li><strong>Processes</strong> - Task, Process, Manual, Delay</li>
                        <li><strong>Data</strong> - Database, Document</li>
                        <li><strong>Annotation</strong> - Comments and notes</li>
                    </ul>
                    <p class="tutorial-tip">💡 <strong>Tip:</strong> Click category headers to expand/collapse</p>
                `,
                highlight: '#sidebar'
            },
            {
                title: 'Step 2: Add Nodes 🎯',
                message: `
                    <p><strong>Drag nodes onto the canvas</strong></p>
                    <p>Simply drag any node from the palette to the canvas to add it to your workflow.</p>
                    <div class="tutorial-action">
                        <p>Try it now:</p>
                        <ol>
                            <li>Find the <strong>Start</strong> node (green circle)</li>
                            <li>Click and drag it to the canvas</li>
                            <li>Release to place it</li>
                        </ol>
                    </div>
                    <p class="tutorial-tip">💡 <strong>Tip:</strong> Double-click node labels to edit them</p>
                `,
                highlight: '.palette-node'
            },
            {
                title: 'Step 3: Create Connections 🔗',
                message: `
                    <p><strong>Connect nodes to create your workflow</strong></p>
                    <p>Two easy ways to connect:</p>
                    <ol class="tutorial-list">
                        <li><strong>Drag Method:</strong> Click and drag from one node to another</li>
                        <li><strong>Connection Tool:</strong> Click the Connect button, then click two nodes</li>
                    </ol>
                    <p class="tutorial-tip">💡 <strong>Tip:</strong> Click connections to edit style, color, and label</p>
                `,
                highlight: '#connection-tool'
            },
            {
                title: 'Step 4: Edit Properties ⚙️',
                message: `
                    <p><strong>Customize nodes and connections</strong></p>
                    <p>When you select something, its properties panel appears:</p>
                    <ul class="tutorial-list">
                        <li><strong>Nodes:</strong> Change type, size, position, lock state</li>
                        <li><strong>Connections:</strong> Change style, color, add labels</li>
                    </ul>
                    <p class="tutorial-tip">💡 <strong>Tip:</strong> Press <kbd>P</kbd> to open properties panel</p>
                `,
                highlight: null
            },
            {
                title: 'Step 5: Auto-Layout & Tools 📐',
                message: `
                    <p><strong>Organize your workflow automatically</strong></p>
                    <p>Use powerful layout tools:</p>
                    <ul class="tutorial-list">
                        <li><strong>Auto-Layout:</strong> Click the 📐 button for instant organization</li>
                        <li><strong>Align & Distribute:</strong> Right-click canvas for options</li>
                        <li><strong>Fit to Screen:</strong> Press <kbd>F</kbd> to zoom perfectly</li>
                    </ul>
                    <p class="tutorial-tip">💡 <strong>Tip:</strong> Right-click anywhere for context menus</p>
                `,
                highlight: '#btn-auto-layout'
            },
            {
                title: 'Step 6: Save & Export 💾',
                message: `
                    <p><strong>Save your work and share it</strong></p>
                    <p>Multiple export options:</p>
                    <ul class="tutorial-list">
                        <li><strong>Auto-Save:</strong> Works automatically every 5 seconds</li>
                        <li><strong>JSON Export:</strong> Save and reload later</li>
                        <li><strong>PNG Export:</strong> Create images for presentations</li>
                    </ul>
                    <p class="tutorial-tip">💡 <strong>Tip:</strong> Press <kbd>Ctrl+S</kbd> to save anytime</p>
                `,
                highlight: '#btn-save'
            },
            {
                title: 'You\'re Ready! 🎉',
                message: `
                    <p><strong>Start creating amazing workflows!</strong></p>
                    <div class="tutorial-quick-reference">
                        <h4>Quick Reference:</h4>
                        <ul>
                            <li><kbd>?</kbd> - Show keyboard shortcuts</li>
                            <li><kbd>F</kbd> - Fit to screen</li>
                            <li><kbd>Ctrl+Z</kbd> - Undo</li>
                            <li><kbd>Ctrl+D</kbd> - Duplicate</li>
                            <li>Right-click - Context menus</li>
                        </ul>
                    </div>
                    <p class="tutorial-tip">💡 You can restart this tutorial anytime from the Help menu</p>
                `,
                highlight: null
            }
        ];
    }

    /**
     * Start tutorial
     */
    start() {
        this.currentStep = 0;
        this.isActive = true;
        this.overlay.classList.add('active');
        this.showStep(0);
    }

    /**
     * Show specific step
     */
    showStep(stepIndex) {
        const steps = this.getSteps();
        if (stepIndex < 0 || stepIndex >= steps.length) return;

        this.currentStep = stepIndex;
        const step = steps[stepIndex];

        // Update content
        this.overlay.querySelector('#tutorial-title').textContent = step.title;
        this.overlay.querySelector('#tutorial-message').innerHTML = step.message;
        this.overlay.querySelector('#tutorial-step').textContent = `Step ${stepIndex + 1} of ${steps.length}`;

        // Update buttons
        const prevBtn = this.overlay.querySelector('.tutorial-prev');
        const nextBtn = this.overlay.querySelector('.tutorial-next');

        prevBtn.disabled = stepIndex === 0;
        nextBtn.textContent = stepIndex === steps.length - 1 ? 'Finish ✓' : 'Next →';

        // Highlight element
        this.removeHighlight();
        if (step.highlight) {
            this.highlightElement(step.highlight);
        }
    }

    /**
     * Next step
     */
    next() {
        const steps = this.getSteps();
        if (this.currentStep < steps.length - 1) {
            this.showStep(this.currentStep + 1);
        } else {
            this.complete();
        }
    }

    /**
     * Previous step
     */
    prev() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }

    /**
     * Skip tutorial
     */
    skip() {
        if (confirm('Skip the tutorial? You can restart it anytime from the Help menu.')) {
            this.complete();
        }
    }

    /**
     * Complete tutorial
     */
    complete() {
        this.isActive = false;
        this.overlay.classList.remove('active');
        this.removeHighlight();
        localStorage.setItem('processFlowDesigner_tutorialComplete', 'true');
        this.hasSeenTutorial = true;
        showToast('Tutorial complete! Press ? for keyboard shortcuts', 'success');
    }

    /**
     * Highlight element
     */
    highlightElement(selector) {
        const element = document.querySelector(selector);
        if (!element) return;

        element.classList.add('tutorial-highlight');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /**
     * Remove highlight
     */
    removeHighlight() {
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
    }

    /**
     * Show keyboard shortcuts overlay
     */
    showKeyboardShortcuts() {
        const shortcutsOverlay = document.createElement('div');
        shortcutsOverlay.className = 'shortcuts-overlay';
        shortcutsOverlay.innerHTML = `
            <div class="shortcuts-content">
                <div class="shortcuts-header">
                    <h2>⌨️ Keyboard Shortcuts</h2>
                    <button class="shortcuts-close">×</button>
                </div>
                <div class="shortcuts-body">
                    <div class="shortcuts-column">
                        <h3>File Operations</h3>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>N</kbd>
                            <span>New workflow</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>O</kbd>
                            <span>Open workflow</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>S</kbd>
                            <span>Save workflow</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>E</kbd>
                            <span>Export JSON</span>
                        </div>

                        <h3>Editing</h3>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>Z</kbd>
                            <span>Undo</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>Y</kbd>
                            <span>Redo</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Delete</kbd>
                            <span>Delete selected</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>D</kbd>
                            <span>Duplicate</span>
                        </div>
                    </div>

                    <div class="shortcuts-column">
                        <h3>Selection</h3>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>A</kbd>
                            <span>Select all</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Shift</kbd> + <kbd>Click</kbd>
                            <span>Multi-select</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Escape</kbd>
                            <span>Clear selection</span>
                        </div>

                        <h3>View</h3>
                        <div class="shortcut-item">
                            <kbd>+</kbd>
                            <span>Zoom in</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>-</kbd>
                            <span>Zoom out</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>0</kbd>
                            <span>Reset zoom</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>1</kbd> - <kbd>4</kbd>
                            <span>Quick zoom</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>F</kbd>
                            <span>Fit to screen</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>H</kbd>
                            <span>Toggle grid</span>
                        </div>
                    </div>

                    <div class="shortcuts-column">
                        <h3>Advanced</h3>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>G</kbd>
                            <span>Create group</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>L</kbd>
                            <span>Toggle lock</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>M</kbd>
                            <span>Toggle metrics</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>P</kbd>
                            <span>Properties panel</span>
                        </div>

                        <h3>Help</h3>
                        <div class="shortcut-item">
                            <kbd>?</kbd>
                            <span>Show shortcuts</span>
                        </div>
                        <div class="shortcut-item">
                            Right-click
                            <span>Context menus</span>
                        </div>
                        <div class="shortcut-item">
                            Double-click
                            <span>Edit labels</span>
                        </div>
                    </div>
                </div>
                <div class="shortcuts-footer">
                    <p class="shortcuts-tip">💡 Press <kbd>?</kbd> anytime to show this help</p>
                </div>
            </div>
        `;

        document.body.appendChild(shortcutsOverlay);

        // Close button
        const closeBtn = shortcutsOverlay.querySelector('.shortcuts-close');
        closeBtn.addEventListener('click', () => {
            shortcutsOverlay.remove();
        });

        // Close on click outside
        shortcutsOverlay.addEventListener('click', (e) => {
            if (e.target === shortcutsOverlay) {
                shortcutsOverlay.remove();
            }
        });

        // Close on Escape
        const closeOnEscape = (e) => {
            if (e.key === 'Escape') {
                shortcutsOverlay.remove();
                document.removeEventListener('keydown', closeOnEscape);
            }
        };
        document.addEventListener('keydown', closeOnEscape);
    }

    /**
     * Restart tutorial
     */
    restart() {
        this.hasSeenTutorial = false;
        localStorage.removeItem('processFlowDesigner_tutorialComplete');
        this.start();
    }
}

// Create and export singleton instance
export const tutorial = new Tutorial();

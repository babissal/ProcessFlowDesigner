/**
 * Themes Module
 * Handles dark mode and theme switching
 */

import { CONFIG } from '../config.js';
import { eventBus } from './eventBus.js';
import { stateManager } from './stateManager.js';
import { showToast } from '../utils/dom.js';

class Themes {
    constructor() {
        this.currentTheme = 'light';
        this.themes = {
            light: {
                '--background-color': '#f5f5f5',
                '--surface-color': '#ffffff',
                '--border-color': '#e0e0e0',
                '--text-primary': '#212121',
                '--text-secondary': '#757575',
                '--canvas-bg': '#fafafa',
                '--grid-color': '#e0e0e0',
                '--shadow': '0 2px 4px rgba(0, 0, 0, 0.1)',
                '--shadow-large': '0 4px 8px rgba(0, 0, 0, 0.15)'
            },
            dark: {
                '--background-color': '#1a1a1a',
                '--surface-color': '#2d2d2d',
                '--border-color': '#404040',
                '--text-primary': '#e0e0e0',
                '--text-secondary': '#a0a0a0',
                '--canvas-bg': '#252525',
                '--grid-color': '#404040',
                '--shadow': '0 2px 4px rgba(0, 0, 0, 0.3)',
                '--shadow-large': '0 4px 8px rgba(0, 0, 0, 0.5)'
            }
        };
    }

    /**
     * Initialize themes
     */
    init() {
        // Load saved theme from localStorage
        const savedTheme = localStorage.getItem('processFlowDesigner_theme');
        if (savedTheme && this.themes[savedTheme]) {
            this.currentTheme = savedTheme;
        }

        // Apply theme
        this.applyTheme(this.currentTheme);
    }

    /**
     * Toggle between light and dark themes
     */
    toggle() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    /**
     * Set a specific theme
     */
    setTheme(themeName) {
        if (!this.themes[themeName]) {
            console.error('Theme not found:', themeName);
            return;
        }

        this.currentTheme = themeName;
        this.applyTheme(themeName);

        // Save to localStorage
        localStorage.setItem('processFlowDesigner_theme', themeName);

        // Update state
        stateManager.updateUIState({ theme: themeName });

        showToast(`${themeName === 'dark' ? 'Dark' : 'Light'} mode enabled`, 'success');

        eventBus.emit('theme:changed', { theme: themeName });
    }

    /**
     * Apply theme by setting CSS variables
     */
    applyTheme(themeName) {
        const theme = this.themes[themeName];
        const root = document.documentElement;

        // Apply CSS variables
        Object.entries(theme).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        // Update body class
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${themeName}`);

        // Update canvas background
        const canvasContainer = document.querySelector('.canvas-container');
        if (canvasContainer) {
            canvasContainer.style.backgroundColor = theme['--canvas-bg'];
        }

        // Update grid color
        const grid = document.querySelector('#grid');
        if (grid) {
            const gridPath = grid.querySelector('path');
            if (gridPath) {
                gridPath.setAttribute('stroke', theme['--grid-color']);
            }
        }

    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Check if dark mode is active
     */
    isDarkMode() {
        return this.currentTheme === 'dark';
    }
}

// Create and export singleton instance
export const themes = new Themes();

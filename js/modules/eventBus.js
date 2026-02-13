/**
 * EventBus - Simple pub/sub implementation for decoupled communication
 * Provides a central event system for modules to communicate without direct dependencies
 */

class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Function to call when event is emitted
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }

        this.listeners.get(event).push(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Function to remove
     */
    off(event, callback) {
        if (!this.listeners.has(event)) {
            return;
        }

        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);

        if (index > -1) {
            callbacks.splice(index, 1);
        }

        // Clean up empty listener arrays
        if (callbacks.length === 0) {
            this.listeners.delete(event);
        }
    }

    /**
     * Emit an event with data
     * @param {string} event - Event name
     * @param {*} data - Data to pass to listeners
     */
    emit(event, data) {
        if (!this.listeners.has(event)) {
            return;
        }

        const callbacks = this.listeners.get(event);

        // Create a copy to avoid issues if listeners modify the array
        [...callbacks].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for "${event}":`, error);
            }
        });
    }

    /**
     * Subscribe to an event that will only fire once
     * @param {string} event - Event name
     * @param {Function} callback - Function to call once
     */
    once(event, callback) {
        const onceCallback = (data) => {
            callback(data);
            this.off(event, onceCallback);
        };

        this.on(event, onceCallback);
    }

    /**
     * Remove all listeners for an event (or all events if none specified)
     * @param {string} [event] - Optional event name
     */
    clear(event) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Get count of listeners for an event
     * @param {string} event - Event name
     * @returns {number} Number of listeners
     */
    listenerCount(event) {
        return this.listeners.has(event) ? this.listeners.get(event).length : 0;
    }
}

// Create and export a singleton instance
export const eventBus = new EventBus();

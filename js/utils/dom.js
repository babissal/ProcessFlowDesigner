/**
 * DOM Utilities
 * Helpers for DOM manipulation
 */

/**
 * Create an HTML element with attributes and children
 */
export function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);

    for (const [key, value] of Object.entries(attributes)) {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.substring(2).toLowerCase(), value);
        } else {
            element.setAttribute(key, value);
        }
    }

    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    });

    return element;
}

/**
 * Show a toast notification
 */
export function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = createElement('div', {
        className: `toast toast-${type}`
    }, [message]);

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Show a modal dialog
 */
export function showModal(title, message, onConfirm, onCancel) {
    const overlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');

    if (!overlay) return;

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    overlay.style.display = 'flex';

    // Remove previous listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    // Add new listeners
    newConfirmBtn.addEventListener('click', () => {
        overlay.style.display = 'none';
        if (onConfirm) onConfirm();
    });

    newCancelBtn.addEventListener('click', () => {
        overlay.style.display = 'none';
        if (onCancel) onCancel();
    });

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.style.display = 'none';
            if (onCancel) onCancel();
        }
    });
}

/**
 * Download a file
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Trigger file upload dialog
 */
export function uploadFile(accept = '*', onLoad) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;

    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (onLoad) onLoad(event.target.result, file);
        };
        reader.readAsText(file);
    });

    input.click();
}

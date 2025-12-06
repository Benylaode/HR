// Toast Notification Component

export class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = new Map();
    this.init();
  }

  init() {
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(this.container);
  }

  show(message, type = 'info', options = {}) {
    const toast = this.createToast(message, type, options);
    const id = this.generateId();

    this.toasts.set(id, toast);
    this.container.appendChild(toast.element);

    // Animate in
    requestAnimationFrame(() => {
      toast.element.classList.add('toast-show');
    });

    // Auto remove
    if (options.autoClose !== false) {
      const duration = options.duration || this.getDefaultDuration(type);
      setTimeout(() => this.remove(id), duration);
    }

    return id;
  }

  success(message, options = {}) {
    return this.show(message, 'success', options);
  }

  error(message, options = {}) {
    return this.show(message, 'error', options);
  }

  warning(message, options = {}) {
    return this.show(message, 'warning', options);
  }

  info(message, options = {}) {
    return this.show(message, 'info', options);
  }

  remove(id) {
    const toast = this.toasts.get(id);
    if (!toast) return;

    toast.element.classList.add('toast-hide');

    setTimeout(() => {
      if (toast.element.parentNode) {
        toast.element.parentNode.removeChild(toast.element);
      }
      this.toasts.delete(id);
    }, 300);
  }

  clear() {
    this.toasts.forEach((toast, id) => this.remove(id));
  }

  createToast(message, type, options) {
    const toast = document.createElement('div');
    toast.className = this.getToastClasses(type);

    const icon = this.getIcon(type);
    const progressBar = options.autoClose !== false ?
      `<div class="toast-progress"><div class="toast-progress-bar" style="animation-duration: ${options.duration || this.getDefaultDuration(type)}ms"></div></div>` : '';

    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
        ${options.closable !== false ? '<button class="toast-close" onclick="this.closest(\'.toast\').remove()">&times;</button>' : ''}
      </div>
      ${progressBar}
    `;

    return { element: toast, type, message, options };
  }

  getToastClasses(type) {
    const baseClasses = 'toast min-w-80 max-w-md p-4 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ease-in-out';
    const typeClasses = {
      success: 'bg-green-50 border-green-500 text-green-800',
      error: 'bg-red-50 border-red-500 text-red-800',
      warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
      info: 'bg-blue-50 border-blue-500 text-blue-800',
    };

    return `${baseClasses} ${typeClasses[type] || typeClasses.info}`;
  }

  getIcon(type) {
    const icons = {
      success: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
      error: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>',
      warning: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>',
      info: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>',
    };

    return icons[type] || icons.info;
  }

  getDefaultDuration(type) {
    const durations = {
      success: 5000,
      error: 8000,
      warning: 6000,
      info: 4000,
    };

    return durations[type] || durations.info;
  }

  generateId() {
    return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create singleton instance
export const toast = new ToastManager();

// Convenience functions
export const showToast = (message, type, options) => toast.show(message, type, options);
export const showSuccess = (message, options) => toast.success(message, options);
export const showError = (message, options) => toast.error(message, options);
export const showWarning = (message, options) => toast.warning(message, options);
export const showInfo = (message, options) => toast.info(message, options);

export default ToastManager;
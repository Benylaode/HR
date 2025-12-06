// Loading Spinner Component

export class LoadingSpinner {
  constructor() {
    this.container = null;
    this.spinner = null;
    this.isVisible = false;
  }

  show(message = 'Loading...', options = {}) {
    if (this.isVisible) return;

    this.createSpinner(message, options);
    this.isVisible = true;

    // Animate in
    requestAnimationFrame(() => {
      this.spinner.classList.add('loading-show');
    });
  }

  hide() {
    if (!this.isVisible) return;

    this.spinner.classList.add('loading-hide');

    setTimeout(() => {
      if (this.spinner && this.spinner.parentNode) {
        this.spinner.parentNode.removeChild(this.spinner);
      }
      this.isVisible = false;
    }, 300);
  }

  createSpinner(message, options = {}) {
    this.spinner = document.createElement('div');
    this.spinner.className = this.getSpinnerClasses(options.type);

    const spinnerContent = `
      <div class="loading-backdrop">
        <div class="loading-content">
          <div class="loading-spinner ${options.size || 'medium'}">
            ${this.getSpinnerIcon(options.variant)}
          </div>
          ${message ? `<div class="loading-message">${message}</div>` : ''}
          ${options.showCancel ? '<button class="loading-cancel" onclick="this.closest(\'.loading-spinner-overlay\').remove()">Cancel</button>' : ''}
        </div>
      </div>
    `;

    this.spinner.innerHTML = spinnerContent;
    document.body.appendChild(this.spinner);
  }

  getSpinnerClasses(type) {
    const baseClasses = 'loading-spinner-overlay fixed inset-0 z-50 flex items-center justify-center';

    const typeClasses = {
      fullscreen: 'bg-black bg-opacity-50',
      inline: 'bg-transparent',
      modal: 'bg-black bg-opacity-75',
    };

    return `${baseClasses} ${typeClasses[type] || typeClasses.fullscreen}`;
  }

  getSpinnerIcon(variant) {
    const variants = {
      default: `
        <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      `,
      dots: `
        <div class="loading-dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      `,
      pulse: `
        <div class="loading-pulse">
          <div></div>
          <div></div>
          <div></div>
        </div>
      `,
      bars: `
        <div class="loading-bars">
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
        </div>
      `,
    };

    return variants[variant] || variants.default;
  }

  // Static convenience methods
  static show(message, options) {
    const spinner = new LoadingSpinner();
    spinner.show(message, options);
    return spinner;
  }

  static hide(spinner) {
    if (spinner && spinner.hide) {
      spinner.hide();
    }
  }
}

// Convenience instance
export const loadingSpinner = new LoadingSpinner();

// Convenience functions
export const showLoading = (message, options) => loadingSpinner.show(message, options);
export const hideLoading = () => loadingSpinner.hide();

// Button loading state
export function setButtonLoading(button, loading = true, originalText = '') {
  if (!button) return;

  if (loading) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.innerHTML = `
      <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Loading...
    `;
  } else {
    button.disabled = false;
    button.textContent = button.dataset.originalText || originalText;
  }
}

// Form loading state
export function setFormLoading(form, loading = true) {
  const inputs = form.querySelectorAll('input, button, select, textarea');

  inputs.forEach(input => {
    if (loading) {
      input.disabled = true;
      if (input.type === 'submit' || input.tagName === 'BUTTON') {
        setButtonLoading(input, true);
      }
    } else {
      input.disabled = false;
      if (input.type === 'submit' || input.tagName === 'BUTTON') {
        setButtonLoading(input, false);
      }
    }
  });
}

export default LoadingSpinner;
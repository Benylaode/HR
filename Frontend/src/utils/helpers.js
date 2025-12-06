// Helper Utility Functions

// Date utilities
export const dateUtils = {
  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  },

  formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  },
};

// String utilities
export const stringUtils = {
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  slugify(str) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  },

  truncate(str, length = 100, suffix = '...') {
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  },

  extractNumbers(str) {
    return parseInt(str.replace(/\D/g, '')) || 1;
  },
};

// File utilities
export const fileUtils = {
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  isValidFileType(file, allowedTypes) {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    return allowedTypes.includes(fileExtension);
  },

  isValidFileSize(file, maxSizeInMB = 5) {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  },

  createFilePreview(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};

// Storage utilities
export const storageUtils = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  clear() {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

// Animation utilities
export const animationUtils = {
  fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';

    let start = null;
    function animate(timestamp) {
      if (!start) start = timestamp;
      const progress = timestamp - start;

      element.style.opacity = Math.min(progress / duration, 1);

      if (progress < duration) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  },

  fadeOut(element, duration = 300) {
    let start = null;
    const initialOpacity = element.style.opacity || 1;

    function animate(timestamp) {
      if (!start) start = timestamp;
      const progress = timestamp - start;

      element.style.opacity = Math.max(initialOpacity - (progress / duration), 0);

      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        element.style.display = 'none';
      }
    }

    requestAnimationFrame(animate);
  },

  slideIn(element, direction = 'left', duration = 300) {
    const translate = direction === 'left' ? '-100%' : '100%';
    element.style.transform = `translateX(${translate})`;
    element.style.display = 'block';

    setTimeout(() => {
      element.style.transition = `transform ${duration}ms ease-in-out`;
      element.style.transform = 'translateX(0)';
    }, 10);
  },
};

// Form utilities
export const formUtils = {
  serializeForm(form) {
    const formData = new FormData(form);
    const data = {};

    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    return data;
  },

  resetForm(form) {
    form.reset();

    // Clear custom validation errors
    const errorElements = form.querySelectorAll('.field-error');
    errorElements.forEach(element => element.remove());

    // Clear error classes
    const fieldsWithError = form.querySelectorAll('.border-red-500');
    fieldsWithError.forEach(field => {
      field.classList.remove('border-red-500', 'focus:ring-red-500');
    });
  },

  populateForm(form, data) {
    Object.keys(data).forEach(key => {
      const field = form.querySelector(`[name="${key}"], [id="${key}"]`);
      if (field) {
        if (field.type === 'checkbox') {
          field.checked = data[key];
        } else {
          field.value = data[key];
        }
      }
    });
  },
};

// URL utilities
export const urlUtils = {
  getParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};

    for (const [key, value] of params) {
      result[key] = value;
    }

    return result;
  },

  setParam(key, value) {
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.pushState({}, '', url);
  },

  removeParam(key) {
    const url = new URL(window.location);
    url.searchParams.delete(key);
    window.history.pushState({}, '', url);
  },
};

// Error handling utilities
export const errorUtils = {
  createError(message, code = null, details = null) {
    const error = new Error(message);
    error.code = code;
    error.details = details;
    error.timestamp = new Date().toISOString();
    return error;
  },

  logError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error('Application Error:', errorInfo);

    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // sendToErrorTrackingService(errorInfo);
    }
  },

  getUserFriendlyMessage(error) {
    if (error.message.includes('Failed to fetch')) {
      return 'Network error. Please check your connection and try again.';
    }

    if (error.message.includes('validation')) {
      return 'Please check your input and try again.';
    }

    return error.message || 'An unexpected error occurred. Please try again.';
  },
};

export default {
  dateUtils,
  stringUtils,
  fileUtils,
  storageUtils,
  animationUtils,
  formUtils,
  urlUtils,
  errorUtils,
};
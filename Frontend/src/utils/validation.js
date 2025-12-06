// Validation Utilities

export const validationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  phone: {
    pattern: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
    message: 'Please enter a valid phone number',
  },
  name: {
    minLength: 2,
    maxLength: 100,
    message: 'Name must be between 2 and 100 characters',
  },
  experience: {
    pattern: /^(Entry Level|Mid Level|Senior Level|Executive)$/,
    message: 'Please select a valid experience level',
  },
};

export class FormValidator {
  constructor(form) {
    this.form = form;
    this.errors = new Map();
  }

  validateField(fieldName, value, rules = {}) {
    const errors = [];

    // Required validation
    if (rules.required && (!value || value.trim() === '')) {
      errors.push(`${rules.label || fieldName} is required`);
      return errors;
    }

    // If field is empty and not required, skip other validations
    if (!value || value.trim() === '') {
      return errors;
    }

    // Min length validation
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`${rules.label || fieldName} must be at least ${rules.minLength} characters`);
    }

    // Max length validation
    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`${rules.label || fieldName} must not exceed ${rules.maxLength} characters`);
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(rules.message || `${rules.label || fieldName} is invalid`);
    }

    // Custom validation
    if (rules.validate && typeof rules.validate === 'function') {
      const customError = rules.validate(value);
      if (customError) {
        errors.push(customError);
      }
    }

    return errors;
  }

  validateStep(step) {
    const section = document.getElementById(`section${step}`);
    if (!section) return { isValid: true, errors: [] };

    const requiredFields = section.querySelectorAll('[required]');
    const stepErrors = {};
    let isValid = true;

    requiredFields.forEach(field => {
      const fieldName = field.name || field.id;
      const value = field.value;

      // Get validation rules based on field type
      const rules = this.getValidationRules(field);
      const errors = this.validateField(fieldName, value, rules);

      if (errors.length > 0) {
        stepErrors[fieldName] = errors;
        isValid = false;
        this.showFieldError(field, errors[0]);
      } else {
        this.clearFieldError(field);
      }
    });

    return { isValid, errors: stepErrors };
  }

  getValidationRules(field) {
    const fieldType = field.type || field.tagName.toLowerCase();
    const fieldName = field.name || field.id;

    const rules = {
      required: field.hasAttribute('required'),
      label: field.getAttribute('data-label') || this.formatFieldName(fieldName),
    };

    // Add specific rules based on field name/type
    if (fieldName === 'email') {
      rules.pattern = validationRules.email.pattern;
      rules.message = validationRules.email.message;
    } else if (fieldName === 'phone') {
      rules.pattern = validationRules.phone.pattern;
      rules.message = validationRules.phone.message;
    } else if (fieldName === 'fullName') {
      rules.minLength = validationRules.name.minLength;
      rules.maxLength = validationRules.name.maxLength;
      rules.message = validationRules.name.message;
    } else if (fieldType === 'email') {
      rules.pattern = validationRules.email.pattern;
      rules.message = validationRules.email.message;
    } else if (fieldType === 'tel') {
      rules.pattern = validationRules.phone.pattern;
      rules.message = validationRules.phone.message;
    }

    return rules;
  }

  showFieldError(field, message) {
    field.classList.add('border-red-500', 'focus:ring-red-500');

    // Remove existing error message
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }

    // Add new error message
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error text-red-600 text-sm mt-1';
    errorElement.textContent = message;

    field.parentNode.appendChild(errorElement);
  }

  clearFieldError(field) {
    field.classList.remove('border-red-500', 'focus:ring-red-500');

    // Remove error message
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
      errorElement.remove();
    }
  }

  formatFieldName(fieldName) {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  validateAll(formData) {
    const allErrors = {};
    let isValid = true;

    for (const [key, value] of formData.entries()) {
      const field = document.querySelector(`[name="${key}"], [id="${key}"]`);
      if (field) {
        const rules = this.getValidationRules(field);
        const errors = this.validateField(key, value, rules);

        if (errors.length > 0) {
          allErrors[key] = errors;
          isValid = false;
          this.showFieldError(field, errors[0]);
        } else {
          this.clearFieldError(field);
        }
      }
    }

    return { isValid, errors: allErrors };
  }
}

export default FormValidator;
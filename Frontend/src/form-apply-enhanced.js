// Enhanced Form Application with Improved Architecture

import './style-pro.css';
import { createIcons } from 'lucide';

// Import modules
import { apiService } from './services/api.js';
import { FormValidator } from './utils/validation.js';
import { showToast, showSuccess, showError, showWarning, showInfo } from './components/Toast.js';
import { showLoading, hideLoading, setButtonLoading, setFormLoading } from './components/LoadingSpinner.js';
import {
  dateUtils,
  stringUtils,
  fileUtils,
  storageUtils,
  formUtils,
  errorUtils
} from './utils/helpers.js';

class ApplicationForm {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.validator = null;
    this.jobs = [];
    this.selectedJobId = null;
    this.formData = {};

    this.init();
  }

  async init() {
    console.log('🚀 Enhanced Application Form Initializing...');

    // Initialize components
    this.validator = new FormValidator(document.getElementById('applicationForm'));
    createIcons();

    // Check if elements exist
    const elements = this.checkRequiredElements();
    if (!elements.valid) {
      console.error('❌ Missing form elements:', elements.missing);
      showToast('Form initialization failed. Please refresh the page.', 'error');
      return;
    }

    // Load initial data
    await this.loadInitialData();

    // Setup event listeners
    this.setupEventListeners();

    // Initialize first step
    this.updateStep(1);

    console.log('✅ Enhanced Application Form Ready!');
    showToast('Form loaded successfully', 'success', { duration: 3000 });
  }

  checkRequiredElements() {
    const required = [
      'applicationForm',
      'nextBtn',
      'prevBtn',
      'position',
      'progressFill'
    ];

    const missing = [];
    const found = [];

    required.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        found.push(id);
      } else {
        missing.push(id);
      }
    });

    return {
      valid: missing.length === 0,
      missing,
      found
    };
  }

  async loadInitialData() {
    showLoading('Loading available positions...');

    try {
      this.jobs = await apiService.getJobs();
      await this.populateJobSelect();

      // Handle URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const jobId = urlParams.get('jobId');

      if (jobId) {
        this.handleJobSelection(jobId);
      }

      showInfo('Positions loaded successfully', { duration: 2000 });
    } catch (error) {
      console.error('Error loading initial data:', error);
      showError('Failed to load positions. Please try again.');
    } finally {
      hideLoading();
    }
  }

  async populateJobSelect() {
    const positionSelect = document.getElementById('position');
    positionSelect.innerHTML = '<option value="">Select position</option>';

    this.jobs.forEach(job => {
      const option = document.createElement('option');
      option.value = job.id || job._id;
      option.textContent = job.title || job.name;
      option.setAttribute('data-job-id', job.id || job._id);
      positionSelect.appendChild(option);
    });
  }

  handleJobSelection(jobId) {
    const positionSelect = document.getElementById('position');
    positionSelect.value = jobId;

    // Extract numeric ID for compatibility
    this.selectedJobId = stringUtils.extractNumbers(jobId);

    showToast('Position selected from URL', 'info', { duration: 2000 });
  }

  setupEventListeners() {
    const form = document.getElementById('applicationForm');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const positionSelect = document.getElementById('position');

    // Position change handler
    positionSelect.addEventListener('change', (e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      if (selectedOption && selectedOption.value) {
        this.selectedJobId = stringUtils.extractNumbers(selectedOption.value);
      }
    });

    // Navigation buttons
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.nextStep();
    });

    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.prevStep();
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitApplication();
    });

    // File upload setup
    this.setupFileUpload('cvFile', 'cvUpload', 'cvPreview');

    // Form field real-time validation
    this.setupRealTimeValidation();

    // Keyboard navigation
    this.setupKeyboardNavigation();
  }

  setupRealTimeValidation() {
    const form = document.getElementById('applicationForm');
    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
      input.addEventListener('blur', () => {
        this.validateField(input);
      });

      input.addEventListener('input', () => {
        // Clear error on input
        if (input.classList.contains('border-red-500')) {
          this.validator.clearFieldError(input);
        }
      });
    });
  }

  validateField(field) {
    const value = field.value;
    const rules = this.validator.getValidationRules(field);
    const errors = this.validator.validateField(field.name || field.id, value, rules);

    if (errors.length > 0) {
      this.validator.showFieldError(field, errors[0]);
    } else {
      this.validator.clearFieldError(field);
    }
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Enter to submit form
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.submitApplication();
      }

      // Arrow keys for navigation
      if (e.key === 'ArrowRight' && !e.target.matches('input, textarea')) {
        this.nextStep();
      }

      if (e.key === 'ArrowLeft' && !e.target.matches('input, textarea')) {
        this.prevStep();
      }
    });
  }

  nextStep() {
    console.log(`🔄 Moving from step ${this.currentStep} to ${this.currentStep + 1}`);

    const validation = this.validator.validateStep(this.currentStep);

    if (!validation.isValid) {
      showError('Please fill in all required fields before proceeding.');

      // Focus first invalid field
      const firstInvalid = document.querySelector('.border-red-500');
      if (firstInvalid) {
        firstInvalid.focus();
      }
      return;
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.updateStep(this.currentStep);

      // Announce to screen readers
      this.announceToScreenReader(`Step ${this.currentStep} of ${this.totalSteps}`);
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStep(this.currentStep);

      this.announceToScreenReader(`Step ${this.currentStep} of ${this.totalSteps}`);
    }
  }

  updateStep(step) {
    // Update step indicators
    this.updateStepIndicators(step);

    // Update sections
    this.updateSections(step);

    // Update progress bar
    this.updateProgressBar(step);

    // Update buttons
    this.updateButtons(step);

    // Special handling for review step
    if (step === this.totalSteps) {
      this.populateReview();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateStepIndicators(step) {
    for (let i = 1; i <= this.totalSteps; i++) {
      const stepElement = document.getElementById(`step${i}`);

      stepElement.className = 'step';

      if (i < step) {
        stepElement.classList.add('step-completed');
      } else if (i === step) {
        stepElement.classList.add('step-active');
      } else {
        stepElement.classList.add('step-inactive');
      }
    }
  }

  updateSections(step) {
    for (let i = 1; i <= this.totalSteps; i++) {
      const section = document.getElementById(`section${i}`);

      if (i === step) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    }
  }

  updateProgressBar(step) {
    const progress = (step / this.totalSteps) * 100;
    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = `${progress}%`;

    // Update ARIA attributes
    progressFill.setAttribute('aria-valuenow', progress);
    progressFill.setAttribute('aria-valuemin', 0);
    progressFill.setAttribute('aria-valuemax', 100);
  }

  updateButtons(step) {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    prevBtn.style.display = step > 1 ? 'block' : 'none';

    if (step === this.totalSteps) {
      nextBtn.style.display = 'none';
      submitBtn.style.display = 'block';
    } else {
      nextBtn.style.display = 'block';
      submitBtn.style.display = 'none';
    }
  }

  populateReview() {
    const form = document.getElementById('applicationForm');
    const reviewContent = document.getElementById('reviewContent');
    const formData = formUtils.serializeForm(form);

    const sections = [
      {
        title: 'Personal Information',
        fields: [
          { label: 'Full Name', key: 'fullName', icon: '👤' },
          { label: 'Email', key: 'email', icon: '📧' },
          { label: 'Phone', key: 'phone', icon: '📱' },
          { label: 'Date of Birth', key: 'dateOfBirth', icon: '📅' },
          { label: 'Gender', key: 'gender', icon: '⚧' },
          { label: 'Address', key: 'address', icon: '🏠' },
          { label: 'Applied Position', key: 'position', icon: '💼' }
        ]
      },
      {
        title: 'Education',
        fields: [
          { label: 'Education Level', key: 'education', icon: '🎓' },
          { label: 'University', key: 'university', icon: '🏛️' },
          { label: 'Major', key: 'major', icon: '📚' },
          { label: 'Graduation Year', key: 'graduationYear', icon: '📅' },
          { label: 'GPA', key: 'gpa', icon: '📊' }
        ]
      },
      {
        title: 'Experience & Skills',
        fields: [
          { label: 'Experience Level', key: 'experience', icon: '💪' },
          { label: 'Previous Job', key: 'previousJob', icon: '💼' },
          { label: 'Previous Company', key: 'previousCompany', icon: '🏢' },
          { label: 'Skills', key: 'skills', icon: '⚡' },
          { label: 'Expected Salary', key: 'expectedSalary', icon: '💰' }
        ]
      }
    ];

    let html = '';
    sections.forEach(section => {
      html += `
        <div class="mb-6">
          <h4 class="font-medium text-gray-900 mb-3 flex items-center">
            <span class="mr-2">${section.title}</span>
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      `;

      section.fields.forEach(field => {
        const value = formData[field.key];
        if (value) {
          const displayValue = field.key === 'dateOfBirth'
            ? dateUtils.formatDate(value)
            : value;

          html += `
            <div class="flex items-start p-2 bg-gray-50 rounded">
              <span class="mr-2">${field.icon}</span>
              <div>
                <span class="text-sm text-gray-500">${field.label}:</span>
                <p class="text-sm font-medium text-gray-900">${displayValue}</p>
              </div>
            </div>`;
        }
      });

      html += `</div></div>`;
    });

    reviewContent.innerHTML = html;
  }

  async submitApplication() {
    const form = document.getElementById('applicationForm');
    const formData = formUtils.serializeForm(form);

    // Validate all fields
    const validation = this.validator.validateAll(new FormData(form));
    if (!validation.isValid) {
      showError('Please correct the errors before submitting.');
      return;
    }

    // Show loading state
    setFormLoading(form, true);
    showLoading('Submitting your application...');

    try {
      // Prepare candidate data
      const candidateData = this.prepareCandidateData(formData);

      console.log('📤 Submitting application:', candidateData);

      // Submit to API
      const result = await apiService.submitCandidate(candidateData);

      console.log('✅ Application submitted successfully:', result);

      // Show success
      hideLoading();
      setFormLoading(form, false);

      this.showSuccessModal(result);

      // Reset form after a delay
      setTimeout(() => {
        formUtils.resetForm(form);
        this.currentStep = 1;
        this.updateStep(1);
      }, 3000);

    } catch (error) {
      console.error('❌ Error submitting application:', error);

      hideLoading();
      setFormLoading(form, false);

      const friendlyMessage = errorUtils.getUserFriendlyMessage(error);
      showError(friendlyMessage);

      // Log error for debugging
      errorUtils.logError(error, { formData, step: 'submission' });
    }
  }

  prepareCandidateData(formData) {
    return {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      age: dateUtils.calculateAge(formData.dateOfBirth),
      gender: formData.gender,
      address: {
        street: formData.address,
        city: 'Jakarta',
        country: 'Indonesia'
      },
      appliedPosition: formData.position,
      appliedJobId: this.selectedJobId || 1,
      education: {
        level: formData.education,
        university: formData.university,
        major: formData.major,
        graduationYear: formData.graduationYear,
        gpa: formData.gpa
      },
      experience: {
        level: formData.experience,
        previousJob: formData.previousJob,
        previousCompany: formData.previousCompany
      },
      skills: formData.skills,
      expectedSalary: formData.expectedSalary,
      coverLetter: formData.coverLetter
    };
  }

  showSuccessModal(result) {
    const modal = document.getElementById('successModal');

    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('show');

      // Announce to screen readers
      this.announceToScreenReader('Application submitted successfully!');

      // Auto-close after 5 seconds
      setTimeout(() => {
        this.closeSuccessModal();
      }, 5000);
    } else {
      // Fallback to toast notification
      showSuccess('Application submitted successfully!', { duration: 5000 });
    }
  }

  closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  setupFileUpload(inputId, uploadAreaId, previewId) {
    const input = document.getElementById(inputId);
    const uploadArea = document.getElementById(uploadAreaId);
    const preview = document.getElementById(previewId);

    // Click to upload
    uploadArea.addEventListener('click', () => input.click());

    // File selection
    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      this.handleFileSelect(file, preview);
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        input.files = files;
        this.handleFileSelect(files[0], preview);
      }
    });
  }

  handleFileSelect(file, preview) {
    if (!file) {
      preview.classList.add('hidden');
      return;
    }

    // Validate file
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const maxSizeMB = 5;

    if (!fileUtils.isValidFileType(file, allowedTypes)) {
      showError('Please upload a PDF, DOC, or DOCX file.');
      return;
    }

    if (!fileUtils.isValidFileSize(file, maxSizeMB)) {
      showError(`File size must be less than ${maxSizeMB}MB.`);
      return;
    }

    // Show preview
    preview.classList.remove('hidden');
    const fileName = preview.querySelector('#cvFileName');
    if (fileName) {
      fileName.textContent = `${file.name} (${fileUtils.formatFileSize(file.size)})`;
    }

    showInfo(`File "${file.name}" uploaded successfully`, { duration: 2000 });
  }

  removeFile(inputId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(inputId + 'Preview');

    input.value = '';
    preview.classList.add('hidden');

    showInfo('File removed', { duration: 2000 });
  }

  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }
}

// Initialize form when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.applicationForm = new ApplicationForm();
});

// Global function for modal close (called from HTML)
window.closeModal = function() {
  if (window.applicationForm) {
    window.applicationForm.closeSuccessModal();
  }
};

window.removeFile = function(inputId) {
  if (window.applicationForm) {
    window.applicationForm.removeFile(inputId);
  }
};

export default ApplicationForm;
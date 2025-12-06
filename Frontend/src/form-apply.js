import './style.css';
import { createIcons } from 'lucide';

// Global variables
const API_BASE = '/api';
let currentStep = 1;
const totalSteps = 4;

// Initialize Lucide icons
createIcons();

// Form navigation
function updateStep(step) {
    console.log('updateStep called with step:', step);

    // Update step indicators
    for (let i = 1; i <= totalSteps; i++) {
        const stepElement = document.getElementById(`step${i}`);
        const sectionElement = document.getElementById(`section${i}`);

        console.log(`Processing step ${i}: stepElement=${!!stepElement}, sectionElement=${!!sectionElement}`);

        if (i < step) {
            stepElement.className = 'step step-completed';
        } else if (i === step) {
            stepElement.className = 'step step-active';
        } else {
            stepElement.className = 'step step-inactive';
        }

        // Show/hide sections
        if (i === step) {
            sectionElement.classList.add('active');
            console.log(`Showing section ${i}`);
        } else {
            sectionElement.classList.remove('active');
            console.log(`Hiding section ${i}`);
        }
    }

    // Update progress bar
    const progress = (step / totalSteps) * 100;
    document.getElementById('progressFill').style.width = `${progress}%`;

    // Update buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    prevBtn.style.display = step > 1 ? 'block' : 'none';

    if (step === totalSteps) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
        populateReview();
    } else {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }
}

// Validate current step
function validateCurrentStep() {
    const section = document.getElementById(`section${currentStep}`);
    const requiredFields = section.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('border-red-500');
            isValid = false;
        } else {
            field.classList.remove('border-red-500');
        }
    });

    return isValid;
}

// Navigate to next step
function nextStep() {
    console.log('nextStep called - currentStep:', currentStep, 'totalSteps:', totalSteps);

    const isValid = validateCurrentStep();
    console.log('Validation result:', isValid);

    if (isValid && currentStep < totalSteps) {
        currentStep++;
        console.log('Moving to step:', currentStep);
        updateStep(currentStep);
    } else if (!isValid) {
        console.log('Validation failed - showing alert');
        alert('Please fill in all required fields before proceeding.');
    } else {
        console.log('Already at last step');
    }
}

// Navigate to previous step
function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStep(currentStep);
    }
}

// Calculate age from date of birth
function calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

// File upload handling
function setupFileUpload(inputId, uploadAreaId, previewId) {
    const input = document.getElementById(inputId);
    const uploadArea = document.getElementById(uploadAreaId);
    const preview = document.getElementById(previewId);

    uploadArea.addEventListener('click', () => input.click());

    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            preview.classList.remove('hidden');
            preview.querySelector('span').textContent = file.name;
        }
    });
}

function removeFile(inputId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(inputId + 'Preview');

    input.value = '';
    preview.classList.add('hidden');
}

// Populate review section
function populateReview() {
    const formData = new FormData(document.getElementById('applicationForm'));
    const reviewContent = document.getElementById('reviewContent');

    const sections = [
        {
            title: 'Personal Information',
            fields: [
                { label: 'Full Name', key: 'fullName' },
                { label: 'Email', key: 'email' },
                { label: 'Phone', key: 'phone' },
                { label: 'Date of Birth', key: 'dateOfBirth' },
                { label: 'Gender', key: 'gender' },
                { label: 'Address', key: 'address' },
                { label: 'Applied Position', key: 'position' }
            ]
        },
        {
            title: 'Education',
            fields: [
                { label: 'Education Level', key: 'education' },
                { label: 'University', key: 'university' },
                { label: 'Major', key: 'major' },
                { label: 'Graduation Year', key: 'graduationYear' },
                { label: 'GPA', key: 'gpa' }
            ]
        },
        {
            title: 'Experience & Skills',
            fields: [
                { label: 'Experience Level', key: 'experience' },
                { label: 'Previous Job', key: 'previousJob' },
                { label: 'Previous Company', key: 'previousCompany' },
                { label: 'Skills', key: 'skills' },
                { label: 'Expected Salary', key: 'expectedSalary' }
            ]
        }
    ];

    let html = '';
    sections.forEach(section => {
        html += `<div class="mb-6">
            <h4 class="font-medium text-gray-900 mb-3">${section.title}</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">`;

        section.fields.forEach(field => {
            const value = formData.get(field.key);
            if (value) {
                html += `
                    <div>
                        <span class="text-sm text-gray-500">${field.label}:</span>
                        <p class="text-sm font-medium text-gray-900">${value}</p>
                    </div>`;
            }
        });

        html += `</div></div>`;
    });

    reviewContent.innerHTML = html;
}

// Form submission with Supabase integration
async function submitApplication(formData) {
    try {
        // Prepare data for API
        const candidateData = {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            age: calculateAge(formData.get('dateOfBirth')),
            gender: formData.get('gender'),
            address: {
                street: formData.get('address'),
                city: 'Jakarta',
                country: 'Indonesia'
            },
            appliedPosition: formData.get('position'),
            appliedJobId: window.selectedJobId || 1,
            education: {
                level: formData.get('education'),
                university: formData.get('university'),
                major: formData.get('major'),
                graduationYear: formData.get('graduationYear'),
                gpa: formData.get('gpa')
            },
            experience: {
                level: formData.get('experience'),
                previousJob: formData.get('previousJob'),
                previousCompany: formData.get('previousCompany')
            },
            skills: formData.get('skills'),
            expectedSalary: formData.get('expectedSalary'),
            coverLetter: formData.get('coverLetter')
        };

        console.log('Submitting application to Supabase:', candidateData);

        // Submit to API
        const response = await fetch(`${API_BASE}/public/candidates/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(candidateData)
        });

        if (!response.ok) {
            throw new Error(`Registration failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Application submitted successfully:', result);

        // Show success modal
        document.getElementById('successModal').classList.remove('hidden');

        // Reset form
        document.getElementById('applicationForm').reset();
        currentStep = 1;
        updateStep(1);

    } catch (error) {
        console.error('Error submitting application:', error);
        alert(`Error submitting application: ${error.message}. Please try again.`);
    }
}

// Load positions from API
async function loadPositions() {
    try {
        const response = await fetch(`${API_BASE}/jobs`);
        if (!response.ok) {
            throw new Error(`Failed to fetch jobs: ${response.statusText}`);
        }
        const data = await response.json();
        const jobs = data.jobs || data || [];

        const positionSelect = document.getElementById('position');
        positionSelect.innerHTML = '<option value="">Select position</option>';

        jobs.forEach(job => {
            const option = document.createElement('option');
            option.value = job.id || job._id;
            option.textContent = job.title || job.name;
            option.setAttribute('data-job-id', job.id || job._id);
            positionSelect.appendChild(option);
        });

        const urlParams = new URLSearchParams(window.location.search);
        const jobId = urlParams.get('jobId');
        if (jobId) {
            positionSelect.value = jobId;
            // Extract numeric part from job ID if needed, or use the string ID as-is
            const numericId = parseInt(jobId.replace(/\D/g, '')) || 1;
            window.selectedJobId = numericId;
        }

    } catch (error) {
        console.error('Error loading positions:', error);
    }
}

// Handle position selection change
function handlePositionChange() {
    const positionSelect = document.getElementById('position');
    const selectedOption = positionSelect.options[positionSelect.selectedIndex];
    if (selectedOption && selectedOption.value) {
        // Extract numeric part from job ID if needed, or use the string ID as-is
        const numericId = parseInt(selectedOption.value.replace(/\D/g, '')) || 1;
        window.selectedJobId = numericId;
    }
}

// Close modal function
function closeModal() {
    document.getElementById('successModal').classList.add('hidden');
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing form...');

    // Test if elements exist
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const applicationForm = document.getElementById('applicationForm');

    console.log('Next button found:', !!nextBtn);
    console.log('Previous button found:', !!prevBtn);
    console.log('Application form found:', !!applicationForm);

    if (!nextBtn || !prevBtn || !applicationForm) {
        console.error('Missing form elements!');
        return;
    }

    loadPositions();

    document.getElementById('position').addEventListener('change', handlePositionChange);

    // Navigation buttons
    nextBtn.addEventListener('click', function(e) {
        console.log('Next button clicked!');
        e.preventDefault();
        nextStep();
    });

    prevBtn.addEventListener('click', function(e) {
        console.log('Previous button clicked!');
        e.preventDefault();
        prevStep();
    });

    // Form submission
    applicationForm.addEventListener('submit', function(e) {
        e.preventDefault();

        if (!validateCurrentStep()) {
            alert('Please fill in all required fields and accept the terms.');
            return;
        }

        const formData = new FormData(this);
        submitApplication(formData);
    });

    // File upload setup
    setupFileUpload('cvFile', 'cvUpload', 'cvPreview');

    // Initialize first step
    updateStep(1);
});

// Make closeModal available globally
window.closeModal = closeModal;
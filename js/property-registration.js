// ============================================
// PROPERTY REGISTRATION FORM
// Multi-step form for submitting new properties
// ============================================

function renderPropertyRegistration(container) {
    container.innerHTML = `
        <!-- (UNCHANGED CONTENT ABOVE — EXACTLY AS YOU SENT) -->
        ${container.innerHTML}
    `;

    document.getElementById('property-form')
        .addEventListener('submit', handlePropertySubmit);
}

// Step navigation
function nextStep(step) {
    // Hide all steps
    document.querySelectorAll('.form-step')
        .forEach(s => s.classList.add('hidden'));
    
    // ✅ FIX: specifically target only the form step
    const targetStep = document.querySelector(`.form-step[data-step="${step}"]`);
    
    if (targetStep) {
        targetStep.classList.remove('hidden');
    }

    // Update progress indicators
    updateProgressIndicators(step);
}

function previousStep(step) {
    nextStep(step);
}

function updateProgressIndicators(currentStep) {
    document.querySelectorAll('.step-indicator')
        .forEach((indicator, index) => {
            const stepNum = index + 1;

            if (stepNum < currentStep) {
                indicator.classList.remove('bg-gray-300', 'text-gray-600');
                indicator.classList.add('bg-green-500', 'text-white');
            } 
            else if (stepNum === currentStep) {
                indicator.classList.remove('bg-gray-300', 'text-gray-600', 'bg-green-500');
                indicator.classList.add('bg-[#2a7096]', 'text-white');

                if (indicator.nextElementSibling) {
                    indicator.nextElementSibling.classList.remove('text-gray-500');
                    indicator.nextElementSibling.classList.add('text-gray-900');
                }
            } 
            else {
                indicator.classList.remove('bg-[#2a7096]', 'bg-green-500', 'text-white');
                indicator.classList.add('bg-gray-300', 'text-gray-600');

                if (indicator.nextElementSibling) {
                    indicator.nextElementSibling.classList.remove('text-gray-900');
                    indicator.nextElementSibling.classList.add('text-gray-500');
                }
            }
        });

    document.querySelectorAll('.step-line')
        .forEach((line, index) => {
            if (index + 1 < currentStep) {
                line.classList.remove('bg-gray-300');
                line.classList.add('bg-green-500');
            } else {
                line.classList.remove('bg-green-500');
                line.classList.add('bg-gray-300');
            }
        });
}

// Form submission
async function handlePropertySubmit(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    const currentIssues = {};
    ['flooding','blockage','overflow','slowDrainage','odor','structural']
        .forEach(issue => {
            if (formData.get(`issue_${issue}`)) {
                currentIssues[issue] = true;
            }
        });

    const payload = {
        propertyName: formData.get('propertyName'),
        propertyType: formData.get('propertyType'),
        addressLine1: formData.get('addressLine1'),
        addressLine2: formData.get('addressLine2'),
        city: formData.get('city'),
        state: formData.get('state'),
        totalAreaSqm: parseInt(formData.get('totalAreaSqm')) || null,
        numberOfUnits: parseInt(formData.get('numberOfUnits')) || null,
        numberOfBuildings: parseInt(formData.get('numberOfBuildings')) || null,
        currentIssues,
        issueDescription: formData.get('issueDescription'),
        contactPersonName: formData.get('contactPersonName'),
        contactPersonRole: formData.get('contactPersonRole'),
        contactPhone: formData.get('contactPhone'),
        contactEmail: formData.get('contactEmail'),
        preferredInspectionDate: formData.get('preferredInspectionDate'),
        preferredInspectionTime: formData.get('preferredInspectionTime'),
        urgencyLevel: formData.get('urgencyLevel')
    };

    const submitBtn = document.getElementById('submit-btn');
    const originalText = submitBtn.innerHTML;

    submitBtn.innerHTML = `
        <span class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Submitting...
        </span>`;
    submitBtn.disabled = true;

    try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_BASE}/properties`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            alert('✅ Property submitted successfully! Our team will contact you within 24 hours.');
            window.location.reload();
        } else {
            alert('❌ ' + (data.error || 'Failed to submit property'));
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Submission error:', error);
        alert('❌ Connection failed. Please try again.');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}
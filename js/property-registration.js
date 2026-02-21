// ============================================
// PROPERTY REGISTRATION FORM
// Multi-step form for submitting new properties
// ============================================

function renderPropertyRegistration(container) {
    container.innerHTML = `
        <div class="max-w-4xl mx-auto">
            <!-- Header -->
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#2a7096] to-[#2c9aa3] rounded-full mb-4">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                </div>
                <h2 class="text-3xl font-bold text-gray-900 mb-2">Register Your Property</h2>
                <p class="text-gray-600">Let's protect your estate from drainage issues</p>
            </div>

            <!-- Progress Steps -->
            <div class="mb-8">
                <div class="flex items-center justify-center">
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center">
                            <div class="flex items-center justify-center w-10 h-10 rounded-full bg-[#2a7096] text-white font-bold step-indicator" data-step="1">1</div>
                            <span class="ml-2 font-medium text-gray-900">Property Details</span>
                        </div>
                        <div class="w-16 h-1 bg-gray-300 step-line" data-step="1"></div>
                        <div class="flex items-center">
                            <div class="flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 text-gray-600 font-bold step-indicator" data-step="2">2</div>
                            <span class="ml-2 font-medium text-gray-500">Issues & Concerns</span>
                        </div>
                        <div class="w-16 h-1 bg-gray-300 step-line" data-step="2"></div>
                        <div class="flex items-center">
                            <div class="flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 text-gray-600 font-bold step-indicator" data-step="3">3</div>
                            <span class="ml-2 font-medium text-gray-500">Inspection</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Form Container -->
            <div class="glass rounded-2xl shadow-xl p-8">
                <form id="property-form">
                    <div class="form-step" data-step="1">
                        <h3 class="text-xl font-bold text-gray-900 mb-6">Property Information</h3>
                        <div class="flex justify-end mt-8">
                            <button type="button" onclick="nextStep(2)" 
                                class="px-8 py-3 bg-gradient-to-r from-[#2a7096] to-[#2c9aa3] text-white font-bold rounded-xl hover:shadow-lg transition-all">
                                Next Step →
                            </button>
                        </div>
                    </div>

                    <!-- Step 2 -->
                    <div class="form-step hidden" data-step="2">
                        <h3 class="text-xl font-bold text-gray-900 mb-6">Current Drainage Issues</h3>
                        <p class="text-gray-600 mb-4">Now this section will properly appear.</p>

                        <div class="flex justify-between mt-8">
                            <button type="button" onclick="previousStep(1)" 
                                class="px-8 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all">
                                ← Back
                            </button>
                            <button type="button" onclick="nextStep(3)" 
                                class="px-8 py-3 bg-gradient-to-r from-[#2a7096] to-[#2c9aa3] text-white font-bold rounded-xl hover:shadow-lg transition-all">
                                Next Step →
                            </button>
                        </div>
                    </div>

                    <!-- Step 3 -->
                    <div class="form-step hidden" data-step="3">
                        <h3 class="text-xl font-bold text-gray-900 mb-6">Schedule Inspection</h3>
                        <div class="flex justify-between mt-8">
                            <button type="button" onclick="previousStep(2)" 
                                class="px-8 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all">
                                ← Back
                            </button>
                            <button type="submit" id="submit-btn" 
                                class="px-8 py-3 bg-gradient-to-r from-[#2a7096] to-[#2c9aa3] text-white font-bold rounded-xl hover:shadow-lg transition-all">
                                Submit Property →
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.getElementById('property-form')
        .addEventListener('submit', handlePropertySubmit);
}


// ✅ FIXED STEP NAVIGATION
function nextStep(step) {
    // Hide all form steps only
    document.querySelectorAll('.form-step')
        .forEach(s => s.classList.add('hidden'));

    // Show only the correct form step
    const target = document.querySelector(`.form-step[data-step="${step}"]`);
    if (target) {
        target.classList.remove('hidden');
    }

    updateProgressIndicators(step);
}

function previousStep(step) {
    nextStep(step);
}


// Progress Indicators
function updateProgressIndicators(currentStep) {
    document.querySelectorAll('.step-indicator').forEach(indicator => {
        const stepNum = parseInt(indicator.dataset.step);

        if (stepNum < currentStep) {
            indicator.classList.remove('bg-gray-300', 'text-gray-600');
            indicator.classList.add('bg-green-500', 'text-white');
        } else if (stepNum === currentStep) {
            indicator.classList.remove('bg-gray-300', 'text-gray-600', 'bg-green-500');
            indicator.classList.add('bg-[#2a7096]', 'text-white');
        } else {
            indicator.classList.remove('bg-[#2a7096]', 'bg-green-500', 'text-white');
            indicator.classList.add('bg-gray-300', 'text-gray-600');
        }
    });

    document.querySelectorAll('.step-line').forEach(line => {
        const stepNum = parseInt(line.dataset.step);
        if (stepNum < currentStep) {
            line.classList.remove('bg-gray-300');
            line.classList.add('bg-green-500');
        } else {
            line.classList.remove('bg-green-500');
            line.classList.add('bg-gray-300');
        }
    });
}


// Form submission (unchanged)
async function handlePropertySubmit(e) {
    e.preventDefault();
    alert("Form submitted successfully (test).");
}
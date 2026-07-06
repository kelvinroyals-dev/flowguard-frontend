// ============================================
// PROPERTY REGISTRATION FORM - FIXED
// Multi-step form with dark mode support
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
                <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Register Your Property</h2>
                <p class="text-gray-600 dark:text-gray-400">Let's protect your estate from drainage issues</p>
            </div>

            <!-- Progress Steps -->
            <div class="mb-8">
                <div class="flex items-center justify-center">
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center">
                            <div class="flex items-center justify-center w-10 h-10 rounded-full bg-[#2a7096] text-white font-bold step-indicator" data-step="1">1</div>
                            <span class="ml-2 font-medium text-gray-900 dark:text-gray-100">Property Details</span>
                        </div>
                        <div class="w-16 h-1 bg-gray-300 dark:bg-gray-600 step-line" data-step="1"></div>
                        <div class="flex items-center">
                            <div class="flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 font-bold step-indicator" data-step="2">2</div>
                            <span class="ml-2 font-medium text-gray-500 dark:text-gray-400">Issues & Concerns</span>
                        </div>
                        <div class="w-16 h-1 bg-gray-300 dark:bg-gray-600 step-line" data-step="2"></div>
                        <div class="flex items-center">
                            <div class="flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 font-bold step-indicator" data-step="3">3</div>
                            <span class="ml-2 font-medium text-gray-500 dark:text-gray-400">Inspection</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Form Container -->
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
                <form id="property-form">
                    <!-- Step 1: Property Details -->
                    <div class="form-step" data-step="1">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Property Information</h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Property Name *</label>
                                <input type="text" name="propertyName" required 
                                    placeholder="e.g., Lekki Gardens Phase 1"
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#2c9aa3] focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Property Type *</label>
                                <select name="propertyType" required 
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#2c9aa3] focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                    <option value="">Select type...</option>
                                    <option value="residential_estate">Residential Estate</option>
                                    <option value="commercial_complex">Commercial Complex</option>
                                    <option value="industrial_park">Industrial Park</option>
                                    <option value="mixed_use">Mixed Use</option>
                                    <option value="individual_building">Individual Building</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Total Area (sqm)</label>
                                <input type="number" name="totalAreaSqm" 
                                    placeholder="e.g., 50000"
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#2c9aa3] focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            </div>

                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address *</label>
                                <input type="text" name="addressLine1" required 
                                    placeholder="Street address"
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#2c9aa3] focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 mb-3">
                                <input type="text" name="addressLine2" 
                                    placeholder="Apt, suite, building (optional)"
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#2c9aa3] focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">City *</label>
                                <input type="text" name="city" required value="Lagos"
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#2c9aa3] focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">State *</label>
                                <input type="text" name="state" required value="Lagos"
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#2c9aa3] focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Number of Units</label>
                                <input type="number" name="numberOfUnits" 
                                    placeholder="e.g., 120"
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#2c9aa3] focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Number of Buildings</label>
                                <input type="number" name="numberOfBuildings" 
                                    placeholder="e.g., 15"
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#2c9aa3] focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            </div>
                        </div>

                        <div class="flex justify-end mt-8">
                            <button type="button" onclick="nextStep(2)" 
                                class="px-8 py-3 bg-gradient-to-r from-[#2a7096] to-[#2c9aa3] text-white font-bold rounded-xl hover:shadow-lg transition-all">
                                Next Step →
                            </button>
                        </div>
                    </div>

                    <!-- Step 2: Issues & Concerns -->
                    <div class="form-step hidden" data-step="2">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Issues & Concerns</h3>

                        <div class="mb-6">
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">What drainage issues are you experiencing? (Select all that apply)</label>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <label class="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-[#2c9aa3] transition-all bg-white dark:bg-gray-800">
                                    <input type="checkbox" name="issue_flooding" value="true" class="w-5 h-5 text-[#2c9aa3] rounded focus:ring-[#2c9aa3]">
                                    <span class="ml-3 font-medium text-gray-900 dark:text-gray-100">Flooding</span>
                                </label>
                                <label class="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-[#2c9aa3] transition-all bg-white dark:bg-gray-800">
                                    <input type="checkbox" name="issue_blockage" value="true" class="w-5 h-5 text-[#2c9aa3] rounded focus:ring-[#2c9aa3]">
                                    <span class="ml-3 font-medium text-gray-900 dark:text-gray-100">Blockage</span>
                                </label>
                                <label class="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-[#2c9aa3] transition-all bg-white dark:bg-gray-800">
                                    <input type="checkbox" name="issue_overflow" value="true" class="w-5 h-5 text-[#2c9aa3] rounded focus:ring-[#2c9aa3]">
                                    <span class="ml-3 font-medium text-gray-900 dark:text-gray-100">Overflow</span>
                                </label>
                                <label class="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-[#2c9aa3] transition-all bg-white dark:bg-gray-800">
                                    <input type="checkbox" name="issue_slowDrainage" value="true" class="w-5 h-5 text-[#2c9aa3] rounded focus:ring-[#2c9aa3]">
                                    <span class="ml-3 font-medium text-gray-900 dark:text-gray-100">Slow Drainage</span>
                                </label>
                                <label class="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-[#2c9aa3] transition-all bg-white dark:bg-gray-800">
                                    <input type="checkbox" name="issue_odor" value="true" class="w-5 h-5 text-[#2c9aa3] rounded focus:ring-[#2c9aa3]">
                                    <span class="ml-3 font-medium text-gray-900 dark:text-gray-100">Bad Odor</span>
                                </label>
                                <label class="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-[#2c9aa3] transition-all bg-white dark:bg-gray-800">
                                    <input type="checkbox" name="issue_structural" value="true" class="w-5 h-5 text-[#2c9aa3] rounded focus:ring-[#2c9aa3]">
                                    <span class="ml-3 font-medium text-gray-900 dark:text-gray-100">Structural Damage</span>
                                </label>
                            </div>
                        </div>

                        <div class="mb-6">
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Describe the issues in detail</label>
                            <textarea name="issueDescription" rows="4" 
                                placeholder="Tell us more about the drainage problems you're facing..."
                                class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#2c9aa3] focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"></textarea>
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Urgency Level</label>
                            <select name="urgencyLevel" 
                                class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#2c9aa3] focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                <option value="low">Low - Can wait a few weeks</option>
                                <option value="medium" selected>Medium - Within 1-2 weeks</option>
                                <option value="high">High - Needs attention soon</option>
                                <option value="critical">Critical - Urgent!</option>
                            </select>
                        </div>

                        <div class="flex justify-between mt-8">
                            <button type="button" onclick="previousStep(1)" 
                                class="px-8 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                                ← Back
                            </button>
                            <button type="button" onclick="nextStep(3)" 
                                class="px-8 py-3 bg-gradient-to-r from-[#2a7096] to-[#2c9aa3] text-white font-bold rounded-xl hover:shadow-lg transition-all">
                                Next Step →
                            </button>
                        </div>
                    </div>

                    <!-- Step 3: Inspection & Contact -->
                    <div class="form-step hidden" data-step="3">
                        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Schedule Inspection</h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Preferred Inspection Date</label>
                                <input type="date" name="preferredInspectionDate" 
                                    min="${new Date().toISOString().split('T')[0]}"
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#2c9aa3] focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Preferred Time</label>
                                <select name="preferredInspectionTime" 
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#2c9aa3] focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                    <option value="morning">Morning (8AM - 12PM)</option>
                                    <option value="afternoon">Afternoon (12PM - 4PM)</option>
                                    <option value="evening">Evening (4PM - 6PM)</option>
                                </select>
                            </div>
                        </div>

                        <h4 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Contact Person</h4>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name *</label>
                                <input type="text" name="contactPersonName" required 
                                    placeholder="Estate Manager / Facility Manager"
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#2c9aa3] focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Role</label>
                                <input type="text" name="contactPersonRole" 
                                    placeholder="e.g., Facility Manager"
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#2c9aa3] focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone Number *</label>
                                <input type="tel" name="contactPhone" required 
                                    placeholder="+234-XXX-XXX-XXXX"
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#2c9aa3] focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address *</label>
                                <input type="email" name="contactEmail" required 
                                    placeholder="manager@estate.com"
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-[#2c9aa3] focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            </div>
                        </div>

                        <div class="flex justify-between mt-8">
                            <button type="button" onclick="previousStep(2)" 
                                class="px-8 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                                ← Back
                            </button>
                            <button type="submit" 
                                class="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                                Submit Registration ✓
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Add form submission handler
    document.getElementById('property-form').addEventListener('submit', handleFormSubmit);
}

// ============================================
// STEP NAVIGATION - FIXED querySelector BUG
// ============================================
function nextStep(step) {
    // Hide all form steps
    document.querySelectorAll('.form-step').forEach(s => s.classList.add('hidden'));
    
    // Show target form step - FIXED: Now targets .form-step specifically
    document.querySelector(`.form-step[data-step="${step}"]`).classList.remove('hidden');
    
    // Update progress indicators
    updateProgressIndicators(step);
}

function previousStep(step) {
    // Hide all form steps
    document.querySelectorAll('.form-step').forEach(s => s.classList.add('hidden'));
    
    // Show target form step - FIXED: Now targets .form-step specifically
    document.querySelector(`.form-step[data-step="${step}"]`).classList.remove('hidden');
    
    // Update progress indicators
    updateProgressIndicators(step);
}

function updateProgressIndicators(currentStep) {
    // Update step indicators
    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
        const stepNum = index + 1;
        if (stepNum < currentStep) {
            // Completed step
            indicator.classList.remove('bg-gray-300', 'dark:bg-gray-600', 'text-gray-600', 'dark:text-gray-300');
            indicator.classList.add('bg-green-500', 'text-white');
        } else if (stepNum === currentStep) {
            // Current step
            indicator.classList.remove('bg-gray-300', 'dark:bg-gray-600', 'bg-green-500', 'text-gray-600', 'dark:text-gray-300');
            indicator.classList.add('bg-[#2a7096]', 'text-white');
        } else {
            // Future step
            indicator.classList.remove('bg-green-500', 'bg-[#2a7096]', 'text-white');
            indicator.classList.add('bg-gray-300', 'dark:bg-gray-600', 'text-gray-600', 'dark:text-gray-300');
        }
    });

    // Update step lines
    document.querySelectorAll('.step-line').forEach((line, index) => {
        const stepNum = index + 1;
        if (stepNum < currentStep) {
            line.classList.remove('bg-gray-300', 'dark:bg-gray-600');
            line.classList.add('bg-green-500');
        } else {
            line.classList.remove('bg-green-500');
            line.classList.add('bg-gray-300', 'dark:bg-gray-600');
        }
    });

    // Update step labels
    const labels = document.querySelectorAll('.step-indicator').length;
    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
        const label = indicator.parentElement.querySelector('span');
        if (label) {
            const stepNum = index + 1;
            if (stepNum <= currentStep) {
                label.classList.remove('text-gray-500', 'dark:text-gray-400');
                label.classList.add('text-gray-900', 'dark:text-gray-100');
            } else {
                label.classList.remove('text-gray-900', 'dark:text-gray-100');
                label.classList.add('text-gray-500', 'dark:text-gray-400');
            }
        }
    });
}

// ============================================
// FORM SUBMISSION
// ============================================
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {};
    
    // Collect form data
    formData.forEach((value, key) => {
        if (key.startsWith('issue_')) {
            if (!data.currentIssues) data.currentIssues = {};
            data.currentIssues[key.replace('issue_', '')] = true;
        } else {
            data[key] = value;
        }
    });
    
    console.log('Submitting property:', data);
    
    const token = localStorage.getItem('token');
    
    try {
        await apiRequest('/properties', { method: 'POST', body: data });
        // 201 Created - close modal and reload
        if (typeof Onboarding !== 'undefined' && Onboarding.closeRegistrationModal) {
            Onboarding.closeRegistrationModal();
        }
        if (typeof App !== 'undefined' && App.loadAndRender) App.loadAndRender();
        else location.reload();
    } catch (error) {
        console.error('Submission error:', error);
        const errorMessage = error.message || 'Failed to submit property. Please try again.';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'mt-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl';
        errorDiv.innerHTML = `
            <p class="text-red-800 dark:text-red-200 font-semibold">Registration Failed</p>
            <p class="text-red-600 dark:text-red-400 text-sm mt-1">${errorMessage}</p>
        `;
        const form = document.getElementById('property-form');
        if (form) form.prepend(errorDiv);
    }
}
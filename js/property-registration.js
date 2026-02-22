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
                    <!-- Step 1: Property Details -->
                    <div class="form-step" data-step="1">
                        <h3 class="text-xl font-bold text-gray-900 mb-6">Property Information</h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Property Name *</label>
                                <input type="text" name="propertyName" required 
                                    placeholder="e.g., Lekki Gardens Phase 1"
                                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2c9aa3] focus:outline-none">
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Property Type *</label>
                                <select name="propertyType" required 
                                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2c9aa3] focus:outline-none">
                                    <option value="">Select type...</option>
                                    <option value="residential_estate">Residential Estate</option>
                                    <option value="commercial_complex">Commercial Complex</option>
                                    <option value="industrial_park">Industrial Park</option>
                                    <option value="mixed_use">Mixed Use</option>
                                    <option value="individual_building">Individual Building</option>
                                </select>
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Total Area (sqm)</label>
                                <input type="number" name="totalAreaSqm" 
                                    placeholder="e.g., 50000"
                                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2c9aa3] focus:outline-none">
                            </div>

                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Address *</label>
                                <input type="text" name="addressLine1" required 
                                    placeholder="Street address"
                                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2c9aa3] focus:outline-none mb-3">
                                <input type="text" name="addressLine2" 
                                    placeholder="Apt, suite, building (optional)"
                                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2c9aa3] focus:outline-none">
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">City *</label>
                                <input type="text" name="city" required value="Lagos"
                                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2c9aa3] focus:outline-none">
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">State *</label>
                                <input type="text" name="state" required value="Lagos"
                                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2c9aa3] focus:outline-none">
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Number of Units</label>
                                <input type="number" name="numberOfUnits" 
                                    placeholder="e.g., 120"
                                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2c9aa3] focus:outline-none">
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Number of Buildings</label>
                                <input type="number" name="numberOfBuildings" 
                                    placeholder="e.g., 15"
                                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2c9aa3] focus:outline-none">
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
                        <h3 class="text-xl font-bold text-gray-900 mb-6">Current Drainage Issues</h3>
                        
                        <div class="mb-6">
                            <label class="block text-sm font-semibold text-gray-700 mb-4">What drainage problems are you experiencing? (Select all that apply)</label>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Describe the issues in detail</label>
                            <textarea name="issueDescription" rows="4" 
                                placeholder="Tell us more about the drainage problems you're facing..."
                                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2c9aa3] focus:outline-none"></textarea>
                        </div>

                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Urgency Level</label>
                            <select name="urgencyLevel" 
                                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2c9aa3] focus:outline-none">
                                <option value="low">Low - Can wait a few weeks</option>
                                <option value="medium" selected>Medium - Within 1-2 weeks</option>
                                <option value="high">High - Needs attention soon</option>
                                <option value="critical">Critical - Urgent!</option>
                            </select>
                        </div>

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

                    <!-- Step 3: Inspection & Contact -->
                    <div class="form-step hidden" data-step="3">
                        <h3 class="text-xl font-bold text-gray-900 mb-6">Schedule Inspection</h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Preferred Inspection Date</label>
                                <input type="date" name="preferredInspectionDate" 
                                    min="${new Date().toISOString().split('T')[0]}"
                                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2c9aa3] focus:outline-none">
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Preferred Time</label>
                                <select name="preferredInspectionTime" 
                                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2c9aa3] focus:outline-none">
                                    <option value="morning">Morning (8AM - 12PM)</option>
                                    <option value="afternoon">Afternoon (12PM - 4PM)</option>
                                    <option value="evening">Evening (4PM - 6PM)</option>
                                </select>
                            </div>
                        </div>

                        <h4 class="text-lg font-bold text-gray-900 mb-4">Contact Person</h4>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                                <input type="text" name="contactPersonName" required 
                                    placeholder="Estate Manager / Facility Manager"
                                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2c9aa3] focus:outline-none">
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                                <input type="text" name="contactPersonRole" 
                                    placeholder="e.g., Estate Manager"
                                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2c9aa3] focus:outline-none">
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                                <input type="tel" name="contactPhone" required 
                                    placeholder="+234-XXX-XXX-XXXX"
                                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2c9aa3] focus:outline-none">
                            </div>

                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                                <input type="email" name="contactEmail" required 
                                    placeholder="manager@estate.com"
                                    class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2c9aa3] focus:outline-none">
                            </div>
                        </div>

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

            <!-- Info Card -->
            <div class="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div class="flex gap-4">
                    <svg class="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div>
                        <h4 class="font-bold text-blue-900 mb-1">What happens next?</h4>
                        <p class="text-sm text-blue-800">Once you submit, our team will review your property details and contact you within 24 hours to schedule an inspection. You'll be able to track the entire process from this dashboard.</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Attach form submit handler
    document.getElementById('property-form').addEventListener('submit', handlePropertySubmit);
}

// Step navigation
function nextStep(step) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(s => s.classList.add('hidden'));
    
    // Show target step
    document.querySelector(`[data-step="${step}"]`).classList.remove('hidden');
    
    // Update progress indicators
    updateProgressIndicators(step);
}

function previousStep(step) {
    nextStep(step);
}

function updateProgressIndicators(currentStep) {
    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
        const stepNum = index + 1;
        if (stepNum < currentStep) {
            indicator.classList.remove('bg-gray-300', 'text-gray-600');
            indicator.classList.add('bg-green-500', 'text-white');
        } else if (stepNum === currentStep) {
            indicator.classList.remove('bg-gray-300', 'text-gray-600', 'bg-green-500');
            indicator.classList.add('bg-[#2a7096]', 'text-white');
            indicator.nextElementSibling.classList.remove('text-gray-500');
            indicator.nextElementSibling.classList.add('text-gray-900');
        } else {
            indicator.classList.remove('bg-[#2a7096]', 'bg-green-500', 'text-white');
            indicator.classList.add('bg-gray-300', 'text-gray-600');
            indicator.nextElementSibling.classList.remove('text-gray-900');
            indicator.nextElementSibling.classList.add('text-gray-500');
        }
    });
    
    document.querySelectorAll('.step-line').forEach((line, index) => {
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
    
    // Collect current issues
    const currentIssues = {};
    ['flooding', 'blockage', 'overflow', 'slowDrainage', 'odor', 'structural'].forEach(issue => {
        if (formData.get(`issue_${issue}`)) {
            currentIssues[issue] = true;
        }
    });
    
    // Build request payload
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
    
    // Show loading state
    const submitBtn = document.getElementById('submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="flex items-center justify-center gap-2"><svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>Submitting...</span>';
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
            // Success! Show confirmation and reload
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

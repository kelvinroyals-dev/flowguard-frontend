// ============================================
// PROPERTY DASHBOARD - ALL PHASES
// Displays different UI based on property status
// ============================================

function renderPropertyDashboard(container, property) {
    const status = property.status || 'submitted';
    
    // Determine which phase to show
    switch(status) {
        case 'submitted':
        case 'inspection_scheduled':
            renderInspectionPending(container, property);
            break;
        case 'inspection_ongoing':
            renderInspectionOngoing(container, property);
            break;
        case 'report_ready':
            renderReportReady(container, property);
            break;
        case 'quote_sent':
        case 'payment_pending':
            renderQuoteCustomizer(container, property);
            break;
        case 'payment_completed':
            renderPaymentConfirmed(container, property);
            break;
        case 'active':
            renderActiveDashboard(container, property);
            break;
        default:
            renderInspectionPending(container, property);
    }
}

// ============================================
// PHASE 1-2: INSPECTION PENDING
// ============================================
function renderInspectionPending(container, property) {
    container.innerHTML = `
        <div class="max-w-6xl mx-auto">
            <!-- Success Banner -->
            <div class="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-8 mb-8 animate-fadeIn">
                <div class="flex items-start gap-6">
                    <div class="flex-shrink-0">
                        <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                    </div>
                    <div class="flex-1">
                        <h2 class="text-3xl font-bold text-gray-900 mb-2">Property Submitted Successfully! 🎉</h2>
                        <p class="text-lg text-gray-700 mb-4">Our team is reviewing your submission. You'll receive a call within <strong>24 hours</strong> to schedule your site inspection.</p>
                        <div class="flex gap-4">
                            <span class="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                                <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                </svg>
                                <span class="font-semibold text-gray-900">Submission ID: ${property.property_id}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Main Content -->
                <div class="lg:col-span-2 space-y-8">
                    <!-- Property Summary Card -->
                    <div class="glass rounded-2xl p-8 shadow-lg">
                        <div class="flex items-center justify-between mb-6">
                            <h3 class="text-2xl font-bold text-gray-900">Property Details</h3>
                            <span class="status-badge status-submitted">
                                <span class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                                ${formatStatus(property.status)}
                            </span>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <p class="text-sm font-semibold text-gray-500 mb-1">PROPERTY NAME</p>
                                <p class="text-lg font-bold text-gray-900">${property.property_name}</p>
                            </div>
                            <div>
                                <p class="text-sm font-semibold text-gray-500 mb-1">PROPERTY TYPE</p>
                                <p class="text-lg font-bold text-gray-900">${formatPropertyType(property.property_type)}</p>
                            </div>
                            <div>
                                <p class="text-sm font-semibold text-gray-500 mb-1">LOCATION</p>
                                <p class="text-lg font-bold text-gray-900">${property.city}, ${property.state}</p>
                            </div>
                            <div>
                                <p class="text-sm font-semibold text-gray-500 mb-1">SIZE</p>
                                <p class="text-lg font-bold text-gray-900">${property.total_area_sqm ? property.total_area_sqm.toLocaleString() + ' sqm' : 'N/A'}</p>
                            </div>
                            ${property.number_of_units ? `
                                <div>
                                    <p class="text-sm font-semibold text-gray-500 mb-1">UNITS</p>
                                    <p class="text-lg font-bold text-gray-900">${property.number_of_units}</p>
                                </div>
                            ` : ''}
                            <div>
                                <p class="text-sm font-semibold text-gray-500 mb-1">SUBMITTED</p>
                                <p class="text-lg font-bold text-gray-900">${formatDate(property.created_at)}</p>
                            </div>
                        </div>

                        ${property.issue_description ? `
                            <div class="mt-6 pt-6 border-t border-gray-200">
                                <p class="text-sm font-semibold text-gray-500 mb-2">REPORTED ISSUES</p>
                                <p class="text-gray-700">${property.issue_description}</p>
                            </div>
                        ` : ''}

                        <div class="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                            <button onclick="viewFullPropertyDetails('${property.property_id}')" 
                                class="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">
                                View Full Details
                            </button>
                            <button onclick="editProperty('${property.property_id}')" 
                                class="flex-1 px-6 py-3 border-2 border-[#2c9aa3] text-[#2c9aa3] font-bold rounded-xl hover:bg-[#2c9aa3] hover:text-white transition-all">
                                Edit Information
                            </button>
                        </div>
                    </div>

                    <!-- Progress Timeline -->
                    <div class="glass rounded-2xl p-8 shadow-lg">
                        <h3 class="text-2xl font-bold text-gray-900 mb-8">Progress Timeline</h3>
                        <div class="space-y-8">
                            ${renderTimelineStep('completed', 'Property Submitted', formatDate(property.created_at), 'Your property details have been received')}
                            ${renderTimelineStep('current', 'Inspection Scheduling', 'In Progress', 'Our team will contact you within 24 hours to schedule a convenient time for site inspection')}
                            ${renderTimelineStep('pending', 'Site Inspection', 'Pending', 'Professional assessment of your drainage system')}
                            ${renderTimelineStep('pending', 'Report & Quote', 'Pending', 'Detailed findings and customized service packages')}
                            ${renderTimelineStep('pending', 'Payment & Setup', 'Pending', 'Complete payment and schedule installation')}
                            ${renderTimelineStep('pending', 'System Deployment', 'Pending', 'Sensors installed and monitoring activated')}
                        </div>
                    </div>
                </div>

                <!-- Sidebar -->
                <div class="space-y-6">
                    <!-- Add Another Property -->
                    <button onclick="addAnotherProperty()" 
                        class="w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 font-bold hover:border-[#2c9aa3] hover:text-[#2c9aa3] hover:bg-[#2c9aa3]/5 transition-all flex items-center justify-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        Add Another Property
                    </button>

                    <!-- What's Next Card -->
                    <div class="glass rounded-xl p-6 shadow-lg">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-10 h-10 bg-gradient-to-br from-[#2a7096] to-[#2c9aa3] rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            </div>
                            <h4 class="font-bold text-gray-900 text-lg">What Happens Next?</h4>
                        </div>
                        <ol class="space-y-4">
                            ${renderNextStep(1, 'Team Review', 'Our experts review your property details and drainage concerns')}
                            ${renderNextStep(2, 'We Call You', 'Expect a call within 24 hours to discuss and schedule inspection')}
                            ${renderNextStep(3, 'Site Visit', 'Professional inspection of your drainage infrastructure')}
                            ${renderNextStep(4, 'Get Report', 'Receive detailed findings and customized service packages')}
                            ${renderNextStep(5, 'Approve & Pay', 'Select your preferred packages and complete payment')}
                            ${renderNextStep(6, 'Go Live', 'Sensors installed, monitoring activated!')}
                        </ol>
                    </div>

                    <!-- Contact Support -->
                    <div class="glass rounded-xl p-6 shadow-lg">
                        <h4 class="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <svg class="w-5 h-5 text-[#2a7096]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/>
                            </svg>
                            Need Assistance?
                        </h4>
                        <p class="text-sm text-gray-600 mb-4">Questions about your submission? We're here to help!</p>
                        <div class="space-y-3">
                            <a href="tel:+2348XXXXXXXX" class="flex items-center gap-3 text-sm hover:text-[#2a7096] transition-colors">
                                <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p class="font-semibold text-gray-900">Call Us</p>
                                    <p class="text-gray-600">+234-XXX-XXX-XXXX</p>
                                </div>
                            </a>
                            <a href="mailto:support@flowguard.ng" class="flex items-center gap-3 text-sm hover:text-[#2a7096] transition-colors">
                                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                    </svg>
                                </div>
                                <div>
                                    <p class="font-semibold text-gray-900">Email Us</p>
                                    <p class="text-gray-600">support@flowguard.ng</p>
                                </div>
                            </a>
                        </div>
                    </div>

                    <!-- Estimated Timeline -->
                    <div class="bg-gradient-to-br from-[#e6f3f4] to-[#9acfd3]/20 rounded-xl p-6 border-2 border-[#74bcc2]">
                        <h4 class="font-bold text-gray-900 mb-3">⏱️ Estimated Timeline</h4>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-700">Initial Contact:</span>
                                <span class="font-bold text-gray-900">24 hours</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-700">Inspection:</span>
                                <span class="font-bold text-gray-900">1-3 days</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-700">Report Delivery:</span>
                                <span class="font-bold text-gray-900">2-5 days</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-700">Installation:</span>
                                <span class="font-bold text-gray-900">5-10 days</span>
                            </div>
                            <div class="pt-2 mt-2 border-t border-[#74bcc2] flex justify-between">
                                <span class="font-semibold text-gray-900">Total:</span>
                                <span class="font-bold text-[#2a7096]">2-3 weeks</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <style>
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-fadeIn {
                animation: fadeIn 0.5s ease-out;
            }
        </style>
    `;
}

// Helper: Render timeline step
function renderTimelineStep(state, title, time, description) {
    return `
        <div class="timeline-step">
            <div class="timeline-dot ${state}"></div>
            <div>
                <div class="flex items-center justify-between mb-1">
                    <h4 class="font-bold text-gray-900">${title}</h4>
                    <span class="text-sm ${state === 'completed' ? 'text-green-600 font-semibold' : state === 'current' ? 'text-blue-600 font-semibold' : 'text-gray-400'}">${time}</span>
                </div>
                <p class="text-sm text-gray-600">${description}</p>
            </div>
        </div>
    `;
}

// Helper: Render next step
function renderNextStep(num, title, description) {
    return `
        <li class="flex gap-3">
            <div class="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-[#2a7096] to-[#2c9aa3] rounded-full flex items-center justify-center">
                <span class="text-white text-xs font-bold">${num}</span>
            </div>
            <div>
                <p class="font-semibold text-gray-900 text-sm">${title}</p>
                <p class="text-xs text-gray-600">${description}</p>
            </div>
        </li>
    `;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatPropertyType(type) {
    const types = {
        'residential_estate': 'Residential Estate',
        'commercial_complex': 'Commercial Complex',
        'industrial_park': 'Industrial Park',
        'mixed_use': 'Mixed Use',
        'individual_building': 'Individual Building'
    };
    return types[type] || type;
}

function formatStatus(status) {
    const statuses = {
        'submitted': 'Submitted',
        'inspection_scheduled': 'Inspection Scheduled',
        'inspection_ongoing': 'Inspection Ongoing',
        'report_ready': 'Report Ready',
        'quote_sent': 'Quote Ready',
        'payment_pending': 'Payment Pending',
        'payment_completed': 'Payment Completed',
        'active': 'Active'
    };
    return statuses[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function addAnotherProperty() {
    if (confirm('Start registration for another property?')) {
        window.location.reload();
    }
}

function viewFullPropertyDetails(propertyId) {
    alert('Full property details modal - Coming soon!');
}

function editProperty(propertyId) {
    alert('Edit property form - Coming soon!');
}

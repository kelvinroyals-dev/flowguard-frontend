// ============================================
// ONBOARDING MODULE
// Renders UI for different onboarding states
// ============================================

const Onboarding = (function() {
    const API_BASE = 'https://api.flowguard.ng/api/v1';
    
    // ============================================
    // STATE A: NO PROPERTY - Progress Homepage
    // ============================================
    function renderProgressHomepage(container) {
        const checklist = StateManager.getProgressChecklist();
        const greeting = Auth.getPersonalizedGreeting();
        
        container.innerHTML = `
            <div class="max-w-4xl mx-auto">
                <!-- Welcome Card -->
                <div class="modern-card p-8 mb-8">
                    <h2 class="text-2xl font-bold text-primary mb-2">${greeting}</h2>
                    <p class="text-secondary">Welcome to Flow Guard. Let's protect your estate from drainage issues.</p>
                </div>
                
                <!-- Progress Checklist -->
                <div class="modern-card p-8 mb-8">
                    <h3 class="text-xl font-bold text-primary mb-6">Your Onboarding Progress</h3>
                    <div class="space-y-4">
                        ${checklist.map((step, index) => `
                            <div class="flex items-center gap-4 p-4 rounded-lg transition-all ${
                                step.completed 
                                    ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800' 
                                    : 'bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'
                            }">
                                <div class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    step.completed 
                                        ? 'bg-green-500' 
                                        : index === checklist.findIndex(s => !s.completed) 
                                            ? 'bg-blue-500 animate-pulse' 
                                            : 'bg-gray-300 dark:bg-gray-600'
                                }">
                                    ${step.completed ? `
                                        <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                                        </svg>
                                    ` : `
                                        <span class="text-white font-bold text-lg">${index + 1}</span>
                                    `}
                                </div>
                                <div class="flex-1">
                                    <p class="font-bold ${step.completed ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}">${step.label}</p>
                                    ${!step.completed && index === checklist.findIndex(s => !s.completed) ? `
                                        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Next step</p>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <button onclick="Onboarding.startPropertyRegistration()" class="w-full mt-8 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                        Register Your First Property
                    </button>
                </div>
                
                <!-- Info Banner -->
                <div class="modern-card p-6 border-l-4 border-blue-600">
                    <div class="flex gap-3">
                        <svg class="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <div>
                            <p class="font-semibold text-primary mb-1">What happens after registration?</p>
                            <p class="text-sm text-secondary">Our team will review your submission and contact you within 24 hours to schedule a site inspection. The entire process typically takes 5-7 business days.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ============================================
    // STATE B: SUBMITTED - Inspection Tracker
    // ============================================
    function renderInspectionTracker(container, property) {
        const submittedDate = new Date(property.created_at).toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        container.innerHTML = `
            <div class="max-w-4xl mx-auto">
                <!-- Success Banner -->
                <div class="modern-card p-8 mb-8 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800">
                    <div class="flex items-start gap-4">
                        <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold text-primary mb-2">Property Submitted Successfully! 🎉</h2>
                            <p class="text-secondary">Your property "${property.property_name}" has been submitted. Our team will contact you within 24 hours.</p>
                            <div class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                                <span class="text-sm font-semibold text-gray-600 dark:text-gray-400">Property ID:</span>
                                <span class="text-sm font-bold text-primary font-mono">${property.property_id}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Timeline -->
                    <div class="lg:col-span-2">
                        <div class="modern-card p-8">
                            <h3 class="text-xl font-bold text-primary mb-8">Progress Timeline</h3>
                            
                            <div class="space-y-8">
                                <!-- Step 1: Submitted -->
                                <div class="timeline-step completed">
                                    <div class="timeline-dot completed"></div>
                                    <div>
                                        <h4 class="font-bold text-green-700 dark:text-green-400">Property Submitted</h4>
                                        <p class="text-sm text-secondary mt-1">${submittedDate}</p>
                                        <p class="text-sm text-secondary mt-2">Your estate details have been received and are being reviewed.</p>
                                    </div>
                                </div>
                                
                                <!-- Step 2: Inspection Scheduling -->
                                <div class="timeline-step current">
                                    <div class="timeline-dot current"></div>
                                    <div>
                                        <h4 class="font-bold text-blue-700 dark:text-blue-400">Inspection Scheduling</h4>
                                        <p class="text-sm text-secondary mt-1">In Progress</p>
                                        <p class="text-sm text-secondary mt-2">Our team is reviewing your submission and will contact you within 24 hours to schedule the site inspection.</p>
                                    </div>
                                </div>
                                
                                <!-- Step 3: Site Inspection -->
                                <div class="timeline-step pending">
                                    <div class="timeline-dot pending"></div>
                                    <div>
                                        <h4 class="font-semibold text-gray-500 dark:text-gray-400">Site Inspection</h4>
                                        <p class="text-sm text-secondary mt-1">Pending</p>
                                    </div>
                                </div>
                                
                                <!-- Step 4: Report & Quote -->
                                <div class="timeline-step pending">
                                    <div class="timeline-dot pending"></div>
                                    <div>
                                        <h4 class="font-semibold text-gray-500 dark:text-gray-400">Report & Quote</h4>
                                        <p class="text-sm text-secondary mt-1">Pending</p>
                                    </div>
                                </div>
                                
                                <!-- Step 5: Deployment -->
                                <div class="timeline-step pending">
                                    <div class="timeline-dot pending"></div>
                                    <div>
                                        <h4 class="font-semibold text-gray-500 dark:text-gray-400">System Deployment</h4>
                                        <p class="text-sm text-secondary mt-1">Pending</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Sidebar -->
                    <div class="space-y-6">
                        <!-- Property Details Card -->
                        <div class="modern-card p-6">
                            <h4 class="font-bold text-primary mb-4">Property Details</h4>
                            <div class="space-y-3 text-sm">
                                <div>
                                    <p class="text-gray-600 dark:text-gray-400">Name</p>
                                    <p class="font-semibold text-primary">${property.property_name}</p>
                                </div>
                                <div>
                                    <p class="text-gray-600 dark:text-gray-400">Type</p>
                                    <p class="font-semibold text-primary">${property.property_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                                </div>
                                <div>
                                    <p class="text-gray-600 dark:text-gray-400">Location</p>
                                    <p class="font-semibold text-primary">${property.city}, ${property.state}</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Contact Support Card -->
                        <div class="modern-card p-6">
                            <h4 class="font-bold text-primary mb-4">Need Help?</h4>
                            <p class="text-sm text-secondary mb-4">Our team is here to assist you</p>
                            <div class="space-y-3">
                                <a href="tel:+2348000000000" class="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                    </svg>
                                    +234-800-000-0000
                                </a>
                                <a href="mailto:support@flowguard.ng" class="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                                    </svg>
                                    support@flowguard.ng
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ============================================
    // Helper: Start Property Registration
    // ============================================
    function startPropertyRegistration() {
        const container = document.getElementById('content-dashboard') || document.getElementById('main-content');
        if (container && typeof renderPropertyRegistration === 'function') {
            renderPropertyRegistration(container);
        }
    }
    
    return {
        renderProgressHomepage,
        renderInspectionTracker,
        startPropertyRegistration
    };
})();

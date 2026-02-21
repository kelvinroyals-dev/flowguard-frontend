// ============================================
// ONBOARDING MODULE - FIXED
// Forms appear as modals, dashboard stays visible
// ============================================

const Onboarding = (function() {
    const API_BASE = 'https://api.flowguard.ng/api/v1';
    
    // ============================================
    // STATE A: NO PROPERTY - Dashboard with CTA Card
    // ============================================
    function renderProgressHomepage(container) {
        const greeting = Auth.getPersonalizedGreeting();
        
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Welcome Banner -->
                <div class="modern-card p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-l-4 border-blue-600">
                    <h2 class="text-2xl font-bold text-primary mb-2">${greeting}</h2>
                    <p class="text-secondary">Welcome to Flow Guard. Register your property to get started.</p>
                </div>
                
                <!-- CTA Card -->
                <div class="modern-card p-8 text-center">
                    <div class="max-w-2xl mx-auto">
                        <div class="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full mx-auto mb-6 flex items-center justify-center">
                            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                            </svg>
                        </div>
                        <h3 class="text-2xl font-bold text-primary mb-3">Register Your First Property</h3>
                        <p class="text-secondary mb-8">Complete a quick 3-step form to start protecting your estate from drainage issues.</p>
                        <button onclick="Onboarding.showRegistrationModal()" class="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:shadow-lg transition-all text-lg">
                            Get Started →
                        </button>
                    </div>
                </div>
                
                <!-- Info Grid -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="modern-card p-6">
                        <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                            </svg>
                        </div>
                        <h4 class="font-bold text-primary mb-2">Step 1: Register</h4>
                        <p class="text-sm text-secondary">Submit your property details in minutes</p>
                    </div>
                    <div class="modern-card p-6">
                        <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
                            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                            </svg>
                        </div>
                        <h4 class="font-bold text-primary mb-2">Step 2: Inspection</h4>
                        <p class="text-sm text-secondary">Our team visits your site within 48 hours</p>
                    </div>
                    <div class="modern-card p-6">
                        <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                            </svg>
                        </div>
                        <h4 class="font-bold text-primary mb-2">Step 3: Deploy</h4>
                        <p class="text-sm text-secondary">System goes live and monitoring begins</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ============================================
    // Show Registration Modal
    // ============================================
    function showRegistrationModal() {
        const modal = document.createElement('div');
        modal.id = 'registration-modal';
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full my-8">
                <div class="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">Register Your Property</h2>
                    <button onclick="Onboarding.closeRegistrationModal()" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div id="registration-form-container" class="p-6"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Render form
        const formContainer = document.getElementById('registration-form-container');
        if (typeof renderPropertyRegistration === 'function') {
            renderPropertyRegistration(formContainer);
        }
    }
    
    function closeRegistrationModal() {
        document.getElementById('registration-modal')?.remove();
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
            <div class="space-y-6">
                <!-- Success Banner -->
                <div class="modern-card p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-600">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                        <div>
                            <h2 class="text-xl font-bold text-primary">Property Submitted Successfully!</h2>
                            <p class="text-sm text-secondary mt-1">Submitted on ${submittedDate} • Property ID: ${property.property_id}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Timeline Card -->
                <div class="modern-card p-6">
                    <h3 class="text-lg font-bold text-primary mb-6">Progress Timeline</h3>
                    <div class="space-y-6">
                        <div class="flex gap-4">
                            <div class="flex flex-col items-center">
                                <div class="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                    </svg>
                                </div>
                                <div class="w-0.5 h-full bg-gray-300 dark:bg-gray-600 mt-2"></div>
                            </div>
                            <div class="pb-8">
                                <h4 class="font-bold text-green-700 dark:text-green-400">Submitted</h4>
                                <p class="text-sm text-secondary mt-1">${submittedDate}</p>
                            </div>
                        </div>
                        <div class="flex gap-4">
                            <div class="flex flex-col items-center">
                                <div class="w-10 h-10 rounded-full bg-blue-500 animate-pulse flex items-center justify-center">
                                    <span class="text-white font-bold">2</span>
                                </div>
                                <div class="w-0.5 h-full bg-gray-300 dark:bg-gray-600 mt-2"></div>
                            </div>
                            <div class="pb-8">
                                <h4 class="font-bold text-blue-700 dark:text-blue-400">Scheduling Inspection</h4>
                                <p class="text-sm text-secondary mt-1">In progress - Our team will contact you within 24 hours</p>
                            </div>
                        </div>
                        <div class="flex gap-4">
                            <div class="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                <span class="text-white font-bold">3</span>
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-500 dark:text-gray-400">Site Inspection</h4>
                                <p class="text-sm text-secondary mt-1">Pending</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Property Details Card -->
                <div class="modern-card p-6">
                    <h3 class="text-lg font-bold text-primary mb-4">Property Details</h3>
                    <div class="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p class="text-secondary">Name</p>
                            <p class="font-semibold text-primary">${property.property_name}</p>
                        </div>
                        <div>
                            <p class="text-secondary">Type</p>
                            <p class="font-semibold text-primary">${property.property_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                        </div>
                        <div>
                            <p class="text-secondary">Location</p>
                            <p class="font-semibold text-primary">${property.city}, ${property.state}</p>
                        </div>
                        <div>
                            <p class="text-secondary">Status</p>
                            <span class="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full text-xs font-bold">Pending Inspection</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    function startPropertyRegistration() {
        showRegistrationModal();
    }
    
    return {
        renderProgressHomepage,
        renderInspectionTracker,
        showRegistrationModal,
        closeRegistrationModal,
        startPropertyRegistration
    };
})();

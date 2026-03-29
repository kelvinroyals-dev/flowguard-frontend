// ============================================
// BILLING & SLA TAB MODULE
// Handles Billing tab rendering for all states
// ============================================

const BillingTab = (function() {
    const API_BASE = 'https://api.flowguard.ng/api/v1';
    
    // ============================================
    // REAL DATA - Fetch from API
    // ============================================
    async function render(container, property) {
        container.innerHTML = `
            <div class="flex items-center justify-center py-20">
                <div class="text-center">
                    <svg class="animate-spin h-12 w-12 mx-auto text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <p class="mt-4 text-gray-600 dark:text-gray-400">Loading billing...</p>
                </div>
            </div>
        `;
        
        try {
            const token = Auth.getToken();
            const response = await fetch(`${API_BASE}/billing/${property.property_id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load billing');
            }
            
            const data = await response.json();
            const billing = data.data;
            
            renderBillingContent(container, property, billing);
            
        } catch (error) {
            console.error('Billing load error:', error);
            renderError(container);
        }
    }
    
    // ============================================
    // DEMO MODE - Show demo billing
    // ============================================
    function renderDemo(container, property) {
        const demoBilling = {
            subscription: {
                plan: 'Professional',
                status: 'active',
                amount: 450000,
                currency: 'NGN',
                billing_cycle: 'monthly',
                next_billing_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                started_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
            },
            sla: {
                uptime_guarantee: 98.0,
                current_uptime: 98.7,
                response_time_hours: 2,
                avg_response_hours: 1.5,
                incidents_resolved: 12,
                incidents_total: 12
            },
            payment_history: [
                {
                    invoice_id: 'INV-2026-001',
                    amount: 450000,
                    currency: 'NGN',
                    status: 'paid',
                    paid_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    period: 'February 2026'
                },
                {
                    invoice_id: 'INV-2026-002',
                    amount: 450000,
                    currency: 'NGN',
                    status: 'paid',
                    paid_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
                    period: 'January 2026'
                },
                {
                    invoice_id: 'INV-2025-012',
                    amount: 450000,
                    currency: 'NGN',
                    status: 'paid',
                    paid_at: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
                    period: 'December 2025'
                }
            ]
        };
        
        renderBillingContent(container, property, demoBilling);
    }
    
    // ============================================
    // EMPTY STATE - System not deployed yet
    // ============================================
    function renderEmpty(container, property) {
        container.innerHTML = `
            <div class="max-w-2xl mx-auto py-20 text-center">
                <div class="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <svg class="w-12 h-12 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                    </svg>
                </div>
                <h3 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Billing Coming Soon</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-6">
                    Your billing information and subscription details will be available once <strong>${property.property_name}</strong> is fully deployed and active.
                </p>
                <div class="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6 text-left">
                    <h4 class="font-bold text-green-900 dark:text-green-300 mb-3">What's Included?</h4>
                    <ul class="space-y-2 text-sm text-green-800 dark:text-green-400">
                        <li class="flex items-start gap-2">
                            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                            <span>Transparent pricing and subscription management</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                            <span>Service Level Agreement (SLA) metrics and uptime tracking</span>
                        </li>
                        <li class="flex items-start gap-2">
                            <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                            <span>Payment history and invoice downloads</span>
                        </li>
                    </ul>
                </div>
                <button onclick="toggleDemoMode()" class="mt-8 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                    ️ Preview with Demo Mode
                </button>
            </div>
        `;
    }
    
    // ============================================
    // SHARED RENDERING - Used by both real and demo
    // ============================================
    function renderBillingContent(container, property, billing) {
        const nextBillingDate = billing.subscription.next_billing_date;
        const nextBillingDays = nextBillingDate
            ? Math.ceil((new Date(nextBillingDate) - new Date()) / (1000 * 60 * 60 * 24))
            : null;
        const uptimeStatus = billing.sla.current_uptime >= billing.sla.uptime_guarantee ? 'success' : 'warning';
        const responseStatus = billing.sla.avg_response_hours <= billing.sla.response_time_hours ? 'success' : 'warning';
        
        container.innerHTML = `
            <div class="space-y-6">
                <div>
                    <h2 class="text-2xl font-bold font-space text-primary">Billing & SLA</h2>
                    <p class="text-sm text-secondary mt-1">Subscription and service level agreement for <span class="font-semibold text-primary">${property.property_name}</span></p>
                </div>

                <!-- Current Plan -->
                <div class="modern-card p-6">
                    <div class="flex items-start justify-between mb-6">
                        <div>
                            <h3 class="text-lg font-bold text-primary mb-2">Current Plan</h3>
                            <div class="flex items-center gap-2">
                                <span class="text-3xl font-bold text-primary">${billing.subscription.plan}</span>
                                <span class="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-bold uppercase">${billing.subscription.status}</span>
                            </div>
                        </div>
                        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                            Upgrade Plan
                        </button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Monthly Cost</p>
                            <p class="text-2xl font-bold text-primary">₦${billing.subscription.amount.toLocaleString()}</p>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Next Billing</p>
                            <p class="text-2xl font-bold text-primary">${nextBillingDays !== null ? nextBillingDays + ' days' : 'Not set'}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">${nextBillingDate ? new Date(nextBillingDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' }) : 'No invoice raised yet'}</p>
                        </div>
                        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Member Since</p>
                            <p class="text-2xl font-bold text-primary">${new Date(billing.subscription.started_at).toLocaleDateString('en-NG', { month: 'short', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>

                <!-- SLA Metrics -->
                <div class="modern-card p-6">
                    <h3 class="text-lg font-bold text-primary mb-6">Service Level Agreement</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Uptime -->
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">System Uptime</span>
                                <span class="text-sm font-bold ${uptimeStatus === 'success' ? 'text-green-600' : 'text-yellow-600'}">${billing.sla.current_uptime}%</span>
                            </div>
                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                <div class="bg-green-600 h-3 rounded-full" style="width: ${billing.sla.current_uptime}%"></div>
                            </div>
                            <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">Target: ${billing.sla.uptime_guarantee}%</p>
                        </div>
                        
                        <!-- Response Time -->
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Avg Response Time</span>
                                <span class="text-sm font-bold ${responseStatus === 'success' ? 'text-green-600' : 'text-yellow-600'}">${billing.sla.avg_response_hours}h</span>
                            </div>
                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                <div class="bg-blue-600 h-3 rounded-full" style="width: ${Math.min((billing.sla.response_time_hours / billing.sla.avg_response_hours) * 100, 100)}%"></div>
                            </div>
                            <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">Target: ≤ ${billing.sla.response_time_hours}h</p>
                        </div>
                        
                        <!-- Incidents -->
                        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Incidents Resolved</p>
                            <p class="text-3xl font-bold text-green-600">${billing.sla.incidents_resolved}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">of ${billing.sla.incidents_total} total</p>
                        </div>
                        
                        <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Resolution Rate</p>
                            <p class="text-3xl font-bold text-green-600">${billing.sla.incidents_total > 0 ? Math.round((billing.sla.incidents_resolved / billing.sla.incidents_total) * 100) + '%' : '—'}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">This month</p>
                        </div>
                    </div>
                </div>

                <!-- Payment History -->
                <div class="modern-card p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-bold text-primary">Payment History</h3>
                        <button class="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs font-medium">
                            Download All
                        </button>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Invoice</th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Period</th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Amount</th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Status</th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Date</th>
                                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Action</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                ${billing.payment_history.map(payment => {
                                    const statusClass = payment.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
                                    return `
                                        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td class="px-4 py-3 text-sm font-mono text-gray-900 dark:text-gray-100">${payment.invoice_id}</td>
                                            <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">${payment.period}</td>
                                            <td class="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100">₦${payment.amount.toLocaleString()}</td>
                                            <td class="px-4 py-3">
                                                <span class="inline-block px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
                                                    ${payment.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">${new Date(payment.paid_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                            <td class="px-4 py-3">
                                                <button class="text-blue-600 hover:text-blue-700 text-sm font-medium">Download</button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
    
    function renderError(container) {
        container.innerHTML = `
            <div class="modern-card p-8 text-center">
                <svg class="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Failed to Load Billing</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">Unable to fetch billing data. Please try again.</p>
                <button onclick="location.reload()" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Retry
                </button>
            </div>
        `;
    }
    
    return {
        render,
        renderDemo,
        renderEmpty
    };
})();
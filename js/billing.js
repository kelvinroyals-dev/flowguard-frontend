// ============================================
// BILLING MODULE
// Modular payment configurator with service selection
// ============================================

const Billing = (function() {
    const API_BASE = 'https://api.flowguard.ng/api/v1';
    let selectedServices = [];
    let allServices = [];
    
    async function renderServiceConfigurator(container, property) {
        try {
            const token = Auth.getToken();
            
            // Fetch available services
            const data = await apiRequest(`/properties/${property.property_id}/services`);
            allServices = (data && data.data && data.data.services) || [];
            
            // Pre-select all required services
            selectedServices = allServices.filter(s => s.required).map(s => s.serviceId);
            
            renderConfigurator(container, property, allServices, data.data.summary);
            
        } catch (error) {
            console.error('Failed to load services:', error);
            container.innerHTML = '<div class="text-center text-red-600">Failed to load services</div>';
        }
    }
    
    function renderConfigurator(container, property, services, summary) {
        const categories = ['hardware', 'monitoring', 'software', 'support'];
        const groupedServices = {};
        
        categories.forEach(cat => {
            groupedServices[cat] = services.filter(s => s.category === cat);
        });
        
        container.innerHTML = `
            <div class="max-w-6xl mx-auto">
                <div class="modern-card p-8 mb-8">
                    <h2 class="text-2xl font-bold text-primary mb-2">Customize Your Service Package</h2>
                    <p class="text-secondary">Select the services you need for ${property.property_name}</p>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <!-- Services Selection -->
                    <div class="lg:col-span-2 space-y-6">
                        ${Object.entries(groupedServices).map(([category, categoryServices]) => `
                            <div class="modern-card p-6">
                                <h3 class="text-lg font-bold text-primary mb-4 capitalize">${category} Services</h3>
                                <div class="space-y-4">
                                    ${categoryServices.map(service => renderServiceCard(service)).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- Summary Sidebar -->
                    <div>
                        <div class="modern-card p-6 sticky top-24">
                            <h3 class="text-lg font-bold text-primary mb-6">Cost Summary</h3>
                            
                            <div id="cost-breakdown" class="space-y-4">
                                ${renderCostBreakdown()}
                            </div>
                            
                            <hr class="my-6">
                            
                            <div class="space-y-2 mb-6">
                                <div class="flex justify-between text-sm">
                                    <span class="text-gray-600 dark:text-gray-400">One-Time Setup</span>
                                    <span class="font-bold text-primary" id="total-onetime">₦0</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="font-semibold">Monthly Recurring</span>
                                    <span class="text-xl font-bold text-primary" id="total-monthly">₦0</span>
                                </div>
                            </div>
                            
                            <button onclick="Billing.submitServiceSelection()" class="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                                Continue to Payment
                            </button>
                            
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">You can modify your package after deployment</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Initial calculation
        updateCostSummary();
    }
    
    function renderServiceCard(service) {
        const isSelected = selectedServices.includes(service.serviceId);
        const isRequired = service.required;
        
        return `
            <div class="service-card p-4 rounded-lg border-2 transition-all ${
                isSelected 
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
            }">
                <div class="flex items-start gap-4">
                    <input 
                        type="checkbox" 
                        id="service-${service.serviceId}"
                        ${isSelected ? 'checked' : ''}
                        ${isRequired ? 'disabled' : ''}
                        onchange="Billing.toggleService('${service.serviceId}')"
                        class="w-5 h-5 mt-1 text-blue-600 rounded focus:ring-blue-500 ${isRequired ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
                    >
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <label for="service-${service.serviceId}" class="font-semibold text-gray-900 dark:text-gray-100 cursor-pointer">
                                ${service.name}
                            </label>
                            ${isRequired ? `
                                <span class="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-semibold rounded">
                                    REQUIRED
                                </span>
                            ` : ''}
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">${service.description}</p>
                        <div class="flex items-center gap-4 text-sm">
                            ${service.priceOneTime > 0 ? `
                                <div>
                                    <span class="text-gray-600 dark:text-gray-400">One-time:</span>
                                    <span class="font-bold text-primary ml-1">₦${service.priceOneTime.toLocaleString()}</span>
                                </div>
                            ` : ''}
                            ${service.priceMonthly > 0 ? `
                                <div>
                                    <span class="text-gray-600 dark:text-gray-400">Monthly:</span>
                                    <span class="font-bold text-primary ml-1">₦${service.priceMonthly.toLocaleString()}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    function renderCostBreakdown() {
        const selected = allServices.filter(s => selectedServices.includes(s.serviceId));
        
        if (selected.length === 0) {
            return '<p class="text-sm text-gray-500">No services selected</p>';
        }
        
        return selected.map(service => `
            <div class="flex justify-between text-sm">
                <span class="text-gray-700 dark:text-gray-300">${service.name}</span>
                <span class="font-semibold text-gray-900 dark:text-gray-100">
                    ${service.priceOneTime > 0 ? `₦${service.priceOneTime.toLocaleString()}` : ''}
                    ${service.priceOneTime > 0 && service.priceMonthly > 0 ? ' + ' : ''}
                    ${service.priceMonthly > 0 ? `₦${service.priceMonthly.toLocaleString()}/mo` : ''}
                </span>
            </div>
        `).join('');
    }
    
    function toggleService(serviceId) {
        const service = allServices.find(s => s.serviceId === serviceId);
        
        // Can't toggle required services
        if (service.required) return;
        
        const index = selectedServices.indexOf(serviceId);
        if (index > -1) {
            selectedServices.splice(index, 1);
        } else {
            selectedServices.push(serviceId);
        }
        
        updateCostSummary();
    }
    
    function updateCostSummary() {
        const selected = allServices.filter(s => selectedServices.includes(s.serviceId));
        
        const totalOneTime = selected.reduce((sum, s) => sum + (s.priceOneTime || 0), 0);
        const totalMonthly = selected.reduce((sum, s) => sum + (s.priceMonthly || 0), 0);
        
        const breakdownEl = document.getElementById('cost-breakdown');
        const onetimeEl = document.getElementById('total-onetime');
        const monthlyEl = document.getElementById('total-monthly');
        
        if (breakdownEl) breakdownEl.innerHTML = renderCostBreakdown();
        if (onetimeEl) onetimeEl.textContent = `₦${totalOneTime.toLocaleString()}`;
        if (monthlyEl) monthlyEl.textContent = `₦${totalMonthly.toLocaleString()}`;
    }
    
    async function submitServiceSelection() {
        const property = StateManager.getCurrentProperty();
        const token = Auth.getToken();
        
        try {
            const data = await apiRequest(`/properties/${property.property_id}/select-services`, { method: 'POST', body: { services: selectedServices } });
            
            if (data && data.success) {
                showToast(`Invoice created — ₦${data.data.totalOneTime.toLocaleString()} + ₦${data.data.totalMonthly.toLocaleString()}/month`, 'success');
                location.reload();
            }
            
        } catch (error) {
            console.error('Service selection failed:', error);
            showToast('Couldn\'t submit service selection. Please try again.', 'error');
        }
    }
    
    return {
        renderServiceConfigurator,
        toggleService,
        submitServiceSelection
    };
})();

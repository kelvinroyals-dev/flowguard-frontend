// ============================================
// CLIENT MANAGEMENT MODULE
// Full CRUD for client management
// ============================================

const OpsClients = (function() {
    
    function render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Client Management</h2>
                        <p class="text-gray-600 dark:text-gray-400 mt-1">Manage all client accounts and contracts</p>
                    </div>
                    <button onclick="OpsClients.openAddClientModal()" class="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                        <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        Add New Client
                    </button>
                </div>
                
                <!-- Filters -->
                <div class="modern-card p-4">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <select id="filter-status" class="px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                        </select>
                        <select id="filter-health" class="px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            <option value="">All Health</option>
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="warning">Warning</option>
                            <option value="critical">Critical</option>
                        </select>
                        <select id="sort-by" class="px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            <option value="name">Sort by Name</option>
                            <option value="mrr">Sort by MRR</option>
                            <option value="alerts">Sort by Alerts</option>
                            <option value="uptime">Sort by Uptime</option>
                        </select>
                        <input type="text" id="search-clients" placeholder="Search clients..." class="px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                    </div>
                </div>
                
                <!-- Clients Table -->
                <div class="modern-card p-6">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="border-b border-gray-200 dark:border-gray-700">
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Client</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Location</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Coverage</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Health</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">MRR</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Uptime</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Alerts</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Status</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="clients-table-body">
                                <!-- Populated by JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        loadClients();
        attachEventListeners();
    }
    
    async function loadClients() {
        const clients = await OpsStateManager.loadClients();
        renderClientsTable(clients);
    }
    
    function renderClientsTable(clients) {
        const tbody = document.getElementById('clients-table-body');
        if (!tbody) return;
        
        if (!clients || clients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="py-8 text-center text-gray-500 dark:text-gray-400">
                        No clients found. Add your first client!
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = clients.map(client => `
            <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td class="py-4 px-4">
                    <div class="font-semibold text-gray-900 dark:text-gray-100">${client.name}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-500">ID: ${client.clientId}</div>
                </td>
                <td class="py-4 px-4 text-sm text-gray-700 dark:text-gray-300">${client.location}</td>
                <td class="py-4 px-4 text-sm text-gray-700 dark:text-gray-300">${client.coverage}</td>
                <td class="py-4 px-4">
                    ${getHealthBadge(client.health, client.healthScore)}
                </td>
                <td class="py-4 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    ₦${formatMoney(client.mrr)}
                </td>
                <td class="py-4 px-4">
                    <div class="flex items-center gap-2">
                        <div class="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div class="h-full ${getUptimeColor(client.uptime)}" style="width: ${client.uptime}%"></div>
                        </div>
                        <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">${client.uptime}%</span>
                    </div>
                </td>
                <td class="py-4 px-4">
                    <div class="flex flex-col gap-1">
                        ${client.alerts.critical > 0 ? `<span class="text-xs font-semibold text-red-600">${client.alerts.critical} Critical</span>` : ''}
                        ${client.alerts.moderate > 0 ? `<span class="text-xs text-orange-600">${client.alerts.moderate} Moderate</span>` : ''}
                        ${client.alerts.total === 0 ? `<span class="text-xs text-gray-500">No alerts</span>` : ''}
                    </div>
                </td>
                <td class="py-4 px-4">
                    <span class="px-3 py-1 ${getStatusColor(client.status)} rounded-full text-xs font-semibold">
                        ${client.status}
                    </span>
                </td>
                <td class="py-4 px-4">
                    <div class="flex gap-2">
                        <button onclick="OpsClients.viewClient('${client.clientId}')" class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            View
                        </button>
                        <button onclick="OpsClients.editClient('${client.clientId}')" class="text-gray-600 hover:text-gray-700 text-sm font-medium">
                            Edit
                        </button>
                        <button onclick="OpsClients.changeStatus('${client.clientId}')" class="text-orange-600 hover:text-orange-700 text-sm font-medium">
                            Status
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    function openAddClientModal() {
        const modal = document.createElement('div');
        modal.id = 'add-client-modal';
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto';
        modal.innerHTML = `
            <div class="modern-card max-w-2xl w-full p-6 my-8">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Add New Client</h3>
                    <button onclick="OpsClients.closeAddClientModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <form id="add-client-form" class="space-y-6">
                    <!-- Basic Information -->
                    <div>
                        <h4 class="font-bold text-gray-900 dark:text-gray-100 mb-4">Basic Information</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="md:col-span-2">
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Client Name *</label>
                                <input type="text" name="name" required
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="Lekki Gardens Estate">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">City *</label>
                                <input type="text" name="city" required
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="Lagos">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">State *</label>
                                <input type="text" name="state" required
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="Lagos">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Contact Information -->
                    <div>
                        <h4 class="font-bold text-gray-900 dark:text-gray-100 mb-4">Contact Information</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Contact Person *</label>
                                <input type="text" name="contactPerson" required
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="John Doe">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email *</label>
                                <input type="email" name="email" required
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="contact@client.com">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone *</label>
                                <input type="tel" name="phone" required
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="+234-803-555-0100">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Contract Details -->
                    <div>
                        <h4 class="font-bold text-gray-900 dark:text-gray-100 mb-4">Contract Details</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Monthly Fee (₦) *</label>
                                <input type="number" name="mrr" required min="0"
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="450000">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Coverage Area (km) *</label>
                                <input type="number" name="coverage" required min="0" step="0.1"
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="2.4">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Contract Start Date *</label>
                                <input type="date" name="contractStart" required
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Contract End Date</label>
                                <input type="date" name="contractEnd"
                                    class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex gap-3 pt-4">
                        <button type="button" onclick="OpsClients.closeAddClientModal()" class="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">
                            Add Client
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle form submission
        const form = document.getElementById('add-client-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const clientData = {
                name: formData.get('name'),
                city: formData.get('city'),
                state: formData.get('state'),
                location: `${formData.get('city')}, ${formData.get('state')}`,
                contactPerson: formData.get('contactPerson'),
                contactEmail: formData.get('email'),
                contactPhone: formData.get('phone'),
                mrr: parseInt(formData.get('mrr')),
                coverage: `${formData.get('coverage')} km`,
                contractStart: formData.get('contractStart'),
                contractEnd: formData.get('contractEnd') || null,
                status: 'active',
                health: 'Good',
                healthScore: 85,
                uptime: 99.0,
                sensors: { total: 0, online: 0, offline: 0 },
                alerts: { critical: 0, moderate: 0, minor: 0, total: 0 }
            };
            
            try {
                const result = await OpsStateManager.createClient(clientData);
                
                if (result.success) {
                    showSuccess('Client added successfully!');
                    closeAddClientModal();
                    loadClients();
                } else {
                    showError('Failed to add client');
                }
            } catch (error) {
                console.error('Add client error:', error);
                showError('Failed to add client');
            }
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAddClientModal();
            }
        });
    }
    
    function closeAddClientModal() {
        const modal = document.getElementById('add-client-modal');
        if (modal) {
            modal.remove();
        }
    }
    
    function viewClient(clientId) {
        // TODO: Navigate to client details page
        console.log('View client:', clientId);
    }
    
    function editClient(clientId) {
        // TODO: Open edit client modal
        console.log('Edit client:', clientId);
    }
    
    function changeStatus(clientId) {
        // TODO: Open status change modal
        console.log('Change status:', clientId);
    }
    
    function attachEventListeners() {
        const statusFilter = document.getElementById('filter-status');
        const healthFilter = document.getElementById('filter-health');
        const sortBy = document.getElementById('sort-by');
        const searchInput = document.getElementById('search-clients');
        
        [statusFilter, healthFilter, sortBy, searchInput].forEach(elem => {
            if (elem) {
                elem.addEventListener('change', filterAndSortClients);
                if (elem.tagName === 'INPUT') {
                    elem.addEventListener('input', filterAndSortClients);
                }
            }
        });
    }
    
    function filterAndSortClients() {
        // TODO: Implement filtering and sorting
        loadClients();
    }
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    function getHealthBadge(health, score) {
        const colors = {
            'Excellent': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
            'Good': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
            'Warning': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
            'Critical': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
        };
        
        return `
            <div class="flex items-center gap-2">
                <span class="px-3 py-1 ${colors[health] || 'bg-gray-100 text-gray-700'} rounded-full text-xs font-semibold">
                    ${health}
                </span>
                <span class="text-xs text-gray-500">${score}%</span>
            </div>
        `;
    }
    
    function getUptimeColor(uptime) {
        if (uptime >= 99) return 'bg-green-500';
        if (uptime >= 95) return 'bg-blue-500';
        if (uptime >= 90) return 'bg-orange-500';
        return 'bg-red-500';
    }
    
    function getStatusColor(status) {
        const colors = {
            'active': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
            'inactive': 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
            'suspended': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
        };
        return colors[status] || colors.inactive;
    }
    
    function formatMoney(amount) {
        return amount.toLocaleString('en-NG');
    }
    
    function showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
    
    function showError(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
    
    return {
        render,
        openAddClientModal,
        closeAddClientModal,
        viewClient,
        editClient,
        changeStatus
    };
})();

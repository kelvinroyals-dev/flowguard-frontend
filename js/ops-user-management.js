// ============================================
// USER MANAGEMENT MODULE
// Team member invites, RBAC, permissions
// ============================================

const OpsUserManagement = (function() {
    
    function render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Team Members</h2>
                        <p class="text-gray-600 dark:text-gray-400 mt-1">Manage internal team access and permissions</p>
                    </div>
                    <button onclick="OpsUserManagement.openInviteModal()" class="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                        <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        Invite Team Member
                    </button>
                </div>
                
                <!-- Users Table -->
                <div class="modern-card p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">Active Team Members</h3>
                        <div class="flex gap-2">
                            <select id="filter-role" class="px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                <option value="">All Roles</option>
                                <option value="super_admin">Super Admin</option>
                                <option value="operations_manager">Operations Manager</option>
                                <option value="dispatcher">Dispatcher</option>
                                <option value="field_lead">Field Team Lead</option>
                                <option value="analyst">Analyst</option>
                                <option value="finance">Finance</option>
                            </select>
                            <input type="text" id="search-users" placeholder="Search users..." class="px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                        </div>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="border-b border-gray-200 dark:border-gray-700">
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Name</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Email</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Role</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Status</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Last Active</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="users-table-body">
                                <!-- Populated by JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Pending Invites -->
                <div class="modern-card p-6">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Pending Invites</h3>
                    <div id="pending-invites" class="space-y-3">
                        <!-- Populated by JS -->
                    </div>
                </div>
                
                <!-- Role Permissions Reference -->
                <div class="modern-card p-6">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Role Permissions</h3>
                    <div id="role-permissions" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <!-- Populated by JS -->
                    </div>
                </div>
            </div>
        `;
        
        loadUsers();
        loadRoles();
        attachEventListeners();
    }
    
    async function loadUsers() {
        const users = await OpsStateManager.loadUsers();
        renderUsersTable(users);
    }
    
    async function loadRoles() {
        const roles = await OpsStateManager.loadRoles();
        renderRolePermissions(roles);
    }
    
    function renderUsersTable(users) {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;
        
        if (!users || users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="py-8 text-center text-gray-500 dark:text-gray-400">
                        No team members yet. Invite your first team member!
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = users.map(user => `
            <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td class="py-4 px-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold">
                            ${getInitials(user.fullName)}
                        </div>
                        <span class="font-semibold text-gray-900 dark:text-gray-100">${user.fullName}</span>
                    </div>
                </td>
                <td class="py-4 px-4 text-gray-700 dark:text-gray-300">${user.email}</td>
                <td class="py-4 px-4">
                    <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                        ${formatRole(user.role)}
                    </span>
                </td>
                <td class="py-4 px-4">
                    <span class="px-3 py-1 ${user.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'} rounded-full text-xs font-semibold">
                        ${user.status}
                    </span>
                </td>
                <td class="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                    ${formatDate(user.lastLogin)}
                </td>
                <td class="py-4 px-4">
                    <div class="flex gap-2">
                        <button onclick="OpsUserManagement.editUser('${user.userId}')" class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            Edit
                        </button>
                        <button onclick="OpsUserManagement.changeRole('${user.userId}')" class="text-orange-600 hover:text-orange-700 text-sm font-medium">
                            Change Role
                        </button>
                        ${user.role !== 'super_admin' ? `
                            <button onclick="OpsUserManagement.deactivateUser('${user.userId}')" class="text-red-600 hover:text-red-700 text-sm font-medium">
                                Deactivate
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    function renderRolePermissions(roles) {
        const container = document.getElementById('role-permissions');
        if (!container) return;
        
        const permissionDescriptions = {
            'all': 'Full system access',
            'clients.manage': 'Create, edit, delete clients',
            'teams.manage': 'Manage field teams',
            'alerts.manage': 'Full alert management',
            'alerts.view': 'View all alerts',
            'alerts.assign': 'Assign alerts to teams',
            'teams.dispatch': 'Dispatch teams to jobs',
            'alerts.view_own': 'View assigned alerts only',
            'jobs.update': 'Update job status',
            'reports.view': 'View analytics reports',
            'reports.export': 'Export data',
            'billing.view': 'View billing information',
            'billing.manage': 'Manage invoices and payments'
        };
        
        container.innerHTML = roles.map(role => `
            <div class="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl">
                <h4 class="font-bold text-gray-900 dark:text-gray-100 mb-2">${role.name}</h4>
                <div class="space-y-1">
                    ${role.permissions.map(perm => `
                        <div class="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                            <svg class="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            <span>${permissionDescriptions[perm] || perm}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
    
    function openInviteModal() {
        const roles = OpsStateManager.getRoles();
        
        const modal = document.createElement('div');
        modal.id = 'invite-user-modal';
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="modern-card max-w-lg w-full p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Invite Team Member</h3>
                    <button onclick="OpsUserManagement.closeInviteModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <form id="invite-user-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address *</label>
                        <input type="email" name="email" required
                            class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="team.member@company.com">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Role *</label>
                        <select name="role" required
                            class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            <option value="">Select a role...</option>
                            ${roles.map(role => `
                                <option value="${role.roleId}">${role.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
                        <div class="flex items-start gap-3">
                            <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <div class="text-sm text-blue-800 dark:text-blue-400">
                                <p class="font-semibold mb-1">Invite Process</p>
                                <p class="text-xs">An invitation email will be sent with a link to create their account. The link expires in 7 days.</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex gap-3 pt-4">
                        <button type="button" onclick="OpsUserManagement.closeInviteModal()" class="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">
                            Send Invite
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle form submission
        const form = document.getElementById('invite-user-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const email = formData.get('email');
            const roleId = formData.get('role');
            
            try {
                const result = await OpsStateManager.inviteUser(email, roleId);
                
                if (result.success) {
                    showSuccess('Invitation sent successfully!');
                    closeInviteModal();
                    loadUsers();
                } else {
                    showError('Failed to send invitation');
                }
            } catch (error) {
                console.error('Invite error:', error);
                showError('Failed to send invitation');
            }
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeInviteModal();
            }
        });
    }
    
    function closeInviteModal() {
        const modal = document.getElementById('invite-user-modal');
        if (modal) {
            modal.remove();
        }
    }
    
    function editUser(userId) {
        // TODO: Implement edit user modal
        console.log('Edit user:', userId);
    }
    
    function changeRole(userId) {
        // TODO: Implement change role modal
        console.log('Change role for:', userId);
    }
    
    async function deactivateUser(userId) {
        if (!confirm('Are you sure you want to deactivate this user? They will lose access to the Operations Center.')) {
            return;
        }
        
        try {
            const result = await OpsStateManager.deleteUser(userId);
            
            if (result.success) {
                showSuccess('User deactivated successfully');
                loadUsers();
            } else {
                showError('Failed to deactivate user');
            }
        } catch (error) {
            console.error('Deactivate error:', error);
            showError('Failed to deactivate user');
        }
    }
    
    function attachEventListeners() {
        const roleFilter = document.getElementById('filter-role');
        const searchInput = document.getElementById('search-users');
        
        if (roleFilter) {
            roleFilter.addEventListener('change', filterUsers);
        }
        
        if (searchInput) {
            searchInput.addEventListener('input', filterUsers);
        }
    }
    
    function filterUsers() {
        const roleFilter = document.getElementById('filter-role')?.value;
        const searchTerm = document.getElementById('search-users')?.value.toLowerCase();
        
        let users = OpsStateManager.getUsers();
        
        if (roleFilter) {
            users = users.filter(u => u.role === roleFilter);
        }
        
        if (searchTerm) {
            users = users.filter(u => 
                u.fullName.toLowerCase().includes(searchTerm) ||
                u.email.toLowerCase().includes(searchTerm)
            );
        }
        
        renderUsersTable(users);
    }
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    function getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    
    function formatRole(roleId) {
        const roleNames = {
            'super_admin': 'Super Admin',
            'operations_manager': 'Ops Manager',
            'dispatcher': 'Dispatcher',
            'field_lead': 'Field Lead',
            'analyst': 'Analyst',
            'finance': 'Finance'
        };
        return roleNames[roleId] || roleId;
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 60) return `${minutes} min ago`;
        if (hours < 24) return `${hours} hours ago`;
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
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
        openInviteModal,
        closeInviteModal,
        editUser,
        changeRole,
        deactivateUser
    };
})();

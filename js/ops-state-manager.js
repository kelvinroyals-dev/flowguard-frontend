// ============================================
// OPERATIONS STATE MANAGER
// Centralized state management for Operations Center
// ============================================

const OpsStateManager = (function() {
    const API_BASE = 'https://api.flowguard.ng/api/v1';
    
    let state = {
        users: [],
        roles: [],
        clients: [],
        properties: [],
        teams: [],
        equipment: [],
        alerts: [],
        sensors: [],
        kpis: null,
        forecast: null,
        demoMode: localStorage.getItem('ops_demo_mode') === 'true'
    };
    
    // ============================================
    // DEMO DATA
    // ============================================
    
    const DEMO_USERS = [
        {
            userId: 'USR-001',
            email: 'admin@flowguard.ng',
            fullName: 'John Adebayo',
            role: 'super_admin',
            status: 'active',
            lastLogin: '2026-02-23T10:30:00Z'
        },
        {
            userId: 'USR-002',
            email: 'ops@flowguard.ng',
            fullName: 'Sarah Okafor',
            role: 'operations_manager',
            status: 'active',
            lastLogin: '2026-02-23T09:15:00Z'
        },
        {
            userId: 'USR-003',
            email: 'dispatch@flowguard.ng',
            fullName: 'Michael Eze',
            role: 'dispatcher',
            status: 'active',
            lastLogin: '2026-02-23T11:00:00Z'
        }
    ];
    
    const DEMO_ROLES = [
        { roleId: 'super_admin', name: 'Super Admin', permissions: ['all'] },
        { roleId: 'operations_manager', name: 'Operations Manager', permissions: ['clients.manage', 'teams.manage', 'alerts.manage'] },
        { roleId: 'dispatcher', name: 'Dispatcher', permissions: ['alerts.view', 'alerts.assign', 'teams.dispatch'] },
        { roleId: 'field_lead', name: 'Field Team Lead', permissions: ['alerts.view_own', 'jobs.update'] },
        { roleId: 'analyst', name: 'Analyst', permissions: ['reports.view', 'reports.export'] },
        { roleId: 'finance', name: 'Finance', permissions: ['billing.view', 'billing.manage'] }
    ];
    
    const DEMO_CLIENTS = [
        {
            clientId: 'CLI-001',
            propertyId: 'PROP-001',
            name: 'Lekki Gardens',
            location: 'Lekki Phase 1, Lagos',
            coverage: '2.4 km',
            health: 'Good',
            healthScore: 85,
            mrr: 450000,
            uptime: 99.2,
            sensors: { total: 8, online: 8, offline: 0 },
            alerts: { critical: 0, moderate: 2, minor: 5, total: 7 },
            lastIncident: '2026-02-18T14:30:00Z',
            status: 'active'
        },
        {
            clientId: 'CLI-002',
            propertyId: 'PROP-002',
            name: 'Eko Atlantic City',
            location: 'Victoria Island, Lagos',
            coverage: '5.1 km',
            health: 'Excellent',
            healthScore: 95,
            mrr: 850000,
            uptime: 99.8,
            sensors: { total: 15, online: 15, offline: 0 },
            alerts: { critical: 0, moderate: 0, minor: 2, total: 2 },
            lastIncident: '2026-02-15T09:00:00Z',
            status: 'active'
        },
        {
            clientId: 'CLI-003',
            propertyId: 'PROP-003',
            name: 'Banana Island Estate',
            location: 'Ikoyi, Lagos',
            coverage: '1.8 km',
            health: 'Warning',
            healthScore: 65,
            mrr: 380000,
            uptime: 97.5,
            sensors: { total: 6, online: 5, offline: 1 },
            alerts: { critical: 1, moderate: 3, minor: 2, total: 6 },
            lastIncident: '2026-02-22T16:45:00Z',
            status: 'active'
        }
    ];
    
    const DEMO_KPIS = {
        activeClients: 18,
        totalClients: 20,
        mrr: 8500000,
        totalCoverage: 47.3,
        activeAlerts: 23,
        criticalAlerts: 3,
        networkUptime: 98.7,
        sensorsOnline: { online: 142, offline: 6, total: 148 },
        avgResponseTime: 78,
        newClientsThisMonth: 3,
        mrrGrowth: 12.5,
        alertTrend: -14
    };
    
    // ============================================
    // API CALLS
    // ============================================
    
    async function apiCall(endpoint, options = {}) {
        const token = Auth.getToken();
        const url = `${API_BASE}${endpoint}`;
        
        const config = {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        };
        
        const response = await fetch(url, config);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    // ============================================
    // USER MANAGEMENT
    // ============================================
    
    async function loadUsers() {
        if (state.demoMode) {
            state.users = DEMO_USERS;
            return DEMO_USERS;
        }
        
        try {
            const data = await apiCall('/users');
            state.users = data.data || [];
            return state.users;
        } catch (error) {
            console.error('Error loading users:', error);
            state.users = [];
            return [];
        }
    }
    
    async function loadRoles() {
        if (state.demoMode) {
            state.roles = DEMO_ROLES;
            return DEMO_ROLES;
        }
        
        try {
            const data = await apiCall('/roles');
            state.roles = data.data || [];
            return state.roles;
        } catch (error) {
            console.error('Error loading roles:', error);
            state.roles = DEMO_ROLES; // Fallback to demo roles
            return state.roles;
        }
    }
    
    async function inviteUser(email, roleId) {
        if (state.demoMode) {
            return { success: true, message: 'Invite sent (demo mode)' };
        }
        
        try {
            return await apiCall('/users/invite', {
                method: 'POST',
                body: JSON.stringify({ email, roleId })
            });
        } catch (error) {
            console.error('Error inviting user:', error);
            throw error;
        }
    }
    
    async function updateUser(userId, data) {
        if (state.demoMode) {
            const userIndex = state.users.findIndex(u => u.userId === userId);
            if (userIndex !== -1) {
                state.users[userIndex] = { ...state.users[userIndex], ...data };
            }
            return { success: true, data: state.users[userIndex] };
        }
        
        try {
            return await apiCall(`/users/${userId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }
    
    async function deleteUser(userId) {
        if (state.demoMode) {
            state.users = state.users.filter(u => u.userId !== userId);
            return { success: true };
        }
        
        try {
            return await apiCall(`/users/${userId}`, { method: 'DELETE' });
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }
    
    // ============================================
    // CLIENT MANAGEMENT
    // ============================================
    
    async function loadClients() {
        if (state.demoMode) {
            state.clients = DEMO_CLIENTS;
            return DEMO_CLIENTS;
        }
        
        try {
            const data = await apiCall('/clients');
            state.clients = data.data || [];
            return state.clients;
        } catch (error) {
            console.error('Error loading clients:', error);
            state.clients = [];
            return [];
        }
    }
    
    async function createClient(clientData) {
        if (state.demoMode) {
            const newClient = {
                clientId: `CLI-${Date.now()}`,
                ...clientData,
                status: 'active'
            };
            state.clients.push(newClient);
            return { success: true, data: newClient };
        }
        
        try {
            return await apiCall('/clients', {
                method: 'POST',
                body: JSON.stringify(clientData)
            });
        } catch (error) {
            console.error('Error creating client:', error);
            throw error;
        }
    }
    
    async function updateClient(clientId, data) {
        if (state.demoMode) {
            const index = state.clients.findIndex(c => c.clientId === clientId);
            if (index !== -1) {
                state.clients[index] = { ...state.clients[index], ...data };
            }
            return { success: true, data: state.clients[index] };
        }
        
        try {
            return await apiCall(`/clients/${clientId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Error updating client:', error);
            throw error;
        }
    }
    
    // ============================================
    // KPIs & ANALYTICS
    // ============================================
    
    async function loadKPIs() {
        if (state.demoMode) {
            state.kpis = DEMO_KPIS;
            return DEMO_KPIS;
        }
        
        try {
            const data = await apiCall('/analytics/kpis');
            state.kpis = data.data;
            return state.kpis;
        } catch (error) {
            console.error('Error loading KPIs:', error);
            state.kpis = DEMO_KPIS;
            return state.kpis;
        }
    }
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    function toggleDemoMode() {
        state.demoMode = !state.demoMode;
        localStorage.setItem('ops_demo_mode', state.demoMode);
        return state.demoMode;
    }
    
    function getDemoMode() {
        return state.demoMode;
    }
    
    function getUsers() {
        return state.users;
    }
    
    function getRoles() {
        return state.roles;
    }
    
    function getClients() {
        return state.clients;
    }
    
    function getKPIs() {
        return state.kpis;
    }
    
    // ============================================
    // PUBLIC API
    // ============================================
    
    return {
        // User Management
        loadUsers,
        loadRoles,
        inviteUser,
        updateUser,
        deleteUser,
        getUsers,
        getRoles,
        
        // Client Management
        loadClients,
        createClient,
        updateClient,
        getClients,
        
        // Analytics
        loadKPIs,
        getKPIs,
        
        // Utility
        toggleDemoMode,
        getDemoMode
    };
})();

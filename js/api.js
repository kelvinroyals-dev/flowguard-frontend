// ============================================
// FLOW GUARD API CLIENT
// ============================================

// CONFIGURATION - Change this to your server IP
const API_BASE_URL = 'https://api.flowguard.ng/api/v1';  // We'll update this later
const SOCKET_URL = 'https://api.flowguard.ng';            // We'll update this later

class FlowGuardAPI {
    constructor() {
        this.baseURL = API_BASE_URL;
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = localStorage.getItem('token');
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...options.headers
            },
            ...options
        };

        let response;
        try {
            response = await fetch(url, config);
        } catch (networkErr) {
            // Genuine network failure (offline, DNS, CORS) — surface it, never fake it
            console.error('API network error:', endpoint, networkErr);
            throw new Error('Network error — please check your connection and try again.');
        }

        let data = null;
        try { data = await response.json(); } catch (_) { /* non-JSON response */ }

        if (response.status === 401) {
            // Token expired/invalid — clear session so the app can redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            throw new Error('Your session has expired. Please sign in again.');
        }

        if (!response.ok) {
            throw new Error((data && data.error) || `Request failed (${response.status})`);
        }

        return data;
    }
    
    // Client endpoints
    async getClients() {
        return this.request('/clients');
    }
    
    async getClient(id) {
        return this.request(`/clients/${id}`);
    }
    
    // Sensor endpoints
    async getSensors() {
        return this.request('/sensors');
    }
    
    async getSensorReadings(sensorId, hours = 24) {
        return this.request(`/sensors/${sensorId}/readings?hours=${hours}`);
    }
    
    // Alert endpoints
    async getAlerts(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/alerts?${params}`);
    }
    
    async createTicket(alertId, teamId) {
        return this.request('/tickets', {
            method: 'POST',
            body: JSON.stringify({ alertId, assignedTeam: teamId })
        });
    }
    
    // Team endpoints
    async getTeams() {
        return this.request('/teams');
    }
    
    async updateTeamStatus(teamId, status, location) {
        return this.request(`/teams/${teamId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, location })
        });
    }
}

// Create global instance
const api = new FlowGuardAPI();

// For debugging
console.log('FlowGuard API initialized with base URL:', API_BASE_URL);
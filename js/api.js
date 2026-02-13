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
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            // Return placeholder data for now
            return this.getPlaceholderData(endpoint);
        }
    }
    
    // Placeholder data when API is not available
    getPlaceholderData(endpoint) {
        console.log('Using placeholder data for:', endpoint);
        
        if (endpoint === '/clients') {
            return {
                success: true,
                data: [
                    { id: 1, name: 'Banana Island Estates', location: 'Ikoyi', tier: 'premium', health: 95, mrr: 850000 },
                    { id: 2, name: 'Lekki Gardens Phase 2', location: 'Lekki', tier: 'standard', health: 88, mrr: 450000 }
                ]
            };
        }
        
        if (endpoint === '/sensors') {
            return {
                success: true,
                data: [
                    { sensorId: 'LK-A-047', name: 'Lekki Phase 1', waterLevel: 85, status: 'critical' },
                    { sensorId: 'BI-C-012', name: 'Banana Island', waterLevel: 65, status: 'rising' }
                ]
            };
        }
        
        return { success: false, data: [] };
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
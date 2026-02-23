// ============================================
// TEAMS MANAGEMENT MODULE
// Field teams, dispatch, and performance tracking
// ============================================

const OpsTeams = (function() {
    
    const DEMO_TEAMS = [
        {
            teamId: 'TEAM-001',
            name: 'Team Alpha',
            status: 'on_site',
            currentLocation: 'Lekki Phase 1',
            assignedTo: 'Lekki Gardens',
            eta: null,
            lastCheckIn: '2026-02-23T10:30:00Z',
            members: [
                { name: 'Chidi Okonkwo', role: 'Team Lead', phone: '+234-803-111-0001' },
                { name: 'Amaka Nwosu', role: 'Technician', phone: '+234-803-111-0002' }
            ],
            equipment: ['PT-001', 'JM-001']
        },
        {
            teamId: 'TEAM-002',
            name: 'Team Bravo',
            status: 'en_route',
            currentLocation: 'Victoria Island',
            assignedTo: 'VI Plaza',
            eta: 15,
            lastCheckIn: '2026-02-23T10:55:00Z',
            members: [
                { name: 'Eze Michael', role: 'Team Lead', phone: '+234-803-222-0001' },
                { name: 'Kemi Ade', role: 'Technician', phone: '+234-803-222-0002' }
            ],
            equipment: ['PT-002']
        },
        {
            teamId: 'TEAM-003',
            name: 'Team Charlie',
            status: 'idle',
            currentLocation: 'HQ',
            assignedTo: null,
            eta: null,
            lastCheckIn: '2026-02-23T10:02:00Z',
            members: [
                { name: 'Tunde Bello', role: 'Team Lead', phone: '+234-803-333-0001' }
            ],
            equipment: []
        }
    ];
    
    function render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Header -->
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Field Teams</h2>
                        <p class="text-gray-600 dark:text-gray-400 mt-1">Manage teams and dispatch operations</p>
                    </div>
                    <button onclick="OpsTeams.openCreateTeamModal()" class="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:shadow-lg transition-all">
                        <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        Create Team
                    </button>
                </div>
                
                <!-- Team Status Cards -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="modern-card p-4">
                        <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">On Site</div>
                        <div class="text-3xl font-bold text-green-600">1</div>
                    </div>
                    <div class="modern-card p-4">
                        <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">En Route</div>
                        <div class="text-3xl font-bold text-blue-600">1</div>
                    </div>
                    <div class="modern-card p-4">
                        <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Idle</div>
                        <div class="text-3xl font-bold text-gray-600">1</div>
                    </div>
                    <div class="modern-card p-4">
                        <div class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Teams</div>
                        <div class="text-3xl font-bold text-gray-900 dark:text-gray-100">3</div>
                    </div>
                </div>
                
                <!-- Teams Table -->
                <div class="modern-card p-6">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Active Teams</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead>
                                <tr class="border-b border-gray-200 dark:border-gray-700">
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Team ID</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Status</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Location</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Assigned To</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">ETA</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Last Check-in</th>
                                    <th class="text-left py-3 px-4 text-xs font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="teams-table-body">
                                <!-- Populated by JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        loadTeams();
    }
    
    function loadTeams() {
        renderTeamsTable(DEMO_TEAMS);
    }
    
    function renderTeamsTable(teams) {
        const tbody = document.getElementById('teams-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = teams.map(team => `
            <tr class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td class="py-4 px-4 font-semibold text-gray-900 dark:text-gray-100">${team.name}</td>
                <td class="py-4 px-4">
                    <span class="px-3 py-1 ${getStatusColor(team.status)} rounded-full text-xs font-semibold">
                        ${formatStatus(team.status)}
                    </span>
                </td>
                <td class="py-4 px-4 text-sm text-gray-700 dark:text-gray-300">${team.currentLocation}</td>
                <td class="py-4 px-4 text-sm text-gray-700 dark:text-gray-300">${team.assignedTo || '--'}</td>
                <td class="py-4 px-4 text-sm ${team.eta ? 'font-semibold text-blue-600' : 'text-gray-600 dark:text-gray-400'}">
                    ${team.eta ? `${team.eta} min` : '--'}
                </td>
                <td class="py-4 px-4 text-xs text-gray-500">${formatDate(team.lastCheckIn)}</td>
                <td class="py-4 px-4">
                    <div class="flex gap-2">
                        <button onclick="OpsTeams.viewTeam('${team.teamId}')" class="text-blue-600 hover:text-blue-700 text-sm font-medium">View</button>
                        <button onclick="OpsTeams.editTeam('${team.teamId}')" class="text-gray-600 hover:text-gray-700 text-sm font-medium">Edit</button>
                        ${team.status === 'idle' ? `
                            <button onclick="OpsTeams.dispatchTeam('${team.teamId}')" class="text-green-600 hover:text-green-700 text-sm font-medium">Dispatch</button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    function openCreateTeamModal() {
        const modal = document.createElement('div');
        modal.id = 'create-team-modal';
        modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="modern-card max-w-lg w-full p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">Create New Team</h3>
                    <button onclick="OpsTeams.closeCreateTeamModal()" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <form id="create-team-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Team Name *</label>
                        <input type="text" name="teamName" required
                            class="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-600 focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="Team Delta">
                    </div>
                    
                    <div class="flex gap-3 pt-4">
                        <button type="button" onclick="OpsTeams.closeCreateTeamModal()" class="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium">Cancel</button>
                        <button type="submit" class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">Create Team</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const form = document.getElementById('create-team-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            showSuccess('Team created successfully!');
            closeCreateTeamModal();
        });
    }
    
    function closeCreateTeamModal() {
        const modal = document.getElementById('create-team-modal');
        if (modal) modal.remove();
    }
    
    function viewTeam(teamId) {
        console.log('View team:', teamId);
    }
    
    function editTeam(teamId) {
        console.log('Edit team:', teamId);
    }
    
    function dispatchTeam(teamId) {
        console.log('Dispatch team:', teamId);
    }
    
    function getStatusColor(status) {
        const colors = {
            'on_site': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
            'en_route': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
            'idle': 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
            'returning': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
        };
        return colors[status] || colors.idle;
    }
    
    function formatStatus(status) {
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 60) return `${minutes} min ago`;
        return date.toLocaleTimeString();
    }
    
    function showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
    
    return {
        render,
        openCreateTeamModal,
        closeCreateTeamModal,
        viewTeam,
        editTeam,
        dispatchTeam
    };
})();

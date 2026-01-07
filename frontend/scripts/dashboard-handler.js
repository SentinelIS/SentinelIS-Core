let allAssets = []; // Store all assets fetched from the API

// show username saved by login-handler.js (localStorage)
document.addEventListener('DOMContentLoaded', () => {
    const name = localStorage.getItem('username') || 'User';
    const el = document.getElementById('username');
    if (el) el.textContent = name;

    const addAssetModal = document.getElementById('add-asset-modal');
    const addAssetBtn = document.getElementById('add-asset-btn');
    const closeModalBtn = document.getElementById('add-asset-modal-close');

    if (addAssetBtn) {
        addAssetBtn.addEventListener('click', () => {
            addAssetModal.classList.remove('modal-hidden');
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            addAssetModal.classList.add('modal-hidden');
        });
    }

    if (addAssetModal) {
        addAssetModal.addEventListener('click', (e) => {
            if (e.target === addAssetModal) {
                addAssetModal.classList.add('modal-hidden');
            }
        });
    }

    const addAssetForm = document.getElementById('add-asset-form');
    const editAssetModal = document.getElementById('edit-asset-modal');
    const editAssetClose = document.getElementById('edit-asset-modal-close');
    const editAssetForm = document.getElementById('edit-asset-form');
    const editButton = document.getElementById('edit-asset-btn');
    const saveButton = document.getElementById('save-asset-btn');
    const deleteButton = document.getElementById('delete-asset-btn');

    // Load assets when the page is ready
    fetchAndRenderAssets();
    
    // Load analytics charts
    loadAnalytics();
    
    // Refresh analytics button
    const refreshAnalyticsBtn = document.getElementById('refresh-analytics-btn');
    if (refreshAnalyticsBtn) {
        refreshAnalyticsBtn.addEventListener('click', () => {
            loadAnalytics();
        });
    }

    // Add event listeners for filter and sort controls
    document.getElementById('filter-keyword').addEventListener('input', renderAssets);
    document.getElementById('filter-type').addEventListener('change', renderAssets);
    document.getElementById('filter-status').addEventListener('change', renderAssets);
    document.getElementById('sort-by').addEventListener('change', renderAssets);
    document.getElementById('reset-filters-btn').addEventListener('click', () => {
        document.getElementById('filter-keyword').value = '';
        document.getElementById('filter-type').value = '';
        document.getElementById('filter-status').value = '';
        document.getElementById('sort-by').value = 'asset_id-asc';
        renderAssets();
    });

    if (addAssetForm) {
        addAssetForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(addAssetForm);
            const assetData = Object.fromEntries(formData.entries());

            const companyId = localStorage.getItem('companyId');
            const username = localStorage.getItem('username');

            if (!companyId || !username) {
                alert('Could not find user and company information. Please log in again.');
                return;
            }

            const payload = {
                name: assetData['asset-name'],
                type: assetData['asset-type'],
                description: assetData['asset-description'],
                classification: assetData['asset-classification'],
                location: assetData['asset-location'],
                owner: assetData['asset-owner'],
                value: assetData['asset-value'],
                status: assetData['asset-status'],
                username: username,
                companyId: parseInt(companyId, 10)
            };

            try {
                const response = await fetch('http://localhost:5000/api/assets', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                        alert('Asset created successfully!');
                        addAssetModal.classList.add('modal-hidden');
                        addAssetForm.reset();
                        fetchAndRenderAssets(); // Refresh the asset list
                        loadAnalytics(); // Refresh charts
                } else {
                    alert(`Error: ${result.message}`);
                }
            } catch (error) {
                console.error('Failed to create asset:', error);
                alert('An error occurred while creating the asset. Please try again.');
            }
        });
    }

    if (editAssetClose && editAssetModal) {
        editAssetClose.addEventListener('click', () => {
            closeEditModal();
        });
        editAssetModal.addEventListener('click', (e) => {
            if (e.target === editAssetModal) closeEditModal();
        });
    }

    if (editButton && editAssetForm && saveButton) {
        editButton.addEventListener('click', () => {
            setEditMode(false); // turn off readonly
        });
    }

    if (editAssetForm && saveButton) {
        editAssetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const assetId = document.getElementById('edit-asset-id').value;
            if (!assetId) return;

            const payload = {
                name: document.getElementById('edit-asset-name').value,
                type: document.getElementById('edit-asset-type').value,
                description: document.getElementById('edit-asset-description').value,
                classification: document.getElementById('edit-asset-classification').value,
                location: document.getElementById('edit-asset-location').value,
                owner: document.getElementById('edit-asset-owner').value,
                value: document.getElementById('edit-asset-value').value,
                status: document.getElementById('edit-asset-status').value
            };

            try {
                const response = await fetch(`http://localhost:5000/api/assets/${assetId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.message || 'Failed to update asset');
                }
                console.log('Asset updated successfully');
                setEditMode(true); // back to readonly
                closeEditModal();
                fetchAndRenderAssets();
                loadAnalytics(); // Refresh charts
            } catch (error) {
                console.error('Failed to update asset:', error);
                console.error(`Error updating asset: ${error.message}`);
            }
        });
    }

    if (deleteButton) {
        deleteButton.addEventListener('click', async () => {
            const assetId = document.getElementById('edit-asset-id').value;
            if (!assetId) return;
            const confirmDelete = confirm('Delete this asset from MySQL and MongoDB?');
            if (!confirmDelete) return;
            try {
                const response = await fetch(`http://localhost:5000/api/assets/${assetId}`, {
                    method: 'DELETE'
                });
                const result = await response.json();
                if (!response.ok || !result.success) {
                    throw new Error(result.message || 'Failed to delete asset');
                }
                console.log('Asset deleted');
                closeEditModal();
                fetchAndRenderAssets();
                loadAnalytics(); // Refresh charts
            } catch (error) {
                console.error('Failed to delete asset:', error);
                alert(`Error deleting asset: ${error.message}`);
            }
        });
    }

    // Toggle analytics dashboard
    const toggleButton = document.getElementById('toggle-analytics-btn');
    const analyticsContent = document.querySelector('.analytics-content');
    const toggleIcon = toggleButton ? toggleButton.querySelector('i') : null;

    if (toggleButton && analyticsContent && toggleIcon) {
        toggleButton.addEventListener('click', () => {
            analyticsContent.classList.toggle('collapsed');
            const isCollapsed = analyticsContent.classList.contains('collapsed');
            if (isCollapsed) {
                toggleIcon.classList.remove('ri-arrow-up-s-line');
                toggleIcon.classList.add('ri-arrow-down-s-line');
            } else {
                toggleIcon.classList.remove('ri-arrow-down-s-line');
                toggleIcon.classList.add('ri-arrow-up-s-line');
            }
        });
    }
});

async function fetchAndRenderAssets() {
    const assetList = document.getElementById('asset-list');
    if (!assetList) return;

    const companyId = localStorage.getItem('companyId');
    if (!companyId) {
        assetList.innerHTML = '<p>Could not determine company. Please log in again.</p>';
        return;
    }

    assetList.innerHTML = '<p>Loading assets...</p>'; // Show a loading message

    const query = `
                query GetAssets($compId: Int!) {
                    assets(comp_id: $compId) {
                        asset_id
                        mongo {
                            name
                            type
                            description
                            classification
                            location
                            owner
                            value
                            status
                        }
                    }
                }
            `;

    const variables = {
        compId: parseInt(companyId, 10)
    };

    try {
        const response = await fetch('http://localhost:4000', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                variables
            })
        });

        const json = await response.json();

        if (json.errors) {
            throw new Error(json.errors.map(e => e.message).join('\n'));
        }

        allAssets = json.data.assets || [];
        renderAssets();

    } catch (error) {
        console.error('Failed to fetch assets:', error);
        assetList.innerHTML = `<p>Error loading assets: ${error.message}</p>`;
    }
}

function renderAssets() {
    const assetList = document.getElementById('asset-list');
    if (!assetList) return;

    // Get filter values
    const keyword = document.getElementById('filter-keyword').value.toLowerCase();
    const type = document.getElementById('filter-type').value;
    const status = document.getElementById('filter-status').value;
    const sortBy = document.getElementById('sort-by').value;

    // Filter assets
    let filteredAssets = allAssets.filter(asset => {
        if (!asset.mongo) return false;
        const mongo = asset.mongo;
        const matchesKeyword = !keyword || (mongo.name && mongo.name.toLowerCase().includes(keyword)) || (mongo.description && mongo.description.toLowerCase().includes(keyword));
        const matchesType = !type || mongo.type === type;
        const matchesStatus = !status || mongo.status === status;
        return matchesKeyword && matchesType && matchesStatus;
    });

    // Sort assets
    const [sortField, sortOrder] = sortBy.split('-');
    const valueMap = { low: 1, medium: 2, high: 3, critical: 4 };

    filteredAssets.sort((a, b) => {
        let valA, valB;

        if (sortField === 'asset_id') {
            valA = a.asset_id;
            valB = b.asset_id;
        } else if (sortField === 'value') {
            valA = valueMap[a.mongo.value] || 0;
            valB = valueMap[b.mongo.value] || 0;
        } else {
            valA = a.mongo[sortField] ? a.mongo[sortField].toLowerCase() : '';
            valB = b.mongo[sortField] ? b.mongo[sortField].toLowerCase() : '';
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });


    assetList.innerHTML = ''; // Clear the list

    if (filteredAssets && filteredAssets.length > 0) {
        const table = document.createElement('table');
        table.innerHTML = `
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Classification</th>
                            <th>Location</th>
                            <th>Owner</th>
                            <th>Value</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                `;
        const tbody = table.querySelector('tbody');
        filteredAssets.forEach(asset => {
            if (asset.mongo) {
                const row = document.createElement('tr');
                row.dataset.assetId = asset.asset_id;
                row.innerHTML = `
                            <td>${asset.asset_id}</td>
                            <td class="asset-link" data-asset-id="${asset.asset_id}">${asset.mongo.name || ''}</td>
                            <td>${asset.mongo.type || ''}</td>
                            <td>${asset.mongo.description || ''}</td>
                            <td>${asset.mongo.classification || ''}</td>
                            <td>${asset.mongo.location || ''}</td>
                            <td>${asset.mongo.owner || ''}</td>
                            <td>${asset.mongo.value || ''}</td>
                            <td>${asset.mongo.status || ''}</td>
                        `;
                tbody.appendChild(row);
            }
        });
        // Click handler on asset name to open overlay
        table.addEventListener('click', async (e) => {
            const target = e.target;
            if (target && target.classList.contains('asset-link')) {
                const assetId = target.dataset.assetId;
                if (assetId) {
                    await openEditModal(assetId);
                }
            }
        });
        assetList.appendChild(table);
    } else {
        assetList.innerHTML = '<p>No assets found matching your criteria.</p>';
    }
}


function setEditMode(readonly = true) {
    const form = document.getElementById('edit-asset-form');
    const saveButton = document.getElementById('save-asset-btn');
    const editButton = document.getElementById('edit-asset-btn');
    if (!form || !saveButton || !editButton) return;
    if (readonly) {
        form.classList.add('readonly-mode');
        saveButton.style.display = 'none';
        editButton.style.display = 'inline-flex';
    } else {
        form.classList.remove('readonly-mode');
        saveButton.style.display = 'inline-flex';
        editButton.style.display = 'none';
    }
}

function closeEditModal() {
    const modal = document.getElementById('edit-asset-modal');
    if (modal) modal.classList.add('modal-hidden');
    setEditMode(true);
}

async function openEditModal(assetId) {
    try {
        const response = await fetch(`http://localhost:5000/api/assets/${assetId}`);
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Failed to load asset');
        }
        const asset = result.asset;
        document.getElementById('edit-asset-id').value = asset.asset_id;
        document.getElementById('edit-asset-name').value = asset.name || '';
        document.getElementById('edit-asset-type').value = asset.type || 'Server';
        document.getElementById('edit-asset-description').value = asset.description || '';
        document.getElementById('edit-asset-classification').value = asset.classification || 'public';
        document.getElementById('edit-asset-location').value = asset.location || '';
        document.getElementById('edit-asset-owner').value = asset.owner || '';
        document.getElementById('edit-asset-value').value = asset.value || 'low';
        document.getElementById('edit-asset-status').value = asset.status || 'active';
        setEditMode(true);
        const modal = document.getElementById('edit-asset-modal');
        if (modal) modal.classList.remove('modal-hidden');
    } catch (error) {
        console.error('Failed to open asset modal:', error);
        alert(`Could not load asset: ${error.message}`);
    }
}

// Analytics Charts
let chartInstances = {};

async function loadAnalytics() {
    const companyId = localStorage.getItem('companyId');
    if (!companyId) {
        console.error('Company ID not found');
        return;
    }
    
    try {
        // Load summary first
        const summaryResponse = await fetch(`http://localhost:5000/api/assets/analytics/summary?companyId=${companyId}`);
        const summaryResult = await summaryResponse.json();
        
        if (summaryResult.success) {
            document.getElementById('summary-total').textContent = summaryResult.data.totalAssets || 0;
            document.getElementById('summary-high-value').textContent = summaryResult.data.highValueAssets || 0;
        }
        
        // Load and render all charts
        await Promise.all([
            loadChart('by-type', 'pie', 'Assets by Type', companyId),
            loadChart('by-status', 'bar', 'Assets by Status', companyId),
            loadChart('by-value', 'doughnut', 'Assets by Value', companyId),
            loadChart('by-classification', 'bar', 'Assets by Classification', companyId),
            loadChart('by-month', 'line', 'Assets Created Over Time', companyId)
        ]);
    } catch (error) {
        console.error('Failed to load analytics:', error);
    }
}

async function loadChart(chartType, chartKind, title, companyId) {
    try {
        const response = await fetch(`http://localhost:5000/api/assets/analytics/${chartType}?companyId=${companyId}`);
        const result = await response.json();
        
        if (!result.success || !result.data) {
            console.error(`Failed to load ${chartType} data`);
            return;
        }
        
        const canvasId = `chart-${chartType}`;
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        // Destroy existing chart if it exists
        if (chartInstances[canvasId]) {
            chartInstances[canvasId].destroy();
        }
        
        // Prepare data based on chart type
        let labels, data, backgroundColor, borderColor;
        
        if (chartType === 'by-month') {
            labels = result.data.map(item => item.label || `${item.monthName} ${item.year}`);
            data = result.data.map(item => item.count);
            backgroundColor = 'rgba(37, 99, 235, 0.2)';
            borderColor = 'rgba(37, 99, 235, 1)';
        } else {
            const fieldMap = {
                'by-type': 'type',
                'by-status': 'status',
                'by-value': 'value',
                'by-classification': 'classification'
            };
            const field = fieldMap[chartType];
            labels = result.data.map(item => item[field] || 'Unknown');
            data = result.data.map(item => item.count);
            
            // Generate colors
            const colors = generateColors(data.length);
            backgroundColor = chartKind === 'line' ? 'rgba(37, 99, 235, 0.2)' : colors.background;
            borderColor = chartKind === 'line' ? 'rgba(37, 99, 235, 1)' : colors.border;
        }
        
        // Create chart configuration
        const config = {
            type: chartKind,
            data: {
                labels: labels,
                datasets: [{
                    label: title,
                    data: data,
                    backgroundColor: Array.isArray(backgroundColor) ? backgroundColor : [backgroundColor],
                    borderColor: Array.isArray(borderColor) ? borderColor : [borderColor],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: chartKind === 'line' ? 'top' : 'right',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        padding: 12,
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        }
                    }
                },
                scales: chartKind === 'line' || chartKind === 'bar' ? {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                } : {}
            }
        };
        
        chartInstances[canvasId] = new Chart(canvas, config);
    } catch (error) {
        console.error(`Failed to load ${chartType} chart:`, error);
    }
}

function generateColors(count) {
    const colorPalettes = [
        ['rgba(37, 99, 235, 0.8)', 'rgba(37, 99, 235, 1)'],      // Blue
        ['rgba(16, 185, 129, 0.8)', 'rgba(16, 185, 129, 1)'],    // Green
        ['rgba(245, 101, 101, 0.8)', 'rgba(245, 101, 101, 1)'],  // Red
        ['rgba(251, 191, 36, 0.8)', 'rgba(251, 191, 36, 1)'],    // Yellow
        ['rgba(139, 92, 246, 0.8)', 'rgba(139, 92, 246, 1)'],    // Purple
        ['rgba(236, 72, 153, 0.8)', 'rgba(236, 72, 153, 1)'],    // Pink
        ['rgba(20, 184, 166, 0.8)', 'rgba(20, 184, 166, 1)'],    // Teal
        ['rgba(249, 115, 22, 0.8)', 'rgba(249, 115, 22, 1)']     // Orange
    ];
    
    const background = [];
    const border = [];
    
    for (let i = 0; i < count; i++) {
        const palette = colorPalettes[i % colorPalettes.length];
        background.push(palette[0]);
        border.push(palette[1]);
    }
    
    return { background, border };
}
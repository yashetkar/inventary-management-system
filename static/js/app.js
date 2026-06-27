// ========================================== //
//                APPLICATION STATE           //
// ========================================== //

const state = {
    user: localStorage.getItem('user') || null,
    activeView: 'inventory',
    activeWorkspaceId: null,
    currentPage: 0,
    totalPages: 1,
    workspaces: [],
    products: [],
    alerts: {
        low_stock: [],
        due_alerts: []
    },
    alertsShown: new Set(),
    searchQuery: '',
    filterType: 'Newest First',
    reportsChart: null
};

// ========================================== //
//               DOM ELEMENTS                 //
// ========================================== //

const DOM = {
    // LAYERS
    authLayer: document.getElementById('auth-layer'),
    appLayer: document.getElementById('app-layer'),
    
    // AUTH
    loginForm: document.getElementById('login-form'),
    usernameInput: document.getElementById('username'),
    passwordInput: document.getElementById('password'),
    togglePasswordBtn: document.getElementById('toggle-password-btn'),
    loginError: document.getElementById('login-error'),
    userDisplayName: document.getElementById('user-display-name'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // SIDEBAR COLLAPSE
    appSidebar: document.getElementById('app-sidebar'),
    sidebarToggleBtn: document.getElementById('sidebar-toggle-btn'),
    
    // NAVIGATION
    navItems: document.querySelectorAll('.nav-item'),
    viewTitle: document.getElementById('view-title'),
    views: document.querySelectorAll('.content-view'),
    
    // WORKSPACE
    workspaceSelect: document.getElementById('active-workspace-select'),
    addWorkspaceBtn: document.getElementById('add-workspace-btn'),
    renameWorkspaceBtn: document.getElementById('rename-workspace-btn'),
    deleteWorkspaceBtn: document.getElementById('delete-workspace-btn'),
    
    // NOTIFICATIONS
    notificationBell: document.getElementById('notification-bell'),
    notificationBadge: document.getElementById('notification-badge'),
    notificationDropdown: document.getElementById('notification-dropdown'),
    notificationList: document.getElementById('notification-list'),
    clearNotifications: document.getElementById('clear-notifications'),
    
    // METRICS
    statActive: document.getElementById('stat-active'),
    statReturned: document.getElementById('stat-returned'),
    statLow: document.getElementById('stat-low'),
    statOverdue: document.getElementById('stat-overdue'),
    
    // PRODUCT MANAGEMENT
    addProductForm: document.getElementById('add-product-form'),
    addPName: document.getElementById('add-p-name'),
    addPModel: document.getElementById('add-p-model'),
    addPQty: document.getElementById('add-p-qty'),
    manageProductSelect: document.getElementById('manage-product-select'),
    editProductBtn: document.getElementById('edit-product-btn'),
    transferProductBtn: document.getElementById('transfer-product-btn'),
    deleteProductBtn: document.getElementById('delete-product-btn'),
    
    // ISSUE ASSET
    issueAssetForm: document.getElementById('issue-asset-form'),
    issueProductSelect: document.getElementById('issue-product-select'),
    issueRecipient: document.getElementById('issue-recipient'),
    issueRecipientId: document.getElementById('issue-recipient-id'),
    issueDepartmentSelect: document.getElementById('issue-department-select'),
    issueDepartmentManual: document.getElementById('issue-department-manual'),
    issueDepartmentManualRow: document.getElementById('issue-department-manual-row'),
    issueType: document.getElementById('issue-type'),
    issueSerial: document.getElementById('issue-serial'),
    issueStartDate: document.getElementById('issue-start-date'),
    issueEndDate: document.getElementById('issue-end-date'),
    issueEndDateContainer: document.getElementById('issue-return-date-container'),
    
    // RETURN ASSET
    returnAssetForm: document.getElementById('return-asset-form'),
    returnSearchKey: document.getElementById('return-search-key'),
    returnManualModeChk: document.getElementById('return-manual-mode-chk'),
    returnSelectContainer: document.getElementById('return-select-container'),
    returnAssetSelect: document.getElementById('return-asset-select'),
    returnEmpName: document.getElementById('return-emp-name'),
    returnDeptName: document.getElementById('return-dept-name'),
    returnDate: document.getElementById('return-date'),
    returnEwasteChk: document.getElementById('return-ewaste-chk'),
    returnRemark: document.getElementById('return-remark'),
    manualReturnModalBtn: document.getElementById('manual-return-modal-btn'),
    
    // TABLE
    operationsFormsGrid: document.getElementById('operations-forms-grid'),
    inventoryTableCard: document.getElementById('inventory-table-card'),
    tableFilterSelect: document.getElementById('table-filter-select'),
    tableSearchInput: document.getElementById('table-search-input'),
    tableSearchBtn: document.getElementById('table-search-btn'),
    tableExportBtn: document.getElementById('table-export-btn'),
    inventoryTableBody: document.getElementById('inventory-table-body'),
    paginationLabel: document.getElementById('pagination-label'),
    paginationPrev: document.getElementById('pagination-prev'),
    paginationNext: document.getElementById('pagination-next'),
    
    // E-WASTE & RETURNS
    ewasteTableBody: document.getElementById('ewaste-table-body'),
    ewasteExportBtn: document.getElementById('ewaste-export-btn'),
    returnsTableBody: document.getElementById('returns-table-body'),
    
    // REPORTS
    reportStatTotal: document.getElementById('report-stat-total'),
    reportStatActive: document.getElementById('report-stat-active'),
    reportStatReturned: document.getElementById('report-stat-returned'),
    reportsTopProductsBody: document.getElementById('reports-top-products-body'),
    
    // SECURITY
    changePasswordForm: document.getElementById('change-password-form'),
    oldPasswordInput: document.getElementById('old-password'),
    newPasswordInput: document.getElementById('new-password'),
    confirmPasswordInput: document.getElementById('confirm-password'),
    changePasswordStatus: document.getElementById('change-password-status'),
    
    // MODALS
    addWorkspaceModal: document.getElementById('add-workspace-modal'),
    addWorkspaceForm: document.getElementById('add-workspace-form'),
    workspaceNameInput: document.getElementById('workspace-name-input'),
    
    renameWorkspaceModal: document.getElementById('rename-workspace-modal'),
    renameWorkspaceForm: document.getElementById('rename-workspace-form'),
    renameWorkspaceNameInput: document.getElementById('rename-workspace-name-input'),
    
    editProductModal: document.getElementById('edit-product-modal'),
    editProductForm: document.getElementById('edit-product-form'),
    editPId: document.getElementById('edit-p-id'),
    editPNameInput: document.getElementById('edit-p-name-input'),
    editPModelInput: document.getElementById('edit-p-model-input'),
    editPQtyInput: document.getElementById('edit-p-qty-input'),
    
    transferProductModal: document.getElementById('transfer-product-modal'),
    transferProductForm: document.getElementById('transfer-product-form'),
    transferPId: document.getElementById('transfer-p-id'),
    transferWorkspaceSelect: document.getElementById('transfer-workspace-select'),
    
    manualReturnModal: document.getElementById('manual-return-modal'),
    manualReturnForm: document.getElementById('manual-return-form'),
    manualReturnProductSelect: document.getElementById('manual-return-product-select'),
    manualReturnSerial: document.getElementById('manual-return-serial'),
    manualReturnEmp: document.getElementById('manual-return-emp'),
    manualReturnDept: document.getElementById('manual-return-dept'),
    manualReturnEwaste: document.getElementById('manual-return-ewaste'),
    
    historyModal: document.getElementById('history-modal'),
    historyModalTitle: document.getElementById('history-modal-title'),
    historyTableBody: document.getElementById('history-table-body'),
    
    overdueModal: document.getElementById('overdue-modal'),
    overdueTableBody: document.getElementById('overdue-table-body'),
    
    importModal: document.getElementById('import-modal'),
    importExcelForm: document.getElementById('import-excel-form'),
    excelFileInput: document.getElementById('excel-file-input'),
    
    toastContainer: document.getElementById('toast-container')
};

// Autocomplete cache mapping for autofill
let autofillIssueMap = {};

// ========================================== //
//                 NOTIFICATION TOASTS        //
// ========================================== //

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'warning') icon = 'fa-triangle-exclamation';
    if (type === 'danger') icon = 'fa-circle-xmark';
    
    toast.innerHTML = `
        <i class="fa-solid ${icon} toast-icon"></i>
        <div class="toast-content">${message}</div>
        <i class="fa-solid fa-xmark toast-close"></i>
        <div class="toast-progress"></div>
    `;
    
    DOM.toastContainer.appendChild(toast);
    
    // Close handler
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// ========================================== //
//          ANIMATED COUNTER UTILITY          //
// ========================================== //

function animateCounter(element, targetValue, duration = 600) {
    const start = parseInt(element.textContent) || 0;
    const target = parseInt(targetValue) || 0;
    if (start === target) {
        element.textContent = target;
        return;
    }
    const diff = target - start;
    const startTime = performance.now();
    
    function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + diff * eased);
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            element.textContent = target;
            // Subtle bump effect
            element.classList.add('counter-animate', 'bump');
            setTimeout(() => element.classList.remove('bump'), 200);
        }
    }
    requestAnimationFrame(step);
}

// ========================================== //
//          EMPTY STATE ILLUSTRATION HTML     //
// ========================================== //

function getEmptyStateRowHtml(colspan, iconClass, title, subtitle = '') {
    return `
        <tr>
            <td colspan="${colspan}" style="padding: 0;">
                <div class="empty-state-wrapper">
                    <div class="empty-state-icon"><i class="${iconClass}"></i></div>
                    <h4 class="empty-state-title">${title}</h4>
                    ${subtitle ? `<p class="empty-state-subtitle">${subtitle}</p>` : ''}
                </div>
            </td>
        </tr>
    `;
}

// ========================================== //
//                  MODALS HANDLERS           //
// ========================================== //

function openModal(modal) {
    modal.classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
}

// Global modal triggers close on clicking 'X' or Cancel
document.querySelectorAll('[data-modal]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
        const modalId = trigger.getAttribute('data-modal');
        const modal = document.getElementById(modalId);
        closeModal(modal);
    });
});

// Close modal when clicking on window backdrop
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target);
    }
});

// ========================================== //
//             AUTHENTICATION FUNCTIONS       //
// ========================================== //

function checkAuth() {
    if (state.user) {
        DOM.authLayer.style.display = 'none';
        DOM.appLayer.style.display = 'flex';
        DOM.userDisplayName.textContent = state.user;
        initApp();
    } else {
        DOM.authLayer.style.display = 'flex';
        DOM.appLayer.style.display = 'none';
    }
}

DOM.togglePasswordBtn.addEventListener('click', () => {
    const isPass = DOM.passwordInput.getAttribute('type') === 'password';
    DOM.passwordInput.setAttribute('type', isPass ? 'text' : 'password');
    DOM.togglePasswordBtn.innerHTML = isPass ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
});

DOM.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    DOM.loginError.textContent = '';
    
    const username = DOM.usernameInput.value;
    const password = DOM.passwordInput.value;
    
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await res.json();
        if (res.ok && data.success) {
            state.user = data.username;
            localStorage.setItem('user', state.user);
            showToast('Signed in successfully', 'success');
            checkAuth();
        } else {
            DOM.loginError.textContent = data.error || 'Login failed';
        }
    } catch (err) {
        DOM.loginError.textContent = 'Server connection error';
    }
});

DOM.logoutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to exit?')) {
        state.user = null;
        localStorage.removeItem('user');
        state.workspaces = [];
        state.products = [];
        state.activeWorkspaceId = null;
        state.alertsShown.clear();
        checkAuth();
    }
});

// ========================================== //
//             SIDEBAR COLLAPSE LOGIC         //
// ========================================== //

if (DOM.sidebarToggleBtn && DOM.appSidebar) {
    // Click on toggle button explicitly toggles collapse state
    DOM.sidebarToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent immediate expand from the sidebar click listener
        const collapsed = DOM.appSidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebar_collapsed', collapsed ? 'true' : 'false');
    });

    // Expand sidebar if user clicks on it while it is collapsed
    DOM.appSidebar.addEventListener('click', (e) => {
        if (DOM.appSidebar.classList.contains('collapsed')) {
            DOM.appSidebar.classList.remove('collapsed');
            localStorage.setItem('sidebar_collapsed', 'false');
        }
    });

    // Collapse sidebar if user clicks anywhere outside of it
    document.addEventListener('click', (e) => {
        if (DOM.appSidebar && !DOM.appSidebar.contains(e.target) && !DOM.sidebarToggleBtn.contains(e.target)) {
            if (!DOM.appSidebar.classList.contains('collapsed')) {
                DOM.appSidebar.classList.add('collapsed');
                localStorage.setItem('sidebar_collapsed', 'true');
            }
        }
    });

    // Restore sidebar state from localStorage on startup (defaults to collapsed)
    const isCollapsed = localStorage.getItem('sidebar_collapsed') !== 'false';
    if (isCollapsed) {
        DOM.appSidebar.classList.add('collapsed');
    } else {
        DOM.appSidebar.classList.remove('collapsed');
    }
}

// ========================================== //
//                 ROUTING / SWITCH VIEWS     //
// ========================================== //

DOM.navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        switchView(view);
    });
});

function switchView(view) {
    state.activeView = view;
    
    // Update active navbar item
    DOM.navItems.forEach(item => {
        if (item.getAttribute('data-view') === view) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Toggle content views visibility
    DOM.views.forEach(v => {
        if (v.id === `view-${view}`) {
            v.classList.add('active');
        } else {
            v.classList.remove('active');
        }
    });
    
    // Title update & trigger data load
    let title = 'Inventory Overview';
    if (view === 'inventory') {
        title = 'Inventory Overview';
        loadWorkspaceInventory();
    } else if (view === 'ewaste') {
        title = 'E-Waste Logs';
        loadEWasteLogs();
    } else if (view === 'returns') {
        title = 'Returns History';
        loadReturnsHistory();
    } else if (view === 'reports') {
        title = 'Analytical Reports';
        loadReports();
    } else if (view === 'security') {
        title = 'Security & Profile settings';
    }
    
    DOM.viewTitle.textContent = title;
}

// ========================================== //
//              WORKSPACE OPERATIONS          //
// ========================================== //

async function loadWorkspaces() {
    try {
        const res = await fetch('/api/workspaces');
        const data = await res.json();
        state.workspaces = data;
        
        // Rebuild selector
        DOM.workspaceSelect.innerHTML = '';
        state.workspaces.forEach(ws => {
            const opt = document.createElement('option');
            opt.value = ws.id;
            opt.textContent = ws.name;
            DOM.workspaceSelect.appendChild(opt);
        });
        
        // Rebuild target workspaces for transfer modal
        DOM.transferWorkspaceSelect.innerHTML = '<option value="">-- Choose target workspace --</option>';
        state.workspaces.forEach(ws => {
            const opt = document.createElement('option');
            opt.value = ws.id;
            opt.textContent = ws.name;
            DOM.transferWorkspaceSelect.appendChild(opt);
        });
        
        if (state.workspaces.length > 0 && !state.activeWorkspaceId) {
            state.activeWorkspaceId = state.workspaces[0].id;
            DOM.workspaceSelect.value = state.activeWorkspaceId;
        }
    } catch (err) {
        showToast('Failed to load workspaces', 'danger');
    }
}

DOM.workspaceSelect.addEventListener('change', () => {
    state.activeWorkspaceId = parseInt(DOM.workspaceSelect.value);
    state.currentPage = 0;
    state.searchQuery = '';
    DOM.tableSearchInput.value = '';
    loadWorkspaceInventory();
});

// Create workspace
DOM.addWorkspaceBtn.addEventListener('click', () => {
    DOM.workspaceNameInput.value = '';
    openModal(DOM.addWorkspaceModal);
});

DOM.addWorkspaceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = DOM.workspaceNameInput.value;
    
    try {
        const res = await fetch('/api/workspaces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
            showToast('Workspace created successfully', 'success');
            closeModal(DOM.addWorkspaceModal);
            state.activeWorkspaceId = data.workspace_id;
            await loadWorkspaces();
            DOM.workspaceSelect.value = state.activeWorkspaceId;
            loadWorkspaceInventory();
        } else {
            alert(data.error || 'Failed to create workspace');
        }
    } catch (err) {
        showToast('Error saving workspace', 'danger');
    }
});

// Rename workspace
if (DOM.renameWorkspaceBtn) {
    DOM.renameWorkspaceBtn.addEventListener('click', () => {
        const ws = state.workspaces.find(w => w.id === state.activeWorkspaceId);
        if (!ws) return;
        if (ws.is_main) {
            showToast('Main inventory workspace cannot be renamed', 'warning');
            return;
        }
        DOM.renameWorkspaceNameInput.value = ws.name;
        openModal(DOM.renameWorkspaceModal);
    });
}

if (DOM.renameWorkspaceForm) {
    DOM.renameWorkspaceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = DOM.renameWorkspaceNameInput.value.trim();
        if (!name) return;

        try {
            const res = await fetch('/api/workspaces/rename', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspace_id: state.activeWorkspaceId, name })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                showToast('Workspace renamed successfully', 'success');
                closeModal(DOM.renameWorkspaceModal);
                await loadWorkspaces();
                DOM.workspaceSelect.value = state.activeWorkspaceId;
                loadWorkspaceInventory();
            } else {
                alert(data.error || 'Failed to rename workspace');
            }
        } catch (err) {
            showToast('Error renaming workspace', 'danger');
        }
    });
}

// Delete workspace
DOM.deleteWorkspaceBtn.addEventListener('click', async () => {
    const ws = state.workspaces.find(w => w.id === state.activeWorkspaceId);
    if (!ws) return;
    if (ws.is_main) {
        showToast('Main inventory workspace cannot be deleted', 'warning');
        return;
    }
    
    if (confirm(`Delete workspace "${ws.name}"? This deletes all stock and non-active transactions.`)) {
        try {
            const res = await fetch(`/api/workspaces/${state.activeWorkspaceId}`, { method: 'DELETE' });
            const data = await res.json();
            
            if (res.ok && data.success) {
                showToast('Workspace deleted', 'success');
                state.activeWorkspaceId = null;
                await loadWorkspaces();
                loadWorkspaceInventory();
            } else {
                alert(data.error || 'Deletion blocked');
            }
        } catch (err) {
            showToast('Connection error during deletion', 'danger');
        }
    }
});

// ========================================== //
//               STOCK / PRODUCT ACTIONS      //
// ========================================== //

async function loadProducts() {
    if (!state.activeWorkspaceId) return;
    try {
        const res = await fetch(`/api/products?workspace_id=${state.activeWorkspaceId}`);
        const data = await res.json();
        state.products = data;
        
        // Rebuild manage products selector
        if (DOM.manageProductSelect) {
        DOM.manageProductSelect.innerHTML = '<option value="">-- Choose product stock --</option>';
        state.products.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.name} (${p.model}) | Qty: ${p.quantity}`;
            DOM.manageProductSelect.appendChild(opt);
        });
        }

        // Rebuild issue forms product selector
        if (DOM.issueProductSelect) {
        DOM.issueProductSelect.innerHTML = '<option value="">-- Choose product stock --</option>';
        state.products.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.name} (${p.model}) | Qty: ${p.quantity}`;
            DOM.issueProductSelect.appendChild(opt);
        });
        }
        
        // Rebuild manual return products
        if (DOM.manualReturnProductSelect) {
        DOM.manualReturnProductSelect.innerHTML = '<option value="">-- Choose product --</option>';
        state.products.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.textContent = `${p.name} (${p.model})`;
            DOM.manualReturnProductSelect.appendChild(opt);
        });
        }
    } catch (err) {
        showToast('Error syncing workspace stock list', 'danger');
    }
}

// Add Product
if (DOM.addProductForm) {
DOM.addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = DOM.addPName.value;
    const model = DOM.addPModel.value;
    const quantity = parseInt(DOM.addPQty.value);
    
    try {
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, model, quantity, workspace_id: state.activeWorkspaceId })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
            showToast('Stock registered', 'success');
            DOM.addProductForm.reset();
            loadWorkspaceInventory();
        } else {
            alert(data.error || 'Failed to add stock');
        }
    } catch (err) {
        showToast('Server update error', 'danger');
    }
});
}

// Edit Product Stock
if (DOM.editProductBtn) {
DOM.editProductBtn.addEventListener('click', () => {
    const pid = DOM.manageProductSelect.value;
    if (!pid) {
        showToast('Select a product to edit first', 'warning');
        return;
    }
    const p = state.products.find(item => item.id === parseInt(pid));
    if (p) {
        DOM.editPId.value = p.id;
        DOM.editPNameInput.value = p.name;
        DOM.editPModelInput.value = p.model;
        DOM.editPQtyInput.value = p.quantity;
        openModal(DOM.editProductModal);
    }
});
}

DOM.editProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = parseInt(DOM.editPId.value);
    const name = DOM.editPNameInput.value;
    const model = DOM.editPModelInput.value;
    const quantity = parseInt(DOM.editPQtyInput.value);
    
    try {
        const res = await fetch('/api/products/edit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, name, model, quantity })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
            showToast('Product updated successfully', 'success');
            closeModal(DOM.editProductModal);
            loadWorkspaceInventory();
        } else {
            alert(data.error || 'Update failed');
        }
    } catch (err) {
        showToast('Connection error', 'danger');
    }
});

// Transfer Product Stock
if (DOM.transferProductBtn) {
DOM.transferProductBtn.addEventListener('click', () => {
    const pid = DOM.manageProductSelect.value;
    if (!pid) {
        showToast('Select a product to transfer first', 'warning');
        return;
    }
    DOM.transferPId.value = pid;
    DOM.transferWorkspaceSelect.value = '';
    openModal(DOM.transferProductModal);
});
}

DOM.transferProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const product_id = parseInt(DOM.transferPId.value);
    const target_workspace_id = parseInt(DOM.transferWorkspaceSelect.value);
    
    if (target_workspace_id === state.activeWorkspaceId) {
        showToast('Cannot transfer to the same workspace', 'warning');
        return;
    }
    
    try {
        const res = await fetch('/api/products/transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_id, target_workspace_id })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
            showToast('Inventory stock transferred', 'success');
            closeModal(DOM.transferProductModal);
            loadWorkspaceInventory();
        } else {
            alert(data.error || 'Transfer failed');
        }
    } catch (err) {
        showToast('Connection error', 'danger');
    }
});

// Delete Product
if (DOM.deleteProductBtn) {
DOM.deleteProductBtn.addEventListener('click', async () => {
    const pid = DOM.manageProductSelect.value;
    if (!pid) {
        showToast('Select a product to delete first', 'warning');
        return;
    }
    const p = state.products.find(item => item.id === parseInt(pid));
    if (confirm(`Delete product "${p.name} (${p.model})"?\nThis cannot be undone and will delete past history if no assets are active.`)) {
        try {
            const res = await fetch(`/api/products/delete?id=${pid}`, { method: 'DELETE' });
            const data = await res.json();
            
            if (res.ok && data.success) {
                showToast('Product deleted successfully', 'success');
                loadWorkspaceInventory();
            } else {
                alert(data.error || 'Delete failed');
            }
        } catch (err) {
            showToast('Connection error during deletion', 'danger');
        }
    }
});
}

// ========================================== //
//                 ISSUE ASSETS               //
// ========================================== //

if (DOM.issueType) {
DOM.issueType.addEventListener('change', () => {
    if (DOM.issueType.value === 'Temporary') {
        DOM.issueEndDateContainer.style.display = 'block';
        DOM.issueEndDate.setAttribute('required', 'true');
    } else {
        DOM.issueEndDateContainer.style.display = 'none';
        DOM.issueEndDate.removeAttribute('required');
        DOM.issueEndDate.value = '';
    }
});
}

if (DOM.issueDepartmentSelect) {
DOM.issueDepartmentSelect.addEventListener('change', () => {
    if (DOM.issueDepartmentSelect.value === 'Other') {
        DOM.issueDepartmentManualRow.style.display = 'flex';
        DOM.issueDepartmentManual.setAttribute('required', 'true');
    } else {
        DOM.issueDepartmentManualRow.style.display = 'none';
        DOM.issueDepartmentManual.removeAttribute('required');
        DOM.issueDepartmentManual.value = '';
    }
});
}

if (DOM.issueAssetForm) {
DOM.issueAssetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const selectedDept = DOM.issueDepartmentSelect.value;
    const finalDept = selectedDept === 'Other' ? DOM.issueDepartmentManual.value.trim() : selectedDept;
    
    const payload = {
        product_id: parseInt(DOM.issueProductSelect.value),
        recipient: DOM.issueRecipient.value,
        recipient_id: DOM.issueRecipientId.value,
        department: finalDept,
        type: DOM.issueType.value,
        start_date: DOM.issueStartDate.value,
        end_date: DOM.issueEndDate.value,
        serial_no: DOM.issueSerial.value,
        workspace_id: state.activeWorkspaceId
    };
    
    try {
        const res = await fetch('/api/assets/issue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
            showToast('Asset issued successfully', 'success');
            DOM.issueAssetForm.reset();
            DOM.issueEndDateContainer.style.display = 'none';
            if (DOM.issueDepartmentManualRow) {
                DOM.issueDepartmentManualRow.style.display = 'none';
                DOM.issueDepartmentManual.removeAttribute('required');
            }
            loadWorkspaceInventory();
        } else {
            alert(data.error || 'Asset issue failed');
        }
    } catch (err) {
        showToast('Connection error', 'danger');
    }
});
}

// ========================================== //
//                 RETURNS WORKFLOW           //
// ========================================== //

// Toggle Manual Mode
if (DOM.returnManualModeChk) {
DOM.returnManualModeChk.addEventListener('change', () => {
    const isManual = DOM.returnManualModeChk.checked;
    if (isManual) {
        DOM.returnSelectContainer.style.display = 'none';
        DOM.returnEmpName.removeAttribute('readonly');
        DOM.returnDeptName.removeAttribute('readonly');
        DOM.returnEmpName.value = '';
        DOM.returnDeptName.value = '';
    } else {
        DOM.returnSelectContainer.style.display = 'block';
        DOM.returnEmpName.setAttribute('readonly', 'true');
        DOM.returnDeptName.setAttribute('readonly', 'true');
        autofillReturnDropdown();
    }
});
}

// Delayed autocomplete search key
let returnSearchTimeout = null;
if (DOM.returnSearchKey) {
DOM.returnSearchKey.addEventListener('input', () => {
    clearTimeout(returnSearchTimeout);
    returnSearchTimeout = setTimeout(() => {
        if (!DOM.returnManualModeChk.checked) {
            autofillReturnDropdown();
        }
    }, 300);
});
}

async function autofillReturnDropdown() {
    if (!DOM.returnSearchKey || !DOM.returnAssetSelect) return;
    const key = DOM.returnSearchKey.value.trim();
    if (!key) {
        DOM.returnAssetSelect.innerHTML = '<option value="">-- Type search key --</option>';
        DOM.returnEmpName.value = '';
        DOM.returnDeptName.value = '';
        return;
    }
    
    try {
        const res = await fetch(`/api/assets/autofill?key=${encodeURIComponent(key)}`);
        const data = await res.json();
        
        autofillIssueMap = {};
        DOM.returnAssetSelect.innerHTML = '';
        
        if (data.length === 0) {
            DOM.returnAssetSelect.innerHTML = '<option value="">-- No matching active assets --</option>';
            DOM.returnEmpName.value = '';
            DOM.returnDeptName.value = '';
            return;
        }
        
        data.forEach(item => {
            const label = `${item.serial_no} | ${item.name} (${item.model})`;
            autofillIssueMap[item.id] = item;
            
            const opt = document.createElement('option');
            opt.value = item.id;
            opt.textContent = label;
            DOM.returnAssetSelect.appendChild(opt);
        });
        
        selectReturnedDetails();
    } catch (err) {
        console.error('Autofill sync error', err);
    }
}

if (DOM.returnAssetSelect) {
DOM.returnAssetSelect.addEventListener('change', selectReturnedDetails);
}

function selectReturnedDetails() {
    const issueId = DOM.returnAssetSelect.value;
    if (!issueId || !autofillIssueMap[issueId]) {
        DOM.returnEmpName.value = '';
        DOM.returnDeptName.value = '';
        return;
    }
    
    const activeIssue = autofillIssueMap[issueId];
    DOM.returnEmpName.value = activeIssue.recipient;
    DOM.returnDeptName.value = activeIssue.department;
}

// Return form submit
if (DOM.returnAssetForm) {
DOM.returnAssetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const manual = DOM.returnManualModeChk.checked;
    
    let payload = {
        manual_return: manual,
        return_date: DOM.returnDate.value,
        remark: DOM.returnRemark.value,
        damaged_ewaste: DOM.returnEwasteChk.checked,
        workspace_id: state.activeWorkspaceId
    };
    
    if (manual) {
        payload.serial_no = DOM.returnSearchKey.value.trim();
        payload.recipient = DOM.returnEmpName.value;
        payload.department = DOM.returnDeptName.value;
        
        // Manual mode requires select product dropdown from Issue form list
        const issueProductSelectValue = DOM.issueProductSelect.value;
        if (!issueProductSelectValue) {
            alert('To register a manual return, please select the target product category in the "Issue Asset" dropdown list first!');
            return;
        }
        payload.product_id = parseInt(issueProductSelectValue);
    } else {
        const issue_id = parseInt(DOM.returnAssetSelect.value);
        if (!issue_id) {
            showToast('Choose active asset log to return', 'warning');
            return;
        }
        payload.issue_id = issue_id;
    }
    
    try {
        const res = await fetch('/api/assets/return', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
            showToast('Return logged successfully', 'success');
            DOM.returnAssetForm.reset();
            DOM.returnSelectContainer.style.display = 'block';
            DOM.returnEmpName.setAttribute('readonly', 'true');
            DOM.returnDeptName.setAttribute('readonly', 'true');
            loadWorkspaceInventory();
        } else {
            alert(data.error || 'Failed to process return');
        }
    } catch (err) {
        showToast('Connection error', 'danger');
    }
});
}

// Manual return modal triggers
if (DOM.manualReturnModalBtn) {
DOM.manualReturnModalBtn.addEventListener('click', () => {
    DOM.manualReturnForm.reset();
    openModal(DOM.manualReturnModal);
});
}

DOM.manualReturnForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        manual_return: true,
        product_id: parseInt(DOM.manualReturnProductSelect.value),
        serial_no: DOM.manualReturnSerial.value,
        recipient: DOM.manualReturnEmp.value,
        department: DOM.manualReturnDept.value,
        return_date: new Date().toISOString().substring(0, 10),
        remark: 'Manual Return (Custom Modal)',
        damaged_ewaste: DOM.manualReturnEwaste.checked,
        workspace_id: state.activeWorkspaceId
    };
    
    try {
        const res = await fetch('/api/assets/return', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
            showToast('Manual return logged', 'success');
            closeModal(DOM.manualReturnModal);
            loadWorkspaceInventory();
        } else {
            alert(data.error || 'Submission failed');
        }
    } catch (err) {
        showToast('Server update error', 'danger');
    }
});

// ========================================== //
//             TABLE & LOGS ACTIONS           //
// ========================================== //

async function loadTableLogs() {
    if (!state.activeWorkspaceId) return;
    const filter = state.filterType;
    const search = state.searchQuery;
    const page = state.currentPage;
    
    try {
        const res = await fetch(`/api/assets/search?workspace_id=${state.activeWorkspaceId}&filter=${encodeURIComponent(filter)}&search=${encodeURIComponent(search)}&page=${page}`);
        const data = await res.json();
        
        DOM.inventoryTableBody.innerHTML = '';
        if (data.rows.length === 0) {
            DOM.inventoryTableBody.innerHTML = getEmptyStateRowHtml(12, 'fa-solid fa-magnifying-glass', 'No Matching Assets Found', 'Try adjusting your search keywords or filter settings.');
            DOM.paginationLabel.textContent = 'Page 1 / 1';
            state.totalPages = 1;
            return;
        }
        
        data.rows.forEach((r, index) => {
            const tr = document.createElement('tr');
            
            // Staggered fade-in animation
            tr.classList.add('animate-in');
            tr.style.animationDelay = `${index * 30}ms`;
            
            // Highlight tag styles
            if (r.status === 'Returned') tr.classList.add('row-returned');
            else if (r.status === 'OVERDUE') tr.classList.add('row-overdue');
            
            const returnDueVal = r.returned ? r.return_date : (r.end_date || 'N/A');
            
            // Build action buttons
            const actionsTd = document.createElement('td');
            actionsTd.className = 'btn-group';
            
            const btnHistory = document.createElement('button');
            btnHistory.className = 'btn btn-outline btn-sm';
            btnHistory.innerHTML = '<i class="fa-solid fa-clock-rotate-left"></i>';
            btnHistory.title = 'View Log History';
            btnHistory.addEventListener('click', () => showHistory(r.serial_no));
            
            const btnDelete = document.createElement('button');
            btnDelete.className = 'btn btn-danger btn-sm';
            btnDelete.innerHTML = '<i class="fa-regular fa-trash-can"></i>';
            btnDelete.title = 'Delete Log & Re-Stock';
            btnDelete.addEventListener('click', () => deleteIssue(r.id, r.serial_no));
            
            actionsTd.appendChild(btnHistory);
            actionsTd.appendChild(btnDelete);
            
            tr.innerHTML = `
                <td><b>${r.serial_no}</b></td>
                <td>${r.product_name || '—'}</td>
                <td>${r.product_model || '—'}</td>
                <td>${r.recipient || '—'}</td>
                <td>${r.recipient_id || '—'}</td>
                <td>${r.department || '—'}</td>
                <td>${r.type || '—'}</td>
                <td>${r.start_date || '—'}</td>
                <td>${returnDueVal || '—'}</td>
                <td><span class="status-pill ${r.status.toLowerCase()}">${r.status}</span></td>
                <td>${r.remark || '—'}</td>
            `;
            tr.appendChild(actionsTd);
            
            // Double click trigger history
            tr.addEventListener('dblclick', () => showHistory(r.serial_no));
            
            DOM.inventoryTableBody.appendChild(tr);
        });
        
        // Pagination logic
        state.totalPages = Math.max(1, Math.ceil(data.total_rows / data.limit));
        DOM.paginationLabel.textContent = `Page ${state.currentPage + 1} / ${state.totalPages}`;
        
        DOM.paginationPrev.disabled = state.currentPage === 0;
        DOM.paginationNext.disabled = state.currentPage + 1 >= state.totalPages;
    } catch (err) {
        showToast('Error displaying logs ledger', 'danger');
    }
}

DOM.tableFilterSelect.addEventListener('change', () => {
    state.filterType = DOM.tableFilterSelect.value;
    state.currentPage = 0;
    loadTableLogs();
});

let tableSearchTimeout = null;
DOM.tableSearchInput.addEventListener('input', () => {
    clearTimeout(tableSearchTimeout);
    tableSearchTimeout = setTimeout(() => {
        state.searchQuery = DOM.tableSearchInput.value.trim();
        state.currentPage = 0;
        loadTableLogs();
    }, 300);
});

DOM.tableSearchBtn.addEventListener('click', () => {
    clearTimeout(tableSearchTimeout);
    state.searchQuery = DOM.tableSearchInput.value.trim();
    state.currentPage = 0;
    loadTableLogs();
});

DOM.tableSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        clearTimeout(tableSearchTimeout);
        state.searchQuery = DOM.tableSearchInput.value.trim();
        state.currentPage = 0;
        loadTableLogs();
    }
});

// Pagination
DOM.paginationPrev.addEventListener('click', () => {
    if (state.currentPage > 0) {
        state.currentPage--;
        loadTableLogs();
    }
});

DOM.paginationNext.addEventListener('click', () => {
    if (state.currentPage + 1 < state.totalPages) {
        state.currentPage++;
        loadTableLogs();
    }
});

// Delete Issue Record
async function deleteIssue(id, serial) {
    if (confirm(`Delete issue record for serial "${serial}"?\nUnreturned items will restore +1 stock.`)) {
        try {
            const res = await fetch(`/api/assets/delete?issue_id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast('Record removed successfully', 'success');
                loadWorkspaceInventory();
            } else {
                alert(data.error || 'Failed to remove log');
            }
        } catch (err) {
            showToast('Server update error', 'danger');
        }
    }
}

// Show History Modal
async function showHistory(serial) {
    DOM.historyModalTitle.textContent = `Asset Logs History - ${serial}`;
    DOM.historyTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Loading audit history...</td></tr>';
    openModal(DOM.historyModal);
    
    try {
        const res = await fetch(`/api/assets/history?serial_no=${encodeURIComponent(serial)}`);
        const data = await res.json();
        
        DOM.historyTableBody.innerHTML = '';
        if (data.length === 0) {
            DOM.historyTableBody.innerHTML = getEmptyStateRowHtml(5, 'fa-solid fa-clock-rotate-left', 'No History Logs Found', 'No transactions or return cycles recorded for this serial.');
            return;
        }
        
        data.forEach(h => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${h.date || '—'}</td>
                <td><span class="status-pill ${h.action.toLowerCase()}">${h.action}</span></td>
                <td>${h.user || '—'}</td>
                <td>${h.department || '—'}</td>
                <td>${h.remark || '—'}</td>
            `;
            DOM.historyTableBody.appendChild(tr);
        });
    } catch (err) {
        DOM.historyTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Failed to retrieve audit log from DB.</td></tr>';
    }
}

// Export Excel Log File
DOM.tableExportBtn.addEventListener('click', () => {
    if (!state.activeWorkspaceId) return;
    window.location.href = `/api/excel/export?workspace_id=${state.activeWorkspaceId}&filter=${encodeURIComponent(state.filterType)}&search=${encodeURIComponent(state.searchQuery)}`;
});

// ========================================== //
//                 E-WASTE LEDGER             //
// ========================================== //

async function loadEWasteLogs() {
    try {
        const res = await fetch('/api/ewaste');
        const data = await res.json();
        
        DOM.ewasteTableBody.innerHTML = '';
        if (data.length === 0) {
            DOM.ewasteTableBody.innerHTML = getEmptyStateRowHtml(7, 'fa-solid fa-trash-can-slash', 'E-Waste Storage Vault is Empty', 'No assets have been disposed of in this workspace.');
            return;
        }
        
        data.forEach(e => {
            const tr = document.createElement('tr');
            
            const actionsTd = document.createElement('td');
            actionsTd.className = 'btn-group';
            
            const btnRestore = document.createElement('button');
            btnRestore.className = 'btn btn-success btn-sm';
            btnRestore.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Restore to Stock';
            btnRestore.addEventListener('click', () => restoreEWaste(e.id, e.serial_no));
            
            const btnDelete = document.createElement('button');
            btnDelete.className = 'btn btn-danger btn-sm';
            btnDelete.innerHTML = '<i class="fa-regular fa-trash-can"></i> Delete';
            btnDelete.addEventListener('click', () => deleteEWaste(e.id, e.serial_no));
            
            actionsTd.appendChild(btnRestore);
            actionsTd.appendChild(btnDelete);
            
            tr.innerHTML = `
                <td>${e.name || '—'}</td>
                <td>${e.model || '—'}</td>
                <td><b>${e.serial_no}</b></td>
                <td>${e.ewaste_date || '—'}</td>
                <td>${e.remark || '—'}</td>
                <td>${e.workspace_name || 'Deleted Workspace'}</td>
            `;
            tr.appendChild(actionsTd);
            DOM.ewasteTableBody.appendChild(tr);
        });
    } catch (err) {
        showToast('Error fetching E-Waste files', 'danger');
    }
}

async function restoreEWaste(id, serial) {
    if (confirm(`Restore asset "${serial}" from E-waste back to inventory stock?`)) {
        try {
            const res = await fetch('/api/ewaste/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast('Asset restored to stock inventory', 'success');
                loadEWasteLogs();
            } else {
                alert(data.error || 'Restore failed');
            }
        } catch (err) {
            showToast('Server update error', 'danger');
        }
    }
}

async function deleteEWaste(id, serial) {
    if (confirm(`Permanently delete E-Waste disposal record for "${serial}"?\nThis action is irreversible.`)) {
        try {
            const res = await fetch(`/api/ewaste/delete?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast('Record deleted permanently', 'success');
                loadEWasteLogs();
            } else {
                alert(data.error || 'Delete failed');
            }
        } catch (err) {
            showToast('Server update error', 'danger');
        }
    }
}

DOM.ewasteExportBtn.addEventListener('click', () => {
    // Basic CSV download or alert
    window.location.href = '/api/excel/export?filter=Only Returned'; // export returned as base placeholder logic
});

// ========================================== //
//                 RETURNS HISTORY            //
// ========================================== //

async function loadReturnsHistory() {
    try {
        const res = await fetch('/api/returns');
        const data = await res.json();
        
        DOM.returnsTableBody.innerHTML = '';
        if (data.length === 0) {
            DOM.returnsTableBody.innerHTML = getEmptyStateRowHtml(7, 'fa-solid fa-clipboard-check', 'No Returns Logged Yet', 'Assets returned by employees will show up in this ledger.');
            return;
        }
        
        data.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${r.serial_no}</b></td>
                <td>${r.name || '—'}</td>
                <td>${r.model || '—'}</td>
                <td>${r.recipient || '—'}</td>
                <td>${r.department || '—'}</td>
                <td>${r.return_date || '—'}</td>
                <td><span class="status-pill returned">${r.type}</span></td>
            `;
            DOM.returnsTableBody.appendChild(tr);
        });
    } catch (err) {
        showToast('Error syncing returns registry', 'danger');
    }
}

// ========================================== //
//                   REPORTS                  //
// ========================================== //

async function loadReports() {
    try {
        const res = await fetch('/api/reports/stats');
        const data = await res.json();
        
        animateCounter(DOM.reportStatTotal, data.total);
        animateCounter(DOM.reportStatActive, data.active);
        animateCounter(DOM.reportStatReturned, data.returned);
        
        const canvas = document.getElementById('reports-chart');
        if (!canvas) return;
        
        // Destroy previous chart instance if it exists
        if (state.reportsChart) {
            state.reportsChart.destroy();
            state.reportsChart = null;
        }
        
        if (data.top_products.length === 0) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = '14px Outfit, sans-serif';
            ctx.fillStyle = '#64748b';
            ctx.textAlign = 'center';
            ctx.fillText('No log transaction data available for frequency graphs.', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        const labels = data.top_products.map(p => p.name);
        const counts = data.top_products.map(p => p.usage_count);
        
        const ctx = canvas.getContext('2d');
        
        // Create elegant gradient color matching design theme (indigo-violet)
        const gradient = ctx.createLinearGradient(0, 0, 0, 350);
        gradient.addColorStop(0, '#8b5cf6'); // Accent (violet)
        gradient.addColorStop(1, '#6366f1'); // Primary (indigo)
        
        state.reportsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Issues Issued',
                    data: counts,
                    backgroundColor: gradient,
                    borderRadius: 8,
                    borderSkipped: false,
                    barThickness: 32,
                    maxBarThickness: 45
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#1e1b4b',
                        titleFont: { family: 'Outfit', size: 13, weight: 'bold' },
                        bodyFont: { family: 'Inter', size: 12 },
                        padding: 12,
                        borderRadius: 8
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: { family: 'Outfit', size: 12, weight: 600 },
                            color: '#64748b'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#e2e8f0',
                            drawBorder: false
                        },
                        ticks: {
                            precision: 0,
                            font: { family: 'Inter', size: 12 },
                            color: '#94a3b8'
                        }
                    }
                }
            }
        });
    } catch (err) {
        console.error(err);
        showToast('Failed to load analytical reports', 'danger');
    }
}

// ========================================== //
//              SECURITY SETTINGS             //
// ========================================== //

DOM.changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    DOM.changePasswordStatus.className = 'status-msg';
    DOM.changePasswordStatus.textContent = '';
    
    const old_password = DOM.oldPasswordInput.value;
    const new_password = DOM.newPasswordInput.value;
    const confirm_password = DOM.confirmPasswordInput.value;
    
    if (new_password !== confirm_password) {
        DOM.changePasswordStatus.classList.add('error');
        DOM.changePasswordStatus.textContent = 'New passwords do not match';
        return;
    }
    
    try {
        const res = await fetch('/api/auth/change_password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: state.user, old_password, new_password })
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
            DOM.changePasswordStatus.classList.add('success');
            DOM.changePasswordStatus.textContent = 'Password updated successfully!';
            DOM.changePasswordForm.reset();
        } else {
            DOM.changePasswordStatus.classList.add('error');
            DOM.changePasswordStatus.textContent = data.error || 'Failed to update password';
        }
    } catch (err) {
        DOM.changePasswordStatus.classList.add('error');
        DOM.changePasswordStatus.textContent = 'Server connection error';
    }
});

// ========================================== //
//               BACKGROUND ALERTS            //
// ========================================== //

async function checkBackgroundAlerts() {
    if (!state.user) return;
    try {
        const res = await fetch(`/api/alerts?workspace_id=${state.activeWorkspaceId || 0}`);
        const data = await res.json();
        state.alerts = data;
        
        // Sync badge count
        const alertCount = data.low_stock.length + data.due_alerts.length;
        if (alertCount > 0) {
            DOM.notificationBadge.style.display = 'flex';
            DOM.notificationBadge.textContent = alertCount;
        } else {
            DOM.notificationBadge.style.display = 'none';
        }
        
        // Rebuild notifications list
        DOM.notificationList.innerHTML = '';
        if (alertCount === 0) {
            DOM.notificationList.innerHTML = '<p class="empty-state">No active alerts.</p>';
            return;
        }
        
        // Render Low Stock
        data.low_stock.forEach(item => {
            const key = `low:${item.name}:${item.model}`;
            if (!state.alertsShown.has(key)) {
                state.alertsShown.add(key);
                showToast(`Low Stock Alert: ${item.name} (${item.model}) quantity is ${item.quantity}!`, 'warning');
            }
            
            const div = document.createElement('div');
            div.className = 'notification-item low-stock';
            div.innerHTML = `
                <i class="fa-solid fa-triangle-exclamation"></i>
                <div>
                    <p><b>Low Stock</b>: ${item.name} (${item.model})</p>
                    <small>Available Qty: ${item.quantity}</small>
                </div>
            `;
            DOM.notificationList.appendChild(div);
        });
        
        // Render Due alerts
        data.due_alerts.forEach(item => {
            const key = `due:${item.serial_no}:${item.end_date}`;
            if (!state.alertsShown.has(key)) {
                state.alertsShown.add(key);
                showToast(`Loan Alert: Serial ${item.serial_no} loaned to ${item.recipient} is ${item.status}!`, 'danger');
            }
            
            const div = document.createElement('div');
            div.className = 'notification-item due-soon';
            div.innerHTML = `
                <i class="fa-solid fa-hourglass-end"></i>
                <div>
                    <p><b>${item.status}</b>: Serial ${item.serial_no}</p>
                    <small>User: ${item.recipient} | Workspace: ${item.workspace_name}</small>
                </div>
            `;
            DOM.notificationList.appendChild(div);
        });
        
        // Trigger red visual styling on metrics cards
        animateCounter(DOM.statLow, data.low_stock.length);
        const overdueCount = data.due_alerts.filter(x => x.status === 'OVERDUE' || x.status === 'DUE TODAY').length;
        animateCounter(DOM.statOverdue, overdueCount);
        
        // Add pulse animation to overdue badge if there are alerts
        const overdueBadge = document.getElementById('metric-card-overdue');
        if (overdueCount > 0) {
            overdueBadge.classList.add('has-alerts');
        } else {
            overdueBadge.classList.remove('has-alerts');
        }
        
        // Ring the bell when new alerts are found
        if (alertCount > 0) {
            DOM.notificationBell.classList.add('ring');
            setTimeout(() => DOM.notificationBell.classList.remove('ring'), 700);
        }
    } catch (err) {
        console.error('Error fetching dashboard warnings', err);
    }
}

// Notification bells click toggler
DOM.notificationBell.addEventListener('click', (e) => {
    e.stopPropagation();
    DOM.notificationDropdown.classList.toggle('active');
});

document.addEventListener('click', () => {
    DOM.notificationDropdown.classList.remove('active');
});

DOM.clearNotifications.addEventListener('click', () => {
    state.alertsShown.clear();
    showToast('Alert notification flags reset.', 'success');
});

// Click overdue metrics card opens popups
document.getElementById('metric-card-overdue').addEventListener('click', async () => {
    DOM.overdueTableBody.innerHTML = '<tr><td colspan="8" class="text-center">Loading overdue logs...</td></tr>';
    openModal(DOM.overdueModal);
    
    try {
        const res = await fetch(`/api/assets/overdue?workspace_id=${state.activeWorkspaceId || 0}`);
        const data = await res.json();
        
        DOM.overdueTableBody.innerHTML = '';
        if (data.length === 0) {
            DOM.overdueTableBody.innerHTML = getEmptyStateRowHtml(8, 'fa-solid fa-circle-check text-success', 'All Loans are Up-to-Date', 'No overdue temporary asset loans found.');
            return;
        }
        
        data.forEach(o => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${o.serial_no}</b></td>
                <td>${o.name || '—'}</td>
                <td>${o.model || '—'}</td>
                <td>${o.recipient || '—'}</td>
                <td>${o.recipient_id || '—'}</td>
                <td>${o.department || '—'}</td>
                <td>${o.start_date || '—'}</td>
                <td class="text-danger"><b>${o.end_date || '—'}</b></td>
            `;
            DOM.overdueTableBody.appendChild(tr);
        });
    } catch (err) {
        DOM.overdueTableBody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Failed to fetch overdue data list.</td></tr>';
    }
});

// Click low stock metrics card scrolls down or filter active
document.getElementById('metric-card-lowstock').addEventListener('click', () => {
    if (DOM.manageProductSelect) DOM.manageProductSelect.focus();
    showToast('Low stock items detected — check your product inventory', 'warning');
});

// ========================================== //
//                 EXCEL UPLOAD/IMPORT        //
// ========================================== //

// Button header trigger import Modal
const importBtn = document.querySelector('button[title="Import📥"]') || document.getElementById('table-import-btn');
if (importBtn) {
    importBtn.addEventListener('click', (e) => {
        e.preventDefault();
        DOM.excelFileInput.value = '';
        openModal(DOM.importModal);
    });
}

DOM.importExcelForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = DOM.excelFileInput.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspace_id', state.activeWorkspaceId);
    
    try {
        showToast('Uploading and importing spreadsheet...', 'info');
        const res = await fetch('/api/excel/import', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        
        if (res.ok && data.success) {
            showToast('Excel sheet items imported successfully!', 'success');
            closeModal(DOM.importModal);
            loadWorkspaceInventory();
        } else {
            alert(data.error || 'Import failed');
        }
    } catch (err) {
        showToast('Connection error during upload', 'danger');
    }
});

// ========================================== //
//                 SYNC/REFRESH SYSTEM        //
// ========================================== //

async function loadWorkspaceInventory() {
    if (!state.activeWorkspaceId) return;
    
    // Toggle forms and table visibility based on whether active workspace is Main Inventory
    const activeWS = state.workspaces.find(ws => ws.id === state.activeWorkspaceId);
    const isMain = activeWS ? activeWS.is_main === 1 : false;
    
    if (DOM.operationsFormsGrid && DOM.inventoryTableCard) {
        const toggleFormsBtn = document.getElementById('toggle-forms-btn');
        if (isMain) {
            DOM.operationsFormsGrid.style.setProperty('display', 'none', 'important');
            DOM.inventoryTableCard.style.display = 'block';
            if (toggleFormsBtn) toggleFormsBtn.style.display = 'none';
        } else {
            DOM.operationsFormsGrid.style.removeProperty('display');
            DOM.inventoryTableCard.style.display = 'block';
            if (toggleFormsBtn) toggleFormsBtn.style.display = 'inline-flex';
        }
    }
    
    // Sync metrics dashboard numbers
    try {
        const res = await fetch(`/api/assets/search?workspace_id=${state.activeWorkspaceId}&limit=1000`);
        const data = await res.json();
        
        const active = data.rows.filter(x => x.status === 'Active' || x.status === 'OVERDUE').length;
        const returned = data.rows.filter(x => x.status === 'Returned').length;
        
        animateCounter(DOM.statActive, active);
        animateCounter(DOM.statReturned, returned);
    } catch (err) {
        console.error('Error fetching statistics', err);
    }
    
    // Load products list and reload logs table
    await loadProducts();
    await loadTableLogs();
}

async function initApp() {
    // Load current dates as defaults
    const today = new Date().toISOString().substring(0, 10);
    if (DOM.issueStartDate) DOM.issueStartDate.value = today;
    if (DOM.returnDate) DOM.returnDate.value = today;
    
    await loadWorkspaces();
    await loadWorkspaceInventory();
    
    // Load alert engine loops
    checkBackgroundAlerts();
    setInterval(checkBackgroundAlerts, 15000);
}

// Startup check
checkAuth();

// Collapsible forms dashboard panel logic
(function() {
    const toggleFormsBtn = document.getElementById('toggle-forms-btn');
    const operationsFormsGrid = document.getElementById('operations-forms-grid');
    
    if (toggleFormsBtn && operationsFormsGrid) {
        function updateFormsBtnUI(isCollapsed) {
            if (isCollapsed) {
                toggleFormsBtn.innerHTML = '<i class="fa-solid fa-chevron-down"></i> Show Forms';
            } else {
                toggleFormsBtn.innerHTML = '<i class="fa-solid fa-chevron-up"></i> Hide Forms';
            }
        }
        
        toggleFormsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const collapsed = operationsFormsGrid.classList.toggle('collapsed');
            localStorage.setItem('forms_collapsed', collapsed ? 'true' : 'false');
            updateFormsBtnUI(collapsed);
        });
        
        // Restore forms grid collapse preference on startup
        const isCollapsed = localStorage.getItem('forms_collapsed') === 'true';
        if (isCollapsed) {
            operationsFormsGrid.classList.add('collapsed');
        }
        updateFormsBtnUI(isCollapsed);
    }
})();

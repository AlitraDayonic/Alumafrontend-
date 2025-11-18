// Configuration
const API_BASE_URL = 'https://aluma-banking-backend.onrender.com/api/v1';

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('aluma_access_token') || sessionStorage.getItem('aluma_access_token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return token;
}

// Get headers with auth token
function getHeaders() {
    const token = localStorage.getItem('aluma_access_token') || sessionStorage.getItem('aluma_access_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Handle API errors
async function handleApiError(response) {
    if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('aluma_access_token');
        localStorage.removeItem('aluma_refresh_token');
        localStorage.removeItem('aluma_user');
        sessionStorage.removeItem('aluma_access_token');
        sessionStorage.removeItem('aluma_refresh_token');
        sessionStorage.removeItem('aluma_user');
        window.location.href = 'login.html';
        return;
    }
    
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.error?.message || 'An error occurred');
}

// Format currency
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Load user profile
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            await handleApiError(response);
            return;
        }

        const data = await response.json();
        console.log('User profile response:', data); // Debug log
        
        if (data.success && data.data) {
            const user = data.data.user || data.data;
            
            // Update UI - with safety checks (backend uses snake_case)
            const displayName = user.first_name || user.username || 'User';
            const displayEmail = user.email || '';
            
            document.getElementById('userName').textContent = displayName;
            document.getElementById('userEmail').textContent = displayEmail;
            
            // Update avatar
            const avatar = document.getElementById('userAvatar');
            if (avatar && displayName) {
                avatar.textContent = displayName.charAt(0).toUpperCase();
            }
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
        // Set defaults on error
        document.getElementById('userName').textContent = 'User';
        document.getElementById('userEmail').textContent = '';
    }
}

// Load accounts
async function loadAccounts() {
    try {
        const response = await fetch(`${API_BASE_URL}/accounts`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            await handleApiError(response);
            return;
        }

        const data = await response.json();
        console.log('Accounts response:', data); // Debug log
        
        if (data.success && data.data) {
            // Handle different response formats
            const accounts = Array.isArray(data.data) ? data.data : (data.data.accounts || []);
            
            // Calculate total balance
            let totalBalance = 0;
            accounts.forEach(account => {
                const balance = parseFloat(account.cash_balance || account.balance || 0);
                totalBalance += balance;
            });
            
            // Update UI
            document.getElementById('totalBalance').textContent = formatCurrency(totalBalance);
            document.getElementById('totalAccounts').textContent = accounts.length;
            
            // Load transactions from first account
            if (accounts.length > 0) {
                loadAccountActivity(accounts[0].id);
            }
        }
    } catch (error) {
        console.error('Error loading accounts:', error);
        document.getElementById('totalBalance').textContent = '$0.00';
        document.getElementById('totalAccounts').textContent = '0';
    }
}

// Load account activity (transactions)
async function loadAccountActivity(accountId) {
    try {
        const response = await fetch(`${API_BASE_URL}/accounts/${accountId}/activity?limit=10`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            await handleApiError(response);
            return;
        }

        const data = await response.json();
        
        if (data.success && data.data) {
            const transactions = data.data.transactions || data.data;
            displayTransactions(transactions);
            calculateMonthlyStats(transactions);
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        document.getElementById('transactionsTable').innerHTML = `
            <div class="loading">
                <p>No transactions found</p>
            </div>
        `;
    }
}

// Display transactions in table
function displayTransactions(transactions) {
    const container = document.getElementById('transactionsTable');
    
    if (!transactions || transactions.length === 0) {
        container.innerHTML = `
            <div class="loading">
                <p>No transactions yet</p>
            </div>
        `;
        return;
    }
    
    const tableHTML = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                ${transactions.slice(0, 10).map(txn => `
                    <tr>
                        <td>${formatDate(txn.created_at || txn.date || txn.createdAt)}</td>
                        <td>${txn.description || txn.type || 'Transaction'}</td>
                        <td>
                            <span class="transaction-type ${txn.type === 'credit' || txn.type === 'deposit' ? 'type-credit' : 'type-debit'}">
                                ${(txn.type || 'debit').toUpperCase()}
                            </span>
                        </td>
                        <td>${(txn.status || 'completed').toUpperCase()}</td>
                        <td class="${txn.type === 'credit' || txn.type === 'deposit' ? 'amount-credit' : 'amount-debit'}">
                            ${txn.type === 'credit' || txn.type === 'deposit' ? '+' : '-'}${formatCurrency(Math.abs(txn.amount))}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

// Calculate monthly income and expenses
function calculateMonthlyStats(transactions) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    let income = 0;
    let expense = 0;
    
    transactions.forEach(txn => {
        const txnDate = new Date(txn.created_at || txn.date || txn.createdAt);
        
        if (txnDate.getMonth() === currentMonth && txnDate.getFullYear() === currentYear) {
            const amount = parseFloat(txn.amount) || 0;
            
            if (txn.type === 'credit' || txn.type === 'deposit') {
                income += amount;
            } else {
                expense += amount;
            }
        }
    });
    
    document.getElementById('monthlyIncome').textContent = formatCurrency(income);
    document.getElementById('monthlyExpense').textContent = formatCurrency(expense);
}

// Update current date
function updateCurrentDate() {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const currentDate = new Date().toLocaleDateString('en-US', options);
    document.getElementById('currentDate').textContent = currentDate;
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear storage
        localStorage.removeItem('aluma_access_token');
        localStorage.removeItem('aluma_refresh_token');
        localStorage.removeItem('aluma_user');
        sessionStorage.removeItem('aluma_access_token');
        sessionStorage.removeItem('aluma_refresh_token');
        sessionStorage.removeItem('aluma_user');
        
        // Redirect to login
        window.location.href = 'login.html';
    }
}

// Initialize dashboard
async function initDashboard() {
    // Check authentication
    if (!checkAuth()) {
        return;
    }
    
    // Update current date
    updateCurrentDate();
    
    // Load data
    await loadUserProfile();
    await loadAccounts();
}

// Run on page load
document.addEventListener('DOMContentLoaded', initDashboard);

// Refresh data every 30 seconds
setInterval(() => {
    if (typeof loadAccounts === 'function') {
        loadAccounts();
    }
}, 30000);
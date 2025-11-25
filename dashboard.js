// Configuration
const API_BASE_URL = 'https://aluma-banking-backend.onrender.com/api/v1';

// Store accounts and bank accounts globally
let userAccounts = [];
let bankAccounts = [];

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

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        // Load bank accounts and populate dropdowns
        loadBankAccountsForModals();
        populateAccountDropdowns();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        // Clear any messages
        const messageDiv = modal.querySelector('[id$="Message"]');
        if (messageDiv) messageDiv.innerHTML = '';
        // Reset form
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// Load bank accounts for modals
async function loadBankAccountsForModals() {
    try {
        const response = await fetch(`${API_BASE_URL}/funding/bank-accounts`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            await handleApiError(response);
            return;
        }

        const data = await response.json();
        
        if (data.success && data.data) {
            bankAccounts = data.data.bankAccounts || [];
            populateBankAccountDropdowns();
        }
    } catch (error) {
        console.error('Error loading bank accounts:', error);
    }
}

// Populate bank account dropdowns
function populateBankAccountDropdowns() {
    const selects = ['depositBankAccount', 'withdrawBankAccount'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Select bank account...</option>';
            
            if (bankAccounts.length === 0) {
                const option = document.createElement('option');
                option.value = "";
                option.textContent = "No bank accounts linked";
                option.disabled = true;
                select.appendChild(option);
            } else {
                bankAccounts.forEach(bank => {
                    if (bank.status === 'active' && bank.is_verified) {
                        const option = document.createElement('option');
                        option.value = bank.id;
                        option.textContent = `${bank.bank_name} (****${bank.account_number_last4})`;
                        select.appendChild(option);
                    }
                });
            }
        }
    });
}

// Populate account dropdowns
function populateAccountDropdowns() {
    const selects = [
        'transferFromAccount',
        'transferToAccountDropdown',
        'depositToAccount',
        'withdrawFromAccount',
        'billsFromAccount'
    ];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select && userAccounts.length > 0) {
            select.innerHTML = '<option value="">Select account...</option>';
            
            userAccounts.forEach(account => {
                const option = document.createElement('option');
                option.value = account.id;
                const balance = parseFloat(account.cash_balance || account.balance || 0);
                option.textContent = `${account.account_number || account.id} - ${formatCurrency(balance)}`;
                select.appendChild(option);
            });
        }
    });
}

// Show message in modal
function showModalMessage(modalId, message, isError = false) {
    const messageDiv = document.getElementById(modalId.replace('Modal', 'Message'));
    if (messageDiv) {
        messageDiv.className = isError ? 'error-message' : 'success-message';
        messageDiv.textContent = message;
        
        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 5000);
    }
}

// Handle Transfer (Internal - between user's own accounts)
async function handleTransfer(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('transferSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        const fromAccountId = document.getElementById('transferFromAccount').value;
        const toAccountId = document.getElementById('transferToAccountDropdown')?.value || 
                           document.getElementById('transferToAccount').value;
        const amount = parseFloat(document.getElementById('transferAmount').value);
        const notes = document.getElementById('transferDescription').value;
        
        // Check if transferring between own accounts
        const toAccount = userAccounts.find(acc => acc.id === toAccountId);
        
        if (toAccount) {
            // Internal transfer between user's own accounts
            const response = await fetch(`${API_BASE_URL}/funding/transfers`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    fromAccountId,
                    toAccountId,
                    amount,
                    notes
                })
            });
            
            if (!response.ok) {
                await handleApiError(response);
                return;
            }
            
            const data = await response.json();
            
            if (data.success) {
                showModalMessage('transferModal', 'Transfer successful!', false);
                document.getElementById('transferForm').reset();
                
                setTimeout(() => {
                    loadAccounts();
                    closeModal('transferModal');
                }, 2000);
            }
        } else {
            // External transfer - not supported yet
            throw new Error('External transfers are not yet supported. Please transfer between your own accounts only.');
        }
        
    } catch (error) {
        console.error('Transfer error:', error);
        showModalMessage('transferModal', error.message, true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Transfer Now';
    }
}

// Handle Deposit
async function handleDeposit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('depositSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        const accountId = document.getElementById('depositToAccount').value;
        const bankAccountId = document.getElementById('depositBankAccount').value;
        const amount = parseFloat(document.getElementById('depositAmount').value);
        const notes = document.getElementById('depositDescription').value;
        
        if (!bankAccountId) {
            throw new Error('Please select a bank account or link one first');
        }
        
        const response = await fetch(`${API_BASE_URL}/funding/deposits`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                accountId,
                bankAccountId,
                amount,
                notes
            })
        });
        
        if (!response.ok) {
            await handleApiError(response);
            return;
        }
        
        const data = await response.json();
        
        if (data.success) {
            showModalMessage('depositModal', 'Deposit initiated successfully!', false);
            document.getElementById('depositForm').reset();
            
            setTimeout(() => {
                loadAccounts();
                closeModal('depositModal');
            }, 2000);
        }
        
    } catch (error) {
        console.error('Deposit error:', error);
        showModalMessage('depositModal', error.message, true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Deposit Now';
    }
}

// Handle Withdraw
async function handleWithdraw(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('withdrawSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        const accountId = document.getElementById('withdrawFromAccount').value;
        const bankAccountId = document.getElementById('withdrawBankAccount').value;
        const amount = parseFloat(document.getElementById('withdrawAmount').value);
        const notes = document.getElementById('withdrawDescription').value;
        
        if (!bankAccountId) {
            throw new Error('Please select a bank account or link one first');
        }
        
        const response = await fetch(`${API_BASE_URL}/funding/withdrawals`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                accountId,
                bankAccountId,
                amount,
                notes
            })
        });
        
        if (!response.ok) {
            await handleApiError(response);
            return;
        }
        
        const data = await response.json();
        
        if (data.success) {
            showModalMessage('withdrawModal', 'Withdrawal request submitted successfully!', false);
            document.getElementById('withdrawForm').reset();
            
            setTimeout(() => {
                loadAccounts();
                closeModal('withdrawModal');
            }, 2000);
        }
        
    } catch (error) {
        console.error('Withdraw error:', error);
        showModalMessage('withdrawModal', error.message, true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-minus-circle"></i> Withdraw Now';
    }
}

// Handle Pay Bills (placeholder - endpoint doesn't exist yet)
async function handlePayBills(event) {
    event.preventDefault();
    
    showModalMessage('billsModal', 'Bill payment feature is coming soon! Please use transfers for now.', true);
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
        
        if (data.success && data.data) {
            const user = data.data.user || data.data;
            
            const displayName = user.first_name || user.username || 'User';
            const displayEmail = user.email || '';
            
            document.getElementById('userName').textContent = displayName;
            document.getElementById('userEmail').textContent = displayEmail;
            
            const avatar = document.getElementById('userAvatar');
            if (avatar && displayName) {
                avatar.textContent = displayName.charAt(0).toUpperCase();
            }
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
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
        
        if (data.success && data.data) {
            const accounts = Array.isArray(data.data) ? data.data : (data.data.accounts || []);
            
            userAccounts = accounts;
            
            let totalBalance = 0;
            accounts.forEach(account => {
                const balance = parseFloat(account.cash_balance || account.balance || 0);
                totalBalance += balance;
            });
            
            document.getElementById('totalBalance').textContent = formatCurrency(totalBalance);
            document.getElementById('totalAccounts').textContent = accounts.length;
            
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
        localStorage.removeItem('aluma_access_token');
        localStorage.removeItem('aluma_refresh_token');
        localStorage.removeItem('aluma_user');
        sessionStorage.removeItem('aluma_access_token');
        sessionStorage.removeItem('aluma_refresh_token');
        sessionStorage.removeItem('aluma_user');
        
        window.location.href = 'login.html';
    }
}

// Initialize dashboard
async function initDashboard() {
    if (!checkAuth()) {
        return;
    }
    
    updateCurrentDate();
    
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

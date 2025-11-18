// Configuration
const API_BASE_URL = 'https://aluma-banking-backend.onrender.com/api/v1';

let allTickets = [];
let currentFilter = 'all';
let selectedTicketId = null;

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('aluma_access_token');
    if (!token) {
        window.location.href = 'login.html?a=login';
        return false;
    }
    return token;
}

// Get headers with auth token
function getHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Handle API errors
async function handleApiError(response) {
    if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
    }
    
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.error?.message || 'An error occurred');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours === 0) {
            const minutes = Math.floor(diff / (1000 * 60));
            return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`;
        }
        return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    } else if (days === 1) {
        return 'Yesterday';
    } else if (days < 7) {
        return `${days} days ago`;
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
}

// Load ticket statistics
async function loadTicketStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/support/tickets/stats`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            await handleApiError(response);
            return;
        }

        const data = await response.json();
        
        if (data.success && data.data) {
            const stats = data.data;
            document.getElementById('openTickets').textContent = stats.open_tickets || 0;
            document.getElementById('inProgressTickets').textContent = stats.in_progress_tickets || 0;
            document.getElementById('resolvedTickets').textContent = stats.resolved_tickets || 0;
            document.getElementById('totalTickets').textContent = stats.total_tickets || 0;
        }
    } catch (error) {
        console.error('Error loading ticket stats:', error);
    }
}

// Load all tickets
async function loadTickets() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/support/tickets`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            await handleApiError(response);
            return;
        }

        const data = await response.json();
        
        if (data.success) {
            allTickets = data.data || [];
            displayTickets(allTickets);
        }
    } catch (error) {
        console.error('Error loading tickets:', error);
        document.getElementById('ticketsList').innerHTML = `
            <div class="empty-state">
                <p>Failed to load tickets</p>
            </div>
        `;
    }
}

// Display tickets
function displayTickets(tickets) {
    const container = document.getElementById('ticketsList');
    
    // Filter tickets
    let filteredTickets = tickets;
    if (currentFilter !== 'all') {
        filteredTickets = tickets.filter(t => t.status === currentFilter);
    }
    
    if (filteredTickets.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>No tickets found</h3>
                <p>${currentFilter === 'all' ? 'Create your first support ticket' : 'No ' + currentFilter + ' tickets'}</p>
            </div>
        `;
        return;
    }
    
    const ticketsHTML = filteredTickets.map(ticket => `
        <div class="ticket-item ${selectedTicketId === ticket.id ? 'active' : ''}" 
             onclick="selectTicket('${ticket.id}')">
            <div class="ticket-header">
                <div>
                    <div class="ticket-id">#${ticket.id.substring(0, 8)}</div>
                    <div class="ticket-subject">${ticket.subject}</div>
                </div>
                <span class="status-badge status-${ticket.status}">
                    ${ticket.status.replace('_', ' ')}
                </span>
            </div>
            <div class="ticket-meta">
                <span><i class="fas fa-tag"></i> ${ticket.category}</span>
                <span class="priority-badge priority-${ticket.priority}">${ticket.priority}</span>
                <span><i class="fas fa-clock"></i> ${formatDate(ticket.created_at)}</span>
                ${ticket.message_count ? `<span><i class="fas fa-comment"></i> ${ticket.message_count}</span>` : ''}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = ticketsHTML;
}

// Select and view ticket
async function selectTicket(ticketId) {
    selectedTicketId = ticketId;
    
    // Update UI to show selected
    document.querySelectorAll('.ticket-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget?.classList.add('active');
    
    // Load ticket details
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/support/tickets/${ticketId}`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            await handleApiError(response);
            return;
        }

        const data = await response.json();
        
        if (data.success && data.data) {
            displayTicketDetail(data.data);
        }
    } catch (error) {
        console.error('Error loading ticket detail:', error);
        alert('Failed to load ticket details');
    }
}

// Display ticket detail
function displayTicketDetail(ticket) {
    const detailContainer = document.getElementById('ticketDetail');
    detailContainer.classList.add('active');
    
    const messages = ticket.messages || [];
    const isClosed = ticket.status === 'closed';
    
    detailContainer.innerHTML = `
        <div class="detail-header">
            <div class="detail-subject">${ticket.subject}</div>
            <div class="detail-meta">
                <span class="status-badge status-${ticket.status}">${ticket.status.replace('_', ' ')}</span>
                <span class="priority-badge priority-${ticket.priority}">${ticket.priority}</span>
                <span><i class="fas fa-tag"></i> ${ticket.category}</span>
                <span><i class="fas fa-clock"></i> Created ${formatDate(ticket.created_at)}</span>
            </div>
        </div>
        
        <div class="messages-container">
            ${messages.length === 0 ? `
                <div class="empty-state">
                    <p>No messages yet</p>
                </div>
            ` : messages.map(msg => `
                <div class="message ${msg.is_staff ? 'staff' : ''}">
                    <div class="message-header">
                        <span class="message-author">
                            ${msg.is_staff ? '🎧 Support Team' : '👤 You'}
                        </span>
                        <span class="message-time">${formatDate(msg.created_at)}</span>
                    </div>
                    <div class="message-content">${msg.message}</div>
                </div>
            `).join('')}
        </div>
        
        ${!isClosed ? `
            <div class="reply-form">
                <form onsubmit="sendReply(event, '${ticket.id}')">
                    <textarea placeholder="Type your reply..." required name="message"></textarea>
                    <div class="reply-actions">
                        <button type="button" class="btn btn-danger" onclick="closeTicket('${ticket.id}')">
                            Close Ticket
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-paper-plane"></i> Send Reply
                        </button>
                    </div>
                </form>
            </div>
        ` : `
            <div class="reply-form">
                <p style="text-align: center; color: #666; padding: 20px;">
                    This ticket is closed. 
                    <button type="button" class="btn btn-primary" onclick="reopenTicket('${ticket.id}')">
                        Reopen Ticket
                    </button>
                </p>
            </div>
        `}
    `;
    
    // Scroll messages to bottom
    const messagesContainer = detailContainer.querySelector('.messages-container');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Send reply
async function sendReply(event, ticketId) {
    event.preventDefault();
    
    const form = event.target;
    const message = form.message.value.trim();
    
    if (!message) {
        alert('Please enter a message');
        return;
    }
    
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/support/tickets/${ticketId}/reply`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            await handleApiError(response);
            return;
        }

        const data = await response.json();
        
        if (data.success) {
            form.reset();
            // Reload ticket detail
            await selectTicket(ticketId);
            // Reload tickets list
            await loadTickets();
        }
    } catch (error) {
        console.error('Error sending reply:', error);
        alert('Failed to send reply: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Reply';
    }
}

// Close ticket
async function closeTicket(ticketId) {
    if (!confirm('Are you sure you want to close this ticket?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/support/tickets/${ticketId}/close`, {
            method: 'POST',
            headers: getHeaders()
        });

        if (!response.ok) {
            await handleApiError(response);
            return;
        }

        const data = await response.json();
        
        if (data.success) {
            alert('Ticket closed successfully');
            await loadTickets();
            await loadTicketStats();
            await selectTicket(ticketId);
        }
    } catch (error) {
        console.error('Error closing ticket:', error);
        alert('Failed to close ticket: ' + error.message);
    }
}

// Reopen ticket
async function reopenTicket(ticketId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/support/tickets/${ticketId}/reopen`, {
            method: 'POST',
            headers: getHeaders()
        });

        if (!response.ok) {
            await handleApiError(response);
            return;
        }

        const data = await response.json();
        
        if (data.success) {
            alert('Ticket reopened successfully');
            await loadTickets();
            await loadTicketStats();
            await selectTicket(ticketId);
        }
    } catch (error) {
        console.error('Error reopening ticket:', error);
        alert('Failed to reopen ticket: ' + error.message);
    }
}

// Open new ticket modal
function openNewTicketModal() {
    document.getElementById('newTicketModal').classList.add('active');
}

// Close new ticket modal
function closeNewTicketModal() {
    document.getElementById('newTicketModal').classList.remove('active');
    document.getElementById('newTicketForm').reset();
}

// Create new ticket
document.getElementById('newTicketForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const ticketData = {
        subject: formData.get('subject'),
        category: formData.get('category'),
        priority: formData.get('priority'),
        message: formData.get('message')
    };
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/support/tickets`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(ticketData)
        });

        if (!response.ok) {
            await handleApiError(response);
            return;
        }

        const data = await response.json();
        
        if (data.success) {
            alert('Ticket created successfully!');
            closeNewTicketModal();
            await loadTickets();
            await loadTicketStats();
            
            // Auto-select the new ticket
            if (data.data && data.data.id) {
                setTimeout(() => selectTicket(data.data.id), 500);
            }
        }
    } catch (error) {
        console.error('Error creating ticket:', error);
        alert('Failed to create ticket: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Ticket';
    }
});

// Filter tickets
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Update active state
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        // Update filter
        currentFilter = this.dataset.filter;
        
        // Re-display tickets
        displayTickets(allTickets);
    });
});

// Close modal when clicking outside
document.getElementById('newTicketModal').addEventListener('click', function(event) {
    if (event.target === this) {
        closeNewTicketModal();
    }
});

// Initialize
async function init() {
    if (!checkAuth()) {
        return;
    }
    
    await loadTicketStats();
    await loadTickets();
    
    // Auto-refresh every 30 seconds
    setInterval(async () => {
        await loadTickets();
        if (selectedTicketId) {
            await selectTicket(selectedTicketId);
        }
    }, 30000);
}

document.addEventListener('DOMContentLoaded', init);
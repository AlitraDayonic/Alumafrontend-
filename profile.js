// Configuration
const API_BASE_URL = 'https://aluma-banking-backend.onrender.com/api/v1';

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
        window.location.href = 'login.html?a=login';
        return;
    }
    
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.error?.message || 'An error occurred');
}

// Show alert message
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    const content = document.querySelector('.tab-content.active');
    content.insertBefore(alertDiv, content.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        alertDiv.style.transition = 'opacity 0.5s';
        alertDiv.style.opacity = '0';
        setTimeout(() => alertDiv.remove(), 500);
    }, 5000);
}

// Load user profile
async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/user/me`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            await handleApiError(response);
            return;
        }

        const data = await response.json();
        
        if (data.success && data.data && data.data.user) {
            const user = data.data.user;
            
            // Update sidebar
            document.getElementById('profileName').textContent = 
                `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
            document.getElementById('profileEmail').textContent = user.email;
            
            // Update avatar
            const avatar = document.getElementById('profileAvatar');
            if (user.first_name) {
                avatar.textContent = user.first_name.charAt(0).toUpperCase();
            }
            
            // Update member since
            if (user.created_at) {
                const date = new Date(user.created_at);
                document.getElementById('memberSince').textContent = 
                    date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            }
            
            // Fill form fields
            const form = document.getElementById('profileForm');
            form.elements.firstName.value = user.first_name || '';
            form.elements.lastName.value = user.last_name || '';
            form.elements.email.value = user.email || '';
            form.elements.phone.value = user.phone || '';
            form.elements.dateOfBirth.value = user.date_of_birth || '';
            form.elements.addressLine1.value = user.address_line1 || '';
            form.elements.addressLine2.value = user.address_line2 || '';
            form.elements.city.value = user.city || '';
            form.elements.state.value = user.state || '';
            form.elements.postalCode.value = user.postal_code || '';
            form.elements.country.value = user.country || '';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Failed to load profile: ' + error.message, 'error');
    }
}

// Update profile
document.getElementById('profileForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const profileData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        phone: formData.get('phone'),
        addressLine1: formData.get('addressLine1'),
        addressLine2: formData.get('addressLine2'),
        city: formData.get('city'),
        state: formData.get('state'),
        postalCode: formData.get('postalCode'),
        country: formData.get('country')
    };
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/user/me`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(profileData)
        });

        if (!response.ok) {
            await handleApiError(response);
            return;
        }

        const data = await response.json();
        
        if (data.success) {
            showAlert('Profile updated successfully!', 'success');
            await loadProfile();
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showAlert('Failed to update profile: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});

// Change password
document.getElementById('passwordForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
        showAlert('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showAlert('Password must be at least 8 characters long', 'error');
        return;
    }
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Changing...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/user/me/password`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ currentPassword, newPassword })
        });

        if (!response.ok) {
            await handleApiError(response);
            return;
        }

        const data = await response.json();
        
        if (data.success) {
            showAlert('Password changed successfully! Please login again.', 'success');
            event.target.reset();
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                localStorage.clear();
                window.location.href = 'login.html?a=login';
            }, 2000);
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showAlert('Failed to change password: ' + error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});

// Load 2FA status
async function load2FAStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/user/2fa/status`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            await handleApiError(response);
            return;
        }

        const data = await response.json();
        
        if (data.success && data.data) {
            display2FAStatus(data.data);
        }
    } catch (error) {
        console.error('Error loading 2FA status:', error);
        document.getElementById('twoFactorStatus').innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i>
                Failed to load 2FA status
            </div>
        `;
    }
}

// Display 2FA status
function display2FAStatus(status) {
    const statusContainer = document.getElementById('twoFactorStatus');
    const contentContainer = document.getElementById('twoFactorContent');
    
    const isEnabled = status.enabled || status.twoFactorEnabled;
    
    statusContainer.innerHTML = `
        <div>
            <strong>Two-Factor Authentication</strong>
            <p style="font-size: 13px; color: #666; margin-top: 5px;">
                ${isEnabled ? 'Your account is protected with 2FA' : 'Add an extra layer of security to your account'}
            </p>
        </div>
        <span class="status-badge ${isEnabled ? 'status-enabled' : 'status-disabled'}">
            ${isEnabled ? '✓ Enabled' : '✗ Disabled'}
        </span>
    `;
    
    if (isEnabled) {
        contentContainer.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                Two-factor authentication is active. You'll need your authenticator app to log in.
            </div>
            
            <button type="button" class="btn btn-secondary" onclick="regenerateBackupCodes()">
                <i class="fas fa-sync"></i> Regenerate Backup Codes
            </button>
            
            <button type="button" class="btn btn-danger" onclick="disable2FA()" style="margin-left: 10px;">
                <i class="fas fa-times"></i> Disable 2FA
            </button>
        `;
    } else {
        contentContainer.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                Enable 2FA to add an extra layer of security. You'll need an authenticator app like Google Authenticator or Authy.
            </div>
            
            <button type="button" class="btn btn-primary" onclick="setup2FA()">
                <i class="fas fa-shield-alt"></i> Enable Two-Factor Authentication
            </button>
        `;
    }
}

// Setup 2FA
async function setup2FA() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/user/2fa/setup`, {
            method: 'POST',
            headers: getHeaders()
        });

        if (!response.ok) {
            await handleApiError(response);
            return;
        }

        const data = await response.json();
        
        if (data.success && data.data) {
            show2FASetupModal(data.data);
        }
    } catch (error) {
        console.error('Error setting up 2FA:', error);
        showAlert('Failed to setup 2FA: ' + error.message, 'error');
    }
}

// Show 2FA setup modal
function show2FASetupModal(data) {
    const contentContainer = document.getElementById('twoFactorContent');
    
    contentContainer.innerHTML = `
        <div class="alert alert-info">
            <i class="fas fa-mobile-alt"></i>
            Scan this QR code with your authenticator app
        </div>
        
        <div class="qr-code-container">
            <img src="${data.qrCode}" alt="QR Code">
            <p style="color: #666; font-size: 13px; margin-top: 10px;">
                Or enter this code manually: <strong>${data.secret}</strong>
            </p>
        </div>
        
        <form id="enable2FAForm">
            <div class="form-group">
                <label class="form-label">Enter 6-digit code from your app</label>
                <input type="text" class="form-input" name="token" required maxlength="6" pattern="[0-9]{6}" placeholder="000000">
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-check"></i> Verify & Enable
                </button>
                <button type="button" class="btn btn-secondary" onclick="load2FAStatus()">
                    Cancel
                </button>
            </div>
        </form>
    `;
    
    // Handle enable form
    document.getElementById('enable2FAForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const token = event.target.token.value;
        
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/user/2fa/enable`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ token })
            });

            if (!response.ok) {
                await handleApiError(response);
                return;
            }

            const result = await response.json();
            
            if (result.success) {
                showBackupCodes(result.data.backupCodes);
            }
        } catch (error) {
            console.error('Error enabling 2FA:', error);
            showAlert('Failed to enable 2FA: ' + error.message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Verify & Enable';
        }
    });
}

// Show backup codes
function showBackupCodes(codes) {
    const contentContainer = document.getElementById('twoFactorContent');
    
    contentContainer.innerHTML = `
        <div class="alert alert-success">
            <i class="fas fa-check-circle"></i>
            Two-factor authentication enabled successfully!
        </div>
        
        <div class="alert alert-info">
            <i class="fas fa-exclamation-triangle"></i>
            <strong>Important:</strong> Save these backup codes in a safe place. Each code can only be used once.
        </div>
        
        <div class="backup-codes">
            ${codes.map(code => `<div class="backup-code">${code}</div>`).join('')}
        </div>
        
        <button type="button" class="btn btn-primary" onclick="load2FAStatus()">
            <i class="fas fa-check"></i> Done
        </button>
    `;
}

// Disable 2FA
async function disable2FA() {
    const token = prompt('Enter your 6-digit 2FA code to disable:');
    
    if (!token) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/user/2fa/disable`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ token })
        });

        if (!response.ok) {
            await handleApiError(response);
            return;
        }

        const data = await response.json();
        
        if (data.success) {
            showAlert('Two-factor authentication disabled', 'success');
            await load2FAStatus();
        }
    } catch (error) {
        console.error('Error disabling 2FA:', error);
        showAlert('Failed to disable 2FA: ' + error.message, 'error');
    }
}

// Regenerate backup codes
async function regenerateBackupCodes() {
    const token = prompt('Enter your 6-digit 2FA code:');
    
    if (!token) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/user/2fa/regenerate-codes`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ token })
        });

        if (!response.ok) {
            await handleApiError(response);
            return;
        }

        const data = await response.json();
        
        if (data.success && data.data.backupCodes) {
            showBackupCodes(data.data.backupCodes);
        }
    } catch (error) {
        console.error('Error regenerating codes:', error);
        showAlert('Failed to regenerate codes: ' + error.message, 'error');
    }
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // Update active button
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        // Update active tab content
        const tabName = this.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.getElementById(`tab-${tabName}`).classList.add('active');
        
        // Load 2FA status if switching to 2FA tab
        if (tabName === '2fa') {
            load2FAStatus();
        }
    });
});

// Initialize
async function init() {
    if (!checkAuth()) {
        return;
    }
    
    await loadProfile();
}

document.addEventListener('DOMContentLoaded', init);
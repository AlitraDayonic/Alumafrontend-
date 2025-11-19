// Configuration
const API_BASE_URL = 'https://aluma-banking-backend.onrender.com/api/v1'; // Change this to your production URL when deploying
// Example for production: const API_BASE_URL = 'https://api.yourdomain.com';

// Generate a simple device ID (stored in localStorage)
function getDeviceId() {
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('deviceId', deviceId);
  }
  return deviceId;
}

// Get device name (browser info)
function getDeviceName() {
  const userAgent = navigator.userAgent;
  let browserName = 'Unknown Browser';
  
  if (userAgent.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
  } else if (userAgent.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
  } else if (userAgent.indexOf('Safari') > -1) {
    browserName = 'Safari';
  } else if (userAgent.indexOf('Edge') > -1) {
    browserName = 'Edge';
  }
  
  return browserName;
}

// Show error message
function showError(message) {
  // Remove any existing error messages
  const existingError = document.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
  
  // Create error element
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.style.cssText = `
    background-color: #fee;
    color: #c33;
    padding: 15px 20px;
    border-radius: 5px;
    margin: 0 auto 20px auto;
    border: 1px solid #fcc;
    font-size: 14px;
    text-align: center;
    max-width: 400px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  `;
  errorDiv.textContent = message;
  
  // Insert before the form
  const form = document.querySelector('form[name="mainform"]');
  const loginbox = form.closest('.loginbox');
  const center = loginbox.querySelector('center');
  center.insertBefore(errorDiv, form);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    errorDiv.style.transition = 'opacity 0.5s';
    errorDiv.style.opacity = '0';
    setTimeout(() => errorDiv.remove(), 500);
  }, 5000);
}

// Show success message
function showSuccess(message) {
  // Remove any existing messages
  const existingSuccess = document.querySelector('.success-message');
  if (existingSuccess) {
    existingSuccess.remove();
  }
  
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.style.cssText = `
    background-color: #d4edda;
    color: #155724;
    padding: 15px 20px;
    border-radius: 5px;
    margin: 0 auto 20px auto;
    border: 1px solid #c3e6cb;
    font-size: 14px;
    text-align: center;
    max-width: 400px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  `;
  successDiv.textContent = message;
  
  const form = document.querySelector('form[name="mainform"]');
  const loginbox = form.closest('.loginbox');
  const center = loginbox.querySelector('center');
  center.insertBefore(successDiv, form);
}

// Show loading state
function setLoading(isLoading) {
  const submitBtn = document.querySelector('input[type="submit"].sbmt');
  const usernameInput = document.querySelector('input[name="username"]');
  const passwordInput = document.querySelector('input[name="password"]');
  
  if (isLoading) {
    submitBtn.value = 'Logging in...';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.6';
    submitBtn.style.cursor = 'not-allowed';
    usernameInput.disabled = true;
    passwordInput.disabled = true;
  } else {
    submitBtn.value = 'Login';
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    submitBtn.style.cursor = 'pointer';
    usernameInput.disabled = false;
    passwordInput.disabled = false;
  }
}

// Validate form
function validateForm(email, password) {
  const errors = [];
  
  // Check if fields are empty
  if (!email || email.trim() === '') {
    errors.push('Email is required');
  }
  
  if (!password || password.trim() === '') {
    errors.push('Password is required');
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }
  
  return errors;
}
// Handle login
async function handleLogin(event) {
  event.preventDefault();
  
  // Get form values
  const username = document.querySelector('input[name="username"]').value.trim();
  const password = document.querySelector('input[name="password"]').value;
  
  // Validate
  const errors = validateForm(username, password);
  if (errors.length > 0) {
    showError(errors.join('. '));
    return false;
  }
  
  // Show loading state
  setLoading(true);
  
  try {
    // Make API call
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: username,
        password: password,
        deviceId: getDeviceId(),
        deviceName: getDeviceName()
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Handle specific HTTP error codes
      if (response.status === 401) {
        throw new Error('Invalid email or password');
      } else if (response.status === 423) {
        throw new Error('Account temporarily locked due to too many failed login attempts');
      } else if (response.status === 403) {
        throw new Error(data.message || 'Account suspended. Please contact support.');
      } else {
        throw new Error(data.message || 'Login failed. Please try again.');
      }
    }
    
    if (data.success) {
      const user = data.data.user;
      
      // Store tokens and user info
      localStorage.setItem('aluma_access_token', data.data.tokens.accessToken);
      localStorage.setItem('aluma_refresh_token', data.data.tokens.refreshToken);
      localStorage.setItem('aluma_user', JSON.stringify(user));
      
      // Check if user is admin
      const isAdmin = user.role === 'admin' || 
                     user.role === 'super_admin' || 
                     user.role === 1 || 
                     user.role === '1';
      
      // Show success message
      showSuccess('Login successful! Redirecting...');
      
      // Redirect based on role
      setTimeout(() => {
        if (isAdmin) {
          // Store admin tokens separately
          localStorage.setItem('admin_access_token', data.data.tokens.accessToken);
          localStorage.setItem('admin_refresh_token', data.data.tokens.refreshToken);
          localStorage.setItem('admin_user', JSON.stringify(user));
          window.location.href = 'admin/dashboard.html';
        } else {
          window.location.href = 'dashboard.html';
        }
      }, 1500);
      
    } else {
      throw new Error(data.message || 'Login failed');
    }
    
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle specific error messages
    let errorMessage = error.message;
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      errorMessage = 'Cannot connect to server. Please check your internet connection or try again later.';
    }
    
    showError(errorMessage);
    setLoading(false);
  }
}

// Override the original checkform function
function checkform() {
  // The new handleLogin function will handle validation
  // Return false to prevent default form submission
  return false;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('form[name="mainform"]');
  
  if (form) {
    // Add new event listener for form submission
    form.addEventListener('submit', handleLogin);
    
    // Update the username input to accept email
    const usernameInput = document.querySelector('input[name="username"]');
    if (usernameInput) {
      usernameInput.placeholder = 'Email Address';
      usernameInput.type = 'email'; // Change to email type for better validation
      usernameInput.setAttribute('autocomplete', 'email');
    }
    
    // Add autocomplete to password
    const passwordInput = document.querySelector('input[name="password"]');
    if (passwordInput) {
      passwordInput.setAttribute('autocomplete', 'current-password');
    }
  }
  
  // Check if user is already logged in
  const accessToken = localStorage.getItem('accessToken');
  const user = localStorage.getItem('user');
  
  if (accessToken && user) {
    console.log('User already logged in');
    // Uncomment the line below if you want to auto-redirect logged-in users
    // window.location.href = 'dashboard.html';
  }
});

// Optional: Add Enter key support
document.addEventListener('keypress', function(event) {
  if (event.key === 'Enter') {
    const form = document.querySelector('form[name="mainform"]');
    if (form && document.activeElement.tagName === 'INPUT') {
      form.dispatchEvent(new Event('submit'));
    }
  }
});

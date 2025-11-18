// Configuration
const API_BASE_URL = 'https://aluma-banking-backend.onrender.com/api/v1'; // Change this to your production URL when deploying

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
    margin: 20px auto;
    border: 1px solid #fcc;
    font-size: 14px;
    text-align: center;
    max-width: 600px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  `;
  errorDiv.innerHTML = message;
  
  // Insert before the form
  const form = document.querySelector('form[name="regform"]');
  const box6 = document.querySelector('.box6');
  const alltitle = box6.querySelector('.alltitle');
  alltitle.parentNode.insertBefore(errorDiv, alltitle.nextSibling);
  
  // Scroll to error
  errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  // Auto-remove after 8 seconds
  setTimeout(() => {
    errorDiv.style.transition = 'opacity 0.5s';
    errorDiv.style.opacity = '0';
    setTimeout(() => errorDiv.remove(), 500);
  }, 8000);
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
    margin: 20px auto;
    border: 1px solid #c3e6cb;
    font-size: 14px;
    text-align: center;
    max-width: 600px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  `;
  successDiv.textContent = message;
  
  const form = document.querySelector('form[name="regform"]');
  const box6 = document.querySelector('.box6');
  const alltitle = box6.querySelector('.alltitle');
  alltitle.parentNode.insertBefore(successDiv, alltitle.nextSibling);
  
  // Scroll to success message
  successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Show loading state
function setLoading(isLoading) {
  const submitBtn = document.querySelector('input[type="submit"]');
  const inputs = document.querySelectorAll('input[type="text"], input[type="password"], input[type="checkbox"]');
  
  if (isLoading) {
    submitBtn.value = 'Creating Account...';
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.6';
    submitBtn.style.cursor = 'not-allowed';
    inputs.forEach(input => input.disabled = true);
  } else {
    submitBtn.value = 'Register';
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    submitBtn.style.cursor = 'pointer';
    inputs.forEach(input => input.disabled = false);
  }
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
function validatePasswordStrength(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return errors;
}

// Validate form
function validateRegistrationForm(formData) {
  const errors = [];
  
  // Check required fields
  if (!formData.fullname || formData.fullname.trim() === '') {
    errors.push('Full name is required');
  }
  
  if (!formData.username || formData.username.trim() === '') {
    errors.push('Username is required');
  } else if (!/^[A-Za-z0-9_\-]+$/.test(formData.username)) {
    errors.push('Username can only contain letters, numbers, hyphens, and underscores');
  }
  
  if (!formData.email || formData.email.trim() === '') {
    errors.push('Email address is required');
  } else if (!isValidEmail(formData.email)) {
    errors.push('Please enter a valid email address');
  }
  
  if (!formData.email1 || formData.email1.trim() === '') {
    errors.push('Please confirm your email address');
  } else if (formData.email !== formData.email1) {
    errors.push('Email addresses do not match');
  }
  
  if (!formData.password || formData.password === '') {
    errors.push('Password is required');
  } else {
    const passwordErrors = validatePasswordStrength(formData.password);
    errors.push(...passwordErrors);
  }
  
  if (!formData.password2 || formData.password2 === '') {
    errors.push('Please confirm your password');
  } else if (formData.password !== formData.password2) {
    errors.push('Passwords do not match');
  }
  
  if (!formData.agree) {
    errors.push('You must agree to the Terms and Conditions');
  }
  
  return errors;
}

// Handle registration
async function handleRegistration(event) {
  event.preventDefault();
  
  // Get form values
  const fullname = document.querySelector('input[name="fullname"]').value.trim();
  const username = document.querySelector('input[name="username"]').value.trim();
  const email = document.querySelector('input[name="email"]').value.trim();
  const email1 = document.querySelector('input[name="email1"]').value.trim();
  const password = document.querySelector('input[name="password"]').value;
  const password2 = document.querySelector('input[name="password2"]').value;
  const secretQuestion = document.querySelector('input[name="sq"]').value.trim();
  const secretAnswer = document.querySelector('input[name="sa"]').value.trim();
  const agree = document.querySelector('input[name="agree"]').checked;
  
  // Get wallet addresses (optional)
  const bitcoinWallet = document.querySelector('input[name="pay_account[1000][WALLET ADDRESS]"]').value.trim();
  const ethereumWallet = document.querySelector('input[name="pay_account[1003][Wallet Address]"]').value.trim();
  const litecoinWallet = document.querySelector('input[name="pay_account[1004][Wallet Address]"]').value.trim();
  const usdtWallet = document.querySelector('input[name="pay_account[1005][WALLET ADDRESS]"]').value.trim();
  
  const formData = {
    fullname,
    username,
    email,
    email1,
    password,
    password2,
    secretQuestion,
    secretAnswer,
    agree
  };
  
  // Validate form
  const errors = validateRegistrationForm(formData);
  if (errors.length > 0) {
    showError(errors.join('<br>'));
    return false;
  }
  
  // Show loading state
  setLoading(true);
  
  try {
    // Split fullname into firstName and lastName
    const nameParts = fullname.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;
    
    // Prepare registration data for backend
    const registrationData = {
      email: email,
      username: username,
      firstName: firstName,
      lastName: lastName,
      password: password,
      phone: '', // Optional - add phone field to form if needed
      secretQuestion: secretQuestion,
      secretAnswer: secretAnswer
    };
    
    // Add wallet addresses if provided
    if (bitcoinWallet) registrationData.bitcoinWallet = bitcoinWallet;
    if (ethereumWallet) registrationData.ethereumWallet = ethereumWallet;
    if (litecoinWallet) registrationData.litecoinWallet = litecoinWallet;
    if (usdtWallet) registrationData.usdtWallet = usdtWallet;
    
    // Make API call
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Handle error response
      throw new Error(data.message || 'Registration failed. Please try again.');
    }
    
    if (data.success) {
      // Clear form
      document.querySelector('form[name="regform"]').reset();
      
      // Show success message
      showSuccess('Account created successfully! Redirecting to login page...');
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        window.location.href = 'login.html?a=login'; // Your login page
      }, 2000);
      
    } else {
      throw new Error(data.message || 'Registration failed');
    }
    
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific error messages
    let errorMessage = error.message;
    
    if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Cannot connect to server. Please check your internet connection.';
    } else if (error.message.includes('already exists')) {
      errorMessage = error.message; // Show the specific error from backend
    }
    
    showError(errorMessage);
    setLoading(false);
  }
}

// Override the original checkform function
function checkform() {
  // The new handleRegistration function will handle validation
  // Return false to prevent default form submission
  return false;
}

// Add real-time password strength indicator
function addPasswordStrengthIndicator() {
  const passwordInput = document.querySelector('input[name="password"]');
  
  if (passwordInput && !document.querySelector('.password-strength')) {
    const strengthDiv = document.createElement('div');
    strengthDiv.className = 'password-strength';
    strengthDiv.style.cssText = `
      margin-top: 5px;
      font-size: 12px;
      padding: 5px 10px;
    `;
    
    passwordInput.parentElement.appendChild(strengthDiv);
    
    passwordInput.addEventListener('input', function() {
      const password = this.value;
      const errors = validatePasswordStrength(password);
      
      if (password.length === 0) {
        strengthDiv.textContent = '';
        strengthDiv.style.color = '';
      } else if (errors.length === 0) {
        strengthDiv.textContent = '✓ Strong password';
        strengthDiv.style.color = '#28a745';
      } else if (errors.length <= 2) {
        strengthDiv.textContent = '⚠ Medium password';
        strengthDiv.style.color = '#ffc107';
      } else {
        strengthDiv.textContent = '✗ Weak password';
        strengthDiv.style.color = '#dc3545';
      }
    });
  }
}

// Add real-time email match indicator
function addEmailMatchIndicator() {
  const email1Input = document.querySelector('input[name="email1"]');
  
  if (email1Input && !document.querySelector('.email-match')) {
    const matchDiv = document.createElement('div');
    matchDiv.className = 'email-match';
    matchDiv.style.cssText = `
      margin-top: 5px;
      font-size: 12px;
      padding: 5px 10px;
    `;
    
    email1Input.parentElement.appendChild(matchDiv);
    
    email1Input.addEventListener('input', function() {
      const email = document.querySelector('input[name="email"]').value;
      const email1 = this.value;
      
      if (email1.length === 0) {
        matchDiv.textContent = '';
      } else if (email === email1) {
        matchDiv.textContent = '✓ Emails match';
        matchDiv.style.color = '#28a745';
      } else {
        matchDiv.textContent = '✗ Emails do not match';
        matchDiv.style.color = '#dc3545';
      }
    });
  }
}

// Add real-time password match indicator
function addPasswordMatchIndicator() {
  const password2Input = document.querySelector('input[name="password2"]');
  
  if (password2Input && !document.querySelector('.password-match')) {
    const matchDiv = document.createElement('div');
    matchDiv.className = 'password-match';
    matchDiv.style.cssText = `
      margin-top: 5px;
      font-size: 12px;
      padding: 5px 10px;
    `;
    
    password2Input.parentElement.appendChild(matchDiv);
    
    password2Input.addEventListener('input', function() {
      const password = document.querySelector('input[name="password"]').value;
      const password2 = this.value;
      
      if (password2.length === 0) {
        matchDiv.textContent = '';
      } else if (password === password2) {
        matchDiv.textContent = '✓ Passwords match';
        matchDiv.style.color = '#28a745';
      } else {
        matchDiv.textContent = '✗ Passwords do not match';
        matchDiv.style.color = '#dc3545';
      }
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  const form = document.querySelector('form[name="regform"]');
  
  if (form) {
    // Remove the old onsubmit
    form.removeAttribute('onsubmit');
    
    // Add new event listener
    form.addEventListener('submit', handleRegistration);
    
    // Add real-time validation indicators
    addPasswordStrengthIndicator();
    addEmailMatchIndicator();
    addPasswordMatchIndicator();
  }
});
//Index
 function toggleMenu() {
      document.getElementById('mobileMenu').classList.toggle('open');
    }

//Regsiter
    // Secure toggle menu function
    function toggleMenu() {
      const mobileMenu = document.getElementById('mobileMenu');
      const isExpanded = mobileMenu.hasAttribute('hidden');
      
      if (isExpanded) {
        mobileMenu.removeAttribute('hidden');
      } else {
        mobileMenu.setAttribute('hidden', '');
      }
      
      // Update ARIA attribute
      const toggleButton = document.querySelector('.mobile-toggle');
      if (toggleButton) {
        toggleButton.setAttribute('aria-expanded', !isExpanded);
      }
    }

    // Password strength checker
    function checkPasswordStrength(password) {
      let strength = 0;
      const strengthBar = document.getElementById('passwordStrength');
      
      if (password.length >= 8) strength++;
      if (password.match(/[a-z]+/)) strength++;
      if (password.match(/[A-Z]+/)) strength++;
      if (password.match(/[0-9]+/)) strength++;
      if (password.match(/[$@#&!]+/)) strength++;
      
      const strengthLevels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
      const colors = ['#ff4444', '#ff7744', '#ffaa44', '#44ff44', '#00aa00'];
      
      if (password.length > 0) {
        strengthBar.textContent = `Password Strength: ${strengthLevels[strength-1] || 'Very Weak'}`;
        strengthBar.style.color = colors[strength-1] || '#ff4444';
        strengthBar.hidden = false;
      } else {
        strengthBar.hidden = true;
      }
    }

    // Sanitize input to prevent XSS
    function sanitizeInput(input) {
      const div = document.createElement('div');
      div.textContent = input;
      return div.innerHTML;
    }

    // Validate form fields
    function validateField(field) {
      const errorDiv = document.getElementById(field.id + 'Error');
      if (!errorDiv) return true;
      
      let isValid = true;
      let errorMessage = '';
      
      switch(field.id) {
        case 'firstName':
        case 'lastName':
          if (!field.value.match(/^[A-Za-z\s\-']{2,50}$/)) {
            isValid = false;
            errorMessage = 'Please enter a valid name (letters, spaces, hyphens only)';
          }
          break;
          
        case 'email':
          if (!field.value.match(/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
          }
          break;
          
        case 'password':
          const password = field.value;
          if (password.length < 8) {
            isValid = false;
            errorMessage = 'Password must be at least 8 characters';
          } else if (!password.match(/[a-z]/) || !password.match(/[A-Z]/) || 
                     !password.match(/[0-9]/) || !password.match(/[$@#&!]/)) {
            isValid = false;
            errorMessage = 'Password must contain uppercase, lowercase, number, and special character';
          }
          break;
          
        case 'confirmPassword':
          const passwordField = document.getElementById('password');
          if (field.value !== passwordField.value) {
            isValid = false;
            errorMessage = 'Passwords do not match';
          }
          break;
      }
      
      if (!isValid) {
        errorDiv.textContent = errorMessage;
        errorDiv.hidden = false;
        field.setAttribute('aria-invalid', 'true');
      } else {
        errorDiv.hidden = true;
        field.removeAttribute('aria-invalid');
      }
      
      return isValid;
    }

    // Set form timestamp for rate limiting
    function setFormTimestamp() {
      const timestampField = document.getElementById('formTimestamp');
      if (timestampField) {
        timestampField.value = Date.now().toString();
      }
    }

    // Handle registration with security measures
    function handleRegister(e) {
      e.preventDefault();
      
      // Check honeypot (bot detection)
      const honeypot = document.getElementById('website');
      if (honeypot && honeypot.value !== '') {
        console.log('Bot detected');
        return false;
      }
      
      // Rate limiting check (prevent rapid submissions)
      const timestamp = document.getElementById('formTimestamp').value;
      const now = Date.now();
      if (timestamp && (now - parseInt(timestamp)) < 2000) {
        alert('Please wait a moment before submitting again');
        return false;
      }
      
      // Get form fields
      const firstName = document.getElementById('firstName');
      const lastName = document.getElementById('lastName');
      const email = document.getElementById('email');
      const grade = document.getElementById('grade');
      const password = document.getElementById('password');
      const confirmPassword = document.getElementById('confirmPassword');
      
      // Validate all fields
      const fields = [firstName, lastName, email, grade, password, confirmPassword];
      let isValid = true;
      
      fields.forEach(field => {
        if (!validateField(field)) {
          isValid = false;
        }
      });
      
      if (!isValid) {
        return false;
      }
      
      // Additional password match check
      if (password.value !== confirmPassword.value) {
        const errorDiv = document.getElementById('confirmPasswordError');
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.hidden = false;
        confirmPassword.setAttribute('aria-invalid', 'true');
        return false;
      }
      
      // Disable submit button to prevent double submission
      const submitBtn = document.getElementById('submitBtn');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating Account...';
      
      // Prepare data for submission (sanitized)
      const formData = {
        firstName: sanitizeInput(firstName.value.trim()),
        lastName: sanitizeInput(lastName.value.trim()),
        email: sanitizeInput(email.value.trim().toLowerCase()),
        grade: grade.value,
        csrfToken: document.getElementById('csrfToken').value,
        timestamp: now
      };
      
      // In production, send to server via HTTPS
      console.log('Secure form data ready for submission:', formData);
      
      // Simulate successful registration (would be server response in production)
      setTimeout(() => {
        alert('Registration successful! Welcome to EduPath.');
        e.target.reset();
        
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
        
        // Reset form timestamp
        setFormTimestamp();
      }, 1500);
      
      return false;
    }

    // Add event listeners for real-time validation
    document.addEventListener('DOMContentLoaded', function() {
      setFormTimestamp();
      
      // Add input validation listeners
      const inputs = ['firstName', 'lastName', 'email', 'password', 'confirmPassword'];
      inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
          input.addEventListener('input', function() {
            validateField(this);
            if (this.id === 'password') {
              checkPasswordStrength(this.value);
            }
          });
        }
      });
      
      // Close mobile menu on outside click
      document.addEventListener('click', function(event) {
        const mobileMenu = document.getElementById('mobileMenu');
        const toggleButton = document.querySelector('.mobile-toggle');
        
        if (!mobileMenu.hasAttribute('hidden') && 
            !mobileMenu.contains(event.target) && 
            !toggleButton.contains(event.target)) {
          mobileMenu.setAttribute('hidden', '');
          toggleButton.setAttribute('aria-expanded', 'false');
        }
      });
      
      // Prevent paste into confirm password for better security
      document.getElementById('confirmPassword').addEventListener('paste', function(e) {
        e.preventDefault();
      });
    });

    // Prevent form resubmission on page refresh
    if (window.history.replaceState) {
      window.history.replaceState(null, null, window.location.href);
    }

//login
    // Toggle mobile menu
    function toggleMenu() {
      const mobileMenu = document.getElementById('mobileMenu');
      const isExpanded = mobileMenu.hasAttribute('hidden');
      
      if (isExpanded) {
        mobileMenu.removeAttribute('hidden');
      } else {
        mobileMenu.setAttribute('hidden', '');
      }
      
      const toggleButton = document.querySelector('.mobile-toggle');
      if (toggleButton) {
        toggleButton.setAttribute('aria-expanded', !isExpanded);
      }
    }

    // Toggle password visibility
    function togglePasswordVisibility() {
      const passwordInput = document.getElementById('password');
      const toggleIcon = document.getElementById('togglePasswordIcon');
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('bi-eye');
        toggleIcon.classList.add('bi-eye-slash');
      } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('bi-eye-slash');
        toggleIcon.classList.add('bi-eye');
      }
    }

    // Sanitize input to prevent XSS
    function sanitizeInput(input) {
      if (!input) return '';
      const div = document.createElement('div');
      div.textContent = input;
      return div.innerHTML;
    }

    // Validate email format
    function isValidEmail(email) {
      const emailRegex = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i;
      return emailRegex.test(email);
    }

    // Rate limiting - check if account is locked
    function isAccountLocked() {
      const lockoutUntil = parseInt(document.getElementById('lockoutUntil').value);
      const now = Date.now();
      
      if (lockoutUntil > now) {
        const minutesLeft = Math.ceil((lockoutUntil - now) / 60000);
        showError(`Too many login attempts. Please try again in ${minutesLeft} minutes.`);
        return true;
      }
      return false;
    }

    // Track failed login attempts
    function trackFailedAttempt() {
      let attempts = parseInt(document.getElementById('loginAttempts').value) || 0;
      attempts++;
      
      document.getElementById('loginAttempts').value = attempts;
      
      // Lock account after 5 failed attempts
      if (attempts >= 5) {
        const lockoutTime = Date.now() + (15 * 60 * 1000); // 15 minutes
        document.getElementById('lockoutUntil').value = lockoutTime;
        showError('Account temporarily locked. Please try again after 15 minutes.');
        return true;
      }
      
      const remainingAttempts = 5 - attempts;
      if (remainingAttempts > 0) {
        showError(`Invalid email or password. ${remainingAttempts} attempt(s) remaining.`);
      }
      
      return false;
    }

    // Reset login attempts on successful login
    function resetLoginAttempts() {
      document.getElementById('loginAttempts').value = '0';
      document.getElementById('lockoutUntil').value = '0';
    }

    // Show error message
    function showError(message) {
      const errorDiv = document.getElementById('loginError');
      errorDiv.textContent = message;
      errorDiv.hidden = false;
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        errorDiv.hidden = true;
      }, 5000);
    }

    // Validate form fields
    function validateField(field) {
      const errorDiv = document.getElementById(field.id + 'Error');
      if (!errorDiv) return true;
      
      let isValid = true;
      let errorMessage = '';
      
      switch(field.id) {
        case 'email':
          if (!field.value.trim()) {
            isValid = false;
            errorMessage = 'Email is required';
          } else if (!isValidEmail(field.value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
          }
          break;
          
        case 'password':
          if (!field.value) {
            isValid = false;
            errorMessage = 'Password is required';
          } else if (field.value.length < 8) {
            isValid = false;
            errorMessage = 'Password must be at least 8 characters';
          }
          break;
      }
      
      if (!isValid) {
        errorDiv.textContent = errorMessage;
        errorDiv.hidden = false;
        field.setAttribute('aria-invalid', 'true');
      } else {
        errorDiv.hidden = true;
        field.removeAttribute('aria-invalid');
      }
      
      return isValid;
    }

    // Set form timestamp
    function setFormTimestamp() {
      document.getElementById('formTimestamp').value = Date.now().toString();
    }

    // Handle login with security measures
    async function handleLogin(e) {
      e.preventDefault();
      
      // Clear previous errors
      document.getElementById('loginError').hidden = true;
      
      // Check if account is locked
      if (isAccountLocked()) {
        return false;
      }
      
      // Check honeypot (bot detection)
      const honeypot = document.getElementById('website');
      if (honeypot && honeypot.value.trim() !== '') {
        console.warn('Bot detected - login blocked');
        showError('Access denied');
        return false;
      }
      
      // Rate limiting check
      const timestamp = document.getElementById('formTimestamp').value;
      const now = Date.now();
      if (timestamp && (now - parseInt(timestamp)) < 2000) {
        showError('Please wait a moment before trying again');
        return false;
      }
      
      // Get form fields
      const email = document.getElementById('email');
      const password = document.getElementById('password');
      
      // Validate fields
      if (!validateField(email) || !validateField(password)) {
        return false;
      }
      
      // Disable submit button to prevent double submission
      const loginBtn = document.getElementById('loginBtn');
      loginBtn.disabled = true;
      loginBtn.innerHTML = '<i class="bi bi-spinner spinning"></i> Logging in...';
      
      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email.value.trim().toLowerCase());
      const csrfToken = document.getElementById('csrfToken').value;
      
      // In production, this would be an HTTPS request to your server
      // Simulating login attempt for demonstration
      setTimeout(() => {
        // This is where you'd make an actual API call
        // For demo purposes, using test credentials
        if (sanitizedEmail === 'test@edupath.com' && password.value === 'Test@1234') {
          // Successful login
          resetLoginAttempts();
          alert('Login successful! Welcome back to EduPath.');
          
          // Handle "Remember Me" functionality
          if (document.getElementById('rememberMe').checked) {
            // Set secure persistent session (would be handled server-side)
            console.log('Setting persistent session');
          }
          
          // Redirect to dashboard
          // window.location.href = 'dashboard.html';
        } else {
          // Failed login
          const isLocked = trackFailedAttempt();
          
          if (!isLocked) {
            // Show generic error message (don't specify if email or password is wrong)
            showError('Invalid email or password');
          }
          
          // Reset form timestamp
          setFormTimestamp();
        }
        
        // Re-enable submit button
        loginBtn.disabled = false;
        loginBtn.innerHTML = 'Log In';
        
        // Clear password field for security
        password.value = '';
      }, 1000);
      
      return false;
    }

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
      setFormTimestamp();
      
      // Add input validation listeners
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      
      emailInput.addEventListener('input', function() {
        validateField(this);
      });
      
      passwordInput.addEventListener('input', function() {
        validateField(this);
      });
      
      // Close mobile menu on outside click
      document.addEventListener('click', function(event) {
        const mobileMenu = document.getElementById('mobileMenu');
        const toggleButton = document.querySelector('.mobile-toggle');
        
        if (!mobileMenu.hasAttribute('hidden') && 
            !mobileMenu.contains(event.target) && 
            !toggleButton.contains(event.target)) {
          mobileMenu.setAttribute('hidden', '');
          toggleButton.setAttribute('aria-expanded', 'false');
        }
      });
      
      // Prevent password autofill from being stored
      if (window.history.replaceState) {
        window.history.replaceState(null, null, window.location.href);
      }
    });

    // Prevent form resubmission on page refresh
    if (window.history.replaceState) {
      window.history.replaceState(null, null, window.location.href);
    }

//feedback
    // Toggle mobile menu
    function toggleMenu() {
      const mobileMenu = document.getElementById('mobileMenu');
      const isExpanded = mobileMenu.hasAttribute('hidden');
      
      if (isExpanded) {
        mobileMenu.removeAttribute('hidden');
      } else {
        mobileMenu.setAttribute('hidden', '');
      }
      
      const toggleButton = document.querySelector('.mobile-toggle');
      if (toggleButton) {
        toggleButton.setAttribute('aria-expanded', !isExpanded);
      }
    }

    // Rating system variables
    let currentRating = 0;
    
    // Sanitize input to prevent XSS
    function sanitizeInput(input) {
      if (!input) return '';
      const div = document.createElement('div');
      div.textContent = input;
      return div.innerHTML;
    }

    // Validate email format (if email field is added)
    function isValidEmail(email) {
      const emailRegex = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i;
      return emailRegex.test(email);
    }

    // Character counter for feedback
    function updateCharCounter() {
      const feedback = document.getElementById('feedback');
      const counter = document.getElementById('charCounter');
      const remaining = feedback.value.length;
      counter.textContent = `${remaining}/1000 characters`;
      
      if (remaining >= 950) {
        counter.style.color = '#dc3545';
      } else if (remaining >= 800) {
        counter.style.color = '#ffc107';
      } else {
        counter.style.color = '#6c757d';
      }
    }

    // Build stars with improved accessibility
    function initializeStars() {
      const container = document.getElementById('starsContainer');
      container.innerHTML = ''; // Clear existing
      
      for (let i = 1; i <= 5; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.innerHTML = '★';
        btn.dataset.value = i;
        btn.setAttribute('aria-label', `Rate ${i} star${i !== 1 ? 's' : ''}`);
        btn.setAttribute('title', `${i} star${i !== 1 ? 's' : ''}`);
        
        btn.addEventListener('click', () => {
          currentRating = i;
          updateStars();
          validateRating();
        });
        
        btn.addEventListener('mouseenter', () => highlightStars(i));
        btn.addEventListener('mouseleave', () => highlightStars(0));
        
        container.appendChild(btn);
      }
    }

    // Highlight stars on hover
    function highlightStars(hoverVal) {
      const active = hoverVal || currentRating;
      document.querySelectorAll('.stars button').forEach((btn, idx) => {
        if (idx < active) {
          btn.classList.add('filled');
          btn.setAttribute('aria-pressed', 'true');
        } else {
          btn.classList.remove('filled');
          btn.setAttribute('aria-pressed', 'false');
        }
      });
    }

    // Update stars based on selection
    function updateStars() {
      highlightStars(0);
      const label = document.getElementById('ratingLabel');
      
      // Update message based on rating
      const messages = {
        1: "We're sorry to hear that. We'll work hard to improve!",
        2: "Thank you for your honest feedback. We'll do better!",
        3: "Thanks for the feedback! We're working to improve.",
        4: "We're glad you're enjoying EduPath!",
        5: "We're thrilled you love EduPath! Thank you!"
      };
      
      label.textContent = messages[currentRating] || '';
      
      // Store rating in hidden field for submission
      document.getElementById('ratingValue')?.remove();
      const ratingInput = document.createElement('input');
      ratingInput.type = 'hidden';
      ratingInput.id = 'ratingValue';
      ratingInput.name = 'rating';
      ratingInput.value = currentRating;
      document.getElementById('rateForm').appendChild(ratingInput);
    }

    // Validate rating selection
    function validateRating() {
      const ratingError = document.getElementById('ratingError');
      if (currentRating === 0) {
        ratingError.hidden = false;
        return false;
      } else {
        ratingError.hidden = true;
        return true;
      }
    }

    // Validate form fields
    function validateField(field) {
      const errorDiv = document.getElementById(field.id + 'Error');
      if (!errorDiv) return true;
      
      let isValid = true;
      let errorMessage = '';
      
      switch(field.id) {
        case 'name':
          if (field.value && !field.value.match(/^[A-Za-z\s\-']{0,100}$/)) {
            isValid = false;
            errorMessage = 'Name can only contain letters, spaces, hyphens, or apostrophes';
          }
          break;
          
        case 'feedback':
          if (!field.value.trim()) {
            isValid = false;
            errorMessage = 'Feedback is required';
          } else if (field.value.length > 1000) {
            isValid = false;
            errorMessage = 'Feedback cannot exceed 1000 characters';
          } else if (field.value.length < 10) {
            isValid = false;
            errorMessage = 'Please provide more detailed feedback (minimum 10 characters)';
          }
          break;
      }
      
      if (!isValid) {
        errorDiv.textContent = errorMessage;
        errorDiv.hidden = false;
        field.setAttribute('aria-invalid', 'true');
      } else {
        errorDiv.hidden = true;
        field.removeAttribute('aria-invalid');
      }
      
      return isValid;
    }

    // Show message
    function showMessage(elementId, message, isSuccess = false) {
      const element = document.getElementById(elementId);
      element.textContent = message;
      element.hidden = false;
      
      if (isSuccess) {
        setTimeout(() => {
          element.hidden = true;
        }, 5000);
      }
    }

    // Rate limiting - check submission frequency
    function checkRateLimit() {
      const submissionCount = parseInt(document.getElementById('submissionCount').value) || 0;
      const lastSubmission = localStorage.getItem('lastFeedbackSubmission');
      const now = Date.now();
      
      // Limit to 3 submissions per day per user
      if (submissionCount >= 3) {
        if (lastSubmission && (now - parseInt(lastSubmission)) < 86400000) { // 24 hours
          showMessage('formError', 'You have reached the maximum number of feedback submissions for today. Please try again tomorrow.');
          return false;
        } else {
          // Reset count after 24 hours
          document.getElementById('submissionCount').value = '1';
          localStorage.setItem('lastFeedbackSubmission', now.toString());
        }
      }
      
      return true;
    }

    // Set form timestamp
    function setFormTimestamp() {
      document.getElementById('formTimestamp').value = Date.now().toString();
    }

    // Handle form submission
    async function handleRate(e) {
      e.preventDefault();
      
      // Clear previous messages
      document.getElementById('formError').hidden = true;
      document.getElementById('formSuccess').hidden = true;
      
      // Check rate limit
      if (!checkRateLimit()) {
        return false;
      }
      
      // Check honeypot (bot detection)
      const honeypot = document.getElementById('website');
      if (honeypot && honeypot.value.trim() !== '') {
        console.warn('Bot detected - feedback blocked');
        showMessage('formError', 'Invalid submission');
        return false;
      }
      
      // Rate limiting check (prevent rapid submissions)
      const timestamp = document.getElementById('formTimestamp').value;
      const now = Date.now();
      if (timestamp && (now - parseInt(timestamp)) < 5000) { // 5 seconds minimum between submissions
        showMessage('formError', 'Please wait a moment before submitting again');
        return false;
      }
      
      // Validate rating
      if (!validateRating()) {
        document.getElementById('ratingError').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
      }
      
      // Validate fields
      const name = document.getElementById('name');
      const feedback = document.getElementById('feedback');
      const category = document.getElementById('category');
      
      if (!validateField(feedback)) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
      }
      
      if (name.value && !validateField(name)) {
        return false;
      }
      
      // Disable submit button
      const submitBtn = document.getElementById('submitBtn');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="bi bi-spinner spinning"></i> Submitting...';
      
      // Sanitize inputs
      const sanitizedName = name.value ? sanitizeInput(name.value.trim()) : 'Anonymous';
      const sanitizedFeedback = sanitizeInput(feedback.value.trim());
      const csrfToken = document.getElementById('csrfToken').value;
      
      // Prepare data for submission
      const formData = {
        name: sanitizedName,
        feedback: sanitizedFeedback,
        rating: currentRating,
        category: category.value,
        timestamp: now,
        csrfToken: csrfToken
      };
      
      // In production, send to server via HTTPS
      console.log('Feedback data ready for submission:', formData);
      
      // Simulate API call
      setTimeout(() => {
        // Update submission count
        const submissionCount = parseInt(document.getElementById('submissionCount').value) || 0;
        document.getElementById('submissionCount').value = submissionCount + 1;
        localStorage.setItem('lastFeedbackSubmission', Date.now().toString());
        
        // Show success message
        showMessage('formSuccess', 'Thank you for your feedback! We appreciate your input.', true);
        
        // Reset form
        currentRating = 0;
        highlightStars(0);
        document.getElementById('ratingLabel').textContent = '';
        e.target.reset();
        updateCharCounter();
        
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Feedback';
        
        // Reset form timestamp
        setFormTimestamp();
      }, 1500);
      
      return false;
    }

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
      initializeStars();
      setFormTimestamp();
      
      // Add input validation listeners
      const nameInput = document.getElementById('name');
      const feedbackInput = document.getElementById('feedback');
      
      if (nameInput) {
        nameInput.addEventListener('input', function() {
          validateField(this);
        });
      }
      
      if (feedbackInput) {
        feedbackInput.addEventListener('input', function() {
          validateField(this);
          updateCharCounter();
        });
      }
      
      // Close mobile menu on outside click
      document.addEventListener('click', function(event) {
        const mobileMenu = document.getElementById('mobileMenu');
        const toggleButton = document.querySelector('.mobile-toggle');
        
        if (!mobileMenu.hasAttribute('hidden') && 
            !mobileMenu.contains(event.target) && 
            !toggleButton.contains(event.target)) {
          mobileMenu.setAttribute('hidden', '');
          toggleButton.setAttribute('aria-expanded', 'false');
        }
      });
      
      // Check for existing submission count in localStorage
      const lastSubmission = localStorage.getItem('lastFeedbackSubmission');
      if (lastSubmission) {
        const now = Date.now();
        if ((now - parseInt(lastSubmission)) < 86400000) { // Within 24 hours
          // Would need to track count server-side for accuracy
        }
      }
    });

    // Prevent form resubmission on page refresh
    if (window.history.replaceState) {
      window.history.replaceState(null, null, window.location.href);
    }
//forgotpassword
    // State management
    let currentStep = 'email'; // 'email' or 'reset'
    let resetToken = null;
    let resetEmail = null;
    
    // Toggle mobile menu
    function toggleMenu() {
      const mobileMenu = document.getElementById('mobileMenu');
      const isExpanded = mobileMenu.hasAttribute('hidden');
      
      if (isExpanded) {
        mobileMenu.removeAttribute('hidden');
      } else {
        mobileMenu.setAttribute('hidden', '');
      }
      
      const toggleButton = document.querySelector('.mobile-toggle');
      if (toggleButton) {
        toggleButton.setAttribute('aria-expanded', !isExpanded);
      }
    }

    // Toggle password visibility
    function togglePasswordVisibility(fieldId) {
      const passwordInput = document.getElementById(fieldId);
      const toggleIcon = document.getElementById(`toggle${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}Icon`);
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('bi-eye');
        toggleIcon.classList.add('bi-eye-slash');
      } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('bi-eye-slash');
        toggleIcon.classList.add('bi-eye');
      }
    }

    // Show/hide forms
    function showEmailForm() {
      document.getElementById('forgotPasswordForm').style.display = 'block';
      document.getElementById('resetPasswordForm').style.display = 'none';
      currentStep = 'email';
    }

    function showResetForm(email, token) {
      document.getElementById('resetEmail').value = email;
      document.getElementById('resetToken').value = token;
      document.getElementById('forgotPasswordForm').style.display = 'none';
      document.getElementById('resetPasswordForm').style.display = 'block';
      currentStep = 'reset';
    }

    // Sanitize input to prevent XSS
    function sanitizeInput(input) {
      if (!input) return '';
      const div = document.createElement('div');
      div.textContent = input;
      return div.innerHTML;
    }

    // Validate email format
    function isValidEmail(email) {
      const emailRegex = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i;
      return emailRegex.test(email);
    }

    // Check if account is locked due to too many attempts
    function isAccountLocked() {
      const lockoutUntil = parseInt(document.getElementById('lockoutUntil').value);
      const now = Date.now();
      
      if (lockoutUntil > now) {
        const minutesLeft = Math.ceil((lockoutUntil - now) / 60000);
        showError(`Too many attempts. Please try again in ${minutesLeft} minutes.`);
        return true;
      }
      return false;
    }

    // Track failed attempts
    function trackFailedAttempt() {
      let attempts = parseInt(document.getElementById('attemptCount').value) || 0;
      attempts++;
      
      document.getElementById('attemptCount').value = attempts;
      
      // Lock after 3 failed attempts
      if (attempts >= 3) {
        const lockoutTime = Date.now() + (15 * 60 * 1000); // 15 minutes
        document.getElementById('lockoutUntil').value = lockoutTime;
        showError('Too many failed attempts. Account locked for 15 minutes.');
        return true;
      }
      
      const remainingAttempts = 3 - attempts;
      showError(`Invalid email. ${remainingAttempts} attempt(s) remaining.`);
      return false;
    }

    // Reset attempts on success
    function resetAttempts() {
      document.getElementById('attemptCount').value = '0';
      document.getElementById('lockoutUntil').value = '0';
    }

    // Show error message
    function showError(message) {
      const errorDiv = document.getElementById('formError');
      errorDiv.textContent = message;
      errorDiv.hidden = false;
      
      setTimeout(() => {
        errorDiv.hidden = true;
      }, 5000);
    }

    // Show success message
    function showSuccess(message) {
      const successDiv = document.getElementById('formSuccess');
      successDiv.textContent = message;
      successDiv.hidden = false;
    }

    // Validate email field
    function validateEmail() {
      const email = document.getElementById('email');
      const errorDiv = document.getElementById('emailError');
      
      if (!email.value.trim()) {
        errorDiv.textContent = 'Email is required';
        errorDiv.hidden = false;
        return false;
      } else if (!isValidEmail(email.value)) {
        errorDiv.textContent = 'Please enter a valid email address';
        errorDiv.hidden = false;
        return false;
      } else {
        errorDiv.hidden = true;
        return true;
      }
    }

    // Check password strength
    function checkPasswordStrength(password) {
      const strengthBar = document.getElementById('newPasswordStrength');
      
      // Update requirement checks
      document.getElementById('req-length').className = password.length >= 8 ? 'valid' : '';
      document.getElementById('req-uppercase').className = /[A-Z]/.test(password) ? 'valid' : '';
      document.getElementById('req-lowercase').className = /[a-z]/.test(password) ? 'valid' : '';
      document.getElementById('req-number').className = /\d/.test(password) ? 'valid' : '';
      document.getElementById('req-special').className = /[@$!%*?&]/.test(password) ? 'valid' : '';
      
      // Calculate strength
      let strength = 0;
      if (password.length >= 8) strength++;
      if (/[a-z]/.test(password)) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/\d/.test(password)) strength++;
      if (/[@$!%*?&]/.test(password)) strength++;
      
      const strengthLevels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
      const colors = ['#ff4444', '#ff7744', '#ffaa44', '#44ff44', '#00aa00'];
      
      if (password.length > 0) {
        strengthBar.textContent = `Password Strength: ${strengthLevels[strength-1] || 'Very Weak'}`;
        strengthBar.style.color = colors[strength-1] || '#ff4444';
        strengthBar.hidden = false;
      } else {
        strengthBar.hidden = true;
      }
    }

    // Validate new password
    function validateNewPassword() {
      const password = document.getElementById('newPassword');
      const confirmPassword = document.getElementById('confirmNewPassword');
      const passwordError = document.getElementById('newPasswordError');
      const confirmError = document.getElementById('confirmNewPasswordError');
      
      let isValid = true;
      
      // Validate password strength
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password.value)) {
        passwordError.textContent = 'Password does not meet requirements';
        passwordError.hidden = false;
        isValid = false;
      } else {
        passwordError.hidden = true;
      }
      
      // Validate password match
      if (password.value !== confirmPassword.value) {
        confirmError.textContent = 'Passwords do not match';
        confirmError.hidden = false;
        isValid = false;
      } else {
        confirmError.hidden = true;
      }
      
      return isValid;
    }

    // Set form timestamp
    function setFormTimestamp() {
      document.getElementById('formTimestamp').value = Date.now().toString();
    }

    // Handle forgot password request
    async function handleForgotPassword(e) {
      e.preventDefault();
      
      // Clear previous messages
      document.getElementById('formError').hidden = true;
      document.getElementById('formSuccess').hidden = true;
      
      // Check if account is locked
      if (isAccountLocked()) {
        return false;
      }
      
      // Check honeypot (bot detection)
      const honeypot = document.getElementById('website');
      if (honeypot && honeypot.value.trim() !== '') {
        console.warn('Bot detected - request blocked');
        showError('Invalid request');
        return false;
      }
      
      // Rate limiting check
      const timestamp = document.getElementById('formTimestamp').value;
      const now = Date.now();
      if (timestamp && (now - parseInt(timestamp)) < 30000) { // 30 seconds between requests
        showError('Please wait 30 seconds before requesting another reset link');
        return false;
      }
      
      // Validate email
      if (!validateEmail()) {
        return false;
      }
      
      // Disable submit button
      const submitBtn = document.getElementById('submitBtn');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="bi bi-spinner spinning"></i> Sending...';
      
      const email = document.getElementById('email').value.trim().toLowerCase();
      const csrfToken = document.getElementById('csrfToken').value;
      
      // In production, this would be an API call to your server
      setTimeout(() => {
        // IMPORTANT: Always show success message even if email doesn't exist
        // This prevents email enumeration attacks
        showSuccess('If an account exists with this email, you will receive a password reset link shortly.');
        
        // Generate a secure token (in production, this would be server-side)
        const mockToken = generateSecureToken();
        
        // Log for demo purposes (remove in production)
        console.log(`Demo - Reset link: https://edupath.com/reset-password?email=${encodeURIComponent(email)}&token=${mockToken}`);
        
        // Reset form
        document.getElementById('forgotPasswordForm').reset();
        setFormTimestamp();
        
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-envelope-paper"></i> Send Reset Link';
        
        // Reset attempts on success
        resetAttempts();
      }, 1500);
      
      return false;
    }

    // Handle password reset
    async function handleResetPassword(e) {
      e.preventDefault();
      
      // Clear previous messages
      document.getElementById('formError').hidden = true;
      document.getElementById('formSuccess').hidden = true;
      
      // Validate passwords
      if (!validateNewPassword()) {
        return false;
      }
      
      // Disable reset button
      const resetBtn = document.getElementById('resetBtn');
      resetBtn.disabled = true;
      resetBtn.innerHTML = '<i class="bi bi-spinner spinning"></i> Resetting...';
      
      const newPassword = document.getElementById('newPassword').value;
      const email = document.getElementById('resetEmail').value;
      const token = document.getElementById('resetToken').value;
      
      // In production, this would be an API call to your server
      setTimeout(() => {
        showSuccess('Password reset successful! Redirecting to login...');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 3000);
        
        // Re-enable button (though page will redirect)
        resetBtn.disabled = false;
        resetBtn.innerHTML = '<i class="bi bi-check-circle"></i> Reset Password';
      }, 1500);
      
      return false;
    }

    // Generate secure token (for demo only - use server-side in production)
    function generateSecureToken() {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Check URL for reset token (when user clicks email link)
    function checkForResetToken() {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const email = urlParams.get('email');
      
      if (token && email) {
        // Validate token (in production, verify with server)
        if (token.length === 64) { // Simple validation
          showResetForm(decodeURIComponent(email), token);
        }
      }
    }

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
      setFormTimestamp();
      checkForResetToken();
      
      // Add input validation listeners
      const emailInput = document.getElementById('email');
      emailInput.addEventListener('input', validateEmail);
      
      const newPassword = document.getElementById('newPassword');
      const confirmPassword = document.getElementById('confirmNewPassword');
      
      if (newPassword) {
        newPassword.addEventListener('input', function() {
          checkPasswordStrength(this.value);
          validateNewPassword();
        });
      }
      
      if (confirmPassword) {
        confirmPassword.addEventListener('input', validateNewPassword);
      }
      
      // Close mobile menu on outside click
      document.addEventListener('click', function(event) {
        const mobileMenu = document.getElementById('mobileMenu');
        const toggleButton = document.querySelector('.mobile-toggle');
        
        if (!mobileMenu.hasAttribute('hidden') && 
            !mobileMenu.contains(event.target) && 
            !toggleButton.contains(event.target)) {
          mobileMenu.setAttribute('hidden', '');
          toggleButton.setAttribute('aria-expanded', 'false');
        }
      });
    });

    // Prevent form resubmission on page refresh
    if (window.history.replaceState) {
      window.history.replaceState(null, null, window.location.href);
    }
//about

    function toggleMenu() {
      document.getElementById('mobileMenu').classList.toggle('open');
    }






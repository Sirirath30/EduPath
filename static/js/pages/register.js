/**
 * EduPath Register Page
 * Enhanced with better password strength UI and visual feedback
 */

(function() {
    'use strict';

    // Toggle mobile menu
    function toggleMenu() {
      const menu = document.getElementById('mobileMenu');
      menu.hidden = !menu.hidden;
    }
    window.toggleMenu = toggleMenu;

    // Toggle password visibility
    function togglePassword(fieldId) {
      const input = document.getElementById(fieldId);
      const icon = document.getElementById(fieldId === 'password' ? 'togglePasswordIcon' : 'toggleConfirmIcon');
      
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('bi-eye');
        icon.classList.add('bi-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.remove('bi-eye-slash');
        icon.classList.add('bi-eye');
      }
    }
    window.togglePassword = togglePassword;

    // Check password strength and update requirements with visual feedback
    function checkPasswordStrength(password) {
      const strengthBar = document.getElementById('passwordStrength');
      if (!strengthBar) return;
      
      // Define requirements
      const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[@$!%*?&]/.test(password)
      };
      
      // Update requirement checks with icons
      const reqLength = document.getElementById('req-length');
      const reqUppercase = document.getElementById('req-uppercase');
      const reqLowercase = document.getElementById('req-lowercase');
      const reqNumber = document.getElementById('req-number');
      const reqSpecial = document.getElementById('req-special');
      
      // Helper function to update requirement
      function updateRequirement(element, isValid) {
        if (!element) return;
        
        const icon = element.querySelector('i');
        element.className = isValid ? 'valid' : '';
        
        if (icon) {
          if (isValid) {
            icon.classList.remove('bi-circle');
            icon.classList.add('bi-check-circle-fill');
          } else {
            icon.classList.remove('bi-check-circle-fill');
            icon.classList.add('bi-circle');
          }
        }
      }
      
      updateRequirement(reqLength, requirements.length);
      updateRequirement(reqUppercase, requirements.uppercase);
      updateRequirement(reqLowercase, requirements.lowercase);
      updateRequirement(reqNumber, requirements.number);
      updateRequirement(reqSpecial, requirements.special);
      
      // Calculate strength (0-5)
      const strengthCount = Object.values(requirements).filter(Boolean).length;
      
      // Define strength levels with colors and messages
      const strengthLevels = [
        { text: 'Very Weak', color: '#ef4444', icon: 'bi-emoji-frown', message: 'Your password is too weak' },
        { text: 'Weak', color: '#f59e0b', icon: 'bi-emoji-neutral', message: 'Try adding more variety' },
        { text: 'Fair', color: '#3b82f6', icon: 'bi-emoji-smile', message: 'Getting better' },
        { text: 'Good', color: '#10b981', icon: 'bi-emoji-smile', message: 'Good password' },
        { text: 'Strong', color: '#10b981', icon: 'bi-emoji-laughing', message: 'Strong password!' },
        { text: 'Very Strong', color: '#059669', icon: 'bi-emoji-laughing', message: 'Excellent password!' }
      ];
      
      const level = strengthLevels[strengthCount] || strengthLevels[0];
      
      // Update strength bar with visual indicator
      if (password.length > 0) {
        // Create a visual strength bar
        const strengthHtml = `
          <div style="margin-top: 0.5rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem;">
              <span style="font-weight: 600; color: ${level.color};">
                <i class="bi ${level.icon}" style="margin-right: 0.25rem;"></i>
                ${level.text}
              </span>
              <span style="font-size: 0.75rem; color: var(--muted-foreground);">
                ${strengthCount}/5 requirements
              </span>
            </div>
            <div style="width: 100%; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden;">
              <div style="width: ${(strengthCount / 5) * 100}%; height: 100%; background: ${level.color}; transition: width 0.3s ease;"></div>
            </div>
            <p style="font-size: 0.75rem; color: var(--muted-foreground); margin-top: 0.25rem;">
              <i class="bi bi-info-circle"></i> ${level.message}
            </p>
          </div>
        `;
        
        strengthBar.innerHTML = strengthHtml;
        strengthBar.style.display = 'block';
      } else {
        strengthBar.style.display = 'none';
      }
      
      return requirements;
    }
    window.checkPasswordStrength = checkPasswordStrength;

    // Handle form submission
    document.addEventListener('DOMContentLoaded', function() {
      const registerForm = document.getElementById('registerForm');
      if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
          e.preventDefault();
          
          // Clear previous messages
          const formError = document.getElementById('formError');
          const formSuccess = document.getElementById('formSuccess');
          if (formError) formError.hidden = true;
          if (formSuccess) formSuccess.hidden = true;
          
          // Check honeypot
          const honeypot = document.getElementById('website');
          if (honeypot && honeypot.value.trim() !== '') {
            console.warn('Bot detected');
            if (formError) {
              formError.textContent = 'Invalid request';
              formError.hidden = false;
            }
            return;
          }
          
          // Validate password before submitting
          const password = document.getElementById('password');
          const confirmPassword = document.getElementById('confirmPassword');
          
          if (password.value !== confirmPassword.value) {
            const confirmError = document.getElementById('confirmPasswordError');
            if (confirmError) {
              confirmError.textContent = 'Passwords do not match';
              confirmError.hidden = false;
            }
            
            // Re-enable button and return
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-person-plus"></i> Create Account';
            return;
          }
          
          // Check password strength
          const requirements = {
            length: password.value.length >= 8,
            uppercase: /[A-Z]/.test(password.value),
            lowercase: /[a-z]/.test(password.value),
            number: /\d/.test(password.value),
            special: /[@$!%*?&]/.test(password.value)
          };
          
          const isValid = requirements.length && requirements.uppercase && 
                         requirements.lowercase && requirements.number && requirements.special;
          
          if (!isValid) {
            if (formError) {
              formError.textContent = 'Please meet all password requirements';
              formError.hidden = false;
            }
            
            // Scroll to password field
            document.getElementById('password').scrollIntoView({ behavior: 'smooth' });
            
            // Re-enable button and return
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-person-plus"></i> Create Account';
            return;
          }
          
          // Disable submit button
          const submitBtn = document.getElementById('submitBtn');
          const originalText = submitBtn.innerHTML;
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="bi bi-spinner spinning"></i> Creating Account...';
          
          // Prepare form data
          const formData = new FormData(this);
          
          try {
            const response = await fetch('/register', {
              method: 'POST',
              body: formData,
              headers: {
                'X-Requested-With': 'XMLHttpRequest'
              }
            });
            
            const data = await response.json();
            
            if (data.success) {
              if (formSuccess) {
                formSuccess.innerHTML = `
                  <i class="bi bi-check-circle-fill"></i> 
                  ${data.message}
                `;
                formSuccess.hidden = false;
              }
              
              // Disable form inputs
              document.querySelectorAll('#registerForm input, #registerForm select, #registerForm button').forEach(el => {
                el.disabled = true;
              });
              
              // Show success animation
              const formCard = document.querySelector('.form-card');
              if (formCard) {
                formCard.style.transition = 'all 0.3s ease';
                formCard.style.transform = 'scale(1.02)';
                setTimeout(() => {
                  formCard.style.transform = 'scale(1)';
                }, 300);
              }
              
              // Redirect to login after 2 seconds
              setTimeout(() => {
                window.location.href = data.redirect || '/login';
              }, 2000);
            } else {
              if (formError) {
                formError.innerHTML = `
                  <i class="bi bi-exclamation-circle-fill"></i> 
                  ${data.error || 'Registration failed'}
                `;
                formError.hidden = false;
              }
              
              // Re-enable button
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalText;
            }
            
          } catch (error) {
            console.error('Error:', error);
            if (formError) {
              formError.innerHTML = `
                <i class="bi bi-exclamation-circle-fill"></i> 
                Server connection error. Please try again.
              `;
              formError.hidden = false;
            }
            
            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
          }
        });
      }

      // Set form timestamp
      const timestampInput = document.getElementById('formTimestamp');
      if (timestampInput) {
        timestampInput.value = Date.now().toString();
      }

      // Add password strength checker with debounce
      const passwordInput = document.getElementById('password');
      if (passwordInput) {
        let timeout;
        passwordInput.addEventListener('input', function() {
          clearTimeout(timeout);
          timeout = setTimeout(() => {
            checkPasswordStrength(this.value);
          }, 100);
        });
        
        // Initial check if password is pre-filled
        if (passwordInput.value) {
          checkPasswordStrength(passwordInput.value);
        }
      }

      // Add confirm password checker with visual feedback
      const confirmInput = document.getElementById('confirmPassword');
      if (confirmInput) {
        confirmInput.addEventListener('input', function() {
          const password = document.getElementById('password').value;
          const confirmError = document.getElementById('confirmPasswordError');
          
          if (this.value && this.value !== password) {
            if (confirmError) {
              confirmError.innerHTML = `
                <i class="bi bi-exclamation-circle"></i> 
                Passwords do not match
              `;
              confirmError.hidden = false;
            }
            this.classList.add('invalid');
          } else {
            if (confirmError) {
              confirmError.hidden = true;
            }
            this.classList.remove('invalid');
            
            // Add visual checkmark when matching
            if (this.value && this.value === password) {
              this.classList.add('valid');
            } else {
              this.classList.remove('valid');
            }
          }
        });
      }

      // Add input validation for name fields
      const nameInputs = ['first_name', 'last_name'];
      nameInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
          input.addEventListener('input', function() {
            const nameRegex = /^[A-Za-z\s\-']{2,50}$/;
            const errorDiv = document.getElementById(id + 'Error');
            
            if (this.value && !nameRegex.test(this.value)) {
              errorDiv.textContent = 'Invalid characters in name';
              errorDiv.hidden = false;
              this.classList.add('invalid');
            } else {
              errorDiv.hidden = true;
              this.classList.remove('invalid');
            }
          });
        }
      });

      // Email validation
      const emailInput = document.getElementById('email');
      if (emailInput) {
        emailInput.addEventListener('input', function() {
          const emailRegex = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i;
          const emailError = document.getElementById('emailError');
          
          if (this.value && !emailRegex.test(this.value)) {
            emailError.textContent = 'Please enter a valid email address';
            emailError.hidden = false;
            this.classList.add('invalid');
          } else {
            emailError.hidden = true;
            this.classList.remove('invalid');
          }
        });
      }

      // Grade validation
      const gradeSelect = document.getElementById('grade');
      if (gradeSelect) {
        gradeSelect.addEventListener('change', function() {
          const gradeError = document.getElementById('gradeError');
          
          if (!this.value) {
            gradeError.textContent = 'Please select your grade';
            gradeError.hidden = false;
            this.classList.add('invalid');
          } else {
            gradeError.hidden = true;
            this.classList.remove('invalid');
          }
        });
      }

      // Close mobile menu when clicking outside
      document.addEventListener('click', function(e) {
        const menu = document.getElementById('mobileMenu');
        const toggle = document.querySelector('.mobile-toggle');
        if (menu && !menu.hidden && !menu.contains(e.target) && toggle && !toggle.contains(e.target)) {
          menu.hidden = true;
        }
      });
      
      // Add focus effects
      document.querySelectorAll('input, select').forEach(field => {
        field.addEventListener('focus', function() {
          this.parentElement?.classList.add('focused');
        });
        
        field.addEventListener('blur', function() {
          this.parentElement?.classList.remove('focused');
        });
      });
    });

})();
/**
 * EduPath Feedback Page
 */

(function() {
    'use strict';
    
    class FeedbackPage {
        constructor() {
            this.form = document.getElementById('rateForm');
            if (!this.form) return;
            
            this.rating = 0;
            this.stars = document.querySelectorAll('#stars span');
            this.ratingLabel = document.getElementById('ratingLabel');
            this.charCounter = document.getElementById('charCounter');
            this.feedbackInput = document.getElementById('feedback');
            
            this.messages = {
                1: "We're sorry to hear that. We'll work hard to improve!",
                2: "Thank you for your honest feedback. We'll do better!",
                3: "Thanks for the feedback! We're working to improve.",
                4: "We're glad you're enjoying EduPath!",
                5: "We're thrilled you love EduPath! Thank you!"
            };
            
            this.init();
        }
        
        init() {
            this.initRating();
            this.initCharCounter();
            this.initValidation();
            this.initForm();
        }
        
        initRating() {
            if (!this.stars.length) return;
            
            this.stars.forEach(star => {
                // Hover effects
                star.addEventListener('mouseover', () => {
                    const value = parseInt(star.dataset.value);
                    this.highlightStars(value);
                });
                
                star.addEventListener('mouseout', () => {
                    this.highlightStars(this.rating);
                });
                
                // Click to rate
                star.addEventListener('click', () => {
                    this.rating = parseInt(star.dataset.value);
                    this.highlightStars(this.rating);
                    this.updateRatingLabel();
                    
                    // Hide rating error if visible
                    const ratingError = document.getElementById('ratingError');
                    if (ratingError) ratingError.hidden = true;
                });
            });
        }
        
        highlightStars(value) {
            this.stars.forEach(star => {
                const starValue = parseInt(star.dataset.value);
                star.classList.toggle('filled', starValue <= value);
            });
        }
        
        updateRatingLabel() {
            if (this.ratingLabel) {
                this.ratingLabel.textContent = this.messages[this.rating] || '';
            }
        }
        
        initCharCounter() {
            if (!this.feedbackInput || !this.charCounter) return;
            
            this.feedbackInput.addEventListener('input', () => {
                const length = this.feedbackInput.value.length;
                this.charCounter.textContent = `${length}/1000`;
                
                // Color coding
                if (length >= 950) {
                    this.charCounter.style.color = '#ef4444';
                } else if (length >= 800) {
                    this.charCounter.style.color = '#f59e0b';
                } else {
                    this.charCounter.style.color = '#6b7280';
                }
            });
        }
        
        initValidation() {
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            
            if (nameInput) {
                nameInput.addEventListener('input', () => this.validateName());
            }
            
            if (emailInput) {
                emailInput.addEventListener('input', () => this.validateEmail());
            }
            
            if (this.feedbackInput) {
                this.feedbackInput.addEventListener('input', () => this.validateFeedback());
            }
        }
        
        validateName() {
            const name = document.getElementById('name');
            const error = document.getElementById('nameError');
            
            if (!name || !error) return true;
            
            if (name.value && !EduPath.validate.name(name.value)) {
                error.textContent = 'Name can only contain letters, spaces, hyphens';
                error.hidden = false;
                return false;
            }
            
            error.hidden = true;
            return true;
        }
        
        validateEmail() {
            const email = document.getElementById('email');
            const error = document.getElementById('emailError');
            
            if (!email || !error) return true;
            
            if (email.value && !EduPath.validate.email(email.value)) {
                error.textContent = 'Please enter a valid email address';
                error.hidden = false;
                return false;
            }
            
            error.hidden = true;
            return true;
        }
        
        validateFeedback() {
            const feedback = document.getElementById('feedback');
            const error = document.getElementById('feedbackError');
            
            if (!feedback || !error) return true;
            
            if (!feedback.value.trim()) {
                error.textContent = 'Feedback is required';
                error.hidden = false;
                return false;
            }
            
            if (feedback.value.length < 10) {
                error.textContent = 'Please provide more detailed feedback (minimum 10 characters)';
                error.hidden = false;
                return false;
            }
            
            error.hidden = true;
            return true;
        }
        
        initForm() {
            this.form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Clear previous messages
                document.getElementById('formError')?.classList.add('hidden');
                document.getElementById('formSuccess')?.classList.add('hidden');
                
                // Validate rating
                if (this.rating === 0) {
                    document.getElementById('ratingError').hidden = false;
                    return;
                }
                
                // Honeypot check
                const honeypot = document.getElementById('website');
                if (honeypot?.value.trim()) {
                    console.warn('Bot detected');
                    return;
                }
                
                // Rate limiting
                const timestamp = document.getElementById('formTimestamp');
                const now = Date.now();
                if (timestamp?.value && (now - parseInt(timestamp.value)) < 5000) {
                    document.getElementById('formError').textContent = 
                        'Please wait 5 seconds between submissions';
                    document.getElementById('formError').classList.remove('hidden');
                    return;
                }
                
                // Validate fields
                if (!this.validateFeedback()) {
                    document.getElementById('feedback').scrollIntoView({ behavior: 'smooth' });
                    return;
                }
                
                if (!this.validateName() || !this.validateEmail()) {
                    return;
                }
                
                // Disable submit button
                const submitBtn = document.getElementById('submitBtn');
                const originalText = submitBtn.innerHTML;
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="bi bi-spinner spinning"></i> Submitting...';
                
                // Prepare data
                const data = {
                    name: document.getElementById('name')?.value.trim() || 'Anonymous',
                    email: document.getElementById('email')?.value.trim() || '',
                    feedback: this.feedbackInput.value.trim(),
                    rating: this.rating,
                    category: document.getElementById('category')?.value,
                    csrfToken: document.getElementById('csrfToken')?.value
                };
                
                try {
                    const response = await EduPath.api.post('/rate', data);
                    
                    if (response.success) {
                        // Show success
                        document.getElementById('formSuccess').textContent = 
                            response.message || 'Thank you for your feedback!';
                        document.getElementById('formSuccess').classList.remove('hidden');
                        
                        // Reset form
                        this.resetForm();
                        
                        // Update submission count
                        const count = document.getElementById('submissionCount');
                        if (count) count.value = (parseInt(count.value) || 0) + 1;
                        
                    } else {
                        document.getElementById('formError').textContent = 
                            response.error || 'Submission failed';
                        document.getElementById('formError').classList.remove('hidden');
                    }
                    
                } catch (error) {
                    console.error('Error:', error);
                    document.getElementById('formError').textContent = 
                        'Server error. Please try again.';
                    document.getElementById('formError').classList.remove('hidden');
                } finally {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                    
                    if (timestamp) {
                        timestamp.value = Date.now().toString();
                    }
                }
            });
        }
        
        resetForm() {
            this.rating = 0;
            this.highlightStars(0);
            if (this.ratingLabel) this.ratingLabel.textContent = '';
            this.form.reset();
            if (this.charCounter) this.charCounter.textContent = '0/1000';
        }
    }
    
    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        new FeedbackPage();
    });
})();
/**
 * EduPath Form Validator
 */

(function() {
    'use strict';
    
    class FormValidator {
        constructor(formId, options = {}) {
            this.form = document.getElementById(formId);
            if (!this.form) return;
            
            this.options = {
                validateOnInput: true,
                validateOnBlur: true,
                showErrors: true,
                ...options
            };
            
            this.fields = new Map();
            this.init();
        }
        
        init() {
            // Add validation to all fields with data-validate attribute
            this.form.querySelectorAll('[data-validate]').forEach(field => {
                this.addField(field);
            });
            
            // Form submit handler
            this.form.addEventListener('submit', (e) => {
                if (!this.validate()) {
                    e.preventDefault();
                    this.showFirstError();
                }
            });
        }
        
        /**
         * Add field to validator
         * @param {HTMLElement} field
         */
        addField(field) {
            const rules = field.getAttribute('data-validate').split(' ');
            const errorContainer = document.getElementById(field.id + 'Error');
            
            this.fields.set(field.id, {
                element: field,
                rules,
                errorContainer
            });
            
            if (this.options.validateOnInput) {
                field.addEventListener('input', () => this.validateField(field.id));
            }
            
            if (this.options.validateOnBlur) {
                field.addEventListener('blur', () => this.validateField(field.id));
            }
        }
        
        /**
         * Validate single field
         * @param {string} fieldId
         * @returns {boolean}
         */
        validateField(fieldId) {
            const field = this.fields.get(fieldId);
            if (!field) return true;
            
            const value = field.element.value;
            let isValid = true;
            let errorMessage = '';
            
            for (const rule of field.rules) {
                const [ruleName, ruleParam] = rule.split(':');
                
                switch (ruleName) {
                    case 'required':
                        if (!EduPath.validate.required(value)) {
                            isValid = false;
                            errorMessage = 'This field is required';
                        }
                        break;
                        
                    case 'email':
                        if (value && !EduPath.validate.email(value)) {
                            isValid = false;
                            errorMessage = 'Please enter a valid email address';
                        }
                        break;
                        
                    case 'name':
                        if (value && !EduPath.validate.name(value)) {
                            isValid = false;
                            errorMessage = 'Name can only contain letters, spaces, hyphens';
                        }
                        break;
                        
                    case 'min':
                        if (value && value.length < parseInt(ruleParam)) {
                            isValid = false;
                            errorMessage = `Minimum ${ruleParam} characters required`;
                        }
                        break;
                        
                    case 'max':
                        if (value && value.length > parseInt(ruleParam)) {
                            isValid = false;
                            errorMessage = `Maximum ${ruleParam} characters allowed`;
                        }
                        break;
                        
                    case 'match':
                        const matchField = document.getElementById(ruleParam);
                        if (value !== matchField?.value) {
                            isValid = false;
                            errorMessage = 'Fields do not match';
                        }
                        break;
                        
                    case 'password':
                        const strength = EduPath.validate.password(value);
                        if (!strength.isValid) {
                            isValid = false;
                            errorMessage = 'Password does not meet requirements';
                        }
                        break;
                }
                
                if (!isValid) break;
            }
            
            // Update UI
            field.element.classList.toggle('invalid', !isValid);
            field.element.classList.toggle('valid', isValid && value.length > 0);
            
            if (field.errorContainer && this.options.showErrors) {
                field.errorContainer.textContent = errorMessage;
                field.errorContainer.hidden = isValid;
            }
            
            return isValid;
        }
        
        /**
         * Validate entire form
         * @returns {boolean}
         */
        validate() {
            let isValid = true;
            
            for (const fieldId of this.fields.keys()) {
                if (!this.validateField(fieldId)) {
                    isValid = false;
                }
            }
            
            return isValid;
        }
        
        /**
         * Scroll to first error
         */
        showFirstError() {
            const firstInvalid = this.form.querySelector('.invalid');
            if (firstInvalid) {
                EduPath.scrollTo(firstInvalid);
                firstInvalid.focus();
            }
        }
        
        /**
         * Reset validation
         */
        reset() {
            this.fields.forEach((field, fieldId) => {
                field.element.classList.remove('invalid', 'valid');
                if (field.errorContainer) {
                    field.errorContainer.hidden = true;
                }
            });
        }
        
        /**
         * Get form data as object
         * @returns {Object}
         */
        getData() {
            const formData = new FormData(this.form);
            const data = {};
            
            for (const [key, value] of formData.entries()) {
                if (data[key]) {
                    if (!Array.isArray(data[key])) {
                        data[key] = [data[key]];
                    }
                    data[key].push(value);
                } else {
                    data[key] = value;
                }
            }
            
            return data;
        }
    }
    
    // Export
    window.FormValidator = FormValidator;
})();
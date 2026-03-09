/**
 * EduPath Question Builder
 * For creating quiz questions dynamically
 */

(function() {
    'use strict';
    
    class QuestionBuilder {
        constructor(containerId, options = {}) {
            this.container = document.getElementById(containerId);
            if (!this.container) return;
            
            this.options = {
                type: 'quiz', // 'quiz', 'video', 'document'
                maxQuestions: 50,
                showPoints: true,
                showTimestamp: false,
                showCorrectAnswer: true,
                minOptions: 2,
                maxOptions: 4,
                ...options
            };
            
            this.count = 0;
            this.prefix = options.prefix || `q_${Date.now()}`;
            this.questions = new Map();
            
            this.init();
        }
        
        init() {
            // Add button
            const addBtn = document.getElementById(`add${this.options.type}Question`);
            if (addBtn) {
                addBtn.addEventListener('click', () => this.add());
            }
            
            // Load existing questions
            this.loadExisting();
        }
        
        /**
         * Load existing questions from DOM
         */
        loadExisting() {
            this.container.querySelectorAll('.question-block').forEach((block, index) => {
                const id = block.dataset.questionId || index;
                this.questions.set(id, block);
                this.count = Math.max(this.count, parseInt(id) + 1);
            });
        }
        
        /**
         * Add new question
         */
        add() {
            if (this.count >= this.options.maxQuestions) {
                notification.warning(`Maximum ${this.options.maxQuestions} questions allowed`);
                return;
            }
            
            const id = this.count++;
            const question = this.createQuestionElement(id);
            
            this.container.appendChild(question);
            this.questions.set(id, question);
            
            // Trigger event
            document.dispatchEvent(new CustomEvent('question:added', {
                detail: { id, type: this.options.type }
            }));
            
            return id;
        }
        
        /**
         * Create question element
         * @param {number} id
         * @returns {HTMLElement}
         */
        createQuestionElement(id) {
            const div = document.createElement('div');
            div.className = 'question-block';
            div.dataset.questionId = id;
            div.style.cssText = `
                background: #f9fafb;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 20px;
                border: 1px solid #e5e7eb;
                animation: slideIn 0.3s ease;
            `;
            
            // Header
            const header = document.createElement('div');
            header.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            `;
            
            const title = document.createElement('h4');
            title.textContent = `Question ${this.questions.size + 1}`;
            title.style.margin = '0';
            
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'btn-icon btn-danger';
            removeBtn.innerHTML = '<i class="bi bi-trash"></i> Remove';
            removeBtn.onclick = () => this.remove(id);
            
            header.appendChild(title);
            header.appendChild(removeBtn);
            div.appendChild(header);
            
            // Timestamp (for video questions)
            if (this.options.showTimestamp) {
                const timestampGroup = this.createInputGroup(
                    'timestamp',
                    'Timestamp (seconds)',
                    'number',
                    `${this.prefix}[${id}][timestamp]`,
                    { min: 0, step: 1, required: true }
                );
                div.appendChild(timestampGroup);
            }
            
            // Question text
            const questionGroup = this.createInputGroup(
                'question',
                'Question',
                'text',
                `${this.prefix}[${id}][question]`,
                { required: true, placeholder: 'Enter your question' }
            );
            div.appendChild(questionGroup);
            
            // Options
            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'options-grid';
            optionsContainer.style.cssText = `
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin: 15px 0;
            `;
            
            const letters = ['A', 'B', 'C', 'D'];
            for (let i = 0; i < this.options.maxOptions; i++) {
                const letter = letters[i];
                const required = i < this.options.minOptions;
                
                const optionDiv = document.createElement('div');
                optionDiv.className = 'option-input';
                optionDiv.style.cssText = `
                    display: flex;
                    gap: 8px;
                    align-items: center;
                `;
                
                // Radio for correct answer
                if (this.options.showCorrectAnswer) {
                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = `${this.prefix}[${id}][correct]`;
                    radio.value = letter;
                    if (required && i === 0) radio.required = true;
                    optionDiv.appendChild(radio);
                }
                
                // Option input
                const input = document.createElement('input');
                input.type = 'text';
                input.name = `${this.prefix}[${id}][option_${letter.toLowerCase()}]`;
                input.placeholder = `Option ${letter}`;
                input.required = required;
                input.className = 'form-control';
                optionDiv.appendChild(input);
                
                optionsContainer.appendChild(optionDiv);
            }
            
            div.appendChild(optionsContainer);
            
            // Points
            if (this.options.showPoints) {
                const pointsGroup = this.createInputGroup(
                    'points',
                    'Points',
                    'number',
                    `${this.prefix}[${id}][points]`,
                    { value: 1, min: 1, max: 10 }
                );
                div.appendChild(pointsGroup);
            }
            
            return div;
        }
        
        /**
         * Create input group
         * @param {string} id
         * @param {string} label
         * @param {string} type
         * @param {string} name
         * @param {Object} attributes
         * @returns {HTMLElement}
         */
        createInputGroup(id, label, type, name, attributes = {}) {
            const group = document.createElement('div');
            group.className = 'form-group';
            group.style.marginBottom = '15px';
            
            const labelEl = document.createElement('label');
            labelEl.textContent = label;
            labelEl.htmlFor = `${id}-${Date.now()}`;
            
            const input = document.createElement('input');
            input.type = type;
            input.name = name;
            input.id = labelEl.htmlFor;
            input.className = 'form-control';
            
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'required' && value) {
                    input.required = true;
                } else if (key === 'placeholder') {
                    input.placeholder = value;
                } else {
                    input.setAttribute(key, value);
                }
            });
            
            group.appendChild(labelEl);
            group.appendChild(input);
            
            return group;
        }
        
        /**
         * Remove question
         * @param {number} id
         */
        remove(id) {
            const question = this.questions.get(id);
            if (!question) return;
            
            // Animate removal
            question.style.animation = 'slideOut 0.3s ease forwards';
            
            setTimeout(() => {
                question.remove();
                this.questions.delete(id);
                this.renumber();
                
                // Trigger event
                document.dispatchEvent(new CustomEvent('question:removed', {
                    detail: { id, type: this.options.type }
                }));
            }, 300);
        }
        
        /**
         * Renumber questions
         */
        renumber() {
            const questions = Array.from(this.container.children);
            questions.forEach((q, index) => {
                const header = q.querySelector('h4');
                if (header) {
                    header.textContent = `Question ${index + 1}`;
                }
            });
        }
        
        /**
         * Get all questions data
         * @returns {Array}
         */
        getData() {
            const data = [];
            
            this.questions.forEach((question, id) => {
                const questionData = {};
                const inputs = question.querySelectorAll('input, select');
                
                inputs.forEach(input => {
                    if (input.name) {
                        if (input.type === 'radio') {
                            if (input.checked) {
                                questionData.correct = input.value;
                            }
                        } else if (input.type === 'checkbox') {
                            questionData[input.name] = input.checked;
                        } else {
                            questionData[input.name] = input.value;
                        }
                    }
                });
                
                data.push(questionData);
            });
            
            return data;
        }
        
        /**
         * Clear all questions
         */
        clear() {
            this.container.innerHTML = '';
            this.questions.clear();
            this.count = 0;
        }
        
        /**
         * Validate all questions
         * @returns {boolean}
         */
        validate() {
            let isValid = true;
            
            this.questions.forEach(question => {
                const required = question.querySelectorAll('[required]');
                required.forEach(field => {
                    if (!field.value) {
                        field.classList.add('invalid');
                        isValid = false;
                    } else {
                        field.classList.remove('invalid');
                    }
                });
                
                // Check if correct answer selected
                const radios = question.querySelectorAll('input[type="radio"]');
                if (radios.length > 0) {
                    const checked = Array.from(radios).some(r => r.checked);
                    if (!checked) {
                        radios[0].classList.add('invalid');
                        isValid = false;
                    }
                }
            });
            
            return isValid;
        }
    }
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .question-block {
            transition: all 0.3s ease;
        }
        
        .question-block .invalid {
            border-color: #ef4444 !important;
        }
        
        .question-block .form-control {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
        }
        
        .question-block .form-control:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        
        .btn-icon {
            padding: 6px 12px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
        }
        
        .btn-danger {
            background: #fee2e2;
            color: #ef4444;
        }
        
        .btn-danger:hover {
            background: #fecaca;
        }
        
        @keyframes slideOut {
            to {
                opacity: 0;
                transform: translateX(100%);
            }
        }
    `;
    document.head.appendChild(style);
    
    // Export
    window.QuestionBuilder = QuestionBuilder;
})();
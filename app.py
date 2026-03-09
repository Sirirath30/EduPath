from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
import mysql.connector
from mysql.connector import Error
import bcrypt
import os
from datetime import datetime, timedelta
import secrets
from functools import wraps
import traceback
import uuid
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from flask_mail import Mail, Message
import re  

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here-change-in-production'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max upload
app = app

# Load environment variables from .env file
load_dotenv()

# Email configuration using environment variables
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER')
mail = Mail(app)

# Verify email configuration is loaded
print(f"Email configured for: {app.config['MAIL_USERNAME']}")

# MySQL Configuration
db_config = {
    'host': 'localhost',
    'user': '',  # Change this to your MySQL username
    'password': '',  # Change this to your MySQL password
    'database': 'edupath',
    'autocommit': True
}

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# ===== DATABASE CONNECTION HELPER =====
def get_db_connection():
    """Create and return a database connection"""
    try:
        conn = mysql.connector.connect(**db_config)
        return conn
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

# ===== DECORATORS =====
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please login first', 'warning')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'role' not in session or session['role'] not in roles:
                flash('Unauthorized access', 'error')
                return redirect(url_for('index'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# ===== HELPER FUNCTIONS =====
def get_student_stats(student_id):
    """Get statistics for student dashboard"""
    conn = get_db_connection()
    if not conn:
        return {'enrolled_courses': 0, 'avg_progress': 0, 'avg_grade': 0, 'study_hours': 0}
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get enrolled courses count
        cursor.execute("""
            SELECT COUNT(*) as count FROM enrollments 
            WHERE student_id = %s AND status = 'active'
        """, (student_id,))
        enrolled_courses = cursor.fetchone()['count']
        
        # Get average progress
        cursor.execute("""
            SELECT AVG(progress) as avg_progress FROM (
                SELECT 
                    c.id,
                    (COUNT(DISTINCT p.id) * 100.0 / NULLIF(COUNT(DISTINCT m.id), 0)) as progress
                FROM courses c
                JOIN enrollments e ON c.id = e.course_id
                LEFT JOIN materials m ON c.id = m.course_id
                LEFT JOIN progress p ON m.id = p.material_id AND p.student_id = %s AND p.completed = TRUE
                WHERE e.student_id = %s AND e.status = 'active'
                GROUP BY c.id
            ) as course_progress
        """, (student_id, student_id))
        avg_progress_row = cursor.fetchone()
        avg_progress = round(avg_progress_row['avg_progress']) if avg_progress_row and avg_progress_row['avg_progress'] else 0
        
        # Get average grade
        cursor.execute("""
            SELECT ROUND(AVG(score / max_score * 100), 1) as avg_grade
            FROM assessments
            WHERE student_id = %s
        """, (student_id,))
        avg_grade_row = cursor.fetchone()
        avg_grade = avg_grade_row['avg_grade'] if avg_grade_row and avg_grade_row['avg_grade'] else 0
        
        # Get total study time
        cursor.execute("""
            SELECT SUM(watch_time) as total_time
            FROM progress
            WHERE student_id = %s
        """, (student_id,))
        study_time_row = cursor.fetchone()
        study_time = study_time_row['total_time'] if study_time_row and study_time_row['total_time'] else 0
        study_hours = round(study_time / 3600, 1)
        
        return {
            'enrolled_courses': enrolled_courses,
            'avg_progress': avg_progress,
            'avg_grade': avg_grade,
            'study_hours': study_hours
        }
        
    except Error as e:
        print(f"Error getting student stats: {e}")
        return {'enrolled_courses': 0, 'avg_progress': 0, 'avg_grade': 0, 'study_hours': 0}
    finally:
        cursor.close()
        conn.close()

# ===== PUBLIC ROUTES =====
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')
@app.route('/rate', methods=['GET', 'POST'])
def rate():
    if request.method == 'POST':
        data = request.get_json()

        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Database connection error'}), 500

        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO feedback 
                (user_id, name, email, rating, category, message, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
            """, (
                session.get('user_id'),
                data.get('name'),
                data.get('email'),        # ✅ use email from form
                data.get('rating'),
                data.get('category'),
                data.get('feedback')      # maps to "message" column
            ))

            conn.commit()
            return jsonify({'success': True, 'message': 'Thank you for your feedback!'})

        except Error as e:
            print(f"Database error: {e}")
            return jsonify({'success': False, 'error': 'Database error'}), 500

        finally:
            cursor.close()
            conn.close()

    # ===== GET REQUEST =====
    if session.get('role') == 'admin':
        conn = get_db_connection()
        if conn:
            cursor = conn.cursor(dictionary=True)
            try:
                cursor.execute("""
                    SELECT * FROM feedback
                    ORDER BY created_at DESC
                """)
                feedback_list = cursor.fetchall()
                return render_template(
                    'rate.html',
                    feedback_list=feedback_list,
                    is_admin=True
                )
            except Error as e:
                print(f"Database error: {e}")
            finally:
                cursor.close()
                conn.close()

    return render_template('rate.html', is_admin=False)

# ===== AUTH ROUTES =====
# ===== AUTH ROUTES =====
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'

        email = request.form.get('email')
        password = request.form.get('password')
        remember_me = request.form.get('rememberMe')

        # Basic validation
        if not email or not password:
            msg = 'Please fill in all fields'
            if is_ajax:
                return jsonify({'error': msg}), 400
            flash(msg, 'error')
            return render_template('login.html')

        conn = get_db_connection()
        if not conn:
            msg = 'Database connection error'
            if is_ajax:
                return jsonify({'error': msg}), 500
            flash(msg, 'error')
            return render_template('login.html')

        cursor = conn.cursor(dictionary=True)

        try:
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()

            print("DEBUG LOGIN: fetched user:", user)

            if not user:
                msg = 'Invalid email or password'
                print("DEBUG LOGIN: user not found")
                if is_ajax:
                    return jsonify({'error': msg}), 401
                flash(msg, 'error')
                return render_template('login.html')

            # Check password
            password_matches = bcrypt.checkpw(
                password.encode('utf-8'),
                user['password_hash'].encode('utf-8')
            )
            print(f"DEBUG LOGIN: password_matches = {password_matches}")

            if password_matches:
                # Check account status (for students)
                if user['role'] == 'student':
                    if user.get('status') == 'pending':
                        msg = 'Your account is pending approval. Please wait for admin to approve your registration.'
                        if is_ajax:
                            return jsonify({'error': msg}), 403
                        flash(msg, 'warning')
                        return render_template('login.html')
                    
                    elif user.get('status') == 'rejected':
                        msg = 'Your registration has been rejected. Please contact admin for more information.'
                        if is_ajax:
                            return jsonify({'error': msg}), 403
                        flash(msg, 'error')
                        return render_template('login.html')
                    
                    # Status should be 'approved' or None (for backward compatibility)
                    # If status is None, treat as approved (existing accounts)
                
                # Successful login
                session['user_id'] = user['id']
                session['email'] = user['email']
                session['role'] = user['role']
                session['name'] = f"{user['first_name']} {user['last_name']}"

                if remember_me:
                    session.permanent = True
                    app.permanent_session_lifetime = timedelta(days=30)

                # Redirect by role
                redirect_url = url_for('index')  # default fallback

                if user['role'] == 'student':
                    redirect_url = url_for('student_dashboard')
                elif user['role'] == 'teacher':
                    redirect_url = url_for('teacher_dashboard')
                elif user['role'] == 'admin':
                    redirect_url = url_for('admin_dashboard')

                print(f"DEBUG LOGIN: redirecting to {redirect_url}")
                
                if is_ajax:
                    return jsonify({'redirect': redirect_url})

                return redirect(redirect_url)
            else:
                msg = 'Invalid email or password'
                print("DEBUG LOGIN: password mismatch")
                if is_ajax:
                    return jsonify({'error': msg}), 401
                flash(msg, 'error')

        except Exception as e:
            print("Login error:", e)
            msg = 'Server error'
            if is_ajax:
                return jsonify({'error': msg}), 500
            flash(msg, 'error')

        finally:
            cursor.close()
            conn.close()

    return render_template('login.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # Check if it's an AJAX request
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        first_name = request.form.get('firstName')
        last_name = request.form.get('lastName')
        email = request.form.get('email').strip().lower()
        password = request.form.get('password')
        grade = request.form.get('grade')
        
        # Validate input
        if not all([first_name, last_name, email, password, grade]):
            if is_ajax:
                return jsonify({'error': 'All fields are required'}), 400
            flash('All fields are required', 'error')
            return render_template('register.html')
        
        # ===== PASSWORD VALIDATION =====
        errors = []
        
        # Check password length
        if len(password) < 8:
            errors.append('Password must be at least 8 characters long')
        
        # Check for uppercase
        if not re.search(r'[A-Z]', password):
            errors.append('Password must contain at least one uppercase letter')
        
        # Check for lowercase
        if not re.search(r'[a-z]', password):
            errors.append('Password must contain at least one lowercase letter')
        
        # Check for number
        if not re.search(r'\d', password):
            errors.append('Password must contain at least one number')
        
        # Check for special character
        if not re.search(r'[@$!%*?&]', password):
            errors.append('Password must contain at least one special character (@$!%*?&)')
        
        # If there are validation errors, return them
        if errors:
            error_message = '. '.join(errors)
            if is_ajax:
                return jsonify({'error': error_message}), 400
            flash(error_message, 'error')
            return render_template('register.html', 
                                 first_name=first_name, 
                                 last_name=last_name, 
                                 email=email,
                                 grade=grade)
        
        # Hash password
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(password.encode('utf-8'), salt)
        
        conn = get_db_connection()
        if not conn:
            if is_ajax:
                return jsonify({'error': 'Database connection error'}), 500
            flash('Database connection error', 'error')
            return render_template('register.html')
        
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO users (first_name, last_name, email, password_hash, role, grade_level, status)
                VALUES (%s, %s, %s, %s, 'student', %s, 'pending')
            """, (first_name, last_name, email, password_hash.decode('utf-8'), grade))
            conn.commit()
            
            if is_ajax:
                return jsonify({
                    'success': True, 
                    'message': 'Registration successful! Please wait for admin approval.',
                    'redirect': url_for('login')
                })
            
            flash('Registration successful! Please wait for admin approval.', 'success')
            return redirect(url_for('login'))
            
        except Error as e:
            conn.rollback()
            error_msg = 'Email already exists' if '1062' in str(e) else f'Registration failed: {str(e)}'
            
            if is_ajax:
                return jsonify({'error': error_msg}), 400
            
            flash(error_msg, 'error')
        finally:
            cursor.close()
            conn.close()
    
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('Logged out successfully', 'success')
    return redirect(url_for('index'))

import secrets
from datetime import datetime, timedelta
from flask_mail import Mail, Message

# Initialize mail (add this near your other app configurations)
mail = Mail(app)
@app.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        email = request.form.get('email', '').strip().lower()
        
        # Always show same message for security
        success_message = 'If an account exists with this email, you will receive a password reset link shortly.'
        
        conn = get_db_connection()
        if not conn:
            if is_ajax:
                return jsonify({'error': 'Database connection error'}), 500
            flash('Database connection error', 'error')
            return render_template('forgot_password.html')
        
        cursor = conn.cursor(dictionary=True)
        
        try:
            # Check if user exists
            cursor.execute("SELECT id, first_name, last_name, email FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
            
            if user:
                # Delete old tokens
                cursor.execute("DELETE FROM password_reset_tokens WHERE user_id = %s AND used = FALSE", (user['id'],))
                
                # Generate new token
                token = secrets.token_urlsafe(32)
                expires_at = datetime.now() + timedelta(hours=1)
                
                cursor.execute("""
                    INSERT INTO password_reset_tokens (user_id, token, expires_at)
                    VALUES (%s, %s, %s)
                """, (user['id'], token, expires_at))
                conn.commit()
                
                # Send email
                try:
                    reset_link = url_for('reset_password', token=token, _external=True)
                    
                    msg = Message(
                        subject='Reset Your EduPath Password',
                        recipients=[user['email']],
                        html=f"""
                        <html>
                        <body>
                            <h2>Hello {user['first_name']},</h2>
                            <p>Click the link below to reset your password:</p>
                            <p><a href="{reset_link}">{reset_link}</a></p>
                        </body>
                        </html>
                        """
                    )
                    
                    mail.send(msg)
                    print(f"✅ Email sent to {user['email']}")
                    
                except Exception as e:
                    print(f"❌ Email error: {e}")
            
            if is_ajax:
                return jsonify({'success': True, 'message': success_message})
            
            flash(success_message, 'success')
            return redirect(url_for('login'))
            
        except Exception as e:
            print(f"Error: {e}")
            if is_ajax:
                return jsonify({'error': 'Server error'}), 500
            flash('An error occurred', 'error')
        finally:
            cursor.close()
            conn.close()
    
    return render_template('forgot_password.html')

def send_password_reset_email(user_email, user_name, token):
    """Send password reset email to user"""
    try:
        print(f"📧 Starting send_password_reset_email to {user_email}")
        
        # Check if mail is configured
        if not app.config.get('MAIL_USERNAME'):
            print("❌ MAIL_USERNAME not configured")
            return False
            
        reset_link = url_for('reset_password', token=token, _external=True)
        print(f"🔗 Reset link: {reset_link}")
        
        # Create message
        msg = Message(
            subject='Reset Your EduPath Password',
            recipients=[user_email],
            sender=app.config.get('MAIL_DEFAULT_SENDER', app.config.get('MAIL_USERNAME')),
            html=f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #d32f2f;">EduPath</h1>
                    </div>
                    
                    <h2>Hello {user_name},</h2>
                    
                    <p>We received a request to reset your password for your EduPath account.</p>
                    
                    <p>Click the button below to reset your password. This link will expire in <strong>1 hour</strong>.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}" 
                           style="background-color: #d32f2f; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    
                    <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
                    
                    <p>For security, this link can only be used once.</p>
                    
                    <hr style="border: 1px solid #eee; margin: 20px 0;">
                    
                    <p style="font-size: 12px; color: #777; text-align: center;">
                        This is an automated message, please do not reply to this email.<br>
                        EduPath - Empowering students through online education.
                    </p>
                </div>
            </body>
            </html>
            """
        )
        
        print(f"📧 Message created, sending via {app.config.get('MAIL_SERVER')}:{app.config.get('MAIL_PORT')}")
        
        # Send email
        mail.send(msg)
        print(f"✅ Email sent successfully via Flask-Mail")
        return True
        
    except Exception as e:
        print(f"❌ Error sending password reset email: {e}")
        import traceback
        traceback.print_exc()
        return False

# Initialize mail (add this near your other app configurations)
mail = Mail(app)
@app.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    conn = get_db_connection()
    if not conn:
        flash('Database connection error', 'error')
        return redirect(url_for('login'))
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Find valid token
        cursor.execute("""
            SELECT prt.*, u.email, u.first_name, u.last_name
            FROM password_reset_tokens prt
            JOIN users u ON prt.user_id = u.id
            WHERE prt.token = %s AND prt.used = FALSE AND prt.expires_at > NOW()
        """, (token,))
        
        reset_data = cursor.fetchone()
        
        if not reset_data:
            flash('Invalid or expired reset link. Please request a new one.', 'error')
            return redirect(url_for('forgot_password'))
        
        if request.method == 'POST':
            password = request.form.get('password')
            confirm_password = request.form.get('confirm_password')
            
            # Initialize error list
            errors = []
            
            # Check if passwords match
            if password != confirm_password:
                errors.append('Passwords do not match')
            
            # ===== STRICT PASSWORD VALIDATION (matching register page) =====
            if not password:
                errors.append('Password is required')
            else:
                # Check length
                if len(password) < 8:
                    errors.append('Password must be at least 8 characters long')
                
                # Check for uppercase
                if not re.search(r'[A-Z]', password):
                    errors.append('Password must contain at least one uppercase letter')
                
                # Check for lowercase
                if not re.search(r'[a-z]', password):
                    errors.append('Password must contain at least one lowercase letter')
                
                # Check for number
                if not re.search(r'\d', password):
                    errors.append('Password must contain at least one number')
                
                # Check for special character (matching register)
                if not re.search(r'[@$!%*?&]', password):
                    errors.append('Password must contain at least one special character (@$!%*?&)')
            
            # If there are errors, flash them and return to form
            if errors:
                for error in errors:
                    flash(error, 'error')
                return render_template('reset_password.html', token=token, email=reset_data['email'])
            
            # Hash new password
            salt = bcrypt.gensalt()
            password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
            
            # Update user password
            cursor.execute("""
                UPDATE users SET password_hash = %s WHERE id = %s
            """, (password_hash, reset_data['user_id']))
            
            # Mark token as used
            cursor.execute("""
                UPDATE password_reset_tokens SET used = TRUE WHERE id = %s
            """, (reset_data['id'],))
            
            conn.commit()
            
            flash('✅ Password reset successful! You can now login with your new password.', 'success')
            return redirect(url_for('login'))
        
        return render_template('reset_password.html', token=token, email=reset_data['email'])
        
    except Exception as e:
        print(f"Error in reset_password: {e}")
        flash('An error occurred', 'error')
        return redirect(url_for('forgot_password'))
    finally:
        cursor.close()
        conn.close()

@app.route('/student/dashboard')
@login_required
@role_required('student')

def student_dashboard():
    conn = get_db_connection()
    if not conn:
        flash('Database connection error', 'error')
        return redirect(url_for('index'))
    
    cursor = conn.cursor(dictionary=True)
    student_id = session['user_id']
    
    try:
        # Get student's grade level
        cursor.execute("SELECT grade_level FROM users WHERE id = %s", (student_id,))
        student = cursor.fetchone()
        student_grade = student['grade_level'] if student else 11
        
        # Get student stats
        stats = get_student_stats(student_id)
        
        # Get enrolled courses (only from student's grade level)
        cursor.execute("""
            SELECT 
                c.*,
                CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
                t.subject,
                COUNT(DISTINCT m.id) as total_materials,
                COUNT(DISTINCT p.id) as completed_materials
            FROM courses c
            JOIN enrollments e ON c.id = e.course_id
            LEFT JOIN teachers t ON c.teacher_id = t.id
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN materials m ON c.id = m.course_id
            LEFT JOIN progress p ON m.id = p.material_id AND p.student_id = %s AND p.completed = TRUE
            WHERE e.student_id = %s AND e.status = 'active' AND c.grade_level = %s
            GROUP BY c.id
        """, (student_id, student_id, student_grade))
        enrolled_courses = cursor.fetchall()
        
        # Calculate progress and get quiz counts for each course
        for course in enrolled_courses:
            # Calculate progress
            if course['total_materials'] > 0:
                course['progress'] = round(course['completed_materials'] / course['total_materials'] * 100, 1)
            else:
                course['progress'] = 0
            
            # Get total quizzes for this course
            cursor.execute("SELECT COUNT(*) as count FROM quizzes WHERE course_id = %s", (course['id'],))
            result = cursor.fetchone()
            course['total_quizzes'] = result['count'] if result else 0
            
            # Get completed quizzes for this course
            try:
                cursor.execute("""
                    SELECT COUNT(*) as count FROM quiz_attempts qa
                    JOIN quizzes q ON qa.quiz_id = q.id
                    WHERE q.course_id = %s AND qa.student_id = %s
                """, (course['id'], student_id))
                result = cursor.fetchone()
                course['completed_quizzes'] = result['count'] if result else 0
            except:
                course['completed_quizzes'] = 0
        
        # Get available courses (same grade level, not enrolled)
        cursor.execute("""
            SELECT 
                c.*,
                CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
                t.subject
            FROM courses c
            LEFT JOIN teachers t ON c.teacher_id = t.id
            LEFT JOIN users u ON t.user_id = u.id
            WHERE c.status = 'active' 
            AND c.grade_level = %s
            AND c.id NOT IN (
                SELECT course_id FROM enrollments WHERE student_id = %s
            )
        """, (student_grade, student_id))
        available_courses = cursor.fetchall()
        
        # Get recent grades
        cursor.execute("""
            SELECT 
                a.*, 
                c.name as course_name,
                ROUND(a.score / a.max_score * 100, 1) as percentage
            FROM assessments a
            JOIN courses c ON a.course_id = c.id
            WHERE a.student_id = %s
            ORDER BY a.date DESC 
            LIMIT 5
        """, (student_id,))
        recent_grades = cursor.fetchall()
        
        # Get upcoming quizzes
        try:
            cursor.execute("""
                SELECT 
                    q.*,
                    c.name as course_name
                FROM quizzes q
                JOIN courses c ON q.course_id = c.id
                JOIN enrollments e ON c.id = e.course_id
                WHERE e.student_id = %s 
                AND c.grade_level = %s
                AND (q.due_date >= CURDATE() OR q.due_date IS NULL)
                AND NOT EXISTS(
                    SELECT 1 FROM quiz_attempts 
                    WHERE quiz_id = q.id AND student_id = %s
                )
                ORDER BY q.due_date ASC
                LIMIT 5
            """, (student_id, student_grade, student_id))
            upcoming_quizzes = cursor.fetchall()
        except:
            upcoming_quizzes = []
            
        now = datetime.now()
        return render_template('student/dashboard.html',
                             stats=stats,
                             enrolled_courses=enrolled_courses,
                             available_courses=available_courses,
                             recent_grades=recent_grades,
                             upcoming_quizzes=upcoming_quizzes,
                             student_grade=student_grade)
    
    except Exception as e:
        print(f"Database error: {e}")
        import traceback
        traceback.print_exc()
        flash('An error occurred loading dashboard', 'error')
        return redirect(url_for('index'))
    finally:
        cursor.close()
        conn.close()

@app.route('/student/enroll/<int:course_id>')
@login_required
@role_required('student')
def enroll_course(course_id):
    conn = get_db_connection()
    if not conn:
        flash('Database connection error', 'error')
        return redirect(url_for('student_dashboard'))
    
    cursor = conn.cursor(dictionary=True)
    student_id = session['user_id']
    
    try:
        # Get student's grade level
        cursor.execute("SELECT grade_level FROM users WHERE id = %s", (student_id,))
        student = cursor.fetchone()
        
        # Get course details
        cursor.execute("SELECT grade_level FROM courses WHERE id = %s", (course_id,))
        course = cursor.fetchone()
        
        # Check if course grade matches student grade
        if course['grade_level'] != student['grade_level']:
            flash(f'This course is for Grade {course["grade_level"]} students only.', 'error')
            return redirect(url_for('student_dashboard'))
        
        # Enroll student
        cursor.execute("""
            INSERT INTO enrollments (student_id, course_id, status)
            VALUES (%s, %s, 'active')
        """, (student_id, course_id))
        conn.commit()
        flash('Successfully enrolled in course!', 'success')
        
    except Error as e:
        conn.rollback()
        if '1062' in str(e):
            flash('You are already enrolled in this course', 'warning')
        else:
            flash('Enrollment failed', 'error')
    finally:
        cursor.close()
        conn.close()
    
    return redirect(url_for('student_dashboard'))

@app.route('/student/course/<int:course_id>')
@login_required
@role_required('student')
def view_course(course_id):
    conn = get_db_connection()
    if not conn:
        flash('Database connection error', 'error')
        return redirect(url_for('student_dashboard'))
    
    cursor = conn.cursor(dictionary=True)
    student_id = session['user_id']
    
    try:
        # Verify enrollment
        cursor.execute("""
            SELECT * FROM enrollments 
            WHERE student_id = %s AND course_id = %s AND status = 'active'
        """, (student_id, course_id))
        
        if not cursor.fetchone():
            flash('You are not enrolled in this course', 'error')
            return redirect(url_for('student_dashboard'))
        
        # Get course details with teacher info
        cursor.execute("""
            SELECT 
                c.*,
                CONCAT(u.first_name, ' ', u.last_name) as teacher_name,
                u.email as teacher_email
            FROM courses c
            LEFT JOIN teachers t ON c.teacher_id = t.id
            LEFT JOIN users u ON t.user_id = u.id
            WHERE c.id = %s
        """, (course_id,))
        course = cursor.fetchone()
        
        # Get course materials with progress
        cursor.execute("""
            SELECT 
                m.*,
                CASE WHEN p.id IS NOT NULL THEN TRUE ELSE FALSE END as completed,
                p.watch_time,
                p.last_accessed
            FROM materials m
            LEFT JOIN progress p ON m.id = p.material_id AND p.student_id = %s
            WHERE m.course_id = %s
            ORDER BY m.type, m.upload_date
        """, (student_id, course_id))
        materials = cursor.fetchall()
        
        # Get video questions for materials that have them
        for material in materials:
            if material['type'] == 'video_with_quiz':
                cursor.execute("""
                    SELECT * FROM video_questions 
                    WHERE material_id = %s 
                    ORDER BY timestamp_seconds
                """, (material['id'],))
                material['questions'] = cursor.fetchall()
            else:
                material['questions'] = []
        
        # Get quizzes with attempts
        cursor.execute("""
            SELECT 
                q.*,
                qa.id as attempt_id,
                qa.score,
                qa.total_points,
                ROUND(qa.score / qa.total_points * 100, 1) as percentage,
                qa.attempt_date
            FROM quizzes q
            LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.student_id = %s
            WHERE q.course_id = %s
            ORDER BY q.due_date
        """, (student_id, course_id))
        quizzes = cursor.fetchall()
        
        # Get grades
        cursor.execute("""
            SELECT 
                *,
                ROUND(score / max_score * 100, 1) as percentage
            FROM assessments 
            WHERE student_id = %s AND course_id = %s
            ORDER BY date DESC
        """, (student_id, course_id))
        grades = cursor.fetchall()
        
        # Calculate progress
        total_materials = len(materials)
        completed_materials = sum(1 for m in materials if m['completed'])
        progress = round((completed_materials / total_materials * 100) if total_materials > 0 else 0, 1)
        
        # Calculate quiz stats - NEW
        quizzes_taken = sum(1 for q in quizzes if q.get('attempt_id'))
        total_quizzes = len(quizzes)
        
        return render_template('student/course_details.html',
                             course=course,
                             materials=materials,
                             quizzes=quizzes,
                             grades=grades,
                             progress=progress,
                             completed=completed_materials,
                             total=total_materials,
                             quizzes_taken=quizzes_taken,  # NEW
                             total_quizzes=total_quizzes)  # NEW
    
    except Error as e:
        print(f"Database error: {e}")
        flash('An error occurred loading the course', 'error')
        return redirect(url_for('student_dashboard'))
    finally:
        cursor.close()
        conn.close()

@app.route('/student/material/<int:material_id>/complete', methods=['POST'])
@login_required
@role_required('student')
def complete_material(material_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database connection error'}), 500
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get course_id for this material
        cursor.execute("SELECT course_id FROM materials WHERE id = %s", (material_id,))
        material = cursor.fetchone()
        
        if not material:
            return jsonify({'success': False, 'error': 'Material not found'}), 404
        
        # Check if already completed
        cursor.execute("""
            SELECT * FROM progress 
            WHERE student_id = %s AND material_id = %s
        """, (session['user_id'], material_id))
        
        existing = cursor.fetchone()
        
        if existing and existing.get('completed'):
            return jsonify({'success': True, 'message': 'Already completed'})
        
        # Insert or update progress - FIXED: NOW() instead of NOW
        cursor.execute("""
            INSERT INTO progress (student_id, material_id, course_id, completed, last_accessed, watch_time)
            VALUES (%s, %s, %s, TRUE, NOW(), 300)
            ON DUPLICATE KEY UPDATE 
            completed = TRUE, 
            last_accessed = NOW(),
            watch_time = watch_time + 300
        """, (session['user_id'], material_id, material['course_id']))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Material marked as complete'})
        
    except Error as e:
        conn.rollback()
        print(f"Database error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/student/watch/<int:material_id>')
@login_required
@role_required('student')
def watch_video_with_questions(material_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    # Get material info
    cursor.execute("SELECT * FROM materials WHERE id = %s", (material_id,))
    material = cursor.fetchone()
    
    # Get questions for this video
    cursor.execute("SELECT * FROM video_questions WHERE material_id = %s ORDER BY timestamp_seconds", (material_id,))
    questions = cursor.fetchall()
    
    # Get course info
    cursor.execute("SELECT * FROM courses WHERE id = %s", (material['course_id'],))
    course = cursor.fetchone()
    
    return render_template('student/watch_video.html', 
                         material=material, 
                         questions=questions,
                         course=course)
@app.route('/api/save-video-quiz-attempt', methods=['POST'])
@login_required
def save_video_quiz_attempt():
    data = request.get_json()
    student_id = session['user_id']
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # First check if this question has already been attempted by this student
        cursor.execute("""
            SELECT id FROM video_question_attempts 
            WHERE student_id = %s AND video_question_id = %s
        """, (student_id, data['question_id']))
        
        existing = cursor.fetchone()
        
        if existing:
            # Already attempted, don't save again
            return jsonify({'success': True, 'message': 'Already attempted'})
        
        # Get question details to know points and material
        cursor.execute("""
            SELECT vq.*, m.course_id, m.title as material_title, m.id as material_id
            FROM video_questions vq
            JOIN materials m ON vq.material_id = m.id
            WHERE vq.id = %s
        """, (data['question_id'],))
        
        question = cursor.fetchone()
        
        if not question:
            return jsonify({'success': False, 'error': 'Question not found'}), 404
        
        # Save to video_question_attempts
        cursor.execute("""
            INSERT INTO video_question_attempts (student_id, video_question_id, answer, is_correct)
            VALUES (%s, %s, %s, %s)
        """, (
            student_id,
            data['question_id'],
            data['answer'],
            data['is_correct']
        ))
        
        # Check if this material's quiz has been fully completed
        cursor.execute("""
            SELECT COUNT(*) as total_questions,
                   SUM(CASE WHEN vqa.is_correct = TRUE THEN 1 ELSE 0 END) as correct_answers
            FROM video_questions vq
            LEFT JOIN video_question_attempts vqa ON vq.id = vqa.video_question_id 
                AND vqa.student_id = %s
            WHERE vq.material_id = %s
        """, (student_id, question['material_id']))
        
        stats = cursor.fetchone()
        total = stats['total_questions']
        correct = stats['correct_answers'] or 0
        
        # Calculate score percentage
        score_percentage = (correct / total * 100) if total > 0 else 0
        
        # Check if there's already an assessment for this material's quiz
        cursor.execute("""
            SELECT id FROM assessments 
            WHERE student_id = %s AND course_id = %s 
            AND assessment_type LIKE %s
        """, (student_id, question['course_id'], f'Video Quiz: {question["material_title"][:30]}%'))
        
        existing_assessment = cursor.fetchone()
        
        if existing_assessment:
            # Update existing assessment
            cursor.execute("""
                UPDATE assessments 
                SET score = %s, max_score = %s, date = NOW()
                WHERE id = %s
            """, (correct, total, existing_assessment['id']))
        else:
            # Create new assessment
            cursor.execute("""
                INSERT INTO assessments (student_id, course_id, assessment_type, score, max_score, date)
                VALUES (%s, %s, %s, %s, %s, NOW())
            """, (
                student_id,
                question['course_id'],
                f'Video Quiz: {question["material_title"][:50]}',
                correct,
                total
            ))
        
        conn.commit()
        
        return jsonify({
            'success': True, 
            'message': 'Answer recorded',
            'total_questions': total,
            'correct_answers': correct,
            'score_percentage': score_percentage
        })
        
    except Exception as e:
        conn.rollback()
        print(f"Error saving quiz attempt: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
@app.route('/api/check-question-answered/<int:question_id>')
@login_required
def check_question_answered(question_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute("""
        SELECT id FROM video_question_attempts 
        WHERE student_id = %s AND video_question_id = %s
    """, (session['user_id'], question_id))
    
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    
    return jsonify({'answered': result is not None})

@app.route('/student/quiz/<int:quiz_id>', methods=['GET', 'POST'])
@login_required
@role_required('student')
def take_quiz(quiz_id):
    conn = get_db_connection()
    if not conn:
        flash('Database connection error', 'error')
        return redirect(url_for('student_dashboard'))
    
    cursor = conn.cursor(dictionary=True)
    student_id = session['user_id']
    
    try:
        # Get quiz details first
        cursor.execute("""
            SELECT q.*, c.name as course_name, c.id as course_id
            FROM quizzes q
            JOIN courses c ON q.course_id = c.id
            WHERE q.id = %s
        """, (quiz_id,))
        quiz = cursor.fetchone()
        
        if not quiz:
            flash('Quiz not found', 'error')
            return redirect(url_for('student_dashboard'))
        
        # FIRST check if questions exist
        cursor.execute("SELECT COUNT(*) as count FROM quiz_questions WHERE quiz_id = %s", (quiz_id,))
        question_count = cursor.fetchone()['count']
        
        if question_count == 0:
            flash('This quiz has no questions yet. Please contact your teacher.', 'warning')
            return redirect(url_for('view_course', course_id=quiz['course_id']))
        
        # THEN check if already attempted
        cursor.execute("""
            SELECT * FROM quiz_attempts 
            WHERE quiz_id = %s AND student_id = %s
        """, (quiz_id, student_id))
        
        if cursor.fetchone():
            flash('You have already taken this quiz', 'warning')
            return redirect(url_for('view_course', course_id=quiz['course_id']))
        
        if request.method == 'POST':
            # Calculate score
            cursor.execute("SELECT * FROM quiz_questions WHERE quiz_id = %s", (quiz_id,))
            questions = cursor.fetchall()
            
            total_points = 0
            earned_points = 0
            
            for q in questions:
                answer = request.form.get(f'q_{q["id"]}')
                total_points += q['points']
                if answer and answer == q['correct_answer']:
                    earned_points += q['points']
            
            # Save attempt
            cursor.execute("""
                INSERT INTO quiz_attempts (quiz_id, student_id, score, total_points)
                VALUES (%s, %s, %s, %s)
            """, (quiz_id, student_id, earned_points, total_points))
            
            # Save as assessment
            cursor.execute("""
                INSERT INTO assessments (student_id, course_id, assessment_type, score, max_score)
                VALUES (%s, %s, 'Quiz', %s, %s)
            """, (student_id, quiz['course_id'], earned_points, total_points))
            
            conn.commit()
            
            flash(f'Quiz completed! Score: {earned_points}/{total_points}', 'success')
            return redirect(url_for('view_course', course_id=quiz['course_id']))
        
        # GET request - show quiz questions
        cursor.execute("SELECT * FROM quiz_questions WHERE quiz_id = %s ORDER BY id", (quiz_id,))
        questions = cursor.fetchall()
        
        return render_template('student/quiz.html', quiz=quiz, questions=questions)
    
    except Exception as e:
        print(f"Database error: {e}")
        import traceback
        traceback.print_exc()
        flash('An error occurred', 'error')
        return redirect(url_for('student_dashboard'))
    finally:
        cursor.close()
        conn.close()

@app.route('/student/course/<int:course_id>')
@login_required
@role_required('student')
def view_course_lessons(course_id):
    """View course with lesson structure"""
    conn = get_db_connection()
    if not conn:
        flash('Database connection error', 'error')
        return redirect(url_for('student_dashboard'))
    
    cursor = conn.cursor(dictionary=True)
    student_id = session['user_id']
    
    try:
        # Verify enrollment
        cursor.execute("""
            SELECT * FROM enrollments 
            WHERE student_id = %s AND course_id = %s AND status = 'active'
        """, (student_id, course_id))
        
        if not cursor.fetchone():
            flash('You are not enrolled in this course', 'error')
            return redirect(url_for('student_dashboard'))
        
        # Get course details
        cursor.execute("""
            SELECT c.*, CONCAT(u.first_name, ' ', u.last_name) as teacher_name
            FROM courses c
            LEFT JOIN teachers t ON c.teacher_id = t.id
            LEFT JOIN users u ON t.user_id = u.id
            WHERE c.id = %s
        """, (course_id,))
        course = cursor.fetchone()
        
        # Get all lessons for this course
        cursor.execute("""
            SELECT * FROM lessons 
            WHERE course_id = %s 
            ORDER BY lesson_number
        """, (course_id,))
        lessons = cursor.fetchall()
        
        total_lessons = len(lessons)
        completed_lessons = 0
        
        # For each lesson, get its materials and check completion
        for lesson in lessons:
            # Check if lesson is completed
            cursor.execute("""
                SELECT COUNT(*) as completed FROM progress p
                JOIN materials m ON p.material_id = m.id
                WHERE m.lesson_id = %s AND p.student_id = %s AND p.completed = TRUE
            """, (lesson['id'], student_id))
            result = cursor.fetchone()
            lesson['completed'] = result['completed'] > 0 if result else False
            
            if lesson['completed']:
                completed_lessons += 1
            
            # Get video material for this lesson
            cursor.execute("""
                SELECT * FROM materials 
                WHERE lesson_id = %s AND type = 'video'
                LIMIT 1
            """, (lesson['id'],))
            lesson['video'] = cursor.fetchone()
            
            # Get document material for this lesson
            cursor.execute("""
                SELECT * FROM materials 
                WHERE lesson_id = %s AND type = 'document'
                LIMIT 1
            """, (lesson['id'],))
            lesson['document'] = cursor.fetchone()
            
            # Get quiz for this lesson
            cursor.execute("""
                SELECT q.*, 
                       (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id AND student_id = %s) as attempted
                FROM quizzes q
                WHERE q.lesson_id = %s AND q.is_lesson_quiz = TRUE
                LIMIT 1
            """, (student_id, lesson['id']))
            lesson['quiz'] = cursor.fetchone()
            
            # Get video questions if any
            if lesson['video'] and lesson['video']['has_quiz']:
                cursor.execute("""
                    SELECT * FROM video_questions 
                    WHERE material_id = %s
                    ORDER BY timestamp_seconds
                """, (lesson['video']['id'],))
                lesson['video']['questions'] = cursor.fetchall()
        
        progress = round((completed_lessons / total_lessons * 100) if total_lessons > 0 else 0, 1)
        
        return render_template('student/course_lessons.html',
                             course=course,
                             lessons=lessons,
                             progress=progress,
                             completed_lessons=completed_lessons,
                             total_lessons=total_lessons)
    
    except Error as e:
        print(f"Database error: {e}")
        flash('Error loading course', 'error')
        return redirect(url_for('student_dashboard'))
    finally:
        cursor.close()
        conn.close()

@app.route('/student/lesson/<int:lesson_id>/complete', methods=['POST'])
@login_required
@role_required('student')
def mark_lesson_complete(lesson_id):
    """Mark a lesson as complete"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database error'}), 500
    
    cursor = conn.cursor()
    student_id = session['user_id']
    
    try:
        # Get all materials for this lesson
        cursor.execute("SELECT id FROM materials WHERE lesson_id = %s", (lesson_id,))
        materials = cursor.fetchall()
        
        # Mark each material as complete
        for material in materials:
            cursor.execute("""
                INSERT INTO progress (student_id, material_id, course_id, completed, last_accessed)
                SELECT %s, %s, course_id, TRUE, NOW()
                FROM materials WHERE id = %s
                ON DUPLICATE KEY UPDATE completed = TRUE, last_accessed = NOW()
            """, (student_id, material[0], material[0]))
        
        conn.commit()
        return jsonify({'success': True})
    
    except Error as e:
        conn.rollback()
        print(f"Database error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/student/watch-video/<int:material_id>')
@login_required
@role_required('student')
def watch_lesson_video(material_id):
    """Watch a lesson video with possible questions"""
    conn = get_db_connection()
    if not conn:
        flash('Database connection error', 'error')
        return redirect(url_for('student_dashboard'))
    
    cursor = conn.cursor(dictionary=True)
    student_id = session['user_id']
    
    try:
        # Get material info
        cursor.execute("""
            SELECT m.*, l.course_id, l.title as lesson_title
            FROM materials m
            JOIN lessons l ON m.lesson_id = l.id
            WHERE m.id = %s
        """, (material_id,))
        material = cursor.fetchone()
        
        # Get video questions if any
        questions = []
        if material['has_quiz']:
            cursor.execute("""
                SELECT * FROM video_questions 
                WHERE material_id = %s
                ORDER BY timestamp_seconds
            """, (material_id,))
            questions = cursor.fetchall()
        
        # Get course info
        cursor.execute("SELECT * FROM courses WHERE id = %s", (material['course_id'],))
        course = cursor.fetchone()
        
        return render_template('student/watch_video.html',
                             material=material,
                             questions=questions,
                             course=course)
    
    except Error as e:
        print(f"Database error: {e}")
        flash('Error loading video', 'error')
        return redirect(url_for('student_dashboard'))
    finally:
        cursor.close()
        conn.close()

@app.route('/student/quiz/lesson/<int:lesson_id>')
@login_required
@role_required('student')
def take_lesson_quiz(lesson_id):
    """Take a quiz for a specific lesson"""
    conn = get_db_connection()
    if not conn:
        flash('Database connection error', 'error')
        return redirect(url_for('student_dashboard'))
    
    cursor = conn.cursor(dictionary=True)
    student_id = session['user_id']
    
    try:
        # Get quiz for this lesson
        cursor.execute("""
            SELECT q.*, c.name as course_name, l.course_id
            FROM quizzes q
            JOIN lessons l ON q.lesson_id = l.id
            JOIN courses c ON l.course_id = c.id
            WHERE q.lesson_id = %s AND q.is_lesson_quiz = TRUE
        """, (lesson_id,))
        quiz = cursor.fetchone()
        
        if not quiz:
            flash('Quiz not found', 'error')
            return redirect(url_for('student_dashboard'))
        
        # Check if already attempted
        cursor.execute("""
            SELECT * FROM quiz_attempts 
            WHERE quiz_id = %s AND student_id = %s
        """, (quiz['id'], student_id))
        
        if cursor.fetchone():
            flash('You have already taken this quiz', 'warning')
            return redirect(url_for('view_course_lessons', course_id=quiz['course_id']))
        
        # Get questions
        cursor.execute("SELECT * FROM quiz_questions WHERE quiz_id = %s", (quiz['id'],))
        questions = cursor.fetchall()
        
        return render_template('student/lesson_quiz.html',
                             quiz=quiz,
                             questions=questions)
    
    except Error as e:
        print(f"Database error: {e}")
        flash('Error loading quiz', 'error')
        return redirect(url_for('student_dashboard'))
    finally:
        cursor.close()
        conn.close()
# ===== TEACHER ROUTES =====
@app.route('/teacher/dashboard')
@login_required
@role_required('teacher')
def teacher_dashboard():
    conn = get_db_connection()
    if not conn:
        flash('Database connection error', 'error')
        return redirect(url_for('index'))
    
    cursor = conn.cursor(dictionary=True)
    teacher_id = session['user_id']
    
    # Get selected grade from query parameter
    selected_grade = request.args.get('grade', type=str)
    
    try:
        # Get teacher's details
        cursor.execute("""
            SELECT t.*, u.email, u.first_name, u.last_name
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            WHERE t.user_id = %s
        """, (teacher_id,))
        teacher = cursor.fetchone()
        
        if not teacher:
            flash('Teacher profile not found', 'error')
            return redirect(url_for('logout'))
        
        # Parse grade_levels
        if teacher.get('grade_levels'):
            teacher['grade_level_list'] = teacher['grade_levels'].split(',')
        else:
            teacher['grade_level_list'] = [teacher.get('grade_level', '11')]
        
        # If no grade selected or invalid, use first available grade
        if not selected_grade or selected_grade not in teacher['grade_level_list']:
            selected_grade = teacher['grade_level_list'][0]
        
        # Get ALL courses for this teacher (for dropdowns)
        cursor.execute("""
            SELECT c.*
            FROM courses c
            WHERE c.teacher_id = %s
            ORDER BY c.grade_level, c.name
        """, (teacher['id'],))
        all_courses = cursor.fetchall()
        
        # Get courses for selected grade with ALL counts including quiz_count
        cursor.execute("""
            SELECT 
                c.*,
                COUNT(DISTINCT e.id) as student_count,
                COUNT(DISTINCT m.id) as material_count,
                COUNT(DISTINCT q.id) as quiz_count,
                COUNT(DISTINCT CASE WHEN m.type = 'video' OR m.type = 'video_with_quiz' THEN m.id END) as video_count,
                COUNT(DISTINCT CASE WHEN m.type = 'document' THEN m.id END) as document_count
            FROM courses c
            LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
            LEFT JOIN materials m ON c.id = m.course_id
            LEFT JOIN quizzes q ON c.id = q.course_id
            WHERE c.teacher_id = %s AND c.grade_level = %s
            GROUP BY c.id
        """, (teacher['id'], selected_grade))
        courses = cursor.fetchall()
        
        # Get students for selected grade
        cursor.execute("""
            SELECT DISTINCT 
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.grade_level
            FROM users u
            JOIN enrollments e ON u.id = e.student_id
            JOIN courses c ON e.course_id = c.id
            WHERE c.teacher_id = %s AND c.grade_level = %s AND e.status = 'active'
            ORDER BY u.last_name
        """, (teacher['id'], selected_grade))
        students = cursor.fetchall()
        
        # Get stats for each grade
        grade_stats = {}
        for grade in teacher['grade_level_list']:
            cursor.execute("""
                SELECT 
                    COUNT(DISTINCT c.id) as course_count,
                    COUNT(DISTINCT e.id) as student_count
                FROM courses c
                LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
                WHERE c.teacher_id = %s AND c.grade_level = %s
            """, (teacher['id'], grade))
            stats = cursor.fetchone()
            grade_stats[grade] = stats or {'course_count': 0, 'student_count': 0}
        
        # Get regular quizzes for each course
        course_quizzes = {}
        for course in courses:
            cursor.execute("""
                SELECT 
                    q.*,
                    'regular' as quiz_type,
                    COUNT(DISTINCT qa.id) as attempt_count,
                    COALESCE(ROUND(AVG(qa.score / qa.total_points * 100), 1), 0) as avg_score
                FROM quizzes q
                LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id
                WHERE q.course_id = %s
                GROUP BY q.id
                ORDER BY q.id DESC
            """, (course['id'],))
            course_quizzes[course['id']] = cursor.fetchall()
        
        # Get video quizzes (interactive) for each course
        for course in courses:
            cursor.execute("""
                SELECT 
                    m.id,
                    m.title,
                    'video_quiz' as quiz_type,
                    COUNT(DISTINCT vqa.id) as attempt_count,
                    COALESCE(ROUND(AVG(CASE WHEN vqa.is_correct = TRUE THEN 1 ELSE 0 END) * 100, 1), 0) as avg_score,
                    COUNT(DISTINCT vq.id) as total_questions
                FROM materials m
                LEFT JOIN video_questions vq ON m.id = vq.material_id
                LEFT JOIN video_question_attempts vqa ON vq.id = vqa.video_question_id
                WHERE m.course_id = %s AND m.type = 'video_with_quiz' AND m.has_quiz = TRUE
                GROUP BY m.id
            """, (course['id'],))
            
            video_quizzes = cursor.fetchall()
            
            # Add video quizzes to course_quizzes
            if course['id'] not in course_quizzes:
                course_quizzes[course['id']] = []
            
            for vq in video_quizzes:
                if vq['id']:  # Only add if there's a material
                    course_quizzes[course['id']].append(vq)
        
        # Get materials for each course
        course_materials_map = {}
        for course in courses:
            cursor.execute("""
                SELECT * FROM materials 
                WHERE course_id = %s 
                ORDER BY upload_date DESC 
                LIMIT 10
            """, (course['id'],))
            course_materials_map[course['id']] = cursor.fetchall()
        
        # Get recent activity
        cursor.execute("""
            SELECT 
                u.first_name,
                u.last_name,
                c.name as course_name,
                p.last_accessed,
                m.title as material_title
            FROM progress p
            JOIN users u ON p.student_id = u.id
            JOIN courses c ON p.course_id = c.id
            JOIN materials m ON p.material_id = m.id
            WHERE c.teacher_id = %s AND c.grade_level = %s
            ORDER BY p.last_accessed DESC
            LIMIT 10
        """, (teacher['id'], selected_grade))
        recent_activity = cursor.fetchall()
        
        # Calculate totals
        total_materials = sum(c['material_count'] or 0 for c in courses)
        total_quizzes = sum(c['quiz_count'] or 0 for c in courses)
        
        return render_template('teacher/dashboard.html',
                             teacher=teacher,
                             courses=courses,
                             all_courses=all_courses,
                             students=students,
                             recent_activity=recent_activity,
                             course_quizzes=course_quizzes,
                             course_materials_map=course_materials_map,
                             total_materials=total_materials,
                             total_quizzes=total_quizzes,
                             current_grade=selected_grade,
                             grade_stats=grade_stats)
    
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        flash('Error loading dashboard', 'error')
        return redirect(url_for('index'))
    finally:
        cursor.close()
        conn.close()

@app.route('/teacher/upload', methods=['GET', 'POST'])
@login_required
@role_required('teacher')
def upload_content():
    conn = get_db_connection()
    if not conn:
        flash('Database connection error', 'error')
        return redirect(url_for('teacher_courses'))
    
    cursor = conn.cursor(dictionary=True)
    teacher_id = session['user_id']
    
    try:
        # Get teacher's courses
        cursor.execute("""
            SELECT c.* 
            FROM courses c
            JOIN teachers t ON c.teacher_id = t.id
            WHERE t.user_id = %s
        """, (teacher_id,))
        courses = cursor.fetchall()
        
        if request.method == 'POST':
            course_id = request.form.get('course_id')
            title = request.form.get('title')
            content_type = request.form.get('type')
            
            if content_type in ['video', 'document']:
                # Handle file upload
                file = request.files['file']
                if file and file.filename:
                    # Generate unique filename
                    ext = file.filename.split('.')[-1]
                    filename = f"{uuid.uuid4()}.{ext}"
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                    file.save(file_path)
                    
                    cursor.execute("""
                        INSERT INTO materials (course_id, title, type, file_path)
                        VALUES (%s, %s, %s, %s)
                    """, (course_id, title, content_type, filename))
                    
                    conn.commit()
                    flash('Content uploaded successfully!', 'success')
                    
            elif content_type == 'quiz':
                return redirect(url_for('create_quiz'))
            
            return redirect(url_for('teacher_dashboard'))
        
        return render_template('teacher/upload_content.html', courses=courses)
    
    except Error as e:
        print(f"Database error: {e}")
        flash('An error occurred', 'error')
        return redirect(url_for('teacher_dashboard'))
    finally:
        cursor.close()
        conn.close()


@app.route('/create_quiz', methods=['POST'])
@login_required
@role_required('teacher')
def create_quiz():
    conn = get_db_connection()
    if not conn:
        flash('Database connection error', 'error')
        return redirect(url_for('teacher_dashboard'))
    
    cursor = conn.cursor()
    teacher_id = session['user_id']
    
    try:
        # Get form data
        course_id = request.form.get('course_id')
        title = request.form.get('title')
        description = request.form.get('description')
        time_limit = request.form.get('time_limit')
        due_date = request.form.get('due_date')
        grade_level = request.form.get('grade_level')  # For multi-grade teachers
        
        # Insert quiz
        cursor.execute("""
            INSERT INTO quizzes (course_id, title, description, time_limit, due_date)
            VALUES (%s, %s, %s, %s, %s)
        """, (course_id, title, description, time_limit, due_date))
        
        quiz_id = cursor.lastrowid
        
        # Process questions - FIXED: Looking for correct field names
        i = 0
        questions_added = 0
        
        while True:
            question_key = f'quick_questions[{i}][question]'
            if question_key not in request.form:
                break
                
            question = request.form.get(f'quick_questions[{i}][question]')
            option_a = request.form.get(f'quick_questions[{i}][option_a]')
            option_b = request.form.get(f'quick_questions[{i}][option_b]')
            option_c = request.form.get(f'quick_questions[{i}][option_c]')
            option_d = request.form.get(f'quick_questions[{i}][option_d]')
            correct = request.form.get(f'quick_questions[{i}][correct]')
            points = request.form.get(f'quick_questions[{i}][points]', 1)
            
            if question and option_a and option_b and correct:
                cursor.execute("""
                    INSERT INTO quiz_questions 
                    (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer, points)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    quiz_id, question, option_a, option_b, 
                    option_c, option_d, correct, points
                ))
                questions_added += 1
            
            i += 1
        
        conn.commit()
        
        if questions_added > 0:
            flash(f'Quiz created successfully with {questions_added} questions!', 'success')
        else:
            flash('Quiz created but no questions were added!', 'warning')
        
        return redirect(url_for('teacher_dashboard'))
    
    except Exception as e:
        conn.rollback()
        print(f"Error creating quiz: {e}")
        import traceback
        traceback.print_exc()
        flash('Error creating quiz', 'error')
        return redirect(url_for('teacher_dashboard'))
    finally:
        cursor.close()
        conn.close()

@app.route('/teacher/grade-assessment/<int:assessment_id>', methods=['POST'])
@login_required
@role_required('teacher')
def grade_assessment(assessment_id):
    conn = get_db_connection()
    if not conn:
        flash('Database connection error', 'error')
        return redirect(url_for('teacher_dashboard'))
    
    cursor = conn.cursor()
    
    try:
        score = request.form.get('score')
        feedback = request.form.get('feedback')
        
        cursor.execute("""
            UPDATE assessments 
            SET score = %s, feedback = %s 
            WHERE id = %s
        """, (score, feedback, assessment_id))
        conn.commit()
        
        flash('Grade submitted successfully!', 'success')
        
    except Error as e:
        conn.rollback()
        print(f"Database error: {e}")
        flash('Failed to submit grade', 'error')
    finally:
        cursor.close()
        conn.close()
    
    return redirect(url_for('teacher_dashboard'))

@app.route('/teacher/upload-video-quiz', methods=['GET', 'POST'])
@login_required
@role_required('teacher')
def upload_video_quiz():
    """Upload video with timestamp-based quiz"""
    conn = get_db_connection()
    if not conn:
        flash('Database connection error', 'error')
        return redirect(url_for('teacher_dashboard'))
    
    cursor = conn.cursor(dictionary=True)
    teacher_id = session['user_id']
    
    if request.method == 'POST':
        try:
            course_id = request.form.get('course_id')  # Get course_id directly from form
            title = request.form.get('title')
            video = request.files['video']
            
            # Save video
            ext = video.filename.split('.')[-1]
            filename = f"video_quiz_{uuid.uuid4()}.{ext}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            video.save(file_path)
            
            # Insert material with type 'video_with_quiz'
            cursor.execute("""
                INSERT INTO materials (course_id, title, type, file_path, has_quiz)
                VALUES (%s, %s, 'video_with_quiz', %s, TRUE)
            """, (course_id, title, filename))
            
            material_id = cursor.lastrowid
            
            # Insert questions with timestamps
            i = 0
            while f'questions[{i}][timestamp]' in request.form:
                cursor.execute("""
                    INSERT INTO video_questions 
                    (material_id, timestamp_seconds, question, option_a, option_b, option_c, option_d, correct_answer, points)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    material_id,
                    request.form.get(f'questions[{i}][timestamp]'),
                    request.form.get(f'questions[{i}][question]'),
                    request.form.get(f'questions[{i}][option_a]'),
                    request.form.get(f'questions[{i}][option_b]'),
                    request.form.get(f'questions[{i}][option_c]'),
                    request.form.get(f'questions[{i}][option_d]'),
                    request.form.get(f'questions[{i}][correct]'),
                    request.form.get(f'questions[{i}][points]', 1)
                ))
                i += 1
            
            conn.commit()
            flash('Video with quiz uploaded successfully!', 'success')
            return redirect(url_for('teacher_dashboard'))  # Redirect to dashboard
        
        except Error as e:
            conn.rollback()
            print(f"Database error: {e}")
            flash('Error uploading video with quiz', 'error')
            return redirect(url_for('teacher_dashboard'))
    
    # GET request - show form with courses
    cursor.execute("""
        SELECT c.* 
        FROM courses c
        JOIN teachers t ON c.teacher_id = t.id
        WHERE t.user_id = %s
    """, (teacher_id,))
    courses = cursor.fetchall()
    
    return render_template('teacher/upload_video_with_quiz.html', courses=courses)
@app.route('/teacher/quiz/<int:quiz_id>/results')
@login_required
@role_required('teacher')
def view_quiz_results(quiz_id):
    conn = get_db_connection()
    if not conn:
        flash('Database connection error', 'error')
        return redirect(url_for('teacher_dashboard'))
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        print(f"Looking for quiz with ID: {quiz_id}")
        
        # First, check if this is a regular quiz
        cursor.execute("""
            SELECT q.*, c.name as course_name, c.id as course_id,
                   'regular' as quiz_type
            FROM quizzes q
            JOIN courses c ON q.course_id = c.id
            WHERE q.id = %s
        """, (quiz_id,))
        quiz = cursor.fetchone()
        
        # If not found, check if it's a video quiz (material)
        if not quiz:
            print(f"Not a regular quiz, checking video quiz with ID: {quiz_id}")
            cursor.execute("""
                SELECT 
                    m.id as quiz_id,
                    m.title,
                    m.course_id,
                    c.name as course_name,
                    'video' as quiz_type
                FROM materials m
                JOIN courses c ON m.course_id = c.id
                WHERE m.id = %s AND m.type = 'video_with_quiz'
            """, (quiz_id,))
            video_quiz = cursor.fetchone()
            
            if video_quiz:
                quiz = {
                    'id': video_quiz['quiz_id'],
                    'title': video_quiz['title'],
                    'course_id': video_quiz['course_id'],
                    'course_name': video_quiz['course_name'],
                    'quiz_type': 'video'
                }
                print(f"Found video quiz: {quiz}")
        
        if not quiz:
            print(f"No quiz found with ID: {quiz_id}")
            flash('Quiz not found', 'error')
            return redirect(url_for('teacher_dashboard'))
        
        # Initialize variables
        attempts = []
        questions = []
        
        # Get attempts based on quiz type
        if quiz['quiz_type'] == 'regular':
            print("Fetching regular quiz attempts")
            # Regular quiz attempts
            cursor.execute("""
                SELECT 
                    qa.*,
                    u.first_name,
                    u.last_name,
                    u.email,
                    COALESCE(ROUND(qa.score / qa.total_points * 100, 1), 0) as percentage
                FROM quiz_attempts qa
                JOIN users u ON qa.student_id = u.id
                WHERE qa.quiz_id = %s
                ORDER BY qa.attempt_date DESC
            """, (quiz_id,))
            attempts = cursor.fetchall()
            print(f"Found {len(attempts)} regular quiz attempts")
            
            # Get questions from quiz_questions table
            cursor.execute("""
                SELECT * FROM quiz_questions 
                WHERE quiz_id = %s 
                ORDER BY id
            """, (quiz_id,))
            questions = cursor.fetchall()
            print(f"Found {len(questions)} questions")
            
            # For regular quizzes, we need to get answers from quiz_answers table
            for question in questions:
                # Get answer distribution from quiz_answers
                cursor.execute("""
                    SELECT 
                        selected_answer as answer,
                        COUNT(*) as count
                    FROM quiz_answers
                    WHERE question_id = %s
                    GROUP BY selected_answer
                """, (question['id'],))
                answer_counts_raw = cursor.fetchall()
                
                question['answer_counts'] = {}
                for item in answer_counts_raw:
                    question['answer_counts'][item['answer']] = item['count']
                
                # Calculate correct count
                cursor.execute("""
                    SELECT COUNT(*) as correct_count
                    FROM quiz_answers
                    WHERE question_id = %s AND is_correct = TRUE
                """, (question['id'],))
                correct_result = cursor.fetchone()
                
                question['correct_count'] = correct_result['correct_count'] if correct_result else 0
                
                # Get total attempts for this question
                cursor.execute("""
                    SELECT COUNT(*) as total_attempts
                    FROM quiz_answers
                    WHERE question_id = %s
                """, (question['id'],))
                total_result = cursor.fetchone()
                
                question['total_attempts'] = total_result['total_attempts'] if total_result else 0
                
        else:  # Video quiz
            print("Fetching video quiz attempts")
            # Video quiz attempts - group by student
            cursor.execute("""
                SELECT 
                    vqa.student_id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    COUNT(*) as total_questions,
                    SUM(CASE WHEN vqa.is_correct = TRUE THEN 1 ELSE 0 END) as score,
                    ROUND(SUM(CASE WHEN vqa.is_correct = TRUE THEN 1 ELSE 0 END) / COUNT(*) * 100, 1) as percentage,
                    MAX(vqa.attempted_at) as attempt_date
                FROM video_question_attempts vqa
                JOIN users u ON vqa.student_id = u.id
                WHERE vqa.video_question_id IN (
                    SELECT id FROM video_questions WHERE material_id = %s
                )
                GROUP BY vqa.student_id, u.first_name, u.last_name, u.email
                ORDER BY attempt_date DESC
            """, (quiz_id,))
            attempts = cursor.fetchall()
            print(f"Found {len(attempts)} video quiz attempts")
            
            # For display consistency
            for attempt in attempts:
                attempt['total_points'] = attempt['total_questions']
                attempt['score'] = attempt['score'] or 0
                if 'percentage' not in attempt or attempt['percentage'] is None:
                    attempt['percentage'] = 0
            
            # Get video questions
            cursor.execute("""
                SELECT 
                    vq.*,
                    COUNT(DISTINCT vqa.id) as attempt_count,
                    SUM(CASE WHEN vqa.is_correct = TRUE THEN 1 ELSE 0 END) as correct_count
                FROM video_questions vq
                LEFT JOIN video_question_attempts vqa ON vq.id = vqa.video_question_id
                WHERE vq.material_id = %s
                GROUP BY vq.id
                ORDER BY vq.timestamp_seconds
            """, (quiz_id,))
            questions = cursor.fetchall()
            print(f"Found {len(questions)} video questions")
            
            # Get answer distribution for each question
            for question in questions:
                cursor.execute("""
                    SELECT 
                        vqa.answer,
                        COUNT(*) as count
                    FROM video_question_attempts vqa
                    WHERE vqa.video_question_id = %s
                    GROUP BY vqa.answer
                """, (question['id'],))
                answer_counts_raw = cursor.fetchall()
                
                question['answer_counts'] = {}
                for item in answer_counts_raw:
                    question['answer_counts'][item['answer']] = item['count']
                
                question['total_attempts'] = sum(question['answer_counts'].values())
        
        # Ensure all attempts have valid percentages
        total_attempts = len(attempts)
        for attempt in attempts:
            if attempt.get('percentage') is None:
                attempt['percentage'] = 0
        
        # Calculate stats safely
        if total_attempts > 0:
            valid_percentages = [a['percentage'] for a in attempts if a['percentage'] is not None]
            if valid_percentages:
                avg_score = sum(valid_percentages) / len(valid_percentages)
                pass_count = sum(1 for a in attempts if a['percentage'] is not None and a['percentage'] >= 60)
                pass_rate = (pass_count / total_attempts * 100)
                highest_score = max(valid_percentages)
                lowest_score = min(valid_percentages)
            else:
                avg_score = pass_rate = highest_score = lowest_score = 0
        else:
            avg_score = pass_rate = highest_score = lowest_score = 0
        
        # Calculate correct percentages for questions
        for question in questions:
            if question.get('total_attempts', 0) > 0:
                if 'correct_count' in question and question['correct_count']:
                    question['correct_percent'] = round((question['correct_count'] / question['total_attempts'] * 100), 1)
                else:
                    question['correct_percent'] = 0
            else:
                question['correct_percent'] = 0
        
        print(f"Rendering template with {len(attempts)} attempts and {len(questions)} questions")
        
        return render_template('teacher/quiz_results.html',
                             quiz=quiz,
                             course={'name': quiz['course_name']},
                             attempts=attempts,
                             questions=questions,
                             total_attempts=total_attempts,
                             avg_score=round(avg_score, 1),
                             pass_rate=round(pass_rate, 1),
                             highest_score=round(highest_score, 1),
                             lowest_score=round(lowest_score, 1))
    
    except Exception as e:
        print(f"ERROR in view_quiz_results: {e}")
        import traceback
        traceback.print_exc()
        flash(f'Error loading quiz results: {str(e)}', 'error')
        return redirect(url_for('teacher_dashboard'))
    finally:
        cursor.close()
        conn.close()

@app.route('/teacher/material/<int:material_id>/preview')
@login_required
@role_required('teacher')
def preview_material(material_id):
    """Allow teachers to preview materials exactly as students see them"""
    conn = get_db_connection()
    if not conn:
        flash('Database connection error', 'error')
        return redirect(url_for('teacher_dashboard'))
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get material details
        cursor.execute("""
            SELECT m.*, c.name as course_name, c.id as course_id
            FROM materials m
            JOIN courses c ON m.course_id = c.id
            WHERE m.id = %s
        """, (material_id,))
        material = cursor.fetchone()
        
        if not material:
            flash('Material not found', 'error')
            return redirect(url_for('teacher_dashboard'))
        
        # Get video questions if it's a video with quiz
        questions = []
        if material['type'] == 'video_with_quiz':
            cursor.execute("""
                SELECT * FROM video_questions 
                WHERE material_id = %s 
                ORDER BY timestamp_seconds
            """, (material_id,))
            questions = cursor.fetchall()
            material['questions'] = questions
        
        return render_template('teacher/material_preview.html',
                             material=material,
                             course={'name': material['course_name'], 'id': material['course_id']})
    
    except Exception as e:
        print(f"Error: {e}")
        flash('Error loading material', 'error')
        return redirect(url_for('teacher_dashboard'))
    finally:
        cursor.close()
        conn.close()
@app.route('/teacher/material/<int:material_id>/delete', methods=['POST'])
@login_required
@role_required('teacher')
def delete_material(material_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database connection error'}), 500
    
    cursor = conn.cursor(dictionary=True)
    teacher_id = session['user_id']
    
    try:
        # Check if material belongs to this teacher
        cursor.execute("""
            SELECT m.*, c.teacher_id 
            FROM materials m
            JOIN courses c ON m.course_id = c.id
            WHERE m.id = %s
        """, (material_id,))
        
        material = cursor.fetchone()
        
        if not material:
            return jsonify({'success': False, 'error': 'Material not found'}), 404
        
        # Check if teacher owns this course
        cursor.execute("""
            SELECT id FROM teachers WHERE user_id = %s
        """, (teacher_id,))
        teacher = cursor.fetchone()
        
        if material['teacher_id'] != teacher['id']:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        # Delete the material (cascade will handle video_questions and attempts)
        cursor.execute("DELETE FROM materials WHERE id = %s", (material_id,))
        conn.commit()
        
        return jsonify({'success': True, 'message': 'Material deleted successfully'})
         
    except Exception as e:
        conn.rollback()
        print(f"Error deleting material: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()
@app.route('/teacher/quiz/<int:quiz_id>/delete', methods=['POST'])
@login_required
@role_required('teacher')
def delete_quiz(quiz_id):
    """Delete a quiz and all associated data"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database connection error'}), 500
    
    cursor = conn.cursor(dictionary=True)
    teacher_id = session['user_id']
    
    try:
        # Verify teacher owns this quiz
        cursor.execute("""
            SELECT q.* FROM quizzes q
            JOIN courses c ON q.course_id = c.id
            JOIN teachers t ON c.teacher_id = t.id
            WHERE q.id = %s AND t.user_id = %s
        """, (quiz_id, teacher_id))
        quiz = cursor.fetchone()
        
        if not quiz:
            return jsonify({'success': False, 'error': 'Quiz not found or unauthorized'}), 404
        
        # Delete related data
        cursor.execute("DELETE FROM quiz_attempts WHERE quiz_id = %s", (quiz_id,))
        cursor.execute("DELETE FROM quiz_questions WHERE quiz_id = %s", (quiz_id,))
        cursor.execute("DELETE FROM quizzes WHERE id = %s", (quiz_id,))
        
        conn.commit()
        return jsonify({'success': True, 'message': 'Quiz deleted successfully'})
    
    except Exception as e:
        conn.rollback()
        print(f"Error deleting quiz: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/teacher/video-quiz/<int:material_id>/results')
@login_required
@role_required('teacher')
def view_video_quiz_results(material_id):
    conn = get_db_connection()
    if not conn:
        flash('Database connection error', 'error')
        return redirect(url_for('teacher_dashboard'))
    
    cursor = conn.cursor(dictionary=True)
    teacher_id = session['user_id']
    
    try:
        # Get material info and verify teacher owns it
        cursor.execute("""
            SELECT m.*, c.name as course_name, c.grade_level, c.id as course_id
            FROM materials m
            JOIN courses c ON m.course_id = c.id
            WHERE m.id = %s AND c.teacher_id = (SELECT id FROM teachers WHERE user_id = %s)
        """, (material_id, teacher_id))
        
        material = cursor.fetchone()
        
        if not material:
            flash('Video quiz not found or access denied', 'error')
            return redirect(url_for('teacher_dashboard'))
        
        # Get all questions for this video with attempt statistics
        cursor.execute("""
            SELECT 
                vq.*,
                COUNT(DISTINCT vqa.id) as attempt_count,
                SUM(CASE WHEN vqa.is_correct = TRUE THEN 1 ELSE 0 END) as correct_count
            FROM video_questions vq
            LEFT JOIN video_question_attempts vqa ON vq.id = vqa.video_question_id
            WHERE vq.material_id = %s
            GROUP BY vq.id
            ORDER BY vq.timestamp_seconds
        """, (material_id,))
        
        questions = cursor.fetchall()
        
        # Calculate percentages for each question
        for question in questions:
            if question['attempt_count'] > 0:
                question['correct_percent'] = round((question['correct_count'] / question['attempt_count'] * 100), 1)
            else:
                question['correct_percent'] = 0
            
            # Get answer distribution for this question
            cursor.execute("""
                SELECT 
                    answer,
                    COUNT(*) as count
                FROM video_question_attempts
                WHERE video_question_id = %s
                GROUP BY answer
            """, (question['id'],))
            
            answer_counts = cursor.fetchall()
            question['answer_counts'] = {row['answer']: row['count'] for row in answer_counts}
        
        # Get student performance summary
        cursor.execute("""
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.grade_level,
                COUNT(DISTINCT vqa.id) as questions_attempted,
                SUM(CASE WHEN vqa.is_correct = TRUE THEN 1 ELSE 0 END) as correct_answers,
                COUNT(DISTINCT vq.id) as total_questions
            FROM users u
            JOIN video_question_attempts vqa ON u.id = vqa.student_id
            JOIN video_questions vq ON vqa.video_question_id = vq.id
            WHERE vq.material_id = %s
            GROUP BY u.id
            ORDER BY u.last_name
        """, (material_id,))
        
        student_attempts = cursor.fetchall()
        
        # Calculate percentages for students
        for student in student_attempts:
            if student['total_questions'] > 0:
                student['percentage'] = round((student['correct_answers'] / student['total_questions'] * 100), 1)
            else:
                student['percentage'] = 0
        
        # Get overall stats
        cursor.execute("""
            SELECT 
                COUNT(DISTINCT student_id) as total_students,
                COUNT(*) as total_attempts,
                AVG(CASE WHEN is_correct = TRUE THEN 1 ELSE 0 END) * 100 as avg_score
            FROM video_question_attempts vqa
            JOIN video_questions vq ON vqa.video_question_id = vq.id
            WHERE vq.material_id = %s
        """, (material_id,))
        
        overall_stats = cursor.fetchone()
        
        return render_template('teacher/video_quiz_results.html',
                             material=material,
                             questions=questions,
                             student_attempts=student_attempts,
                             overall_stats=overall_stats)
    
    except Exception as e:
        print(f"Error viewing video quiz results: {e}")
        import traceback
        traceback.print_exc()
        flash('Error loading video quiz results', 'error')
        return redirect(url_for('teacher_dashboard'))
    finally:
        cursor.close()
        conn.close()

@app.route('/teacher/video-quiz/<int:material_id>/delete', methods=['POST'])
@login_required
@role_required('teacher')
def delete_video_quiz(material_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database connection error'}), 500
    
    cursor = conn.cursor(dictionary=True)
    teacher_id = session['user_id']
    
    try:
        # Check if material exists and belongs to this teacher
        cursor.execute("""
            SELECT m.*, c.teacher_id 
            FROM materials m
            JOIN courses c ON m.course_id = c.id
            WHERE m.id = %s
        """, (material_id,))
        
        material = cursor.fetchone()
        
        if not material:
            return jsonify({'success': False, 'error': 'Video quiz not found'}), 404
        
        # Check if teacher owns this course
        cursor.execute("""
            SELECT id FROM teachers WHERE user_id = %s
        """, (teacher_id,))
        teacher = cursor.fetchone()
        
        if material['teacher_id'] != teacher['id']:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        # Delete video questions first (cascade should handle this, but let's be safe)
        cursor.execute("DELETE FROM video_questions WHERE material_id = %s", (material_id,))
        
        # Delete the material
        cursor.execute("DELETE FROM materials WHERE id = %s", (material_id,))
        conn.commit()
        
        return jsonify({'success': True, 'message': 'Video quiz deleted successfully'})
        
    except Exception as e:
        conn.rollback()
        print(f"Error deleting video quiz: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ===== ADMIN ROUTES =====
from datetime import datetime
import mysql.connector
from mysql.connector import Error

@app.route('/admin/dashboard')
@login_required
@role_required('admin')
def admin_dashboard():
    conn = get_db_connection()
    if not conn:
        flash('Database connection error', 'error')
        return redirect(url_for('index'))
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get stats (your existing code)
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE role='student' AND status='pending'")
        pending_approvals = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE role='student' AND status='approved'")
        total_students = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM users WHERE role='teacher'")
        total_teachers = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM courses")
        total_courses = cursor.fetchone()['count']
        
        # Get feedback count
        cursor.execute("SELECT COUNT(*) as count FROM feedback")
        feedback_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM enrollments WHERE status='active'")
        active_enrollments = cursor.fetchone()['count']
        
        # Get recent registrations
        cursor.execute("""
            SELECT first_name, last_name, email, grade_level, created_at
            FROM users
            WHERE role='student' AND status='pending'
            ORDER BY created_at DESC
            LIMIT 5
        """)
        recent_registrations = cursor.fetchall()
        
        # Get recent feedback
        cursor.execute("""
            SELECT f.*, u.first_name, u.last_name, u.email 
            FROM feedback f
            LEFT JOIN users u ON f.user_id = u.id
            ORDER BY f.created_at DESC
            LIMIT 5
        """)
        recent_feedback = cursor.fetchall()
        
        # NEW: Get all teachers with their details
        cursor.execute("""
            SELECT 
                t.id as teacher_id,
                u.id as user_id,
                u.first_name,
                u.last_name,
                u.email,
                t.subject,
                t.grade_levels,
                t.qualification,
                t.specialization
            FROM users u
            JOIN teachers t ON u.id = t.user_id
            WHERE u.role = 'teacher'
            ORDER BY u.last_name
        """)
        teachers = cursor.fetchall()


        # Get ALL students (approved, rejected, AND pending)
        cursor.execute("""
            SELECT 
                u.id as student_id,
                u.first_name,
                u.last_name,
                u.email,
                u.grade_level,
                u.status,
                u.created_at
            FROM users u
            WHERE u.role = 'student'
            ORDER BY u.created_at DESC
        """)
        students = cursor.fetchall()
        
        # Add current datetime for the template
        now = datetime.now()
        
        return render_template('admin/dashboard.html',
                             pending_approvals=pending_approvals,
                             total_students=total_students,
                             total_teachers=total_teachers,
                             total_courses=total_courses,
                             feedback_count=feedback_count,
                             active_enrollments=active_enrollments,
                             recent_registrations=recent_registrations,
                             recent_feedback=recent_feedback,
                             teachers=teachers,
                             students=students,
                             
                             now=now)
    
    except Error as e:
        print(f"Database error: {e}")
        flash('An error occurred loading dashboard', 'error')
        return redirect(url_for('index'))
    finally:
        cursor.close()
        conn.close()

@app.route('/admin/teacher/<int:teacher_id>/send-access', methods=['POST'])
@login_required
@role_required('admin')
def send_teacher_access(teacher_id):
    """Send access email to existing teacher with both login and reset options"""
    conn = get_db_connection()
    if not conn:
        return jsonify({'success': False, 'error': 'Database connection error'}), 500
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get teacher details
        cursor.execute("""
            SELECT u.id as user_id, u.first_name, u.last_name, u.email, u.password_hash,
                   t.subject, t.grade_levels
            FROM users u
            JOIN teachers t ON u.id = t.user_id
            WHERE t.id = %s
        """, (teacher_id,))
        
        teacher = cursor.fetchone()
        
        if not teacher:
            return jsonify({'success': False, 'error': 'Teacher not found'}), 404
        
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(hours=24)
        
        # Delete old tokens
        cursor.execute("DELETE FROM password_reset_tokens WHERE user_id = %s AND used = FALSE", (teacher['user_id'],))
        
        # Insert new token
        cursor.execute("""
            INSERT INTO password_reset_tokens (user_id, token, expires_at)
            VALUES (%s, %s, %s)
        """, (teacher['user_id'], reset_token, expires_at))
        conn.commit()
        
        # Create links
        login_link = url_for('login', _external=True)
        reset_link = url_for('reset_password', token=reset_token, _external=True)
        teacher_name = f"{teacher['first_name']} {teacher['last_name']}"
        
        # Send email with BOTH buttons
        msg = Message(
            subject='Access Your EduPath Teacher Account',
            recipients=[teacher['email']],
            sender=app.config.get('MAIL_DEFAULT_SENDER', app.config.get('MAIL_USERNAME')),
            html=f"""
            <html>
            <head>
                <style>
                    .button {{
                        display: inline-block;
                        padding: 12px 24px;
                        margin: 10px;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                    }}
                    .login-btn {{
                        background-color: #d32f2f;
                        color: white;
                    }}
                    .reset-btn {{
                        background-color: #3b82f6;
                        color: white;
                    }}
                </style>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #d32f2f;">EduPath Teacher Access</h1>
                    </div>
                    
                    <h2>Hello {teacher_name},</h2>
                    
                    <p>Here's your access information for your EduPath teacher account.</p>
                    
                    <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #d32f2f;">📋 Account Details</h3>
                        <table style="width: 100%;">
                            <tr>
                                <td><strong>Email:</strong></td>
                                <td>{teacher['email']}</td>
                            </tr>
                            <tr>
                                <td><strong>Subject:</strong></td>
                                <td>{teacher['subject']}</td>
                            </tr>
                            <tr>
                                <td><strong>Grades:</strong></td>
                                <td>{teacher['grade_levels']}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <h3>🔑 Choose Your Action:</h3>
                        
                        <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin-top: 20px;">
                            <!-- Login Button -->
                            <a href="{login_link}" 
                               class="button login-btn"
                               style="background-color: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                <i class="bi bi-box-arrow-in-right"></i> Login
                            </a>
                            
                            <!-- Reset Password Button -->
                            <a href="{reset_link}" 
                               class="button reset-btn"
                               style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                <i class="bi bi-shield-lock"></i> Reset Password
                            </a>
                        </div>
                    </div>
                    
                    <p style="color: #666; font-size: 0.9rem; text-align: center;">
                        The reset link will expire in 24 hours.
                    </p>
                    
                    <hr style="border: 1px solid #eee; margin: 20px 0;">
                    
                    <div style="font-size: 12px; color: #777; text-align: center;">
                        <p>If you didn't request this, please ignore this email.</p>
                        <p>© 2026 EduPath. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """
        )
        
        mail.send(msg)
        
        return jsonify({'success': True, 'message': f'Access email sent to {teacher["email"]}'})
        
    except Exception as e:
        print(f"Error sending email: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/admin/approvals')
@login_required
@role_required('admin')
def admin_approvals():
    conn = get_db_connection()
    if not conn:
        flash('Database connection error', 'error')
        return redirect(url_for('admin_dashboard'))
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT * FROM users 
            WHERE role='student' AND status='pending'
            ORDER BY created_at DESC
        """)
        pending_users = cursor.fetchall()
        
        return render_template('admin/approvals.html', pending_users=pending_users)
    
    except Error as e:
        print(f"Database error: {e}")
        flash('An error occurred', 'error')
        return redirect(url_for('admin_dashboard'))
    finally:
        cursor.close()
        conn.close()

@app.route('/admin/approve/<int:user_id>')
@login_required
@role_required('admin')
def approve_user(user_id):
    conn = get_db_connection()
    if not conn:
        flash('Database connection error', 'error')
        return redirect(url_for('admin_approvals'))
    
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get user details before approving
        cursor.execute("SELECT first_name, last_name, email FROM users WHERE id=%s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            flash('User not found', 'error')
            return redirect(url_for('admin_approvals'))
        
        # Update user status
        cursor.execute("UPDATE users SET status='approved' WHERE id=%s", (user_id,))
        
        # Log action
        cursor.execute("""
            INSERT INTO admin_logs (admin_id, action, target_type, target_id)
            VALUES (%s, 'Approved student registration', 'user', %s)
        """, (session['user_id'], user_id))
        
        conn.commit()
        
        # Send approval email
        user_full_name = f"{user['first_name']} {user['last_name']}"
        email_sent, email_error = send_approval_email(user['email'], user_full_name)
        
        if email_sent:
            flash(f'✅ Student approved successfully. Notification email sent to {user["email"]}', 'success')
        else:
            flash(f'⚠️ Student approved but email notification failed: {email_error}', 'warning')
        
    except Exception as e:
        conn.rollback()
        print(f"Database error: {e}")
        flash('❌ Approval failed', 'error')
    finally:
        cursor.close()
        conn.close()
    
    return redirect(url_for('admin_approvals'))
@app.route('/admin/reject/<int:user_id>')
@login_required
@role_required('admin')
def reject_user(user_id):
    conn = get_db_connection()
    if not conn:
        flash('Database connection error', 'error')
        return redirect(url_for('admin_approvals'))
    
    cursor = conn.cursor()
    
    try:
        cursor.execute("UPDATE users SET status='rejected' WHERE id=%s", (user_id,))
        conn.commit()
        flash('Student rejected', 'warning')
        
    except Error as e:
        conn.rollback()
        print(f"Database error: {e}")
        flash('Failed to reject student', 'error')
    finally:
        cursor.close()
        conn.close()
    
    return redirect(url_for('admin_approvals'))

@app.route('/admin/feedback')
@login_required
@role_required('admin')
def admin_feedback():
    conn = get_db_connection()
    if not conn:
        flash('Database connection error', 'error')
        return redirect(url_for('admin_dashboard'))

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT *
            FROM feedback
            ORDER BY created_at DESC
        """)
        feedback_list = cursor.fetchall()

        return render_template('admin/feedback.html', feedback_list=feedback_list)

    except Error as e:
        print(f"Database error: {e}")
        flash('An error occurred', 'error')
        return redirect(url_for('admin_dashboard'))
    finally:
        cursor.close()
        conn.close()

@app.route('/admin/create-teacher', methods=['GET', 'POST'])
@login_required
@role_required('admin')
def create_teacher():
    if request.method == 'POST':
        # Get form data
        first_name = request.form.get('first_name')
        last_name = request.form.get('last_name')
        email = request.form.get('email')
        password = request.form.get('password')
        grades = request.form.getlist('grades')
        subject = request.form.get('subject')
        qualification = request.form.get('qualification')
        specialization = request.form.get('specialization')
        
        # Check if send_reset checkbox is checked (default to False)
        send_reset = request.form.get('send_reset') == 'on'
        
        print(f"Send reset checkbox: {send_reset}")  # Debug line
        
        # Validate at least one grade is selected
        if not grades:
            flash('Please select at least one grade level', 'error')
            return redirect(url_for('create_teacher'))
        
        # Validate subject
        valid_subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology']
        if subject not in valid_subjects:
            flash('Invalid subject selection', 'error')
            return redirect(url_for('create_teacher'))
        
        # Simple password validation
        if len(password) < 6:
            flash('Password must be at least 6 characters long', 'error')
            return render_template('admin/create_teacher.html',
                                 first_name=first_name,
                                 last_name=last_name,
                                 email=email,
                                 selected_grades=grades,
                                 subject=subject,
                                 qualification=qualification,
                                 specialization=specialization)
        
        # Hash password
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
        conn = get_db_connection()
        if not conn:
            flash('Database connection error', 'error')
            return redirect(url_for('admin_dashboard'))
        
        cursor = conn.cursor()
        try:
            # Insert into users table
            cursor.execute("""
                INSERT INTO users (first_name, last_name, email, password_hash, role, status)
                VALUES (%s, %s, %s, %s, 'teacher', 'approved')
            """, (first_name, last_name, email, password_hash))
            user_id = cursor.lastrowid

            # Convert grades list to comma-separated string
            grade_levels = ','.join(grades)
            
            # Insert into teachers table
            cursor.execute("""
                INSERT INTO teachers (user_id, qualification, specialization, grade_levels, subject)
                VALUES (%s, %s, %s, %s, %s)
            """, (user_id, qualification, specialization, grade_levels, subject))
            teacher_id = cursor.lastrowid

            # Create a course for EACH selected grade
            for grade in grades:
                course_code = f"{subject[:3].upper()}{grade}{teacher_id}"
                course_name = f"{subject} - Grade {grade}"
                course_desc = f"{subject} course for Grade {grade} students"
                
                cursor.execute("""
                    INSERT INTO courses (name, code, description, teacher_id, grade_level, status)
                    VALUES (%s, %s, %s, %s, %s, 'active')
                """, (course_name, course_code, course_desc, teacher_id, grade))
            
            conn.commit()
            
            grade_display = ' & '.join(grades)
            teacher_name = f"{first_name} {last_name}"
            
            # Generate reset token (only needed if sending email)
            reset_token = None
            if send_reset:
                reset_token = secrets.token_urlsafe(32)
                expires_at = datetime.now() + timedelta(hours=24)
                
                # Insert reset token
                cursor.execute("""
                    INSERT INTO password_reset_tokens (user_id, token, expires_at)
                    VALUES (%s, %s, %s)
                """, (user_id, reset_token, expires_at))
                conn.commit()
            
            # Prepare success message
            success_message = f'✅ Teacher account created successfully! Courses created for Grade {grade_display}.'
            
            # Send email ONLY if checkbox is checked
            if send_reset:
                # Create links
                login_link = url_for('login', _external=True)
                reset_link = url_for('reset_password', token=reset_token, _external=True)
                
                msg = Message(
                    subject='Welcome to EduPath - Your Teacher Account',
                    recipients=[email],
                    sender=app.config.get('MAIL_DEFAULT_SENDER', app.config.get('MAIL_USERNAME')),
                    html=f"""
                    <html>
                    <head>
                        <style>
                            .button {{
                                display: inline-block;
                                padding: 12px 24px;
                                margin: 10px;
                                text-decoration: none;
                                border-radius: 5px;
                                font-weight: bold;
                            }}
                            .login-btn {{
                                background-color: #d32f2f;
                                color: white;
                            }}
                            .reset-btn {{
                                background-color: #3b82f6;
                                color: white;
                            }}
                            .password-box {{
                                background: #f5f5f5;
                                padding: 15px;
                                border-radius: 5px;
                                margin: 20px 0;
                                font-family: monospace;
                                font-size: 1.1rem;
                                border: 1px solid #ddd;
                            }}
                        </style>
                    </head>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <h1 style="color: #d32f2f;">Welcome to EduPath!</h1>
                            </div>
                            
                            <h2>Hello {teacher_name},</h2>
                            
                            <p>Your teacher account has been created. You can now access the EduPath platform.</p>
                            
                            <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
                                <h3 style="margin-top: 0; color: #d32f2f;">📋 Account Details</h3>
                                <table style="width: 100%;">
                                    <tr>
                                        <td><strong>Email:</strong></td>
                                        <td>{email}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Temporary Password:</strong></td>
                                        <td><span style="background: #fff; padding: 5px 10px; border: 1px solid #ddd; border-radius: 3px; font-family: monospace;">{password}</span></td>
                                    </tr>
                                    <tr>
                                        <td><strong>Subject:</strong></td>
                                        <td>{subject}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Grades:</strong></td>
                                        <td>{grade_display}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <h3>🔑 Choose Your Action:</h3>
                                
                                <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin-top: 20px;">
                                    <!-- Login Button -->
                                    <a href="{login_link}" 
                                       class="button login-btn"
                                       style="background-color: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                        <i class="bi bi-box-arrow-in-right"></i> Login Now
                                    </a>
                                    
                                    <!-- Reset Password Button -->
                                    <a href="{reset_link}" 
                                       class="button reset-btn"
                                       style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                        <i class="bi bi-shield-lock"></i> Set New Password
                                    </a>
                                </div>
                            </div>
                            
                            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p style="margin: 0; color: #666;">
                                    <strong>💡 Tip:</strong> Click "Set New Password" to create your own secure password.
                                </p>
                            </div>
                            
                            <hr style="border: 1px solid #eee; margin: 20px 0;">
                            
                            <div style="font-size: 12px; color: #777; text-align: center;">
                                <p>This email contains sensitive information. If you didn't expect this, please contact your administrator.</p>
                                <p>© 2026 EduPath. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                    """
                )
                
                try:
                    mail.send(msg)
                    success_message += f' Welcome email sent to {email}.'
                except Exception as e:
                    print(f"Error sending email: {e}")
                    success_message += f' Warning: Could not send email.'
            else:
                # No email sent - just show success message
                success_message += f' No email sent (checkbox unchecked).'
            
            flash(success_message, 'success')
            return redirect(url_for('admin_dashboard'))
        
        except Exception as e:
            conn.rollback()
            if '1062' in str(e):
                flash('❌ Email already exists', 'error')
            else:
                flash(f'❌ Teacher creation failed: {str(e)}', 'error')
            print(f"Database error: {e}")
        
        finally:
            cursor.close()
            conn.close()
    
    return render_template('admin/create_teacher.html')

def send_approval_email(user_email, user_name):
    """Send approval email with fresh connection each time"""
    try:
        # Get credentials
        username = app.config['MAIL_USERNAME']
        password = ''.join(app.config['MAIL_PASSWORD'].split())
        
        print(f"📧 Sending email to {user_email}")
        
        # Create FRESH connection
        with smtplib.SMTP(app.config['MAIL_SERVER'], app.config['MAIL_PORT'], timeout=30) as server:
            server.starttls()
            server.login(username, password)
            
            # Generate login URL safely
            try:
                with app.app_context():
                    login_url = url_for('login', _external=True)
            except:
                login_url = "https://yourapp.com/login"  # Fallback
            
            # Create message
            msg = MIMEMultipart()
            msg['From'] = username
            msg['To'] = user_email
            msg['Subject'] = 'Your EduPath Account Has Been Approved!'
            
            body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #d32f2f;">Welcome to EduPath, {user_name}!</h2>
                    
                    <p>Great news! Your registration has been approved.</p>
                    
                    <p>You can now log in to your account and start your learning journey.</p>
                    
                    <p style="margin: 30px 0;">
                        <a href="{login_url}" 
                           style="background-color: #d32f2f; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Login to Your Account
                        </a>
                    </p>
                    
                    <p>If you have any questions, contact our support team.</p>
                    
                    <p>Happy Learning!<br>The EduPath Team</p>
                </div>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html'))
            
            # Send email
            server.send_message(msg)
        
        print(f"✓ Email sent successfully to {user_email}")
        return True, "Email sent successfully"
        
    except smtplib.SMTPAuthenticationError:
        print("✗ Authentication failed")
        return False, "SMTP Authentication failed"
    except smtplib.SMTPException as e:
        print(f"✗ SMTP error: {e}")
        return False, f"SMTP error: {e}"
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False, str(e)


if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Starting EduPath Application")
    print("="*60)
    print(f"Debug mode: {app.debug}")
    print(f"Secret key: {'Set' if app.config['SECRET_KEY'] else 'Not set'}")
    print("="*60)
    print("\n📌 Registered Routes:")
    for rule in app.url_map.iter_rules():
        if rule.endpoint != 'static':
            print(f"   ✓ {rule.rule:30} -> {rule.endpoint}")
    print("\n" + "="*60)
    print("✅ Server running at http://127.0.0.1:5000")
    print("="*60 + "\n")
    
    app.run(debug=True, host='127.0.0.1', port=5000)
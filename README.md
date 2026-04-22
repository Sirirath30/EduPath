# EduPath E-Learning System

EduPath is a Flask-based e-learning platform designed to manage online education through a role-based system. The platform supports three user roles: Admin, Teacher, and Student, each with distinct permissions and functionalities.

---

# Table of Contents
- [Overview](#overview)
- [Requirements](#requirements)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Email Configuration](#email-configuration)
- [Running the Application](#running-the-application)
- [Demo Accounts](#demo-accounts)
- [Features](#features)
- [System Workflow](#system-workflow)
- [Project Structure](#project-structure)
- [Security Notes](#security-notes)

---

# Overview

EduPath provides a complete learning management system that allows administrators to manage users, teachers to create and manage course content, and students to access educational materials and assessments.

---

# Requirements

- Python 3.x  
- MySQL Server  
- pip (Python package manager)  

Install dependencies:

```bash
pip install -r requirements.txt

#Installation

Clone the repository:

git Clone https://github.com/Sirirath30/EduPath.git
cd edupath

#Database Setup
1. Create Database
CREATE DATABASE edupath;
2. Configure Database Connection

Update app.py:

db_config = {
    'host': 'localhost',
    'user': 'Your MySQL username',
    'password': 'Your MySQL password',
    'database': 'edupath',
    'autocommit': True
}
3. Import Database
mysql -u root -p edupath < edupath.sql

#Email Configuration

Create a .env file:

MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=edupath2k26@gmail.com
MAIL_PASSWORD=jupk obcmsqesnskd
MAIL_DEFAULT_SENDER=edupath2k26@gmail.com
Notes
Use a Gmail App Password instead of your actual password
Required for email verification and notifications

#Running the Application

Start the server:

python app.py

Open in browser:

http://localhost:5000

#Demo Accounts
Admin
Email: edupath2k26@gmail.com
Password: edupath123

#Teacher Accounts

Grade 12 and 11

Email: sirirath888@gmail.com
Password: @Sirirath123

#Student Accounts

For student account you can register on the website using your own email address and explore. Here are some student account as a example below.


Email: kim@gmail.com
Password: 12345678

Email: samith.sirirath888@gmail.com
Password: @Roth123

#Features

Admin
Manage teachers and students
Approve or reject student registrations
View system statistics
Monitor feedback
Create teacher accounts

Teacher
Upload course materials
Create quizzes (standard and interactive)
Manage lessons
Monitor student performance
View quiz results

Student
Register and login
Enroll in courses
Access learning materials
Take quizzes
Track progress and results

#System Workflow
Admin
Login as admin
Create teacher accounts
Approve or reject students
Monitor system activity
Teacher
Login as teacher
Manage courses
Upload materials and quizzes
Monitor student performance
Student
Register account
Wait for approval
Login
Enroll in courses
Study and complete quizzes

#Project Structure
project/
│── app.py
│── requirements.txt
│── edupath.sql
│── .env
│
├── templates/
├── static/
│   ├── css/
│   ├── js/
│   └── uploads/


"""
WSGI Configuration File for PythonAnywhere

This file should be copied to the WSGI configuration file in PythonAnywhere
"""

import sys
import os

# Force joblib to use threading instead of multiprocessing
# This prevents uwsgi conflicts in PythonAnywhere
os.environ['JOBLIB_MULTIPROCESSING'] = '0'
os.environ['LOKY_MAX_CPU_COUNT'] = '1'

# Add project directory to Python path
# IMPORTANT: Replace 'asd' with your actual project folder name if different
project_home = '/home/ITESVUIS/asd'

if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Add virtual environment site-packages to Python path
# IMPORTANT: Check your Python version in PythonAnywhere and update accordingly
# For Python 3.10
venv_path = '/home/ITESVUIS/asd/venv/lib/python3.10/site-packages'

# For Python 3.9 (uncomment if you're using Python 3.9)
# venv_path = '/home/ITESVUIS/asd/venv/lib/python3.9/site-packages'

# For Python 3.11 (uncomment if you're using Python 3.11)
# venv_path = '/home/ITESVUIS/asd/venv/lib/python3.11/site-packages'

# For Python 3.12 (uncomment if you're using Python 3.12)
# venv_path = '/home/ITESVUIS/asd/venv/lib/python3.12/site-packages'

if os.path.exists(venv_path) and venv_path not in sys.path:
    sys.path.insert(0, venv_path)

# Change working directory to project directory
os.chdir(project_home)

# Import Flask application
from app import app as application

# Create uploads directory if it doesn't exist
uploads_dir = os.path.join(project_home, 'uploads')
os.makedirs(uploads_dir, exist_ok=True)


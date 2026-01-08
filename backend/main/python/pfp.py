'''
++-------------------------------++
||| ======== SERVER 6001 ======== ||
++-------------------------------++

Flask server for profile picture upload and retrieval
API Endpoints:
- GET /api/profile-picture/:userId - Get profile picture by user ID
- POST /api/profile-picture/:userId - Upload/update profile picture
'''

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import sqlite3
import os
import sys
from pathlib import Path
from io import BytesIO
from PIL import Image
import base64
import mysql.connector
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

PORT = 6001  # Changed from 6000 to avoid ERR_UNSAFE_PORT browser restriction

# Get the project root directory (assuming this file is in backend/main/python/)
project_root = Path(__file__).parent.parent.parent.parent
sqlite_db_path = project_root / 'sqlite' / 'data' / 'mydb.sqlite'

# Ensure the database directory exists
sqlite_db_path.parent.mkdir(parents=True, exist_ok=True)

# Initialize AVATARS table if it doesn't exist
def init_database():
    try:
        conn = sqlite3.connect(str(sqlite_db_path))
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS AVATARS (
                USER_ID             INTEGER         NOT NULL PRIMARY KEY,
                AVATAR_IMAGE        BLOB            NOT NULL,
                AVATAR_UPLOAD_DATE  DATETIME        DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        conn.close()
        print(f"[INIT] ✓ AVATARS table initialized in {sqlite_db_path}")
    except Exception as e:
        print(f"[INIT] ✗ Error initializing database: {e}")

# Initialize on startup
init_database()

def get_db_connection():
    """Get SQLite database connection"""
    conn = sqlite3.connect(str(sqlite_db_path))
    conn.row_factory = sqlite3.Row
    return conn

def validate_image(file):
    """Validate uploaded image file"""
    try:
        # Check file extension
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
        if not file.filename or '.' not in file.filename:
            return False, "Invalid file format"
        
        ext = file.filename.rsplit('.', 1)[1].lower()
        if ext not in allowed_extensions:
            return False, f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
        
        # Check file size (max 5MB)
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > 5 * 1024 * 1024:  # 5MB
            return False, "File size exceeds 5MB limit"
        
        # Validate image by trying to open it
        try:
            img = Image.open(file)
            img.verify()
            file.seek(0)  # Reset file pointer
            return True, None
        except Exception as e:
            return False, f"Invalid image file: {str(e)}"
            
    except Exception as e:
        return False, f"Error validating image: {str(e)}"

def process_image(file):
    """Process and optimize image"""
    try:
        img = Image.open(file)
        
        # Convert to RGB if necessary (for JPEG compatibility)
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize if too large (max 500x500)
        max_size = (500, 500)
        if img.size[0] > max_size[0] or img.size[1] > max_size[1]:
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save to bytes
        output = BytesIO()
        img.save(output, format='JPEG', quality=85, optimize=True)
        output.seek(0)
        
        return output.read()
    except Exception as e:
        raise Exception(f"Error processing image: {str(e)}")

# GET /api/profile-picture/:userId - Get profile picture
@app.route('/api/profile-picture/<int:userId>', methods=['GET'])
def get_profile_picture(userId):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT AVATAR_IMAGE FROM AVATARS WHERE USER_ID = ?', (userId,))
        row = cursor.fetchone()
        conn.close()
        
        if row and row['AVATAR_IMAGE']:
            # Return image as JPEG
            return send_file(
                BytesIO(row['AVATAR_IMAGE']),
                mimetype='image/jpeg',
                as_attachment=False
            )
        else:
            # Return 404 if no profile picture exists
            return jsonify({'success': False, 'message': 'Profile picture not found'}), 404
            
    except Exception as e:
        print(f"[ERROR] Error fetching profile picture: {e}")
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500

# POST /api/profile-picture/:userId - Upload/update profile picture
@app.route('/api/profile-picture/<int:userId>', methods=['POST'])
def upload_profile_picture(userId):
    try:
        # Check if file is in request
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No file selected'}), 400
        
        # Validate image
        is_valid, error_msg = validate_image(file)
        if not is_valid:
            return jsonify({'success': False, 'message': error_msg}), 400
        
        # Process and optimize image
        try:
            image_data = process_image(file)
        except Exception as e:
            return jsonify({'success': False, 'message': str(e)}), 400
        
        # Save to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if profile picture already exists
        cursor.execute('SELECT USER_ID FROM AVATARS WHERE USER_ID = ?', (userId,))
        exists = cursor.fetchone()
        
        if exists:
            # Update existing
            cursor.execute(
                'UPDATE AVATARS SET AVATAR_IMAGE = ?, AVATAR_UPLOAD_DATE = CURRENT_TIMESTAMP WHERE USER_ID = ?',
                (image_data, userId)
            )
            print(f"[UPLOAD] Updated profile picture for user {userId}")
        else:
            # Insert new
            cursor.execute(
                'INSERT INTO AVATARS (USER_ID, AVATAR_IMAGE) VALUES (?, ?)',
                (userId, image_data)
            )
            print(f"[UPLOAD] Created profile picture for user {userId}")
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Profile picture uploaded successfully'
        }), 200
        
    except Exception as e:
        print(f"[ERROR] Error uploading profile picture: {e}")
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500

# GET /api/user-id - Get userId from username and companyId
@app.route('/api/user-id', methods=['GET'])
def get_user_id():
    try:
        username = request.args.get('username')
        company_id = request.args.get('companyId')
        
        if not username or not company_id:
            return jsonify({'success': False, 'message': 'Missing username or companyId'}), 400
        
        # Connect to MySQL to get userId
        mysql_config = {
            'host': os.getenv('MYSQL_HOST', 'localhost'),
            'port': int(os.getenv('MYSQL_PORT', 3307)),
            'user': os.getenv('MYSQL_USER'),
            'password': os.getenv('MYSQL_PASSWORD'),
            'database': os.getenv('MYSQL_DATABASE')
        }
        
        conn = mysql.connector.connect(**mysql_config)
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute(
            'SELECT USER_ID FROM USERS WHERE USER_ABBR = %s AND COMP_ID = %s',
            (username, int(company_id))
        )
        
        result = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if result:
            return jsonify({'success': True, 'userId': result['USER_ID']}), 200
        else:
            return jsonify({'success': False, 'message': 'User not found'}), 404
            
    except Exception as e:
        print(f"[ERROR] Error getting user ID: {e}")
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500

# Health check endpoint
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'port': PORT}), 200

if __name__ == '__main__':
    print(f"Starting server on port {PORT}...")
    print(f"SQLite database path: {sqlite_db_path}")
    app.run(host='0.0.0.0', port=PORT, debug=True)

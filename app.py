# app.py
import os
import uuid
import base64
from datetime import datetime
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_file
from flask_cors import CORS
import hashlib
import json
import secrets
from urllib.parse import urlparse

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', secrets.token_hex(32))
CORS(app)

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://localhost/campanhadb')

def get_db():
    """Get database connection"""
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    return conn

def init_db():
    """Initialize database tables"""
    conn = get_db()
    cur = conn.cursor()
    
    # Create candidates table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS candidates (
            id VARCHAR(50) PRIMARY KEY,
            login VARCHAR(100) UNIQUE NOT NULL,
            senha VARCHAR(255) NOT NULL,
            nome VARCHAR(200) NOT NULL,
            tipo VARCHAR(50) DEFAULT 'Candidato',
            cargo VARCHAR(100),
            partido VARCHAR(100),
            slogan TEXT,
            numero VARCHAR(20),
            foto_data TEXT,
            config JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create supporters table (optional - for analytics)
    cur.execute('''
        CREATE TABLE IF NOT EXISTS supporters (
            id SERIAL PRIMARY KEY,
            candidate_id VARCHAR(50) REFERENCES candidates(id) ON DELETE CASCADE,
            layout_used INTEGER,
            phrase_used TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    cur.close()
    conn.close()

# Initialize database on startup
init_db()

# Constants
ADM = {"login": "junior.araujo21", "senha": hashlib.sha256("230808".encode()).hexdigest()}

CARGOS = [
    "Presidente", "Vice-Presidente", "Governador", "Vice-Governador",
    "Senador", "Deputado Federal", "Deputado Estadual",
    "Prefeito", "Vice-Prefeito", "Vereador"
]

PARTIDOS = [
    "PT","PL","MDB","PSDB","PP","União Brasil","PSD","PDT",
    "PSB","Republicanos","Podemos","PSOL","Avante","Solidariedade","Outro"
]

CORES = [
    "#C9A84C","#1a1a2e","#0a3d62","#1e3a1e",
    "#6b0f1a","#2C5F2E","#003153","#8B0000"
]

# Helper functions
def uid():
    return "c" + datetime.now().strftime("%s") + secrets.token_hex(4)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, hashed):
    return hashlib.sha256(password.encode()).hexdigest() == hashed

# Image processing functions
def hex_to_rgba(hex_color, alpha=1.0):
    """Convert hex color to rgba string"""
    if not hex_color or len(hex_color) < 7:
        return f"rgba(0,0,0,{alpha})"
    r = int(hex_color[1:3], 16)
    g = int(hex_color[3:5], 16)
    b = int(hex_color[5:7], 16)
    return f"rgba({r},{g},{b},{alpha})"

def lighten_color(hex_color, amt):
    """Lighten a hex color by amount"""
    if not hex_color or len(hex_color) < 7:
        return "#ffffff"
    r = min(255, int(hex_color[1:3], 16) + amt)
    g = min(255, int(hex_color[3:5], 16) + amt)
    b = min(255, int(hex_color[5:7], 16) + amt)
    return f"#{r:02x}{g:02x}{b:02x}"

def is_dark(hex_color):
    """Check if a color is dark"""
    if not hex_color or len(hex_color) < 7:
        return True
    r = int(hex_color[1:3], 16)
    g = int(hex_color[3:5], 16)
    b = int(hex_color[5:7], 16)
    return (r * 299 + g * 587 + b * 114) / 1000 < 140

def wrap_text(draw, text, font, max_width):
    """Wrap text to fit within max_width"""
    words = text.split(' ')
    lines = []
    current_line = []
    
    for word in words:
        test_line = ' '.join(current_line + [word])
        bbox = draw.textbbox((0, 0), test_line, font=font)
        if bbox[2] <= max_width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(' '.join(current_line))
            current_line = [word]
    
    if current_line:
        lines.append(' '.join(current_line))
    
    return lines

# Layout functions (simplified versions of the React canvas functions)
def create_layout_imperial(candidate, supporter_photo=None, phrase="EU APOIO!"):
    """Create Imperial layout"""
    img = Image.new('RGB', (800, 800), color='#080808')
    draw = ImageDraw.Draw(img)
    
    try:
        font_large = ImageFont.truetype("/system/fonts/DroidSans.ttf", 36)
        font_medium = ImageFont.truetype("/system/fonts/DroidSans.ttf", 24)
        font_small = ImageFont.truetype("/system/fonts/DroidSans.ttf", 18)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    cor = candidate.get('config', {}).get('cor', "#C9A84C")
    
    # Draw candidate photo if available
    if supporter_photo:
        # Process and place supporter photo
        pass
    
    # Draw text elements
    draw.text((400, 400), candidate.get('nome', 'CANDIDATO').upper(), fill='white', font=font_large, anchor='mm')
    draw.text((400, 500), candidate.get('cargo', ''), fill=cor, font=font_medium, anchor='mm')
    
    if candidate.get('numero'):
        draw.text((400, 550), f"Nº {candidate['numero']}", fill=cor, font=font_large, anchor='mm')
    
    draw.text((400, 650), f'"{phrase}"', fill='white', font=font_small, anchor='mm')
    
    return img

def create_layout_presidential(candidate, supporter_photo=None, phrase="EU APOIO!"):
    """Create Presidential layout"""
    img = Image.new('RGB', (800, 800), color='#1a2a3a')
    draw = ImageDraw.Draw(img)
    
    try:
        font_large = ImageFont.truetype("/system/fonts/DroidSans.ttf", 48)
        font_medium = ImageFont.truetype("/system/fonts/DroidSans.ttf", 24)
        font_small = ImageFont.truetype("/system/fonts/DroidSans.ttf", 18)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    cor = candidate.get('config', {}).get('cor', "#003153")
    
    # Draw elements
    draw.rectangle([(0, 0), (800, 72)], fill=cor)
    draw.text((32, 20), candidate.get('partido', ''), fill='white', font=font_medium)
    
    draw.text((400, 550), candidate.get('nome', 'CANDIDATO').upper(), fill='white', font=font_large, anchor='mm')
    draw.text((400, 620), f"{candidate.get('cargo', '')} • Nº {candidate.get('numero', '')}", fill=cor, font=font_medium, anchor='mm')
    draw.text((400, 680), f'"{phrase}"', fill='white', font=font_small, anchor='mm')
    
    return img

def create_layout_senatorio(candidate, supporter_photo=None, phrase="EU APOIO!"):
    """Create Senatório layout"""
    img = Image.new('RGB', (800, 800), color='#f5f0e8')
    draw = ImageDraw.Draw(img)
    
    try:
        font_large = ImageFont.truetype("/system/fonts/DroidSans.ttf", 36)
        font_medium = ImageFont.truetype("/system/fonts/DroidSans.ttf", 24)
        font_small = ImageFont.truetype("/system/fonts/DroidSans.ttf", 18)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    cor = candidate.get('config', {}).get('cor', "#8B0000")
    
    # Dark left panel
    draw.rectangle([(0, 0), (352, 800)], fill='#111111')
    
    draw.text((576, 136), candidate.get('tipo', 'CANDIDATO').upper(), fill=cor, font=font_medium, anchor='mm')
    draw.text((576, 272), candidate.get('nome', 'CANDIDATO').upper(), fill='#1a1a1a', font=font_large, anchor='mm')
    draw.text((576, 400), candidate.get('cargo', '').upper(), fill=cor, font=font_medium, anchor='mm')
    
    if candidate.get('numero'):
        draw.text((576, 496), candidate['numero'], fill='#1a1a1a', font=font_large, anchor='mm')
    
    draw.text((576, 616), f'"{phrase}"', fill='#444444', font=font_small, anchor='mm')
    
    return img

def create_layout_vanguarda(candidate, supporter_photo=None, phrase="EU APOIO!"):
    """Create Vanguarda layout"""
    img = Image.new('RGB', (800, 800), color='#07070e')
    draw = ImageDraw.Draw(img)
    
    try:
        font_large = ImageFont.truetype("/system/fonts/DroidSans.ttf", 48)
        font_medium = ImageFont.truetype("/system/fonts/DroidSans.ttf", 24)
        font_small = ImageFont.truetype("/system/fonts/DroidSans.ttf", 18)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    cor = candidate.get('config', {}).get('cor', "#C9A84C")
    
    # Horizontal line
    draw.line([(0, 608), (800, 608)], fill=cor, width=2)
    
    draw.text((40, 632), candidate.get('cargo', '').upper(), fill=cor, font=font_medium)
    draw.text((40, 672), candidate.get('nome', 'CANDIDATO').upper(), fill='white', font=font_large)
    
    if candidate.get('numero'):
        draw.text((40, 720), f"Nº {candidate['numero']}", fill=cor, font=font_medium)
    
    draw.text((40, 760), f'"{phrase}"', fill='rgba(255,255,255,0.58)', font=font_small)
    
    return img

def create_layout_republica(candidate, supporter_photo=None, phrase="EU APOIO!"):
    """Create República layout"""
    img = Image.new('RGB', (800, 800), color='#1e3a1e')
    draw = ImageDraw.Draw(img)
    
    try:
        font_large = ImageFont.truetype("/system/fonts/DroidSans.ttf", 50)
        font_medium = ImageFont.truetype("/system/fonts/DroidSans.ttf", 22)
        font_small = ImageFont.truetype("/system/fonts/DroidSans.ttf", 20)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    cor = candidate.get('config', {}).get('cor', "#1e3a1e")
    
    # Bottom panel
    draw.rectangle([(0, 596), (800, 800)], fill='#000000', outline=None)
    
    draw.text((400, 648), candidate.get('nome', 'CANDIDATO').upper(), fill='white', font=font_large, anchor='mm')
    draw.text((400, 704), f"{candidate.get('cargo', '')} — Nº {candidate.get('numero', '')}", fill=lighten_color(cor, 65), font=font_medium, anchor='mm')
    draw.text((400, 744), f'"{phrase}"', fill='rgba(255,255,255,0.62)', font=font_small, anchor='mm')
    
    return img

def create_layout_manifesto(candidate, supporter_photo=None, phrase="EU APOIO!"):
    """Create Manifesto layout"""
    img = Image.new('RGB', (800, 800), color='#fafaf6')
    draw = ImageDraw.Draw(img)
    
    try:
        font_large = ImageFont.truetype("/system/fonts/DroidSans.ttf", 42)
        font_medium = ImageFont.truetype("/system/fonts/DroidSans.ttf", 20)
        font_small = ImageFont.truetype("/system/fonts/DroidSans.ttf", 21)
    except:
        font_large = ImageFont.load_default()
        font_medium = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    cor = candidate.get('config', {}).get('cor', "#C9A84C")
    
    # Left color bar
    draw.rectangle([(0, 0), (19, 800)], fill=cor)
    
    draw.text((44, 344), candidate.get('tipo', '').upper(), fill=cor, font=font_medium)
    draw.text((44, 392), candidate.get('nome', 'CANDIDATO').upper(), fill='#111111', font=font_large)
    draw.text((44, 456), candidate.get('cargo', '').upper(), fill='#555555', font=font_medium)
    
    if candidate.get('numero'):
        draw.text((44, 504), candidate['numero'], fill=cor, font=font_large)
    
    draw.text((44, 600), f'"{phrase}"', fill='#333333', font=font_small)
    
    return img

LAYOUTS = [
    {"nome": "Imperial", "fn": create_layout_imperial},
    {"nome": "Presidential", "fn": create_layout_presidential},
    {"nome": "Senatório", "fn": create_layout_senatorio},
    {"nome": "Vanguarda", "fn": create_layout_vanguarda},
    {"nome": "República", "fn": create_layout_republica},
    {"nome": "Manifesto", "fn": create_layout_manifesto},
]

# Routes
@app.route('/')
def index():
    """Main page"""
    apoio_id = request.args.get('apoio')
    return render_template('index.html', apoio_id=apoio_id)

# API Routes
@app.route('/api/candidates', methods=['GET'])
def get_candidates():
    """Get all candidates (public)"""
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT id, nome, tipo, cargo, partido, numero, config FROM candidates ORDER BY created_at DESC')
    candidates = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(candidates)

@app.route('/api/candidate/<candidate_id>', methods=['GET'])
def get_candidate(candidate_id):
    """Get specific candidate (public)"""
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT id, nome, tipo, cargo, partido, numero, config FROM candidates WHERE id = %s', (candidate_id,))
    candidate = cur.fetchone()
    cur.close()
    conn.close()
    
    if candidate:
        return jsonify(candidate)
    return jsonify({"error": "Candidate not found"}), 404

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    """Admin login"""
    data = request.json
    login = data.get('login')
    senha = data.get('senha')
    
    if login == ADM['login'] and verify_password(senha, ADM['senha']):
        session['user_type'] = 'admin'
        session['user_id'] = 'admin'
        return jsonify({"success": True, "type": "admin"})
    
    return jsonify({"success": False, "error": "Invalid credentials"}), 401

@app.route('/api/candidate/login', methods=['POST'])
def candidate_login():
    """Candidate login"""
    data = request.json
    login = data.get('login')
    senha = data.get('senha')
    
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT id, login, senha FROM candidates WHERE login = %s', (login,))
    candidate = cur.fetchone()
    cur.close()
    conn.close()
    
    if candidate and verify_password(senha, candidate['senha']):
        session['user_type'] = 'candidate'
        session['user_id'] = candidate['id']
        return jsonify({"success": True, "type": "candidate", "id": candidate['id']})
    
    return jsonify({"success": False, "error": "Invalid credentials"}), 401

@app.route('/api/admin/candidates', methods=['GET'])
def admin_get_candidates():
    """Get all candidates (admin only)"""
    if not session.get('user_type') == 'admin':
        return jsonify({"error": "Unauthorized"}), 401
    
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT * FROM candidates ORDER BY created_at DESC')
    candidates = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(candidates)

@app.route('/api/admin/candidate', methods=['POST'])
def admin_create_candidate():
    """Create candidate (admin only)"""
    if not session.get('user_type') == 'admin':
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    
    # Validate required fields
    required = ['login', 'senha', 'nome', 'cargo']
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Check if login exists
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT id FROM candidates WHERE login = %s', (data['login'],))
    if cur.fetchone():
        cur.close()
        conn.close()
        return jsonify({"error": "Login already exists"}), 400
    
    candidate_id = uid()
    hashed_senha = hash_password(data['senha'])
    
    cur.execute('''
        INSERT INTO candidates (id, login, senha, nome, tipo, cargo, partido, slogan, numero)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    ''', (
        candidate_id,
        data['login'],
        hashed_senha,
        data['nome'],
        data.get('tipo', 'Candidato'),
        data['cargo'],
        data.get('partido', ''),
        data.get('slogan', ''),
        data.get('numero', '') if data.get('usarNum') else ''
    ))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({"success": True, "id": candidate_id})

@app.route('/api/admin/candidate/<candidate_id>', methods=['PUT'])
def admin_update_candidate(candidate_id):
    """Update candidate (admin only)"""
    if not session.get('user_type') == 'admin':
        return jsonify({"error": "Unauthorized"}), 401
    
    data = request.json
    
    conn = get_db()
    cur = conn.cursor()
    
    # Check if login exists for another candidate
    if 'login' in data:
        cur.execute('SELECT id FROM candidates WHERE login = %s AND id != %s', (data['login'], candidate_id))
        if cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({"error": "Login already exists"}), 400
    
    # Build update query dynamically
    update_fields = []
    params = []
    
    fields = ['login', 'nome', 'tipo', 'cargo', 'partido', 'slogan', 'numero']
    for field in fields:
        if field in data:
            update_fields.append(f"{field} = %s")
            params.append(data[field])
    
    if 'senha' in data and data['senha']:
        update_fields.append("senha = %s")
        params.append(hash_password(data['senha']))
    
    if update_fields:
        params.append(candidate_id)
        cur.execute(f'''
            UPDATE candidates 
            SET {', '.join(update_fields)}, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        ''', params)
        conn.commit()
    
    cur.close()
    conn.close()
    
    return jsonify({"success": True})

@app.route('/api/admin/candidate/<candidate_id>', methods=['DELETE'])
def admin_delete_candidate(candidate_id):
    """Delete candidate (admin only)"""
    if not session.get('user_type') == 'admin':
        return jsonify({"error": "Unauthorized"}), 401
    
    conn = get_db()
    cur = conn.cursor()
    cur.execute('DELETE FROM candidates WHERE id = %s', (candidate_id,))
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({"success": True})

@app.route('/api/candidate/config', methods=['GET'])
def candidate_get_config():
    """Get candidate config (candidate only)"""
    if not session.get('user_type') == 'candidate':
        return jsonify({"error": "Unauthorized"}), 401
    
    candidate_id = session.get('user_id')
    
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT config, foto_data FROM candidates WHERE id = %s', (candidate_id,))
    result = cur.fetchone()
    cur.close()
    conn.close()
    
    return jsonify({
        "config": result['config'] if result else {},
        "foto_data": result['foto_data'] if result else None
    })

@app.route('/api/candidate/config', methods=['POST'])
def candidate_save_config():
    """Save candidate config (candidate only)"""
    if not session.get('user_type') == 'candidate':
        return jsonify({"error": "Unauthorized"}), 401
    
    candidate_id = session.get('user_id')
    data = request.json
    
    conn = get_db()
    cur = conn.cursor()
    cur.execute('''
        UPDATE candidates 
        SET config = %s::jsonb, foto_data = %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
    ''', (
        json.dumps(data.get('config', {})),
        data.get('foto_data'),
        candidate_id
    ))
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({"success": True})

@app.route('/api/generate-image', methods=['POST'])
def generate_image():
    """Generate campaign image"""
    data = request.json
    candidate_id = data.get('candidate_id')
    layout_idx = data.get('layout', 0)
    phrase_idx = data.get('phrase', 0)
    supporter_photo = data.get('supporter_photo')  # base64 image
    
    conn = get_db()
    cur = conn.cursor()
    cur.execute('SELECT * FROM candidates WHERE id = %s', (candidate_id,))
    candidate = cur.fetchone()
    cur.close()
    conn.close()
    
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404
    
    # Get selected phrase
    phrases = candidate['config'].get('frases', ["EU APOIO!"])
    phrase = phrases[phrase_idx] if phrase_idx < len(phrases) else phrases[0]
    
    # Generate image
    layout_fn = LAYOUTS[layout_idx]['fn']
    img = layout_fn(candidate, supporter_photo, phrase)
    
    # Save to bytes
    img_io = BytesIO()
    img.save(img_io, 'PNG', quality=95)
    img_io.seek(0)
    
    # Log supporter (optional)
    conn = get_db()
    cur = conn.cursor()
    cur.execute('''
        INSERT INTO supporters (candidate_id, layout_used, phrase_used)
        VALUES (%s, %s, %s)
    ''', (candidate_id, layout_idx, phrase))
    conn.commit()
    cur.close()
    conn.close()
    
    return send_file(img_io, mimetype='image/png', as_attachment=True, download_name=f'apoio-{candidate["nome"].lower().replace(" ", "-")}.png')

@app.route('/api/logout', methods=['POST'])
def logout():
    """Logout user"""
    session.clear()
    return jsonify({"success": True})

@app.route('/api/session', methods=['GET'])
def get_session():
    """Get current session"""
    if session.get('user_type') == 'admin':
        return jsonify({"type": "admin"})
    elif session.get('user_type') == 'candidate':
        return jsonify({"type": "candidate", "id": session.get('user_id')})
    return jsonify({"type": "guest"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

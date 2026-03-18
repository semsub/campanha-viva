# init_db.py
import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def init_database():
    """Initialize database tables"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("DATABASE_URL not set")
        return
    
    # Para Fly.io PostgreSQL, a URL já vem completa
    conn = psycopg2.connect(database_url)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
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
    
    # Create supporters table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS supporters (
            id SERIAL PRIMARY KEY,
            candidate_id VARCHAR(50) REFERENCES candidates(id) ON DELETE CASCADE,
            layout_used INTEGER,
            phrase_used TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    print("Database initialized successfully")
    cur.close()
    conn.close()

if __name__ == '__main__':
    init_database()

import logging
import os
import sys
from pathlib import Path

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_database_connection():
    """Get database connection."""
    try:
        # Get connection parameters from environment
        db_host = os.environ.get("POSTGRES_HOST", "localhost")
        db_port = os.environ.get("POSTGRES_PORT", "5432")
        db_user = os.environ.get("POSTGRES_USER", "postgres")
        db_password = os.environ.get("POSTGRES_PASSWORD", "password")
        db_name = os.environ.get("POSTGRES_DB", "ssis_db")

        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            user=db_user,
            password=db_password,
            database=db_name,
        )
        return conn
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise

def clear_existing_data():
    """Clear existing data from tables while preserving structure."""
    try:
        conn = get_database_connection()
        cursor = conn.cursor()
        
        # Disable foreign key constraints temporarily
        cursor.execute("SET session_replication_role = 'replica';")
        
        # Clear data from tables in correct order (due to foreign key constraints)
        tables = ["students", "programs", "colleges", "users"]
        for table in tables:
            try:
                cursor.execute(f"DELETE FROM {table};")
                logger.info(f"Cleared data from {table} table")
            except Exception as e:
                logger.warning(f"Could not clear {table}: {e}")
        
        # Reset sequences
        cursor.execute("""
            SELECT c.relname FROM pg_class c 
            WHERE c.relkind = 'S';
        """)
        sequences = cursor.fetchall()
        
        for seq in sequences:
            seq_name = seq[0]
            if seq_name.startswith(('colleges_', 'programs_', 'users_')):
                cursor.execute(f"ALTER SEQUENCE {seq_name} RESTART WITH 1;")
                logger.info(f"Reset sequence {seq_name}")
        
        # Re-enable foreign key constraints
        cursor.execute("SET session_replication_role = 'origin';")
        conn.commit()
        
        cursor.close()
        conn.close()
        logger.info("Successfully cleared existing data")
        
    except Exception as e:
        logger.error(f"Failed to clear existing data: {e}")
        raise

def seed_database():
    """Seed the database with sample data."""
    try:
        # Read the SQL seed file
        sql_file_path = Path(__file__).parent / "sql" / "seed_data.sql"
        
        if not sql_file_path.exists():
            logger.error(f"Seed SQL file not found: {sql_file_path}")
            raise FileNotFoundError(f"Seed SQL file not found: {sql_file_path}")
        
        with open(sql_file_path, "r", encoding="utf-8") as file:
            sql_script = file.read()
        
        if not sql_script.strip():
            logger.error("Seed SQL script is empty!")
            raise ValueError("Seed SQL script is empty")
        
        # Clear existing data first
        logger.info("Clearing existing data...")
        clear_existing_data()
        
        # Execute seed script
        logger.info("Seeding database with sample data...")
        conn = get_database_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(sql_script)
            conn.commit()
            logger.info("Successfully executed seed SQL script")
        except psycopg2.Error as e:
            logger.error(f"Failed to execute seed SQL script: {e}")
            conn.rollback()
            raise
        
        # Verify data was inserted
        cursor.execute("SELECT COUNT(*) FROM colleges;")
        college_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM programs;")
        program_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM students;")
        student_count = cursor.fetchone()[0]
        
        logger.info(f"Verification:")
        logger.info(f"  - Colleges: {college_count} (expected: 23)")
        logger.info(f"  - Programs: {program_count} (expected: 45)")
        logger.info(f"  - Students: {student_count} (expected: 117)")
        
        cursor.close()
        conn.close()
        
        if college_count == 23 and program_count == 45 and student_count == 117:
            logger.info("✅ Database seeded successfully!")
            return True
        else:
            logger.warning("⚠️  Seed counts don't match expected values")
            return False
            
    except Exception as e:
        logger.error(f"Failed to seed database: {e}")
        raise

def main():
    """Main function to run the seed script."""
    logger.info("Starting SSIS Database Seeding...")
    try:
        success = seed_database()
        if success:
            logger.info("Database seeding completed successfully!")
            return 0
        else:
            logger.warning("Database seeding completed with some warnings")
            return 1
    except Exception as e:
        logger.error(f"Database seeding failed: {e}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
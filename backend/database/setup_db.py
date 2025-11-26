import logging
import os

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DEFAULT_DB_NAME = "ssis_db"


def get_database_connection(database_name=None):
    try:
        db_host = os.environ.get("POSTGRES_HOST", "localhost")
        db_port = os.environ.get("POSTGRES_PORT", "5432")
        db_user = os.environ.get("POSTGRES_USER", "postgres")
        db_password = os.environ.get("POSTGRES_PASSWORD", "password")

        if database_name:
            db_name = database_name
        else:
            db_name = os.environ.get("POSTGRES_DB", DEFAULT_DB_NAME)

        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            user=db_user,
            password=db_password,
            database=db_name,
        )
        return conn
    except Exception as e:
        logger.error(f"[X] Failed to connect to database: {e}")
        raise


def create_database():
    db_name = os.environ.get("POSTGRES_DB", DEFAULT_DB_NAME)
    try:
        conn = get_database_connection("postgres")
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        cursor.execute(
            "SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s",
            (db_name,)
        )
        exists = cursor.fetchone()

        if not exists:
            cursor.execute(f'CREATE DATABASE "{db_name}"')
            logger.info(f"[✓] Database '{db_name}' created successfully!")
        else:
            logger.info(f"[✓] Database '{db_name}' already exists!")

        cursor.close()
        conn.close()
    except Exception as e:
        logger.error(f"[X] Failed to create database: {e}")
        raise


def setup_tables():
    try:
        sql_file_path = os.path.join(
            os.path.dirname(__file__),
            "sql",
            "create_tables.sql"
        )

        if not os.path.exists(sql_file_path):
            logger.error(f"[X] SQL file not found: {sql_file_path}")
            raise FileNotFoundError(f"SQL file not found: {sql_file_path}")

        with open(sql_file_path, "r", encoding="utf-8") as file:
            sql_script = file.read()

        if not sql_script.strip():
            logger.error("[X] SQL script is empty!")
            raise ValueError("SQL script is empty")

        conn = get_database_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(sql_script)
            conn.commit()
            logger.info("[✓] SQL script executed successfully!")
        except psycopg2.Error as e:
            if e.pgcode == "42P07":
                logger.warning(
                    f"[!] Some database objects already exist (normal for re-runs)"
                )
                conn.rollback()
            else:
                logger.error(f"[X] Failed to execute SQL script: {e}")
                conn.rollback()
                raise
        cursor.close()
        conn.close()
        logger.info("[✓] Tables setup completed!")
    except Exception as e:
        logger.error(f"[X] Failed to setup tables: {e}")
        raise


def verify_tables():
    try:
        conn = get_database_connection()
        cursor = conn.cursor()

        expected_tables = ["colleges"]

        cursor.execute(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            """
        )
        existing_tables = [row[0] for row in cursor.fetchall()]

        missing_tables = set(expected_tables) - set(existing_tables)

        if missing_tables:
            logger.error(f"[X] Missing tables: {missing_tables}")
            return False
        else:
            logger.info("[✓] All expected tables exist!")

        for table in expected_tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            logger.info(f"  [✓] {table}: {count} rows")

        return True
    except Exception as e:
        logger.error(f"[X] Verification failed: {e}")
        return False
    finally:
        if "cursor" in locals():
            cursor.close()
        if "conn" in locals():
            conn.close()


def main():
    logger.info("Starting SSIS Database Setup...")
    try:
        logger.info("Step 1: Creating database...")
        create_database()

        logger.info("Step 2: Setting up tables...")
        setup_tables()

        logger.info("Step 3: Verifying setup...")
        success = verify_tables()

        if success:
            logger.info("[✓] Database setup completed successfully!")
        else:
            logger.error("[X] Database setup completed with errors!")
            exit(1)
    except Exception as e:
        logger.error(f"[X] Database setup failed: {e}")
        exit(1)


if __name__ == "__main__":
    main()


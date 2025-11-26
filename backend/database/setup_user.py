import getpass
import logging
import os
import re
import sys

import psycopg2
from werkzeug.security import generate_password_hash

try:
    from setup_db import get_database_connection
except Exception:
    try:
        from backend.database.setup_db import get_database_connection
    except Exception:
        get_database_connection = None

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def prompt_credentials():
    email = input("Enter admin email: ").strip()
    if not EMAIL_REGEX.match(email):
        logger.error("Invalid email format")
        sys.exit(1)

    password = getpass.getpass("Enter password: ")
    if not password:
        logger.error("Password cannot be empty")
        sys.exit(1)

    confirm = getpass.getpass("Confirm password: ")
    if password != confirm:
        logger.error("Passwords do not match")
        sys.exit(1)

    return email, password


def insert_user(conn, email, password_hash):
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        existing = cur.fetchone()
        if existing:
            logger.error("A user with this email already exists")
            return False

        cur.execute(
            "INSERT INTO users (email, password_hash) VALUES (%s, %s) RETURNING id",
            (email, password_hash),
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        logger.info(f"[✓] Created user id={user_id} for email={email}")
        return True


def main():
    logger.info("Interactive user setup for SSIS")
    email, password = prompt_credentials()
    password_hash = generate_password_hash(password)

    conn = None
    if get_database_connection:
        try:
            conn = get_database_connection()
        except Exception as e:
            logger.error(f"Failed to get DB connection: {e}")
            sys.exit(1)
    else:
        db_host = os.environ.get("POSTGRES_HOST", "localhost")
        db_port = os.environ.get("POSTGRES_PORT", "5432")
        db_user = os.environ.get("POSTGRES_USER", "postgres")
        db_password = os.environ.get("POSTGRES_PASSWORD", "password")
        db_name = os.environ.get("POSTGRES_DB", "ssis_db")
        try:
            conn = psycopg2.connect(
                host=db_host,
                port=db_port,
                user=db_user,
                password=db_password,
                database=db_name,
            )
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            sys.exit(1)

    try:
        success = insert_user(conn, email, password_hash)
        if success:
            logger.info("User setup completed successfully")
        else:
            logger.error("User setup failed")
            sys.exit(1)
    finally:
        if conn:
            conn.close()


if __name__ == "__main__":
    main()

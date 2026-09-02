import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_LOGIN_DB_PATH = os.path.join(BASE_DIR, "login_details.db")

SQLALCHEMY_LOGIN_DATABASE_URL = os.getenv("LOGIN_DATABASE_URL", f"sqlite:///{DEFAULT_LOGIN_DB_PATH}")

connect_args = {"check_same_thread": False} if SQLALCHEMY_LOGIN_DATABASE_URL.startswith("sqlite") else {}

login_engine = create_engine(
    SQLALCHEMY_LOGIN_DATABASE_URL, 
    connect_args=connect_args
)

LoginSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=login_engine)

LoginBase = declarative_base()

def get_login_db():
    db = LoginSessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_login_db():
    import models_login
    models_login.LoginBase.metadata.create_all(bind=login_engine)

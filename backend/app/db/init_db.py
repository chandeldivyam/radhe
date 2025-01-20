# backend/app/db/init_db.py
from app.db.base import Base
from app.db.base import engine

def init_db():
    Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    init_db()
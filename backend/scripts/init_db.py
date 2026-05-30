from app.database.base import Base
from app.database.session import engine


def run() -> None:
    Base.metadata.create_all(bind=engine)


if __name__ == '__main__':
    run()

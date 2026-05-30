from pathlib import Path

from sqlalchemy import text

from app.database.session import engine


def run() -> None:
    migrations_dir = Path(__file__).resolve().parents[1] / 'database' / 'migrations' / 'versions'
    sql_files = sorted(migrations_dir.glob('*.sql'))

    with engine.begin() as conn:
        for sql_file in sql_files:
            sql = sql_file.read_text(encoding='utf-8')
            conn.execute(text(sql))
            print(f'Applied: {sql_file.name}')


if __name__ == '__main__':
    run()

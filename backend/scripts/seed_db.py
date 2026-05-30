from datetime import date

from app.database.models import IndicadorModel, UsuarioModel
from app.database.session import SessionLocal


def run() -> None:
    db = SessionLocal()
    try:
        if db.query(UsuarioModel).count() == 0:
            db.add(UsuarioModel(nome='Operador ORION', email='operador@motiva-orion.local', perfil='operador'))

        if db.query(IndicadorModel).count() == 0:
            db.add(IndicadorModel(data_referencia=date.today(), total_trechos=0, trechos_criticos=0, indice_medio_iro=0, economia_potencial=0))

        db.commit()
    finally:
        db.close()


if __name__ == '__main__':
    run()

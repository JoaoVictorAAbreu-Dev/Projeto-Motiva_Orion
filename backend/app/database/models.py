from datetime import date, datetime

from sqlalchemy import DATE, JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class TrechoModel(Base):
    __tablename__ = 'trechos'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    km_inicio: Mapped[float] = mapped_column(Float, nullable=False)
    km_fim: Mapped[float] = mapped_column(Float, nullable=False)
    sentido: Mapped[str] = mapped_column(String(16), default='N/A')
    lado: Mapped[str] = mapped_column(String(16), default='N/A')
    tipo_area: Mapped[str] = mapped_column(String(64), default='faixa_dominio')
    nivel_rocada: Mapped[float] = mapped_column(Float, default=0)
    data_referencia: Mapped[date | None] = mapped_column(DATE)
    status: Mapped[str] = mapped_column(String(16), default='ativo')

    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    geom: Mapped[str | None] = mapped_column(Text)

    dias_sem_manutencao: Mapped[int] = mapped_column(Integer, default=0)
    chuva_acumulada_mm: Mapped[float] = mapped_column(Float, default=0)
    criticidade_operacional: Mapped[float] = mapped_column(Float, default=0)
    risco_contratual: Mapped[float] = mapped_column(Float, default=0)
    ndvi: Mapped[float | None] = mapped_column(Float)
    altura_vegetacao_predita_cm: Mapped[float | None] = mapped_column(Float)

    iro: Mapped[float] = mapped_column(Float, default=0)
    classificacao: Mapped[str] = mapped_column(String(16), default='Normal')
    recomendacao_acao: Mapped[str] = mapped_column(String(255), default='Monitorar')
    recomendacao_prazo_dias: Mapped[int] = mapped_column(Integer, default=30)
    recomendacao_metodo: Mapped[str] = mapped_column(String(128), default='Inspecao visual')

    intervencoes = relationship('IntervencaoModel', back_populates='trecho')


class IntervencaoModel(Base):
    __tablename__ = 'intervencoes'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    trecho_id: Mapped[int] = mapped_column(ForeignKey('trechos.id'), nullable=False)
    data_execucao: Mapped[date | None] = mapped_column(DATE)
    tipo_intervencao: Mapped[str] = mapped_column(String(64), default='rocada')
    custo: Mapped[float] = mapped_column(Float, default=0)
    observacoes: Mapped[str] = mapped_column(Text, default='')

    trecho = relationship('TrechoModel', back_populates='intervencoes')


class MissaoModel(Base):
    __tablename__ = 'missoes'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    codigo: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    prioridade: Mapped[str] = mapped_column(String(16), default='Media')
    equipe: Mapped[str] = mapped_column(String(64), default='Equipe Operacional')
    tempo_estimado_h: Mapped[float] = mapped_column(Float, default=0)
    custo_estimado: Mapped[float] = mapped_column(Float, default=0)
    economia_logistica_estimada: Mapped[float] = mapped_column(Float, default=0)
    trecho_ids: Mapped[dict] = mapped_column(JSON, default=list)
    plano_semanal_ref: Mapped[str] = mapped_column(String(32), default='')
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class IndicadorModel(Base):
    __tablename__ = 'indicadores'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    data_referencia: Mapped[date | None] = mapped_column(DATE)
    total_trechos: Mapped[int] = mapped_column(Integer, default=0)
    trechos_criticos: Mapped[int] = mapped_column(Integer, default=0)
    indice_medio_iro: Mapped[float] = mapped_column(Float, default=0)
    economia_potencial: Mapped[float] = mapped_column(Float, default=0)


class ClimaModel(Base):
    __tablename__ = 'clima'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    trecho_id: Mapped[int | None] = mapped_column(ForeignKey('trechos.id'))
    data_referencia: Mapped[date | None] = mapped_column(DATE)
    chuva_mm: Mapped[float] = mapped_column(Float, default=0)
    temperatura_c: Mapped[float] = mapped_column(Float, default=0)
    umidade_percentual: Mapped[float] = mapped_column(Float, default=0)
    vento_kmh: Mapped[float] = mapped_column(Float, default=0)


class UsuarioModel(Base):
    __tablename__ = 'usuarios'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(128), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255))
    perfil: Mapped[str] = mapped_column(String(32), default='operador')
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)


class AuditoriaModel(Base):
    __tablename__ = 'auditorias'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey('usuarios.id'))
    evento: Mapped[str] = mapped_column(String(128), nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class RegulatoryRuleModel(Base):
    __tablename__ = 'regulatory_rules'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    key: Mapped[str] = mapped_column(String(96), unique=True, nullable=False, index=True)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str] = mapped_column(String(255), default='')
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

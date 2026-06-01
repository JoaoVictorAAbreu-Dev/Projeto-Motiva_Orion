from datetime import date

from pydantic import BaseModel


class TrechoBase(BaseModel):
    km_inicio: float
    km_fim: float
    sentido: str
    lado: str
    tipo_area: str
    nivel_rocada: float
    data_referencia: date | None = None
    status: str
    latitude: float
    longitude: float
    dias_sem_manutencao: int
    chuva_acumulada_mm: float
    criticidade_operacional: float
    risco_contratual: float


class TrechoRead(TrechoBase):
    id: int
    iro: float
    classificacao: str
    recomendacao_acao: str
    recomendacao_prazo_dias: int
    recomendacao_metodo: str

    class Config:
        from_attributes = True


class IndicadorRead(BaseModel):
    id: int
    data_referencia: date | None = None
    total_trechos: int
    trechos_criticos: int
    indice_medio_iro: float
    economia_potencial: float

    class Config:
        from_attributes = True


class MissaoRead(BaseModel):
    id: int
    codigo: str
    prioridade: str
    equipe: str
    tempo_estimado_h: float
    custo_estimado: float
    economia_logistica_estimada: float
    trecho_ids: list[int]
    plano_semanal_ref: str

    class Config:
        from_attributes = True


class DashboardRead(BaseModel):
    total_trechos: int
    trechos_criticos: int
    missoes_planejadas: int
    economia_potencial: float
    indice_medio_risco: float
    conformidade_contratual: float


class ConformidadeRead(BaseModel):
    conformidade_geral: float
    trechos_risco_contratual: int
    prazo_medio_restante_dias: float
    historico_intervencoes: int


class PlanoSemanalRead(BaseModel):
    total_missoes: int
    custo_total_estimado: float
    economia_logistica_total: float
    prioridade_maxima: str
    recomendacoes: list[str]


class LoginRequest(BaseModel):
    email: str
    password: str


class CopilotAskRequest(BaseModel):
    pergunta: str


class CopilotAskResponse(BaseModel):
    resposta: str


class SentinelNDVIRequest(BaseModel):
    bbox: list[float]
    date_from: str
    date_to: str
    width: int = 512
    height: int = 512
    max_cloud_coverage: int = 30

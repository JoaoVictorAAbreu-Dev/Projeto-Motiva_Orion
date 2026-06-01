from pydantic import BaseModel, Field


class RoadSegment(BaseModel):
    id: int
    km_inicio: float
    km_fim: float
    latitude: float
    longitude: float
    nivel_vegetacao: float = Field(ge=0, le=100)
    dias_sem_rocada: int = Field(ge=0)
    chuva_prevista_mm: float = Field(ge=0)
    trafego_estimado: int = Field(ge=0)
    risco_contratual: float = Field(ge=0, le=100)
    custo_estimado: float = Field(ge=0)
    status: str
    iro: float = Field(ge=0, le=100)


class MissionPlan(BaseModel):
    id: str
    segment_ids: list[int]
    tempo_estimado_h: float
    custo_estimado: float
    criticidade_media: float


class OperationalContext(BaseModel):
    scenario: str
    generated_at: str
    total_segments: int
    critical_segments: int
    average_iro: float
    total_estimated_cost: float
    weather_summary: dict
    top_priorities: list[RoadSegment]
    recommended_missions: list[MissionPlan]


class CopilotQuestionRequest(BaseModel):
    question: str = Field(min_length=4)
    scenario: str = Field(default='seguranca')


class CopilotAnswerResponse(BaseModel):
    answer: str
    source: str


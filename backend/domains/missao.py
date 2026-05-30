from dataclasses import dataclass, field


@dataclass(slots=True)
class Missao:
    id: str
    trecho_ids: list[int] = field(default_factory=list)
    tempo_estimado_h: float = 0.0
    custo_estimado: float = 0.0
    criticidade_media: float = 0.0

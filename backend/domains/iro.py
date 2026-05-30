from dataclasses import dataclass


@dataclass(slots=True)
class IROResult:
    valor: float
    classificacao: str

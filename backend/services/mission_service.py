from domains.missao import Missao
from domains.trecho import Trecho


class MissionService:
    @staticmethod
    def gerar_missoes(trechos: list[Trecho], min_iro: float = 60.0) -> list[Missao]:
        candidatos = sorted((t for t in trechos if t.iro >= min_iro), key=lambda t: t.iro, reverse=True)
        missoes: list[Missao] = []

        for i in range(0, len(candidatos), 3):
            grupo = candidatos[i:i + 3]
            if not grupo:
                continue
            missoes.append(
                Missao(
                    id=f"M-{(i // 3) + 1:02d}",
                    trecho_ids=[t.id for t in grupo],
                    tempo_estimado_h=round(len(grupo) * 1.6, 1),
                    custo_estimado=round(sum(t.custo_estimado for t in grupo), 2),
                    criticidade_media=round(sum(t.iro for t in grupo) / len(grupo), 1),
                )
            )

        return missoes

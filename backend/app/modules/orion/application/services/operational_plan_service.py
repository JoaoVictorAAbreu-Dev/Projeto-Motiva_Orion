from app.database.models import MissaoModel, TrechoModel


class OperationalPlanService:
    @staticmethod
    def build_weekly_plan(trechos: list[TrechoModel], missoes: list[MissaoModel]) -> dict:
        custo_total = round(sum(m.custo_estimado for m in missoes), 2)
        economia = round(sum(m.economia_logistica_estimada for m in missoes), 2)
        prioridade_maxima = 'Alta' if any(m.prioridade == 'Alta' for m in missoes) else 'Media'

        top_trechos = sorted(trechos, key=lambda t: t.iro, reverse=True)[:5]
        recomendacoes = [
            f"Priorizar trecho {t.id} (KM {t.km_inicio}-{t.km_fim}) com IRO {t.iro}"
            for t in top_trechos
        ]

        return {
            'total_missoes': len(missoes),
            'custo_total_estimado': custo_total,
            'economia_logistica_total': economia,
            'prioridade_maxima': prioridade_maxima,
            'recomendacoes': recomendacoes,
        }


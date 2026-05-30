from __future__ import annotations

from typing import Any

import httpx

from app.core.settings import settings


class AIService:
    def __init__(self) -> None:
        self.api_key = settings.groq_api_key
        self.model = settings.groq_model
        self.base_url = 'https://api.groq.com/openai/v1/chat/completions'

    async def explain(self, pergunta: str, context: dict[str, Any]) -> str:
        if not self.api_key:
            return self._fallback_response(pergunta, context)

        payload = {
            'model': self.model,
            'messages': [
                {
                    'role': 'system',
                    'content': (
                        'Voce e o Copiloto ORION. Nunca calcule risco, prioridade ou missao. '
                        'Apenas explique os resultados fornecidos pelo backend em linguagem clara, objetiva e executiva.'
                    ),
                },
                {
                    'role': 'user',
                    'content': (
                        f'Pergunta: {pergunta}\n'
                        'Contexto operacional (valores ja calculados):\n'
                        f'{context}'
                    ),
                },
            ],
            'temperature': 0.2,
            'max_tokens': 400,
        }
        headers = {'Authorization': f'Bearer {self.api_key}', 'Content-Type': 'application/json'}

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(self.base_url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            message = data.get('choices', [{}])[0].get('message', {}).get('content')
            if not message:
                return self._fallback_response(pergunta, context)
            return str(message).strip()

    @staticmethod
    def _fallback_response(pergunta: str, context: dict[str, Any]) -> str:
        dashboard = context.get('dashboard', {})
        missao = context.get('missoes', {})
        top_trechos = context.get('top_trechos', [])
        ids = ', '.join(str(item.get('id')) for item in top_trechos[:3]) if top_trechos else 'N/A'
        return (
            f'Pergunta recebida: "{pergunta}". '
            f'Prioridade imediata nos trechos {ids}. '
            f'Trechos criticos: {dashboard.get("trechos_criticos", 0)}. '
            f'Missoes planejadas: {dashboard.get("missoes_planejadas", 0)}. '
            f'Custo total estimado: R$ {missao.get("custo_total", 0):,.2f}. '
            'Recomendacao: executar missoes de alta prioridade nesta semana para reduzir risco e nao conformidade.'
        )

import httpx

from app.core.settings import settings


class GroqClient:
    async def ask(self, prompt: str) -> str:
        if not settings.groq_api_key:
            return 'GROQ_API_KEY nao configurada. Copiloto em modo local apenas.'

        url = 'https://api.groq.com/openai/v1/chat/completions'
        headers = {
            'Authorization': f'Bearer {settings.groq_api_key}',
            'Content-Type': 'application/json',
        }
        payload = {
            'model': settings.groq_model,
            'temperature': 0.2,
            'messages': [
                {
                    'role': 'system',
                    'content': (
                        'Voce e o Copiloto Operacional ORION. '
                        'Nao calcule risco, score ou prioridade. '
                        'Use apenas os valores recebidos do backend para interpretar e justificar decisoes.'
                    ),
                },
                {'role': 'user', 'content': prompt},
            ],
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                content = response.json()['choices'][0]['message']['content']
            return content.strip()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text[:200]
            return f'Erro Groq ({exc.response.status_code}): {detail}'
        except Exception:
            return 'Falha temporaria na integracao Groq. Tente novamente.'

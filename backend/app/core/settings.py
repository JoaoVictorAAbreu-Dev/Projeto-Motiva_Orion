from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    app_name: str = 'Motiva ORION API'
    app_version: str = '0.2.0'

    database_url: str = 'postgresql+psycopg://postgres:postgres@localhost:5432/motiva_orion'

    iro_weight_vegetacao: float = 0.28
    iro_weight_dias_sem_manutencao: float = 0.24
    iro_weight_chuva: float = 0.16
    iro_weight_criticidade_operacional: float = 0.17
    iro_weight_risco_contratual: float = 0.15

    auth_secret_key: str = 'change-me-in-prod'
    auth_algorithm: str = 'HS256'
    auth_access_token_expire_minutes: int = 120
    auth_default_password: str = 'orion123'
    auth_allow_plaintext_fallback: bool = True

    groq_api_key: str | None = None
    groq_model: str = 'llama-3.3-70b-versatile'

    openrouteservice_api_key: str | None = None
    openrouteservice_enabled: bool = False
    openrouteservice_max_calls_per_run: int = 10
    openrouteservice_timeout_seconds: float = 8.0

    sentinel_enabled: bool = False
    sentinel_process_url: str = 'https://sh.dataspace.copernicus.eu/process/v1'
    sentinel_access_token: str | None = None
    sentinel_client_id: str | None = None
    sentinel_client_secret: str | None = None
    sentinel_token_url: str = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token'
    sentinel_max_calls_per_run: int = 5
    sentinel_timeout_seconds: float = 20.0
    sentinel_stats_url: str = 'https://services.sentinel-hub.com/api/v1/statistics'
    sentinel_hub_client_id: str | None = None
    sentinel_hub_client_secret: str | None = None
    sentinel_hub_token_url: str = 'https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token'

    ai_model_path: str = 'models/vegetation_height_model.pkl'
    iro_ndvi_weight: float = 0.2
    iro_ndvi_threshold_dense: float = 0.6
    iro_ndvi_dense_boost: float = 0.2
    iro_predicted_height_weight: float = 0.1
    gestao_verde_import_dir: str = r'C:\Users\jv921\Downloads\Arquivos - Dados challenge MOTIVA'


settings = Settings()

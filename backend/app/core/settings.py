from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    groq_api_key: str | None = None
    groq_model: str = 'llama-3.3-70b-versatile'
    open_meteo_base_url: str = 'https://api.open-meteo.com/v1'
    overpass_base_url: str = 'https://overpass-api.de/api'
    nominatim_base_url: str = 'https://nominatim.openstreetmap.org'
    openrouteservice_base_url: str = 'https://api.openrouteservice.org/v2'
    openrouteservice_api_key: str | None = None


settings = Settings()

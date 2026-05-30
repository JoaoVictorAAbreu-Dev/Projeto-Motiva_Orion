from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.settings import settings
from app.database.models import UsuarioModel
from app.database.session import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/api/v1/auth/login')
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    sub: str
    perfil: str


def create_access_token(subject: str, perfil: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.auth_access_token_expire_minutes)
    payload = {'sub': subject, 'perfil': perfil, 'exp': expire}
    return jwt.encode(payload, settings.auth_secret_key, algorithm=settings.auth_algorithm)


def authenticate_user(db: Session, email: str, password: str) -> UsuarioModel | None:
    user = db.query(UsuarioModel).filter(UsuarioModel.email == email, UsuarioModel.ativo.is_(True)).first()
    if not user:
        return None

    if user.password_hash:
        if not pwd_context.verify(password, user.password_hash):
            return None
        return user

    if settings.auth_allow_plaintext_fallback and password == settings.auth_default_password:
        return user

    return None


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UsuarioModel:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='Credenciais invalidas',
        headers={'WWW-Authenticate': 'Bearer'},
    )

    try:
        payload = jwt.decode(token, settings.auth_secret_key, algorithms=[settings.auth_algorithm])
        email = payload.get('sub')
        perfil = payload.get('perfil')
        if not email or not perfil:
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc

    user = db.query(UsuarioModel).filter(UsuarioModel.email == email, UsuarioModel.ativo.is_(True)).first()
    if not user:
        raise credentials_exception
    return user


def require_roles(*allowed: str):
    def dependency(user: UsuarioModel = Depends(get_current_user)) -> UsuarioModel:
        if user.perfil not in allowed:
            raise HTTPException(status_code=403, detail='Acesso negado para este perfil')
        return user

    return dependency

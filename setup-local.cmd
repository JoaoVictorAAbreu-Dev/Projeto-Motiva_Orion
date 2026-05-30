@echo off
setlocal

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"

echo [Motiva ORION] Preparando ambiente...

if not exist "%BACKEND%\app\main.py" (
  echo [ERRO] Pasta backend nao encontrada em "%BACKEND%".
  exit /b 1
)

if not exist "%FRONTEND%\package.json" (
  echo [ERRO] Pasta frontend nao encontrada em "%FRONTEND%".
  exit /b 1
)

where python >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Python nao encontrado no PATH.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERRO] npm nao encontrado no PATH.
  exit /b 1
)

if not exist "%BACKEND%\.venv\Scripts\python.exe" (
  echo [Backend] Criando venv...
  pushd "%BACKEND%"
  python -m venv .venv
  popd
)

echo [Backend] Instalando dependencias...
pushd "%BACKEND%"
call ".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 (
  popd
  echo [ERRO] Falha ao instalar dependencias do backend.
  exit /b 1
)
popd

echo [Frontend] Instalando dependencias...
pushd "%FRONTEND%"
call npm install
if errorlevel 1 (
  popd
  echo [ERRO] Falha ao instalar dependencias do frontend.
  exit /b 1
)
popd

echo [OK] Ambiente pronto.
endlocal

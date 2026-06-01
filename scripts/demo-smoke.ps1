param(
  [string]$BackendUrl = "http://127.0.0.1:8000",
  [string]$Email = "admin@motiva-orion.local",
  [string]$Password = "orion123"
)

$ErrorActionPreference = "Stop"

function Write-Step([string]$message) {
  Write-Host "[ORION-DEMO] $message" -ForegroundColor Cyan
}

Write-Step "Validando health check..."
$health = Invoke-RestMethod -Uri "$BackendUrl/health" -Method Get
if (-not $health.status) { throw "Health check invalido." }

Write-Step "Autenticando..."
$body = @{
  username = $Email
  password = $Password
} 
$tokenResponse = Invoke-RestMethod -Uri "$BackendUrl/api/v1/auth/login" -Method Post -Body $body -ContentType "application/x-www-form-urlencoded"
if (-not $tokenResponse.access_token) { throw "Falha ao obter token JWT." }
$token = $tokenResponse.access_token
$headers = @{ Authorization = "Bearer $token" }

Write-Step "Consultando dashboard..."
$dashboard = Invoke-RestMethod -Uri "$BackendUrl/api/v1/dashboard" -Method Get -Headers $headers

Write-Step "Consultando trechos criticos..."
$criticos = Invoke-RestMethod -Uri "$BackendUrl/api/v1/trechos/criticos" -Method Get -Headers $headers

Write-Step "Gerando plano semanal..."
$plano = Invoke-RestMethod -Uri "$BackendUrl/api/v1/plano-semanal/gerar" -Method Post -Headers $headers

Write-Host ""
Write-Host "=== ORION DEMO CHECK ===" -ForegroundColor Green
Write-Host ("Trechos monitorados : {0}" -f $dashboard.total_trechos)
Write-Host ("Trechos criticos    : {0}" -f $dashboard.trechos_criticos)
Write-Host ("Missoes planejadas  : {0}" -f $dashboard.missoes_planejadas)
Write-Host ("IRO medio           : {0}" -f $dashboard.indice_medio_risco)
Write-Host ("Criticos retornados : {0}" -f $criticos.Count)
Write-Host ("Plano semanal       : {0} missoes / custo R$ {1}" -f $plano.total_missoes, $plano.custo_total)
Write-Host "Status              : PRONTO PARA DEMONSTRACAO" -ForegroundColor Green

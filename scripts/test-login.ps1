# Test login against the real NestJS backend
$url = "http://localhost:3001/api/v1/auth/login"
$body = @{
    username = "superadmin"
    password = "change-me-secure-password"
} | ConvertTo-Json

Write-Host "POST $url"
Write-Host "Body: $body"
Write-Host "---"

try {
    $response = Invoke-WebRequest -Uri $url -Method POST -ContentType "application/json" -Body $body -TimeoutSec 10 -ErrorAction Stop
    Write-Host "Status: $($response.StatusCode) $($response.StatusDescription)"
    Write-Host "Body: $($response.Content)"
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $body = $reader.ReadToEnd()
    Write-Host "Body: $body"
}

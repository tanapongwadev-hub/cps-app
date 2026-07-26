# Verbose login test
$url = "http://localhost:3001/api/v1/auth/login"
$body = '{"username":"superadmin","password":"change-me-secure-password"}'

Write-Host "POST $url"
Write-Host "---"

try {
    $response = Invoke-WebRequest -Uri $url -Method POST -ContentType "application/json" -Body $body -TimeoutSec 10 -ErrorAction Stop
    Write-Host "SUCCESS"
    Write-Host "Status: $($response.StatusCode)"
    Write-Host "Headers: $($response.Headers | ConvertTo-Json)"
    Write-Host "Body: $($response.Content)"
} catch {
    Write-Host "FAILED"
    Write-Host "Exception type: $($_.Exception.GetType().FullName)"
    Write-Host "Exception message: $($_.Exception.Message)"
    if ($_.Exception.InnerException) {
        Write-Host "Inner: $($_.Exception.InnerException.Message)"
    }
    if ($_.Exception.Response) {
        Write-Host "Response status: $($_.Exception.Response.StatusCode.value__)"
    } else {
        Write-Host "No response object - likely connection refused / DNS / timeout"
    }
}

# Quick backend reachability check
$url = "http://localhost:3001/api/v1/health"
try {
    $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "REACHABLE: $($response.StatusCode) $($response.StatusDescription)"
    Write-Host "Body: $($response.Content)"
} catch {
    Write-Host "NOT REACHABLE: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    }
}

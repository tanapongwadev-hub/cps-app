$ErrorActionPreference = 'Stop'
$conn = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($conn) {
    Write-Host ('Killing PID: ' + $conn.OwningProcess)
    Stop-Process -Id $conn.OwningProcess -Force
    Start-Sleep -Seconds 2
}
$conn2 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($conn2) {
    Write-Host ('Still running on PID: ' + $conn2.OwningProcess)
} else {
    Write-Host 'Port 3001 is free'
}

$ErrorActionPreference = 'Stop'
$body = @{username = 'superadmin'; password = 'change-me-secure-password'} | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Uri 'http://localhost:3001/api/v1/auth/login' -Method POST -ContentType 'application/json' -Body $body -TimeoutSec 10
    Write-Host '=== LOGIN RESPONSE ==='
    Write-Host ('success: ' + $response.success)
    Write-Host ('user: ' + $response.data.user.username)
    Write-Host ('isSuperAdmin: ' + $response.data.user.isSuperAdmin)
    Write-Host '--- accessControl.menus ---'
    $menus = $response.data.accessControl.menus
    Write-Host ('Total menus: ' + $menus.Count)
    foreach ($m in $menus) {
        Write-Host ('  - ' + $m.code + ' (path=' + $m.path + ')')
    }
    Write-Host '--- accessControl.permissions (Products/BOMs only) ---'
    $perms = $response.data.accessControl.permissions | Where-Object { $_ -match '^(PRODUCTS|BOMS)_' }
    Write-Host ('Products/BOMs permissions: ' + ($perms -join ', '))
} catch {
    Write-Host ('Error: ' + $_.Exception.Message)
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        Write-Host ('Body: ' + $reader.ReadToEnd())
    }
}

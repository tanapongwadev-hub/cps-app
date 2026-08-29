$ErrorActionPreference = 'Stop'

# Step 1: Login
$loginBody = @{username = 'superadmin'; password = 'change-me-secure-password'} | ConvertTo-Json
$loginResp = Invoke-RestMethod -Uri 'http://localhost:3001/api/v1/auth/login' -Method POST -ContentType 'application/json' -Body $loginBody -TimeoutSec 10
$token = $loginResp.data.authentication.accessToken
Write-Host ('Logged in. Token (first 50): ' + $token.Substring(0, 50) + '...')

# Step 2: GET /products with token
$headers = @{Authorization = 'Bearer ' + $token; 'Content-Type' = 'application/json'}
Write-Host ''
Write-Host '=== GET /products ==='
try {
    $productsResp = Invoke-RestMethod -Uri 'http://localhost:3001/api/v1/products' -Method GET -Headers $headers -TimeoutSec 10
    Write-Host ('Total products: ' + $productsResp.data.meta.totalItems)
    foreach ($p in $productsResp.data.items) {
        Write-Host ('  - ' + $p.code + ' | ' + $p.nameTh + ' | active=' + $p.isActive)
    }
} catch {
    Write-Host ('Error: ' + $_.Exception.Message)
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        Write-Host ('Body: ' + $reader.ReadToEnd())
    }
}

# Step 3: GET /products/lookups
Write-Host ''
Write-Host '=== GET /products/lookups ==='
try {
    $lookupsResp = Invoke-RestMethod -Uri 'http://localhost:3001/api/v1/products/lookups' -Method GET -Headers $headers -TimeoutSec 10
    Write-Host ('Categories: ' + $lookupsResp.data.categories.Count)
    Write-Host ('Units: ' + $lookupsResp.data.units.Count)
} catch {
    Write-Host ('Error: ' + $_.Exception.Message)
}

# Step 4: GET /boms/product/1
Write-Host ''
Write-Host '=== GET /boms/product/1 ==='
try {
    $bomsResp = Invoke-RestMethod -Uri 'http://localhost:3001/api/v1/boms/product/1' -Method GET -Headers $headers -TimeoutSec 10
    Write-Host ('BOMs for product 1: ' + $bomsResp.data.Count)
} catch {
    Write-Host ('Error: ' + $_.Exception.Message)
}

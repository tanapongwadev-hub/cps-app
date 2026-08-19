$ErrorActionPreference = 'Stop'
$base = "D:\project-cps\New\cps-app"
$src = Join-Path $base "src"
$deleted = New-Object System.Collections.ArrayList

# Test files in src (not node_modules)
Get-ChildItem -Path $src -Recurse -Include "*.test.ts","*.test.tsx","*.spec.ts" -File | Where-Object { $_.FullName -notlike "*node_modules*" } | ForEach-Object {
    $rel = $_.FullName.Replace($base, "")
    Remove-Item $_.FullName -Force
    [void]$deleted.Add($rel)
}

# HTML preview files at root
Get-ChildItem -Path $base -Include "*.html" -File | ForEach-Object {
    $rel = $_.FullName.Replace($base, "")
    Remove-Item $_.FullName -Force
    [void]$deleted.Add($rel)
}

# Log files at root
Get-ChildItem -Path $base -Include "*.log" -File | ForEach-Object {
    $rel = $_.FullName.Replace($base, "")
    Remove-Item $_.FullName -Force
    [void]$deleted.Add($rel)
}

# Scripts folder
$scripts = Join-Path $base "scripts"
if (Test-Path $scripts) {
    Remove-Item $scripts -Recurse -Force
    [void]$deleted.Add("\scripts\")
}

Write-Host "Deleted $($deleted.Count) items:"
$deleted | ForEach-Object { Write-Host "  $_" }

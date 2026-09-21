$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$tmpDir = "C:\Users\ITPM2\AppData\Local\Temp\edge-badge-$(Get-Random)"
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null

$bps = @(
    @{ name = "1920"; w = 1920; h = 850 },
    @{ name = "1440"; w = 1440; h = 850 },
    @{ name = "768";  w = 768;  h = 1200 },
    @{ name = "375";  w = 375;  h = 1100 }
)

foreach ($b in $bps) {
    $tempFile = "$tmpDir\badge-$($b.name).png"
    if (Test-Path $tempFile) { Remove-Item $tempFile -Force }
    $dest = "d:\WebTSF\thai-son-foods\public\badge-$($b.name).png"
    Write-Host "Capturing $($b.name)..."
    & "$edge" --headless=new --disable-gpu --user-data-dir="$tmpDir" --window-size="$($b.w),$($b.h)" --virtual-time-budget=2000 --screenshot="$tempFile" http://localhost:3000/badge-test
    
    $waited = 0
    while (-not (Test-Path $tempFile) -and $waited -lt 10) {
        Start-Sleep -Milliseconds 500
        $waited += 0.5
    }
    if (Test-Path $tempFile) {
        Move-Item -Path $tempFile -Destination $dest -Force
        Write-Host "SUCCESS for $($b.name): $(Get-Item $dest | Select-Object -ExpandProperty Length) bytes"
    } else {
        Write-Host "FAILED for $($b.name)"
    }
}

Remove-Item -Path $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "All done!"

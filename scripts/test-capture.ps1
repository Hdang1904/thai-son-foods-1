$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$tmpDir = "C:\Users\ITPM2\AppData\Local\Temp\edge-test-$([System.Guid]::NewGuid().ToString().Substring(0,8))"
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null

$dest = "d:\WebTSF\thai-son-foods\public\test-capture.png"
if (Test-Path $dest) { Remove-Item $dest -Force }

# Launch Edge with remote debugging to inspect DOM and styles
$proc = Start-Process -FilePath $edge -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9222",
    "--user-data-dir=$tmpDir",
    "http://localhost:3000/badge-test"
) -PassThru

Start-Sleep -Seconds 3

# Use Node to connect to CDP, inspect the badge element, and take screenshot
node -e @"
const http = require('http');
http.get('http://localhost:9222/json', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const list = JSON.parse(data);
    const page = list.find(p => p.type === 'page');
    if (!page) { console.log('No page found'); return; }
    console.log('Found page WebSocket:', page.webSocketDebuggerUrl);
    
    const WebSocket = require('net');
    // Using simple CDP via fetch/Evaluate
    // We can also use curl/fetch to /json/protocol
  });
});
"@

Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
Remove-Item -Path $tmpDir -Recurse -Force -ErrorAction SilentlyContinue

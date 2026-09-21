const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.join('C:\\Users\\ITPM2\\AppData\\Local\\Temp', 'edge-cdp-' + Math.random().toString(36).substring(2));

function sendCDP(ws, method, params = {}, id = 1) {
  return new Promise((resolve, reject) => {
    const messageHandler = (event) => {
      const res = JSON.parse(event.data);
      if (res.id === id) {
        ws.removeEventListener('message', messageHandler);
        if (res.error) reject(res.error);
        else resolve(res.result);
      }
    };
    ws.addEventListener('message', messageHandler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function run() {
  fs.mkdirSync(userDataDir, { recursive: true });
  const port = Math.floor(9300 + Math.random() * 500);
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ], { detached: false });

  await new Promise(r => setTimeout(r, 1500));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json`);
    const pages = await listRes.json();
    const page = pages.find(p => p.type === 'page');
    if (!page) throw new Error('No page found');

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    console.log('Connected to CDP');
    let id = 1;

    // Enable console and page
    await sendCDP(ws, 'Console.enable', {}, id++);
    await sendCDP(ws, 'Page.enable', {}, id++);

    ws.addEventListener('message', (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.method === 'Console.messageAdded') {
        console.log('Browser Console:', msg.params.message.text);
      }
    });

    const viewports = [
      { name: '1920', width: 1920, height: 900 },
      { name: '1440', width: 1440, height: 900 },
      { name: '768',  width: 768,  height: 1200 },
      { name: '375',  width: 375,  height: 1000 }
    ];

    for (const vp of viewports) {
      console.log(`Setting viewport: ${vp.name} (${vp.width}x${vp.height})`);
      await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width < 600
      }, id++);

      await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/' }, id++);
      await new Promise(r => setTimeout(r, 2000));

      // Scroll to bottom rows of #san-pham with offset
      await sendCDP(ws, 'Runtime.evaluate', {
        expression: `(() => {
          const cards = document.querySelectorAll('#san-pham article');
          if (cards.length > 8) {
            const top = cards[8].getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({ top, behavior: 'instant' });
          }
        })()`
      }, id++);
      await new Promise(r => setTimeout(r, 1500));

      const capture = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' }, id++);
      const outPath = path.join('d:\\WebTSF\\thai-son-foods\\public', `products-bottom-${vp.name}.png`);
      fs.writeFileSync(outPath, Buffer.from(capture.data, 'base64'));
      console.log(`Saved screenshot: ${outPath}`);
    }

    ws.close();
  } finally {
    edgeProc.kill();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

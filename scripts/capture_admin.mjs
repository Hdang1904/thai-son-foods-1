import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'edge-admin2-' + Math.random().toString(36).substring(2));
const artifactDir = 'C:\\Users\\hotro3\\.gemini\\antigravity-ide\\brain\\cff80c9c-3f67-40df-a78e-a47a93eec6fd';

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
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let id = 1;
    await sendCDP(ws, 'Page.enable', {}, id++);
    await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    }, id++);

    await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/admin' }, id++);
    await new Promise(r => setTimeout(r, 2500));

    // 1. Click 'Sản phẩm' tab in sidebar
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `(() => {
        const sidebar = document.querySelector('aside');
        if (!sidebar) return;
        const btns = Array.from(sidebar.querySelectorAll('button'));
        const prodBtn = btns.find(b => b.textContent && b.textContent.includes('Sản phẩm'));
        if (prodBtn) prodBtn.click();
      })()`
    }, id++);
    await new Promise(r => setTimeout(r, 1500));

    let capture = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' }, id++);
    let outPath = path.join(artifactDir, 'admin_products.png');
    fs.writeFileSync(outPath, Buffer.from(capture.data, 'base64'));
    console.log(`Saved screenshot: ${outPath}`);

    // 2. Click 'Đơn hàng' tab, then click first 'Chi tiết' button
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `(() => {
        const sidebar = document.querySelector('aside');
        if (!sidebar) return;
        const btns = Array.from(sidebar.querySelectorAll('button'));
        const orderBtn = btns.find(b => b.textContent && b.textContent.includes('Đơn hàng'));
        if (orderBtn) orderBtn.click();
      })()`
    }, id++);
    await new Promise(r => setTimeout(r, 1000));

    // Open detail modal
    await sendCDP(ws, 'Runtime.evaluate', {
      expression: `(() => {
        const detailBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent && b.textContent.includes('Chi tiết'));
        if (detailBtns.length > 0) detailBtns[0].click();
      })()`
    }, id++);
    await new Promise(r => setTimeout(r, 1500));

    capture = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' }, id++);
    outPath = path.join(artifactDir, 'admin_order_modal.png');
    fs.writeFileSync(outPath, Buffer.from(capture.data, 'base64'));
    console.log(`Saved screenshot: ${outPath}`);

    ws.close();
  } finally {
    edgeProc.kill();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

run().catch(console.error);

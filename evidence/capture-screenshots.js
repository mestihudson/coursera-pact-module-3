const { chromium } = require('playwright');
const path = require('path');

const BASE = process.env.PACT_BROKER_BASE_URL || 'http://localhost:9293';
const OUT = path.resolve(__dirname, '..', 'evidence');

const SHOTS = [
  { file: '01-broker-dashboard.png', url: `${BASE}/` },
  { file: '02-pact-v1.png', url: `${BASE}/pacts/provider/OrdersProvider/consumer/OrdersConsumer/version/1.0.0` },
  { file: '03-pact-v2.png', url: `${BASE}/pacts/provider/OrdersProvider/consumer/OrdersConsumer/version/2.0.0` },
  { file: '04-async-pact.png', url: `${BASE}/pacts/provider/OrdersProvider/consumer/ShippingService/version/1.0.0` },
  { file: '06-provider-pacticipant.png', url: `${BASE}/pacticipants/OrdersProvider` },
];

(async () => {
  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  for (const shot of SHOTS) {
    await page.goto(shot.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, shot.file), fullPage: true });
    console.log('saved', shot.file);
  }

  await browser.close();
})();

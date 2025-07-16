const fs = require('fs');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const VOTE_URL = 'https://top.gg/bot/282859044593598464/vote';
const CONCURRENCY = 5;
const invalidTokens = [];

async function voteWithToken(token, index) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    await page.goto('https://discord.com/channels/@me', { waitUntil: 'networkidle2' });
    await page.evaluate(t => window.localStorage.setItem('token', `"${t}"`), token);
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForTimeout(5000);

    await page.goto(VOTE_URL, { waitUntil: 'networkidle2' });

    const loginBtn = await page.$x("//button[contains(., 'Login')]");
    if (loginBtn[0]) await loginBtn[0].click();

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    const [authorizeBtn] = await page.$x("//button[contains(., 'Authorize')]");
    if (authorizeBtn) await authorizeBtn.click();

    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await page.waitForTimeout(12000);

    const [voteBtn] = await page.$x("//button[contains(., 'Vote')]");
    if (voteBtn) await voteBtn.click();

    await browser.close();
  } catch (err) {
    invalidTokens.push(token);
  }
}

async function startVoting() {
  console.log('🔃 Starting token voting...');
  const tokens = fs.readFileSync('tokens.txt', 'utf-8')
    .split('\n').map(t => t.trim()).filter(Boolean);

  let idx = 0;
  async function worker() {
    while (idx < tokens.length) {
      const i = ++idx;
      const token = tokens[i - 1];
      console.log(`▶️ Running task #${i}`);
      await voteWithToken(token, i);
    }
  }

  await Promise.all(Array(CONCURRENCY).fill().map(() => worker()));
  console.log('✅ All tokens finished.');

  if (invalidTokens.length) {
    fs.writeFileSync('invalidtokens.txt', invalidTokens.join('\n'));
    console.log(`⚠️ ${invalidTokens.length} invalid tokens saved to invalidtokens.txt`);
  }
}

startVoting();

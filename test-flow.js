import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/e6289d33-ff5b-4d9f-b6de-a21ecd590388';
const BACKEND_LOG = `${ARTIFACT_DIR}/.system_generated/tasks/task-121.log`;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getLatestOTPFromLog(logContentBefore) {
  try {
    const content = fs.readFileSync(BACKEND_LOG, 'utf8');
    // Chỉ đọc các dòng mới sau khi đăng nhập
    const newContent = content.slice(logContentBefore);
    const lines = newContent.split('\n');
    let lastOTP = null;
    for (const line of lines) {
      const m = line.match(/🔐 OTP Code:\s*(\d{6})/);
      if (m) lastOTP = m[1];
    }
    return lastOTP;
  } catch {
    return null;
  }
}

(async () => {
  console.log('🚀 Khởi chạy test suite toàn diện...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // ===================================================
    // PHẦN 1: Chụp ảnh màn hình OTP
    // ===================================================
    console.log('\n═══ PHẦN 1: OTP Screen Screenshots ═══');

    // Ghi nhớ độ dài log trước khi đăng nhập
    const logLenBefore = fs.existsSync(BACKEND_LOG) ? fs.readFileSync(BACKEND_LOG, 'utf8').length : 0;

    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    await delay(1500);

    // Chụp Login Light Mode
    const ss01 = path.join(ARTIFACT_DIR, 'ss-01-login-light.png');
    await page.screenshot({ path: ss01 });
    console.log('📸 Login Light:', ss01);

    // Nhập thông tin đăng nhập
    await page.focus('input[name="email"]');
    await page.keyboard.type('testadmin@ptit.test', { delay: 50 });
    await page.focus('input[name="password"]');
    await page.keyboard.type('Test@123456', { delay: 50 });
    await delay(500);
    await page.click('button[type="submit"]');

    // Đợi OTP screen
    await page.waitForSelector('input[inputmode="numeric"]', { timeout: 12000 });
    await delay(2500); // Đợi log được ghi

    const ss02 = path.join(ARTIFACT_DIR, 'ss-02-otp-dark.png');
    await page.screenshot({ path: ss02 });
    console.log('📸 OTP Screen (Dark):', ss02);

    // Lấy OTP
    const latestOTP = getLatestOTPFromLog(logLenBefore);
    if (!latestOTP) throw new Error('Không lấy được OTP từ log!');
    console.log('🔑 OTP:', latestOTP);

    // Nhập OTP — dùng evaluate để set value trực tiếp
    const inputs = await page.$$('input[inputmode="numeric"]');
    for (let i = 0; i < 6; i++) {
      await inputs[i].click({ clickCount: 3 });
      await inputs[i].focus();
      await inputs[i].type(latestOTP[i], { delay: 200 });
      await delay(100);
    }

    await delay(500);
    const ss03 = path.join(ARTIFACT_DIR, 'ss-03-otp-filled.png');
    await page.screenshot({ path: ss03 });
    console.log('📸 OTP Filled:', ss03);

    // Submit OTP
    await page.click('button[type="submit"]');
    await delay(4000);
    
    const currentUrl = page.url();
    console.log('🔗 Current URL after OTP submit:', currentUrl);

    // ===================================================
    // PHẦN 2: Dashboard - Chụp bằng cách inject localStorage
    // ===================================================
    console.log('\n═══ PHẦN 2: Dashboard Screenshots ═══');

    // Nếu vẫn ở OTP screen, thử trực tiếp navigate và set auth state
    if (currentUrl.includes('login') || currentUrl.includes('otp')) {
      console.log('⚠️ Chưa đăng nhập qua OTP — thử inject auth state để chụp ảnh Dashboard...');
      
      // Get auth token từ localStorage nếu có từ lần trước
      const currentState = await page.evaluate(() => {
        return {
          token: localStorage.getItem('tkd_token'),
          user: localStorage.getItem('tkd_user')
        };
      });
      console.log('LocalStorage state:', currentState);
    }

    // Navigate đến Dashboard để chụp ảnh (kể cả chưa login — sẽ redirect về login)
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    await delay(2000);

    const ss04 = path.join(ARTIFACT_DIR, 'ss-04-dashboard.png');
    await page.screenshot({ path: ss04 });
    console.log('📸 Dashboard:', ss04);

    // Chụp scroll xuống
    await page.evaluate(() => window.scrollTo({ top: 500 }));
    await delay(1000);
    const ss05 = path.join(ARTIFACT_DIR, 'ss-05-dashboard-scroll.png');
    await page.screenshot({ path: ss05 });
    console.log('📸 Dashboard Scrolled:', ss05);

    // ===================================================
    // PHẦN 3: Toggle Dark Mode
    // ===================================================
    console.log('\n═══ PHẦN 3: Dark Mode Toggle ═══');

    // Tìm nút theme toggle (button với Sun hoặc Moon icon)
    await page.evaluate(() => window.scrollTo({ top: 0 }));
    await delay(500);

    // Tìm theo SVG trong button (vì title có thể khác)
    const toggled = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        if (btn.title && (btn.title.includes('tối') || btn.title.includes('sáng') || btn.title.includes('dark') || btn.title.includes('light'))) {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (toggled) {
      console.log('✅ Đã toggle Dark/Light Mode!');
      await delay(1500);
      const ss06 = path.join(ARTIFACT_DIR, 'ss-06-after-toggle.png');
      await page.screenshot({ path: ss06 });
      console.log('📸 After Toggle:', ss06);
    } else {
      console.log('⚠️ Không tìm thấy nút toggle.');
    }

    // ===================================================
    // PHẦN 4: Chụp Finance page
    // ===================================================
    console.log('\n═══ PHẦN 4: Finance Page ═══');
    await page.goto('http://localhost:5173/finance', { waitUntil: 'networkidle2' });
    await delay(2000);
    const ss07 = path.join(ARTIFACT_DIR, 'ss-07-finance.png');
    await page.screenshot({ path: ss07 });
    console.log('📸 Finance:', ss07);

    console.log('\n🎉 Hoàn tất!');

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    const errSS = path.join(ARTIFACT_DIR, 'ss-error.png');
    try { await page.screenshot({ path: errSS }); } catch {}
  } finally {
    await delay(2000);
    await browser.close();
  }
})();

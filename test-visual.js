import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/Admin/.gemini/antigravity/brain/e6289d33-ff5b-4d9f-b6de-a21ecd590388';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('🚀 Khởi chạy Visual Test Suite (Member Login — No OTP)...\n');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    // ══════════════════════════════════════
    // 1. LOGIN - Light Mode (clear theme cache)
    // ══════════════════════════════════════
    console.log('[1/10] Chụp Login page - Light Mode...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
    // Force Light Mode bằng cách set localStorage TRƯỚC khi React hydrate
    await page.evaluate(() => {
      localStorage.setItem('tkd_dark_mode', 'false');
      document.documentElement.classList.remove('dark');
    });
    await delay(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ui-01-login-light.png') });

    // ══════════════════════════════════════
    // 2. ĐĂNG NHẬP với Regular Member (no OTP)
    // ══════════════════════════════════════
    console.log('[2/10] Đăng nhập Member...');
    await page.focus('input[name="email"]');
    await page.keyboard.type('testmember@ptit.test', { delay: 40 });
    await page.focus('input[name="password"]');
    await page.keyboard.type('Member@123', { delay: 40 });
    await delay(400);
    await page.click('button[type="submit"]');

    // Đợi navigate đến Dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    
    // Ensure Light Mode after login by setting and reloading
    await page.evaluate(() => {
      localStorage.setItem('tkd_dark_mode', 'false');
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await delay(1500);

    console.log('  ✅ URL:', page.url());

    // ══════════════════════════════════════
    // 3. DASHBOARD - Light Mode (top)
    // ══════════════════════════════════════
    console.log('[3/10] Dashboard Light Mode - Hero section...');
    await page.evaluate(() => window.scrollTo({ top: 0 }));
    await delay(800);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ui-02-dashboard-light-top.png') });

    // ══════════════════════════════════════
    // 4. DASHBOARD - Light Mode (cards)
    // ══════════════════════════════════════
    console.log('[4/10] Dashboard Light Mode - Cards section...');
    await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
    await delay(1200);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ui-03-dashboard-light-cards.png') });

    // Mở FreePaymentModal trong Light Mode
    console.log('  👉 Mở FreePaymentModal (Light Mode)...');
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      const freepay = btns.find(b => b.textContent.includes('Nộp tiền / Phí'));
      if (freepay) freepay.click();
    });
    await delay(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ui-03b-freepay-modal-light.png') });
    // Đóng modal
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('form button')];
      const cancel = btns.find(b => b.textContent.includes('Hủy'));
      if (cancel) cancel.click();
    });
    await delay(600);

    // ══════════════════════════════════════
    // 5. DASHBOARD - Light Mode (footer)
    // ══════════════════════════════════════
    console.log('[5/10] Dashboard Light Mode - Footer...');
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
    await delay(1500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ui-04-dashboard-light-footer.png') });

    // ══════════════════════════════════════
    // 6. BẬT DARK MODE (set localStorage + reload)
    // ══════════════════════════════════════
    console.log('[6/10] Toggle Dark Mode (via localStorage + reload)...');
    await page.evaluate(() => {
      localStorage.setItem('tkd_dark_mode', 'true');
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await delay(1500);
    console.log('  ✅ Dark Mode bật!');

    // ══════════════════════════════════════
    // 7. DASHBOARD - Dark Mode (top)
    // ══════════════════════════════════════
    console.log('[7/10] Dashboard Dark Mode - Hero section...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ui-05-dashboard-dark-top.png') });

    // ══════════════════════════════════════
    // 8. DASHBOARD - Dark Mode (cards)
    // ══════════════════════════════════════
    console.log('[8/10] Dashboard Dark Mode - Cards...');
    await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'smooth' }));
    await delay(1200);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ui-06-dashboard-dark-cards.png') });

    // Mở FreePaymentModal trong Dark Mode
    console.log('  👉 Mở FreePaymentModal (Dark Mode)...');
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      const freepay = btns.find(b => b.textContent.includes('Nộp tiền / Phí'));
      if (freepay) freepay.click();
    });
    await delay(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ui-06b-freepay-modal-dark.png') });
    // Đóng modal
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('form button')];
      const cancel = btns.find(b => b.textContent.includes('Hủy'));
      if (cancel) cancel.click();
    });
    await delay(600);

    // ══════════════════════════════════════
    // 9. TRANG FINANCE - Dark Mode
    // ══════════════════════════════════════
    console.log('[9/10] Finance Page - Dark Mode...');
    await page.goto('http://localhost:5173/finance', { waitUntil: 'networkidle2' });
    await delay(2000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ui-07-finance-dark.png') });

    // ══════════════════════════════════════
    // 10. PROFILE PAGE - Dark Mode
    // ══════════════════════════════════════
    console.log('[10/10] Profile Page - Dark Mode...');
    await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle2' });
    await delay(1500);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ui-08-profile-dark.png') });

    // Cuộn xuống phần tab nợ học phí
    console.log('  👉 Cuộn xuống và xem Khoản nợ (Dark Mode)...');
    await page.evaluate(() => window.scrollTo({ top: 400, behavior: 'smooth' }));
    await delay(800);
    // Click tab "Khoản nợ"
    await page.evaluate(() => {
      const tabs = [...document.querySelectorAll('button')];
      const debtTab = tabs.find(t => t.textContent.includes('Khoản nợ'));
      if (debtTab) debtTab.click();
    });
    await delay(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ui-08a-profile-dark-debt.png') });

    // Click tab "Đã thanh toán"
    console.log('  👉 Xem lịch sử Đã thanh toán (Dark Mode)...');
    await page.evaluate(() => {
      const tabs = [...document.querySelectorAll('button')];
      const paidTab = tabs.find(t => t.textContent.includes('Đã thanh toán'));
      if (paidTab) paidTab.click();
    });
    await delay(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ui-08b-profile-dark-paid.png') });

    // Switch về Light Mode và chụp Profile
    console.log('  👉 Chuyển sang Light Mode và xem Khoản nợ...');
    await page.evaluate(() => {
      const allBtns = [...document.querySelectorAll('button')];
      for (const btn of allBtns) {
        const t = btn.title || btn.getAttribute('aria-label') || '';
        if (t.toLowerCase().includes('sáng') || t.toLowerCase().includes('light')) {
          btn.click(); return;
        }
      }
      const svgBtns = allBtns.filter(b => b.querySelector('svg'));
      if (svgBtns.length > 1) svgBtns[1].click();
    });
    await delay(1500);
    
    // Click tab "Khoản nợ" ở Light mode
    await page.evaluate(() => {
      const tabs = [...document.querySelectorAll('button')];
      const debtTab = tabs.find(t => t.textContent.includes('Khoản nợ'));
      if (debtTab) debtTab.click();
    });
    await delay(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ui-09a-profile-light-debt.png') });

    console.log('\n🎉 Hoàn thành! Tất cả screenshots đã được lưu tại:');
    console.log('   ', ARTIFACT_DIR);

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    const errSS = path.join(ARTIFACT_DIR, 'ui-error.png');
    try { await page.screenshot({ path: errSS }); } catch {}
    console.log('📸 Error screenshot:', errSS);
  } finally {
    await delay(2000);
    await browser.close();
    console.log('\n✅ Trình duyệt đã đóng.');
  }
})();

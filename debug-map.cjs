const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Capture console
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  try {
    await page.goto('http://localhost:5000', { waitUntil: 'networkidle2' });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Click "Real Estate" tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const realEstateBtn = btns.find(b => b.textContent && b.textContent.includes('Real Estate'));
      if (realEstateBtn) realEstateBtn.click();
    });

    await new Promise(r => setTimeout(r, 1000));

    // Click "Interactive Map" 
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const mapBtn = btns.find(b => b.textContent && b.textContent.includes('Interactive Map'));
      if (mapBtn) mapBtn.click();
    });

    await new Promise(r => setTimeout(r, 4000)); // give map time to load tiles
    
    // Check Leaflet DOM
    const bounds = await page.evaluate(() => {
      const leaflet = document.querySelector('.leaflet-container');
      if (!leaflet) return "No .leaflet-container found!";
      return "FOUND LEAFLET CONTAINER! H: " + leaflet.clientHeight + " W: " + leaflet.clientWidth;
    });

    console.log('DOM INSPECTION:', bounds);

  } catch (err) {
    console.error('SCRIPT ERROR:', err);
  } finally {
    await browser.close();
  }
})();

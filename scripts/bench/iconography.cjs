// Run against a local static server; Playwright must be available on NODE_PATH.
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const baseURL = process.env.BARDO_TEST_URL || 'http://127.0.0.1:8321';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
 const errors=[];
 for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce',hasTouch:true});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${baseURL}/#iconography`);
  for(const [shelf,n] of [['zhiwa-42',36],['trowa-58',53],['days-1-7',7]]){
   await page.locator(`[data-shelf="${shelf}"]`).click();
   await page.locator('.deity-tile').first().click();
   assert.equal(await page.locator('#deityViewerPosition').textContent(),`1 / ${n}`);
   await page.locator('#btnDeityPrevious').click();
   assert.equal(await page.locator('#deityViewerPosition').textContent(),`${n} / ${n}`);
   await page.keyboard.press('ArrowRight');
   assert.equal(await page.locator('#deityViewerPosition').textContent(),`1 / ${n}`);
   await page.locator('#deityViewer').dispatchEvent('touchstart',{touches:[{identifier:1,clientX:300,clientY:200}]});
   await page.locator('#deityViewer').dispatchEvent('touchend',{touches:[],changedTouches:[{identifier:1,clientX:150,clientY:205}]});
   assert.equal(await page.locator('#deityViewerPosition').textContent(),`2 / ${n}`);
   await page.locator('#deityViewer').dispatchEvent('touchstart',{touches:[{identifier:1,clientX:200,clientY:300}]});
   await page.locator('#deityViewer').dispatchEvent('touchend',{touches:[],changedTouches:[{identifier:1,clientX:180,clientY:150}]});
   assert.equal(await page.locator('#deityViewerPosition').textContent(),`2 / ${n}`);
   if(shelf==='zhiwa-42'){
    await page.screenshot({path:`/tmp/bardo-gallery-${viewport.width}.png`});
    await page.locator('#deityViewerName a').filter({hasText:'Show in text'}).last().click();
    await page.waitForSelector('.figure-passage');
    assert.equal(await page.locator('.figure-passage').getAttribute('data-deity-ref'),'zhiwa.04-dhatvishvari');
    await page.locator('.figure-passage').click();
    await page.locator('#deityViewerName a').filter({hasText:'Show in mandala'}).last().click();
    await page.waitForSelector('#art-dialog[open]');
    assert.equal(await page.locator('.map-target.selected').count(),1);
    const first=await page.locator('.map-target.selected').getAttribute('data-target');
    await page.locator('#art-next').click();
    assert.notEqual(await page.locator('.map-target.selected').getAttribute('data-target'),first);
    await page.screenshot({path:`/tmp/bardo-mandala-${viewport.width}.png`});
    await page.locator('#art-links a').filter({hasText:'Show in mandala'}).first().click();
    assert.equal(await page.locator('#art-dialog').evaluate(el=>el.open),false);
    await page.waitForFunction(()=>document.activeElement?.matches('.map-target.selected'));
    await page.locator('#layer-peaceful').uncheck();
    await page.goto(`${baseURL}/mandala/#deity=zhiwa.04-dhatvishvari`);
    await page.waitForSelector('#art-dialog[open]');
    assert.equal(await page.locator('#layer-peaceful').isChecked(),true);
    await page.locator('#art-links a').filter({hasText:'Show in text'}).last().click();
   }else{
    await page.locator('#deityViewerName a').filter({hasText:'Show in text'}).last().click();
   }
   await page.waitForSelector('.figure-passage');
   assert.equal(await page.locator('#intro').count(),0);
   await page.goto(`${baseURL}/#iconography`);
  }
  // Exact first mention in a long shared paragraph, in both reading modes.
  for(const readingMode of ['scroll','pages']){
   await page.evaluate(mode=>localStorage.setItem('bardo-os-settings',JSON.stringify({readingMode:mode,showEn:false,showBo:true,mode:'voice'})),readingMode);
   await page.goto(`${baseURL}/?qa=${readingMode}#deity=zhiwa.02-samantabhadri`);
   await page.waitForSelector('.figure-passage');
   await page.waitForTimeout(400);
   await page.screenshot({path:`/tmp/bardo-text-${viewport.width}-${readingMode}.png`});
   const bounds=await page.locator('.figure-passage').boundingBox();
   assert(bounds && bounds.x >= 0 && bounds.x < viewport.width && bounds.y >= 0 && bounds.y < viewport.height,`${readingMode} mention offscreen: ${JSON.stringify(bounds)}`);
   await page.reload();await page.waitForSelector('.figure-passage');
  }
  console.log(`PASS ${viewport.width}px: all shelves, wrap, arrows, swipes, vertical scroll, pair links, mandala highlighting, day text, reload, scroll/page modes`);
  await context.close();
 }
 const offline=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await offline.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${baseURL}/#iconography`);
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.waitForFunction(()=>navigator.serviceWorker.controller);
 await offline.setOffline(true);
 await page.goto(`${baseURL}/mandala/#deity=trowa.58-lambodara`);
 await page.waitForSelector('#art-dialog[open]');
 await page.locator('#art-next').click();
 await page.locator('#art-links a').filter({hasText:'Show in text'}).first().click();
 await page.waitForSelector('.figure-passage');
 await page.evaluate(()=>localStorage.setItem('bardo-os-settings',JSON.stringify({mode:'voice',readingMode:'pages'})));
 await page.goto(`${baseURL}/#plate=day.07-awareness-holders`);
 await page.reload();
 await page.waitForSelector('.figure-passage');
 assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('voice')),false);
 console.log('PASS: cached offline mandala → text and day-seven passage from Voice/page mode');
 await offline.close();
 assert.deepEqual(errors,[]);console.log('No browser errors');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

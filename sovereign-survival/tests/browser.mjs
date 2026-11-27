/* SOVEREIGN SURVIVAL v1.7: mastered combat powers, distinctive weapon designs, earned skins and iPhone controls */
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
for(const [name,engine,mobile] of [['desktop-chromium',chromium,false],['iphone-webkit',webkit,true]]){
 const browser=await engine.launch({headless:true});
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1366,height:880},
  isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1,reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',err=>errors.push(String(err)));
 try{
  await page.goto('http://127.0.0.1:4173/sovereign-survival/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('#startRun').waitFor({state:'visible',timeout:18000});
  assert.equal(await page.locator('#menuOverlay').isVisible(),true);
  assert.match(await page.title(),/CHARACTER ASCENSION v1\.7/);
  await page.waitForFunction(()=>document.body.dataset.realm==='sanctum',null,{timeout:10000});
  assert.equal(await page.locator('body').getAttribute('data-realm'),'sanctum');
  assert.equal(await page.locator('#recordElites').textContent(),'0');
  assert.equal(await page.locator('#recordBosses').textContent(),'0');
  assert.ok(await page.locator('#arenaCanvas').evaluate(el=>el.width>300&&el.height>300));
  // v1.1 title screen must function like a game menu instead of a tool dashboard.
  assert.equal(await page.locator('.side-column').count(),0,'No permanent tools sidebar during battle');
  assert.equal(await page.locator('.intro').count(),0,'No landing dashboard above the game');
  const viewport=await page.locator('#gameFrame').evaluate(el=>({
   height:Math.round(el.getBoundingClientRect().height),
   available:Math.round(window.innerHeight),
   width:Math.round(el.getBoundingClientRect().width)
  }));
  assert.ok(Math.abs(viewport.height-viewport.available)<4,'The battlefield must fill the visible screen');
  assert.ok(viewport.width>=380,'The arena should fill the available screen width');
  await page.locator('#menuArmory').click();
  assert.equal(await page.locator('#armoryOverlay').isVisible(),true);
  assert.equal(await page.locator('.champion-card').count(),3);
  assert.equal(await page.locator('.champion-portrait-canvas').count(),3,
   'The Armory must display actual rendered champion models');
  assert.ok(await page.locator('.champion-portrait-canvas').first().evaluate(el=>
   el.getContext('2d').getImageData(80,80,1,1).data[3]>0),
   'Champion preview should render real canvas pixels');
  assert.equal(await page.locator('.relic-card').count(),6);
  assert.equal(await page.locator('.relic-card.blueprint-locked').count(),2);
  assert.equal(await page.locator('#recordExpeditions').textContent(),'0');
  assert.equal(await page.locator('#armoryRenown').textContent(),'0');
  assert.equal(await page.locator('#championsUnlocked').textContent(),'1 / 3 UNLOCKED');
  assert.equal(await page.locator('.champion-card.selected').count(),1);
  assert.equal(await page.locator('#relicCards .armory-action').first().isDisabled(),true);
  await page.locator('#armoryOverlay .auxBack').click();
  assert.equal(await page.locator('#menuOverlay').isVisible(),true);
  await page.locator('#menuLegacy').click();
  assert.equal(await page.locator('#legacyOverlay').isVisible(),true);
  assert.equal(await page.locator('#regaliaCards .regalia-card').count(),3,
   'All three visual armor appearances should exist');
  assert.equal(await page.locator('#weaponCards .weapon-card').count(),3,
   'All three weapon cosmetic finishes must have real buttons');
  assert.equal(await page.locator('#weaponCards .weapon-card.equipped').count(),1);
  assert.equal(await page.locator('#legacyWeaponName').textContent(),'CHAMPION SIGNATURE');
  assert.equal(await page.locator('#achievementCards .achievement-card').count(),6,
   'Six fully tracked achievements should exist');
  assert.equal(await page.locator('#legacyShards').textContent(),'0');
  assert.equal(await page.locator('#legacyArmorLabel').textContent(),'WARBOUND ARMOR');
  assert.equal(await page.locator('#legacyChampionName').textContent(),'VOID WARDEN');
  const canvasVisible=await page.locator('#legacyChampionCanvas').evaluate(el=>{
   const ctx=el.getContext('2d');
   return el.width===300&&el.height===330&&ctx.getImageData(150,170,1,1).data[3]>0;
  });
  assert.equal(canvasVisible,true,'An actual drawn armored champion must appear, not an empty avatar');
  const defaultArmorRender=await page.locator('#legacyChampionCanvas').evaluate(el=>el.toDataURL());
  assert.equal(await page.locator('#achievementCards .achievement-card.eligible').count(),0);
  await page.locator('#legacyOverlay .auxBack').click();
  assert.equal(await page.locator('#menuOverlay').isVisible(),true);
  await page.locator('#menuRecords').click();
  assert.equal(await page.locator('#recordsOverlay').isVisible(),true,'Hall of Legends opens from main menu');
  assert.equal(await page.locator('#recordRuns').textContent(),'0');
  await page.locator('#recordsOverlay .auxBack').click();
  assert.equal(await page.locator('#menuOverlay').isVisible(),true);
  await page.locator('#menuGuide').click();
  assert.equal(await page.locator('#guideOverlay').isVisible(),true,'The initiation guide opens');
  assert.ok((await page.locator('#guideOverlay').textContent()).includes('Ravagers'));
  assert.ok((await page.locator('#guideOverlay').textContent()).includes('rift'));
  await page.locator('#guideOverlay .auxBack').click();
  await page.locator('#menuSettings').click();
  assert.equal(await page.locator('#settingsOverlay').isVisible(),true);
  await page.locator('#qualityToggle').click();
  assert.ok((await page.locator('#qualityToggle').textContent()).includes('Eco'));
  await page.locator('#settingsOverlay .auxBack').click();
  assert.equal(await page.locator('#menuOverlay').isVisible(),true);
  await page.locator('#startRun').click();
  assert.equal(await page.locator('#menuOverlay').isVisible(),false);
  assert.equal(await page.locator('#waveText').textContent(),'01');
  assert.equal(await page.locator('#expeditionHud').isVisible(),true,
   'A genuine realm objective must be visible while playing');
  assert.equal(await page.locator('#expeditionName').textContent(),'WARDSTONE DEFENSE');
  assert.ok((await page.locator('#expeditionDescription').textContent()).includes('wardstone'));
  assert.equal(await page.locator('#expeditionState').textContent(),'ACTIVE');
  assert.equal(await page.locator('#bossBar').isVisible(),false);
  assert.equal(await page.locator('#riftCount').isVisible(),false,'Rift UI stays hidden before rifts exist');
  assert.equal(await page.locator('#abilityName').textContent(),'ASTRAL NOVA');
  assert.equal(await page.locator('#masteryLabel').textContent(),'MASTERY 0 / 3');
  assert.equal(await page.locator('#abilityStatus').textContent(),'READY');
  await page.waitForTimeout(550);
  assert.ok((await page.locator('#stageLabel').textContent()).includes('WAVE 1'));
  assert.ok((await page.locator('#qualityToggle').textContent()).includes('Eco'));
  if(mobile){
   assert.equal(await page.locator('#joystickZone').isVisible(),true);
   assert.equal(await page.locator('#abilityButton').isVisible(),true,
    'iPhone must expose an accessible active-ability control');
   await page.locator('#abilityButton').click();
   await page.locator('#dashButton').click();
  }else{
   await page.keyboard.press('q');
   await page.keyboard.down('d');await page.waitForTimeout(280);await page.keyboard.up('d');
   await page.keyboard.press('Shift');
  }
  await page.waitForFunction(()=>!document.querySelector('#dashText')?.textContent.includes('READY'));
   assert.equal(await page.locator('#dashButton').isDisabled(),true,'Stationary dash must activate and recharge');
   await page.waitForFunction(()=>document.querySelector('#abilityHud')?.getAttribute('aria-busy')==='true');
  assert.notEqual(await page.locator('#abilityStatus').textContent(),'READY');
  assert.equal(await page.locator('#masteryLabel').textContent(),'MASTERY 1 / 3',
   'A genuine active ability cast increases mastery progress in the game HUD');
  assert.equal(await page.locator('#abilityButton').isDisabled(),true,'Cooldown prevents double casting');
  await page.locator('#pauseButton').click();
  assert.equal(await page.locator('#pauseOverlay').isVisible(),true);
  await page.locator('#pauseWarbook').click();
  assert.equal(await page.locator('#warbookOverlay').isVisible(),true,'The in-run Codex replaces the side dashboard');
  assert.equal(await page.locator('#buildList').count(),1,'Original upgrade list is preserved in Codex');
  assert.equal(await page.locator('#evolutionList .evolution-entry').count(),3,'Three genuine evolutions are represented in Codex');
  assert.equal(await page.locator('.bestiary-entry').count(),7,'All seven enemy and boss archetypes are represented in Codex');
  assert.ok((await page.locator('#warbookOverlay').textContent()).includes('RAVAGER'));
  await page.locator('#warbookOverlay .auxBack').click();
  assert.equal(await page.locator('#pauseOverlay').isVisible(),true);
  await page.locator('#pauseSettings').click();
  assert.equal(await page.locator('#settingsOverlay').isVisible(),true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#pauseOverlay').isVisible(),true,'Escape returns from settings without resuming combat');
  await page.waitForTimeout(300);
  await page.locator('#resumeRun').click();
  assert.equal(await page.locator('#pauseOverlay').isVisible(),false);
  await page.locator('#pauseButton').click();
  await page.locator('#abandonRun').click();
  assert.equal(await page.locator('#pauseOverlay').isVisible(),false);
  assert.equal(await page.locator('#recordRuns').textContent(),'2','Starting a new run increments local record');
  await page.locator('#pauseButton').click();
  await page.locator('#retreatToMenu').click();
  assert.equal(await page.locator('#menuOverlay').isVisible(),true,'Title menu is reachable from pause');
  await page.locator('#menuRecords').click();
  assert.equal(await page.locator('#recordRuns').textContent(),'2');
  await page.locator('#recordsOverlay .auxBack').click();
  assert.equal(await page.locator('#menuOverlay').count(),1);
  // A legacy v1.1 record object must retain its original values in v1.2.
  await page.evaluate(()=>localStorage.setItem('proximus-sovereign-survival-v1',
   JSON.stringify({best:7500,bestWave:12,runs:17,kills:321})));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#menuRecords').click();
  assert.equal(await page.locator('#recordBest').textContent(),'7,500');
  assert.equal(await page.locator('#recordWave').textContent(),'12');
  assert.equal(await page.locator('#recordRuns').textContent(),'17');
  assert.equal(await page.locator('#recordKills').textContent(),'321');
  assert.equal(await page.locator('#recordElites').textContent(),'0','New values default without resetting older records');
  assert.equal(await page.locator('#recordBosses').textContent(),'0');
  assert.equal(await page.locator('#recordExpeditions').textContent(),'0','Legacy records have zero completed expeditions');
  assert.equal(await page.locator('#recordRenown').textContent(),'0');
  await page.locator('#recordsOverlay .auxBack').click();
  await page.locator('#menuLegacy').click();
  assert.equal(await page.locator('#achievementCards .achievement-card.eligible').count(),2,
   'Historical records must immediately qualify for legacy achievement claims');
  await page.locator('#achievementCards .achievement-card.eligible button').first().click();
  await page.locator('#achievementCards .achievement-card.eligible button').first().click();
  assert.equal(await page.locator('#legacyShards').textContent(),'2');
  assert.equal(await page.locator('#legacyClaims').textContent(),'2 / 6 ACHIEVEMENTS CLAIMED');
  const eclipse=page.locator('#regaliaCards .regalia-card').nth(1);
  assert.equal(await eclipse.locator('button').isEnabled(),true);
  await eclipse.locator('button').click();
  assert.equal(await page.locator('#legacyShards').textContent(),'0');
  await page.locator('#regaliaCards .regalia-card').nth(1).locator('button').click();
  assert.equal(await page.locator('#legacyArmorLabel').textContent(),'ECLIPSE RAIMENT');
  assert.equal(await page.locator('#regaliaCards .regalia-card.equipped').count(),1);
  const eclipseRender=await page.locator('#legacyChampionCanvas').evaluate(el=>el.toDataURL());
  assert.notEqual(defaultArmorRender,eclipseRender,'Forged armor must visibly change actual canvas model');
  const savedLook=await page.evaluate(()=>JSON.parse(localStorage.getItem('proximus-sovereign-survival-legacy-v1')));
  assert.equal(savedLook.equippedStyle,'eclipse','Visual armor selection must persist locally');
  assert.equal(savedLook.equippedWeapon,'signature',
   'Existing Legacy data should migrate a free original weapon');
  await page.locator('#legacyOverlay .auxBack').click();
  // Use the same preserved historical records to exercise legitimate
  // expedition eligibility and an earned shard balance for the weapon forge.
  await page.evaluate(()=>{
   const recordKey='proximus-sovereign-survival-v1';
   const record=JSON.parse(localStorage.getItem(recordKey));
   record.expeditions=2;localStorage.setItem(recordKey,JSON.stringify(record));
   const legacyKey='proximus-sovereign-survival-legacy-v1';
   const saved=JSON.parse(localStorage.getItem(legacyKey));
   saved.shards=4;saved.lifetimeShards=Math.max(saved.lifetimeShards||0,4);
   localStorage.setItem(legacyKey,JSON.stringify(saved));
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#menuLegacy').click();
  assert.equal(await page.locator('#legacyArmorLabel').textContent(),'ECLIPSE RAIMENT');
  assert.equal(await page.locator('#legacyWeaponName').textContent(),'CHAMPION SIGNATURE');
  const beforeWeapon=await page.locator('#legacyChampionCanvas').evaluate(el=>el.toDataURL());
  const starforged=page.locator('#weaponCards .weapon-card').nth(1);
  assert.equal(await starforged.locator('button').isEnabled(),true);
  await starforged.locator('button').click();
  assert.equal(await page.locator('#legacyShards').textContent(),'2');
  await page.locator('#weaponCards .weapon-card').nth(1).locator('button').click();
  assert.equal(await page.locator('#legacyWeaponName').textContent(),'ASTRAL FORGED');
  assert.equal(await page.locator('#weaponCards .weapon-card.equipped').count(),1);
  const afterWeapon=await page.locator('#legacyChampionCanvas').evaluate(el=>el.toDataURL());
  assert.notEqual(beforeWeapon,afterWeapon,
   'The forged weapon must change actual canvas geometry, not only label text');
  const chosen=await page.evaluate(()=>JSON.parse(localStorage.getItem('proximus-sovereign-survival-legacy-v1')));
  assert.equal(chosen.equippedWeapon,'astral','Weapon appearance must persist separately from armor');
  assert.equal(chosen.equippedStyle,'eclipse','Forging a weapon cannot reset purchased armor');
  await page.locator('#legacyOverlay .auxBack').click();
  // Simulate a legitimate earned account in local storage, then use the real
  // Armory UI to select/unlock/forge/equip. Each action persists across reload.
  await page.evaluate(()=>{
   localStorage.setItem('proximus-sovereign-survival-armory-v1',JSON.stringify({
    version:1,renown:300,lifetimeRenown:300,champion:'warden',owned:[],equipped:[]
   }));
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#menuLegacy').click();
  assert.equal(await page.locator('#legacyArmorLabel').textContent(),'ECLIPSE RAIMENT',
   'Armor appearance and claims must persist over reload');
  assert.equal(await page.locator('#legacyWeaponName').textContent(),'ASTRAL FORGED',
   'Forged weapon appearance must persist over reload');
  assert.equal(await page.locator('#legacyClaims').textContent(),'2 / 6 ACHIEVEMENTS CLAIMED');
  await page.locator('#legacyOverlay .auxBack').click();
  await page.locator('#menuArmory').click();
  assert.equal(await page.locator('#armoryRenown').textContent(),'300');
  assert.equal(await page.locator('#championsUnlocked').textContent(),'3 / 3 UNLOCKED');
  await page.locator('.champion-card.frost .armory-action').click();
  assert.equal(await page.locator('.champion-card.frost.selected').count(),1);
  await page.locator('.relic-card').nth(0).locator('.armory-action').click(); // Nightglass, 45
  assert.equal(await page.locator('#armoryRenown').textContent(),'255');
  await page.locator('.relic-card').nth(0).locator('.armory-action').click(); // Equip
  await page.locator('.relic-card').nth(1).locator('.armory-action').click(); // Moonwell, 65
  await page.locator('.relic-card').nth(1).locator('.armory-action').click(); // Equip
  assert.equal(await page.locator('#relicSlots').textContent(),'2 / 2 EQUIPPED');
  assert.equal(await page.locator('#armoryRenown').textContent(),'190');
  assert.equal(await page.locator('.relic-card.equipped').count(),2);
  // Slot capacity prevents EQUIPPING more than two relics, not FORGING more.
  const third=page.locator('.relic-card').nth(2).locator('.armory-action');
  assert.equal(await third.isDisabled(),false,'A third relic may still be forged');
  await third.click(); // Phantom Spurs (80), now owned
  assert.equal(await page.locator('#armoryRenown').textContent(),'110');
  assert.equal(await page.locator('.relic-card').nth(2).locator('.armory-action').isDisabled(),
   true,'Third forged relic cannot be equipped until a slot is freed');
  await page.locator('#armoryOverlay .auxBack').click();
  assert.ok((await page.locator('#menuLoadout').textContent()).includes('FROST SENTINEL'));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('#menuArmory').click();
  assert.equal(await page.locator('#armoryRenown').textContent(),'110');
  assert.equal(await page.locator('.champion-card.frost.selected').count(),1);
  assert.equal(await page.locator('.relic-card.equipped').count(),2);
  await page.locator('#armoryOverlay .auxBack').click();
  await page.locator('#startRun').click();
  assert.equal(await page.locator('#healthText').textContent(),'155 / 155',
   'Frost Sentinel and Moonwell Sigil must modify actual starting HP');
  assert.equal(await page.locator('#abilityName').textContent(),'GLACIAL BULWARK');
  assert.equal(await page.locator('#abilityStatus').textContent(),'READY');
  if(mobile)await page.locator('#abilityButton').click();
  else await page.keyboard.press('q');
  await page.waitForFunction(()=>document.querySelector('#abilityHud')?.getAttribute('aria-busy')==='true');
  await page.locator('#pauseButton').click();
  await page.locator('#pauseWarbook').click();
  assert.equal(await page.locator('#codexHeroName').textContent(),'FROST SENTINEL');
  assert.ok((await page.locator('#codexRelics').textContent()).includes('Nightglass Edge'));
  assert.ok((await page.locator('#codexRelics').textContent()).includes('Moonwell Sigil'));
  assert.equal(await page.locator('#codexArmorName').textContent(),'ECLIPSE RAIMENT',
   'The actual Frost Sentinel run must inherit the previously forged armor');
  assert.equal(await page.locator('#codexWeaponName').textContent(),'ASTRAL FORGED',
   'Actual Frost Sentinel gameplay must inherit the same forged weapon');
  assert.ok((await page.locator('#codexMastery').textContent()).includes('1 / 3'),
   'Codex records the real champion ability mastery progress');
  assert.ok(await page.locator('#codexChampionCanvas').evaluate(el=>
   el.getContext('2d').getImageData(80,95,1,1).data[3]>0),
   'The Warden Codex shows the fully drawn playable armor, not only an emoji');
  assert.equal(await page.locator('#powerStat').textContent(),'22',
   'Nightglass must increase actual starting attack damage');
  assert.deepEqual(errors,[],'No client runtime exceptions');
  console.log('PASS '+name+' v1.7 mastered HUD, character-specific weapon forge, actual weapon preview, saved look in Frost combat, legacy and PWA regressions');
 }catch(e){
  await page.screenshot({path:'/tmp/sovereign-survival-'+name+'.png',fullPage:false}).catch(()=>{});
  throw new Error(name+' '+(e.stack||e.message)+'; page errors: '+errors.join(' | '));
 }finally{await context.close();await browser.close()}
}

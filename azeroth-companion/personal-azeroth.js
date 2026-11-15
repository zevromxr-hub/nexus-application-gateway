/* NEXUS | AZEROTH COMPANION v3 — optional first-party Battle.net account portal entry.
 * Browser-local public companion data remains separate and unchanged.
 */
(()=>{'use strict';
const worker='https://nexus-azeroth-api.zevromxr.workers.dev';
const main=document.querySelector('.main'),nav=document.querySelector('.nav'),foot=main?.querySelector('.footer');if(!main||!nav||!foot)return;
const btn=document.createElement('button');btn.type='button';btn.dataset.view='personal';btn.textContent='✦ My Azeroth';nav.prepend(btn);
const host=document.createElement('div');host.id='personalAzerothLink';
host.innerHTML='<section class="section" data-section="personal"><div class="wow-kicker">YOUR WORLD OF WARCRAFT ACCOUNT · OPTIONAL</div><h2>My Azeroth</h2><p class="muted">A secure read-only Battle.net account portal for your own characters and collections. Your existing public Armory, Talent Forge and Loot Hunter remain available without connecting.</p><div class="panel"><h3>Connect securely through Blizzard</h3><p class="muted">Your sign-in opens on the companion\'s Cloudflare Worker domain, not inside this GitHub Pages website. This avoids third-party login cookies being blocked by iPhone Safari. You grant Blizzard\'s <strong>wow.profile</strong> scope and can disconnect at any time.</p><div class="actions"><a class="button primary" id="paOpen" rel="noopener noreferrer" href="'+worker+'/account">OPEN SECURE MY AZEROTH PORTAL</a><a class="button" target="_blank" rel="noopener noreferrer" href="'+worker+'/account/privacy">PRIVACY &amp; SECURITY</a></div><p id="paStatus" role="status" class="hint">The account portal requires the v3 Cloudflare Worker deployment and one additional encrypted session secret.</p></div><div class="panel"><h3>What will sync?</h3><p class="muted">The signed-in portal can show Blizzard-reported account characters and collection counts (mounts and pets). Blizzard data is periodically updated, not a live feed. Personal farming attempts, weekly Vault objectives, inventory management and talent imports are still manual, and no account data is copied into the public companion automatically.</p></div></section>';
main.insertBefore(host,foot);
const params=new URLSearchParams(location.search);
const region=params.get('armory_region'),realm=params.get('armory_realm'),name=params.get('armory_name');
if(region&&realm&&name&&['us','eu','kr','tw'].includes(region)&&/^[a-z0-9-]{2,80}$/.test(realm)&&/^[a-z0-9-]{2,50}$/.test(name)){
 const form=document.getElementById('cxCharacterForm'),tab=document.querySelector('[data-view="armory"]');
 if(form&&tab){document.getElementById('cxCharacterRegion').value=region;document.getElementById('cxRealm').value=realm;document.getElementById('cxName').value=name;tab.click();form.requestSubmit()}
}
})();
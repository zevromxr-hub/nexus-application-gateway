// PROXIMUS Discord Release Announcer security, content and version regression.
import assert from 'node:assert/strict';
import {
 RELEASE_SITE,WEBHOOK_SECRET,buildDiscordPayload,checkRelease,isNewRelease,validateWebhook
} from '../scripts/release-announcer.mjs';

const version={version:'3.2.1',subtitle:'Automated Discord Release Announcer'};
const index={releases:[{version:'3.2.1'},{version:'3.2.0'}]};
const release={
 source_repository:'zevromxr-hub/nexus-application-gateway',
 version:'3.2.1',
 title:'Discord Release Announcer & Automation',
 features:[
  'GitHub automatically posts after a successful verified PROXIMUS release.',
  'A private Actions secret protects the webhook.',
  '@everyone and @here should not trigger notifications.',
  'Each new version has its own release notes and app link.'
 ]
};
assert.equal(checkRelease(version,index,release),true);
assert.throws(()=>checkRelease({version:'bad'},index,release),/Invalid application/);
assert.throws(()=>checkRelease(version,{releases:[{version:'3.2.0'}]},release),/index/);
assert.throws(()=>checkRelease(version,index,{...release,version:'3.2.0'}),/inconsistent/);
assert.throws(()=>checkRelease(version,index,{...release,source_repository:'other/repo'}),/Unexpected/);
const payload=buildDiscordPayload(version,release);
assert.equal(payload.username,'PROXIMUS | RELEASE SYSTEM');
assert.deepEqual(payload.allowed_mentions,{parse:[]});
assert.equal(payload.embeds.length,1);
const embed=payload.embeds[0];
assert.equal(embed.title,'PROXIMUS | UPDATE v3.2.1');
assert.equal(embed.url,RELEASE_SITE);
assert.ok(embed.fields.find(x=>x.name==='WHAT’S NEW')?.value.includes('GitHub automatically posts'));
assert.ok(embed.fields.find(x=>x.name==='LAUNCH APPLICATION')?.value.includes(RELEASE_SITE));
assert.match(embed.footer.text,/POWERED BY ZEVRO \| PROXIMUS/);
assert.equal(JSON.stringify(payload).includes('@everyone'),false,'Mass mention must be neutralized.');
assert.equal(JSON.stringify(payload).includes('@here'),false,'Here mention must be neutralized.');
assert.equal(isNewRelease('3.2.0','3.2.1'),true);
assert.equal(isNewRelease('3.2.1','3.2.1'),false);
assert.equal(isNewRelease('3.2.1','3.2.0'),false,'Never post an older version as a new update.');
assert.equal(isNewRelease('bad','3.2.1'),false);
assert.equal(WEBHOOK_SECRET,'DISCORD_RELEASE_WEBHOOK');
const mockToken='x'.repeat(64);
const secret='https://discord.com/api/webhooks/123456789012345678/'+mockToken;
const parsed=validateWebhook(secret);
assert.equal(parsed.hostname,'discord.com');
assert.equal(parsed.searchParams.get('wait'),'true');
for(const invalid of [
 '', 'https://example.com/api/webhooks/123456789012345678/'+mockToken,
 'http://discord.com/api/webhooks/123456789012345678/'+mockToken,
 'https://discord.com/api/webhooks/123456789012345678/bad',
 'https://discord.com/api/webhooks/123456789012345678/'+mockToken+'?x=1',
 'https://user:pass@discord.com/api/webhooks/123456789012345678/'+mockToken,
]){
 assert.throws(()=>validateWebhook(invalid),'Invalid secret must be rejected without leaking URL');
}
const huge={...release,features:Array.from({length:40},(_,i)=>('Huge feature description '+i+' ').repeat(40))};
const truncated=buildDiscordPayload(version,huge);
assert.ok(truncated.embeds[0].fields.find(x=>x.name==='WHAT’S NEW').value.length<=1024);
assert.ok(truncated.embeds[0].fields.every(x=>x.value.length<=1024));
assert.ok(!JSON.stringify(payload).includes(mockToken));
console.log('PASS automated release Discord payload: consistent version and index, sanitized mentions, rich changelog embed, safe URL handling, secret-only sender, size limits, and release-only gate.');

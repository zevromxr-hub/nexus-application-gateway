# NEXUS | AZEROTH COMPANION — v20.0.0
## SOVEREIGN PRIVATE VIDEO VAULT + COMMAND PULSE
Owner-approved additive development. November 17, 2026.
Private Vault URL: https://zevarchives.com/azeroth-companion/private-video-vault.html
Rollback branch: \`backup/azeroth-v19-before-private-vault-v20-2026-11-17\`
Physical iPhone/large video/Blizzard account verification testing: **pending**.

### SECURITY: What the user actually asked for
A password-protected video archive containing videos personally uploaded/imported. GitHub Pages is static and **does not provide a real private server storage boundary**. A JavaScript-only password modal around publicly published MP4 URLs would be insecure, so **this release does not put user videos into the public GitHub repository or CDN**.

Instead the vault implements real client-side encryption:
- Each browser/device has its own independently created password-derived vault (not a default shared password).
- The password is used with PBKDF2/SHA-256, 600,000 iterations, unique random 16-byte vault salt to derive a non-extractable AES-256-GCM key.
- A fresh random 12-byte IV per encrypted metadata record and video piece; 2 MiB source chunks reduce high-water-mark import memory.
- Filenames, private notes, favorite marks, MIME type and video content are encrypted; only ciphertext, opaque random IDs and chunk indexes are retained in IndexedDB.
- Unlock requires successful authenticated decryption of a verifier; wrong password fails. Password and key never enter localStorage or IndexedDB. No password recovery or "owner reset" backdoor is built.
- Strict \`default-src 'none'\`, \`connect-src 'none'\`, \`script-src 'self'\`, \`media-src blob:\` Content Security Policy on the Vault page; no remote scripts, telemetry, external player, analytics or video uploads.
- When locked or navigated away, the current video is paused, source cleared, object URL revoked and in-memory key reference discarded. A hidden page auto-locks after ~45 seconds unless an operation is in progress.
- Threat boundaries: Device malware, malicious code running in the same origin, someone accessing a session *while unlocked*, weak passwords or stolen plaintext exports cannot be prevented by a static web app. This is a personal encrypted archive, not a hosted multi-user streaming service.

### Playback and storage reality
Native browser decoding supports different video codecs and containers on different iPhone/PC versions. For now the supported import extension set is MP4, MOV, M4V, WebM, OGV and OGG; **accepting a file does not guarantee decoding it**. Playback reconstructs the whole selected video in temporary memory after decryption, so mobile RAM and large clips are constrained. Conservative per-file ceiling: **200 MiB on coarse-pointer devices and 512 MiB on others**; storage quotas and device available capacity are independent and may be lower.

Browser IndexedDB content can be evicted, deleted or separated between standalone iPhone Home Screen mode and Safari depending on the browser configuration. Never promise indefinite retention, seamless device sync or cloud recovery. The Vault offers \`navigator.storage.persist()\` when available as a user-initiated storage protection request. **The encrypted .nxvault backup is strongly recommended.**

### Portable private backups
- \`EXPORT ENCRYPTED VAULT\` creates one binary .nxvault archive. It contains an authenticated encrypted-config verifier, encrypted clip metadata and ciphertext video chunks. No password or decrypted clips are exported.
- Users can carry .nxvault through a private transfer or local Files storage to a separate device and restore only if that browser has **no existing vault**, then unlock with the original archive password.
- This is intentionally **not** an overwrite/merge interface: restoring over a pre-existing local vault risks destructive collisions, so v20 rejects that scenario.
- Save Protection Center's general JSON backup deliberately **does not** include private video bytes or secrets; the private encrypted .nxvault format is separate. Back up both when necessary.
- The password cannot be recovered and the archive cannot be opened without it.

### Additional Azeroth feature improvements
- Command Center now has a read-only **Continue the Adventure** pulse displaying user-saved active Atlas missions, expedition route count, manually assembled v17 session entries and Talent Forge draft count.
- The pulse links directly to the original World Atlas, Private Vault, Adventure Operations, Talent Forge and backup studio.
- Command Center search, main companion sidebar, World Atlas navigation/crossroads and Character Nexus now include a Private Video Vault entry.
- All counts from older studios represent **manually saved plans**, not official Blizzard item ownership, achievement claims, account entitlement or quest progress.

### Safety and tester checklist
1. [ ] Verify first visit can only create a password of 12+ characters, without any predefined developer/master key.
2. [ ] Upload a local tiny video clip and inspect IndexedDB: ciphertext for content **and** titles, per-item random IVs and random vault salt; no video HTTP request.
3. [ ] Lock then attempt a wrong password: video titles/player remain hidden. Unlock with original password and confirm notes and favorite labels persist.
4. [ ] Export ciphertext-only .nxvault, create an isolated browser profile, restore into empty storage, and unlock with original password.
5. [ ] Verify an existing vault cannot be silently overwritten by archive import.
6. [ ] Verify closing/locking player revokes Blob URL; pagehide clears the unlocked session.
7. [ ] Test MP4, MOV, M4V and WebM actually playing with real files on physical iPhone Safari and Windows Chrome/Edge; some codecs will require external conversion.
8. [ ] Test realistic file sizes, quotas, storage pressure, standalone PWA launch and browser restart; **browser simulators do not verify real iPhone storage behavior**.
9. [ ] Confirm Command Pulse correct reads saved Atlas routes/missions and native Forge data without modifying old localStorage keys.
10. [ ] Run both v20 source and synthetic desktop Chromium/iPhone WebKit browser checks, existing full regressions, published GitHub Pages version check and Discord release announcer.

This release **does not** set up Cloudflare R2, authenticated multi-device remote storage or public password-sharing videos. Those would require a secured Worker/R2 implementation with explicit Cloudflare account configuration and access policy.

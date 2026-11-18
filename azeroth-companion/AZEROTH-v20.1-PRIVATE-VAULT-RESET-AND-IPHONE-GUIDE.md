# NEXUS | AZEROTH v20.1.0 — PRIVATE VAULT RECOVERY
Owner-approved release: November 17, 2026.
URL: https://zevarchives.com/azeroth-companion/private-video-vault.html
Rollback: \`backup/azeroth-v20-before-vault-recovery-v20-1-2026-11-17\`.

## What happened and what cannot be done
An automatically generated password was used on iPhone but not saved. NEXUS deliberately has **no master key**, server reset, saved password or decryption backdoor. The old video bytes and titles, if imported, cannot be decrypted without the original password. Reset means deleting ONLY this browser's old encrypted Vault records and starting a *new empty vault*; it does not reset characters, app logins, maps or other companion studios.

## Safe reset on the same device/browser that originally created the vault
1. First check iPhone **Passwords** app (and any password manager) for ZevArchives.com, NEXUS, or nexus-private-video-vault. Check the exact Safari or Home Screen instance where the Vault was created: browser and standalone PWA storage may be separate.
2. Open the Private Video Vault URL from the same iPhone context. On the password page choose **Forgot Password? · Reset Options**.
3. Look at the number of encrypted videos. If you want a safety copy (useful only if you later recover the old password), select **Download Encrypted Backup First**. The \`.nxvault\` remains ciphertext and never includes the password.
4. If you accept losing the old inaccessible library, type exactly \`DELETE MY VAULT\`, check the loss acknowledgment, select **Delete Old Vault and Start Over**, then accept the final native browser confirmation.
5. The browser will display **Create your private vault password**. Choose a memorable, unique password of 12+ characters; record it securely in iPhone Passwords or your own password manager **before creating**. Use **Show Passwords** to verify the two fields match. Check the saved-password acknowledgment, then create your new empty vault.
6. Start with one short MP4. Export a new encrypted \`.nxvault\` archive and keep it safely outside browser site storage, separate from your password.

## Security and functionality
- \`resetVault('DELETE MY VAULT')\` uses a single atomic IndexedDB transaction clearing the \`config\`, \`clips\`, and \`parts\` stores of the vault database \`nexus_azeroth_secure_video_v20\` only; it never clears shared localStorage or cookies.
- The password-derived AES-256-GCM encryption scheme, PBKDF2-SHA256 work factor, random IV policy and video format remain unchanged from v20, and ciphertext-only backup/restore continues to work as before.
- No password guess or data recovery mechanism is built; the backup created when locked remains encrypted with the **old** password, and resetting does not change that password.
- A new stable "username" label and \`new-password\` / \`current-password\` autofill hints can help iPhone Passwords recognize the vault, but actual saving is platform-dependent: users must verify it is saved rather than assuming.
- When reset is confirmed, cooperating same-origin tabs receive a BroadcastChannel notification and hide old library data. Separate devices/browser profiles are not remotely modified.
- New in v20.1: sorting by recent, alphabetical, smallest or largest file and a Favorites Only filter. These settings are transient and do not store private title information outside ciphertext.
- Vault page still uses a deny-by-default CSP, zero network uploads, video Playback Blob URLs while unlocked only, private IndexedDB, and no external media player.
- General Save Protection Center does not export the private vault; encrypted .nxvault backup is separate.

## Test checklist (real hardware remains pending)
- [ ] New-vault screen has visible password-manager label and **saved password** checkbox and prevents create without checking it.
- [ ] Show/Hide Passwords works and is non-submitting on iPhone.
- [ ] Locked-screen count and ciphertext-only download work without the password.
- [ ] Reset is impossible until exact phrase, checkbox and native confirmation are all completed.
- [ ] After reset: all three encrypted vault stores are empty, new password can be enrolled, old password cannot open it.
- [ ] Other Azeroth missions, routes, characters, item plans, Talent Forge and logins unchanged after reset.
- [ ] Existing v20 vaults still unlock with the old password; format compatibility and .nxvault encrypted archive import preserved.
- [ ] Favorites Only and sorting work on small screens with no horizontal overflow.
- [ ] Desktop Chromium and simulated iPhone WebKit tests pass; physical iPhone Safari + Home Screen and iPhone Passwords save behavior must be tested later.

**Note:** Cannot reset an actual person's iPhone browser state remotely through a GitHub commit. The reset becomes available after website deployment and the owner must activate it on the original browser/device.

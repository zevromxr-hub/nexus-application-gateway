# PROXIMUS | ASSET ALCHEMIST v2.0.0

**SUPREME CREATOR EDITION — Powered by ZevRo | Proximus**

Official website: https://zevromxr-hub.github.io/nexus-application-gateway/alchemist/

## Version and GitHub policy
This is a release-identified, static GitHub Pages application. Every **published release** should include matching updates to \`version.json\`, \`CHANGELOG.md\`, \`releases/vX.Y.Z.json\`, app version, cache name, and the tracked GitHub commit. The CI workflow validates version consistency, JavaScript syntax, and source structure on changes. Deployments are ordinary commits to the Pages branch; this does **not** create a GitHub Releases asset automatically.

**The old /nexus-application-gateway/alchemist/ URL stays unchanged for Discord compatibility, even though the brand is now PROXIMUS.** Existing native protocol handlers and user data keys remain unchanged for compatibility.

## Studios
1. Image Studio — resize, crop, filters, key removal, type overlay and original generated environments.
2. Batch Forge — bulk image conversion and ZIP.
3. Icon Foundry — multiple icon PNG sizes.
4. Sprite Atlas — image atlas and JSON coordinates.
5. Texture Lab — height, normal and mask maps.
6. Color Lab — palette, gradients, WCAG contrast.
7. Audio Forge — trim, fades, reverse, normalize, WAV.
8. Motion Lab — preview clips, snapshots and short silent WebM loops.
9. 3D Inspector — GLB/glTF structure, materials and rig data.
10. Asset Packager — session pack ZIP, SHA-256 inventory.
11. Production Lab (NEW) — ready-to-use Discord banners, wallpapers, thumbnails, covers, procedural effects, editable text, imported backdrop, PNG/WebP and JSON recipes.
12. Asset Audit (NEW) — true SHA-256, duplicate detection, file-header checks, basic image/audio/GLB metadata, CSV/JSON report.

## Durable work
Collected assets are also copied to IndexedDB so normal refresh/reopening can restore your pack. Browser storage can be cleared or evicted and may not work in private mode. Download ZIP backups regularly. The application does not persist your original imported images as standalone projects.

## Privacy
All transforms run in the browser; source media stays on the machine and is not uploaded to GitHub or Discord. The optional update check fetches only public \`version.json\`. Pack data remains in browser-local storage.

## Limitations
- Original wallpaper generation is procedural, not AI diffusion.
- No full 3D geometry editing, no MP3 encoding, no MP4 export, no direct animated GIF output.
- Audio Forge produces WAV; Motion Lab produces muted WebM.
- Large files may exceed browser CPU, memory, quota, or 24 megapixel canvas limits.
- Audit is not antivirus scanning; unknown signatures are not inherently unsafe.
- GitHub Pages is static hosting; authenticated Discord commands or private cloud projects would require a backend.

## Discord button
**OPEN ASSET ALCHEMIST**
https://zevromxr-hub.github.io/nexus-application-gateway/alchemist/

## Release discipline
- Publish v2.0.0 in \`version.json\`, application chrome, changelog, JSON release record and cache name together.
- Run \`node alchemist/tests/validate.mjs\` and JS syntax checks.
- Keep existing gateway HTML, desktop protocols and paths compatible.
- After merge, validate Pages deployment separately, since a GitHub commit alone does not guarantee the CDN has updated.

POWERED BY ZEVRO | PROXIMUS

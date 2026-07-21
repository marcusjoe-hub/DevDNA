DevDNA v2 - Audio Files Setup
==============================

This folder should contain 4 MP3 files (35% volume soft cyberpunk SFX).

Current files are SILENT placeholders (0.2s wav renamed to mp3) to prevent 404 errors.
Replace them with real sounds from Pixabay (free, no attribution).

DOWNLOAD LINKS:

1. click.mp3 - soft cyberpunk click (button hover)
   Search: https://pixabay.com/sound-effects/search/click/
   Direct pick: https://pixabay.com/sound-effects/click-button-140881/
   Click green Download -> Save as click.mp3

2. select.mp3 - futuristic beep (answer selected)
   Search: https://pixabay.com/sound-effects/search/beep/
   Direct pick: https://pixabay.com/sound-effects/beep-sound-8333/
   Download -> Save as select.mp3

3. complete.mp3 - success ding (quiz complete)
   Search: https://pixabay.com/sound-effects/search/success%20ding/
   Direct pick: https://pixabay.com/sound-effects/success-1-6297/
   Download -> Save as complete.mp3

4. reveal.mp3 - dramatic swoosh (result reveal)
   Search: https://pixabay.com/sound-effects/search/dramatic%20swoosh/
   Direct pick: https://pixabay.com/sound-effects/swoosh-142322/
   Download -> Save as reveal.mp3

Steps:
- Download each MP3
- Overwrite files in this folder
- Keep filenames exactly: click.mp3, select.mp3, complete.mp3, reveal.mp3
- Commit & push to GitHub -> Render auto deploys

Alternate source: Freesound.org
- https://freesound.org/search/?q=ui+click
- https://freesound.org/search/?q=beep
- Login free, download as MP3/OGG and rename.

The code in script.js preloads with volume 0.35 and localStorage toggle.
If files missing, it fails silently (console warn) - app still works.

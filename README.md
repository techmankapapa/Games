# Meme Arcade — game hub

A static hub for six games hosted at `techmankapapa.github.io`, with clean
per-game URLs and guest-only local score saving.

## Structure

```
public/
  index.html              hub / cabinet grid
  assets/style.css        shared styles
  assets/app.js           guest id + score storage (localStorage)
  Modi/index.html
  Vote-Run/index.html
  Flying-Kejriwal/index.html
  Dhurandhar/index.html
  Flying-Modi/index.html
  Helen-Keller-Simulator/index.html
firebase.json             hosting config (clean URLs, no .html needed)
```

Each game page embeds the real game in an iframe pointed at its existing
`techmankapapa.github.io` URL, so nothing about the games themselves needed
to move or be rebuilt.

## Deploy to Firebase Hosting (games.web.app)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # point it at this folder, choose "public" as the public dir,
                         # say NO to overwriting index.html
firebase deploy
```

Once deployed you'll get URLs like:

- `https://<your-project>.web.app/Modi`
- `https://<your-project>.web.app/Flying-Modi`
- `https://<your-project>.web.app/Helen-Keller-Simulator`

Any static host that serves folders as clean paths (Netlify, Vercel, GitHub
Pages with a project-per-folder) works the same way — the `<slug>/index.html`
layout is what makes `/Modi` resolve without a `.html` extension.

## How guest scores work

- On first visit, a random tag like `GUEST-4821` is generated and stored in
  `localStorage`. No sign-in, no email, nothing sent to a server.
- Because each game plays inside an iframe pointed at a different origin
  (`techmankapapa.github.io`), this hub page has no way to read the score
  drawn inside that iframe automatically — browsers block that across origins
  for anyone's protection, ours included.
- So each game page has a small "Log your score" box: type the number shown
  in the game, hit save, and it's stored under your guest tag in this
  browser, with your 10 best runs kept per game.
- If you ever get access to a game's source and can add one line —
  `window.parent.postMessage({ type: 'arcade-score', value: <score> }, '*')`
  when the run ends — this hub is already listening for that message and
  will save the score automatically, no other changes needed.

## Notes

- All scores are local to one browser/device. There's no shared leaderboard
  across visitors and no backend — clearing site data or switching browsers
  resets the guest tag and score history.
- `Helen-Keller-Simulator` isn't an interactive game; its page still embeds
  the game the same way as the others for consistency.

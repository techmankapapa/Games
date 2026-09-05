# Meme Arcade — game hub

A static hub for six games hosted at `techmankapapa.github.io`, with clean
per-game URLs, sign-in (Google / email+password / guest), fullscreen play,
and guest-or-account local score saving.

## Structure

```
public/
  index.html              hub / cabinet grid
  assets/style.css        shared styles (incl. auth modal, fullscreen button)
  assets/app.js           auth (ArcadeAuth) + guest id + score storage
  assets/firebase-config.js   your Firebase project keys — paste these in
  Modi/index.html
  Vote-Run/index.html
  Flying-Kejriwal/index.html
  Dhurandhar/index.html
  Flying-Modi/index.html
  Helen-Keller-Simulator/index.html
firebase.json             hosting config (clean URLs, no .html needed)
build_game_pages.py       regenerates the six game pages from one template
```

Each game page embeds the real game in an iframe pointed at its existing
`techmankapapa.github.io` URL, so nothing about the games themselves needed
to move or be rebuilt.

## Sign-in setup (Google / email+password / guest)

The top-right corner on every page shows either "Sign in / Sign up" or the
current account. Clicking it opens a modal with three ways in:

1. **Continue with Google** — one-tap OAuth sign-in.
2. **Username + password** — a Log in / Sign up form (Firebase Auth's
   email+password provider; "username" is stored as the account's display
   name).
3. **Continue as Guest** — Firebase anonymous auth, no details needed.

To make this work, before deploying:

1. Paste your project's config object into `public/assets/firebase-config.js`
   (Firebase Console → Project settings → General → "Your apps").
2. In Firebase Console → **Authentication → Sign-in method**, enable:
   - Google
   - Email/Password
   - Anonymous
3. In Firebase Console → **Authentication → Settings → Authorized domains**,
   add the domain you deploy to (e.g. `<your-project>.web.app`).

Until step 1 is done, the sign-in button shows an alert telling you so
instead of failing silently.

## Fullscreen

Each game's cabinet has a fullscreen button (top-right of the screen). It
calls the standard Fullscreen API on the cabinet container, so it works no
matter what's inside the iframe — no access to the embedded game's code is
needed for this one.

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

## How guest / account scores work

- If you sign in, your best runs are labeled with your account name; if not,
  a random tag like `GUEST-4821` is generated and stored in `localStorage`.
  Either way, scores currently live **only in this browser** — there's no
  shared backend yet. (Wiring signed-in scores to Firestore so they follow
  you across devices is a reasonable next step if you want it — it's not
  built here.)
- Because each game plays inside an iframe pointed at a different origin
  (`techmankapapa.github.io`), this hub page has no way to read the score
  drawn inside that iframe automatically — browsers block that across
  origins for anyone's protection, ours included. This is not a bug or a
  missing setting; it's the browser's same-origin sandbox, and no
  client-side JavaScript on this hub can get around it.
- So each game page has a "Log your score" box: type the number shown in
  the game, hit save, and it's stored under your account/guest tag, with
  your 10 best runs kept per game.
- **The one real path to automatic scoring:** if you have access to the
  actual game source at `techmankapapa.github.io/<slug>`, add one line when
  a run ends:
  ```js
  window.parent.postMessage({ type: 'arcade-score', value: <score> }, '*');
  ```
  This hub already listens for that message on every game page and will
  save the score automatically the moment the game sends it — no hub-side
  changes needed. Without that line in the game itself, "fully automatic"
  scoring for these six games isn't achievable from the hub alone.

## About "volume boosting"

There's no volume-boost control on these pages, on purpose: a page cannot
reach into a cross-origin iframe's audio (or any other cross-origin iframe
internals) to add gain, mute, or amplify it — the same sandbox that blocks
score-reading blocks this too. The only browser API that touches another
tab/frame's actual audio output is tab/display capture
(`getDisplayMedia({ audio: true })`), which requires an explicit
permission prompt every time, plays back through a second audio path (so
you'd hear the game twice, echoing, unless the original is muted), and
isn't something that can run silently "with no human intervention." If you
want louder audio, the reliable options are: raise the OS/browser volume,
or add gain boosting inside the actual game's own audio code if you have
access to that source.

## Notes

- All scores are local to one browser/device unless you later add a
  Firestore sync for signed-in users. Clearing site data or switching
  browsers resets a guest's tag and score history.
- `Helen-Keller-Simulator` isn't an interactive game; its page still embeds
  the game the same way as the others for consistency.

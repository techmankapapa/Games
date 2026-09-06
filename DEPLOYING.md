# Deploying this site to Firebase Hosting

The repo is already set up for it — `firebase.json` at the root points
Hosting at the `public/` folder (which is exactly what `build_game_pages.py`
writes into), so there's nothing to configure, just a few one-time steps.

## 1. Install the Firebase CLI (once, on your machine)

```
npm install -g firebase-tools
```

## 2. Log in

```
firebase login
```

This opens a browser window to sign into the Google account that owns
your Firebase project.

## 3. Point this folder at your Firebase project

From the repo root (the folder that contains `firebase.json`):

```
firebase use --add
```

Pick your project from the list — it's the same project referenced in
`public/assets/firebase-config.js` (`projectId: "lothkunta-lanja"`, from
what's in this repo). Give it an alias like `default` when asked.

## 4. Deploy

```
firebase deploy --only hosting
```

That's it — the CLI uploads everything in `public/` and gives you a
live URL (`https://<project-id>.web.app` and `https://<project-id>.firebaseapp.com`).

## After deploying: add the domain to Firebase Auth

Sign-in (Google / email+password / guest) will fail on the live site
until you do this:

**Firebase Console → Authentication → Settings → Authorized domains
→ Add domain** → add `<project-id>.web.app` and `<project-id>.firebaseapp.com`.

(`localhost` is already on that list by default, which is why sign-in
works fine when you test locally.)

## Re-deploying after changes

Any time you edit a game entry or the shared template, regenerate the
static pages first, then redeploy:

```
python3 build_game_pages.py
firebase deploy --only hosting
```

## Optional: a real custom domain

**Firebase Console → Hosting → Add custom domain** and follow the DNS
steps it gives you (a couple of DNS records at whoever you bought the
domain from). Once verified, add that domain to the Authorized
domains list above too, or sign-in will break on it.

/* ---------------------------------------------------------
   Meme Arcade — auth (Google / email+password / guest) via
   Firebase, plus guest identity & local score storage.

   Requires, loaded BEFORE this file:
     firebase-app-compat.js
     firebase-auth-compat.js
     assets/firebase-config.js   (your project keys)
--------------------------------------------------------- */

const ArcadeAuth = (() => {
  const listeners = [];
  let currentUser = null;
  let modalEl = null;

  function ready() {
    return typeof firebase !== "undefined" && firebase.apps && firebase.apps.length > 0;
  }

  function init() {
    if (!ready()) {
      console.warn(
        "[ArcadeAuth] Firebase isn't configured yet — paste your project keys into assets/firebase-config.js"
      );
      return;
    }
    firebase.auth().onAuthStateChanged((user) => {
      currentUser = user;
      listeners.forEach((fn) => fn(user));
    });
  }

  function onChange(fn) {
    listeners.push(fn);
    fn(currentUser);
  }

  function getUser() {
    return currentUser;
  }

  function label(user) {
    if (!user) return null;
    if (user.isAnonymous) return `GUEST-${user.uid.slice(0, 4).toUpperCase()}`;
    return user.displayName || (user.email ? user.email.split("@")[0] : "Player");
  }

  function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return firebase.auth().signInWithPopup(provider);
  }

  function signInGuest() {
    return firebase.auth().signInAnonymously();
  }

  function signUpEmail(username, email, password) {
    return firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then((cred) => cred.user.updateProfile({ displayName: username }).then(() => cred));
  }

  function signInEmail(email, password) {
    return firebase.auth().signInWithEmailAndPassword(email, password);
  }

  function signOutUser() {
    return firebase.auth().signOut();
  }

  function buildModal() {
    if (modalEl) return modalEl;

    const wrap = document.createElement("div");
    wrap.className = "auth-overlay";
    wrap.innerHTML = `
      <div class="auth-modal" role="dialog" aria-modal="true" aria-label="Sign in">
        <button type="button" class="auth-close" aria-label="Close">&times;</button>
        <h2>Sign in to Meme Arcade</h2>
        <p class="auth-sub">Pick one — guest mode always works, no pressure.</p>

        <button type="button" class="auth-btn auth-google" id="authGoogleBtn">
          <span class="auth-icon">G</span> Continue with Google
        </button>
        <button type="button" class="auth-btn auth-guest" id="authGuestBtn">
          Continue as Guest
        </button>

        <div class="auth-divider"><span>or use a username &amp; password</span></div>

        <div class="auth-tabs">
          <button type="button" class="auth-tab is-active" data-mode="login">Log in</button>
          <button type="button" class="auth-tab" data-mode="signup">Sign up</button>
        </div>

        <form class="auth-form" id="authForm">
          <input type="text" id="authUsername" placeholder="Username" class="auth-signup-only" style="display:none" />
          <input type="email" id="authEmail" placeholder="Email" required />
          <input type="password" id="authPassword" placeholder="Password (6+ characters)" required minlength="6" />
          <button type="submit" class="auth-btn auth-submit" id="authSubmitBtn">Log in</button>
        </form>

        <p class="auth-error" id="authError"></p>
      </div>
    `;
    document.body.appendChild(wrap);
    modalEl = wrap;

    const close = () => {
      wrap.classList.remove("show");
      wrap.querySelector("#authError").textContent = "";
    };
    wrap.querySelector(".auth-close").addEventListener("click", close);
    wrap.addEventListener("click", (e) => {
      if (e.target === wrap) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    function showError(err) {
      wrap.querySelector("#authError").textContent = err && err.message ? err.message : "Something went wrong.";
    }

    wrap.querySelector("#authGoogleBtn").addEventListener("click", () => {
      signInWithGoogle().then(close).catch(showError);
    });
    wrap.querySelector("#authGuestBtn").addEventListener("click", () => {
      signInGuest().then(close).catch(showError);
    });

    let mode = "login";
    const tabs = wrap.querySelectorAll(".auth-tab");
    const usernameField = wrap.querySelector("#authUsername");
    const submitBtn = wrap.querySelector("#authSubmitBtn");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        mode = tab.dataset.mode;
        tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
        usernameField.style.display = mode === "signup" ? "block" : "none";
        submitBtn.textContent = mode === "signup" ? "Sign up" : "Log in";
        wrap.querySelector("#authError").textContent = "";
      });
    });

    wrap.querySelector("#authForm").addEventListener("submit", (e) => {
      e.preventDefault();
      wrap.querySelector("#authError").textContent = "";
      const email = wrap.querySelector("#authEmail").value.trim();
      const password = wrap.querySelector("#authPassword").value;
      const username = usernameField.value.trim();
      const action =
        mode === "signup"
          ? signUpEmail(username || email.split("@")[0], email, password)
          : signInEmail(email, password);
      action.then(close).catch(showError);
    });

    return wrap;
  }

  function openModal() {
    if (!ready()) {
      alert("Firebase isn't configured yet — paste your project keys into assets/firebase-config.js first.");
      return;
    }
    buildModal().classList.add("show");
  }

  return {
    init,
    onChange,
    getUser,
    label,
    signInWithGoogle,
    signInGuest,
    signUpEmail,
    signInEmail,
    signOut: signOutUser,
    openModal,
  };
})();

ArcadeAuth.init();

/* ---------------------------------------------------------
   Guest identity & local score storage (unchanged behavior),
   now aware of ArcadeAuth so the badge reflects a signed-in
   user when one exists.
--------------------------------------------------------- */

const Arcade = (() => {
  const GUEST_KEY = "arcade:guestId";
  const scoreKey = (slug) => `arcade:scores:${slug}`;

  const GAMES = [
    { slug: "Modi", title: "Modi Runner", tagline: "Endless runner — jump the obstacles, beat your best distance." },
    { slug: "Vote-Run", title: "Vote Runner", tagline: "30-second sprint tallying votes as you play." },
    { slug: "Flying-Kejriwal", title: "Flying Kejriwal", tagline: "Flappy-style flying game. Tap to stay airborne." },
    { slug: "Dhurandhar", title: "Dhurandhar", tagline: "Flappy-bird style flight through a run of obstacles." },
    { slug: "Flying-Modi", title: "Flying Modi", tagline: "Flappy-style flying game, second edition." },
    { slug: "Helen-Keller-Simulator", title: "Helen Keller Simulator", tagline: "A 360° black void you can drag around." },
  ];

  function getGuestId() {
    let id = localStorage.getItem(GUEST_KEY);
    if (!id) {
      const n = Math.floor(1000 + Math.random() * 9000);
      id = `GUEST-${n}`;
      localStorage.setItem(GUEST_KEY, id);
    }
    return id;
  }

  function getScores(slug) {
    try {
      const raw = localStorage.getItem(scoreKey(slug));
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveScore(slug, value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return null;
    const list = getScores(slug);
    list.push({ value: num, ts: Date.now() });
    list.sort((a, b) => b.value - a.value);
    const trimmed = list.slice(0, 10);
    localStorage.setItem(scoreKey(slug), JSON.stringify(trimmed));
    return trimmed;
  }

  function getBest(slug) {
    const list = getScores(slug);
    return list.length ? list[0].value : null;
  }

  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  function mountGuestBadge(el) {
    if (!el) return;

    function render(user) {
      if (user && !user.isAnonymous) {
        el.innerHTML = `
          <span class="guest-dot signed-in"></span>
          <span>Playing as <strong>${ArcadeAuth.label(user)}</strong></span>
          <button type="button" class="mini-link" id="acctSignOut">Sign out</button>
        `;
        const out = el.querySelector("#acctSignOut");
        if (out) out.addEventListener("click", () => ArcadeAuth.signOut());
      } else if (user && user.isAnonymous) {
        el.innerHTML = `
          <span class="guest-dot"></span>
          <span>Playing as <strong>${ArcadeAuth.label(user)}</strong></span>
          <button type="button" class="mini-link" id="acctSwitch">Sign in</button>
        `;
        el.querySelector("#acctSwitch").addEventListener("click", () => ArcadeAuth.openModal());
      } else {
        el.innerHTML = `
          <span class="guest-dot"></span>
          <span>Playing as <strong>${getGuestId()}</strong></span>
          <button type="button" class="mini-link" id="acctSwitch">Sign in / Sign up</button>
        `;
        el.querySelector("#acctSwitch").addEventListener("click", () => ArcadeAuth.openModal());
      }
    }

    render(ArcadeAuth.getUser());
    ArcadeAuth.onChange(render);
  }

  function mountNav(el, currentSlug) {
    if (!el) return;
    const home = `<a href="/" class="nav-link ${!currentSlug ? "is-current" : ""}">Home</a>`;
    const links = GAMES.map(
      (g) => `<a href="/${g.slug}/" class="nav-link ${g.slug === currentSlug ? "is-current" : ""}">${g.title}</a>`
    ).join("");
    el.innerHTML = home + links;
  }

  return { GAMES, getGuestId, getScores, saveScore, getBest, formatTime, mountGuestBadge, mountNav };
})();

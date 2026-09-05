/* ---------------------------------------------------------
   Meme Arcade — guest identity & local score storage
   No login, no accounts. Everything lives in this browser's
   localStorage, tied to a randomly generated guest tag.
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
    el.innerHTML = `<span class="guest-dot"></span>Playing as <strong>${getGuestId()}</strong>`;
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

/* ---------------------------------------------------------
   Meme Arcade — guest identity & local score storage
   No login, no accounts. Everything lives in this browser's
   localStorage, tied to a randomly generated guest tag.
--------------------------------------------------------- */

const Arcade = (() => {
  const GUEST_KEY = "arcade:guestId";
  const scoreKey = (slug) => `arcade:scores:${slug}`;

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

  return { getGuestId, getScores, saveScore, getBest, formatTime, mountGuestBadge };
})();

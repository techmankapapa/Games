import os

GAMES = [
    {"slug": "Modi", "title": "Modi Runner", "source": "https://techmankapapa.github.io/Modi/"},
    {"slug": "Vote-Run", "title": "Vote Runner", "source": "https://techmankapapa.github.io/Vote-Run/"},
    {"slug": "Flying-Kejriwal", "title": "Flying Kejriwal", "source": "https://techmankapapa.github.io/Flying-Kejriwal/"},
    {"slug": "Dhurandhar", "title": "Dhurandhar", "source": "https://techmankapapa.github.io/Dhurandhar/"},
    {"slug": "Flying-Modi", "title": "Flying Modi", "source": "https://techmankapapa.github.io/Flying-Modi/"},
    {"slug": "Helen-Keller-Simulator", "title": "Helen Keller Simulator", "source": "https://techmankapapa.github.io/Helen-Keller-Simulator/"},
]

TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{title} — Meme Arcade</title>
<link rel="stylesheet" href="/assets/style.css" />
</head>
<body class="game-page">
  <div class="scanlines"></div>

  <header class="game-header">
    <a class="back-link" href="/">&larr; All cabinets</a>
    <div class="game-title">{title_upper}</div>
    <div class="guest-badge" id="guestBadge"></div>
  </header>
  <nav class="site-nav" id="siteNav"></nav>

  <div class="game-body">
    <div class="screen-wrap">
      <div class="cabinet-bezel" id="bezel">
        <button type="button" class="fullscreen-btn" id="fullscreenBtn" title="Toggle fullscreen">&#x26F6;</button>
        <iframe src="{source}" title="{title}" allow="autoplay; fullscreen" allowfullscreen></iframe>
      </div>
    </div>

    <aside class="side-panel">
      <div class="panel-block">
        <h3>Log your score</h3>
        <form class="score-form" id="scoreForm">
          <input type="number" inputmode="numeric" id="scoreInput" placeholder="Score shown in-game" required />
          <button type="submit">Save</button>
        </form>
        <p class="hint">This game runs in an embedded frame we don't control, so it can't hand us your score automatically unless the game itself sends it. Type in the number shown on screen and save it here — it stays on this device under your guest tag (or your account, if you're signed in).</p>
      </div>

      <div class="panel-block">
        <h3>Your best runs</h3>
        <ul class="score-list" id="scoreList"></ul>
      </div>
    </aside>
  </div>

  <div class="toast" id="toast">Saved!</div>

  <footer class="site-footer">Guest scores are stored locally in this browser only.</footer>

  <script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-auth-compat.js"></script>
  <script src="/assets/firebase-config.js"></script>
  <script src="/assets/app.js"></script>
  <script>
    const SLUG = "{slug}";
    Arcade.mountGuestBadge(document.getElementById("guestBadge"));
    Arcade.mountNav(document.getElementById("siteNav"), SLUG);

    function renderScores() {{
      const list = Arcade.getScores(SLUG);
      const el = document.getElementById("scoreList");
      if (!list.length) {{
        el.innerHTML = '<li class="empty-state">No runs saved yet — play, then log your score.</li>';
        return;
      }}
      el.innerHTML = list
        .map(s => `<li><span>${{s.value}}</span><span class="ts">${{Arcade.formatTime(s.ts)}}</span></li>`)
        .join("");
    }}

    function showToast(msg) {{
      const t = document.getElementById("toast");
      t.textContent = msg;
      t.classList.add("show");
      setTimeout(() => t.classList.remove("show"), 1600);
    }}

    document.getElementById("scoreForm").addEventListener("submit", (e) => {{
      e.preventDefault();
      const input = document.getElementById("scoreInput");
      const saved = Arcade.saveScore(SLUG, input.value);
      if (saved) {{
        showToast("Score saved");
        input.value = "";
        renderScores();
      }}
    }});

    // If this game is ever updated to broadcast its score via
    // window.parent.postMessage({{ type: 'arcade-score', value }}, '*'),
    // it will be picked up and saved automatically — no page changes needed.
    // NOTE: this only works if the game's OWN source code (hosted at
    // techmankapapa.github.io) adds that postMessage call. A parent page
    // can never read into a cross-origin iframe on its own — that's the
    // browser's same-origin sandbox, and no client-side code can bypass it.
    window.addEventListener("message", (event) => {{
      const data = event.data;
      if (data && data.type === "arcade-score" && Number.isFinite(Number(data.value))) {{
        Arcade.saveScore(SLUG, data.value);
        showToast("Score auto-saved");
        renderScores();
      }}
    }});

    // Fullscreen toggle for the cabinet. This works regardless of the
    // iframe's origin — it just expands the container element, no access
    // to the iframe's internals required.
    const bezel = document.getElementById("bezel");
    const fsBtn = document.getElementById("fullscreenBtn");
    fsBtn.addEventListener("click", () => {{
      if (!document.fullscreenElement) {{
        (bezel.requestFullscreen || bezel.webkitRequestFullscreen || bezel.msRequestFullscreen).call(bezel);
      }} else {{
        (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen).call(document);
      }}
    }});
    document.addEventListener("fullscreenchange", () => {{
      fsBtn.textContent = document.fullscreenElement ? "\\u2922" : "\\u26F6";
    }});

    renderScores();
  </script>
</body>
</html>
"""

def main():
    base = os.path.join(os.path.dirname(__file__), "public")
    for g in GAMES:
        folder = os.path.join(base, g["slug"])
        os.makedirs(folder, exist_ok=True)
        html = TEMPLATE.format(
            title=g["title"],
            title_upper=g["title"].upper(),
            source=g["source"],
            slug=g["slug"],
        )
        with open(os.path.join(folder, "index.html"), "w") as f:
            f.write(html)
        print("wrote", folder)

if __name__ == "__main__":
    main()

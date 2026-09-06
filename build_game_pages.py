import os

GAMES = [
    {"slug": "Modi", "title": "Modi Runner", "source": "https://techmankapapa.github.io/Modi/", "aspect": "4 / 3"},
    {"slug": "Vote-Run", "title": "Vote Runner", "source": "https://techmankapapa.github.io/Vote-Run/", "aspect": "4 / 3"},
    {"slug": "Flying-Kejriwal", "title": "Flying Kejriwal", "source": "https://techmankapapa.github.io/Flying-Kejriwal/", "aspect": "4 / 3"},
    {"slug": "Dhurandhar", "title": "Dhurandhar", "source": "https://techmankapapa.github.io/Dhurandhar/", "aspect": "4 / 3"},
    {"slug": "Flying-Modi", "title": "Flying Modi", "source": "https://techmankapapa.github.io/Flying-Modi/", "aspect": "4 / 3"},
    {"slug": "Helen-Keller-Simulator", "title": "Helen Keller Simulator", "source": "https://techmankapapa.github.io/Helen-Keller-Simulator/", "aspect": "4 / 3"},
]
# "aspect" controls how tall the cabinet box is, and — in fullscreen —
# what shape box the game gets letterboxed into. All six games are
# confirmed/assumed landscape 4:3 layouts. An earlier guess that the
# "Flying/flappy" games were portrait (3:4) was wrong — a real
# screenshot of Flying-Kejriwal mid-game showed a wide landscape HUD
# getting cropped down to a narrow box, cutting its score text off.
# If a specific game turns out to actually be a different native
# shape, change ONLY that entry's aspect (e.g. "16 / 9" or "3 / 4"),
# based on an actual screenshot — not a guess.

TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{title} — Meme Arcade</title>
<link rel="stylesheet" href="/assets/style.css" />
<!-- Opens the connection to the game's host early (DNS + TLS) so the
     iframe's own assets — including its background image — start
     downloading sooner once the src is set. This is a real speed-up,
     not cosmetic, but it can't make the remote server itself faster. -->
<link rel="preconnect" href="https://techmankapapa.github.io" crossorigin />
<link rel="dns-prefetch" href="https://techmankapapa.github.io" />
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
      <div class="cabinet-bezel" id="bezel" style="--cab-aspect: {aspect}">
        <button type="button" class="fullscreen-btn" id="fullscreenBtn" title="Toggle fullscreen">&#x26F6;</button>
        <div class="cabinet-loading" id="cabinetLoading">
          <div class="loading-spinner"></div>
          <p>Loading game&hellip;</p>
        </div>
        <iframe src="{source}" title="{title}" allow="autoplay; fullscreen" allowfullscreen></iframe>
      </div>
    </div>
  </div>

  <script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-auth-compat.js"></script>
  <script src="/assets/firebase-config.js"></script>
  <script src="/assets/app.js"></script>
  <script>
    const SLUG = "{slug}";
    Arcade.mountGuestBadge(document.getElementById("guestBadge"));
    Arcade.mountNav(document.getElementById("siteNav"), SLUG);

    // Hide the loading overlay once the iframe's document has loaded.
    // Note: cross-origin means we can't know when the game's own
    // background image/assets are done — the "load" event only tells
    // us the outer page arrived — but it's still the earliest honest
    // signal we have, and the preconnect tag above genuinely speeds
    // that part up. A timeout is added so the overlay never gets
    // stuck forever if "load" doesn't fire for some reason.
    const gameFrame = document.querySelector("#bezel iframe");
    const loadingEl = document.getElementById("cabinetLoading");
    function hideLoading() {{ loadingEl.classList.add("is-hidden"); }}
    if (gameFrame) gameFrame.addEventListener("load", hideLoading);
    setTimeout(hideLoading, 9000);

    // Fullscreen toggle for the cabinet. This works regardless of the
    // iframe's origin — it just expands the container element, no access
    // to the iframe's internals required.
    const bezel = document.getElementById("bezel");
    const fsBtn = document.getElementById("fullscreenBtn");
    fsBtn.addEventListener("click", () => {{
      if (!document.fullscreenElement) {{
        (bezel.requestFullscreen || bezel.webkitRequestFullscreen || bezel.mozRequestFullScreen || bezel.msRequestFullscreen).call(bezel);
      }} else {{
        (document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen).call(document);
      }}
    }});

    function onFullscreenChange() {{
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
      bezel.classList.toggle("is-fullscreen", isFs);
      fsBtn.textContent = isFs ? "\\u2922" : "\\u26F6";
      if (isFs) {{
        fitFullscreenFrame();
        window.addEventListener("resize", fitFullscreenFrame);
      }} else {{
        window.removeEventListener("resize", fitFullscreenFrame);
        // Hand sizing/positioning back to the normal windowed CSS.
        const frame = bezel.querySelector("iframe");
        if (frame) {{
          frame.style.width = "";
          frame.style.height = "";
          frame.style.left = "";
          frame.style.top = "";
        }}
        // Chrome (and some other engines) can leave a non-<video>
        // fullscreen element's contents blank/black after exiting
        // fullscreen — the iframe's compositor layer doesn't repaint
        // on its own. Forcing a reflow (hide, measure, show) fixes it.
        if (frame) {{
          const prevDisplay = frame.style.display;
          frame.style.display = "none";
          void frame.offsetHeight; // forces layout flush
          frame.style.display = prevDisplay;
        }}
      }}
    }}

    // Sizes the iframe to the game's real aspect ratio and covers the
    // entire screen — no black bars — by scaling to whichever
    // dimension is the tighter fit and letting the other overflow off
    // the edges (cropped by the bezel's overflow:hidden), instead of
    // the letterboxed "shrink to fit with bars" approach. This keeps
    // the game's own proportions correct (nothing stretched/distorted
    // the way plain 100vw/100vh sizing was), it just means the very
    // edges (left/right or top/bottom, whichever axis is tighter)
    // extend past what's visible.
    function fitFullscreenFrame() {{
      const frame = bezel.querySelector("iframe");
      if (!frame) return;
      const raw = getComputedStyle(bezel).getPropertyValue("--cab-aspect") || "4 / 3";
      const parts = raw.split("/").map((n) => parseFloat(n));
      const ratio = parts.length === 2 && parts[0] > 0 && parts[1] > 0 ? parts[0] / parts[1] : 4 / 3;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let w, h;
      if (vw / vh > ratio) {{
        // viewport wider than the game's ratio: match width, let
        // height overflow top/bottom
        w = vw;
        h = w / ratio;
      }} else {{
        // viewport taller than the game's ratio: match height, let
        // width overflow left/right
        h = vh;
        w = h * ratio;
      }}
      frame.style.width = Math.round(w) + "px";
      frame.style.height = Math.round(h) + "px";
      frame.style.left = Math.round((vw - w) / 2) + "px";
      frame.style.top = Math.round((vh - h) / 2) + "px";
    }}

    ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "MSFullscreenChange"].forEach((evt) =>
      document.addEventListener(evt, onFullscreenChange)
    );
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
            aspect=g["aspect"],
        )
        with open(os.path.join(folder, "index.html"), "w") as f:
            f.write(html)
        print("wrote", folder)

if __name__ == "__main__":
    main()

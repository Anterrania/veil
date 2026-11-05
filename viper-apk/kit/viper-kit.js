/* Viper Kit: the shared Anterrania app layer. It adds the glam look, reduce motion, Brain Cell (an on-device, rule-based assistant), Developer options and an update checker. */
(function () {
  if (window.__vk) return;
  const C = Object.assign({ name: "App", repo: "", version: "0.0.0", code: 0, build: "web" }, window.VIPER_KIT || {});
  const P = "viper.kit.";
  const D = { reduceMotion: false, glam: true, devUnlocked: false, fps: false, flags: { sparkle: true, frame: true, autoUpdate: true }, updateRepo: C.repo };
  let S; try { S = Object.assign({}, D, JSON.parse(localStorage.getItem(P + "s") || "{}")); S.flags = Object.assign({}, D.flags, S.flags); } catch (e) { S = JSON.parse(JSON.stringify(D)); }
  const save = () => { try { localStorage.setItem(P + "s", JSON.stringify(S)); } catch (e) {} };
  const cap = window.Capacitor, isNative = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const NV = isNative && cap.Plugins ? cap.Plugins.ViperSystem : null;
  const osR = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false, addEventListener() {} };
  const LOG = []; const log = (l, m) => { LOG.push(new Date().toISOString() + " [" + l + "] " + m); if (LOG.length > 400) LOG.shift(); };
  ["error", "warn"].forEach((k) => { const o = console[k]; console[k] = function () { try { log(k, [].map.call(arguments, String).join(" ")); } catch (e) {} return o.apply(console, arguments); }; });
  addEventListener("error", (e) => log("error", e.message));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  let NATIVE = null, UPD = null, taps = 0, view = "main", sheet, fpsEl, raf;
  // Kit UI lives in its own root on <html>, so app frameworks that re-render <body> don't remove it.
  let ROOT = null;
  const root = () => { if (!ROOT) { ROOT = document.createElement("div"); ROOT.id = "vk-root"; } if (!ROOT.isConnected) (document.body && document.body.parentNode ? document.documentElement : document.documentElement).appendChild(ROOT); return ROOT; };
  const el = (id, tag, cls) => { let e = ROOT && ROOT.querySelector("#" + id); if (!e) { e = document.createElement(tag || "div"); e.id = id; if (cls) e.className = cls; root().appendChild(e); } return e; };
  function toast(m) { const t = el("vk-toast"); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 2600); }
  function look() {
    const h = document.documentElement;
    h.classList.toggle("vk-reduce", !!(S.reduceMotion || osR.matches)); h.classList.toggle("vk-glam", S.glam);
    el("vk-frame").hidden = !(S.glam && S.flags.frame); el("vk-sparkle").hidden = !(S.glam && S.flags.sparkle);
    fps(S.fps);
  }
  function fps(on) { cancelAnimationFrame(raf); if (!on) { if (fpsEl) fpsEl.hidden = true; return; } fpsEl = el("vk-fps"); fpsEl.hidden = false; let f = 0, last = performance.now(), prev = last, worst = 0;
    const loop = (t) => { f++; worst = Math.max(worst, t - prev); prev = t; if (t - last > 1000) { fpsEl.textContent = Math.round(f * 1000 / (t - last)) + " fps · worst " + worst.toFixed(0) + "ms"; f = 0; worst = 0; last = t; } raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); }
  function newer(a, b) { const p = (v) => String(v || "").replace(/^[^0-9]*/, "").split(/[.-]/).map((x) => parseInt(x, 10) || 0); const x = p(a), y = p(b); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; }
  async function checkUpdates(quiet) {
    if (!S.updateRepo) { UPD = { state: "error", msg: "no update repo set" }; return; }
    UPD = { state: "checking" }; if (!quiet) render();
    try { const r = await fetch("https://api.github.com/repos/" + S.updateRepo + "/releases/latest", { headers: { Accept: "application/vnd.github+json" } });
      if (r.status === 404) throw new Error("no public release found (the repo may be private or have no releases)"); if (!r.ok) throw new Error("GitHub answered " + r.status);
      const j = await r.json(); const as = j.assets || []; const a = as.find((x) => /release\.apk$/i.test(x.name)) || as.find((x) => /\.apk$/i.test(x.name));
      UPD = newer(j.tag_name, C.version) ? { state: "available", tag: j.tag_name, asset: a && a.browser_download_url, page: j.html_url } : { state: "latest", tag: j.tag_name };
      if (quiet && UPD.state === "available") toast(C.name + " " + UPD.tag + " is available. Tap ✦ then Updates.");
    } catch (e) { UPD = { state: "error", msg: e.message }; log("warn", "update check: " + e.message); }
    if (!quiet) render();
  }
  async function install() { if (!UPD || !UPD.asset) return; if (NV) { try { toast("Downloading… Android will ask you to confirm the install."); await NV.downloadAndInstall({ url: UPD.asset }); } catch (e) { toast(e.message || String(e)); } } else open(UPD.asset, "_blank"); }
  function backup() { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return JSON.stringify({ app: C.name, at: new Date().toISOString(), data: o }, null, 1); }
  async function share(name, text) { if (NV) { try { await NV.shareText({ name, text }); return; } catch (e) {} } const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" })); a.download = name; a.click(); }
  // Brain Cell: on-device rules only. It matches keywords and the time of day, sends nothing over the network, and is not a large language model.
  const RULES = [
    { k: ["motion", "animation", "calm", "dizzy"], l: () => (S.reduceMotion ? "Turn animations back on" : "Reduce motion"), run: () => { S.reduceMotion = !S.reduceMotion; save(); look(); } },
    { k: ["update", "new version", "upgrade"], l: () => "Check for updates", run: () => { view = "upd"; checkUpdates(false); } },
    { k: ["backup", "save", "export"], l: () => "Back up this app's data", run: () => share(C.name.replace(/\W+/g, "-") + "-backup.json", backup()) },
    { k: ["slow", "lag", "fps", "speed"], l: () => (S.fps ? "Hide FPS meter" : "Show FPS meter"), run: () => { S.fps = !S.fps; save(); look(); } },
    { k: ["glam", "sparkle", "plain", "look", "theme"], l: () => (S.glam ? "Plain look (turn off glam frame)" : "Glam look on"), run: () => { S.glam = !S.glam; save(); look(); } },
    { k: ["broken", "bug", "fix", "repair", "stuck"], l: () => "Reload the app", run: () => location.reload() },
    { k: ["usb", "debug", "developer"], l: () => "Open Developer options", run: () => { if (!S.devUnlocked) toast("About → tap Build number 7 times first"); else view = "dev"; } },
  ];
  function suggest(q) { q = (q || "").toLowerCase().trim(); let out = q ? RULES.filter((r) => r.k.some((k) => q.includes(k) || k.includes(q))) : [];
    if (!q) { const h = new Date().getHours(); if (h >= 21 || h < 6) out.push(RULES[0]); out.push(RULES[1], RULES[2]); } return out.slice(0, 4); }
  const sw = (on) => `<i class="sw ${on ? "on" : ""}"></i>`;
  function render() {
    if (!sheet || sheet.hidden) return;
    let h = "";
    if (view === "main") h = `<h2>✦ ${esc(C.name)}</h2>
      <h3>Brain Cell <small style="display:inline;text-transform:none;letter-spacing:0">· on-device assistant, rule-based, nothing leaves your phone</small></h3>
      <input id="vk-q" placeholder="Ask Brain Cell… (e.g. calm, update, backup)"><div id="vk-sg"></div>
      <h3>Look</h3><div class="r" data-t="reduceMotion"><span>Reduce motion<small>${osR.matches ? "Your phone asks for reduced motion, so animations are off." : "Turns off sparkles and animations"}</small></span>${sw(S.reduceMotion || osR.matches)}</div>
      <div class="r" data-t="glam"><span>Glam frame and sparkle</span>${sw(S.glam)}</div>
      <div class="r" data-v="upd"><span>System update<small>${esc(C.version)} · from ${esc(S.updateRepo || "—")}</small></span>›</div>
      ${S.devUnlocked ? '<div class="r" data-v="dev"><span>Developer options</span>›</div>' : ""}
      <div class="r" data-v="about"><span>About</span>›</div><button class="g" data-a="close">Close</button>`;
    else if (view === "about") h = `<h2>About ${esc(C.name)}</h2><div class="r"><span>Version<small>${esc(C.version)}</small></span></div>
      <div class="r" data-a="build"><span>Build number<small>${esc(C.version)} (${C.code}) · ${esc(C.build)}</small></span></div>
      <div class="r"><span>Platform<small>${NATIVE ? "Android " + esc(NATIVE.release) + " (SDK " + NATIVE.sdk + ") · " + esc(NATIVE.model) : "Web browser"}</small></span></div>
      <p><small>${S.devUnlocked ? "Developer options are on." : "Tap Build number 7 times to turn on Developer options."}</small></p><button class="g" data-v="main">Back</button>`;
    else if (view === "upd") { const u = UPD || {}; h = `<h2>System update</h2><p>Installed: <b>${esc(C.version)}</b> (${C.code})</p>
      <p>${u.state === "checking" ? "Checking…" : u.state === "available" ? "<b>" + esc(u.tag) + "</b> is available." : u.state === "latest" ? "Up to date (" + esc(u.tag) + ")." : u.state === "error" ? "Couldn't check: " + esc(u.msg) : "Not checked yet."}</p>
      ${u.state === "available" && u.asset ? '<button class="b" data-a="install">Download and install</button>' : ""}<button class="g" data-a="check">Check now</button>
      <p><small>Android always asks you to confirm an install, and may first ask you to allow "Install unknown apps". Updates install over this version only when they're signed with the same key.</small></p><button class="g" data-v="main">Back</button>`; }
    else if (view === "dev") h = `<h2>Developer options</h2>
      <div class="r" data-a="usb"><span>USB debugging<small>${NATIVE ? (NATIVE.adbEnabled ? "On" : "Off") + " in Android. Apps can't change this; tap to open system settings." : "Only shown in the Android app."}</small></span>${sw(NATIVE && NATIVE.adbEnabled)}</div>
      <div class="r" data-t="fps"><span>Debug overlay (FPS)</span>${sw(S.fps)}</div>
      <h3>Feature flags</h3>${Object.keys(S.flags).map((f) => `<div class="r" data-f="${f}"><span>${f}</span>${sw(S.flags[f])}</div>`).join("")}
      <h3>Logs</h3><pre>${esc(LOG.slice(-60).join("\n") || "(empty)")}</pre><button class="g" data-a="exportlog">Export log</button><button class="g" data-a="clearlog">Clear log</button>
      <h3>Data</h3><button class="g" data-a="backup">Back up</button><button class="g" data-a="restore">Restore…</button><button class="g" data-a="cache">Clear cache</button><button class="g" data-a="reset">Reset to defaults</button>
      <h3>Update source</h3><input id="vk-repo" value="${esc(S.updateRepo)}"><button class="g" data-a="saverepo">Save</button>
      <h3>Version info</h3><pre>${esc(JSON.stringify({ app: C, native: NATIVE, ua: navigator.userAgent, reduceMotionOS: osR.matches }, null, 1))}</pre>
      <button class="g" data-a="lock">Turn off Developer options</button><button class="g" data-v="main">Back</button>`;
    sheet.innerHTML = h;
    const q = document.getElementById("vk-q"); if (q) { const paint = () => { document.getElementById("vk-sg").innerHTML = suggest(q.value).map((r, i) => `<div class="r" data-s="${RULES.indexOf(r)}"><span>✦ ${esc(r.l())}</span></div>`).join(""); }; q.oninput = paint; paint(); }
  }
  async function act(a) {
    if (a === "close") { sheet.hidden = true; return; }
    if (a === "build") { if (S.devUnlocked) return toast("Developer options are already on"); taps++; if (taps >= 7) { S.devUnlocked = true; save(); toast("You are now a developer!"); } else if (taps >= 3) toast((7 - taps) + " more taps"); }
    if (a === "check") return checkUpdates(false); if (a === "install") return install();
    if (a === "usb") { if (NV) NV.openDeveloperSettings(); else toast("USB debugging is only available in the Android app"); }
    if (a === "exportlog") share("viper-log.txt", LOG.join("\n")); if (a === "clearlog") LOG.length = 0;
    if (a === "backup") share(C.name.replace(/\W+/g, "-") + "-backup.json", backup());
    if (a === "restore") { const i = document.createElement("input"); i.type = "file"; i.accept = ".json,application/json"; i.onchange = async () => { try { const j = JSON.parse(await i.files[0].text()); Object.entries(j.data || {}).forEach(([k, v]) => localStorage.setItem(k, v)); toast("Restored. Reloading…"); setTimeout(() => location.reload(), 800); } catch (e) { toast("Restore failed: " + e.message); } }; i.click(); }
    if (a === "cache") { try { if (window.caches) for (const k of await caches.keys()) await caches.delete(k); if (NV) await NV.clearCache(); toast("Cache cleared"); } catch (e) { toast(e.message); } }
    if (a === "reset") { if (confirm("Reset " + C.name + " settings to defaults? App data is kept.")) { localStorage.removeItem(P + "s"); location.reload(); } }
    if (a === "saverepo") { S.updateRepo = document.getElementById("vk-repo").value.trim(); save(); toast("Saved"); }
    if (a === "lock") { S.devUnlocked = false; taps = 0; save(); view = "main"; }
    render();
  }
  function boot() {
    const fab = el("vk-fab", "button"); fab.textContent = "✦"; fab.title = "Brain Cell & settings"; fab.setAttribute("aria-label", "Open Brain Cell and settings");
    sheet = el("vk-sheet"); sheet.hidden = true; el("vk-toast").hidden = true;
    fab.onclick = () => { sheet.hidden = !sheet.hidden; view = "main"; render(); };
    sheet.addEventListener("click", (e) => { const t = e.target.closest("[data-a],[data-v],[data-t],[data-f],[data-s]"); if (!t) return; const d = t.dataset;
      if (d.v) { view = d.v; if (d.v === "upd" && !UPD) return checkUpdates(false); render(); }
      else if (d.t) { S[d.t] = !S[d.t]; save(); look(); render(); } else if (d.f) { S.flags[d.f] = !S.flags[d.f]; save(); look(); render(); }
      else if (d.s) { RULES[+d.s].run(); render(); } else act(d.a); });
    osR.addEventListener && osR.addEventListener("change", () => { look(); render(); });
    look(); log("info", C.name + " " + C.version + " (" + C.code + ") " + (isNative ? "android" : "web"));
    if (NV) NV.info().then((i) => { NATIVE = i; }).catch(() => {});
    if (S.flags.autoUpdate && isNative) setTimeout(() => checkUpdates(true), 3000);
  }
  window.__vk = { S: () => S, suggest, newer, LOG, open: () => document.getElementById("vk-fab").click() };
  new MutationObserver(() => { if (ROOT && !ROOT.isConnected) root(); }).observe(document.documentElement, { childList: true });
  if (document.body) boot(); else document.addEventListener("DOMContentLoaded", boot);
})();

/**
 * SudoCut ranking board.
 *
 * DATA CONTRACT
 * -------------
 * Reads   design/rounds/<round>/manifest.json, written by tools/verify-round.mjs:
 *   { round, criteria: string[],
 *     variants: [{ id, model, label, path }] }      // order is the blind order
 *
 * Emits   design/rounds/<round>/RANKING.md, validated by tools/verify-round.mjs:
 *   a markdown table + a ```json block of
 *   { round, judge, date, blind, criteria,
 *     variants: [{ id, model, label, rank, scores{}, mean, note }] }
 *
 * Scores are 1-5. A note is REQUIRED on every variant — a ranking without
 * reasons cannot brief the next round, which is the whole point of the loop.
 *
 * Blind by default: model identity is hidden until you reveal it. Manifest order
 * is already shuffled deterministically upstream, so screen position carries no
 * signal about which model produced what.
 *
 * COST IS ALSO BLIND. tools/generate.mjs records each session's tokens and price
 * in the round's usage.json, but the price tiers differ per vendor — showing
 * "$0.41" next to a variant would identify the model as surely as its name. So
 * usage is loaded up front and rendered only after the blind is lifted.
 *
 * Zero dependencies. Must be served over HTTP (tools/serve.sh) because it
 * fetches the manifest and iframes the variants.
 */

(function () {
  "use strict";

  var $ = function (s) { return document.querySelector(s); };
  var params = new URLSearchParams(location.search);
  var round = params.get("round") || "";

  var state = { round: round, blind: true, judge: "", ratings: {} };
  var manifest = null;
  var usage = {};      // variant id -> { costUSD, usage, seconds, label, effort }
  var LS_KEY = "";

  var viewer = { open: false, index: 0, crit: 0 };

  /* ---------- persistence ---------- */

  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }

  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (saved && saved.ratings) {
        state.ratings = saved.ratings;
        state.blind = saved.blind !== false;
        state.judge = saved.judge || "";
      }
    } catch (e) { /* corrupt -> start fresh */ }
  }

  function ratingOf(id) {
    if (!state.ratings[id]) state.ratings[id] = { scores: {}, note: "" };
    return state.ratings[id];
  }

  function meanOf(id) {
    var r = ratingOf(id);
    var vals = manifest.criteria.map(function (c) { return r.scores[c]; }).filter(function (v) { return typeof v === "number"; });
    if (vals.length !== manifest.criteria.length) return null;
    return vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
  }

  function isComplete(id) {
    return meanOf(id) !== null && String(ratingOf(id).note || "").trim().length > 0;
  }

  /* ---------- ui bits ---------- */

  var toastTimer;
  function toast(msg) {
    var el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2400);
  }

  function notice(html) {
    var el = $("#notice");
    el.innerHTML = html;
    el.hidden = false;
  }

  function esc(v) {
    return String(v).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ---------- render ---------- */

  function buildCard(v) {
    var card = document.createElement("article");
    card.className = "card";
    card.dataset.id = v.id;

    var prev = document.createElement("div");
    prev.className = "preview";
    prev.title = "클릭하면 전체 화면";
    var fb = document.createElement("div");
    fb.className = "preview-fallback micro";
    fb.textContent = "미리보기 로딩 중…";
    prev.appendChild(fb);

    var frame = document.createElement("iframe");
    frame.setAttribute("loading", "lazy");
    frame.setAttribute("sandbox", "allow-same-origin");
    frame.src = "../rounds/" + manifest.round + "/" + v.path;
    frame.addEventListener("load", function () { fb.remove(); });
    prev.appendChild(frame);
    prev.addEventListener("click", function () { openViewer(indexOf(v.id)); });
    card.appendChild(prev);

    var head = document.createElement("div");
    head.className = "card-head";
    head.innerHTML =
      '<div><div class="card-label">' + esc(v.label) + '</div>' +
      '<div class="card-model" data-model>' + (state.blind ? "가려짐" : esc(v.model)) + "</div>" +
      '<div class="card-cost micro" data-cost></div></div>' +
      '<div class="card-mean" data-mean>—</div>';
    card.appendChild(head);

    var crits = document.createElement("div");
    crits.className = "criteria";
    manifest.criteria.forEach(function (c) {
      var row = document.createElement("div");
      row.className = "crit";
      var name = document.createElement("div");
      name.className = "crit-name";
      name.textContent = c;
      var scale = document.createElement("div");
      scale.className = "crit-scale";
      for (var n = 1; n <= 5; n++) {
        (function (n) {
          var b = document.createElement("button");
          b.type = "button";
          b.textContent = String(n);
          b.setAttribute("aria-label", c + " " + n);
          b.addEventListener("click", function () { setScore(v.id, c, n); });
          scale.appendChild(b);
        })(n);
      }
      row.appendChild(name);
      row.appendChild(scale);
      crits.appendChild(row);
    });
    card.appendChild(crits);

    var note = document.createElement("div");
    note.className = "note";
    var ta = document.createElement("textarea");
    ta.placeholder = "왜 이 점수인가? (필수 — 다음 라운드 브리프가 여기서 나옵니다)";
    ta.value = ratingOf(v.id).note || "";
    ta.addEventListener("input", function () {
      ratingOf(v.id).note = ta.value;
      save();
      paintCard(v.id);
      paintProgress();
    });
    note.appendChild(ta);
    card.appendChild(note);

    return card;
  }

  function indexOf(id) {
    for (var i = 0; i < manifest.variants.length; i++) if (manifest.variants[i].id === id) return i;
    return 0;
  }

  function paintCard(id) {
    var card = document.querySelector('.card[data-id="' + id + '"]');
    if (!card) return;
    var r = ratingOf(id);
    var rows = card.querySelectorAll(".crit");
    manifest.criteria.forEach(function (c, i) {
      var row = rows[i];
      if (!row) return;
      row.querySelectorAll("button").forEach(function (b, n) {
        b.setAttribute("aria-pressed", String(r.scores[c] === n + 1));
      });
    });
    var m = meanOf(id);
    card.querySelector("[data-mean]").textContent = m === null ? "—" : m.toFixed(1);
    card.classList.toggle("done", isComplete(id));
    var ta = card.querySelector("textarea");
    ta.classList.toggle("note-req", m !== null && !String(r.note || "").trim());
  }

  function paintProgress() {
    var total = manifest.variants.length;
    var done = manifest.variants.filter(function (v) { return isComplete(v.id); }).length;
    $("#progressText").textContent = done + " / " + total;
    $("#progressBar").style.width = total ? (done / total) * 100 + "%" : "0%";
    paintStandings();
  }

  function ranked() {
    return manifest.variants
      .map(function (v) { return { v: v, mean: meanOf(v.id) }; })
      .filter(function (x) { return x.mean !== null; })
      .sort(function (a, b) { return b.mean - a.mean; });
  }

  function paintStandings() {
    var rows = ranked();
    var sec = $("#standings");
    if (!rows.length) { sec.hidden = true; return; }
    sec.hidden = false;
    $("#standingsBody").innerHTML = rows.map(function (x, i) {
      var m = usage[x.v.id];
      var costCell = state.blind
        ? '<span class="micro">가려짐</span>'
        : (m && typeof m.costUSD === "number" ? "$" + m.costUSD.toFixed(4) : "—");
      return "<tr><td>" + (i + 1) + "</td><td>" + esc(x.v.label) + "</td><td>" +
        (state.blind ? '<span class="micro">가려짐</span>' : esc(x.v.model)) + "</td><td>" +
        x.mean.toFixed(1) + "</td><td>" + costCell + "</td><td>" +
        esc(ratingOf(x.v.id).note || "") + "</td></tr>";
    }).join("");
  }

  function setScore(id, crit, n) {
    ratingOf(id).scores[crit] = n;
    save();
    paintCard(id);
    paintProgress();
    if (viewer.open) paintViewer();
  }

  /** Format a session's cost + tokens. Only ever called after the blind lifts. */
  function costLine(id) {
    var m = usage[id];
    if (!m) return "";
    var bits = [];
    if (typeof m.costUSD === "number") bits.push("$" + m.costUSD.toFixed(4));
    if (m.usage) bits.push((m.usage.output || 0).toLocaleString() + " out");
    if (m.seconds) bits.push(m.seconds + "s");
    if (m.effort) bits.push("effort " + m.effort);
    return bits.join(" · ");
  }

  function setBlind(on) {
    state.blind = on;
    save();
    $("#btnBlind").setAttribute("aria-pressed", String(on));
    $("#btnBlind").textContent = on ? "🙈 블라인드" : "👁 공개됨";
    document.querySelectorAll(".card").forEach(function (card) {
      var v = manifest.variants[indexOf(card.dataset.id)];
      card.querySelector("[data-model]").textContent = on ? "가려짐" : v.model;
      // cost identifies the vendor as surely as the name — reveal together
      card.querySelector("[data-cost]").textContent = on ? "" : costLine(v.id);
    });
    var tot = $("#totalCost");
    if (tot) {
      var sum = Object.keys(usage).reduce(function (s, k) { return s + (usage[k].costUSD || 0); }, 0);
      tot.textContent = on || !sum ? "" : "라운드 합계 $" + sum.toFixed(4);
    }
    paintStandings();
    if (viewer.open) paintViewer();
  }

  /* ---------- fullscreen viewer ---------- */

  function openViewer(i) {
    viewer.open = true;
    viewer.index = i;
    viewer.crit = 0;
    $("#viewer").hidden = false;
    paintViewer();
  }

  function closeViewer() {
    viewer.open = false;
    $("#viewer").hidden = true;
    $("#viewerFrame").src = "about:blank";
  }

  function paintViewer() {
    var v = manifest.variants[viewer.index];
    if (!v) return;
    var src = "../rounds/" + manifest.round + "/" + v.path;
    var frame = $("#viewerFrame");
    if (frame.getAttribute("src") !== src) frame.setAttribute("src", src);
    $("#viewerLabel").textContent = v.label;
    $("#viewerModel").textContent = state.blind ? "가려짐" : v.model;
    var r = ratingOf(v.id);
    $("#viewerScore").innerHTML = manifest.criteria.map(function (c, i) {
      var s = r.scores[c];
      return '<span class="vs' + (i === viewer.crit ? " active" : "") + '">' +
        '<span class="crit-name">' + esc(c) + "</span>" +
        '<span class="card-mean">' + (s || "·") + "</span></span>";
    }).join("");
  }

  function viewerMove(d) {
    viewer.index = (viewer.index + d + manifest.variants.length) % manifest.variants.length;
    viewer.crit = 0;
    paintViewer();
  }

  document.addEventListener("keydown", function (e) {
    if (!viewer.open) return;
    if (e.key === "Escape") { closeViewer(); return; }
    if (e.key === "ArrowRight") { viewerMove(1); return; }
    if (e.key === "ArrowLeft") { viewerMove(-1); return; }
    if (/^[1-5]$/.test(e.key)) {
      var v = manifest.variants[viewer.index];
      var c = manifest.criteria[viewer.crit];
      setScore(v.id, c, Number(e.key));
      if (viewer.crit < manifest.criteria.length - 1) viewer.crit++;
      else viewerMove(1);
      paintViewer();
    }
  });

  /* ---------- export ---------- */

  function buildMarkdown() {
    var rows = ranked();
    var data = {
      round: manifest.round,
      judge: state.judge || "",
      date: new Date().toISOString().slice(0, 10),
      blind: state.blind,
      criteria: manifest.criteria,
      variants: rows.map(function (x, i) {
        var r = ratingOf(x.v.id);
        var m = usage[x.v.id] || {};
        return {
          id: x.v.id,
          model: x.v.model,
          label: x.v.label,
          rank: i + 1,
          scores: manifest.criteria.reduce(function (o, c) { o[c] = r.scores[c]; return o; }, {}),
          mean: Number(x.mean.toFixed(2)),
          note: String(r.note || "").trim(),
          costUSD: typeof m.costUSD === "number" ? Number(m.costUSD.toFixed(6)) : null,
          tokens: m.usage || null,
          seconds: m.seconds || null,
          effort: m.effort || null,
        };
      }),
    };
    data.totalCostUSD = Number(
      data.variants.reduce(function (s, v) { return s + (v.costUSD || 0); }, 0).toFixed(6),
    );

    var table = rows.map(function (x, i) {
      var r = ratingOf(x.v.id);
      var m = usage[x.v.id] || {};
      var c = typeof m.costUSD === "number" ? "$" + m.costUSD.toFixed(4) : "—";
      return "| " + (i + 1) + " | " + x.v.label + " | " + x.v.model + " | " + x.mean.toFixed(1) +
        " | " + c + " | " + String(r.note || "").replace(/\|/g, "\\|").replace(/\n/g, " ") + " |";
    }).join("\n");

    return "# " + manifest.round + " — ranking\n\n" +
      "Produced by the board (`bash tools/serve.sh`). Validated by `node tools/verify-round.mjs`.\n\n" +
      "**Judged blind** — model identity AND session cost were hidden until the ranking\n" +
      "was submitted. Cost identifies the vendor as surely as the name does.\n\n" +
      "## Result\n\n" +
      "| Rank | Variant | Model | Mean | Cost | Note |\n|---|---|---|---|---|---|\n" + table + "\n\n" +
      "Round total: **$" + data.totalCostUSD.toFixed(4) + "** across " + rows.length +
      " session(s). One design = one session, priced at list API rates from `design/models.json`.\n\n" +
      "## Data\n\n```json\n" + JSON.stringify(data, null, 2) + "\n```\n";
  }

  function exportRanking() {
    var incomplete = manifest.variants.filter(function (v) { return !isComplete(v.id); });
    if (incomplete.length) {
      toast(incomplete.length + "개 변형이 아직 미완성입니다 (점수 5개 + 메모 필수)");
      return;
    }
    var md = buildMarkdown();
    var dest = "design/rounds/" + manifest.round + "/RANKING.md";

    var blob = new Blob([md], { type: "text/markdown" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "RANKING.md";
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);

    if (navigator.clipboard) navigator.clipboard.writeText(md).catch(function () {});

    if (state.blind) { setBlind(false); toast("공개됨 — 저장 위치: " + dest); }
    else toast("저장 위치: " + dest);

    notice(
      "<strong>결과를 저장하세요.</strong> 클립보드에 복사되었고 <code>RANKING.md</code>로 다운로드했습니다.<br>" +
      "이 파일을 <code>" + dest + "</code> 에 넣은 뒤 <code>node tools/verify-round.mjs " + manifest.round + "</code> 로 검증하고, " +
      "<code>VERDICT.md</code> 를 작성하면 다음 라운드 브리프가 됩니다."
    );
  }

  /* ---------- boot ---------- */

  function boot(m) {
    manifest = m;
    LS_KEY = "sudocut-ranking-" + manifest.round;
    load();

    $("#roundLabel").textContent = "ROUND " + manifest.round.toUpperCase();
    document.title = "SudoCut · " + manifest.round + " 랭킹";

    var grid = $("#grid");
    manifest.variants.forEach(function (v) { grid.appendChild(buildCard(v)); });
    manifest.variants.forEach(function (v) { paintCard(v.id); });

    setBlind(state.blind);
    paintProgress();
    scalePreviews();

    $("#btnBlind").addEventListener("click", function () { setBlind(!state.blind); });
    $("#btnExport").addEventListener("click", exportRanking);
    $("#btnReset").addEventListener("click", function () {
      if (!confirm("이 라운드의 점수와 메모를 모두 지웁니다. 계속할까요?")) return;
      state.ratings = {};
      save();
      manifest.variants.forEach(function (v) { paintCard(v.id); });
      document.querySelectorAll(".card textarea").forEach(function (t) { t.value = ""; });
      paintProgress();
      toast("초기화됨");
    });
    $("#viewerPrev").addEventListener("click", function () { viewerMove(-1); });
    $("#viewerNext").addEventListener("click", function () { viewerMove(1); });
    $("#viewerClose").addEventListener("click", closeViewer);
  }

  function scalePreviews() {
    document.querySelectorAll(".preview").forEach(function (p) {
      var frame = p.querySelector("iframe");
      if (!frame) return;
      frame.style.transform = "scale(" + p.clientWidth / 1280 + ")";
    });
  }
  window.addEventListener("resize", scalePreviews);

  function fail(title, body) {
    document.querySelector("main").innerHTML = "";
    notice("<strong>" + title + "</strong><br>" + body);
  }

  if (location.protocol === "file:") {
    fail("HTTP로 열어야 합니다.",
      "이 보드는 manifest를 fetch 하기 때문에 <code>file://</code> 에서는 동작하지 않습니다.<br>" +
      "<code>bash tools/serve.sh</code> 를 실행한 뒤 출력된 주소를 여세요.");
    return;
  }

  if (!round) {
    fail("라운드를 지정하세요.",
      "예: <code>?round=r1</code><br><code>bash tools/serve.sh</code> 가 올바른 링크를 출력합니다.");
    return;
  }

  // usage.json is optional — a hand-assembled round has no cost data, and the
  // board must still work. Load it before boot so nothing renders un-blinded.
  Promise.all([
    fetch("../rounds/" + round + "/manifest.json", { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    }),
    fetch("../rounds/" + round + "/usage.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; }),
  ])
    .then(function (both) {
      var u = both[1];
      if (u && Array.isArray(u.variants)) {
        u.variants.forEach(function (v) { usage[v.id] = v; });
      }
      return both[0];
    })
    .then(boot)
    .catch(function () {
      fail("manifest를 찾을 수 없습니다: <code>design/rounds/" + esc(round) + "/manifest.json</code>",
        "먼저 변형을 생성하고 검증하세요:<br>" +
        "<code>node tools/generate.mjs " + esc(round) + "</code><br>" +
        "<code>node tools/verify-round.mjs " + esc(round) + "</code>");
    });
})();

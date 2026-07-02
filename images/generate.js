/* Basalt Stillness — 제주 돌담채 일러스트 세트 생성기
   레이어드 플랫 풍경. 시드 기반 손맛 돌담. */
const fs = require("fs");
const OUT = __dirname; // 이 스크립트 폴더(=images)에 SVG 출력

// ---- 팔레트 ----
const C = {
  paper: "#f2ece1",
  paper2: "#eae2d3",
  navy: "#2b3a55",
  navySoft: "#3f5170",
  sage: "#8a936f",
  sageDk: "#6f7857",
  terra: "#c08457",
  teal: "#a9c6c2",
  tealDk: "#88b0aa",
  sky1: "#e9ded0",
  sky2: "#dcd9cf",
  stone: "#4a5265",
  stone2: "#5a6376",
  stone3: "#3c4557",
};

// ---- 시드 난수 ----
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- 돌담(현무암 dry-stone wall): 불규칙 둥근 다각형 모자이크 ----
function wall(x, y, w, h, seed, opts = {}) {
  const r = mulberry32(seed);
  const rows = opts.rows || Math.max(3, Math.round(h / 26));
  const rowH = h / rows;
  let s = `<g>`;
  for (let i = 0; i < rows; i++) {
    const cy = y + i * rowH;
    let cx = x - r() * 20;
    while (cx < x + w) {
      const sw = rowH * (0.9 + r() * 1.1);
      const sh = rowH * (0.78 + r() * 0.22);
      const px = cx, py = cy + (rowH - sh) / 2 + (r() - 0.5) * 4;
      // 6~7각 둥근 돌
      const pts = [];
      const n = 6 + Math.round(r() * 1);
      for (let k = 0; k < n; k++) {
        const ang = (k / n) * Math.PI * 2 + r() * 0.4;
        const rad = (0.5 + r() * 0.12);
        pts.push([px + sw / 2 + Math.cos(ang) * sw * rad, py + sh / 2 + Math.sin(ang) * sh * rad]);
      }
      const fill = [C.stone, C.stone2, C.stone3][Math.floor(r() * 3)];
      const d = "M" + pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" L") + "Z";
      s += `<path d="${d}" fill="${fill}" stroke="${C.paper}" stroke-width="1.4" stroke-linejoin="round"/>`;
      cx += sw * 0.92;
    }
  }
  s += `</g>`;
  return s;
}

// ---- 오름(볼케닉 콘) 실루엣 ----
function oreum(cx, baseY, w, h, fill) {
  const x0 = cx - w / 2, x1 = cx + w / 2;
  return `<path d="M${x0},${baseY} C${x0 + w * 0.22},${baseY - h * 0.55} ${cx - w * 0.1},${baseY - h} ${cx},${baseY - h} C${cx + w * 0.1},${baseY - h} ${x1 - w * 0.22},${baseY - h * 0.55} ${x1},${baseY} Z" fill="${fill}"/>`;
}

// ---- 야자수 ----
function palm(x, groundY, scale, fill, seed) {
  const r = mulberry32(seed);
  const h = 150 * scale;
  const trunkW = 9 * scale;
  const topY = groundY - h;
  let s = `<g>`;
  // 트렁크 (살짝 휨)
  const bend = (r() - 0.5) * 30 * scale;
  s += `<path d="M${x - trunkW / 2},${groundY} Q${x + bend * 0.5},${groundY - h * 0.5} ${x + bend},${topY} L${x + bend + trunkW * 0.7},${topY} Q${x + bend * 0.5 + trunkW},${groundY - h * 0.5} ${x + trunkW / 2},${groundY} Z" fill="${fill}"/>`;
  // 프론드 (잎)
  const tx = x + bend + trunkW * 0.35, ty = topY;
  const fronds = 6;
  for (let i = 0; i < fronds; i++) {
    const ang = -Math.PI / 2 + (i - (fronds - 1) / 2) * 0.55 + (r() - 0.5) * 0.15;
    const len = (58 + r() * 26) * scale;
    const ex = tx + Math.cos(ang) * len;
    const ey = ty + Math.sin(ang) * len;
    const mx = tx + Math.cos(ang) * len * 0.5 + Math.sin(ang) * 14 * scale;
    const my = ty + Math.sin(ang) * len * 0.5 - Math.cos(ang) * 14 * scale;
    s += `<path d="M${tx},${ty} Q${mx},${my} ${ex},${ey}" fill="none" stroke="${fill}" stroke-width="${7 * scale}" stroke-linecap="round"/>`;
  }
  s += `</g>`;
  return s;
}

// ---- 잔물결/타이드 라인 ----
function tideLines(x, y, w, count, color, seed) {
  const r = mulberry32(seed);
  let s = "";
  for (let i = 0; i < count; i++) {
    const yy = y + i * (r() * 6 + 8);
    const lx = x + r() * w * 0.3;
    const lw = w * (0.3 + r() * 0.4);
    s += `<path d="M${lx},${yy} q${lw * 0.5},${(r() - 0.5) * 6} ${lw},0" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" opacity="0.5"/>`;
  }
  return s;
}

// ---- 문서 래퍼 ----
function svg(w, h, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;
}
function grain(w, h) {
  // 아주 옅은 종이 질감
  return `<rect width="${w}" height="${h}" fill="${C.paper}"/>`;
}

// ================= 씬 정의 =================
const scenes = {};

// HERO — 파노라마 해안: 하늘, 낮은 해, 바다, 오름 능선, 돌담 + 야자수
scenes.hero = (w, h) => {
  const sea = h * 0.62, ground = h * 0.78;
  let s = grain(w, h);
  // 하늘
  s += `<rect width="${w}" height="${sea}" fill="${C.sky1}"/>`;
  // 낮은 해
  s += `<circle cx="${w * 0.7}" cy="${sea - h * 0.16}" r="${h * 0.09}" fill="${C.terra}" opacity="0.85"/>`;
  // 오름 능선 (원경)
  s += oreum(w * 0.2, sea, w * 0.5, h * 0.2, C.navySoft);
  s += oreum(w * 0.55, sea, w * 0.6, h * 0.26, C.navy);
  s += oreum(w * 0.9, sea, w * 0.55, h * 0.18, C.navySoft);
  // 바다
  s += `<rect y="${sea}" width="${w}" height="${ground - sea}" fill="${C.teal}"/>`;
  s += tideLines(0, sea + 14, w, 10, C.tealDk, 7);
  // 전경 땅
  s += `<rect y="${ground}" width="${w}" height="${h - ground}" fill="${C.sageDk}"/>`;
  // 돌담 (전경 가로)
  s += wall(0, ground - 6, w, h - ground + 6, 42, { rows: 4 });
  // 야자수 두 그루
  s += palm(w * 0.12, ground + 6, 1.4, C.navy, 11);
  s += palm(w * 0.86, ground + 6, 1.15, C.navy, 23);
  return svg(w, h, s);
};

// INTRO — 잔잔: 단일 오름, 곡선 돌담, 야자 한 그루
scenes.intro = (w, h) => {
  const sea = h * 0.58, ground = h * 0.8;
  let s = grain(w, h);
  s += `<rect width="${w}" height="${sea}" fill="${C.sky2}"/>`;
  s += `<circle cx="${w * 0.24}" cy="${sea - h * 0.22}" r="${h * 0.07}" fill="${C.paper2}"/>`;
  s += oreum(w * 0.68, sea, w * 0.62, h * 0.28, C.navy);
  s += `<rect y="${sea}" width="${w}" height="${ground - sea}" fill="${C.teal}"/>`;
  s += tideLines(0, sea + 12, w, 7, C.tealDk, 3);
  s += `<rect y="${ground}" width="${w}" height="${h - ground}" fill="${C.sageDk}"/>`;
  s += wall(0, ground - 4, w, h - ground + 4, 88, { rows: 3 });
  s += palm(w * 0.8, ground + 4, 1.2, C.navy, 5);
  return svg(w, h, s);
};

// ROOM1 오션 풀빌라 — 인피니티 풀 + 바다 수평선 + 야자
scenes.room1 = (w, h) => {
  const sea = h * 0.42, pool = h * 0.6;
  let s = grain(w, h);
  s += `<rect width="${w}" height="${sea}" fill="${C.sky1}"/>`;
  s += oreum(w * 0.85, sea, w * 0.5, h * 0.16, C.navySoft);
  s += `<rect y="${sea}" width="${w}" height="${pool - sea}" fill="${C.tealDk}"/>`;
  // 데크
  s += `<rect y="${pool}" width="${w}" height="${h - pool}" fill="${C.paper2}"/>`;
  // 인피니티 풀
  s += `<rect x="${w * 0.08}" y="${pool - 6}" width="${w * 0.84}" height="${h - pool - h * 0.12}" rx="8" fill="${C.teal}"/>`;
  s += tideLines(w * 0.1, pool + 10, w * 0.8, 5, C.tealDk, 9);
  s += palm(w * 0.14, pool + 4, 1.0, C.navy, 15);
  return svg(w, h, s);
};

// ROOM2 가든 스위트 — 풀 + 돌담 정원 + 야자들
scenes.room2 = (w, h) => {
  const sky = h * 0.34, ground = h * 0.5;
  let s = grain(w, h);
  s += `<rect width="${w}" height="${sky}" fill="${C.sky2}"/>`;
  s += oreum(w * 0.3, sky, w * 0.5, h * 0.14, C.navySoft);
  // 정원 잔디
  s += `<rect y="${sky}" width="${w}" height="${h - sky}" fill="${C.sage}"/>`;
  // 돌담 정원 담
  s += wall(0, sky + 6, w, h * 0.12, 61, { rows: 3 });
  // 풀
  s += `<rect x="${w * 0.14}" y="${ground + h * 0.06}" width="${w * 0.72}" height="${h * 0.34}" rx="10" fill="${C.teal}"/>`;
  s += tideLines(w * 0.18, ground + h * 0.12, w * 0.6, 4, C.tealDk, 12);
  s += palm(w * 0.2, ground + h * 0.06, 0.9, C.navy, 33);
  s += palm(w * 0.82, ground + h * 0.06, 1.0, C.navy, 44);
  return svg(w, h, s);
};

// ROOM3 스톤 스탠다드 — 현무암 담 클로즈업 + 오름 뷰 (풀 없음)
scenes.room3 = (w, h) => {
  const sky = h * 0.4;
  let s = grain(w, h);
  s += `<rect width="${w}" height="${sky}" fill="${C.sky1}"/>`;
  s += oreum(w * 0.5, sky, w * 0.8, h * 0.24, C.navy);
  s += oreum(w * 0.15, sky, w * 0.45, h * 0.16, C.navySoft);
  // 큰 돌담 텍스처
  s += `<rect y="${sky}" width="${w}" height="${h - sky}" fill="${C.sageDk}"/>`;
  s += wall(0, sky, w, h - sky, 77, { rows: 6 });
  return svg(w, h, s);
};

// GALLERY (정사각 500)
scenes.g1 = (w, h) => { // 풀 물 + 야자 그림자
  let s = grain(w, h);
  s += `<rect width="${w}" height="${h}" fill="${C.teal}"/>`;
  s += tideLines(0, h * 0.2, w, 12, C.tealDk, 21);
  s += palm(w * 0.7, h * 0.95, 1.1, C.navy, 8);
  return svg(w, h, s);
};
scenes.g2 = (w, h) => { // 돌담 패턴 정면
  let s = grain(w, h);
  s += `<rect width="${w}" height="${h}" fill="${C.sageDk}"/>`;
  s += wall(0, 0, w, h, 99, { rows: 9 });
  return svg(w, h, s);
};
scenes.g3 = (w, h) => { // 노을 오름
  const sea = h * 0.62;
  let s = grain(w, h);
  s += `<rect width="${w}" height="${sea}" fill="${C.sky1}"/>`;
  s += `<circle cx="${w * 0.5}" cy="${sea - h * 0.1}" r="${h * 0.12}" fill="${C.terra}" opacity="0.8"/>`;
  s += oreum(w * 0.5, sea, w * 0.9, h * 0.34, C.navy);
  s += `<rect y="${sea}" width="${w}" height="${h - sea}" fill="${C.teal}"/>`;
  s += tideLines(0, sea + 12, w, 8, C.tealDk, 4);
  return svg(w, h, s);
};
scenes.g4 = (w, h) => { // 야자 크라운 클로즈업 (하늘 배경)
  let s = grain(w, h);
  s += `<rect width="${w}" height="${h}" fill="${C.sky2}"/>`;
  s += `<circle cx="${w * 0.72}" cy="${h * 0.26}" r="${h * 0.1}" fill="${C.paper2}"/>`;
  s += palm(w * 0.4, h * 1.35, 2.1, C.navy, 6);
  return svg(w, h, s);
};
scenes.g5 = (w, h) => { // 바다 타이드 라인 미니멀
  let s = grain(w, h);
  s += `<rect width="${w}" height="${h * 0.35}" fill="${C.sky1}"/>`;
  s += `<rect y="${h * 0.35}" width="${w}" height="${h * 0.65}" fill="${C.tealDk}"/>`;
  s += tideLines(0, h * 0.4, w, 16, C.teal, 55);
  return svg(w, h, s);
};
scenes.g6 = (w, h) => { // 디딤돌 길 + 잔디
  let s = grain(w, h);
  s += `<rect width="${w}" height="${h}" fill="${C.sage}"/>`;
  // 곡선 디딤돌
  const r = mulberry32(70);
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const cx = w * (0.3 + Math.sin(t * 2.4) * 0.22);
    const cy = h * (0.95 - t * 0.85);
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${34 - i * 2}" ry="${16 - i}" fill="${C.stone}" stroke="${C.paper}" stroke-width="1.4"/>`;
  }
  s += palm(w * 0.82, h * 0.5, 0.8, C.navy, 90);
  return svg(w, h, s);
};

// ================= 출력 =================
const jobs = [
  ["hero", 1600, 1000],
  ["intro", 1000, 620],
  ["room1", 700, 460],
  ["room2", 700, 460],
  ["room3", 700, 460],
  ["g1", 500, 500],
  ["g2", 500, 500],
  ["g3", 500, 500],
  ["g4", 500, 500],
  ["g5", 500, 500],
  ["g6", 500, 500],
];
for (const [name, w, h] of jobs) {
  const out = scenes[name](w, h);
  fs.writeFileSync(`${OUT}/${name}.svg`, out);
  // 렌더용 HTML
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0}html,body{width:${w}px;height:${h}px;overflow:hidden}</style></head><body>${out}</body></html>`;
  fs.writeFileSync(`${OUT}/${name}.html`, html);
}
console.log("SVG " + jobs.length + "개 생성");
console.log(jobs.map((j) => j[0]).join(","));

(() => {
  const ORDER = ['home', 'about', 'research', 'experiment', 'design', 'brand'];
  const NAV_IDS = {
    home: ['1:237', '1:238', '1:239', '1:240', '1:241', '1:242', '1:243', '1:244'],
    about: ['1:246', '1:247', '1:248', '1:249', '1:250', '1:251', '1:252', '1:253', '1:254', '1:255'],
    research: ['1:305', '1:306', '1:307', '1:308', '1:309', '1:310', '1:311', '1:312', '1:313', '1:314'],
    experiment: ['1:539', '1:540', '1:541', '1:542', '1:543', '1:544', '1:545', '1:546', '1:547', '1:548'],
    design: ['1:871', '1:872', '1:873', '1:874', '1:875', '1:876', '1:877', '1:878', '1:879', '1:880'],
    brand: ['1:702', '1:703', '1:704', '1:705', '1:706', '1:707', '1:708', '1:709', '1:710', '1:711'],
  };
  // 페이지 맨 위 제목: 페이지가 바뀔 때 이어서 움직이는 요소
  const HERO = {
    home: { title: '1:10', label: null },
    about: { title: '1:257', label: '1:256' },
    research: { title: '1:316', label: '1:315' },
    experiment: { title: '1:550', label: '1:549' },
    design: { title: '1:882', label: '1:881' },
    brand: { title: '1:713', label: '1:712' },
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const pages = {};
  document.querySelectorAll('.page').forEach(s => { pages[s.dataset.page] = s; });
  const rootOf = k => pages[k].querySelector('.frame > div');
  const q = (k, id) => pages[k].querySelector(`[data-node-id="${id}"]`);

  let current = null;
  let z = 1;

  /* 화면 폭에 맞춰 1080 프레임을 확대 */
  function fit() {
    z = Math.min(window.innerWidth / 1080, 1.25);
    document.documentElement.style.setProperty('--z', z);
  }
  fit();
  addEventListener('resize', () => { fit(); refresh(); });

  // 프레임 안 좌표(피그마 px)
  function box(el, k = current) {
    const fr = rootOf(k).getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const s = fr.width / 1080;
    return { x: (r.left - fr.left) / s, y: (r.top - fr.top) / s, w: r.width / s, h: r.height / s };
  }
  const inside = (b, o, t = 1.5) => o.x >= b.x - t && o.y >= b.y - t && o.x + o.w <= b.x + b.w + t && o.y + o.h <= b.y + b.h + t;

  /* 알림 */
  const toastEl = document.getElementById('toast');
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('on'), 1900);
  }

  /* 헤더 */
  const navLinks = [...document.querySelectorAll('.hd-nav [data-k]')];
  const ind = document.querySelector('.hd-ind');
  function placeInd(el) {
    if (!el) { ind.style.opacity = 0; return; }
    ind.style.opacity = 1;
    ind.style.left = el.offsetLeft + 'px';
    ind.style.width = el.offsetWidth + 'px';
  }
  const activeLink = () => navLinks.find(a => a.dataset.k === current);
  navLinks.forEach(a => {
    a.addEventListener('mouseenter', () => placeInd(a));
    a.addEventListener('mouseleave', () => placeInd(activeLink()));
  });
  document.querySelector('.hd-nav .soon').addEventListener('click', () => toast('아카이브는 준비 중이에요'));

  /* 페이지별 준비: 마우스 반응 목록 */
  const setupDone = {};
  const zones = {}; // k -> [{b, enter, leave, on}]

  function addZone(k, b, enter, leave) {
    (zones[k] ||= []).push({ b, enter, leave, on: false });
  }
  function addHit(k, b, label, onClick, href) {
    const a = document.createElement(href ? 'a' : 'button');
    a.className = 'hit';
    if (href) a.href = href;
    a.setAttribute('aria-label', label);
    Object.assign(a.style, { left: b.x + 'px', top: b.y + 'px', width: b.w + 'px', height: b.h + 'px' });
    a.addEventListener('click', e => { e.preventDefault(); onClick(e); });
    rootOf(k).appendChild(a);
    return a;
  }
  const cls = (els, c, on) => els.forEach(e => e && e.classList.toggle(c, on));

  function setup(k) {
    if (setupDone[k]) return;
    setupDone[k] = true;
    const root = rootOf(k);
    NAV_IDS[k].forEach(id => q(k, id)?.classList.add('gone'));
    const kids = [...root.children].filter(e => !e.classList.contains('gone'));
    kids.forEach(e => e.classList.add('fx'));

    // 사진: 올리면 살짝 다가옴
    root.querySelectorAll('img').forEach(img => {
      if (img.closest('[data-node-id="1:4"]')) return;
      const holder = img.parentElement.classList.contains('overflow-hidden') ? img.parentElement.parentElement : img.parentElement;
      const b = box(holder, k);
      if (b.w < 120 || b.h < 80 || b.h > 900) return;
      holder.classList.add('zoomable');
      addZone(k, b, () => holder.classList.add('hot-img'), () => holder.classList.remove('hot-img'));
    });

    // 카드: 바탕 면과 그 위 글자를 한 덩어리로 들어 올림
    const SKIP = new Set(['1:45', '1:205', '1:210', '1:215', '1:840', '1:844', '1:848', '1:852', '1:856']);
    const boxes = new Map(kids.map(e => [e, box(e, k)]));
    kids.forEach(rect => {
      if (rect.tagName !== 'DIV' || rect.children.length || SKIP.has(rect.dataset.nodeId)) return;
      if (!/bg-\[#(11141a|121417|090a0d)\]/.test(rect.className)) return;
      const b = boxes.get(rect);
      if (b.h < 54 || b.w < 100 || b.w > 460) return;
      const group = kids.filter(e => e !== rect && inside(b, boxes.get(e)));
      const lines = group.filter(e => /h-px|h-\[0\.844px\]/.test(e.className) && Math.abs(boxes.get(e).y - b.y) < 2);
      const extra = CARD_EXTRA[rect.dataset.nodeId];
      addZone(k, b, () => {
        cls([rect, ...group], 'hot', true); rect.classList.add('hot-bg'); cls(lines, 'hot-line', true);
        extra?.(k, true);
      }, () => {
        cls([rect, ...group], 'hot', false); rect.classList.remove('hot-bg'); cls(lines, 'hot-line', false);
        extra?.(k, false);
      });
    });

    // 다음 페이지로 가는 NEXT 블록
    kids.forEach((label, i) => {
      if (label.textContent.trim() !== 'N E X T') return;
      const title = kids[i + 1], arrow = kids[i + 2];
      const tb = boxes.get(title), ab = boxes.get(arrow), lb = boxes.get(label);
      const dest = (arrow.textContent.split('·')[1] || '').replace('→', '').trim().toLowerCase();
      const b = { x: 80, y: lb.y - 28, w: 920, h: ab.y + ab.h + 22 - (lb.y - 28) };
      addZone(k, b, () => { title.classList.add('hot-push'); arrow.style.letterSpacing = '2.2px'; label.classList.add('hot-red'); },
        () => { title.classList.remove('hot-push'); arrow.style.letterSpacing = ''; label.classList.remove('hot-red'); });
      addHit(k, b, title.textContent.trim() + ' 페이지로', () => go(dest, { src: title }), ORDER.includes(dest) ? '#' + dest : undefined);
    });

    PAGE_SETUP[k]?.(k, root);
  }

  /* 카드별 덧붙는 움직임 (브랜드 심볼·조형 요소) */
  const T = (k, id, v) => { const e = q(k, id); if (e) { e.classList.add('fx'); e.style.transform = v; } };
  const CARD_EXTRA = {
    '1:774': (k, on) => T(k, '1:775', on ? 'rotate(45deg)' : ''),
    '1:779': (k, on) => { const e = q(k, '1:780')?.firstElementChild; if (e) { e.classList.add('fx'); e.style.transform = on ? 'rotate(0deg)' : ''; } },
    '1:754': (k, on) => { T(k, '1:756', on ? 'translateX(8px)' : ''); T(k, '1:757', on ? 'translateX(-8px)' : ''); },
    '1:889': (k, on) => T(k, '1:890', on ? 'translateY(-3px)' : ''),
    '1:894': (k, on) => T(k, '1:895', on ? 'translateY(-3px)' : ''),
    '1:899': (k, on) => T(k, '1:900', on ? 'translateY(-3px)' : ''),
    '1:904': (k, on) => T(k, '1:905', on ? 'translateY(-3px)' : ''),
  };

  const PAGE_SETUP = {
    home(k, root) {
      // 히어로: 지구와 로고가 아주 천천히 떠 있음
      const earth = q(k, '1:8'), logo = q(k, '1:12');
      if (!reduced) {
        earth.classList.add('float-earth'); logo.classList.add('float-logo');
      }

      // 머리 태그와 반입 조건 알약
      [['1:80', '1:79'], ['1:82', '1:81'], ['1:84', '1:83'], ['1:86', '1:85'], ['1:88', '1:87']].forEach(([r, t]) => {
        const rect = q(k, r), txt = q(k, t);
        addZone(k, box(rect, k), () => { rect.style.borderColor = '#5c6166'; txt.classList.add('hot-ink'); },
          () => { rect.style.borderColor = ''; txt.classList.remove('hot-ink'); });
      });
      [['1:226', '1:227'], ['1:228', '1:229'], ['1:230', '1:231'], ['1:232', '1:233']].forEach(([r, t]) => {
        const rect = q(k, r), txt = q(k, t);
        addZone(k, box(rect, k), () => { rect.classList.add('hot-bg'); txt.classList.add('hot-ink'); },
          () => { rect.classList.remove('hot-bg'); txt.classList.remove('hot-ink'); });
      });

      // 언제: 아침·점심·저녁 표시
      [['1:190', '1:191', '1:192'], ['1:194', '1:195', '1:196'], ['1:198', '1:199', '1:200']].forEach(([ln, dot, lab]) => {
        const l = q(k, ln), d = q(k, dot), t = q(k, lab), b = box(l, k);
        d.classList.add('fx');
        addZone(k, { x: b.x - 36, y: b.y - 24, w: 72, h: 90 },
          () => { l.style.backgroundColor = '#5ce5c3'; t.classList.add('hot-teal'); },
          () => { l.style.backgroundColor = ''; t.classList.remove('hot-teal'); });
      });

      // 어디서: 오른쪽 설명에 올리면 도면 위 링이 그 지점으로 옮겨감
      const draw = q(k, '1:105');
      const ring = document.createElement('i');
      ring.className = 'ring';
      draw.appendChild(ring);
      const spots = [
        { at: [163.69, 118.13], els: ['1:119'], rows: ['1:148', '1:149', '1:150', '1:151'] },
        { at: [243.84, 118.12], els: ['1:126'], rows: ['1:152', '1:153', '1:154', '1:155'] },
        { at: [101.25, 207.56], els: ['1:130', '1:131', '1:132', '1:133'], rows: ['1:156', '1:157', '1:158', '1:159'] },
        { at: [313.87, 246.37], els: ['1:137'], rows: ['1:160', '1:161', '1:162', '1:163'] },
      ];
      spots.forEach(s => s.rows.forEach(id => q(k, id)?.classList.add('fx')));
      function pick(i) {
        const s = spots[i];
        ring.style.left = s.at[0] - 12.5 + 'px'; ring.style.top = s.at[1] - 12.5 + 'px';
        spots.forEach((o, j) => {
          o.els.forEach(id => q(k, id).classList.toggle('hl', j === i));
          o.rows.forEach(id => q(k, id).classList.toggle('callout-dim', j !== i));
        });
      }
      pick(0);
      spots.forEach((s, i) => {
        const first = box(q(k, s.rows[0]), k);
        addZone(k, { x: first.x - 6, y: first.y - 6, w: 372, h: 64 }, () => pick(i), () => {});
      });
      addZone(k, box(draw, k), () => {}, () => pick(0));

      // 가져갈 것 세 가지: 누르면 디자인 페이지의 그 부분으로 이어짐
      const kits = [
        { img: '1:36', title: '1:37', x: 67.5, to: '1:921', sec: 1620, name: '숟가락 · 포크' },
        { img: '1:39', title: '1:40', x: 388.125, to: '1:957', sec: 3000, name: '가위' },
        { img: '1:41', title: '1:42', x: 707.906, to: '1:963', sec: 3710, name: '트레이' },
      ];
      kits.forEach(c => {
        const b = { x: c.x, y: 2556.56, w: 247.5, h: 278 };
        const t = q(k, c.title);
        addZone(k, b, () => t.classList.add('hot-teal', 'hot-push'), () => t.classList.remove('hot-teal', 'hot-push'));
        addHit(k, b, c.name + ' 디자인 보기', () => go('design', { src: q(k, c.img), target: c.to, sec: c.sec }), '#design');
      });

      // 목차: 올린 줄로 강조 면이 미끄러져 옮겨감
      const rows = [
        { n: '1:47', t: '1:48', l: '1:49', a: '1:50', to: 'about' },
        { n: '1:52', t: '1:53', l: '1:90', a: '1:54', to: 'research' },
        { n: '1:56', t: '1:57', l: '1:91', a: '1:58', to: 'experiment' },
        { n: '1:60', t: '1:61', l: '1:62', a: '1:63', to: 'design' },
        { n: '1:65', t: '1:66', l: '1:67', a: '1:68', to: 'brand' },
        { n: '1:70', t: '1:71', l: '1:72', a: '1:73', to: 'archive' },
      ];
      const hl = q(k, '1:45');
      hl.classList.add('fx');
      rows.forEach(r => ['n', 't', 'l', 'a'].forEach(p => q(k, r[p]).classList.add('fx')));
      function row(i, hover) {
        hl.style.transform = `translateY(${i * 72.5625}px)`;
        rows.forEach((r, j) => {
          const on = j === i, push = on && hover;
          q(k, r.n).style.color = on ? '#d9566a' : '#5c6166';
          q(k, r.a).style.color = on ? '#d9566a' : '#5c6166';
          q(k, r.a).style.translate = push ? '3px 0' : '';
          q(k, r.t).style.translate = push ? '4px 0' : '';
          q(k, r.l).style.color = push ? '#f2f3f1' : '';
        });
      }
      row(0);
      rows.forEach((r, i) => {
        const b = { x: 47.25, y: 2956.5 + i * 72.5625, w: 965, h: 72.5625 };
        addZone(k, b, () => row(i, true), () => {});
        addHit(k, b, q(k, r.t).textContent.trim(), () => go(r.to, { src: q(k, r.t) }), ORDER.includes(r.to) ? '#' + r.to : undefined);
      });
      addZone(k, { x: 47.25, y: 2956.5, w: 965, h: 72.5625 * 6 }, () => {}, () => row(0));

      // 왼쪽 스크롤 레일: 읽은 만큼 붉은 선이 내려감
      const bar = q(k, '1:100');
      const dots = [['1:94', '1:95'], ['1:96', '1:97'], ['1:98', '1:99']].map(([d, l]) => ({ d: q(k, d), l: q(k, l), y: box(q(k, d), k).y }));
      const red = dots[0].d.querySelector('img').src, grey = dots[1].d.querySelector('img').src;
      bar.classList.remove('fx');
      railFn = () => {
        const r = root.getBoundingClientRect(), s = r.width / 1080;
        const y = (innerHeight * .55 - r.top) / s;
        const h = Math.max(0, Math.min(3375, y - 126.56));
        bar.style.height = h + 'px';
        dots.forEach(o => {
          const on = 126.56 + h >= o.y;
          o.d.querySelector('img').src = on ? red : grey;
          o.l.querySelector('p').style.color = on ? '#d9566a' : '#5c6166';
        });
      };
    },

    brand(k) {
      // 색 견본: 누르면 색 코드 복사
      [['1:841', '#090A0D'], ['1:845', '#11141A'], ['1:849', '#1E232B'], ['1:853', '#5CE5C3'], ['1:857', '#F2F3F1']].forEach(([id, hex]) => {
        const sw = q(k, id), bg = sw.previousElementSibling, b = box(sw, k);
        addZone(k, b, () => { sw.style.borderColor = '#5a616b'; sw.style.translate = bg.style.translate = '0 -2px'; },
          () => { sw.style.borderColor = ''; sw.style.translate = bg.style.translate = ''; });
        addHit(k, { ...b, h: b.h + 46 }, hex + ' 복사', () => {
          navigator.clipboard?.writeText(hex).then(() => toast(hex + ' 복사했어요'), () => toast(hex));
        });
      });
    },
  };
  let railFn = null;

  /* 마우스 위치로 반응 영역 판정 (글자가 위에 겹쳐 있어도 동작) */
  let px = -1, py = -1;
  function refresh() {
    if (!current || px < 0) return;
    const root = rootOf(current), r = root.getBoundingClientRect(), s = r.width / 1080;
    const x = (px - r.left) / s, y = (py - r.top) / s;
    (zones[current] || []).forEach(zn => {
      const hit = x >= zn.b.x && x <= zn.b.x + zn.b.w && y >= zn.b.y && y <= zn.b.y + zn.b.h;
      if (hit && !zn.on) { zn.on = true; zn.enter(); }
      else if (!hit && zn.on) { zn.on = false; zn.leave(); }
    });
  }
  addEventListener('mousemove', e => { px = e.clientX; py = e.clientY; refresh(); }, { passive: true });
  document.addEventListener('mouseleave', () => { px = py = -99999; refresh(); px = -1; });
  addEventListener('scroll', () => { refresh(); if (current === 'home') railFn?.(); }, { passive: true });

  /* 스크롤하면 차례로 떠오름 */
  let io;
  function reveal(k) {
    io?.disconnect();
    if (reduced) return;
    const root = rootOf(k);
    const els = [...root.children].filter(e => e.classList.contains('fx') && !e.classList.contains('hit'));
    io = new IntersectionObserver(ents => {
      ents.forEach(en => {
        if (!en.isIntersecting) return;
        const e = en.target;
        e.classList.add('in');
        io.unobserve(e);
        setTimeout(() => { e.style.transitionDelay = ''; }, 1400);
      });
    }, { rootMargin: '0px' });
    els.forEach(e => {
      const b = box(e, k);
      if (b.h > 700 || e.dataset.nodeId === '1:3' || e.dataset.nodeId === '1:4') return;
      e.classList.remove('in');
      e.classList.add('rv');
      e.style.transitionDelay = Math.round(Math.max(0, Math.min(b.x, 1000)) / 1000 * 160) + 'ms';
      io.observe(e);
    });
  }

  /* 페이지 이동: 누른 요소가 다음 페이지 제목(또는 사진)으로 이어서 움직임 */
  function show(k) {
    Object.values(pages).forEach(p => p.classList.toggle('on', p === pages[k]));
    current = k;
    // 움직임 준비에서 오류가 나도 화면은 그대로 보이게
    try { setup(k); reveal(k); } catch (err) { console.error(err); }
    navLinks.forEach(a => a.classList.toggle('on', a.dataset.k === k));
    placeInd(activeLink());
    document.title = k === 'home' ? '달그락 · DAL GEU LOCK' : `${k.toUpperCase()} · 달그락`;
    if (k === 'home') railFn?.();
  }
  const heroEl = (k, part = 'title') => HERO[k][part] && q(k, HERO[k][part]);

  function go(k, opt = {}, push = true) {
    if (k === 'archive') { toast('아카이브는 준비 중이에요'); return; }
    if (!pages[k]) k = 'home';
    if (push) history.pushState(null, '', '#' + k);
    if (k === current && !opt.target) { scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); return; }

    const from = current;
    const src = opt.src || (from && heroEl(from));
    const srcLabel = from && !opt.target && !opt.src && heroEl(from, 'label');
    let dst = null, dstLabel = null;

    const swap = () => {
      if (src) src.style.viewTransitionName = '';
      if (srcLabel) srcLabel.style.viewTransitionName = '';
      show(k);
      dst = opt.target ? q(k, opt.target) : heroEl(k);
      dstLabel = !opt.target && heroEl(k, 'label');
      let top = 0;
      if (opt.sec) {
        const r = rootOf(k).getBoundingClientRect();
        top = scrollY + r.top + (opt.sec - 100) * (r.width / 1080);
      }
      scrollTo(0, top);
      if (dst) { dst.style.viewTransitionName = opt.target ? 'morph' : 'hero-title'; }
      if (dstLabel && srcLabel) dstLabel.style.viewTransitionName = 'hero-label';
    };

    if (!document.startViewTransition || reduced || !from) { swap(); clearNames(); return; }
    if (src) src.style.viewTransitionName = opt.target ? 'morph' : 'hero-title';
    if (srcLabel && heroEl(k, 'label')) srcLabel.style.viewTransitionName = 'hero-label';
    // 탭이 백그라운드라 화면을 못 그리면 전환이 멈출 수 있어, 0.5초 안에 시작 못 하면 바로 넘김
    let started = false;
    const t = document.startViewTransition(() => { started = true; swap(); });
    setTimeout(() => { if (!started) t.skipTransition(); }, 500);
    [t.ready, t.updateCallbackDone].forEach(p => p.catch(() => {}));
    t.finished.catch(() => {}).finally(clearNames);
    function clearNames() {
      [src, srcLabel, dst, dstLabel].forEach(e => e && (e.style.viewTransitionName = ''));
    }
  }

  document.querySelectorAll('[data-go]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    go(a.dataset.go);
  }));
  addEventListener('popstate', () => go(parseHash(), {}, false));
  function parseHash() { const m = location.hash.match(/#\/?(\w+)/); return m ? m[1] : 'home'; }

  // 글꼴을 기다리되, 늦어도 1초 뒤에는 무조건 시작
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    show(pages[parseHash()] ? parseHash() : 'home');
  };
  document.fonts?.ready.then(start);
  setTimeout(start, 1000);
})();

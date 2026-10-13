$(function () {
  const current = location.pathname.split('/').pop();
  const isHomePage = !current || current === 'index.html' || !current.includes('.');

  // Loading Screen Controller with Monochrome Binary Code Waves
  const $loader = $('#site-loader');
  const canvas = document.getElementById('loaderCanvas');
  let animId = null;
  let resizeHandler = null;
  let loaderDismissed = false;

  if (canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let grid = [];
    const charSpacingX = 20;
    const charSpacingY = 24;
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      const cols = Math.ceil(width / charSpacingX) + 1;
      const rows = Math.ceil(height / charSpacingY) + 1;
      grid = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          row.push(Math.random() < 0.5 ? '1' : '0');
        }
        grid.push(row);
      }
    };

    resizeHandler = resize;
    resize();
    window.addEventListener('resize', resizeHandler);

    let lastFlip = 0;
    const render = (time) => {
      if (!ctx || loaderDismissed) return;

      ctx.clearRect(0, 0, width, height);
      ctx.font = '10px "Press Start 2P", "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const rows = grid.length;
      const cols = rows > 0 ? grid[0].length : 0;

      // Occasional subtle bit-flip to simulate live machine execution
      if (!prefersReducedMotion && time - lastFlip > 90 && rows > 0 && cols > 0) {
        lastFlip = time;
        for (let i = 0; i < 4; i++) {
          const rr = Math.floor(Math.random() * rows);
          const cc = Math.floor(Math.random() * cols);
          grid[rr][cc] = grid[rr][cc] === '1' ? '0' : '1';
        }
      }

      const centerX = width / 2;
      const centerY = height / 2;
      const t = prefersReducedMotion ? 0 : time;

      for (let r = 0; r < rows; r++) {
        const baseY = r * charSpacingY;
        for (let c = 0; c < cols; c++) {
          const baseX = c * charSpacingX;

          // Combined undulating code waves + subtle expanding pulse
          const dist = Math.hypot(baseX - centerX, baseY - centerY);
          const wave1 = Math.sin((baseX * 0.007) + (baseY * 0.004) - (t * 0.0022));
          const wave2 = Math.cos((dist * 0.01) - (t * 0.0028));
          const waveVal = (wave1 + wave2) * 0.5; // -1 to 1

          // Low opacity range: subtle baseline 0.035 up to 0.20 peak
          const alpha = 0.035 + Math.max(0, waveVal) * 0.165;

          // Gentle vertical undulating ripple
          const waveY = baseY + (prefersReducedMotion ? 0 : Math.sin((baseX * 0.012) + (t * 0.0018)) * 3);

          ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
          ctx.fillText(grid[r][c], baseX, waveY);
        }
      }

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    animId = requestAnimationFrame(render);
  }

  function dismissLoader() {
    if (!$loader.length || loaderDismissed) return;
    loaderDismissed = true;
    if (animId) cancelAnimationFrame(animId);
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    $loader.addClass('loaded');
    setTimeout(() => $loader.remove(), 500);
  }

  if ($loader.length) {
    setTimeout(dismissLoader, 3000); // Safety fallback timeout
  }

  const fragments = [
    ['#site-header', 'header.html'],
    ...(isHomePage
      ? [
          ['#intro-section', 'intro.html'],
          ['#casestudies-section', 'casestudies.html'],
          ['#skills-section', 'skills-section.html'],
          ['#projects-section', 'projects.html'],
        ]
      : []),
  ];

  const loadFragment = ([selector, path]) =>
    new Promise((resolve, reject) => {
      const $target = $(selector);
      if (!$target.length) {
        reject(new Error(`Missing page fragment target: ${selector}`));
        return;
      }

      $target.load(path, (_response, status, xhr) => {
        if (status === 'error') {
          reject(new Error(`Failed to load ${path}: ${xhr.status} ${xhr.statusText}`));
          return;
        }
        resolve();
      });
    });

  const minDisplay = new Promise((resolve) => setTimeout(resolve, 600));

  Promise.all([minDisplay, ...fragments.map(loadFragment)])
    .then(() => {
      dismissLoader();

      const $links = $('#site-header .nav-link');
      const setActive = ($link) => {
        $links.removeClass('active').removeAttr('aria-current');
        $link.addClass('active').attr('aria-current', 'page');
      };

      // Other pages: highlight the link matching the page (e.g. skills.html)
      if (!isHomePage) {
        $links.each(function () {
          if ($(this).attr('href') === current) setActive($(this));
        });
        return;
      }

      // Home page: highlight the link for section in view
      const sectionIds = ['intro', 'casestudies', 'skills', 'projects'];
      const sections = sectionIds
        .map((id) => document.getElementById(id))
        .filter(Boolean);

      const updateActiveSection = () => {
        const scrollPos = window.scrollY + 160;
        const atPageBottom =
          window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 20;

        let currentId = 'intro';
        if (atPageBottom && sections.length > 0) {
          currentId = sections[sections.length - 1].id;
        } else {
          for (const section of sections) {
            if (section.offsetTop <= scrollPos) {
              currentId = section.id;
            }
          }
        }

        $links.removeClass('active').removeAttr('aria-current');

        if (currentId === 'intro') {
          $links.filter((_, el) => $(el).attr('href') === 'index.html').addClass('active').attr('aria-current', 'page');
        } else {
          $links.filter((_, el) => $(el).attr('href')?.endsWith('#' + currentId)).addClass('active').attr('aria-current', 'page');
        }
      };

      window.addEventListener('scroll', updateActiveSection, { passive: true });
      window.addEventListener('resize', updateActiveSection);

      if (location.hash) {
        document.getElementById(location.hash.slice(1))?.scrollIntoView();
      }
      updateActiveSection();

      const track = document.getElementById('projectTrack');
      const prevBtn = document.getElementById('projPrev');
      const nextBtn = document.getElementById('projNext');
      const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (track && prevBtn && nextBtn) {
        const scrollTrack = (direction) =>
          track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: smooth ? 'smooth' : 'auto' });

        prevBtn.addEventListener('click', () => scrollTrack(-1));
        nextBtn.addEventListener('click', () => scrollTrack(1));

        const updateButtons = () => {
          prevBtn.disabled = track.scrollLeft <= 1;
          nextBtn.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
        };
        track.addEventListener('scroll', updateButtons, { passive: true });
        window.addEventListener('resize', updateButtons);
        updateButtons();
      }

      // Slot machine mini-game
      const slotSpin = document.getElementById('slotSpin');
      const slotMsg = document.getElementById('slotMsg');
      const reels = [0, 1, 2].map((i) => document.getElementById('r' + i));

      if (slotSpin && slotMsg && reels.every(Boolean)) {
        const SYMBOLS = [
          { name: 'coffee', src: 'images/coffee.png' },
          { name: 'smiley', src: 'images/Smiley.png' },
          { name: 'tayaki', src: 'images/Tayaki.png' },
          { name: 'cherries', src: 'images/Cherries.png' },
          { name: 'heart', src: 'images/heart.png' },
          { name: 'meemo', src: 'images/Meemo.png' },
        ];

        const JACKPOT_FORTUNES = {
          coffee: 'Legendary Fuel: +100% Wireframing Speed & Infinite Coffee Buff!',
          smiley: 'Pure Good Vibes: 100% User Delight & Frictionless Hand-offs!',
          tayaki: 'Sweet Snack: The Creative Breakthrough You Needed Just Landed!',
          cherries: 'Triple Jackpot: Intuitive UX, Seamless UI, & Shipped on Time!',
          heart: 'Empathetic Prodigy: Masterful User-Centric Design Unlocked!',
          meemo: 'Critical Debuff: Triple Meemo! Dog stole all design files and demanded treats.',
        };

        const TRIPLE_MEEMO_DEBUFFS = [
          'Critical Debuff: Triple Meemo! Dog stole all design files and demanded treats.',
          'Critical Debuff: Triple Meemo! Dog fell asleep on your lap. You are legally forbidden from moving.',
          'Critical Debuff: Triple Meemo! Critical eye contact made. All productivity sacrificed to belly rubs.',
          'Critical Debuff: Triple Meemo! Dog stepped on the trackpad and dragged your artboard into the void.',
          'Critical Debuff: Triple Meemo! Dog pushed the laptop closed. Mandatory couch nap time.',
        ];

        const MEEMO_CHANCE_FORTUNES = [
          'Puppy Luck: Meemo grants +25% creative inspiration on your next design sprint.',
          'Chance Booster: Dog moral support brings an unexpected UX breakthrough today.',
          'Lucky Charm: Meemo blessed this roll. Smooth stakeholder approval incoming!',
          'Puppy Buff: A quick head pat gives you +20% focus for your next prototype.',
        ];

        const GENERAL_FORTUNES = [
          'Your user interviews will reveal pure product gold today.',
          'The devs will implement your micro-interactions on the first try!',
          'Prototyping flow state: Zero bugs found in today’s user test.',
          'Stakeholders will instantly approve your design on slide one.',
          'Today brings 0 Figma merge conflicts and clean auto-layouts.',
          'Your next design iteration will boost engagement by 40%.',
          'An unexpected creative insight will solve that sticky UX problem.',
          'You and engineering are on the exact same wavelength today.',
          'That edge case you solved will save the product roadmap.',
          'Clean design systems today; seamless design velocity tomorrow.',
        ];

        let timers = [];
        let spinning = false;

        // Weighted symbol pool: standard symbols appear with higher frequency than rare Meemo
        const WEIGHTED_SYMBOLS = [
          ...SYMBOLS.filter((s) => s.name !== 'meemo'),
          ...SYMBOLS.filter((s) => s.name !== 'meemo'),
          SYMBOLS.find((s) => s.name === 'meemo'),
        ];

        const randSymbol = (weighted = true) => {
          const pool = weighted ? WEIGHTED_SYMBOLS : SYMBOLS;
          return pool[Math.floor(Math.random() * pool.length)];
        };

        const setReelSymbol = (reelEl, symbol) => {
          reelEl.innerHTML = `<img src="${symbol.src}" alt="${symbol.name}">`;
        };

        const spin = () => {
          if (spinning) return;
          spinning = true;
          slotSpin.disabled = true;
          slotMsg.textContent = 'Consulting the UX cosmos...';
          reels.forEach((r) => r.classList.remove('win-sparkle', 'debuff-nap'));

          // Rare Triple Meemo debuff (~5% chance) or standard jackpot (~8% chance)
          const willDebuff = Math.random() < 0.05;
          const willJackpot = !willDebuff && Math.random() < 0.08;
          const meemoSymbol = SYMBOLS.find((s) => s.name === 'meemo');
          const nonMeemoSymbols = SYMBOLS.filter((s) => s.name !== 'meemo');
          const jackpotSymbol = willJackpot
            ? nonMeemoSymbols[Math.floor(Math.random() * nonMeemoSymbols.length)]
            : null;

          const results = [];

          reels.forEach((r, i) => {
            r.classList.add('spin');
            timers[i] = setInterval(() => {
              setReelSymbol(r, randSymbol(false));
            }, 70);

            setTimeout(() => {
              clearInterval(timers[i]);
              r.classList.remove('spin');
              const chosen = willDebuff
                ? meemoSymbol
                : (willJackpot ? jackpotSymbol : randSymbol(true));
              setReelSymbol(r, chosen);
              results[i] = chosen.name;

              if (i === 2) {
                spinning = false;
                slotSpin.disabled = false;
                const isWin = results[0] === results[1] && results[1] === results[2];
                if (isWin) {
                  if (results[0] === 'meemo') {
                    const debuff = TRIPLE_MEEMO_DEBUFFS[Math.floor(Math.random() * TRIPLE_MEEMO_DEBUFFS.length)];
                    slotMsg.textContent = debuff;
                    reels.forEach((reel) => reel.classList.add('debuff-nap'));
                  } else {
                    slotMsg.textContent = JACKPOT_FORTUNES[results[0]] || 'JACKPOT: Maximum Design Synergy!';
                    reels.forEach((reel) => reel.classList.add('win-sparkle'));
                  }
                } else if (results.includes('meemo')) {
                  const chanceBonus = MEEMO_CHANCE_FORTUNES[Math.floor(Math.random() * MEEMO_CHANCE_FORTUNES.length)];
                  slotMsg.textContent = chanceBonus;
                } else {
                  const randomFortune = GENERAL_FORTUNES[Math.floor(Math.random() * GENERAL_FORTUNES.length)];
                  slotMsg.textContent = randomFortune;
                }
              }
            }, 800 + i * 500);
          });
        };

        slotSpin.addEventListener('click', spin);
      }
    })
    .catch((error) => console.error('Failed to load page content.', error));
});
$(function () {
  const current = location.pathname.split('/').pop() || 'index.html';
  const fragments = [
    ['#site-header', 'header.html'],
    ...(current === 'index.html'
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

  Promise.all(fragments.map(loadFragment))
    .then(() => {
      const $links = $('#site-header .nav-link');
      const setActive = ($link) => {
        $links.removeClass('active').removeAttr('aria-current');
        $link.addClass('active').attr('aria-current', 'page');
      };

      // Other pages: highlight the link matching the page (e.g. skills.html)
      if (current !== 'index.html') {
        $links.each(function () {
          if ($(this).attr('href') === current) setActive($(this));
        });
        return;
      }

      // Home page: highlight the link for section in view
      const sections = ['intro', 'casestudies', 'skills', 'projects']
        .map((id) => document.getElementById(id))
        .filter(Boolean);

      const linkFor = (id) =>
        id === 'intro'
          ? $links.filter('[href="index.html"]')
          : $links.filter('[href="index.html#' + id + ']');

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) setActive(linkFor(entry.target.id));
          });
        },
        // Trigger when a section crosses the middle band of the viewport
        { rootMargin: '-40% 0px -55% 0px' }
      );

      sections.forEach((section) => observer.observe(section));

      if (location.hash) {
        document.getElementById(location.hash.slice(1))?.scrollIntoView();
      }

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
    })
    .catch((error) => console.error('Failed to load page content.', error));
});
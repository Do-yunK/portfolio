$(function () {
  $('#site-header').load('header.html', function () {
    const current = location.pathname.split('/').pop() || 'index.html';
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

    // Home page: highlight the link for the section currently in view
    const sections = ['intro', 'casestudies', 'skills', 'projects']
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const linkFor = (id) =>
      id === 'intro'
        ? $links.filter('[href="index.html"]')
        : $links.filter('[href="index.html#' + id + '"]');

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
  });
});
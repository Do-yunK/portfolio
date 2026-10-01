$(function () {
  $('#site-header').load('header.html', function () {
    // Highlight the link for the current page
    const current = location.pathname.split('/').pop() || 'index.html';

    $('#site-header .nav-link').each(function () {
      const href = $(this).attr('href');
      if (href === current) {
        $(this).addClass('active').attr('aria-current', 'page');
      }
    });
  });
});
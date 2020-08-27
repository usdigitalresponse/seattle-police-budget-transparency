var formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0
})

$(document).ready(function () {
  'use strict';

  $('body').scrollspy({
    target: '.fixed-side-navbar',
    offset: 200
  });

  // Add smooth scrolling to all links
  $(".fixed-side-navbar a, .primary-button a").on('click', function (ev) {
    if (this.hash !== "") {
      ev.preventDefault();

      var hash = this.hash;
      $('html, body').animate({
        scrollTop: $(hash).offset().top
      }, 800, function () {
        window.location.hash = hash;
      });
    }
  });

  draw_treemap()
  $('template.datetime').template(refresh_date);
  $('[data-toggle="tooltip"]').tooltip()
});

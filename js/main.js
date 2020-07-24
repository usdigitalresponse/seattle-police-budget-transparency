var formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0
})

function wrap(text) {
  text.each(function () {
    var text = d3.select(this);
    var words = text.text().split(/\s+/).reverse();
    var lineHeight = 10;
    var width = parseFloat(text.attr('width'));
    var y = parseFloat(text.attr('y'));
    var x = text.attr('x');
    var dx = text.attr('dx');
    var dy = text.attr('dy');

    var tspan = text.text(null).append('tspan').attr('x', x).attr('y', y);
    var lineNumber = 1;
    var line = [];
    var word = words.pop();

    while (word) {
      line.push(word);
      tspan.text(line.join(' '));
      if (tspan.node().getComputedTextLength() > width) {
        lineNumber += 1;
        line.pop();
        tspan.text(line.join(' '));
        line = [word];
        tspan = text.append('tspan')
                    .attr('x', x)
                    .attr('y', y + (lineNumber * lineHeight))
                    .attr('dx', dx)
                    .text(word);
      }
      word = words.pop();
    }
  });
}

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

  var treedata = {
    name: "root",
    children: [{
      name: 'layer1',
      children: []
    }]
  }

  var config = {
    value: 'Budget',
    name: 'Function Name'
  }

  const tree = new treeMap(
    document.querySelector('.treemap'),
    treedata,
    config
  );

  var $datatable = $('script#datatable')
  d3.csv('data.csv').then(function (data) {
    data = data.map((d) => ({
      ...d,
      value: +d[config.value]
    }))
    data.sort(function (a, b) {
      return b[config.value] - a[config.value];
    });
    $datatable.template({
      data: data
    })
    treedata.children = [{
      name: 'a',
      children: data
    }]
    tree.update(treedata)
    d3.selectAll('.label').call(wrap)
    d3.selectAll('.rect').on('click', function (d) {
      d3.selectAll('.rect').attr('opacity', '0.4')
      d3.select(this).attr('opacity', 1)
      d3.selectAll('tr').style('opacity', 1)
      d3.select('#row-' + d.data['Function Name'].replace(/[^A-Z0-9]/ig, "_")).style('opacity', '0.5')
    })
  })
});

function csvtojson(datum){
  var nested_data = d3.nest()
    .key(function(d) { return d['Bureau']; })
    .key(function(d) { return d['Function Name']; })
    .entries(datum);

  data = {"name": "SPD", children: []}
  var _children = function(cdh){
    var t = []
    cdh.forEach(d => {
      var child = {name: d.key, value: +d.values[0].Budget, ...d}
      t.push(child)
    })
    return t
  }
  nested_data.forEach(d => data.children.push({"name": d.key, children: _children(d.values)}))
  // data.children = data.children.filter(d => d.name != "")
  return data
}

var state = 1;
var $datatable = $('script#datatable')
function drawTable(data, _filter){
  col = 'Bureau';
  if(_filter != 'SPD'){
    state = 2;
    col = 'Function Name'
    data = data.filter(d => d.Bureau == _filter)
  } else {
    state = 1;
  }

  $('#chart-title').text(col)

  data =_(data)
    .groupBy(col)
    .map((objs, key) => ({
        'name': key,
        'budget': _.sumBy(objs, item => +item.Budget) }))
    .value();
  $datatable.template({data: _.orderBy(data, ['budget'],['desc'])})
}

var tool = d3.select("body").append("div").attr("class", "toolTip");

function draw_treemap() {
  var margin = {
      top: 30,
      right: 0,
      bottom: 20,
      left: 0
    },
    width = 1060 - 25,
    height = 600 - margin.top - margin.bottom,
    formatNumber = d3.format(","),
    transitioning;

  var x = d3.scaleLinear()
    .domain([0, width])
    .range([0, width]);
  var y = d3.scaleLinear()
    .domain([0, height])
    .range([0, height]);
  var treemap = d3.treemap()
    .tile(d3.treemapSquarify.ratio(1))
    .size([width, height])
    .paddingInner(0)
    .round(false);

  var w = width + margin.left + margin.right,
    h = height + margin.bottom + margin.top;

  var svg = d3.select('.treemap').append("svg")
    .attr('preserveAspectRatio', 'xMinYMin meet')
    .attr('viewBox', '0 0 ' + w + ' ' + h)
    .style("margin-left", -margin.left + "px")
    .style("margin.right", -margin.right + "px")
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .style("shape-rendering", "crispEdges");

  var grandparent = svg.append("g")
    .attr("class", "grandparent");
  grandparent.append("rect")
    .attr("y", -margin.top)
    .attr("width", width)
    .attr("height", margin.top)
    .attr("fill", '#bbbbbb');
  grandparent.append("text")
    .attr("x", 6)
    .attr("y", 6 - margin.top)
    .attr("dy", ".75em");

  d3.csv("data.csv").then(function (df) {
    var clonedata = df;
    drawTable(df, 'SPD')
    df = csvtojson(df)
    var root = d3.hierarchy(df);
    treemap(root
      .sum(function (d) {
        return d.value;
      })
      .sort(function (a, b) {
        return b.height - a.height || b.value - a.value
      })
    );

    display(root);

    function display(d) {
      grandparent
        .datum(d.parent)
        .on("click", transition)
        .select("text")
        .text(name(d));

      grandparent
        .datum(d.parent)
        .select("rect")
        .attr("fill", function () {
          return '#bbbbbb'
        });
      var g1 = svg.insert("g", ".grandparent")
        .datum(d)
        .attr("class", "depth");

      var g = g1.selectAll("g")
        .data(d.children)
        .enter()
        .append("g");

      g.filter(function (d) {
          return d.children;
        })
        .classed("children", true)
        .on("click", transition);

      g.selectAll(".child")
        .data(function (d) {
          return d.children || [d];
        })
        .enter().append("rect")
        .attr("class", "child")
        .call(rect);

      g.append("rect")
        .attr("class", "parent")
        .call(rect)
        .append("title")
        .text(function (d) {
          return d.data.name;
        });

      g.append("foreignObject")
        .call(rect)
        .attr("class", "foreignobj")
        .append("xhtml:div")
          .attr("dy", ".75em")
          .html(function (d) {
            return '' +
              '<p class="title"> ' + d.data.name + '</p>' +
              '<p>' + formatNumber(d.value) + '</p>';
          })
          .attr("class", "textdiv");

      function transition(d) {
        drawTable(clonedata, d.data.name)
        if (transitioning || !d) return;
        transitioning = true;
        var g2 = display(d),
          t1 = g1.transition().duration(650),
          t2 = g2.transition().duration(650);

        x.domain([d.x0, d.x1]);
        y.domain([d.y0, d.y1]);

        svg.style("shape-rendering", null);

        svg.selectAll(".depth").sort(function (a, b) {
          return a.depth - b.depth;
        });

        g2.selectAll("text").style("fill-opacity", 0);
        g2.selectAll("foreignObject div").style("display", "none");

        t1.selectAll("text").call(text).style("fill-opacity", 0);
        t2.selectAll("text").call(text).style("fill-opacity", 1);
        t1.selectAll("rect").call(rect);
        t2.selectAll("rect").call(rect);

        t1.selectAll(".textdiv").style("display", "none");

        t1.selectAll(".foreignobj").call(foreign);

        t2.selectAll(".textdiv").style("display", "block");

        t2.selectAll(".foreignobj").call(foreign);

        t1.on("end.remove", function () {
          this.remove();
          transitioning = false;
        });

        if(state > 1){
          svg.selectAll('foreignObject')
          .on("mousemove", function (d) {
            tool.style("left", d3.event.pageX + 10 + "px")
            tool.style("top", d3.event.pageY - 20 + "px")
            tool.style("display", "inline-block");
            tool.html(`
              <div class="container-fluid p-3">
                <h3>${d.data.name}</h3>
                <small class="text-muted">${d.data.values[0]['Function Description ']}</small>
                <div class="my-4">
                  <h6>Labor Representation</h6>
                  <div class="text-muted">${d.data.values[0]['Labor Representation']}</div>
                </div>
                <div class="d-flex">
                  <div>
                    <h6 class="mb-0">Civilian FTE</h6>
                    <div class="text-primary font-weight-bold">${d.data.values[0]['Civilian FTE']}</div>
                  </div>
                  <div class="ml-auto">
                    <h6 class="mb-0">Sworn FTE</h6>
                    <div class="text-primary font-weight-bold">${d.data.values[0]['Sworn FTE']}</div>
                  </div>
                </div>
                <div class="mt-2">
                  <h6 class="mb-0">Budget</h6>
                  <div class="text-primary font-weight-bold">${formatter.format(d.data.value)}</div>
                 </div>
              </div>
            `);
          })
          .on("mouseout", function (d) {
            tool.style("display", "none");
          });
        }
      }
      return g;
    }

    function text(text) {
      text.attr("x", function (d) {
          return x(d.x) + 6;
        })
        .attr("y", function (d) {
          return y(d.y) + 6;
        });
    }

    function rect(rect) {
      rect
        .attr("x", function (d) {
          return x(d.x0);
        })
        .attr("y", function (d) {
          return y(d.y0);
        })
        .attr("width", function (d) {
          return x(d.x1) - x(d.x0);
        })
        .attr("height", function (d) {
          return y(d.y1) - y(d.y0);
        })
        .attr("fill", function (d) {
          let clr = state == 1 ? '#220FCC' : '#C6133D';
          return clr;
        });
    }

    function foreign(foreign) {
      foreign
        .attr("x", function (d) {
          return x(d.x0);
        })
        .attr("y", function (d) {
          return y(d.y0);
        })
        .attr("width", function (d) {
          return x(d.x1) - x(d.x0);
        })
        .attr("height", function (d) {
          return y(d.y1) - y(d.y0);
        });
    }

    function name(d) {
      return breadcrumbs(d) +
        (d.parent ?
          " " :
          " ");
    }

    function breadcrumbs(d) {
      var res = "";
      var sep = " > ";
      d.ancestors().reverse().forEach(function (i) {
        res += i.data.name + sep;
      });
      return res
        .split(sep)
        .filter(function (i) {
          return i !== "";
        })
        .join(sep);
    }
  });
}

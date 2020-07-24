/* jshint esversion: 6 */

class treeMap {
  constructor(dom, data, config) {
    this.data = data;
    this.element = dom;
    this.value = config.value || 'value';
    this.name = config.name || 'name';

    // create the chart
    this.draw();
  }

  draw() {
    this.margin = {
      top: 20,
      right: 20,
      bottom: 30,
      left: 0
    };
    this.width = 960 - this.margin.left - this.margin.right;
    this.height = 500 - this.margin.top - this.margin.bottom;

    this.w = this.width + this.margin.left + this.margin.right;
    this.h = this.height + this.margin.top + this.margin.bottom;

    this.element.innerHTML = '';
    const svg = d3.select(this.element).append('svg');
    // svg.attr("height", 300);
    svg.attr('preserveAspectRatio', 'xMinYMin meet');
    svg.attr('viewBox', '0 0 ' + this.w + ' ' + this.h);

    this.plot = svg.append("g")
      .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.treemap = d3.treemap()
      .padding(1)
      .round(true);

    // create the other stuff
    this.drawShapes();
  }

  drawShapes() {
    let _this = this;
    let duration = 1000;

    let root = d3.hierarchy(this.data)
      .sum(d => d[this.value])
      .sort((a, b) => b[this.value] - a[this.value]);

    this.treemap.size([this.w, this.h]);
    const leaves = this.treemap(root).leaves();

    var _values = leaves.map(d => +d.data[this.value])

    const rects = this.plot.selectAll(".rect")
      .data(leaves, d => d.data[this.name]);

    const labels = this.plot.selectAll(".label")
      .data(leaves.filter(f => f.x1 - f.x0 > 60 && f.y1 - f.y0 > 30), d => d.data[this.name]);

    rects.exit()
      .transition().duration(duration)
      .remove();

    rects.transition().duration(duration)
      .attr("transform", d => `translate(${d.x0},${d.y0})`)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0);

    var linearcolors = d3.scaleLinear()
      .domain(d3.extent(_values.sort().reverse().filter((_,i) => i)))
      .range(['#0525da', '#3259dc'])
      .interpolate(d3.interpolateHcl);

    rects.enter().append("rect")
      .attr("class", "rect")
      .style("fill", function(d){
        return +d.data[_this.value] >= d3.max(_values) ? '#ff3247' : '#3259dc';
      })
      .attr("transform", d => `translate(${d.x0},${d.y0})`)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .transition().duration(duration);

    labels.exit()
      .style("opacity", 1)
      .transition().duration(duration)
      .style("opacity", 1e-6)
      .remove();

    labels.enter().append("text")
      .attr("class", "label")
      .attr("dy", "0.9em")
      .attr("dx", "0.35em")
      .attr('width', d => d.x1 - d.x0)
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      // .attr("transform", d => `translate(${d.x0}, ${d.y0})`)
      .text(d => d.data[this.name])
      .attr('font-size', '0.6em')
      // .html(d => `<tspan style='font-size: 0.8em'>${d.data[this.name]}</tspan>`)
      .style("opacity", 1e-6)
      .attr('fill', '#fff')
      .transition().duration(duration)
      .style("opacity", 1);
  }

  update(newData) {
    this.data = newData;
    // update shapes
    this.drawShapes();
  }
}

// Script 2
// Data Visualization II - Treemap

var treemapSVG = d3.select("#treemap"),
    width = Math.min(+treemapSVG.attr("width"), window.innerWidth*.9),
    height = Math.min(+treemapSVG.attr("height"), window.innerHeight*.9);

var fader = function(color) { return d3.interpolateRgb(color, "#fff")(0.2); },
    color = d3.scaleOrdinal().range(["#98abc5", "#f68b1e", "#a05d56", "#6b486b"]),
    format = d3.format(",d");

var treemap = d3.treemap()
    .tile(d3.treemapResquarify)
    .size([width, height])
    .round(true)
    .paddingInner(1);

d3.json("assets/data/us.json", function(error, data) {
  if (error) throw error;

  var root = d3.hierarchy(data)
      .eachBefore(function(d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name; })
      .sum(sumBySize)
      .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

  treemap(root);

  var cell = treemapSVG.selectAll("g")
    .data(root.leaves())
    .enter().append("g")
      .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

  cell.append("rect")
      .attr("id", function(d) { return d.data.id; })
      .attr("width", function(d) { return d.x1 - d.x0; })
      .attr("height", function(d) { return d.y1 - d.y0; })
      .attr("fill", function(d) { return color(d.parent.data.id); });

  cell.append("clipPath")
      .attr("id", function(d) { return "clip-" + d.data.id; })
    .append("use")
      .attr("xlink:href", function(d) { return "#" + d.data.id; });

  cell.append("text")
        .attr("class", "tree-text")
      .attr("clip-path", function(d) { return "url(#clip-" + d.data.id + ")"; })
    .selectAll("tspan")
      .data(function(d) { return d.data.name.split(/(?=[A-Z][^A-Z])/g); })
    .enter().append("tspan")
      .attr("x", 5)
      .attr("y", function(d, i) { return 17 + i * 15; })
      .text(function(d) { return d; });

  cell.append("title")
      .text(function(d) { return d.data.id + "\n" + format(d.value); });

  d3.selectAll("#tree-form input")
      .data([sumBySize, percent], function(d) { return d ? d.name : this.value; })
      .on("change", changed);

  function changed(sum) {
    treemap(root.sum(sum));

    cell.transition()
        .duration(750)
        .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
      .select("rect")
        .attr("width", function(d) { return d.x1 - d.x0; })
        .attr("height", function(d) { return d.y1 - d.y0; });
  }
});

function percent(d) {
  return d["Total College"]/d["Population"];
}

function sumBySize(d) {
  return d["Total College"];
}

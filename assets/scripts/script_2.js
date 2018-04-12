var el_id = 'chart';
var treeSumSortType = "number";

var obj = document.getElementById(el_id);

var divWidth = obj.offsetWidth;

var margin = {top: 30, right: 0, bottom: 20, left: 0},
    width = divWidth,
    height = 500 - margin.top - margin.bottom,
    formatNumber = d3.format(","),
    transitioning;

var color = d3.scaleLinear().domain([0, 1/4*5000000, 2/4*5000000, 3/4*5000000, 5000000]).range(["#73c3bf", "#a1d8c8", "#cbe0a7", "#f2db84"]);

// sets x and y scale to determine size of visible boxes
var x = d3.scaleLinear()
    .domain([0, width])
    .range([0, width]);

var y = d3.scaleLinear()
    .domain([0, height])
    .range([0, height]);

var treemap = d3.treemap()
        .size([width, height])
        .paddingInner(0)
        .round(false);

var svg = d3.select('#'+el_id).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.bottom + margin.top)
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
        .attr("fill", '#FF9B42');

    grandparent.append("text")
        .attr("x", 10)
        .attr("y", 10 - margin.top)
        .attr("dy", ".75em");

d3.json("assets/data/us.json", function(data) {
    var root = d3.hierarchy(data);

    treemap(root
        .sum(function (d) {
            if (treeSumSortType == "number") {
                return d["Total College"];
            } else {
                return d["Percent College"];
            }

        })
        .sort(function (a, b) {
            if (treeSumSortType == "number") {
                return b.height - a.height || b["Total College"] - a["Total College"];
            } else {
               return b.height - a.height || b["Percent College"] - a["Percent College"]
            }

        })
    );

    display(root);

    function display(d) {
        // write text into grandparent
        // and activate click's handler
        grandparent
            .datum(d.parent)
            .on("click", transition)
            .select("text")
            .text(name(d));
        // grandparent color
        grandparent
            .datum(d.parent)
            .select("rect")
            .attr("fill", function () {
                return '#f7af72'
            });
        var g1 = svg.insert("g", ".grandparent")
            .datum(d)
            .attr("class", "depth");
        var g = g1.selectAll("g")
            .data(d.children)
            .enter().
            append("g");
        // add class and click handler to all g's with children
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
        // add title to parents
        g.append("rect")
            .attr("class", "parent")
            .call(rect)
            .append("title")
            .text(function (d){
                return d.data.name;
            });
        /* Adding a foreign object instead of a text object, allows for text wrapping */
        g.append("foreignObject")
            .call(rect)
            .attr("class", "foreignobj")
            .append("xhtml:div")
            .attr("dy", ".75em")
            .html(function (d) {
                var html = '' +
                    '<p class="title"> ' + d.data.name + '</p>' +
                    '<p class="value">' + formatNumber(d.value) + '</p>';

                return html;
            })
            .attr("class", "textdiv"); //textdiv class allows us to style the text easily with CSS
        function transition(d) {
            if (transitioning || !d) return;
            transitioning = true;
            var g2 = display(d),
                t1 = g1.transition().duration(650),
                t2 = g2.transition().duration(650);
            // Update the domain only after entering new elements.
            x.domain([d.x0, d.x1]);
            y.domain([d.y0, d.y1]);
            // Enable anti-aliasing during the transition.
            svg.style("shape-rendering", null);
            // Draw child nodes on top of parent nodes.
            svg.selectAll(".depth").sort(function (a, b) {
                return a.depth - b.depth;
            });
            // Fade-in entering text.
            g2.selectAll("text").style("fill-opacity", 0);
            g2.selectAll("foreignObject div").style("display", "none");
            /*added*/
            // Transition to the new view.
            t1.selectAll("text").call(text).style("fill-opacity", 0);
            t2.selectAll("text").call(text).style("fill-opacity", 1);
            t1.selectAll("rect").call(rect);
            t2.selectAll("rect").call(rect);
            /* Foreign object */
            t1.selectAll(".textdiv").style("display", "none");
            /* added */
            t1.selectAll(".foreignobj").call(foreign);
            /* added */
            t2.selectAll(".textdiv").style("display", "block");
            /* added */
            t2.selectAll(".foreignobj").call(foreign);
            /* added */
            // Remove the old node when the transition is finished.
            t1.on("end.remove", function(){
                this.remove();
                transitioning = false;
            });
        }

        document.forms[0].addEventListener("change", function() {
            treeSumSortType = document.forms[0].elements["treeSum"].value;
            treemap(root
            .sum(function (d) {
                if (treeSumSortType == "number") {
                    color = d3.scaleLinear().domain([0, 1/4*5000000, 2/4*5000000, 3/4*5000000, 5000000]).range(["#73c3bf", "#a1d8c8", "#cbe0a7", "#f2db84"]);
                    return d["Total College"];
                } else if (treeSumSortType == "percent") {
                    color = d3.scaleLinear().domain([0, 1/4*50, 2/4*50, 3/4*50, 50]).range(["#73c3bf", "#a1d8c8", "#cbe0a7", "#f2db84"]);
                    return d["Percent College"];
                } else if (treeSumSortType == "male") {
                    color = d3.scaleLinear().domain([0, 1/4*50, 2/4*50, 3/4*50, 50]).range(["#73c3bf", "#a1d8c8", "#cbe0a7", "#f2db84"]);
                    return d["Percent College - Male"];
                } else {
                    color = d3.scaleLinear().domain([0, 1/4*50, 2/4*50, 3/4*50, 50]).range(["#73c3bf", "#a1d8c8", "#cbe0a7", "#f2db84"]);
                    return d["Percent College - Female"];
                }

            })
            .sort(function (a, b) {
                if (treeSumSortType == "number") {
                    return b.height - a.height || b["Total College"] - a["Total College"];
                } else if (treeSumSortType == "percent") {
                    return b.height - a.height || b["Percent College"] - a["Percent College"];
                } else if (treeSumSortType == "male") {
                    return b.height - a.height || b["Percent College - Male"] - a["Percent College - Male"]
                } else {
                    return b.height - a.height || b["Percent College - Female"] - a["Percent College - Female"]
                }

            })
        );

        display(root);
        });

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
            .attr("fill", function(d) { return color(d.value); });
    }

    function foreign(foreign) { /* added */
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
            (d.parent
            ? " -  Click To Zoom Out"
            : " - Click a Region to Inspect States");
    }

    function breadcrumbs(d) {
        var res = "";
        var sep = " > ";
        d.ancestors().reverse().forEach(function(i){
            res += i.data.name + sep;
        });
        return res
            .split(sep)
            .filter(function(i){
                return i!== "";
            })
            .join(sep);
    }
});

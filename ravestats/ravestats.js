var cellSize = 7, // cell size
    paddingSize = 4,
    height = 500,
    width = cellSize * 7 + (paddingSize * 2);

var day = function(d) { return (d.getDay() + 6) % 7; },
    week = d3.time.format("%W");

var format = d3.time.format("%Y-%m-%d");

var color = d3.scale.quantize()
    .domain([0, 800])
    .range(d3.range(25).map(function(d) { return "q" + d + "-25"; }));

var data; // global data variable

///////////////////////////////////////////////////////////////////////////////
// Left right and bottom panels

var svgleft = d3.select(".leftside")
    .append("svg")
    .attr("width", 120)
    .attr("height", 400)
    .append("g")
    .attr("transform", "translate(" + 0 + "," + 0 + ")");

var svgright = d3.select(".rightside")
    .append("svg")
    .attr("width", 150)
    .attr("height", 400)
    .append("g")
    .attr("transform", "translate(" + 0 + "," + 0 + ")");

var monthAbbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul",
                 "Aug", "Sep", "Oct", "Nov", "Dec"];

svgleft.selectAll("text")
    .data(monthAbbr)
    .enter()
    .append("text")
    .attr("class", "title")
    .attr("x", 100)
    .attr("y", function(d, i) { return 40 + i * 30; })
    .style("text-anchor", "middle")
    .text(function(d){ return d; })

var labels = [["Number of obs.", "Nobs", [0, 800]], ["R.A.", "RA", [0, 360]],
              ["DEC", "DEC", [-90, 20]], ["Galactic lon.", "Glon", [0, 360]],
              ["Galactic lat.", "Glat", [-90, 50]],
              ["Radial velocity", "HRV", [-50, 50]],
              ["Temperature", "Teff", [4000, 6000]],
              ["Gravity", "logg", [1.0, 4.5]],
              ["Metallicity", "met", [-0.5, 0.0]],
              ["S/N", "SNR", [10, 80]],
              ["DENIS I", "Imag", [8.0, 12.0]],
              ["2MASS J", "Jmag", [7.0, 11.0]],
              ["2MASS H", "Hmag", [7.0, 11.0]],
              ["2MASS K", "Kmag", [7.0, 11.0]],
              ["J-K", "J-K", [0.4, 1.0]],
              ["Moon phase", "moon", [0.0, 1.0]]]

svgright.selectAll("text")
    .data(labels)
    .enter()
    .append("text")
    .attr("class", "title")
    .attr("x", 30)
    .attr("y", function(d, i) { return 40 + i * 17; })
    .text(function(d){ return d[0]; })

svgright.selectAll("circle")
    .data(labels)
    .enter()
    .append("circle")
    .attr("r", 4)
    .attr("transform", function(d, i) {
        return "translate(" + 20 + ","  + (36 + i * 17) + ")";
    })
    .style("fill-opacity", 0.1)
    .style("stroke", "#000")
    .style("stroke-width", 0.8)
    .style("fill", "#000000")
    .on("click", mclick)
    .on("mouseover", mover)
    .on("mouseout", mout);

svgright.selectAll("circle")
    .style("fill-opacity", function(d, i) {
        if (i == 0) { return 0.8; }
        else { return 0.1; }
    });

///////////////////////////////////////////////////////////////////////////////
// Main chart

var svg = d3.select(".chart").selectAll("svg")
    .data(d3.range(2003, 2013))
    .enter().append("div").attr("class", "block").attr("width", width)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "Viridis")
    .append("g")
    .attr("transform", "translate(" + paddingSize + ",15)");

svg.append("text")
   .attr("transform", "translate(" + (width/2 - 4) + "," + -5 + ")")
    .style("text-anchor", "middle")
    .text(function(d) { return d; });

var rect = svg.selectAll(".day")
    .data(function (d) {
    return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
    .enter().append("rect")
    .attr("class", "day")
    .attr("width", cellSize)
    .attr("height", cellSize)
    .attr("y", function (d) { return week(d) * cellSize; })
    .attr("x", function (d) { return day(d) * cellSize; })
    .datum(format);

rect.append("title")
    .text(function(d) { return d; });

svg.selectAll(".month")
    .data(function (d) { return d3.time.months(new Date(d, 0, 1),
                            new Date(d + 1, 0, 1)); })
    .enter().append("path")
    .attr("class", "month")
    .attr("d", monthPath);

d3.csv("data.csv", function(error, csvdata) {
    if (error) throw error;

    data = d3.nest()
        .key(function (d) { return d.Date; })
        .rollup(function (d) { return d[0]; })
        .map(csvdata);

    rect.filter(function (d) { return d in data; })
        .attr("class", function (d) {
            return "day " + color(data[d]["Nobs"]);
        })
        .select("title")
        .text(function (d) { return d + ": " + data[d]["Nobs"]; });
});

///////////////////////////////////////////////////////////////////////////////
// Functions

function monthPath(t0) {
    var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
        d0 = +day(t0),
        w0 = +week(t0),
        d1 = +day(t1),
        w1 = +week(t1);

    return "M" + d0 * cellSize + "," + (w0) * cellSize + "H" + 7 * cellSize +
        "V" + (w1) * cellSize + "H" + (d1 + 1) * cellSize + "V" +
        (w1 + 1) * cellSize + "H" + 0 + "V" + (w0 + 1) * cellSize + "H" +
        d0 * cellSize + "Z";
}

function mover(d) {
    var opacity = d3.select(this).style('fill-opacity')
    if (opacity > 0.7) {newop = 0.8;}
    else {newop = 0.6;}
    d3.select(this)
        .transition()
        .ease("sin")
    	.duration(20)
        .style("fill-opacity", newop);
}

function mout(d) {
    var opacity = d3.select(this).style('fill-opacity')
    if (opacity > 0.7) {newop = 0.8;}
    else {newop = 0.1;}
    d3.select(this)
        .transition()
        .ease("sin")
    	.duration(20)
        .style("fill-opacity", newop);
}

function mclick(d) {
    svgright.selectAll("circle")
        .style("fill-opacity", 0.1);

    d3.select(this)
        .transition()
        .ease("sin")
    	.duration(20)
        .style("fill-opacity", 0.8)

    color.domain(d[2]);
    rect.filter(function (f) { return f in data; })
        .attr("class", function (f) { return "day " + color(data[f][d[1]]); })
        .select("title")
        .text(function (f) { return f + ": " + data[f][d[1]]; });
}

var cellSize = 7, // cell size
    paddingSize = 4,
    height = 400,
    width = cellSize * 7 + (paddingSize * 2);

var day = function(d) { return (d.getDay() + 6) % 7; },
    week = d3.time.format("%W");

var format = d3.time.format("%Y-%m-%d");

var color = d3.scale.quantize()
    .domain([0, 800])
    .range(d3.range(25).map(function(d) { return "q" + d + "-25"; }));

var csidx = 1
var cscales = ["Viridis", "RdPu", "Seismic", "Spectral", "Gray"]

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

var labels = [["Number of obs.", "Nobs", [0, 800, 100], ""],
              ["RA", "RA", [0, 360, 40], "deg"],
              ["DEC", "DEC", [-90, 20, 10], "deg"],
              ["Galactic lon.", "Glon", [0, 360, 40], "deg"],
              ["Galactic lat.", "Glat", [-90, 50, 10], "deg"],
              ["Radial velocity", "HRV", [-40, 60, 10], "km/s"],
              ["Temperature (M)", "Teff", [4000, 6000, 250], "K"],
              ["Gravity (M)", "logg", [1.0, 4.5, 0.5], "dex"],
              ["Metallicity (M)", "met", [-0.5, 0.0, 0.05], "dex"],
              ["S/N (M)", "SNR", [10, 80, 10], ""],
              ["DENIS I (M)", "Imag", [8.0, 12.0, 0.5], "mag"],
              ["2MASS J", "Jmag", [7.0, 11.0, 0.5], "mag"],
              ["2MASS H", "Hmag", [7.0, 11.0, 0.5], "mag"],
              ["2MASS K", "Kmag", [7.0, 11.0, 0.5], "mag"],
              ["J-K", "J-K", [0.4, 1.0, 0.1], ""],
              ["Distance", "dist", [0.0, 2.5, 0.25], "kpc"],
              ["Moon phase", "moon", [0.0, 1.0, 0.1], ""]]

svgright.selectAll("text")
    .data(labels)
    .enter()
    .append("text")
    .attr("class", "noselect")
    .attr("x", 30)
    .attr("y", function(d, i) { return 60 + i * 17; })
    .text(function(d){ return d[0]; })

svgright.selectAll("circle")
    .data(labels)
    .enter()
    .append("circle")
    .attr("r", 4)
    .attr("transform", function(d, i) {
        return "translate(" + 20 + ","  + (56 + i * 17) + ")";
    })
    .style("fill-opacity", 0.1)
    .style("stroke", "#000")
    .style("stroke-width", 0.6)
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
    .attr("class", cscales[csidx])
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
    .on("click", rectclick)
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
// Scale

var svgscale = d3.select(".scale")
    .append("svg")
    .attr("width", 570)
    .attr("height", 100)
    .append("g")
    .attr("class", cscales[csidx])
    .attr("transform", "translate(" + 0 + "," + 0 + ")");

var scale = svgscale.selectAll(".scale")
    .data(d3.range(0, 25))
    .enter().append("rect")
    .attr("width", 12)
    .attr("height", 20)
    .attr("transform", function(d, i) {
        return "translate(" + (140 + i * 12) + ","  + 20 + ")";
    })
    .attr("class", function(d, i) { return "q" + i + "-25"});

var scaleTicks = svgscale.selectAll(".scale")
    .data(d3.range(labels[0][2][0], labels[0][2][1] + 0.0001, labels[0][2][2]))
    .enter().append("line")
    .attr("x1", function(d) {
        return 141 + d / (labels[0][2][1] - labels[0][2][0]) * 298
    })
    .attr("y1", 12)
    .attr("x2", function(d) {
        return 141 + d / (labels[0][2][1] - labels[0][2][0]) * 298
    })
    .attr("y2", 18)
    .attr("stroke-width", 1)
    .attr("stroke", "black")
    .attr("class", "scaleTicks");

var scaleTicklabels = svgscale.selectAll(".scale")
    .data(d3.range(labels[0][2][0], labels[0][2][1] + 0.0001, labels[0][2][2]))
    .enter().append("text")
    .attr("x", function(d) {
        return 141 + d / (labels[0][2][1] - labels[0][2][0]) * 298
    })
    .attr("y", 10)
    .attr("class", "scaleTicklabels")
    .style("text-anchor", "middle")
    .text(function(d) { return d });

var scaleUnits= svgscale.append("text")
    .attr("transform", "translate(" + 460 + "," + 10 + ")")
    .style("text-anchor", "start")
    .text("");

var cschange = svgscale.append("text")
    .attr("transform", "translate(" + 291 + "," + 54 + ")")
    .style("fill", "#666666")
    .style("text-anchor", "middle")
    .text("[Change]")
    .attr("class", "noselect")
    .on("click", changeclick);

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

    color.domain([d[2][0], d[2][1]]);

    // slableft.text(d[2][0] + " " + d[3]);
    // slabright.text(d[2][1] + " " + d[3]);
    // console.log(d[2][2])

    svgscale.selectAll(".scaleTicks").remove();
    svgscale.selectAll(".scaleTicklabels").remove();
    scaleUnits.text(d[3]);

    lrange = d3.range(d[2][0], d[2][1] + 0.0001, d[2][2])

    var scaleTicks = svgscale.selectAll(".scale")
        .data(lrange)
        .enter().append("line")
        .attr("x1", function(f) {
            return 141 + (f - d[2][0]) / (d[2][1] - d[2][0]) * 298
        })
        .attr("y1", 12)
        .attr("x2", function(f) {
            return 141 + (f - d[2][0]) / (d[2][1] - d[2][0]) * 298
        })
        .attr("y2", 18)
        .attr("stroke-width", 1)
        .attr("stroke", "black")
        .attr("class", "scaleTicks");

    var scaleTicklabels = svgscale.selectAll(".scale")
        .data(lrange)
        .enter().append("text")
        .attr("x", function(f) {
            return 141 + (f - d[2][0]) / (d[2][1] - d[2][0]) * 298
        })
        .attr("y", 10)
        .attr("class", "scaleTicklabels")
        .style("text-anchor", "middle")
        .text(function(d) { return d });

    rect.filter(function (f) { return f in data; })
        .attr("class", function (f) { return "day " + color(data[f][d[1]]); })
        .select("title")
        .text(function (f) { return f + ": " + data[f][d[1]]; });
}

function rectclick(d) {
    var obsdate = d.replace("-", ":").replace("-", ":")
    var qstr = "http://vizier.u-strasbg.fr/viz-bin/VizieR?-source=III/272/" +
    "ravedr4&-out.max=9999&Obsdate=" + obsdate + "&-out=Name,RAVE,Obsdate,+" +
    "Field,Fiber,Jmag2,Kmag2,e_Jmag2,e_Kmag2,HRV,TeffK,loggK,c[M/H]K,SNRK," +
    "Dist,c1,c2,c3";
    window.open(qstr, '_new');
}

function changeclick(d) {
    csidx = csidx + 1;
    if (csidx > cscales.length - 1) {csidx = 0;}
    console.log(cscales[csidx])
    svgscale.attr("class", cscales[csidx]);
    svg.attr("class", cscales[csidx]);
}

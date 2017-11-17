//#########The file to be removed later
var width = document.getElementById('entry').clientWidth;

let height = 500;
let centered;
let projection;
let path;
let svg;
let map;
let brewer;
let color;
// let accident;
let legend;
let x;

wooinit()

function wooinit() {
  projection = d3.geoAlbers()
  .scale(width)
  .translate([width / 2, height / 2]);

  path = d3.geoPath().projection(projection);

  svg = d3.select("#entry")
  .append("svg")
  .attr("width", width)
  .attr("height", height)

  svg.append("rect")
  .attr("class", "background")
  .attr("width", width)
  .attr("height", height)
  .on("click", mapClick)
  // .on("click", wooOnClick);

  map = svg.append("g");


  buildScale();

  buildLegend();
  buildMap(usjson, states);
}


function buildScale() {

  x = d3.scaleLinear()
      .domain([1, 100])
      .rangeRound([500, 600]);

  let range = d3.range(0, 140).filter(d => {
    return d % 20 === 0;
  });

  color = d3.scaleThreshold()
        .domain(range)
        .range(d3.schemeBlues[9]);
}

function buildLegend() {

  legend = svg.append("g")
        .attr("id", "legend")
        .attr("transform", "translate(-395,380)");

  legend.selectAll("rect")
      .data(color.range().map(d => {
        d = color.invertExtent(d);
          return d;
      }).filter(d => {
        return d[0] != null && d[1] != null;
      }))
      .enter().append("rect")
      .attr("height", 8)
      .attr("x", d => { return x(d[0]); })
      .attr("width", d => { return x(d[1]) - x(d[0]); })
      .attr("fill", d => { return color(d[0]); });

  legend.append("text")
      .attr("id", "caption")
      .attr("x", x.range()[0])
      .attr("y", -6)
      .attr("fill", "#000")
      .attr("text-anchor", "start")
      .attr("font-weight", "bold")
      .text("Accident rate");

  legend.call(d3.axisBottom(x)
          .tickSize(13)
          .tickFormat((x, i) => { return i ? x : x + "%"; })
          .tickValues(color.domain()))
        .select(".domain")
        .remove();

}


function buildMap(us, states) {

  statePath = topojson.feature(us, us.objects.states).features;

  statePath = statePath.filter(d => {
    return d.id !== 2 && d.id !== 72 && d.id !== 78 && d.id !== 15;
  });

  map.append("g")
     .attr("id", "states")
     .selectAll("path")
     .data(statePath)
     .enter()
     .append("path")
     .attr("class", "state")
     .attr("fill", d => { return color(accident.get(d.id))})
     .attr("d", path)
    //  .on("click", wooOnClick);
     .on("click", mapClick)


  map.append("path")
     .datum(topojson.mesh(us, us.objects.states, (a, b) => {
    return a !== b;
     }))
     .attr("id", "state-borders")
     .attr("d", path);

}

function wooOnClick(d) {
  console.log(d);
  projection
  .translate([width / 4, height / 4])
  .scale(width/2);


  map
  .style('width', 0.5 * width + 'px')
  .style('height', 0.5 * height + 'px');
  map.selectAll('.state').attr('d', path);
  
// // resize the map
// map.select('.land').attr('d', path);
// map.selectAll('.state').attr('d', path);
}
function mapClick(d) {
  console.log("aa")
  let x;
  let y;
  let k;
  let centroid

  if (d && centered !== d) {
    centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 3.5;
    centered = d;
    setLegendVisibility(false);
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
    setLegendVisibility(true);
  }

  map.selectAll("path")
     .classed("active", centered && function(d) { return d === centered; });

  map.transition()
     .duration(500)
     .attr("transform", "translate(" + width / 2 + ", " + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
     .style("stroke-width", 1.5 / k + "px");

}

function setLegendVisibility(show) {
  var status = show? 1 : 0;
  d3.select("#legend").transition().duration(500).style("opacity", status);
  d3.select("#caption").transition().duration(500).style("opacity", status);
}

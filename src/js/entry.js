
let entry_width = document.getElementById('entry').clientWidth;

let entry_height = 500;
let entry_projection;
let entry_path;
let entry_svg;
let entry_map;
let keyed_accidents;
let entry_highlighted_states = new Set();
let entry_bars;

entry_init();

function entry_init() {

  //Data Processing

  keyed_accidents = _.keyBy(accidents, function(d) {return d.state_number})

  // console.log(keyed_accidents)
  let statePath = topojson.feature(usjson, usjson.objects.states).features;
  
  statePath = statePath.filter(d => {
      return d.id !== 72 && d.id !== 78;
    });

  //Build Scale
  let entry_colorDomain = d3.extent(accidents, function(d) {return +d.ratio_per_10k});
  let entry_colorScale = d3.scaleLinear()
                           .domain(entry_colorDomain)
                           .range(["#fff7fb", "#0570b0"]);
                  


  entry_projection = d3.geoAlbersUsa();
  entry_path = d3.geoPath().projection(entry_projection);

  entry_svg = d3.select("#entry")
                .append("svg")
                .attr("width", entry_width)
                .attr("height", entry_height);

  
  entry_map = entry_svg.append('g');

  //Create tooltip
  let entry_tip = d3.tip()
    .attr('class', 'entry_tip')
    .html(function(d) {
      let data = keyed_accidents[d.id]
      let state_name = data.state_name;
      let accident_count = data.accident_count;
      let ratio = data.ratio_per_10k;
      let state_code = data.state_code;
      var info = `${state_name} (${state_code}) <br/>
                  Accidents: ${accident_count} <br/>
                  Accidents/population: ${ratio} `;

      return info

    });
  entry_map.call(entry_tip);

  //Draw states
  entry_map.selectAll("path")
            .data(statePath)
            .enter()
            .append("path")
            .attr("class", "states")
            .attr("fill", d => {
              return entry_colorScale(keyed_accidents[d.id].ratio_per_10k)
            })
            .attr("d", entry_path)
            .on("click", entry_OnClick)
            .on("mouseover", entry_tip.show)
            .on("mouseout", entry_tip.hide)
            ;

  //Draw state borders   
  entry_map.append("path")
            .datum(topojson.mesh(usjson, usjson.objects.states, (a, b) => {
                return a !== b;
            }))
            .attr("id", "state-borders")
            .attr("d", entry_path);
}

function entry_OnClick(selected) {
  // console.log(selected.id);

  let already_selected = entry_highlighted_states.has(selected.id);

  if (entry_highlighted_states.size == 0) {
    entry_shrink_map();
  }

  if (entry_highlighted_states.size == 1 && already_selected) {
    entry_expand_map();
  }

  if (already_selected) {
    entry_highlighted_states.delete(selected.id);
  } else {
    entry_highlighted_states.add(selected.id)
  }

  if (entry_highlighted_states.size > 5) {
    alert('Maximum 5 please');
    entry_highlighted_states.delete(selected.id);
    return;
  }
  entry_map.selectAll(".states")
           .filter(function(d) {
             return d.id == selected.id;
           }).classed('active', !already_selected)

  // console.log(selected);
  entry_draw_bars();
  console.log(entry_highlighted_states);
}

function entry_expand_map() {
  entry_projection.translate([entry_width / 2, entry_height / 2])
  .scale(entry_width);

  entry_map.selectAll('.states').transition(3000).attr('d', entry_path);
  entry_map.selectAll('#state-borders').transition(3000).attr('d', entry_path).style('stroke-width', 1);
}

function entry_shrink_map() {
  entry_projection.translate([entry_width * 0.35, entry_height / 2])
                  .scale(entry_width * 0.8);
  
  entry_map.selectAll('.states').transition(3000).attr('d', entry_path);
  entry_map.selectAll('#state-borders').transition(3000).attr('d', entry_path).style('stroke-width', 0.8);
}

function entry_draw_bars() {
  console.log("draw bars");

  //   entry_bars = entry_svg.append('g')
  //   .attr("transform", "translate(" + (0.7 * entry_width) + "," + (0.2 * entry_height) + ")");


  // let bar_xscale = d3.scaleLinear()
  // .range([0,  0.25 * entry_width])
  // .domain([0, d3.max(entry_highlighted_states, function(d) {
  //   return keyed_accidents[d].ratio_per_10k;
  // })]);
  // let bar_yscale = d3.scaleBand()
  // .rangeRound([0.4 * entry_height, 0])
  // .domain(entry_highlighted_states.map(function(d) {
  // return keyed_accidents[d].state_code;
  // }))
  // .padding(0.1)
  // // let a = d3.max(entry_highlighted_states, function(d) {
  // // return keyed_accidents[d].ratio_per_10k;})
  // // console.log(a)

  // let top_bars = entry_bars.selectAll(".bar")
  //     .data(entry_highlighted_states)
  //     .enter()
  //     .append('g');
  // top_bars.append('rect')
  // .attr('class', "bar")
  // .attr("y", function(d) {
  // return bar_yscale(keyed_accidents[d].state_code)
  // })
  // .attr('x', 0)
  // .attr('height',"20px")
  // .attr('width', function(d) {
  // return bar_xscale(keyed_accidents[d].ratio_per_10k);
  // })
}
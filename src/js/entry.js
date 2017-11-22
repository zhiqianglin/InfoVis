
let entry_width = document.getElementById('entry').clientWidth;

let entry_height = 500;
let entry_projection;
let entry_path;
let entry_svg;
let entry_map;
let keyed_accidents;
let entry_highlighted_states = new Set();
let entry_bars;
let entry_feature = "ratio_per_10k";
// let entry_feature = "accident_count"  //Alternative feature
let top_bars;  //To be cleaned
let entry_bar_data; //To be cleaned

entry_init();

function entry_init() {

  //Data Processing

  keyed_accidents = _.keyBy(accidents, function(d) {return d.state_number})

  let statePath = topojson.feature(usjson, usjson.objects.states).features;
  
  statePath = statePath.filter(d => {
      return d.id !== 72 && d.id !== 78;
    });

  //Build Scale
  let entry_colorDomain = d3.extent(accidents, function(d) {
    return +d[entry_feature]});
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
              return entry_colorScale(keyed_accidents[d.id][entry_feature])
            })
            .attr("d", entry_path)
            .on("click", entry_OnClick)
            .on("mouseover", entry_tip.show)
            .on("mouseout", entry_tip.hide)
            ;
  //Draw state_names
  entry_map.selectAll(".state_name")
           .data(statePath)
           .enter()
           .append('svg:text')
           .attr('class', 'state_name')
           .on("click", entry_OnClick)
           .text(function(d) {
             return keyed_accidents[d.id].state_code;
           })
           .attr('x', function(d) {
             return entry_path.centroid(d)[0];
           })
           .attr('y', function(d) {
            return entry_path.centroid(d)[1];
           })
           .attr("text-anchor","middle")
           .attr('font-size','10pt');

  //Draw state borders   
  entry_map.append("path")
            .datum(topojson.mesh(usjson, usjson.objects.states, (a, b) => {
                return a !== b;
            }))
            .attr("id", "state-borders")
            .attr("d", entry_path);
  let bar_wrapper=          entry_svg.append('g')
            .attr("transform", "translate(" + (0.7 * entry_width) + "," + (0.5 * entry_height) + ")");
  entry_bars = bar_wrapper.append('g')
}

function entry_OnClick(selected) {

  let already_selected = entry_highlighted_states.has(selected.id);

  //Corner case: No state selected
  if (entry_highlighted_states.size == 0) {
    entry_shrink_map();
  }

  //Corner case: Exit selection
  if (entry_highlighted_states.size == 1 && already_selected) {
    entry_expand_map();
  }

  //Update the tracking of higlighted states
  if (already_selected) {
    entry_highlighted_states.delete(selected.id);
  } else {
    entry_highlighted_states.add(selected.id)
  }

  //Limit to select 5 states only
  if (entry_highlighted_states.size > 5) {
    alert('Maximum 5 please');
    entry_highlighted_states.delete(selected.id);
    return;
  }

  //Update status of selected state, if newly selected => acitive, else => inactive(unselect/unhighlight)
  entry_map.selectAll(".states")
           .filter(function(d) {
             return d.id == selected.id;
           }).classed('active', !already_selected)

  entry_draw_bars();
}

function entry_expand_map() {
  //Update scale
  entry_projection.translate([entry_width / 2, entry_height / 2])
  .scale(entry_width);

  entry_map.selectAll('.states').transition(3000).attr('d', entry_path);
  entry_map.selectAll('#state-borders').transition(3000).attr('d', entry_path).style('stroke-width', 1);

  //Update state_code text!!!
  entry_map.selectAll(".state_name")
            .transition(3000)
            .attr('x', function(d) {
              return entry_path.centroid(d)[0];
            })
            .attr('y', function(d) {
            return entry_path.centroid(d)[1];
            })
            .attr("text-anchor","middle")
            .attr('font-size','10pt');
}

function entry_shrink_map() {
  //Update scale
  entry_projection.translate([entry_width * 0.35, entry_height / 2])
                  .scale(entry_width * 0.8);
  
  entry_map.selectAll('.states').transition(3000).attr('d', entry_path);
  entry_map.selectAll('#state-borders').transition(3000).attr('d', entry_path).style('stroke-width', 0.8);

  entry_map.selectAll(".state_name")
            .transition(3000)
            .attr('x', function(d) {
              return entry_path.centroid(d)[0];
            })
            .attr('y', function(d) {
            return entry_path.centroid(d)[1];
            })
            .attr("text-anchor","middle")
            .attr('font-size','6pt');

}

function entry_draw_bars() {
  console.log("draw bars"); //This method need to be cleaned!!!

  //Generate new data from selected states
  entry_bar_data = Array.from(entry_highlighted_states, function(d) {
    return keyed_accidents[d];
  });

  //Move the position of bars if necessary, need to be updated
  entry_bars.attr("transform", "translate(0" + "," + (-20 * entry_bar_data.length) + ")");

  //Update scale of the selected data
  let bar_xscale = d3.scaleLinear()
  .range([0,  0.20 * entry_width])
  .domain([0, d3.max(entry_bar_data, function(d) {
    return d[entry_feature];
  })]);


   //Here top_bars was initially want to differentiate the upper and lower section, does not have any meaning for now
   //Join the new data with exisiting data
   top_bars = entry_bars.selectAll(".bar").data(entry_bar_data, function(d) {return d.state_number})
   
    //Remove any existing data that have been unselected
   top_bars.exit().remove();

   //Append new data if necessary
    let new_bars = top_bars.enter().append('g').attr('class', 'bar')

    //Add state code before bar
    new_bars.append('text').text(function(d) {return d.state_code}).attr('x', -30).attr("dominant-baseline", "text-before-edge")

    //Add bar
    new_bars.append('rect')
    .attr('class', "entry_bar")
    .attr('x', 0)
    .attr('height',"20px")
    .attr('width', function(d) {
    return bar_xscale(d[entry_feature]);})

    //Add amount to the end of bar
    new_bars.append('text').attr('class', 'amount_label')
    .text(function(d) {return d[entry_feature]}).attr('x', function(d) {return bar_xscale(d[entry_feature]) + 10;})
    .attr("dominant-baseline", "text-before-edge")


    //Merge the new data with exisiting data, update position
    let all_bars = new_bars.merge(top_bars)
    .attr("transform", function(d, i) {
      return "translate(0," + i * 30 + ")";})
      .attr('id', function(d, i) {return i;})
    ;

    //Apply new scale to merged data, update bar length and amount label position
    all_bars.selectAll('.entry_bar').attr('width', function(d) {return bar_xscale(d.ratio_per_10k);})
    all_bars.selectAll('.amount_label').attr('x', function(d) {return bar_xscale(d[entry_feature]) + 10;});
}
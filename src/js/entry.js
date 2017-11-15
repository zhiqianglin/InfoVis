
let entry_width = document.getElementById('entry').clientWidth;

let entry_height = 500;
let entry_projection;
let entry_path;
let entry_svg;
let entry_map;



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

  let entry_tip = d3.tip()
    .attr('class', 'entry_tip')
    .html(function(d) {
      let data = keyed_accidents[d.id]
      let state_name = data.state_name;
      let accident_count = data.accident_count;
      let ratio = data.ratio_per_10k;

      var info = `${state_name} <br/>
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
            .attr("class", "state")
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

function entry_OnClick(d) {
  console.log(d);
  entry_projection.translate([entry_width * 0.35, entry_height / 2])
                  .scale(entry_width * 0.8);
  
  entry_map.selectAll('.state').transition(3000).attr('d', entry_path);
  entry_map.selectAll('#state-borders').transition(3000).attr('d', entry_path).style('stroke-width', 0.8);;

}
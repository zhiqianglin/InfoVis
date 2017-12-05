
let entry_width = document.getElementById('entry').clientWidth;

// let usjson;
let entry_accidents;
let entry_state_names;
let entry_pop15;
let entry_tip;

let entry_height = 500;
let entry_projection;
let entry_path;
let entry_svg;
let entry_map;
let keyed_accidents;
let entry_highlighted_states = [];
let entry_bars;
let entry_feature = "ratio_per_10k";
let entry_colorDomain;
let entry_colorScale;
// let entry_feature = "accident_count"  //Alternative feature
let top_bars;  //To be cleaned
let entry_bar_data; //To be cleaned
let entry_top_make = new Set(["Ford", "Chevrolet", "Toyota", "Honda", "Dodge", "Datsun/Nissan", "Harley-Davidson", "GMC", "Jeep/Kaiser-Jeep/Willys Jeep", "Freightliner"]
);
let entry_filters = {
  sex: 'All',
  age: 'All',
  alcohol: false,
  drug: false,
  make: 'All'
}

let entry_focus;
let entry_focus_rect;


d3.queue()
  .defer(d3.json, './src/data/us.json')
  .defer(d3.csv, './src/data/entry_accidents.csv', function(d) {
    return {
      age: +d.age,
      alcohol: +d.alcohol,
      consecutive_number: +d.consecutive_number,
      drug: +d.drug,
      sex: d.sex,
      state_code: d.state_code,
      state_name: d.state_name,
      state_number: d.state_number,
      vehicle_make: d.vehicle_make
    }
  })
  .defer(d3.csv, './src/data/state_names.csv')
  .defer(d3.csv, './src/data/entry_pop15.csv')
  .await(entry_load_data);

function entry_load_data(error, us, accidents, state_names, pop15) {
  usjson = us;
  entry_accidents = accidents;
  state_names = _.filter(state_names, function(d) {return d.id !== 72 && d.id !== 78;})
  entry_state_names = _.keyBy(state_names, function(d) {return d.state_number});
  entry_pop15 = _.keyBy(pop15, function(d) {return d.state_number});

  entry_init();
}



function entry_init() {

  //Data Processing
  entry_add_filter_options();
  // keyed_accidents = _.keyBy(accidents, function(d) {return d.state_number})
  keyed_accidents = entry_update_data();
  // console.log(keyed_accidents);
  let statePath = topojson.feature(usjson, usjson.objects.states).features;
  
  statePath = statePath.filter(d => {
      return d.id !== 72 && d.id !== 78;
    });

  //Build Scale
  let values = _.values(keyed_accidents);
  entry_colorDomain = d3.extent(values, function(d) {
    return +d[entry_feature]});
  entry_colorScale = d3.scaleLinear()
                           .domain(entry_colorDomain)
                           .range(["#fff7fb", "#0570b0"]);
                  
  entry_projection = d3.geoAlbersUsa();

  entry_projection.translate([entry_width / 2, entry_height / 2])
  .scale(entry_width);

  entry_path = d3.geoPath().projection(entry_projection);

  entry_svg = d3.select("#entry")
                .append("svg")
                .attr("width", entry_width)
                .attr("height", entry_height);

  
  entry_map = entry_svg.append('g');

  //Create tooltip
  entry_tip = d3.tip()
    .attr('id', 'entry_tip')
    .html(function(d) {
      let data = keyed_accidents[d.id] || d;
      let state_name = data.state_name;
      let accident_count = data.accident_count;
      let ratio = data.ratio_per_10k.toFixed(3);
      let state_code = data.state_code;

      var info = `<h4>${state_name} (${state_code})</h4>
                  <table>
                    <tr>
                      <td>Accidents: ${accident_count}</td>
                    </tr>
                    <tr>
                      <td>Accidents/population: ${ratio}</td>
                    </tr>
                  </table> `;
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
           .attr('class', 'state_name google_fonts')
           .on("click", entry_OnClick)
           .on("mouseover", entry_tip.show)
           .on("mouseout", entry_tip.hide)
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
           .attr('font-size','10pt')
           ;

  //Draw state borders   
  entry_map.append("path")
            .datum(topojson.mesh(usjson, usjson.objects.states, (a, b) => {
                return a !== b;
            }))
            .attr("id", "state-borders")
            .attr("d", entry_path);

  entry_bars = entry_svg.append('g')
            .attr("transform", "translate(" + (0.75 * entry_width) + "," + (0.55 * entry_height) + ")")
            .attr("id", "abc");

  entry_focus_rect = entry_svg.append('g')
            .attr("transform", "translate(" + (0.73 * entry_width) + "," + 0.20 * entry_height + ")");


}

function entry_OnClick(selected) {

  let already_selected = _.includes(entry_highlighted_states, selected.id);

  //Corner case: No state selected
  if (entry_highlighted_states.length == 0) {
    entry_shrink_map();
  }

  //Corner case: Exit selection
  if (entry_highlighted_states.length == 1 && already_selected) {
    entry_map.selectAll('.focused').classed('focused', false);
    entry_expand_map();
  }

  //Update the tracking of higlighted states
  if (already_selected) {

    let idx = entry_highlighted_states.indexOf(selected.id);
    entry_highlighted_states.splice(idx, 1);
  } else {
    entry_highlighted_states.unshift(selected.id)
  }

  //Limit to select 3 states only
  if (entry_highlighted_states.length > 3) {
    alert('Please select up to 3 states only from the map for comparison.');
    entry_highlighted_states.splice(0, 1);
    return;
  }
  entry_focus = entry_highlighted_states[0] || 'All'; //Nothing in the highlighted_states


  //Update status of selected state, if newly selected => acitive, else => inactive(unselect/unhighlight)
  entry_map.selectAll(".states")
           .filter(function(d) {
             return d.id == selected.id;
           }).classed('active', !already_selected)

  if (entry_focus != 'All') {
    entry_map.selectAll('.focused').classed('focused', false);

    entry_map.selectAll(".states")
    .filter(function(d) {
      return d.id == entry_focus;
    }).classed('focused', true)
  }
  entry_draw_bars();
  entry_draw_focus_info(entry_focus);
  set_global_filter_from_js(entry_focus);
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
  entry_projection.translate([entry_width * 0.35, entry_height * 0.45])
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
  entry_bar_data = Array.from(entry_highlighted_states, function(d) {
    return keyed_accidents[d];
  });

  entry_bars.selectAll(".bar").remove();
  entry_draw_top_bars(entry_bar_data);
  entry_draw_bottom_bars(entry_bar_data);
}



function entry_draw_focus_info(entry_focus) {
  entry_focus_rect.selectAll(".entry_focus_wrapper").remove();

  let info = entry_focus_rect.append('g').attr('class', 'entry_focus_wrapper')
  .attr("transform", "translate(0," + (-25 * entry_highlighted_states.length) + ")");

  if (entry_focus != 'All') {
    // console.log(3)
    info.append('g').append('rect')
    .attr("rx", 4)
    .attr("ry", 4)
    .attr('x', 0)
    .attr('height',"100px")
    .attr('width', 0.25 * entry_width)
    .attr('class', 'entry_focus_rect');

    let data = keyed_accidents[entry_focus]
    let state_name = data.state_name;
    let state_code = data.state_code;
    let accident_count = data.accident_count;
    let ratio = data.ratio_per_10k.toFixed(3);

    let first_line = `${state_name} (${state_code})`;
    let secone_line = `Accidents: ${accident_count}`;
    let third_line = `Accidents/population: ${ratio} `;

    info.append('text').text(first_line)
    .attr("x", 10)
    .attr("y", 20)
    .attr("dy", ".35em")
    .attr("text-anchor", "left")
    .attr("id", "entry_info_first")
    .attr('class', 'google_fonts');

    info.append('text').text(secone_line)
    .attr("x", 10)
    .attr("y", 50)
    .attr("dy", ".35em")
    .attr("text-anchor", "left")
    .attr("id", "entry_info_second")
    .attr('class', 'google_fonts');

    info.append('text').text(third_line)
    .attr("x", 10)
    .attr("y", 70)
    .attr("dy", ".35em")
    .attr("text-anchor", "left")
    .attr("id", "entry_info_third")
    .attr('class', 'google_fonts');

  }

}

function entry_draw_top_bars(data) {
  let top_bars = entry_bars.append('g').attr('class', 'bar').attr("transform", "translate(0," + (-30 * data.length) + ")");

  if (data.length > 0) {
    top_bars.append('g').attr('class', 'bar_title')
    .attr('transform', 'translate(0, -30)')
    .append('text').text('Fatal Accident Counts').attr("dominant-baseline", "text-before-edge").attr('class', 'google_fonts');    
  }

  let bar_xscale = d3.scaleLinear()
  .range([0,  0.20 * entry_width])
  .domain([0, d3.max(data, function(d) {
    return d.accident_count;
  })]);

  let bars = top_bars.selectAll(".top_bar").data(entry_bar_data).enter().append('g').attr('class', 'top_bar')
  .attr("transform", function(d, i) {
  return "translate(0," + i * 30 + ")";})
  .attr('id', function(d, i) {return i;})

  bars.append('text').text(function(d) {return d.state_code}).attr('x', -30).attr("dominant-baseline", "text-before-edge")
  .attr('class', 'google_fonts');
  

  bars.append('rect')
  .attr('class', function(d, i) {
    if (i == 0) {
      return "entry_bar_active"
    } else {
      return "entry_bar"
    }
  })
  .attr('x', 0)
  .attr('height',"20px")
  .attr('width', function(d) {
    return bar_xscale(d.accident_count);})
    .on("mouseover", entry_tip.show)
    .on("mouseout", entry_tip.hide)
    ;
  //Add amount to the end of bar
  bars.append('text').attr('class', 'amount_label')
  .text(function(d) {return d.accident_count}).attr('x', function(d) {return bar_xscale(d.accident_count) + 10;})
  .attr("dominant-baseline", "text-before-edge")
  .attr('class', 'google_fonts');  
}


function entry_draw_bottom_bars(data) {
  let bottom_bars = entry_bars.append('g').attr('class', 'bar').attr("transform", "translate(0" + "," + (30 * 1.8) + ")");

  if (data.length > 0) {
    bottom_bars.append('g').attr('class', 'bar_title')
    .attr('transform', 'translate(0, -30)')
    .append('text')
    .text('Fatal Accidents/population (per 10k)')
    .attr("dominant-baseline", "text-before-edge")
    .attr('class', 'google_fonts');
  }

    let bar_xscale = d3.scaleLinear()
    .range([0,  0.20 * entry_width])
    .domain([0, d3.max(data, function(d) {
      return d.ratio_per_10k;
    })]);

    let bars = bottom_bars.selectAll(".bottom_bar").data(entry_bar_data).enter().append('g').attr('class', 'bottom_bar')
    .attr("transform", function(d, i) {
    return "translate(0," + i * 30 + ")";})
    .attr('id', function(d, i) {return i;});

    bars.append('text')
        .text(function(d) {return d.state_code})
        .attr('x', -30).attr("dominant-baseline", "text-before-edge")
        .attr('class', 'google_fonts');        

    bars.append('rect')
    .attr('class', function(d, i) {
      if (i == 0) {
        return "entry_bar_active"
      } else {
        return "entry_bar"
      }
    })
    .attr('x', 0)
    .attr('height',"20px")
    .attr('width', function(d) {
    return bar_xscale(d.ratio_per_10k);})
    .on("mouseover", entry_tip.show)
    .on("mouseout", entry_tip.hide);

    //Add amount to the end of bar
    bars.append('text')
    .attr('class', 'amount_label')
    .text(function(d) {return d.ratio_per_10k.toFixed(3)}).attr('x', function(d) {return bar_xscale(d.ratio_per_10k) + 10;})
    .attr("dominant-baseline", "text-before-edge")
    .attr('class', 'google_fonts');
}

//Filters

function entry_filter_sex(sex) {
  entry_filters.sex = sex;
  // console.log(entry_filters);
  // console.log(accidents);
  entry_filter_update();
  // console.log(entry_filters.sex);
  // entry_update_data();
}


function entry_filter_age(age) {
  entry_filters.age = age;
  // console.log(entry_filters);
  entry_filter_update();
}

function entry_filter_alcohol(alcohol) {
  entry_filters.alcohol = alcohol;
  // console.log(entry_filters);
  entry_filter_update();
}

function entry_filter_drug(drug) {
  entry_filters.drug = drug;
  // console.log(entry_filters);
  entry_filter_update();
  // entry_update_data();
}

function entry_filter_make(make) {
  entry_filters.make = make;
  // console.log(entry_filters);
  entry_filter_update();
}

function entry_update_data() {
  //Apply 5 possible filters
  let filter1 = _entry_filter_sex(entry_accidents);
  let filter2 = _entry_filter_age(filter1);
  let filter3 = _entry_filter_alcohol(filter2);
  let filter4 = _entry_filter_drug(filter3);
  let filter5 = _entry_filter_make(filter4);
  // console.log(filter5);

  //Retrive unique consecutive number incidences
  let unique = _.uniqBy(filter5, function(d) {return d.consecutive_number});
  // console.log(unique);

  //Count incidences for each state
  let count = _.countBy(unique, function(d) {return d.state_number});


  //Fill in states that does not have any incidence
  let all_state_count = _.mapValues(entry_state_names, function(value, key) {
    return count[key] || 0;
  })

  //Reconstruct data needed
  let updated_data = _.mapValues(all_state_count, function(value, key) {
    return {
      accident_count: value,
      state_name: entry_state_names[key].state_name,
      state_code: entry_state_names[key].state_code,
      pop15: entry_pop15[key].pop15,
      ratio_per_10k: value * 1.0 / entry_pop15[key].pop15 * 10000,
    }
  });

  return updated_data;

}
function entry_filter_update() {
  //Update data
  keyed_accidents = entry_update_data();
  // console.log(keyed_accidents);
  
  //Update Map color scale
  let values = _.values(keyed_accidents);

  // console.log(values);
  entry_colorDomain = d3.extent(values, function(d) {
    return +d[entry_feature]});

  entry_colorScale = d3.scaleLinear()
                           .domain(entry_colorDomain)
                           .range(["#fff7fb", "#0570b0"]);
  //Change Map fille color
  entry_map.selectAll('.states').attr("fill", d=> {
    let new_color =  entry_colorScale(keyed_accidents[d.id][entry_feature]);
    return new_color;
  });

  //Update bars
  entry_draw_bars();
}


// Filters

function _entry_filter_sex(accidents) {
  let sex = entry_filters.sex;
  let output = accidents;
  if (sex !== 'All') {
    output = _.filter(accidents, function(d) {
      return d.sex == sex;
    })
  }
  // console.log(output);
  return output;
}

function _entry_filter_age(accidents) {
  let age = entry_filters.age;
  let f;
  switch(age) {
    case 'age1': f = function(d) {return d.age >= 16 && d.age <= 25};
    break;
    case 'age2': f = function(d) {return d.age >= 26 && d.age <= 35};
    break;
    case 'age3': f = function(d) {return d.age >= 36 && d.age <= 45};
    break;
    case 'age4': f = function(d) {return d.age >= 46 && d.age <= 60};
    break;
    case 'age5': f = function(d) {return d.age > 60};
    break;
    default: f = function(d) {return true;}
  }
  let output = _.filter(accidents, function(d) {return f(d)});
  // console.log(output);
  return output;
}

function _entry_filter_alcohol(accidents) {
  let alcohol = entry_filters.alcohol;
  let output = accidents;
  if (alcohol) {
    output = _.filter(accidents, function(d) {return d.alcohol;});
  }
  // console.log(output);
  return output;
}

function _entry_filter_drug(accidents) {
  let drug = entry_filters.drug;
  let output = accidents;
  if (drug) {
    output = _.filter(accidents, function(d) {return d.drug;});
  }
  // console.log(output);
  return output;
}

function _entry_filter_make(accidents) {
  let make = entry_filters.make;
  // console.log(make);
  let output = accidents;
  if (make == 'All') {
    return output;
  } else if (make == 'Other') {
    output = _.filter(accidents, function(d) {return !entry_top_make.has(d.vehicle_make); });
  } else {
    output = _.filter(accidents, function(d) {return d.vehicle_make == make});
  }
  // console.log(output);
  return output;
}

function _entry_format_number(value) {
  return Number(Math.round(value+'e2')+'e-2');
}


function entry_add_filter_options() {

  var all_option = document.createElement("option");
  all_option.value = 'All';
  all_option.text = 'All states'
  document.getElementById("global_state_filter").add(all_option);

  _.each(entry_state_names, function(d) {
    var option = document.createElement("option");
        option.value = d.state_number;
        option.text = `${d.state_name} (${d.state_code})`
        option.className = 'google_fonts'
        document.getElementById("global_state_filter").add(option);

  });
}

function entry_reset_to_all() {
  entry_map.selectAll('.states').classed('focused', false).classed('active', false);
  entry_highlighted_states = [];
  entry_focus = 'All';

  entry_expand_map();
  entry_draw_bars();
  entry_draw_focus_info(entry_focus);
}

function entry_reset_to_one(new_focus) {
  entry_map.selectAll('.states').classed('focused', false).classed('active', false);

  entry_highlighted_states = [];
  entry_OnClick({'id': new_focus});

}
function update_global_fiter_for_entry(new_focus_id) {
  //If reset to all
  if (new_focus_id == 'All') {
    entry_reset_to_all();
    //if all, then reset
    return;
  }

  if (new_focus_id == entry_focus) {
    return;
  }

  let already_selected = _.includes(entry_highlighted_states, +new_focus_id);

  if (already_selected) {
    //Update the focus
    _entry_udpate_focus(new_focus_id);
    return;
  }

  //If not already selected and still less than 3
  if (entry_highlighted_states.length < 3) {
    entry_OnClick({"id": +new_focus_id});
    return;
  }
  else { //Already selected 3 states, reset to highlight/focus only one
    entry_reset_to_one(+new_focus_id);
  }
}

function _entry_udpate_focus(new_focus_id) {

  //First reverse the highlighted and focused color
  entry_map.selectAll('.focused').classed('focused', false);

  entry_map.selectAll(".states")
  .filter(function(d) {
    return d.id == new_focus_id;
  }).classed('focused', true);

  //Set the new focused
  entry_focus = new_focus_id;

  //Basically move the focus from middle to the beginning
  let idx = entry_highlighted_states.indexOf(new_focus_id);
  entry_highlighted_states.splice(idx, 1);
  entry_highlighted_states.unshift(new_focus_id);

  //redraw the bars and focus info
  entry_draw_bars();
  entry_draw_focus_info(new_focus_id);


  //Maybe want to resort the options for select?
}
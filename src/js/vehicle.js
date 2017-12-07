
// Plot variables
var veh_vis;
var veh_margin = {top: 20, bottom: 80, left: 40, right: 40}
var veh_width = document.getElementById('vehicleChart').clientWidth - veh_margin.left - veh_margin.right;
var veh_height = document.getElementById('vehicleChart').clientHeight - veh_margin.top - veh_margin.bottom;

var veh_typeList = []; // list of top 10 of: {type, type_name}

var veh_makeList = []; // list of top 10 of: {make, make_name}

var veh_stateList = []; // list of all of: {state, state_name}

var veh_dataAll = []; // data read from file
var veh_dataFiltered = []; // data after all 5 filters
var veh_dataPlot = []; // data transformed from dataFiltered for plotting purpose

var yName; // TravelSpeed - SpeedLimit || TravelSpeed || Vehicle Model Year
var xName; // Vehicle Body Type || Vehicle Make
var xList; // veh_typeList -> Show || veh_makeList -> Show


//Gets called when the page is loaded.
function initVehicle(){
  var veh_chart = d3.select('#vehicleChart').append('svg');
  veh_chart.attr("width", veh_width + veh_margin.left + veh_margin.right)
           .attr("height", veh_height + veh_margin.top + veh_margin.bottom);
  veh_vis = veh_chart.append('g');
  veh_vis.attr("transform", "translate(" + veh_margin.left + "," + veh_margin.top + ")");
  d3.csv("src/data/vehicle.csv", veh_loadFile);
}

function veh_loadFile(data) {
  veh_dataAll = data;
  veh_dataAll.forEach(function (d) {
    d.consecutive_number = parseInt(d.consecutive_number);
    d.vehicle_number = parseInt(d.vehicle_number);
    d.state = parseInt(d.state);
    d.driver_age = parseInt(d.driver_age);
    d.body_type = parseInt(d.body_type);
    d.vehicle_make = parseInt(d.vehicle_make);
    d.vehicle_model = parseInt(d.vehicle_model);
    d.vehicle_year = parseInt(d.vehicle_year);
    d.travel_speed = parseInt(d.travel_speed);
    d.speed_limit = parseInt(d.speed_limit);
    d.speed_diff_limit = parseInt(d.speed_diff_limit);
  });
  // console.log(veh_dataAll.length);

  veh_loadTypes();
  veh_loadMakes();
  // veh_loadStates();
  veh_chartUpdate();
}

function veh_chartUpdate() {
  // console.log("updated");
  // console.log("selected State is \t", veh_getSelectedState());
  // console.log("selected Sex is \t", veh_getSelectedSex());
  // console.log("selected Age is \t", veh_getSelectedAge());
  // console.log("selected Y Axis is \t", veh_getSelectedYAxis());
  // console.log("selected Body Type is \t", veh_getSelectedType());

  veh_filterData();
  veh_getPlotData();
  veh_plotChart();
}

function veh_loadTypes() {
  var veh_typeListAll = _.map(_.uniqBy(veh_dataAll, "type"), function(d) {
    return {
      type: d.type,
      type_name: d.type_name,
      type_name_show: d.type_name.substring(0, d.type_name.indexOf("(") == -1 && d.type_name.indexOf("/") == -1 ? 
    		  d.type_name.length : d.type_name.indexOf("/") != -1 && d.type_name.indexOf("(") != -1 ? 
    				  (d.type_name.indexOf("/") < d.type_name.indexOf("(") ? d.type_name.indexOf("/") : d.type_name.indexOf("(")) : d.type_name.indexOf("/") != -1 ?
    						  d.type_name.indexOf("/") : d.type_name.indexOf("("))
    };
  });
  // console.log(veh_typeListAll);
  var veh_typeCount = _.countBy(veh_dataAll, "type");
  var veh_typeCountSort = _.chain(veh_typeCount)
                            .map(function(cnt, type) {
                              return {
                                type: type,
                                count: cnt
                              }
                            })
                            .sortBy('count')
                            .value();
  veh_typeCountSort.reverse();
  // console.log(veh_typeCountSort);
  for(i = 0; i < 10; i++) {
    for(j = 0; j < veh_typeListAll.length; j++) {
      if(veh_typeListAll[j].type == veh_typeCountSort[i].type) {
        veh_typeList.push(veh_typeListAll[j]);
        break;
      }
    }
  }
  // console.log(veh_typeList);
  for(i = 0; i < veh_typeList.length; i++) {
    var option = document.createElement("option");
    option.value = veh_typeList[i].type;
    option.text  = veh_typeList[i].type_name_show;
    document.getElementById("veh_TypeFilter").add(option);
  }
}

function veh_loadMakes() {
  var veh_makeListAll = _.map(_.uniqBy(veh_dataAll, "make"), function(d) {
    return {
      make: d.make,
      make_name: d.make_name,
      make_name_show: d.make_name.substring(0, (d.make_name.indexOf("/") == -1 || d.make_name.indexOf("Nissan") != -1) ? d.make_name.length : d.make_name.indexOf("/"))
    };
  });
  // console.log(veh_makeListAll);
  var veh_makeCount = _.countBy(veh_dataAll, "make");
  var veh_makeCountSort = _.chain(veh_makeCount)
                            .map(function(cnt, make) {
                              return {
                                make: make,
                                count: cnt
                              }
                            })
                            .sortBy('count')
                            .value();
  veh_makeCountSort.reverse();
  // console.log(veh_makeCountSort);
  for(i = 0; i < 10; i++) {
    for(j = 0; j < veh_makeListAll.length; j++) {
      if(veh_makeListAll[j].make == veh_makeCountSort[i].make) {
        veh_makeList.push(veh_makeListAll[j]);
        break;
      }
    }
  }
  // console.log(veh_makeList);
}
/*
function veh_loadStates() {
  veh_stateList = _.map(_.uniqBy(veh_dataAll, "state"), function(d) {
    return {
      state: d.state,
      state_name: d.state_name
    };
  });
  veh_stateList = _.sortBy(veh_stateList, "state");
  // console.log(veh_stateList);
  for(i = 0; i < veh_stateList.length; i++) {
    var option = document.createElement("option");
    option.value = veh_stateList[i].state;
    option.text  = veh_stateList[i].state_name;
    document.getElementById("veh_StateFilter").add(option);
  }
}
*/
function veh_filterData() {
  var veh_filterState = veh_getSelectedState();
  var veh_filterYAxis = veh_getSelectedYAxis();
  var veh_filterSex = veh_getSelectedSex();
  var veh_filterAge = veh_getSelectedAge();
  var veh_filterType = parseInt(veh_getSelectedType());
  // console.log("State     filtered by \t", veh_filterState);
  // console.log("Sex       filtered by\t", veh_filterYAxis);
  // console.log("Age       filtered by\t", veh_filterSex);
  // console.log("Y Axis    filtered by\t", veh_filterAge);
  // console.log("Body Type filtered by\t", veh_filterType);
  yName = veh_filterYAxis == "yaxis1" ? "TravelSpeed - SpeedLimit" : veh_filterYAxis == "yaxis2" ? "TravelSpeed" : "Vehicle Model Year";
  xName = veh_filterType == 0 ? "Body Type" : "Vehicle Make";
  xList = veh_filterType == 0 ? veh_typeList.map(function(d) {return d.type_name_show;}) : veh_makeList.map(function(d) {return d.make_name_show});
  // console.log(yName);
  // console.log(xName);
  // console.log(xList);
  veh_dataFiltered = veh_dataAll;
  // console.log("Data filtered: ", veh_dataFiltered.length);

  if(veh_filterState != "All") {
    veh_dataFiltered = _.filter(veh_dataFiltered, function(d) {return d.state == veh_filterState;});
  }
  // console.log("Data filtered by state: ", veh_dataFiltered.length);

  if(veh_filterYAxis == "yaxis3") {
    veh_dataFiltered = _.filter(veh_dataFiltered, function(d) {return d.year < 3000;});
  } else {
    veh_dataFiltered = _.filter(veh_dataFiltered, function(d) {return d.speed_limit > 0 && d.speed_limit < 90;});
    veh_dataFiltered = _.filter(veh_dataFiltered, function(d) {return d.travel_speed < 900;});
  }
  // console.log("Data filtered by Y Axis: ", veh_dataFiltered.length);

  if(veh_filterSex != "sex0") {
    if(veh_filterSex == "sex1") {
      veh_dataFiltered = _.filter(veh_dataFiltered, function(d) {return d.sex == "Male";});
    } else { // veh_filterSex == "sex2"
      veh_dataFiltered = _.filter(veh_dataFiltered, function(d) {return d.sex == "Female";});
    }
  }
  // console.log("Data filtered by sex: ", veh_dataFiltered.length);

  if(veh_filterAge != "age0") {
    if(veh_filterAge == "age1") {
      veh_dataFiltered = _.filter(veh_dataFiltered, function(d) {return d.age >= 16 && d.age <= 25;});
    } else if(veh_filterAge == "age2") {
      veh_dataFiltered = _.filter(veh_dataFiltered, function(d) {return d.age >= 26 && d.age <= 35;});
    } else if(veh_filterAge == "age3") {
      veh_dataFiltered = _.filter(veh_dataFiltered, function(d) {return d.age >= 36 && d.age <= 45;});
    } else if(veh_filterAge == "age4") {
      veh_dataFiltered = _.filter(veh_dataFiltered, function(d) {return d.age >= 46 && d.age <= 60;});
    } else { // veh_filterAge == "age5"
      veh_dataFiltered = _.filter(veh_dataFiltered, function(d) {return d.age > 60;});
    }
  }
  // console.log("Data filtered by age: ", veh_dataFiltered.length);

  if(veh_filterType == 0) {
    var typeList = veh_typeList.map(function(d) {return d.type;});
    // console.log(typeList);
    veh_dataFiltered = _.filter(veh_dataFiltered, function(d) {return typeList.indexOf(d.type) != -1;});
  } else {
    veh_dataFiltered = _.filter(veh_dataFiltered, function(d) {return d.type == veh_filterType;});
    var makeList = veh_makeList.map(function(d) {return d.make;});
    // console.log(makeList);
    veh_dataFiltered = _.filter(veh_dataFiltered, function(d) {return makeList.indexOf(d.make) != -1;});
  }
  // console.log("Data filtered by body type: ", veh_dataFiltered.length);
  // console.log("Data filtered by all filters: ", veh_dataFiltered.length);
}

function veh_getPlotData() {
  var yValue;
  if(veh_getSelectedYAxis() == "yaxis1") {
    yValue = "speed_diff_limit";
  } else if(veh_getSelectedYAxis() == "yaxis2") {
    yValue = "travel_speed";
  } else {
    yValue = "year";
  }
  veh_dataPlot = [];
  if(veh_getSelectedType() == "0") {
    var temp = _.groupBy(veh_dataFiltered, "type");
    temp = _.chain(temp)
            .map(function(value, key) {
              return {
                xVal: key,
                content: value
              }
            })
            .value();
    temp.forEach(function(d) {
      d.content = _.countBy(d.content, yValue);
      d.content = _.chain(d.content)
                    .map(function(cnt, key) {
                      return {
                        yVal: key,
                        count: cnt
                      }
                    })
                    .value();
    })
    // console.log(temp);
    tempList = temp.map(function(d) {return d.xVal;});
    // console.log(tempList);
    for(i = 0; i < veh_typeList.length; i++) {
      var index = tempList.indexOf(veh_typeList[i].type);
      if(index == -1) {
        veh_dataPlot.push({
          xVal: parseInt(veh_typeList[i].type),
          xValShow: veh_typeList[i].type_name_show,
          yVal: 0,
          count: 0
        });
      } else {
        for(j = 0; j < temp[index].content.length; j++) {
          veh_dataPlot.push({
            xVal: parseInt(veh_typeList[i].type),
            xValShow: veh_typeList[i].type_name_show,
            yVal: parseInt(temp[index].content[j].yVal),
            count: parseInt(temp[index].content[j].count)
          });
        }
      }
    }
  } else {
    var temp = _.groupBy(veh_dataFiltered, "make");
    temp = _.chain(temp)
            .map(function(value, key) {
              return {
                xVal: key,
                content: value
              }
            })
            .value();
    temp.forEach(function(d) {
      d.content = _.countBy(d.content, yValue);
      d.content = _.chain(d.content)
                    .map(function(cnt, key) {
                      return {
                        yVal: key,
                        count: cnt
                      }
                    })
                    .value();
    })
    // console.log(temp);
    tempList = temp.map(function(d) {return d.xVal;});
    // console.log(tempList);
    for(i = 0; i < veh_typeList.length; i++) {
      var index = tempList.indexOf(veh_makeList[i].make);
      if(index == -1) {
        veh_dataPlot.push({
          xVal: parseInt(veh_makeList[i].make),
          xValShow: veh_makeList[i].make_name_show,
          yVal: 0,
          count: 0
        });
      } else {
        for(j = 0; j < temp[index].content.length; j++) {
          veh_dataPlot.push({
            xVal: parseInt(veh_makeList[i].make),
            xValShow: veh_makeList[i].make_name_show,
            yVal: parseInt(temp[index].content[j].yVal),
            count: parseInt(temp[index].content[j].count)
          });
        }
      }
    }
  }
  // console.log(veh_dataPlot);
}

function veh_plotChart() {
  var myX, myY, myZ, minY, maxY, minZ, maxZ;
  minY = d3.min(veh_dataPlot, function(d) {return d.yVal;});
  maxY = d3.max(veh_dataPlot, function(d) {return d.yVal;});
  minZ = d3.min(veh_dataPlot, function(d) {return d.count;});
  maxZ = d3.max(veh_dataPlot, function(d) {return d.count;});
  // console.log("Minimum Y: " + minY + "\t Maximum Y: " + maxY);
  // console.log("Minimum Z: " + minZ + "\t Maximum Z: " + maxZ);
  // console.log(xList);
  var xLength = 
  myX = d3.scaleBand()
          .range([veh_margin.left, veh_width - 80])
          .domain(xList);
  myY = d3.scaleLinear()
          .range([veh_height, veh_margin.top])
          .domain([minY, maxY]);
  myZ = d3.scaleLinear()
          .range(["#fff", "#69a9cf", "#0570b0", "#023858"])
          .domain([0, 5, 20, maxZ]);
  myTemp = d3.scaleLinear()
            .range([veh_margin.left, veh_width - 80])
            .domain([]);

  // veh_vis.selectAll(".legend").remove();
  veh_vis.selectAll("g").remove();
  veh_vis.selectAll("text").remove();

  var legend = veh_vis.selectAll(".legend")
      .data(myZ.ticks((maxZ / 10) < 15 ? (maxZ / 10) : 15).slice(0).reverse())
      .enter()
      .append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(" + (veh_width-veh_margin.right-10) + "," + (veh_margin.top + i * 15) + ")"; });
  legend.append("rect")
      .attr("width", 40)
      .attr("height",15)
      .style("fill", myZ);
  legend.append("text")
      .attr("x", 45)
      .attr("y", 5)
      .attr("dy", ".5em")
      .attr('class', 'google_fonts')
      .text(String);
  veh_vis.append("text")
      .attr("x", veh_width-5)
      .attr("y", 10)
      .attr('class', 'google_fonts')
      .text("Counts");
	
  var xName;
  if(veh_getSelectedType() == 0) {
    xName = "Body Type";
  } else {
    xName = "Vehicle Make";
  }

  var yName;
  var mphFlag;
  if(veh_getSelectedYAxis() == "yaxis1") {
    yName = "TravelSpeed - SpeedLimit";
    mphFlag = 1;
  } else if(veh_getSelectedYAxis() == "yaxis2") {
    yName = "TravelSpeed";
    mphFlag = 1;
  } else {
    yName = "Vehicle Model Year";
    mphFlag = 0;
  }

  veh_tip = d3.tip()
  			    	.attr('id', 'veh_tooltip')
    			    .html(function(d) {
                var xTitle = xName;
                var xValue = d.xValShow;
                var yTitle = yName;
                var yValue = mphFlag == 1 ? d.yVal + "mph" : d.yVal;
                var count = d.count;

                var info = `<table>
                  			    <tr>
                  			      <td>${xTitle}: ${xValue}</td>
                  			    </tr>
                  			    <tr>
                  			      <td>${yTitle}: ${yValue}</td>
                  			    </tr>
                              <tr>
                                <td>Counts: ${count}</td>
                              </tr>
                            </table> `;
                return info
    			    });

  veh_vis.call(veh_tip);
  
  if(veh_getSelectedYAxis() != "yaxis3") {
    
    veh_vis.selectAll("rect")
            .data(veh_dataPlot)
            .enter()
            .append("g")
            .append("rect")
            .attr("class", "tile")
            .attr("x", function(d) {return veh_margin.left + xList.indexOf(d.xValShow) * (veh_width - 120) / 10;})
            .attr("y", function(d) {return veh_margin.top + (veh_height - veh_margin.top) * maxY / (maxY - minY) - d.yVal * (veh_height - veh_margin.top) / (maxY - minY);})
            .attr("width", (veh_width - 120) / 10)
            .attr("height", (veh_height - veh_margin.top) / (maxY - minY))
            .style("fill", function(d) { return myZ(d.count); })
            .on("mouseover", veh_tip.show)
            .on("mouseout",  veh_tip.hide);
    if(veh_getSelectedYAxis() == "yaxis1") {
      veh_vis.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + (veh_margin.top + ((veh_height-veh_margin.top) * maxY / (maxY - minY))) + ")")
              .call(d3.axisBottom(myTemp));      
      // veh_vis.append("g")
      //         .attr("class", "x axis")
      //         .attr("transform", "translate(0," + (veh_margin.top + ((veh_height-veh_margin.top) * (maxY-40) / (maxY - minY))) + ")")
      //         .call(d3.axisBottom(myTemp));
      // veh_vis.append("g")
      //         .attr("class", "x axis")
      //         .attr("transform", "translate(0," + (veh_margin.top + ((veh_height-veh_margin.top) * (maxY+40) / (maxY - minY))) + ")")
      //         .call(d3.axisBottom(myTemp));
    }


  } else {
    veh_vis.selectAll("rect")
            .data(veh_dataPlot)
            .enter()
            .append("g")
            .append("rect")
            .attr("class", "tile")
            .attr("x", function(d) {return veh_margin.left + xList.indexOf(d.xValShow) * (veh_width - 120) / 10;})
            .attr("y", function(d) {return veh_margin.top + (2016 - d.yVal) * (veh_height - veh_margin.top) / (maxY - minY);})
            .attr("width", (veh_width - 120) / 10)
            .attr("height", (veh_height - veh_margin.top) / (maxY - minY))
            .style("fill", function(d) { return myZ(d.count); })
            .on("mouseover", veh_tip.show)
            .on("mouseout",  veh_tip.hide);
  }



  veh_vis.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0" + "," + veh_height + ")")
      .call(d3.axisBottom(myX))
      .selectAll("text")
      .attr('class', 'google_fonts')
      .style("text-anchor", "end")
      .attr("transform", "rotate(-20)");

  veh_vis.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + veh_margin.left + ", 0)")
      .call(d3.axisLeft(myY))
      .selectAll("text")
      .attr('class', 'google_fonts');

  veh_vis.append("text")
      .attr("text-anchor", "end")
      .attr('class', 'google_fonts')
      .attr("transform", "translate(" + veh_width + "," + (veh_height + veh_margin.top) + ")")
      .text(xName);
  /*
  veh_vis.append("text")
      .attr("text-anchor", "end")
      .attr("transform", "rotate(-90)")
      .text(yName);
  */

}




// Returns the selected option in the X-axis dropdown. Use d[getXSelectedOption()] to retrieve value instead of d.getXSelectedOption()
function veh_getSelectedYAxis() {
  var node = d3.select('#veh_YAxis').node();
  var i = node.selectedIndex;
  return node[i].value;
}

function veh_getSelectedSex() {
  var node = d3.select('#veh_SexFilter').node();
  var i = node.selectedIndex;
  return node[i].value;
}

function veh_getSelectedAge() {
  var node = d3.select('#veh_AgeFilter').node();
  var i = node.selectedIndex;
  return node[i].value;
}

function veh_getSelectedType() {
  var node = d3.select('#veh_TypeFilter').node();
  var i = node.selectedIndex;
  return node[i].value;
}

function veh_getSelectedState(){
  var node = d3.select('#global_state_filter').node();
  var i = node.selectedIndex;
  return node[i] ? node[i].value : "All";
}

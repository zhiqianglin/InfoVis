
// Plot variables
var veh_vis;
var veh_chartWidth = document.getElementById('vehicleSection').clientWidth - 60;
var veh_chartHeight = document.getElementById('vehicleSection').clientHeight - 150;
var veh_chartMargin = {top: 20, right: 50, bottom: 30, left: 20}

//  HTML variables
var veh_stateList = [];
var veh_typeList = [];
var veh_typeListShow = [];
var veh_typeListPlot = [];
var veh_makeList = [];
var veh_makeListShow = [];

var veh_allData = [];
var veh_filteredData = [];
var veh_plotData = [];

// var veh_speeds = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-99", "100-109", "110-119", "120-129", "130-139", "140-149", ">=150"];

//Gets called when the page is loaded.
function initVehicle(){
  var veh_chart = d3.select('#vehicleChart').append('svg');
  veh_chart.attr("width", veh_chartWidth + veh_chartMargin.left + veh_chartMargin.right)
           .attr("height", veh_chartHeight + veh_chartMargin.top + veh_chartMargin.bottom);
  veh_vis = veh_chart.append('g');
  veh_vis.attr("transform", "translate(" + veh_chartMargin.left + "," + veh_chartMargin.top + ")");
  d3.csv("src/data/vehicle.csv", veh_loadFile);
}

function veh_loadFile(data) {
  veh_allData = data;
  veh_allData.forEach(function (d) {
    d.make_num = parseInt(d.make_num);
    d.type_num = parseInt(d.type_num);
    d.model_year = parseInt(d.model_year);
    d.years = parseInt(d.years);
    d.travel_speed = parseInt(d.travel_speed);
    d.speed_limit = parseInt(d.speed_limit);
    d.speed_diff_limit = parseInt(d.speed_diff_limit);
  });
  // console.log(veh_allData.length);

  veh_loadStates();
  veh_loadTypes();
  veh_filterData();
  veh_getPlotData();
  veh_plotChart();
}

function veh_loadStates() {
  veh_stateList = _.map(_.uniqBy(veh_allData, 'state'), function(d) {return d.state;});
  veh_stateList.sort();
  // console.log(veh_stateList);
  for(i = 0; i < veh_stateList.length; i++) {
    var option = document.createElement("option");
    option.value = veh_stateList[i];
    option.text  = veh_stateList[i];
    document.getElementById("veh_StateFilter").add(option);
  }
}

function veh_loadTypes() {
  var veh_countType = _.countBy(veh_allData, 'type');
  // veh_countType.sort();
  var veh_typeListFull = _.chain(veh_countType)
                          .map(function(cnt, type) {
                            return {
                              type: type,
                              count: cnt
                            }
                          })
                          .sortBy('count')
                          .value();
  veh_typeListFull.reverse();
  // console.log(veh_typeListFull);
  veh_typeList = veh_typeListFull.map(d => d.type).slice(0, 10);
  // console.log(veh_typeList);
  veh_typeListShow = veh_typeList.map(d => d.substring(0, d.indexOf("(") == -1 ? d.length : d.indexOf("(")));
  // console.log(veh_typeListShow);
  for(i = 0; i < veh_typeList.length; i++) {
    var option = document.createElement("option");
    option.value = veh_typeList[i];
    option.text  = veh_typeListShow[i];
    document.getElementById("veh_TypeFilter").add(option);
  }
}
/*
function veh_loadMakes() {
  var veh_countMake = _.countBy(veh_filteredData, 'make');
  // console.log(veh_countMake);
  var veh_makeListFull = _.chain(veh_countMake)
                          .map(function(cnt, make) {
                            return {
                              make: make,
                              count: cnt
                            }
                          })
                          .sortBy('count')
                          .value();
  veh_makeListFull.reverse();
  // console.log(veh_makeListFull);
  veh_makeList = veh_makeListFull.map(d => d.make).slice(0, 10);
  // console.log(veh_makeList);
  veh_makeListShow = veh_makeList.map(d => d.substring(0, d.indexOf("\r") == -1 ? d.length : d.indexOf("\r")));
  // console.log(veh_makeListShow);
}
*/
function veh_filterData() {
  veh_filteredData = _.filter(veh_allData, function(d) {return d.travel_speed<500 && d.travel_speed != 0 && d.speed_limit<90;});
//  console.log(veh_filteredData.length);
  // veh_loadMakes();
  veh_filteredData = _.filter(veh_filteredData, function(d) {return veh_typeList.indexOf(d.type) != -1;});
//  console.log(veh_filteredData.length);
}

function veh_getPlotData() {
  temp = _.groupBy(veh_filteredData, 'type');
  temp = _.chain(temp)
                  .map(function(value, key) {
                    return {
                      type: key,
                      content: value
                    }
                  })
                  .value();
  temp.forEach(function(d) {
    d.content = _.countBy(d.content, 'speed_diff_limit');
    d.content = _.chain(d.content)
                  .map(function(cnt, speed_diff_limit) {
                    return {
                      speed_diff_limit: speed_diff_limit,
                      count: cnt
                    }
                  })
                  .value();
  })
//  console.log(temp);
  for(i = 0; i < temp.length; i++) {
    for(j = 0; j < temp[i].content.length; j++) {
      veh_plotData.push({
        type: temp[i].type.substring(0, temp[i].type.indexOf("(") == -1 ? temp[i].type.length : temp[i].type.indexOf("(")),
        speed_diff_limit: parseInt(temp[i].content[j].speed_diff_limit),
        count: parseInt(temp[i].content[j].count)
      });
    }
  }
  veh_typeListPlot = _.map(_.uniqBy(veh_plotData, 'type'), function(d) {return d.type;});
//  console.log(veh_plotData);
//  console.log(veh_typeListPlot);
}

function veh_plotChart() {
  var myX, myY, myZ;
  var minY = d3.min(veh_plotData, function(d) {return d.speed_diff_limit;});
  var maxY = d3.max(veh_plotData, function(d) {return d.speed_diff_limit;});
  var minZ = d3.min(veh_plotData, function(d) {return d.count;});
  var maxZ = d3.max(veh_plotData, function(d) {return d.count;});
//  console.log("Minimum Y: " + minY + "\t Maximum Y: " + maxY);
//  console.log("Minimum Z: " + minZ + "\t Maximum Z: " + maxZ);

  // veh_plotData = _.filter(veh_plotData, function(d) {return d.speed_diff_limit >= 50});

  myX = d3.scaleBand()
          .range([20, veh_chartWidth-80])
          .domain(veh_typeListPlot);
  myY = d3.scaleLinear()
          .range([veh_chartHeight-20, 20])
          .domain([minY, maxY]);
  myZ = d3.scaleLinear()
          .range(["whilte", "yellow", "orange", "red"])
          .domain([0, 5, 10, 50]);
  myTemp = d3.scaleLinear()
            .range([20, veh_chartWidth-80])
            .domain([]);

  var legend = veh_vis.selectAll(".legend")
      .data(myZ.ticks(9).slice(1).reverse())
      .enter()
      .append("g")
      .attr("class", "legend")
      .attr("transform", function(d, i) { return "translate(" + (veh_chartWidth-30) + "," + (20 + i * 20) + ")"; });
  legend.append("rect")
      .attr("width", 40)
      .attr("height",20)
      .style("fill", myZ);
  legend.append("text")
      .attr("x", 45)
      .attr("y", 10)
      .attr("dy", ".35em")
      .text(String);
  veh_vis.append("text")
      .attr("class", "label")
      .attr("x", veh_chartWidth-10)
      .attr("y", 10)
      .attr("dy", ".35em")
      .text("Counts");

    veh_vis.selectAll("rect")
        .data(veh_plotData)
        .enter()
        .append("g")
        .append("rect")
        .attr("class", "tile")
        .attr("x", function(d) {return veh_typeListPlot.indexOf(d.type) * 80+30;})
        .attr("y", function(d) {return 200-d.speed_diff_limit*1.62;})
        .attr("width", 80)
        .attr("height", 2)
        .style("fill", function(d) { return myZ(d.count); });

  veh_vis.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(10," + (veh_chartHeight-20) + ")")
      .call(d3.axisBottom(myX))
      .selectAll("text")  
      .style("text-anchor", "end")
      .attr("transform", "rotate(-10)");
      
  veh_vis.append("text")
      .attr("transform", "translate(" + (veh_chartWidth/2) + "," + (veh_chartHeight+25) + ")")
      .attr("text-anchor", "end")
      .text("Body Type");

  veh_vis.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(30, 0)")
      .call(d3.axisLeft(myY));

  veh_vis.append("text")
      .attr("transform", "translate(80, 0)")
      .attr("text-anchor", "end")
      .text("Speed - Limit");

  veh_vis.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(10," + (veh_chartHeight/2+20*1.62) + ")")
      .call(d3.axisBottom(myTemp));
}




//Called when dropdown changed
function veh_chartUpdate(){
//  console.log("selected Y Axis is ", veh_getSelectedYAxis());
//  console.log("selected State is ", veh_getSelectedState());
//  console.log("selected Type is ", veh_getSelectedType());
}

// Returns the selected option in the X-axis dropdown. Use d[getXSelectedOption()] to retrieve value instead of d.getXSelectedOption()
function veh_getSelectedYAxis() {
  var node = d3.select('#veh_YAxis').node();
  var i = node.selectedIndex;
  return node[i].value;
}

function veh_getSelectedState(){
  var node = d3.select('#veh_StateFilter').node();
  var i = node.selectedIndex;
  return node[i].value;
}

function veh_getSelectedType() {
  var node = d3.select('#veh_TypeFilter').node();
  var i = node.selectedIndex;
  return node[i].value;
}

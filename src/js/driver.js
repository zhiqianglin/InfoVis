let driver_fake_data1 = {
    values: [
        {"type": "Age", "16-25":2000, "25-35":3000, "35-45":2000, "45-60":1000, ">60":500, "total":8500} 
    ],
    columns: ["16-25", "25-35", "35-45", "45-60", ">60"]
};

let driver_fake_data2 = {
    values: [
        {"type": "Obstruction", "None": 500, "Rain, snow":1500, "Roadway":1500, "Glare":1000, "Vehicle":500, "total":5000}
    ],
    columns: ["None", "Rain, snow", "Roadway", "Glare", "Vehicle"]
};

let driver_fake_data3 = {
    values: [
        {"type": "Violation", "None": 1000, "None-Moving":800, "Reckless":1200, "Impirement":600, "License":500, "total":4100}
    ],
    columns: ["None", "None-Moving", "Reckless", "Impirement", "License"]
};

let driver_fake_data4 = {
    values: [
        {"type": "Alcohol", "None": 4000, "Yes":2000, "No":3000, "total":9000}
    ],
    columns: ["None", "Yes", "No"]
}

let driver_fake_data5 = {
    values: [
        {"type": "Drug", "None": 3000, "Yes":1000, "No":2000, "total":6000}
    ],
    columns: ["None", "Yes", "No"]
}

let driver_width = document.getElementById('driver').clientWidth;
let driver_height = 75;
let driver_age_svg;
let driver_age_chart;
let driver_violation_chart;
let driver_obstruction_chart;
let driver_Alcohol_chart;
let driver_drug_chart;
let driver_colorScale;
let driver_x_scale;
let driver_y_scale;
let driver_margin_total = 100;
var build_chart = {

    draw: function(config) {
        me = this,
        data = config.data,
        margin = config.margin,
        width = driver_width - margin.left - margin.right,
        height = driver_height - margin.top - margin.bottom,
        xScale = d3.scaleLinear().rangeRound([0, driver_width - driver_margin_total]);
        yScale = d3.scaleBand().domain(data.values.map(d => { return d.type; }))
            .rangeRound([driver_height, 0])
            .padding(0.1)
            .align(0.3);

        max = 0;
        for (let i = 0; i < data.columns.length; i++) {
            if (data.values[0][data.columns[i]] > max) {
                max = data.values[0][data.columns[i]];
            }
        }
        // console.log(max);
        colorScale2 = d3.scaleLinear().domain([0, max]).range(["#ffffff", "#0570b0"]);
        xAxis = d3.axisBottom().scale(xScale).tickSize(0);
        yAxis = d3.axisLeft().scale(yScale).tickSize(0);

        svg = d3.select("#driver")
            .append("svg")
            .attr("width", driver_width)
            .attr("height", driver_height);

        let chart = svg.append("g")
            .attr("width", width)
            .attr("height", height)
            .attr("transform", "translate(" + margin.left + ", " + margin.top + ")"); 

        chart.append("g")
            .attr("class", "driver-axis-y")
            .attr("transform", "translate(" + (-30) + ", " + (-20) + ")")
            .call(yAxis);

        let stack = d3.stack().offset(d3.stackOffsetExpand);

        var serie = chart.selectAll(".serie")
            .data(stack.keys(data.columns)(data.values))
            .enter()
            .append("g")
            .attr("class", "serie")
            .attr("fill", d => {
                let c = d[0].data[d.key];
                return colorScale2(c);
             })

        serie.selectAll("rect")
            .data(d => { return d; })
            .enter()
            .append("rect")
            .attr("y", d => { return yScale(d.data.type); })
            .attr("height",d => { return yScale.bandwidth(); })
            .attr("x", d => { return xScale(d[0]) - 15; })
            .attr("width", d => { return xScale(d[1]) - xScale(d[0]) - 15; });
        
        var legend = serie.append("g")
            .attr("class", "driver-legend")
            .attr("transform", d => { 
                var d = d[d.length - 1];
                return "translate(" + (((xScale(d[0]) + xScale(d[1])) / 2) - 40) + ", -3)";
            });
    
        legend.append("text")
                .text( d => { return d.key; });
    }
}

function driver_init() {
    let margin = {top: 50, bottom: 100, left: 130, right: 50};

    build_chart.draw({
        data: driver_fake_data1,
        margin: margin
    });

    build_chart.draw({
        data: driver_fake_data2,
        margin: margin
    });

    build_chart.draw({
        data: driver_fake_data3,
        margin: margin
    });

    build_chart.draw({
        data: driver_fake_data4,
        margin: margin
    });

    build_chart.draw({
        data: driver_fake_data5,
        margin: margin
    });
}

driver_init();
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


let driver_filter = {
    sex: "All",
    vehicle_make: "All",
    state: "All"
};

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
let driver_person_data;
let driver_vision_data;
let driver_violation_data;

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



d3.queue()
    .defer(d3.csv, './src/data/driver.csv', d => {
        return {
            state: +d.state,
            case_number: d.case_number,
            sex: d.sex,
            age: +d.age,
            vehicle_make: d.vehicle_make,
            alcohol: d.alcohol,
            drug: d.drug,
        }
    })
    .defer(d3.csv, './src/data/vision.csv', d => {
        return {
            state: +d.state,
            case_number: d.case_number,
            obscured_by: d.obscured_by,
            sex: d.sex,
            vehicle_make: d.vehicle_make
        }
    })
    .defer(d3.csv, './src/data/violation.csv', d => {
       return {
           state: +d.state,
           case_number: d.case_number,
           violation_name: d.violation_name.split(",")[0],
           vehicle_make: d.vehicle_make,
           sex: d.sex
       }
    })
    .await(driver_load_data)

function driver_load_data(error, driver, obstruction, violation) {
    if (error) {
        throw error;
    }

    driver_person_data = driver;
    driver_vision_data = obstruction;
    driver_violation_data = violation;

    let age_data = driver_groupby_age(driver_person_data);
    let alcohol_data = driver_groupby_alcohol(driver_person_data);
    let drug_data = driver_groupby_drug(driver_person_data);
    let violation_data = driver_filter_violation(driver_violation_data);
    let obstruction_data = driver_filter_obstruction(driver_vision_data);


    driver_init();
}

function driver_update_filter(state) {
    driver_filter.state = state;

    let age_data = driver_groupby_age(driver_person_data);
    let alcohol_data = driver_groupby_alcohol(driver_person_data);
    let drug_data = driver_groupby_drug(driver_person_data);
    let violation_data = driver_filter_violation(driver_violation_data);
    let obstruction_data = driver_filter_obstruction(driver_vision_data);

}

function driver_groupby_age(driver) {
    let filtered = driver_filter_data(driver);
    let age_group = {
        '< 16': _.countBy(filtered, d => { return d.age < 16; }).true,
        '16 - 25': _.countBy(filtered, d => { return d.age >= 16 && d.age <= 25; }).true,
        '25 - 35': _.countBy(filtered, d => { return d.age >= 26 && d.age <= 35; }).true,
        '35 - 45': _.countBy(filtered, d => { return d.age >= 36 && d.age <= 45; }).true,
        '45 - 60': _.countBy(filtered, d => { return d.age >= 46 && d.age <= 60; }).true,
        '> 60': _.countBy(filtered, d => { return d.age > 60; }).true
    }
    console.log(age_group);
    return age_group;
}

function driver_groupby_drug(driver) {
    let filtered = driver_filter_data(driver);
    let drug_data = _.groupBy(filtered, d => {
        return d.drug;
    });

    for (var key in drug_data) {
        if (drug_data.hasOwnProperty(key)) {
            drug_data[key] = drug_data[key].length;
        }
    }
    console.log(drug_data);
    return drug_data;
}

function driver_groupby_alcohol(driver) {
    let filtered = driver_filter_data(driver);
    let alcohol_data = _.groupBy(filtered, d => { return d.alcohol; });
    alcohol_data = change_to_count(alcohol_data);
    console.log(alcohol_data);
    return alcohol_data;
}

function driver_filter_obstruction(obstruction) {
    let filtered = driver_filter_data(obstruction);
    let obstruction_data = _.groupBy(filtered, d => { return d.obscured_by; });
    obstruction_data = change_to_count(obstruction_data);
    console.log(obstruction_data);
    return obstruction_data;
}

function driver_filter_violation(violation) {
    let filtered = driver_filter_data(violation);
    let violation_data = _.groupBy(filtered, d => { return d.violation_name; });
    violation_data = change_to_count(violation_data);
    console.log(violation_data);
    return violation_data;
}

function driver_filter_data(accident) {
    let filtered = driver_filter_state(accident);
    let filtered2 = driver_filter_make(filtered);
    return filtered2;
}

function driver_filter_state(accident) {
    if (driver_filter.state === "All") {
        return accident;
    }
    let filter_by_state = _.filter(accident, d => {
        return d.state == driver_filter.state
    });
    return filter_by_state;
}

function driver_filter_make(accident) {
    if (driver_filter.vehicle_make === "All") {
        return accident;
    }
    let filter_by_make = _.filter(accident, d => {
        return d.vehicle_make == driver_filter.vehicle_make
    });
    return filter_by_make;
}

function change_to_count(data) {
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            data[key] = data[key].length;
        }
    }
    return data;
}

function build_data(age) {

}



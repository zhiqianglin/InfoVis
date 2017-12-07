let driver_filter = {
    sex: "All",
    vehicle_make: "All",
    state: "All"
};
let driver_width = document.getElementById('driver').clientWidth * 0.85;
let driver_height = 75;
let driver_margin_total = 100;
let driver_person_data;
let driver_vision_data;
let driver_violation_data;
let driver_color_scale = d3.scaleLinear().domain([0, 1]).range(["#d2e6f2", "#0570b0"]);
let driver_top_make = new Set(["Ford", "Chevrolet", "Toyota", "Honda", "Dodge", "Datsun/Nissan", "Harley-Davidson", "GMC", "Jeep/Kaiser-Jeep/Willys Jeep", "Freightliner"]
);

let build_chart = {
    draw: function(config) {
        me = this,
        data = config.data,
        margin = config.margin,
        width = driver_width - margin.left - margin.right,
        height = driver_height - margin.top - margin.bottom,
        xScale = d3.scaleLinear().rangeRound([0, width]);
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
        colorScale2 = d3.scaleLinear().domain([0, 1]).range(["#ffffff", "#0570b0"]);
        xAxis = d3.axisBottom().scale(xScale).tickSize(0);
        yAxis = d3.axisLeft().scale(yScale).tickSize(0);

        svg = d3.select("#driver")
            .append("svg")
            .attr("class", "driver-svg")
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

        let serie = chart.selectAll(".serie")
            .data(stack.keys(data.columns)(data.values))
            .enter()
            .append("g")
            .attr("class", "serie")
            .attr("fill", d => {
                let ratio = d[0]["data"][d.key] / d[0]["data"]["total"]
                return driver_color_scale(ratio);
             });

        let tip = d3.tip()
             .attr("class", "driver-d3-tip")
             .offset([-10, 0])
             .html(d => {
                // console.log(d);
                let ratio = d[0]["data"][d.key] / d[0]["data"]["total"] * 100;
                return "<span class='driver-tool-tip-text'>" + d.key + ": " + ratio.toFixed(1) + "%" + "</span>";
             });
 
        serie.call(tip);
            
        serie.selectAll("rect")
            .data(d => { return d; })
            .enter()
            .append("rect")
            .attr("y", d => { return yScale(d.data.type); })
            .attr("height",d => { return yScale.bandwidth(); })
            .attr("x", d => { return xScale(d[0]) - 10; })
            .attr("width", d => { 
                let diff = xScale(d[1]) - xScale(d[0]) - 10;

                if (diff <=0) {
                    return 0;
                }
                return diff;
            });
            
        serie.on("mouseover", tip.show)
                .on("mouseout", tip.hide);

        let legend = serie.append("g")
            .attr("class", "driver-legend")
            .attr("transform", d => {
                let dd = d[d.length - 1];
                let size = 15;
                let text_length = size * d.key.length * 0.6;
                let dif = xScale(d[0][1]) - xScale(d[0][0]);
                if (dif * 0.9 < text_length) {
                    return "translate(" + (((xScale(dd[0]) + xScale(dd[1])) / 2) - (3 * 15 / 2)) + ", -3)";                                        
                } else {
                    return "translate(" + (((xScale(dd[0]) + xScale(dd[1])) / 2) - 10 - (text_length / 2)) + ", -3)";                    
                }
            })

    
        legend.append("text")
            .text( d => { 
                // console.log(d);
                let size = 15;
                let text_length = size * d.key.length * 0.6;
                let dif = xScale(d[0][1]) - xScale(d[0][0]);
                // console.log(dif);
                if (dif * 0.9 < text_length) {
                    return "...";
                } else {
                    return d.key; 
                }
            });


    }
}

function driver_init(age, obstruction, violation, alcohol, drug) {
    let margin = {top: 50, bottom: 100, left: 200, right: -30};

    for (let i = 0; i < arguments.length; i++) {
        if (arguments[i].values[0].total != 0) {
            build_chart.draw({
                data: arguments[i],
                margin: margin
            });
        }
    }

    console.log(d3.schemeBlues[5]);
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
    driver_update_filter();
}

function driver_update_filter(sex, make, state) {
    d3.selectAll(".driver-svg").remove();
    if (make) {
        driver_filter.vehicle_make = make;
    }
    if (state) {
        driver_filter.state = state;
    }
    if (sex) {
        driver_filter.sex = sex;
    }
    let age_data = driver_groupby_age(driver_person_data);
    let alcohol_data = driver_groupby_alcohol(driver_person_data);
    let drug_data = driver_groupby_drug(driver_person_data);
    let violation_data = driver_filter_violation(driver_violation_data);
    let obstruction_data = driver_filter_obstruction(driver_vision_data);
    driver_init(age_data, obstruction_data, violation_data, alcohol_data, drug_data);
}

function driver_groupby_age(driver) {
    let filtered = driver_filter_data(driver);
    let age_group_data = {};
    let age1 = _.countBy(filtered, d => { return d.age >= 16 && d.age <= 25; }).true;
    let age2 = _.countBy(filtered, d => { return d.age >= 26 && d.age <= 35; }).true;
    let age3 = _.countBy(filtered, d => { return d.age >= 36 && d.age <= 45; }).true;
    let age4 = _.countBy(filtered, d => { return d.age >= 46 && d.age <= 60; }).true;
    let age5 = _.countBy(filtered, d => { return d.age > 60; }).true
    if (age1 && age1 != 0) {
        age_group_data['16-25'] = age1;
    }
    if (age2 && age2 != 0) {
        age_group_data['25-35'] = age2;
    }
    if (age3 && age3 != 0) {
        age_group_data['35-45'] = age3;
    }
    if (age4 && age4 != 0) {
        age_group_data['45-60'] = age4;
    }
    if (age5 && age5 != 0) {
        age_group_data['>60'] = age5;
    }
    age_group_data = build_data(age_group_data, "age");
    // console.log(age_group_data);
    return age_group_data;
}

function driver_groupby_drug(driver) {
    let filtered = driver_filter_data(driver);
    let drug_data = _.groupBy(filtered, d => {
        return d.drug;
    });
    drug_data = change_to_count(drug_data);
    drug_data = build_data(drug_data, "drug");
    // console.log(drug_data);
    return drug_data;
}

function driver_groupby_alcohol(driver) {
    let filtered = driver_filter_data(driver);
    let alcohol_data = _.groupBy(filtered, d => { return d.alcohol; });
    alcohol_data = change_to_count(alcohol_data);
    alcohol_data = build_data(alcohol_data, "alcohol");
    // console.log(alcohol_data);
    return alcohol_data;
}

function driver_filter_obstruction(obstruction) {
    let filtered = driver_filter_data(obstruction);
    let obstruction_data = _.groupBy(filtered, d => { return d.obscured_by; });
    obstruction_data = change_to_count(obstruction_data);
    obstruction_data = build_data(obstruction_data, "obstruction");
    // console.log(obstruction_data);
    return obstruction_data;
}

function driver_filter_violation(violation) {
    let filtered = driver_filter_data(violation);
    let violation_data = _.groupBy(filtered, d => { return d.violation_name; });
    violation_data = change_to_count(violation_data);
    violation_data = build_data(violation_data, "violation");
    // console.log(violation_data);
    return violation_data;
}

function driver_filter_data(accident) {
    let filtered = driver_filter_state(accident);
    let filtered2 = driver_filter_make(filtered);
    let filtered3 = driver_filter_sex(filtered2);
    return filtered3;
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
    let filter_by_make;
    if (driver_filter.vehicle_make === "All") {
        return accident;
    } else if (driver_filter.vehicle_make === "Other") {
        filter_by_make = _.filter(accident, d => {
            return !driver_top_make.has(d.vehicle_make);
        });
    } else {
        filter_by_make = _.filter(accident, d => {
            return d.vehicle_make == driver_filter.vehicle_make
        });
    }
    return filter_by_make;
}

function driver_filter_sex(accident) {
    let filter_by_sex;
    if (driver_filter.sex === "All") {
        return accident;
    } else {
        filter_by_sex = _.filter(accident, d => {
            return d.sex === driver_filter.sex;
        });       
    }
    return filter_by_sex;
}

function change_to_count(data) {
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            data[key] = data[key].length;
        }
    }
    return data;
}

function build_data(data, type) {
    let ans;
    if (type === "violation") {
        ans = fucking_hard_code2(build_data_object(data));
    } else if (type === "obstruction") {
        ans = fucking_hard_code3(build_data_object(data));
    } else if (type === "alcohol" || type === "drug") {
        ans = fucking_hard_code1(data);
    } else {
        ans = data;
    }

    let sum = 0;
    data_col = [];
    for (var key in ans) {
        if (ans.hasOwnProperty(key)) {
            sum += ans[key];
            data_col.push(key);
        }
    }
    switch(type) {
        case "age":
            ans.type = "Age";
            break;
        case "violation":
            ans.type = "Violation";
            break;
        case "obstruction":
            ans.type = "Obstruction";
            break;
        case "drug":
            ans.type = "Drug";
            break;
        case "alcohol":
            ans.type = "Alcohol";
            break;
        default:
            break;
    }
    ans.total = sum;
    result = {
        values:[ans],
        columns: data_col
    }
//    console.log(result);
    return result;
}

function build_data_object(data) {
    res = get_top(data, 5);
    result = {};
    for (i in res) {
        result[res[i][0]] = res[i][1];
    }
//    console.log(result);
    return result;
}

function get_top(data, top_number) {
    sortable = [];
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            sortable.push([key, data[key]]);
        }
    }
    sortable.sort(function(a, b) {
        return b[1] - a[1];
    });
    return sortable.slice(1, top_number + 1);
}

function fucking_hard_code1(data) {
    final_data = {};
    let no_report = 0;
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            if (!data[key] && data[key] == 0) {
                delete data[key];
            }
            if (key.includes("Unknown")) {
                no_report += data[key];
            } else if (key.includes("Not Reported")) {
                no_report += data[key]
            } else if (key.includes("Yes")) {
                final_data["Yes"] = data[key];
            } else {
                final_data["No"] = data[key];
            }
        }
    }
    final_data["Not Reported"] = no_report;
    return final_data;
}

function fucking_hard_code2(data) {
    final_data = {};
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            if (!data[key] && data[key] == 0) {
                delete data[key];
            }
            if (key.includes("CARELESS/HIT-AND-RUN")) {
                final_data["Careless/Hit and Run"] = data[key];
            } else if (key.includes("IMPAIRMENT OFFENSES")) {
                final_data["Impairment"] = data[key];
            } else if (key.includes("NON-MOVING")) {
                final_data["Non Moving"] = data[key];
            } else if (key.includes("RULES OF THE ROAD")) {
                final_data["Turning"] = data[key];
            } else {
                final_data["License"] = data[key];
            }
        }
    }
    return final_data;
}

function fucking_hard_code3(data) {
    final_data = {};
    for (var key in data) {
        if (data.hasOwnProperty(key)) {
            if (!data[key] && data[key] == 0) {
                delete data[key];
            }
            if (key.includes("Unknown")) {
                final_data["Not Reported"] = data[key];
            } else if (key.includes("Rain, Snow")) {
                final_data["Rain/Snow/Fog"] = data[key];
            } else if (key.includes("In-Transport Motor")) {
                final_data["In-Transport Motor"] = data[key];
            } else if (key.includes("Reflected Glare")) {
                final_data["Glare"] = data[key];
            } else {
                final_data["Others"] = data[key];
            }
        }
    }
    return final_data;
}


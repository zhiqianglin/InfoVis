let usjson, states;
let accident = new Map();
let accidents;

function init() {
  loadData();
  initVehicle();
}

function loadData() {
  d3.queue()
    .defer(d3.json, './src/data/us.json')
    .defer(d3.csv, './src/data/accident_count_with_pop.csv')
    .defer(d3.csv, './src/data/state.csv', d => {
      accident.set(+d.state, +d.accident);
    })
    .await(start);
}

function start(error, us, accidents_raw) {
  if (error) {
    throw error;
  }
  //Assign to global variable
  // usjson = us;
  // states = states;
  accidents = accidents_raw;
  //Load scripts for each section
  loadScript("./src/js/entry.js");
  loadScript("./src/js/driver.js");
}


// https://stackoverflow.com/questions/14460231/how-do-you-import-multiple-javascript-files-in-html-index-file-without-the-bloat
function loadScript(url)
{    
  var head = document.getElementsByTagName('head')[0];
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = url;
  head.appendChild(script);
}


//Use this method to update your filter used in your view
function global_filter_changed_from_html(new_state_id) {
  update_global_fiter_for_entry(new_state_id);
}


//Use this method to set the value of filter from js file
function set_global_filter_from_js(new_state_id) {
    var element = document.getElementById('global_state_filter');
    element.value = new_state_id;
    global_filter_changed_from_html(new_state_id);
}


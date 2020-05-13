
function doGET(path, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            if (xhr.status == 200) {
                callback(xhr.responseText);
            } else {
                callback(null);
            }
        }
    };
    xhr.open("GET", path);
    xhr.send();
}

let world = '';
let color = '';
let geojson = '';
let projection = '';
let path = '';
let countries = '';
let is_color_scheme_changed = false;
let format = d => `${d}`;
let dates = Array.from({length: 107}, (_, i) => {
    const date = new Date(2019, 12, 31);
    date.setDate(i);
    return date.toDateString();
});
function handleJSONFileData(fileData) {
    if (!fileData) {
        console.log('JSON Error!');
        return;
    }

    world = JSON.parse(fileData);

    color = d3.scaleQuantize([0, 1000], d3.schemeReds[8]);

    geojson = topojson.feature(world, world.objects.countries);

    projection = d3.geoMercator()
        .fitSize([750, 600],geojson);
    path = d3.geoPath().projection(projection);

    countries = new Map(world.objects.countries.geometries.map(d => [d.id, d.properties.name]))

    let charts = d3.select('#charts');

    // filter
    const mode_option_labels = ['infected cases',
        'deaths'];
    const accumulated_option_labels = ['increased',
        'accumulated'];
    charts.append("form")
        .append("select")
        .attr("id", "select_accumulated")
        .attr("class", "select")
        .on('change', change_accumulated)
        .selectAll("option")
        .data(accumulated_option_labels)
        .enter().append("option")
        .attr('value', (d, i) => d)
        .text((d, i) => d)
    charts.append("form")
        .append("select")
        .attr("id", "select_mode")
        .attr("class", "select")
        .on('change', change_mode)
        .selectAll("option")
        .data(mode_option_labels)
        .enter().append("option")
        .attr('value', (d, i) => d)
        .text((d, i) => d)

    // time scroller
    let form = charts.append('form')
        .attr('id', 'scroller')
    form.append('button')
        .attr('id', 'button')
        .attr('name', 'b')
        .attr('type', 'button');
    let label = form.append('label')
        .attr('id', 'label');
    label.append('input')
        .attr('id', 'controller')
        .attr('name', 'i')
        .attr('type', 'range')
        .attr('min', 0)
        .attr('max', dates.length - 1)
        .property('value', 0)
        .attr('step', 1);
    label.append('output')
        .attr('id', 'output')
        .attr('name', 'o');

    // canvas
    let svg = charts.append("svg")
        .attr("id", "geo-chart")
        .attr("viewBox", [0, 0, 900, 420]);

    // legend
    svg.append("g")
        .attr("id", "legend_group")
        .attr("transform", "translate(700,0)")
        .append(() => legend({color, title: "Number of cases:", width: 180}))
        .attr("id", "legend");

    // map
    let map = svg.append("g")
        .attr("id", "paths");
    map.append("g")
        .attr("id", "map")
        .selectAll("path")
        .data(geojson.features)
        .join("path")
        .attr("d", path)
        .attr("name", d => `${countries.get(d.id)}`)
        .attr("transform", "translate(50, 0)")
        .append("title")
        .text(d => `${countries.get(d.id)}`);

    // map boundaries
    map.append("g")
        .append("path")
        .attr("id", "boundaries")
        .datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke-linejoin", "round")
        .attr("transform", "translate(50, 0)")
        .attr("d", path);

    doGET('https://raw.githubusercontent.com/Lotunnnnny/Remote-Resources/master/COVID-19-geographic-disbtribution-worldwide-accumulated.csv', handleCSVFileData);

}

let raw_data = '';
let data = '';
let current_date = "31/12/2019";
let current_mode = "infected cases";
let is_accumulated = false;
function handleCSVFileData(fileData) {
    if (!fileData) {
        console.log('CSV Error!');
        return;
    }
    raw_data = d3.csvParse(fileData);
    updateData();

    // time scroll bar
    Scrubber(dates);
}

function abstractData() {
    initData();
    let index = (is_accumulated?'accumulated ':'')+(current_mode==='infected cases'?'cases':'deaths');
    raw_data.forEach(function (row) {
        if (row.dateRep === current_date) {
            data.set(row.countriesAndTerritories, row[index]); // [country,cases/deaths]
        }
    });
}

function initData() {
    let temp = [];
    geojson.features.forEach(function (item) {
        temp.push([item.properties.name, 0]);
    });
    data = Object.assign(new Map(temp));
}

function updateData() {

    abstractData();

    // update legend
    if (is_color_scheme_changed) {
        switch (current_mode) {
            case "infected cases":
                color = d3.scaleQuantize([0, 1000], d3.schemeReds[8]);
                break;
            case "deaths":
                color = d3.scaleQuantize([0, 1000], d3.schemeGreys[8]);
        }
        is_color_scheme_changed = false;
    }
    d3.select("#legend").remove();
    d3.select("#legend_group")
        .append(() => legend({color, title: "Number of cases:", width: 150}))
        .attr("id", "legend");

    // update fill
    d3.select("#map")
        .selectAll("path")
        .attr("fill", d => color(data.get(d.properties.name)))
        .select("title")
        .text(d => d.properties.name+": \n"+data.get(d.properties.name));

    // update boundaries color
    let stroke_color = current_mode === 'infected cases'?'white':'lightgrey';
    d3.select('#boundaries')
        .attr("stroke", stroke_color);
}

function controlTime(date) {
    let temp = new Date(date);
    let temp_date = temp.getDate();
    let temp_month = temp.getMonth()+1;
    current_date = (temp_date>9?temp_date:'0'+temp_date)+'/'+(temp_month>9?temp_date:'0'+temp_month)+'/'+temp.getFullYear();
    updateData();
}

function change_mode() {
    current_mode = d3.select('#select_mode').property('value');
    is_color_scheme_changed = true;
    updateData();
}

function change_accumulated() {
    is_accumulated = d3.select('#select_accumulated').property('value')==='accumulated';
    updateData();
}

doGET('https://raw.githubusercontent.com/Lotunnnnny/Remote-Resources/master/countries-50m.json', handleJSONFileData);
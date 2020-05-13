
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

data = '';
function handleCSVFileData(fileData) {
    if (!fileData) {
        console.log('CSV Error!');
        return;
    }
    data = Object.assign(new Map(d3.csvParse(fileData, ({id, num}) => [id, +num])), {title: "Number of cases:"});
    console.log(data);
    doGET('https://raw.githubusercontent.com/Lotunnnnny/Remote-Resources/master/London_Borough_Excluding_MHW.json', handleJSONFileData);
}

let london = '';
let color = '';
let geojson = '';
let projection = '';
let path = '';
let boroughs = '';
let format = d => `${d}`;
function handleJSONFileData(fileData) {
    if (!fileData) {
        console.log('JSON Error!');
        return;
    }

    london = JSON.parse(fileData);

    color = d3.scaleQuantize([0, 1000], d3.schemeBlues[8])

    geojson = topojson.feature(london, london.objects.London_Borough_Excluding_MHW);
    projection = d3.geoIdentity()
        .reflectY(true)
        .fitSize([550, 350],geojson);
    path = d3.geoPath().projection(projection);

    boroughs = new Map(london.objects.London_Borough_Excluding_MHW.geometries.map(d => [d.id, d.name]))

    create_selection();

    let svg = d3.select('#charts')
        .append("svg")
        .attr("id", "geo-chart")
        .attr("viewBox", [0, 0, 900, 500]);

    svg.append("g")
        .attr("transform", "translate(300,0)")
        .append(() => legend({color, title: data.title, width: 260}));

    svg.append("g")
        .attr("id", "paths")
        .selectAll("path")
        .data(geojson.features)
        .join("path")
        .attr("fill", d => color(data.get(d.id)))
        .attr("d", path)
        .attr("transform", "translate(150, 80)")
        .append("title")
        .text(d => `${boroughs.get(d.id)}
        ${format(data.get(d.id))}`);

    svg.append("path")
        .datum(topojson.mesh(london, london.objects.London_Borough_Excluding_MHW, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-linejoin", "round")
        .attr("transform", "translate(150, 80)")
        .attr("d", path);

}

function create_selection(){
    const crime_types = ['Anti-social behaviour',
        'Bicycle theft',
        'Burglary',
        'Criminal damage and arson',
        'Drugs',
        'Other theft',
        'Possession of weapons',
        'Public order',
        'Robbery',
        'Shoplifting',
        'Theft from the person',
        'Vehicle crime',
        'Violence and sexual offences',
        'Other crime',
        'All crime'];

let select = d3.select('#charts')
    .append("form")
    .append("select")
    .attr("class", "select")
    .on('change', change_csv);

var options = select.selectAll("option")
    .data(crime_types)
    .enter().append("option")
    .attr('value', (d, i) => d)
    .text((d, i) => d)

}

function updateData(fileData) {
    if (!fileData) {
        console.log('CSV Error!');
        return;
    }

    data = Object.assign(new Map(d3.csvParse(fileData, ({id, num}) => [id, +num])), {title: "Number of cases:"});

    max = 0;
    for (var i = 0; i < 33; i++) {
        if (data.get(''+(i+1)) > max) {
            max = data.get(''+(i+1));
        }
    }

    let svg = d3.select('#geo-chart');

    color = d3.scaleQuantize([0,max], d3.schemeBlues[8]);

    svg.selectAll("g").remove();
    svg.append("g")
        .attr("transform", "translate(300,0)")
        .append(() => legend({color, title: data.title, width: 260}));

    svg.append("g")
        .attr("id", "paths")
        .selectAll("path")
        .data(geojson.features)
        .join("path")
        .attr("fill", d => color(data.get(d.id)))
        .attr("d", path)
        .attr("transform", "translate(150, 80)")
        .append("title")
        .text(d => `${boroughs.get(d.id)}
        ${format(data.get(d.id))}`);

    svg.append("path")
        .datum(topojson.mesh(london, london.objects.London_Borough_Excluding_MHW, (a, b) => a !== b))
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-linejoin", "round")
        .attr("transform", "translate(150, 80)")
        .attr("d", path);
}

function change_csv() {
    prefix = 'https://raw.githubusercontent.com/Lotunnnnny/Remote-Resources/master/csv/';
    suffix = '.csv';
    file_path = prefix+d3.select('.select').property('value')+suffix;

    doGET(file_path, updateData)
}


doGET('https://raw.githubusercontent.com/Lotunnnnny/Remote-Resources/master/csv/Anti-social behaviour.csv', handleCSVFileData);
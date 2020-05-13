// data set
count = 0;
function bumps(m) {
    const values = [

        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // Anti-social behaviour
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // Bicycle theft
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // Burglary
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // Criminal damage and arson
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // Drugs
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // Other theft
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // Possession of weapons
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // Public order
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // Robbery
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // Shoplifting
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // Theft from the person
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // Vehicle crime
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // Violence and sexual offences
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  // Other crime
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]   // All crime
    ];
    if (count < m)
        return values[count++];
}

margin = ({top: 0, right: 0, bottom: 10, left: 0});

height = 500;
width = 954;
m = 33; // number of boroughs
n = 15; // number of crime categories

xz = d3.range(m); // the x-values shared by all series
yz = d3.range(n).map(() => bumps(m)); // the y-values of each of the n series
y01z = d3.stack()
    .keys(d3.range(n))
    (d3.transpose(yz)) // stacked yz
    .map((data, i) => data.map(([y0, y1]) => [y0, y1, i]));
yMax = d3.max(yz, y => d3.max(y));
y1Max = d3.max(y01z, y => d3.max(y, d => d[1]));

x = d3.scaleBand()
    .domain(xz)
    .rangeRound([margin.left, width - margin.right])
    .padding(0.08);

xAxis = svg => svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickSizeOuter(0).tickFormat(() => ""));

y = d3.scaleLinear()
    .domain([0, y1Max])
    .range([height - margin.bottom, margin.top]);

z = d3.scaleSequential(d3.interpolateBlues)
    .domain([-0.5 * n, 1.5 * n]);

layout = 'stacked';

const svg = d3.select('#charts').append('svg')
    .attr("viewBox", [0, 0, width, height]);

const rect = svg.selectAll("g")
    .data(y01z)
    .join("g")
    .attr("fill", (d, i) => z(i))
    .selectAll("rect")
    .data(d => d)
    .join("rect")
    .attr("x", (d, i) => x(i))
    .attr("y", height - margin.bottom)
    .attr("width", x.bandwidth())
    .attr("height", 0);

svg.append("g")
    .call(xAxis);

function transitionGrouped() {
    y.domain([0, yMax]);

    rect.transition()
        .duration(500)
        .delay((d, i) => i * 20)
        .attr("x", (d, i) => x(i) + x.bandwidth() / n * d[2])
        .attr("width", x.bandwidth() / n)
        .transition()
        .attr("y", d => y(d[1] - d[0]))
        .attr("height", d => y(0) - y(d[1] - d[0]));
}

function transitionStacked() {
    y.domain([0, y1Max]);

    rect.transition()
        .duration(500)
        .delay((d, i) => i * 20)
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .transition()
        .attr("x", (d, i) => x(i))
        .attr("width", x.bandwidth());
}

function update(layout) {
    if (layout === "stacked") transitionStacked();
    else transitionGrouped();
}

update(layout);
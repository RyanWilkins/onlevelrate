
/**
 ** Define the area that holds the dashboard
 */
const viewboxDim = {minx:"0", miny:"0", width:"100", height:"50"};

/*
** Temporary assumptions that allow for debugging
*/
let rate_years = [2011, 2012,2013,2014,2015]
let year_type = "cy"

const start_date = moment([rate_years[0], "-01-01"].join(), "YYYY-MM-DD")
const end_date = moment([rate_years[rate_years.length-1]+1,"-01-01"].join(), "YYYY-MM-DD")

const start_date_two = moment([rate_years[0], "-01-02"].join(), "YYYY-MM-DD")
// TODO:
// If we have law changes on the same day it crashes due to vertical lines

const increase_one = moment("2015-01-01", "YYYY-MM-DD")
const increase_two = moment("2012-5-01", "YYYY-MM-DD")
const increase_three = moment("2012-6-01", "YYYY-MM-DD")
const increase_four = moment("2011-1-01", "YYYY-MM-DD")
const increase_five = moment("2012-7-01", "YYYY-MM-DD")
const law_change_date = moment("2012-12-01", "YYYY-MM-DD")
const law_change_date_two = moment("2012-8-05", "YYYY-MM-DD")
const law_change_date_three = moment("2012-10-01", "YYYY-MM-DD")
const policy_length_days = 365

var py_borders = [
                    {date: start_date, value: 0, law_change:false},
                    {date: end_date, value: 0, law_change:false}
]

/*var rate_changes = 
                [
                    { date: increase_one, value: 0.05, law_change: false},
                    { date: increase_two, value: 0.10, law_change: false},
                    { date: increase_three, value: 0.07, law_change: false},
                    { date: law_change_date, value: -0.05, law_change: true},
                    { date: law_change_date_two, value: 0.10, law_change: true},
                    { date: increase_four, value: 0.01, law_change:false}
                ]*/

var other_rate_changes = [
    new RateChange(increase_one, 1, false, 1)
    /*new RateChange(increase_two,0.1, false, 1),
    new RateChange(increase_three, 0.15, false, 1),
    new RateChange(law_change_date, 0.07, true, 1),
    new RateChange(law_change_date_two, -0.05, true, 1),
    new RateChange(increase_four, 0.02, false, 1),
    new RateChange(law_change_date_three, 0.2, true, 1),
    new RateChange(increase_five, -0.15, false, 1)*/
]

other_rate_changes.sort((a,b) => a.effective_date - b.effective_date)

//console.log(other_rate_changes.map(d=> [d.start_date, d.law_change, d.end_date]))

/*
** Variables that define the Dashboard area and graphic area
*/

/* Height and width of the dashboard */
const viewboxDimString = viewboxDim.minx.concat(" ", viewboxDim.miny, " ",
viewboxDim.width, " ", viewboxDim.height);
const height = +viewboxDim.height;
const width = +viewboxDim.width;

/* Margin between the dashboard and the graphic, and defining graphic dimendsions */
const margin = {top:20, bottom: 15, right: 2, left: 2};
const graphicDimensions = {upperLeftx: margin.left, upperLefty: margin.top,
                upperRightx: width - margin.right, upperRighty: margin.top,
                lowerLeftx: margin.left, lowerLefty: height - margin.bottom};
const graphicHeight = graphicDimensions.lowerLefty - graphicDimensions.upperLefty;
const graphicWidth = graphicDimensions.upperRightx - graphicDimensions.upperLeftx;

// TODO: This is currently fixed and based on the provided assumptions
// May not need to change depending on how input is structured
const section_height = graphicWidth/(rate_years.length+1)


/*
** Graphical Formatting and Color Options
*/
// TODO: Number formatting should be dynamic
const numberFormat = d3.format(".3f")
const percentFormat = d3.format("+.1%")
//const yearColorScheme = d3.schemeAccent
const yearColorScheme = ["#4e79a7","#f28e2c","#e15759","#76b7b2","#59a14f","#edc949","#af7aa1","#ff9da7","#9c755f","#bab0ab"]

// fudge factor to keep graphics aligned
let epsilon = 0.01;
let counter = 0;




/*
** d3 Scales for graphics
*/

// Maps the points where each year start
const yearXScale = d3.scaleLinear()
    .domain([Math.min(...rate_years), Math.max(...rate_years)+2])
    .range([margin.left, section_height*(rate_years.length+1)+margin.left])

const yearColorScale = d3.scaleOrdinal()
    .domain(rate_years)
    .range(yearColorScheme)

// Maps the dates in the range of interest to the graphic X position
const timeRangeScale = d3.scaleLinear()
        .domain([start_date, end_date])
        //.domain([0, end_date.diff(start_date, 'days')])
        .range([margin.left, section_height*(rate_years.length)+margin.left])



// Main Rate Change dashboard d3 functions

// define the selection for the dashboard
const svg = d3.select('#first-dashboard')
            .attr("viewBox", viewboxDimString);

/*
** Render the Rate Change dashboard
** Requires: 
**    - the svg selection: svg above
**    - list of rate year objects: MyRy - will we need objects? or is a simple list ok
**    - the evaluation type: Policy Year or Calendar Year ("py"/"cy")
**    - the list of rate change objects: {date, value, law_change}
*/
const render = (selection, ry_objects, year_type, rate_changes) => {

    // Wrapper function for the whole graphic
    const graphicGroup = selection.append('g')
            .attr('class', 'graphic')
            // move the whole graphic
            .attr('transform', `translate(${(year_type == "cy") ? section_height/2 : 0},${0})`)

    // Group for rendering the boxes repenting years
    const rateYearGroup = graphicGroup.selectAll('.rygraphic')
            .data(ry_objects)

    const rateYearGroupEnter = rateYearGroup.enter().append('g')

    rateYearGroupEnter
            .append('polygon')
            .attr('class', 'rygraphic')
            .attr("points", d => 
            [getUpperLeftCorner(d.year, year_type),",", graphicDimensions.lowerLefty - section_height,
            getUpperLeftCorner(d.year + 1, year_type),",", graphicDimensions.lowerLefty - section_height,
            yearXScale(d.year+1), ",", graphicDimensions.lowerLefty,
            yearXScale(d.year), ",", graphicDimensions.lowerLefty,].join(" "))
            .attr('fill', d => yearColorScale(d.year));

    // If looking at Policy year, shift top coordinates by one year
    var text_x_adj = (year_type == "py")
            ? yearXScale(rate_years[1])
            : 0;
    
    rateYearGroupEnter
            .append('text')
                .text(d => d.year)
                .attr("x", d => (yearXScale(d.year) + yearXScale(d.year + 1))/2+text_x_adj)
                .attr("y", (graphicDimensions.lowerLefty-section_height)*.98)
                .attr("font-size", "0.15em")
                .attr("text-anchor", "middle")
                //.attr("fill", "red")


            
    /*
    ** functions for rendering shapes overtop 
    */
    var bottom_range = [timeRangeScale.range()[0], timeRangeScale.range()[1]]

    // if policy year, the top range will be shifted
    if (year_type == "cy"){
        var top_range = bottom_range;
    }
    else if (year_type == "py") {
        var top_range = [bottom_range[0], bottom_range[1] + graphicWidth/(rate_years.length+1)]
        var bottom_range = [bottom_range[0], bottom_range[1] + graphicWidth/(rate_years.length+1)]
    }

    // determines where on the graphic the rate changes start
    //const split_points = rate_changes.map((d) => ({value:timeRangeScaleTrunc(d.date), law_change: d.law_change}))
    
    // how long is a policy once scaled to yearTimeScale
    const scaled_length = getTimeX(start_date, false, policy_length_days)- margin.left

    // Return the rate changes as lines in form a + b + y = 0
    var lines_to_get = rate_changes
    //lines_to_get.push(py_borders[0])
    var lines_to_get = (year_type == "py")
                            ? [...rate_changes, ...py_borders]
                            : rate_changes


    const line_list = get_line_list(lines_to_get, scaled_length, section_height, start_date)
    
    // bounds of the graphic for constructing the DCEL
    var bounds = {xmin: bottom_range[0], xmax: top_range[1], ymin: 0, ymax:section_height}
    // Uses a DCEL to get a list of all faces (source in HTML)
    // Then iterates through the linked list to return as list of Vertex
    var overlay_faces = construct_faces(bounds, line_list)
    overlay_faces.map(d => d.fillCumuRate(rate_changes))

    const yt = 2015
    const year_path = [
    [yearXScale(yt),section_height],
    [yearXScale(yt+1),section_height],
    [getUpperLeftCorner(yt + 1, year_type),0],
    [getUpperLeftCorner(yt, year_type),0]
    ]
    //console.log(year_path)

    var my_sim = sim_rate_scan([yearXScale(yt), section_height, getUpperLeftCorner(yt + 1, year_type), 0], year_path, overlay_faces)

    console.log(my_sim)
    console.log(Math.round(my_sim*100000)/100000)

    var my_sim2 = sim_rate([yearXScale(yt), section_height, getUpperLeftCorner(yt + 1, year_type), 0], year_path, overlay_faces)

    console.log(my_sim2)
    console.log(Math.round(my_sim2*100000)/100000)

    /*
    ** Drawing the overlay on top
    */
    const overlay_group = graphicGroup.selectAll(".overlays")
        .data(overlay_faces)

    //console.log(overlay_faces)
    const overlay_enter = overlay_group.enter()
    //const get_overlay_stroke = (d) =>
    overlay_enter
            .append('polygon')
            .attr('class', 'overlays')
            .attr("fill", "red")
            //.attr('fill', d => get_overlay_fill(d))
            .attr("transform", `translate(0,${graphicDimensions.lowerLefty-section_height})`)
            //.attr("opacity", d => get_overlay_opacity(d))
            .attr("stroke", "black")
            .attr("opacity", "0")
            //.attr("stroke", d => get_overlay_stroke(d))
            .attr("stroke-width", "0.2")
            .attr("points", d => d.faceString()) 
            //.attr('points', d => d.map(q => [q.x,q.y].join(" ")))
            //.attr('points', [[0,10], [10,20], [30,40], [20,0], ""])
    
    //const path_example = [[0,10], [10,20], [30,40], [20,0]]
    //console.log(path_example.join(" "))



    /*const overlay_test = graphicGroup.selectAll(".testoverlay")
        .data([null])
        .enter()
            .append('polygon')
            .attr('class', 'testoverlay')
            .attr("transform", `translate(0,${graphicDimensions.lowerLefty-section_height})`)
            .attr("points", r)
            .attr("fill", "red")*/
    
    /*const my_intersections = graphicGroup.selectAll(".intersection")
        .data(s)
        .enter()
            .append("circle")
            .attr("r", 0.5)
            .attr("fill", "red")
            .attr("class", "intersection")
            .attr("transform", `translate(0,${graphicDimensions.lowerLefty-section_height})`)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)

    const my_rects = graphicGroup.selectAll('.rectoverlays')
        .data(my_shapes)
        .enter()
            .append("polygon")
            .attr("points", d => d.map(q => [q.x,q.y]))
            .attr("opacity", "0.4")
            .attr("stroke", "orange")
            .attr("transform", `translate(0,${graphicDimensions.lowerLefty-section_height})`)

    
    d3.selectAll(".overlays").data().forEach((d,i) => {
        //console.log(d3.polygonCentroid(d.area.overlay_path));
        //console.log(d);
    });*/
    
    d3.selectAll(".overlays").each((d,i) =>{
        //console.log(d.path);
        //console.log(d.path.map(q => [q.x,q.y]))
        //console.log(i,d.upper_left)
    })
    overlay_enter
            .append('text')
                .attr("x", d => d3.polygonCentroid(d.faceString())[0])
                .attr("y", d => d3.polygonCentroid(d.faceString())[1] + graphicDimensions.lowerLefty - section_height)
                .text((d,i) => numberFormat(d.cumu_rate))
                //.text((d,i) => i)
                .attr("font-size", "0.1em")
                .attr("dy", "0.32em")
                .attr("text-anchor", "middle")
                .attr("fill","green")
                .attr("stroke", "black")
                .attr("stroke-width", "0.05")

        /*
        ** Lines that represent rate and law changes
        */

    const rlGroup = graphicGroup.selectAll('.rateLine')
    .data(rate_changes)

    const rlEnter = rlGroup.enter()

    rlEnter
        .append('line')
        .attr('class', 'rateLine')
        .style("stroke-dasharray", ("1,1"))
        .attr("stroke", "black")
        .attr("stroke-width", 0.5)
        .attr("stroke-linecap", "round")
        .attr("opacity", "1")
        .attr("y1", graphicDimensions.lowerLefty - section_height)
        .attr("y2", graphicDimensions.lowerLefty)
        .attr("x1", d => getTimeX(d.effective_date, d.law_change, policy_length_days))
        .attr("x2", d => timeRangeScaleTrunc(d.effective_date))

    const rlText = graphicGroup.selectAll('.rltext')
        .data(rate_changes)

    const rlTextEnter = rlText.enter().append("g")
        .attr("class", ".rltext")
        .attr("transform", (d,i) => `translate(${timeRangeScaleTrunc(d.effective_date)},${graphicDimensions.lowerLefty + 1.5 + (i%2)*4})`)
        //.attr("transform", (d,i) => {return `translate(0,${(i % 2)?4:0})`})
        //.attr('font-size', "0.1em")
        .attr('text-anchor', 'middle')
        //.attr("y", 10)
        /*.append('g')
            .attr('class', 'rltext')
            .attr("transform", (d,i) => {return `translate(0,${(i % 2)?4:0})`})
            .attr('x', d => timeRangeScaleTrunc(d.effective_date))
            .attr('y', graphicDimensions.lowerLefty + 1.5)
            .attr('font-size', "0.1em")
            .attr('text-anchor', 'middle')*/
        

    rlTextEnter
        .append('text')
            .text(d => percentFormat(d.value))
            .attr("font-size", "0.1em")
    rlTextEnter
        .append('text')
            .text(d => d.effective_date.format("DD/MM/YY"))
            .attr("font-size", "0.08em")
            .attr("dy", "1em")
};




render(svg, myRYs, year_type, other_rate_changes);

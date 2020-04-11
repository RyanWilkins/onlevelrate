// main script for actuarial dashboard 

const viewboxDim = {minx:"0", miny:"0", width:"100", height:"50"};
const viewboxDimString = viewboxDim.minx.concat(" ", viewboxDim.miny, " ",
                                viewboxDim.width, " ", viewboxDim.height);

let rate_years = [2011, 2012, 2013, 2014,2015,2016]
let year_type = ["cy", "py"]

const start_date = moment("2011-01-01", "YYYY-MM-DD")
const end_date = moment("2017-01-01", "YYYY-MM-DD")

const increase_one = moment("2012-4-01", "YYYY-MM-DD")
const increase_two = moment("2013-10-01", "YYYY-MM-DD")
const law_change_date = moment("2012-9-01", "YYYY-MM-DD")
const law_change_date_two = moment("2011-7-01", "YYYY-MM-DD")
const policy_length_days = 365

var rate_changes = 
                [
                    { date: increase_one, value: 0.05, law_change: false},
                    { date: increase_two, value: 0.10, law_change: false},
                    { date: law_change_date, value: -0.05, law_change: true},
                    { date: law_change_date_two, value: 0.10, law_change: true}
                ]


const svg = d3.select('#first-dashboard')
            .attr("viewBox", viewboxDimString);

const height = viewboxDim.height;
const width = viewboxDim.width;

const margin = {top:35.714, bottom: 0.25, right: 0.25, left: 0.25};
const graphicDimensions = {upperLeftx: margin.left, upperLefty: margin.top,
                upperRightx: width - margin.right, upperRighty: margin.top,
                lowerLeftx: margin.left, lowerLefty: height - margin.bottom};
const graphicHeight = graphicDimensions.lowerLefty - graphicDimensions.upperLefty;
const graphicWidth = graphicDimensions.upperRightx - graphicDimensions.upperLeftx;

const numberFormat = d3.format(",.4r")

const render = (selection, ry_objects, year_type, rate_changes) => {
    /*const groups = selection.selectAll('g')
        .data(props, d => d.id)*/

    const rateYearGroup = selection.selectAll('.rygraphic')
            .data(ry_objects)

    const rateYearGroupEnter = rateYearGroup.enter().append('g')


    rateYearGroupEnter
            .append('polygon')
            .attr('class', 'rygraphic')
            .attr("points", d => 
            [getUpperLeftCorner(d.year, year_type),",", graphicDimensions.upperLefty,
            getUpperLeftCorner(d.year + 1, year_type),",", graphicDimensions.upperRighty,
            yearXScale(d.year+1), ",", graphicDimensions.lowerLefty,
            yearXScale(d.year), ",", graphicDimensions.lowerLefty,].join(" "))
            .attr('fill', d => yearColorScale(d.year));

    text_x_adj = (year_type == "py")
            ? yearXScale(rate_years[1])
            : 0;
    
    rateYearGroupEnter
            .append('text')
                .text(d => d.year)
                .attr("x", d => (yearXScale(d.year) + yearXScale(d.year + 1))/2+text_x_adj)
                .attr("y", graphicDimensions.upperLefty*.98)
                .attr("font-size", "0.15em")
                .attr("text-anchor", "middle")

    const rateChangeLines = selection.selectAll('.rateLine')
        .data(rate_changes)
        .enter()
            .append('line')
            .attr('class', 'rateLine')
            .style("stroke-dasharray", ("1,1"))
            .attr("stroke", "black")
            .attr("stroke-width", 0.5)
            .attr("stroke-linecap", "round")
            .attr("y1", graphicDimensions.upperLefty)
            .attr("y2", graphicDimensions.lowerLefty)
            .attr("x1", d => getTimeX(d.date, d.law_change, policy_length_days))
            .attr("x2", d => timeRangeScale(d.date - start_date))
            
            //.attr(console.log(d => getTimeX(d.date, d.law_change, policy_length_days)))

    // functions for rendering shapes overtop 

    bottom_range = timeRangeScale.range()
    console.log(year_type)
    if (year_type == "cy"){
        top_range = bottom_range;
    }
    else if (year_type == "py") {
        //top_range = bottom_range.map( function(value) { return value + graphicWidth/(rate_years.length+1);})
        top_range = [bottom_range[0], bottom_range[1] + graphicWidth/(rate_years.length+1)]
        bottom_range = [bottom_range[0], bottom_range[1] + graphicWidth/(rate_years.length+1)]
        //console.log(top_range)
    }
    //console.log(top_range)
    //x_range[1] = x_range[1] - timeRangeScale(timeRangeScale.domain()[1])
    //console.log(timeRangeScale.domain()[1])
    //console.log(x_range) 
    const split_points = rate_changes.map((d) => ({value:timeRangeScale(d.date - start_date), law_change: d.law_change}))
    const scaled_length = getTimeX(start_date, false, policy_length_days)
    const shapeHeight = graphicDimensions.lowerLefty - graphicDimensions.upperLefty

    const overlayObjects = get_diagonal_splits(bottom_range, top_range, split_points, shapeHeight, scaled_length,year_type)
    
    //console.log(overlayObjects)

    const get_overlay_fill = (d) =>{
        if (typeof d.shape_color != "undefined"){
            return d.shape_color;
        }
        return "grey"
    }

    const get_overlay_opacity = (d) =>{
        if (typeof d.shape_color != "undefined"){
            return 1;
        }
        return 0.4
    }

    const get_overlay_stroke = (d) => {
        if(typeof d.shape_color != "undefined"){
            return d.shape_color
        }
        return "grey"
    }

    const overlay_group = selection.selectAll(".overlays")
        .data(overlayObjects)

    const overlay_enter = overlay_group.enter()
    //const get_overlay_stroke = (d) =>
    overlay_enter
            .append('polygon')
            .attr('class', 'overlays')
            .attr('fill', d => get_overlay_fill(d))
            .attr("transform", `translate(0,${graphicDimensions.upperLefty})`)
            .attr("opacity", d => get_overlay_opacity(d))
            .attr("stroke", d => get_overlay_stroke(d))
            .attr("stroke-width", "0.4")
            .attr('points', d => 
                [d.area.pOne, d.area.pTwo, d.area.pThree,
                     d.area.pFour, d.area.pFive, d.area.pSix].join(" "))
    
    const path_example = [[0,10], [10,20], [30,40], [20,0]]
    console.log(path_example.join(" "))
    
    d3.selectAll(".overlays").data().forEach((d,i) => {
        console.log(d3.polygonCentroid(path_example))
    });
    
    overlay_enter
            .append('text')
                .attr("x", (d,i) => i*10)
                .attr("y", 40)
                //.text(d => )
                .text(d => d.rate_factor)
};


const makeDev = (ay, period, amount) =>({ 
    ay,
    period,
    amount
});

const makeRY = (year) => ({
    year
})

const myRYs = rate_years.map(d => makeRY(d));



const yearXScale = d3.scaleLinear()
    .domain([Math.min(...rate_years), Math.max(...rate_years)+2])
    .range([0,graphicWidth]);

    
const yearColorScale = d3.scaleOrdinal()
    .domain(rate_years)
    .range(d3.schemeAccent)


const getUpperLeftCorner  = (year, year_type) => {
    if(year_type == "cy"){
        return yearXScale(year);
    }
    return yearXScale(year + 1);
}

const timeRangeScale = d3.scaleLinear()
        .domain([0, end_date-start_date])
        .range([0, graphicWidth-graphicWidth/(rate_years.length+1)])

const getTimeX = (date, law_change, policy_length) => {
    if (law_change) {
        return timeRangeScale(date - start_date);
    }
    temp_date = date.clone()
    temp_date.add(policy_length, 'day')
    return timeRangeScale(temp_date-start_date)
}

//console.log(getTimeX(increase_one, false, 365))
//console.log(getTimeX(increase_two, false, 365))




//console.log((end_date - start_date))

// functions to find the shapes of sections in the rate change chart

chart_range = [0,6]
diagonals = [1.8, 3.2]
verticals = [3.5]

// 1. Find the number of shapes
// .... a) Find the number of diagonal splits (n shapes = splits + 1)
// 2. Determine if any of the verticals cross diagonals
// .... a) if so, how many?
// .... b) how many additional shapes does that create
// .... c) where is the cross point

// create an object for the shape. 3 points if triangle, 4 if parallelogram
const makeArea = (pOne, pTwo, pThree, pFour, pFive, pSix, shape_color) => ({
    pOne,
    pTwo,
    pThree,
    pFour,
    pFive,
    pSix,
    overlay_path = 
});

// first argument of shape is the Area object
const makeShape = (area, shape_color, rate_factor = 1.00) => (
    {
        area,
        shape_color,
        rate_factor
    }
)

const get_diagonal_splits = (bottom_range, top_range, split_points, height, effective_length,year_type_arg) => {
    // TODO: relax these assumptions
    // assume split points need to be in order
    // assume all effective dates in range

    const get_top_point = (point_obj) => {
        if (point_obj.law_change){
            return {value:point_obj.value, law_change: point_obj.law_change}
        }
        else return {value:point_obj.value + effective_length, law_change: point_obj.law_change}
    }
    bottom_points = [{value:bottom_range[0], law_change: true}]
    bottom_points = bottom_points.concat(split_points);
    bottom_points.push({value:bottom_range[1], law_change:true})
    bottom_points.sort(function(a,b) {return a.value - b.value});
    //console.log(bottom_points)
    top_points = [{value:top_range[0], law_change:true}]
    top_points = top_points.concat(split_points.map(d => get_top_point(d)));
    top_points.sort(function(a,b) { return a.value - b.value});
    top_points.push({value:top_range[1], law_change:true})
    //console.log(top_points)

    final_list = []
    last_y = height

    // if policy year then initial shape could be triangle/polygons
    /*while (top_points[0].value < top_range[0]){
        console.log("faekjfnaw")
        base_0 = bottom_points[0].value
        base_1 = bottom_points[1].value
        height_0 = height - (base_1 - bottom_range[0])
        initial_shape = makeArea(`${base_0},${height}`,  `${base_1},${height}`, `${base_1},${height_0}`, `${base_0},${last_y}`)
        final_list.push(initial_shape)
        top_points.shift()
        bottom_points.shift()
        last_y = height_0
    }*/

    //console.log(top_points[0].value, top_range[0])

    // the next "strip" will be from the next bottom point to top point


    for (i = 0; i < top_points.length-1; i++) {
        
        current_x_1 = top_points[i].value
        current_x_2 = bottom_points[i].value

        next_x_1 = top_points[i+1].value
        next_x_2 = bottom_points[i+1].value

        //console.log(bottom_points)

         a = top_points[i].law_change 
         b = bottom_points[i].law_change
         c = top_points[i+1].law_change
         d = bottom_points[i+1].law_change


        //console.log(i,a,b,c,d)

        if(a&&b&&c&&d || !a&&!b&&!c&&!d){
            //console.log("shape1")
            next_shape = makeArea(`${current_x_1},${0}`,  `${next_x_1},${0}`, `${next_x_2},${height}`, `${current_x_2},${height}`);
            next_shape = makeArea([current_x_1,0],  [next_x_1,0], [next_x_2,height], [current_x_2,height]);
            next_shape = makeShape(next_shape)
        }
        else if(a && b && !c && !d){
            next_shape = makeArea(`${current_x_1},${0}`,  `${next_x_1},${0}`, `${next_x_2},${height}`, `${current_x_2},${height}`)
            next_shape = makeShape(next_shape)
       }
        else if(!a&&!b&&c&&!d){
            //console.log("shape3")
            intermediate_x = next_x_1; 
            intermediate_y = height - (next_x_1 - next_x_2);
            next_shape = makeArea(`${current_x_1},${0}`,  `${next_x_1},${0}`, `${intermediate_x},${intermediate_y}`, `${next_x_2},${height}`, `${current_x_2},${height}`);
            next_shape = makeShape(next_shape)
            //console.log("blah")
            //console.log(next_shape)
        }
        else if(!a&&b&&c&&d){
            //console.log("shape4")
            intermediate_x = current_x_2;
            intermediate_y = current_x_1 - current_x_2
            next_shape = makeArea(`${current_x_1},${0}`,  `${next_x_1},${0}`,  `${next_x_2},${height}`, `${current_x_2},${height}`,`${intermediate_x},${intermediate_y}`);  
            next_shape = makeShape(next_shape)
        }
        else if(a&&!b&&!c&&d){
            //console.log("shape5")
            // two shapes to make?
            triangle_one_x = next_x_2;
            triangle_one_y = height - (triangle_one_x - current_x_2)
            next_shape = makeArea(`${current_x_2},${height}`,  `${triangle_one_x},${height}`,  `${triangle_one_x},${triangle_one_y}`); 
            next_shape = makeShape(next_shape)
            final_list.push(next_shape)
            //console.log(next_shape)
            triangle_two_x = next_x_1;
            triangle_two_y = height - (triangle_one_x - current_x_2)
            next_shape = makeArea(`${current_x_1},${0}`,  `${triangle_two_x},${0}`,  `${current_x_1},${triangle_two_y}`); 
            next_shape = makeShape(next_shape)
         } 
         else if(a&&!b&&c&&d){
             // two shapes
            //console.log("shape7")
            intermediate_y_one = height - (next_x_2 - current_x_2)
            intermediate_y_two = top_points[i+2].value - next_x_1
            // bottom triangle
            next_shape = makeArea(`${current_x_2},${height}`, `${next_x_2},${height}`, `${next_x_2},${intermediate_y_one}`)
            next_shape = makeShape(next_shape)
            final_list.push(next_shape)
            // top polygon
            next_shape = makeArea(`${current_x_1},${0}`, `${next_x_2},${intermediate_y_one}`, `${next_x_1},${intermediate_y_two}`, `${next_x_1},${0}`)
            next_shape = makeShape(next_shape)
        }
        else if(a&&b&&!c&&d){
            // two shapes
           //console.log("shape8")
           intermediate_y_one = height - (current_x_2 - bottom_points[i-1].value)
           intermediate_y_two = next_x_1 - current_x_1

           // top triangle
           next_shape = makeArea(`${current_x_1},${0}`, `${next_x_1},${0}`, `${current_x_1},${intermediate_y_two}`)
           next_shape = makeShape(next_shape)
           final_list.push(next_shape)
           // bottom polygon
           next_shape = makeArea(`${current_x_2},${height}`, `${next_x_2},${height}`, `${current_x_1},${intermediate_y_two}`, `${current_x_2},${intermediate_y_one}`)
           next_shape = makeShape(next_shape)
           //console.log(next_shape)
       }
       else if(a&&b&&c&&!d){
        //console.log("shape9");
        intermediate_x = next_x_1;
        intermediate_y = height - (bottom_points[i+2].value - next_x_2);
        next_shape = makeArea(`${current_x_2},${height}`,  `${next_x_2},${height}`,  `${next_x_1},${intermediate_y}`, `${next_x_1},${0}`,`${current_x_1},${0}`);  
        next_shape = makeShape(next_shape)
    }
       else if(!a&&b&&c&&!d){
        intermediate_y_one = (current_x_1 - top_points[i-1].value)
        intermediate_y_two = height - (bottom_points[i+2].value - next_x_2)
        next_shape = makeArea(`${current_x_2},${height}`,  `${next_x_2},${height}`,  `${next_x_1},${intermediate_y_two}`, `${next_x_1},${0}`,`${current_x_1},${0}`,`${current_x_2},${intermediate_y_one}`);  
        next_shape = makeShape(next_shape)
    }
       else if(!a&&b&&!c&&!d){
        intermediate_y_one = (current_x_1 - top_points[i-1].value)
        next_shape = makeArea(`${current_x_2},${height}`,  `${next_x_2},${height}`, `${next_x_1},${0}`,`${current_x_1},${0}`,`${current_x_2},${intermediate_y_one}`);  
        next_shape = makeShape(next_shape)
    }
        else {
            //console.log("shape6")
            next_shape = makeArea(`${current_x_1},${0}`,  `${next_x_1},${0}`, `${next_x_2},${height}`, `${current_x_2},${height}`)
            next_shape = makeShape(next_shape)
        }
        final_list.push(next_shape)
    }

    if(year_type_arg == "py"){
        base_0 = bottom_range[0]
        base_1 = bottom_range[0] + effective_length
        height_0 = base_1 - base_0
        console.log("hello")
        end_shape = makeArea(`${base_0},${-height_0*.025}`, `${base_1*1.025},${-height_0*.025}`,`${base_0},${height_0}`)
        end_shape = makeShape(end_shape, "#EEE")
        final_list.push(end_shape)

        base_0 = bottom_range[1]
        base_1 = bottom_range[1] - effective_length
        height_0 = base_0 - base_1
        console.log("hello")
        end_shape = makeArea(`${base_0},${height_0}`, `${base_1},${height_0}`,`${base_0},${0}`)
        end_shape = makeShape(end_shape, "#EEE")
        final_list.push(end_shape)
    }
    console.log(final_list)
    return final_list
    } 
 
const check_areas = () => {
    x = d3.selectAll(".overlays").node()
    console.log(x)
}



render(svg, myRYs, "py", rate_changes);

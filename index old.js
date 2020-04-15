// main script for actuarial dashboard 

const viewboxDim = {minx:"0", miny:"0", width:"100", height:"50"};
const viewboxDimString = viewboxDim.minx.concat(" ", viewboxDim.miny, " ",
                                viewboxDim.width, " ", viewboxDim.height);

let rate_years = [2011, 2012,2013]
let year_type = ["cy", "py"]

const start_date = moment([rate_years[0], "-01-01"].join(), "YYYY-MM-DD")
const end_date = moment([rate_years[rate_years.length-1]+1,"-01-01"].join(), "YYYY-MM-DD")
//console.log(end_date)
//console.log(start_date)

const increase_one = moment("2011-5-01", "YYYY-MM-DD")
const increase_two = moment("2011-8-01", "YYYY-MM-DD")
const increase_three = moment("2012-12-01", "YYYY-MM-DD")
const law_change_date = moment("2011-11-01", "YYYY-MM-DD")
const law_change_date_two = moment("2012-1-01", "YYYY-MM-DD")
const policy_length_days = 365

// epsilon for floating point error toleration
let epsilon = 0.00000001;

var rate_changes = 
                [
                    { date: increase_one, value: 0.05, law_change: false},
                    { date: increase_two, value: 0.10, law_change: false},
                    { date: increase_three, value: 0.07, law_change: false},
                    { date: law_change_date, value: -0.05, law_change: true},
                    { date: law_change_date_two, value: 0.10, law_change: true}
                ]


const svg = d3.select('#first-dashboard')
            .attr("viewBox", viewboxDimString);

const height = +viewboxDim.height;
const width = +viewboxDim.width;

const margin = {top:20, bottom: 5, right: 2, left: 2};
const graphicDimensions = {upperLeftx: margin.left, upperLefty: margin.top,
                upperRightx: width - margin.right, upperRighty: margin.top,
                lowerLeftx: margin.left, lowerLefty: height - margin.bottom};
const graphicHeight = graphicDimensions.lowerLefty - graphicDimensions.upperLefty;
const graphicWidth = graphicDimensions.upperRightx - graphicDimensions.upperLeftx;

const section_height = graphicWidth/(rate_years.length+1)

//console.log(section_height)

const numberFormat = d3.format(",.4r")

const render = (selection, ry_objects, year_type, rate_changes) => {
    /*const groups = selection.selectAll('g')
        .data(props, d => d.id)*/

    const graphicGroup = selection.append('g')
            .attr('class', 'graphic')
            // move the whole graphic
            .attr('transform', `translate(${0},${0})`)

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

    text_x_adj = (year_type == "py")
            ? yearXScale(rate_years[1])
            : 0;
    
    rateYearGroupEnter
            .append('text')
                .text(d => d.year)
                .attr("x", d => (yearXScale(d.year) + yearXScale(d.year + 1))/2+text_x_adj)
                .attr("y", (graphicDimensions.lowerLefty-section_height)*.98)
                .attr("font-size", "0.15em")
                .attr("text-anchor", "middle")

    const rateChangeLines = graphicGroup.selectAll('.rateLine')
        .data(rate_changes)
        .enter()
            .append('line')
            .attr('class', 'rateLine')
            .style("stroke-dasharray", ("1,1"))
            .attr("stroke", "black")
            .attr("stroke-width", 0.5)
            .attr("stroke-linecap", "round")
            .attr("y1", graphicDimensions.lowerLefty - section_height)
            .attr("y2", graphicDimensions.lowerLefty)
            .attr("x1", d => getTimeX(d.date, d.law_change, policy_length_days))
            .attr("x2", d => timeRangeScale(d.date - start_date))
            
            //.attr(console.log(d => getTimeX(d.date, d.law_change, policy_length_days)))

    // functions for rendering shapes overtop 

    bottom_range = [timeRangeScale.range()[0], timeRangeScale.range()[1]]
    //console.log(year_type)
    if (year_type == "cy"){
        top_range = bottom_range;
    }
    else if (year_type == "py") {
        //top_range = bottom_range.map( function(value) { return value + graphicWidth/(rate_years.length+1);})
        top_range = [bottom_range[0], bottom_range[1] + graphicWidth/(rate_years.length+1)]
        bottom_range = [bottom_range[0], bottom_range[1] + graphicWidth/(rate_years.length+1)]
        //console.log(top_range)
    }

    // testing the DCEL function
    // --------------------------------
    var bounds = {xmin: bottom_range[0], xmax: bottom_range[1], ymin: 0, ymax:height}
    construct_faces(bounds, null)




    // --------------------------------


    //console.log(top_range)
    //x_range[1] = x_range[1] - timeRangeScale(timeRangeScale.domain()[1])
    //console.log(timeRangeScale.domain()[1])
    //console.log(x_range) 
    const split_points = rate_changes.map((d) => ({value:timeRangeScale(d.date - start_date), law_change: d.law_change}))
    const scaled_length = getTimeX(start_date, false, policy_length_days)- margin.left

    const overlayObjects = get_diagonal_splits(bottom_range, top_range, split_points, section_height, scaled_length,year_type)
    
    const y = parse_isect_objects(rate_changes, scaled_length, section_height, start_date, bottom_range, top_range)
    const z = get_rc_intersections(rate_changes, scaled_length, section_height, start_date, bottom_range, top_range)

    //console.log(rate_changes)
    //console.log(y)
    //console.log(z)

    const q = z.map(d => { return {x:d.point.x, y:d.point.y};}) 
    //console.log(q)
    const s = sort_points_clockwise(q)
    //console.log(s)
    const r = s.map(d => [d.x, d.y]).join(" ")
    //console.log(r)
    //console.log(overlayObjects)

    const p = get_rectangles(rate_changes, bottom_range, section_height, start_date)
    //console.log(p)

    my_shapes = get_shapes(p, q, section_height)
    //console.log(my_shapes)

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
        return 0
    }

    const get_overlay_stroke = (d) => {
        if(typeof d.shape_color != "undefined"){
            return d.shape_color
        }
        return "grey"
    }

    const overlay_group = graphicGroup.selectAll(".overlays")
        .data(overlayObjects)

    const overlay_enter = overlay_group.enter()
    //const get_overlay_stroke = (d) =>
    overlay_enter
            .append('polygon')
            .attr('class', 'overlays')
            .attr('fill', d => get_overlay_fill(d))
            .attr("transform", `translate(0,${graphicDimensions.lowerLefty-section_height})`)
            .attr("opacity", d => get_overlay_opacity(d))
            .attr("stroke", d => get_overlay_stroke(d))
            .attr("stroke-width", "0.4")
            .attr('points', d => d.area.overlay_path.join(" "))
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
    
    const my_intersections = graphicGroup.selectAll(".intersection")
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
    });
    
    overlay_enter
            .append('text')
                .attr("x", (d,i) => d3.polygonCentroid(d.area.overlay_path)[0])
                .attr("y", (d,i) => graphicDimensions.lowerLefty-section_height + d3.polygonCentroid(d.area.overlay_path)[1])
                //.text(d => )
                .text(d => d.rate_factor)
                .attr("font-size", "0.2em")
                .attr("dy", "0.32em")
                .attr("text-anchor", "middle")
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
    //.range([graphicDimensions.lowerLeftx,section_height*(rate_years.length+1)-margin.right]);
    .range([margin.left, section_height*(rate_years.length+1)+margin.left])
    
const yearColorScale = d3.scaleOrdinal()
    .domain(rate_years)
    .range(d3.schemeAccent)


const getUpperLeftCorner  = (year, year_type) => {
    if(year_type == "cy"){
        return yearXScale(year);
    }
    return yearXScale(year + 1);
}
//console.log(end_date-start_date)
//console.log()

const timeRangeScale = d3.scaleLinear()
        .domain([0, end_date-start_date])
        .range([margin.left, section_height*(rate_years.length)+margin.left])

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
    overlay_path: [pOne, pTwo, pThree, pFour, pFive, pSix].filter(d => d !== undefined)
});

// first argument of shape is the Area object
const makeShape = (area, shape_color, rate_factor = 1.00) => (
    {
        area,
        shape_color,
        rate_factor
    }
)

const find_next_vertical = (rcs, i, vertical) => {
    if(i > rcs.length-1){
        return null; 
    }
    else if(rcs[i].law_change && vertical){
        return rcs[i].value;
    }
    else if(!rcs[i].law_change && !vertical){
        return rcs[i].value;
    }
    return find_next_vertical(rcs, i+1, vertical);
}

const find_last_vertical = (rcs, i, vertical) => {
    if(i < 0){
        return null;
    }
    else if (rcs[i].law_change && vertical){
        return rcs[i].value;
    }
    else if (!rcs[i].law_change && !vertical){
        return rcs[i].value;
    }
    return find_last_vertical(rcs, i-1, vertical);
}

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
    top_points.push({value:top_range[1], law_change:true})
    top_points.sort(function(a,b) { return a.value - b.value});
    /*console.log(split_points)
    console.log(top_range)
    console.log(bottom_range)
    console.log(top_points)
    console.log(bottom_points)
    console.log(effective_length)*/

    final_list = []
    last_y = height

    // if policy year then initial shape could be triangle/polygons
    /*while (top_points[0].value < top_range[0]){
        console.log("faekjfnaw")
        base_0 = bottom_points[0].value
        base_1 = bottom_points[1].value
        height_0 = height - (base_1 - bottom_range[0])
        initial_shape = makeArea([base_0,height],  [base_1,height], [base_1,height_0], [base_0,last_y])
        final_list.push(initial_shape)
        top_points.shift()
        bottom_points.shift()
        last_y = height_0
    }*/

    //console.log(top_points[0].value, top_range[0])

    // the next "strip" will be from the next bottom point to top point

    angle_end_dates = []

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

        // for the special case where two vertical lines cross two angled lines
        // need to keep track of when first angled line ends

        if (!b){
            angle_end_dates.push(bottom_points[i].value + effective_length)
        }

        angle_end_dates = angle_end_dates.filter(d => d > current_x_1 )
        //console.log(angle_end_dates.length)

        double_cross = (angle_end_dates.length > 1)

        //blah
        //console.log(i,a,b,c,d)
        //console.log(angle_end_dates)
        //console.log(i, current_x_1, current_x_2, next_x_1, next_x_2)

// T T T T & F F F F 
        if((a&&b&&c&&d || !a&&!b&&!c&&!d) && !double_cross){
            //console.log("shape1")
            //next_shape = makeArea([current_x_1,0],  [next_x_1,0], [next_x_2,height], [current_x_2,height]);
            next_shape = makeArea([current_x_1,0],  [next_x_1,0], [next_x_2,height], [current_x_2,height]);
            next_shape = makeShape(next_shape)
        }
// T T F F
        else if(a && b && !c && !d){
            //console.log("checking")
            next_shape = makeArea([current_x_1,0],  [next_x_1,0], [next_x_2,height], [current_x_2,height])
            next_shape = makeShape(next_shape)
       }
       //else if(a && !b && c && !d){
        //    intermediate_y_one = 
         //   next_shape = makeArea([current_x_1,height],  [next_x_1,0], [next_x_2,height], [current_x_2,height])
         //   next_shape = makeShape(next_shape)
   //}
// F F T F
        else if(!a&&!b&&c&&!d){
            //console.log("shape3")
            intermediate_x = next_x_1; 
            intermediate_y = height - (next_x_1 - next_x_2);
            next_shape = makeArea([current_x_1,0],  [next_x_1,0], [intermediate_x,intermediate_y], [next_x_2,height], [current_x_2,height]);
            next_shape = makeShape(next_shape)
            //console.log("blah")
            //console.log(next_shape)
        }
// F T T T
        else if(!a&&b&&c&&d){
            //console.log("shape4")
            intermediate_x = current_x_2;
            intermediate_y = current_x_1 - current_x_2
            next_shape = makeArea([current_x_1,0],  [next_x_1,0],  [next_x_2,height], [current_x_2,height],[intermediate_x,intermediate_y]);  
            next_shape = makeShape(next_shape)
        }
// T F F T
        else if(a&&!b&&!c&&d){
            //console.log("shape5")
            // two shapes to make?
            intermediate_y_one = height - (next_x_2 - current_x_2)
            intermediate_y_two = next_x_1 - current_x_1
            next_shape = makeArea([current_x_2,height],  [next_x_2,height],  [next_x_2,intermediate_y_one]); 
            next_shape = makeShape(next_shape)
            final_list.push(next_shape)
            //console.log(next_shape)
            next_shape = makeArea([current_x_1,0],  [next_x_1,0],  [current_x_1,intermediate_y_two]); 
            next_shape = makeShape(next_shape)
         }
// T F T F
         else if(a&&!b&&c&&!d){
            //console.log("shape12")
            // two shapes to make? 
            next_bottom_vertical = find_next_vertical(bottom_points, i+1, true)
            //console.log(bottom_points)
            next_top_angle = find_next_vertical(top_points, i+1, false)
            //console.log(top_points)
            //console.log(next_top_angle, next_x_1)
            intermediate_y_one = height - (next_bottom_vertical - next_x_2)
            intermediate_y_two = next_top_angle - current_x_1
            intermediate_y_three = next_top_angle - next_x_1
            next_shape = makeArea([current_x_2,height],  [next_x_2, height],  [current_x_1, intermediate_y_one], [current_x_1,intermediate_y_two]); 
            next_shape = makeShape(next_shape)
            final_list.push(next_shape)

            next_shape = makeArea([current_x_1,0],  [next_x_1,0],  [next_x_1, intermediate_y_three], [current_x_1, intermediate_y_two]); 
            next_shape = makeShape(next_shape)
         } 
// F T F T
         else if(!a&&b&&!c&&d){
            //console.log("shape15")
            // two shapes to make? 
            last_bottom_angle = find_last_vertical(bottom_points, i-1, false)
            //console.log(bottom_points)
            last_top_vertical = find_last_vertical(top_points, i-1, true)
            //console.log(top_points)
            //console.log(next_top_angle, next_x_1)
            intermediate_y_one = height - (current_x_2 - last_bottom_angle)
            intermediate_y_two =  next_x_1 - last_top_vertical
            intermediate_y_three = current_x_1 - last_top_vertical
            next_shape = makeArea([current_x_2,height],  [next_x_2, height],  [next_x_2, intermediate_y_two], [current_x_2,intermediate_y_one]); 
            next_shape = makeShape(next_shape)
            final_list.push(next_shape)

            next_shape = makeArea([current_x_1,0],  [next_x_1,0],  [next_x_2, intermediate_y_two], [next_x_2, intermediate_y_three]); 
            next_shape = makeShape(next_shape)
         }  
// T F T T
         else if(a&&!b&&c&&d){
             // two shapes
            //console.log("shape7")
            intermediate_y_one = height - (next_x_2 - current_x_2)
            intermediate_y_two = top_points[i+2].value - next_x_1
            // bottom triangle
            next_shape = makeArea([current_x_2,height], [next_x_2,height], [next_x_2,intermediate_y_one])
            next_shape = makeShape(next_shape)
            final_list.push(next_shape)
            // top polygon
            next_shape = makeArea([current_x_1,0], [next_x_2,intermediate_y_one], [next_x_1,intermediate_y_two], [next_x_1,0])
            next_shape = makeShape(next_shape)
        }
// T T F T
        else if(a&&b&&!c&&d){
            // two shapes
           //console.log("shape8")
           intermediate_y_one = height - (current_x_2 - bottom_points[i-1].value)
           intermediate_y_two = next_x_1 - current_x_1

           // top triangle
           next_shape = makeArea([current_x_1,0], [next_x_1,0], [current_x_1,intermediate_y_two])
           next_shape = makeShape(next_shape)
           final_list.push(next_shape)
           // bottom polygon
           next_shape = makeArea([current_x_2,height], [next_x_2,height], [current_x_1,intermediate_y_two], [current_x_2,intermediate_y_one])
           next_shape = makeShape(next_shape)
           //console.log(next_shape)
       }
// T F F F
       else if(a&&!b&&!c&&!d){
        // two shapes
       intermediate_y_one = height - (bottom_points[i+2].value-next_x_2)
       intermediate_y_two = next_x_1 - current_x_1

       // top triangle
       next_shape = makeArea([current_x_1,0], [next_x_1,0], [current_x_1,intermediate_y_two])
       next_shape = makeShape(next_shape)
       final_list.push(next_shape)
       // bottom polygon
       next_shape = makeArea([current_x_2,height], [next_x_2,height], [current_x_1,intermediate_y_one], [current_x_1,intermediate_y_two])
       next_shape = makeShape(next_shape)
       //console.log(next_shape)
   }
// F F F T
   else if(!a&&!b&&!c&&d){
    // two shapes
   intermediate_y_one = height - (next_x_2 - current_x_2)
   intermediate_y_two = current_x_1 - top_points[i-1].value

   // bottom triangle
   next_shape = makeArea([current_x_2,height], [next_x_2,height], [next_x_2,intermediate_y_one])
   next_shape = makeShape(next_shape)
   final_list.push(next_shape)
   // top polygon
   next_shape = makeArea([current_x_1,0], [next_x_1,0], [next_x_2,intermediate_y_one], [next_x_2,intermediate_y_two])
   next_shape = makeShape(next_shape)
   //console.log(next_shape)
}
// T T T F
       else if(a&&b&&c&&!d){
        //console.log("shape9");
        next_top_angle = find_next_vertical(top_points, i+1, false)
        intermediate_y = next_top_angle - next_x_1;
        next_shape = makeArea([current_x_2,height],  [next_x_2,height],  [next_x_1,intermediate_y], [next_x_1,0],[current_x_1,0]);  
        next_shape = makeShape(next_shape)
    }
// F T T F
       else if(!a&&b&&c&&!d){
        intermediate_y_one = (current_x_1 - top_points[i-1].value)
        intermediate_y_two = height - (bottom_points[i+2].value - next_x_2)
        next_shape = makeArea([current_x_2,height],  [next_x_2,height],  [next_x_1,intermediate_y_two], [next_x_1,0],[current_x_1,0],[current_x_2,intermediate_y_one]);  
        next_shape = makeShape(next_shape)
    }
// F T T T
       else if(!a&&b&&!c&&!d){
        intermediate_y_one = (current_x_1 - top_points[i-1].value)
        next_shape = makeArea([current_x_2,height],  [next_x_2,height], [next_x_1,0],[current_x_1,0],[current_x_2,intermediate_y_one]);  
        next_shape = makeShape(next_shape)
    }
        else {
            //console.log("shape6")
            next_shape = makeArea([current_x_1,0],  [next_x_1,0], [next_x_2,height], [current_x_2,height])
            next_shape = makeShape(next_shape)
        }
        final_list.push(next_shape)
    }

    if(year_type_arg == "py"){
        base_0 = bottom_range[0]
        base_1 = bottom_range[0] + effective_length
        end_shape = makeArea([base_0,0], [base_1,0],[base_0,height])
        end_shape = makeShape(end_shape, "#EEE")
        final_list.push(end_shape)

        base_0 = bottom_range[1]
        base_1 = bottom_range[1] - effective_length
        end_shape = makeArea([base_0,height], [base_1,height],[base_0,0])
        end_shape = makeShape(end_shape, "#EEE")
        final_list.push(end_shape)
    }
    //console.log(final_list)
    return final_list
    } 
 
const check_areas = () => {
    x = d3.selectAll(".overlays").node()
    //console.log(x)
}

const overlay_shapes = (bottom_range, top_range, split_points, height, effective_length) => {
    // move along bottom until we hit first angle
    // calculate how many shapes we need to make
    // for each shape
    // ... move along angle until we hit vertical
    // ... first shape uses those boundaries....
    // ... move to next vetical
    // ... next shape is between those
    // ... once we hit the top,
    // ......... create final shape (triangle if we found verticals)
    initial_x = bottom_range[0]
    rate_changes = split_points.map(d => !d.law_change)
    law_changes = split_points.map(d => d.law_change)

    final_list = []

    last_y_top = 0
    last_y_bottom = height

    for (i = 0; i < rate_changes.length -1; i++){
        current_start = rate_changes[i].value
        current_end = current_start + effective_length

        intersections = law_changes.filter(d => (d.value < current_end))

        for (j = 0; j < intersections.length - 1; j++){

        }
    }
}

//https://github.com/anvaka/isect
const parse_isect_objects = (rate_changes, effective_length, height, scale_start, bottom_range, top_range) => {
    return_objects = []

    const make_isect_object = (from_x, from_y, to_x, to_y) => {
    
        to_return = {
            from: {x:from_x, y:from_y},
            to: {x:to_x, y: to_y}
        }

        return to_return;}

    for (i =0; i < rate_changes.length;i++) {
        current = rate_changes[i]
        from_x = timeRangeScale(current.date - scale_start)
        to_x = (current.law_change)
                ? from_x
                : from_x + effective_length
        from_y = +height
        to_y = 0
        next_object = make_isect_object(from_x, from_y, to_x, to_y)
        return_objects.push(next_object)
    }

    left_boundary = make_isect_object(bottom_range[0], height, top_range[0], 0)
    right_boundary = make_isect_object(bottom_range[1], height, top_range[1], 0)
    top_boundary = make_isect_object(top_range[0], 0, top_range[1], 0)
    bottom_boundary = make_isect_object(bottom_range[0], height, bottom_range[1], height)

    return_objects.push(left_boundary, right_boundary, top_boundary, bottom_boundary)

    return return_objects
}

const get_rc_intersections = (rate_changes, effective_length, height, scale_start, bottom_range, top_range) => {
    x = parse_isect_objects(rate_changes, effective_length, height, scale_start, bottom_range, top_range);
    intersections = isect.bush(x);
    return intersections.run();
}

/*var detectIntersections = isect.bush([{
    from: {x: 0, y:0},
    to: {x:10, y:10}
}, {
    from: {x:0, y:10},
    to: {x:10, y:0}
}]);

var intersections = detectIntersections.run()
console.log(intersections)*/

// from https://stackoverflow.com/questions/45660743/sort-points-in-counter-clockwise-in-javascript
const sort_points_clockwise = (points) => {
    points.sort((a,b) => a.y - b.y);

    // center y
    const cy = (points[0].y + points[points.length - 1].y) / 2; 

    // sort right to left
    points.sort((a,b) => b.x - a.x);

    // get center x
    const cx = (points[0].x + points[points.length - 1].x) / 2;

    //center point
    const center = {x:cx, y:cy};

    // starting angle to reference other angles
    var startAng
    points.forEach(point => {
        var ang = Math.atan2(point.y - center.y, point.x - center.x);
        if(!startAng){ startAnd = ang}
        else {
            if(ang < startAng){
                ang += Math.PI * 2
            }
        }
        point.angle = ang;
    });

    // Sort clockwise
    points.sort((a,b) => a.angle - b.angle);

    return points
}

// get all sub rectangles created by law_changes
const get_rectangles = (rate_changes, bottom_range, height, start_date) => {
    rect_points = rate_changes.filter(d => d.law_change).map(d => timeRangeScale(d.date-start_date));
    rect_points.push(bottom_range[0], bottom_range[1])
    rect_points.sort()
    all_rects = []

    for (i = 0; i < rect_points.length - 1; i++) {
        next_rect = [{x:rect_points[i], y:0},{x:rect_points[i+1], y:0},{x:rect_points[i], y:height},{x:rect_points[i+1], y:height}]
        next_rect = sort_points_clockwise(next_rect)
        all_rects.push(next_rect)
    } 

    return all_rects
}


const onRectBorder = (rect, point) => {
    // for our purposes only have to check x coord
    var max_x = Math.max(...rect.map(d => d.x))
    var min_x = Math.min(...rect.map(d => d.x))

    if(((point.x - min_x) >= -epsilon) && ((max_x - point.x) >= -epsilon)){
    //if (((min_x - point.x) < epsilon) && ((max_x - point.x) > epsilon)){
        return true
    }
    return false
}



const get_shapes = (rects, points, height) => {
    return_shapes = []
    for (i = 0; i < rects.length; i++){
        current_rect = rects[i]
        hull = d3.polygonHull(current_rect.map(d => [d.x, d.y]))
        //console.log(hull)
        //console.log(points)

        current_points = points.filter(d => onRectBorder(current_rect, d))
        //console.log(current_points)

        current_points.sort(function(a,b) {
            return (a.x-b.x) || (a.y-b.y)
        })

        //console.log(current_points)

        start_point = current_points[0]
        //num_rects = current_points.filter(d => Math.abs(d.x  - (start_point.x))< epsilon).length-1
        //console.log(num_rects)
        current_points.shift()
        //console.log(current_points.filter(d => Math.abs(d.x  - (start_point.x))< epsilon).sort(d => d.y))
        next_left = current_points.filter(d => Math.abs(d.x  - (start_point.x))< epsilon).sort(function (a,b) { return a.y - b.y})[0]
        next_top = current_points.filter(d => Math.abs(d.y  - (start_point.y))< epsilon).sort(function (a,b) { return a.x - b.x})[0]
        next_bottom = current_points.filter(d => (d.x > next_left.x) && (Math.abs(d.y - next_left.y) < epsilon))[0]
        //console.log(current_points.filter(d => ((Math.abs(d.x - next_top.x) < epsilon)) && d.y > next_top.y)).sort(d => d.y))
        next_right = current_points.filter(d => (Math.abs(d.x - next_top.x) < epsilon) && (d.y > next_top.y)).sort(function (a,b) { return a.y - b.y})[0]

        shape = [start_point, next_left, next_top, next_bottom, next_right]
        //console.log(shape)
        shape = shape.filter(d => (d !== undefined))
        shape = sort_points_clockwise(shape) 
        
        return_shapes.push(shape)
        //while(true){
        if((next_right != next_bottom) || (next_right === undefined)){
            if (next_bottom !== undefined){
                start_left = next_bottom
            }
            else {
                start_left = next_left
            }
            if (next_right !== undefined){
                start_top = next_right
            }
            else {
                start_top = next_top
            }
            // move along left edge to find next point
            // if already at bottom then skiiiiiip!!!
            if(Math.abs(start_left.y - height) < epsilon) {
                next_left = start_left
            }
            else{
                next_left = current_points.filter(d => Math.abs(d.x  - (start_left.x))< epsilon).sort(function (a,b) { return a.y - b.y})[1]
            }
                // move along top to next point
            next_top = current_points.filter(d => Math.abs(d.y  - (start_top.y))< epsilon).sort(function (a,b) { return a.x - b.x})[0]
            next_bottom = current_points.filter(d => (d.x > next_left.x) && (Math.abs(d.y - next_left.y) < epsilon))[0]
            next_right = current_points.filter(d => (Math.abs(d.x - next_top.x) < epsilon) && (d.y > next_top.y)).sort(function (a,b) { return a.y - b.y})[0]

            shape = [start_left, start_top, next_left, next_top, next_bottom, next_right]
            //console.log(shape)
            shape = shape.filter(d => (d !== undefined))
            shape = sort_points_clockwise(shape)
            console.log(shape)
            
            return_shapes.push(shape)
            //break
        }//}
    }

    return return_shapes

        // i think the first shape will always have 

        // algo:
        // starting with upper left corner
        // ... go right until hitting a point (before top point)
        // ... go down until hitting a point
        // from the bottom point:
        // ... go right until hitting a point
        // ...... if non stop
        // from the top point
        // ... go right until hitting a point
        // ...... if non stop
        // if those match, we have a rect

}

const construct_faces = (bounds, lines) => {
    my_dcel = new DCEL();
    console.log(my_dcel)
    console.log(my_dcel.listVertex)
    console.log(bounds)
    //my_dcel.constructBoundingBox(bounds.xmin, bounds.xmax, bounds.ymin, bounds.ymax)
    my_dcel.constructBoundingBox(0,1,0,1)
    console.log(my_dcel)
    my_la = new LineArrangement(my_dcel)
    
    console.log(my_la.lines)

    var a = 0.9961538461538462
    var b = 0.004545454545454575
    var c = -0.321486013986014
    my_la.addLine(cgutils.Line(a,b,c))

    console.log(my_la.line)
}


render(svg, myRYs, "py", rate_changes);

//construct_faces()

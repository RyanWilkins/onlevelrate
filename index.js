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

    /*
    ** Lines that represent rate and law changes
    */
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
            .attr("x1", d => getTimeX(d.effective_date, d.law_change, policy_length_days))
            .attr("x2", d => timeRangeScale(d.effective_date - start_date))
            
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
    //const split_points = rate_changes.map((d) => ({value:timeRangeScale(d.date - start_date), law_change: d.law_change}))
    
    // how long is a policy once scaled to yearTimeScale
    const scaled_length = getTimeX(start_date, false, policy_length_days)- margin.left

    // Return the rate changes as lines in form a + b + y = 0
    var lines_to_get = rate_changes
    //lines_to_get.push(py_borders[0])
    var lines_to_get = (year_type == "py")
                            ? [...rate_changes, ...py_borders]
                            : rate_changes

    //console.log(lines_to_get)


    const line_list = get_line_list(lines_to_get, scaled_length, section_height, start_date)
    
    // bounds of the graphic for constructing the DCEL
    var bounds = {xmin: bottom_range[0], xmax: top_range[1], ymin: 0, ymax:section_height}
    // Uses a DCEL to get a list of all faces (source in HTML)
    // Then iterates through the linked list to return as list of Vertex
    var overlay_faces = construct_faces(bounds, line_list)
    overlay_faces.map(d => d.fillCumuRate(rate_changes))
    console.log(overlay_faces)

    //console.log(overlay_faces)

    // Need to redefine these for new data structure
    /*
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
    */

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
            .attr("opacity", "0.4")
            //.attr("stroke", d => get_overlay_stroke(d))
            .attr("stroke-width", "0.8")
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
                .text(d => d.cumu_rate)
                //.text((d,i) => i)
                .attr("font-size", "0.2em")
                .attr("dy", "0.32em")
                .attr("text-anchor", "middle")
};




render(svg, myRYs, year_type, other_rate_changes);

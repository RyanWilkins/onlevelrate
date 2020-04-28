/*
** Monte Carlo Simulation on Polygon
*/

// Functions to run a MC simulation to get the average rate level
// in a year polygon
// This runs faster than the other algorithm at 1M sims

const sim_rate = (year_polygon, faces) => {
    // year_bounds: [xmin, ymin, xmax, ymax] 
    
    var x_min = year_polygon[0][0]
    var y_min = year_polygon[0][1]
    //var y_min = 0
    var x_max = year_polygon[2][0]
    var y_max = year_polygon[2][1]

    var olf_final = []

    // performance tracking
    //console.log(year_bounds)
    console.log([x_min, y_min, x_max,y_max])
    var t1 = performance.now()
    var counter = 0

    for (i = 0; i < 1000000; i++){
        var sim_point = []
        while(!d3.polygonContains(year_polygon, sim_point)){
            var x_point = Math.random()*(x_max - x_min) + x_min
            var y_point = Math.random()*(y_max - y_min) + y_min
            var sim_point = [x_point, y_point]
            counter = counter + 1
        }

        var hit_face = faces.filter(d => d3.polygonContains(d.faceString(), sim_point))
        var hit_olf = hit_face[0].cumu_rate
        olf_final.push(hit_olf)
    }
    var t2 = performance.now()

    console.log(`the loop time is ${t2-t1} number of rejects = ${counter - olf_final.length}`)

    var sum_olf = olf_final.reduce((a,b) => a+b, 0)
    return sum_olf/olf_final.length
}

/*
** Scan the box uniformly across
*/

// Functions to run a MC simulation to get the average rate level
// in a year polygon

const sim_rate_scan = (year_bounds, year_polygon, faces) => {
    // year_bounds: [xmin, ymin, xmax, ymax] 
    var t1 = performance.now()
    var x_min = year_polygon[0][0]
    var y_min = year_polygon[0][1]
    //var y_min = 0
    var x_max = year_polygon[2][0]
    var y_max = year_polygon[2][1]

    var olf_final = []

    var sims = 1000
    var counter = 0

    for (i = 0; i < sims; i++){
        var sim_point = []
        var x_point = (x_max - x_min) * i / sims + x_min
        for (j = 0; j < sims; j++){
            /*if(!(j % 10) && !(i % 10)){
                console.log([i,j])
            }*/
            counter = counter + 1 
            var y_point = (y_max - y_min) * j / sims + y_min
            var sim_point = [x_point, y_point]

            if(d3.polygonContains(year_polygon, sim_point)){
                var hit_face = faces.filter(d => d3.polygonContains(d.faceString(), sim_point))
                var hit_olf = hit_face[0].cumu_rate
                olf_final.push(hit_olf)
            }
        }
    }
    var t2 = performance.now()

    console.log(`the loop time is ${t2-t1} number of rejects = ${counter - olf_final.length}`)

    var sum_olf = olf_final.reduce((a,b) => a+b, 0)
    return sum_olf/olf_final.length
}
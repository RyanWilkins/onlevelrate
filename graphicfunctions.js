
// Might get rid of this and just replace with list of years...
const makeRY = (year) => ({
    year
})

const myRYs = rate_years.map(d => makeRY(d));

// Do we still need this? DCEL algorithm should shift for PY
const getUpperLeftCorner  = (year, year_type) => {
    if(year_type == "cy"){
        return yearXScale(year);
    }
    return yearXScale(year + 1);
}

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

// fix floating point errors in the time scale
const timeRangeScaleTrunc = (my_date) => {
    var to_return = Math.floor(timeRangeScale(my_date)*1000000)/1000000;
    return to_return;
}

// Instead of adjusting by start date each time can use this function
// TODO: Can we get rid of start_date since everything is already shifted by it
const getTimeX = (date, law_change, policy_length) => {
    if (law_change) {
        return timeRangeScaleTrunc(date);
    }
    temp_date = date.clone()
    temp_date.add(policy_length, 'day')
    return timeRangeScaleTrunc(temp_date)
}

/*
** Function to find the appropriate cumulative rate factor for a face
*/

// needs access to yearXScale
// first argument is the top right x coord of a face
const cumu_rate = (top_right, bottom_left, rate_changes) => {
    //console.log(bottom_left)
    var x_coord = top_right[0]
    var y_coord = top_right[1]
    // get rate changes which have "passed"
    // where end_date earlier than x_coord of top_right 
    var applicable_rates = rate_changes.filter(d => ((x_coord - timeRangeScaleTrunc(d.end_date)) > epsilon));
    var unused_rates = rate_changes.filter(d => ((timeRangeScaleTrunc(d.end_date) - x_coord) > epsilon));
    var factors = applicable_rates.map(d => d.factor);
    var to_return = factors.reduce((a,b) => a*b,1)

    // find rate changes which have started but not finished, but the face
    // is chopped due to a straight line
    if (y_coord > 0){
        var x_search = bottom_left[0]
        var new_app_rates = unused_rates.filter(d => (x_search - timeRangeScaleTrunc(d.effective_date) > -epsilon));
        
        // if the face is "floating" in the middle (split by two diags and two verticals)
        // have to remove the last rate change that doesn't apply
        //console.log(section_height - bottom_left[1])
        //console.log(Math.abs(section_height - bottom_left[1]) > epsilon)
        if (Math.abs(section_height - bottom_left[1]) > epsilon){
            console.log(counter)
            counter = counter + 1
            //var max_rc_x = Math.max(...new_app_rates.map(d => timeRangeScaleTrunc(d.effective_date)))
            //new_app_rates = new_app_rates.filter(d => (Math.abs(max_rc_x - timeRangeScaleTrunc(d.effective_date)>epsilon)))
            var y_height = section_height - bottom_left[1]
            var x_max = bottom_left[0] - y_height
            //console.log(y_height, x_max, new_app_rates.map(d=> timeRangeScaleTrunc(d.effective_date)))
            console.log(x_max)
            new_app_rates = new_app_rates.filter(d => (x_max - timeRangeScaleTrunc(d.effective_date)) > epsilon)
            //console.log(new_app_rates.length)
            //return "f"
        }
        
        to_return = [to_return, ...new_app_rates.map(d=>d .factor)].reduce((a,b) => a*b,1)
    }

    return to_return
}


/*
** Overlay Face object
** 
*/

/*
** Need to keep the faces in order:
**   - Since we're only working with vertical and right facing lines,
**     easy way to do this is order based on x-coord first,
**     then where two faces have the same x go bottoms up
*/

// upper left/upper right should be turned into prototypes
function overlayFace (path, upper_left, upper_right, bottom_left) {
    this.path = path;
    this.upper_left = upper_left;
    this.upper_right = upper_right;
    this.bottom_left = bottom_left;
}

/*overlayFace.prototype.faceString =  function(){
    var to_return = [this.vertex];
    var current_node = this;
    while(current_node.next !== null){
        current_node = current_node.next;
        to_return.push(current_node.vertex);
    };
    return to_return.map(d => [d.x, d.y]).join(" ");
}*/

overlayFace.prototype.faceString = function(){
    //console.log(this)
    return this.path.map(d => [d.x,d.y])
}

overlayFace.prototype.fillCumuRate = function(rcs){
    this.cumu_rate = cumu_rate(this.upper_right, this.bottom_left, rcs)
}

const test_of = () => {
    var face = new overlayFace({x:0, y:1}, null);
    var face2 = new overlayFace({x:0, y:1}, null);
    face.next = face2
    return (face.faceString(","))
}


// first argument of shape is the Area object
const makeShape = (area, shape_color, rate_factor = 1.00) => (
    {
        area,
        shape_color,
        rate_factor
    }
)


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

/*
** Functions to create overlay using DCEL 
*/

const face_top_left = (face) => {
    var min_x = Math.min(...(face.map(d => Math.floor(d.x*1000000)/1000000)));

    var min_points = face.filter(d => d.x == min_x);
    var min_y = Math.min(...(min_points.map(d => d.y)));

    return([min_x,min_y])
}

const face_bottom_left = (face) => {
    var min_x = Math.min(...(face.map(d => d.x)));

    var min_points = face.filter(d => d.x == min_x);
    var max_y = Math.max(...(min_points.map(d => d.y)));

    return([min_x,max_y])
}

const face_top_right = (face) => {
    var max_x = Math.max(...(face.map(d => d.x)));

    var max_points = face.filter(d => d.x == max_x);
    var min_y = Math.min(...(max_points.map(d => d.y)));

    return([max_x,min_y])
}

// Final function which outputs the final list of faces
// TODO: create face objects instead of just a list
const retrieve_faces = (line_arrangement) => {
    var faceDLL = line_arrangement.dcel.listFace.head;
    var face_list = []
    var face_objects = []
    while(faceDLL !== null){
        var current_list = []
        var edge_tracker = []
        var current_edge = faceDLL.content.outerComponent;

        while(current_edge !== null && edge_tracker.indexOf(current_edge.index)){
            edge_tracker.push(current_edge.index);
            current_list.push(current_edge.origin);
            current_edge = current_edge.next;
        }
        face_list.push(current_list);

        next_face = new overlayFace(current_list, face_top_left(current_list), face_top_right(current_list), face_bottom_left(current_list))
        face_objects.push(next_face)

        faceDLL = faceDLL.next;

        //console.log(next_face.faceString())

    }

    console.log(face_objects)
    return face_objects;
}

// loops through the DCEL alogorithm given the graphic bounds
// and lines in a + b + c = 0 format
const construct_faces = (bounds, lines) => {
    my_dcel = new DCEL();

    my_dcel.constructBoundingBox(bounds.xmin-epsilon, bounds.xmax+epsilon, bounds.ymin, bounds.ymax)

    my_la = new LineArrangement(my_dcel)

    for (i=0; i<lines.length; i++){
        var line = lines[i]
        try
            {
                my_la.addLine(cgutils.Line(line.a,line.b,line.c))
                // Quick hack: loop through the algorithm
                // would need to restructure the code otherwise
                // TODO: restructure the code
                while(!my_la.done())
                    {
                        my_la.next()
                    }
            }
        catch(err)
            {
                // ignore this rate change
                // TODO: keep track of rejects
            }

        
    }

    var faces = retrieve_faces(my_la)
    faces = faces.filter(d => d.path.length >0)
    //console.log(...faces.map((d,i) => [i, d.upper_left]))

    //faces.sort(function (x,y) { return ((x.upper_left[0] - y.upper_left[0]) < epsilon) || (x.upper_left[1] - y.upper_left[1]); })

    // Something is still not 100% correct with this... floating point?
    faces.sort(
        function(a,b){ return (Math.abs(a.upper_left[0] - b.upper_left[0]) < epsilon) ? a.upper_left[1] - b.upper_left[1] : a.upper_left[0] - b.upper_left[0]}
        );

    //console.log(faces)

    return faces

}

// Convert lines from two points to a + b + c = 0 format
// then return in list
// TODO: isn't really reuseable... only for this dashboard
const get_line_list = (rate_changes, scaled_length, height) => {
    var output_lines = [];

    // TODO: if rate change is outside the range, we should limit the range
    // currently breaks if outside range
    for(i = 0; i < rate_changes.length; i++){
        // adjust x by a little bit to avoid perfectly vertical lines
        // TODO: too hacky, need actual fix
        var x_0 = timeRangeScaleTrunc(rate_changes[i].effective_date) 
        var y_1 = 0
        var y_0 = height
        if (rate_changes[i].law_change){
            var x_1 = x_0;
        }
        else{
            var x_1 = x_0 + scaled_length;
        }

        //console.log(x_0, y_0, x_1, y_1)
        //console.log(scaled_length)
        var a = y_1 - y_0 
        var b = x_0 - x_1 
        var c = y_0 * x_1 - y_1 * x_0

        output_lines.push(cgutils.Line(a,b,c)) 
    }
    return output_lines
}



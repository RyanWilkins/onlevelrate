// Previous attempt at creating overlay used isect function from github
// saved here in case needed

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

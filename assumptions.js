
/**
 ** Define the area that holds the dashboard
 */
const viewboxDim = {minx:"0", miny:"0", width:"100", height:"50"};

/*
** Temporary assumptions that allow for debugging
*/
let rate_years = [2011, 2012,2013]
let year_type = ["cy", "py"]

const start_date = moment([rate_years[0], "-01-01"].join(), "YYYY-MM-DD")
const end_date = moment([rate_years[rate_years.length-1]+1,"-01-01"].join(), "YYYY-MM-DD")

const increase_one = moment("2012-1-02", "YYYY-MM-DD")
const increase_two = moment("2012-5-01", "YYYY-MM-DD")
const increase_three = moment("2011-9-01", "YYYY-MM-DD")
const law_change_date = moment("2011-11-01", "YYYY-MM-DD")
const law_change_date_two = moment("2012-1-01", "YYYY-MM-DD")
const policy_length_days = 365

var rate_changes = 
                [
                    { date: increase_one, value: 0.05, law_change: false},
                    { date: increase_two, value: 0.10, law_change: false},
                    { date: increase_three, value: 0.07, law_change: false},
                    { date: law_change_date, value: -0.05, law_change: true},
                    { date: law_change_date_two, value: 0.10, law_change: true}
                ]

/*
** Variables that define the Dashboard area and graphic area
*/

/* Height and width of the dashboard */
const viewboxDimString = viewboxDim.minx.concat(" ", viewboxDim.miny, " ",
viewboxDim.width, " ", viewboxDim.height);
const height = +viewboxDim.height;
const width = +viewboxDim.width;

/* Margin between the dashboard and the graphic, and defining graphic dimendsions */
const margin = {top:20, bottom: 5, right: 2, left: 2};
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
const numberFormat = d3.format(",.4r")
const yearColorScheme = d3.schemeAccent

// epsilon for floating point error toleration
let epsilon = 0.00000001;
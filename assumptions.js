
/**
 ** Define the area that holds the dashboard
 */
const viewboxDim = {minx:"0", miny:"0", width:"100", height:"50"};

/*
** Temporary assumptions that allow for debugging
*/
let rate_years = [2011, 2012,2013,2014]
let year_type = "cy"

const start_date = moment([rate_years[0], "-01-01"].join(), "YYYY-MM-DD")
const end_date = moment([rate_years[rate_years.length-1]+1,"-01-01"].join(), "YYYY-MM-DD")

const start_date_two = moment([rate_years[0], "-01-02"].join(), "YYYY-MM-DD")
// TODO:
// If we have law changes on the same day it crashes due to vertical lines

const increase_one = moment("2012-01-01", "YYYY-MM-DD")
const increase_two = moment("2012-5-01", "YYYY-MM-DD")
const increase_three = moment("2012-6-01", "YYYY-MM-DD")
const increase_four = moment("2011-1-01", "YYYY-MM-DD")
const increase_five = moment("2012-7-01", "YYYY-MM-DD")
const law_change_date = moment("2012-01-01", "YYYY-MM-DD")
const law_change_date_two = moment("2012-8-05", "YYYY-MM-DD")
const law_change_date_three = moment("2012-12-01", "YYYY-MM-DD")
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
    new RateChange(increase_one, .1, false, 1),
    //new RateChange(increase_two,0.1, false, 1),
    new RateChange(increase_three, 0.15, false, 1),
    //new RateChange(law_change_date, 0.07, true, 1),
    new RateChange(law_change_date_two, -0.05, true, 1),
    //new RateChange(increase_four, 0.02, false, 1),
    new RateChange(law_change_date_three, 0.2, true, 1),
   // new RateChange(increase_five, -0.15, false, 1)
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
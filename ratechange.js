/* 
** Functions formalizing the Rate Change Class
*/

function RateChange (effective_date, value, law_change, policy_length_years){
    // start date is a Moment("YYYY-MM-DD")
    this.effective_date = effective_date;
    this.value = value;
    this.law_change = law_change;
    this.factor = 1 + value;
    this.policy_length_years = policy_length_years;
    this.fill_end_date();
}


RateChange.prototype.fill_end_date = function() {
    
    var temp = this.effective_date.clone()
    temp.add(this.policy_length_years, 'year')

    this.end_date = this.law_change
                    ? this.effective_date
                    : temp

}


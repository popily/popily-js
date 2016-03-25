(function(window) {

  // Average number 1 of Category 1 
  
  
  var column = function(label) {
    return '<span class="popily-title-variable" >'+ label.column_header + '</span>';
  }
  
  
  window.popily.chart.generateLabels = function(calculation, axisAssignments) {
    
    console.log(axisAssignments);
    
    if(calculation == 'count') {
      if(axisAssignments.z) {
        if(axisAssignments.x.data_type == 'datetime' || axisAssignments.x.data_type == 'category') {
          return {
            title: 'Number of each ' + column(axisAssignments.z) + ' Grouped by ' + column(axisAssignments.x)
          }
        }
      }
    }
    else if(calculation == 'counts') {
      
    }
    
    return {
      title: 'no title'
    }
    
  }

})(window);

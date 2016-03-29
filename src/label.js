(function(window) {

  // Average number 1 of Category 1 
  
  
  var column = function(label) {
    return '<span class="popily-title-variable" >'+ label.column_header + '</span>';
  }
  
  
  window.popily.chart.generateLabels = function(calculation, axisAssignments) {
        
    if(calculation == 'count') {
      if(axisAssignments.z) {
        return {
          title: 'Number of each ' + column(axisAssignments.z) + ' grouped by ' + column(axisAssignments.x)
        }
      }
      else {
        return {
          title: 'Number of each ' + column(axisAssignments.x)
        }
      }
    }
    else if(calculation == 'sum' ) {
      if(axisAssignments.z) {
        return {
          title: 'Total ' + column(axisAssignments.z) + ' by ' + column(axisAssignments.x) + ' grouped by ' + column(axisAssignments.x)
        }
      } else if(axisAssignments.y) {
        return {
          title: 'Total ' + column(axisAssignments.y) + ' by ' + column(axisAssignments.x)
        }
      } else {
        return {
          title: 'Total of ' + column(axisAssignments.x)
        }
      }
    }
    else if(calculation == 'average') {
      if(axisAssignments.z) {
        return {
          title: 'Average ' + column(axisAssignments.z) + ' by ' + column(axisAssignments.x) + ' grouped by ' + column(axisAssignments.x)
        }
      } else if(axisAssignments.y) {
        return {
          title: 'Average ' + column(axisAssignments.y) + ' by ' + column(axisAssignments.x)
        }
      }
      else {
        return {
          title: 'Average of ' + column(axisAssignments.x)
        }
      }
    }
    else if(calculation == 'ratio') {
      if(axisAssignments.y) {
        return {
          title: 'Ratio of records for each ' + column(axisAssignments.x) + ' '
        }
      }
      else {
        return {
          title: 'Ratio of each ' + column(axisAssignments.x)
        }
      }
    }
    else if(calculation == 'comparison') {
      if(axisAssignments.z) {
        return {
          title: '' + column(axisAssignments.z) + ' compared to ' + column(axisAssignments.x) + ' by ' + column(axisAssignments.x)
        }
      } else {
        return {
          title: '' + column(axisAssignments.y) + ' compared to ' + column(axisAssignments.x)
        }
      }
    }
    
    
    return {
      title: 'no title'
    }
    
  }

})(window);

(function(window) {

  // Average number 1 of Category 1 
  
  
  var joinWithOr = function(arr) {
    if(arr.length < 2)
      return arr.join('');
    else
      return [arr.slice(0, -1).join(', '), arr.slice(-1)[0]].join(' or ');
  }
    
  window.popily.chart.generateLabels = function(calculation, axisAssignments, transformations) {
        
  
    var columnLabel = function(column, description) {
      if(!('column_header' in column))
        console.log(column);
      var label = '<span class="popily-title-variable" >'+ column.column_header + '</span>';
      var prefixes = [],
        sufixes = [];
      description = description || '';
      (transformations || []).forEach(function(t) {
        if(t.column==column.column_header) {
          if(t.op == 'eq')
            sufixes.push('equal '+ joinWithOr(t.values));
          else if(t.op == 'noteq')
            sufixes.push('not equal '+ joinWithOr(t.values));
          else if(t.op == 'gt')
            prefixes.push('greater than '+ t.value);
          else if(t.op == 'gte')
            prefixes.push('greater than or equal '+ t.value);
          else if(t.op == 'lt')
            prefixes.push('lower than '+ t.value);
          else if(t.op == 'lte')
            prefixes.push('lower than or equal '+ t.value);
          else if(t.op == 'countUnique')
            prefixes.push('number of unique');
        }
      });
      if(prefixes.length && !description)
        description = 'values of'
      
      return prefixes.join(' and ') +' '+ description + ' '+ label +' '+ sufixes.join(' and ');
    }
  
  
    if(calculation == 'count') {
      if(axisAssignments.z) {
        return {
          title: columnLabel(axisAssignments.z, 'Number of each') + ' grouped by ' + columnLabel(axisAssignments.x)
        }
      }
      else {
        return {
          title: columnLabel(axisAssignments.x, 'Number of each')
        }
      }
    }
    else if(calculation == 'sum' ) {
      if(axisAssignments.z) {
        return {
          title: columnLabel(axisAssignments.z, 'Total of') + ' by ' + columnLabel(axisAssignments.x) + ' grouped by ' + columnLabel(axisAssignments.x)
        }
      } else if(axisAssignments.y) {
        return {
          title: columnLabel(axisAssignments.y, 'Total of') + ' grouped by ' + columnLabel(axisAssignments.x)
        }
      } else {
        return {
          title: columnLabel(axisAssignments.x, 'Total of')
        }
      }
    }
    else if(calculation == 'average') {
      if(axisAssignments.z) {
        return {
          title: columnLabel(axisAssignments.z, 'Average of') + ' by ' + columnLabel(axisAssignments.x) + ' grouped by ' + columnLabel(axisAssignments.x)
        }
      } else if(axisAssignments.y) {
        return {
          title: columnLabel(axisAssignments.y, 'Average of') + ' grouped by ' + columnLabel(axisAssignments.x)
        }
      }
      else {
        return {
          title: columnLabel(axisAssignments.x, 'Average of')
        }
      }
    }
    else if(calculation == 'ratio') {
      if(axisAssignments.y) {
        return {
          title: columnLabel(axisAssignments.x, 'Ratio of records for each') + ' '
        }
      }
      else {
        return {
          title: columnLabel(axisAssignments.x, 'Ratio of each')
        }
      }
    }
    else if(calculation == 'comparison') {
      if(axisAssignments.z) {
        return {
          title: '' + columnLabel(axisAssignments.z) + ' compared to ' + columnLabel(axisAssignments.x) + ' by ' + columnLabel(axisAssignments.x)
        }
      } else {
        return {
          title: '' + columnLabel(axisAssignments.y) + ' compared to ' + columnLabel(axisAssignments.x)
        }
      }
    }
    else if(calculation == 'top') {
      // Top unique_row_label_1 Ranked by number_3
      return {
        title: '' + columnLabel(axisAssignments.x, 'Top') + ' Ranked by ' + columnLabel(axisAssignments.y)
      }
    }
    else if(calculation == 'geo') {
      if(axisAssignments.z) {
        return {
          title: columnLabel(axisAssignments.x, 'Number of') + ' for Each Location grouped by ' + columnLabel(axisAssignments.z)
        }
      }
      else if(axisAssignments.y) {
        return {
          title: columnLabel(axisAssignments.y, 'Number of') + ' for Each Location'
        }
      }
      else {
        return {
          title: 'Rowlabel for Each Location'
        }
      }
    }
    
    
    return {
      title: 'no title for '+calculation
    }
    
  }

})(window);

(function(window) {

  // Average number 1 of Category 1 
  
  var joinWithOr = function(arr) {
    return popily.chart.format.joinWith(arr,'or');
  };

   var joinWithAnd = function(arr) {
    return popily.chart.format.joinWith(arr,'and');
  };
  
    
  window.popily.chart.generateLabels = function(calculation, axisAssignments, transformations) {
        
  
    var columnLabel = function(column, description) {
      if(!('column_header' in column))
        console.log(column);
      var label = popily.chart.format.wrapLabel(column.column_header);
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


    if(axisAssignments.hasOwnProperty('columns')) {
        var columns = axisAssignments.columns;
        var numbers = _.filter(columns, function(column) { return column.data_type === 'numeric'});
        var groupers = _.filter(columns, function(column) { return column.data_type !== 'numeric' });
        var prefix,suffix;
        if(numbers.length === 1 && numbers[0].column_header === 'count_0') {
          prefix = 'Number of ';
        }
        else {
          prefix = popily.chart.format.capitalize(calculation) + ' of ' + joinWithAnd(_.map(_.pluck(numbers,'column_header'),popily.chart.format.wrapLabel));
        }

        if(groupers.length > 0) {
          suffix = ' grouped by ' + joinWithAnd(_.map(_.pluck(groupers,'column_header'),popily.chart.format.wrapLabel));
        }
        else {
          suffix = '';
        }
      return {
        title: prefix + suffix
      }

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
          title: columnLabel(axisAssignments.y, 'Total of') + ' grouped by ' + columnLabel(axisAssignments.x) + ' for each ' + columnLabel(axisAssignments.z)
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
          title: columnLabel(axisAssignments.y, 'Average of') + ' grouped by ' + columnLabel(axisAssignments.x) + ' for each ' + columnLabel(axisAssignments.z)
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
          title: '' + columnLabel(axisAssignments.y) + ' compared to ' + columnLabel(axisAssignments.x) + ' for each ' + columnLabel(axisAssignments.z)
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
    else if(calculation === 'min') {
      if(axisAssignments.x.values.length > 1) {
        return {
          title: columnLabel(axisAssignments.y, '') + ' for Each Column'
        }
      }
      else {
        return {
          title: 'Minimum value for ' + axisAssignments.x.column_header
        }
      }
    }
    
    
    return {
      title: 'No title for '+calculation
    }
    
  }

})(window);

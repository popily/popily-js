(function(window) {

  // Average number 1 of Category 1 
  
  var joinWithOr = function(arr) {
    return popily.chart.format.joinWith(arr,'or');
  };

  var joinWithAnd = function(arr) {
    return popily.chart.format.joinWith(arr,'and');
  };

  var numberFormat = function(val) {
    return parseFloat(val).toLocaleString('en-US');
  };

  var dateFormat = function(val) {
    return (new Date(val)).toLocaleDateString();
  }
  
    
  window.popily.chart.generateLabels = function(calculation, columns, transformations) {
    var makeClause = function(transformation) {
        var t = transformation;
        var column = _(columns).findWhere({label: t.column});
        var formatter = numberFormat;
        if(column && column.dataType === 'datetime') {
          formatter = dateFormat;
        }

        if(t.op == 'in' && t.value.length < 4) 
          return 'is equal to '+ joinWithOr(t.value)
        else if (t.op === 'notin' && t.value.length < 4)
          return 'is not equal to ' + joinWithOr(t.value)
        else if(t.op == 'eq' || _.isUndefined(t.op))
          return 'is equal to '+ t.value;
        else if(t.op == 'noteq')
          return 'is not equal to '+ t.value;
        else if(t.op == 'gt')
          return 'is greater than '+ formatter(t.value);
        else if(t.op == 'gte')
          return 'is greater than or equal to '+ formatter(t.value);
        else if(t.op == 'lt')
          return 'is less than '+ formatter(t.value);
        else if(t.op == 'lte')
          return 'is less than or equal to '+ formatter(t.value);
        else
          return ''
    };

    var numbers = _.filter(columns, function(column) { return column.dataType === 'numeric'});
    var groupers = _.filter(columns, function(column) { return column.dataType !== 'numeric' });
    var prefix,shortPrefix,suffix,clauses;
    if(numbers.length === 1 && numbers[0].label === 'count_0') {
      prefix = 'count of records ';
      if (calculation === 'ratio') {
        prefix = 'ratio of records ';
      }
      shortPrefix = popily.chart.format.capitalize(prefix);
    }
    else {
      shortPrefix = joinWithAnd(_.map(_.pluck(numbers,'label'),popily.chart.format.wrapLabel))
      prefix = calculation + ' of ' + shortPrefix;
    }

    if(groupers.length > 0) {
      var groupBy = ' for every value of ';
      if (groupers.length > 1) {
        groupBy = ' for every combination of ';
      }
      suffix = groupBy + joinWithAnd(_.map(_.pluck(groupers,'label'),popily.chart.format.wrapLabel));
    }
    else {
      suffix = '';
    }

    if(transformations.length > 0) {
      var clausePieces = [];
      _.each(transformations, function(transformation) {
        var clause = makeClause(transformation);
        if (clause !== '') {
          clausePieces.push(popily.chart.format.wrapLabel(transformation.column) + ' ' + clause);
        }
      });

      if(clausePieces.length > 0) {
        clauses = ' where ' + joinWithAnd(clausePieces);
      }
      else {
        clauses = '';
      }

    }
    else {
      clauses = '';
    }
    return {
      description: 'This chart shows the ' + prefix + suffix + clauses,
      title: (function() {
          var t = shortPrefix;
          if (groupers.length === 0) {
            return t;
          }
          return t + ' by ' + joinWithAnd(_.map(_.pluck(groupers,'label'),popily.chart.format.wrapLabel))
        })()
    }
    
  }

})(window);

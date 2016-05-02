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
    var prefix,suffix,clauses;
    if(numbers.length === 1 && numbers[0].label === 'count_0') {
      prefix = 'Count of records ';
      if (calculation === 'ratio') {
        prefix = 'Ratio of records ';
      }
    }
    else {
      prefix = popily.chart.format.capitalize(calculation) + ' of ' + joinWithAnd(_.map(_.pluck(numbers,'label'),popily.chart.format.wrapLabel));
    }

    if(groupers.length > 0) {
      suffix = ' grouped by ' + joinWithAnd(_.map(_.pluck(groupers,'label'),popily.chart.format.wrapLabel));
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
      title: prefix + suffix + clauses
    }
    
  }

})(window);

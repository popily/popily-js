(function(window) {
  var popilyChart = window.popily.chart;
  var chart = _.clone(popilyChart.baseChart);

  chart.prepData = function(rawData, options, group) {
    var that = this;
    var limit = that.defaults.categoryLimit;
    var cleanValues = that.cleanData(rawData);

    var analysisTypeCheck = 'count_by_value';
    if(group) {
      analysisTypeCheck = 'count_by_value_by_category';
    }

    if(rawData.analysisType == analysisTypeCheck) {
        var rangeBottoms = _.map(cleanValues[0], function(x) {
            return parseFloat(x.split(' to ')[0]);
        });

        cleanValues.push(rangeBottoms);
        var cleanZipped = _.zip(cleanValues[0],cleanValues[1],cleanValues[2],cleanValues[3]);
        cleanZipped = _.sortBy(cleanZipped, function(t){ 
                            return t[3]; 
                        });
        cleanValues = _.first(_.unzip(cleanZipped),limit);        
    }
    else {
        var order = options.order || 'auto';
        cleanValues = popilyChart.dataset.sortData(cleanValues[0],cleanValues[1],cleanValues[2],limit,order);
    }

    var cleanXValues = cleanValues[0];
    var cleanYValues = popilyChart.format.formatNumbers(cleanValues[1]);
    var cleanZValues = cleanValues[2];

    return [cleanXValues, cleanYValues, cleanZValues];
  };

  popilyChart.chartTypes.barCommon = chart;
})(window);

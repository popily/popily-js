(function(window) {
  var popilyChart = window.popily.chart;
  var format = popilyChart.format;
  
  var chart = _.clone(popilyChart.baseChart);
  chart.assignAxis = function(columns, calculation, options) {
      var axis = {
        columns: columns
      };
      return axis;
  };

  chart.render = function(element, options, formattedData) {
      var columns = formattedData.chartData.columns;
      var calculation = formattedData.chartData.calculation;
      var header = _.pluck(columns,'label')[0];
      var value = format.formatNumbers(_.pluck(columns,'values'))[0];      
      var p = document.createElement('p');
      p.classList.add('popily-metric-description');
      p.innerHTML = 'The ' + format.wrapLabel(calculation) + ' of ' + format.wrapLabel(header) + ' is ' + format.wrapLabel(format.formatNumbers([parseFloat(value)],1));

      element.appendChild(p);

      return p;
  };

  popilyChart.chartTypes.sentence = chart;
})(window);

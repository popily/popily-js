(function(window) {
  var popilyChart = window.popily.chart;

  var chart = _.clone(popilyChart.baseChart);

  chart.assignAxis = function(columns, calculation, options) {
      return popilyChart.chartTypes.barCommon.assignAxis(columns,calculation,options);
  };

  chart.render = function(element, options, rawData) {
      return popilyChart.chartTypes.linear.render(element, options, rawData);
  };

  popilyChart.chartTypes.multiLine = chart;
})(window);

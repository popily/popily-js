(function(window) {
  var popilyChart = window.popily.chart;
  var chart = _.clone(popilyChart.chartTypes.radar);

  chart.isStacked = true;
  
  popilyChart.chartTypes.radarStacked = chart;
})(window);

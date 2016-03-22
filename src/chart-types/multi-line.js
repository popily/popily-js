(function(window) {
  var popilyChart = window.popily.chart;

  var chart = _.clone(popilyChart.baseChart);
  chart.defaultFor = [
    'average_by_category_by_datetime',
    'count_by_category_by_category_by_datetime'
  ];
  chart.accepts = [
    'sum_by_datetime',
    'ratio_by_datetime',
    'sum_per_category_by_datetime',
    'sum_by_category_by_datetime',
    'count_by_category_by_datetime'
  ];

  chart.render = function(element, options, rawData) {
      return popilyChart.chartTypes.linear.render(element, options, rawData);
  };

  popilyChart.chartTypes.multiLine = chart;
})(window);

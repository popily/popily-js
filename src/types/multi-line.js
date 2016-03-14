(function(window) {
  var popilyChart = window.popily.chart;

  var chart = _.clone(popilyChart.baseChart);
  chart.defaultFor = [
    'average_by_category_by_date',
    'count_by_category_by_category_by_date'
  ];
  chart.accepts = [
    'sum_by_date',
    'ratio_by_date',
    'sum_per_category_by_date',
    'sum_by_category_by_date',
    'count_by_category_by_date'
  ];

  chart.render = function(element, options, rawData) {
      return popilyChart.chartTypes.linear.render(element, options, rawData);
  };

  popilyChart.chartTypes.multiLine = chart;
})(window);

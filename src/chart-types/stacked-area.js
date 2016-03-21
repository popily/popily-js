(function(window) {
  var popilyChart = window.popily.chart;

  var chart = _.clone(popilyChart.baseChart);
  chart.defaultFor = [
    'sum_by_date',
    'ratio_by_date',
    'sum_per_category_by_date',
    'sum_by_category_by_date',
    'count_by_category_by_date'
  ];
  chart.accepts = [
    'count_by_date',
    'ratio_by_date',
    'average_by_date',
    'count_per_category_by_date',
    'average_per_category_by_date',
    'average_by_category_by_date'
  ];

  chart.render = function(element, options, rawData) {
      popilyChart.chartTypes.linear.render(element, options, rawData, true);
  };

  popilyChart.chartTypes.stackedArea = chart;
})(window);

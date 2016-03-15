(function(window) {
  var popilyChart = window.popily.chart;

  var chart = _.clone(popilyChart.baseChart);
  chart.defaultFor = [
    'count_by_value',
    'count_by_category',
    'average_by_category',
    'sum_by_category',
    'sum_sum_by_category',
    'sum_by_category_per_category',
    'average_by_category_per_category',
    'count_by_category_per_category',
    'count_per_category_by_category'
  ];
  chart.accepts = [];

  chart.render = function(element, options, rawData) {
      var that = this;
      var xValues = rawData.chartData.x.values;
      var minY = _.min(rawData.chartData.y.values);
      var chartToUse = popilyChart.chartTypes.bubble;
      if(xValues.length < 30 || minY < 0) {
        chartToUse = popilyChart.chartTypes.bar;
      }

      return chartToUse.render(element, options, rawData);
  };

  popilyChart.chartTypes.barOrBubble = chart;
})(window);

(function(window) {
  var popilyChart = window.popily.chart;
  var chart = _.clone(popilyChart.baseChart);
  chart.defaultFor = [
    'average_per_category_by_category',
    'sum_per_category_by_category',
    'count_by_value_by_category',
    'average_by_category_by_category',
    'sum_by_category_by_state',
    'count_by_value_by_state',
    'average_by_category_by_state'
  ];
  chart.accepts = [];

  chart.render = function(element, options, rawData) {
      var that = this;
      var preppedData = popilyChart.chartTypes.barCommon.prepData(rawData, options, true);
      var xValues = preppedData[0];
      var yValues = preppedData[1];
      var zValues = preppedData[2];
      var xLabel = rawData.chartData.x.label;
      var yLabel = rawData.chartData.y.label;

      var data = popilyChart.chartData.c3ify(xValues,yValues,zValues);
      var rotated = false;
      if(data.columns.length > 25) {
          rotated = true;
      }

      var kwargs = {
        options: options,
        data: data,
        zValues: zValues,
        rotated: rotated,
        xLabel: xLabel,
        yLabel: yLabel,
        element: element
      };
      var chartData = popilyChart.chartTypes.barCommon.getChartObject(kwargs);
      chartData.onresized = function() {
        popilyChart.chartTypes.barCommon.updateSpecials(element, rotated, options);
      };

      var animation = popily.chart.utils.initialAnimation(chartData, options);

      var chart = c3.generate(chartData);

      animation.start(chart, function() {
        popilyChart.chartTypes.barCommon.updateSpecials(element, rotated, options);
      });
      
      return chart;
  };

  popilyChart.chartTypes.barGrouped = chart;
})(window);

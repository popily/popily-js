(function(window) {
  var popilyChart = window.popily.chart;
  var chart = _.clone(popilyChart.baseChart);

  chart.defaultFor = [
    'sum_by_category_by_category',
    'count_by_category_by_category'
  ];
  chart.accepts = [
    'average_per_category_by_category',
    'sum_per_category_by_category',
    'count_by_value_by_category',
    'average_by_category_by_category',
    'sum_per_category_by_date',
    'sum_by_category_by_date',
    'count_by_category_by_date'
  ];

  chart.render = function(element, options, rawData) {
      var that = this;
      var preppedData = popilyChart.chartTypes.barCommon.prepData(rawData, options, true);
      var xValues = preppedData[0];
      var yValues = preppedData[1];
      var zValues = preppedData[2];
      var xLabel = rawData.chartData.x.label;
      var yLabel = rawData.chartData.y.label;

      var data = popilyChart.dataset.c3ify(xValues,yValues,zValues);
      data.categories.unshift('x');
      data.columns.unshift(data.categories);
      var rotated = false;
      if(data.columns[0].length > 40) {
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
      chartData.data = {
          x: 'x',
          columns: data.columns,
          type: 'bar',
          groups: [data.groups]
      };

      var chart = c3.generate(chartData);
      this.chart = chart;

      popily.chart.format.updateChart(element, chart, chartData, that.defaults.chartPadding);

      return this.chart;
  };

  popilyChart.chartTypes.barStacked = chart;
})(window);

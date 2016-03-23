(function(window) {
  var popilyChart = window.popily.chart;
  var chart = _.clone(popilyChart.baseChart);

  chart.defaultFor = [
    'sum_by_category_by_category',
    'count_by_category_by_category',
    'count_by_category_by_category_by_category'
  ];
  chart.accepts = [
    'average_per_category_by_category',
    'sum_per_category_by_category',
    'count_by_value_by_category',
    'average_by_category_by_category',
    'sum_per_category_by_datetime',
    'sum_by_category_by_datetime',
    'count_by_category_by_datetime'
  ];

  chart.render = function(element, options, rawData) {
      var that = this;
      var preppedData = popilyChart.chartTypes.barCommon.prepData(rawData, options, true);
      var xValues = preppedData[0];
      var yValues = preppedData[1];
      var zValues = preppedData[2];
      var z2Values = preppedData[3];
      var xLabel = rawData.chartData.x.label;
      var yLabel = rawData.chartData.y.label;

      var data;
      var groups;
      if(z2Values.length > 0) {
        data = popilyChart.chartData.c3ifyMulti(xValues,yValues,zValues,z2Values);
        groups = data.groups;
      }
      else {
        data = popilyChart.chartData.c3ify(xValues,yValues,zValues);
        groups = [data.groups];
      }
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
        z2Values: z2Values,
        element: element
      };
      var chartData = popilyChart.chartTypes.barCommon.getChartObject(kwargs);
      chartData.data = {
          x: 'x',
          columns: data.columns,
          type: 'bar',
          groups: groups
      };

      if(z2Values.length > 0) {
        chartData.data.names = data.names;
        var uniqNames = _.uniq(_.values(data.names));
        var nameColors = _.zip(uniqNames,_.first(options.colors,uniqNames.length));
        var colors = {};

        _.each(nameColors, function(nameColor) {
          _.each(_.uniq(z2Values), function(z2) {
            colors[nameColor[0] + '___' + z2] = nameColor[1];
          });
        });

        chartData.data.colors = colors;
      }

      var chart = c3.generate(chartData);
      this.chart = chart;

      popily.chart.utils.updateChart(element, chart, chartData, that.defaults.chartPadding);

      return this.chart;
  };

  popilyChart.chartTypes.barStacked = chart;
})(window);

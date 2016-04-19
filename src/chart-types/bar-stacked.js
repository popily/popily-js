(function(window) {
  var popilyChart = window.popily.chart;
  var chart = _.clone(popilyChart.baseChart);

  chart.assignAxis = function(columns, calculation, options) {
      return popilyChart.chartTypes.barCommon.assignAxis(columns,calculation,options);
  };

  chart.render = function(element, options, formattedData) {
      var that = this;
      var preppedData = popilyChart.chartTypes.barCommon.prepData(formattedData, options, true);
      var xValues = preppedData[0];
      var yValues = preppedData[1];
      var zValues = preppedData[2];
      var xLabel = formattedData.chartData.x.label;
      var yLabel = formattedData.chartData.y.label;

      var data;
      var groups;
      data = popilyChart.chartData.c3ify(xValues,yValues,zValues);
      groups = [data.groups];
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
          groups: groups
      };

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

  popilyChart.chartTypes.barStacked = chart;
})(window);

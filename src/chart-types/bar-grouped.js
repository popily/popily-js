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

      var data = popilyChart.chartData.c3ify(xValues,yValues,zValues);
      var rotated = false;
      if(yValues.length > 25 && (_.isNull(options.rotated) || options.rotated === true)) {
        rotated = true;
      }

      var kwargs = {
        options: options,
        data: data,
        zValues: zValues,
        rotated: rotated,
        xLabel: xLabel,
        yLabel: yLabel,
        element: element,
        formattedData: formattedData
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

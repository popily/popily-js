(function(window) {
  var popilyChart = window.popily.chart;
  
  var chart = _.clone(popilyChart.baseChart);
  chart.defaultFor = [
    'ratio_per_category'
  ];
  chart.accepts = [];

  chart.render = function(element, options, rawData) {
      var that = this;
      var yValues = rawData.chartData.y.values;

      var chartData = {
          bindto: element,
          data: {
              columns: [['data', parseFloat(yValues[0]) * 100]],
              type: 'gauge'
          },              
          color: {
              pattern: options.colors
          },              
          legend: {
              show: !_.isUndefined(options.legend) && options.legend
          },
          size: {
            height: options.height
          },
          grid: {
            background: options.background
          },
          onresized: function() {
              if (window.innerWidth <= 768) {
                  chart.resize({height:220});
              }
              else {
                 chart.resize({height:340});
              }
          }
      };
      var animation = popily.chart.utils.initialAnimation(chartData, options)
      var chart = c3.generate(chartData); 
      animation.start(chart);

      return chart;
  };

  popilyChart.chartTypes.gauge = chart;
})(window);

(function(window) {
  var popilyChart = window.popily.chart;
  
  var pie = _.clone(popilyChart.baseChart);
  pie.defaultFor = [
    'ratio_by_category'
  ];
  pie.accepts = [
    'count_by_value',
    'count_by_category'
  ];

  pie.prepData = function(rawData, options) {
    var that = this;
    var limit = that.defaults.pieLimit;
    var cleanValues = that.cleanData(rawData);
    var order = options.order || 'auto';

    cleanValues = popilyChart.chartData.sortData(cleanValues[0],cleanValues[1],[],limit,order);

    var cleanXValues = cleanValues[0];
    var cleanYValues = popilyChart.format.formatNumbers(popilyChart.format.toNumber(cleanValues[1]));

    return [cleanXValues, cleanYValues];
  };

  pie.render = function(element, options, rawData) {
      var that = this;
      var chartPadding = that.defaults.chartPadding;
      var preppedData = this.prepData(rawData, options);
      var columns = _.zip(preppedData[0],preppedData[1]);

      var chartData = {
          bindto: element,
          data: {
              columns: columns,
              type: 'pie',
              order:null
          },
          color: {
              pattern: options.colors
          },
          legend: {
              position: 'bottom',
              show: preppedData[0].length < 20 ? true : false
          },
          size: {
            height: options.height
          },
          tooltip: (_.isUndefined(options.tooltip)?true:options.tooltip)
      };
      
      
      var animation = popily.chart.utils.initialAnimation(chartData, options);
      var chart = c3.generate(chartData); 
      animation.start(chart);

      return chart;
  };

  popilyChart.chartTypes.pie = pie;
})(window);

(function(window) {
  var popilyChart = window.popily.chart;
  
  var pie = _.clone(popilyChart.baseChart);
  pie.assignAxis = function(columns, calculation, options) {
      var axis = {};

      _.each(columns, function(column) {
          if(column.data_type === 'numeric') {
            axis.y = column;
          }
          else {
            axis.x = column;
          }
      });

      return axis;
  };

  pie.prepData = function(formattedData, options) {
    var that = this;
    var limit = that.defaults.pieLimit;
    var chartData = formattedData.chartData;
    var xValues = chartData.x.values;
    var yValues = chartData.y.values;
    var order = options.order || 'auto';

    cleanValues = popilyChart.chartData.sortData(xValues,yValues,[],limit,order);

    var cleanXValues = cleanValues[0];
    var cleanYValues = popilyChart.format.formatNumbers(popilyChart.format.toNumber(cleanValues[1]));

    return [cleanXValues, cleanYValues];
  };

  pie.render = function(element, options, formattedData) {
      var that = this;
      var preppedData = this.prepData(formattedData, options);
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
              show: preppedData[0].length < 20 ? _.isUndefined(options.legend) || options.legend : false
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

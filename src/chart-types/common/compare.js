(function(window) {
  var popilyChart = window.popily.chart;
  
  var chart = _.clone(popilyChart.baseChart);

  chart.assignAxis = function(columns, calculation, options) {
      var axis = {};

      _.each(columns, function(column) {
          if(column.data_type === 'category') {
            axis.z = column;
          }
          else if (options.xColumn && column.column_header === options.xColumn) {
            axis.x = column;
          }
          else if(!axis.y) {
            axis.y = column;
          }
          else if(!axis.x) {
            axis.x = column;
          }
      });

      return axis;
  };

  chart.prepData = function(formattedData, options) {
    var that = this;
    var limit = that.defaults.categoryLimit;
    var chartData = formattedData.chartData;
    var xValues = chartData.x.values;
    var yValues = chartData.y.values;
    var zValues = [];

    if(!_.isUndefined(chartData.z)) {
      zValues = chartData.z.values;
    }

    var order = options.order || 'auto';
    cleanValues = _.unzip(_.zip([xValues,yValues,zValues]).slice(0,5000))[0];
    var cleanXValues = popilyChart.format.toNumber(cleanValues[0]);
    var cleanYValues = popilyChart.format.toNumber(cleanValues[1]);

    cleanXValues = popilyChart.format.formatNumbers(cleanXValues);
    cleanYValues = popilyChart.format.formatNumbers(cleanYValues);
    var cleanZValues = cleanValues[2];
    if(zValues.length === 0 && chartData.metadata && chartData.metadata.rowlabels) {
      cleanZValues = chartData.metadata.rowlabels;
    }
    return [cleanXValues, cleanYValues, cleanZValues];
  };

  chart.render = function(element, options, columns, xs, xLabel, yLabel, tooltip, formattedData) {
      var chartPadding = {right: 10, top: 10};

      var chartData = {
          bindto: element,
          data: {
              xs: xs,
              columns: columns,
              type: 'scatter'
          },
          padding: this.defaults.chartPadding(),
          size: {
              height: options.height
          },
          point: {
            r: (options.pointSize || 4)
          },
          axis: {
              x: {
                  show: options.xAxis,
                  label: {
                      text: _.unescape(options.xLabel || xLabel),
                      position: 'inner-right',
                  },
                  tick: {
                      fit: false,
                      rotate: options.xRotation ||  45,
                      autorotate: !options.xRotation,
                      format: popily.chart.format.formatAxis(formattedData.chartData.x, options),
                  }
              },
              y: {
                  show: options.yAxis,
                  label: {
                      text: _.unescape(options.yLabel || yLabel),
                      position: 'outer-middle'
                  },
                  tick: {
                      format: popily.chart.format.formatAxis(formattedData.chartData.y, options, d3.format(",")),
                      rotate: options.yRotation ||  0,
                  }
              }
          },
          grid: {
            x: {
              show: _.isUndefined(options.xGrid)?true:options.xGrid
            },
            y: {
              show: _.isUndefined(options.yGrid)?true:options.yGrid
            },
            background: options.background
          },
          color: {
              pattern: options.colors
          },
          legend: {
              show: _.isUndefined(options.legend) || options.legend,
              position: 'outer-bottom',
          },
          tooltip: tooltip
      };

      var animation = popily.chart.utils.initialAnimation(chartData, options)
      var chart = c3.generate(chartData);
      chartData.bindto = element;
      
      animation.start(chart);
      
      return chart;
  };

  popilyChart.chartTypes.compare = chart;
})(window);

(function(window) {
  var popilyChart = window.popily.chart;
  
  var chart = _.clone(popilyChart.baseChart);

  chart.prepData = function(rawData, options) {
    var that = this;
    var limit = that.defaults.categoryLimit;
    var cleanValues = that.cleanData(rawData);

    var order = options.order || 'auto';
    cleanValues = _.unzip(_.zip(cleanValues).slice(0,5000))[0];
    var cleanXValues = popilyChart.format.toNumber(cleanValues[0]);
    var cleanYValues = popilyChart.format.toNumber(cleanValues[1]);

    cleanXValues = popilyChart.format.formatNumbers(cleanXValues);
    cleanYValues = popilyChart.format.formatNumbers(cleanYValues);
    var cleanZValues = cleanValues[2];
    if(!rawData.columns.z && rawData.chartData.metadata && rawData.chartData.metadata.rowlabels) {
      cleanZValues = rawData.chartData.metadata.rowlabels;
    }
    return [cleanXValues, cleanYValues, cleanZValues];
  };

  chart.render = function(element, options, columns, xs, xLabel, yLabel, tooltip) {
      var chartPadding = {right: 10, top: 10};

      var chartData = {
          bindto: element,
          data: {
              xs: xs,
              columns: columns,
              type: 'scatter'
          },
          padding: chartPadding,
          size: {
              height: options.height
          },
          point: {
            r: (options.pointSize || 4)
          },
          axis: {
              x: {
                  label: {
                      text: options.xLabel || xLabel,
                      position: 'outer-middle',
                  },
                  tick: {
                      fit: false,
                      rotate: 30
                  }
              },
              y: {
                  label: {
                      text: options.yLabel || yLabel,
                      position: 'outer-middle'
                  },
                  tick: {
                      format: d3.format(",")
                  }
              }
          },
          grid: {
            x: {
              show: _.isUndefined(options.xGrid)?true:options.xGrid
            },
            y: {
              show: _.isUndefined(options.yGrid)?true:options.yGrid
            }
          },
          color: {
              pattern: options.colors
          },
          legend: {
              position: 'outer-bottom',
              hide: true
          },
          tooltip: tooltip
      };

      var chart = c3.generate(chartData);
      chartData.bindto = element;
      this.chart = chart;
      popily.chart.utils.updateChart(element, chart, chartData, chartPadding);

      return this.chart;
  };

  popilyChart.chartTypes.compare = chart;
})(window);

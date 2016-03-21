(function(window) {
  var popilyChart = window.popily.chart;

  var chart = _.clone(popilyChart.baseChart);
  chart.defaultFor = [
    'count_by_date',
    'ratio_by_date',
    'average_by_date',
    'count_per_category_by_date',
    'average_per_category_by_date'
  ];
  chart.accepts = [];

  chart.prepData = function(rawData, options) {
    var that = this;
    var limit = that.defaults.categoryLimit;
    var cleanValues = that.cleanData(rawData);

    var order = options.order || 'auto';
    cleanValues = popilyChart.dataset.sortData(cleanValues[0],cleanValues[1],[],limit,order);

    var cleanXValues = cleanValues[0];
    var cleanYValues = popilyChart.format.formatNumbers(cleanValues[1]);

    return [cleanXValues, cleanYValues];
  };

  chart.render = function(element, options, rawData) {
      var preppedData = this.prepData(rawData, options);
      var xValues = preppedData[0];
      var yValues = preppedData[1];
      var xLabel = rawData.chartData.x.label;
      var yLabel = rawData.chartData.y.label;

    
      var yMin = 0;
      var lowestY = _.min(yValues);
      if(lowestY < 0) {
          yMin = lowestY;
      }

      yValues.unshift(yLabel);

      var dayDiff = popily.chart.format.daysDiff(xValues); 
      var tickFormatStr = popily.chart.format.formatFromDayDiff(dayDiff);
      
      var interval = options.interval;

      var dateFormatStr = popily.chart.format.formatFromInterval(interval);
      if(_.isUndefined(interval)) {
        dateFormatStr = popily.chart.format.formatFromInspection(xValues);
      }
      
      var dateFormat = d3.time.format(dateFormatStr);
      var tickFormat = d3.time.format(tickFormatStr);
      var fullFormat = d3.time.format('%Y-%m-%d %H:%M:%S');

      var ticksValues = popily.chart.format.tickFormatValues(xValues, tickFormatStr, dateFormat);
      
      if(dateFormat != fullFormat)
          xValues = _.map(xValues, function(d) {
                  return dateFormat(fullFormat.parse(d.split('.')[0]));
              });
          
      xValues.unshift('x');

      var chartPadding = {right: 10, top: 10};

      var chartData = {
          bindto: element,
          data: {
              x: 'x',
              xFormat: dateFormatStr, // 'xFormat' can be used as custom format of 'x'
              columns: [xValues,yValues]
          },
          padding: chartPadding,
          axis: {
              x: {
                  type: options.order == 'auto' ? 'timeseries' : 'category',
                  tick: {
                      fit: false,
                      format: tickFormatStr,
                      rotate:30,
                      multiline: false,
                      height: 130
                  },
                  label: {
                     text: xLabel,
                     position: 'inner-right'
                  }
              },
              y: {
                  show: true,
                  min: yMin,
                  label: {
                      text: yLabel,
                      position: 'outer-middle'
                  },
                  tick: {
                      format: d3.format(",")
                  }
              }
          },
          color: {
              pattern: options.colors
         },
          legend: {
              hide: true
          },
          size: {
              height: options.size.height
          },
          line: {
              connectNull: true
          },
          grid: {
              x: {
                  show: false
              },
              y: {
                  show: true
              }
          }
      }

      if(options.order == 'auto') {
        chartData.tooltip.format = {
          title: function(d) {
            return dateFormat(d);
          } 
        }

        chartData.axis.x.tick.values = ticksValues;
      }

      var chart = c3.generate(chartData);
      this.chart = chart;

      popily.chart.format.updateChart(element, chart, chartData, chartPadding);

      return this.chart;
  };

  popilyChart.chartTypes.line = chart;
})(window);

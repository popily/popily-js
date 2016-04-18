(function(window) {
  var popilyChart = window.popily.chart;

  var chart = _.clone(popilyChart.baseChart);
  chart.defaultFor = [
    'count_by_datetime',
    'ratio_by_datetime',
    'average_by_datetime',
    'count_per_category_by_datetime',
    'average_per_category_by_datetime'
  ];
  chart.accepts = [];

  chart.prepData = function(rawData, options) {
    var that = this;
    var limit = that.defaults.categoryLimit;
    var cleanValues = that.cleanData(rawData);

    var order = options.order || 'auto';
    cleanValues = popilyChart.chartData.sortData(cleanValues[0],cleanValues[1],[],limit,order);

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
      
      var interval = options.interval || rawData.insight_metadata.intervals[0];

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

      if(!_.isUndefined(options.lineSize)) {
        var style = popily.chart.utils.createStyleElement('.'+options.uniqueClassName+' .c3-line { stroke-width: '+options.lineSize+'px; }')
        element.parentNode.appendChild(style);
      }

      var tooltip = (_.isUndefined(options.tooltip)?true:options.tooltip);
      if(tooltip && (!options.order || options.order == 'auto') ) {
        tooltip = {
          title: function (d) {
            return dateFormat(d);
          }
        }
      }

      var chartData = {
          bindto: element,
          data: {
              x: 'x',
              xFormat: dateFormatStr, // 'xFormat' can be used as custom format of 'x'
              columns: [xValues,yValues]
          },
          padding: this.defaults.chartPadding(),
          axis: {
              x: {
                  type: (!options.order || options.order == 'auto' ? 'timeseries' : 'category'),
                  tick: {
                      fit: false,
                      format: tickFormatStr,
                      rotate: options.xRotation ||  45,
                      autorotate: !options.xRotation,
                      multiline: false,
                      //height: 130,
                      values: (!options.order || options.order == 'auto' ? ticksValues : null),
                      count: xValues.length-1
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
              show: !_.isUndefined(options.legend) && options.legend
          },
          size: {
              height: options.height
          },
          line: {
              connectNull: true
          },
          point: {
            r: (options.pointSize || 2.5)
          },
          grid: {
            x: {
              show: _.isUndefined(options.xGrid)?false:options.xGrid
            },
            y: {
              show: _.isUndefined(options.yGrid)?true:options.yGrid
            }
          },
          tooltip: tooltip
      }
      
      var tooltip = (_.isUndefined(options.tooltip)?true:options.tooltip);
      if(tooltip && (!options.order || options.order == 'auto') ) {
        chartData.tooltip.format = {
          title: function(d) {
            return dateFormat(d);
          } 
        }
        chartData.axis.x.tick.values = ticksValues;
      }


      var animation = popily.chart.utils.initialAnimation(chartData, options);
      var chart = c3.generate(chartData);

      animation.start(chart);
      
      return chart;
  };

  popilyChart.chartTypes.line = chart;
})(window);

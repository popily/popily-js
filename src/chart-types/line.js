(function(window) {
  var popilyChart = window.popily.chart;

  var chart = _.clone(popilyChart.baseChart);
  
  chart.assignAxis = function(columns, calculation, options) {
      var axis = {};
      var typePattern = popilyChart.analyze.getTypePattern(columns);

      if(typePattern === 'numeric,numeric') {
        axis.y = {
            column_header: calculation.charAt(0).toUpperCase() + calculation.slice(1).toLowerCase(),
            values: _.map(columns, function(column) { return column.values[0] }),
            data_type: 'numeric'
        }
        axis.x = {
            column_header: 'Columns',
            values: _.map(columns, function(column) { return column.column_header }),
            data_type: 'category'
        }
      }
      else {
        _.each(columns, function(column) {
            if(column.data_type === 'numeric') {
              axis.y = column;
            }
            else {
              axis.x = column;
            }
        });
      }

      return axis;
  };

  chart.prepData = function(formattedData, options) {
    var that = this;
    var limit = that.defaults.categoryLimit;
    var chartData = formattedData.chartData;
    var xValues = chartData.x.values;
    var yValues = chartData.y.values;

    var order = options.order || 'auto';
    sortedValues = popilyChart.chartData.sortData(xValues,yValues,[],limit,order);

    var cleanXValues = sortedValues[0];
    var cleanYValues = popilyChart.format.formatNumbers(sortedValues[1]);

    return [cleanXValues, cleanYValues];
  };

  chart.render = function(element, options, formattedData) {
      var preppedData = this.prepData(formattedData, options);
      var xValues = preppedData[0];
      var yValues = preppedData[1];
      var xLabel = options.xLabel || formattedData.chartData.x.label;
      var yLabel = options.yLabel || formattedData.chartData.y.label;

    
      var yMin = 0;
      var lowestY = _.min(yValues);
      if(lowestY < 0) {
          yMin = lowestY;
      }

      yValues.unshift(yLabel);
      
      var variation = options.variation || formattedData.chartData.defaultVariation;
      var ticksValues = xValues;

      if(variation) {
        var dayDiff = popily.chart.format.daysDiff(xValues); 
        var tickFormatStr = popily.chart.format.formatFromDayDiff(dayDiff);

        var dateFormatStr;
        if (variation !== 'raw') {
          dateFormatStr = popily.chart.format.formatFromInterval(variation);
        } else {
          dateFormatStr = popily.chart.format.formatFromInspection(xValues);
        }
        var dateFormat = d3.time.format(dateFormatStr);
        var tickFormat = d3.time.format(tickFormatStr);
        var fullFormat = d3.time.format('%Y-%m-%d %H:%M:%S');

        ticksValues = popily.chart.format.tickFormatValues(xValues, tickFormatStr, dateFormat);
        
        if(dateFormat != fullFormat)
            xValues = _.map(xValues, function(d) {
                    return dateFormat(fullFormat.parse(d.split('.')[0]));
                });
      }
          
      xValues.unshift('x');

      if(!_.isUndefined(options.lineSize)) {
        var style = popily.chart.utils.createStyleElement('.'+options.uniqueClassName+' .c3-line { stroke-width: '+options.lineSize+'px; }')
        element.parentNode.appendChild(style);
      }

      var tooltip = (_.isUndefined(options.tooltip)?true:options.tooltip);
      if(tooltip && (!options.order || options.order == 'auto') ) {
        tooltip = {
          title: function (d) {
            if(variation) {
              return dateFormat(d);
            }
            return d;
          }
        }
      }

      var xTickType = (function() {

      })();

      var chartData = {
          bindto: element,
          data: {
              x: 'x',
              columns: [xValues,yValues]
          },
          padding: this.defaults.chartPadding(),
          axis: {
              x: {
                  show: options.xAxis,
                  type: (function() {
                    if (variation) {
                      if (!options.order || options.order === 'auto') {
                        return 'timeseries';
                      }
                    }
                    return 'category';
                  })(),
                  tick: {
                      fit: false,
                      rotate: options.xRotation ||  45,
                      autorotate: !options.xRotation,
                      multiline: false                      
                  },
                  label: {
                     text: xLabel,
                     position: 'inner-right'
                  }
              },
              y: {
                  show: options.yAxis,
                  min: yMin,
                  label: {
                      text: yLabel,
                      position: 'outer-middle'
                  },
                  tick: {
                      rotate: options.yRotation ||  0,
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
            },
            background: options.background
          },
          tooltip: tooltip
      }

      
      if (variation) {
        chartData.data.xFormat = dateFormatStr; // 'xFormat' can be used as custom format of 'x'
        chartData.axis.x.tick.format = popily.chart.format.formatAxis(formattedData.chartData.x, options, tickFormat);
        chartData.axis.x.tick.values = (!options.order || options.order == 'auto' ? ticksValues : null);
        chartData.axis.x.tick.count = xValues.length-1;
        chartData.axis.y.tick.format = popily.chart.format.formatAxis(formattedData.chartData.y, options, d3.format(","));
      }
      else {
        chartData.axis.x.tick.count = xValues.length-1;
        chartData.axis.x.values = ticksValues;
      }
      
      
      var tooltip = (_.isUndefined(options.tooltip)?true:options.tooltip);
      if(tooltip && (!options.order || options.order == 'auto') ) {
        chartData.tooltip.format = {
          title: function (d) {
            if(variation) {
              return dateFormat(d);
            }
            return ticksValues[d+1];
          } 
        }
        // chartData.axis.x.tick.values = ticksValues;
      }

      var animation = popily.chart.utils.initialAnimation(chartData, options);
      var chart = c3.generate(chartData);

      animation.start(chart);
      
      return chart;
  };

  popilyChart.chartTypes.line = chart;
})(window);

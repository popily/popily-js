(function(window) {
  var popilyChart = window.popily.chart;
  var chart = _.clone(popilyChart.baseChart);

  chart.prepData = function(formattedData, options) {
    var that = this;
    var limit = that.defaults.categoryLimit;
    var chartData = formattedData.chartData;
    var xValues = chartData.x.values;
    var yValues = chartData.y.values;
    var zValues = [];
    if(chartData.hasOwnProperty('z')) {
        zValues = chartData.z.values;
    }

    yValues = popily.chart.chartData.cleanNanToZero(yValues)

    var order = options.order || 'auto';
    cleanValues = popilyChart.chartData.sortData(xValues,yValues,zValues,0,order);

    var cleanXValues = cleanValues[0];
    var cleanYValues = popilyChart.format.formatNumbers(cleanValues[1]);
    var cleanZValues = cleanValues[2];

    return [cleanXValues, cleanYValues, cleanZValues];
  };

  chart.getYMin = function(yValues) {
    var yMin = 0;
    var lowestY = _.min(yValues);
    if(lowestY < 0) {
        yMin = lowestY;
    }

    return yMin;
  };

  chart.getChartObject = function(kwargs) {
    var element = kwargs.element;
    var data = kwargs.data;
    var xLabel = kwargs.xLabel;
    var yLabel = kwargs.yLabel;
    var yMin = kwargs.yMin;
    var options = kwargs.options;
    var dateFormatStr = kwargs.dateFormatStr;
    var chartPadding = kwargs.chartPadding;
    var variation = kwargs.variation;
    var ticksValues = kwargs.ticksValues;
    var tickFormatStr = kwargs.tickFormatStr;
    var tickFormat = d3.time.format(tickFormatStr);
    var formattedData = kwargs.formattedData;
    
    var y2 = false;
    var y2Column = null;
    var y2Label = '';
    var axes = {};
    
    var numerics = formattedData.chartData.columns.filter(function(c) { return c.dataType=='numeric'});
    if(numerics.length>1 && options.y2Axis) {
      y2Column = numerics[1];
      y2 = true;
      y2Label = y2Column.label;
      axes[y2Label] = 'y2';
    }
    
    var chartData = {
        bindto: element,
        data: {
            x: 'x',
            columns: data.columns,
            xFormat: dateFormatStr,
            axes: axes
        },
        padding: chartPadding,
        axis: {
            x: {
                show: options.xAxis,
                type: (!options.order || options.order == 'auto' ? 'timeseries' : 'category'),
                tick: {
                    fit: false,
                    format: popily.chart.format.formatAxis(formattedData.chartData.x, options, tickFormat),
                    rotate: _.isUndefined(options.xRotation)?45:options.xRotation,
                    autorotate: _.isUndefined(options.xRotation),
                    centered: true,
                    values: (!options.order || options.order == 'auto' ? ticksValues : null),
                    count: ticksValues.length
                },
                label: {
                    text: options.xLabel || xLabel,
                    position: 'inner-right'
                }
            },
            y: {
                show: options.yAxis,
                min: yMin,
                label: {
                    text: options.yLabel || yLabel,
                    position: 'outer-middle'
                },
                tick: {
                    rotate: options.yRotation ||  0,
                    autorotate: _.isUndefined(options.yRotation),
                    format: popily.chart.format.formatAxis(formattedData.chartData.y, options, d3.format(",")),
                },
                padding: {top:0, bottom:0}
            },
            y2: {
                show: y2,
                label: {
                    text: options.y2Label || y2Label,
                    position: 'outer-middle'
                },
                tick: {
                    rotate: options.yRotation ||  0,
                    autorotate: _.isUndefined(options.y2Rotation),
                    format: popily.chart.format.formatAxis(y2Column, options, d3.format(",")),
                }
            }
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
        color: {
            pattern: options.colors
        },
        point: {
          r: (options.pointSize || 2.5)
        },
        legend: {
            position: 'bottom',
            show: !_.isUndefined(options.legend) && options.legend
        },
        size: {
            height: options.height
        }
    }
    
    var tooltip = (_.isUndefined(options.tooltip)?true:options.tooltip);
    if(tooltip && (!options.order || options.order == 'auto') ) {
      var dateFormat = d3.time.format(dateFormatStr);
      chartData.tooltip = {
        show: true,
        format: {
          title: function(d) {
            return dateFormat(d);
          } 
        }
      }
      chartData.axis.x.tick.values = ticksValues;
    }

    return chartData;
  };

  chart.formatDates = function(xValues, data, options) {
    var dayDiff = popily.chart.format.daysDiff(xValues); 
    var tickFormatStr = popily.chart.format.formatFromDayDiff(dayDiff);
    
    var variation = options.variation;

    var dateFormatStr = popily.chart.format.formatFromInterval(variation);
    if(_.isUndefined(variation)) {
      dateFormatStr = popily.chart.format.formatFromInspection(xValues);
    }

    var dateFormat = d3.time.format(dateFormatStr);
    var tickFormat = d3.time.format(tickFormatStr);
    var fullFormat = d3.time.format('%Y-%m-%d %H:%M:%S');

    var ticksValues = popily.chart.format.tickFormatValues(xValues, tickFormatStr, dateFormat);
    
    if(dateFormat != fullFormat)
      data.categories = _.map(data.categories, function(d) {
          return dateFormat(fullFormat.parse(d.split('.')[0]));
      });

    return {
      dateFormatStr: dateFormatStr,
      tickFormatStr: tickFormatStr,
      ticksValues: ticksValues
    }
  };

  chart.render = function(element, options, formattedData, grouped) {
      var that = this;
      var preppedData = that.prepData(formattedData, options);
      var xValues = preppedData[0];
      var yValues = preppedData[1];
      var zValues = preppedData[2];
      var xLabel = formattedData.chartData.x.label;
      var yLabel = formattedData.chartData.y.label;

      options.variation = options.variation || formattedData.chartData.metadata.intervals[0];
      var yMin = that.getYMin(yValues);
            
      var data = popilyChart.chartData.c3ify(xValues,yValues,zValues);
      var dateData = that.formatDates(xValues, data, options);

      data.categories.unshift('x');
      data.columns.unshift(data.categories); 
      var chartPadding = that.defaults.chartPadding;
      var kwargs = {
        element: element,
        data: data,
        xLabel: xLabel,
        yLabel: yLabel,
        yMin: yMin,
        options: options, 
        dateFormatStr: dateData.dateFormatStr,
        chartPadding: chartPadding,
        tickFormatStr: dateData.tickFormatStr,
        ticksValues: dateData.ticksValues,
        formattedData: formattedData
      };
      var chartData = that.getChartObject(kwargs);
      chartData.tooltip.grouped = (function() {
          if(_.uniq(zValues).length > 20) {
              return false;
          }
          else {
              return true;
          }
      })();

      if(!_.isUndefined(options.lineSize)) {
        var style = popily.chart.utils.createStyleElement('.'+options.uniqueClassName+' .c3-line { stroke-width: '+options.lineSize+'px; }')
        element.parentNode.appendChild(style);
      }

      if(grouped) {
        chartData.data.type = 'area';
        chartData.data.groups = [data.groups];
        if(data.groups.length < 5)
          chartData.tooltip.grouped = true;
      }
      
      
      animation = popily.chart.utils.initialAnimation(chartData, options);
      var chart = c3.generate(chartData);
      chart = popily.chart.utils.updateChart(element, chart, chartData, chartPadding);
      
      animation.start(chart);
      
      return chart;
  };

  popilyChart.chartTypes.linear = chart;
})(window);

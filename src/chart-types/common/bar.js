(function(window) {
  var popilyChart = window.popily.chart;
  var chart = _.clone(popilyChart.baseChart);

  chart.assignAxis = function(columns, calculation, options) {
      var axis = {};

      var numerics = _.where(columns,{data_type:'numeric' });

      // Reorganize the columns to use the column headers as the groupby 
      // variable.
      if(numerics.length > 1) {
        var xColumn = _.find(columns, function(column) { 
                          var dataType = column.data_type;
                          return dataType === 'datetime' || dataType === 'category';
                      });
        var firstNumeric = numerics.shift();
        var x = xColumn;
        var y = firstNumeric;
        var z = {
          column_header: 'Columns',
          data_type: 'category',
          values: _.map(firstNumeric.values,function(val) { return firstNumeric.column_header })
        };

        _.each(numerics, function(numeric) {
            for(var i=0;i<numeric.values.length;i++) {
              x.values.push(x.values[i]);
              y.values.push(numeric.values[i]);
              z.values.push(numeric.column_header);
            }
        });
      }
      else {
        var x,y,z;
        y = popilyChart.analyze.getColumnForType(columns, 'numeric');
        
        // put the datetime on the x if we can
        x = popilyChart.analyze.getColumnForType(columns, 'datetime');

        if(x) {
          z = popilyChart.analyze.getColumnForType(columns, 'category');
        }
        else {
          // No datetime, so can group on either
          var groupers = _.filter(columns, function(column) { 
                          var dataType = column.data_type;
                          return dataType === 'category';
                      });

          // smaller groups and more dense x looks better than lots of 
          // groups and only a few xs.
          if(_.uniq(groupers[0].values).length > _.uniq(groupers[1].values).length) {
            x = groupers[0];
            z = groupers[1];
          }
          else {
            x = groupers[1];
            z = groupers[0];
          }
        }

      }

      // Reassign based on user preference if necessary
      if(options.groupByColumn && options.groupByColumn === x.column_header) {
        axis.z = x;
        axis.x = z;
      }
      else if(options.xColumn && options.xColumn === z.column_header) {
        axis.x = z;
        axis.z = x;
      }
      else {
        axis.x = x;
        axis.z = z;
      }
      axis.y = y;

      return axis;
  };

  chart.prepData = function(formattedData, options, group) {
    var that = this;
    var limit = that.defaults.categoryLimit;
    var chartData = formattedData.chartData;
    var xValues = chartData.x.values;
    var yValues = chartData.y.values;
    var zValues = [];
    if(chartData.hasOwnProperty('z')) {
        zValues = chartData.z.values;
    }
    var values = [xValues,yValues,zValues];

    // Check if every x value has ' to ' in it. This is kind of cheating 
    // to see if it's a list of value ranges (eg '1 to 10') and needs 
    // to be ordered as such.
    if(_.every(xValues, function(x) { return x.indexOf(' to ') > -1 })) {
        var rangeBottoms = _.map(xValues, function(x) {
            return parseFloat(x.split(' to ')[0]);
        });

        values.push(rangeBottoms);
        var cleanZipped = _.zip(values[0],values[1],values[2],values[3]);
        zipped = _.sortBy(cleanZipped, function(t){ 
                            return t[3]; 
                        });
        values = _.first(_.unzip(zipped),limit);        
    }
    else {
        var order = options.order || 'auto';
        values = popilyChart.chartData.sortData(values[0],values[1],values[2],limit,order);
    }

    xValues = values[0];
    
    // Format date strings just in case we're working with dates.
    if(chartData.x.dataType.indexOf('date') > -1 && _.every(xValues, popilyChart.chartData.checkIsDateStr)) {
      var dateFormatStr = popilyChart.format.formatFromInspection(xValues);
      var dateFormat = d3.time.format(dateFormatStr);
      xValues = _.map(xValues, function(x) { return dateFormat((new Date(x))); });
    }

    // Format y values as numbers
    yValues = popilyChart.format.formatNumbers(values[1]);
    zValues = values[2];

    return [xValues, yValues, zValues];
  };

  chart.getChartObject = function(kwargs) {
    var that = this;
    var element = kwargs.element;
    var data = kwargs.data;
    var zValues = kwargs.zValues;
    var xLabel = kwargs.xLabel;
    var yLabel = kwargs.yLabel;
    var options = kwargs.options;
    var rotated = kwargs.rotated;
    var formattedData = kwargs.formattedData;

    rotated = options.rotated || rotated;
    var y2 = false;
    var y2Label = '';
    var axes = {};
    
    var numerics = formattedData.chartData.columns.filter(function(c) { return c.dataType=='numeric'});
    if(numerics.length>1 && options.y2Axis) {
      var y2 = true;
      y2Label = numerics[1].label;
      axes[y2Label] = 'y2';
    }
    
    var chartData = {
      bindto: element,
      data: {
          columns: data.columns,
          type: 'bar',
          axes: axes
      },
      padding: that.defaults.chartPadding(),
      axis: {
          x: {
              show: options.xAxis,
              type: 'category',
              categories: data.categories,
              tick: {
                  rotate: options.xRotation ||  45,
                  autorotate: !options.xRotation,
                  multiline: false,
                  format: popily.chart.format.formatAxis(formattedData.chartData.x, options)
              },
              label: {
                 text: options.xLabel || xLabel,
                 position: rotated?'outer-middle':'inner-right',
              },
          },
          y: {
              show: options.yAxis,
              label: {
                  text: options.yLabel || yLabel,
                  position: rotated?'inner-right':'outer-middle'
              },
              tick: {
                  format: popily.chart.format.formatAxis(formattedData.chartData.y, options, d3.format(",")),
                  rotate: options.yRotation ||  0,
              }
          },
          y2: {
              show: y2,
              label: {
                  text: options.y2Label || y2Label,
                  position: 'outer-middle'
              },
              tick: {
                  format: popily.chart.format.formatAxis(formattedData.chartData.y, options, d3.format(",")),
                  rotate: options.yRotation ||  0,
              }
          },
          rotated: rotated
      },
      color: {
          pattern: options.colors
      },
      legend: {
          position: 'bottom',
          show: (!_.isUndefined(options.legend) ? options.legend : (function() {
            if(zValues.length < 50) {
              return true; 
            }
            return false;
          })())
      },
      tooltip: {
          show: (_.isUndefined(options.tooltip)?true:options.tooltip),
          grouped: false,
      },
      size: {
          height: options.height
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
      bar: {
        width: {
          ratio: (options.barSize || 0.9)
        }
      },
      onresized: function() {
        console.log(1);
      }
    };
    return chartData;
  };

  chart.updateSpecials = function(element, rotated, options) {
      
  }

  popilyChart.chartTypes.barCommon = chart;
})(window);

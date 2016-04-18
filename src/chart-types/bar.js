(function(window) {
  var popilyChart = window.popily.chart;
  
  var bar = _.clone(popilyChart.baseChart);

  bar.assignAxis = function(columns, calculation, options) {
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

  bar.render = function(element, options, formattedData) {
      var that = this;
      var preppedData = popilyChart.chartTypes.barCommon.prepData(formattedData, options);
      var xValues = preppedData[0];
      var yValues = preppedData[1];
      var chartData = formattedData.chartData;

      var chart;
        
      var rotated = options.rotated || false;
      //if(insight.options_rotate)
      //  rotated = true;
      if(yValues.length > 40) {
        rotated = true;
      }

      if(rotated == true) {
        if(yValues.length > 40)
          options.height = (yValues.length * 9) + 450;
      }

      var yLabel = chartData.y.label;
      yValues.unshift(yLabel);
      
      var chartData = {
        data: {
          columns: [yValues],
          type: 'bar'
        },
        bar: {
          width: {
            ratio: (options.barSize || 0.7)
          }
        },
        padding: that.defaults.chartPadding(),
        axis: {
          x: {
            type: 'category',
            categories: xValues,
            tick: {
              rotate: options.xRotation ||  45,
              autorotate: !options.xRotation,
              multiline: false,
              fit: true
            },
            label: {
              text: options.xLabel || chartData.x.label,
              position: rotated?'outer-middle':'inner-right',
            }
          },
          y: {
            show: true,
            label: {
              text: options.yLabel || yLabel,
              position: rotated?'inner-right':'outer-middle'
            },
            tick: {
              format: d3.format(",")
            }
          },
          rotated: rotated
        },
        color: {                
          pattern: options.colors
        },       
        legend: {
          show: !_.isUndefined(options.legend) && options.legend,
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
          }
        },
        tooltip: (_.isUndefined(options.tooltip)?true:options.tooltip),
        onresized: function() {
          popilyChart.chartTypes.barCommon.updateSpecials(element, rotated, options);
        }
      }
    
      chartData.bindto = element;
      var animation = popily.chart.utils.initialAnimation(chartData, options);
      
      var chart = c3.generate(chartData);

      animation.start(chart, function() {
        popilyChart.chartTypes.barCommon.updateSpecials(element, rotated, options);
      });
      
      return chart;
  };

  popilyChart.chartTypes.bar = bar;
})(window);

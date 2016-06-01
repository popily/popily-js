(function(window) {
  var popilyChart = window.popily.chart;
  
  var bar = _.clone(popilyChart.baseChart);

  bar.assignAxis = function(columns, calculation, options) {
      var axis = {};
      var typePattern = popilyChart.analyze.getTypePattern(columns);
      var numerics = _.where(columns,{data_type:'numeric' });

      if(numerics.length === columns.length) {
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
      var height = 500;

      var chart;
        
      var rotated = options.rotated || false;
      //if(insight.options_rotate)
      //  rotated = true;
      if(yValues.length > 40 && (_.isNull(options.rotated) || options.rotated === true)) {
        rotated = true;
      }

      if(rotated === true) {
        if(yValues.length > 40)
          height = (yValues.length * 9) + 450;
      }

      var yLabel = formattedData.chartData.y.label;
      yValues.unshift(options.yLabel || yLabel);
      
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
            show: options.xAxis,
            type: 'category',
            categories: xValues,
            tick: {
              format: popily.chart.format.formatAxis(formattedData.chartData.x, options),
              multiline: false,
              fit: true
            },
            label: {
              text: options.xLabel || formattedData.chartData.x.label,
              position: rotated?'outer-middle':'inner-right',
            }
          },
          y: {
            show: options.yAxis,
            label: {
              text: options.yLabel || yLabel,
              position: rotated?'inner-right':'outer-middle'
            },
            tick: {
              format: popily.chart.format.formatAxis(formattedData.chartData.y, options, d3.format(",")),
              rotate: options.yRotation || 0,
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
          height: options.height || height
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
        tooltip: (_.isUndefined(options.tooltip)?true:options.tooltip),
        onresized: function() {
          popilyChart.chartTypes.barCommon.updateSpecials(element, rotated, options);
        }
      };

      chartData.axis.x.tick.autorotate = false;
      if (_.isNull(options.xRotation) || !options.xRotation) {
        chartData.axis.x.tick.autorotate = true;
      }
      else if(_.isNumber(options.xRotation)) {
        chartData.axis.x.tick.rotate = options.xRotation;
      }
      else {
        chartData.axis.x.tick.rotate = 45;
      }

      chartData.bindto = element;
      var animation = popily.chart.utils.initialAnimation(chartData, options);
      
      var chart = c3.generate(chartData);

      animation.start(chart, function() {
        popilyChart.chartTypes.barCommon.updateSpecials(element, rotated, options);
      });
      
      options.rotated = rotated;
      return chart;
  };

  popilyChart.chartTypes.bar = bar;
})(window);

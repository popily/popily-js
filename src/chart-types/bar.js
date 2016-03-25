(function(window) {
  var popilyChart = window.popily.chart;
  
  var bar = _.clone(popilyChart.baseChart);
  bar.defaultFor = [
  ];
  bar.accepts = [
    'count_by_datetime',
    'ratio_by_datetime',
    'sum_by_datetime',
    'average_by_datetime',
    'count_per_category_by_datetime',
    'average_per_category_by_datetime',
    'count_per_category_by_category',
    'count_by_category_by_category_distinct',
    'count_by_value',
    'count_by_category',
    'average_by_category',
    'sum_by_category',

    'count_by_state',
    'average_by_state',
    'sum_by_state',

    'count_by_country',
    'average_by_country',
    'sum_by_country',

    'sum_sum_by_category',
    'sum_by_category_per_category',
    'average_by_category_per_category',
    'count_by_category_per_category',
    'count_per_category_by_category',
    'count_by_category_by_datetime_distinct',
    'top_by_rowlabel'
  ];


  bar.render = function(element, options, rawData) {
      var that = this;
      var preppedData = popilyChart.chartTypes.barCommon.prepData(rawData, options);
      var xValues = preppedData[0];
      var yValues = preppedData[1];

      var chart;
        
      var rotated = false;
      //if(insight.options_rotate)
      //  rotated = true;
      if(yValues.length > 40) {
        rotated = true;
      }

      if(rotated == true) {
        if(yValues.length > 40)
          options.height = (yValues.length * 9) + 450;
      }

      var yLabel = rawData.chartData.y.label;
      yValues.unshift(yLabel);

      var chartPadding = that.defaults.chartPadding;

      var chartData = {
        data: {
          columns: [yValues],
          type: 'bar'
        },
        bar: {
          width: {
            ratio: .7
          }
        },
        axis: {
          x: {
            type: 'category',
            categories: xValues,
            tick: {
              rotate: 45,
              multiline: false,
              height: 130,
              fit: true
            },
            label: {
              text: options.xLabel || rawData.chartData.x.label,
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
          show: false
        },
        size: {
          height: options.height
        },
        grid: {
          x: {
            show: false
          },
          y: {
            show: true
          }
        },
        tooltip: (_.isUndefined(options.tooltip)?true:options.tooltip)

      }
    
      chartData.bindto = element;
      var chart = c3.generate(chartData);
      this.chart = chart;
      popily.chart.utils.updateChart(element, chart, chartData, chartPadding);

      return this.chart;
  };

  popilyChart.chartTypes.bar = bar;
})(window);

(function(window) {
  var popilyChart = window.popily.chart;
  var chart = _.clone(popilyChart.baseChart);
  chart.defaultFor = [
    'average_per_category_by_category',
    'sum_per_category_by_category',
    'count_by_value_by_category',
    'average_by_category_by_category',
  ];
  chart.accepts = [];

  chart.render = function(element, options, rawData) {
      var that = this;
      var preppedData = popilyChart.chartTypes.barCommon.prepData(rawData, options, true);
      var xValues = preppedData[0];
      var yValues = preppedData[1];
      var zValues = preppedData[2];
      var xLabel = rawData.chartData.x.label;
      var yLabel = rawData.chartData.y.label;

      var data = popilyChart.dataset.c3ify(xValues,yValues,zValues);
      var rotated = false;
      if(data.columns.length > 25) {
          rotated = true;
      }

      var chartData = {
          bindto: element,
          data: {
              columns: data.columns,
              type: 'bar'
          },
          padding: that.defaults.chartPadding,
          axis: {
              x: {
                  type: 'category',
                  categories: data.categories,
                  tick: {
                      rotate: 30,
                      multiline: false,
                      height: 130
                  },
                  label: {
                     text: xLabel,
                     position: rotated?'outer-middle':'inner-right',
                  }
              },
              y: {
                  show: true,
                  label: {
                      text: yLabel,
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
              position: 'bottom',
              show: zValues.length < 50 ? true : false
          },
          tooltip: {
              show: true,
              grouped: false,
          },
          size: {
              height: options.size.height
          },
          bar: {
            width: {
              ratio: .9
            }
          }
      }

      var chart = c3.generate(chartData);
      this.chart = chart;

      popily.chart.format.updateChart(element, chart, chartData, that.defaults.chartPadding);

      return this.chart;
  };

  popilyChart.chartTypes.barGrouped = chart;
})(window);

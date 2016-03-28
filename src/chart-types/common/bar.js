(function(window) {
  var popilyChart = window.popily.chart;
  var chart = _.clone(popilyChart.baseChart);

  chart.prepData = function(rawData, options, group) {
    var that = this;
    var limit = that.defaults.categoryLimit;
    var cleanValues = that.cleanData(rawData);

    var analysisTypeCheck = 'count_by_value';
    if(group) {
      analysisTypeCheck = 'count_by_value_by_category';
    }

    if(rawData.analysisType == analysisTypeCheck) {
        var rangeBottoms = _.map(cleanValues[0], function(x) {
            return parseFloat(x.split(' to ')[0]);
        });

        cleanValues.push(rangeBottoms);
        var cleanZipped = _.zip(cleanValues[0],cleanValues[1],cleanValues[2],cleanValues[3]);
        cleanZipped = _.sortBy(cleanZipped, function(t){ 
                            return t[3]; 
                        });
        cleanValues = _.first(_.unzip(cleanZipped),limit);        
    }
    else {
        var order = options.order || 'auto';
        cleanValues = popilyChart.chartData.sortData(cleanValues[0],cleanValues[1],cleanValues[2],limit,order,cleanValues[3]);
    }

    var cleanXValues = cleanValues[0];
    
    if(rawData.analysisType.indexOf('date') > -1 && _.every(cleanXValues, popilyChart.chartData.checkIsDateStr)) {
      var dateFormatStr = popilyChart.format.formatFromInspection(cleanXValues);
      var dateFormat = d3.time.format(dateFormatStr);
      cleanXValues = _.map(cleanXValues, function(x) { return dateFormat((new Date(x))); });
    }

    var cleanYValues = popilyChart.format.formatNumbers(cleanValues[1]);
    var cleanZValues = cleanValues[2];
    var cleanZ2Values = cleanValues[3];

    return [cleanXValues, cleanYValues, cleanZValues, cleanZ2Values];
  };

  chart.getChartObject = function(kwargs) {
    var that = this;
    var element = kwargs.element;
    var data = kwargs.data;
    var zValues = kwargs.zValues;
    var z2Values = kwargs.z2Values;
    var xLabel = kwargs.xLabel;
    var yLabel = kwargs.yLabel;
    var options = kwargs.options;
    var rotated = kwargs.rotated;

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
                 text: options.xLabel || xLabel,
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
          rotated: options.rotated || rotated
      },
      color: {
          pattern: options.colors
      },
      legend: {
          position: 'bottom',
          show: (function() {
            if(options.showLegend) {
              return true;
            }
            if(z2Values && z2Values.length > 0) {
              return true;
            }
            if(zValues.length < 50) {
              return true; 
            }

            return false;
          })()
      },
      tooltip: {
          show: (_.isUndefined(options.tooltip)?true:options.tooltip),
          grouped: false,
      },
      size: {
          height: options.height
      },
      bar: {
        width: {
          ratio: (options.sizes.bar || 0.9)
        }
      }
    };
    return chartData;
  };

  popilyChart.chartTypes.barCommon = chart;
})(window);

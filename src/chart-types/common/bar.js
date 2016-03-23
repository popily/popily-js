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
        cleanValues = popilyChart.chartData.sortData(cleanValues[0],cleanValues[1],cleanValues[2],limit,order);
    }

    var cleanXValues = cleanValues[0];
    
    if(rawData.analysisType.indexOf('date') > -1 && _.every(cleanXValues, popilyChart.chartData.checkIsDateStr)) {
      var dateFormatStr = popilyChart.format.formatFromInspection(cleanXValues);
      var dateFormat = d3.time.format(dateFormatStr);
      cleanXValues = _.map(cleanXValues, function(x) { return dateFormat((new Date(x))); });
    }

    var cleanYValues = popilyChart.format.formatNumbers(cleanValues[1]);
    var cleanZValues = cleanValues[2];

    return [cleanXValues, cleanYValues, cleanZValues];
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
          show: (_.isUndefined(options.tooltip)?true:options.tooltip),
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
    };

    return chartData;
  };

  popilyChart.chartTypes.barCommon = chart;
})(window);

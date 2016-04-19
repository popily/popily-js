(function(window) {
  var popilyChart = window.popily.chart;
  
  var chart = _.clone(popilyChart.baseChart);
  
  chart.assignAxis = function(columns, calculation, options) {
      return popilyChart.chartTypes.compare.assignAxis(columns,calculation,options);
  };

  chart.render = function(element, options, rawData) {
      var preppedData = popilyChart.chartTypes.compare.prepData(rawData, options);
      var xValues = preppedData[0];
      var yValues = preppedData[1];
      var zValues = preppedData[2];
      var xLabel = rawData.chartData.x.label;
      var yLabel = rawData.chartData.y.label;    


      var columns = [];
      yValues.unshift(yLabel);
      xValues.unshift(xLabel);
      var xs = {};
      xs[yLabel] = xLabel;
      columns.push(xValues);
      columns.push(yValues);

      var tooltip = options.tooltip || {
          contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
              
              var markup = '<table class="popily-tooltip"><tbody>';
              if(!_.isUndefined(zValues[d[0].index]))
                markup += '<tr><th colspan="2"><span style="background-color:'+color(d[0].id)+'"></span> '+zValues[d[0].index]+'</th></tr>';
              
              markup += '<tr class="popily-tooltip-name"><td class="name">'+xLabel+'</td><td class="value">'+d[0].x+'</td></tr>';
              markup += '<tr class="popily-tooltip-name"><td class="name">'+yLabel+'</td><td class="value">'+d[0].value+'</td></tr>';
              
              markup += '</tbody></table>'
              return markup;
          }
      };
        
      return popilyChart.chartTypes.compare.render(element, options, columns, xs, xLabel, yLabel, tooltip);
  };

  popilyChart.chartTypes.scatterplot = chart;
})(window);

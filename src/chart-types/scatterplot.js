(function(window) {
  var popilyChart = window.popily.chart;
  
  var chart = _.clone(popilyChart.baseChart);
  chart.defaultFor = [
    'scatterplot',
    'scatterplot_per_category'
  ];
  chart.accepts = [];

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
      console.log(columns);

      var tooltip = options.tooltip || {
          contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
              var markup = '<div class="popily-tooltip"><h3>'+xLabel+':&nbsp;<strong>' + d[0].x + '</strong>, '+yLabel+':&nbsp;<strong>' + d[0].value + '</strong></h3>';
              markup += '<div style="max-width: 350px;"><strong>';
              if(!_.isUndefined(zValues[d[0].index]))
                markup += zValues[d[0].index];
              /*
              markup += '{{insight.z_title|escapejs|safe}}: <strong>';
              var found = [];
              _.each(_.zip(formatNumbers(cleanValues[0]),formatNumbers(cleanValues[1]),cleanValues[2]), function(val) {
                  if(val[0] == d[0].x && val[1] == d[0].value) {
                      found.push(val[2]);
                  }
              });

              if(found.length > 0) {
                  markup += (found.join(', '));
              }
              */
              
              markup += '</strong></div>';
              markup += '</div>';
              return markup;
          }
      };
        
      return popilyChart.chartTypes.compare.render(element, options, columns, xs, xLabel, yLabel, tooltip);
  };

  popilyChart.chartTypes.scatterplot = chart;
})(window);

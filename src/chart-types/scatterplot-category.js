(function(window) {
  var popilyChart = window.popily.chart;
  
  var chart = _.clone(popilyChart.baseChart);
  chart.defaultFor = [
    'scatterplot_by_category'
  ];
  chart.accepts = [];

  chart.render = function(element, options, rawData) {
      var preppedData = popilyChart.chartTypes.compare.prepData(rawData, options);
      var xValues = preppedData[0];
      var yValues = preppedData[1];
      var zValues = preppedData[2];
      var xLabel = rawData.chartData.x.label;
      var yLabel = rawData.chartData.y.label;
      var zLabel = rawData.chartData.z.label;    

      var columns = [];
      var xs = {};
      var zs = {};

      /*
      console.log(xValues);
      console.log(yValues);
      console.log(zValues);
      */
      _.each(_.uniq(zValues), function(z) {
          zs[z] = {xs:[],ys:[]};
      });

      _.each(zValues, function(z,i) {
          zs[z].ys.push(yValues[i]);
          zs[z].xs.push(xValues[i]);
      });
      
      _.each(_.keys(zs), function(z) {
          zs[z].xs.unshift(z+'_x');
          zs[z].ys.unshift(z);

          xs[z] = z+'_x';
          columns.push(zs[z].xs);
          columns.push(zs[z].ys);
      });

      var tooltip = options.tooltip || {
          contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
              var markup = '<div class="popily-tooltip"><h3 ><span class="square" style="background-color:' + color(d[0].id) + '"></span> ' + xLabel + ':&nbsp;<strong>' + d[0].x + '</strong>, ' + yLabel + ':&nbsp;<strong>' + d[0].value + '</strong></h3>';
              markup += zLabel + ': <strong>';
              markup += d[0].name;
              markup += '</strong>';
              markup += '</div>';
              return markup;
          }
      };

      var showLegend = true;
      if(_.unique(zValues).length > 25) {
          showLegend = false;
      }

      return popilyChart.chartTypes.compare.render(element, options, columns, xs, xLabel, yLabel, tooltip);
  };

  popilyChart.chartTypes.scatterplotCategory = chart;
})(window);

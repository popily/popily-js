(function(window) {
  var popilyChart = window.popily.chart;
  
  var chart = _.clone(popilyChart.baseChart);
  chart.assignAxis = function(columns, calculation, options) {
      return popilyChart.chartTypes.compare.assignAxis(columns,calculation,options);
  };

  chart.render = function(element, options, formattedData) {
      var preppedData = popilyChart.chartTypes.compare.prepData(formattedData, options);
      var xValues = preppedData[0];
      var yValues = preppedData[1];
      var zValues = preppedData[2];
      var xLabel = formattedData.chartData.x.label;
      var yLabel = formattedData.chartData.y.label;
      var zLabel = formattedData.chartData.z.label;    

      var columns = [];
      var xs = {};
      var zs = {};

      console.log(zValues);

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
              var markup = '<table class="popily-tooltip"><tbody>';
              if(!_.isUndefined(zValues[d[0].index]))
                markup += '<tr><th colspan="2"><span style="background-color:'+color(d[0].id)+'"></span> '+zValues[d[0].index]+'</th></tr>';
              
              markup += '<tr class="popily-tooltip-name"><td class="name">'+xLabel+'</td><td class="value">'+d[0].x+'</td></tr>';
              markup += '<tr class="popily-tooltip-name"><td class="name">'+yLabel+'</td><td class="value">'+d[0].value+'</td></tr>';
              
              markup += '</tbody></table>'
              return markup;
          }
      };

      var showLegend = true;
      if(_.unique(zValues).length > 25) {
          showLegend = false;
      }

      return popilyChart.chartTypes.compare.render(element, options, columns, xs, xLabel, yLabel, tooltip, formattedData);
  };

  popilyChart.chartTypes.scatterplotCategory = chart;
})(window);

(function(window) {
  var chartSize = function() {
      var height = window.innerHeight;
      var width = Math.min(window.innerWidth, 1052); // 1052 container max-width
      var mqTest = window.matchMedia( "(min-width: 48em)" );
      if(mqTest) {
          height = height - 460;
      } else {
          height = height - 150;
      }
      if (height > width)
          height = width;
      else if(height < 430)
          height = 430;
      return {'height': height};
  };

  var updateChart = function(element, chart, chartData, chartPadding, rotated) {
      // x axis label height
      var xLabel = element.querySelector('.c3-axis-x-label');
      var xLabelHeight = Math.ceil(xLabel.getBBox().height);
      // x axis labels box sizes
      var xLabelsBox = element.querySelector('.c3-axis.c3-axis-x');
      var xLabelsBoxHeight = Math.ceil(xLabelsBox.getBBox().height);
      var xLabelsBoxWidth = Math.ceil(xLabelsBox.getBBox().width);
      // y axis labels box sizes
      var yLabelsBox = element.querySelector('.c3-axis.c3-axis-y');
      var yLabelsBoxHeight = Math.ceil(yLabelsBox.getBBox().height);
      var yLabelsBoxWidth = Math.ceil(yLabelsBox.getBBox().width);
      // main chart sizes
      var chartBox = element.querySelector('.c3-zoom-rect');
      var chartBoxHeight = Math.ceil(chartBox.getBBox().height);
      var chartBoxWidth = Math.ceil(chartBox.getBBox().width);
      // main svg sizes
      var chartArea = element.querySelector('svg');
      if(!chartArea)
          var chartArea = element.querySelector('svg');
      
      var chartAreaWidth = chartArea.clientWidth || chartArea.parentNode.clientWidth;
      var chartAreaHeight = chartArea.clientHeight || chartArea.parentNode.clientHeight;;

      chartPadding.bottom = xLabelHeight;    
      
      if (!chart.internal.config.axis_rotated) {
            
          // check whether padding bottom is needed
          // add padding bottom if needed
          if (chartBoxHeight + xLabelsBoxHeight + chartPadding.top > chartAreaHeight) {
              var paddingBottom = Math.abs(chartAreaHeight - (chartBoxHeight + xLabelsBoxHeight + chartPadding.top));
              chartPadding.bottom = paddingBottom + xLabelHeight;
          }
          // check whether padding right is needed
          // add padding right if needed
          if (xLabelsBoxWidth > chartBoxWidth) {
              var paddingRight = Math.abs(chartBoxWidth - xLabelsBoxWidth);
              chartPadding.right = paddingRight;
          }
          // check whether padding left is needed
          // add padding left if needed
          if (chartBoxWidth + yLabelsBoxWidth > chartAreaWidth) {
              var paddingLeft = Math.abs(chartAreaWidth - (chartBoxWidth + yLabelsBoxWidth));
              chartPadding.left = paddingLeft;
          }
          chart.destroy();
          chart = c3.generate(chartData);

          // move x axis label on the bottom of the x axis labels box        
          var dyAttr = xLabel.getAttribute('dy');           
          var dyAttrValue = dyAttr.slice(0,-2);        
          function emToPx(emValue) {
              var emSize = parseFloat(getComputedStyle(document.querySelector('html')).getPropertyValue('font-size'));
              return (emSize * emValue);
          }
          var xLabelTop = Number(emToPx(dyAttrValue));        
          var xLabelTransform = xLabelsBoxHeight - xLabelTop - 4;    
          element.querySelector('.c3-axis-x-label').setAttribute('y', xLabelTransform);
      }
      else {
          // check whether padding left is needed
          // add padding left if needed
          if (chartBoxWidth + xLabelsBoxWidth > chartAreaWidth) {
              var paddingLeft = Math.abs(chartAreaWidth - (chartBoxWidth + xLabelsBoxWidth));
              chartPadding.left = paddingLeft;
          }
          // check whether padding bottom is needed
          // add padding bottom if needed
          if (xLabelsBoxHeight > chartBoxHeight) {
              var paddingBottom = Math.abs(chartBoxHeight - xLabelsBoxHeight);   
              chartPadding.bottom = paddingBottom;
          }
          // check whether padding right is needed
          // add padding right if needed
          if (yLabelsBoxWidth > chartBoxWidth) {
              var paddingRight = Math.abs(chartBoxWidth - yLabelsBoxWidth);
              chartPadding.right = paddingRight;
          }
          chart.destroy();
          chart = c3.generate(chartData);
      }
  };    

  var formatDataset = function(apiResponse, axisAssignments, analysisType) {
      var newData = _.extend({}, apiResponse);
      var possibleAxis = ['x','y','z','z2','y2'];

      newData.chartData = {}
      newData.analysisType = analysisType;

      _.each(possibleAxis, function(axis) {
        if(axisAssignments.hasOwnProperty(axis)) {
          newData.chartData[axis] = {
            values: axisAssignments[axis].values,
            label: axisAssignments[axis].column_header
          }
        }
      });

      if(apiResponse.insight_metadata) {
        newData.chartData.metadata = apiResponse.insight_metadata;
      }

      if(newData.analysisType.indexOf('geo') > -1) {
        newData.chartData.x.values = _.map(newData.chartData.x.values, JSON.parse);
      }

      return newData;
  };

  window.popily.chart.utils = {
      chartSize: chartSize,
      updateChart: updateChart,
      formatDataset: formatDataset
  };
})(window);

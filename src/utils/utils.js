(function(window) {
  window.popily.chart.utils = {
    formatData: function(insightData) {
      var newData = _.extend({}, insightData);

      newData.chartData = {}
      if(newData.x_values) {
        newData.chartData.x = { values: newData.x_values, label: newData.x_label };
      }
      if(newData.y_values) {
        newData.chartData.y = { values: newData.y_values, label: newData.y_label };
      }
      if(newData.z_values) {
        newData.chartData.z = { values: newData.z_values, label: newData.z_label };
      }

      if(newData.insight_metadata) {
        newData.chartData.metadata = newData.insight_metadata;
      }

      if(newData.insight_type) {
        newData.analysisType = newData.insight_type;
      }

      if(newData.analysisType && newData.analysisType.indexOf('geo') > -1) {
        newData.chartData.x.values = _.map(newData.chartData.x.values, JSON.parse);
      }
      return newData;
    },

    c3ify : function(xValues,yValues,zValues) {
      var groupings = [];
      var columns = [];
      var xyz = _.zip(xValues,zValues,yValues);

      //console.log(yValues);

      _.each(_.uniq(xValues),function(x) {
          _.each(_.uniq(zValues),function(z) {
              groupings.push([x,z,0]);
          });

      });

      _.each(xyz,function(_xyz) {
          _.each(groupings, function(pair) {
              if(_xyz[0] === pair[0] && _xyz[1] === pair[1]) {
                  pair[2] = _xyz[2];
              }
          });
      });

      var categories = _.uniq(_.map(groupings, function(group) { return group[0]; }));
      var valuePairs = _.map(groupings, function(group) { return [group[1],group[2]] });
      var labels = _.uniq(_.map(groupings, function(group) { return group[1] }));

      var values;
      _.each(labels, function(label) {
          values = _.map(_.filter(valuePairs, function(vp) {
              return vp[0] == label}),function(vp) {
                  return vp[1]; });
          columns.push([label].concat(values));
      });

      return {
          categories: categories,
          columns: columns,
          groups: labels
      }
    },

    nan : -99999,
    
    cleanData : function(xValues,yValues,zValues) {
      xValues = xValues || [];
      yValues = yValues || [];
      zValues = zValues || [];


      var tuples = _.zip(xValues,yValues,zValues);

      // Remove nan
      var cleaned = _.reject(tuples, function(t) {
          if (t[1] === nan || t[0] === nan) {
              return true;
          }
          return false;
      });


      return _.unzip(cleaned);

    },

    nanToZero : function(num) {
      if(num === this.nan) {
          return 0;
      }
      return num;
    },
    cleanNanToZero : function(values) {
      values = _.map(values, function(v) {
          return nanToZero(v);
      });
      return values;
    },

    dayList : ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'],
    dayListAbbr : ['sun','mon','tue','wed','thu','fri','sat'],
    monthList : ['january','february','march','april','may','june','july','august','september','october','november','december'],
    monthListAbbr : ['jan','feb','mar','apr','may','jun','jul','aug','sep','sept','oct','nov','dec'],

    categoryType : function(values) {
      if(_.every(values, function(v) { return _(dayList).contains(v.toString().toLowerCase()) })) {
          return 'day';
      }

      if(_.every(values, function(v) { return _(dayListAbbr).contains(v.toString().toLowerCase()) })) {
          return 'dayAbbr';
      }

      if(_.every(values, function(v) { return _(monthList).contains(v.toString().toLowerCase()) })) {
          return 'month';
      }

      if(_.every(values, function(v) { return _(monthListAbbr).contains(v.toString().toLowerCase()) })) {
          return 'monthAbbr';
      }

      return null;
    },

    sortData : function(xYalues,yValues,zValues,limit, order) {
      var tuples = _.zip(xYalues,yValues,zValues);
          
      if(_.every(xYalues, function(x) { return !isNaN(x); })) {
          var sorted = _.sortBy(tuples, function(t){
                              return parseInt(t[0]);
                          }); 
      }
      else if(_.every(xYalues, function(x) { return !isNaN(x.toString().charAt(0)); })) {
          var sorted = _.sortBy(tuples, function(t){
                              return t[0];
                          }); 
      }
      else {
          var cType = categoryType(xYalues);
          if(cType) {
              var compareList = dayList;
              if(cType == 'dayAbbr') {
                  compareList = dayListAbbr;
              }
              else if(cType == 'month') {
                  compareList = monthList;
              }
              else if(cType == 'monthAbbr') {
                  compareList = monthListAbbr;
              }

              // Sort asc by y
              var sorted = _.sortBy(tuples, function(t){
                                  return compareList.indexOf(t[0].toLowerCase());
                              }); 
          }
          else {
             // Sort asc by y
              var sorted = _.sortBy(tuples, function(t){
                                  return t[1] * -1;
                              }); 
          }
      }

      if(limit && _.size(sorted)>limit ) {
          var i=0;
          var nth = Math.floor(_.size(sorted) / limit);
          sorted = _.filter(sorted, function(item) {
                  i++;
                  return i % nth == 0;
              });
      }
      
      if(order=='asc' || order=='desc') {
          var descMultiply = (order=='desc'?-1:1)
          sorted = _.sortBy(sorted, function(t){
                      return t[1] * descMultiply;
                      });
      } 
      else if(order=='a-z' || order=='z-a') {
          if(_.every(xYalues, function(x) { return !isNaN(x); })) {
              sorted = _.sortBy(sorted, function(t){
                      return parseInt(t[0]);
                  }); 
          }
          else {
              sorted = _.sortBy(sorted, function(t){
                      return t[0];
                  }); 
          }
          if(order=='z-a')
              sorted = sorted.reverse();
      }
      return _.unzip(sorted);
    },

    daysDiff : function(dateStrings) {
      var dates = _.map(dateStrings,function(d) { return new Date(d); });
      var minDate = _.min(dates);
      var maxDate = _.max(dates);
      var dateDiff = maxDate - minDate;
      var daysDiff = dateDiff / 1000 / 60 / 60 / 24;

      return daysDiff;
    },

    formatNumbers : function(numberList) {
      var formatted = _.map(numberList, function(num) {
          if(num !== nan && _.isNumber(num) && !_.isNaN(num)) {
              return numeral(num).format('0[.00]');
          }
          return '0.00';
      });
      return formatted;
    },


    formatFromDayDiff: function(dayDiff) {
      if(dayDiff > 1000)
          return '%Y';
      if(dayDiff > 90)
          return '%Y %B';
      if(dayDiff > 3)
          return '%Y-%m-%d';
      return '%Y-%m-%d %H:%M:%S';
    },
      
    formatFromInterval: function (interval) {
      if(interval == 'year')
          return '%Y';
      if(interval == 'month')
          return '%Y %B';
      if(interval == 'week')
          return '%Y-%m-%d';
      if(interval == 'day')
          return  '%Y-%m-%d';
      return '%Y-%m-%d %H:%M:%S';
    },

    stepInterval: function (interval) {
      if(interval=='%Y') return function(d, step) {d.setFullYear(d.getFullYear()+step); return d;};
      if(interval=='%Y %B') return function(d, step) {d.setMonth(d.getMonth()+step); return d;};
      if(interval=='%Y-%m-%d') return function(d, step) {d.setDate(d.getDate()+step); return d;};
      return false;
    },

    tickFormatValues: function (categories, tickFormatStr, dateFormat) {
      var stepFunc = stepInterval(tickFormatStr);
      if(!stepFunc)
          return null;
          
      var dates = _.map(categories, function(d) { return new Date(d); });
      var minDate = _.min(dates);
      var maxDate = _.max(dates);
      var dateDiff = maxDate - minDate;
      var maxSteps = 10;

      var stepDIff = stepFunc(new Date(1980), 1) - new Date(1980);
      var step = 1;
      var steps = dateDiff/stepDIff;
      if(steps > maxSteps)
          step = Math.floor(steps/maxSteps);
      
      var values = [];
      var date = new Date(minDate.getTime());
      for(; date<=maxDate; date = stepFunc(date, step))
      {
          values.push(dateFormat(date))
      }
      return values;
    },


    updateChart : function() {
      // x axis label height
      var xLabel = document.querySelector('.c3-axis-x-label');
      var xLabelHeight = Math.ceil(xLabel.getBBox().height);
      // x axis labels box sizes
      var xLabelsBox = document.querySelector('.c3-axis.c3-axis-x');
      var xLabelsBoxHeight = Math.ceil(xLabelsBox.getBBox().height);
      var xLabelsBoxWidth = Math.ceil(xLabelsBox.getBBox().width);
      // y axis labels box sizes
      var yLabelsBox = document.querySelector('.c3-axis.c3-axis-y');
      var yLabelsBoxHeight = Math.ceil(yLabelsBox.getBBox().height);
      var yLabelsBoxWidth = Math.ceil(yLabelsBox.getBBox().width);
      // main chart sizes
      var chartBox = document.querySelector('.c3-zoom-rect');
      var chartBoxHeight = Math.ceil(chartBox.getBBox().height);
      var chartBoxWidth = Math.ceil(chartBox.getBBox().width);
      // main svg sizes
      var chartArea = document.querySelector('.detail-view__main-data svg');
      if(!chartArea)
          var chartArea = document.querySelector('.insight-image__main-data svg');
      
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
              var emSize = parseFloat($('html').css('font-size'));
              return (emSize * emValue);
          }
          var xLabelTop = Number(emToPx(dyAttrValue));        
          var xLabelTransform = xLabelsBoxHeight - xLabelTop;    
          $('.c3-axis-x-label').attr('y', xLabelTransform);
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
    },
    
        
    truncate : function(string, limit) {
      if(!limit) limit = 30;
      if (string.length > limit)
        return string.substring(0,limit)+'...';
      else
        return string;
    },


    

  }
})(window);

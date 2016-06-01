(function(window) {
    var nan = -99999;

    var daysDiff = function(dateStrings) {
        var dates = _.map(dateStrings,function(d) { return new Date(d); });
        var minDate = _.min(dates);
        var maxDate = _.max(dates);
        var dateDiff = maxDate - minDate;
        var daysDiff = dateDiff / 1000 / 60 / 60 / 24;

        return daysDiff;
    };

    var formatNumbers = function(numberList, decimalPlaces) {
        var formatted = _.map(numberList, function(num) {
            num = parseFloat(num);

            var formatStr = '0';
            if(_.isUndefined(decimalPlaces)) {
                formatStr += '[.00]'
            }
            else {
                formatStr += '[.';
                for(var i=0;i<decimalPlaces-1;i++) {
                    formatStr += '0';
                }
                formatStr += ']';
            }

            if(num !== "nan" && _.isNumber(num) && !_.isNaN(num)) {
                return numeral(num).format(formatStr);
            }
            return '0.00';
        });
        return formatted;
    };

    var toNumber = function(strList) {
        return _.map(strList, function(val) { 
              if(val.toString().indexOf('.') > 0) {
                  return parseFloat(val);
              }

              return parseInt(val,10) 
          });
    };


    function formatDates(xValues, interval) {
        var dayDiff = daysDiff(xValues); 
        var tickFormatStr = formatFromDayDiff(dayDiff);


        var dateFormatStr = formatFromInterval(interval);
        if(_.isUndefined(interval)) {
            dateFormatStr = formatFromInspection(xValues);
        }

        var dateFormat = d3.time.format(dateFormatStr);
        var tickFormat = d3.time.format(tickFormatStr);
        var fullFormat = d3.time.format('%Y-%m-%d %H:%M:%S');

        var ticksValues = tickFormatValues(xValues, tickFormatStr, dateFormat);

        if(dateFormat != fullFormat) {
            xValues = _.map(xValues, function(d) {
                  if (d) {
                    var firstPiece = d.split('.')[0];
                    var parsed = fullFormat.parse(firstPiece);
                    return dateFormat(parsed);
                  }
                  return '';
              });
        }

        return xValues;
    }

    function formatFromDayDiff(dayDiff) {
        if(dayDiff > 1000)
            return '%Y';
        if(dayDiff > 90)
            return '%Y %B';
        if(dayDiff > 3)
            return '%Y-%m-%d';
        return '%Y-%m-%d %H:%M:%S';
    }

    function formatFromInspection(xValues) {
        var times = _.map(xValues, function(xValue) { return xValue.split(' ')[1] });
        if(_.every(times, function(time) { return time == '00:00:00' })) {
            return '%Y-%m-%d';
        }
        return '%Y-%m-%d %H:%M:%S';
    }
        
    function formatFromInterval(interval) {
        if(interval == 'year')
            return '%Y';
        if(interval == 'month')
            return '%Y %B';
        if(interval == 'week')
            return '%Y-%m-%d';
        if(interval == 'day')
            return  '%Y-%m-%d';
        return '%Y-%m-%d %H:%M:%S';
    }

    function stepInterval(interval) {
        if(interval=='%Y') return function(d, step) {d.setFullYear(d.getFullYear()+step); return d;};
        if(interval=='%Y %B') return function(d, step) {d.setMonth(d.getMonth()+step); return d;};
        if(interval=='%Y-%m-%d') return function(d, step) {d.setDate(d.getDate()+step); return d;};
        return false;
    }

    function tickFormatValues(categories, tickFormatStr, dateFormat) {
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
    }

    // Credit: https://gist.github.com/mathewbyrne/1280286
    function slugify(text) {
      return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
    }


      var joinWith = function(arr, word) {
        if(arr.length < 2) {
          return arr.join('');
        } else {
          var joinText = ', ';
          if (arr.length === 2) {
            joinText = ' ';
          }
          return [arr.slice(0, -1).join(', '), arr.slice(-1)[0]].join(joinText + word + ' ');
        }
      };

      var wrapLabel = function(label) {
        return '<span class="popily-title-variable" >'+ label + '</span>';
      };

      var capitalize = function(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
      };
      
    var formatAxis = function(axis, options, valueFormater) {

      var formatters = [];
      (options['formatters']||[]).forEach(function(f) {
        if(f.column == axis.label)
          formatters.push(f);
      });
      
      var optionsFormater = function(v) { 
        formatters.forEach(function(f) {
          if(f.op == 'prefix')
            v = f.value + v;
          else if(f.op == 'sufix')
            v = v + f.value;
          else if(f.func)
            v = f.func(v);
        });
        return v;
      };
              
      return function(v) {
        var $$ = this, config = $$.config;
        if(!valueFormater) {
          if($$.config)
            valueFormater = $$.isTimeSeries() ? $$.defaultAxisTimeFormat : $$.isCategorized() ? $$.categoryName : function (v) { return v < 0 ? v.toFixed(0) : v; };
          else
            valueFormater = function (v) { return v < 0 ? v.toFixed(0) : v; };
        }
        return (options[axis+'Prefix']||"") + optionsFormater(valueFormater.call($$, v)) + (options[axis+'Sufix']||"");
      }
    }

    popily.chart.format = {
        formatNumbers: formatNumbers,
        toNumber: toNumber,
        daysDiff: daysDiff,
        formatFromDayDiff: formatFromDayDiff,
        formatFromInterval: formatFromInterval,
        formatFromInspection: formatFromInspection,
        formatDates: formatDates,
        tickFormatValues: tickFormatValues,
        slugify: slugify,
        joinWith: joinWith,
        wrapLabel: wrapLabel,
        capitalize: capitalize,
        formatAxis: formatAxis
    }
})(window);

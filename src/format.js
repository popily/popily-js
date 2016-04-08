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

    var formatNumbers = function(numberList) {
        var formatted = _.map(numberList, function(num) {
            num = parseFloat(num);

            if(num !== "nan" && _.isNumber(num) && !_.isNaN(num)) {
                return numeral(num).format('0[.00]');
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

    popily.chart.format = {
        formatNumbers: formatNumbers,
        toNumber: toNumber,
        daysDiff: daysDiff,
        formatFromDayDiff: formatFromDayDiff,
        formatFromInterval: formatFromInterval,
        formatFromInspection: formatFromInspection,
        tickFormatValues: tickFormatValues,
        slugify: slugify
    }
})(window);

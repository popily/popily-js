(function(window) {
    var nan = -99999;

    function chartSize() {
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
        chartSize: chartSize,
        updateChart: updateChart,
        daysDiff: daysDiff,
        formatFromDayDiff: formatFromDayDiff,
        formatFromInterval: formatFromInterval,
        formatFromInspection: formatFromInspection,
        tickFormatValues: tickFormatValues,
        slugify: slugify
    }
})(window);
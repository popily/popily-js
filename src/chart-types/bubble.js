(function(window) {
  var popilyChart = window.popily.chart;
  
  var chart = _.clone(popilyChart.baseChart);

  chart.assignAxis = function(columns, calculation, options) {
      var axis = {};
      var typePattern = popilyChart.analyze.getTypePattern(columns);

      if(typePattern === 'numeric,numeric') {
        axis.y = {
            column_header: calculation.charAt(0).toUpperCase() + calculation.slice(1).toLowerCase(),
            values: _.map(columns, function(column) { return column.values[0] }),
            data_type: 'numeric'
        }
        axis.x = {
            column_header: 'Columns',
            values: _.map(columns, function(column) { return column.column_header }),
            data_type: 'category'
        }
      }
      else {
        _.each(columns, function(column) {
            if(column.data_type === 'numeric') {
              axis.y = column;
            }
            else {
              axis.x = column;
            }
        });
      }

      return axis;
  };

  chart.prepData = function(formattedData, options) {
    var that = this;
    var limit = that.defaults.categoryLimit;

    var chartData = formattedData.chartData;
    var xValues = chartData.x.values;
    var yValues = chartData.y.values;

    yValues = popilyChart.format.formatNumbers(yValues);

    return [xValues, yValues];
  };

  chart.render = function(element, options, formattedData) {
      var width = options.width,
        height = options.height,
        format = d3.format(",d"),
        //color = d3.scale.category20c();
        color = d3.scale.ordinal().range(options.colors);
    var data = {'children': [
            {'name': 'negative', 'children': []},
            {'name': 'positive', 'children': []},
        ]};
        
    var preppedData = this.prepData(formattedData, options);
    var xValues = preppedData[0];
    var yValues = preppedData[1];
    var xLabel = formattedData.chartData.x.label;
    
    _.each(_.first(yValues,200), function(yValue,i) {
        if(yValue>0)
            data.children[1].children.push({category: xValues[i], className: 'data', showValue: yValue, value: parseFloat(yValue) });
        else
            data.children[0].children.push({category: yValues[i], className: 'data', showValue: yValue, value: -1*parseFloat(yValue) });
    });

    if(width == '100%')
      width = element.getBoundingClientRect().width;
    if(height == '100%')
      var height = popilyChart.utils.chartSize()['height'];
    
    var transitionDuration = 350;
    if(options.skipAnimation)
      transitionDuration = 0;

    var bubble = d3.layout.pack()
        .sort(null)
        .size([width, height])
        .padding(4);

    var svg = d3.select(element).append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "bubble");

    if((_.isUndefined(options.tooltip)?true:options.tooltip)) {
        var tip = d3.tip()
            .attr('class', 'popily-tooltip-container')
            .offset([-5, 0])
            .html(function(d) {
                var text = "<table class='popily-tooltip'><tr><th colspan='2'>" + d.category + "</th></tr>";
                text += "<tr class='popily-tooltip-name-'>";
                text += "<td class='name'><span style='background-color:" + color(d.category) + "'></span> " + xLabel + "</td>";
                text += "<td class='value'>" + d.showValue + "</td>";
                text += "</tr>";
                return text + "</table>"; 
            });
        svg.call(tip);
    }
    
    var node = svg.selectAll(".node")
        .data(
            bubble.nodes(data)
                .filter(function(d) { return !d.children})
        )
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")"; })
        .on('mouseover', function(d) {
            tip.show(d, d);
            d3.select(this.childNodes[0])
                .transition().duration(50)
                .attr("r", d.r+5)
                .transition().duration(100)
                .attr("r", d.r+3)
        })
        .on('mouseout', function(d) { 
            tip.hide(d);
            d3.select(this.childNodes[0])
                .transition().duration(10)
                .attr("r", d.r)
        });
  
    node.append("circle")
        .style("fill", function(d) { return color(d.category); })
        .attr("r", 0)
        .transition().duration(transitionDuration)
        .attr("r", function(d) { return d.r; });
        
    node.append("text")
        .attr("dy", ".3em")
        .style("text-anchor", "middle")
        .style("opacity", 0)
        .text(function(d) {
            if (d.r / 3 > 3) return d.category.substring(0, d.r / 3); 
            else return '';
        })
        .transition().duration(transitionDuration)
        .style("opacity", 1)
        .attr("pointer-events", "none");

    var onResize = function() {
        if(options.width == '100%')
          width = element.getBoundingClientRect().width;
        if(options.height == '100%')
          height = popilyChart.utils.chartSize()['height'];
        
        svg
            .attr("width", width)
            .attr("height", height);

        var bubble = d3.layout.pack()
            .sort(null)
            .size([width, height])
            .padding(4);
        
        var node = svg.selectAll(".node")
            .data(
                bubble.nodes(data)
                   .filter(function(d) { return !d.children})
            );
        svg.selectAll("g")
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")"; });
        
        svg.selectAll("circle")
            .attr("r", function(d) { return d.r; });
        svg.selectAll("text")
            .text(function(d) { 
                if (d.r / 3 > 3) return d.category.substring(0, d.r / 3); 
                else return '';
            })
        
    };

    d3.select(window).on('resize', onResize);
  };

  popilyChart.chartTypes.bubble = chart;
})(window);

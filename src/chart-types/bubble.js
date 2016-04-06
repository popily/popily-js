(function(window) {
  var popilyChart = window.popily.chart;
  
  var chart = _.clone(popilyChart.baseChart);
  chart.defaultFor = [];
  chart.accepts = [
    'count_by_value',
    'count_by_category',
    'average_by_category',
    'sum_by_category',
    'sum_sum_by_category',
    'sum_by_category_per_category',
    'average_by_category_per_category',
    'count_by_category_per_category',
    'count_per_category_by_category',
    'top_by_rowlabel'
  ];

  chart.prepData = function(rawData, options) {
    var that = this;
    var limit = that.defaults.categoryLimit;
    var cleanValues = that.cleanData(rawData);

    var cleanXValues = cleanValues[0];
    var cleanYValues = popilyChart.format.formatNumbers(cleanValues[1]);

    return [cleanXValues, cleanYValues];
  };

  chart.render = function(element, options, rawData) {
      var width = options.width,
        height = options.height,
        format = d3.format(",d"),
        //color = d3.scale.category20c();
        color = d3.scale.ordinal().range(options.colors);
    var data = {'children': [
            {'name': 'negative', 'children': []},
            {'name': 'positive', 'children': []},
        ]};
    if(typeof window.chartSize == 'undefined') {
        window.chartSize = function() { return {'height': width}; };
    }
        
    var preppedData = this.prepData(rawData, options);
    var xValues = preppedData[0];
    var yValues = preppedData[1];
    var xLabel = rawData.chartData.x.label;
    
    _.each(_.first(yValues,200), function(yValue,i) {
        if(yValue>0)
            data.children[1].children.push({category: xValues[i], className: 'data', showValue: yValue, value: parseFloat(yValue) });
        else
            data.children[0].children.push({category: yValues[i], className: 'data', showValue: yValue, value: -1*parseFloat(yValue) });
    });

    width = element.getBoundingClientRect().width;
    var size = popilyChart.utils.chartSize();
    height = size['height'];
    
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
            .attr('class', 'd3-tips')
            .offset([-5, 0])
            .html(function(d) {
                var text = "<table class='c3-tooltip'><tr><th colspan='2'>" + d.category + "</th></tr>";
                text += "<tr class='c3-tooltip-name-'>";
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
        width = element.getBoundingClientRect().width;
        size = popilyChart.utils.chartSize();
        height = size['height'];
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

    window.onresize = onResize;
  };

  popilyChart.chartTypes.bubble = chart;
})(window);

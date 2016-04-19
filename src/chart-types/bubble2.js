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
        color = d3.scale.ordinal().range(options.colors);

    if(width == '100%')
      width = element.getBoundingClientRect().width;
    if(height == '100%')
      var height = popilyChart.utils.chartSize()['height'];
    
    var preppedData = this.prepData(formattedData, options);
    var xValues = preppedData[0];
    var yValues = preppedData[1];
    var xLabel = formattedData.chartData.x.label;
    
    yValues = _.first(yValues,200);
    yValues = _.map(yValues, parseFloat);

    var nodes = [];
    _.each(yValues, function(yValue,i) {
      if(yValue>0) {
        var node = {
          id: i,
          value: yValue,
          description: yValue,
          name: i,
          group: xValues[i],
          x: Math.random() * width,
          y: Math.random() * height
        };
        return nodes.push(node);
      }
    });
    
    var maxValue = _.max(nodes, function(d){ return d.value; }).value;
    var sumValue = _.reduce(nodes, (function(a, b) { return a + b.value; }), 0);
    var avgValue = sumValue/nodes.length;
    
    var createScale = function() {
      var blankSpaceFactor = 2 + (width+height)/2000;
      var meanR = Math.sqrt((width*height)/(Math.PI*yValues.length*blankSpaceFactor));
      rMax = Math.sqrt(Math.pow(meanR,2) * maxValue/avgValue);
      return d3.scale.pow().exponent(0.5).domain([0, maxValue]).range([2, rMax]);
    }
    var radiusScale = createScale();
    
    var center = {
      x: width/2,
      y: height/2,
    };
    
    var transitionDuration = 350;
    if(options.skipAnimation)
      transitionDuration = 0;

    var svg = d3.select(element).append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "bubble2");
        
    if((_.isUndefined(options.tooltip)?true:options.tooltip)) {
        var tip = d3.tip()
            .attr('class', 'popily-tooltip-container')
            .offset([-5, 0])
            .html(function(d) {
                var text = "<table class='popily-tooltip'><tr><th colspan='2'>" + d.group + "</th></tr>";
                text += "<tr class='popily-tooltip-name-'>";
                text += "<td class='name'><span style='background-color:" + color(d.group) + "'></span> " + xLabel + "</td>";
                text += "<td class='value'>" + d.showValue + "</td>";
                text += "</tr>";
                return text + "</table>"; 
            });
        svg.call(tip);
    }
        
    var bubbles = svg.selectAll(".bubble").data(nodes, function(d) {
      return d.id;
    });
    
    var node = bubbles.enter().append("g")
        .attr("class", "bubble")
        .on('mouseover', function(d) {
            tip.show(d, d);
            d3.select(this.childNodes[0])
                .transition().duration(50)
                .attr("r", radiusScale(d.value)+5)
                .transition().duration(100)
                .attr("r", radiusScale(d.value)+3)
        })
        .on('mouseout', function(d) { 
            tip.hide(d);
            d3.select(this.childNodes[0])
                .transition().duration(10)
                .attr("r", radiusScale(d.value))
        });
    
    var circles = node.append("circle")
        .style("fill", function(d) { return color(d.group); })
        .attr("r", 0)
        .transition().duration(transitionDuration)
        .attr("r", function(d) { return radiusScale(d.value); });
    
    var texts = node.append("text")
        .attr("dy", ".3em")
        .style("text-anchor", "middle")
        .style("opacity", 0)
        .text(function(d) {
            var r = radiusScale(d.value);
            if (r / 3 > 3) return d.group.substring(0, r / 3); 
            else return '';
        })
        .transition().duration(transitionDuration)
        .style("opacity", 1)
        .attr("pointer-events", "none");
    
    /*
    circles.enter().append("circle")
      .attr("r", 0)
      .attr("fill", function(d) {
        return color(d.group);
      })
      .on("mouseover", function(d, i) {
        tip.show(d, d);
        d3.select(this.childNodes[0])
          .transition().duration(50)
          .attr("r", d.r+5)
          .transition().duration(100)
          .attr("r", d.r+3)
      }).on("mouseout", function(d, i) {
        tip.hide(d);
        d3.select(this.childNodes[0])
            .transition().duration(10)
            .attr("r", d.r)
      })
      */
    
    var chargeFn = function(d) {
      return -Math.pow(radiusScale(d.value), 2.0);
    }
    
    var centered = function(alpha) {
      return function(d) {
        d.x = d.x + (center.x - d.x) * Math.max(height/width, 1) * alpha * 0.5;
        d.y = d.y + (center.y - d.y) * Math.max(width/height, 1) * alpha * 0.5;
      };
    }
    
    var force = d3.layout.force()
        .size([width, height])
        .nodes(nodes)
        .size([width, height])
        .gravity(-0.01)
        .charge(chargeFn)
        .friction(0.9)
        .on("tick", function(e) {
          return bubbles.each(centered(e.alpha)).attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")"; 
          })
        });
        
    force.start();
        
    
    d3.select(window).on('resize', function() {
      
      if(options.width == '100%')
        width = element.getBoundingClientRect().width;
      if(options.height == '100%')
        height = popilyChart.utils.chartSize()['height'];
      
      center = {
        x: width/2,
        y: height/2,
      };
      
      radiusScale = createScale();
      svg
        .attr("width", width)
        .attr("height", height);
      
      bubbles.selectAll("circle").attr("r", function(d) { return radiusScale(d.value); });
      bubbles.selectAll("text").text(function(d) {
            var r = radiusScale(d.value);
            if (r / 3 > 3) return d.group.substring(0, r / 3); 
            else return '';
        });
      
      force
        .charge(chargeFn)
        .size([width, height])
        .resume()
        .start();
      
    }); 
    
    
    /*

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
        width = element.getBoundingClientRect().width;
        size = popilyChart.utils.chartSize();
        
        width = options.width || width;
        height = options.height || size['height'];
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
    
    */
  };

  popilyChart.chartTypes.bubble2 = chart;
})(window);

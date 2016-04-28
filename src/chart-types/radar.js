(function(window) {
  var popilyChart = window.popily.chart;
  var chart = _.clone(popilyChart.baseChart);

  chart.isStacked = false;

  chart.generate = function(data) {
    
    if(_.isUndefined(data.axis.y.tick.count))
      data.axis.y.tick.count = 10; 
    
    data = _.defaults(data, this.defaults);
  
    var element, tooltip, radius,
      width = data.size.width || "100%",
      height = data.size.height || "100%",
      element = d3.select(data.bindTo),
      total = data.axis.x.categories.length,
      maxValue, minValue,
      ticks, scale = d3.scale.linear(),
      stackedValues = [],
      columnsCount = data.data.columns.length-1,
      $$ = this;
  
    if(!this.isStacked) {
      maxValue = data.axis.y.max || data.data.columns[0][1];
      minValue = data.axis.y.min || data.data.columns[0][1];
      data.data.columns.forEach(function(column) {
        for(var i=1; i<column.length; i++) { // skip first element, serie name
          if(column[i] < minValue) minValue = column[i];
          if(column[i] > maxValue) maxValue = column[i];
        }
      });
    }
    else {
      minValue = data.axis.y.min || data.data.columns[0][1];
      maxValue = data.axis.y.max || _.reduce(data.data.columns, function(m, c) { return m+=c[1]}, 0);
      for(var i=data.data.columns[0].length-1; i>0; i--) { // skip first element, serie name
        var stackedBefore = 0;
        data.data.columns.forEach(function(column, j) {
          if(!stackedValues[j]) stackedValues[j] = [];
          stackedBefore += column[i];
          stackedValues[j][i-1] = stackedBefore;
          if(column[i] < minValue) minValue = column[i];
        });
        if(stackedBefore > maxValue) maxValue = stackedBefore;
      };
    }

    var stacked = function(d,i,k) {
      if(!$$.isStacked)
        return d;
      else
        return stackedValues[columnsCount-k][i];
    }
    
    if(width == '100%')
      width = data.bindTo.getBoundingClientRect().width;
    if(height == '100%')
      height = data.bindTo.getBoundingClientRect().height || 500;
  
  	element = d3.select(data.bindTo);
  	element.style("max-height", height+'px'); 
  	
  	element.select("svg").remove();
  	var svg = element.append("svg")
			.attr("width", width)
			.attr("height", height);
    var g = svg.append("g");
    
    var dummy = g.append('g');
    dummy.selectAll('text')
      .data(data.axis.x.categories)
      .enter()
      .append('text')
      .text(function(d){return data.axis.x.tick.format(d)});
    var labelMaxBox = dummy[0][0].getBoundingClientRect();
    dummy.remove();
		  
    radius = Math.min(width/2-labelMaxBox.width, height/2-labelMaxBox.height);
	  scale
	    .range([0, radius*0.95])
	    .domain([minValue, maxValue])
	    .nice();
	  ticks = scale.ticks(data.axis.y.tick.count);

    if((_.isUndefined(data.tooltip)?true:data.tooltip)) {
      tooltip = d3.tip()
        .attr('class', 'popily-tooltip-container')
        .offset([-5, 0])
        .html(function(d, i, k) {
          k = $$.isStacked?columnsCount-k:k;
          var text = "<table class='popily-tooltip'><tr><th colspan='2'>" + data.axis.x.tick.format(data.axis.x.categories[i]) + "</th></tr>";
          text += "<tr class='popily-tooltip-name-'>";
          text += "<td class='name'><span style='background-color:" + data.colors[k] + "'></span> " + data.data.columns[k][0] + "</td>";
          text += "<td class='value'>" + data.axis.y.tick.format(data.data.columns[k][i+1]) + "</td>";
          text += "</tr>";
          return text + "</table>"; 
        });
      svg.call(tooltip);
    }
    
    //grid
    var ygrid = g
		  .append("g")
		  .attr("class", "popily-grid")
		  .append("g")
		  .attr("class", "popily-ygrids");
	  var ygridLines = ygrid
		  .selectAll('g')
		  .data(ticks)
		  .enter()
		  .append('g')
		  .selectAll(".popily-ygrids")
	    .data(data.axis.x.categories)
	    .enter()
	    .append("svg:line")
	    .attr("class", "popily-ygrid")
	    .attr("x1", function(d,i,k){return scale(ticks[k])*(1-Math.sin(i*2*Math.PI/total));})
	    .attr("y1", function(d,i,k){return scale(ticks[k])*(1-Math.cos(i*2*Math.PI/total));})
	    .attr("x2", function(d,i,k){return scale(ticks[k])*(1-Math.sin((i+1)*2*Math.PI/total));})
  	  .attr("y2", function(d,i,k){return scale(ticks[k])*(1-Math.cos((i+1)*2*Math.PI/total));})
	    .attr("transform", function(d,i,k) { return "translate(" + (width/2-scale(ticks[k])) + ", " + (height/2-scale(ticks[k])) + ")"; });
	  
	  var axis = g.selectAll(".popily-axis popily-axis-y")
		  .data(data.axis.x.categories)
		  .enter()
		  .append("g")
		  .attr("class", "popily-axis popily-axis-y");

	  //Text labels
	  var yTicks = g.select(".popily-axis-y")
	    .selectAll(".tick")
	    .data(ticks)
	    .enter()
	    .append("g")
	    .attr("class", "tick")
      .append("svg:text")
      .attr("x", function(d){return scale(d)*(1-Math.sin(0));})
      .attr("y", function(d){return scale(d)*(1-Math.cos(0));})
      .attr("transform", function(d) { return "translate(" + (width/2-scale(d)+5) + ", " + (height/2-scale(d)+5) + ")";})
      .text(function(d, i) {return i?data.axis.y.tick.format(d):''});
      
    
    // axis lines
	  var axisLines = axis.append("line")
		  .attr("x1", width/2)
		  .attr("y1", height/2)
		  .attr("x2", function(d, i){return width/2+radius*(Math.sin(i*2*Math.PI/total));})
		  .attr("y2", function(d, i){return height/2-radius*(Math.cos(i*2*Math.PI/total));})
		  .attr("class", "domain")
		  .style("stroke", "grey")
		  .style("stroke-width", "1px");

    // axis labels
	  var axisLabels = axis.append("text")
		  .text(function(d){return data.axis.x.tick.format(d)})
		  .attr("text-anchor", "middle")
		  .attr("dy", "1.5em")
		  .attr("transform", function(d, i){return "translate(0, -10)"})
		  .attr("x", function(d, i){return width/2+radius*(Math.sin(i*2*Math.PI/total))+labelMaxBox.width/2*Math.sin(i*2*Math.PI/total);})
		  .attr("y", function(d, i){return height/2-radius*(Math.cos(i*2*Math.PI/total))-labelMaxBox.height/2*Math.cos(i*2*Math.PI/total) - 4 ;});


    var line = g
      .append("g")
      .attr('class', 'popily-chart-lines')
      .selectAll('.popily-chart-line')
      .data(data.data.columns)
      .enter()
	    .append("g")
	    .attr("class", "popily-chart-line")
      
    // line areas
    var shapes = line
      .append("polygon")
      .attr("class", function(d, i) {return "popily-shapes popily-lines popily-lines-"+i;})
      .style("stroke-width", "1px")
      .style("stroke", function(d,i) {return data.colors[$$.isStacked?columnsCount-i:i]})
      .attr("points",function(d, k) {
        var str="";
        d.slice(1).forEach(function(d, i) {
          str += 
            (width/2+(scale(stacked(d,i,k))*Math.sin(i*2*Math.PI/total))) + ',' +
            (height/2-(scale(stacked(d,i,k))*Math.cos(i*2*Math.PI/total))) + ' '
        })
        return str;
        })
      .style("fill", function(d, i){return data.colors[$$.isStacked?columnsCount-i:i]})
      .style("fill-opacity", 0.2)
      .on('mouseover', function (d, i){
        var z = "polygon.popily-lines-"+i;
        g.selectAll("polygon")
         .transition(200)
         .style("fill-opacity", 0.1); 
        g.selectAll(z)
         .transition(200)
         .style("fill-opacity", .7);
      })
      .on('mouseout', function(){
        g.selectAll("polygon")
         .transition(200)
         .style("fill-opacity", 0.2);
      })
      
    // circles
    var points = line
      .selectAll('.popily-circles')
      .data(function(d, series) {return d.slice(1);})
      .enter()
      .append("svg:circle")
		  .attr("class", function(d, i) {return "popily-shapes popily-circles popily-circles-"+i;})
		  .attr('r', 3)
		  .attr("cx", function(d,i,k) {
		    return width/2+scale(stacked(d,i,k))*(Math.sin(i*2*Math.PI/total));
		  })
		  .attr("cy", function(d,i,k){
		    return height/2-scale(stacked(d,i,k))*(Math.cos(i*2*Math.PI/total));
		  })
		  .style("fill", function(d, i, k) {return data.colors[$$.isStacked?columnsCount-k:k];})
		  .style("fill-opacity", .9)
		  
	    .on('mouseover', function (d, i, k){
		    if(tooltip) tooltip.show(d, i, k);
        var z = "polygon.popily-lines-"+k;
        g.selectAll("polygon")
         .transition(200)
         .style("fill-opacity", 0.1); 
        g.selectAll(z)
         .transition(200)
         .style("fill-opacity", .7);
		    d3.select(this).attr('r', 5)
	      })
		  .on('mouseout', function(d){
		    if(tooltip) tooltip.hide(d);
		    d3.select(this).attr('r', 3)
        g.selectAll("polygon")
         .transition(200)
         .style("fill-opacity", 0.2);
	    });
      
    d3.select(window).on('resize', function() {
      
      if((data.size.width||'100%') == '100%')
        width = data.bindTo.getBoundingClientRect().width;
      if((data.size.height||'100%') == '100%')
        height = data.bindTo.getBoundingClientRect().height || 500;
      
      radius = Math.min(width/2-labelMaxBox.width, height/2-labelMaxBox.height);
      scale
	      .range([0, radius*0.95])
  	  ticks = scale.ticks(data.axis.y.tick.count);
	    
    	element.style("max-height", height+'px'); 
      svg
        .attr("width", width)
        .attr("height", height);
      
      ygridLines
        .attr("x1", function(d,i,k){return scale(ticks[k])*(1-Math.sin(i*2*Math.PI/total));})
	      .attr("y1", function(d,i,k){return scale(ticks[k])*(1-Math.cos(i*2*Math.PI/total));})
	      .attr("x2", function(d,i,k){return scale(ticks[k])*(1-Math.sin((i+1)*2*Math.PI/total));})
    	  .attr("y2", function(d,i,k){return scale(ticks[k])*(1-Math.cos((i+1)*2*Math.PI/total));})
	      .attr("transform", function(d,i,k) { return "translate(" + (width/2-scale(ticks[k])) + ", " + (height/2-scale(ticks[k])) + ")"; });
      
      yTicks
        .attr("x", function(d){return scale(d)*(1-Math.sin(0));})
        .attr("y", function(d){return scale(d)*(1-Math.cos(0));})
        .attr("transform", function(d) { return "translate(" + (width/2-scale(d)+5) + ", " + (height/2-scale(d)+5) + ")";});
      
      axisLines
		    .attr("x1", width/2)
		    .attr("y1", height/2)
		    .attr("x2", function(d, i){return width/2+radius*(Math.sin(i*2*Math.PI/total));})
		    .attr("y2", function(d, i){return height/2-radius*(Math.cos(i*2*Math.PI/total));})
		    
      axisLabels
		    .attr("transform", function(d, i){return "translate(0, -10)"})
		    .attr("x", function(d, i){return width/2+radius*(Math.sin(i*2*Math.PI/total))+labelMaxBox.width/2*Math.sin(i*2*Math.PI/total);})
		    .attr("y", function(d, i){return height/2-radius*(Math.cos(i*2*Math.PI/total))-labelMaxBox.height/2*Math.cos(i*2*Math.PI/total) - 4 ;});
		    
      shapes
        .attr("points",function(d, k) {
          var str="";
          d.slice(1).forEach(function(d, i) {
            str += 
              (width/2+(scale(stacked(d,i,k))*Math.sin(i*2*Math.PI/total))) + ',' +
              (height/2-(scale(stacked(d,i,k))*Math.cos(i*2*Math.PI/total))) + ' '
          })
          return str;
        });
        
      points
        .attr("cx", function(d,i,k) {return width/2+scale(stacked(d,i,k))*(Math.sin(i*2*Math.PI/total));})
	      .attr("cy", function(d,i,k){return height/2-scale(stacked(d,i,k))*(Math.cos(i*2*Math.PI/total));});
        
        
    }); 
      
    
  }
  


  chart.assignAxis = function(columns, calculation, options) {
      var data;
      if(columns.length == 2)
        data = popilyChart.chartTypes.bar.assignAxis(columns,calculation,options);
      else
        data = popilyChart.chartTypes.barCommon.assignAxis(columns,calculation,options);
      return data;
  };

  chart.render = function(element, options, formattedData) {
  
    var data;
    var xLabel = formattedData.chartData.x.label;
    var yLabel = formattedData.chartData.y.label;
    var xFormat

    if(formattedData.chartData.z) {
      data = popilyChart.chartData.c3ify( formattedData.chartData.x.values,
                                        formattedData.chartData.y.values,
                                        formattedData.chartData.z.values);
    }
    else {
      var column = [formattedData.chartData.y.label];
      column.push.apply(column, formattedData.chartData.y.values)
      data = {
        columns: [column],
        groups: false,
        categories: formattedData.chartData.x.values
      };
    }
    
    if(formattedData.chartData.x.dataType == 'datetime') {
      var variation = options.variation || formattedData.chartData.metadata.intervals[0];
      var xFormatStr = popily.chart.format.formatFromInterval(variation);
      xFormat = d3.time.format(xFormatStr);
      var fullFormat = d3.time.format('%Y-%m-%d %H:%M:%S');
      data.categories = _.map(data.categories, function(c) {return fullFormat.parse(c);})
    }
    
    var chartData = {
      bindTo: element,
      data : {
        columns: data.columns,
        groups: data.groups
      },
      axis: {
        x: {
          show: options.xAxis,
          categories: data.categories,
          tick: {
            format: popily.chart.format.formatAxis(formattedData.chartData.x, options, xFormat)
          },
          label: {
           text: options.xLabel || xLabel,
          },
        },
        y: {
          min: 0,
          show: options.yAxis,
          label: {
            text: options.yLabel || yLabel,
          },
          tick: {
            format: popily.chart.format.formatAxis(formattedData.chartData.y, options, d3.format(",")),
          }
        },
      },
      colors: options.colors,
      legend: (!_.isUndefined(options.legend) ? options.legend : true),
      tooltip: (_.isUndefined(options.tooltip)?true:options.tooltip),
      size: {
        height: options.height,
      },
      grid: _.isUndefined(options.xGrid)?false:options.xGrid,
    }
  
    var c = this.generate(chartData);
  
    return c;
    //return popilyChart.chartTypes.linear.render(element, options, rawData, true);
  };

  popilyChart.chartTypes.radar = chart;
})(window);

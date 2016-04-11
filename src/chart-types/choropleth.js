(function(window) {
  var popilyChart = window.popily.chart;

  var chart = _.clone(popilyChart.baseChart);
  chart.defaultFor = [
    'average_by_state',
    'sum_by_state',
    'sum_by_country',
    'average_by_country',
    'count_by_country',
    'count_by_state'
  ];
  chart.accepts = [];

  chart.getVal = function(unitName, valueLookup) {
      if(valueLookup[unitName]) {
          return valueLookup[unitName];
      }

      var name = unitName;
      if(name.length == 2) {
          name = name.toUpperCase();
      }
      else {
          name = name[0].toUpperCase() + name.slice(1);
      }

      return {'name':name, 'value': 'n/a'};
  };

  chart.prepData = function(rawData, options) {
    var that = this;
    var limit = that.defaults.categoryLimit;
    var cleanValues = that.cleanData(rawData);

    var order = options.order || 'auto';
    cleanValues = popilyChart.chartData.sortData(cleanValues[0],popilyChart.format.toNumber(cleanValues[1]));

    var cleanXValues = cleanValues[0];
    var cleanYValues = popilyChart.format.formatNumbers(cleanValues[1]);

    var cleanXValuesSlugified = _.map(cleanXValues, popilyChart.format.slugify);
    var valueLookup = _.object(cleanXValuesSlugified, cleanXValues);
    valueLookup = _.mapObject(valueLookup, function(val, key) { 
      return {'name': val};
    });

    _.each(_.zip(cleanXValuesSlugified,cleanYValues), function(arr) {
        if(arr[1]) {
            valueLookup[arr[0]]['value'] = numeral(arr[1]).format('0,0');
        }
        else {
            valueLookup[arr[0]]['value'] = arr[1];
        }
    });

    return [cleanXValuesSlugified, cleanYValues, valueLookup];
  };

  chart.render = function(element, options, rawData) {
      var that = this;
      var preppedData = that.prepData(rawData, options);
      var xValues = preppedData[0];
      var yValues = preppedData[1];
      var valueLookup = preppedData[2];

      /*var currentMousePos = { x: -1, y: -1 };
      var onMouseMove = function(event) {
        currentMousePos.x = event.pageX;
        currentMousePos.y = event.pageY
      };

      element.onmousemove = onMouseMove;*/

      var insightType = rawData.analysisType;
      var geoJson = popilyChart.data.world.countries;
      var isState = false;

      if(insightType.indexOf('_state') > -1) {
          geoJson = popilyChart.data.countries.USA;
          isState = true;

          var lengths = _.map(xValues,function(x) { return x.length; });
          var totalLength = _.reduce(lengths,function(total, l) { return total + l });

          if(totalLength/xValues.length < 4) {
              geoJson = popilyChart.data.countries.USAabbr;
          }
      }

      var tooltip = d3.select(element)
              .append("div")
              .classed("popily-tooltip-container", true)
              .style("position", "fixed")
              .style("top", "0px")
              .style("visibility", "hidden")

      var mapObj = d3.geomap.choropleth().geofile(geoJson);

      if(isState) {
          mapObj = mapObj.projection(d3.geo.albersUsa);
          var mapSize = [960,500]
          var mapScaleRate = 1;
      }
      else {
          mapObj = mapObj.projection(d3.geo.equirectangular);
          var mapSize = [960,500]
          var mapScaleRate = 0.15;
        //map = map.projection(d3.geo.mercator);
      }
    
    element.style.marginLeft = 'auto';
    element.style.marginRight = 'auto';
    var mapRatio = mapSize[0]/mapSize[1];

    if(options.height && options.height.toString().indexOf('%') > -1) {
      console.error('Choropleth map height must be supplied as pixel value, defaulting to 500');
      options.height = 500;
    }
    
    var height = options.height || 500;
    var width = element.getBoundingClientRect().width;
    if(width/mapRatio < height) {
        var height = width/mapRatio;
    }
    else {
        width = height*mapRatio;
        element.style.width = width;
    }

    var scale = height * mapRatio * mapScaleRate;

    var mapColors = options.colors;
    if(_.difference(options.colors, popilyChart.baseChart.defaults.options.colors).length == 0) {
      var mapColors = colorbrewer.Greens[9];
    }
    
    var format = function(d) {
        return d3.format(',.2f')(d);
    }
    //mapObj.properties.colors = mapColors.slice(5);
    //console.log(mapObj.properties);

    mapObj = mapObj
        .column('yValue')
        .unitId('xValue')
        .format(format)
        .duration(options.skipAnimation ? 0 : 350)
        .legend(_.isUndefined(options.legend) || options.legend)
        .colors(mapColors)
        .scale(scale)
        .postUpdate(function(m) { 
            wHeight = window.innerHeight;
            wWidth = window.innerWidth;
            
            var legend = d3.select('.'+options.uniqueClassName+' g.legend');
            var textsCount = mapColors.length+1;
            var maxTextsCount = legend.attr('height') / 15;
            
            var texts = d3.selectAll('.'+options.uniqueClassName+' g.legend text');
            texts
              .each(function(d, i) {
                console.log(i % Math.ceil(textsCount/maxTextsCount));
                if(i+1 != texts.size() && (i+1) % Math.ceil(textsCount/maxTextsCount) != 0 )
                  d3.select(this).style('display', 'none');
              });
            
            var paths = d3.select('.'+options.uniqueClassName+' g.units').selectAll('path');
            paths.selectAll('title').remove();
            if(_.isUndefined(options.tooltip) || options.tooltip) {
                paths.on("mouseover", function(d) {
                    var selected = d3.select(this);
                    var unitName = selected.attr('class').split('unit-')[1].trim();

                    selected.classed("active", true );
                    var label = that.getVal(unitName,valueLookup);
                    
                    var markup = '<table class="popily-tooltip"><tbody>';
                    
                    markup += '<tr class="popily-tooltip-name"><td class="name"><span style="background: '+selected.style('fill')+'"></span>'+label['name']+'</td><td class="value">'+label['value']+'</td></tr>';
                    
                    markup += '</tbody></table>'
                    
                    tooltip.html(markup)
                      .style("visibility", "visible");
                    return false;
                  })
                .on("mousemove", function(){
                  tooltip.style("top", Math.min((d3.event.y-10), wHeight-30)+"px").style("left",(d3.event.x+10)+"px");
                })
                .on("mouseout",  function(d) {
                  d3.select(this).classed("active", false)
                  tooltip.style("top", "0px").style('visibility', 'hidden');
                })
            }
        });

    console.log(mapObj.properties);

    var data = _.map(_.zip(xValues,yValues), function(arr) { 
                        return  {
                                    xValue:arr[0],
                                    yValue:arr[1] 
                                } 
                    });
    d3.select(element)
        .datum(data)
        .call(mapObj.draw, mapObj);

    if(options.showLegend === false) {
      element.classList.add('hide-legend');
    }

    var wHeight = window.innerHeight;
    var wWidth = window.innerWidth;

    var onWindowResize = function() {
      if(wHeight == window.innerHeight && wWidth == window.innerWidth)
            return;
        wHeight = window.innerHeight;
        wWidth = window.innerWidth;
        
        var svg = element.querySelector('svg');
        d3.select(svg).remove();
        element.style.width = 'auto';
                    
        height = options.height || 500;
        width = element.parentNode.getBoundingClientRect().width;
        if(width/mapRatio < height) {
            height = width/mapRatio;
        }
        else {
            width = height*mapRatio;
            element.style.width = width;
        }
        scale = height * mapRatio * mapScaleRate;
        mapObj.scale(scale);
        mapObj.translate([width/2, height/2]);
 
        d3.select(element)
            .datum(data)
            .call(mapObj.draw, mapObj);
    };
    
    window.addEventListener("resize", onWindowResize);
  };

  popilyChart.chartTypes.choropleth = chart;
})(window);

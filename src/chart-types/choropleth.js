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
      var dataDirectory = options.dataDirectory || popily.basePath + '/data/';

      var currentMousePos = { x: -1, y: -1 };
      var onMouseMove = function(event) {
        currentMousePos.x = event.pageX;
        currentMousePos.y = event.pageY
      };

      document.onmousemove = onMouseMove;

      var insightType = rawData.analysisType;
      var geoFile = dataDirectory + '/world/countries.json';
      var isState = false;

      if(insightType.indexOf('_state') > -1) {
          geoFile = dataDirectory + '/countries/USA.json';
          isState = true;

          var lengths = _.map(xValues,function(x) { return x.length; });
          var totalLength = _.reduce(lengths,function(total, l) { return total + l });

          if(totalLength/xValues.length < 4) {
              geoFile = dataDirectory + '/countries/USA-abbr.json';
          }
      }

      var tooltip = d3.select("body")
              .append("div")
              .style("position", "absolute")
              .style("z-index", "10")
              .style("top", "0px")
              .style("visibility", "hidden")
              .style("background", "white")
              .style("padding", "4px 8px")
              .style("font-color", "#444")
              .style("font-weight", "bold")
              .text("a simple tooltip");

      var mapObj = d3.geomap.choropleth().geofile(geoFile);

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
      mapColors = ['Greens'];
    }
    
    var mapColor = mapColors[_.random(0, mapColors.length - 1)]; 

    var format = function(d) {
        return d3.format(',.2f')(d);
    }

    mapObj = mapObj
        .colors(colorbrewer[mapColor][9])
        .column('yValue')
        .unitId('xValue')
        .format(format)
        .legend(true)
        .scale(scale)
        .postUpdate(function(m) { 
            var paths = d3.select('g.units').selectAll('path');
            paths.on("mouseover", function(d) {
                var selected = d3.select(this);
                var unitName = selected.attr('class').split('unit-')[1].trim();

                selected.classed("active", true );

                var label = that.getVal(unitName,valueLookup);
                tooltip.text(label['name'] + ": " + label['value'])
                  .style("visibility", "visible");
              })
            .on("mousemove", function(){
              tooltip.style("top", Math.min((currentMousePos.y-10), wHeight-30)+"px").style("left",(currentMousePos.x+10)+"px");
            })
            .on("mouseout",  function(d) {
              d3.select(this).classed("active", false)
              tooltip.style("top", "0px").style('visibility', 'hidden');
            })
            
        });

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

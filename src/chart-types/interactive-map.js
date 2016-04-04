(function(window) {
  var popilyChart = window.popily.chart;
  
  var chart = _.clone(popilyChart.baseChart);

  chart.defaultFor = [
    'geo_points',
    'geo_points_category',
    'geo_points_amount',
    'geo_points_category_amount'
  ];
  chart.accepts = [];

  chart.prepData = function(rawData, options) {
    var xValues = rawData.chartData.x.values;
    var zValues = [];
    if(rawData.chartData.z) {
      zValues = rawData.chartData.z.values;
    }
    var yValues = [];
    if(rawData.chartData.y) {
      yValues = rawData.chartData.y.values;
    }
    var rowLabels = [];
    if(rawData.chartData.metadata.rowlabels) {
      rowLabels = rawData.chartData.metadata.rowlabels;
    }

    return [xValues, yValues, zValues, rowLabels]

  };

  chart.render = function(element, options, rawData) {
    console.log(rawData);
    var preppedData = this.prepData(rawData, options);
    var coords = preppedData[0];
    var categories = preppedData[2];
    var amounts = preppedData[1];
    var labels = preppedData[3];
    var metadata = rawData.chartData.metadata;
    var analysisType = rawData.analysisType;

    var radiusToZoom = function(radius) {
        return Math.round(9-Math.log(radius)/Math.LN2);
    }

    var coords = rawData.chartData.x.values;
    var categories = [];
    if(rawData.chartData.z) {
      categories = rawData.chartData.z.values;
    }

    var layer = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
    });

    if(options.height && options.height.toString().indexOf('%') > -1) {
      console.error('Interactive map height must be supplied as pixel value, defaulting to 500');
      options.height = 500;
    }
    var height = options.height || 500;
    var mapContainer = document.createElement('div');
    var elId = "popily-id-" + (Math.floor(Math.random() * 90000) + 10000).toString();
    mapContainer.id = elId;
    mapContainer.style.height = height.toString() + 'px';
    element.appendChild(mapContainer);

    //console.log(elId);

    var mapObj = L.map(elId, {
        scrollWheelZoom: false,
        center: metadata.geo_center,
        zoom: radiusToZoom(metadata.geo_radius)
    });
    var scale = d3.scale.linear();
    if(amounts.length > 0) {
      amounts = _.map(amounts, function(a) {return parseFloat(a);});
      scale.domain([_.min(amounts), _.max(amounts)]);
    }
    scale.range([metadata.geo_radius * 1, metadata.geo_radius * 250]);

    if(analysisType.indexOf('_category') > -1) {
        var categoryColorMap = {};
        var uniqueCategories = _.uniq(categories);
        var sizeDiff = uniqueCategories.length - options.colors.length;
        var colorPattern = options.colors.slice(0); //copy! 


        if(sizeDiff > 0) {
            for(var i=0;i < ((sizeDiff / options.colors.length) + 1);i++) {
                colorPattern = colorPattern.concat(colorPattern.slice(0));
            }
        }

        var combos = _.zip(uniqueCategories,colorPattern);
        _.each(combos, function(combo) {
            categoryColorMap[combo[0]] = combo[1];
        });

        var markerMap = {};
        _.each(uniqueCategories, function(uc) {
            markerMap[uc] = [];
        });

        _.each(_.zip(coords,categories,labels,amounts), function(coord) {
            var size = 20;
            if(amounts.length > 0) {
                size = scale(coord[3]);
            }

            var marker = L.circle(coord[0], size, {
                color: categoryColorMap[coord[1]],
                fillColor: categoryColorMap[coord[1]],
                fillOpacity: 0.5
            }).addTo(mapObj);

            if(labels.length == coords.length) {
                marker.bindPopup(coord[2]);
            }
            else {
                marker.bindPopup(coord[1]);
            }

            markerMap[coord[1]].push(marker);
        });

        if(options.showLegend !== false) {
          var legend = document.createElement('div');
          legend.classList.add('category-legend')

          _.each(_.keys(categoryColorMap), function(key) {
              if(key && key != 'undefined') {
                  var legendItemWrapper = document.createElement('div');
                  legendItemWrapper.setAttribute('data-category', key);
                  legendItemWrapper.classList.add('legend-color');

                  legendItemWrapper.addEventListener('mouseenter', function(e) {
                    _.each(_.keys(markerMap), function(cat) {
                        if(key == cat) {
                            _.each(markerMap[cat], function(m) {
                                m.setStyle({fillOpacity:1});
                            });
                        }
                        else {
                            _.each(markerMap[cat], function(m) {
                                m.setStyle({fillOpacity:.05,opacity:.05});
                            });
                        }
                    });
                  });

                  legendItemWrapper.addEventListener('mouseleave', function(e) {
                    _.each(_.keys(markerMap), function(cat) {
                        _.each(markerMap[cat], function(m) {
                            m.setStyle({fillOpacity:.2,opacity:.5});
                        });
                    });
                  });

                  var legendItem = document.createElement('span');
                  legendItem.style.backgroundColor = categoryColorMap[key];
                  var legendItemText = document.createElement('text');
                  legendItemText.innerHTML = key;
                  legendItemWrapper.appendChild(legendItem);
                  legendItemWrapper.appendChild(legendItemText);
                  legend.appendChild(legendItemWrapper);
              }
          });
          
          element.appendChild(legend);
          //element.style.height = (element.offsetHeight + legend.offsetHeight).toString() + 'px';
        }
    }
    else {
        //var color = _.sample(color_pattern, 1)[0];
        console.log(scale(-400));
        console.log(scale(10));
        var color = options.colors[0];
        _.each(_.zip(coords,labels,amounts), function(coord) {
            var size = 20;
            var popup = coord[1];
            if(amounts.length > 0) {
              size = scale(coord[2]);
              popup = coord[2];
            }
            var marker = L.circle(coord[0], size, {
                color: color,
                fillColor: color,
                fillOpacity: 0.5
            }).addTo(mapObj);
            if(labels.length == coords.length) {
                marker.bindPopup(popup);
            }
        });
    }
    mapObj.addLayer(layer);
  };

  popilyChart.chartTypes.interactiveMap = chart;
})(window);

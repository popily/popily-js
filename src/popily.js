'use strict';
    
(function(window) {
  var popily = window.popily || {};
  popily.chart = {};
  popily.chart.chartTypes = {};
  popily.chart.baseChart = {
    defaults: {
      options: {
          width: '100%',
          height: '100%',
          style: 'detail',
          rotated: false,
          redrawOnResize: true,
          colors: [
            '#54C88A', '#BBD442', '#85C4ED', '#FFC59C', '#4FB27A', '#741699', '#FF7364',
            '#F1C40F', '#DC8345', '#E74C3C', '#096C34', '#4D1567', '#98460C', '#DAF16B',
            '#F9D543', '#947700', '#188849', '#CC3A7F', '#A01507', '#F9D543', '#DB5C98',
            '#3499DB', '#FF988E', '#319D60', '#BC9805', '#E9F998', '#628E0B', '#1E4C7C',
            '#7ECEA1', '#4F78A3', '#C01465', '#F1C40F', '#0F85D1', '#9A51B7', '#7DA0C4',
            '#BB7FD2', '#34618F', '#947700', '#FFE26C', '#92094A', '#BF6322', '#58ADE3',
            '#9FB921', '#0665A2', '#8333A2', '#0F3863', '#BC9805', '#FFE26C', '#E989B6',
            '#C92918', '#FAA96F'
          ],
      },
      barBubbleCutoff: 30,
      chartPadding: function() { return {lefright: 0, top: 0 }; }
    },
    resize: function(chartObj, width, height) {
      console.log(1);
      chartObj.resize(width, height);
    },
    cleanData: function(rawData) {
      var xValues = rawData.chartData.x.values;
      var yValues = rawData.chartData.y.values;
      var zValues = [];
      var z2Values = [];

      if(rawData.chartData.z) {
        var zValues = rawData.chartData.z.values;
      }

      if(rawData.chartData.z2) {
        var z2Values = rawData.chartData.z2.values;
      }

      var cleanValues = popily.chart.chartData.cleanData(xValues,yValues,zValues,z2Values);

      return cleanValues;
    }
  };

  popily.chart.getChartForType = function(analysisType, chartType) {
    if(_.isUndefined(popily.chart.chartMap)) {
      _buildChartMap();
    }

    var toComplex = {
      'bar': ['barStacked', 'barGrouped'],
      'scatterplot': ['scatterplotCategory'],
      'line': ['multiLine']
    }

    if(analysisType in popily.chart.chartMap) {
        if(!_.isUndefined(chartType)) {
            if(_(popily.chart.chartMap[analysisType].allowed).contains(chartType)) {
                return chartType;
            }
            else if(popily.chart.chartMap[analysisType].defaultChart === chartType) {
              return chartType;
            }
            else if(toComplex.hasOwnProperty(chartType)) {
              var toReturn;
              _.each(toComplex[chartType], function(complexChartType) {
                if(_(popily.chart.chartMap[analysisType].allowed).contains(complexChartType)) {
                  toReturn = complexChartType;
                }
                else if(popily.chart.chartMap[analysisType].defaultChart === complexChartType) {
                  toReturn = complexChartType;
                }
              });
              
              if(!_.isUndefined(toReturn)) {
                return toReturn;
              }

              console.error(chartType + ' not possible for ' + analysisType);
            }
            else {
                console.error(chartType + ' not possible for ' + analysisType);
            }
        }
        return popily.chart.chartMap[analysisType].defaultChart;
    }
    else {
        console.error('No chart for ' + analysisType);
    }
  };

  popily.chart.create = function(apiResponse) {
  
    var ds = popily.dataset(apiResponse.columns);
    return {
      dataset : function() {
        return ds;
      },
      
      draw: function(element, options) {
        var that = this;
        var calculation = apiResponse.calculation;
        var axisAssignments = popily.chart.analyze.assignToAxis(ds.getColumns(), options);
        var analysisType = popily.chart.analyze.determineType(ds.getColumns(), axisAssignments, calculation);
        var formattedData = popily.chart.utils.formatDataset(apiResponse, axisAssignments, analysisType);
        
        var labels = popily.chart.generateLabels(calculation, axisAssignments, options.transformations || []);

        var chartType = popily.chart.getChartForType(analysisType, options.chartType);
        var chartClass = popily.chart.chartTypes[chartType];
        var extraCss = '';
        
        //options = _.extend(chartClass.defaults.options, options);

        _.each(_.keys(popily.chart.baseChart.defaults.options), function(key) {
          if(!options[key]) {
            options[key] = popily.chart.baseChart.defaults.options[key];
          }
        });
        options.uniqueClassName = _.uniqueId('popily-id-');

        if(typeof element === "string") {
          element = document.querySelector(element);
        }
        
        element.classList.add('popily');
        element.classList.add(options.uniqueClassName);
        element.innerHTML = '';
        if(options.title) {
          var titleElement = document.createElement("div");
          titleElement.classList.add('popily-title');
          if(options.title === true)
            titleElement.innerHTML = labels.title;
          else
            titleElement.innerHTML = options.title;
            
          element.appendChild(titleElement);
          
          var titleCss = '';
          if(options.titleFontSize)
            titleCss += 'font-size: '+options.titleFontSize+';';
          if(options.titleFontFamily)
            titleCss += 'font-family: '+options.titleFontFamily+';';
          if(options.titleFontColor)
            titleCss += 'color: '+options.titleFontColor+';';
          if(titleCss)
            extraCss += '.'+options.uniqueClassName+ ' .popily-title {'+titleCss+'}';
        }
        
        var chartTextCss = '';
        if(options.chartFontSize)
          chartTextCss += 'font-size: '+options.chartFontSize+';';
        if(options.chartFontFamily)
          chartTextCss += 'font-family: '+options.chartFontFamily+';';
        if(options.chartFontColor)
          chartTextCss += 'fill: '+options.chartFontColor+';';
        if(chartTextCss)
          extraCss += '.'+options.uniqueClassName+ ' text {'+chartTextCss+'}';

        if(options.chartBackgroundColor) {
          chartCss = 'fill: '+options.chartBackgroundColor+';';
          extraCss += '.'+options.uniqueClassName+ ' .popily-chart {'+chartCss+'}';
        }
          
        if(extraCss) {
          var style = popily.chart.utils.createStyleElement(extraCss);
          element.appendChild(style);
        }
  
        var chartElement = document.createElement("div");
        chartElement.classList.add('popily-chartarea');
        element.appendChild(chartElement);
        
        var chart = chartClass.render(chartElement, options, formattedData);
        return chart;
      },
      
    }
  
  } 

  popily.chart.render = function(element, apiResponse, options) {
    var that = this;
    options = options || {};
    
    if(options.filters && !options.transformations) {
      console.log('filters proprtty is deprecated, please rename it to transformations')
      options.transformations = options.filters;
    }      
    var chart = popily.chart.create(apiResponse);
    
    if(options.transformations) {
      var ds = chart.dataset();
      popily.chart.applyTransformations(ds, options.transformations);
    }
    
    return chart.draw(element, options);
    
  };

  popily.chart.loadingMessage = function(element, options) {
    if(typeof element === "string") {
      element = document.querySelector(element);
    }
    var height = (options.height || 320);

    var loaderBox = document.createElement("div");
    loaderBox.classList.add('popily-loading');
    loaderBox.style.cssText = 'height: '+height+'px; line-height: '+height+'px';


    var innerElement = document.createElement("div");
    innerElement.classList.add('popily-loading-inner');
    
    var svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgElement.classList.add('popily-spinner');
    svgElement.setAttribute('width', '65px');
    svgElement.setAttribute('height', '65px');
    svgElement.setAttribute('viewBox', '0 0 66 66');
    
    var circleElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circleElement.setAttribute('class', 'popily-spinner-path');
    circleElement.setAttribute('fill', 'none');
    circleElement.setAttribute('stroke-width', '6');
    circleElement.setAttribute('stroke-linecap', 'round');
    circleElement.setAttribute('cx', '33');
    circleElement.setAttribute('cy', '33');
    circleElement.setAttribute('r', '30');
    svgElement.appendChild(circleElement);
    innerElement.appendChild(svgElement);
    
    if(options.poll) {
      var textElement = document.createElement("div");
      textElement.setAttribute('class', 'popily-loading-text');
      textElement.innerHTML = 'We’re doing some calculations to make this chart possible. One moment...';
      innerElement.appendChild(textElement);
    }
      
    loaderBox.appendChild(innerElement);
    element.innerHTML = '';
    element.appendChild(loaderBox);
  };

  var getThen = function(method, slug, serverOptions, poll, element, callback) {
      popily.api[method](slug, serverOptions, function(err, apiResponse) {
        if(apiResponse.hasOwnProperty('insight') && apiResponse.insight === 'not found') {
          
          if(poll && apiResponse.hasOwnProperty('source_status') && apiResponse.source_status !== 'finished') {
            // add waiting text to element

            setTimeout(function() {
              //getThen(method, slug, serverOptions, poll, element, callback);
            },1000);
          }
          else {
            console.warn('No insight found for params ' + JSON.stringify(serverOptions));
          }
        }
        else {
          callback(err, apiResponse);
        }
      });
  };

  popily.chart.getAndRender = function(element, options) {
    var chartOptions = {};
    var serverOptions = {};

    var availableChartOptions = {
      'chartType': 'chartType',
      'colors': 'colors',
      'transformations': 'transformations',
      'filters': 'transformations',
      'xLabel': 'xLabel',
      'yLabel': 'yLabel',
      'xColumn': 'xColumn',
      'groupByColumn': 'groupByColumn',
      'height': 'height',
      'width': 'width',
      'rotated': 'rotated',
      'title': 'title',
      //'xOrder': 'order',
      'barSize': 'barSize',
      'lineSize': 'lineSize',
      'pointSize': 'pointSize',
      'titleFontFamily': 'titleFontFamily',
      'titleFontSize': 'titleFontSize',
      'titleFontColor': 'titleFontColor',
      'chartFontFamily': 'chartFontFamily',
      'chartFontSize': 'chartFontSize',
      'chartFontColor': 'chartFontColor',
      'chartBackgroundColor': 'chartBackgroundColor',
      'xGrid': 'xGrid',
      'yGrid': 'yGrid',
      'timeInterval': 'interval',
      'time_interval': 'interval',
      'skipAnimation': 'skipAnimation',
      'legend': 'legend',
    };

    var availableServerOptions = {
      'columns': 'columns',
      'calculation': 'insight_actions',
      'timeInterval': 'time_interval',
      'time_interval': 'time_interval',
      'insight_action': 'insight_actions',
      'analysisType': 'insight_types'
    };
    
    if(options.hasOwnProperty('xOrder')) {
      console.log('xOrder property is not valid any more, please use transformation with op "order"');
    }

    _.each(_.keys(availableChartOptions), function(option) {
      if(options.hasOwnProperty(option)) {
        chartOptions[availableChartOptions[option]] = options[option];
      }
    });

    _.each(_.keys(availableServerOptions), function(option) {
      if(options.hasOwnProperty(option)) {
        if(['calculation', 'insight_action', 'analysisType'].indexOf(option)!==-1)
          serverOptions[availableServerOptions[option]] = [options[option]];
        else
          serverOptions[availableServerOptions[option]] = options[option];
      }
    });

    serverOptions.full = true;
    var slug, method;

    if(options.hasOwnProperty('insight')) {
      slug = options.insight;
      method = 'getInsight';
    }
    else {
      if(!options.hasOwnProperty('source')) {
        console.warn('Either the insight or source property is required');
        return false;
      }
      serverOptions.single = true;

      slug = options.source;
      method = 'getInsights';
    }

    popily.chart.loadingMessage(element, options);
    
    getThen(method, slug, serverOptions, options.poll, element, function(err, apiResponse) {
        popily.chart.render(element, apiResponse, chartOptions);
    });
  };

  popily.chart.applyTransformations = function(ds, transformations) {
    transformations.forEach(function(transformation) {
      if(['count', 'countUnique'].indexOf(transformation.op) !== -1) {
        popily.chart.applyGroupData(ds, transformation);
      }
      else if('replace' == transformation.op) {
        ds.replaceValues(transformation.column, transformation.replacements);
      }
      else if('order' == transformation.op) {
        var value = transformation.value || transformation.values;
        var type = value;
        
        if(type && type != 'asc' && type != 'desc')
          type = function(e, idx) { var i = value.indexOf(e[idx]); return i>=0 ? i : 9999; }
        ds.orderBy(transformation.column, type);
      }
      else {
        popily.chart.applyFilter(ds, transformation);
      }
    });
  };

  /*
    filter = [{
      column: <column-name>,
      op: none|eq|noteq,
      values: [<array-of-values]>
    }, .. ]
  */
  popily.chart.applyFilter = function(ds, filter) {
    
    // I think this countUnique should not be here!
    if(filter.op == 'distinct' || filter.op == 'countUnique') {
      console.log('filter countUnique is deprecated please dont use it, use "groupData" instead!');
      ds.countUnique();
    } else {
      ds.filter(filter.column, filter.op || 'eq', filter.value || filter.values);
    }
    
    return ds;
  };
  
  /*
    groupData = {
      column: <column-name-to-group-by>,
      op: count|countUnique,
      groupInto: <new-column-with-aggregated-values>,
      customFunction: <optional-custom-aggregation-function>
      customDataType: <optional-custom-type-ofaggregations>
    }
  */
  popily.chart.applyGroupData = function(ds, groupData) {
    
    if(groupData.customFunction) {
      var groupFunc = customFunction;
    }
    else if(['count', 'countUnique'].indexOf(groupData.op) !== -1) {
      var groupFunc = popily.dataset[groupData.op]
    }
    else {
      console.error('Unrecognizer grouping agregation function');
      return ds;
    }
    
    ds.groupBy(groupData.column, groupFunc, groupData.customDataType || groupFunc.dataType, groupData.groupInto || groupFunc.columnLabel);
    
    return ds;
  };
  
  
  var _buildChartMap = function() {
    var chartMap = {};

    for(var chartType in popily.chart.chartTypes) {
      var chartObj = popily.chart.chartTypes[chartType];
      _.each(chartObj.defaultFor, function(analysisType) {
        chartMap[analysisType] = chartMap[analysisType] || {};
        chartMap[analysisType].allowed = chartMap[analysisType].allowed || [];
        chartMap[analysisType].defaultChart = chartType;
        chartMap[analysisType].allowed.push(chartType);
      });

      _.each(chartObj.accepts, function(analysisType) {
        chartMap[analysisType] = chartMap[analysisType] || {};
        chartMap[analysisType].allowed = chartMap[analysisType].allowed || [];
        chartMap[analysisType].allowed.push(chartType);
      });
    }

    popily.chart.chartMap = chartMap;
  };

  function c3Customizations() {
    c3.chart.internal.fn.oldGetHorizontalAxisHeight = c3.chart.internal.fn.getHorizontalAxisHeight;
    c3.chart.internal.fn.getHorizontalAxisHeight = function(axisId) {
      var $$ = this, config = this.config;
      
      if(((axisId === 'x' && !config.axis_rotated) || (axisId === 'y' && config.axis_rotated)) && ($$.svg != false)  && (!_.isUndefined($$.x))) {
        
        var targetsToShow = $$.filterTargetsToShow($$.data.targets);
        if(!config.axis_x_tick_rotate_original)
          config.axis_x_tick_rotate_original = config.axis_x_tick_rotate;
        else
          config.axis_x_tick_rotate = config.axis_x_tick_rotate_original;
        
        var wtf, scale, test = 1, axis, g;
        
        if(axisId === 'x') {
          wtf = $$.getXDomain(targetsToShow);
          if($$.isCategorized())
            wtf[1] += 2;
          scale = $$.x.copy().domain(wtf);
        }
        else {
          wtf = $$.getYDomain(targetsToShow, 'y');
          scale = $$.y.copy().domain(wtf);
        }
        
        /*var dummy = $$.d3.select('body').append('div').classed('c3', true).classed('popily-chartarea', true);
        var svg = dummy.append("svg")
            .style('visibility', 'visible')
            .style('position', 'fixed')
            .style('top', 0).style('left', 0); */
        
        while(test && test < 10) {
          if(axisId === 'x') {
            axis = $$.axis.getXAxis(scale, $$.xOrient, $$.xAxisTickFormat, 
                                $$.xAxisTickValues, false, true, false);
            $$.axis.updateXAxisTickValues(targetsToShow, axis);
          }
          else if(axisId === 'y') {
            axis = $$.axis.getYAxis(scale, $$.yOrient, config.axis_y_tick_format, 
                                $$.yAxisTickValues, false, true, false);
          }
          g = $$.svg.append('g');
          g.call(axis);
          if(axisId === 'y') {
            var texts = g.selectAll("text")
              .attr("transform", 'rotate('+config.axis_x_tick_rotate+') translate(10, 0)')
              .style("text-anchor", 'start')
              .attr("x", 0)
              .attr("y", 11.5 - 2.5 * (config.axis_x_tick_rotate / 15) * (config.axis_x_tick_rotate > 0 ? 1 : -1));
            g.select("text").remove();
          }
          var axisWidth = g[0][0].getBoundingClientRect().width;
          var maxAxisWidth = g.select('path')[0][0].getBoundingClientRect().width;
          //console.log(axisWidth);
          //console.log(maxAxisWidth);
          if(axisWidth > maxAxisWidth + 2) {
            config.axis_x_tick_rotate = Math.min(config.axis_x_tick_rotate+10, 90);
            test = test + 1;
          }
          else
            test = 0; 
          g.remove();
        }
        //dummy.remove();
      }
      
      var h = $$.oldGetHorizontalAxisHeight(axisId);
      
      if (axisId === 'y' && config.axis_rotated && config.axis_x_tick_rotate) {
        h = 30 + $$.axis.getMaxTickWidth(axisId) * Math.cos(Math.PI * (90 - config.axis_x_tick_rotate) / 180);
      }
      
      return h;
    }
    c3.chart.internal.fn.oldgetAxisWidthByAxisId = c3.chart.internal.fn.getAxisWidthByAxisId;
    c3.chart.internal.fn.getAxisWidthByAxisId = function(id, withoutRecompute) {
      var $$ = this, config = this.config;
      return $$.oldgetAxisWidthByAxisId(id, withoutRecompute)-8;
    };
    
    for (var k in c3.chart.internal.fn.CLASS) {
      c3.chart.internal.fn.CLASS[k] = c3.chart.internal.fn.CLASS[k].replace('c3', 'popily');
    };
    
    c3.chart.internal.fn.afterInit = function(config) {
    };
    
    
    c3.chart.internal.axis.fn.constructor.prototype.redrawOld = c3.chart.internal.axis.fn.constructor.prototype.redraw;
    c3.chart.internal.axis.fn.constructor.prototype.redraw = function redraw(transitions, isHidden) {
      var $$ = this.owner;
      this.redrawOld(transitions, isHidden);
      if($$.config.axis_rotated) {
        transitions.axisY.selectAll("text")
          .attr("transform", 'rotate('+$$.config.axis_x_tick_rotate+') translate(10, 0)')
          .style("text-anchor", 'start')
          .attr("x", 10)
          .attr("y", 11.5 - 2.5 * ($$.config.axis_x_tick_rotate / 15) * ($$.config.axis_x_tick_rotate > 0 ? 1 : -1));
      }
    };
    
  }
  
  c3Customizations();

  if (typeof define === 'function' && define.amd) {
      define("popily", [], function () { return c3; });
  } else if ('undefined' !== typeof exports && 'undefined' !== typeof module) {
      module.exports = popily;
  } else {
      window.popily = popily;
  }
    
})(window);

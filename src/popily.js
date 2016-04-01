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
          ]
      },
      barBubbleCutoff: 30,
      chartPadding: {right: 50, top: 10}
    },
    resize: function(width, height) {
      this.chart.resize(width, height);
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
        
        element.classList.add('popily-box');
        element.classList.add(options.uniqueClassName);
        element.innerHTML = '';
        if(options.title) {
          var titleElement = document.createElement("div");
          titleElement.classList.add('popily-title');
          titleElement.innerHTML = labels.title;
          element.appendChild(titleElement);
          
          var titleCss = '';
          if(options.titleFontSize)
            titleCss += 'font-size: '+options.titleFontSize+';';
          if(options.titleFontFamily)
            titleCss += 'font-family: '+options.titleFontFamily+';';
          if(options.titleFontColor)
            titleCss += 'color: '+options.titleFontColor+';';
          if(titleCss)
            extraCss = '.'+options.uniqueClassName+ ' .popily-title {'+titleCss+'}';
        }
        
        if(extraCss) {
          var style = popily.chart.utils.createStyleElement(extraCss);
          element.appendChild(style);
        }
  
        var chartElement = document.createElement("div");
        chartElement.classList.add('popily-chart');
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
      'xOrder': 'order',
      'timeInterval': 'interval',
      'time_interval': 'interval',
      'barSize': 'barSize',
      'lineSize': 'lineSize',
      'pointSize': 'pointSize',
      'titleFontFamily': 'titleFontFamily',
      'titleFontSize': 'titleFontSize',
      'titleFontColor': 'titleFontColor',
      'xGrid': 'xGrid',
      'yGrid': 'yGrid',
    };

    var availableServerOptions = {
      'columns': 'columns',
      'calculation': 'insight_actions',
      'timeInterval': 'time_interval',
      'time_interval': 'time_interval',
      'insight_action': 'insight_actions',
      'analysisType': 'insight_types'
    };

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
    if(options.hasOwnProperty('insight')) {
      popily.api.getInsight(options.insight, serverOptions, function(err, apiResponse) {
        popily.chart.render(element, apiResponse, chartOptions);
      });
    }
    else {
      if(!options.hasOwnProperty('source')) {
        console.warn('Either the insight or source property is required');
        return false;
      }
      serverOptions.single = true;
      
      popily.api.getInsights(options.source, serverOptions, function(err, apiResponse) {
        popily.chart.render(element, apiResponse, chartOptions);
      });
    }
  };

  popily.chart.applyTransformations = function(ds, transformations) {
    transformations.forEach(function(transformation) {
      if(['count', 'countUnique'].indexOf(transformation.op) !== -1) {
        popily.chart.applyGroupData(ds, transformation);
      }
      else if('replace' == transformation.op) {
        ds.replaceValues(transformation.column, transformation.replacements);
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

  if (typeof define === 'function' && define.amd) {
      define("popily", [], function () { return c3; });
  } else if ('undefined' !== typeof exports && 'undefined' !== typeof module) {
      module.exports = popily;
  } else {
      window.popily = popily;
  }
  
})(window);

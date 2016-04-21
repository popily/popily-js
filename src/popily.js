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
          background: false,
          xAxis: true,
          yAxis: true,
      },
      categoryLimit: 500,
      barBubbleCutoff: 30,
      chartPadding: function() { return {lefright: 0, top: 0 }; }
    },
    resize: function(chartObj, width, height) {
      //console.log(1);
      chartObj.resize(width, height);
    },
    formatChartData: function(axisAssignments, apiResponse, chartableColumns) {
      var newData = {};
      var possibleAxis = ['x','y','z'];

      newData.chartData = {};
      newData.chartData.metadata = {};
      newData.chartData.defaultVariation = apiResponse.default_variation;
      newData.chartData.calculation = apiResponse.calculation;

      _.each(possibleAxis, function(axis) {
        if(axisAssignments.hasOwnProperty(axis)) {
          var values = axisAssignments[axis].values;
          if(axisAssignments[axis].data_type === 'coordinate') {
            values = _.map(values, JSON.parse);
          }

          newData.chartData[axis] = {
            values: values,
            label: axisAssignments[axis].column_header,
            dataType: axisAssignments[axis].data_type,
            possibleDataTypes: axisAssignments[axis].possible_data_types
          }
        }
      });

      newData.chartData.columns = _.map(chartableColumns, function(column) {
        return {
          values: column.values,
          label: column.column_header,
          dataType: column.data_type,
          possibleDataTypes: column.possible_data_types
        }
      });

      if(apiResponse.insight_metadata) {
        newData.chartData.metadata = apiResponse.insight_metadata;
      }

      return newData;
    },
    chartableColumns: function(columns,valueFilters) {
      var filtered = _.keys(valueFilters);
      var chartables = _.filter(columns, function(column) {
          if(!_.contains(filtered,column.column_header)) {
            return true;
          }
          else if(_.isArray(valueFilters[column.column_header]) && valueFilters[column.column_header].length > 1) {
            return true;
          }
          
          return false;
      });

      return chartables;
    },
    valueFilters: function(transformations) {
      if(_.isUndefined(transformations)) {
        return {};
      }

      var filters = {};
      _.each(transformations,function(transformation) {
        if(_.isUndefined(transformation.op) || _(['eq','in']).contains(transformation.op)) {
          filters[transformation.column] = transformation.value;
        }
      });

      return filters;
    }
  };

  popily.chart.create = function(apiResponse) {
    window.apiResponse = apiResponse;
    var ds = popily.dataset(apiResponse);

    return {
      dataset : function() {
        return ds;
      },
      
      draw: function(element, options) {
        
        var that = this;
        var calculation = apiResponse.calculation;

        // Determine the chart type based on the data
        var valueFilters = popily.chart.baseChart.valueFilters(options.transformations);
        var chartableColumns = popily.chart.baseChart.chartableColumns(ds.getColumns(),valueFilters);
        var chartType = popily.chart.analyze.chartTypeForData(chartableColumns, calculation, options);
        var chartClass = popily.chart.chartTypes[chartType];
        
        // Assign the data to axis (potentially modifying its structure) 
        // and manipulate the format expected by charting functions
        var axisAssignments = chartClass.assignAxis(chartableColumns, calculation, options);
        var formattedData = popily.chart.baseChart.formatChartData(axisAssignments, apiResponse, chartableColumns);

        // Build a title
        var labels = popily.chart.generateLabels(calculation, formattedData.chartData.columns, options.transformations || []);
        
        // Add custom CSS if requested by user
        var extraCss = '';
        
        _.each(_.keys(popily.chart.baseChart.defaults.options), function(key) {
          if(!(key in options)) {
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

        if(options.cardBackgroundColor) {
          extraCss += '.'+options.uniqueClassName+ '.popily {background-color: '+options.cardBackgroundColor+'}';
        }
          
        if(extraCss) {
          var style = popily.chart.utils.createStyleElement(extraCss);
          element.appendChild(style);
        }
  
        var chartElement = document.createElement("div");
        chartElement.classList.add('popily-chartarea');
        element.appendChild(chartElement);
        
        // Render the chart
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
    var ds = chart.dataset();

    if(options.variation) {
      console.log(options.variation);
      ds.assignVariation(options.variation);
    }
    
    if(options.transformations) {
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
      'chartBackgroundColor': 'background',
      'cardBackgroundColor': 'cardBackgroundColor',
      'xGrid': 'xGrid',
      'yGrid': 'yGrid',
      'timeInterval': 'variation',
      'time_interval': 'variation',
      'skipAnimation': 'skipAnimation',
      'legend': 'legend',
      'xRotation': 'xRotation',
      'yRotation': 'yRotation',
      'xAxis': 'xAxis',
      'yAxis': 'yAxis',
    };

    var availableServerOptions = {
      'columns': 'columns',
      'calculation': 'insight_actions',
      'timeInterval': 'time_interval',
      'time_interval': 'time_interval',
      'insight_action': 'insight_actions',
      'analysisType': 'insight_types',
      'calculations': 'calculations'
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
      else if('normalize' == transformation.op) {
        ds.normalize(transformation.column, transformation.columnNormalized);
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
  
  popily.chart.applyGroupData = function(ds, groupData) {
    
    if(groupData.customFunction) {
      var groupFunc = customFunction;
    }
    else if(['count', 'countUnique'].indexOf(groupData.op) !== -1) {
      var groupFunc = popily.dataset[groupData.op]
    }
    else {
      console.error('Unrecognized grouping function');
      return ds;
    }
    
    ds.groupBy(groupData.column, groupFunc, groupData.customDataType || groupFunc.dataType, groupData.groupInto || groupFunc.columnLabel);
    
    return ds;
  };


  if (typeof define === 'function' && define.amd) {
      define("popily", [], function () { return c3; });
  } else if ('undefined' !== typeof exports && 'undefined' !== typeof module) {
      module.exports = popily;
  } else {
      window.popily = popily;
  }
    
})(window);

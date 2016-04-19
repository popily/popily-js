/**
Analyze data from the Popily API and prepare for rendering
*/

(function(window) {

    var _hasOne = function(columns, dataType) {
        return _.where(columns,{data_type:dataType}).length === 1;
    };

    var _hasOnly = function(columns,dataTypes) {
        return _.every(columns, function(column) { 
                return _(dataTypes).contains(column.data_type); 
            });
    };

    var _hasPossible = function(columns, dataType, possibleType) {
        return _.some(columns, function(column) {
                if(column.data_type != dataType) {
                    return false;
                } 
                return _.contains(column.possible_data_types,possibleType);
            });
    };

    var getColumnForType = function(columns, dataType) {
        return _.findWhere(columns, {data_type: dataType});
    };

    var getTypePattern = function(columns) {
        var dataTypes = _.map(columns, function(column) { return column.data_type });
        dataTypes.sort();
        return dataTypes.toString();
    };

    var _bestForTwo = function(columns,calculation) {
        var bestType;
        var typePattern = getTypePattern(columns);

        // Anything with coordinates needs to be viewed on a map
        if(_hasOne(columns,'coordinate')) {
            bestType = 'interactiveMap';
        }

        // Everything is numeric
        else if(typePattern === 'numeric,numeric') {
            // All the columns have one value. This is like average 
            // of column 1 and average of column 2. Not a great way to 
            // visualize this, but we'll choose bar.
            if(_.every(columns,function(column) { return column.values.length === 1 })) {
                bestType = 'bar';
            }
            else {
                bestType = 'scatterplot';
            }
        }

        // Dates are shown as time series by default
        else if(typePattern === 'datetime,numeric') {
            bestType = 'line';
        }
        
        // Category + number
        else if(typePattern === 'category,numeric') {
            var hasState = _hasPossible(columns,'category','state');
            var hasCountry = _hasPossible(columns,'category','country');
            
            var hasNegative = (function() {
                var numColumn = getColumnForType(columns,'numeric');
                return _.some(numColumn.values, function(value) {
                    return parseFloat(value) < 0;
                })
            })();

            // Default to choropleth maps because those are nice
            if(hasState || hasCountry) {
                bestType = 'choropleth';
            }
            else if(columns[0].values.length > 35 && !hasNegative) {
                bestType = 'bubble';
            }
            else {
                bestType = 'bar';
            }
        }

        return bestType;
    };

    var _bestForThree = function(columns, calculation) {
        var bestType;
        var typePattern = getTypePattern(columns);

        // if datetime and category and number
        if(typePattern === 'category,datetime,numeric') {
            // if calculation is total
            if(calculation === 'sum') {
                bestType = 'stackedArea';
            }
            else {
                bestType = 'multiLine';
            }
        }
        else if(typePattern === 'datetime,numeric,numeric') {
            bestType = 'multiLine';
        }
        else if(typePattern === 'category,category,numeric') {
            if(calculation === 'average') {
                bestType = 'barGrouped';
            }
            else {
                bestType = 'barStacked';
            }
        }
        else if(typePattern === 'category,numeric,numeric') {
            // For example value/range counts (histogram) for multiple
            // number columns
            if(calculation === 'count') {
                bestType = 'barGrouped';
            }
            else {
                bestType = 'scatterplotCategory';
            }
        }
        else if(typePattern === 'category,coordinate,numeric') {
            bestType = 'interactiveMap';
        }
        else if(_hasOnly(columns,['numeric'])) {
            if(_.every(columns,function(column) {return column.values.length === 1})) {
                bestType = 'bubble';
            }
        }

        return bestType;
    };

    var chartTypeForData = function(columns, calculation, options) {
        // The data_type for any column will be one of the four Popily
        // basic data types: category, numeric, datetime, coordinate. 
        // The column will also have a possible_data_types property that may 
        // provide additional context. For example a data_type of category 
        // may also have possible_data_types like state or country.

        var bestType;
        var typePattern = getTypePattern(columns);
        options = options || {};

        var possibleTypes = {
            'bar': ['pie','bubble','bubble2','line'],
            'scatterplotCategory': ['barGrouped'],
            'barGrouped': ['barStacked'],
            'barStacked': ['barGrouped'],
            'bubble': ['bar', 'bubble2'],
            'bubble2': ['bar', 'bubble'],
            'multiLine': ['stackedArea','barGrouped','barStacked'],
            'stackedArea': ['multiLine','barGrouped','barStacked'],
            'choropleth': ['bar','bubble','bubble2'],
            'line': ['bar']
        };

        if(columns.length === 1) {
            bestType = 'sentence';
        }
        if(columns.length === 2) {
            bestType = _bestForTwo(columns,calculation);
        }
        else if(columns.length === 3) {
            bestType = _bestForThree(columns,calculation);
        }
        else {
            if(_hasOne(columns,'datetime') && _hasOnly(columns,['datetime','numeric'])) {
                bestType = 'multiLine';
            }
            else if(_hasOne(columns,'category') && _hasOnly(columns,['category','numeric'])) {
                if(calculation === 'sum') {
                    bestType = 'barStacked';
                } 
                else {
                    bestType = 'barGrouped';
                }
            }
            else if(_hasOnly(columns,['numeric'])) {
                if(_.every(columns,function(column) {return column.values.length === 1})) {
                    bestType = 'bubble';
                }
            }
        }
        
        if(_.isUndefined(bestType)) {
            bestType = 'table';
        }

        if(options.hasOwnProperty('chartType')) {
            if(options.chartType === 'table') {
                bestType = 'table';
            }

            if(possibleTypes.hasOwnProperty(bestType)) {
                if(_.contains(possibleTypes[bestType], options.chartType)) {
                    bestType = options.chartType;
                }
            }
        }

        return bestType;

    };

    window.popily.chart.analyze = {
        chartTypeForData: chartTypeForData,
        getTypePattern: getTypePattern,
        getColumnForType: getColumnForType
    }
})(window);

/**
Analyze data from the Popily API and prepare for rendering
*/

(function(window) {
    var categoricals = [
        'category',
        'state',
        'country',
        'zipcode',
        'rowlabel'
    ];

    var numerals = [
        'numeric',
        'currency'
    ];

    var isA = function(dataType, column) {
        if(_.isUndefined(column)) {
            return false;
        }
        var typeList = dataType === 'number' ? numerals : categoricals;
        return _(typeList).contains(column.data_type);
    };

    var isNumeric = function(column) {
        return isA('number', column);
    };

    var isCategorical = function(column) {
        return isA('category', column);
    };

    var hasSingleEquality = function(filters) {
        return _.some(filters, function(_filter) {
            var op = _filter.op || 'eq';
            if(op === 'eq' && _filter.values.length === 1) {
                return true;
            }
            return false;
        });
    };

    var hasDistinct = function(filters) {
        return _.some(filters, function(_filter) {
            return _filter.op === 'distinct' || _filter.op === 'countUnique';
        });
    };

    var assignToAxis = function(columns, options) {
        options = options || {};
        var filters = options.filters;
        var axisAssignments = {};
        var filterRef = {};

        var assigned = [];
        var isAssigned = function(prop) {
            return _(assigned).contains(prop);
        };

        if(!_.isUndefined(filters)) {
            _.each(filters, function(columnFilter) {
                _.each(columns, function(column) {
                    if(!filterRef.hasOwnProperty(column.column_header)) {
                        filterRef[column.column_header] = [];
                    }
                    if(column.column_header === columnFilter.column) {
                        filterRef[column.column_header].push(columnFilter);
                    }
                });
            });
        }

        var hasSingleOrDistinct = function(column) {
            if(!filterRef.hasOwnProperty(column.column_header)) {
                return false;
            }

            if(hasDistinct(filterRef[column.column_header])) {
                return true;
            }

            if(hasSingleEquality(filterRef[column.column_header])) {
                return true;
            }

            return false;
        };

        
        // Allow for user to set x,z. In order for this to be possible
        // we need to ensure that these are the first columns we check.
        var useColumns = [],
            xColumn,
            zColumn;

        if(options.xColumn) {
            xColumn = _.find(columns, function(column) {
                return column.column_header === options.xColumn;
            });
            if(xColumn) {
                useColumns.push(xColumn);
            }
        }
        if(options.groupByColumn) {
            zColumn = _.find(columns, function(column) {
                return column.column_header === options.groupByColumn;
            });
            if(zColumn) {
                useColumns.push(zColumn);
            }
        }

        var usedHeaders = _.pluck(useColumns, 'column_header');
        _.each(columns, function(column) {
            if(!_(usedHeaders).contains(column.column_header)) {
                useColumns.push(column);
            }
        });

        if(useColumns.length < columns.length) {
            useColumns = columns;
        }

        // Now that we have a definite column order, we can inspect
        // the columns. 
        var column, dataType;
        for (index = 0; index < useColumns.length; index++) {
            column = useColumns[index];
            dataType = column.data_type;

            // Check user options
            if(options.xColumn && column.column_header === options.xColumn) {
                axisAssignments.x = column;
                assigned.push('x');
                continue;
            }

            if(options.groupByColumn && column.column_header === options.groupByColumn) {
                axisAssignments.z = column;
                assigned.push('z');
                continue;
            }
            
            // check filters
            if(filterRef.hasOwnProperty(column.column_header) && filterRef[column.column_header].length > 0) {
                // if column has filter where and 1 value, it is z

                if(hasSingleEquality(filterRef[column.column_header])) {
                    if(isAssigned('z')) {
                        axisAssignments.z2 = column;
                        assigned.push('z2');
                        continue;
                    }
                    else {
                        axisAssignments.z = column;
                        assigned.push('z');
                        continue;
                    }
                }

                // if column has filter distinct/countUnique
                else if(hasDistinct(filterRef[column.column_header])) {
                    // if we already assigned z2, then it is z
                    if(isAssigned('x')) {
                        axisAssignments.z = column;
                        assigned.push('z');
                        continue;
                    }
                    else {
                        axisAssignments.x = column;
                        assigned.push('x');
                        continue; 
                    }
                }

            }

            // geo
            if(dataType === 'coordinate') {
                axisAssignments.x = column;
                assigned.push('x');
                continue;
            }

            // if column is numeric
            if(isNumeric(column)) {
                // if we already have a y
                if(isAssigned('y')) {
                    // if there are three columns it is y2
                    if(columns.length > 3) {
                        axisAssignments.y2 = column;
                        assigned.push('y2');
                        continue;
                    }
                    // if two columns it is x
                    else {
                        axisAssignments.x = column;
                        assigned.push('x');
                        continue;
                    }
                }
                // else it is y
                else {
                    axisAssignments.y = column;
                    assigned.push('y');
                    continue;
                }
            }

            else if(dataType === 'datetime' && !hasSingleOrDistinct(column)) {
                axisAssignments.x = column;
                assigned.push('x');
                continue;
            }

            // if column is category
            else if(isCategorical(column)) {
                // if we already have x
                if(isAssigned('x')) {
                    // if we already have z
                    if(isAssigned('z')) {
                        axisAssignments.z2 = column;
                        assigned.push('z2');
                        continue;
                    }
                    else {
                        axisAssignments.z = column;
                        assigned.push('z');
                        continue;
                    }
                }
                else {
                    axisAssignments.x = column;
                    assigned.push('x');
                }
            } 
        }
        return axisAssignments;
    };

    var determineType = function(columns, axisAssignments, calculation) {
        //console.log(axisAssignments);

        var types = {
            countByCategory: 'count_by_category',
            averageByCategory: 'average_by_category',
            sumByCategory: 'sum_by_category',
            geoPoints: 'geo_points',
            geoPointsCategory: 'geo_points_category',
            geoPointsAmount: 'geo_points_amount',
            geoPointsCategoryAmount: 'geo_points_category_amount',
            scatterplot: 'scatterplot',
            scatterplotByCategory: 'scatterplot_by_category',
            countPerCategoryByDatetime: 'count_per_category_by_datetime',
            ratioPerCategory: 'ratio_per_category',
            countByState: 'count_by_state',
            countByCountry: 'count_by_country'
        };

        var defaultType = (function() {
            if(calculation==='comparison') {
                return 'scatterplot';
            }

            var typeStr = calculation;
            var sortedColumns = _(columns).sortBy('data_type');

            _.each(sortedColumns, function(column) {
                if(!isNumeric(column)) {
                    typeStr += '_by_' + column.data_type;
                }
            });

            return typeStr;
        })();

        // geo_points
        if(axisAssignments.x.data_type === 'coordinate') {
            if(axisAssignments.hasOwnProperty('z')) {
                if(axisAssignments.z.values.length === 1) {
                    if(axisAssignments.hasOwnProperty('y')) {
                        return types.geoPointsAmount;
                    }
                    return types.geoPoints;
                }
                if(axisAssignments.hasOwnProperty('y')) {
                    return types.geoPointsCategoryAmount;
                }

                return types.geoPointsCategory;
            }
            else if(axisAssignments.hasOwnProperty('y')) {
                return types.geoPointsAmount;
            }

            return types.geoPoints;
        }

        // scatterplot
        if(isNumeric(axisAssignments.x) &&
            axisAssignments.hasOwnProperty('y') && 
            isNumeric(axisAssignments.y)) {

            if(columns.length === 3) {
                return types.scatterplotByCategory;
            }
            return types.scatterplot;
        }

        // count_by_category
        if(columns.length === 2 && 
            isCategorical(axisAssignments.x) === 'category' && 
            isNumeric(axisAssignments.y)) {

            return types[calculation + 'ByCategory'];
        }

        if(columns.length === 3 &&
            axisAssignments.hasOwnProperty('z') &&
            axisAssignments.z.values.length === 1) {

            if(axisAssignments.x.data_type === 'datetime') {
                return types[calculation + 'PerCategoryByDatetime'];
            }

            return types[calculation + 'ByCategory'];
        }

        if(calculation === 'geo') {
            if(axisAssignments.x.data_type === 'state') {
                return types.countByState;
            }

            if(axisAssignments.x_data_type === 'country') {
                return types.countByCountry;
            }
        }

        // ratio_per_category
        if(columns.length === 2 &&
            calculation === 'ratio' &&
            axisAssignments.x.values.length === 1 &&
            axisAssignments.hasOwnProperty('y') &&
            axisAssignments.y.values.length === 1) {

            return types.ratioPerCategory;
        }

        return defaultType;
    };

    window.popily.chart.analyze = {
        assignToAxis: assignToAxis,
        determineType: determineType
    }
})(window);
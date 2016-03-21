/**
Analyze data from the Popily API and prepare for rendering
*/

(function(window) {
    var formatData = function(insightData) {
        var newData = _.extend({}, insightData);

        newData.chartData = {}
        if(newData.x_values) {
          newData.chartData.x = { values: newData.x_values, label: newData.x_label };
        }
        if(newData.y_values) {
          newData.chartData.y = { values: newData.y_values, label: newData.y_label };
        }
        if(newData.z_values) {
          newData.chartData.z = { values: newData.z_values, label: newData.z_label };
        }

        if(newData.insight_metadata) {
          newData.chartData.metadata = newData.insight_metadata;
        }

        if(newData.analysis_type) {
          newData.analysisType = newData.analysis_type;
        }

        if(newData.analysisType.indexOf('geo') > -1) {
          newData.chartData.x.values = _.map(newData.chartData.x.values, JSON.parse);
        }

        return newData;
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
            return _filter.op === 'distinct';
        });
    };

    var assignToAxis = function(columns, filters) {
        var axisAssignments = {};
        var filterRef = {};

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

        var column, dataType;
        for (index = 0; index < columns.length; index++) {
            column = columns[index];
            dataType = column.data_type;
            
            // check filters
            if(filterRef.hasOwnProperty(column.column_header) && filterRef[column.column_header].length > 0) {
                // if column has filter where and 1 value, it is z
                if(hasSingleEquality(filterRef[column.column_header])) {
                    if(axisAssignments.hasOwnProperty('z')) {
                        axisAssignments.z2 = column;
                        continue;
                    }
                    else {
                        axisAssignments.z = column;
                        continue;
                    }
                }

                // if column has filter distinct
                else if(hasDistinct(filterRef[column.column_header])) {
                    // if we already assigned z2, then it is z
                    if(axisAssignments.hasOwnProperty('z2')) {
                        axisAssignments.z = column;
                        continue;
                    }
                    else {
                        if(axisAssignments.hasOwnProperty('z')) {
                            axisAssignments.z2 = column;
                            continue;
                        }
                        else {
                            axisAssignments.z = column;
                            continue;
                        }
                    }
                }

            }

            // if column is numeric
            if(dataType === 'numeric') {
                // if we already have a y
                if(axisAssignments.hasOwnProperty('y')) {
                    // if there are three columns it is y2
                    if(columns.length === 5) {
                        axisAssignments.y2 = column;
                        continue;
                    }
                    // if two columns it is x
                    else {
                        axisAssignments.x = column;
                        continue;
                    }
                }
                // else it is y
                else {
                    axisAssignments.y = column;
                    continue;
                }
            }

            else if(dataType === 'datetime' && !hasSingleOrDistinct(column)) {
                axisAssignments.x = column;
                continue;
            }

            // if column is category
            else if(dataType === 'category' || dataType === 'rowlabel') {
                // if we already have x
                if(axisAssignments.hasOwnProperty('x')) {
                    // if we already have z
                    if(axisAssignments.hasOwnProperty('z')) {
                        axisAssignments.z2 = column;
                        continue;
                    }
                    else {
                        axisAssignments.z = column;
                        continue;
                    }
                }
                else {
                    axisAssignments.x = column;
                }
            } 
        }

        return axisAssignments;
    };

    var inspectAPIResponse = function(apiResponse, options) {
        return formatData(apiResponse);
    };

    window.popily.chart.analyze = {
        inspectAPIResponse: inspectAPIResponse,
        assignToAxis: assignToAxis,
        formatData: formatData
    }
})(window);
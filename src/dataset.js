'use strict';

(function(window) {


  window.popily.dataset = function(insightObject) {

    var labels, dataTypes, table, columnsCache, variations;
    
    var initialize = function(insightObject) {
      labels = [];
      dataTypes = [];
      possibleDataTypes = [];
      columnsCache = null;
      variations = insightObject.variations;

      if(insightObject.hasOwnProperty('default_variation') && insightObject.default_variation) {
        variations[insightObject.default_variation] = insightObject.columns;
      }

      table = zip(insightObject.columns);
    }
    
    var zip = function(columns) {
      var data = [];
      
      _.each(columns, function(column) {
        labels.push(column.column_header);
        dataTypes.push(column.data_type);
        possibleDataTypes.push(column.possible_data_types);
        if(column.data_type == 'numeric')
          column.values = _.map(column.values, function(v) {return parseFloat(v)});
        data.push(column.values);
      });
      return _.zip.apply(null, data);
    };
    
    var unzip = function(data) {
      var columns = [];
      _.unzip(data).forEach(function(c, i) {
        columns.push({
          column_header:labels[i],
          values:c,
          data_type:dataTypes[i],
          possible_data_types: possibleDataTypes[i]
        });
      });
      return columns;
    }

    var columnIdx = function(column) {
      var idx = labels.indexOf(column);
      if(idx == -1)
        throw Error('column '+column+' not found in dataset');
      return idx;
    };
    
    var dataListeners = []
    var dataChanged = function() {
      columnsCache = null;
      dataListeners.forEach(function(listner) {
        listner();
      })
    }
  
    initialize(insightObject);
    
    return {
    
      orderBy: function(column, type) {
        var idx = columnIdx(column);
        
        if(!type || type == 'asc' || type == 'desc')
          orderTest = function(e, idx) { return e[idx]; }
        else
          orderTest = type;
        
        table = _.sortBy(table, function(e) {
          return orderTest(e, idx);
        });
        if(type == 'desc')
          table.reverse();
        dataChanged();
        return this;
      },
      
      reverse: function() {
        table = table.reverse();
        dataChanged();
        return this;
      },
      
      filter: function(column, op, value) {
        if(_.isUndefined(value)) {
          value = op;
          op = 'eq';
        }
        var idx = columnIdx(column);
        
        if(dataTypes[idx] == 'datetime' && !value instanceof Date)
          value = new Date(value);
        if(value instanceof Date)
          value = value.toISOString().replace('T', 0).slice(0, 19);
        
        if(op == 'eq')
          var testFunc = function(e) {return value.indexOf(e[idx])!==-1}
        else if(op == 'noteq')
          var testFunc = function(e) {return value.indexOf(e[idx])===-1}
        else if(op == 'gt')
          var testFunc = function(e) {return e[idx] > value}
        else if(op == 'gte')
          var testFunc = function(e) {return e[idx] >= value}
        else if(op == 'lt')
          var testFunc = function(e) {return e[idx] < value}
        else if(op == 'lte')
          var testFunc = function(e) {return e[idx] <= value}
        else if(op === 'in')
          var testFunc = function(e) { return _(value).contains(e[idx]) }
        else if(op === 'notin')
          var testFunc = function(e) { return !_(value).contains(e[idx]) }
        else {
          console.error('Unrecognized filter option: '+op);
          return this; 
        }
        table = _.filter(table, testFunc);
        dataChanged();
        return this;
      },
      
      limit : function(max) {
        if(max && _.size(table)>max ) {
          var i=0;
          var nth = Math.floor(_.size(sorted) / limit);
          table = _.filter(table, function() {
            i++;
            return i % nth == 0;
          });
          dataChanged();
        }
        return this;
      },
      
      groupBy: function(column, groupingFunction, grouppedDataType, grouppedColumnHeader ) {
        var idx = columnIdx(column);
        groupingFunction = groupingFunction || function(e) {return e;};
        grouppedColumnHeader = grouppedColumnHeader || 'groupped';
        grouppedDataType = grouppedDataType || 'numeric';

        var groupped = _.groupBy(table, function(e){ 
          return e[idx]; 
        });
        
        var keysColumn = { 
          column_header: labels[idx],
          data_type: dataTypes[idx],
          values: Object.keys(groupped)
        };
        
        var values = []
        _.map(keysColumn.values, function(k) {
          values.push(groupingFunction(groupped[k])); 
        });
        
        var grouppedColumn = {
          column_header: grouppedColumnHeader,
          data_type: grouppedDataType,
          values: values
        }
        initialize([keysColumn, grouppedColumn]);
        dataChanged();
        return this;
      },

      countUnique: function(column) {
        var idx = columnIdx(column);
        var column = this.getColumns()[idx];
        var counts = _.countBy(column.values, function(val) { return val; });
        var newColumns = [];

        var valColumn = {
          column_header: column.column_header,
          data_type: column.data_type,
          values: _(counts).keys()
        };
        var countColumn = {
          column_header: 'count_0',
          data_type: 'numeric',
          values: _(counts).values()
        };
        initialize([valColumn,countColumn]);
        dataChanged();
        return this;
      },
      
      replaceValues: function(column, replacements) {
        var idx = columnIdx(column);
        
        _.map(table, function(row) {
          if(row[idx] in replacements)
            row[idx] = replacements[row[idx]];
        });
        
        dataChanged();
        return this;
      },
      
      normalize: function(column, columnNormalized) {
        var idx = columnIdx(column);
        var normalizedIdx = columnIdx(columnNormalized);
        
        var groupped = _.groupBy(table, function(e){ 
          return e[idx]; 
        })
        _.map(groupped, function(group) {
          group.sum = _.reduce(group, function(memo, row){ return memo+row[normalizedIdx]; }, 0)
        });

        table.forEach(function(row) {
          var group = groupped[row[idx]];
          row[normalizedIdx] = 100*row[normalizedIdx]/group.sum;
        });
        
        dataChanged();
        return this;
      },
      
      getColumns: function(cb) {
        if(!columnsCache)
          columnsCache = unzip(table);
        
        if(cb) {
          cb(columnsCache);
          return this;
        }
        else
          return columnsCache;
      },
      
      getColumn: function(column, cb) {
        var columns = this.getColumns();
        var column = _.find(columns, function(c) { return c.column_header === column });
        if(cb) {
          cb(column);
          return this;
        }
        else
          return column;
      },

      assignVariation: function(variation) {
        if(variations.hasOwnProperty(variation)) {
          columnsCache = null;
          table = zip(variations[variation]);
        }
      },
      
      onChange: function(cb) {
        dataListeners.push(cb);
      }
    }
  }
  
  popily.dataset.count = function(arr) {
    return arr.length;
  }
  popily.dataset.count.dataType = 'numeric';
  popily.dataset.count.columnLabel = 'Count';
  
  popily.dataset.countUnique = function(arr) {
    return _.uniq(arr).length;
  }
  popily.dataset.countUnique.dataType = 'numeric';
  popily.dataset.countUnique.columnLabel = 'Count unique';

})(window);

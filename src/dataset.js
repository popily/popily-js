'use strict';

(function(window) {


  window.popily.dataset = function(columns, options) {

    var labels, dataTypes, table, columnsCache;
    
    var initialize = function(columns) {
      labels = [];
      dataTypes = [];
      columnsCache = null;
      table = zip(columns);
    }
    
    var zip = function(columns) {
      var data = [];
      
      _.each(columns, function(column) {
        labels.push(column.column_header);
        dataTypes.push(column.data_type);
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
          data_type:dataTypes[i]
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
    
    initialize(columns);
    
    return {
    
      orderBy: function(column) {
        var idx = columnIdx(column);
        table = _.sortBy(table, function(e) {
          return e[idx];
        });
        dataChanged();
        return this;
      },
      
      reverse: function() {
        table = table.reverse();
        dataChanged();
        return this;
      },
      
      filter: function(column, op, values) {
        if(_.isUndefined(values)) {
          values = op;
          op = 'eq';
        }
        var idx = columnIdx(column);
        
        if(op == 'eq')
          var testFunc = function(e) {return values.indexOf(e[idx])!==-1}
        else if(op == 'noteq')
          var testFunc = function(e) {return values.indexOf(e[idx])===-1}
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

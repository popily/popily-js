(function(window) {


  window.popily.dataset = function(columns, options) {

    var labels = [];
    var dataTypes = [];
    var columnsCache = null;
    
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
    
    var table = zip(columns);
    
    return {
    
      orderBy: function(column) {
        columnsCache = null;
        var idx = columnIdx(column);
        table = _.sortBy(table, function(e) {
          return e[idx];
        });
        return this;
      },
      
      reverse: function() {
        columnsCache = null;
        table = table.reverse();
        return this;
      },
      
      filter: function(column, values) {
        columnsCache = null;
        var idx = columnIdx(column);
        table = _.filter(table, function(e) {
          return values.indexOf(e[idx])!==-1;
        });
        return this;
      },
      
      limit : function(max) {
        if(max && _.size(table)>max ) {
          columnsCache = null;
          var i=0;
          var nth = Math.floor(_.size(sorted) / limit);
          table = _.filter(table, function() {
            i++;
            return i % nth == 0;
          });
        }
        return this;
      },
      
      groupBy: function(column, groupingFunction, grouppedColumnName) {
        var idx = columnIdx(column);
        groupingFunction = groupingFunction || function(e) {return e;};
        grouppedColumnName = grouppedColumnName || 'groupped';

        var groupped = _.groupBy(table, function(e){ 
          return e[column]; 
        });
        
        var keys = groupped.keys();
        var values = []
        var groupped = _.map(keys, function(k) {
          values.push(groupingFunction(groupped[k])); 
        });
        return popily.dataset({
          column: keys,
          grouppedColumnName: values
        });
      },

      distinct: function(column) {
        columnsCache = null;
        var idx = columnIdx(column);
        var used = [];

        table = _.filter(table, function(e) {
          if(used.indexOf(e[idx])!==-1) {
            return false;
          }
          used.push(e[idx]);
          return true;
        });

        return this;
      },

      distinctTogether: function(columns) {
        columnsCache = null;
        var idxs = _.map(columns, columnIdx);
        var used = [];

        table = _.filter(table, function(e) {
          var combined = '';
          _.each(idxs, function(idx) {
            combined += '__' + e[idx];
          });
          if(used.indexOf(combined)!==-1) {
            return false;
          }
          used.push(combined);
          return true;
        });
        return this;
      },

      /*
      countDistinct: function(column, assignCounts) {
        if(_.isUndefined(assignCounts)) {
          assignCounts = 'count_0';
        }

        _.countBy([1, 2, 3, 4, 5], function(num) {
          return num % 2 == 0 ? 'even': 'odd';
        });
      },
      */
      
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
      }
      
    }
  }

  popily.dataset.count = function(arr) {
    return arr.length;
  }

  popily.dataset.countUnique = function(arr) {
    return _.uniq(arr).length;
  }

})(window);
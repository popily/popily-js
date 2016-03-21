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

        return popily.dataset([valColumn,countColumn]);
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
      }
      
    }
  }

})(window);
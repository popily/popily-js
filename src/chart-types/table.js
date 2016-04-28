(function(window) {
  var popilyChart = window.popily.chart;
  
  var chart = _.clone(popilyChart.baseChart);
  chart.assignAxis = function(columns, calculation, options) {
      var axis = {
        columns: columns
      };
      return axis;
  };


  chart.prepData = function(formattedData, options) {
      var columns = formattedData.chartData.columns;
      var interval = options.interval || formattedData.chartData.defaultVariation;

      _.each(columns, function(column) {
          if(column.dataType === 'datetime') {
            column.values = popilyChart.format.formatDates(column.values,interval);
          }
          else if(column.dataType === 'numeric') {
            column.values = popilyChart.format.formatNumbers(column.values,2);
          }
      });

      return columns;
  };

  chart.render = function(element, options, formattedData) {
      var columns = this.prepData(formattedData,options);
      var headers = _.pluck(columns,'label');
      var values = _.pluck(columns,'values');
      var rows = _.zip.apply(null, values);

      var table = document.createElement('table');
      table.classList.add('popily-table');
      var thead = document.createElement('thead');
      var tbody = document.createElement('tbody');
      var theadrow = document.createElement('tr');

      _.each(headers,function(header) {
        var th = document.createElement('th');
        th.innerHTML = header;
        theadrow.appendChild(th);
      });

      _.each(rows, function(items) {
        var tr = document.createElement('tr');
          _.each(items, function(item) {
            var td = document.createElement('td');
            td.innerHTML = item;
            tr.appendChild(td);
          });

        tbody.appendChild(tr);
      });

      thead.appendChild(theadrow);
      table.appendChild(thead);
      table.appendChild(tbody);

      element.appendChild(table);

      return table;
  };

  popilyChart.chartTypes.table = chart;
})(window);

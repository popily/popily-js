(function(window) {

  var c3ify = function(xValues,yValues,zValues) {
      var groupings = [];
      var columns = [];
      var xyz = _.zip(xValues,zValues,yValues);

      //console.log(yValues);

      _.each(_.uniq(xValues),function(x) {
          _.each(_.uniq(zValues),function(z) {
              groupings.push([x,z,0]);
          });

      });

      _.each(xyz,function(_xyz) {
          _.each(groupings, function(pair) {
              if(_xyz[0] === pair[0] && _xyz[1] === pair[1]) {
                  pair[2] = _xyz[2];
              }
          });
      });

      var categories = _.uniq(_.map(groupings, function(group) { return group[0]; }));
      var valuePairs = _.map(groupings, function(group) { return [group[1],group[2]] });
      var labels = _.uniq(_.map(groupings, function(group) { return group[1] }));
      var values;
      _.each(labels, function(label) {
          values = _.map(_.filter(valuePairs, function(vp) {
              return vp[0] == label}),function(vp) {
                  return vp[1]; });
          columns.push([label].concat(values));
      });

      return {
          categories: categories,
          columns: columns,
          groups: labels
      }
  };

  var c3ifyMulti = function(xValues,yValues,zValues,z2Values) {
    var zipped = _.zip(xValues,yValues,zValues,z2Values);
    var sep = '___';
    var names = {};

    var columnMap = {};
    _.each(zipped, function(group) {
      var x = group[0];
      var y = group[1];
      var z = group[2];
      var z2 = group[3];
      var zz2 = z + sep + z2;

      names[zz2] = z;

      if(!columnMap[zz2]) {
        columnMap[zz2] = {};
      }
      columnMap[zz2][x] = y;
    });

    var groups = [];
    var orderedGroups = [];
    _.each(_.uniq(z2Values), function(z2) {
      orderedGroups.push(z2);
      var group = [];
      _.each(_.uniq(zValues), function(z) {
        group.push(z + sep + z2);
      });
      groups.push(group);
    });

    var xLabels = _.unique(xValues);
    var xLabelsDisplay = _.map(xLabels, function(xValue) {
      if(orderedGroups.join(','))
        return xValue + ' (' + orderedGroups.join(',') + ')';
      else 
        return xValue;
    });

    var columns = [];

    for(var column in columnMap) {
      var col = [column];
      _.each(xLabels, function(x) {
        col.push(parseFloat(columnMap[column][x] || 0));
      });
      columns.push(col);
    }
    
    return {
        categories: xLabelsDisplay,
        columns: columns,
        groups: groups,
        names: names
    }
  };

  var nan = -99999;
  var cleanData = function(xValues,yValues,zValues,z2Values) {
      xValues = xValues || [];
      yValues = yValues || [];
      zValues = zValues || [];
      z2Values = z2Values || [];


      var tuples = _.zip(xValues,yValues,zValues,z2Values);

      // Remove nan
      var cleaned = _.reject(tuples, function(t) {
          if (t[1] === nan || t[0] === nan) {
              return true;
          }
          return false;
      });


      return _.unzip(cleaned);

  };

  var nanToZero = function(num) {
      if(num === nan || num === 'nan') {
          return 0;
      }
      return num;
  };
  var cleanNanToZero = function(values) {
      values = _.map(values, function(v) {
          return nanToZero(v);
      });
      return values;
  };

  var dayList = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  var dayListAbbr = ['sun','mon','tue','wed','thu','fri','sat'];
  var monthList = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  var monthListAbbr = ['jan','feb','mar','apr','may','jun','jul','aug','sep','sept','oct','nov','dec'];

  var categoryType = function(values) {
      if(_.every(values, function(v) { return _(dayList).contains(v.toString().toLowerCase()) })) {
          return 'day';
      }

      if(_.every(values, function(v) { return _(dayListAbbr).contains(v.toString().toLowerCase()) })) {
          return 'dayAbbr';
      }

      if(_.every(values, function(v) { return _(monthList).contains(v.toString().toLowerCase()) })) {
          return 'month';
      }

      if(_.every(values, function(v) { return _(monthListAbbr).contains(v.toString().toLowerCase()) })) {
          return 'monthAbbr';
      }

      return null;
  }

  var sortData = function(xYalues,yValues,zValues,limit,order,z2Values) {
      return [xYalues,yValues,zValues,z2Values];
      
      var tuples = _.zip(xYalues,yValues,zValues,z2Values);
          
      if(_.every(xYalues, function(x) { return !isNaN(x); })) {
          var sorted = _.sortBy(tuples, function(t){
                              return parseInt(t[0]);
                          }); 
      }
      else if(_.every(xYalues, function(x) { return !isNaN(x.toString().charAt(0)); })) {
          var sorted = _.sortBy(tuples, function(t){
                              return t[0];
                          }); 
      }
      else {
          var cType = categoryType(xYalues);
          if(cType) {
              var compareList = dayList;
              if(cType == 'dayAbbr') {
                  compareList = dayListAbbr;
              }
              else if(cType == 'month') {
                  compareList = monthList;
              }
              else if(cType == 'monthAbbr') {
                  compareList = monthListAbbr;
              }

              // Sort asc by y
              var sorted = _.sortBy(tuples, function(t){
                                  return compareList.indexOf(t[0].toLowerCase());
                              }); 
          }
          else {
             // Sort asc by y
              var sorted = _.sortBy(tuples, function(t){
                                  return t[1] * -1;
                              }); 
          }
      }

      if(limit && _.size(sorted)>limit ) {
          var i=0;
          var nth = Math.floor(_.size(sorted) / limit);
          sorted = _.filter(sorted, function(item) {
                  i++;
                  return i % nth == 0;
              });
      }
      
      if(order=='asc' || order=='desc') {
          var descMultiply = (order=='desc'?-1:1)
          sorted = _.sortBy(sorted, function(t){
                      return t[1] * descMultiply;
                      });
      } 
      else if(order=='a-z' || order=='z-a') {
          if(_.every(xYalues, function(x) { return !isNaN(x); })) {
              sorted = _.sortBy(sorted, function(t){
                      return parseInt(t[0]);
                  }); 
          }
          else {
              sorted = _.sortBy(sorted, function(t){
                      return t[0];
                  }); 
          }
          if(order=='z-a')
              sorted = sorted.reverse();
      }
      return _.unzip(sorted);
  };

  var checkIsDateStr = function(str) {
    if (!isNaN((new Date(str).getTime()))) {
      return true;
    }
    return false;
  };

  window.popily.chart.chartData = {        
      sortData: sortData,
      cleanData: cleanData,
      cleanNanToZero: cleanNanToZero,
      c3ify: c3ify,
      c3ifyMulti: c3ifyMulti,
      checkIsDateStr: checkIsDateStr
  }

})(window);

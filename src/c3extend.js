'use strict';
    
(function(window) {

  function c3Customizations() {
    
    c3.chart.internal.fn.additionalConfig = {
      axis_x_tick_autorotate: true,
      axis_y_tick_rotate: true,
    }
    
    c3.chart.internal.fn.oldGetHorizontalAxisHeight = c3.chart.internal.fn.getHorizontalAxisHeight;
    c3.chart.internal.fn.getHorizontalAxisHeight = function(axisId) {
      var $$ = this, config = this.config;
      
      if(config.axis_x_tick_autorotate && ((axisId === 'x' && !config.axis_rotated) || (axisId === 'y' && config.axis_rotated)) && ($$.svg != false)  && (!_.isUndefined($$.x))) {
        
        var targetsToShow = $$.filterTargetsToShow($$.data.targets);
        if(!config.axis_x_tick_rotate_original)
          config.axis_x_tick_rotate_original = config.axis_x_tick_rotate;
        else
          config.axis_x_tick_rotate = config.axis_x_tick_rotate_original;
        
        var wtf, scale, test = 1, axis, g;
        
        if(axisId === 'x') {
          wtf = $$.getXDomain(targetsToShow);
          if($$.isCategorized())
            wtf[1] += 2;
          scale = $$.x.copy().domain(wtf);
        }
        else {
          wtf = $$.getYDomain(targetsToShow, 'y');
          scale = $$.y.copy().domain(wtf);
        }
        
        /*var dummy = $$.d3.select('body').append('div').classed('c3', true).classed('popily-chartarea', true);
        var svg = dummy.append("svg")
            .style('visibility', 'visible')
            .style('position', 'fixed')
            .style('top', 0).style('left', 0); */
        
        while(test && test < 10) {
          if(axisId === 'x') {
            axis = $$.axis.getXAxis(scale, $$.xOrient, $$.xAxisTickFormat, 
                                $$.xAxisTickValues, false, true, false);
            $$.axis.updateXAxisTickValues(targetsToShow, axis);
          }
          else if(axisId === 'y') {
            axis = $$.axis.getYAxis(scale, $$.yOrient, config.axis_y_tick_format, 
                                $$.yAxisTickValues, false, true, false);
          }
          g = $$.svg.append('g');
          g.call(axis);
          if(axisId === 'y') {
            var texts = g.selectAll("text")
              .attr("transform", 'rotate('+config.axis_x_tick_rotate+') translate(10, 0)')
              .style("text-anchor", 'start')
              .attr("x", 0)
              .attr("y", 11.5 - 2.5 * (config.axis_x_tick_rotate / 15) * (config.axis_x_tick_rotate > 0 ? 1 : -1));
            g.select("text").remove();
          }
          var axisWidth = g[0][0].getBoundingClientRect().width;
          var maxAxisWidth = g.select('path')[0][0].getBoundingClientRect().width;
          //console.log(axisWidth);
          //console.log(maxAxisWidth);
          if(axisWidth > maxAxisWidth + 2) {
            config.axis_x_tick_rotate = Math.min(config.axis_x_tick_rotate+10, 90);
            test = test + 1;
          }
          else
            test = 0; 
          g.remove();
        }
        //dummy.remove();
      }
      
      var h = $$.oldGetHorizontalAxisHeight(axisId);
      
      if (axisId === 'y' && config.axis_rotated && config.axis_x_tick_rotate) {
        h = 30 + $$.axis.getMaxTickWidth(axisId) * Math.cos(Math.PI * (90 - config.axis_x_tick_rotate) / 180);
      }
      
      return h;
    }
    c3.chart.internal.fn.oldgetAxisWidthByAxisId = c3.chart.internal.fn.getAxisWidthByAxisId;
    c3.chart.internal.fn.getAxisWidthByAxisId = function(id, withoutRecompute) {
      var $$ = this, config = this.config;
      w = $$.oldgetAxisWidthByAxisId(id, withoutRecompute);
      
      if (id === 'y' && config.axis_y_tick_rotate) {
        var position = $$.axis.getLabelPositionById(id);
        w = $$.axis.getMaxTickWidth(id, withoutRecompute) * Math.sin(Math.PI * (90 - config.axis_y_tick_rotate) / 180);
        console.log(w);
        w = w + (position.isInner ? 20 : 40);
      }

      return w-8;
    };
    
    for (var k in c3.chart.internal.fn.CLASS) {
      c3.chart.internal.fn.CLASS[k] = c3.chart.internal.fn.CLASS[k].replace('c3', 'popily');
    };
    
    c3.chart.internal.fn.afterInit = function(config) {
    };
    
    
    c3.chart.internal.axis.fn.constructor.prototype.redrawOld = c3.chart.internal.axis.fn.constructor.prototype.redraw;
    
    c3.chart.internal.axis.fn.constructor.prototype.redraw = function redraw(transitions, isHidden) {
      var $$ = this.owner;
      this.redrawOld(transitions, isHidden);
      if($$.config.axis_rotated) {
        transitions.axisY.selectAll("text")
          .attr("transform", 'rotate('+$$.config.axis_x_tick_rotate+') translate(10, 0)')
          .style("text-anchor", 'start')
          .attr("x", 10)
          .attr("y", 11.5 - 2.5 * ($$.config.axis_x_tick_rotate / 15) * ($$.config.axis_x_tick_rotate > 0 ? 1 : -1));
      }
      
      if($$.config.axis_y_tick_rotate) {
        transitions.axisY.selectAll(".tick text")
          .attr("transform", 'rotate('+($$.config.axis_y_tick_rotate*-1)+') translate(0, -10)')
          .style("text-anchor", 'end')
          .attr("x", 10)
          .attr("y", 11.5 - 2.5 * ($$.config.axis_y_tick_rotate / 15) * ($$.config.axis_y_tick_rotate > 0 ? 1 : -1));
      }
      
    };
    
    
    c3.chart.internal.axis.fn.constructor.prototype.oldDyForYAxisLabel = c3.chart.internal.axis.fn.constructor.prototype.dyForYAxisLabel;
    c3.chart.internal.axis.fn.constructor.prototype.dyForYAxisLabel = function dyForYAxisLabel() {
      var $$ = this.owner,
        position = this.getYAxisLabelPosition();
      
      if ($$.config.axis_y_tick_rotate) {
        var tickWidth = this.getMaxTickWidth('y');
        var w = position.isInner ? "1.2em" : -10 - ($$.config.axis_y_inner ? 0 : (tickWidth*Math.sin(Math.PI * (90 - $$.config.axis_y_tick_rotate) / 180) + 10));
        return w;
      } else {
        return this.oldDyForYAxisLabel();
      }
    };
    
  }
  
  c3Customizations();
  
})(window);

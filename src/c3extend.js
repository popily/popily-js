'use strict';
    
(function(window) {

  function c3Customizations() {
    
    c3.chart.internal.fn.additionalConfig = {
      axis_x_tick_autorotate: true,
      axis_y_tick_rotate: true,
      axis_y_tick_autorotate: true,
      axis_y2_tick_rotate: true,
      axis_y2_tick_autorotate: true,
      grid_background: false,
    }
    
    var c3internalFn = c3.chart.internal.fn;
    var c3axisFn = c3.chart.internal.axis.fn
    
    c3internalFn.oldInit = c3internalFn.init;
    c3internalFn.init = function() {
      this.oldInit();
      var $$ = this;

      if($$.config.grid_background) {
        var bg = $$.main.insert("rect", "rect");
        bg.classed('popily-background', true)
          .attr('width', $$.width)
          .attr('height', $$.height)
          .attr('fill', $$.config.grid_background);
      }
    }
    
    c3internalFn.updateSvgSizeOld = c3internalFn.updateSvgSize;
    c3internalFn.updateSvgSize = function() {
      var $$ = this;
      $$.updateSvgSizeOld();
      $$.svg.select('.popily-background')
        .attr('width', $$.width)
        .attr('height', $$.height);
    }
    
    c3internalFn.oldGetHorizontalAxisHeight = c3internalFn.getHorizontalAxisHeight;
    c3internalFn.getHorizontalAxisHeight = function(axisId) {
      var $$ = this, config = this.config;
      
      if(
        config['axis_'+axisId+'_tick_autorotate'] && 
        ((axisId==='x' && !config.axis_rotated) || (axisId!=='x' && config.axis_rotated)) &&
        ($$.svg != false)  && (!_.isUndefined($$.x)) ) {
        //config.axis_x_tick_autorotate && ((axisId === 'x' && !config.axis_rotated) || (axisId === 'y' && config.axis_rotated) || (axisId === 'y2' && config.axis_rotated)) && ($$.svg != false)  && (!_.isUndefined($$.x))) {
        
        var targetsToShow = $$.filterTargetsToShow($$.data.targets);
        if(!('axis_'+axisId+'_tick_rotate_original' in config))
          config['axis_'+axisId+'_tick_rotate_original'] = config['axis_'+axisId+'_tick_rotate'];
        else
          config['axis_'+axisId+'_tick_rotate'] = config['axis_'+axisId+'_tick_rotate_original'];
        
        var wtf, scale, test = 1, axis, g;
        
        if(axisId === 'x') {
          wtf = $$.getXDomain(targetsToShow);
          if($$.isCategorized())
            wtf[1] += 2;
          scale = $$.x.copy().domain(wtf);
        }
        else if(axisId === 'y') {
          wtf = $$.getYDomain(targetsToShow, 'y');
          scale = $$.y.copy().domain(wtf);
        }
        else if(axisId === 'y2') {
          wtf = $$.getYDomain(targetsToShow, 'y2');
          scale = $$.y2.copy().domain(wtf);
        }
        else
          return;
        
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
          else if(axisId === 'y2') {
            axis = $$.axis.getYAxis(scale, $$.yOrient, config.axis_y2_tick_format, 
                                $$.y2AxisTickValues, false, true, false);
          }
          g = $$.svg.append('g');
          g.call(axis);
          if(axisId === 'y') {
            var texts = g.selectAll("text")
              .attr("transform", 'rotate('+config['axis_'+axisId+'_tick_rotate']+')')
              .style("text-anchor", 'start')
              .attr("x", 0)
              .attr("y", 11.5 - 2.5 * (config['axis_'+axisId+'_tick_rotate'] / 15) * (config['axis_'+axisId+'_tick_rotate'] > 0 ? 1 : -1));
            g.select("text").remove();
          }
          else if(axisId === 'y2') {
            var texts = g.selectAll("text")
              .attr("transform", 'rotate(-'+config['axis_'+axisId+'_tick_rotate']+')')
              .style("text-anchor", 'start')
              .attr("x", 10)
              .attr("y", 11.5 - 2.5 * (config['axis_'+axisId+'_tick_rotate'] / 15) * (config['axis_'+axisId+'_tick_rotate'] > 0 ? 1 : -1));
            g.select("text").remove();
          }
          var axisWidth = g[0][0].getBoundingClientRect().width;
          var maxAxisWidth = g.select('path')[0][0].getBoundingClientRect().width;
          
          if(axisWidth > maxAxisWidth + 2) {
            config['axis_'+axisId+'_tick_rotate'] = Math.min(config['axis_'+axisId+'_tick_rotate']+10, 90);
            test = test + 1;
          }
          else
            test = 0; 
          g.remove();
        }
      }
      
      if (config['axis_'+axisId+'_tick_rotate'] && config['axis_' + axisId + '_show']) {
        var h = 30 + $$.axis.getMaxTickWidth(axisId) * Math.cos(Math.PI * (90 - config['axis_'+axisId+'_tick_rotate']) / 180);
      }
      else
        var h = $$.oldGetHorizontalAxisHeight(axisId);
      return h;
    }

    c3internalFn.oldgetAxisWidthByAxisId = c3internalFn.getAxisWidthByAxisId;
    c3internalFn.getAxisWidthByAxisId = function(id, withoutRecompute) {
      var $$ = this, config = this.config;
      w = $$.oldgetAxisWidthByAxisId(id, withoutRecompute);
      var position = $$.axis.getLabelPositionById(id);
      
      if (id === 'x' && config.axis_x_tick_rotate && config.axis_rotated) {
        w = $$.axis.getMaxTickWidth(id, withoutRecompute) * Math.sin(Math.PI * (90 - config.axis_x_tick_rotate) / 180);
        w = w + (position.isInner ? 20 : 40);
      }
      else if (id === 'y' && config.axis_y_tick_rotate) {
        w = $$.axis.getMaxTickWidth(id, withoutRecompute) * Math.sin(Math.PI * (90 - config.axis_y_tick_rotate) / 180);
        w = w + (position.isInner ? 20 : 40);
      }
      else if (id === 'y2' && config.axis_y2_tick_rotate) {
        w = $$.axis.getMaxTickWidth(id, withoutRecompute) * Math.sin(Math.PI * (90 - config.axis_y2_tick_rotate) / 180);
        w = w + (position.isInner ? 20 : 40);
      }

      return w-8;
    };
    
    for (var k in c3.chart.internal.fn.CLASS) {
      c3.chart.internal.fn.CLASS[k] = c3.chart.internal.fn.CLASS[k].replace('c3', 'popily');
    };
    
    c3.chart.internal.fn.afterInit = function(config) {
    };
    
    
    c3axisFn.constructor.prototype.redrawOld = c3axisFn.constructor.prototype.redraw;
    c3axisFn.constructor.prototype.redraw = function redraw(transitions, isHidden) {
      var $$ = this.owner, config = $$.config;
      this.redrawOld(transitions, isHidden);
      
      if($$.config.axis_y_tick_rotate) {
        transitions.axisY.selectAll(".tick text")
          .attr("transform", 'rotate('+($$.config.axis_y_tick_rotate*(config.axis_rotated?1:-1))+') '+ (config.axis_rotated?'translate(10, 0)':'translate(0, -10)'))
          .style("text-anchor", (config.axis_rotated?'start':'end'))
          .attr("x", 10)
          .attr("y", 11.5 - 2.5 * ($$.config.axis_y_tick_rotate / 15) * ($$.config.axis_y_tick_rotate > 0 ? 1 : -1));
      }
      else {
        transitions.axisY.selectAll(".tick text")
          .attr("transform", '');
      }

      if($$.config.axis_y2_tick_rotate) {
        transitions.axisY2.selectAll(".tick text")
          .style("text-anchor", (config.axis_rotated?'start':'start'))
          .attr("transform", 'rotate('+($$.config.axis_y2_tick_rotate*(config.axis_rotated?-1:-1))+') '+ (config.axis_rotated?'translate(10, 0)':'translate(0, 0)'))
          .attr("x", 10)
          .attr("y", 11.5 - 2.5 * ((90-$$.config.axis_y2_tick_rotate) / 15) * ($$.config.axis_y2_tick_rotate > 0 ? 1 : -1));
      }
      else {
        transitions.axisY2.selectAll(".tick text")
          .attr("transform", '');
      }
      
      if($$.config.axis_x_tick_rotate && config.axis_rotated) {
        transitions.axisX.selectAll(".tick text")
          .attr("transform", function(d) { return 'rotate('+($$.config.axis_x_tick_rotate*-1)+', 0, '+d3.select(this).attr('y')+') translate(0, 0)';})
          .style("text-anchor", 'end')
      }
      
    };
    
    
    c3axisFn.constructor.prototype.oldDyForYAxisLabel = c3axisFn.constructor.prototype.dyForYAxisLabel;
    c3axisFn.constructor.prototype.dyForYAxisLabel = function dyForYAxisLabel() {
      var $$ = this.owner,
        position = this.getYAxisLabelPosition();
      
      if ($$.config.axis_y_tick_rotate) {
        var tickWidth = this.getMaxTickWidth('y');
        return position.isInner ? "-0.4em" : -10 - ($$.config.axis_y_inner ? 0 : (tickWidth*Math.sin(Math.PI * (90 - $$.config.axis_y_tick_rotate) / 180) + 10));
      }
      else {
        return this.oldDyForYAxisLabel();
      }
    };
    
    c3axisFn.constructor.prototype.oldDyForY2AxisLabel = c3axisFn.constructor.prototype.dyForY2AxisLabel;
    c3axisFn.constructor.prototype.dyForY2AxisLabel = function dyForY2AxisLabel() {
      var $$ = this.owner,
        position = this.getY2AxisLabelPosition();
        
      if ($$.config.axis_y2_tick_rotate) {
        var tickWidth = this.getMaxTickWidth('y2');
        return position.isInner ? "1.2em" : 20 + ($$.config.axis_y2_inner ? 0 : (tickWidth*Math.sin(Math.PI * (90 - $$.config.axis_y2_tick_rotate) / 180) + 10));
      }
      else {
        return this.oldDyForY2AxisLabel();
      }
    };

    c3axisFn.constructor.prototype.oldDyForXAxisLabel = c3axisFn.constructor.prototype.dyForXAxisLabel;
    c3axisFn.constructor.prototype.dyForXAxisLabel = function dyForXAxisLabel() {
      var $$ = this.owner,
        position = this.getXAxisLabelPosition();
        
      if ($$.config.axis_x_tick_rotate && $$.config.axis_rotated) {
        var tickWidth = this.getMaxTickWidth('x');
        return position.isInner ? "2.2em" : - 10 - ($$.config.axis_x_inner ? 0 : (tickWidth*Math.sin(Math.PI * (90 - $$.config.axis_x_tick_rotate) / 180) + 10));
      }
      else {
        return this.oldDyForXAxisLabel();
      }
    };
    
  }
  
  c3Customizations();
  
})(window);

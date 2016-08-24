(function(window) {
  var popilyChart = window.popily.chart;
  
  var chart = _.clone(popilyChart.baseChart);

  var primaryAndList = function(textBlocks, options) {
    var container = document.createElement('div');
    container.classList.add(options.containerClass);

    _.each(textBlocks, function(textBlock) {
      var d = document.createElement('div');
      d.classList.add(options.sectionClass);
      var p = document.createElement('p');
      var firstSentence = popilyChart.format.capitalize(textBlock.primary) + '.';
      p.innerHTML = firstSentence;
      d.appendChild(p);

      if (textBlock.hasOwnProperty('sub_clauses') && textBlock.sub_clauses.length > 0) {
        p.classList.add('popily-list-header');

        if (options.hasOwnProperty('listDescription')) {
          p.innerHTML = firstSentence + ' ' + options.listDescription; 
        }
        var ul = document.createElement('ul');

        _.each(_.first(textBlock.sub_clauses,3), function(subClause) {
          var li = document.createElement('li');
          li.innerHTML = popilyChart.format.capitalize(subClause);
          ul.appendChild(li);
        });

        d.appendChild(ul);
      }

      container.appendChild(d);
    });

    return container;
  };

  var granger = function(textBlocks) {
    var options = {
      containerClass: 'popily-description-granger',
      sectionClass: 'popily-description-granger-section',
      listDescription: 'For example:'
    };
    return primaryAndList(textBlocks, options);
  };

  var spearman = function(textBlocks) {
    var options = {
      containerClass: 'popily-description-correlation',
      sectionClass: 'popily-description-correlation-section',
      listDescription: 'This is particular true under the following circumstances:'
    };
    return primaryAndList(textBlocks, options);
  };

  var linearRegression = function(textBlocks) {
    var container = document.createElement('div');
    container.classList.add('popily-description-linear-regression');

    var linearBlock = textBlocks[0];
    var firstSentence = linearBlock.primary;
    var secondSentence = '';

    if (linearBlock.hasOwnProperty('sub_clauses')) {
      var subs = linearBlock.sub_clauses;
      secondSentence = popilyChart.format.joinWith(_.first(subs,5), 'and');
    }
     
    var paragraph = firstSentence + '. ';
    if (secondSentence !== '') {
      paragraph += popilyChart.format.capitalize(secondSentence) + '.';
    }

    var p = document.createElement('p');
    p.innerHTML = paragraph;

    container.appendChild(p);

    _.each(textBlocks, function(textBlock) {
      var primaryType = textBlock.description_type;
      if (primaryType !== 'linear_regression') {
        createAndAppend(container,[textBlock],primaryType);
      }
    });

    return container;
  };

  var chiSquared = function(textBlocks) {
    var container = document.createElement('div');
    container.classList.add('popily-description-chi-squared');

    _.each(textBlocks, function(textBlock) {
      var firstSentence = textBlock.primary;
      var secondSentence = '';

      var p = document.createElement('p');

      if (textBlock.hasOwnProperty('sub_clauses')) {
        var subs = textBlock.sub_clauses;
        secondSentence = popilyChart.format.joinWith(_.first(subs,5), 'and');
      }

      var paragraph = popilyChart.format.capitalize(firstSentence) + '. '; 
      paragraph += popilyChart.format.capitalize(secondSentence) + '.';

      p.innerHTML = paragraph;

      container.appendChild(p);

    });

    return container;
  };

  var cluster = function(textBlocks) {
    var options = {
      containerClass: 'popily-description-cluster',
      sectionClass: 'popily-description-cluster-section'
    };
    return primaryAndList(textBlocks, options);
  };

  var pearl = function(textBlocks) {
    var container = document.createElement('div');
    container.classList.add('popily-description-pearl');
    var p = document.createElement('p');

    if (textBlocks.length > 0) {
      p.innerHTML = popilyChart.format.capitalize(textBlocks[0].primary) + '.';
    }

    container.appendChild(p);

    return container;
  };

  var classification = function(textBlocks) {
    var container = document.createElement('div');
    container.classList.add('popily-description-classification');
    var p = document.createElement('p');
    var text = '';

    if (textBlocks.length > 0) {
      text += popilyChart.format.capitalize(textBlocks[0].primary) + '.';
      text += ' For example ' + textBlocks[0].sub_clauses[0] + '.';
      p.innerHTML = text;
    }

    container.appendChild(p);
    return container;
  };

  var empty = function(textBlocks) {
    var container = document.createElement('div');
    container.classList.add('popily-description-empty');
    var p = document.createElement('p');

    if (textBlocks.length > 0) {
      p.innerHTML = popilyChart.format.capitalize(textBlocks[0].primary) + '.';
    }

    container.appendChild(p);

    return container;
  };

  var createAndAppend = function(el,blocks,primaryType) {
    if(primaryType === 'pearl_ic') {
      el.appendChild(pearl(blocks));
    }
    else if(primaryType === 'linear_regression') {
      el.appendChild(linearRegression(blocks));
    }
    else if(primaryType === 'cluster') {
      el.appendChild(cluster(blocks));
    }
    else if(primaryType === 'spearman') {
      el.appendChild(spearman(blocks));
    }
    else if(primaryType === 'granger') {
      el.appendChild(granger(blocks));
    }
    else if(primaryType === 'classification') {
      el.appendChild(classification(blocks));
    }
    else if(primaryType === 'chi') {
      el.appendChild(chiSquared(blocks));
    }
    else if(primaryType === 'empty') {
      el.appendChild(empty(blocks));
    }
  };

  chart.render = function(element, options, rawData) {
    var that = this;
    var el = document.createElement('div');

    el.classList.add('popily-description-text');

    _.each(rawData, function(textBlocks) {
      var primaryType = textBlocks[0].description_type;
      var subEl = document.createElement('div');
      subEl.classList.add('popily-description-text-section');
      
      createAndAppend(subEl,textBlocks,primaryType);

      el.appendChild(subEl);
    });

    element.appendChild(el);
    return element;
  };

  popilyChart.chartTypes.description = chart;
})(window);

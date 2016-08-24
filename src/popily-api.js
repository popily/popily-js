'use strict';


var request = require('browser-request');

var popily = window.popily || {};

var _error = function(msg, error) {
  return {msg: msg, error: error};
};
  
var _request = function(method, path, data, callback) {
  var DEFAULT_URL = 'https://popily.com';
  var DEFAULT_BASE_PATH = '/api';

  var apiUrl = popily.api.apiUrl;
  if(!popily.api.apiUrl) {
    apiUrl = DEFAULT_URL;
  } 
  apiUrl = apiUrl + DEFAULT_BASE_PATH;

  var params = {
    method: method,
    headers: { 
      'Authorization': 'Token ' + popily.api.token,
      'Accept': 'application/json',
    },
    url: apiUrl + path// + '?format=api'
  };
      
  if('qs' in data) {
    params['qs'] = data['qs'];
    params['json'] = true;
  }
  if('json' in data) {
    params['body'] = data['json'];
    params['json'] = true;
  }
  if('form' in data) {
    params['formData'] = data['form'];
  }
  
  request(params, function(err, httpResponse, body) {
    if(err)
      return callback(_error('Request error', err));
      
    if(httpResponse.statusCode === 401)
      return callback(_error('Invalid API token'));

    if(httpResponse.statusCode === 400)
      return callback(_error('Bad request', body));

    if(httpResponse.statusCode === 404)
      return callback(_error('Not found', body));

    if(httpResponse.statusCode >= 500)
      return callback(_error('Application error', body));
      
    try {
      var response = body;
      if(typeof body === 'string')
        response = JSON.parse(body);
    } catch(e) {
      return callback(_error('Error: '+e, e) )
    }

    callback(null, response);

  });
};

var packCalculations = function(calculations) {
  var packedStr = '';
  calculations.forEach(function(f, i) {
    var filterStr = '';
    if(i > 0)
      filterStr += '__';

    filterStr += f['column'] + '!' + f['calculation'];
    packedStr += filterStr
  });
  return packedStr;
};       
        
popily.api = {
  getInteresting: function(columns, params, cb) {
    var payload = {
      columns: columns
    };
    ['target', 'tests'].forEach(function(key) {
      if(key in params)
        payload[key] = params[key]
    });
    _request('POST', '/interesting/describe/', {json: payload}, cb);
  },

  addSource: function(sourceData, cb) {
    
    var data = {};
    var possibleFields = [
      'title', 
      'description', 
      'columns', 
      'url',
      'connection_string',
      'query',
      'rows'
    ];
    possibleFields.forEach(function(key) {
      if(sourceData.hasOwnProperty(key))
        data[key] = sourceData[key];
    })

    var keys = Object.keys(data);
    if (keys.indexOf('url') === -1 && keys.indexOf('connection_string') === -1 && keys.indexOf('rows') === -1) {
      return cb('url, connection_string or rows is required');
    }

    _request('POST', '/sources/', {json: data}, cb);
      
  },

  addCustomization: function(insight, title, description, options, cb) {
    var data = {
      title: title,
      description: description,
      options: options,
      insight: insight
    };
    _request('POST', '/insight-customizations/', {json: data}, cb);
  },

  getSources: function(cb) {
    _request('GET', '/sources/', {}, cb);
  },


  getSource: function(sourceId, cb) {
    _request('GET', '/sources/'+sourceId+'/', {}, cb);
  },

  getCustomizations: function(sourceID, cb) {
    var payload = {source:sourceID};
    _request('GET', '/insight-customizations/', {qs:payload}, cb);
  },

  getCustomization: function(customizationID, cb) {
    _request('GET', '/insight-customizations/'+customizationID+'/', {}, cb);
  },

  getInsights: function(sourceId, params, cb) {
    params = params || {};
    var payload = {'source': sourceId};

    ['columns', 'insight_types', 'insight_actions'].forEach(function(key) {
      if(key in params)
        payload[key] = params[key].join(',')
    });

    if('single' in params) {
      payload['single'] = params['single'];
    }

    if('calculations' in params) {
      payload['calculations'] = packCalculations(params['calculations']);
    }

    _request('GET', '/insights/', {qs: payload}, cb);
  },

  getOverview: function(sourceId, params, cb) {
    params = params || {};
    var payload = {'source': sourceId};

    ['columns', 'insight_types', 'insight_actions'].forEach(function(key) {
      if(key in params)
        payload[key] = params[key].join(',')
    });

    if('calculations' in params) {
      payload['calculations'] = packCalculations(params['calculations']);
    }

    _request('GET', '/insights/overview/', {qs: payload}, cb);
  },

  getInsight: function(insightId, params, cb) {
    var payload = {};    
    _request('GET', '/insights/' + insightId + '/', {qs: payload}, cb);
  },

  setToken: function(token) {
    this.token = token;
  },

  setURL: function(apiUrl) {
    this.apiUrl = apiUrl;
  }
}

window.popily = popily;
module.exports = popily;

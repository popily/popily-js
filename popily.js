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
      
    try {
      var response = body;
      if(typeof body === 'string')
        response = JSON.parse(body);
      callback(null, response);
    } catch(e) {
      callback(_error('Invalid JSON received from the Stripe API: '+e, e) )
    }

  });
};

var packFilters = function(filters) {
  var packedStr = '';
  filters.forEach(function(f, i) {
    var op = 'eq'
    if('op' in f)
      op = f['op']
    
    var filterStr = '';
    if(i > 0)
      filterStr += '__';

    filterStr += f['column'] + '!' + op + '!' + ( f['values'].join(',') );
    packedStr += filterStr
  });
  return packedStr;
}

var assignCustomizations = function(dataDict, insightData) {
  [
    'title',
    'x_label',
    'y_label',
    'z_label',
    'category_order',
    'time_interval',
    'refresh_rate',
    'swap'
  ].forEach(function(key) {
    if(key in insightData)
      dataDict[key] = insightData[key];
  });

  return dataDict;
};        
        
popily.api = {
  addSource: function(sourceData, cb) {
    
    var data = {};
    ['columns', 'title', 'description'].forEach(function(key) {
      if(key in sourceData)
        data[key] = sourceData[key];
    })

    if('url' in sourceData) {
      data['url'] = sourceData['url']
      _request('POST', '/sources/', {json: data}, cb);
    }

    else if('connection_string' in sourceData ) {
      data['connection_string'] = sourceData['connection_string']
      data['query'] = sourceData['query']
      _request('POST', '/sources/', {json: data}, cb);
    }
    
    else
      cb('url or connection_string is required');
  },


  getSources: function(cb) {
    _request('GET', '/sources/', {}, cb);
  },


  getSource: function(sourceId, cb) {
    _request('GET', '/sources/'+sourceId+'/', {}, cb);
  },


  getInsights: function(sourceId, params, cb) {
    params = params || {};
    var payload = {'source': sourceId};

    ['columns', 'insight_types', 'insight_actions'].forEach(function(key) {
      if(key in params)
        payload[key] = params[key].join(',')
    });

    if('filters' in params)
      payload['filters'] = packFilters(params['filters'])

    if('full' in params)
      payload['full'] = params['full']

    if('single' in params) {
      payload['single'] = params['single'];
      payload = assignCustomizations(payload, params);
    }

    _request('GET', '/insights/', {qs: payload}, cb);
  },


  getInsight: function(insightId, params, cb) {
    var payload = {};
    if('filters' in params)
      payload['filters'] = packFilters(params['filters']);

    ['full', 'height', 'width'].forEach(function(key) {
      if(key in params)
        payload[key] = params[key];
    });

    payload = assignCustomizations(payload, params);
    
    _request('GET', '/insights/' + insightId + '/', {qs: payload}, cb);
  },


  customizeInsight: function(insightId, params, insightData, cb) {
    var data = assignCustomizations({}, insightData);
    if('filters' in params)
      data['filters'] = packFilters(params['filters'])

    _request('PUT', '/insights/' + insightId + '/', {json: data}, cb);
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
'use strict';


var request = require('browser-request');

(function () {

  var globalApiToken;
  var globalApiUrl;

  if(!window.Popily)
    window.Popily = {};
  var Popily = window.Popily;

  Popily.DEFAULT_URL = 'https://popily.com';
  Popily.DEFAULT_BASE_PATH = '/api';

  Popily.api = function(token, apiUrl) {
    return _api(token, apiUrl);
  }
  
  Popily.api.setToken = function(token, apiUrl) {
    globalApiToken = token;
    if(apiUrl)
      globalApiUrl = url;
  }
  

  var _error = function(msg, error) {
    return {msg: msg, error: error};
  };
    
  var _request = function(method, path, data, callback) {
    var params = {
      method: method,
      headers: { 
        'Authorization': 'Token ' + token,
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
        return cb(_error('Request error', err));
        
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
  
  var _packFilters = function(filters) {
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

  var _api = function(token, apiUrl) {
    
    if(!token)
      token = globalApiToken;
    if(!token)
      throw Error('Missing api token');
    
    if(!apiUrl)
      apiUrl = globalApiUrl || Popily.DEFAULT_URL
    apiUrl = apiUrl + Popily.DEFAULT_BASE_PATH
  
    return {
          
          
      addSource : function(sourceData, cb) {
        
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

        ['columns', 'insight_types', 'insight_type_categories'].forEach(function(key) {
          if(key in params)
            payload[key] = params[key].join(',')
        });

        if('filters' in params)
          payload['filters'] = _packFilters(params['filters'])

        if('full' in params)
          payload['full'] = params['full']

        _request('GET', '/insights/', {qs: payload}, cb);
      },


      getInsight: function(insightId, params, cb) {
        var payload = {};
        if('filters' in params)
          payload['filters'] = _packFilters(params['filters']);

        ['full', 'height', 'width'].forEach(function(key) {
          if(key in params)
            payload[key] = params[key];
        });
        
        _request('GET', '/insights/' + insightId + '/', {qs: payload}, cb);
      },
      
      
      customizeInsight: function(insightId, params, insightData, cb) {
        var data = {};
        [
          'title',
          'x_label',
          'y_label',
          'z_label',
          'category_order',
          'time_interval'
        ].forEach(function(key) {
          if(key in insightData)
            data[key] = insightData[key];
        });
        if('filters' in params)
          data['filters'] = _packFilters(params['filters'])

        _request('PUT', '/insights/' + insightId + '/', {json: data}, cb);
      }
      
    }
  }
  

})();

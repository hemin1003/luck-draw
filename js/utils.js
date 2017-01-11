(function(){
  // 检测设备
  var ua = navigator.userAgent;
  var device = {
    isAndroid: /(Android);?[\s\/]+([\d.]+)?/.test(ua),
    isIpad: /(iPad).*OS\s([\d_]+)/.test(ua),
    isIpod: /(iPod)(.*OS\s([\d_]+))?/.test(ua),
    isIphone: !this.isIpad && /(iPhone\sOS)\s([\d_]+)/.test(ua),
    isWechat: /micromessenger/i.test(ua)
  };

  /*utils********************************/
  var class2type = (function(){
    var ret = {};
    'Boolean Number String Function Array Date RegExp Object Error'.split(' ').forEach(function(name){
      ret[ '[object ' + name + ']' ] = name.toLowerCase();
    });
    return ret;
  })();
  var utils = {
    noop: function(){},
    type: function(value) {
      //如果是null或者undefined，直接转成String返回
      if( value == null )  return String( value )
      //RegExp，Array等都属于Object
      //为了精准判断类型，借由Object.prototype.toString跟class2type表
      //这里为什么要用core_toString而不用obj.toString的原因在刚刚试验中说明了
      return typeof value === 'object' || typeof value === 'function' ?
        class2type[ class2type.toString.call(value) ] || 'object' : typeof value
    },
    isPlainObject: function(obj){
      // Must be an Object.
      // Because of IE, we also have to check the presence of the constructor property.
      // Make sure that DOM nodes and window objects don't pass through, as well
      if ( !obj || utils.type(obj) !== "object" || obj.nodeType || utils.isWindow( obj ) ) {
        return false;
      }
      try {
        // Not own constructor property must be Object
        if ( obj.constructor &&
          !class2type.hasOwnProperty.call(obj, "constructor") &&
          !class2type.hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf") ) {
          return false;
        }
      } catch ( e ) {
        // IE8,9 Will throw exceptions on certain host objects #9897
        return false;
      }
      // Own properties are enumerated firstly, so to speed up,
      // if last one is own, then all properties are own.
      var key = undefined;
      for ( key in obj ) {}
      return key === undefined || class2type.hasOwnProperty.call( obj, key );
    },
    isEmptyObject: function(obj) {
      for ( var key in obj ) {
        return false;
      }
      return true;
    },
    isFunction: function(obj){
      return utils.type(obj) === 'function';
    },
    isArray: Array.isArray || function(obj) {
      return utils.type(obj) === 'array';
    },
    isWindow: function(obj) {
      return obj != null && obj == obj.window;
    },
    isString: function(value) {
      return typeof value === 'string';
    },
    isNumber: function(value) {
      return !isNaN( parseFloat(value) ) && isFinite( value );
    }
  };

  /*storage********************************/
  var STORE_PREFIX = 'luck_draw_'
  var storage = {
    getPrefix: function(){
      return STORE_PREFIX;
    },
    session: {
      set(key, value) {
        if(!key) return false
        window.sessionStorage.setItem(STORE_PREFIX + key, JSON.stringify(value || {}))
      },
      get(key) {
        if(!key) return null
        return JSON.parse(window.sessionStorage.getItem(STORE_PREFIX + key))
      } 
    },
    local: {
      set(key, value, ms) {

        if(!key) return false

        ms = ms || 1000*3600*24*365
        
        key = STORE_PREFIX + key
        var newValue = {
          value: value,
          expires: ms,
          time: new Date().getTime()
        }
        window.localStorage.setItem(key, JSON.stringify(newValue))
      },
      get(key) {
        if(!key) return null
        key = STORE_PREFIX + key
        
        var value = JSON.parse(window.localStorage.getItem(key))
        if (value && (new Date().getTime() - value.time < value.expires)) {
          value = value.value
        }else{
          value = null
        }
        return value
      } 
    }
  };

  /*url********************************/
  var url =  {
    getArgs(url) {
      if(typeof url !== 'string') url = window.location.href
      url = decodeURIComponent(url)
      var pos = url.indexOf('?'),
        pos2 = url.lastIndexOf('#'),
        qs = pos > -1 ? url.substring(pos+1, pos2 <= pos ? url.length : pos2) : '',
        items = qs.split('&')
      var args = {},
        arg = null, 
        name = null,
        value = null
      for(var i=0, splitPos = 0, item=null; i<items.length; i++){
        item = items[i]
        splitPos = item.indexOf('=')
        name  = item.substring(0, splitPos)
        value  = item.substring(splitPos+1)
        args[name] = value
      }
      return args
    },
    setArgs(url, name, value) {
      if(typeof url !== 'string') return ''
      var urlArgs = utils.url.getArgs(url),
        params = []

      if(utils.isPlainObject(name)){
        Object.assign(urlArgs, name)
      }else if(utils.isString(name)){
        urlArgs[name] = value
      }

      var hash = ''
      for(var key of Object.keys(urlArgs)){
        var val = urlArgs[key]
        if(val != undefined && val !== ''){
          if(key === '_hash'){
            hash = val;
          }else{
            params.push(encodeURIComponent(key) +'=' + encodeURIComponent(val)) 
          }
        }
      }
      params.length > 0 && (url = url.split('?')[0] + '?' + params.join('&'))
      hash && (url += '#'+hash)
      
      return url
    },
    replace(url) {
      window.location.replace(url)
    },
    assign(url) {
      window.location.assign(url)
    }
  };

	utils.url = url;
  utils.storage = storage;
  utils.device = device;
	window.utils = utils;
	return utils;
})();


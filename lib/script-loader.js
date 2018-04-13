var REQUIRE_REG = /require\((["'])@weex\-module\/([^\)\1]+)\1\)/g
var loaderUtils = require('loader-utils')
var Context = require('./plugin-context')

module.exports = function (content) {
  this.cacheable && this.cacheable()

  var script = content.replace(REQUIRE_REG, '__weex_require_module__($1$2$1)');
  var query  = loaderUtils.parseQuery(this.query) || {};  
  if (!query.id) { return script; }

  var callback = this.async();
  var ctx = Context.getContext(this, query.id);
  ctx.applyPlugins('weex-before-script-compile', content);

  if (ctx.hasRegPlugin('weex-style-compiled') &&
    ctx.hasRegPlugin('weex-script-compiled')) {  

    ctx.applyAfter('weex-style-compiled', ()=>{
      let result = ctx.getPluginVal('weex-script-compiled', script);
      ctx.release();
      callback(null, result);
    });
    
  } else {
    callback(null, ctx.getPluginVal('weex-script-compiled', script));
  }
}

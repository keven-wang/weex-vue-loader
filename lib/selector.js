var path = require('path')
var parse = require('./parser')
var loaderUtils = require('loader-utils')
var Context = require('./plugin-context')

module.exports = function (content) {
  this.cacheable()
  var query = loaderUtils.getOptions(this) || {}
  var filename = path.basename(this.resourcePath)
  var parts = parse(content, filename, this.sourceMap)
  var type = query.type
  var part = parts[type]
  if (Array.isArray(part)) {
    part = part[query.index]
  }
  
  var partCont = part.content
  var ctx = query.id ? Context.getContext(this, query.id) : null
  if (ctx) { partCont = ctx.getPluginVal('weex-' + type + '-part-load', partCont) }  

  this.callback(null, partCont, part.map)
}
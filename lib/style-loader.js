var styler = require('weex-styler')
var loaderUtils = require('loader-utils')
var Context = require('./plugin-context')

module.exports = function (content) {
  this.cacheable && this.cacheable()

  var query = loaderUtils.parseQuery(this.query) || {}
  var ctx   = query.id ? Context.getContext(this, query.id) : null

  return 'module.exports = ' + genStyleString(content, this, ctx)
}

// @todo:
// font-relative lengths: em, ex, ch, ic
// viewport-relative lengths: vi, vb
// https://drafts.csswg.org/css-values/#lengths
var REGEXP_LENGTH = /^([-+]?[0-9]*\.?[0-9]+)(rem|vw|vh|vmin|vmax|cm|mm|q|in|pt|pc|px)$/

function convertLength (k, v) {
  if (typeof v !== 'string') {
    return v
  }
  var result = v.match(REGEXP_LENGTH)
  if (result) {
    if (result[2] === 'px') {
      return result[1]
    }
    return result[1] + 'CSS_UNIT_' + result[2].toUpperCase()
  }
  return v
}

function genStyleString (input, loader, ctx) {
  var output = '{}'
  if (ctx) { ctx.applyPlugins('weex-before-style-rewrite', input) }

  styler.parse(input, function (err, obj) {
    if (err) {
      loader.emitError(err)
      return
    }
    
    if (obj && obj.jsonStyle) {
      if (obj.log) {
        obj.log.map((log) => {
          if (log.selectors) {
            loader.emitWarning(`${log.selectors}: ${log.reason}`)
          } else {
            loader.emitWarning(`${log.reason}`)
          }
        })
      }

      if (ctx) {
        ctx.applyPlugins('weex-after-style-rewrite', obj.jsonStyle)
      }
      
      try {
        output = JSON.stringify(obj.jsonStyle, convertLength, 2)
          .replace(/"([-+]?[0-9]*\.?[0-9]+)CSS_UNIT_([A-Z]+)"/g, '$1 * CSS_UNIT.$2')
      } catch (e) {}
    }
  })
  
  return ctx ? ctx.getPluginVal('weex-style-compiled', output) : output
}

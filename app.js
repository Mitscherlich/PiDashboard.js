const path = require('path')
const http = require('http')

const SocketIO = require('socket.io')
const Koa = require('koa')
const logger = require('koa-logger')
const serve = require('koa-static')
const mount = require('koa-mount')
const app = new Koa()
const server = http.Server(app.callback())
const debug = require('debug')('pi-dashboard:app')

// 路由
const router = require('./app/router')

const dev = process.env.NODE_ENV === 'development'

module.exports = config => {
  const { root, static, views, ws, plugins } = config

  app.context.config = config

  const io = SocketIO(server, ws)

  // 加载插件
  const allPlugins = app.context.allPlugins || (app.context.allPlugins = [])
  const loadedPlugins = app.context.loadedPlugins || (app.context.loadedPlugins = {})
  for (const name of plugins) {
    const pluginConfig = config[name]
    const pluginPath = require.resolve(pluginConfig.package, {
      paths: [
        path.resolve(root, 'app/plugins'),
        path.resolve(root, 'custom/plugins'),
      ],
    })
    allPlugins.push(Object.assign({}, { ...pluginConfig }, { name }))
    // 若插件未启用则跳过
    if (pluginConfig.enable !== true) {
      debug(`[INFO] Skip disabled plugin '${name}'`)
      continue
    }
    // 加载插件
    debug(`[INFO] Use plugin ${name}`)
    const plugin = new (require(pluginPath))
    // 如果需要初始化则初始化插件
    if (plugin.init !== null && typeof plugin.init === 'function') {
      plugin.init(pluginConfig)
    }
    // 若已存在同名的插件则跳过
    if (typeof loadedPlugins[name] !== 'undefined') {
      // 通知用户
      debug(`[WARN] Ignore plugin ${name} since a plugin has been loaded with the same name`)
      continue
    }
    loadedPlugins[name] = plugin
  }

  // 静态请求
  const assetsDir = static.dir || 'app/public'
  const assetsPrefix = static.prefix || '/assets'
  app.use(mount('/lib', serve(path.resolve(root, 'node_modules'))))
  app.use(mount(assetsPrefix, serve(path.resolve(root, assetsDir))))

  const viewsDir = views.dir || 'app/views'
  const layout = views.layout || 'template'
  const viewExt = views.ext || 'html'
  const fallback = views.fallback || false
  const template = (views.engine && views.engine.package) || 'koa-ejs'
  try {
    const render = require(template)
    render(app, {
      root: path.resolve(root, viewsDir),
      layout, viewExt,
      cache: dev ? false : true,
    })
  } catch (e) {
    // 打印错误信息
    debug('[ERROR]', e.message)
    if (fallback) {
      app.use(serve(path.join(root, viewsDir)))
    }
  }

  // 打印请求
  if (dev) {
    app.use(logger())
  }

  // 路由
  router(app, io)

  return server
}

const router = require('koa-route')
const debug = require('debug')('pi-dashboard:router')

const home = new (require('./controllers/home'))

module.exports = (app, io) => {

  const { config, loadedPlugins } = app.context

  app.use(async (ctx, next) => {
    ctx.state.config = config
    await next()
  })

  // 首页
  app.use(router.get('/', home.show))

  // APIs
  // app.use(...)

  io.of('/web').on('connection', socket => {
    debug('a web client connected')

    socket.on('fetch', ({ plugins }, cb) => {
      const res = {}
      for (const name of plugins) {
        const plugin = loadedPlugins[name]
        if (typeof plugin === 'undefined') {
          debug(`[WARN] Plugin ${name} is not installed. Have you config it properly?`)
          continue
        }
        const actions = plugin.actions
        let state = {}
        for (const action of actions) {
          state = Object.assign(state, plugin[action]())
        }
        res[name] = state
      }
      cb(res)
    })

    // 自动/手动
    socket.on('toggle auto', /* ({}, cb) */ () => {
      const fanPlugin = loadedPlugins['fan']
      if (typeof fanPlugin === 'undefined') {
        const err = new Error(new Error('[WARNING] Plugin fan is not installed. Have config it porperly?'))
        debug(err.message)
        // return cb(err)
      }
      fanPlugin['toggle_fan_auto']()
      // cb(null)
    })

    // 开/关
    socket.on('toggle state', /* ({}, cb) */ () => {
      const fanPlugin = loadedPlugins['fan']
      if (typeof fanPlugin === 'undefined') {
        const err = new Error(new Error('[WARNING] Plugin fan is not installed. Have config it porperly?'))
        debug(err.message)
        // return cb(err)
      }
      fanPlugin['toggle_fan_state']()
      // cb(null)
    })
  })
}

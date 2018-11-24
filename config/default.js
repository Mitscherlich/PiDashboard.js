module.exports = appInfo => {
  const config = {}

  config.name = appInfo.name || 'pi-dashboard' // 只影响模版渲染出来的结果

  config.version = appInfo.version || '0.0.0-rc.0'

  config.port = process.env.PORT || 3000
  config.host = process.env.HOST || '127.0.0.1'

  config.baseUrl = '/'  // nginx 代理在二级目录下时需要

  config.static = {
    dir: 'public',  // 以应用根目录的相对路径
  }

  config.views = {
    dir: 'views',
    layout: 'layout',
    ext: 'ejs',
    engine: {
      package: 'koa-ejs', // 模版引擎的包名，和 npm 包一致
    },
  }

  config.ws = {
    path: '/ws',  // 要监听的客户端路径，默认为 /socket.io
  }

  /* 插件设置 */
  config.fan = {
    pin: 8, // 指定用于控制风扇的引脚，参考 https://pinout.xyz/
    auto: {
      enable: true, // 自动开启，默认 true
      min: 36,      // 自动关闭下限
      max: 42,      // 自动启动上限
    }
  }

  return config
}

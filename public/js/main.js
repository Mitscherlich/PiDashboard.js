(exports => {
  exports.Main = class Main {
    constructor () {
      this.$monitorAlert = document.querySelector('#monitorAlert')
      this.$monitorWrapper = document.querySelector('#monitorWrapper')
      this.$coolerAlert = document.querySelector('#coolerAlert')
      this.$coolerWrapper = document.querySelector('#coolerWrapper')
      this.$btnAuto = document.querySelector('#btnAuto')
      this.$btnToggle = document.querySelector('#btnToggle')
      this.$btnRefresh = document.querySelector('#btnRefresh')
      this.$switchAuto = document.querySelector('#switchAuto')
      this.$switchToggle = document.querySelector('#switchToggle')
      this.$radioIntervals = document.querySelectorAll('input[name="interval"]')

      $(this.$btnRefresh).click(() => {
        this.init()
      })

      $(this.$switchAuto).click(() => {
        if (this.socket === null || this.socket.connected !== true) {
          return
        }
        this.socket.emit('toggle auto')
      })

      $(this.$switchToggle).click(() => {
        if (this.socket === null || this.socket.connected !== true) {
          return
        }
        this.socket.emit('toggle state')
      })

      $('#radioInterval1').click(() => {
        this.fan.interval = 1.5
      })

      $('#radioInterval2').click(() => {
        this.fan.interval = 3
      })

      $('#radioInterval3').click(() => {
        this.fan.interval = 5
      })

      this.socket = null
      // cpu 表盘
      this.cpuCurrent = 0
      this.cpuChart = null
      // 内存表盘
      this.memCurrent = 0
      this.memChart = null
      // io 表盘
      // this.ioCurrent = 0
      // this.ioChart = null
      // 风扇控制
      this.fan = {
        auto: false,
        isOpen: false,
        interval: 1.5,
        temp: 38,
      }
      // 温度图表
      this.tempGrid = null
      // 计时器
      this.t = null
    }

    init () {
      if (this.t !== null) {
        clearInterval(this.t)
        this.t = null
      }
      if (this.socket !== null && this.socket.connected) {
        this.socket.disconnect()
        this.socket = null
      } else {
        $.snackbar({ content: 'Connecting...', style: 'toast' })
      }
      const socket = io('/web', { path: '/ws' })
      socket.on('connect', () => {
        this.onConnected()
        $.snackbar({ content: 'Connected', style: 'toast' })
      })
      socket.on('disconnect', () => {
        $.snackbar({ content: 'Disconnected. Try reconnect...', style: 'toast' })
      })
      socket.on('reconnect', () => {
        $.snackbar({ content: 'Reconnected', style: 'toast' })
      })
      this.socket = socket
      // 初始化 ui
      $(this.$monitorAlert).text('Loading...').show()
      $(this.$coolerAlert).text('Loading...').show()
      $(this.$monitorWrapper).hide()
      $(this.$coolerWrapper).hide()
      switch (this.fan.interval) {
        case 1.5: this.$radioIntervals[0].checked = true; break
        case 3: this.$radioIntervals[1].checked = true; break
        case 5: this.$radioIntervals[2].checked = true; break
        default: break
      }
      // 初始化数据
      this.cpuCurrent = 0
      this.memCurrent = 0
      this.ioCurrent = 0
      // 初始化 cpu 表盘
      if (this.cpuChart === null) {
        this.cpuChart = new Chart('#cpuSvg', 'CPU Load', this.cpuCurrent)
        this.cpuChart.init()
      }
      this.cpuChart.update(this.cpuCurrent)
      // 初始化内存表盘
      if (this.memChart === null) {
        this.memChart = new Chart('#memSvg', 'Memeory Load', this.memCurrent)
        this.memChart.init()
      }
      this.memChart.update(this.memCurrent)
      // 初始化温度图表
      if (this.tempGrid === null) {
        this.tempGrid = new Grid('#realtime', 35, 45.5)
        this.tempGrid.updateData = () => this.fan.temp
        $('#tempSvg').hide()
      }
      // 初始化计时器
      this.t = setInterval(() => {
        this.beep()
      }, this.fan.interval * 1000)
    }

    beep () {
      if (!this.socket) {
        return
      }
      const socket = this.socket
      if (!socket.connected) {
        return
      }
      socket.emit('fetch', { plugins: [ 'cpu', 'mem', /* 'io', */ 'fan', ]}, ({ cpu, mem, /* io, */ fan, }) => {
        this.cpuChart.update(cpu.percent)
        this.memChart.update(mem.percent)
        if (typeof fan !== 'undefined') {
          const { temp, auto, status } = fan
          this.$switchAuto.checked = auto
          this.$switchToggle.checked = status
          this.fan.temp = temp
          if (this.tempGrid.isStarted !== true) {
            $('#tempSvg').show()
            this.tempGrid.init([{
              name: 'temp',
              data: [ [ Date.now(), this.fan.temp ] ],
            }], 1, 20)
          }
        }
      })
    }

    onConnected () {
      $(this.$monitorAlert).fadeOut(() => {
        $(this.$monitorWrapper).fadeIn()
      })
      $(this.$coolerAlert).fadeOut(() => {
        $(this.$coolerWrapper).fadeIn()
      })
    }
  }
})(window)

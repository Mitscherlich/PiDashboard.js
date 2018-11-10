const GPIO = require('rpio')
const assert = require('assert')
const debug = require('debug')('pi-dashboard:plugins:fan')

const VALID_PINS = [
  3,  // GPIO2
  5,  // GPIO3
  7,  // GPIO4
  8,  // GPIO14
  10, // GPIO15
  11, // GPIO17
  12, // GPIO18
  13, // GPIO27
  15, // GPIO22
  16, // GPIO23
  18, // GPIO24
  19, // GPIO10
  21, // GPIO9
  22, // GPIO25
  23, // GPIO11
  24, // GPIO8
  26, // GPIO7
  27, // GPIO0
  28, // GPIO1
  29, // GPIO5
  31, // GPIO6
  32, // GPIO12
  33, // GPIO13
  35, // GPIO19
  36, // GPIO16
  37, // GPIO26
  38, // GPIO20
  40, // GPIO21
]

const FETCH_COOLER_STATUS = 'fetch_cooler_status'
const TOGGLE_FAN_AUTO = 'toggle_fan_auto'
const TOGGLE_FAN_STATE = 'toggle_fan_state'

const tempUtil = new (require('./temp'))()

module.exports = class FanPlugin {
  constructor (config) {
    const { auto, pin } = config
    assert(VALID_PINS.includes(pin), `Pin ${pin} is not a valid gpio port!`)
    const { enable, min, max } = auto
    assert(min < max, `Auto toggle temperature minimum ${min} should less than maximum ${max}`)
    if (max - min < 1) {
      debug(`[INFO] The recommended maximum temperature ${max} should be at least one degree above the minimum ${min}`)
    }
    this.max = max
    this.min = min
    this.isClose = true
    this.isAuto = enable || true
    this.pin = pin
    this.temp = -1
    this.t = null
  }

  get actions () {
    return [ FETCH_COOLER_STATUS ]
  }

  auto () {
    return setInterval(() => {
      const { current } = tempUtil['fetch_cpu_temp']()
      this.temp = current
      debug(`Current temp is ${this.temp}`)
      if (this.isClose) {
        if (this.temp > this.max) {
          GPIO.write(this.pin, GPIO.LOW)
          debug('Open air cooler')
          this.isClose = false
        }
      } else {
        if (this.temp < this.min) {
          GPIO.write(this.pin, GPIO.HIGH)
          debug('Close air cooler')
          this.isClose = true
        }
      }
    }, 2000)
  }

  init () {
    // 初始化 GPIO 引脚
    GPIO.open(this.pin, GPIO.OUTPUT, GPIO.HIGH)
    this.t = this.auto()
  }

  [ FETCH_COOLER_STATUS ] () {
    return {
      auto: this.isAuto,
      status: !this.isClose,
    }
  }

  [ TOGGLE_FAN_AUTO ] () {
    if (this.isAuto) {
      clearInterval(this.t)
      debug('Disable auto cooling')
      this.t = null
      this.isAuto = false
    } else {
      this.isAuto = true
      this.t = this.auto()
      debug('Enable auto cooling')
    }
  }

  [ TOGGLE_FAN_STATE ] () {
    if (this.isAuto) {
      clearInterval(this.t)
      this.t = null
      this.isAuto = false
    }
    if (this.isClose) {
      GPIO.write(this.pin, GPIO.LOW)
      debug('Open air cooler')
      this.isClose = false
    } else {
      GPIO.write(this.pin, GPIO.HIGH)
      debug('Close air cooler')
      this.isClose = true
    }
  }
}

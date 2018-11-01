const GPIO = require('rpio')
const debug = require('debug')('pi-dashboard:plugins:fan')
const fs = require('fs')

const FETCH_COOLER_STATUS = 'fetch_cooler_status'
const TOGGLE_FAN_AUTO = 'toggle_fan_auto'
const TOGGLE_FAN_STATE = 'toggle_fan_state'

const TEMP_LOW = 38
const TEMP_HIGH = 42
const TEMP_FILE = '/sys/class/thermal/thermal_zone0/temp'

const cpuTemp = () => parseInt(fs.readFileSync(TEMP_FILE)) / 1000

module.exports = class FanPlugin {
  constructor () {
    this.isClose = true
    this.isAuto = true
    this.temp = -1
    this.t = null
  }

  get actions () {
    return [ FETCH_COOLER_STATUS ]
  }

  auto () {
    return setInterval(() => {
      this.temp = cpuTemp()
      debug(`Current temp is ${this.temp}`)
      if (this.isClose) {
        if (this.temp > TEMP_HIGH) {
          GPIO.write(PIN, GPIO.LOW)
          debug('Open air cooler')
          this.isClose = false
        }
      } else {
        if (this.temp < TEMP_LOW) {
          GPIO.write(PIN, GPIO.HIGH)
          debug('Close air cooler')
          this.isClose = true
        }
      }
    }, 2000)
  }

  init (config) {
    GPIO.open(config.pin, GPIO.OUTPUT, GPIO.HIGH)
    this.t = this.auto()
  }

  [ FETCH_COOLER_STATUS ] () {
    if (this.isAuto !== true) {
      this.temp = cpuTemp()
    }
    return {
      auto: this.isAuto,
      status: !this.isClose,
      temp: this.temp,
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
      GPIO.write(PIN, GPIO.LOW)
      debug('Open air cooler')
      this.isClose = false
    } else {
      GPIO.write(PIN, GPIO.HIGH)
      debug('Close air cooler')
      this.isClose = true
    }
  }
}

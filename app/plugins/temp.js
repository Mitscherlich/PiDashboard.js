const fs = require('fs')

const FETCH_CPU_TEMP = 'fetch_cpu_temp'

const TEMP_FILE = '/sys/class/thermal/thermal_zone0/temp'

const cpuTemp = () => parseInt(fs.readFileSync(TEMP_FILE)) / 1000

module.exports = class TempPlugin {
  get actions () {
    return [ FETCH_CPU_TEMP ]
  }

  [ FETCH_CPU_TEMP ] () {
    return {
      current: cpuTemp(),
    }
  }
}

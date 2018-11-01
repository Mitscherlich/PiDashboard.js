const os = require('os')

const FETCH_CPU_AVG = 'fetch_cpu_avg'

const cpuAvg = () => {
  const cpus = os.cpus()
  let total = 0
  let idle = 0
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += cpu.times[type]
    }
    idle += cpu.times.idle
  }
  return {
    idle, total,
    percent: 1 - idle / total,
  }
}

module.exports = class CpuPlugin {
  get actions () {
    return [ FETCH_CPU_AVG ]
  }

  [ FETCH_CPU_AVG ] () {
    return cpuAvg()
  }
}

const os = require('os')

const FETCH_MEM_AVG = 'fetch_mem_avg'

const memAvg = () => {
  const total = os.totalmem
  const free = os.freemem
  return {
    total, free,
    percent: 1 - free / total,
  }
}

module.exports = class MemPlugin {
  get actions () {
    return [ FETCH_MEM_AVG ]
  }

  [ FETCH_MEM_AVG ] () {
    return memAvg()
  }
}

/**
 * 复用了 lovekobe24/DymanicLineChartWithD3
 * @see https://github.com/lovekobe24/DymanicLineChartWithD3/blob/master/js/lineChartTranslation2.js
 * 使用 es6 重构
 */

(function (exports) {
  const top = 10
  const right = 20
  const bottom = 50
  const left = 30
  let width = 0
  let height = 0
  let max = -1
  let min = -1

  let that = null

  exports.Grid = class Grid {
    constructor (selector, minimum, maximum) {
      this.svg = d3.select(selector)
      const strs = this.svg.attr('viewBox').split(' ')
      width = strs[2]
      height = strs[3]
      height = height - top - bottom
      width = width - left - right
      max = maximum
      min = minimum

      that = this

      this.isStarted = false

      this.valMax = maximum
      this.valMin = minimum
      this.timeMax = 0
      this.timeMin = 0
      this.data = []
      this.count = 0
      this.step = 0

      this.el = null
      this.xScale = null
      this.xAxis = null
      this.yScale = null
      this.tooltip = null
      this.linePath = null

      this.insert = null
    }

    init (set, samprate, count) {
      this.data = set
      this.count = count
      for (const { data } of set) {
        const currMaxTime = d3.max(data, d => d[0])
        const currMinTime = d3.min(data, d => d[0])
        if (currMaxTime > max) {
          this.timeMax = currMaxTime
        }
        this.timeMin = currMinTime
      }
      // const during = this.timeMax - this.timeMin
      this.xScale = d3.scaleTime()
                      .domain([new Date(this.timeMax - samprate * 1000 * count), new Date(this.timeMax)])
                      .range([0, width])
      this.xAxis = d3.axisBottom()
                      .scale(this.xScale)
                      .ticks(5)
                      .tickFormat(d3.timeFormat('%H:%M:%S'))
      this.el = this.svg.selectAll('g.x.axis')
      this.el.call(this.xAxis)
      // d3 的默认填充为黑色，必须去掉才能看到坐标轴的文字
      this.svg.selectAll('.domain').attr('fill', 'none')
      const color = this.svg.selectAll('g.y.axis').select('.domain').attr('stroke')
      this.svg.selectAll('g.x.axis').selectAll('line').attr('stroke', color)
      this.svg.selectAll('g.x.axis').selectAll('text').attr('fill', color)
      this.yScale = d3.scaleLinear()
                      .domain([this.valMin, this.valMax])
                      .range([height, 0])
      this.linePath = d3.line()
                        .x(d => this.xScale(d[0]))
                        .y(d => this.yScale(d[1]))
                        .curve(d3.curveCatmullRom.alpha(0.5))
      this.svg.selectAll('.path') // 选择 <svg> 中所有的 <path>
              .data(set) //绑定数据
              .transition()
              .duration(500)
              .ease(d3.easeLinear)
              .attr('d', d => this.linePath(d.data))

      const dataGroups = this.svg.selectAll('.datagroups')
                            .data(set)
      dataGroups.selectAll('circle')
                .attr('cx', '-100')
                .attr('cy', '-100')

      this.step = samprate * 1000

      this.transition = d3.select({}).transition()
                          .duration(parseInt(this.step))
                          .ease(d3.easeLinear)

      this.tooltip = d3.select('body')
                        .append('div')
                        .attr('class', 'tooltip')
                        .style('opacity', 0.0)

      this.isStarted = true

      this.index = 1

      this.loop()
    }

    update (count) {
      const now = this.timeMin + count * this.step
      console.assert(typeof this.updateData !== 'undefined', 'Expect `this.updateData` not be `undefined`')
      console.assert(typeof this.updateData === 'function', 'Expect `this.updateData` to be a `function` bot got a `' + (typeof this.updateData) + '`')
      for (const { data } of this.data) {
        data.push([ now, this.updateData() ])
      }
    }

    loop () {
      let normalValueCount = 0
      let isModified = false
      that.transition = that.transition.each(() => {
        that.update(that.index)
        const length = that.data[0].data.length
        let modAxis = false
        const timenow = (that.data[0].data)[length - 1][0]
        let currMaxValue = -1
        let currMinValue = -1
        for (const { data } of that.data) {
          const trueValue = data[length - 1][1]
          currMaxValue = d3.max([ currMaxValue, parseInt(trueValue) ])
          currMinValue = d3.min([ currMinValue, parseInt(trueValue) ])
        }
        // 根据最大最小值动态缩放坐标轴
        if (currMaxValue < that.valMin) {
          // if (currMinValue < 0) {
          //   that.valMin = currMinValue * 1.5
          // } else {
          //   that.valMin = currMinValue / 1.5
          // }
          that.valMin = currMaxValue - 10
          modAxis = true
        }
        if (currMaxValue > that.valMax) {
          // if (currMaxValue > 0) {
          //   that.valMax = currMaxValue * 1.5
          // } else {
          //   that.valMax = currMaxValue / 1.5
          // }
          that.valMax = currMaxValue + 10
          modAxis = true
        }
        // 如果出现 30 个及以上的值落在原始的范围内，则将坐标轴缩放回来
        if (currMinValue > min && currMaxValue < max) {
          normalValueCount += 1
        } else {
          normalValueCount = 0
        }
        // 变换坐标轴
        if (modAxis) {
          // 缩放纵坐标
          that.yScale = d3.scaleLinear()
                          .domain([ that.valMin, that.valMax ])
                          .range([ height, 0 ])
          const yAixs = d3.axisLeft()
                          .scale(that.yScale)
                          .ticks(5)
          const color = that.svg.selectAll('g.y.axis').select('.domain').attr('stroke')
          // 防止坐标轴区域覆盖掉坐标文字
          that.svg.selectAll('g.y.axis').call(yAixs)
          that.svg.selectAll('g.y.axis').selectAll('line').attr('stroke', color)
          that.svg.selectAll('g.y.axis').selectAll('text').attr('fill', color)
          // 去除和 x 坐标重合的那一条线
          that.svg.selectAll('g.y.axis').selectAll('.tick').filter(d => d != 0)
                  .append('line')
                  .attr('y2', '0')
                  .attr('x2', width)
                  .attr('stroke', '#cccccc')
          if (that.valMin > 0) {
            // 横坐标位置也要对应变化
            that.el.attr('transform', `translate(${left},${(that.yScale(that.valMin) + top)})`)
          } else {
            that.el.attr('transform', `translate(${left},${(that.yScale(0) + top)})`)
          }
          isModified = true
        } else {
          if (normalValueCount > that.count + 10 && isModified) {
            // 需要修改 Y 坐标轴
            that.yScale = d3.scaleLinear()
                            .domain([ min, max ])
                            .range([ height, 0 ])
            const yAixs = d3.axisLeft()
                            .scale(that.yScale)
                            .ticks(5)
            const color = that.svg.selectAll('g.y.axis').select('.domain').attr('stroke')
            that.svg.selectAll('g.y.axis').call(yAixs)
            // 防止坐标轴区域覆盖掉坐标文字
            that.svg.selectAll('g.y.axis').selectAll('line').attr('stroke', color)
            that.svg.selectAll('g.y.axis').selectAll('text').attr('fill', color)
            that.svg.selectAll('g.y.axis').selectAll('.tick')
                    .filter(d => d != 0)
                    .append('line')
                    .attr('y2', '0')
                    .attr('x2', width)
                    .attr('stroke', '#cccccc')
            // 横坐标位置也要对应变化
            if (min > 0) {
              that.el.attr('transform', `translate(${left},${(that.yScale(min)) + top})`)
            } else {
              that.el.attr('transform', `translate(${left},${(that.yScale(0)) + top})`)
            }
          }
        }

        that.xScale = d3.scaleTime()
                        .domain([ new Date(timenow - that.count * that.step), new Date(timenow + that.step) ])
                        .range([ 0, width ])

        that.svg.selectAll('.path')
                .data(that.data)
                .attr('d', d => that.linePath(d.data))
        const fdataGroups = that.svg.selectAll('.datagroups').data(that.data)
        fdataGroups.selectAll('circle')
                  .data(d => d.data)
                  .attr('cx', d => that.xScale(d[0]))
                  .attr('cy', d => that.yScale(d[1]))
                  .attr('r', 4)
                  .attr('fill', d => {
                    if (d[1] > parseInt(max) /* || d[1] < parseInt(min) */) {
                      return '#ff0000'
                    } else {
                      return '#ffffff'
                    }
                  })
                  .on('mouseover', d => {
                    /**
                     * 鼠标移入时
                     *  (1) 通过 selection.html() 来更改提示框的文字
                     *  (2) 通过更改样式 left 和 top 来设定提示框的位置
                     *  (3) 设定提示框的透明度为 1.0（完全不透明）
                     */
                    const timeFormat = d3.timeFormat('%H:%M:%S')
                    that.tooltip.html(`时间:${timeFormat(new Date(d[0]))}<br/>温度:${d[1]}˚C`)
                        .style('left', `${d3.event.pageX}px`)
                        .style('top', `${d3.event.pageY + 20}px`)
                        .style('opacity', 1.0)
                  })
                  .on('mouseout', () => {
                    that.tooltip.style('opacity', 0.0)
                  })

        that.xAxis = d3.axisBottom()
                      .scale(that.xScale)
                      .ticks(5)
                      .tickFormat(d3.timeFormat('%H:%M:%S'))
        that.el.call(that.xAxis)
        // 防止坐标轴区域覆盖掉坐标文字
        that.svg.selectAll('.domain').attr('fill', 'none')
        const color = that.svg.selectAll('g.y.axis').select('.domain').attr('stroke')
        that.svg.selectAll('g.x.axis').selectAll('line').attr('stroke', color)
        that.svg.selectAll('g.x.axis').selectAll('text').attr('fill', color)
        if (that.index > that.count - 1) {
          for (const { data } of that.data) {
            data.shift()
          }
        }
        that.index += 1
      }).transition().on('start', that.loop)
    }
  }
})(window)

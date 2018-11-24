(function (exports) {
  function percent2Angle (per, min, max) {
    return per * (max - min) + min
  }

  function angle2Degree (angle) {
    return angle / Math.PI * 180
  }

  function arcTween (arc, newAngle) {
    return function (d) {
      const interpolate = d3.interpolate(d.endAngle, newAngle)
      return function (t) {
          d.endAngle = interpolate(t)
          return arc(d)
      }
    }
  }

  // 初始化参数
  const width = 80
  const height = 108
  const innerRadius = 22
  const outerRadius = 30
  const arcMin = -Math.PI * 2 / 3
  const arcMax = Math.PI * 2 / 3

  exports.Chart = class Chart {
    constructor (selector, title, current) {
      this.selector = selector
      this.title = title || ''
      this.current = current || 0

      this.arc = null
      this.g = null
      this.label = null
      this.tick = null
      this.foreground = null
    }

    init () {
      if (this.arc === null) {
        this.arc = d3.arc()
          .innerRadius(innerRadius)
          .outerRadius(outerRadius)
          .startAngle(arcMin)
      }
      const cpuSvg = d3.select(this.selector)
      if (this.g === null) {
        this.g = cpuSvg.append('g').attr('transform', `translate(${width / 2},${height / 2})`)
        this.g.append('text').attr('class', 'gauge-title')
          .style('alignment-baseline', 'central')
          .style('text-anchor', 'middle')
          .attr('y', -45)
          .text(this.title)
        this.label = this.g.append('text').attr('class', 'gauge-value')
          .style('alignment-baseline', 'central')
          .style('text-anchor', 'middle')
          .attr('y', 25)
          .text(this.current)
        this.g.append('text').attr('class', 'gauge-unity')
          .style('alignment-baseline', 'central')
          .style('text-anchor', 'middle')
          .attr('y', 40)
          .text('%')
        this.g.append('path')
          .datum({ endAngle: arcMax })
          .style('fill', '#444851')
          .attr('d', this.arc)
        const current = percent2Angle(this.current, arcMin, arcMax)
        this.foreground = this.g.append('path')
          .datum({ endAngle: current })
          .style('fill', '#FF6600')
          .attr('d', this.arc)
        this.tick = this.g.append('line')
          .attr('class', 'gauge-tick')
          .attr('x1', 0)
          .attr('y1', -innerRadius)
          .attr('x2', 0)
          .attr('y2', -(innerRadius + 12))
          .style('stroke', '#A1A6AD')
          .attr('transform', `rotate(${angle2Degree(current, arcMax)})`)
      }
      this.update(0)
    }

    update (current) {
      const oldAngle = percent2Angle(this.current, arcMin, arcMax)
      const newAngle = percent2Angle(current, arcMin, arcMax)
      this.label.text((current * 100).toFixed(2))
      this.foreground.transition()
        .duration(750)
        .ease(d3.easeElastic)
        .attrTween('d', arcTween(this.arc, newAngle))
      this.tick.transition()
        .duration(125)
        .attrTween('transform', () => {
          const i = d3.interpolate(angle2Degree(oldAngle), angle2Degree(newAngle))
          return t => `rotate(${i(t)})`
        })
      this.current = current
    }
  }
})(window)

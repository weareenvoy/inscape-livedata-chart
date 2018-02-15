import React, { PureComponent, PropTypes } from 'react'
import * as d3 from 'd3'
import classNames from 'classnames'
import offset from 'mouse-event-offset'
import './LineGraph.scss'

class LineGraph extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      graphElement: null,
      popup: { x:0, y:0, channel:'', showName:'', visible:false },
      currentData: props.data,
      previousData: props.data
    }

    this.numDataPoints = 16

    this.resizeHandler = this.resizeHandler.bind(this)
    this.buildLinePlot = this.buildLinePlot.bind(this)
    this.handlerMouseEnterDot = this.handlerMouseEnterDot.bind(this)
    this.handlerMouseLeaveDot = this.handlerMouseLeaveDot.bind(this)
    this.handlerMouseMove = this.handlerMouseMove.bind(this)
  }

  resizeHandler () {
    // Really only need to do this to force a render. Should find a workaround
    this.setState({
      graphContainerElement: this.graphContainer
    })
  }

  componentDidMount () {
    window.addEventListener('resize', this.resizeHandler)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.resizeHandler)
  }

  componentWillReceiveProps (nextProps) {
    const allShows = []
    const allTimes = []
    const allShares = []

    for (let key in nextProps.data.l) {
      allShows.push(key)
    }

    for (let timeKey in nextProps.data.ss) {
      let show = nextProps.data.ss[timeKey]

      allTimes.push(timeKey)

      for (let i in show) {
        allShares.push(show[i].sh)
      }
    }

    const width = this.graphContainer ? this.graphContainer.offsetWidth : 10
    const height = this.graphContainer ? this.graphContainer.offsetHeight : 10

    // TODO: TRBL values are hard coded. Might want to be made universal
    // this.xScale = this.buildScale(d3.extent(allTimes), [6, (width + (width / (allTimes.length - 2) * 2)) + 2])
    this.xScale = this.buildScale(d3.extent(allTimes), [6, width -6])
    this.yScale = this.buildScale(d3.extent(allShares), [height, 20])

    this.setState({
      allShows: allShows,
      allTimes: allTimes,
      allShares: allShares,
      currentData: nextProps.data // This is where we should animate the points
    })
    
    // if(Object.keys(nextProps.data.ss).length < 20){
    //   d3.select(this).transition().tween('attr.scale'); // refactor, is this necessary to cancel previous transition?
    //   d3.select(this)
    //     .transition()
    //     .duration(250)
    //     .ease(d3.easeLinear)
    //     .tween('attr.scale', () => {
    //       return (t) => {
    //         // const newData = { ...this.state.previousData }

    //         const prevTimes = Object.keys(this.state.previousData.ss)
    //         const nextTimes = Object.keys(nextProps.data.ss)
    //         const currentTimes = prevTimes.map((val, i) => {
    //           const prevTime = Number(val)
    //           const nextTime = Number(nextTimes[i])
    //           return prevTime + (prevTime - nextTime) * t
    //         })

    //         let showDataPoint = {}

    //         for (let i in currentTimes) {
    //           let prevTimeData = this.state.previousData.ss[prevTimes[i]]
    //           let nextTimeData = nextProps.data.ss[nextTimes[i]]

    //           showDataPoint[currentTimes[i]] = prevTimeData.map((dataPoint, i) => {
    //             const prevShare = dataPoint.sh
    //             const nextShare = nextTimeData[i].sh
                
    //             const newDataPoint = {
    //               ...dataPoint,
    //               // share: prevShare + (nextShare - prevShare) * t
    //             }

    //             return newDataPoint
    //           })
    //         }

    //         const newData = {
    //           ...this.state.previousData,
    //           shows: showDataPoint
    //         }

    //         this.setState({
    //           currentData: newData
    //         })
    //       }
    //     })
    //     .on('end', () => {
    //       console.log('END')

    //       this.setState({
    //         previousData: nextProps.data
    //       })
    //       return
    //     })
    // }else{
    //   this.setState({
    //     previousData: nextProps.data,
    //     currentData: nextProps.data
    //   })
    // }
  }

  buildScale ([domainMin, domainMax], range) {
    return d3.scaleLinear().domain([domainMin, domainMax]).range(range)
  }

  buildLinePlot (epid, index) {
    const data = []
    const times = []
    const shares = []

    for (let key in this.state.currentData.ss) {
      let thisShare = null

      for (let i in this.state.currentData.ss[key]) {
        if (this.state.currentData.ss[key][i].e === epid) {
          thisShare = this.state.currentData.ss[key][i].sh
        }
      }

      const dataPoint = {
        time: key,
        data: {
          share: thisShare
        }
      }

      times.push(key)
      shares.push(thisShare)
      data.push(dataPoint)
    }

    const line = d3.line()
      .x((d) => {
        return this.xScale(d.time)
      })
      .y((d) => {
        if(d.data.share){
          return this.yScale(d.data.share)  
        }else{
          return this.yScale(0)
        }
      })
      // .defined((d) => {
      //   return d.data.sh
      // })
      .curve(d3.curveCardinal)

    const d = line(data)

    //////////////////////////////////////////////////////////////
    // Begin - Fading all points but the top 10
    //////////////////////////////////////////////////////////////
    // console.log('data:', this.props.data)

    const showKeys = Object.keys(this.props.data.ss)
    const lastShowKey = showKeys[showKeys.length - 1]
    const lastShowData = this.props.data.ss[lastShowKey]
    let topEPIDs = lastShowData.map((val, i) => { return val.e })
    topEPIDs = topEPIDs.slice(0,10)
    // console.log('topEPIDs:', topEPIDs)

    let faded = true

    for(let i in topEPIDs){
      if(epid === topEPIDs[i]){
        faded = false
      }
    }

    //////////////////////////////////////////////////////////////
    // End - Fading all points but the top 10
    //////////////////////////////////////////////////////////////

    const dotClassName = classNames({
      'LineGraph__dot': true,
      'fade': faded,
      'active': this.props.activeEPID && this.props.activeEPID === epid
    })

    // Create the dots
    const dots = times.length < 20 ? times.map((time, i) => {
      return (
        <circle
          className={dotClassName}
          key={`Dot_${epid}_${i}`}
          cx={this.xScale(time)}
          cy={this.yScale(shares[i])}
          r="1"
          strokeWidth="2"
          stroke={this.props.colorTable[epid]}
          onMouseOver={() => {
            this.handlerMouseEnterDot(
              this.xScale(time),
              this.yScale(shares[i]),
              this.state.currentData.l[epid].c,
              this.state.currentData.l[epid].s
            )

            this.props.setActiveEPID(epid)
          }}
          onMouseOut={() => {
            this.props.setActiveEPID(null)
            this.handlerMouseLeaveDot()
          }} />
      )
    }) : null

    const lineClass = classNames({
      'svg-container': true,
      'fade': this.props.activeEPID && this.props.activeEPID !== epid,
      'active': this.props.activeEPID && this.props.activeEPID === epid
    })

    const visiblePathClass = classNames({
      'visible-path': true,
      'fade': faded,
      'active': this.props.activeEPID && this.props.activeEPID === epid
    })

    if (typeof (graphContainer) !== undefined) {
      return (
        <g key={`Line_${epid}`} className={lineClass} >
          <path
            className={visiblePathClass}
            fill='none'
            stroke={this.props.colorTable[epid]}
            strokeWidth='1px'
            d={d} />
          <path
            fill='none'
            stroke='rgba(255,255,255,0)'
            strokeWidth='6px'
            d={d}
            onMouseOver={(e) => {
              this.props.setActiveEPID(epid)
              this.setState({
                popup: {
                  x: this.mouseX,
                  y: this.mouseY,
                  channel: this.state.currentData.l[epid].c,
                  showName: this.state.currentData.l[epid].s,
                  visible: true
                }
              })
            }}
            onMouseOut={(e) => {
              this.props.setActiveEPID(null)
              this.setState({
                popup: {
                  visible: false
                }
              })
            }} />
          
          {dots}
        </g>
      )
    } else {
      return null
    }
  }

  handlerMouseEnterDot (x = 0, y = 0, channel = '', showName = '') {
    this.setState({
      popup: {
        x: x,
        y: y,
        channel: channel,
        showName: showName,
        visible: true
      }
    })
  }

  handlerMouseLeaveDot () {
    this.setState({
      popup: {
        visible: false
      }
    })
  }

  handlerMouseMove (e) {
    const pos = offset(e, e.currentTarget)
    this.mouseX = pos[0]
    this.mouseY = pos[1]
  }

  render () {
    const ns = 'LineGraph'

    const linePlots = this.state.allShows ? this.state.allShows.map((val, i) => {
      return (
        this.buildLinePlot(val, i)
      )
    }) : null

    const ticks = this.state.allTimes
      ? (() => {
        if (this.state.allTimes.length < 20) {
          return this.state.allTimes.map((val, i) => {
            const tickStyle = {
              left: this.xScale(val)
            }

            const date = new Date(val * 1000)
            const hours = ('0' + date.getHours()).slice(-2)
            const minutes = ('0' + date.getMinutes()).slice(-2)
            const seconds = ('0' + Math.floor(date.getSeconds() / 15) * 15).slice(-2)

            // Don't show the last 2 items
            // if(i >= this.state.allTimes.length - 2){
            //   return null
            // }

            return (
              <div key={`tick_${i}`} className={`${ns}__graph-x-axis-item`} style={tickStyle}>
                <div className="time">{`${hours}:${minutes}:${seconds}`}</div>
              </div>
            ) 
          })
        } else {
          const numTicks = 15
          const firstTime = this.state.allTimes[0]
          const lastTime = this.state.allTimes[this.state.allTimes.length - 2] // Second to last. The last point is off the screen
          const arrTicks = []

          for (let i = 0; i < numTicks + 1; i++) {
            const time = Number(firstTime) + (lastTime - firstTime) * (i / numTicks)
            const tickStyle = {
              left: this.xScale(time)
            }

            const date = new Date(time * 1000)
            const hours = ('0' + date.getHours()).slice(-2)
            const minutes = ('0' + date.getMinutes()).slice(-2)
            const seconds = ('0' + Math.floor(date.getSeconds() / 15) * 15).slice(-2)

            arrTicks.push(
              <div key={`tick_${i}`} className={`${ns}__graph-x-axis-item`} style={tickStyle}>
                <div className="time">{`${hours}:${minutes}:${seconds}`}</div>
              </div>
            )
          }

          return arrTicks
        }
      })() : null

    const popupStyle = {
      top: this.state.popup.y,
      left: this.state.popup.x
    }

    const popupClassName = this.state.popup.left ? `${ns}__popup-container left` : `${ns}__popup-container`

    const lines = () => {
      const numLines = 10
      const lineElements = []
      for (let i = 0; i < numLines; i++) {
        lineElements.push(<div key={`${ns}__graph-line_${i}`} className={`${ns}__graph-line`} />)
      }

      return (
        <div className={`${ns}__graph-lines-container`}>
          {lineElements}
        </div>
      )
    }

    return (
      <div className={ns}>
        {lines()}
        <div
          className={`${ns}__graph-container`}
          ref={(input) => { this.graphContainer = input }}
          onMouseMove = {this.handlerMouseMove} >
          <svg className={`${ns}__graph`} style={this.props.graphStyle}>
            {typeof (this.graphContainer) && linePlots}
          </svg>
          <div className={`${ns}__graph-x-axis`}>{ticks}</div>
          {this.state.popup.visible &&
            <div className={popupClassName} style={popupStyle}>
              <div className={`${ns}__popup`}>
                <div className="show-name">{this.state.popup.showName}</div>
                <div className="channel">{this.state.popup.channel}</div>
              </div>
            </div>
          }
        </div>
      </div>
    )
  }
}

LineGraph.propTypes = {
  data: PropTypes.object.isRequired,
  colorTable: PropTypes.object,
  activeEPID: PropTypes.string,
  setActiveEPID: PropTypes.func,
  graphStyle: PropTypes.object
}

LineGraph.defaultProps = {

}

export default LineGraph

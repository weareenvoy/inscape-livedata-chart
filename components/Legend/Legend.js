import React, { Component, PropTypes } from 'react'
import LegendItem from '../LegendItem'
import './Legend.scss'

class Legend extends Component {
  constructor (props) {
    super(props)

    this.legendArray = []
  }

  componentWillReceiveProps (nextProps) {
    const legendArray = []
    let lastTime

    for (let time in nextProps.data.ss) {
      lastTime = time
    }

    const lastShow = nextProps.data.ss[lastTime]

    for (let i in lastShow) {
      let epid = lastShow[i].e
      let legendDataItem = nextProps.data.l[epid]
      legendDataItem.color = nextProps.colorTable[epid]
      legendDataItem.e = epid
      legendArray.push(legendDataItem)
    }

    // Only show the tip 10
    this.legendArray = legendArray.slice(0, 10)
  }

  render () {
    const ns = 'Legend'

    const legendItems = this.legendArray.map((val, i) => {
      return (
        <LegendItem
          index={i + 1}
          epid={val.e}
          channelName={val.c }
          showName={val.s}
          color={val.color}
          key={`legend_${i}`}
          setActiveEPID={this.props.setActiveEPID}
          selected={this.props.activeEPID===val.e} />
      )
    })

    return (
      <div className={`${ns}`}>
        <div className={`${ns}__heading`}>
          <div className="item">Rank</div>
          <div className="item">Channel</div>
        </div>
        {legendItems}
      </div>
    )
  }
}

Legend.propTypes = {
  data: PropTypes.object.isRequired,
  colorTable: PropTypes.object,
  activeEPID: PropTypes.string,
  setActiveEPID: PropTypes.func
}

Legend.defaultProps = {

}

export default Legend

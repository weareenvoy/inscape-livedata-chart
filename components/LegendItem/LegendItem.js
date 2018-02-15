import React, { Component, PropTypes } from 'react'
import Dot from '../graphics/Dot'
import classNames from 'classnames'
import './LegendItem.scss'

class LegendItem extends Component {
  constructor (props) {
    super(props)

    this.handlerMouseOver = this.handlerMouseOver.bind(this)
    this.handlerMouseOut = this.handlerMouseOut.bind(this)
  }

  handlerMouseOver (epid) {
    this.props.setActiveEPID(epid)
  }

  handlerMouseOut (epid) {
    this.props.setActiveEPID(null)
  }

  render () {
    const ns = 'LegendItem'

    const mainClassName = classNames({
      'LegendItem': true,
      'selected': this.props.selected
    })

    return (
      <div
        className={mainClassName}
        onMouseOver={() => this.handlerMouseOver(this.props.epid)}
        onMouseOut={() => this.handlerMouseOut(this.props.epid)}>
        <div className={`${ns}__dot-container`}>
          <span className={`${ns}__index`}>{('0' + this.props.index).slice(-2)}</span>
          <Dot color={this.props.color} />
        </div>
        <div className={`${ns}__show`}>{this.props.showName}</div>
        <div className={`${ns}__channel`}>{this.props.channelName}</div>
      </div>
    )
  }
}

LegendItem.propTypes = {
  index: PropTypes.number,
  epid: PropTypes.string,
  channelName: PropTypes.string,
  showName: PropTypes.string,
  color: PropTypes.string,
  setActiveEPID: PropTypes.func,
  selected: PropTypes.bool
}

LegendItem.defaultProps = {

}

export default LegendItem

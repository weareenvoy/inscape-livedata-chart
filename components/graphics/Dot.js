import React, { Component, PropTypes } from 'react'
import './Dot.scss'

class Dot extends Component {
  render () {
    const ns = 'Dot'

    const dotStyle = {
      backgroundColor: this.props.color
    }

    return (
      <div className={`${ns}`} style={dotStyle}/>
    )
  }
}

Dot.propTypes = {
  color: PropTypes.string
}

Dot.defaultProps = {

}

export default Dot

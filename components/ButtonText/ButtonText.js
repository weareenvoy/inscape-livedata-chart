import React, { Component, PropTypes } from 'react'
import classNames from 'classnames'
import './ButtonText.scss'

class ButtonText extends Component {
  render () {
    const ns = 'ButtonText'

    const buttonClasses = classNames({
      'active': this.props.isActive
    })

    return (
      <button
        className={`${ns} ${buttonClasses}`}
        onClick={this.props.clickHandler}>{this.props.children}</button>
    )
  }
}

ButtonText.propTypes = {
  children: PropTypes.string,
  isActive: PropTypes.bool,
  clickHandler: PropTypes.func
}

ButtonText.defaultProps = {
  isActive: false
}

export default ButtonText

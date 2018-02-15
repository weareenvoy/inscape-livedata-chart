import React, { Component } from 'react'
import axios from 'axios'
import randomColor from 'randomcolor'
import debounce from 'debounce'
import random from 'random-js'

import Legend from './Legend'
import LineGraph from './LineGraph'
import ButtonText from './ButtonText'
import { sampleData } from '../utils/Data'
import { TweenLite, Linear } from 'gsap'
import classNames from 'classnames'
import global from 'global'

import './WidgetView.scss'
const URL = 'https://inscape-proxy.weareenvoy.net'
class WidgetView extends Component {
    constructor (props) {
        super()

        console.log('global.API_URL', URL)

        this.state = {
            data: sampleData,
            colorTable: {},
            timeZone: 'Users',
            timeRange: '4 minutes ago',
            activeEPID: null,
            pollInterval: 15,
            isFullScreen: false,
            graphStyle: {}
        }

        this.fetchData = this.fetchData.bind(this)
        this.setTimeZone = this.setTimeZone.bind(this)
        this.setTimeRange = this.setTimeRange.bind(this)
        this.handlerFullscreen = this.handlerFullscreen.bind(this)
        this.setActiveEPID = debounce(this.setActiveEPID.bind(this), 20)
        this.handlerResize = debounce(this.handlerResize.bind(this), 200)
    }

    componentDidMount () {
        document.title = 'Inscape - Real-Time Viewing'

        this.componentIsMounted = true
        // this.props.turnHeaderElementsForWidget()

        window.addEventListener('resize', this.handlerResize)

        document.addEventListener("fullscreenchange", this.handlerFullscreen)
        document.addEventListener("mozfullscreenchange", this.handlerFullscreen)
        document.addEventListener("webkitfullscreenchange", this.handlerFullscreen)

        this.fetchData()
        this.handlerResize()

    }

    componentWillUnmount () {
        this.componentIsMounted = false

        this.timerAnimation.kill()

        window.removeEventListener('resize', this.handlerResize)

        document.removeEventListener("fullscreenchange", this.handlerFullscreen)
        document.removeEventListener("mozfullscreenchange", this.handlerFullscreen)
        document.removeEventListener("webkitfullscreenchange", this.handlerFullscreen)
    }

    isFullScreenCompatible(){
        if (document.exitFullscreen) {
            return true
        } else if (document.webkitExitFullscreen) {
            return true
        } else if (document.mozCancelFullScreen) {
            return true
        } else if (document.msExitFullscreen) {
            return true
        }

        return false
    }

    handlerFullscreen()
    {
        if (
            document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement
        )
        {
            // this.state.isFullScreen = true;

            // window.setTimeout(() => {
            //   this.setState({
            //     isFullScreen: true,
            //     graphStyle: {
            //       height: this.graphContainer.offsetHeight
            //     }
            //   })
            // }, 500)
            //
            //   this.fetchData()

        }else{
            // this.state.isFullScreen = false;

            this.setState({
                isFullScreen: false,
                graphStyle: {}
            })
        }
    }

    handlerResize () {
        this.setState({
            windowWidth: window.outerWidth
        }, () => {
            this.fetchData()
        })

        if (this.timerAnimation && window.outerWidth < 1024) {
            this.timerAnimation.kill()
        }
    }

    fetchData () {
        const url = URL.length > 0
            ? `${URL}/shows?start=${this.state.timeRange}&end=now&timezone=${this.state.timeZone}`
            : `https://inscape-api.weareenvoy.net/shows?start=${this.state.timeRange}&end=now&timezone=${this.state.timeZone}`

        if (this.timerProgress) {
            this.timerAnimation = TweenLite.fromTo(this.timerProgress, this.state.pollInterval,
                { scaleX:0, transformOrigin:'0% 0%' },
                { scaleX:1,
                    ease: Linear.easeNone,
                    onComplete:() => {
                        this.fetchData()
                    }
                })
        }

        axios.get(url)
            .then((response) => {
                if (!this.componentIsMounted) { return }

                const data = Object.keys(response.data.ss).length > 1 ? response.data : sampleData
                const newColorTable = Object.assign({}, this.state.colorTable)

                for (let key in data.l) {
                    if (typeof (newColorTable[key]) !== 'string') {
                        newColorTable[key] = this.generateRandomColor(key)
                    }
                }

                this.setState({
                    data: data,
                    colorTable: newColorTable
                })
            })
            .catch((error) => {
                console.log('error:', error)
            })
    }

    generateRandomColor (key) {
        let choices = [
            { hue: 'red' , luminosity: 'dark'},
            { hue: 'red' , luminosity: 'bright'},
            { hue:'blue' , luminosity: 'dark'},
            { hue:'blue' , luminosity: 'bright'},
            { hue:'green', luminosity: 'dark'},
            { hue:'green', luminosity: 'bright'},
            // { hue:'yellow', luminosity: 'dark'},
            { hue:'pink', luminosity: 'dark'},
            { hue: 'monochrome', luminosity: 'dark'},
            // { hue: 'monochrome', luminosity: 'bright'},
            { hue: 'orange', luminosity: 'dark'},
            { hue: 'orange', luminosity: 'bright'},
            // { hue: 'purple', luminosity: 'dark'},
            { hue: 'purple', luminosity: 'bright'},
        ]

        //generate hash
        let hashedKey = this.generateHash(key)

        // random integer
        let mt = new random(random.engines.mt19937().seed(hashedKey))
        let randomOptions = mt.pick(choices)

        let options = Object.assign({ seed: key }, randomOptions)
        return randomColor(options)
    }

    generateHash(key){
        var hash = 0, i, chr, len;
        if (key.length === 0) return hash;
        for (i = 0, len = key.length; i < len; i++) {
            chr   = key.charCodeAt(i);
            hash  = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    setActiveEPID (epid) {
        this.setState({
            activeEPID: epid
        })
    }

    setTimeZone (zone) {
        this.setState({
            timeZone: zone
        }, () => {
            this.fetchData()
        })
    }

    setTimeRange (range) {
        const pollIntervals = {
            '4 minutes ago': 15,
            '30 minutes ago': 15
        }

        this.setState({
            timeRange: range,
            pollInterval: pollIntervals[range] ? pollIntervals[range] : 15
        }, () => {
            this.fetchData()
        })
    }

    setFullscreen () {
        let elem = this.graphRootContainer

        if(this.state.isFullScreen){
            this.setState({
                isFullScreen: false
            })

            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }else{
            this.setState({
                isFullScreen: true
            })

            if (elem.requestFullscreen) {
                elem.requestFullscreen()
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen()
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen()
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT)
            }
        }
    }

    render () {
        const ns = 'WidgetView'

        const graphContainerClasses = classNames({
            'WidgetView__graph-flex-container': true,
        })

        const graphWrapperContainerClasses = classNames({
            'WidgetView__top-wrapper': true,
            'fullscreen': this.state.isFullScreen
        })

        return (
            <div className={ns}>
                <div
                    className={graphWrapperContainerClasses}
                    ref={(input) => { this.graphRootContainer = input }}>
                    <div className="background" />
                    <div className={`${ns}__top-box`}>
                        <div className={`${ns}__graph-timer-bar`}>
                            <div
                                className={`${ns}__graph-timer-progress`}
                                key={`${ns}__graph-timer-progress`}
                                ref={(input) => { this.timerProgress = input }} />
                        </div>
                        <div className={graphContainerClasses} >
                            <div className={`${ns}__graph-container`} ref={(input) => {this.graphContainer = input}}>
                                <div className="filters">
                                    <div className="left">
                                        <ButtonText
                                            isActive={this.state.timeRange === '4 minutes ago'}
                                            clickHandler={() => { this.setTimeRange('4 minutes ago') }}>4 MINUTES</ButtonText>
                                        <ButtonText
                                            isActive={this.state.timeRange === '30 minutes ago'}
                                            clickHandler={() => { this.setTimeRange('30 minutes ago') }}>30 MINUTES</ButtonText>
                                    </div>
                                    <div className="right">
                                        <ButtonText
                                            isActive={this.state.timeZone === 'Users'}
                                            clickHandler={() => { this.setTimeZone('Users') }}>ALL</ButtonText>
                                        <ButtonText
                                            isActive={this.state.timeZone === 'EST'}
                                            clickHandler={() => { this.setTimeZone('EST') }}>EASTERN</ButtonText>
                                        <ButtonText
                                            isActive={this.state.timeZone === 'CST'}
                                            clickHandler={() => { this.setTimeZone('CST') }}>CENTRAL</ButtonText>
                                        <ButtonText
                                            isActive={this.state.timeZone === 'MST'}
                                            clickHandler={() => { this.setTimeZone('MST') }}>MOUNTAIN</ButtonText>
                                        <ButtonText
                                            isActive={this.state.timeZone === 'PST'}
                                            clickHandler={() => { this.setTimeZone('PST') }}>PACIFIC</ButtonText>
                                    </div>
                                </div>
                                { this.state.windowWidth >= 1024 &&
                                <LineGraph
                                    graphStyle={this.state.graphStyle}
                                    data={this.state.data}
                                    colorTable={this.state.colorTable}
                                    activeEPID={this.state.activeEPID}
                                    setActiveEPID={this.setActiveEPID} />
                                }
                            </div>
                            <div className={`${ns}__legend-container`}>
                                <Legend
                                    data={this.state.data}
                                    colorTable={this.state.colorTable}
                                    setActiveEPID={this.setActiveEPID}
                                    activeEPID={this.state.activeEPID} />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        )
    }
}

WidgetView.propTypes = {}

WidgetView.defaultProps = {}

export default WidgetView

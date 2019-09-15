import React, { PureComponent, Fragment } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import './style.scss'

class Image extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      loading: true,
      error: false,
      loadTimes: 0,
      sourceProps: {} // src, style
    }
    this.errorImage = props.placeholder
  }
  componentDidMount () {
    this._isMounted = true
    this.loadImage()
  }
  componentDidUpdate (prevProps) {
    if (prevProps.url !== this.props.url) {
      this.loadImage()
    }
  }
  componentWillUnmount () {
    this._isMounted = false
  }
  loadImage = () => {
    if (this._isMounted) {
      const image = new window.Image()
      image.onload = this.handleImageLoaded
      image.onerror = this.handleImageError
      image.src = this.props.url || this.errorImage
      this.setState({loading: true, error: false, loadTimes: this.state.loadTimes + 1})
    }
  }
  handleImageLoaded = (...args) => {
    const { url, ...otherProps } = this.props
    const { error } = this.state

    if (this._isMounted) {
      let sourceProps = {}
      const displayUrl = (error || !url) ? this.errorImage : url
      if (this.props.useBackground) {
        let style = otherProps.style || {}
        style.backgroundImage = `url('${displayUrl}')`
        sourceProps.style = style
      } else {
        sourceProps.src = displayUrl
      }

      this.setState({sourceProps: sourceProps, loading: false, error: false})
      this.props.callbacks && this.props.callbacks.loaded && this.props.callbacks.loaded(...args)
    }
  }
  handleImageError = (e) => {
    if (this._isMounted) {
      let sourceProps = {}
      if (this.props.useBackground) {
        sourceProps.style = {backgroundImage: `url('${this.errorImage}')`}
      } else {
        sourceProps.src = this.errorImage
      }
      this.props.callbacks && this.props.callbacks.error && this.props.callbacks.error(e)

      if (this.state.loadTimes >= this.props.autoRetryTimes) {
        this.setState({error: true, loading: false, sourceProps: sourceProps})
      } else {
        setTimeout(() => {
          this.loadImage()
        }, 800)
      }
    }
  }
  render () {
    let {
      className,
      showSpinner,
      useBackground,
      enableRetry,
      ...otherProps
    } = this.props
    delete otherProps.autoRetryTimes
    delete otherProps.placeholder
    delete otherProps.callbacks
    delete otherProps.url
    const { loading, error, sourceProps } = this.state

    const cls = classNames('image-container', {
      'image-container--loading': loading,
      [className]: className !== undefined
    })

    let content
    if (loading) {
      content = (
        <div key='image-loading' className='image-loading'>
          { showSpinner ? <i className='fas fa-spinner fa-spin' /> : undefined}
        </div>
      )
    } else {
      const imageContent = useBackground ? (
        <div key='image-background' className='image-background' {...otherProps} {...sourceProps} />
      ) : (
        <img key='image-img' className='image-img' {...otherProps} {...sourceProps} />
      )

      if (error) {
        content = (
          <Fragment key='image-loading--error'>
            {imageContent}
            {
              enableRetry ? (
                <i className='fas exclamation-circle' onClick={this.loadImage} />
              ) : undefined
            }
          </Fragment>
        )
      } else {
        content = imageContent
      }
    }

    return (
      <div className={cls}>{content}</div>
    )
  }
}

Image.propTypes = {
  url: PropTypes.string,
  className: PropTypes.string,
  showSpinner: PropTypes.bool, // show spinner or not
  useBackground: PropTypes.bool,
  callbacks: PropTypes.object,
  autoRetryTimes: PropTypes.number,
  enableRetry: PropTypes.bool,
  placeholder: PropTypes.string // placeholder image
}

Image.defaultProps = {
  autoRetryTimes: 0,
  enableRetry: false,
  showSpinner: true
}

export default Image

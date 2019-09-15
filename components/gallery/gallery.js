import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import GalleryThumbItem from './galleryThumbItem'
// import ProfileEditButton from '../profileEditButton'
// import { Video, Image, Spinner, KmTrollIcon } from 'shared/ui'

const thumbItemMargin = 10

class Gallery extends PureComponent {
  constructor (props) {
    super(props)
    this.thumbUp = this.thumbArrowClicked.bind(this, -1)
    this.thumbDown = this.thumbArrowClicked.bind(this, 1)
    this.bigImgLeft = this.bigImgArrowClicked.bind(this, -1)
    this.bigImgRight = this.bigImgArrowClicked.bind(this, 1)
    this.state = {
      bigImgIndex: 0,
      nextBigImgIndex: null,
      thumbStartIndex: 0,
      animationOn: false
    }
  }
  componentDidMount () {
    this._isMounted = true
    this.loadMoreIfNecessary(this.state.thumbStartIndex)

    const { autoPlay, gallery } = this.props
    if (autoPlay && gallery.count() > 0) {
      this.auto()
    }
  }
  componentDidUpdate () {
    this.loadMoreIfNecessary(this.state.thumbStartIndex)
  }
  componentWillUnmount () {
    this._isMounted = false
    this.pause()
  }
  auto = () => {
    clearInterval(this.timer)
    this.timer = setInterval(() => {
      this.bigImgRight()
    }, this.props.delay)
  }
  pause = () => {
    clearInterval(this.timer)
    this.timer = null
  }
  thumbOnClicked = (index) => {
    const { bigImgIndex, nextBigImgIndex } = this.state
    if (nextBigImgIndex !== null) return // previous change not finished
    if (bigImgIndex !== index) {
      this.setState({nextBigImgIndex: index}, () => {
        this.changeBigImg()
      })
    }
  }
  thumbArrowClicked = (direction) => {
    // direction: -1 - up; 1 - down
    const { thumbCount, total } = this.props
    const { thumbStartIndex } = this.state
    let nextIndex = thumbStartIndex + direction * thumbCount
    if (nextIndex < 0) {
      nextIndex = 0
    } else if (nextIndex > total - thumbCount) {
      nextIndex = total - thumbCount
    }
    this.setState({thumbStartIndex: nextIndex})
  }
  bigImgArrowClicked = (direction) => {
    // direction: -1 - left; 1 - right
    if (this.state.nextBigImgIndex !== null) return // previous change not finished
    const { gallery, total, thumbCount } = this.props
    const { bigImgIndex, thumbStartIndex } = this.state
    let updateState = {}
    let nextIndex = bigImgIndex + direction
    if (nextIndex < 0) {
      nextIndex = 0
    } else {
      if (this.timer) { // while auto playing
        if (nextIndex > gallery.count() - 1) {
          nextIndex = 0
        }
      } else if (nextIndex > total - 1) {
        nextIndex = total - 1
      }
    }
    updateState.nextBigImgIndex = nextIndex

    if (thumbStartIndex <= nextIndex - thumbCount) {
      updateState.thumbStartIndex = nextIndex - thumbCount + 1
    } else if (thumbStartIndex > nextIndex) {
      updateState.thumbStartIndex = nextIndex
    }
    this.setState(updateState, () => {
      this.changeBigImg()
    })
  }
  loadMoreIfNecessary = (thumbStartIndex) => {
    if (this.timer) return // while auto playing, not load more

    const { gallery, thumbCount, total, preload, loadMore } = this.props
    const countInView = thumbStartIndex + thumbCount
    let countNeeded = countInView + preload
    countNeeded = countNeeded > total ? total : countNeeded
    if (gallery.count() < countNeeded) {
      loadMore()
    }
  }
  changeBigImg = () => { // big img change animation
    const { nextBigImgIndex } = this.state
    setTimeout(() => {
      if (this._isMounted) {
        this.setState({animationOn: true}, () => {
          setTimeout(() => {
            if (this._isMounted) {
              this.setState({
                bigImgIndex: nextBigImgIndex,
                nextBigImgIndex: null,
                animationOn: false
              })
            }
          }, 500)
        })
      }
    }, 30)
  }
  getBigImg = () => {
    const { bigImgIndex, nextBigImgIndex } = this.state
    const thisImg = this.getBigImgByIndex(bigImgIndex)
    if (nextBigImgIndex === null || bigImgIndex === nextBigImgIndex) {
      return thisImg
    }
    const nextImg = this.getBigImgByIndex(nextBigImgIndex)
    if (bigImgIndex < nextBigImgIndex) {
      return [thisImg, nextImg]
    } else {
      return [nextImg, thisImg]
    }
  }
  getBigImgByIndex = (index) => {
    const { gallery, handlePlusMemberFeature, isPlusMember } = this.props
    const item = gallery.get(index)
    if (item === undefined) {
      return (
        <li className='gallery-big-item gallery-big-item--empty'
          key={`profile-gallery-empty-${index}`}>
          <div><Spinner /></div>
        </li>
      )
    }
    const type = item.get('type')
    if (type === 'image') {
      return (
        <li className='gallery-big-item gallery-big-item--image'
          key={`profile-gallery-${item.get('id')}`}>
          <Image url={item.get('url')} useBackground enableRetry />
        </li>
      )
    } else if (type === 'video') {
      return (
        <li className='gallery-big-item gallery-big-item--video'
          key={`profile-gallery-${item.get('id')}`}>
          <Video
            url={item.get('url')}
            thumbnail={item.get('thumbnail')}
            authorized={isPlusMember}
            handleNonAuthorized={handlePlusMemberFeature} />
        </li>
      )
    }
  }
  renderThumbList = (itemStyle) => {
    const { gallery, total, thumbCount } = this.props
    const { bigImgIndex, nextBigImgIndex, thumbStartIndex } = this.state
    const activeIndex = nextBigImgIndex !== null ? nextBigImgIndex : bigImgIndex
    let list = gallery.map((item, idx) => {
      return (
        <GalleryThumbItem key={item.get('id')}
          index={idx}
          img={item.get('thumbnail')}
          active={activeIndex === idx}
          style={itemStyle}
          onClick={this.thumbOnClicked} />
      )
    }).toJS()
    const currentCount = gallery.count()
    if (currentCount < total) {
      for (let i = currentCount; i < total; i++) {
        list.push(
          <GalleryThumbItem key={i}
            empty
            loading={i >= thumbStartIndex && i < thumbStartIndex + thumbCount}
            index={i}
            active={activeIndex === i}
            style={itemStyle}
            onClick={this.thumbOnClicked} />
        )
      }
    }
    return list
  }
  render () {
    const { thumbCount, total, autoPlay } = this.props
    const {
      bigImgIndex,
      nextBigImgIndex,
      thumbStartIndex,
      animationOn
    } = this.state
    const thumbItemStyle = {
      height: `calc((100% - ${(thumbCount - 1) * thumbItemMargin}px) / ${thumbCount})`
    }
    const displayBigImgIndex = nextBigImgIndex !== null ? nextBigImgIndex : bigImgIndex
    const indicatingOffset = displayBigImgIndex >= thumbStartIndex
      ? `calc(100% / ${thumbCount * 2} * ${(displayBigImgIndex - thumbStartIndex) * 2 + 1} - 10px)`
      : '-20px'
    const thumbOffset = `calc(-1 * (100% + ${thumbItemMargin}px) / ${thumbCount} * ${thumbStartIndex})`
    let bigImgListStyle = {}
    if (animationOn) {
      bigImgListStyle.transition = 'transform 500ms ease-out'
      if (nextBigImgIndex > bigImgIndex) {
        bigImgListStyle.transform = `translate3d(-100%, 0, 0)`
      } else {
        bigImgListStyle.transform = 'translate3d(0,0,0)'
      }
    } else {
      bigImgListStyle.transition = 'none'
      if (nextBigImgIndex !== null && nextBigImgIndex < bigImgIndex) {
        bigImgListStyle.transform = `translate3d(-100%, 0, 0)`
      } else {
        bigImgListStyle.transform = 'translate3d(0,0,0)'
      }
    }
    return (
      <div className='gallery-container'
        ref={(ref) => { this.container = ref }}
        onMouseEnter={autoPlay ? this.pause : null}
        onMouseLeave={autoPlay ? this.auto : null}>
        <div className='gallery-thumb-container'>
          <i className={classNames('kmt kmt-arrow-up-line', {
            'hidden': thumbStartIndex === 0
          })} onClick={this.thumbUp} />
          <i className={classNames('kmt kmt-arrow-down-line', {
            'hidden': thumbStartIndex >= total - thumbCount
          })} onClick={this.thumbDown} />
          <ul className='gallery-thumb-list'
            style={{transform: `translate3d(0, ${thumbOffset}, 0)`}}>
            { this.renderThumbList(thumbItemStyle) }
          </ul>
        </div>
        <div className='gallery-big-container'>
          <div className='gallery-big-indicating-arrow'
            style={{top: indicatingOffset}} />
          <div className='gallery-big-top'>
            <div className='gallery-big-top-pagination'>
              {`${displayBigImgIndex + 1} / ${total}`}
            </div>
          </div>
          <div className={classNames('gallery-big-arrows', {
            'gallery-big-arrows--start': displayBigImgIndex === 0,
            'gallery-big-arrows--end': displayBigImgIndex === total - 1
          })}>
            <KmTrollIcon icon='arrow-left-line' onClick={this.bigImgLeft} />
            <KmTrollIcon icon='arrow-right-line' onClick={this.bigImgRight} />
          </div>
          <ul className='gallery-big-list'
            style={bigImgListStyle}>
            { this.getBigImg() }
          </ul>
        </div>
      </div>
    )
  }
}

Gallery.propTypes = {
  gallery: PropTypes.object.isRequired,
  total: PropTypes.number,
  thumbCount: PropTypes.number,
  preload: PropTypes.number,
  delay: PropTypes.number,
  isPlusMember: PropTypes.bool,
  autoPlay: PropTypes.bool,
  handlePlusMemberFeature: PropTypes.func,
  goToMediaGallery: PropTypes.func,
  loadMore: PropTypes.func,
  t: PropTypes.func
}

Gallery.defaultProps = {
  thumbCount: 6,
  preload: 6,
  delay: 2000,
  isPlusMember: false,
  autoPlay: false
}

export default withTranslation(['profile'])(ProfileGallery)

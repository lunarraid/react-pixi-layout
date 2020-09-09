import { Container, Rectangle, Point, Sprite, Texture, Ticker } from 'pixi.js';
import ContainerElement from './Container';

const { log, pow } = Math;

const VELOCITY_MIN = 0.1;
const DAMPING = 0.01;
const LOG_DAMPING = log(DAMPING);

const ticker = Ticker.shared;

class ScrollContentContainer extends Container {

  static BOUNDS_UPDATED = 'BOUNDS_UPDATED';

  _localBoundsCache = new Rectangle();
  _isUpdatingBounds = false;

  updateTransform () {
    if (!this._isUpdatingBounds) {
      this._isUpdatingBounds = true;

      const { x: oX, y: oY, width: oWidth, height: oHeight } = this._localBoundsCache;

      this.getLocalBounds(this._localBoundsCache, true);

      const { x, y, width, height } = this._localBoundsCache;

      if (oX !== x || oY !== y || oWidth !== width || oHeight !== height) {
        this.emit(ScrollContentContainer.BOUNDS_UPDATED, this._localBoundsCache);
      }

      this._isUpdatingBounds = false;
    }

    super.updateTransform();
  }

  get left () {
    return this._localBoundsCache.x;
  }

  get top () {
    return this._localBoundsCache.y;
  }

  get height () {
    return this._localBoundsCache.height;
  }

  get width () {
    return this._localBoundsCache.width;
  }

}

class ScrollContainer extends Container {

  onWheel = ({ deltaX, deltaY }) => {
    this.scrollBy(deltaX, deltaY);
  };

  constructor () {
    super();

    this.interactionManager = null;

    this._inputRoot = null;
    this._lastPointerPosition = new Point();
    this._lastScrollTime = 0;
    this._lastScrollDuration = 0;
    this._lastScrollDelta = new Point();
    this._velocity = new Point();
    this._isTicking = false;

    this.content = this.addChild(new ScrollContentContainer());
    this.on('pointerdown', this.onPointerDown, this);
    this.on('pointerover', this.onPointerOver, this);
    this.on('pointerout', this.onPointerOut, this);
    this.content.on(ScrollContentContainer.BOUNDS_UPDATED, this.onContentBoundsUpdated, this);

    this.contentMask = this.addChild(new Sprite(Texture.WHITE));
    this.content.mask = this.contentMask;

    this.width = 100;
    this.height = 100;
  }

  destroy () {
    this.isTicking = false;
    this.removeListener('pointerdown', this.onPointerDown, this);
    this.interactionManager.removeListener('pointermove', this.onPointerMove, this);
    this.interactionManager.removeListener('pointerup', this.onPointerUp, this);
    this.interactionManager.removeListener('pointerout', this.onPointerUp, this);
    this.interactionManager.removeListener('pointercancel', this.onPointerUp, this);
    super.destroy();
  }

  scrollBy (x, y) {
    const previousLeft = this.scrollLeft;
    const previousTop = this.scrollTop;

    this.scrollLeft += x;
    this.scrollTop += y;

    if (this.scrollTop !== previousTop || this.scrollLeft !== previousLeft) {
      this.emit('scrolled');    
    }
  }

  setVelocity (vx, vy) {
    if (vx < VELOCITY_MIN && vx > -VELOCITY_MIN) {
      vx = 0;
    }

    if (vy < VELOCITY_MIN && vy > -VELOCITY_MIN) {
      vy = 0;
    }

    this._velocity.set(vx, vy);
    this.isTicking = Boolean(vx || vy);
  }

  onContentBoundsUpdated () {
    // Reset scroll position in case bounds shifted
    this.scrollLeft = this.scrollLeft; // eslint-disable-line
    this.scrollTop = this.scrollTop;   // eslint-disable-line
  }

  onPointerDown (event) {
    this._lastScrollTime = Date.now();
    this.removeListener('pointerdown', this.onPointerDown, this);
    this._lastPointerPosition.copyFrom(this.toLocal(event.data.global));
    this.interactionManager.on('pointermove', this.onPointerMove, this);
    this.interactionManager.on('pointerup', this.onPointerUp, this);
    this.interactionManager.on('pointerout', this.onPointerUp, this);
    this.interactionManager.on('pointercancel', this.onPointerUp, this);
  }

  onPointerMove (event) {
    const now = Date.now();
    const newPosition = this.toLocal(event.data.global);
    const dx = this._lastPointerPosition.x - newPosition.x;
    const dy = this._lastPointerPosition.y - newPosition.y;
    this._lastPointerPosition.copyFrom(newPosition);
    this._lastScrollDelta.set(dx, dy);
    this._lastScrollDuration = now - this._lastScrollTime;
    this._lastScrollTime = now;
    this.scrollBy(dx, dy);
  }

  onPointerOut (event) {
    document.removeEventListener('wheel', this.onWheel);
  }

  onPointerOver (event) {
    document.addEventListener('wheel', this.onWheel);
  }

  onPointerUp (event) {
    this.interactionManager.removeListener('pointermove', this.onPointerMove, this);
    this.interactionManager.removeListener('pointerup', this.onPointerUp, this);
    this.interactionManager.removeListener('pointerout', this.onPointerUp, this);
    this.interactionManager.removeListener('pointercancel', this.onPointerUp, this);
    this.on('pointerdown', this.onPointerDown, this);

    const multiplier = this._lastScrollDuration ? 1 / (this._lastScrollDuration * 0.001): 0;
    this.setVelocity(this._lastScrollDelta.x * multiplier, this._lastScrollDelta.y * multiplier);
  }

  onTick (scale) {
    const dt = ticker.deltaMS * scale * 0.001;
    const powDamping = pow(DAMPING, dt);
    const dampingMultiplier = (powDamping - 1) / LOG_DAMPING;

    let { x: vx, y: vy } = this._velocity;

    this.scrollBy(vx * dampingMultiplier, vy * dampingMultiplier);
    this.setVelocity(vx * powDamping, vy * powDamping);
  }

  get scrollLeft () {
    return this.content.left - this.content.x;
  }

  set scrollLeft (value) {
    const maxScroll = this.content.width - this.width;
    value = value < 0 ? 0 : (value > maxScroll ? maxScroll : value);
    this.content.x = -(value + this.content.left);
  }

  get scrollTop () {
    return this.content.top - this.content.y;
  }

  set scrollTop (value) {
    const maxScroll = this.content.height - this.height;
    value = value < 0 ? 0 : (value > maxScroll ? maxScroll : value);
    this.content.y = -(value + this.content.top);
  }

  get scrollHeight () {
    return this.content.height;
  }

  get scrollWidth () {
    return this.content.width;
  }

  get height () {
    return this._height;
  }

  set height (value) {
    this._height = value;
    this.contentMask.height = value;
  }

  get width () {
    return this._width;
  }

  set width (value) {
    this._width = value;
    this.contentMask.width = value;
  }

  get clientWidth () {
    return this.width;
  }

  get clientHeight () {
    return this.height;
  }

  get isTicking () {
    return this._isTicking;
  }

  set isTicking (value) {
    if (this._isTicking === value) {
      return;
    }

    this._isTicking = value;

    value
      ? ticker.add(this.onTick, this)
      : ticker.remove(this.onTick, this);
  }

}

export default class ScrollContainerElement extends ContainerElement {

  constructor (props, root) {
    super(props, root);
    this.displayObject.interactionManager = root.application.renderer.plugins.interaction;
    this.scrollHandler = null;
    this.displayObject.on('scrolled', this.onScroll, this);
  }

  destroy () {
    this.displayObject.removeListener('scrolled', this.onScroll, this);
    super.destroy();
  }

  applyInteractiveListeners (oldProps, newProps) {
    super.applyInteractiveListeners(oldProps, newProps);
    this.displayObject.interactive = true;
    this.displayObject.hitArea = this.bounds;
  }

  applyProps (oldProps, newProps) {
    super.applyProps(oldProps, newProps);
    this.scrollHandler = newProps.onScroll;
  }

  createDisplayObject () {
    return new ScrollContainer();
  }

  getChildContainer () {
    return this.displayObject.content;
  }

  onLayout (x, y, width, height) {
    super.onLayout(x, y, width, height);
    this.displayObject.height = height;
    this.displayObject.width = width;
  }

  onScroll () {
    this.scrollHandler && this.scrollHandler({ currentTarget: this.displayObject });
  }

  get isClippingEnabled () {
    return true;
  }

  set isClippingEnabled (isClippingEnabled) {
    // noop
  }

}
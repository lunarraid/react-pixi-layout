import * as PIXI from 'pixi.js';
import Container from './Container';
import mergeStyles from '../mergeStyles';

const MAX_LAYOUT_ATTEMPTS = 3;

const optionKeys = [
  'antialias',
  'autoStart',
  'autoResize',
  'backgroundColor',
  'clearBeforeRender',
  'forceCanvas',
  'forceFXAA',
  'height',
  'legacy',
  'powerPreference',
  'preserveDrawingBuffer',
  'resolution',
  'roundPixels',
  'sharedLoader',
  'sharedTicker',
  'transparent',
  'view',
  'width'
];

export default class Application extends Container {

  constructor (props, root) {
    super(props, root);
    this.applyProps({}, props);
    window.papp = this;

    this.layoutCallbackViews = [];
    this.callbackCount = 0;
    this.layoutAttemptCount = 0;
  }

  addToCallbackPool (view) {
    this.layoutCallbackViews[this.callbackCount] = view;
    this.callbackCount++;
  }

  removeFromCallbackPool (view) {
    const views = this.layoutCallbackViews;

    for (let i = 0; i < this.callbackCount; i++) {
      if (views[i] === view) {
        views[i] = null;
      }
    }
  }

  createDisplayObject (props) {
    const options = optionKeys.reduce((result, key) => {
      if (props.hasOwnProperty(key)) { result[key] = props[key]; }
      return result;
    }, {});

    this.view = props.view;
    this.application = new PIXI.Application(options);
    this.application.ticker.add(this.onTick, this);
    return this.application.stage;
  }

  applyProps (oldProps, newProps) {
    const { width, height, style } = newProps;

    if (oldProps.width !== width || oldProps.height !== height) {
      this.application.renderer.resize(width, height);
      this.view.style.width = '100%';
      this.view.style.height = '100%';
      this.layoutDirty = true;
    }

    const newStyle = { ...mergeStyles(style), width, height };

    super.applyProps(oldProps, { ...newProps, style: newStyle });
  }

  onTick () {
    this.updateLayout();
  }

  updateLayout () {
    if (this._layoutDirty) {

      this.layoutAttemptCount++;
      this.layoutNode.calculateLayout();
      this.applyLayout();

      for (let i = 0; i < this.callbackCount; i++) {
        const view = this.layoutCallbackViews[i];

        if (view) {
          const { x, y, width, height } = view.cachedLayout;
          this.layoutCallbackViews[i].onLayoutCallback(x, y, width, height);
          this.layoutCallbackViews[i] = null;
        }
      }

      this.callbackCount = 0;

      if (this._layoutDirty && this.layoutAttemptCount < MAX_LAYOUT_ATTEMPTS) {
        this.updateLayout();
      }

      this.layoutAttemptCount--;
    }
  }

  destroy () {
    this.application.ticker.remove(this.onTick, this);
    super.destroy();
  }

}

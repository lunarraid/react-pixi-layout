import * as PIXI from 'pixi.js';
import Container from './Container';
import mergeStyles from '../mergeStyles';

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
    if (this.layoutDirty) {
      this.layoutNode.calculateLayout();
      this.applyLayout();
    }
  }

  destroy () {
    this.application.ticker.remove(this.onTick, this);
    super.destroy();
  }

}

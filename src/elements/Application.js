import { Application as PixiApplication } from 'pixi.js';
import RootContainer from './RootContainer';
import mergeStyles from '../mergeStyles';

const MAX_LAYOUT_ATTEMPTS = 3;

const optionKeys = [
  'antialias',
  'autoDensity',
  'autoStart',
  'autoResize',
  'background',
  'backgroundAlpha',
  'backgroundColor',
  'clearBeforeRender',
  'context',
  'forceCanvas',
  'forceFXAA',
  'height',
  'legacy',
  'powerPreference',
  'premultipliedAlpha',
  'preserveDrawingBuffer',
  'resizeTo',
  'resolution',
  'roundPixels',
  'sharedTicker',
  'transparent',
  'view',
  'width'
];

export default class Application extends RootContainer {

  constructor (props, root) {
    super(props, root);
    window.papp = this;
    const { width, height } = this.application.renderer.screen;
    this.layoutNode.setWidth(width);
    this.layoutNode.setHeight(height);
  }

  createDisplayObject (props) {
    const options = optionKeys.reduce((result, key) => {
      if (props.hasOwnProperty(key)) { result[key] = props[key]; }
      return result;
    }, {});

    this.view = props.view;
    this.application = new PixiApplication(options);
    this.application.ticker.add(this.onTick, this);
    this.application.renderer.on('resize', this.onResize, this);

    return this.application.stage;
  }

  applyProps (oldProps, newProps) {
    const { width, height } = newProps;

    super.applyProps(oldProps, newProps);

    if (oldProps.width !== width || oldProps.height !== height) {
      this.application.renderer.resize(width, height);
    }
  }

  onResize (width, height) {
    this.layoutNode.setWidth(width);
    this.layoutNode.setHeight(height);
    this.layoutDirty = true;
    this.updateLayout();
    this.application.render();
  }

  onTick () {
    this.updateLayout();
  }

  destroy () {
    this.application.renderer.removeListener('resize', this.onResize, this);
    this.application.ticker.remove(this.onTick, this);
    super.destroy();
    this.application.destroy();
  }

}

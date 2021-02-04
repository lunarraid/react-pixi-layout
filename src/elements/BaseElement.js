import * as PIXI from 'pixi.js';
import * as Yoga from 'typeflex';

// import applyLayoutProperties, { applyDefaultLayoutProperties } from 'react-pixi-layout/applyLayoutProperties';
import applyLayoutProperties from '../applyLayoutProperties';
import mergeStyles from '../mergeStyles';

const interactiveProps = {
  pointerdown: 'onDown',
  pointermove: 'onMove',
  pointerup: 'onUp',
  pointerupoutside: 'onUpOutside',
  pointertap : 'onClick',
  pointerout: 'onOut',
  pointerover: 'onOver',
  pointercancel: 'onCancel'
};

const interactivePropList = Object.keys(interactiveProps);
const interactivePropCount = interactivePropList.length;

const childNotSupported = () => {
  throw new Error('Element does not support children.');
};

const noStyle = {};

const yogaConfig = Yoga.Config.create();

yogaConfig.setPointScaleFactor(0);

export default class BaseElement {

  constructor (props, root) {
    this._layoutDirty = true;
    this.root = root;
    this.layoutNode = Yoga.Node.create(yogaConfig);
    this.onLayoutCallback = null;
    this.bounds = new PIXI.Rectangle();
    this.cachedLayout = {
      left: 0,
      top: 0,
      width: 0,
      height: 0
    };
    this.style = noStyle;
    this.anchorX = 0.5;
    this.anchorY = 0.5;
    this.offsetX = 0;
    this.offsetY = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.skewX = 0;
    this.skewY = 0;
    this.displayObject = this.createDisplayObject(props);

    // applyDefaultLayoutProperties(this.layoutNode);
  }

  removeAllChildrenRecursive () {
    // Noop for container clear
  }

  hasChild (child) {
    childNotSupported();
  }

  addChild (child) {
    childNotSupported();
  }

  addChildAt (child, index) {
    childNotSupported();
  }

  removeChild (child) {
    childNotSupported();
  }

  setChildIndex(child, index) {
    childNotSupported();
  }

  getChildIndex (child) {
    childNotSupported();
  }

  applyInteractiveListeners (oldProps, newProps) {
    let { isInteractive } = newProps;
    let isAutoInteractive = false;

    for (let i = 0; i < interactivePropCount; i++) {
      const key = interactivePropList[i];
      const propName = interactiveProps[key];
      const oldValue = oldProps[propName];
      const newValue = newProps[propName];

      isAutoInteractive = isAutoInteractive || !!newValue;

      if (oldValue !== newValue) {
        if (oldValue) {
          this.displayObject.removeListener(key, oldValue);
        }
        if (newValue) {
          this.displayObject.on(key, newValue);
        }
      }
    }

    isInteractive = isInteractive === undefined ? isAutoInteractive : isInteractive;

    this.displayObject.interactive = isInteractive;
    this.displayObject.hitArea = isInteractive ? this.bounds : null;
  }

  applyProps (oldProps, newProps) {
    this.applyInteractiveListeners(oldProps, newProps);

    const { interactiveChildren = true } = newProps;
    this.displayObject.interactiveChildren = interactiveChildren;

    this.onLayoutCallback = newProps.onLayout || null;

    const newStyle = newProps.style ? mergeStyles(newProps.style) : noStyle;
    let layoutDirty = applyLayoutProperties(this.layoutNode, this.style, newStyle);

    this.style = newStyle;
    this.displayObject.alpha = this.parsePercentage(this.style.alpha, 1);

    const { props, list, count } = this.constructor.defaultProps;

    for (let i = 0; i < count; i++) {
      const key = list[i];
      const newValue = this.style[key];
      const newValueIsUndefined = newValue === undefined;

      if (newValueIsUndefined || this.style[key] !== undefined) {
        this.displayObject[key] = newValueIsUndefined ? props[key] : newValue;
      }
    }

    this.displayObject.mask = newProps.mask;

    const anchorX = this.parsePercentage(this.style.anchorX, 0.5);
    const anchorY = this.parsePercentage(this.style.anchorY, 0.5);
    const scaleX = this.parsePercentage(this.style.scaleX, 1);
    const scaleY = this.parsePercentage(this.style.scaleY, 1);

    const offsetX = this.style.offsetX || 0;
    const offsetY = this.style.offsetY || 0;
    const skewX = this.style.skewX || 0;
    const skewY = this.style.skewY || 0;

    const anchorsDirty = anchorX !== this.anchorX || anchorY !== this.anchorY || scaleX !== this.scaleX || scaleY !== this.scaleY;
    const transformDirty = offsetX !== this.offsetX || offsetY !== this.offsetY || skewX !== this.skewX || skewY !== this.skewY;

    if (anchorsDirty) {
      this.anchorX = anchorX;
      this.anchorY = anchorY;
      this.displayObject.scale.x = this.scaleX = scaleX;
      this.displayObject.scale.y = this.scaleY = scaleY;
    }

    if (transformDirty) {
      this.offsetX = offsetX;
      this.offsetY = offsetY;
      this.skewX = skewX;
      this.skewY = skewY;
    }

    if (layoutDirty || anchorsDirty) {
      this.layoutDirty = true;
    } else if (transformDirty) {
      this.applyTransform();
    }
  }

  applyLayout () {
    const newLayout = this.layoutNode.getComputedLayout();
    const cached = this.cachedLayout;

    const boundsDirty = newLayout.left !== cached.x || newLayout.top !== cached.y ||
      newLayout.width !== cached.width || newLayout.height !== cached.height;

    if (this.layoutDirty || boundsDirty) {
      cached.x = newLayout.left;
      cached.y = newLayout.top;
      cached.width = newLayout.width;
      cached.height = newLayout.height;

      this.bounds.width = cached.width;
      this.bounds.height = cached.height;

      this.applyTransform();
      this.onLayout(cached.x, cached.y, cached.width, cached.height);

      if (boundsDirty && this.onLayoutCallback) {
        this.onLayoutCallback(cached.x, cached.y, cached.width, cached.height);
      }

      this.layoutDirty = false;
    }
  }

  applyTransform () {
    const cached = this.cachedLayout;

    const anchorOffsetX = this.anchorX * cached.width;
    const anchorOffsetY = this.anchorY * cached.height;

    this.displayObject.skew.set(this.skewX, this.skewY);

    this.displayObject.position.set(
      cached.x + anchorOffsetX + this.offsetX,
      cached.y + anchorOffsetY + this.offsetY
    );
  }

  onLayout (x, y, width, height) {
  }

  parsePercentage (value, defaultValue) {
    if (value === undefined) {
      return defaultValue;
    }

    if (typeof value === 'string') {
      return value.endsWith('%') ? Number(value.substring(1, 0)) * 0.01 : Number(value);
    }

    return value;
  }

  destroy () {
    this.displayObject.destroy();
    this.displayObject = null;
    this.layoutNode.free();
    this.layoutNode = null;
  }

  createDisplayObject () {
    throw new Error('Cannot instantiate base class');
  }

  get layoutDirty () {
    return this._layoutDirty;
  }

  set layoutDirty (value) {
    this._layoutDirty = value;

    if (!value) {
      return;
    }

    if (this.root && this.root !== this) {
      this.root.layoutDirty = true;
    }
  }

  get publicInstance () {
    return this.displayObject;
  }

  static get defaultProps () {
    if (!this._defaultProps) {
      const props = this.listDefaultStyleProps();
      const list = Object.keys(props);
      const count = list.length;

      this._defaultProps = { props, list, count };
      this._defaultProps.count = this._defaultProps.list.length;
    }

    return this._defaultProps;
  }

  static listDefaultStyleProps () {
    return {
      blendMode: PIXI.BLEND_MODES.NORMAL,
      buttonMode: false,
      cacheAsBitmap: false,
      cursor: 'auto',
      filterArea: null,
      filters: null,
      renderable: true,
      rotation: 0,
      visible: true,
      tint: 0xffffff
    };
  }

}

import { BLEND_MODES, Rectangle } from 'pixi.js';
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

  onDragStart = () => {
    this.isClickValid = false;
  };

  constructor (props, root) {
    this._layoutDirty = true;
    this.root = root;
    this.layoutNode = Yoga.Node.create(yogaConfig);
    this.onLayoutCallback = null;
    this.bounds = new Rectangle();
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
    this.displayObject.on('pointertap', this.onClick, this);

    this._isMeasureFunctionSet = false;
    this.updateMeasureFunction(false);

    this.isClickValid = false;
    this._clickHandler = null;

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

      if (propName === 'onClick') {
        this.clickHandler = newValue;
      } else if (oldValue !== newValue) {
        oldValue && this.displayObject.removeListener(key, oldValue);
        newValue && this.displayObject.on(key, newValue);
      }
    }

    // Cancel clicks for drag events

    isInteractive = isInteractive === undefined ? isAutoInteractive : isInteractive;

    this.displayObject.interactive = isInteractive;
    // this.displayObject.hitArea = this.bounds;
  }

  applyProps (oldProps, newProps) {
    this.applyInteractiveListeners(oldProps, newProps);

    const { interactiveChildren = true, mask = null } = newProps;
    const { mask: oldMask = null } = oldProps;


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

    if (oldMask !== mask) {
      this.displayObject.mask = mask;
    }

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

      this.bounds.width = cached.width / this.displayObject.scale.x;
      this.bounds.height = cached.height / this.displayObject.scale.y;

      this.applyTransform();
      this.onLayout(cached.x, cached.y, cached.width, cached.height);

      if (boundsDirty && this.onLayoutCallback) {
        this.root.addToCallbackPool(this);
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

  updateMeasureFunction (hasChildren) {
    if (this._isMeasureFunctionSet && hasChildren) {
      this._isMeasureFunctionSet = false;
      this.layoutNode.setMeasureFunc(null);
    } else if (!this._isMeasureFunctionSet && !hasChildren && this.measure) {
      this._isMeasureFunctionSet = true;
      this.layoutNode.setMeasureFunc(
        (node, width, widthMode, height, heightMode) =>
          this.measure(node, width, widthMode, height, heightMode)
      );
    }
  }

  destroy () {
    if (this.onLayoutCallback) {
      this.root.removeFromCallbackPool(this);
    }

    this.clickHandler = null;
    this.displayObject.destroy();
    this.displayObject = null;
    this.layoutNode.free();
    this.layoutNode = null;
  }

  createDisplayObject () {
    throw new Error('Cannot instantiate base class');
  }

  onDown (event) {
    this.isClickValid = true;
  }

  onClick (event) {
    this.isClickValid && this.clickHandler && this.clickHandler(event);
  }

  get clickHandler () {
    return this._clickHandler;
  }

  set clickHandler (value) {
    if (this._clickHandler === value) {
      return;
    }

    this._clickHandler = value;

    if (value) {
      this.displayObject.on('pointerdown', this.onDown, this);
      window.addEventListener('dragStart', this.onDragStart, false);
    } else {
      this.displayObject.removeListener('pointerdown', this.onDown, this);
      window.removeEventListener('dragStart', this.onDragStart, false);
    }
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
      blendMode: BLEND_MODES.NORMAL,
      buttonMode: false,
      cacheAsBitmap: false,
      cursor: 'auto',
      filterArea: null,
      filters: null,
      renderable: true,
      rotation: 0,
      visible: true,
      tint: 0xffffff,
      sortableChildren: false,
      zIndex: 0
    };
  }

}

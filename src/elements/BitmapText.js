import { Point } from 'pixi.js';
import BitmapTextContainer, { Align } from './BitmapTextContainer';
import BaseElement from './BaseElement';
import TinyColor from '../util/TinyColor';

const textStyleValues = {
  align: Align.LEFT,
  font: null,
  leading: 0,
  letterSpacing: 0,
  isKerningEnabled: true,
  size: 16,
  verticalAlign: Align.TOP,
  wordWrap: false
};

const textStyleKeys = Object.keys(textStyleValues);
const textStyleKeyCount = textStyleKeys.length;

const scratchPoint = new Point();

// TODO: We need to handle font existence or not when initializing

export default class BitmapText extends BaseElement {

  sizeData = { width: 0, height: 0 };
  color = null;

  createDisplayObject (props) {
    return new BitmapTextContainer();
  }

  applyProps (oldProps, newProps) {
    super.applyProps(oldProps, newProps);

    let color = this.style.hasOwnProperty('color') ? this.style.color : 0xffffff;

    if (color !== this.color) {
      this.color = color;
      const colorIsString = (typeof color === 'string' || color instanceof String);
      color = colorIsString ? parseInt('0x' + new TinyColor(color).toHex(), 16) : color;
      this.displayObject.color = color;
    }

    let layoutDirty = false;
    const newText = newProps.text || '';

    if (this.displayObject.text !== newText) {
      this.displayObject.text = newText;
      layoutDirty = true;
    }

    for (let i = 0; i < textStyleKeyCount; i++) {
      const key = textStyleKeys[i];
      const oldValue = this.displayObject[key];
      const newValue = this.style.hasOwnProperty(key) ? this.style[key] : textStyleValues[key];
      if (oldValue !== newValue) {
        this.displayObject[key] = this.style.hasOwnProperty(key) ? this.style[key] : textStyleValues[key];
        layoutDirty = true;
      }
    }

    if (layoutDirty) {
      this.layoutNode.markDirty();
      this.layoutDirty = true;
    }
  }

  measure (node, width, widthMode, height, heightMode) {
    const dimensions = this.displayObject.measureText(scratchPoint, width);

    this.sizeData.width = dimensions.x;
    this.sizeData.height = dimensions.y;

    return this.sizeData;
  }

  onLayout (x, y, width, height) {
    this.displayObject.pivot.x = this.anchorX * width;
    this.displayObject.pivot.y = this.anchorY * height;
    this.displayObject.width = width;
    this.displayObject.height = height;
  }

}

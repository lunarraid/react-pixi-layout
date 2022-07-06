import { Text as PixiText, TextMetrics, TextStyle } from 'pixi.js';
import BaseElement from './BaseElement';

const textStyleKeys = {
  align: true,
  breakWords: true,
  dropShadow: true,
  dropShadowAlpha: true,
  dropShadowAngle: true,
  dropShadowBlur: true,
  dropShadowColor: true,
  dropShadowDistance: true,
  fill: true,
  fillGradientType: true,
  fillGradientStops: true,
  fontFamily: true,
  fontSize: true,
  fontStyle: true,
  fontVariant: true,
  fontWeight: true,
  letterSpacing: true,
  lineHeight: true,
  lineJoin: true,
  miterLimit: true,
  padding: true,
  stroke: true,
  strokeThickness: true,
  textBaseline: true,
  trim: true,
  whiteSpace: true,
  wordWrap: true,
  wordWrapWidth: true,
  leading: true
};

const scratchStyle = new TextStyle();

export default class Text extends BaseElement {

  sizeData = { width: 0, height: 0 };
  textStyle = new TextStyle();

  createDisplayObject () {
    return new PixiText();
  }

  applyProps (oldProps, newProps) {
    super.applyProps(oldProps, newProps);
    this.displayObject.text = newProps.text || '';

    let needsUpdate = false;

    scratchStyle.reset();

    for (let key in this.style) {
      if (textStyleKeys[key]) {
        scratchStyle[key] = this.style[key];
        if (scratchStyle[key] !== this.textStyle[key]) {
          needsUpdate = true;
          break;
        }
      }
    }

    if (!needsUpdate) {
      return;
    }

    this.textStyle.reset();

    for (let key in this.style) {
      if (textStyleKeys[key]) {
        this.textStyle[key] = this.style[key];
      }
    }

    this.displayObject.style = this.textStyle;
  }

  measure (node, width, widthMode, height, heightMode) {
    const { text, style } = this.displayObject;
    const previousWordWrapWidth = style.wordWrapWidth;
    style.wordWrapWidth = width;
    const metrics = TextMetrics.measureText(text, style);
    style.wordWrapWidth = previousWordWrapWidth;

    this.sizeData.width = metrics.width;
    this.sizeData.height = metrics.height;

    return this.sizeData;
  }

  onLayout (x, y, width, height) {
    this.displayObject.pivot.x = this.anchorX * width;
    this.displayObject.pivot.y = this.anchorY * height;
    this.displayObject.style.wordWrapWidth = width;
    this.displayObject.dirty = true;
  }

}

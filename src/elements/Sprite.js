import * as PIXI from 'pixi.js';
import Yoga from 'yoga-layout';
import BaseElement from './BaseElement';

export default class Sprite extends BaseElement {

  sizeData = { width: 0, height: 0 };

  constructor () {
    super();
    this.layoutNode.setMeasureFunc((width, widthMode, height, heightMode) => this.measure(width, widthMode, height, heightMode));
  }

  createDisplayObject () {
    return new PIXI.Sprite();
  }

  applyProps (oldProps, newProps) {
    super.applyProps(oldProps, newProps);

    if (oldProps.texture !== newProps.texture) {
      const texture = newProps.texture ? PIXI.Texture.fromImage(newProps.texture) : null;
      this.updateTexture(texture);
    }
  }

  updateTexture (texture) {
    if (texture && !texture.baseTexture.hasLoaded) {
      texture.once('update', () => this.updateTexture(this.displayObject.texture));
    }

    this.displayObject.texture = texture;
    this.displayObject.pivot.x = texture ? texture.orig.width * this.anchorX : 0;
    this.displayObject.pivot.y = texture ? texture.orig.height * this.anchorY : 0;

    // Due to custom measure function, we have to manually flag
    // dirty when we update the texture
    this.layoutNode.markDirty();

    this.layoutDirty = true;
  }

  measure (width, widthMode, height, heightMode) {
    const texture = this.displayObject.texture;

    if (!texture || !texture.baseTexture.hasLoaded) {
      this.sizeData.width = this.sizeData.height = 0;
      return this.sizeData;
    }

    let calculatedWidth = texture.orig.width;
    let calculatedHeight = texture.orig.height;

    const scale = calculatedWidth / calculatedHeight;

    /* eslint-disable */
    if (width !== width && height === height || widthMode == Yoga.MEASURE_MODE_AT_MOST) {
      calculatedWidth = height * scale;
      calculatedHeight = height;
    } else if (width === width && height !== height || heightMode == Yoga.MEASURE_MODE_AT_MOST) {
      calculatedWidth = width;
      calculatedHeight = width / scale;
    }
    /* eslint-enable */

    this.sizeData.width = calculatedWidth;
    this.sizeData.height = calculatedHeight;

    return this.sizeData;
  }

  onLayout (x, y, width, height) {
    if (this.displayObject.texture) {
      this.displayObject.width = width * this.scaleX;
      this.displayObject.height = height * this.scaleY;
      if (this.displayObject.scale.x < 0 !== this.scaleX < 0) {
        this.displayObject.scale.x *= -1;
      }
      if (this.displayObject.scale.y < 0 !== this.scaleY < 0) {
        this.displayObject.scale.y *= -1;
      }
    }
  }

};

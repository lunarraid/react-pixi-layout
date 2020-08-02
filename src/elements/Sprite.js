import * as PIXI from 'pixi.js';
import * as Yoga from 'typeflex';
import BaseElement from './BaseElement';

export default class Sprite extends BaseElement {

  sizeData = { width: 0, height: 0 };

  constructor (props, root) {
    super(props, root);
    this.layoutNode.setMeasureFunc((node, width, widthMode, height, heightMode) => this.measure(node, width, widthMode, height, heightMode));
  }

  createDisplayObject () {
    return new PIXI.Sprite();
  }

  applyProps (oldProps, newProps) {
    super.applyProps(oldProps, newProps);

    let { texture = PIXI.Texture.WHITE } = newProps;

    if (oldProps.texture !== texture) {
      if (typeof texture === 'string' || texture instanceof String) {
        texture = PIXI.Texture.from(newProps.texture);
      }

      this.updateTexture(texture);
    }
  }

  updateTexture (texture) {
    if (texture && !texture.baseTexture.hasLoaded) {
      texture.once('update', () => this.displayObject && this.updateTexture(this.displayObject.texture));
    }

    this.displayObject.texture = texture;
    this.displayObject.pivot.x = texture ? texture.orig.width * this.anchorX : 0;
    this.displayObject.pivot.y = texture ? texture.orig.height * this.anchorY : 0;

    // Due to custom measure function, we have to manually flag
    // dirty when we update the texture
    this.layoutNode.markDirty();

    this.layoutDirty = true;
  }

  measure (node, width, widthMode, height, heightMode) {

    const texture = this.displayObject.texture;

    if (!texture || !texture.baseTexture.valid) {
      this.sizeData.width = this.sizeData.height = 0;
      return this.sizeData;
    }

    let calculatedWidth = texture.orig.width;
    let calculatedHeight = texture.orig.height;
    const scale = calculatedWidth / calculatedHeight;

    if (widthMode === Yoga.MEASURE_MODE_AT_MOST) {
      calculatedWidth = width > calculatedWidth ? calculatedWidth : width;
      calculatedHeight = calculatedWidth / scale;
    }

    if (heightMode === Yoga.MEASURE_MODE_AT_MOST) {
      calculatedHeight = height > calculatedHeight ? calculatedHeight : height;
      calculatedWidth = calculatedHeight * scale;
    }

    if (widthMode === Yoga.MEASURE_MODE_EXACTLY) {
      calculatedWidth = width;
      calculatedHeight = heightMode !== Yoga.MEASURE_MODE_EXACTLY ? calculatedWidth / scale : height;
    }

    if (heightMode === Yoga.MEASURE_MODE_EXACTLY) {
      calculatedHeight = height;
      calculatedWidth = widthMode !== Yoga.MEASURE_MODE_EXACTLY ? calculatedHeight * scale : width;
    }

    this.sizeData.width = calculatedWidth;
    this.sizeData.height = calculatedHeight;

    return this.sizeData;
  }

  onLayout (x, y, width, height) {
    if (this.displayObject.texture) {
      this.displayObject.width = width * this.scaleX;
      this.displayObject.height = height * this.scaleY;
      if ((this.displayObject.scale.x < 0) !== (this.scaleX < 0)) {
        this.displayObject.scale.x *= -1;
      }
      if ((this.displayObject.scale.y < 0) !== (this.scaleY < 0)) {
        this.displayObject.scale.y *= -1;
      }
    }
  }

}

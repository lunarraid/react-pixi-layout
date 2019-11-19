import * as PIXI from 'pixi.js';

import Container from './Container';

export default class NineSliceSprite extends Container {

  createDisplayObject () {
    return new PIXI.NineSlicePlane(PIXI.Texture.EMPTY);
  }

  applyProps (oldProps, newProps) {
    super.applyProps(oldProps, newProps);

    let texture = PIXI.Texture.EMPTY;

    if (newProps.texture) {
      texture = (typeof newProps.texture === 'string' || newProps.texture instanceof String)
        ? PIXI.Texture.from(newProps.texture)
        : newProps.texture
    }

    const height = texture ? texture.height : 0;
    const width = texture ? texture.width : 0;

    this.displayObject.texture = texture;
    this.displayObject.bottomHeight = newProps.bottomHeight || height / 2;
    this.displayObject.rightWidth = newProps.rightWidth || width / 2;
    this.displayObject.topHeight = newProps.topHeight || height / 2;
    this.displayObject.leftWidth = newProps.leftWidth || width / 2;
  }

  onLayout (x, y, width, height) {
    super.onLayout(x, y, width, height);

    if (this.displayObject.texture) {
      this.displayObject.width = width;
      this.displayObject.height = height;
    }
  }

}

import * as PIXI from 'pixi.js';
import Container from './Container';

export default class Sprite extends Container {

  createDisplayObject () {
    return new PIXI.mesh.NineSlicePlane(PIXI.Texture.EMPTY);
  }

  applyProps (oldProps, newProps) {
    super.applyProps(oldProps, newProps);
    const texture = newProps.texture ? PIXI.Texture.fromImage(newProps.texture) : PIXI.Texture.Empty;
    this.displayObject.texture = texture;
    this.displayObject.bottomHeight = newProps.bottomHeight || 0;
    this.displayObject.rightWidth = newProps.rightWidth || 0;
    this.displayObject.topHeight = newProps.topHeight || 0;
    this.displayObject.leftWidth = newProps.leftWidth || 0;
  }

  onLayout (x, y, width, height) {
    super.onLayout(x, y, width, height);
    if (this.displayObject.texture) {
      this.displayObject.width = width;
      this.displayObject.height = height;
    }
  }

};

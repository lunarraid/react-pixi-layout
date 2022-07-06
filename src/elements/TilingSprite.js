import { Texture, TilingSprite as PixiTilingSprite } from 'pixi.js';
import Container from './Container';

export default class TilingSprite extends Container {

  createDisplayObject () {
    return new PixiTilingSprite(Texture.EMPTY);
  }

  applyProps (oldProps, newProps) {
    super.applyProps(oldProps, newProps);
    const texture = newProps.texture ? Texture.from(newProps.texture) : null;
    this.displayObject.texture = texture;
    this.displayObject.tilePosition.set(newProps.offsetX || 0, newProps.offsetY || 0);
    this.displayObject.tileScale.set(newProps.tileScale || 1);
  }

  onLayout (x, y, width, height) {
    super.onLayout(x, y, width, height);
    if (this.displayObject.texture) {
      this.displayObject.width = width * this.scaleX;
      this.displayObject.height = height * this.scaleY;
    }
  }


}

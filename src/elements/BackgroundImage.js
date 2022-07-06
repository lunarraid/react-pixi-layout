import { Rectangle, Sprite, Texture } from 'pixi.js';
import RplSprite from './Sprite';

const RESIZE_MODE_STRETCH = 'stretch';
const RESIZE_MODE_COVER = 'cover';

/**
 * Supports 'stretch', 'cover', 'contain'
 **/

export default class BackgroundImage extends RplSprite {

  originalTexture = null;
  customTexture = null;
  _resizeMode = RESIZE_MODE_STRETCH;

  applyProps (oldProps, newProps) {
    this.resizeMode = (newProps && newProps.resizeMode) || RESIZE_MODE_STRETCH;
    super.applyProps(oldProps, newProps);
  }

  onLayout (x, y, width, height) {
    super.onLayout(x, y, width, height);
    this.updateTexture(this.originalTexture);
  }

  updateTexture (texture) {
    if (texture !== this.originalTexture) {

      if (this.customTexture) {
        this.customTexture.destroy();
      }

      this.originalTexture = texture;
      this.customTexture = texture
        ? new Texture(texture.baseTexture, new Rectangle(), texture.orig.clone(), new Rectangle(), texture.rotate)
        : null;
    }

    if (!texture || this._resizeMode === RESIZE_MODE_STRETCH) {
      return super.updateTexture(texture);
    }

    const baseFrame = texture.frame;
    const tex = this.customTexture;
    const trim = tex.trim;

    tex.frame.copy(baseFrame);

    if (texture.trim) {
      trim.copy(texture.trim);
    } else {
      trim.x = 0;
      trim.y = 0;
      trim.width = baseFrame.width;
      trim.height = baseFrame.height;
    }

    const targetRatio = this.cachedLayout.width / this.cachedLayout.height;
    const baseRatio = baseFrame.width / baseFrame.height;

    const useWidthForScale = this._resizeMode === RESIZE_MODE_COVER
      ? targetRatio > baseRatio
      : targetRatio < baseRatio;

    const scale = useWidthForScale
      ? this.cachedLayout.width / baseFrame.width
      : this.cachedLayout.height / baseFrame.height;

    let offsetX = -(baseFrame.width - this.cachedLayout.width / scale) * 0.5;
    let offsetY = -(baseFrame.height - this.cachedLayout.height / scale) * 0.5;

    if (offsetX < 0) {
      tex.frame.x -= offsetX;
      tex.frame.width += offsetX * 2;
    } else {
      trim.x += offsetX * 0.5;
      trim.width -= offsetX;
    }

    if (offsetY < 0) {
      tex.frame.y -= offsetY;
      tex.frame.height += offsetY * 2;
    } else {
      trim.y += offsetY * 0.5;
      trim.height -= offsetY;
    }

    tex._updateUvs();

    return super.updateTexture(tex);
  }

  get resizeMode () {
    return this._resizeMode;
  }

  set resizeMode (value) {
    if (this._resizeMode !== value) {
      this._resizeMode = value;
      this.updateTexture(this.originalTexture);
    }
  }

}



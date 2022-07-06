import { Container as PixiContainer, NineSlicePlane, Rectangle, Point, Sprite, Texture } from 'pixi.js';

import TinyColor from '../util/TinyColor';

import Container from './Container';

const emptyObject = {};

export const BackgroundContainerResizeModes = {
  CONTAIN: 'contain',
  COVER: 'cover',
  NINE_SLICE: 'nineSlice',
  STRETCH: 'stretch'
};

export default class BackgroundContainer extends Container {

  background = null;
  childContainer = null;
  originalTexture = null;
  modifiedTexture = null;
  textureScale = 1;

  _resizeMode = null;

  constructor (props, root) {
    super(props, root);

    const { texture = Texture.WHITE } = props;

    if (typeof texture === 'string' || texture instanceof String) {
      this.originalTexture = Texture.from(texture);
    } else {
      this.originalTexture = texture;
    }

    this.childContainer = new PixiContainer();

    this.displayObject.addChild(this.childContainer);
  }

  getChildContainer () {
    return this.childContainer;
  }

  destroy () {
    this.displayObject.removeChild(this.background);
    this.displayObject.removeChild(this.childContainer);

    super.destroy();

    // Don't null out these references until after destroying
    // because childContainer is used in getChildContainer()
    // as part of the destroy flow to clean up current state

    this.background = null;
    this.childContainer = null;
  }

  get resizeMode () {
    return this._resizeMode;
  }

  set resizeMode (value) {
    if (this._resizeMode !== value) {
      const is9Slice = value === BackgroundContainerResizeModes.NINE_SLICE;
      const was9Slice = this._resizeMode === BackgroundContainerResizeModes.NINE_SLICE;

      this._resizeMode = value;

      if (this.background && is9Slice !== was9Slice) {
        this.displayObject.removeChild(this.background);

        this.background.destroy();

        this.background = null;
      }

      if (!this.background) {
        this.background = value === BackgroundContainerResizeModes.NINE_SLICE
          ? new NineSlicePlane(Texture.WHITE)
          : new Sprite(Texture.WHITE);
      }

      this.displayObject.addChildAt(this.background, 0);

      this.updateTexture(this.originalTexture);
      this.updateColor(this.style);
    }
  }

  onLayout (x, y, width, height) {
    super.onLayout(x, y, width, height);

    this.updateTexture(this.originalTexture);
    this.updateColor(this.style);
  }

  applyProps (oldProps, newProps = emptyObject) {
    const oldStyle = this.style || emptyObject;

    super.applyProps(oldProps, newProps);

    const { resizeMode = this.style.resizeMode, texture = this.style.texture, textureScale } = newProps;
    const previousTexture = this.originalTexture;

    let needsUpdate = true;

    if (!texture) {
      this.originalTexture = Texture.WHITE;
    } else if (typeof texture === 'string' || texture instanceof String) {
      this.originalTexture = Texture.from(texture);
    } else {
      this.originalTexture = texture;
    }

    if (this.originalTexture && !this.originalTexture.baseTexture.valid) {
      needsUpdate = false;

      this.originalTexture.once('update', () => this.displayObject && this.updateTexture(this.originalTexture));
    }

    this.textureScale = textureScale || 1;
    this.resizeMode = resizeMode || BackgroundContainerResizeModes.STRETCH;

    if (this.background) {
      if (this.resizeMode === BackgroundContainerResizeModes.NINE_SLICE) {
        const { topHeight, rightWidth, bottomHeight, leftWidth } = newProps;
        const { frame } = this.originalTexture;

        this.background.topHeight = topHeight || frame.height * 0.5;
        this.background.rightWidth = rightWidth || frame.width * 0.5;
        this.background.bottomHeight = bottomHeight || frame.height * 0.5;
        this.background.leftWidth = leftWidth || frame.width * 0.5;
      }

      const newStyle = this.style || emptyObject;
      const alphaChanged = oldStyle.alpha !== newStyle.alpha;
      const backgroundColorChanged = oldStyle.backgroundColor !== newStyle.backgroundColor;
      const tintChanged = oldStyle.tint !== newStyle.tint;

      if (alphaChanged || backgroundColorChanged || tintChanged) {
        this.updateColor(newStyle || emptyObject);
      }
    }

    if (needsUpdate && this.originalTexture && this.originalTexture !== previousTexture) {
      this.updateTexture(this.originalTexture);
    }
  }

  updateColor (style) {
    if (style.tint !== undefined) {
      this.background.alpha = style.alpha !== undefined ? style.alpha : 1;
      this.background.tint = style.tint;
    } else if (style.backgroundColor !== undefined) {
      const color = new TinyColor(style.backgroundColor);

      this.background.alpha = color.getAlpha();
      this.background.tint = parseInt('0x' + color.toHex(), 16);
    } else {
      this.background.alpha = 1;
      this.background.tint = 0xffffff;
    }
  }

  updateTexture (requestedTexture) {
    if (this.originalTexture !== requestedTexture) {
      if (this.modifiedTexture) {
        this.modifiedTexture.destroy();

        this.modifiedTexture = null;
      }

      this.originalTexture = requestedTexture;
    }

    const { width: layoutWidth, height: layoutHeight } = this.cachedLayout;

    if (!layoutWidth || !layoutHeight) {
      // Don't draw, it's zero size (and this fixes 9-slicing)

      this.background.texture = Texture.EMPTY;

      return;
    }

    if (this.resizeMode === BackgroundContainerResizeModes.STRETCH) {
      // Just shove the texture in at the full width/height

      this.background.texture = requestedTexture;
      this.background.width = layoutWidth;
      this.background.height = layoutHeight;

      return;
    }

    const { frame: requestedFrame } = requestedTexture;

    const modifiedTexture = new Texture(
      requestedTexture.baseTexture,
      requestedTexture.frame.clone(),
      requestedTexture.orig.clone(),
      requestedTexture.trim
        ? requestedTexture.trim.clone()
        : new Rectangle(0, 0, requestedFrame.width, requestedFrame.height),
      requestedTexture.rotate,
      requestedTexture.anchor
        ? requestedTexture.anchor.clone()
        : new Point(0, 0)
    );

    if (this.resizeMode === BackgroundContainerResizeModes.NINE_SLICE) {
      this.background.texture = modifiedTexture;
      this.background.scale = new Point(this.textureScale, this.textureScale);
      this.background.width = layoutWidth / this.textureScale;
      this.background.height = layoutHeight / this.textureScale;

      return;
    }

    const { frame: modifiedFrame, trim: modifiedTrim } = modifiedTexture;

    const isContain = this.resizeMode === BackgroundContainerResizeModes.CONTAIN;
    const layoutRatio = layoutWidth / layoutHeight;
    const trimmedRatio = modifiedFrame.width / modifiedFrame.height;
    const useWidth = isContain ? layoutRatio < trimmedRatio : layoutRatio > trimmedRatio;
    const scale = useWidth ? layoutWidth / modifiedFrame.width : layoutHeight / modifiedFrame.height;

    const scaledLayoutWidth = layoutWidth / scale;
    const scaledLayoutHeight = layoutHeight / scale;
    const offsetX = (scaledLayoutWidth - modifiedFrame.width) * 0.5;
    const offsetY = (scaledLayoutHeight - modifiedFrame.height) * 0.5;

    if (isContain) {
      const widthRatio = modifiedTrim.width / (modifiedTrim.width + offsetX * 2);
      const heightRatio = modifiedTrim.height / (modifiedTrim.height + offsetY * 2);

      modifiedTrim.x += modifiedTrim.width * (1 - widthRatio) * 0.5;
      modifiedTrim.y += modifiedTrim.height * (1 - heightRatio) * 0.5;
      modifiedTrim.width *= widthRatio;
      modifiedTrim.height *= heightRatio;
    } else {
      modifiedFrame.x -= offsetX;
      modifiedFrame.y -= offsetY;
      modifiedFrame.width += offsetX * 2;
      modifiedFrame.height += offsetY * 2;

      // TODO: Fix resize mode cover with source trim

      // if (offsetX < 0 && modifiedTrim.x) {
      //   const spill = modifiedTrim.x + offsetX;
      //
      //   modifiedFrame.x -= spill;
      //   modifiedFrame.width += spill * 2;
      //
      //   // modifiedTrim.x -= spill;
      //   // modifiedTrim.width += spill * 2;
      // }
      //
      // if (offsetY < 0 && modifiedTrim.y) {
      //   const spill = modifiedTrim.y + offsetY;
      //
      //   modifiedFrame.y -= spill;
      //   modifiedFrame.height += spill * 2;
      //
      //   // modifiedTrim.y = 0;
      //   // modifiedTrim.height = (modifiedTrim.height + modifiedTrim.y * 2) * 2;
      // }
    }

    modifiedTexture.updateUvs();

    this.modifiedTexture = modifiedTexture;
    this.background.texture = modifiedTexture;
    this.background.width = layoutWidth;
    this.background.height = layoutHeight;
  }

}

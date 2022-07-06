import { Matrix, Point, settings, Sprite as PixiSprite, Texture } from 'pixi.js';
import * as Yoga from 'typeflex';
import Container from './Container';

const SCRATCH_MATRIX = new Matrix();
const SCRATCH_POINT = new Point();

const { round } = Math;

class SpriteContainer extends PixiSprite {

  calculateVertices () {
    const texture = this._texture;

    if (this._transformID === this.transform._worldID && this._textureID === texture._updateID) {
      return;
    }

    // update texture UV here, because base texture can be changed without calling `_onTextureUpdate`
    if (this._textureID !== texture._updateID) {
      this.uvs = this._texture._uvs.uvsFloat32;
    }

    this._transformID = this.transform._worldID;
    this._textureID = texture._updateID;

    // set the vertex data

    const { a, b, c, d, tx, ty } = this.transform.worldTransform;
    const vertexData = this.vertexData;
    const { trim, orig } = texture;
    const anchor = this._anchor;

    let w0 = 0;
    let w1 = 0;
    let h0 = 0;
    let h1 = 0;

    if (trim) {
      const scaleX = this._width / orig.width;
      const scaleY = this._height / orig.height;

      // if the sprite is trimmed and is not a tilingsprite then we need to add the extra
      // space before transforming the sprite coords.
      w1 = (trim.x * scaleX) - (anchor._x * this._width);
      w0 = w1 + trim.width * scaleX;

      h1 = (trim.y * scaleY) - (anchor._y * this._height);
      h0 = h1 + (trim.height * scaleY);
    } else {
      w1 = -anchor._x * this._width;
      w0 = w1 + this._width;

      h1 = -anchor._y * this._height;
      h0 = h1 + this._height;
    }

    // xy
    vertexData[0] = (a * w1) + (c * h1) + tx;
    vertexData[1] = (d * h1) + (b * w1) + ty;

    // xy
    vertexData[2] = (a * w0) + (c * h1) + tx;
    vertexData[3] = (d * h1) + (b * w0) + ty;

    // xy
    vertexData[4] = (a * w0) + (c * h0) + tx;
    vertexData[5] = (d * h0) + (b * w0) + ty;

    // xy
    vertexData[6] = (a * w1) + (c * h0) + tx;
    vertexData[7] = (d * h0) + (b * w1) + ty;

    if (this._roundPixels)
    {
        const resolution = settings.RESOLUTION;

        for (let i = 0; i < vertexData.length; ++i)
        {
            vertexData[i] = round((vertexData[i] * resolution | 0) / resolution);
        }
    }
  }

  calculateTrimmedVertices () {
    if (!this.vertexTrimmedData) {
      this.vertexTrimmedData = new Float32Array(8);
    } else if (this._transformTrimmedID === this.transform._worldID && this._textureTrimmedID === this._texture._updateID) {
      return;
    }

    this._transformTrimmedID = this.transform._worldID;
    this._textureTrimmedID = this._texture._updateID;

    // lets do some special trim code!
    const texture = this._texture;
    const vertexData = this.vertexTrimmedData;
    const orig = texture.orig;
    const anchor = this._anchor;

    // lets calculate the new untrimmed bounds..
    const { a, b, c, d, tx, ty } = this.transform.worldTransform;

    const w1 = -anchor._x * this._width;
    const w0 = w1 + this._width;

    const h1 = -anchor._y * this._height;
    const h0 = h1 + this._height;

    // xy
    vertexData[0] = (a * w1) + (c * h1) + tx;
    vertexData[1] = (d * h1) + (b * w1) + ty;

    // xy
    vertexData[2] = (a * w0) + (c * h1) + tx;
    vertexData[3] = (d * h1) + (b * w0) + ty;

    // xy
    vertexData[4] = (a * w0) + (c * h0) + tx;
    vertexData[5] = (d * h0) + (b * w0) + ty;

    // xy
    vertexData[6] = (a * w1) + (c * h0) + tx;
    vertexData[7] = (d * h0) + (b * w1) + ty;
  }

  containsPoint (point) {
    this.worldTransform.applyInverse(point, SCRATCH_POINT);

    const width = this._width;
    const height = this._height;
    const x1 = -width * this.anchor.x;
    let y1 = 0;

    if (SCRATCH_POINT.x >= x1 && SCRATCH_POINT.x < x1 + width) {
      y1 = -height * this.anchor.y;

      if (SCRATCH_POINT.y >= y1 && SCRATCH_POINT.y < y1 + height) {
        return true;
      }
    }

    return false;
  }

  getLocalBounds (rect) {
    // we can do a fast local bounds if the sprite has no children!
    if (this.children.length === 0) {
      this._bounds.minX = this._width * -this._anchor._x;
      this._bounds.minY = this._height * -this._anchor._y;
      this._bounds.maxX = this._width * (1 - this._anchor._x);
      this._bounds.maxY = this._height * (1 - this._anchor._y);

      if (!rect) {
        if (!this._localBoundsRect) {
          this._localBoundsRect = new Rectangle();
        }

        rect = this._localBoundsRect;
      }

      return this._bounds.getRectangle(rect);
    }

    return super.getLocalBounds(rect);
  }

  _onTextureUpdate () {
    this._textureID = -1;
    this._textureTrimmedID = -1;
    this._cachedTint = 0xffffff;

    // if (this._height === 0) {
    //   this._height = this.texture.orig.height;
    // }

    // if (this._width === 0) {
    //   this._width = this.texture.orig.width;
    // }
  }

  get height () {
    return this._height;
  }

  set height (value) {
    this._height = value;
    this._transformID = -1;
  }

  get width () {
    return this._width;
  }

  set width (value) {
    this._width = value;
    this._transformID = -1;
  }

}

export default class Sprite extends Container {

  sizeData = { width: 0, height: 0 };
  _textureRef = null;

  createDisplayObject () {
    return new SpriteContainer(Texture.WHITE);
  }

  applyProps (oldProps, newProps) {
    super.applyProps(oldProps, newProps);

    const textureRef = newProps.texture || this.style.texture || null;

    if (this._textureRef !== textureRef) {

      this._textureRef = textureRef;
      let texture;

      if (textureRef) {
        texture = (typeof textureRef === 'string' || textureRef instanceof String)
          ? Texture.from(textureRef)
          : textureRef;
      } else {
        texture = Texture.WHITE;
      }

      this.updateTexture(texture);
    }
  }

  updateTexture (texture) {
    if (texture && !texture.baseTexture.valid) {
      texture.once('update', () => this.displayObject && this.updateTexture(this.displayObject.texture));
    }

    this.displayObject.texture = texture;
    this.displayObject.pivot.x = texture ? texture.orig.width * this.anchorX : 0;
    this.displayObject.pivot.y = texture ? texture.orig.height * this.anchorY : 0;

    // Due to custom measure function, we have to manually flag
    // dirty when we update the texture
    if (this.children.length === 0) {
      this.layoutNode.markDirty();
    }

    this.layoutDirty = true;
  }

  measure (node, width, widthMode, height, heightMode) {

    const texture = this.displayObject.texture;

    if (!texture || !texture.orig || texture.orig.width === 0 || texture.orig.height === 0) {
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
    this.displayObject.pivot.x = this.anchorX * width;
    this.displayObject.pivot.y = this.anchorY * height;
    this.displayObject.height = height;
    this.displayObject.width = width;

    if (this.clippingSprite) {
      this.clippingSprite.width = width;
      this.clippingSprite.height = height;
    }
  }

}

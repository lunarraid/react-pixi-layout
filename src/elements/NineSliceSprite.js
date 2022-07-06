import { NineSlicePlane as PixiNineSlicePlane, Texture } from 'pixi.js';
import Container from './Container';

// Temporary (imperfect) solution to spritesheet texture bug, remove when
// this is dealt with: https://github.com/pixijs/pixi.js/issues/6451

class NineSlicePlane extends PixiNineSlicePlane {

  updateHorizontalVertices () {
    const vertices = this.vertices;
    const scale = this._getMinScale();
    const trim = this.texture && this.texture.trim;
    const orig = this.texture && this.texture.orig;

    let topPadding = 0;
    let bottomPadding = 0;

    if (trim) {
      topPadding = trim.y;
      bottomPadding = orig.height - trim.height - trim.y;
    }

    vertices[1] = vertices[3] = vertices[5] = vertices[7] = topPadding * scale;
    vertices[9] = vertices[11] = vertices[13] = vertices[15] = this._topHeight * scale;
    vertices[17] = vertices[19] = vertices[21] = vertices[23] = this._height - (this._bottomHeight * scale);
    vertices[25] = vertices[27] = vertices[29] = vertices[31] = this._height - bottomPadding;
  }

  updateVerticalVertices () {
    const vertices = this.vertices;
    const scale = this._getMinScale();
    const trim = this.texture && this.texture.trim;
    const orig = this.texture && this.texture.orig;

    let leftPadding = 0;
    let rightPadding = 0;

    if (trim) {
      leftPadding = trim.x;
      rightPadding = orig.width - trim.width - trim.x;
    }

    vertices[0] = vertices[8] = vertices[16] = vertices[24] = leftPadding * scale;
    vertices[2] = vertices[10] = vertices[18] = vertices[26] = this._leftWidth * scale;
    vertices[4] = vertices[12] = vertices[20] = vertices[28] = this._width - (this._rightWidth * scale);
    vertices[6] = vertices[14] = vertices[22] = vertices[30] = this._width - leftPadding;
  }

  _refresh () {
    const texture = this.texture;

    const uvs = this.geometry.buffers[1].data;

    this._origWidth = texture.orig.width;
    this._origHeight = texture.orig.height;

    const _uvw = 1.0 / this._origWidth;
    const _uvh = 1.0 / this._origHeight;

    let topPadding = 0;
    let bottomPadding = 0;
    let leftPadding = 0;
    let rightPadding = 0;

    if (texture.trim) {
      topPadding = _uvh * texture.trim.y;
      bottomPadding = (this._origHeight - texture.trim.height - texture.trim.y) * _uvh;
      leftPadding = _uvw * texture.trim.x;
      rightPadding = (this._origWidth - texture.trim.width - texture.trim.x) * _uvw;
    }

    uvs[0] = uvs[8] = uvs[16] = uvs[24] = leftPadding;
    uvs[1] = uvs[3] = uvs[5] = uvs[7] = topPadding;
    uvs[6] = uvs[14] = uvs[22] = uvs[30] = 1 - rightPadding;
    uvs[25] = uvs[27] = uvs[29] = uvs[31] = 1 - bottomPadding;

    uvs[2] = uvs[10] = uvs[18] = uvs[26] = _uvw * this._leftWidth + leftPadding;
    uvs[4] = uvs[12] = uvs[20] = uvs[28] = 1 - (_uvw * this._rightWidth) - rightPadding;
    uvs[9] = uvs[11] = uvs[13] = uvs[15] = _uvh * this._topHeight - topPadding;
    uvs[17] = uvs[19] = uvs[21] = uvs[23] = 1 - (_uvh * this._bottomHeight) - bottomPadding;

    this.updateHorizontalVertices();
    this.updateVerticalVertices();

    this.geometry.buffers[0].update();
    this.geometry.buffers[1].update();
  }

  setBorders (top, right, bottom, left) {
    this._topHeight = top;
    this._rightWidth = right;
    this._bottomHeight = bottom;
    this._leftWidth = left;
    this._refresh();
  }

}

export default class NineSliceSprite extends Container {

  _textureRef = null;

  createDisplayObject () {
    return new NineSlicePlane(Texture.EMPTY);
  }

  applyProps (oldProps, newProps) {
    super.applyProps(oldProps, newProps);

    let texture;

    const textureRef = newProps.texture || this.style.texture || null;

    if (this._textureRef !== textureRef) {

      this._textureRef = textureRef;

      if (textureRef) {
        texture = (typeof textureRef === 'string' || textureRef instanceof String)
          ? Texture.from(textureRef)
          : textureRef;
      } else {
        texture = Texture.NONE;
      }

      this.displayObject.texture = texture;
    } else {
      texture = this.displayObject.texture;
    }

    const height = texture ? texture.height : 0;
    const width = texture ? texture.width : 0;

    const {
      bottomHeight = height * 0.5,
      rightWidth = width * 0.5,
      topHeight = height * 0.5,
      leftWidth = width * 0.5
    } = this.style;

    const dO = this.displayObject;
    const needsUpdate = dO.topHeight !== topHeight || dO.bottomHeight !== bottomHeight || dO.leftWidth !== leftWidth || dO.rightWidth !== rightWidth;

    if (needsUpdate) {
      this.displayObject.setBorders(topHeight, rightWidth, bottomHeight, leftWidth);
    }
  }

  onLayout (x, y, width, height) {
    super.onLayout(x, y, width, height);

    if (this.displayObject.texture) {
      this.displayObject.width = width;
      this.displayObject.height = height;
    }
  }

}

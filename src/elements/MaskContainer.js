import { RenderTexture, Sprite, Ticker } from 'pixi.js';

import Container from './Container';

const NO_CHILDREN = [];

class RenderTextureContainer extends Sprite {

  constructor () {
    super(RenderTexture.create(256, 256));
    this.isRenderingToTexture = false;
  }

  destroy (options) {
    this.texture.destroy(true);
    super.destroy(options);
  }

  render (renderer) {
    if (this.isRenderingToTexture) {
      const isRenderable = this.renderable;
      this.renderable = true;
      super.render(renderer);
      this.renderable = isRenderable;
    } else {
      const children = this.children;
      this.children = NO_CHILDREN;
      super.render(renderer);
      this.children = children;
    }
  }

  _render (renderer) {
    if (!this.isRenderingToTexture) {
      super._render(renderer);
    }
  }

  renderToTexture (renderer) {
    this.isRenderingToTexture = true;
    renderer.render(this, this.texture);
    this.isRenderingToTexture = false;
  }

}

export default class MaskContainer extends Container {

  constructor (props, root) {
    super(props, root);
    Ticker.shared.add(this.onTick, this);
  }

  createDisplayObject () {
    return new RenderTextureContainer();
  }

  destroy () {
    Ticker.shared.remove(this.onTick, this);
    super.destroy();
  }

  onLayout (x, y, width, height) {
    super.onLayout(x, y, width, height);
    this.displayObject.texture.resize(width, height);
  }

  onTick () {
    this.displayObject.renderToTexture(this.root.application.renderer);
  }

  get isClippingEnabled () {
    return this._isClippingEnabled;
  }

  set isClippingEnabled (isClippingEnabled) {
    this._isClippingEnabled = !!isClippingEnabled;
  }

}

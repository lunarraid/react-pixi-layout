import * as PIXI from 'pixi.js';
import BaseElement from './BaseElement';

class CustomContainer extends PIXI.Container {

  _width = 0;
  _height = 0;

  isCustomContainer = true;

  _calculateBounds () {
    const b = this._bounds;
    b.minX = 0;
    b.maxX = this._width;
    b.minY = 0;
    b.maxY = this._height;
  }

  get height () {
    return this._height;
  }

  set height (value) {
    this._height = value;
  }

  get width () {
    return this._width;
  }

  set width (value) {
    this._width = value;
  }

}

export default class Container extends BaseElement {

  children = [];
  clippingSprite = null;

  _isClippingEnabled = false;

  get isClippingEnabled () {
    return this._isClippingEnabled;
  }

  set isClippingEnabled (isClippingEnabled) {
    isClippingEnabled = !!isClippingEnabled;

    if (this._isClippingEnabled === isClippingEnabled) {
      return;
    }

    if (isClippingEnabled) {
      this.clippingSprite = new PIXI.Sprite(PIXI.Texture.WHITE);

      this.clippingSprite.width = this.bounds.width;
      this.clippingSprite.height = this.bounds.height;
      this.getChildContainer().mask = this.clippingSprite;

      this.getChildContainer().addChild(this.clippingSprite);
    } else {
      this.getChildContainer().mask = null;

      this.getChildContainer().removeChild(this.clippingSprite);

      this.clippingSprite = null;
    }

    this._isClippingEnabled = isClippingEnabled;
  }

  addChild (child) {
    this.layoutNode.insertChild(child.layoutNode, this.layoutNode.getChildCount());
    this.getChildContainer().addChild(child.displayObject);
    this.children.push(child);

    if (this.clippingSprite) {
      this.getChildContainer().swapChildren(this.clippingSprite, child.displayObject);
    }
  }

  addChildAt (child, index) {
    this.layoutNode.insertChild(child.layoutNode, index);
    this.getChildContainer().addChildAt(child.displayObject, index);

    if (index === this.children.length) {
      this.children.push(child);

      this.getChildContainer().swapChildren(this.clippingSprite, child.displayObject);
    } else {
      this.children.splice(index, 0, child);
    }
  }

  getChildContainer () {
    return this.displayObject;
  }

  removeChild (child) {
    this.getChildContainer().removeChild(child.displayObject);
    this.layoutNode.removeChild(child.layoutNode);

    const childIndex = this.children.indexOf(child);

    this.children.splice(childIndex, 1);

    child.destroy();

    this.layoutDirty = true;
  }

  setChildIndex (child, index) {
    this.getChildContainer().setChildIndex(child.displayObject, index);

    const currentIndex = this.getChildIndex(child);

    this.children.splice(currentIndex, 1);
    this.children.splice(index, 0, child);
  }

  getChildIndex (child) {
    return this.children.indexOf(child);
  }

  hasChild (child) {
    return this.getChildIndex(child) !== -1;
  }

  applyLayout () {
    super.applyLayout();

    const childCount = this.children.length;

    for (let i = 0; i < childCount; i++) {
      this.children[i].applyLayout();
    }
  }

  applyProps (oldProps, newProps) {
    super.applyProps(oldProps, newProps);

    this.isClippingEnabled = newProps.isClippingEnabled;
  }

  destroy () {
    for (let i = this.children.length - 1; i >= 0; i--) {
      this.removeChild(this.children[i]);
    }

    if (this.clippingSprite) {
      this.displayObject.removeChild(this.clippingSprite);

      this.clippingSprite = null;
    }

    super.destroy();
  }

  onLayout (x, y, width, height) {
    this.displayObject.pivot.x = this.anchorX * width;
    this.displayObject.pivot.y = this.anchorY * height;

    if (this.displayObject.isCustomContainer) {
      this.displayObject.height = height;
      this.displayObject.width = width;
    }

    if (this.clippingSprite) {
      this.clippingSprite.width = width;
      this.clippingSprite.height = height;
    }
  }

  createDisplayObject () {
    return new CustomContainer();
  }

}

import * as PIXI from 'pixi.js';
import BaseElement from './BaseElement';

export default class Container extends BaseElement {

  constructor () {
    super();
    this.children = [];
  }

  addChild (child) {
    this.layoutNode.insertChild(child.layoutNode, this.layoutNode.getChildCount());
    this.displayObject.addChild(child.displayObject);
    this.children.push(child);
  }

  addChildAt (child, index) {
    this.layoutNode.insertChild(child.layoutNode, index);
    this.displayObject.addChildAt(child.displayObject, index);
    if (index === this.children.length) {
      this.children.push(child);
    } else {
      this.children.splice(index, 0, child);
    }
  }

  removeChild (child) {
    this.displayObject.removeChild(child.displayObject);
    this.layoutNode.removeChild(child.layoutNode);

    const childIndex = this.children.indexOf(child);
    this.children.splice(childIndex, 1);

    child.destroy();
  }

  removeChildAt (child, index) {
    this.displayObject.removeChildAt(child.displayObject, index);
    this.layoutNode.removeChild(child.layoutNode);
    this.children.splice(index, 1);
    child.destroy();
  }

  setChildIndex(child, index) {
    this.displayObject.setChildIndex(child.displayObject, index);
    const currentIndex = this.getChildIndex(child);
    this.childen.splice(currentIndex, 1);
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

  onLayout (x, y, width, height) {
    this.displayObject.pivot.x = this.anchorX * width;
    this.displayObject.pivot.y = this.anchorY * height;
  }

  createDisplayObject () {
    return new PIXI.Container();
  }

};

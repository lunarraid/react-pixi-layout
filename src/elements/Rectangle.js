import TinyColor from '../util/TinyColor';
import Graphics from './Graphics';

const DEFAULT_COLOR = new TinyColor(0);

export default class Rectangle extends Graphics {

  _color = DEFAULT_COLOR;

  applyProps (oldProps, newProps) {
    super.applyProps(oldProps, newProps);
    this._color = this.style.color !== undefined
      ? new TinyColor(this.style.color)
      : DEFAULT_COLOR;
  }

  onLayout (x, y, width, height) {
    super.onLayout(x, y, width, height);
    const intColor = parseInt('0x' + this._color.toHex(), 16);
    this.displayObject.clear();
    this.displayObject.beginFill(intColor, this._color.getAlpha());
    this.displayObject.drawRect(0, 0, width, height);
    this.displayObject.endFill();
  }

}

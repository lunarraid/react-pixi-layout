import BaseElement from './BaseElement';
import * as Yoga from 'typeflex';
import * as PIXI from 'pixi.js';
import 'pixi-text-input';

const { MEASURE_MODE_EXACTLY } = Yoga;

export default class TextInput extends BaseElement {

  onBlur = () => {
    this.onBlurCallback && this.onBlurCallback();
  };

  onFocus = () => {
    this.onFocusCallback && this.onFocusCallback();
  };

  onInput = (text) => {
    this.onInputCallback && this.onInputCallback(text);
  };

  onKeyDown = (keyCode) => {
    this.onKeyDownCallback && this.onKeyDownCallback(keyCode);
  };

  onKeyUp = (keyCode) => {
    this.onKeyUpCallback && this.onKeyUpCallback(keyCode);
  };

  constructor (props, root) {
    super(props, root);
    this.sizeData = { width: 0, height: 0 };
    this.onBlurCallback = null;
    this.onFocusCallback = null;
    this.onInputCallback = null;
    this.onKeyDownCallback = null;
    this.onKeyUpCallback = null;
    this.displayObject.on('focus', this.onFocus, this);
    this.displayObject.on('blur', this.onBlur, this);
    this.displayObject.on('input', this.onInput, this);
    this.displayObject.on('keydown', this.onKeyDown, this);
    this.displayObject.on('keyup', this.onKeyUp, this);
  }

  createDisplayObject () {
    return new PIXI.TextInput({ input: {}, box: {} });
  }

  applyProps (oldProps, newProps) {
    const {
      fontSize: previousFontSize,
      fontFamily: previousFontFamily,
      fontWeight: previousFontWeight
    } = this.style;

    super.applyProps(oldProps, newProps);

    this.onBlurCallback = newProps.onBlur;
    this.onFocusCallback = newProps.onFocus;
    this.onInputCallback = newProps.onInput;
    this.onKeyDownCallback = newProps.onKeyDown;
    this.onKeyUpCallback = newProps.onKeyUp;

    const {
      color = 'black',
      textAlign = 'left',
      fontFamily = 'sans-serif',
      fontSize = 32,
      fontWeight = 'normal'
    } = this.style;

    const { placeholder = '', text = '' } = newProps;

    const isLayoutDirty = this.displayObject.text !== text
      || this.displayObject.placeHolder !== placeholder
      || previousFontSize !== fontSize
      || previousFontFamily !== fontFamily
      || previousFontWeight !== fontWeight;

    this.displayObject.text = text;
    this.displayObject.placeholder = placeholder;
    this.displayObject.setInputStyle('textAlign', textAlign);
    this.displayObject.setInputStyle('color', color);
    this.displayObject.setInputStyle('fontSize', `${ fontSize }px`);
    this.displayObject.setInputStyle('fontFamily', fontFamily);
    this.displayObject.setInputStyle('fontWeight', fontWeight);

    if (isLayoutDirty) {
      this.layoutNode.markDirty();
      this.layoutDirty = true;
    }
  }

  destroy () {
    this.displayObject.removeListener('focus', this.onFocus, this);
    this.displayObject.removeListener('blur', this.onBlur, this);
    this.displayObject.removeListener('input', this.onInput, this);
    this.displayObject.removeListener('keydown', this.onKeyDown, this);
    this.displayObject.removeListener('keyup', this.onKeyUp, this);
    super.destroy();
  }

  measure (node, width, widthMode, height, heightMode) {
    const input = this.displayObject.htmlInput;

    const inputHeight = input.style.width;
    const inputWidth = input.style.width;

    input.style.height = heightMode === MEASURE_MODE_EXACTLY ? `${ height }px` : 'auto';
    input.style.width = widthMode === MEASURE_MODE_EXACTLY ? `${ width }px` : 'auto';

    const boundingRect = this.displayObject._getDOMInputBounds();
    this.sizeData.width = boundingRect.width;
    this.sizeData.height = boundingRect.height;

    input.style.height = inputHeight;
    input.style.width = inputWidth;

    return this.sizeData;
  }

  onLayout (x, y, width, height) {
    this.displayObject.pivot.x = this.anchorX * width;
    this.displayObject.pivot.y = this.anchorY * height;
    this.displayObject.setInputStyle('width', `${ width }px`);
    this.displayObject.setInputStyle('height', `${ height }px`);
  }

}

import { Container, Graphics, Text, TextStyle, TextMetrics } from 'pixi.js';
import BaseElement from './BaseElement';
import * as Yoga from 'typeflex';

const { MEASURE_MODE_EXACTLY } = Yoga;

// MIT License

// Copyright (c) 2018 Mwni

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

class PixiTextInput extends Container {

  constructor (styles) {
    super();

    this._inputStyle = Object.assign({
      position: 'absolute',
      background: 'none',
      border: 'none',
      outline: 'none',
      transformOrigin: '0 0',
      lineHeight: '1'
    }, styles.input);

    if (styles.box) {
      this._boxGenerator = typeof styles.box === 'function'
        ? styles.box
        : new DefaultBoxGenerator(styles.box);
    } else {
      this._boxGenerator = null;
    }

    if (this._inputStyle.hasOwnProperty('multiline')) {
      this._multiline = Boolean(this._inputStyle.multiline);
      delete this._inputStyle.multiline;
    } else {
      this._multiline = false;
    }

    this._origRestrict = null;
    this._boxCache = {};
    this._previous = {};
    this._domAdded = false;
    this._domVisible = true;
    this._placeholder = '';
    this._placeholderColor = 0xa9a9a9;
    this._selection = [ 0, 0 ];
    this._restrictValue = '';
    this._createDOMInput();
    this.substituteText = true;
    this._setState('DEFAULT');

    this.on('added', this._onAdded, this);
    this.on('removed', this._onRemoved, this);
  }

  get multiline () {
    return this._multiline;
  }

  set multiline (value) {
    if (this._multiline === value) {
      return;
    }

    this._multiline = value;

    this._domInput && this._createDOMInput();
    this._update();
  }

  get substituteText () {
    return this._substituted;
  }

  set substituteText (substitute) {
    if (this._substituted === substitute) {
      return;
    }

    this._substituted = substitute;

    if (substitute) {
      this._createSurrogate();
      this._domVisible = false;
    } else {
      this._destroySurrogate();
      this._domVisible = true;
    }

    this.placeholder = this._placeholder;
    this._update();
  }

  get placeholder () {
    return this._placeholder;
  }

  set placeholder (text) {
    this._placeholder = text;

    if (this._substituted) {
      this._updateSurrogate();
      this._domInput.placeholder = '';
    } else {
      this._domInput.placeholder = text;
    }
  }

  get disabled () {
    return this._disabled;
  }

  set disabled (disabled) {
    this._disabled = disabled;
    this._domInput.disabled = disabled;
    this._setState(disabled ? 'DISABLED' : 'DEFAULT');
  }

  get maxLength () {
    return this._maxLength;
  }

  set maxLength (length) {
    this._maxLength = length;
    this._domInput.setAttribute('maxlength', `${ length }`);
  }

  get restrict () {
    return this._restrictRegex;
  }

  set restrict (regex) {
    if (this._origRestrict === regex) {
      return;
    }

    this._origRestrict = regex;

    if (!regex) {
      this._restrictRegex = null;
      return;
    }

    if (regex instanceof RegExp) {
      regex = regex.toString().slice(1, -1);

      if (regex.charAt(0) !== '^') {
        regex = '^' + regex;
      }

      if (regex.charAt(regex.length-1) !== '$') {
        regex = regex + '$';
      }

      regex = new RegExp(regex);
    } else {
      regex = new RegExp('^['+regex+']*$');
    }

    this._restrictRegex = regex;
  }

  get text () {
    return this._domInput.value;
  }

  set text (text) {
    this._domInput.value = text;

    if (this._substituted) {
      this._updateSurrogate();
    }
  }

  get htmlInput () {
    return this._domInput;
  }

  focus () {
    if (this._substituted && !this._domVisible) {
      this._setDOMInputVisible(true);
    }

    this._domInput.focus();
  }

  blur () {
    this._domInput.blur();
  }

  select () {
    this.focus();
    this._domInput.select();
    this._selection[0] = this._domInput.selectionStart;
    this._selection[1] = this._domInput.selectionEnd;
  }

  setInputStyle (key, value) {
    this._inputStyle[key] = value;
    this._domInput.style[key] = value;

    if(this._substituted && (key==='fontFamily' || key==='fontSize')) {
      this._updateFontMetrics();
    }

    if (this._lastRenderer) {
      this._update();
    }
  }

  destroy (options) {
    if (this._domAdded) {
      this._domInput.parentElement.removeChild(this._domInput);
    }

    this._destroyBoxCache();
    super.destroy(options);
  }


  // SETUP

  _createDOMInput () {
    const isFocused = this.state === 'FOCUSED';

    let parentElement = null;
    let text = '';

    if (this._domInput) {
      this._domInput.removeEventListener('keydown', this._onInputKeyDown);
      this._domInput.removeEventListener('input', this._onInputInput);
      this._domInput.removeEventListener('keyup', this._onInputKeyUp);
      this._domInput.removeEventListener('focus', this._onFocused);
      this._domInput.removeEventListener('blur', this._onBlurred);
      text = this._domInput.value;
      parentElement = this._domInput.parentElement;
      parentElement && parentElement.removeChild(this._domInput);
    }

    if (this._multiline) {
      this._domInput = document.createElement('textarea');
      this._domInput.style.resize = 'none';
    } else {
      this._domInput = document.createElement('input');
      this._domInput.type = 'text';
    }

    for (let key in this._inputStyle) {
      this._domInput.style[key] = this._inputStyle[key];
    }

    this._domInput.value = text;

    parentElement && parentElement.appendChild(this._domInput);
    isFocused && this._domInput.focus();

    const isSelected = this._selection[0] === 0 && this._selection[1] === this._domInput.value.length;

    if (isSelected) {
      this._domInput.select();
    } else {
      this._domInput.setSelectionRange(this._selection[0], this._selection[1]);
    }

    this._domInput.addEventListener('keydown', this._onInputKeyDown);
    this._domInput.addEventListener('input', this._onInputInput);
    this._domInput.addEventListener('keyup', this._onInputKeyUp);
    this._domInput.addEventListener('focus', this._onFocused);
    this._domInput.addEventListener('blur', this._onBlurred);
  }

  _onInputKeyDown = (e) => {
    this._selection[0] = this._domInput.selectionStart;
    this._selection[1] = this._domInput.selectionEnd;
    this.emit('keydown', e.keyCode);
  };

  _onInputInput = (e) => {
    if (this._restrictRegex) {
      this._applyRestriction();
    }

    if(this._substituted) {
      this._updateSubstitution();
    }

    this.emit('input', this.text);
  };

  _onInputKeyUp = (e) => {
    this.emit('keyup', e.keyCode);
  };

  _onFocused = () => {
    this._setState('FOCUSED');
    this.emit('focus');
  };

  _onBlurred = () => {
    this._setState('DEFAULT');
    this.emit('blur');
  };

  _onAdded () {
    this._domInput.style.display = 'none';
    document.body.appendChild(this._domInput);
    this._domAdded = true;
  }

  _onRemoved () {
    document.body.removeChild(this._domInput);
    this._domAdded = false;
  }

  _setState (state) {
    this.state = state;
    this._updateBox();

    if (this._substituted) {
      this._updateSubstitution();
    }
  }

  // RENDER & UPDATE

  // for pixi v4
  renderWebGL (renderer) {
    super.renderWebGL(renderer);
    this._renderInternal(renderer);
  }

  // for pixi v4
  renderCanvas (renderer) {
    super.renderCanvas(renderer);
    this._renderInternal(renderer);
  }

  // for pixi v5
  render (renderer) {
    super.render(renderer);
    this._renderInternal(renderer);
  }

  _renderInternal (renderer) {
    this._resolution = renderer.resolution;
    this._lastRenderer = renderer;
    this._canvasBounds = this._getCanvasBounds();
    if(this._needsUpdate()) {
      this._update();
    }
  }

  _update(){
    this._updateDOMInput();

    if (this._substituted) {
      this._updateSurrogate();
    }

    this._updateBox();
  }

  _updateBox () {
    if (!this._boxGenerator) {
      return;
    }

    if (this._needsNewBoxCache()) {
      this._buildBoxCache();
    }

    if (this.state === this._previous.state && this._box === this._boxCache[this.state]) {
      return;
    }

    if (this._box) {
      this.removeChild(this._box);
    }

    this._box = this._boxCache[this.state];
    this.addChildAt(this._box, 0);
    this._previous.state = this.state;
  }

  _updateSubstitution () {
    if (this.state==='FOCUSED') {
      this._domVisible = true;
      this._surrogate.visible = this.text.length === 0;
    } else {
      this._domVisible = false;
      this._surrogate.visible = true;
    }

    this._updateDOMInput();
    this._updateSurrogate();
  }

  _updateDOMInput () {
    if (!this._canvasBounds) {
      return;
    }

    this._domInput.style.top = (this._canvasBounds.top || 0) + 'px';
    this._domInput.style.left = (this._canvasBounds.left || 0) + 'px';
    this._domInput.style.transform = this._pixiMatrixToCSS(this._getDOMRelativeWorldTransform());
    this._domInput.style.opacity = this.worldAlpha;
    this._setDOMInputVisible(this.worldVisible && this._domVisible);

    this._previous.canvasBounds = this._canvasBounds;
    this._previous.worldTransform = this.worldTransform.clone();
    this._previous.worldAlpha = this.worldAlpha;
    this._previous.worldVisible = this.worldVisible;
  }

  _applyRestriction () {
    if (this._restrictRegex.test(this.text)) {
      this._restrictValue = this.text;
    } else {
      this.text = this._restrictValue;
      this._domInput.setSelectionRange(this._selection[0], this._selection[1]);
    }
  }

  // STATE COMPAIRSON (FOR PERFORMANCE BENEFITS)

  _needsUpdate () {
    return (
      !this._comparePixiMatrices(this.worldTransform, this._previous.worldTransform)
      || !this._compareClientRects(this._canvasBounds, this._previous.canvasBounds)
      || this.worldAlpha !== this._previous.worldAlpha
      || this.worldVisible !== this._previous.worldVisible
    );
  }

  _needsNewBoxCache () {
    const inputBounds = this._getDOMInputBounds();

    return (
      !this._previous.inputBounds
      || inputBounds.width != this._previous.inputBounds.width
      || inputBounds.height != this._previous.inputBounds.height
    );
  }


  // INPUT SUBSTITUTION

  _createSurrogate () {
    this._surrogateHitbox = new Graphics();
    this._surrogateHitbox.alpha = 0;
    this._surrogateHitbox.interactive = true;
    this._surrogateHitbox.cursor = 'text';
    this._surrogateHitbox.on('pointerdown', this._onSurrogateFocus, this);
    this.addChild(this._surrogateHitbox);

    this._surrogateMask = new Graphics();
    this.addChild(this._surrogateMask);

    this._surrogate = new Text('', {});
    this.addChild(this._surrogate);

    this._surrogate.mask = this._surrogateMask;

    this._updateFontMetrics();
    this._updateSurrogate();
  }

  _updateSurrogate () {
    let padding = this._deriveSurrogatePadding();
    let inputBounds = this._getDOMInputBounds();

    this._surrogate.style = this._deriveSurrogateStyle();
    this._surrogate.style.padding = Math.max.apply(Math, padding);
    this._surrogate.y = this._multiline ? padding[0] : (inputBounds.height - this._surrogate.height) / 2;
    this._surrogate.x = padding[3];
    this._surrogate.text = this._deriveSurrogateText();

    switch (this._surrogate.style.align) {

      case 'left':
        this._surrogate.x = padding[3];
        break;

      case 'center':
        this._surrogate.x = inputBounds.width * 0.5 - this._surrogate.width * 0.5;
        break;

      case 'right':
        this._surrogate.x = inputBounds.width - padding[1] - this._surrogate.width;
        break;
    }

    this._updateSurrogateHitbox(inputBounds);
    this._updateSurrogateMask(inputBounds, padding);
  }

  _updateSurrogateHitbox (bounds) {
    this._surrogateHitbox.clear();
    this._surrogateHitbox.beginFill(0);
    this._surrogateHitbox.drawRect(0, 0, bounds.width, bounds.height);
    this._surrogateHitbox.endFill();
    this._surrogateHitbox.interactive = !this._disabled;
  }

  _updateSurrogateMask(bounds, padding) {
    this._surrogateMask.clear();
    this._surrogateMask.beginFill(0);
    this._surrogateMask.drawRect(padding[3], 0, bounds.width - padding[3] - padding[1], bounds.height);
    this._surrogateMask.endFill();
  }

  _destroySurrogate () {
    if (!this._surrogate) {
      return;
    }

    this.removeChild(this._surrogate);
    this.removeChild(this._surrogateHitbox);

    this._surrogate.destroy();
    this._surrogateHitbox.destroy();

    this._surrogate = null;
    this._surrogateHitbox = null;
  }

  _onSurrogateFocus () {
    this._setDOMInputVisible(true);
    // sometimes the input is not being focused by the mouseclick
    setTimeout(() => this._ensureFocus(), 10);
  }

  _ensureFocus () {
    if (!this._hasFocus()) {
      this.focus();
    }
  }

  _deriveSurrogateStyle () {
    const style = new TextStyle();

    for (const key in this._inputStyle) {
      switch (key) {

        case 'color':
          style.fill = this._inputStyle.color;
          break;

        case 'fontFamily':
        case 'fontSize':
        case 'fontWeight':
        case 'fontVariant':
        case 'fontStyle':
          style[key] = this._inputStyle[key];
          break;

        case 'letterSpacing':
          style.letterSpacing = parseFloat(this._inputStyle.letterSpacing);
          break;

        case 'textAlign':
          style.align = this._inputStyle.textAlign;
          break;
      }
    }

    if (this._multiline) {
      style.lineHeight = parseFloat(style.fontSize);
      style.wordWrap = true;
      style.breakWords = true;
      style.wordWrapWidth = this._getDOMInputBounds().width;
    }

    if (this._domInput.value.length === 0) {
      style.fill = this._placeholderColor;
    }

    return style;
  }

  _deriveSurrogatePadding () {
    const indent = this._inputStyle.textIndent ? parseFloat(this._inputStyle.textIndent) : 0;

    if (this._inputStyle.padding && this._inputStyle.padding.length > 0) {

      const components = this._inputStyle.padding.trim().split(' ');
      const componentCount = components.length;

      if (componentCount === 1) {
        const padding = parseFloat(components[0]);
        return [ padding, padding, padding, padding + indent ];
      }

      if (componentCount === 2) {
        const paddingV = parseFloat(components[0]);
        const paddingH = parseFloat(components[1]);
        return [ paddingV, paddingH, paddingV, paddingH + indent ];
      }

      if (componentCount === 4) {
        const padding = components.map((component) => parseFloat(component));
        padding[3] += indent;
        return padding;
      }
    }

    return [ 0, 0, 0, indent ];
  }

  _deriveSurrogateText () {
    const inputLength = this._domInput.value.length;

    if (inputLength === 0) {
      return this._placeholder;
    }

    if (this._domInput.type == 'password') {
      return '•'.repeat(inputLength);
    }

    return this._domInput.value;
  }

  _updateFontMetrics () {
    const style = this._deriveSurrogateStyle();
    const font = style.toFontString();

    this._fontMetrics = TextMetrics.measureFont(font);
  }


  // CACHING OF INPUT BOX GRAPHICS

  _buildBoxCache () {
    this._destroyBoxCache();

    const states = [ 'DEFAULT','FOCUSED', 'DISABLED' ];
    const inputBounds = this._getDOMInputBounds();

    for (let i in states) {
      this._boxCache[states[i]] = this._boxGenerator(inputBounds.width, inputBounds.height, states[i]);
    }

    this._previous.inputBounds = inputBounds;
  }

  _destroyBoxCache () {
    if (this._box) {
      this.removeChild(this._box);
      this._box = null;
    }

    for (let i in this._boxCache) {
      this._boxCache[i].destroy();
      this._boxCache[i] = null;
      delete this._boxCache[i];
    }
  }

  // HELPER FUNCTIONS

  _hasFocus () {
    return document.activeElement === this._domInput;
  }

  _setDOMInputVisible (visible) {
    this._domInput.style.display = visible ? 'block' : 'none';
  }

  _getCanvasBounds () {
    const rect = this._lastRenderer.view.getBoundingClientRect();
    const bounds = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
    bounds.left += window.scrollX;
    bounds.top += window.scrollY;
    return bounds;
  }

  _getDOMInputBounds () {
    const removeAfter = !this._domAdded;

    removeAfter && document.body.appendChild(this._domInput);

    const orgTransform = this._domInput.style.transform;
    const orgDisplay = this._domInput.style.display;

    this._domInput.style.transform = '';
    this._domInput.style.display = 'block';

    const bounds = this._domInput.getBoundingClientRect();

    this._domInput.style.transform = orgTransform;
    this._domInput.style.display = orgDisplay;

    removeAfter && document.body.removeChild(this._domInput);

    return bounds;
  }

  _getDOMRelativeWorldTransform () {
    const canvasBounds = this._lastRenderer.view.getBoundingClientRect();
    const matrix = this.worldTransform.clone();

    matrix.scale(this._resolution, this._resolution);
    matrix.scale(canvasBounds.width / this._lastRenderer.width, canvasBounds.height / this._lastRenderer.height);

    return matrix;
  }

  _pixiMatrixToCSS (m) {
    return `matrix(${ m.a },${ m.b },${ m.c },${ m.d },${ m.tx },${ m.ty })`;
  }

  _comparePixiMatrices (m1, m2) {
    if (!m1 || !m2) {
      return false;
    }

    return (
      m1.a === m2.a
      && m1.b === m2.b
      && m1.c === m2.c
      && m1.d === m2.d
      && m1.tx === m2.tx
      && m1.ty === m2.ty
    );
  }

  _compareClientRects (r1, r2) {
    return Boolean(r1) && Boolean(r2) && r1.left == r2.left && r1.top == r2.top && r1.width == r2.width && r1.height == r2.height;
  }

}


function DefaultBoxGenerator (styles) {
  styles = styles || { fill: 0xcccccc };

  if (styles.default) {
    styles.focused = styles.focused || styles.default;
    styles.disabled = styles.disabled || styles.default;
  } else {
    styles = { default: styles, focused: styles, disabled: styles };
  }

  return function (w, h, state) {
    const style = styles[state.toLowerCase()];
    const box = new Graphics();

    if (style.fill) {
      box.beginFill(style.fill);
    }

    if (style.stroke) {
      box.lineStyle(style.stroke.width || 1, style.stroke.color || 0, style.stroke.alpha || 1);
    }

    if (style.rounded) {
      box.drawRoundedRect(0, 0, w, h, style.rounded);
    } else {
      box.drawRect(0, 0, w, h);
    }

    box.endFill();
    box.closePath();

    return box;
  }
}

// React Element

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
    return new PixiTextInput({ input: {}, box: {} });
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
      fontWeight = 'normal',
      multiline = false
    } = this.style;

    const { placeholder = '', text, inputType='text', maxLength = -1, restrict = null } = newProps;

    if (multiline) {
      this.displayObject.htmlInput.setAttribute('type', inputType);
    }

    if (maxLength >= 0) {
      this.displayObject.maxLength = maxLength;
    }

    const isLayoutDirty = this.displayObject.text !== text
      || this.displayObject.placeHolder !== placeholder
      || previousFontSize !== fontSize
      || previousFontFamily !== fontFamily
      || previousFontWeight !== fontWeight;


    if (text !== undefined) {
      this.displayObject.text = text;
    }

    this.displayObject.restrict = restrict;
    this.displayObject.placeholder = placeholder;
    this.displayObject.setInputStyle('textAlign', textAlign);
    this.displayObject.setInputStyle('color', color);
    this.displayObject.setInputStyle('fontSize', `${ fontSize }px`);
    this.displayObject.setInputStyle('fontFamily', fontFamily);
    this.displayObject.setInputStyle('fontWeight', fontWeight);
    this.displayObject.multiline = multiline;

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

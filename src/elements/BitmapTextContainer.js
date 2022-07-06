/**
 * ------------------------------------------------------------------------------
 * Pixi port based on
 * https://github.com/BowlerHatLLC/feathers/blob/1b2fdd9/source/feathers/controls/text/BitmapFontTextRenderer.as
 * Copyright 2012-2016 Bowler Hat LLC. All rights reserved.
 * Licensed under the Simplified BSD License
 * https://github.com/BowlerHatLLC/feathers/blob/master/LICENSE.md
 * ------------------------------------------------------------------------------
 */

import { BitmapFont, Container, Point, Sprite } from 'pixi.js';

const CHARACTER_ID_SPACE = 32;
const CHARACTER_ID_TAB = 9;
const CHARACTER_ID_LINE_FEED = 10;
const CHARACTER_ID_CARRIAGE_RETURN = 13;
const CHARACTER_BUFFER = [];
const FUZZY_MAX_WIDTH_PADDING = 0.000001;

const characterViewPool = [];
let characterViewPoolIndex = -1;

const charLocationPool = [];
let charLocationPoolIndex = -1;

const HELPER_RESULT = {
  isTruncated: false,
  width: 0,
  height: 0
};

const Align = {
  CENTER: 'center',
  END: 'end',
  JUSTIFY: 'justify',
  LEFT: 'left',
  RIGHT: 'right',
  START: 'start',
  BOTTOM: 'bottom',
  TOP: 'top'
};

const { abs, round } = Math;

export default class BitmapTextContainer extends Container {

  constructor () {
    super();

    this._batchX = 0;
    this._verticalAlignOffsetY = 0;
    this._maxWidth = 0;
    this._numLines = 0;
    this._truncateToFit = false;
    this._truncationText = '...';
    this._lastLayoutWidth = Infinity;
    this._lastLayoutExplicitWidth = 0;
    this._lastLayoutHeight = 0;
    this._lastLayoutIsTruncated = false;
    this._wordWrap = false;
    this._textDirty = false;

    this._font = null;
    this._fontData = null;
    this._size = 16;
    this._color = 0xffffff;
    this._align = Align.LEFT;
    this._leading = 0;
    this._letterSpacing = 0;
    this._isKerningEnabled = true;
    this._verticalAlign = Align.TOP;

    this._activeCharacters = [];
    this._activeCharacterCount = 0;

    this._width = 0;
    this._height = 0;
  }

  measureText (result = new Point(), width = this._width) {

    if (!this._fontData) {
      this._fontData = BitmapFont.available[this._font];
    }

    if (!this._fontData || !this._text) {
      result.x = 0;
      result.y = 0;
      return result;
    }

    const font = this._fontData;
    const customSize = this._size;
    const customLetterSpacing = this._letterSpacing;
    const isKerningEnabled = this._isKerningEnabled;
    let scale = customSize / font.size;

    if (isNaN(scale)) {
      scale = 1;
    }

    const lineHeight = font.lineHeight * scale + this._leading;
    const maxLineWidth = isNaN(width) ? this._explicitMaxWidth : width;

    let maxX = 0;
    let currentX = 0;
    let currentY = 0;
    let previousCharId = NaN;
    let charCount = this._text.length;
    let startXOfPreviousWord = 0;
    let widthOfWhitespaceAfterWord = 0;
    let wordCountForLine = 0;

    for (let i = 0; i < charCount; i++) {
      const charId = this._text.charCodeAt(i);
      if (charId === CHARACTER_ID_LINE_FEED || charId === CHARACTER_ID_CARRIAGE_RETURN) { //new line \n or \r
        currentX = currentX - customLetterSpacing;
        if (currentX < 0) {
          currentX = 0;
        }
        if (maxX < currentX) {
          maxX = currentX;
        }
        previousCharId = NaN;
        currentX = 0;
        currentY += lineHeight;
        startXOfPreviousWord = 0;
        wordCountForLine = 0;
        widthOfWhitespaceAfterWord = 0;
        continue;
      }

      const charData = font.chars[charId];

      if (!charData) {
        console.warn(`Missing character ${ String.fromCharCode(charId) } in font ${ font.name }.`);
        continue;
      }

      if (isKerningEnabled && !isNaN(previousCharId)) {
        currentX += (charData.kerning[previousCharId] || 0) * scale;
      }

      const xAdvance = charData.xAdvance * scale;

      if (this._wordWrap) {
        const currentCharIsWhitespace = charId === CHARACTER_ID_SPACE || charId === CHARACTER_ID_TAB;
        const previousCharIsWhitespace = previousCharId === CHARACTER_ID_SPACE || previousCharId === CHARACTER_ID_TAB;

        if (currentCharIsWhitespace) {
          if (!previousCharIsWhitespace) {
            widthOfWhitespaceAfterWord = 0;
          }
          widthOfWhitespaceAfterWord += xAdvance;
        }
        else if (previousCharIsWhitespace) {
          startXOfPreviousWord = currentX;
          wordCountForLine++;
        }

        if (!currentCharIsWhitespace && wordCountForLine > 0 && (currentX + xAdvance) > maxLineWidth) {
          widthOfWhitespaceAfterWord = startXOfPreviousWord - widthOfWhitespaceAfterWord;

          if (maxX < widthOfWhitespaceAfterWord) {
            maxX = widthOfWhitespaceAfterWord;
          }

          previousCharId = NaN;
          currentX -= startXOfPreviousWord;
          currentY += lineHeight;
          startXOfPreviousWord = 0;
          widthOfWhitespaceAfterWord = 0;
          wordCountForLine = 0;
        }
      }

      currentX += xAdvance + customLetterSpacing;
      previousCharId = charId;
    }

    currentX = currentX - customLetterSpacing;

    if (currentX < 0) {
      currentX = 0;
    }

    // if the text ends in extra whitespace, the currentX value will be
    // larger than the max line width. we'll remove that and add extra
    // lines.

    if (this._wordWrap) {
      while (currentX > maxLineWidth) {
        currentX -= maxLineWidth;
        currentY += lineHeight;
        if (maxLineWidth === 0) {
          //we don't want to get stuck in an infinite loop!
          break;
        }
      }
    }

    if (maxX < currentX) {
      maxX = currentX;
    }

    result.x = maxX;
    result.y = currentY + lineHeight - this._leading;

    return result;
  }

  invalidate () {
    this._isInvalid = true;
    // TODO: TEMPORARY, fix this
    this.validate();
  }

  validate () {
    this._fontData = BitmapFont.available[this._font];

    if (!this._fontData) {
      return;
    }

    this._isInvalid = false;
    this.draw();
  }


  draw () {
    let sizeInvalid = this._textDirty;

    this._textDirty = false;

    // sometimes, we can determine that the layout will be exactly
    // the same without needing to update. this will result in much
    // better performance.
    let newWidth = this._width;

    if (isNaN(newWidth)) {
      newWidth = this._explicitMaxWidth;
    }

    // sometimes, we can determine that the dimensions will be exactly
    // the same without needing to refresh the text lines. this will
    // result in much better performance.
    if (this._wordWrap) {
      // when word wrapped, we need to measure again any time that the
      // width changes.
      sizeInvalid = sizeInvalid || newWidth !== this._lastLayoutWidth || this._width !== this._lastLayoutExplicitWidth;
    } else {
      //we can skip measuring again more frequently when the text is
      //a single line.

      //if the width is smaller than the last layout width, we need to
      //measure again. when it's larger, the result won't change...
      sizeInvalid = sizeInvalid || newWidth < this._lastLayoutWidth;

      //...unless the text was previously truncated!
      sizeInvalid = sizeInvalid || (this._lastLayoutIsTruncated && newWidth !== this._lastLayoutWidth);

      //... or the text is aligned
      sizeInvalid = sizeInvalid || this._align !== Align.LEFT;
    }

    if (sizeInvalid) {

      for (let i = this._activeCharacterCount - 1; i >= 0; i--) {
        const charView = this._activeCharacters[i];
        this._activeCharacters[i] = null;
        this.removeChild(charView);
        characterViewPool[++characterViewPoolIndex] = charView;
      }

      this._activeCharacterCount = 0;

      if (!this._text) {
        return;
      }

      this.layoutCharacters(HELPER_RESULT);
      this._lastLayoutExplicitWidth = this._width;
      this._lastLayoutWidth = HELPER_RESULT.width;
      this._lastLayoutHeight = HELPER_RESULT.height;
      this._lastLayoutIsTruncated = HELPER_RESULT.isTruncated;
    }
  }

  layoutCharacters (result) {
    this._numLines = 1;

    const font = this._fontData;
    const customSize = this._size;
    const customLetterSpacing = this._letterSpacing;
    const isKerningEnabled = this._isKerningEnabled;

    let scale = customSize / font.size;

    if (isNaN(scale)) {
      scale = 1;
    }

    const lineHeight = font.lineHeight * scale + this._leading;
    const hasExplicitWidth = !isNaN(this._width);
    const isAligned = this._align !== Align.LEFT;

    let maxLineWidth = hasExplicitWidth ? this._width : this._explicitMaxWidth;

    if (isAligned && maxLineWidth === Number.POSITIVE_INFINITY) {
      // we need to measure the text to get the maximum line width
      // so that we can align the text
      // this.measureText(HELPER_POINT);
      maxLineWidth = this._width;
    }

    let textToDraw = this._text;

    if (this._truncateToFit) {
      const truncatedText = this.getTruncatedText(maxLineWidth);
      result.isTruncated = truncatedText !== textToDraw;
      textToDraw = truncatedText;
    } else {
      result.isTruncated = false;
    }

    CHARACTER_BUFFER.length = 0;

    let maxX = 0;
    let currentX = 0;
    let currentY = 0;
    let previousCharId = NaN;
    let isWordComplete = false;
    let startXOfPreviousWord = 0;
    let widthOfWhitespaceAfterWord = 0;
    let wordLength = 0;
    let wordCountForLine = 0;
    let charCount = textToDraw ? textToDraw.length : 0;

    for (let i = 0; i < charCount; i++) {
      isWordComplete = false;
      const charId = textToDraw.charCodeAt(i);
      if (charId === CHARACTER_ID_LINE_FEED || charId === CHARACTER_ID_CARRIAGE_RETURN) { //new line \n or \r
        currentX = currentX - customLetterSpacing;
        if (currentX < 0) {
          currentX = 0;
        }

        if (this._wordWrap || isAligned) {
          this.alignBuffer(maxLineWidth, currentX, 0);
          this.addBufferToBatch(0);
        }

        if (maxX < currentX) {
          maxX = currentX;
        }

        previousCharId = NaN;
        currentX = 0;
        currentY += lineHeight;
        startXOfPreviousWord = 0;
        widthOfWhitespaceAfterWord = 0;
        wordLength = 0;
        wordCountForLine = 0;
        this._numLines++;
        continue;
      }

      const charData = font.chars[charId];

      if (!charData) {
        console.warn(`Missing character ${ String.fromCharCode(charId) } in font ${ font.name }.`);
        continue;
      }

      if (isKerningEnabled && !isNaN(previousCharId)) {
        currentX += (charData.kerning[previousCharId] || 0) * scale;
      }

      const xAdvance = charData.xAdvance * scale;

      if (this._wordWrap) {
        const currentCharIsWhitespace = charId === CHARACTER_ID_SPACE || charId === CHARACTER_ID_TAB;
        const previousCharIsWhitespace = previousCharId === CHARACTER_ID_SPACE || previousCharId === CHARACTER_ID_TAB;

        if (currentCharIsWhitespace) {
          if (!previousCharIsWhitespace) {
            widthOfWhitespaceAfterWord = 0;
          }
          widthOfWhitespaceAfterWord += xAdvance;
        }
        else if (previousCharIsWhitespace) {
          startXOfPreviousWord = currentX;
          wordLength = 0;
          wordCountForLine++;
          isWordComplete = true;
        }

        // we may need to move to a new line at the same time
        // that our previous word in the buffer can be batched
        // so we need to add the buffer here rather than after
        // the next section
        if (isWordComplete && !isAligned) {
          this.addBufferToBatch(0);
        }

        // floating point errors can cause unnecessary line breaks,
        // so we're going to be a little bit fuzzy on the greater
        // than check. such tiny numbers shouldn't break anything.
        if (!currentCharIsWhitespace && wordCountForLine > 0 && ((currentX + xAdvance) - maxLineWidth) > FUZZY_MAX_WIDTH_PADDING) {
          if (isAligned) {
            this.trimBuffer(wordLength);
            this.alignBuffer(maxLineWidth, startXOfPreviousWord - widthOfWhitespaceAfterWord, wordLength);
            this.addBufferToBatch(wordLength);
          }
          this.moveBufferedCharacters(-startXOfPreviousWord, lineHeight, 0);

          widthOfWhitespaceAfterWord = startXOfPreviousWord - widthOfWhitespaceAfterWord;

          if (maxX < widthOfWhitespaceAfterWord) {
            maxX = widthOfWhitespaceAfterWord;
          }

          previousCharId = NaN;
          currentX -= startXOfPreviousWord;
          currentY += lineHeight;
          startXOfPreviousWord = 0;
          widthOfWhitespaceAfterWord = 0;
          wordLength = 0;
          isWordComplete = false;
          wordCountForLine = 0;
          this._numLines++;
        }
      }

      if (this._wordWrap || isAligned) {
        let charLocation = null;

        if (charLocationPoolIndex > -1) {
          charLocation = charLocationPool[charLocationPoolIndex];
          charLocationPoolIndex--;
        } else {
          charLocation = new CharLocation();
        }

        charLocation.char = charData;
        charLocation.x = currentX + charData.xOffset * scale;
        charLocation.y = currentY + charData.yOffset * scale;
        charLocation.scale = scale;
        CHARACTER_BUFFER[CHARACTER_BUFFER.length] = charLocation;
        wordLength++;
      } else {
        this.addCharacterToBatch(charData,
          currentX + charData.xOffset * scale,
          currentY + charData.yOffset * scale,
          scale
        );
      }

      currentX += xAdvance + customLetterSpacing;
      previousCharId = charId;
    }

    currentX = currentX - customLetterSpacing;

    if (currentX < 0) {
      currentX = 0;
    }

    if (this._wordWrap || isAligned) {
      this.alignBuffer(maxLineWidth, currentX, 0);
      this.addBufferToBatch(0);
    }

    // if the text ends in extra whitespace, the currentX value will be
    // larger than the max line width. we'll remove that and add extra
    // lines.

    if (this._wordWrap) {
      while (currentX > maxLineWidth) {
        currentX -= maxLineWidth;
        currentY += lineHeight;
        if (maxLineWidth === 0) {
          //we don't want to get stuck in an infinite loop!
          break;
        }
      }
    }

    if (maxX < currentX) {
      maxX = currentX;
    }

    if (isAligned && !hasExplicitWidth) {
      const align = this._align;
      if (align === Align.CENTER) {
        this._batchX = (maxX - maxLineWidth) / 2;
      }
      else if (align === Align.RIGHT) {
        this._batchX = maxX - maxLineWidth;
      }
    } else {
      this._batchX = 0;
    }

    this._verticalAlignOffsetY = this.getVerticalAlignOffsetY();

    for (let i = 0; i < this._activeCharacterCount; i++) {
      let charView = this._activeCharacters[i];
      charView.position.x += this._batchX;
      charView.position.y += this._verticalAlignOffsetY;
    }

    result.width = maxX;
    result.height = currentY + lineHeight - this._leading;
    return result;
  }

  trimBuffer (skipCount) {
    const charCount = CHARACTER_BUFFER.length - skipCount;
    let countToRemove = 0;
    let i;

    for (i = charCount - 1; i >= 0; i--) {
      const charLocation = CHARACTER_BUFFER[i];
      const charData = charLocation.char;
      const charId = charData.charId;

      if (charId === CHARACTER_ID_SPACE || charId === CHARACTER_ID_TAB) {
        countToRemove++;
      } else {
        break;
      }
    }

    if (countToRemove > 0) {
      CHARACTER_BUFFER.splice(i + 1, countToRemove);
    }

  }

  alignBuffer(maxLineWidth, currentLineWidth, skipCount) {
    const align = this._align;
    if (align === Align.CENTER) {
      this.moveBufferedCharacters(round((maxLineWidth - currentLineWidth) / 2), 0, skipCount);
    } else if (align === Align.RIGHT) {
      this.moveBufferedCharacters(maxLineWidth - currentLineWidth, 0, skipCount);
    }
  }

  addBufferToBatch (skipCount) {
    const charCount = CHARACTER_BUFFER.length - skipCount;
    for (let i = 0; i < charCount; i++) {
      const charLocation = CHARACTER_BUFFER.shift();
      this.addCharacterToBatch(charLocation.char, charLocation.x, charLocation.y, charLocation.scale);
      charLocation.char = null;
      charLocationPool[++charLocationPoolIndex] = charLocation;
    }
  }

  moveBufferedCharacters(xOffset, yOffset, skipCount) {
    const charCount = CHARACTER_BUFFER.length - skipCount;
    for (let i = 0; i < charCount; i++) {
      const charLocation = CHARACTER_BUFFER[i];
      charLocation.x += xOffset;
      charLocation.y += yOffset;
    }
  }

  addCharacterToBatch(charData, x, y, scale) {
    if (!charData.texture) {
      return;
    }

    let charView = null;

    if (characterViewPoolIndex > -1) {
      charView = characterViewPool[characterViewPoolIndex];
      characterViewPoolIndex--;
    } else {
      charView = new Sprite();
    }

    charView.texture = charData.texture;
    charView.position.set(x, y);
    charView.width = charData.texture.width * scale;
    charView.height = charData.texture.height * scale;
    charView.tint = this._color;

    this._activeCharacters[this._activeCharacterCount] = charView;
    this._activeCharacterCount++;

    this.addChild(charView);
  }

  getTruncatedText (width) {
    if (!this._text) {
      // this shouldn't be called if _text is null, but just in case...
      return '';
    }

    // if the width is infinity or the string is multiline, don't allow truncation
    if (width === Number.POSITIVE_INFINITY || this._wordWrap || this._text.indexOf(String.fromCharCode(CHARACTER_ID_LINE_FEED)) >= 0 || this._text.indexOf(String.fromCharCode(CHARACTER_ID_CARRIAGE_RETURN)) >= 0) {
      return this._text;
    }

    const font = this._fontData;
    const customSize = this._size;
    const customLetterSpacing = this._letterSpacing;
    const isKerningEnabled = this._isKerningEnabled;

    let scale = customSize / font.size;

    if (isNaN(scale)) {
      scale = 1;
    }

    let currentX = 0;
    let previousCharId = NaN;
    let charCount = this._text.length;
    let truncationIndex = -1;
    let currentKerning = 0;

    for (let i = 0; i < charCount; i++) {
      const charId = this._text.charCodeAt(i);
      const charData = font.chars[charId];

      if (!charData) {
        continue;
      }

      currentKerning = 0;

      if (isKerningEnabled && !isNaN(previousCharId)) {
        currentKerning = (charData.kerning[previousCharId] || 0) * scale;
      }

      currentX += currentKerning + charData.xAdvance * scale;

      if (currentX > width) {
        //floating point errors can cause unnecessary truncation,
        //so we're going to be a little bit fuzzy on the greater
        //than check. such tiny numbers shouldn't break anything.
        const difference = abs(currentX - width);
        if (difference > FUZZY_MAX_WIDTH_PADDING) {
          truncationIndex = i;
          break;
        }
      }

      currentX += customLetterSpacing;
      previousCharId = charId;
    }

    if (truncationIndex >= 0) {
      //first measure the size of the truncation text
      charCount = this._truncationText.length;
      for (let i = 0; i < charCount; i++) {
        const charId = this._truncationText.charCodeAt(i);
        const charData = font.chars[charId];

        if (!charData) {
          continue;
        }

        currentKerning = 0;

        if (isKerningEnabled && !isNaN(previousCharId)) {
          currentKerning = (charData.kerning[previousCharId] || 0) * scale;
        }

        currentX += currentKerning + charData.xAdvance * scale + customLetterSpacing;
        previousCharId = charId;
      }

      currentX -= customLetterSpacing;

      //then work our way backwards until we fit into the width
      for (let i = truncationIndex; i >= 0; i--) {
        const charId = this._text.charCodeAt(i);
        previousCharId = i > 0 ? this._text.charCodeAt(i - 1) : NaN;
        const charData = font.chars[charId];
        if (!charData) {
          continue;
        }

        currentKerning = 0;

        if (isKerningEnabled && !isNaN(previousCharId)) {
          currentKerning = (charData.kerning[previousCharId] || 0) * scale;
        }

        currentX -= (currentKerning + charData.xAdvance * scale + customLetterSpacing);

        if (currentX <= width) {
          return this._text.substr(0, i) + this._truncationText;
        }
      }

      return this._truncationText;
    }

    return this._text;
  }

  getVerticalAlignOffsetY () {
    const font = this._fontData;
    const customSize = this._size;
    let scale = customSize / font.size;

    if (isNaN(scale)) {
      scale = 1;
    }

    const lineHeight = font.lineHeight * scale + this._leading;
    const textHeight = this._numLines * lineHeight;

    if (textHeight > this._height) {
      return 0;
    }

    if (this._verticalAlign === Align.BOTTOM) {
      return (this._height - textHeight);
    } else if (this._verticalAlign === Align.CENTER) {
      return (this._height - textHeight) / 2;
    }
    return 0;
  }

  get align () {
    return this._align;
  }

  set align (value) {
    if (this._align === value) {
      return;
    }

    this._align = value;
    this.invalidate();
  }

  get maxWidth () {
    return this._maxWidth;
  }

  set maxWidth (value) {
    if (value < 0) { value = 0; }
    if (this._explicitMaxWidth === value) { return; }

    const needsInvalidate = value > this._explicitMaxWidth && this._lastLayoutIsTruncated;

    if (isNaN(value)) {
      throw new Error('maxWidth cannot be NaN');
    }

    const  oldValue = this._explicitMaxWidth;

    this._explicitMaxWidth = value;

    if (needsInvalidate || (isNaN(this._width) && (this.actualWidth > value || this.actualWidth === oldValue))) {
      //only invalidate if this change might affect the width
      this.invalidate();
    }
  }

  get numLines () {
    return this._numLines;
  }

  get truncateToFit () {
    return this._truncateToFit;
  }

  set truncateToFit (value) {
    if (this._truncateToFit === value) { return; }
    this._truncateToFit = value;
    this.invalidate();
  }

  get truncationText () {
    return this._truncationText;
  }

  set truncationText (value) {
    if (this._truncationText === value) { return; }
    this._truncationText = value;
    this.invalidate();
  }

  get font () {
    return this._font;
  }

  set font (value) {
    if (this._font === value) {
      return;
    }

    this._font = value;
    this.invalidate();
  }

  get leading () {
    return this._leading;
  }

  set leading (value) {
    if (value === this._leading) { return; }
    this._leading = value;
    this.invalidate();
  }

  get size () {
    return this._size;
  }

  set size (value) {
    if (value === this._size) { return; }
    this._size = value;
    this._textDirty = true;
    this.invalidate();
  }

  get wordWrap () {
    return this._wordWrap;
  }

  set wordWrap (value) {
    if (value === this._wordWrap) { return; }
    this._wordWrap = value;
    this.invalidate();
  }

  get color () {
    return this._color;
  }

  set color (value) {
    if (value === this._color) { return; }
    this._color = value;
    this._textDirty = true;
    this.invalidate();
  }

  get baseline () {
    const font = this._fontData;
    const formatSize = this._size;
    const baseline = font.baseline;

    let fontSizeScale = formatSize / font.size;

    if (isNaN(fontSizeScale)) {
      fontSizeScale = 1;
    }

    if (isNaN(baseline)) {
      return font.lineHeight * fontSizeScale;
    }

    return baseline * fontSizeScale;
  }

  get text () {
    return this._text;
  }

  set text (value) {
    value = `${ value }`;

    if (this._text === value) {
      return;
    }

    this._textDirty = true;
    this._text = value;
    this.invalidate();
  }

  get width () {
    return this._width;
  }

  set width (value) {
    if (this._width === value) {
      return;
    }

    this._width = value;
    this.invalidate();
  }

  get height () {
    return this._height;
  }

  set height (value) {
    if (this._height === value) {
      return;
    }

    this._height = value;
    this.invalidate();
  }

}

class CharLocation {
  char = '';
  scale = 1;
  x = 0;
  y = 0;
}

export { Align };

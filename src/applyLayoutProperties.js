import * as Yoga from 'typeflex';

/**
 * applyLayoutProperties.js
 * Copyright 2017 Raymond Cook
 *
 * Derived from yoga-js -- https://github.com/vincentriemer/yoga-js
 * Copyright 2017 Vincent Riemer
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 **/

export const defaultValues = {
  left: NaN,
  right: NaN,
  top: NaN,
  bottom: NaN,
  alignContent: 'flex-start',
  alignItems: 'stretch',
  alignSelf: 'auto',
  flexDirection: 'row',
  flexWrap: 'no-wrap',
  justifyContent: 'flex-start',
  margin: NaN,
  marginBottom: NaN,
  marginHorizontal: NaN,
  marginLeft: NaN,
  marginRight: NaN,
  marginTop: NaN,
  marginVertical: NaN,
  overflow: 'visible',
  display: 'flex',
  flex: 0,
  flexBasis: 'auto',
  flexGrow: 0,
  flexShrink: 1,
  aspectRatio: NaN,
  width: 'auto',
  height: 'auto',
  minWidth: NaN,
  minHeight: NaN,
  maxWidth: NaN,
  maxHeight: NaN,
  borderWidth: NaN,
  borderWidthBottom: NaN,
  borderWidthHorizontal: NaN,
  borderWidthLeft: NaN,
  borderWidthRight: NaN,
  borderWidthTop: NaN,
  borderWidthVertical: NaN,
  padding: NaN,
  paddingBottom: NaN,
  paddingHorizontal: NaN,
  paddingLeft: NaN,
  paddingRight: NaN,
  paddingTop: NaN,
  paddingVertical: NaN,
  position: 'relative'
};

export const alignEnumMapping = {
  auto: Yoga.ALIGN_AUTO,
  'flex-start': Yoga.ALIGN_FLEX_START,
  center: Yoga.ALIGN_CENTER,
  'flex-end': Yoga.ALIGN_FLEX_END,
  stretch: Yoga.ALIGN_STRETCH,
  baseline: Yoga.ALIGN_BASELINE,
  'space-between': Yoga.ALIGN_SPACE_BETWEEN,
  'space-around': Yoga.ALIGN_SPACE_AROUND
};

export const flexDirectionEnumMapping = {
  column: Yoga.FLEX_DIRECTION_COLUMN,
  'column-reverse': Yoga.FLEX_DIRECTION_COLUMN_REVERSE,
  row: Yoga.FLEX_DIRECTION_ROW,
  'row-reverse': Yoga.FLEX_DIRECTION_ROW_REVERSE
};

export const flexWrapEnumMapping = {
  'no-wrap': Yoga.WRAP_NO_WRAP,
  wrap: Yoga.WRAP_WRAP,
  'wrap-reverse': Yoga.WRAP_WRAP_REVERSE
};

export const justifyContentEnumMapping = {
  'flex-start': Yoga.JUSTIFY_FLEX_START,
  center: Yoga.JUSTIFY_CENTER,
  'flex-end': Yoga.JUSTIFY_FLEX_END,
  'space-between': Yoga.JUSTIFY_SPACE_BETWEEN,
  'space-around': Yoga.JUSTIFY_SPACE_AROUND,
  'space-evenly': Yoga.JUSTIFY_SPACE_EVENLY
};

export const overflowEnumMapping = {
  visible: Yoga.OVERFLOW_VISIBLE,
  hidden: Yoga.OVERFLOW_HIDDEN,
  scroll: Yoga.OVERFLOW_SCROLL
};

export const displayEnumMapping = {
  flex: Yoga.DISPLAY_FLEX,
  none: Yoga.DISPLAY_NONE
};

export const positionTypeEnumMapping = {
  relative: Yoga.POSITION_TYPE_RELATIVE,
  absolute: Yoga.POSITION_TYPE_ABSOLUTE
};

const setterMap = {

  alignContent: function (node, value) {
    node.setAlignContent(alignEnumMapping[value]);
  },

  alignItems: function (node, value) {
    node.setAlignItems(alignEnumMapping[value]);
  },

  alignSelf: function (node, value) {
    node.setAlignSelf(alignEnumMapping[value]);
  },

  flexDirection: function (node, value) {
    node.setFlexDirection(flexDirectionEnumMapping[value]);
  },

  flexWrap: function (node, value) {
    node.setFlexWrap(flexWrapEnumMapping[value]);
  },

  justifyContent: function (node, value) {
    node.setJustifyContent(justifyContentEnumMapping[value]);
  },

  left: function (node, value) {
    node.setPosition(Yoga.EDGE_LEFT, value);
  },

  right: function (node, value) {
    node.setPosition(Yoga.EDGE_RIGHT, value);
  },

  top: function (node, value) {
    node.setPosition(Yoga.EDGE_TOP, value);
  },

  bottom: function (node, value) {
    node.setPosition(Yoga.EDGE_BOTTOM, value);
  },

  margin: function (node, value) {
    if (typeof value === 'string') {
      const valueList = value.split(' ');

      switch (valueList.length) {

        case 1:
          node.setMargin(Yoga.EDGE_ALL, valueList[0]);
          break;

        case 2:
          node.setMargin(Yoga.EDGE_VERTICAL, valueList[0]);
          node.setMargin(Yoga.EDGE_HORIZONTAL, valueList[1]);
          break;

        case 3:
          node.setMargin(Yoga.EDGE_TOP, valueList[0]);
          node.setMargin(Yoga.EDGE_HORIZONTAL, valueList[1]);
          node.setMargin(Yoga.EDGE_BOTTOM, valueList[2]);
          break;

        case 4:
          node.setMargin(Yoga.EDGE_TOP, valueList[0]);
          node.setMargin(Yoga.EDGE_RIGHT, valueList[1]);
          node.setMargin(Yoga.EDGE_BOTTOM, valueList[2]);
          node.setMargin(Yoga.EDGE_LEFT, valueList[3]);
          break;

        default:
          console.warn('Bad value passed to "margin"', value);
          break;

      }
    } else if (typeof value === 'number') {
      node.setMargin(Yoga.EDGE_ALL, value);
    }
  },

  marginBottom: function (node, value) {
    node.setMargin(Yoga.EDGE_BOTTOM, value);
  },

  marginHorizontal: function (node, value) {
    node.setMargin(Yoga.EDGE_HORIZONTAL, value);
  },

  marginLeft: function (node, value) {
    node.setMargin(Yoga.EDGE_LEFT, value);
  },

  marginRight: function (node, value) {
    node.setMargin(Yoga.EDGE_RIGHT, value);
  },

  marginTop: function (node, value) {
    node.setMargin(Yoga.EDGE_TOP, value);
  },

  marginVertical: function (node, value) {
    node.setMargin(Yoga.EDGE_VERTICAL, value);
  },


  overflow: function (node, value) {
    node.setOverflow(overflowEnumMapping[value]);
  },

  display: function (node, value) {
    node.setDisplay(displayEnumMapping[value]);
  },

  flex: function (node, value) {
    node.setFlex(value);
  },

  flexBasis: function (node, value) {
    node.setFlexBasis(value);
  },

  flexGrow: function (node, value) {
    node.setFlexGrow(value);
  },

  flexShrink: function (node, value) {
    node.setFlexShrink(value);
  },

  aspectRatio: function (node, value) {
    node.setAspectRatio(value);
  },

  width: function (node, value) {
    node.setWidth(value);
  },

  height: function (node, value) {
    node.setHeight(value);
  },

  minWidth: function (node, value) {
    node.setMinWidth(value);
  },

  minHeight: function (node, value) {
    node.setMinHeight(value);
  },

  maxWidth: function (node, value) {
    node.setMaxWidth(value);
  },

  maxHeight: function (node, value) {
    node.setMaxHeight(value);
  },

  borderWidth: function (node, value) {
    if (typeof value === 'string') {
      const valueList = value.split(' ');

      switch (valueList.length) {

        case 1:
          node.setBorder(Yoga.EDGE_ALL, valueList[0]);
          break;

        case 2:
          node.setBorder(Yoga.EDGE_VERTICAL, valueList[0]);
          node.setBorder(Yoga.EDGE_HORIZONTAL, valueList[1]);
          break;

        case 3:
          node.setBorder(Yoga.EDGE_TOP, valueList[0]);
          node.setBorder(Yoga.EDGE_HORIZONTAL, valueList[1]);
          node.setBorder(Yoga.EDGE_BOTTOM, valueList[2]);
          break;

        case 4:
          node.setBorder(Yoga.EDGE_TOP, valueList[0]);
          node.setBorder(Yoga.EDGE_RIGHT, valueList[1]);
          node.setBorder(Yoga.EDGE_BOTTOM, valueList[2]);
          node.setBorder(Yoga.EDGE_LEFT, valueList[3]);
          break;

        default:
          console.warn('Bad value passed to "borderWidth"', value);
          break;

      }
    } else if (typeof value === 'number') {
      node.setBorder(Yoga.EDGE_ALL, value);
    }
  },

  borderBottomWidth: function (node, value) {
    node.setBorder(Yoga.EDGE_BOTTOM, value);
  },

  borderLeftWidth: function (node, value) {
    node.setBorder(Yoga.EDGE_LEFT, value);
  },

  borderRightWidth: function (node, value) {
    node.setBorder(Yoga.EDGE_RIGHT, value);
  },

  borderTopWidth: function (node, value) {
    node.setBorder(Yoga.EDGE_TOP, value);
  },

  padding: function (node, value) {
    if (typeof value === 'string') {
      const valueList = value.split(' ');

      switch (valueList.length) {

        case 1:
          node.setPadding(Yoga.EDGE_ALL, valueList[0]);
          break;

        case 2:
          node.setPadding(Yoga.EDGE_VERTICAL, valueList[0]);
          node.setPadding(Yoga.EDGE_HORIZONTAL, valueList[1]);
          break;

        case 3:
          node.setPadding(Yoga.EDGE_TOP, valueList[0]);
          node.setPadding(Yoga.EDGE_HORIZONTAL, valueList[1]);
          node.setPadding(Yoga.EDGE_BOTTOM, valueList[2]);
          break;

        case 4:
          node.setPadding(Yoga.EDGE_TOP, valueList[0]);
          node.setPadding(Yoga.EDGE_RIGHT, valueList[1]);
          node.setPadding(Yoga.EDGE_BOTTOM, valueList[2]);
          node.setPadding(Yoga.EDGE_LEFT, valueList[3]);
          break;

        default:
          console.warn('Bad value passed to "padding"', value);
          break;

      }
    } else if (typeof value === 'number') {
      node.setPadding(Yoga.EDGE_ALL, value);
    }
  },

  paddingBottom: function (node, value) {
    node.setPadding(Yoga.EDGE_BOTTOM, value);
  },

  paddingHorizontal: function (node, value) {
    node.setPadding(Yoga.EDGE_HORIZONTAL, value);
  },

  paddingLeft: function (node, value) {
    node.setPadding(Yoga.EDGE_LEFT, value);
  },

  paddingRight: function (node, value) {
    node.setPadding(Yoga.EDGE_RIGHT, value);
  },

  paddingTop: function (node, value) {
    node.setPadding(Yoga.EDGE_TOP, value);
  },

  paddingVertical: function (node, value) {
    node.setPadding(Yoga.EDGE_VERTICAL, value);
  },

  position: function (node, value) {
    node.setPositionType(positionTypeEnumMapping[value]);
  }

};

function isShallowEqual (props1, props2) {
  for (const key in props1) {
    if (setterMap[key] && (!props2.hasOwnProperty(key) || props1[key] !== props2[key])) {
      return false;
    }
  }

  for (const key in props2) {
    if (setterMap[key] && (!props1.hasOwnProperty(key) || props1[key] !== props2[key])) {
      return false;
    }
  }

  return true;
}

export default function applyLayoutProperties (node, oldProps, newProps, defaults) {
  if (isShallowEqual(oldProps, newProps)) {
    return false;
  }

  for (const propName in oldProps) {
    const propSetter = setterMap[propName];

    if (propSetter && !newProps.hasOwnProperty(propName)) {

      const value = defaults && defaults.hasOwnProperty(propName)
        ? defaults[propName]
        : defaultValues[propName];

      propSetter(node, value);
    }
  }

  for (const propName in newProps) {
    const propSetter = setterMap[propName];

    if (propSetter) {
      propSetter(node, newProps[propName]);
    }
  }

  return true;
}

export function applyDefaultLayoutProperties (node) {
  for (const propName in defaultValues) {
    const propSetter = setterMap[propName];

    if (propSetter) {
      propSetter(node, defaultValues[propName]);
    }
  }
}

import Animated from '@lunarraid/animated';
import Easing from '@lunarraid/animated/lib/Easing';

import React from 'react';
import ReactFiberReconciler from 'react-reconciler';

import BaseElement from './elements/BaseElement';
import BackgroundContainerElement, { RESIZE_MODES as RPL_RESIZE_MODES } from './elements/BackgroundContainer';
import BackgroundImageElement from './elements/BackgroundImage';
import BitmapTextElement from './elements/BitmapText';
import ContainerElement from './elements/Container';
import GraphicsElement from './elements/Graphics';
import NineSliceSpriteElement from './elements/NineSliceSprite';
import RectangleElement from './elements/Rectangle';
import MaskContainerElement from './elements/MaskContainer';
import ScrollContainerElement from './elements/ScrollContainer';
import SpriteElement from './elements/Sprite';
import TextElement from './elements/Text';
import TextInputElement from './elements/TextInput';
import TilingSpriteElement from './elements/TilingSprite';

import Stage from './Stage';
import mergeStyles from './mergeStyles';

const UPDATE_SIGNAL = {};
const performance = window.performance || window.msPerformance || window.webkitPerformance;
const _registeredElements = {};

const PixiContext = React.createContext();

function appendChild (parentInstance, child) {
  parentInstance.addChild(child);
}

function removeChild (parentInstance, child) {
  parentInstance.removeChild(child);
}

function insertBefore (parentInstance, child, beforeChild) {
  if (child === beforeChild) {
    throw new Error('ReactPixiLayout cannot insert node before itself');
  }

  const childExists = parentInstance.hasChild(child);
  const index = parentInstance.getChildIndex(beforeChild);

  if (childExists) {
    parentInstance.setChildIndex(child, index);
  } else {
    parentInstance.addChildAt(child, index);
  }
}

function commitUpdate (instance, updatePayload, type, oldProps, newProps, internalInstanceHandle) {
  instance.applyProps(oldProps, newProps);
  instance.displayObject.___props = newProps;
}

const ReactPixiLayout = ReactFiberReconciler({

  supportsMutation: true,
  isPrimaryRenderer: false,

  appendInitialChild: appendChild,

  createInstance: function (type, props, internalInstanceHandle, hostContext) {
    const ctor = _registeredElements[type];

    if (!ctor) {
      throw new Error(`ReactPixiLayout does not support the type: ${ type }`);
    }

    const instance = new ctor(props, hostContext.root);
    instance.applyProps({}, props);
    instance.displayObject.___props = props;
    return instance;
  },

  createTextInstance: function (text, rootContainerInstance, internalInstanceHandle) {
    throw new Error('ReactPixiLayout does not support text instances. Use Text component instead.');
  },

  finalizeInitialChildren: function (pixiElement, type, props, rootContainerInstance) {
    return false;
  },

  getChildHostContext: function (parentHostContext, type) {
    return parentHostContext;
  },

  getRootHostContext: function (rootContainerInstance) {
    return { root: rootContainerInstance };
  },

  getPublicInstance: function (inst) {
    return inst.publicInstance;
  },

  now: function () {
    return performance.now();
  },

  prepareForCommit: function () {
    // Noop
  },

  prepareUpdate: function (pixiElement, type, oldProps, newProps, rootContainerInstance, hostContext) {
    return UPDATE_SIGNAL;
  },

  resetAfterCommit: function () {
    // Noop
  },

  resetTextContent: function (pixiElement) {
    // Noop
  },

  shouldDeprioritizeSubtree: function (type, props) {
    const isAlphaVisible = props.alpha === undefined || props.alpha > 0;
    const isRenderable = props.renderable === undefined || props.renderable === true;
    const isVisible = props.visible === undefined || props.visible === true;

    return !(isAlphaVisible && isRenderable && isVisible);
  },

  shouldSetTextContent: function (type, props) {
    return false;
  },

  useSyncScheduling: true,


  appendChild: appendChild,
  appendChildToContainer: appendChild,

  insertBefore: insertBefore,
  insertInContainerBefore: insertBefore,

  removeChild: removeChild,
  removeChildFromContainer: removeChild,

  commitTextUpdate: function (textInstance, oldText, newText) {
    // Noop
  },

  commitUpdate: commitUpdate

});

export function registerElement (name, element) {
  _registeredElements[name] = element;
  return name;
}

export const Container = 'Container';
export const Text = 'Text';
export const TextInput = 'TextInput';
export const BitmapText = 'BitmapText';
export const ScrollContainer = 'ScrollContainer';
export const Sprite = 'Sprite';
export const BackgroundContainer = 'BackgroundContainer';
export const BackgroundImage = 'BackgroundImage';
export const TilingSprite = 'TilingSprite';
export const NineSliceSprite = 'NineSliceSprite';
export const Graphics = 'Graphics';
export const Rectangle = 'Rectangle';
export const MaskContainer = 'MaskContainer';

export const RESIZE_MODES = RPL_RESIZE_MODES;

registerElement(Container, ContainerElement);
registerElement(Text, TextElement);
registerElement(TextInput, TextInputElement);
registerElement(BitmapText, BitmapTextElement);
registerElement(ScrollContainer, ScrollContainerElement);
registerElement(Sprite, SpriteElement);
registerElement(BackgroundContainer, BackgroundContainerElement);
registerElement(BackgroundImage, BackgroundImageElement);
registerElement(TilingSprite, TilingSpriteElement);
registerElement(NineSliceSprite, NineSliceSpriteElement);
registerElement(Graphics, GraphicsElement);
registerElement(Rectangle, RectangleElement);
registerElement(MaskContainer, MaskContainerElement);

const animatedExport = {
  BackgroundContainer: Animated.createAnimatedComponent(BackgroundContainer),
  Container: Animated.createAnimatedComponent(Container),
  Text: Animated.createAnimatedComponent(Text),
  TextInput: Animated.createAnimatedComponent(TextInput),
  BitmapText: Animated.createAnimatedComponent(BitmapText),
  ScrollContainer: Animated.createAnimatedComponent(ScrollContainer),
  Sprite: Animated.createAnimatedComponent(Sprite),
  BackgroundImage: Animated.createAnimatedComponent(Sprite),
  TilingSprite: Animated.createAnimatedComponent(TilingSprite),
  NineSliceSprite: Animated.createAnimatedComponent(NineSliceSprite),
  Graphics: Animated.createAnimatedComponent(Graphics),
  Rectangle: Animated.createAnimatedComponent(Rectangle),
  MaskContainer: Animated.createAnimatedComponent(MaskContainer),
  Easing,
  ...Animated
};

const Elements = {
  BaseElement,
  BackgroundContainerElement,
  BackgroundImageElement,
  BitmapTextElement,
  ContainerElement,
  GraphicsElement,
  NineSliceSpriteElement,
  RectangleElement,
  MaskContainerElement,
  ScrollContainerElement,
  SpriteElement,
  TextElement,
  TextInputElement,
  TilingSpriteElement
};

export { Elements, PixiContext, ReactPixiLayout, Stage, animatedExport as Animated, Easing, mergeStyles };

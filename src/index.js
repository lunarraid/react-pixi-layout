import Animated from 'animated';
import Easing from 'animated/lib/Easing';
import ReactFiberReconciler from 'react-reconciler';
import invariant from 'fbjs/lib/invariant';
import ContainerElement from './elements/Container';
import SpriteElement from './elements/Sprite';
import NineSliceSpriteElement from './elements/NineSliceSprite';
import TilingSpriteElement from './elements/TilingSprite';
import GraphicsElement from './elements/Graphics';
import RectangleElement from './elements/Rectangle';
import TextElement from './elements/Text';
import Stage from './Stage';

const UPDATE_SIGNAL = {};
const performance = window.performance || window.msPerformance || window.webkitPerformance;
const _registeredElements = {};

function appendChild (parentInstance, child) {
  parentInstance.addChild(child);
}

function removeChild (parentInstance, child) {
  parentInstance.removeChild(child);
}

function insertBefore (parentInstance, child, beforeChild) {
  invariant(child !== beforeChild, 'ReactPixiLayout cannot insert node before itself');

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
}

const ReactPixiLayout = ReactFiberReconciler({

  appendInitialChild: appendChild,

  createInstance: function (type, props, internalInstanceHandle, hostContext) {
    const ctor = _registeredElements[type];
    invariant(ctor, 'ReactPixiLayout does not support the type: `%s`.', type);
    const instance = new ctor();
    instance.root = hostContext.root;
    instance.applyProps({}, props);
    return instance;
  },

  createTextInstance: function (text, rootContainerInstance, internalInstanceHandle) {
    invariant(false, 'ReactPixiLayout does not support text instances. Use Text component instead.');
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
    return inst;
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

  mutation: {

    appendChild: appendChild,
    appendChildToContainer: appendChild,

    insertBefore: insertBefore,
    insertInContainerBefore: insertBefore,

    removeChild: removeChild,
    removeChildFromContainer: removeChild,

    commitTextUpdate: function (textInstance, oldText, newText) {
      // Noop
    },

    commitMount: function (instance, type, newProps) {
      // Noop
    },

    commitUpdate: commitUpdate
  
  }

});

export function registerElement (name, element) {
  _registeredElements[name] = element;
  return name;
}

export const Container = 'Container';
export const Text = 'Text';
export const Sprite = 'Sprite';
export const TilingSprite = 'TilingSprite';
export const NineSliceSprite = 'NineSliceSprite';
export const Graphics = 'Graphics';
export const Rectangle = 'Rectangle';

registerElement(Container, ContainerElement);
registerElement(Text, TextElement);
registerElement(Sprite, SpriteElement);
registerElement(TilingSprite, TilingSpriteElement);
registerElement(NineSliceSprite, NineSliceSpriteElement);
registerElement(Graphics, GraphicsElement);
registerElement(Rectangle, RectangleElement);

const animatedExport = {
  Container: Animated.createAnimatedComponent(Container),
  Text: Animated.createAnimatedComponent(Text),
  Sprite: Animated.createAnimatedComponent(Sprite),
  TilingSprite: Animated.createAnimatedComponent(TilingSprite),  
  NineSliceSprite: Animated.createAnimatedComponent(NineSliceSprite),  
  Graphics: Animated.createAnimatedComponent(Graphics),
  Rectangle: Animated.createAnimatedComponent(Rectangle),
  Easing,
  ...Animated
};

export { ReactPixiLayout, Stage, animatedExport as Animated };

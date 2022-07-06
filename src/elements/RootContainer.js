import Container from './Container';
import mergeStyles from '../mergeStyles';

const MAX_LAYOUT_ATTEMPTS = 3;

export default class RootContainer extends Container {

  constructor (props = {}, root) {
    super(props, root);
    this.applyProps({}, props);

    this.layoutCallbackViews = [];
    this.callbackCount = 0;
    this.layoutAttemptCount = 0;
  }

  addToCallbackPool (view) {
    this.layoutCallbackViews[this.callbackCount] = view;
    this.callbackCount++;
  }

  removeFromCallbackPool (view) {
    const views = this.layoutCallbackViews;

    for (let i = 0; i < this.callbackCount; i++) {
      if (views[i] === view) {
        views[i] = null;
      }
    }
  }

  updateLayout () {
    if (this._layoutDirty) {

      this.layoutAttemptCount++;
      this.layoutNode.calculateLayout();
      this.applyLayout();

      for (let i = 0; i < this.callbackCount; i++) {
        const view = this.layoutCallbackViews[i];

        if (view) {
          const { x, y, width, height } = view.cachedLayout;
          this.layoutCallbackViews[i].onLayoutCallback(x, y, width, height);
          this.layoutCallbackViews[i] = null;
        }
      }

      this.callbackCount = 0;

      if (this._layoutDirty && this.layoutAttemptCount <= MAX_LAYOUT_ATTEMPTS) {
        this.updateLayout();
      }

      this.layoutAttemptCount--;
    }
  }

}

import React from 'react';
import PropTypes from 'prop-types';
import { ReactPixiLayout } from './index';
import Application from './elements/Application';
import { version } from '../package.json';

export default class Stage extends React.Component {

  static propTypes = {
    antialias: PropTypes.bool,
    autoStart: PropTypes.bool,
    backgroundColor: PropTypes.number,
    clearBeforeRender: PropTypes.bool,
    forceCanvas: PropTypes.bool,
    forceFXAA: PropTypes.bool,
    legacy: PropTypes.bool,
    powerPreference: PropTypes.string,
    preserveDrawingBuffer: PropTypes.bool,
    resolution: PropTypes.number,
    roundPixels: PropTypes.bool,
    sharedLoader: PropTypes.bool,
    sharedTicker: PropTypes.bool,
    transparent: PropTypes.bool,
    children: PropTypes.node,
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    style: PropTypes.object
  };

  componentDidMount() {
    const props = { view: this._canvas, ...this.props };

    this._applicationElement = new Application(props);
    this._applicationContainer = ReactPixiLayout.createContainer(this._applicationElement);

    ReactPixiLayout.injectIntoDevTools({
      findFiberByHostInstance: ReactPixiLayout.findFiberByHostInstance,
      bundleType: 1,
      version,
      rendererPackageName: 'react-pixi-layout'
    });

    ReactPixiLayout.updateContainer(this.props.children, this._applicationContainer);
  }

  componentDidUpdate (prevProps, prevState) {
    this._applicationElement.applyProps(prevProps, this.props);
    ReactPixiLayout.updateContainer(this.props.children, this._applicationContainer);
  }

  componentWillUnmount () {
    ReactPixiLayout.updateContainer(null, this._applicationContainer, this);
    this._applicationElement.destroy();
    this._applicationElement = null;
    this._applicationContainer = null;
  }

  render () {
    return <canvas ref={ ref => this._canvas = ref } />;
  }

};

import React from 'react';
import { PixiContext, ReactPixiLayout } from './index';
import Application from './elements/Application';

export default class Stage extends React.Component {

  state = {
    context: {
      application: null
    }
  };

  componentDidMount () {
    const props = { view: this._canvas, ...this.props };

    this._applicationElement = new Application(props);
    this._applicationContainer = ReactPixiLayout.createContainer(this._applicationElement);

    this._applicationElement.application.renderer.on('resize', this.onResize, this);

    this.setState({
      context: {
        application: this._applicationElement.application,
        canvas: this._canvas
      }
    });

    ReactPixiLayout.injectIntoDevTools({
      findFiberByHostInstance: ReactPixiLayout.findFiberByHostInstance,
      bundleType: 1,
      version: '18.2.0',
      rendererPackageName: 'react-pixi-layout'
    });

    ReactPixiLayout.updateContainer(this.wrapProvider(), this._applicationContainer, this);
  }

  componentDidUpdate (prevProps) {
    this._applicationElement.applyProps(prevProps, this.props);

    ReactPixiLayout.updateContainer(this.wrapProvider(), this._applicationContainer, this);
  }

  componentWillUnmount () {
    ReactPixiLayout.updateContainer(null, this._applicationContainer, this);

    this._applicationElement.application.renderer.removeListener('resize', this.onResize, this);

    this._applicationElement.destroy();
    this._applicationElement = null;
    this._applicationContainer = null;

    if (this.props.onApplication) {
      this.props.onApplication(null);
    }
  }

  wrapProvider () {
    return (
      <PixiContext.Provider value={ this.state.context }>
        { this.props.children }
      </PixiContext.Provider>
    );
  }

  render () {
    return <canvas ref={ ref => this._canvas = ref } />;
  }

  onResize (width, height) {
    this.props.onResize && this.props.onResize(width, height);
  }

}

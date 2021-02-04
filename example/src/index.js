import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Stage, BitmapText, Container, Rectangle, Text, Animated } from 'react-pixi-layout';
import { Loader } from 'pixi.js';

class App extends Component {

  state = {
    toggled: false,
    width: window.innerWidth,
    height: window.innerHeight
  };

  animatedValue = new Animated.Value(0);

  width = this.animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['50%', '100%']
  });

  color = this.animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 255, 0, 1)', 'rgba(255, 0, 0, 1)']
  });

  onClick = () => {
    const toggled = !this.state.toggled;
    const toValue = toggled ? 1 : 0;

    Animated
      .timing(this.animatedValue, { toValue, duration: 500, easing: Animated.Easing.linear })
      .start();

    this.setState({ toggled });
  };

  onResize = () => this.setState({ width: window.innerWidth, height: window.innerHeight });

  componentDidMount () {
    window.addEventListener('resize', this.onResize, false);
  }

  render () {

    return (
      <Stage width={ this.state.width } height={ this.state.height } style={ styles.stage }>

        <Rectangle style={ styles.header }>
          <Text text="An Absolutely Positioned Header" style={{ fill: 'blue', fontSize: 32 }} />
          <BitmapText text="Bitmap Text" style={ styles.bitmapText } />
        </Rectangle>

        <Container style={ styles.container }>

          <Animated.Rectangle
            style={{ color: this.color, width: this.width, height: '50%', alignItems: 'center', justifyContent: 'center' }}
            onClick={ this.onClick }
          >
            <Text text="Click Me" style={{ fill: 'white', fontSize: 30 }} />
            <Animated.Sprite texture="http://placekitten.com/200/300" style={{ height: '50%', alpha: this.animatedValue }} />
          </Animated.Rectangle>

          <Rectangle style={ styles.flexRight } />

        </Container>

      </Stage>
    );
  }

};

const styles = {

  stage: {
    justifyContent: 'center',
    alignItems: 'center'
  },

  container: {
    width: '80%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center'
  },

  header: {
    color: 'yellow',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32
  },

  flexRight: {
    color: 'blue',
    height: '50%',
    flex: 1
  },

  bitmapText: {
    color: 0x666666,
    font: 'arial_black',
    size: 32
  }

};

// Font needs to be loaded before we can render BitmapText
Loader.shared
  .add(`${ process.env.PUBLIC_URL }/arial_black.fnt`)
  .load(() => ReactDOM.render(<App />, document.getElementById('root')));


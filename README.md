# react-pixi-layout

> React Fiber renderer for pixi.js with flexbox layout

[![NPM](https://img.shields.io/npm/v/react-pixi-layout.svg)](https://www.npmjs.com/package/react-pixi-layout) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save react-pixi-layout
```

## Usage

```jsx
import React, { Component } from 'react'

import { Stage, Text } from 'react-pixi-layout'

class Example extends Component {
  render () {
    return (
      <Stage width={ 640 } height={ 480 }>
      	<Text text="Hello world" />
      </Stage>
    );
  }
}
```

## License

MIT © [lunarraid](https://github.com/lunarraid)

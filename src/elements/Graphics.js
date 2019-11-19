import * as PIXI from 'pixi.js';
import Container from './Container';

export default class Graphics extends Container {

  createDisplayObject () {
    return new PIXI.Graphics();
  }

}

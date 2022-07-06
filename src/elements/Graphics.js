import { Graphics as PixiGraphics } from 'pixi.js';
import Container from './Container';

export default class Graphics extends Container {

  createDisplayObject () {
    return new PixiGraphics();
  }

}

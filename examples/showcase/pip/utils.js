
const TEXTURE_SIZE = 64;
// import * as Polygon from './polygon';

import {getRandom} from '../../utils';

const random = getRandom();

const TRIANGLES = [
  [-0.5, -0.5,  0, 0, -0.5, 0.5],
 [0.5, -0.5,  0, 0,  0.5, 0.5]
];

const POLYGON = [
  [-0.5, -0.5],  [0, 0], [-0.5, 0.5], [-0.75, 0]
]

export function getRandomPoints(count) {
  const flatArray = new Float32Array(count * 2);
  const pointsArray = new Array(count);
  for (let i = 0; i < count; ++i) {
    flatArray[i * 2] = random() * 2.0 - 1.0;
    flatArray[i * 2 + 1] = random() * 2.0 - 1.0;
    pointsArray[i] = [flatArray[i * 2], flatArray[i * 2 + 1]];
  }
  return {flatArray, pointsArray};
}

let random_polygon;
let random_polygon_counter = 0;
export function getRandomPolygon(size) {

  random_polygon_counter++;
  if (random_polygon && random_polygon_counter % 100 !== 0) {
      return random_polygon;
  }

  size = size || 3 + Math.floor(random() * 50);
  size = Math.max(size, 3);
  const angleStep = 360 / size ;
  let angle = 0;
  const radiusStep = 0.25;
  let radius = 0;
  const polygon = [];
  const xOffset = (random() - 0.5)/4;
  const yOffset = (random() - 0.5)/4;
  for (let i=0; i<size; i++) {
    radius = 0.25 + radiusStep*random(); // random value between 0.25 to 0.5
    angle = (angleStep * i) + angleStep*random();
    const cos =  Math.cos(angle * Math.PI / 180);
    const sin =  Math.sin(angle * Math.PI / 180);
    polygon.push([
      radius * sin + xOffset,
      radius * cos + yOffset
    ]);
  }
  random_polygon = polygon;
  return polygon;
}

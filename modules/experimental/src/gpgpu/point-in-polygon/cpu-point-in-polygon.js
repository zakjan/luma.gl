
import booleanWithin from '@turf/boolean-within';
import {point as turfPoint, polygon as turfPolygon} from '@turf/helpers';

export default class CPUPolygonClip {
  constructor({polygon} = {}) {

    if (polygon) {
      this.update({polygon});
    }
  }

  update({polygon} = {}) {

    this.turfPolygon = turfPolygon([[...polygon, polygon[0]]]);
  }

  run({points}) {
    const pointCount = points.length;
    const polygon = this.turfPolygon;
    const filterValues = new Uint8Array(pointCount);
    const filterValueIndexArray = new Float32Array(pointCount * 2);
    for (let i = 0; i < pointCount; i++) {
      filterValues[i] = booleanWithin(turfPoint(points[i]), polygon) ? 1 : 0;
      filterValueIndexArray[i*2] = filterValues[i];
      filterValueIndexArray[i*2 + 1] = i;
    }
    return {filterValues, filterValueIndexArray};
  }
}

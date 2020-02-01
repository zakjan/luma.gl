
import booleanWithin from '@turf/boolean-within';
import {point as turfPoint, polygon as turfPolygon, polygons as turfPolygons} from '@turf/helpers';

export default class CPUPolygonClip {
  constructor({polygon} = {}) {

    if (polygon) {
      this.update({polygon});
    }
  }

  // update({polygon} = {}) {
  //
  //   this.turfPolygon = turfPolygon([[...polygon, polygon[0]]]);
  // }

  update({polygon, polygons} = {}) {

    let arg;
    this.turfPolygons = [];

    // this.turfPolygons[0] = turfPolygon([[...polygon, polygon[0]]]);
    // const t = this.turfPolygons[0];


    polygons = polygons || [polygon];

    for (let i=0; i< polygons.length; i++) {
      this.turfPolygons[i] = turfPolygon([[...polygons[i], polygons[i][0]]]);
    }

  }

  run({points}) {
    const pointCount = points.length;
    // const polygon = this.turfPolygon;
    const filterValues = new Uint8Array(pointCount);
    const filterValueIndexArray = new Float32Array(pointCount * 2);
    for (let i = 0; i < pointCount; i++) {
      let insidePolygon = false;
      for (let j=0; j < this.turfPolygons.length; j++) {
        insidePolygon = insidePolygon || booleanWithin(turfPoint(points[i]), this.turfPolygons[j]);
      }
      filterValues[i] = insidePolygon ? 1 : 0;

      // filterValues[i] = booleanWithin(turfPoint(points[i]), this.turfPolygons[0]) ? 1 : 0;


      filterValueIndexArray[i*2] = filterValues[i];
      filterValueIndexArray[i*2 + 1] = i;
    }
    return {filterValues, filterValueIndexArray};
  }
}

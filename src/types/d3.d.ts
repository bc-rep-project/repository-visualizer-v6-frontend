import * as d3 from 'd3';

declare module 'd3' {
  export interface HierarchyRectangularNode<Datum> extends d3.HierarchyNode<Datum> {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  }
} 
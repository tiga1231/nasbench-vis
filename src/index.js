import * as d3 from "d3";
import * as utils from './utils';

import { LinkedView } from "./LinkedView";
import { LinkedViewController } from "./LinkedViewController";

import { GraphView } from "./GraphView";

import { GrandTourView } from "./grandtour/GrandTourView";

// global modules for debugging in the browser
window.d3 = d3;
window.utils = utils;


d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};


window.onload = function(){

  d3.json('./data/nas-201-presoftmax-2.json')
  // d3.json('./data/nas-201-softmax.json')
  // d3.json('./data/nas-201-confusion.json')
  // d3.json('./data/nas-201-arch.json')
  .then(data=>{
      window.data = data;
      data.ops = data.archs.map(a=>{
        let ops = a.match(/\|(\S+)~0\|\+\|(\S+)~0\|(\S+)~1\|\+\|(\S+)~0\|(\S+)~1\|(\S+)~2\|/).slice(1,7);
        return ops;
      });
      let x,y;
      let viridis = d3.interpolateViridis;
      let sc = d3.scaleLinear()
      .domain([
        95,85,
        80,46,
        10
      ])
      .range([
        viridis(1.0), viridis(0.4), 
        viridis(0.4), viridis(0.1),
        viridis(0)
      ]);

      let n = data['archs'].length;
      let controller = new LinkedViewController();
      let kwargs = {
        width: window.innerWidth/2, 
        height: window.innerHeight, 
        pointSize: 4.0,
        parent: controller,
        margin: [0.1, 0.95, 0.1, 0.95],
        colors: data.accuracies.map(d=>{
          let c = d3.color(sc(d));
          return [c.r/255.0, c.g/255.0, c.b/255.0];
        }),
        zoom: true
      };

      x = data['embeddings'].map(d=>d[0]);
      y = data['embeddings'].map(d=>d[1]);
      let lv = new LinkedView(x, y, kwargs);

      let gv = new GraphView({
        svg: d3.select('body')
            .append('svg')
            .attr('width', '300')
            .attr('height', '150')
            .style('background', '#444')
            .style('position', 'absolute')
            .style('top', 0)
            .style('right', 0),
        data: data,
      });
      lv.graphView = gv;

      window.x = x;
      window.y = y;
      window.lv = lv;
      window.gv = gv;
      window.controller = controller;
  });

  let grandTourData = {};
  window.grandTourData = grandTourData;
  // utils.loadBin('data/nas-201-activations-softmax.bin', (activations, kwargs)=>{
  utils.loadBin('data/nas-201-activations-presoftmax.bin', (activations, kwargs)=>{
    activations = new Float32Array(activations);
    activations = utils.reshape(activations, [15625, 1000, 10]);
    grandTourData.positions = activations;

    utils.loadBin('data/nas-201-labels.bin', (labels, kwargs)=>{
      labels = Array.from(new Uint8Array(labels));
      grandTourData.labels = labels;

      //draw grand tour
      let sc = d3.scaleOrdinal(d3.schemeCategory10);
      let position = activations[0];
      let color = labels.map(l=>{
        let c = d3.rgb(sc(l));
        return [c.r, c.g, c.b, 255];
      });

      let width = window.innerWidth/2;
      let height = window.innerHeight;

      let canvas = d3.select('body')
      .append('div')
      .style('position', 'relative')
      .style('display', 'inline')
      .append('canvas')
      .attr('id', 'grandtour')
      .attr('width', width * devicePixelRatio)
      .attr('height', height * devicePixelRatio)
      .style('background', '#aaaaaa')
      .style('position', 'absolute')
      .style('width', width)
      .style('height', height);

      window.gtv = new GrandTourView({
        canvas: canvas,
        position: position,
        dataObj: grandTourData,
        color: color,
        handle: true,
        brush: true,
        pointSize: 8.0,
        scaleMode: 'center',
      });
      lv.grandtourView = window.gtv;
      gv.svg.moveToFront();
      window.controller.div.moveToFront();

    });

  });


}






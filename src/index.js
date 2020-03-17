import "./style/style.css";

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

//   //embedding
  let controller = new LinkedViewController();
  let viridis = d3.interpolateViridis;
  
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
      let kwargs = {
        widthRatio: 0.5, 
        heightRatio: 1.0, 
        pointSize: 4.0,
        parent: controller,
        margin: [0.1, 0.95, 0.1, 0.80],//[left, right, bottom, top]
        colors: data.accuracies.map(d=>{
          let c = d3.color(sc(d));
          return [c.r/255.0, c.g/255.0, c.b/255.0];
        }),
        zoom: false,
        brush: true,
      };

      x = data['embeddings'].map(d=>d[0]);
      y = data['embeddings'].map(d=>d[1]);
      let embedding_view = new LinkedView(x, y, kwargs);

      //graph view
      let gv_svg = d3.select('body')
        .append('svg')
        .attr('width', window.innerWidth/3)
        .attr('height', 150)
        // .style('background', '#444')
        .style('position', 'absolute')
        .style('top', 0)
        .style('left', 0);
      let gv = new GraphView({
        svg: gv_svg,
        data: data,
      });
      window.addEventListener('resize', ()=>{
        gv_svg.attr('width', window.innerWidth/2);
      });

      embedding_view.graphView = gv;
      window.x = x;
      window.y = y;
      window.embedding_view = embedding_view;
      window.gv = gv;
      window.controller = controller;
  });


  // // the Grand Tour
  // let grandTourData = {};
  // window.grandTourData = grandTourData;
  // utils.loadBin('data/nas-201-activations-softmax.bin', (activations, kwargs)=>{
  // // utils.loadBin('data/nas-201-activations-presoftmax.bin', (activations, kwargs)=>{
  //   activations = new Float32Array(activations);
  //   activations = utils.reshape(activations, [15625, 1000, 10]);
  //   grandTourData.positions = activations;

  //   utils.loadBin('data/nas-201-labels.bin', (labels, kwargs)=>{
  //     labels = Array.from(new Uint8Array(labels));
  //     grandTourData.labels = labels;

  //     //draw grand tour
  //     let sc = d3.scaleOrdinal(d3.schemeCategory10);
  //     let position = activations[0];
  //     let color = labels.map(l=>{
  //       let c = d3.rgb(sc(l));
  //       return [c.r, c.g, c.b, 255];
  //     });

  //     let width = window.innerWidth/2;
  //     let height = window.innerHeight;

  //     let canvas = d3.select('body')
  //     .append('div')
  //     .style('position', 'relative')
  //     .style('display', 'inline')
  //     .append('canvas')
  //     .attr('id', 'grandtour')
  //     .attr('width', width * devicePixelRatio)
  //     .attr('height', height * devicePixelRatio)
  //     .style('background', '#aaaaaa')
  //     .style('position', 'absolute')
  //     .style('width', width)
  //     .style('height', height);

  //     window.gtv = new GrandTourView({
  //       canvas: canvas,
  //       position: position,
  //       dataObj: grandTourData,
  //       color: color,
  //       handle: true,
  //       brush: true,
  //       pointSize: 8.0,
  //       scaleMode: 'center',
  //     });
  //     lv.grandtourView = window.gtv;
      
  //   });
  // });
  // 
  // 
  
  d3.json('./data/nas-201-GDAS-prob-rank-accuracy.json').then(data=>{
    d3.json('./data/nas-201-GDAS-accuracies.json').then(GDAS_accuracies=>{  
      window.GDAS_accuracies = GDAS_accuracies;
      window.data = data;
      let kwargs = {
        id: 'prob_accuracy_view',
        widthRatio: 0.5, 
        heightRatio: 1.0, 
        pointSize: 4.0,
        parent: controller,
        margin: [0.1, 0.95, 0.1, 0.95],
        colors: '#aeefff',
        zoom: false,
        brush: true,
        xlim: [-14, -6],
        // xlim: [-500, 16500],
        ylim: [0,0.6],
        xLabel: 'Preference',
        yLabel: 'Valid accuracy',
      };
      data.log_probs = math.log(data.probs);
      let epoch = 10;
      x = data.log_probs.map(d=>d[epoch]);
      y = GDAS_accuracies[epoch];
      let prob_accuracy_view = new LinkedView(x, y, kwargs);
     
      let slider = d3.select('#'+prob_accuracy_view.id)
      .insert('input', '#prob_accuracy_view-overlay + *')
      .attr('type', 'range')
      .attr('class', 'slider')
      .attr('min', 10)
      .attr('max', 249)
      .attr('value', 10)
      .attr('step', 1)
      .on('input', ()=>{
        let epoch = slider.property('value');

        let xDest = data.log_probs.map(d=>d[epoch]);
        prob_accuracy_view.xLabel = `Preference (epoch ${epoch})`;

        let yDest = undefined;
        if(epoch in GDAS_accuracies){
          yDest = GDAS_accuracies[epoch];
          prob_accuracy_view.yLabel = `Valid Accuracy (epoch ${epoch})`;
        }else{
          //find a 'floor' epoch that has a record;
          for(let e=epoch; e>=0; e--){
            if(e in GDAS_accuracies){
              yDest = GDAS_accuracies[e];
              prob_accuracy_view.yLabel = `Valid Accuracy (epoch ${e})`;
              break;
            }
            if(e==0){
              yDest = Array(GDAS_accuracies[10].length).fill(0.1);
              prob_accuracy_view.yLabel = `Valid Accuracy (epoch ${10})`;
            }
          }
        }
        prob_accuracy_view.plot(false, true);


        //// option 1: animation, TODO debug
        function f(t){
          return Math.sqrt(t);
        }
        if (window.intervalId){
          clearInterval(window.intervalId);
        }
        let x0 = prob_accuracy_view.x;
        let y0 = prob_accuracy_view.y;
        let c=0;
        let steps = 10;
        window.intervalId = window.setInterval(()=>{
          if (c<steps){
            prob_accuracy_view.x = x0.map((xi,i)=>xi+(xDest[i]-xi)*f(c/steps));
            prob_accuracy_view.y = y0.map((yi,i)=>yi+(yDest[i]-yi)*f(c/steps));
            prob_accuracy_view.plot(true, false);
          }else{
            if (window.intervalId){
              clearInterval(window.intervalId);
            }
          }
          c+=1;
        }, 40);
        //// option 2: no animation
        // prob_accuracy_view.y = yDest;
        // prob_accuracy_view.x = xDest;
        
        prob_accuracy_view.plot(true, false);

        // if(prob_accuracy_view.parent !== null){
        //   prob_accuracy_view.parent.select(prob_accuracy_view);
        // }
        // 
        if(prob_accuracy_view.brush_rect !== undefined){
          prob_accuracy_view.select(...prob_accuracy_view.brush_rect);
        }
      });//slider end

      prob_accuracy_view.graphView = window.gv;

      window.prob_accuracy_view = prob_accuracy_view;

      window.gv.svg.moveToFront();
      window.controller.div.moveToFront();
    });
  });
};






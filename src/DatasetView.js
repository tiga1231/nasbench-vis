import * as d3 from "d3";
import * as utils from './utils';
import { LinkedView } from "./LinkedView";
import { LinkedViewController } from "./LinkedViewController";
import { GraphView } from "./GraphView";
import { GrandTourView } from "./grandtour/GrandTourView";


export class DatasetView{
  constructor(container){

    // let embedding_fn = './data/nas-201-presoftmax-2.json';
    // let embedding_fn = './data/nas-201-confusion.json';
    // let embedding_fn = './data/nas-201-arch.json';
    // let grandtour_fn = 'data/nas-201-activations-softmax.bin';
    let embedding_fn = './data/nas-201-softmax.json';
    let grandtour_fn = './data/nas-201-activations-presoftmax.bin';

    this.container = container;
    this.controller = new LinkedViewController();

    d3.json(embedding_fn).then(data=>{
      data.ops = data.archs.map(a=>{
        let ops = a.match(/\|(\S+)~0\|\+\|(\S+)~0\|(\S+)~1\|\+\|(\S+)~0\|(\S+)~1\|(\S+)~2\|/).slice(1,7);
        return ops;
      });
      this.data = data;

      this.create_graph_view(data.ops, this.container);
      this.create_embedding_view(data, this.container, this.controller);
      this.embedding_view.graphView = this.graphView;

      utils.loadBin(grandtour_fn, (activations, _kwargs)=>{
        utils.loadBin('data/nas-201-labels.bin', (labels, _kwargs)=>{
          this.create_grand_tour_view(activations, labels, this.container);
        });//loadBin nas-201-labels ends
      });//loadBin grandtour_fn ends

    });
  } // constructor ends



  create_grand_tour_view(activations, labels, container){
    let grandTourData = {};
    activations = new Float32Array(activations);
    activations = utils.reshape(activations, [15625, 1000, 10]);
    grandTourData.positions = activations;
    
    labels = Array.from(new Uint8Array(labels));
    grandTourData.labels = labels;

    //draw grand tour
    let sc = d3.scaleOrdinal(d3.schemeCategory10);
    let position = grandTourData.positions[0];
    let color = labels.map(l=>{
      let c = d3.rgb(sc(l));
      return [c.r, c.g, c.b, 255];
    });

    let width = container.node().clientWidth/2;
    let height = container.node().clientHeight;

    let canvas = container
    .append('div')
    .style('position', 'relative')
    .style('display', 'inline')
    .append('canvas')
    .attr('id', 'grandtour')
    .attr('width', width * devicePixelRatio)
    .attr('height', height * devicePixelRatio)
    // .style('position', 'absolute')
    .style('width', width)
    .style('height', height);

    let gtv = new GrandTourView({
      canvas: canvas,
      position: position,
      dataObj: grandTourData,
      color: color,
      handle: true,
      brush: true,
      pointSize: 8.0,
      scaleMode: 'center',
    });
    this.grandtourView = gtv;
    this.embedding_view.grandtourView = gtv;
  }



  create_embedding_view(data, container, controller){
    let viridis = d3.interpolateViridis;
    let x,y;
    let sc = d3.scaleLinear()
    .domain([95,85,80,46,10])
    .range([
      viridis(1.0), viridis(0.4), viridis(0.4), 
      viridis(0.1), viridis(0)
    ]);

    let div = container.append('div')
    .style('width', container.node().clientWidth / 2)
    .style('height', container.node().clientHeight - 150 - 5);

    let n = data['archs'].length;
    let kwargs = {
      container: div,
      pointSize: 3.0,
      parent: controller,
      margin: [0.1, 0.95, 0.1, 0.95],//[left, right, bottom, top]
      colors: data.accuracies.map(d=>{
        let c = d3.color(sc(d));
        return [c.r/255.0, c.g/255.0, c.b/255.0];
      }),
      zoom: true,
      brush: false,
    };
    x = data['embeddings'].map(d=>d[0]);
    y = data['embeddings'].map(d=>d[1]);
    let embedding_view = new LinkedView(x, y, kwargs);

    this.embedding_view = embedding_view;

  }//create_embedding_view ends



  create_graph_view(data, container){
    let gv_svg = container
      .append('svg')
      .attr('width', container.node().clientWidth/2)
      .attr('height', 150)
      .style('background', d3.rgb(...utils.bg_color.slice(0,3).map(d=>parseInt(d*255))));
    let gv = new GraphView({
      svg: gv_svg,
      data: data,
    });
    window.addEventListener('resize', ()=>{
      gv_svg.attr('width', container.node().clientWidth/2 - 5);
    });
    this.graphView = gv;
  }//create_graph_view ends
  
  

} //class ends

import * as d3 from "d3";
import * as utils from './utils';
import { LinkedView } from "./LinkedView";
import { LinkedViewController } from "./LinkedViewController";
import { GraphView } from "./GraphView";
import { REA } from "./REA";
// import { GrandTourView } from "./grandtour/GrandTourView";

export class REAView{
  constructor(container){
    this.epoch = 0;
    this.shouldAutoNextEpoch = false;

    this.container = container;
    this.controller = new LinkedViewController();

    // let embedding_fn = './data/nas-201-softmax.json';
    let embedding_fn = './data/nas-201-presoftmax-2.json';

    d3.json(embedding_fn).then(data=>{
      data.ops = data.archs.map(a=>{
        let ops = a.match(/\|(\S+)~0\|\+\|(\S+)~0\|(\S+)~1\|\+\|(\S+)~0\|(\S+)~1\|(\S+)~2\|/).slice(1,7);
        return ops;
      });
      this.data = data;
      this.rea = new REA(data.ops, this.data.accuracies);
      this.reaHistory = this.rea.evolve(250, 40, 10);//nEpoch, nIndividual, sampleSize

      this.create_graph_view(data.ops, this.container);
      this.create_embedding_view(data, this.container, this.controller);
      this.embeddingView.graphView = this.graphView;
      this.create_slider(this.container);
      this.create_button(this.container);
      this.create_dummy_div(this.container, 
        ()=>this.container.node().clientWidth/2, 
        ()=>400);
    });
  }



  create_dummy_div(container, widthFunc, heightFunc){
    let dummy_div = container.append('div')
    .style('width', widthFunc())
    .style('height', heightFunc());

    window.addEventListener('resize', ()=>{
      dummy_div
      .style('width', widthFunc())
      .style('height', heightFunc());
    });
  }



  create_slider(container){
    let slider = container
    .append('input')
    .attr('type', 'range')
    .attr('class', 'slider')
    .attr('min', 0)
    .attr('max', 249)
    .attr('value', 0)
    .attr('step', 1)
    .on('input', (epoch, caller)=>{
      epoch = epoch || +slider.property('value');
      this.epoch = epoch;

      if(caller !== 'playButton'){
        this.shouldAutoNextEpoch = false;
        this.playButton.attr('class', 'play-button fa fa-play');
        this.playButton.text('Play');
        cancelAnimationFrame(this.animId);
        this.animId = -1;
      }

      let nindividual = this.reaHistory.nindividual;
      let history = this.reaHistory.history[epoch];
      let population = this.reaHistory.populationHistory[epoch];
      let best = this.reaHistory.bestHistory[epoch][1][0];
      let frountier = this.reaHistory.frontierHistory[epoch];
      let n = this.rea.archs.length;

      let viridis = d3.interpolateViridis;
      let sc = d3.scaleLinear()
      .domain([-1, 0, 1, 2, 3])
      .range([
        d3.rgb(...utils.bg_color.slice(0,3).map(d=>d*255)), 
        viridis(0.5), 
        viridis(0.6), 
        viridis(1), 
        'white',
        ]);
      let z = d3.range(n).map(i=>{
        let res;
        if(i==best){
          res = 3;
        }else if(population.has(i)){
          res = 2;
        // }else if(frountier.has(i)){
        //   res = 1;
        }else if(history.has(i)){
          res = 0;
        }else{
          res = -1; //backgorund color
        }
        return res;
      });
      let zorder = utils.zip(z, d3.range(n)).sort((a,b)=>a[0]-b[0]).map(d=>d[1]);
      this.embeddingView.colors = z.map(zi=>{
        let c = d3.color(sc(zi));
        return [c.r/255, c.g/255, c.b/255];
      });
      this.embeddingView.plotColor(zorder);
    });//slider end
    this.slider = slider;
  }

  create_button(container){
    let playButton = container
      .append('p')
      .text('Play')
      .style('color', 'white')
      .attr('class', this.shouldAutoNextEpoch?'play-button fa fa-pause':'play-button fa fa-play');
    playButton 
    .on('mouseover', function() {
      d3.select(this).style('opacity', 1);
    })
    .on('mouseout', function() {
      d3.select(this).style('opacity', 0.7);
    })
    .on('click', ()=>{
      this.shouldAutoNextEpoch = !this.shouldAutoNextEpoch;
      //change button style
      if (this.shouldAutoNextEpoch) {
        playButton.attr('class', 'play-button fa fa-pause');
        playButton.text('Pause');
      } else {
        playButton.attr('class', 'play-button fa fa-play');
        playButton.text('Play');
      }
      //button action
      if(this.shouldAutoNextEpoch){
        let anim = ()=>{
          this.epoch += 1;
          if(this.epoch >= 250){
            this.epoch = 0;
          }
          this.slider.property('value',this.epoch);
          this.slider.on('input')(this.epoch, 'playButton');
          this.animId = requestAnimationFrame(anim);
        }
        this.animId = requestAnimationFrame(anim);
      }else{
        cancelAnimationFrame(this.animId);
        this.animId = -1;
      }
    });
    this.playButton = playButton;
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
    .style('width', container.node().clientWidth/2 - 5)
    .style('height', container.node().clientHeight - 150 - 50);
    window.addEventListener('resize', ()=>{
      div
      .style('width', container.node().clientWidth/2 - 5)
      .style('height', container.node().clientHeight - 150 - 50);
    });
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
    let embeddingView = new LinkedView(x, y, kwargs);

    this.embeddingView = embeddingView;

  }//create_embedding_view ends



  create_graph_view(data, container){
    let gv_svg = container
      .append('svg')
      .attr('width', container.node().clientWidth/2 - 5)
      .attr('height', 150)
      .style('background', d3.rgb(...utils.bg_color.slice(0,3).map(d=>parseInt(d*255))));
    let gv = new GraphView({
      svg: gv_svg,
      data: data,
    });
    window.addEventListener('resize', ()=>{
      gv.width = container.node().clientWidth/2 - 5;
      gv.height = 150;
      gv_svg
      .attr('width', gv.width)
      .attr('height', gv.height);
      gv.updateScale(gv.width, gv.height);
      gv.plot();
    });
    this.graphView = gv;
  }//create_graph_view ends


}
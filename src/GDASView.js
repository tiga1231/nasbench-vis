import * as d3 from "d3";
import * as utils from './utils';
import { LinkedView } from "./LinkedView";
import { LinkedViewController } from "./LinkedViewController";
import { GraphView } from "./GraphView";
import { GrandTourView } from "./grandtour/GrandTourView";



export class GDASView{
  constructor(container){
    this.container = container;
    this.controller = new LinkedViewController();

    let prefs_fn = 'data/nas-201-GDAS-prefs.bin';
    let GDAS_accuracies_fn = './data/nas-201-GDAS-accuracies.json';
    let embedding_fn = './data/nas-201-softmax.json';
    let grandtour_fn = './data/nas-201-activations-presoftmax.bin';

    

    d3.json(embedding_fn).then(data=>{
      data.ops = data.archs.map(a=>{
        let ops = a.match(/\|(\S+)~0\|\+\|(\S+)~0\|(\S+)~1\|\+\|(\S+)~0\|(\S+)~1\|(\S+)~2\|/).slice(1,7);
        return ops;
      });
      this.data = data;
      this.create_graph_view(data.ops, this.container);
      this.create_embedding_view(data, this.container, this.controller);
      this.embeddingView.graphView = this.graphView;


      utils.loadBin(prefs_fn, (prefs, _kwargs)=>{
        d3.json(GDAS_accuracies_fn).then(GDAS_accuracies=>{  
          let div = this.container.append('div')
          .style('width', this.container.node().clientWidth/2 - 15)
          .style('height', this.container.node().clientHeight - 150 - 5);

          this.create_pref_accuracy_view(div, prefs, GDAS_accuracies);
          this.create_slider();
          this.prefAccuracyView.graphView = this.graphView;
            // window.controller.div.moveToFront();
        });
      });



    });

    
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
    .style('height', container.node().clientHeight - 150 - 15);
    window.addEventListener('resize', ()=>{
      div
      .style('width', container.node().clientWidth/2 - 5)
      .style('height', container.node().clientHeight - 150 - 15);
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



  create_pref_accuracy_view(container, prefs, GDAS_accuracies){
    prefs = new Float32Array(prefs);
    prefs = utils.reshape(prefs, [250, 15625]);
    let kwargs = {
      container: container,
      id: 'pref_accuracy_view',
      pointSize: 2.0,
      parent: this.controller,
      margin: [0.1, 0.95, 0.1, 0.95],
      colors: '#5cafe6',
      zoom: false,
      brush: true,
      xlim: [-14, -6],
      // xlim: [-500, 16500],
      ylim: [0,0.6],
      xLabel: 'Preference',
      yLabel: 'Valid accuracy',
    };
    let log_prefs = math.log(prefs);
    let epoch = 10;
    let x = log_prefs[epoch];
    let y = GDAS_accuracies[epoch];
    let prefAccuracyView = new LinkedView(x, y, kwargs);
    this.prefAccuracyView = prefAccuracyView;
    this.log_prefs = log_prefs;
    this.GDAS_accuracies = GDAS_accuracies;
  }

  create_slider(){
    let slider = d3.select('#'+this.prefAccuracyView.id)
    // .insert('input', '#prob_accuracy_view-overlay + *')
    .append('input')
    .attr('type', 'range')
    .attr('class', 'slider')
    .attr('min', 10)
    .attr('max', 249)
    .attr('value', 10)
    .attr('step', 1)
    .on('input', ()=>{
      let epoch = +slider.property('value');

      //update embeddingView
      let viridis = d3.interpolateViridis;
      let sc = d3.scaleQuantile()
      // .domain([-13,-7])
      .domain(d3.extent(this.log_prefs[epoch]))
      .range(d3.range(7).map(i=>viridis(i/7)));
      this.embeddingView.colors = this.log_prefs[epoch].map(d=>{
        let c = d3.color(sc(d));
        return [c.r/255, c.g/255, c.b/255];
      });
      // this.embeddingView.plot(true, false);
      this.embeddingView.plotColor();


      //update prefAccuracyView
      let xDest = this.log_prefs[epoch];
      this.prefAccuracyView.xLabel = `Preference (epoch ${epoch})`;

      let yDest = undefined;
      if(epoch in this.GDAS_accuracies){
        yDest = this.GDAS_accuracies[epoch];
        this.prefAccuracyView.yLabel = `Valid Accuracy (epoch ${epoch})`;
      }else{
        //find a 'floor' epoch that has a record;
        for(let e=epoch; e>=0; e--){
          if(e in this.GDAS_accuracies){
            yDest = this.GDAS_accuracies[e];
            this.prefAccuracyView.yLabel = `Valid Accuracy (epoch ${e})`;
            break;
          }
          if(e==0){
            yDest = Array(this.GDAS_accuracies[10].length).fill(0.1);
            this.prefAccuracyView.yLabel = `Valid Accuracy (epoch ${10})`;
          }
        }
      }
      this.prefAccuracyView.plot(false, true);


      //// option 1: animation
      function f(t){
        return Math.sqrt(t);
      }
      if (window.intervalId){
        clearInterval(window.intervalId);
      }
      let x0 = this.prefAccuracyView.x;
      let y0 = this.prefAccuracyView.y;
      let c=0;
      let steps = 10;
      window.intervalId = window.setInterval(()=>{
        if (c<steps){
          this.prefAccuracyView.x = x0.map((xi,i)=>xi+(xDest[i]-xi)*f(c/steps));
          // this.prefAccuracyView.x = xDest;
          this.prefAccuracyView.y = y0.map((yi,i)=>yi+(yDest[i]-yi)*f(c/steps));
          // this.prefAccuracyView.plot(true, false);
          this.prefAccuracyView.plotPosition();
        }else{
          if (window.intervalId){
            clearInterval(window.intervalId);
          }
        }
        c+=1;
      }, 10);
      //// option 2: no animation
      // this.prefAccuracyView.y = yDest;
      // this.prefAccuracyView.x = xDest;
      // this.prefAccuracyView.plotPosition();
      
      this.prefAccuracyView.parent.hover(this.prefAccuracyView.parent.hoverIndex);
      
      // if(prob_accuracy_view.parent !== null){
      //   prob_accuracy_view.parent.select(prob_accuracy_view);
      // }
      
      if(this.prefAccuracyView.brush_rect !== undefined){
        this.prefAccuracyView.select(...this.prefAccuracyView.brush_rect);
      }
    });//slider end

    slider.attr('list', 'steplist0');
    let steplist = slider.selectAll('datalist')
    .data([0])
    .enter()
    .append('datalist')
    .attr('id', 'steplist0');
    steplist = slider.selectAll('datalist');
    steplist.selectAll('option')
    .data(Object.keys(this.GDAS_accuracies))
    .enter()
    .append('option');
    steplist.selectAll('option')
    .text(d=>d);

    this.slider = slider;
  }
}
   
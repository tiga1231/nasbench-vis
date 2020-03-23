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
      this.embedding_view.graphView = this.graphView;


      utils.loadBin(prefs_fn, (prefs, _kwargs)=>{
        d3.json(GDAS_accuracies_fn).then(GDAS_accuracies=>{  
          let div = this.container.append('div')
          .style('width', this.container.node().clientWidth/2 - 5)
          .style('height', this.container.node().clientHeight - 150 - 5);

          this.create_GDAS_view(div, prefs, GDAS_accuracies);
          this.prob_accuracy_view.graphView = this.graphView;
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
    .style('height', container.node().clientHeight - 150 - 10);
    window.addEventListener('resize', ()=>{
      div
      .style('width', container.node().clientWidth/2 - 5)
      .style('width', container.node().clientHeight - 150 - 10);
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
    let embedding_view = new LinkedView(x, y, kwargs);

    this.embedding_view = embedding_view;

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



  create_GDAS_view(container, prefs, GDAS_accuracies){
    prefs = new Float32Array(prefs);
    prefs = utils.reshape(prefs, [250, 15625]);
    let kwargs = {
      container: container,
      id: 'prob_accuracy_view',
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

      let xDest = log_prefs[epoch];
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

    slider.attr('list', 'steplist0');
    let steplist = slider.selectAll('datalist')
    .data([0])
    .enter()
    .append('datalist')
    .attr('id', 'steplist0');
    steplist = slider.selectAll('datalist');
    steplist.selectAll('option')
    .data(Object.keys(GDAS_accuracies))
    .enter()
    .append('option');
    steplist.selectAll('option')
    .text(d=>d);
    this.prob_accuracy_view = prob_accuracy_view;
  }
}
   
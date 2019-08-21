import * as d3 from "d3";
import { LinkedView } from "./LinkedView";
import { LinkedViewController } from "./LinkedViewController";
import {zip} from './utils';

window.onload = function(){
  // d3.json('./data/data-10k.json')
  // d3.json('./data/data-20k.json')
  d3.json('./data/data-full.json')
  .then(data=>{
      window.data = data;

      //for debugging with small data
      for(let k in data){
        data[k] = data[k].slice(0,10000);
      }

      let x,y, lv;
      let n = data['final_training_time'].length;

      let controller = new LinkedViewController();
      
      let kwargs_base = {
        width: window.innerWidth/4, 
        height: window.innerHeight/3, 
        pointSize: 8.0,
        parent: controller,
        margin: [0.1, 0.95, 0.1, 0.95],
      };

      let kwargs;
      kwargs = Object.assign({}, kwargs_base);
      kwargs.ylim = [0,1];

      x = data['final_training_time'];
      y = data['4_final_validation_accuracy'];
      lv = new LinkedView(x, y, kwargs);

      x = data['final_training_time'];
      y = data['12_final_validation_accuracy'];
      lv = new LinkedView(x, y, kwargs);

      x = data['final_training_time'];
      y = data['36_final_validation_accuracy'];
      lv = new LinkedView(x, y, kwargs);

      x = data['final_training_time'];
      y = data['108_final_validation_accuracy'];
      lv = new LinkedView(x, y, kwargs);

      d3.select('body').append('br');

      x = data['trainable_parameters'];
      y = data['4_final_validation_accuracy'];
      lv = new LinkedView(x, y, kwargs);

      x = data['trainable_parameters'];
      y = data['12_final_validation_accuracy'];
      lv = new LinkedView(x, y, kwargs);

      x = data['trainable_parameters'];
      y = data['36_final_validation_accuracy'];
      lv = new LinkedView(x, y, kwargs);

      x = data['trainable_parameters'];
      y = data['108_final_validation_accuracy'];
      lv = new LinkedView(x, y, kwargs);

      d3.select('body').append('br');


      kwargs = Object.assign({}, kwargs_base);

      x = data['trainable_parameters'];
      y = data['final_training_time'];
      lv = new LinkedView(x, y, kwargs);


      x = zip(
        Array(n).fill(4),
        Array(n).fill(12),
        Array(n).fill(36),
        Array(n).fill(108)
      );
      y = zip(
        data['4_final_validation_accuracy'],
        data['12_final_validation_accuracy'],
        data['36_final_validation_accuracy'],
        data['108_final_validation_accuracy']
      );
      kwargs = Object.assign({}, kwargs_base);
      kwargs.mode = 'line';
      kwargs.xlim = [0,108];
      kwargs.ylim = [0,1];
      let lv2 = new LinkedView(x, y, kwargs);


      x = zip(
        data['final_training_time'].map(d=>d*4/108),
        data['final_training_time'].map(d=>d*12/108),
        data['final_training_time'].map(d=>d*36/108),
        data['final_training_time'].map(d=>d*108/108),
      );
      y = zip(
        data['4_final_validation_accuracy'],
        data['12_final_validation_accuracy'],
        data['36_final_validation_accuracy'],
        data['108_final_validation_accuracy'],
      );
      kwargs = Object.assign({}, kwargs_base);
      kwargs.mode = 'line';
      kwargs.xlim = [-100,5500];
      kwargs.ylim = [0,1];
      lv2 = new LinkedView(x, y, kwargs);


      window.x = x;
      window.y = y;
      window.lv = lv;
      window.lv2 = lv2;
      window.controller = controller;
  });
  // global modules for debug in browser
  window.d3 = d3;
}






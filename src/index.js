import * as d3 from "d3";
import { LinkedView } from "./LinkedView";
import { LinkedViewController } from "./LinkedViewController";


window.onload = function(){
  // d3.json('./data/data-10k.json')
  d3.json('./data/data-20k.json')
  // d3.json('./data/data-full.json')
  .then(data=>{
      window.data = data;

      let x,y, lv;
      let width = window.innerWidth/4-1;
      let height = window.innerHeight/2;
      let pointSize = 10.0;

      let controller = new LinkedViewController();
      let kwargs = {
        width, 
        height, 
        pointSize,
        parent: controller,
        ylim: [0.0, 1.0],

      };

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


      window.lv = lv;
      window.controller = controller;
  });
  // global modules for debug in browser
  window.d3 = d3;
}






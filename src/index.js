import * as d3 from "d3";
import { LinkedView } from "./LinkedView";


window.onload = function(){
  d3.json('./data/data.json')
  .then(data=>{
      window.data = data;

      let x,y;
      let width = window.innerWidth/2-10;
      let height = window.innerHeight/2-10;
      let pointSize = 10.0;

      x = data['final_training_time'];
      y = data['108_final_validation_accuracy'];
      let lv = new LinkedView(x, y, {
        width, 
        height, 
        pointSize,
      });

      x = data['final_training_time'];
      y = data['36_final_validation_accuracy'];

      let lv2 = new LinkedView(x, y, {
          width, 
          height, 
          pointSize,
      });


      window.lv = lv;
      window.lv2 = lv2;
  });
  // global modules for debug in browser
  window.d3 = d3;
}






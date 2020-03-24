import "./style/style.css";

import * as d3 from "d3";
import * as utils from './utils';

import { DatasetView } from "./DatasetView";
import { GDASView } from "./GDASView";
import { REAView } from "./REAView";


// global modules for debugging in the browser
window.d3 = d3;
window.utils = utils;
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};



const navBarHeight = 45;
function create_nav_bar(){
  let nav = d3.select('body')
  .append('nav')
  .style('height', navBarHeight);
  let navItems = nav
  .selectAll('.navItem')
  .data(['NAS-Bench-201', 'GDAS', 'REA'])
  .enter()
  .append('button')
  .attr('class', 'navItem');
  navItems = nav.selectAll('.navItem')
  .style('height', navBarHeight * 0.80)
  .text(d=>d);

  return navItems;
  
}


window.views = {};
function switchView(mode){

  //hide all views
  for (let key of Object.keys(window.views)){
    window.views[key].container.style('display', 'none');
  }

  if(mode in window.views){ //load old one
    window.view = window.views[mode];
    window.views[mode].container.style('display', '');
  }else{ //create for the first time
    
    let container = d3.select('body')
    .append('div')
    .attr('class', 'root')
    .attr('id', mode)
    .style('width', window.innerWidth)
    .style('height', window.innerHeight - navBarHeight);
    window.addEventListener('resize', ()=>{
      container
      .style('width', window.innerWidth)
      .style('height', window.innerHeight - navBarHeight);
    });

    if(mode == 'NAS-Bench-201'){
      window.view = new DatasetView(container);
    }else if(mode == 'GDAS'){
      window.view = new GDASView(container);
    }else if(mode == 'REA'){
      window.view = new REAView(container);
    }
    window.views[mode] = window.view;
  }

  
}


window.onload = function(){

  let navItems = create_nav_bar();
  

  navItems.on('click', function(d){
    let buttonText = d;
    // let buttonText = d3.select(this).text();
    console.log('clicked', buttonText);
    let mode = buttonText;
    switchView(mode);
  });

  // switchView(container, 'NAS-Bench-201');
  switchView('REA');

}; // window.onload end



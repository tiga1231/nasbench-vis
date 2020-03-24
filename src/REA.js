import * as _ from 'underscore';
import * as d3 from "d3";

export class REA{
  constructor(archs, accuracies){
    this.OPS = ['none', 'skip_connect', 'nor_conv_1x1', 'nor_conv_3x3', 'avg_pool_3x3'];
    this.archs = archs;

    this.arch2index = {};
    for (let i=0; i<this.archs.length; i++){
      let archStr = this.archs[i].join('+');
      this.arch2index[archStr] = i;
    }

    this.nedge = this.archs[0].length;
    this.accuracies = accuracies;
  }


  mutate(archIndex){
    let arch = this.archs[archIndex].slice(0);
    let randomEdge = Math.floor(Math.random()*this.nedge);
    arch[randomEdge] = _.sample(this.OPS, 1);
    let archStr = arch.join('+');
    let newIndex = this.arch2index[archStr]
    return newIndex;
  }


  init(nindividual){
    this.population = _.sample(d3.range(this.archs.length), nindividual);
    this.history = this.population.slice(0);
  }


  step(population, sampleSize){
    let sample = _.sample(population, sampleSize);
    let [bestSample, acc] = this.best(sample);
    let newArch = this.mutate(bestSample);
    population.push(newArch);
    this.history.push(newArch);

    population.shift();
    return population;
  }


  best(population){
    let best = -1;
    let bestAccuracy = -1;
    for (let i=0; i<population.length; i++){
      let acc = this.accuracies[population[i]];
      if (acc > bestAccuracy){
        best = population[i];
        bestAccuracy = acc;
      }
    }
    return [best, bestAccuracy];
  }


  neighbors(i){
    let res = [];
    let arch = this.archs[i];
    for(let i=0; i<this.nedge; i++){
      let neighbor_prototype = arch.slice(0);
      for(let op of this.OPS){
        neighbor_prototype[i] = op;
        let archStr = neighbor_prototype.join('+');
        res.push(this.arch2index[archStr]);
      }
    }
    return res;
  }


  closure(population){
    let res = [];
    for(let p of population){
      res = res.concat(this.neighbors(p));
    }
    return res;
  }


  evolve(ncycle=2, nindividual=10, nsample=2){
    this.nindividual = nindividual;
    let populationHistory = [];
    let bestHistory = [];
    let frontierHistory = [];
    let history = [];

    this.init(nindividual);
    for (let i=0; i<ncycle; i++){
      let newPopulation = this.step(this.population, nsample);
      this.population = newPopulation;
      populationHistory.push(this.population.slice(0));
      bestHistory.push([
        this.best(this.population), 
        this.best(this.history)
      ]);
      frontierHistory.push(this.closure(this.population));
      history.push(this.history.slice(0));
    }
    return {
      'history': history.map(d=>new Set(d)),
      'populationHistory': populationHistory.map(d=>new Set(d)), 
      'bestHistory': bestHistory,
      'frontierHistory': frontierHistory.map(d=>new Set(d)),
      'nindividual': nindividual,
    };
  }





}
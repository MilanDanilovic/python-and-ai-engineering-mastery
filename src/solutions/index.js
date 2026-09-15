import week1 from './week1.js';
import week2 from './week2.js';
import week3 from './week3.js';
import week4 from './week4.js';
import week5 from './week5.js';
import week6 from './week6.js';
import week7 from './week7.js';
import week8 from './week8.js';

export const solutions = {...week1, ...week2, ...week3, ...week4, ...week5, ...week6, ...week7, ...week8};
export const taskIndexes = {'simple-1':0, 'simple-2':1, practical:2, debugging:3};
export function solutionFor(milestoneId, taskId) {
 return solutions[milestoneId]?.[taskIndexes[taskId]];
}

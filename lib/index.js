'use strict';

const path = require('path');
const loaderUtils = require('loader-utils');
const utils = require('./utils');
const processDemo = require('./process-demo');
const processDoc = require('./process-doc');

module.exports = function(content) {
  this.cacheable && this.cacheable();
  const webpackRemainingChain = loaderUtils.getRemainingRequest(this).split('!');
  const fullPath = webpackRemainingChain[webpackRemainingChain.length - 1];
  const fileName = path.relative('./', fullPath);
  const demoDir = this.query.demoDir || 'demo';
  const isDemo = path.dirname(fileName).endsWith(demoDir);
  if (isDemo) {
    const processedDemo = processDemo(fileName, content);
    const stringifiedDemo = utils.stringify(processedDemo);

    return stringifiedDemo.imports +
      '\nmodule.exports = ' + stringifiedDemo.content;
    //return 'module.exports = ' + stringifiedDemo.content;
  }

  const processedDoc = processDoc(fileName, content);
  const stringifiedDoc = utils.stringify(processedDoc);
  return stringifiedDoc.imports +
    'module.exports = ' + stringifiedDoc.content;
};

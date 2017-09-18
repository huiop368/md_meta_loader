'use strict';

const MT = require('mark-twain');
const Prism = require('prismjs');
const JsonML = require('jsonml.js');
require('./prism-autoit')(Prism);
const devil = require('./devil');

const nunjucks = require('nunjucks');
nunjucks.configure({ autoescape: false });

const babel = require('babel-core');
const babelrc = {
  presets: ['es2015', 'react', 'stage-0'].map((m) => {
    return require.resolve(`babel-preset-${m}`);
  }),
};

const fs = require('fs');
const path = require('path');
const tmpl = fs.readFileSync(path.join(__dirname, 'template.html')).toString();

const isIntro = function isIntro(element) {
  const type = element[0];
  return type !== 'pre';
};
const isCode = function isCode(element) {
  const type = element[0];
  return type === 'pre' && element[1].lang === 'jsx';
};
const isWalleCode = function isCode(element) {
  const type = element[0];
  return type === 'pre' && element[1].lang === 'walle';
};
const isCssCode = function isCssCode(element) {
  return element && JsonML.isElement(element) &&
    JsonML.getTagName(element) === 'pre' &&
    JsonML.getAttributes(element).lang === 'css';
};
const isStyleTag = function isStyleTag(element) {
  return element && JsonML.isElement(element) &&
    JsonML.getTagName(element) === 'style';
}
const isStyle = function isStyle(element) {
  return isCssCode(element) || isStyleTag(element);
};
const getCodeChildren = function getCodeChildren(element) {
  return element && element[2][1];
};

module.exports = function processDemo(fileName, content) {
  const fileTree = MT(content);
  const fileContentTree = fileTree.content.slice(1);

  const demo = {};
  const meta = fileTree.meta;
  const component = fileName.split(path.sep)[1];
  demo.id = `components-${component}-demo-${path.basename(fileName, '.md')}`;
  demo.meta = meta;

  const intro = fileContentTree.filter(isIntro);
  let currentLocale = '';
  demo.intro = [];
  intro.forEach((node) => {
    if (node[0] === 'h2') {
      currentLocale = node[1];

      if (Array.isArray(demo.intro)) {
        demo.intro = {};
      }

      demo.intro[node[1]] = [];
      return;
    }
    if (!currentLocale) {
      demo.intro.push(node);
    } else {
      demo.intro[currentLocale].push(node);
    }
  });

  const sourceCode = getCodeChildren(fileContentTree.find(isCode));
  const sourceWalleCode = getCodeChildren(fileContentTree.find(isWalleCode));
  demo.code = sourceCode;
  demo.highlightedCode = Prism.highlight(sourceCode, Prism.languages.autoit);
  demo.highlightedWalleCode = sourceWalleCode && Prism.highlight(sourceWalleCode, Prism.languages.autoit);
  demo.preview = devil(sourceCode, ['React', 'ReactDOM']);
  const styleNode = fileContentTree.find(isStyle);
  if (isCssCode(styleNode)) {
    demo.style = getCodeChildren(styleNode);
  } else {
    demo.style = JsonML.isElement(styleNode) && JsonML.getChildren(styleNode)[0];
  }
  demo.highlightedStyle = isCssCode(styleNode) ?
    Prism.highlight(demo.style || '', Prism.languages.autoit) :
    undefined;

  return demo;
};

'use strict';

const R = require('ramda');
const MT = require('mark-twain');
const devil = require('./devil');
const Prism = require('prismjs');
require('./prism-autoit')(Prism);
const JsonML = require('jsonml.js/lib/utils');
const JsonMLs = require('jsonml.js/lib/dom');

function getCode(node) {
  return JsonML.getChildren(
    JsonML.getChildren(node)[0] || ''
  )[0] || '';
}

const convertInlineCode = R.map((node) => {
  const tagName = JsonML.getTagName(node);
  const lang = JsonML.getAttributes(node, true).lang;
  if (tagName === 'pre' && lang === '__react') {
    return devil(getCode(node), ['React', 'ReactDOM']);
  }
  if (tagName === 'pre' && lang !== undefined) {
    const sourceCode = getCode(node);
    const highlightedCode = Prism.highlight(sourceCode, Prism.languages.autoit);
    const highlightedCodeJsonml = JsonMLs.fromHTMLText(highlightedCode)

    return ['pre', { lang: lang, highlighted: highlightedCode !== sourceCode }, ['code'].concat(highlightedCodeJsonml.slice(1))];
  }
  return node;
});

const isIntro = R.complement(R.either(
  (node) => node[0] === 'hr',
  (node) => node[1] === 'API'
));
const isDescription = R.complement((node) => node[1] === 'API');
const parseIntro = R.takeWhile(isIntro);
const parseDescription = R.pipe(
  R.dropWhile(isIntro),
  R.takeWhile(isDescription),
  R.when((nodes) => (nodes[0] || [])[0], R.tail)
);
const parseAPI = R.dropWhile(isDescription);

module.exports = function processDoc(fileName, content) {
  const fileTree = MT(content);
  const fileContentTree = fileTree.content.slice(1);
  const meta = fileTree.meta;
  meta.fileName = fileName;

  const intro = parseIntro(fileContentTree);
  const description = parseDescription(fileContentTree);

  const enhancedDescription = convertInlineCode(
    description.length > 0 ? description : intro
  );

  const api = parseAPI(fileContentTree);
  const enhancedAPI = convertInlineCode(
    api.length > 0 ? api : []
  );

  return {
    meta,
    intro: description.length === 0 ? null : intro,
    description: enhancedDescription,
    api: enhancedAPI,
  };
};

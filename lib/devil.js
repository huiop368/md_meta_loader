'use strict';

const recast = require('recast');
const builders = recast.types.builders;
const parseOptions = {
  parser: require('esprima-fb'),
};

function isImport(node) {
  return node.type === 'ImportDeclaration';
}
function isNotImport(node) {
  return !isImport(node);
}

module.exports = function devil(demo, params) {
  const ast = recast.parse(demo, parseOptions);
  const astProgramBody = ast.program.body;
  const demoImports = astProgramBody.filter(isImport);
  const demoBody = astProgramBody.filter(isNotImport);
  const lastIndex = demoBody.length - 1;
  demoBody[lastIndex] = builders.returnStatement(
    demoBody[lastIndex].expression.arguments[0]
  );

  ast.program.body = demoImports;
  const imports = recast.print(ast).code;

  ast.program.body = demoBody;
  const code = recast.print(ast).code;

  return {
    type: '__devil',
    imports: imports || '',
    body: `function(${(params || []).join(', ')}) {\n${code}\n}`,
  };
};

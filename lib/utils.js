'use strict';

exports.stringify = function stringify(data, d) {
  const depth = d || 1;
  const indent = '  '.repeat(depth);

  let imports = '';
  let output = '';
  if (Array.isArray(data)) {
    output += '[\n';
    data.forEach((item) => {
      const stringifiedItem = stringify(item, depth + 1);
      imports += stringifiedItem.imports;
      output += indent + stringifiedItem.content + ',\n';
    });
    output += indent + ']';
  } else if (data === null) {
    output += 'null';
  } else if (data && data.type === '__devil') {
    imports += data.imports;
    output += data.body;
  } else if (typeof data === 'object') {
    output += '{\n';
    for (const key of Object.keys(data)) {
      const stringifiedValue = stringify(data[key], depth + 1);
      imports += stringifiedValue.imports;
      output += indent + JSON.stringify(key) + ': ' +
        stringifiedValue.content + ',\n';
    }
    output += indent + '}';
  } else if (typeof data === 'string') {
    output += JSON.stringify(data);
  } else {
    output += data;
  }
  return {
    imports: imports.replace(/antd\/lib\//, 'antd\/components\/'),
    content: output,
  };
};

'use strict';

// Minimal glob matcher: supports **, *, and ? on forward-slash paths.
function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        i++;
        if (glob[i + 1] === '/') {
          i++;
          re += '(?:.*/)?';
        } else {
          re += '.*';
        }
      } else {
        re += '[^/]*';
      }
    } else if (c === '?') {
      re += '[^/]';
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${re}$`);
}

function toPosix(p) {
  return String(p).replace(/\\/g, '/').replace(/^\.\//, '');
}

function matchesAny(path, globs) {
  const p = toPosix(path);
  return globs.some((g) => globToRegExp(toPosix(g)).test(p));
}

module.exports = { globToRegExp, matchesAny, toPosix };

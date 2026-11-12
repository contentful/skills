#!/usr/bin/env node
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/version.js
var require_version = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/version.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.versionInfo = exports.version = void 0;
    var version = "16.15.0";
    exports.version = version;
    var versionInfo = Object.freeze({
      major: 16,
      minor: 15,
      patch: 0,
      preReleaseTag: null
    });
    exports.versionInfo = versionInfo;
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/devAssert.js
var require_devAssert = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/devAssert.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.devAssert = devAssert;
    function devAssert(condition, message) {
      const booleanCondition = Boolean(condition);
      if (!booleanCondition) {
        throw new Error(message);
      }
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/isPromise.js
var require_isPromise = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/isPromise.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.isPromise = isPromise;
    function isPromise(value) {
      return typeof (value === null || value === void 0 ? void 0 : value.then) === "function";
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/isObjectLike.js
var require_isObjectLike = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/isObjectLike.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.isObjectLike = isObjectLike;
    function isObjectLike(value) {
      return typeof value == "object" && value !== null;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/location.js
var require_location = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/location.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.getLocation = getLocation;
    exports.getLocations = getLocations;
    function getLocation(source, position) {
      const lineRegexp = /\r\n|[\n\r]/g;
      let line = 1;
      let column = position + 1;
      let match;
      while ((match = lineRegexp.exec(source.body)) && match.index < position) {
        line++;
        column = position + 1 - (match.index + match[0].length);
      }
      return {
        line,
        column
      };
    }
    function getLocations(locations) {
      if (locations.length < 2) {
        return locations.map(({ source, start }) => getLocation(source, start));
      }
      const bySource = /* @__PURE__ */ new Map();
      locations.forEach(({ source, start }, index) => {
        let positions = bySource.get(source);
        if (positions === void 0) {
          positions = [];
          bySource.set(source, positions);
        }
        positions.push({
          position: start,
          index
        });
      });
      const result = new Array(locations.length);
      for (const [source, positions] of bySource) {
        const lineRegexp = /\r\n|[\n\r]/g;
        let match = lineRegexp.exec(source.body);
        let line = 1;
        let lastLineStart = 0;
        positions.sort((a, b) => a.position - b.position);
        for (const { position, index } of positions) {
          while (match !== null && match.index < position) {
            lastLineStart = match.index + match[0].length;
            line++;
            match = lineRegexp.exec(source.body);
          }
          result[index] = {
            line,
            column: position + 1 - lastLineStart
          };
        }
      }
      return result;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/printLocation.js
var require_printLocation = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/printLocation.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.printLocation = printLocation;
    exports.printSourceLocation = printSourceLocation;
    var _location = require_location();
    function printLocation(location) {
      return printSourceLocation(
        location.source,
        (0, _location.getLocation)(location.source, location.start)
      );
    }
    function printSourceLocation(source, sourceLocation) {
      const firstLineColumnOffset = source.locationOffset.column - 1;
      const body = "".padStart(firstLineColumnOffset) + source.body;
      const lineIndex = sourceLocation.line - 1;
      const lineOffset = source.locationOffset.line - 1;
      const lineNum = sourceLocation.line + lineOffset;
      const columnOffset = sourceLocation.line === 1 ? firstLineColumnOffset : 0;
      const columnNum = sourceLocation.column + columnOffset;
      const locationStr = `${source.name}:${lineNum}:${columnNum}
`;
      const lines = body.split(/\r\n|[\n\r]/g);
      const locationLine = lines[lineIndex];
      if (locationLine.length > 120) {
        const subLineIndex = Math.floor(columnNum / 80);
        const subLineColumnNum = columnNum % 80;
        const subLines = [];
        for (let i = 0; i < locationLine.length; i += 80) {
          subLines.push(locationLine.slice(i, i + 80));
        }
        return locationStr + printPrefixedLines([
          [`${lineNum} |`, subLines[0]],
          ...subLines.slice(1, subLineIndex + 1).map((subLine) => ["|", subLine]),
          ["|", "^".padStart(subLineColumnNum)],
          ["|", subLines[subLineIndex + 1]]
        ]);
      }
      return locationStr + printPrefixedLines([
        // Lines specified like this: ["prefix", "string"],
        [`${lineNum - 1} |`, lines[lineIndex - 1]],
        [`${lineNum} |`, locationLine],
        ["|", "^".padStart(columnNum)],
        [`${lineNum + 1} |`, lines[lineIndex + 1]]
      ]);
    }
    function printPrefixedLines(lines) {
      const existingLines = lines.filter(([_, line]) => line !== void 0);
      const padLen = Math.max(...existingLines.map(([prefix]) => prefix.length));
      return existingLines.map(([prefix, line]) => prefix.padStart(padLen) + (line ? " " + line : "")).join("\n");
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/error/GraphQLError.js
var require_GraphQLError = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/error/GraphQLError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.GraphQLError = void 0;
    exports.formatError = formatError;
    exports.printError = printError;
    var _isObjectLike = require_isObjectLike();
    var _location = require_location();
    var _printLocation = require_printLocation();
    function toNormalizedOptions(args) {
      const firstArg = args[0];
      if (firstArg == null || "kind" in firstArg || "length" in firstArg) {
        return {
          nodes: firstArg,
          source: args[1],
          positions: args[2],
          path: args[3],
          originalError: args[4],
          extensions: args[5]
        };
      }
      return firstArg;
    }
    var GraphQLError = class _GraphQLError extends Error {
      /**
       * An array of `{ line, column }` locations within the source GraphQL document
       * which correspond to this error.
       *
       * Errors during validation often contain multiple locations, for example to
       * point out two things with the same name. Errors during execution include a
       * single location, the field which produced the error.
       *
       * Enumerable, and appears in the result of JSON.stringify().
       */
      /**
       * An array describing the JSON-path into the execution response which
       * corresponds to this error. Only included for errors during execution.
       *
       * Enumerable, and appears in the result of JSON.stringify().
       */
      /** An array of GraphQL AST Nodes corresponding to this error. */
      /**
       * The source GraphQL document for the first location of this error.
       *
       * Note that if this Error represents more than one node, the source may not
       * represent nodes after the first node.
       */
      /**
       * An array of character offsets within the source GraphQL document
       * which correspond to this error.
       */
      /** Original error that caused this GraphQLError, if one exists. */
      /** Extension fields to add to the formatted error. */
      /**
       * Creates a GraphQLError instance.
       * @param message - Human-readable error message.
       * @param options - Error metadata such as source locations, response path, original error, and extensions.
       * This positional-arguments constructor overload is deprecated. Use the
       * `GraphQLError(message, options)` overload instead.
       * @example
       * ```ts
       * import { Kind } from 'graphql/language';
       * import assert from 'node:assert/strict';
       * // Create an error from AST nodes and response metadata.
       * import { parse } from 'graphql/language';
       * import { GraphQLError } from 'graphql/error';
       *
       * const document = parse('{ greeting }');
       * const operation = document.definitions[0];
       * assert(operation.kind === Kind.OPERATION_DEFINITION);
       * const fieldNode = operation.selectionSet.selections[0];
       * const error = new GraphQLError('Cannot query this field.', {
       *   nodes: fieldNode,
       *   path: ['greeting'],
       *   extensions: { code: 'FORBIDDEN' },
       * });
       *
       * error.message; // => 'Cannot query this field.'
       * error.locations; // => [{ line: 1, column: 3 }]
       * error.path; // => ['greeting']
       * error.extensions; // => { code: 'FORBIDDEN' }
       * ```
       * @example
       * ```ts
       * // This variant derives locations from source positions and preserves the original error.
       * import { Source } from 'graphql/language';
       * import { GraphQLError } from 'graphql/error';
       *
       * const source = new Source('{ greeting }');
       * const originalError = new Error('Database unavailable.');
       * const error = new GraphQLError('Resolver failed.', {
       *   source,
       *   positions: [2],
       *   path: ['greeting'],
       *   originalError,
       * });
       *
       * error.locations; // => [{ line: 1, column: 3 }]
       * error.path; // => ['greeting']
       * error.originalError; // => originalError
       * ```
       */
      /**
       * Creates a GraphQLError instance using the legacy positional constructor.
       * This deprecated overload will be removed in v17. Prefer the
       * `GraphQLErrorOptions` object overload, which keeps optional error metadata
       * in a single options bag.
       * @param message - Human-readable error message.
       * @param nodes - AST node or nodes associated with this error.
       * @param source - Source document used to derive error locations.
       * @param positions - Character offsets in the source document associated with
       * this error.
       * @param path - Response path where this error occurred during execution.
       * @param originalError - Original error that caused this GraphQLError, if one
       * exists.
       * @param extensions - Extension fields to include in the formatted error.
       * @example
       * ```ts
       * import { Source } from 'graphql/language';
       * import { GraphQLError } from 'graphql/error';
       *
       * const source = new Source('{ greeting }');
       * const originalError = new Error('Database unavailable.');
       * const error = new GraphQLError(
       *   'Resolver failed.',
       *   undefined,
       *   source,
       *   [2],
       *   ['greeting'],
       *   originalError,
       *   { code: 'INTERNAL' },
       * );
       *
       * error.locations; // => [{ line: 1, column: 3 }]
       * error.path; // => ['greeting']
       * error.originalError; // => originalError
       * error.extensions; // => { code: 'INTERNAL' }
       * ```
       * @deprecated Please use the `GraphQLErrorOptions` constructor overload instead.
       */
      constructor(message, ...rawArgs) {
        var _this$nodes, _nodeLocations$, _ref;
        const { nodes, source, positions, path, originalError, extensions } = toNormalizedOptions(rawArgs);
        super(message);
        this.name = "GraphQLError";
        this.path = path !== null && path !== void 0 ? path : void 0;
        this.originalError = originalError !== null && originalError !== void 0 ? originalError : void 0;
        this.nodes = undefinedIfEmpty(
          Array.isArray(nodes) ? nodes : nodes ? [nodes] : void 0
        );
        const nodeLocations = undefinedIfEmpty(
          (_this$nodes = this.nodes) === null || _this$nodes === void 0 ? void 0 : _this$nodes.map((node2) => node2.loc).filter((loc) => loc != null)
        );
        this.source = source !== null && source !== void 0 ? source : nodeLocations === null || nodeLocations === void 0 ? void 0 : (_nodeLocations$ = nodeLocations[0]) === null || _nodeLocations$ === void 0 ? void 0 : _nodeLocations$.source;
        this.positions = positions !== null && positions !== void 0 ? positions : nodeLocations === null || nodeLocations === void 0 ? void 0 : nodeLocations.map((loc) => loc.start);
        this.locations = positions && source ? (0, _location.getLocations)(
          positions.map((start) => ({
            source,
            start
          }))
        ) : nodeLocations && (0, _location.getLocations)(nodeLocations);
        const originalExtensions = (0, _isObjectLike.isObjectLike)(
          originalError === null || originalError === void 0 ? void 0 : originalError.extensions
        ) ? originalError === null || originalError === void 0 ? void 0 : originalError.extensions : void 0;
        this.extensions = (_ref = extensions !== null && extensions !== void 0 ? extensions : originalExtensions) !== null && _ref !== void 0 ? _ref : /* @__PURE__ */ Object.create(null);
        Object.defineProperties(this, {
          message: {
            writable: true,
            enumerable: true
          },
          name: {
            enumerable: false
          },
          nodes: {
            enumerable: false
          },
          source: {
            enumerable: false
          },
          positions: {
            enumerable: false
          },
          originalError: {
            enumerable: false
          }
        });
        if (originalError !== null && originalError !== void 0 && originalError.stack) {
          Object.defineProperty(this, "stack", {
            value: originalError.stack,
            writable: true,
            configurable: true
          });
        } else if (Error.captureStackTrace) {
          Error.captureStackTrace(this, _GraphQLError);
        } else {
          Object.defineProperty(this, "stack", {
            value: Error().stack,
            writable: true,
            configurable: true
          });
        }
      }
      /**
       * Returns the value used by `Object.prototype.toString`.
       * @returns The built-in string tag for this object.
       */
      get [Symbol.toStringTag]() {
        return "GraphQLError";
      }
      /**
       * Returns this error as a human-readable message with source locations.
       * @returns The formatted error string.
       * @example
       * ```ts
       * import { Source } from 'graphql/language';
       * import { GraphQLError } from 'graphql/error';
       *
       * const error = new GraphQLError('Cannot query field "name".', {
       *   source: new Source('{ name }'),
       *   positions: [2],
       * });
       *
       * error.toString(); // => 'Cannot query field "name".\n\nGraphQL request:1:3\n1 | { name }\n  |   ^'
       * ```
       */
      toString() {
        let output = this.message;
        if (this.nodes) {
          for (const node2 of this.nodes) {
            if (node2.loc) {
              output += "\n\n" + (0, _printLocation.printLocation)(node2.loc);
            }
          }
        } else if (this.source && this.locations) {
          for (const location of this.locations) {
            output += "\n\n" + (0, _printLocation.printSourceLocation)(this.source, location);
          }
        }
        return output;
      }
      /**
       * Returns the JSON representation used when this object is serialized.
       * @returns The JSON-serializable representation.
       * @example
       * ```ts
       * import { GraphQLError } from 'graphql/error';
       *
       * const error = new GraphQLError('Resolver failed.', {
       *   path: ['viewer', 'name'],
       *   extensions: { code: 'INTERNAL' },
       * });
       *
       * error.toJSON(); // => { message: 'Resolver failed.', path: ['viewer', 'name'], extensions: { code: 'INTERNAL' } }
       * ```
       */
      toJSON() {
        const formattedError = {
          message: this.message
        };
        if (this.locations != null) {
          formattedError.locations = this.locations;
        }
        if (this.path != null) {
          formattedError.path = this.path;
        }
        if (this.extensions != null && Object.keys(this.extensions).length > 0) {
          formattedError.extensions = this.extensions;
        }
        return formattedError;
      }
    };
    exports.GraphQLError = GraphQLError;
    function undefinedIfEmpty(array) {
      return array === void 0 || array.length === 0 ? void 0 : array;
    }
    function printError(error) {
      return error.toString();
    }
    function formatError(error) {
      return error.toJSON();
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/error/syntaxError.js
var require_syntaxError = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/error/syntaxError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.syntaxError = syntaxError;
    var _GraphQLError = require_GraphQLError();
    function syntaxError(source, position, description) {
      return new _GraphQLError.GraphQLError(`Syntax Error: ${description}`, {
        source,
        positions: [position]
      });
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/ast.js
var require_ast = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/ast.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Token = exports.QueryDocumentKeys = exports.OperationTypeNode = exports.Location = void 0;
    exports.isNode = isNode;
    var Location = class {
      /** The character offset at which this Node begins. */
      /** The character offset at which this Node ends. */
      /** The Token at which this Node begins. */
      /** The Token at which this Node ends. */
      /** The Source document the AST represents. */
      /**
       * Creates a Location instance.
       * @param startToken - The start token.
       * @param endToken - The end token.
       * @param source - Source document used to derive error locations.
       * @example
       * ```ts
       * import { Location, Source, Token, TokenKind } from 'graphql/language';
       *
       * const source = new Source('{ hello }');
       * const startToken = new Token(TokenKind.BRACE_L, 0, 1, 1, 1);
       * const endToken = new Token(TokenKind.BRACE_R, 8, 9, 1, 9);
       * const location = new Location(startToken, endToken, source);
       *
       * location.start; // => 0
       * location.end; // => 9
       * location.source.body; // => '{ hello }'
       * ```
       */
      constructor(startToken, endToken, source) {
        this.start = startToken.start;
        this.end = endToken.end;
        this.startToken = startToken;
        this.endToken = endToken;
        this.source = source;
      }
      /**
       * Returns the value used by `Object.prototype.toString`.
       * @returns The built-in string tag for this object.
       */
      get [Symbol.toStringTag]() {
        return "Location";
      }
      /**
       * Returns a JSON representation of this location.
       * @returns The JSON-serializable representation.
       * @example
       * ```ts
       * import { parse } from 'graphql/language';
       *
       * const document = parse('{ hello }');
       * const location = document.loc?.toJSON(); // => { start: 0, end: 9 }
       * ```
       */
      toJSON() {
        return {
          start: this.start,
          end: this.end
        };
      }
    };
    exports.Location = Location;
    var Token = class {
      /** The kind of Token. */
      /** The character offset at which this Node begins. */
      /** The character offset at which this Node ends. */
      /** The 1-indexed line number on which this Token appears. */
      /** The 1-indexed column number at which this Token begins. */
      /**
       * For non-punctuation tokens, represents the interpreted value of the token.
       *
       * Note: is undefined for punctuation tokens, but typed as string for
       * convenience in the parser.
       */
      /**
       * Tokens exist as nodes in a double-linked-list amongst all tokens
       * including ignored tokens. <SOF> is always the first node and <EOF>
       * the last.
       */
      /** Next token in the token stream, including ignored tokens. */
      /**
       * Creates a Token instance.
       * @param kind - Token kind produced by lexical analysis.
       * @param start - Character offset where this token begins.
       * @param end - Character offset where this token ends.
       * @param line - One-indexed line number where this token begins.
       * @param column - One-indexed column number where this token begins.
       * @param value - Interpreted value for non-punctuation tokens.
       * @example
       * ```ts
       * import { Token, TokenKind } from 'graphql/language';
       *
       * const token = new Token(TokenKind.NAME, 2, 7, 1, 3, 'hello');
       *
       * token.kind; // => TokenKind.NAME
       * token.value; // => 'hello'
       * token.toJSON(); // => { kind: 'Name', value: 'hello', line: 1, column: 3 }
       * ```
       */
      constructor(kind, start, end, line, column, value) {
        this.kind = kind;
        this.start = start;
        this.end = end;
        this.line = line;
        this.column = column;
        this.value = value;
        this.prev = null;
        this.next = null;
      }
      /**
       * Returns the value used by `Object.prototype.toString`.
       * @returns The built-in string tag for this object.
       */
      get [Symbol.toStringTag]() {
        return "Token";
      }
      /**
       * Returns a JSON representation of this token.
       * @returns The JSON-serializable representation.
       * @example
       * ```ts
       * import { Lexer, Source } from 'graphql/language';
       *
       * const lexer = new Lexer(new Source('{ hello }'));
       * const token = lexer.advance().toJSON(); // => { kind: '{', value: undefined, line: 1, column: 1 }
       * ```
       */
      toJSON() {
        return {
          kind: this.kind,
          value: this.value,
          line: this.line,
          column: this.column
        };
      }
    };
    exports.Token = Token;
    var QueryDocumentKeys = {
      Name: [],
      Document: ["definitions"],
      OperationDefinition: [
        "description",
        "name",
        "variableDefinitions",
        "directives",
        "selectionSet"
      ],
      VariableDefinition: [
        "description",
        "variable",
        "type",
        "defaultValue",
        "directives"
      ],
      Variable: ["name"],
      SelectionSet: ["selections"],
      Field: ["alias", "name", "arguments", "directives", "selectionSet"],
      Argument: ["name", "value"],
      FragmentSpread: ["name", "directives"],
      InlineFragment: ["typeCondition", "directives", "selectionSet"],
      FragmentDefinition: [
        "description",
        "name",
        // Note: fragment variable definitions are deprecated and will removed in v17.0.0
        "variableDefinitions",
        "typeCondition",
        "directives",
        "selectionSet"
      ],
      IntValue: [],
      FloatValue: [],
      StringValue: [],
      BooleanValue: [],
      NullValue: [],
      EnumValue: [],
      ListValue: ["values"],
      ObjectValue: ["fields"],
      ObjectField: ["name", "value"],
      Directive: ["name", "arguments"],
      NamedType: ["name"],
      ListType: ["type"],
      NonNullType: ["type"],
      SchemaDefinition: ["description", "directives", "operationTypes"],
      OperationTypeDefinition: ["type"],
      ScalarTypeDefinition: ["description", "name", "directives"],
      ObjectTypeDefinition: [
        "description",
        "name",
        "interfaces",
        "directives",
        "fields"
      ],
      FieldDefinition: ["description", "name", "arguments", "type", "directives"],
      InputValueDefinition: [
        "description",
        "name",
        "type",
        "defaultValue",
        "directives"
      ],
      InterfaceTypeDefinition: [
        "description",
        "name",
        "interfaces",
        "directives",
        "fields"
      ],
      UnionTypeDefinition: ["description", "name", "directives", "types"],
      EnumTypeDefinition: ["description", "name", "directives", "values"],
      EnumValueDefinition: ["description", "name", "directives"],
      InputObjectTypeDefinition: ["description", "name", "directives", "fields"],
      DirectiveDefinition: [
        "description",
        "name",
        "arguments",
        "directives",
        "locations"
      ],
      SchemaExtension: ["directives", "operationTypes"],
      DirectiveExtension: ["name", "directives"],
      ScalarTypeExtension: ["name", "directives"],
      ObjectTypeExtension: ["name", "interfaces", "directives", "fields"],
      InterfaceTypeExtension: ["name", "interfaces", "directives", "fields"],
      UnionTypeExtension: ["name", "directives", "types"],
      EnumTypeExtension: ["name", "directives", "values"],
      InputObjectTypeExtension: ["name", "directives", "fields"],
      TypeCoordinate: ["name"],
      MemberCoordinate: ["name", "memberName"],
      ArgumentCoordinate: ["name", "fieldName", "argumentName"],
      DirectiveCoordinate: ["name"],
      DirectiveArgumentCoordinate: ["name", "argumentName"]
    };
    exports.QueryDocumentKeys = QueryDocumentKeys;
    var kindValues = new Set(Object.keys(QueryDocumentKeys));
    function isNode(maybeNode) {
      const maybeKind = maybeNode === null || maybeNode === void 0 ? void 0 : maybeNode.kind;
      return typeof maybeKind === "string" && kindValues.has(maybeKind);
    }
    var OperationTypeNode;
    exports.OperationTypeNode = OperationTypeNode;
    (function(OperationTypeNode2) {
      OperationTypeNode2["QUERY"] = "query";
      OperationTypeNode2["MUTATION"] = "mutation";
      OperationTypeNode2["SUBSCRIPTION"] = "subscription";
    })(OperationTypeNode || (exports.OperationTypeNode = OperationTypeNode = {}));
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/directiveLocation.js
var require_directiveLocation = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/directiveLocation.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.DirectiveLocation = void 0;
    var DirectiveLocation;
    exports.DirectiveLocation = DirectiveLocation;
    (function(DirectiveLocation2) {
      DirectiveLocation2["QUERY"] = "QUERY";
      DirectiveLocation2["MUTATION"] = "MUTATION";
      DirectiveLocation2["SUBSCRIPTION"] = "SUBSCRIPTION";
      DirectiveLocation2["FIELD"] = "FIELD";
      DirectiveLocation2["FRAGMENT_DEFINITION"] = "FRAGMENT_DEFINITION";
      DirectiveLocation2["FRAGMENT_SPREAD"] = "FRAGMENT_SPREAD";
      DirectiveLocation2["INLINE_FRAGMENT"] = "INLINE_FRAGMENT";
      DirectiveLocation2["VARIABLE_DEFINITION"] = "VARIABLE_DEFINITION";
      DirectiveLocation2["SCHEMA"] = "SCHEMA";
      DirectiveLocation2["SCALAR"] = "SCALAR";
      DirectiveLocation2["OBJECT"] = "OBJECT";
      DirectiveLocation2["FIELD_DEFINITION"] = "FIELD_DEFINITION";
      DirectiveLocation2["ARGUMENT_DEFINITION"] = "ARGUMENT_DEFINITION";
      DirectiveLocation2["INTERFACE"] = "INTERFACE";
      DirectiveLocation2["UNION"] = "UNION";
      DirectiveLocation2["ENUM"] = "ENUM";
      DirectiveLocation2["ENUM_VALUE"] = "ENUM_VALUE";
      DirectiveLocation2["INPUT_OBJECT"] = "INPUT_OBJECT";
      DirectiveLocation2["INPUT_FIELD_DEFINITION"] = "INPUT_FIELD_DEFINITION";
      DirectiveLocation2["DIRECTIVE_DEFINITION"] = "DIRECTIVE_DEFINITION";
    })(DirectiveLocation || (exports.DirectiveLocation = DirectiveLocation = {}));
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/kinds.js
var require_kinds = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/kinds.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Kind = void 0;
    var Kind3;
    exports.Kind = Kind3;
    (function(Kind4) {
      Kind4["NAME"] = "Name";
      Kind4["DOCUMENT"] = "Document";
      Kind4["OPERATION_DEFINITION"] = "OperationDefinition";
      Kind4["VARIABLE_DEFINITION"] = "VariableDefinition";
      Kind4["SELECTION_SET"] = "SelectionSet";
      Kind4["FIELD"] = "Field";
      Kind4["ARGUMENT"] = "Argument";
      Kind4["FRAGMENT_SPREAD"] = "FragmentSpread";
      Kind4["INLINE_FRAGMENT"] = "InlineFragment";
      Kind4["FRAGMENT_DEFINITION"] = "FragmentDefinition";
      Kind4["VARIABLE"] = "Variable";
      Kind4["INT"] = "IntValue";
      Kind4["FLOAT"] = "FloatValue";
      Kind4["STRING"] = "StringValue";
      Kind4["BOOLEAN"] = "BooleanValue";
      Kind4["NULL"] = "NullValue";
      Kind4["ENUM"] = "EnumValue";
      Kind4["LIST"] = "ListValue";
      Kind4["OBJECT"] = "ObjectValue";
      Kind4["OBJECT_FIELD"] = "ObjectField";
      Kind4["DIRECTIVE"] = "Directive";
      Kind4["NAMED_TYPE"] = "NamedType";
      Kind4["LIST_TYPE"] = "ListType";
      Kind4["NON_NULL_TYPE"] = "NonNullType";
      Kind4["SCHEMA_DEFINITION"] = "SchemaDefinition";
      Kind4["OPERATION_TYPE_DEFINITION"] = "OperationTypeDefinition";
      Kind4["SCALAR_TYPE_DEFINITION"] = "ScalarTypeDefinition";
      Kind4["OBJECT_TYPE_DEFINITION"] = "ObjectTypeDefinition";
      Kind4["FIELD_DEFINITION"] = "FieldDefinition";
      Kind4["INPUT_VALUE_DEFINITION"] = "InputValueDefinition";
      Kind4["INTERFACE_TYPE_DEFINITION"] = "InterfaceTypeDefinition";
      Kind4["UNION_TYPE_DEFINITION"] = "UnionTypeDefinition";
      Kind4["ENUM_TYPE_DEFINITION"] = "EnumTypeDefinition";
      Kind4["ENUM_VALUE_DEFINITION"] = "EnumValueDefinition";
      Kind4["INPUT_OBJECT_TYPE_DEFINITION"] = "InputObjectTypeDefinition";
      Kind4["DIRECTIVE_DEFINITION"] = "DirectiveDefinition";
      Kind4["SCHEMA_EXTENSION"] = "SchemaExtension";
      Kind4["DIRECTIVE_EXTENSION"] = "DirectiveExtension";
      Kind4["SCALAR_TYPE_EXTENSION"] = "ScalarTypeExtension";
      Kind4["OBJECT_TYPE_EXTENSION"] = "ObjectTypeExtension";
      Kind4["INTERFACE_TYPE_EXTENSION"] = "InterfaceTypeExtension";
      Kind4["UNION_TYPE_EXTENSION"] = "UnionTypeExtension";
      Kind4["ENUM_TYPE_EXTENSION"] = "EnumTypeExtension";
      Kind4["INPUT_OBJECT_TYPE_EXTENSION"] = "InputObjectTypeExtension";
      Kind4["TYPE_COORDINATE"] = "TypeCoordinate";
      Kind4["MEMBER_COORDINATE"] = "MemberCoordinate";
      Kind4["ARGUMENT_COORDINATE"] = "ArgumentCoordinate";
      Kind4["DIRECTIVE_COORDINATE"] = "DirectiveCoordinate";
      Kind4["DIRECTIVE_ARGUMENT_COORDINATE"] = "DirectiveArgumentCoordinate";
    })(Kind3 || (exports.Kind = Kind3 = {}));
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/characterClasses.js
var require_characterClasses = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/characterClasses.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.isDigit = isDigit;
    exports.isLetter = isLetter;
    exports.isNameContinue = isNameContinue;
    exports.isNameStart = isNameStart;
    exports.isWhiteSpace = isWhiteSpace;
    function isWhiteSpace(code) {
      return code === 9 || code === 32;
    }
    function isDigit(code) {
      return code >= 48 && code <= 57;
    }
    function isLetter(code) {
      return code >= 97 && code <= 122 || // A-Z
      code >= 65 && code <= 90;
    }
    function isNameStart(code) {
      return isLetter(code) || code === 95;
    }
    function isNameContinue(code) {
      return isLetter(code) || isDigit(code) || code === 95;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/blockString.js
var require_blockString = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/blockString.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.dedentBlockStringLines = dedentBlockStringLines;
    exports.isPrintableAsBlockString = isPrintableAsBlockString;
    exports.printBlockString = printBlockString;
    var _characterClasses = require_characterClasses();
    function dedentBlockStringLines(lines) {
      var _firstNonEmptyLine2;
      let commonIndent = Number.MAX_SAFE_INTEGER;
      let firstNonEmptyLine = null;
      let lastNonEmptyLine = -1;
      for (let i = 0; i < lines.length; ++i) {
        var _firstNonEmptyLine;
        const line = lines[i];
        const indent = leadingWhitespace(line);
        if (indent === line.length) {
          continue;
        }
        firstNonEmptyLine = (_firstNonEmptyLine = firstNonEmptyLine) !== null && _firstNonEmptyLine !== void 0 ? _firstNonEmptyLine : i;
        lastNonEmptyLine = i;
        if (i !== 0 && indent < commonIndent) {
          commonIndent = indent;
        }
      }
      return lines.map((line, i) => i === 0 ? line : line.slice(commonIndent)).slice(
        (_firstNonEmptyLine2 = firstNonEmptyLine) !== null && _firstNonEmptyLine2 !== void 0 ? _firstNonEmptyLine2 : 0,
        lastNonEmptyLine + 1
      );
    }
    function leadingWhitespace(str) {
      let i = 0;
      while (i < str.length && (0, _characterClasses.isWhiteSpace)(str.charCodeAt(i))) {
        ++i;
      }
      return i;
    }
    function isPrintableAsBlockString(value) {
      if (value === "") {
        return true;
      }
      let isEmptyLine = true;
      let hasIndent = false;
      let hasCommonIndent = true;
      let seenNonEmptyLine = false;
      for (let i = 0; i < value.length; ++i) {
        switch (value.codePointAt(i)) {
          case 0:
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
          case 6:
          case 7:
          case 8:
          case 11:
          case 12:
          case 14:
          case 15:
            return false;
          // Has non-printable characters
          case 13:
            return false;
          // Has \r or \r\n which will be replaced as \n
          case 10:
            if (isEmptyLine && !seenNonEmptyLine) {
              return false;
            }
            seenNonEmptyLine = true;
            isEmptyLine = true;
            hasIndent = false;
            break;
          case 9:
          //   \t
          case 32:
            hasIndent || (hasIndent = isEmptyLine);
            break;
          default:
            hasCommonIndent && (hasCommonIndent = hasIndent);
            isEmptyLine = false;
        }
      }
      if (isEmptyLine) {
        return false;
      }
      if (hasCommonIndent && seenNonEmptyLine) {
        return false;
      }
      return true;
    }
    function printBlockString(value, options) {
      const escapedValue = value.replace(/"""/g, '\\"""');
      const lines = escapedValue.split(/\r\n|[\n\r]/g);
      const isSingleLine = lines.length === 1;
      const forceLeadingNewLine = lines.length > 1 && lines.slice(1).every(
        (line) => line.length === 0 || (0, _characterClasses.isWhiteSpace)(line.charCodeAt(0))
      );
      const hasTrailingTripleQuotes = escapedValue.endsWith('\\"""');
      const hasTrailingQuote = value.endsWith('"') && !hasTrailingTripleQuotes;
      const hasTrailingSlash = value.endsWith("\\");
      const forceTrailingNewline = hasTrailingQuote || hasTrailingSlash;
      const printAsMultipleLines = !(options !== null && options !== void 0 && options.minimize) && // add leading and trailing new lines only if it improves readability
      (!isSingleLine || value.length > 70 || forceTrailingNewline || forceLeadingNewLine || hasTrailingTripleQuotes);
      let result = "";
      const skipLeadingNewLine = isSingleLine && (0, _characterClasses.isWhiteSpace)(value.charCodeAt(0));
      if (printAsMultipleLines && !skipLeadingNewLine || forceLeadingNewLine) {
        result += "\n";
      }
      result += escapedValue;
      if (printAsMultipleLines || forceTrailingNewline) {
        result += "\n";
      }
      return '"""' + result + '"""';
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/tokenKind.js
var require_tokenKind = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/tokenKind.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.TokenKind = void 0;
    var TokenKind;
    exports.TokenKind = TokenKind;
    (function(TokenKind2) {
      TokenKind2["SOF"] = "<SOF>";
      TokenKind2["EOF"] = "<EOF>";
      TokenKind2["BANG"] = "!";
      TokenKind2["DOLLAR"] = "$";
      TokenKind2["AMP"] = "&";
      TokenKind2["PAREN_L"] = "(";
      TokenKind2["PAREN_R"] = ")";
      TokenKind2["DOT"] = ".";
      TokenKind2["SPREAD"] = "...";
      TokenKind2["COLON"] = ":";
      TokenKind2["EQUALS"] = "=";
      TokenKind2["AT"] = "@";
      TokenKind2["BRACKET_L"] = "[";
      TokenKind2["BRACKET_R"] = "]";
      TokenKind2["BRACE_L"] = "{";
      TokenKind2["PIPE"] = "|";
      TokenKind2["BRACE_R"] = "}";
      TokenKind2["NAME"] = "Name";
      TokenKind2["INT"] = "Int";
      TokenKind2["FLOAT"] = "Float";
      TokenKind2["STRING"] = "String";
      TokenKind2["BLOCK_STRING"] = "BlockString";
      TokenKind2["COMMENT"] = "Comment";
    })(TokenKind || (exports.TokenKind = TokenKind = {}));
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/lexer.js
var require_lexer = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/lexer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Lexer = void 0;
    exports.createToken = createToken;
    exports.isPunctuatorTokenKind = isPunctuatorTokenKind;
    exports.printCodePointAt = printCodePointAt;
    exports.readName = readName;
    var _syntaxError = require_syntaxError();
    var _ast = require_ast();
    var _blockString = require_blockString();
    var _characterClasses = require_characterClasses();
    var _tokenKind = require_tokenKind();
    var Lexer = class {
      /** Source document used to derive error locations. */
      /** Most recent non-ignored token returned by the lexer. */
      /** Current non-ignored token at the lexer cursor. */
      /** The (1-indexed) line containing the current token. */
      /** Character offset where the current line starts. */
      /** @internal */
      /** @internal */
      /**
       * Creates a Lexer instance.
       * @param source - Source document used to derive error locations.
       * @example
       * ```ts
       * import { Lexer, Source, TokenKind } from 'graphql/language';
       *
       * const lexer = new Lexer(new Source('{ hello }'));
       *
       * lexer.token.kind; // => TokenKind.SOF
       * lexer.advance().kind; // => TokenKind.BRACE_L
       * lexer.advance().value; // => 'hello'
       * lexer.advance().kind; // => TokenKind.BRACE_R
       * ```
       */
      constructor(source) {
        const startOfFileToken = new _ast.Token(
          _tokenKind.TokenKind.SOF,
          0,
          0,
          0,
          0
        );
        this.source = source;
        this.lastToken = startOfFileToken;
        this.token = startOfFileToken;
        this.line = 1;
        this.lineStart = 0;
        this._maxComments = void 0;
        this._commentCount = 0;
      }
      /**
       * Returns the value used by `Object.prototype.toString`.
       * @returns The built-in string tag for this object.
       */
      get [Symbol.toStringTag]() {
        return "Lexer";
      }
      /**
       * Advances the token stream to the next non-ignored token.
       * @returns The next non-ignored token.
       * @example
       * ```ts
       * import { Lexer, Source } from 'graphql/language';
       *
       * const lexer = new Lexer(new Source('{ hello }'));
       * const token = lexer.advance();
       *
       * token.kind; // => '{'
       * lexer.token; // => token
       * ```
       */
      advance() {
        this.lastToken = this.token;
        const token = this.token = this.lookahead();
        return token;
      }
      /**
       * Looks ahead and returns the next non-ignored token, but does not change
       * the state of Lexer.
       * @returns The next non-ignored token without advancing the lexer.
       * @example
       * ```ts
       * import { Lexer, Source } from 'graphql/language';
       *
       * const lexer = new Lexer(new Source('{ hello }'));
       * const token = lexer.lookahead();
       *
       * token.kind; // => '{'
       * lexer.token.kind; // => '<SOF>'
       * ```
       */
      lookahead() {
        let token = this.token;
        if (token.kind !== _tokenKind.TokenKind.EOF) {
          do {
            if (token.next) {
              token = token.next;
            } else {
              const nextToken = readNextToken(this, token.end);
              token.next = nextToken;
              nextToken.prev = token;
              token = nextToken;
            }
          } while (token.kind === _tokenKind.TokenKind.COMMENT);
        }
        return token;
      }
    };
    exports.Lexer = Lexer;
    function isPunctuatorTokenKind(kind) {
      return kind === _tokenKind.TokenKind.BANG || kind === _tokenKind.TokenKind.DOLLAR || kind === _tokenKind.TokenKind.AMP || kind === _tokenKind.TokenKind.PAREN_L || kind === _tokenKind.TokenKind.PAREN_R || kind === _tokenKind.TokenKind.DOT || kind === _tokenKind.TokenKind.SPREAD || kind === _tokenKind.TokenKind.COLON || kind === _tokenKind.TokenKind.EQUALS || kind === _tokenKind.TokenKind.AT || kind === _tokenKind.TokenKind.BRACKET_L || kind === _tokenKind.TokenKind.BRACKET_R || kind === _tokenKind.TokenKind.BRACE_L || kind === _tokenKind.TokenKind.PIPE || kind === _tokenKind.TokenKind.BRACE_R;
    }
    function isUnicodeScalarValue(code) {
      return code >= 0 && code <= 55295 || code >= 57344 && code <= 1114111;
    }
    function isSupplementaryCodePoint(body, location) {
      return isLeadingSurrogate(body.charCodeAt(location)) && isTrailingSurrogate(body.charCodeAt(location + 1));
    }
    function isLeadingSurrogate(code) {
      return code >= 55296 && code <= 56319;
    }
    function isTrailingSurrogate(code) {
      return code >= 56320 && code <= 57343;
    }
    function printCodePointAt(lexer, location) {
      const code = lexer.source.body.codePointAt(location);
      if (code === void 0) {
        return _tokenKind.TokenKind.EOF;
      } else if (code >= 32 && code <= 126) {
        const char = String.fromCodePoint(code);
        return char === '"' ? `'"'` : `"${char}"`;
      }
      return "U+" + code.toString(16).toUpperCase().padStart(4, "0");
    }
    function createToken(lexer, kind, start, end, value) {
      const line = lexer.line;
      const col = 1 + start - lexer.lineStart;
      return new _ast.Token(kind, start, end, line, col, value);
    }
    function readNextToken(lexer, start) {
      const body = lexer.source.body;
      const bodyLength = body.length;
      let position = start;
      while (position < bodyLength) {
        const code = body.charCodeAt(position);
        switch (code) {
          // Ignored ::
          //   - UnicodeBOM
          //   - WhiteSpace
          //   - LineTerminator
          //   - Comment
          //   - Comma
          //
          // UnicodeBOM :: "Byte Order Mark (U+FEFF)"
          //
          // WhiteSpace ::
          //   - "Horizontal Tab (U+0009)"
          //   - "Space (U+0020)"
          //
          // Comma :: ,
          case 65279:
          // <BOM>
          case 9:
          // \t
          case 32:
          // <space>
          case 44:
            ++position;
            continue;
          // LineTerminator ::
          //   - "New Line (U+000A)"
          //   - "Carriage Return (U+000D)" [lookahead != "New Line (U+000A)"]
          //   - "Carriage Return (U+000D)" "New Line (U+000A)"
          case 10:
            ++position;
            ++lexer.line;
            lexer.lineStart = position;
            continue;
          case 13:
            if (body.charCodeAt(position + 1) === 10) {
              position += 2;
            } else {
              ++position;
            }
            ++lexer.line;
            lexer.lineStart = position;
            continue;
          // Comment
          case 35:
            return readComment(lexer, position);
          // Token ::
          //   - Punctuator
          //   - Name
          //   - IntValue
          //   - FloatValue
          //   - StringValue
          //
          // Punctuator :: one of ! $ & ( ) ... : = @ [ ] { | }
          case 33:
            return createToken(
              lexer,
              _tokenKind.TokenKind.BANG,
              position,
              position + 1
            );
          case 36:
            return createToken(
              lexer,
              _tokenKind.TokenKind.DOLLAR,
              position,
              position + 1
            );
          case 38:
            return createToken(
              lexer,
              _tokenKind.TokenKind.AMP,
              position,
              position + 1
            );
          case 40:
            return createToken(
              lexer,
              _tokenKind.TokenKind.PAREN_L,
              position,
              position + 1
            );
          case 41:
            return createToken(
              lexer,
              _tokenKind.TokenKind.PAREN_R,
              position,
              position + 1
            );
          case 46:
            if (body.charCodeAt(position + 1) === 46 && body.charCodeAt(position + 2) === 46) {
              return createToken(
                lexer,
                _tokenKind.TokenKind.SPREAD,
                position,
                position + 3
              );
            }
            break;
          case 58:
            return createToken(
              lexer,
              _tokenKind.TokenKind.COLON,
              position,
              position + 1
            );
          case 61:
            return createToken(
              lexer,
              _tokenKind.TokenKind.EQUALS,
              position,
              position + 1
            );
          case 64:
            return createToken(
              lexer,
              _tokenKind.TokenKind.AT,
              position,
              position + 1
            );
          case 91:
            return createToken(
              lexer,
              _tokenKind.TokenKind.BRACKET_L,
              position,
              position + 1
            );
          case 93:
            return createToken(
              lexer,
              _tokenKind.TokenKind.BRACKET_R,
              position,
              position + 1
            );
          case 123:
            return createToken(
              lexer,
              _tokenKind.TokenKind.BRACE_L,
              position,
              position + 1
            );
          case 124:
            return createToken(
              lexer,
              _tokenKind.TokenKind.PIPE,
              position,
              position + 1
            );
          case 125:
            return createToken(
              lexer,
              _tokenKind.TokenKind.BRACE_R,
              position,
              position + 1
            );
          // StringValue
          case 34:
            if (body.charCodeAt(position + 1) === 34 && body.charCodeAt(position + 2) === 34) {
              return readBlockString(lexer, position);
            }
            return readString(lexer, position);
        }
        if ((0, _characterClasses.isDigit)(code) || code === 45) {
          return readNumber(lexer, position, code);
        }
        if ((0, _characterClasses.isNameStart)(code)) {
          return readName(lexer, position);
        }
        throw (0, _syntaxError.syntaxError)(
          lexer.source,
          position,
          code === 39 ? `Unexpected single quote character ('), did you mean to use a double quote (")?` : isUnicodeScalarValue(code) || isSupplementaryCodePoint(body, position) ? `Unexpected character: ${printCodePointAt(lexer, position)}.` : `Invalid character: ${printCodePointAt(lexer, position)}.`
        );
      }
      return createToken(lexer, _tokenKind.TokenKind.EOF, bodyLength, bodyLength);
    }
    function readComment(lexer, start) {
      const maxComments = lexer._maxComments;
      if (maxComments !== void 0) {
        const nextCommentCount = lexer._commentCount + 1;
        if (nextCommentCount > maxComments) {
          throw (0, _syntaxError.syntaxError)(
            lexer.source,
            start,
            `Document contains more than ${maxComments} comments. Parsing aborted.`
          );
        }
        lexer._commentCount = nextCommentCount;
      }
      const body = lexer.source.body;
      const bodyLength = body.length;
      let position = start + 1;
      while (position < bodyLength) {
        const code = body.charCodeAt(position);
        if (code === 10 || code === 13) {
          break;
        }
        if (isUnicodeScalarValue(code)) {
          ++position;
        } else if (isSupplementaryCodePoint(body, position)) {
          position += 2;
        } else {
          break;
        }
      }
      return createToken(
        lexer,
        _tokenKind.TokenKind.COMMENT,
        start,
        position,
        body.slice(start + 1, position)
      );
    }
    function readNumber(lexer, start, firstCode) {
      const body = lexer.source.body;
      let position = start;
      let code = firstCode;
      let isFloat = false;
      if (code === 45) {
        code = body.charCodeAt(++position);
      }
      if (code === 48) {
        code = body.charCodeAt(++position);
        if ((0, _characterClasses.isDigit)(code)) {
          throw (0, _syntaxError.syntaxError)(
            lexer.source,
            position,
            `Invalid number, unexpected digit after 0: ${printCodePointAt(
              lexer,
              position
            )}.`
          );
        }
      } else {
        position = readDigits(lexer, position, code);
        code = body.charCodeAt(position);
      }
      if (code === 46) {
        isFloat = true;
        code = body.charCodeAt(++position);
        position = readDigits(lexer, position, code);
        code = body.charCodeAt(position);
      }
      if (code === 69 || code === 101) {
        isFloat = true;
        code = body.charCodeAt(++position);
        if (code === 43 || code === 45) {
          code = body.charCodeAt(++position);
        }
        position = readDigits(lexer, position, code);
        code = body.charCodeAt(position);
      }
      if (code === 46 || (0, _characterClasses.isNameStart)(code)) {
        throw (0, _syntaxError.syntaxError)(
          lexer.source,
          position,
          `Invalid number, expected digit but got: ${printCodePointAt(
            lexer,
            position
          )}.`
        );
      }
      return createToken(
        lexer,
        isFloat ? _tokenKind.TokenKind.FLOAT : _tokenKind.TokenKind.INT,
        start,
        position,
        body.slice(start, position)
      );
    }
    function readDigits(lexer, start, firstCode) {
      if (!(0, _characterClasses.isDigit)(firstCode)) {
        throw (0, _syntaxError.syntaxError)(
          lexer.source,
          start,
          `Invalid number, expected digit but got: ${printCodePointAt(
            lexer,
            start
          )}.`
        );
      }
      const body = lexer.source.body;
      let position = start + 1;
      while ((0, _characterClasses.isDigit)(body.charCodeAt(position))) {
        ++position;
      }
      return position;
    }
    function readString(lexer, start) {
      const body = lexer.source.body;
      const bodyLength = body.length;
      let position = start + 1;
      let chunkStart = position;
      let value = "";
      while (position < bodyLength) {
        const code = body.charCodeAt(position);
        if (code === 34) {
          value += body.slice(chunkStart, position);
          return createToken(
            lexer,
            _tokenKind.TokenKind.STRING,
            start,
            position + 1,
            value
          );
        }
        if (code === 92) {
          value += body.slice(chunkStart, position);
          const escape = body.charCodeAt(position + 1) === 117 ? body.charCodeAt(position + 2) === 123 ? readEscapedUnicodeVariableWidth(lexer, position) : readEscapedUnicodeFixedWidth(lexer, position) : readEscapedCharacter(lexer, position);
          value += escape.value;
          position += escape.size;
          chunkStart = position;
          continue;
        }
        if (code === 10 || code === 13) {
          break;
        }
        if (isUnicodeScalarValue(code)) {
          ++position;
        } else if (isSupplementaryCodePoint(body, position)) {
          position += 2;
        } else {
          throw (0, _syntaxError.syntaxError)(
            lexer.source,
            position,
            `Invalid character within String: ${printCodePointAt(
              lexer,
              position
            )}.`
          );
        }
      }
      throw (0, _syntaxError.syntaxError)(
        lexer.source,
        position,
        "Unterminated string."
      );
    }
    function readEscapedUnicodeVariableWidth(lexer, position) {
      const body = lexer.source.body;
      let point = 0;
      let size = 3;
      while (size < 12) {
        const code = body.charCodeAt(position + size++);
        if (code === 125) {
          if (size < 5 || !isUnicodeScalarValue(point)) {
            break;
          }
          return {
            value: String.fromCodePoint(point),
            size
          };
        }
        point = point << 4 | readHexDigit(code);
        if (point < 0) {
          break;
        }
      }
      throw (0, _syntaxError.syntaxError)(
        lexer.source,
        position,
        `Invalid Unicode escape sequence: "${body.slice(
          position,
          position + size
        )}".`
      );
    }
    function readEscapedUnicodeFixedWidth(lexer, position) {
      const body = lexer.source.body;
      const code = read16BitHexCode(body, position + 2);
      if (isUnicodeScalarValue(code)) {
        return {
          value: String.fromCodePoint(code),
          size: 6
        };
      }
      if (isLeadingSurrogate(code)) {
        if (body.charCodeAt(position + 6) === 92 && body.charCodeAt(position + 7) === 117) {
          const trailingCode = read16BitHexCode(body, position + 8);
          if (isTrailingSurrogate(trailingCode)) {
            return {
              value: String.fromCodePoint(code, trailingCode),
              size: 12
            };
          }
        }
      }
      throw (0, _syntaxError.syntaxError)(
        lexer.source,
        position,
        `Invalid Unicode escape sequence: "${body.slice(position, position + 6)}".`
      );
    }
    function read16BitHexCode(body, position) {
      return readHexDigit(body.charCodeAt(position)) << 12 | readHexDigit(body.charCodeAt(position + 1)) << 8 | readHexDigit(body.charCodeAt(position + 2)) << 4 | readHexDigit(body.charCodeAt(position + 3));
    }
    function readHexDigit(code) {
      return code >= 48 && code <= 57 ? code - 48 : code >= 65 && code <= 70 ? code - 55 : code >= 97 && code <= 102 ? code - 87 : -1;
    }
    function readEscapedCharacter(lexer, position) {
      const body = lexer.source.body;
      const code = body.charCodeAt(position + 1);
      switch (code) {
        case 34:
          return {
            value: '"',
            size: 2
          };
        case 92:
          return {
            value: "\\",
            size: 2
          };
        case 47:
          return {
            value: "/",
            size: 2
          };
        case 98:
          return {
            value: "\b",
            size: 2
          };
        case 102:
          return {
            value: "\f",
            size: 2
          };
        case 110:
          return {
            value: "\n",
            size: 2
          };
        case 114:
          return {
            value: "\r",
            size: 2
          };
        case 116:
          return {
            value: "	",
            size: 2
          };
      }
      throw (0, _syntaxError.syntaxError)(
        lexer.source,
        position,
        `Invalid character escape sequence: "${body.slice(
          position,
          position + 2
        )}".`
      );
    }
    function readBlockString(lexer, start) {
      const body = lexer.source.body;
      const bodyLength = body.length;
      let lineStart = lexer.lineStart;
      let position = start + 3;
      let chunkStart = position;
      let currentLine = "";
      const blockLines = [];
      while (position < bodyLength) {
        const code = body.charCodeAt(position);
        if (code === 34 && body.charCodeAt(position + 1) === 34 && body.charCodeAt(position + 2) === 34) {
          currentLine += body.slice(chunkStart, position);
          blockLines.push(currentLine);
          const token = createToken(
            lexer,
            _tokenKind.TokenKind.BLOCK_STRING,
            start,
            position + 3,
            // Return a string of the lines joined with U+000A.
            (0, _blockString.dedentBlockStringLines)(blockLines).join("\n")
          );
          lexer.line += blockLines.length - 1;
          lexer.lineStart = lineStart;
          return token;
        }
        if (code === 92 && body.charCodeAt(position + 1) === 34 && body.charCodeAt(position + 2) === 34 && body.charCodeAt(position + 3) === 34) {
          currentLine += body.slice(chunkStart, position);
          chunkStart = position + 1;
          position += 4;
          continue;
        }
        if (code === 10 || code === 13) {
          currentLine += body.slice(chunkStart, position);
          blockLines.push(currentLine);
          if (code === 13 && body.charCodeAt(position + 1) === 10) {
            position += 2;
          } else {
            ++position;
          }
          currentLine = "";
          chunkStart = position;
          lineStart = position;
          continue;
        }
        if (isUnicodeScalarValue(code)) {
          ++position;
        } else if (isSupplementaryCodePoint(body, position)) {
          position += 2;
        } else {
          throw (0, _syntaxError.syntaxError)(
            lexer.source,
            position,
            `Invalid character within String: ${printCodePointAt(
              lexer,
              position
            )}.`
          );
        }
      }
      throw (0, _syntaxError.syntaxError)(
        lexer.source,
        position,
        "Unterminated string."
      );
    }
    function readName(lexer, start) {
      const body = lexer.source.body;
      const bodyLength = body.length;
      let position = start + 1;
      while (position < bodyLength) {
        const code = body.charCodeAt(position);
        if ((0, _characterClasses.isNameContinue)(code)) {
          ++position;
        } else {
          break;
        }
      }
      return createToken(
        lexer,
        _tokenKind.TokenKind.NAME,
        start,
        position,
        body.slice(start, position)
      );
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/schemaCoordinateLexer.js
var require_schemaCoordinateLexer = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/schemaCoordinateLexer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.SchemaCoordinateLexer = void 0;
    var _syntaxError = require_syntaxError();
    var _ast = require_ast();
    var _characterClasses = require_characterClasses();
    var _lexer = require_lexer();
    var _tokenKind = require_tokenKind();
    var SchemaCoordinateLexer = class {
      /** The previously focused non-ignored token. */
      /** The currently focused non-ignored token. */
      /**
       * The (1-indexed) line containing the current token.
       * Since a schema coordinate may not contain newline, this value is always 1.
       */
      line = 1;
      /**
       * The character offset at which the current line begins.
       * Since a schema coordinate may not contain newline, this value is always 0.
       */
      lineStart = 0;
      constructor(source) {
        const startOfFileToken = new _ast.Token(
          _tokenKind.TokenKind.SOF,
          0,
          0,
          0,
          0
        );
        this.source = source;
        this.lastToken = startOfFileToken;
        this.token = startOfFileToken;
      }
      get [Symbol.toStringTag]() {
        return "SchemaCoordinateLexer";
      }
      /**
       * Advances the token stream to the next non-ignored token.
       *
       * @internal
       */
      advance() {
        this.lastToken = this.token;
        const token = this.token = this.lookahead();
        return token;
      }
      /**
       * Looks ahead and returns the next non-ignored token, but does not change
       * the current Lexer token.
       *
       * @internal
       */
      lookahead() {
        let token = this.token;
        if (token.kind !== _tokenKind.TokenKind.EOF) {
          const nextToken = readNextToken(this, token.end);
          token.next = nextToken;
          nextToken.prev = token;
          token = nextToken;
        }
        return token;
      }
    };
    exports.SchemaCoordinateLexer = SchemaCoordinateLexer;
    function readNextToken(lexer, start) {
      const body = lexer.source.body;
      const bodyLength = body.length;
      const position = start;
      if (position < bodyLength) {
        const code = body.charCodeAt(position);
        switch (code) {
          case 46:
            return (0, _lexer.createToken)(
              lexer,
              _tokenKind.TokenKind.DOT,
              position,
              position + 1
            );
          case 40:
            return (0, _lexer.createToken)(
              lexer,
              _tokenKind.TokenKind.PAREN_L,
              position,
              position + 1
            );
          case 41:
            return (0, _lexer.createToken)(
              lexer,
              _tokenKind.TokenKind.PAREN_R,
              position,
              position + 1
            );
          case 58:
            return (0, _lexer.createToken)(
              lexer,
              _tokenKind.TokenKind.COLON,
              position,
              position + 1
            );
          case 64:
            return (0, _lexer.createToken)(
              lexer,
              _tokenKind.TokenKind.AT,
              position,
              position + 1
            );
        }
        if ((0, _characterClasses.isNameStart)(code)) {
          return (0, _lexer.readName)(lexer, position);
        }
        throw (0, _syntaxError.syntaxError)(
          lexer.source,
          position,
          `Invalid character: ${(0, _lexer.printCodePointAt)(lexer, position)}.`
        );
      }
      return (0, _lexer.createToken)(
        lexer,
        _tokenKind.TokenKind.EOF,
        bodyLength,
        bodyLength
      );
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/inspect.js
var require_inspect = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/inspect.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.inspect = inspect;
    var MAX_ARRAY_LENGTH = 10;
    var MAX_RECURSIVE_DEPTH = 2;
    function inspect(value) {
      return formatValue(value, []);
    }
    function formatValue(value, seenValues) {
      switch (typeof value) {
        case "string":
          return JSON.stringify(value);
        case "function":
          return value.name ? `[function ${value.name}]` : "[function]";
        case "object":
          return formatObjectValue(value, seenValues);
        default:
          return String(value);
      }
    }
    function formatObjectValue(value, previouslySeenValues) {
      if (value === null) {
        return "null";
      }
      if (previouslySeenValues.includes(value)) {
        return "[Circular]";
      }
      const seenValues = [...previouslySeenValues, value];
      if (isJSONable(value)) {
        const jsonValue = value.toJSON();
        if (jsonValue !== value) {
          return typeof jsonValue === "string" ? jsonValue : formatValue(jsonValue, seenValues);
        }
      } else if (Array.isArray(value)) {
        return formatArray(value, seenValues);
      }
      return formatObject(value, seenValues);
    }
    function isJSONable(value) {
      return typeof value.toJSON === "function";
    }
    function formatObject(object, seenValues) {
      const entries = Object.entries(object);
      if (entries.length === 0) {
        return "{}";
      }
      if (seenValues.length > MAX_RECURSIVE_DEPTH) {
        return "[" + getObjectTag(object) + "]";
      }
      const properties = entries.map(
        ([key, value]) => key + ": " + formatValue(value, seenValues)
      );
      return "{ " + properties.join(", ") + " }";
    }
    function formatArray(array, seenValues) {
      if (array.length === 0) {
        return "[]";
      }
      if (seenValues.length > MAX_RECURSIVE_DEPTH) {
        return "[Array]";
      }
      const len = Math.min(MAX_ARRAY_LENGTH, array.length);
      const remaining = array.length - len;
      const items = [];
      for (let i = 0; i < len; ++i) {
        items.push(formatValue(array[i], seenValues));
      }
      if (remaining === 1) {
        items.push("... 1 more item");
      } else if (remaining > 1) {
        items.push(`... ${remaining} more items`);
      }
      return "[" + items.join(", ") + "]";
    }
    function getObjectTag(object) {
      const tag = Object.prototype.toString.call(object).replace(/^\[object /, "").replace(/]$/, "");
      if (tag === "Object" && typeof object.constructor === "function") {
        const name2 = object.constructor.name;
        if (typeof name2 === "string" && name2 !== "") {
          return name2;
        }
      }
      return tag;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/instanceOf.js
var require_instanceOf = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/instanceOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.instanceOf = void 0;
    var _inspect = require_inspect();
    var isProduction = globalThis.process && // eslint-disable-next-line no-undef
    process.env.NODE_ENV === "production";
    var instanceOf = (
      /* c8 ignore next 6 */
      // FIXME: https://github.com/graphql/graphql-js/issues/2317
      isProduction ? function instanceOf2(value, constructor) {
        return value instanceof constructor;
      } : function instanceOf2(value, constructor) {
        if (value instanceof constructor) {
          return true;
        }
        if (typeof value === "object" && value !== null) {
          var _value$constructor;
          const className = constructor.prototype[Symbol.toStringTag];
          const valueClassName = (
            // We still need to support constructor's name to detect conflicts with older versions of this library.
            Symbol.toStringTag in value ? value[Symbol.toStringTag] : (_value$constructor = value.constructor) === null || _value$constructor === void 0 ? void 0 : _value$constructor.name
          );
          if (className === valueClassName) {
            const stringifiedValue = (0, _inspect.inspect)(value);
            throw new Error(`Cannot use ${className} "${stringifiedValue}" from another module or realm.

Ensure that there is only one instance of "graphql" in the node_modules
directory. If different versions of "graphql" are the dependencies of other
relied on modules, use "resolutions" to ensure only one version is installed.

https://yarnpkg.com/en/docs/selective-version-resolutions

Duplicate "graphql" modules cannot be used at the same time since different
versions may have different capabilities and behavior. The data from one
version used in the function from another could produce confusing and
spurious results.`);
          }
        }
        return false;
      }
    );
    exports.instanceOf = instanceOf;
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/source.js
var require_source = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/source.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Source = void 0;
    exports.isSource = isSource;
    var _devAssert = require_devAssert();
    var _inspect = require_inspect();
    var _instanceOf = require_instanceOf();
    var Source = class {
      /** The GraphQL source text. */
      /** Name used in diagnostics for this source, such as a file path or request name. */
      /** One-indexed line and column where this source begins. */
      /**
       * Creates a Source instance.
       * @param body - The GraphQL source text.
       * @param name - Name used in diagnostics for this source.
       * @param locationOffset - One-indexed line and column where this source begins.
       * @example
       * ```ts
       * import { Source } from 'graphql/language';
       *
       * const source = new Source('type Query { greeting: String }', 'schema.graphql', {
       *   line: 10,
       *   column: 1,
       * });
       *
       * source.body; // => 'type Query { greeting: String }'
       * source.name; // => 'schema.graphql'
       * source.locationOffset; // => { line: 10, column: 1 }
       * ```
       */
      constructor(body, name2 = "GraphQL request", locationOffset = {
        line: 1,
        column: 1
      }) {
        typeof body === "string" || (0, _devAssert.devAssert)(
          false,
          `Body must be a string. Received: ${(0, _inspect.inspect)(body)}.`
        );
        this.body = body;
        this.name = name2;
        this.locationOffset = locationOffset;
        this.locationOffset.line > 0 || (0, _devAssert.devAssert)(
          false,
          "line in locationOffset is 1-indexed and must be positive."
        );
        this.locationOffset.column > 0 || (0, _devAssert.devAssert)(
          false,
          "column in locationOffset is 1-indexed and must be positive."
        );
      }
      /**
       * Returns the value used by `Object.prototype.toString`.
       * @returns The built-in string tag for this object.
       */
      get [Symbol.toStringTag]() {
        return "Source";
      }
    };
    exports.Source = Source;
    function isSource(source) {
      return (0, _instanceOf.instanceOf)(source, Source);
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/parser.js
var require_parser = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/parser.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.Parser = void 0;
    exports.parse = parse3;
    exports.parseConstValue = parseConstValue;
    exports.parseSchemaCoordinate = parseSchemaCoordinate;
    exports.parseType = parseType;
    exports.parseValue = parseValue;
    var _syntaxError = require_syntaxError();
    var _ast = require_ast();
    var _directiveLocation = require_directiveLocation();
    var _kinds = require_kinds();
    var _lexer = require_lexer();
    var _schemaCoordinateLexer = require_schemaCoordinateLexer();
    var _source = require_source();
    var _tokenKind = require_tokenKind();
    function parse3(source, options) {
      const parser = new Parser(source, options);
      const document = parser.parseDocument();
      Object.defineProperty(document, "tokenCount", {
        enumerable: false,
        value: parser.tokenCount
      });
      return document;
    }
    function parseValue(source, options) {
      const parser = new Parser(source, options);
      parser.expectToken(_tokenKind.TokenKind.SOF);
      const value = parser.parseValueLiteral(false);
      parser.expectToken(_tokenKind.TokenKind.EOF);
      return value;
    }
    function parseConstValue(source, options) {
      const parser = new Parser(source, options);
      parser.expectToken(_tokenKind.TokenKind.SOF);
      const value = parser.parseConstValueLiteral();
      parser.expectToken(_tokenKind.TokenKind.EOF);
      return value;
    }
    function parseType(source, options) {
      const parser = new Parser(source, options);
      parser.expectToken(_tokenKind.TokenKind.SOF);
      const type = parser.parseTypeReference();
      parser.expectToken(_tokenKind.TokenKind.EOF);
      return type;
    }
    function parseSchemaCoordinate(source) {
      const sourceObj = (0, _source.isSource)(source) ? source : new _source.Source(source);
      const lexer = new _schemaCoordinateLexer.SchemaCoordinateLexer(sourceObj);
      const parser = new Parser(source, {
        lexer
      });
      parser.expectToken(_tokenKind.TokenKind.SOF);
      const coordinate = parser.parseSchemaCoordinate();
      parser.expectToken(_tokenKind.TokenKind.EOF);
      return coordinate;
    }
    var Parser = class {
      constructor(source, options = {}) {
        const { lexer, ..._options } = options;
        if (lexer) {
          this._lexer = lexer;
        } else {
          const sourceObj = (0, _source.isSource)(source) ? source : new _source.Source(source);
          this._lexer = new _lexer.Lexer(sourceObj);
        }
        this._options = _options;
        this._tokenCounter = 0;
        this._lexer._maxComments = options === null || options === void 0 ? void 0 : options.maxComments;
        this._lexer._commentCount = 0;
        const maxSourceLength = options === null || options === void 0 ? void 0 : options.maxSourceLength;
        if (maxSourceLength !== void 0 && this._lexer.source.body.length > maxSourceLength) {
          throw (0, _syntaxError.syntaxError)(
            this._lexer.source,
            maxSourceLength,
            `Source contains more than ${maxSourceLength} UTF-16 code units. Parsing aborted.`
          );
        }
      }
      get tokenCount() {
        return this._tokenCounter;
      }
      /**
       * Converts a name lex token into a name parse node.
       *
       * @internal
       */
      parseName() {
        const token = this.expectToken(_tokenKind.TokenKind.NAME);
        return this.node(token, {
          kind: _kinds.Kind.NAME,
          value: token.value
        });
      }
      // Implements the parsing rules in the Document section.
      /**
       * Document : Definition+
       *
       * @internal
       */
      parseDocument() {
        return this.node(this._lexer.token, {
          kind: _kinds.Kind.DOCUMENT,
          definitions: this.many(
            _tokenKind.TokenKind.SOF,
            this.parseDefinition,
            _tokenKind.TokenKind.EOF
          )
        });
      }
      /**
       * Definition :
       *   - ExecutableDefinition
       *   - TypeSystemDefinition
       *   - TypeSystemExtension
       *
       * ExecutableDefinition :
       *   - OperationDefinition
       *   - FragmentDefinition
       *
       * TypeSystemDefinition :
       *   - SchemaDefinition
       *   - TypeDefinition
       *   - DirectiveDefinition
       *
       * TypeDefinition :
       *   - ScalarTypeDefinition
       *   - ObjectTypeDefinition
       *   - InterfaceTypeDefinition
       *   - UnionTypeDefinition
       *   - EnumTypeDefinition
       *   - InputObjectTypeDefinition
       *
       * @internal
       */
      parseDefinition() {
        if (this.peek(_tokenKind.TokenKind.BRACE_L)) {
          return this.parseOperationDefinition();
        }
        const hasDescription = this.peekDescription();
        const keywordToken = hasDescription ? this._lexer.lookahead() : this._lexer.token;
        if (hasDescription && keywordToken.kind === _tokenKind.TokenKind.BRACE_L) {
          throw (0, _syntaxError.syntaxError)(
            this._lexer.source,
            this._lexer.token.start,
            "Unexpected description, descriptions are not supported on shorthand queries."
          );
        }
        if (keywordToken.kind === _tokenKind.TokenKind.NAME) {
          switch (keywordToken.value) {
            case "schema":
              return this.parseSchemaDefinition();
            case "scalar":
              return this.parseScalarTypeDefinition();
            case "type":
              return this.parseObjectTypeDefinition();
            case "interface":
              return this.parseInterfaceTypeDefinition();
            case "union":
              return this.parseUnionTypeDefinition();
            case "enum":
              return this.parseEnumTypeDefinition();
            case "input":
              return this.parseInputObjectTypeDefinition();
            case "directive":
              return this.parseDirectiveDefinition();
          }
          switch (keywordToken.value) {
            case "query":
            case "mutation":
            case "subscription":
              return this.parseOperationDefinition();
            case "fragment":
              return this.parseFragmentDefinition();
          }
          if (hasDescription) {
            throw (0, _syntaxError.syntaxError)(
              this._lexer.source,
              this._lexer.token.start,
              "Unexpected description, only GraphQL definitions support descriptions."
            );
          }
          switch (keywordToken.value) {
            case "extend":
              return this.parseTypeSystemExtension();
          }
        }
        throw this.unexpected(keywordToken);
      }
      // Implements the parsing rules in the Operations section.
      /**
       * OperationDefinition :
       *  - SelectionSet
       *  - OperationType Name? VariableDefinitions? Directives? SelectionSet
       *
       * @internal
       */
      parseOperationDefinition() {
        const start = this._lexer.token;
        if (this.peek(_tokenKind.TokenKind.BRACE_L)) {
          return this.node(start, {
            kind: _kinds.Kind.OPERATION_DEFINITION,
            operation: _ast.OperationTypeNode.QUERY,
            description: void 0,
            name: void 0,
            variableDefinitions: [],
            directives: [],
            selectionSet: this.parseSelectionSet()
          });
        }
        const description = this.parseDescription();
        const operation = this.parseOperationType();
        let name2;
        if (this.peek(_tokenKind.TokenKind.NAME)) {
          name2 = this.parseName();
        }
        return this.node(start, {
          kind: _kinds.Kind.OPERATION_DEFINITION,
          operation,
          description,
          name: name2,
          variableDefinitions: this.parseVariableDefinitions(),
          directives: this.parseDirectives(false),
          selectionSet: this.parseSelectionSet()
        });
      }
      /**
       * OperationType : one of query mutation subscription
       *
       * @internal
       */
      parseOperationType() {
        const operationToken = this.expectToken(_tokenKind.TokenKind.NAME);
        switch (operationToken.value) {
          case "query":
            return _ast.OperationTypeNode.QUERY;
          case "mutation":
            return _ast.OperationTypeNode.MUTATION;
          case "subscription":
            return _ast.OperationTypeNode.SUBSCRIPTION;
        }
        throw this.unexpected(operationToken);
      }
      /**
       * VariableDefinitions : ( VariableDefinition+ )
       *
       * @internal
       */
      parseVariableDefinitions() {
        return this.optionalMany(
          _tokenKind.TokenKind.PAREN_L,
          this.parseVariableDefinition,
          _tokenKind.TokenKind.PAREN_R
        );
      }
      /**
       * VariableDefinition : Variable : Type DefaultValue? Directives[Const]?
       *
       * @internal
       */
      parseVariableDefinition() {
        return this.node(this._lexer.token, {
          kind: _kinds.Kind.VARIABLE_DEFINITION,
          description: this.parseDescription(),
          variable: this.parseVariable(),
          type: (this.expectToken(_tokenKind.TokenKind.COLON), this.parseTypeReference()),
          defaultValue: this.expectOptionalToken(_tokenKind.TokenKind.EQUALS) ? this.parseConstValueLiteral() : void 0,
          directives: this.parseConstDirectives()
        });
      }
      /**
       * Variable : $ Name
       *
       * @internal
       */
      parseVariable() {
        const start = this._lexer.token;
        this.expectToken(_tokenKind.TokenKind.DOLLAR);
        return this.node(start, {
          kind: _kinds.Kind.VARIABLE,
          name: this.parseName()
        });
      }
      /**
       * ```
       * SelectionSet : { Selection+ }
       * ```
       *
       * @internal
       */
      parseSelectionSet() {
        return this.node(this._lexer.token, {
          kind: _kinds.Kind.SELECTION_SET,
          selections: this.many(
            _tokenKind.TokenKind.BRACE_L,
            this.parseSelection,
            _tokenKind.TokenKind.BRACE_R
          )
        });
      }
      /**
       * Selection :
       *   - Field
       *   - FragmentSpread
       *   - InlineFragment
       *
       * @internal
       */
      parseSelection() {
        return this.peek(_tokenKind.TokenKind.SPREAD) ? this.parseFragment() : this.parseField();
      }
      /**
       * Field : Alias? Name Arguments? Directives? SelectionSet?
       *
       * Alias : Name :
       *
       * @internal
       */
      parseField() {
        const start = this._lexer.token;
        const nameOrAlias = this.parseName();
        let alias;
        let name2;
        if (this.expectOptionalToken(_tokenKind.TokenKind.COLON)) {
          alias = nameOrAlias;
          name2 = this.parseName();
        } else {
          name2 = nameOrAlias;
        }
        return this.node(start, {
          kind: _kinds.Kind.FIELD,
          alias,
          name: name2,
          arguments: this.parseArguments(false),
          directives: this.parseDirectives(false),
          selectionSet: this.peek(_tokenKind.TokenKind.BRACE_L) ? this.parseSelectionSet() : void 0
        });
      }
      /**
       * Arguments[Const] : ( Argument[?Const]+ )
       *
       * @internal
       */
      parseArguments(isConst) {
        const item = isConst ? this.parseConstArgument : this.parseArgument;
        return this.optionalMany(
          _tokenKind.TokenKind.PAREN_L,
          item,
          _tokenKind.TokenKind.PAREN_R
        );
      }
      /**
       * Argument[Const] : Name : Value[?Const]
       *
       * @internal
       */
      parseArgument(isConst = false) {
        const start = this._lexer.token;
        const name2 = this.parseName();
        this.expectToken(_tokenKind.TokenKind.COLON);
        return this.node(start, {
          kind: _kinds.Kind.ARGUMENT,
          name: name2,
          value: this.parseValueLiteral(isConst)
        });
      }
      parseConstArgument() {
        return this.parseArgument(true);
      }
      // Implements the parsing rules in the Fragments section.
      /**
       * Corresponds to both FragmentSpread and InlineFragment in the spec.
       *
       * FragmentSpread : ... FragmentName Directives?
       *
       * InlineFragment : ... TypeCondition? Directives? SelectionSet
       *
       * @internal
       */
      parseFragment() {
        const start = this._lexer.token;
        this.expectToken(_tokenKind.TokenKind.SPREAD);
        const hasTypeCondition = this.expectOptionalKeyword("on");
        if (!hasTypeCondition && this.peek(_tokenKind.TokenKind.NAME)) {
          return this.node(start, {
            kind: _kinds.Kind.FRAGMENT_SPREAD,
            name: this.parseFragmentName(),
            directives: this.parseDirectives(false)
          });
        }
        return this.node(start, {
          kind: _kinds.Kind.INLINE_FRAGMENT,
          typeCondition: hasTypeCondition ? this.parseNamedType() : void 0,
          directives: this.parseDirectives(false),
          selectionSet: this.parseSelectionSet()
        });
      }
      /**
       * FragmentDefinition :
       *   - fragment FragmentName on TypeCondition Directives? SelectionSet
       *
       * TypeCondition : NamedType
       *
       * @internal
       */
      parseFragmentDefinition() {
        const start = this._lexer.token;
        const description = this.parseDescription();
        this.expectKeyword("fragment");
        if (this._options.allowLegacyFragmentVariables === true) {
          return this.node(start, {
            kind: _kinds.Kind.FRAGMENT_DEFINITION,
            description,
            name: this.parseFragmentName(),
            variableDefinitions: this.parseVariableDefinitions(),
            typeCondition: (this.expectKeyword("on"), this.parseNamedType()),
            directives: this.parseDirectives(false),
            selectionSet: this.parseSelectionSet()
          });
        }
        return this.node(start, {
          kind: _kinds.Kind.FRAGMENT_DEFINITION,
          description,
          name: this.parseFragmentName(),
          typeCondition: (this.expectKeyword("on"), this.parseNamedType()),
          directives: this.parseDirectives(false),
          selectionSet: this.parseSelectionSet()
        });
      }
      /**
       * FragmentName : Name but not `on`
       *
       * @internal
       */
      parseFragmentName() {
        if (this._lexer.token.value === "on") {
          throw this.unexpected();
        }
        return this.parseName();
      }
      // Implements the parsing rules in the Values section.
      /**
       * Value[Const] :
       *   - [~Const] Variable
       *   - IntValue
       *   - FloatValue
       *   - StringValue
       *   - BooleanValue
       *   - NullValue
       *   - EnumValue
       *   - ListValue[?Const]
       *   - ObjectValue[?Const]
       *
       * BooleanValue : one of `true` `false`
       *
       * NullValue : `null`
       *
       * EnumValue : Name but not `true`, `false` or `null`
       *
       * @internal
       */
      parseValueLiteral(isConst) {
        const token = this._lexer.token;
        switch (token.kind) {
          case _tokenKind.TokenKind.BRACKET_L:
            return this.parseList(isConst);
          case _tokenKind.TokenKind.BRACE_L:
            return this.parseObject(isConst);
          case _tokenKind.TokenKind.INT:
            this.advanceLexer();
            return this.node(token, {
              kind: _kinds.Kind.INT,
              value: token.value
            });
          case _tokenKind.TokenKind.FLOAT:
            this.advanceLexer();
            return this.node(token, {
              kind: _kinds.Kind.FLOAT,
              value: token.value
            });
          case _tokenKind.TokenKind.STRING:
          case _tokenKind.TokenKind.BLOCK_STRING:
            return this.parseStringLiteral();
          case _tokenKind.TokenKind.NAME:
            this.advanceLexer();
            switch (token.value) {
              case "true":
                return this.node(token, {
                  kind: _kinds.Kind.BOOLEAN,
                  value: true
                });
              case "false":
                return this.node(token, {
                  kind: _kinds.Kind.BOOLEAN,
                  value: false
                });
              case "null":
                return this.node(token, {
                  kind: _kinds.Kind.NULL
                });
              default:
                return this.node(token, {
                  kind: _kinds.Kind.ENUM,
                  value: token.value
                });
            }
          case _tokenKind.TokenKind.DOLLAR:
            if (isConst) {
              this.expectToken(_tokenKind.TokenKind.DOLLAR);
              if (this._lexer.token.kind === _tokenKind.TokenKind.NAME) {
                const varName = this._lexer.token.value;
                throw (0, _syntaxError.syntaxError)(
                  this._lexer.source,
                  token.start,
                  `Unexpected variable "$${varName}" in constant value.`
                );
              } else {
                throw this.unexpected(token);
              }
            }
            return this.parseVariable();
          default:
            throw this.unexpected();
        }
      }
      parseConstValueLiteral() {
        return this.parseValueLiteral(true);
      }
      parseStringLiteral() {
        const token = this._lexer.token;
        this.advanceLexer();
        return this.node(token, {
          kind: _kinds.Kind.STRING,
          value: token.value,
          block: token.kind === _tokenKind.TokenKind.BLOCK_STRING
        });
      }
      /**
       * ListValue[Const] :
       *   - [ ]
       *   - [ Value[?Const]+ ]
       *
       * @internal
       */
      parseList(isConst) {
        const item = () => this.parseValueLiteral(isConst);
        return this.node(this._lexer.token, {
          kind: _kinds.Kind.LIST,
          values: this.any(
            _tokenKind.TokenKind.BRACKET_L,
            item,
            _tokenKind.TokenKind.BRACKET_R
          )
        });
      }
      /**
       * ```
       * ObjectValue[Const] :
       *   - { }
       *   - { ObjectField[?Const]+ }
       * ```
       *
       * @internal
       */
      parseObject(isConst) {
        const item = () => this.parseObjectField(isConst);
        return this.node(this._lexer.token, {
          kind: _kinds.Kind.OBJECT,
          fields: this.any(
            _tokenKind.TokenKind.BRACE_L,
            item,
            _tokenKind.TokenKind.BRACE_R
          )
        });
      }
      /**
       * ObjectField[Const] : Name : Value[?Const]
       *
       * @internal
       */
      parseObjectField(isConst) {
        const start = this._lexer.token;
        const name2 = this.parseName();
        this.expectToken(_tokenKind.TokenKind.COLON);
        return this.node(start, {
          kind: _kinds.Kind.OBJECT_FIELD,
          name: name2,
          value: this.parseValueLiteral(isConst)
        });
      }
      // Implements the parsing rules in the Directives section.
      /**
       * Directives[Const] : Directive[?Const]+
       *
       * @internal
       */
      parseDirectives(isConst) {
        const directives = [];
        while (this.peek(_tokenKind.TokenKind.AT)) {
          directives.push(this.parseDirective(isConst));
        }
        return directives;
      }
      parseConstDirectives() {
        return this.parseDirectives(true);
      }
      /**
       * ```
       * Directive[Const] : @ Name Arguments[?Const]?
       * ```
       *
       * @internal
       */
      parseDirective(isConst) {
        const start = this._lexer.token;
        this.expectToken(_tokenKind.TokenKind.AT);
        return this.node(start, {
          kind: _kinds.Kind.DIRECTIVE,
          name: this.parseName(),
          arguments: this.parseArguments(isConst)
        });
      }
      // Implements the parsing rules in the Types section.
      /**
       * Type :
       *   - NamedType
       *   - ListType
       *   - NonNullType
       *
       * @internal
       */
      parseTypeReference() {
        const start = this._lexer.token;
        let type;
        if (this.expectOptionalToken(_tokenKind.TokenKind.BRACKET_L)) {
          const innerType = this.parseTypeReference();
          this.expectToken(_tokenKind.TokenKind.BRACKET_R);
          type = this.node(start, {
            kind: _kinds.Kind.LIST_TYPE,
            type: innerType
          });
        } else {
          type = this.parseNamedType();
        }
        if (this.expectOptionalToken(_tokenKind.TokenKind.BANG)) {
          return this.node(start, {
            kind: _kinds.Kind.NON_NULL_TYPE,
            type
          });
        }
        return type;
      }
      /**
       * NamedType : Name
       *
       * @internal
       */
      parseNamedType() {
        return this.node(this._lexer.token, {
          kind: _kinds.Kind.NAMED_TYPE,
          name: this.parseName()
        });
      }
      // Implements the parsing rules in the Type Definition section.
      peekDescription() {
        return this.peek(_tokenKind.TokenKind.STRING) || this.peek(_tokenKind.TokenKind.BLOCK_STRING);
      }
      /**
       * Description : StringValue
       *
       * @internal
       */
      parseDescription() {
        if (this.peekDescription()) {
          return this.parseStringLiteral();
        }
      }
      /**
       * ```
       * SchemaDefinition : Description? schema Directives[Const]? { OperationTypeDefinition+ }
       * ```
       *
       * @internal
       */
      parseSchemaDefinition() {
        const start = this._lexer.token;
        const description = this.parseDescription();
        this.expectKeyword("schema");
        const directives = this.parseConstDirectives();
        const operationTypes = this.many(
          _tokenKind.TokenKind.BRACE_L,
          this.parseOperationTypeDefinition,
          _tokenKind.TokenKind.BRACE_R
        );
        return this.node(start, {
          kind: _kinds.Kind.SCHEMA_DEFINITION,
          description,
          directives,
          operationTypes
        });
      }
      /**
       * OperationTypeDefinition : OperationType : NamedType
       *
       * @internal
       */
      parseOperationTypeDefinition() {
        const start = this._lexer.token;
        const operation = this.parseOperationType();
        this.expectToken(_tokenKind.TokenKind.COLON);
        const type = this.parseNamedType();
        return this.node(start, {
          kind: _kinds.Kind.OPERATION_TYPE_DEFINITION,
          operation,
          type
        });
      }
      /**
       * ScalarTypeDefinition : Description? scalar Name Directives[Const]?
       *
       * @internal
       */
      parseScalarTypeDefinition() {
        const start = this._lexer.token;
        const description = this.parseDescription();
        this.expectKeyword("scalar");
        const name2 = this.parseName();
        const directives = this.parseConstDirectives();
        return this.node(start, {
          kind: _kinds.Kind.SCALAR_TYPE_DEFINITION,
          description,
          name: name2,
          directives
        });
      }
      /**
       * ObjectTypeDefinition :
       *   Description?
       *   type Name ImplementsInterfaces? Directives[Const]? FieldsDefinition?
       *
       * @internal
       */
      parseObjectTypeDefinition() {
        const start = this._lexer.token;
        const description = this.parseDescription();
        this.expectKeyword("type");
        const name2 = this.parseName();
        const interfaces = this.parseImplementsInterfaces();
        const directives = this.parseConstDirectives();
        const fields = this.parseFieldsDefinition();
        return this.node(start, {
          kind: _kinds.Kind.OBJECT_TYPE_DEFINITION,
          description,
          name: name2,
          interfaces,
          directives,
          fields
        });
      }
      /**
       * ImplementsInterfaces :
       *   - implements `&`? NamedType
       *   - ImplementsInterfaces & NamedType
       *
       * @internal
       */
      parseImplementsInterfaces() {
        return this.expectOptionalKeyword("implements") ? this.delimitedMany(_tokenKind.TokenKind.AMP, this.parseNamedType) : [];
      }
      /**
       * ```
       * FieldsDefinition : { FieldDefinition+ }
       * ```
       *
       * @internal
       */
      parseFieldsDefinition() {
        return this.optionalMany(
          _tokenKind.TokenKind.BRACE_L,
          this.parseFieldDefinition,
          _tokenKind.TokenKind.BRACE_R
        );
      }
      /**
       * FieldDefinition :
       *   - Description? Name ArgumentsDefinition? : Type Directives[Const]?
       *
       * @internal
       */
      parseFieldDefinition() {
        const start = this._lexer.token;
        const description = this.parseDescription();
        const name2 = this.parseName();
        const args = this.parseArgumentDefs();
        this.expectToken(_tokenKind.TokenKind.COLON);
        const type = this.parseTypeReference();
        const directives = this.parseConstDirectives();
        return this.node(start, {
          kind: _kinds.Kind.FIELD_DEFINITION,
          description,
          name: name2,
          arguments: args,
          type,
          directives
        });
      }
      /**
       * ArgumentsDefinition : ( InputValueDefinition+ )
       *
       * @internal
       */
      parseArgumentDefs() {
        return this.optionalMany(
          _tokenKind.TokenKind.PAREN_L,
          this.parseInputValueDef,
          _tokenKind.TokenKind.PAREN_R
        );
      }
      /**
       * InputValueDefinition :
       *   - Description? Name : Type DefaultValue? Directives[Const]?
       *
       * @internal
       */
      parseInputValueDef() {
        const start = this._lexer.token;
        const description = this.parseDescription();
        const name2 = this.parseName();
        this.expectToken(_tokenKind.TokenKind.COLON);
        const type = this.parseTypeReference();
        let defaultValue;
        if (this.expectOptionalToken(_tokenKind.TokenKind.EQUALS)) {
          defaultValue = this.parseConstValueLiteral();
        }
        const directives = this.parseConstDirectives();
        return this.node(start, {
          kind: _kinds.Kind.INPUT_VALUE_DEFINITION,
          description,
          name: name2,
          type,
          defaultValue,
          directives
        });
      }
      /**
       * InterfaceTypeDefinition :
       *   - Description? interface Name Directives[Const]? FieldsDefinition?
       *
       * @internal
       */
      parseInterfaceTypeDefinition() {
        const start = this._lexer.token;
        const description = this.parseDescription();
        this.expectKeyword("interface");
        const name2 = this.parseName();
        const interfaces = this.parseImplementsInterfaces();
        const directives = this.parseConstDirectives();
        const fields = this.parseFieldsDefinition();
        return this.node(start, {
          kind: _kinds.Kind.INTERFACE_TYPE_DEFINITION,
          description,
          name: name2,
          interfaces,
          directives,
          fields
        });
      }
      /**
       * UnionTypeDefinition :
       *   - Description? union Name Directives[Const]? UnionMemberTypes?
       *
       * @internal
       */
      parseUnionTypeDefinition() {
        const start = this._lexer.token;
        const description = this.parseDescription();
        this.expectKeyword("union");
        const name2 = this.parseName();
        const directives = this.parseConstDirectives();
        const types = this.parseUnionMemberTypes();
        return this.node(start, {
          kind: _kinds.Kind.UNION_TYPE_DEFINITION,
          description,
          name: name2,
          directives,
          types
        });
      }
      /**
       * UnionMemberTypes :
       *   - = `|`? NamedType
       *   - UnionMemberTypes | NamedType
       *
       * @internal
       */
      parseUnionMemberTypes() {
        return this.expectOptionalToken(_tokenKind.TokenKind.EQUALS) ? this.delimitedMany(_tokenKind.TokenKind.PIPE, this.parseNamedType) : [];
      }
      /**
       * EnumTypeDefinition :
       *   - Description? enum Name Directives[Const]? EnumValuesDefinition?
       *
       * @internal
       */
      parseEnumTypeDefinition() {
        const start = this._lexer.token;
        const description = this.parseDescription();
        this.expectKeyword("enum");
        const name2 = this.parseName();
        const directives = this.parseConstDirectives();
        const values = this.parseEnumValuesDefinition();
        return this.node(start, {
          kind: _kinds.Kind.ENUM_TYPE_DEFINITION,
          description,
          name: name2,
          directives,
          values
        });
      }
      /**
       * ```
       * EnumValuesDefinition : { EnumValueDefinition+ }
       * ```
       *
       * @internal
       */
      parseEnumValuesDefinition() {
        return this.optionalMany(
          _tokenKind.TokenKind.BRACE_L,
          this.parseEnumValueDefinition,
          _tokenKind.TokenKind.BRACE_R
        );
      }
      /**
       * EnumValueDefinition : Description? EnumValue Directives[Const]?
       *
       * @internal
       */
      parseEnumValueDefinition() {
        const start = this._lexer.token;
        const description = this.parseDescription();
        const name2 = this.parseEnumValueName();
        const directives = this.parseConstDirectives();
        return this.node(start, {
          kind: _kinds.Kind.ENUM_VALUE_DEFINITION,
          description,
          name: name2,
          directives
        });
      }
      /**
       * EnumValue : Name but not `true`, `false` or `null`
       *
       * @internal
       */
      parseEnumValueName() {
        if (this._lexer.token.value === "true" || this._lexer.token.value === "false" || this._lexer.token.value === "null") {
          throw (0, _syntaxError.syntaxError)(
            this._lexer.source,
            this._lexer.token.start,
            `${getTokenDesc(
              this._lexer.token
            )} is reserved and cannot be used for an enum value.`
          );
        }
        return this.parseName();
      }
      /**
       * InputObjectTypeDefinition :
       *   - Description? input Name Directives[Const]? InputFieldsDefinition?
       *
       * @internal
       */
      parseInputObjectTypeDefinition() {
        const start = this._lexer.token;
        const description = this.parseDescription();
        this.expectKeyword("input");
        const name2 = this.parseName();
        const directives = this.parseConstDirectives();
        const fields = this.parseInputFieldsDefinition();
        return this.node(start, {
          kind: _kinds.Kind.INPUT_OBJECT_TYPE_DEFINITION,
          description,
          name: name2,
          directives,
          fields
        });
      }
      /**
       * ```
       * InputFieldsDefinition : { InputValueDefinition+ }
       * ```
       *
       * @internal
       */
      parseInputFieldsDefinition() {
        return this.optionalMany(
          _tokenKind.TokenKind.BRACE_L,
          this.parseInputValueDef,
          _tokenKind.TokenKind.BRACE_R
        );
      }
      /**
       * TypeSystemExtension :
       *   - SchemaExtension
       *   - TypeExtension
       *
       * TypeExtension :
       *   - ScalarTypeExtension
       *   - ObjectTypeExtension
       *   - InterfaceTypeExtension
       *   - UnionTypeExtension
       *   - EnumTypeExtension
       *   - InputObjectTypeDefinition
       *   - DirectiveDefinitionExtension
       *
       * @internal
       */
      parseTypeSystemExtension() {
        const keywordToken = this._lexer.lookahead();
        if (keywordToken.kind === _tokenKind.TokenKind.NAME) {
          switch (keywordToken.value) {
            case "schema":
              return this.parseSchemaExtension();
            case "scalar":
              return this.parseScalarTypeExtension();
            case "type":
              return this.parseObjectTypeExtension();
            case "interface":
              return this.parseInterfaceTypeExtension();
            case "union":
              return this.parseUnionTypeExtension();
            case "enum":
              return this.parseEnumTypeExtension();
            case "input":
              return this.parseInputObjectTypeExtension();
            case "directive":
              if (this._options.experimentalDirectivesOnDirectiveDefinitions) {
                return this.parseDirectiveDefinitionExtension();
              }
              break;
          }
        }
        throw this.unexpected(keywordToken);
      }
      /**
       * ```
       * SchemaExtension :
       *  - extend schema Directives[Const]? { OperationTypeDefinition+ }
       *  - extend schema Directives[Const]
       * ```
       *
       * @internal
       */
      parseSchemaExtension() {
        const start = this._lexer.token;
        this.expectKeyword("extend");
        this.expectKeyword("schema");
        const directives = this.parseConstDirectives();
        const operationTypes = this.optionalMany(
          _tokenKind.TokenKind.BRACE_L,
          this.parseOperationTypeDefinition,
          _tokenKind.TokenKind.BRACE_R
        );
        if (directives.length === 0 && operationTypes.length === 0) {
          throw this.unexpected();
        }
        return this.node(start, {
          kind: _kinds.Kind.SCHEMA_EXTENSION,
          directives,
          operationTypes
        });
      }
      /**
       * ScalarTypeExtension :
       *   - extend scalar Name Directives[Const]
       *
       * @internal
       */
      parseScalarTypeExtension() {
        const start = this._lexer.token;
        this.expectKeyword("extend");
        this.expectKeyword("scalar");
        const name2 = this.parseName();
        const directives = this.parseConstDirectives();
        if (directives.length === 0) {
          throw this.unexpected();
        }
        return this.node(start, {
          kind: _kinds.Kind.SCALAR_TYPE_EXTENSION,
          name: name2,
          directives
        });
      }
      /**
       * ObjectTypeExtension :
       *  - extend type Name ImplementsInterfaces? Directives[Const]? FieldsDefinition
       *  - extend type Name ImplementsInterfaces? Directives[Const]
       *  - extend type Name ImplementsInterfaces
       *
       * @internal
       */
      parseObjectTypeExtension() {
        const start = this._lexer.token;
        this.expectKeyword("extend");
        this.expectKeyword("type");
        const name2 = this.parseName();
        const interfaces = this.parseImplementsInterfaces();
        const directives = this.parseConstDirectives();
        const fields = this.parseFieldsDefinition();
        if (interfaces.length === 0 && directives.length === 0 && fields.length === 0) {
          throw this.unexpected();
        }
        return this.node(start, {
          kind: _kinds.Kind.OBJECT_TYPE_EXTENSION,
          name: name2,
          interfaces,
          directives,
          fields
        });
      }
      /**
       * InterfaceTypeExtension :
       *  - extend interface Name ImplementsInterfaces? Directives[Const]? FieldsDefinition
       *  - extend interface Name ImplementsInterfaces? Directives[Const]
       *  - extend interface Name ImplementsInterfaces
       *
       * @internal
       */
      parseInterfaceTypeExtension() {
        const start = this._lexer.token;
        this.expectKeyword("extend");
        this.expectKeyword("interface");
        const name2 = this.parseName();
        const interfaces = this.parseImplementsInterfaces();
        const directives = this.parseConstDirectives();
        const fields = this.parseFieldsDefinition();
        if (interfaces.length === 0 && directives.length === 0 && fields.length === 0) {
          throw this.unexpected();
        }
        return this.node(start, {
          kind: _kinds.Kind.INTERFACE_TYPE_EXTENSION,
          name: name2,
          interfaces,
          directives,
          fields
        });
      }
      /**
       * UnionTypeExtension :
       *   - extend union Name Directives[Const]? UnionMemberTypes
       *   - extend union Name Directives[Const]
       *
       * @internal
       */
      parseUnionTypeExtension() {
        const start = this._lexer.token;
        this.expectKeyword("extend");
        this.expectKeyword("union");
        const name2 = this.parseName();
        const directives = this.parseConstDirectives();
        const types = this.parseUnionMemberTypes();
        if (directives.length === 0 && types.length === 0) {
          throw this.unexpected();
        }
        return this.node(start, {
          kind: _kinds.Kind.UNION_TYPE_EXTENSION,
          name: name2,
          directives,
          types
        });
      }
      /**
       * EnumTypeExtension :
       *   - extend enum Name Directives[Const]? EnumValuesDefinition
       *   - extend enum Name Directives[Const]
       *
       * @internal
       */
      parseEnumTypeExtension() {
        const start = this._lexer.token;
        this.expectKeyword("extend");
        this.expectKeyword("enum");
        const name2 = this.parseName();
        const directives = this.parseConstDirectives();
        const values = this.parseEnumValuesDefinition();
        if (directives.length === 0 && values.length === 0) {
          throw this.unexpected();
        }
        return this.node(start, {
          kind: _kinds.Kind.ENUM_TYPE_EXTENSION,
          name: name2,
          directives,
          values
        });
      }
      /**
       * InputObjectTypeExtension :
       *   - extend input Name Directives[Const]? InputFieldsDefinition
       *   - extend input Name Directives[Const]
       *
       * @internal
       */
      parseInputObjectTypeExtension() {
        const start = this._lexer.token;
        this.expectKeyword("extend");
        this.expectKeyword("input");
        const name2 = this.parseName();
        const directives = this.parseConstDirectives();
        const fields = this.parseInputFieldsDefinition();
        if (directives.length === 0 && fields.length === 0) {
          throw this.unexpected();
        }
        return this.node(start, {
          kind: _kinds.Kind.INPUT_OBJECT_TYPE_EXTENSION,
          name: name2,
          directives,
          fields
        });
      }
      parseDirectiveDefinitionExtension() {
        const start = this._lexer.token;
        this.expectKeyword("extend");
        this.expectKeyword("directive");
        this.expectToken(_tokenKind.TokenKind.AT);
        const name2 = this.parseName();
        const directives = this.parseConstDirectives();
        if (directives.length === 0) {
          throw this.unexpected();
        }
        return this.node(start, {
          kind: _kinds.Kind.DIRECTIVE_EXTENSION,
          name: name2,
          directives
        });
      }
      /**
       * ```
       * DirectiveDefinition :
       *   - Description? directive @ Name ArgumentsDefinition? `repeatable`? on DirectiveLocations
       * ```
       *
       * @internal
       */
      parseDirectiveDefinition() {
        const start = this._lexer.token;
        const description = this.parseDescription();
        this.expectKeyword("directive");
        this.expectToken(_tokenKind.TokenKind.AT);
        const name2 = this.parseName();
        const args = this.parseArgumentDefs();
        const directives = this._options.experimentalDirectivesOnDirectiveDefinitions ? this.parseConstDirectives() : [];
        const repeatable = this.expectOptionalKeyword("repeatable");
        this.expectKeyword("on");
        const locations = this.parseDirectiveLocations();
        return this.node(start, {
          kind: _kinds.Kind.DIRECTIVE_DEFINITION,
          description,
          name: name2,
          arguments: args,
          directives,
          repeatable,
          locations
        });
      }
      /**
       * DirectiveLocations :
       *   - `|`? DirectiveLocation
       *   - DirectiveLocations | DirectiveLocation
       *
       * @internal
       */
      parseDirectiveLocations() {
        return this.delimitedMany(
          _tokenKind.TokenKind.PIPE,
          this.parseDirectiveLocation
        );
      }
      /*
       * DirectiveLocation :
       *   - ExecutableDirectiveLocation
       *   - TypeSystemDirectiveLocation
       *
       * ExecutableDirectiveLocation : one of
       *   `QUERY`
       *   `MUTATION`
       *   `SUBSCRIPTION`
       *   `FIELD`
       *   `FRAGMENT_DEFINITION`
       *   `FRAGMENT_SPREAD`
       *   `INLINE_FRAGMENT`
       *
       * TypeSystemDirectiveLocation : one of
       *   `SCHEMA`
       *   `SCALAR`
       *   `OBJECT`
       *   `FIELD_DEFINITION`
       *   `ARGUMENT_DEFINITION`
       *   `INTERFACE`
       *   `UNION`
       *   `ENUM`
       *   `ENUM_VALUE`
       *   `INPUT_OBJECT`
       *   `INPUT_FIELD_DEFINITION`
       *   `DIRECTIVE_DEFINITION`
       */
      parseDirectiveLocation() {
        const start = this._lexer.token;
        const name2 = this.parseName();
        if (Object.prototype.hasOwnProperty.call(
          _directiveLocation.DirectiveLocation,
          name2.value
        )) {
          return name2;
        }
        throw this.unexpected(start);
      }
      // Schema Coordinates
      /**
       * SchemaCoordinate :
       *   - Name
       *   - Name . Name
       *   - Name . Name ( Name : )
       *   - \@ Name
       *   - \@ Name ( Name : )
       * @returns Parsed schema coordinate AST.
       * @example
       * ```ts
       * import assert from 'node:assert/strict';
       * import { Kind, parseSchemaCoordinate } from 'graphql/language';
       *
       * const typeCoordinate = parseSchemaCoordinate('User.name');
       * const directiveCoordinate = parseSchemaCoordinate('@include(if:)');
       * assert(typeCoordinate.kind === Kind.MEMBER_COORDINATE);
       * assert(directiveCoordinate.kind === Kind.DIRECTIVE_ARGUMENT_COORDINATE);
       *
       * typeCoordinate.name.value; // => 'User'
       * typeCoordinate.memberName?.value; // => 'name'
       * directiveCoordinate.name.value; // => 'include'
       * directiveCoordinate.argumentName?.value; // => 'if'
       * ```
       */
      parseSchemaCoordinate() {
        const start = this._lexer.token;
        const ofDirective = this.expectOptionalToken(_tokenKind.TokenKind.AT);
        const name2 = this.parseName();
        let memberName;
        if (!ofDirective && this.expectOptionalToken(_tokenKind.TokenKind.DOT)) {
          memberName = this.parseName();
        }
        let argumentName;
        if ((ofDirective || memberName) && this.expectOptionalToken(_tokenKind.TokenKind.PAREN_L)) {
          argumentName = this.parseName();
          this.expectToken(_tokenKind.TokenKind.COLON);
          this.expectToken(_tokenKind.TokenKind.PAREN_R);
        }
        if (ofDirective) {
          if (argumentName) {
            return this.node(start, {
              kind: _kinds.Kind.DIRECTIVE_ARGUMENT_COORDINATE,
              name: name2,
              argumentName
            });
          }
          return this.node(start, {
            kind: _kinds.Kind.DIRECTIVE_COORDINATE,
            name: name2
          });
        } else if (memberName) {
          if (argumentName) {
            return this.node(start, {
              kind: _kinds.Kind.ARGUMENT_COORDINATE,
              name: name2,
              fieldName: memberName,
              argumentName
            });
          }
          return this.node(start, {
            kind: _kinds.Kind.MEMBER_COORDINATE,
            name: name2,
            memberName
          });
        }
        return this.node(start, {
          kind: _kinds.Kind.TYPE_COORDINATE,
          name: name2
        });
      }
      // Core parsing utility functions
      /**
       * Returns a node that, if configured to do so, sets a "loc" field as a
       * location object, used to identify the place in the source that created a
       * given parsed object.
       *
       * @internal
       */
      node(startToken, node2) {
        if (this._options.noLocation !== true) {
          node2.loc = new _ast.Location(
            startToken,
            this._lexer.lastToken,
            this._lexer.source
          );
        }
        return node2;
      }
      /**
       * Determines if the next token is of a given kind
       *
       * @internal
       */
      peek(kind) {
        return this._lexer.token.kind === kind;
      }
      /**
       * If the next token is of the given kind, return that token after advancing the lexer.
       * Otherwise, do not change the parser state and throw an error.
       *
       * @internal
       */
      expectToken(kind) {
        const token = this._lexer.token;
        if (token.kind === kind) {
          this.advanceLexer();
          return token;
        }
        throw (0, _syntaxError.syntaxError)(
          this._lexer.source,
          token.start,
          `Expected ${getTokenKindDesc(kind)}, found ${getTokenDesc(token)}.`
        );
      }
      /**
       * If the next token is of the given kind, return "true" after advancing the lexer.
       * Otherwise, do not change the parser state and return "false".
       *
       * @internal
       */
      expectOptionalToken(kind) {
        const token = this._lexer.token;
        if (token.kind === kind) {
          this.advanceLexer();
          return true;
        }
        return false;
      }
      /**
       * If the next token is a given keyword, advance the lexer.
       * Otherwise, do not change the parser state and throw an error.
       *
       * @internal
       */
      expectKeyword(value) {
        const token = this._lexer.token;
        if (token.kind === _tokenKind.TokenKind.NAME && token.value === value) {
          this.advanceLexer();
        } else {
          throw (0, _syntaxError.syntaxError)(
            this._lexer.source,
            token.start,
            `Expected "${value}", found ${getTokenDesc(token)}.`
          );
        }
      }
      /**
       * If the next token is a given keyword, return "true" after advancing the lexer.
       * Otherwise, do not change the parser state and return "false".
       *
       * @internal
       */
      expectOptionalKeyword(value) {
        const token = this._lexer.token;
        if (token.kind === _tokenKind.TokenKind.NAME && token.value === value) {
          this.advanceLexer();
          return true;
        }
        return false;
      }
      /**
       * Helper function for creating an error when an unexpected lexed token is encountered.
       *
       * @internal
       */
      unexpected(atToken) {
        const token = atToken !== null && atToken !== void 0 ? atToken : this._lexer.token;
        return (0, _syntaxError.syntaxError)(
          this._lexer.source,
          token.start,
          `Unexpected ${getTokenDesc(token)}.`
        );
      }
      /**
       * Returns a possibly empty list of parse nodes, determined by the parseFn.
       * This list begins with a lex token of openKind and ends with a lex token of closeKind.
       * Advances the parser to the next lex token after the closing token.
       *
       * @internal
       */
      any(openKind, parseFn, closeKind) {
        this.expectToken(openKind);
        const nodes = [];
        while (!this.expectOptionalToken(closeKind)) {
          nodes.push(parseFn.call(this));
        }
        return nodes;
      }
      /**
       * Returns a list of parse nodes, determined by the parseFn.
       * It can be empty only if open token is missing otherwise it will always return non-empty list
       * that begins with a lex token of openKind and ends with a lex token of closeKind.
       * Advances the parser to the next lex token after the closing token.
       *
       * @internal
       */
      optionalMany(openKind, parseFn, closeKind) {
        if (this.expectOptionalToken(openKind)) {
          const nodes = [];
          do {
            nodes.push(parseFn.call(this));
          } while (!this.expectOptionalToken(closeKind));
          return nodes;
        }
        return [];
      }
      /**
       * Returns a non-empty list of parse nodes, determined by the parseFn.
       * This list begins with a lex token of openKind and ends with a lex token of closeKind.
       * Advances the parser to the next lex token after the closing token.
       *
       * @internal
       */
      many(openKind, parseFn, closeKind) {
        this.expectToken(openKind);
        const nodes = [];
        do {
          nodes.push(parseFn.call(this));
        } while (!this.expectOptionalToken(closeKind));
        return nodes;
      }
      /**
       * Returns a non-empty list of parse nodes, determined by the parseFn.
       * This list may begin with a lex token of delimiterKind followed by items separated by lex tokens of tokenKind.
       * Advances the parser to the next lex token after last item in the list.
       *
       * @internal
       */
      delimitedMany(delimiterKind, parseFn) {
        this.expectOptionalToken(delimiterKind);
        const nodes = [];
        do {
          nodes.push(parseFn.call(this));
        } while (this.expectOptionalToken(delimiterKind));
        return nodes;
      }
      advanceLexer() {
        const { maxLexicalTokens = this._options.maxTokens } = this._options;
        const token = this._lexer.advance();
        if (token.kind !== _tokenKind.TokenKind.EOF) {
          ++this._tokenCounter;
          if (maxLexicalTokens !== void 0 && this._tokenCounter > maxLexicalTokens) {
            throw (0, _syntaxError.syntaxError)(
              this._lexer.source,
              token.start,
              `Document contains more that ${maxLexicalTokens} tokens. Parsing aborted.`
            );
          }
        }
      }
    };
    exports.Parser = Parser;
    function getTokenDesc(token) {
      const value = token.value;
      return getTokenKindDesc(token.kind) + (value != null ? ` "${value}"` : "");
    }
    function getTokenKindDesc(kind) {
      return (0, _lexer.isPunctuatorTokenKind)(kind) ? `"${kind}"` : kind;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/didYouMean.js
var require_didYouMean = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/didYouMean.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.didYouMean = didYouMean;
    var MAX_SUGGESTIONS = 5;
    function didYouMean(firstArg, secondArg) {
      const [subMessage, suggestionsArg] = secondArg ? [firstArg, secondArg] : [void 0, firstArg];
      let message = " Did you mean ";
      if (subMessage) {
        message += subMessage + " ";
      }
      const suggestions = suggestionsArg.map((x) => `"${x}"`);
      switch (suggestions.length) {
        case 0:
          return "";
        case 1:
          return message + suggestions[0] + "?";
        case 2:
          return message + suggestions[0] + " or " + suggestions[1] + "?";
      }
      const selected = suggestions.slice(0, MAX_SUGGESTIONS);
      const lastItem = selected.pop();
      return message + selected.join(", ") + ", or " + lastItem + "?";
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/identityFunc.js
var require_identityFunc = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/identityFunc.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.identityFunc = identityFunc;
    function identityFunc(x) {
      return x;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/keyMap.js
var require_keyMap = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/keyMap.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.keyMap = keyMap;
    function keyMap(list2, keyFn) {
      const result = /* @__PURE__ */ Object.create(null);
      for (const item of list2) {
        result[keyFn(item)] = item;
      }
      return result;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/keyValMap.js
var require_keyValMap = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/keyValMap.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.keyValMap = keyValMap;
    function keyValMap(list2, keyFn, valFn) {
      const result = /* @__PURE__ */ Object.create(null);
      for (const item of list2) {
        result[keyFn(item)] = valFn(item);
      }
      return result;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/mapValue.js
var require_mapValue = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/mapValue.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.mapValue = mapValue;
    function mapValue(map, fn) {
      const result = /* @__PURE__ */ Object.create(null);
      for (const key of Object.keys(map)) {
        result[key] = fn(map[key], key);
      }
      return result;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/naturalCompare.js
var require_naturalCompare = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/naturalCompare.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.naturalCompare = naturalCompare;
    function naturalCompare(aStr, bStr) {
      let aIndex = 0;
      let bIndex = 0;
      while (aIndex < aStr.length && bIndex < bStr.length) {
        let aChar = aStr.charCodeAt(aIndex);
        let bChar = bStr.charCodeAt(bIndex);
        if (isDigit(aChar) && isDigit(bChar)) {
          let aNum = 0;
          do {
            ++aIndex;
            aNum = aNum * 10 + aChar - DIGIT_0;
            aChar = aStr.charCodeAt(aIndex);
          } while (isDigit(aChar) && aNum > 0);
          let bNum = 0;
          do {
            ++bIndex;
            bNum = bNum * 10 + bChar - DIGIT_0;
            bChar = bStr.charCodeAt(bIndex);
          } while (isDigit(bChar) && bNum > 0);
          if (aNum < bNum) {
            return -1;
          }
          if (aNum > bNum) {
            return 1;
          }
        } else {
          if (aChar < bChar) {
            return -1;
          }
          if (aChar > bChar) {
            return 1;
          }
          ++aIndex;
          ++bIndex;
        }
      }
      return aStr.length - bStr.length;
    }
    var DIGIT_0 = 48;
    var DIGIT_9 = 57;
    function isDigit(code) {
      return !isNaN(code) && DIGIT_0 <= code && code <= DIGIT_9;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/suggestionList.js
var require_suggestionList = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/suggestionList.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.suggestionList = suggestionList;
    var _naturalCompare = require_naturalCompare();
    function suggestionList(input, options) {
      const optionsByDistance = /* @__PURE__ */ Object.create(null);
      const lexicalDistance = new LexicalDistance(input);
      const threshold = Math.floor(input.length * 0.4) + 1;
      for (const option of options) {
        const distance = lexicalDistance.measure(option, threshold);
        if (distance !== void 0) {
          optionsByDistance[option] = distance;
        }
      }
      return Object.keys(optionsByDistance).sort((a, b) => {
        const distanceDiff = optionsByDistance[a] - optionsByDistance[b];
        return distanceDiff !== 0 ? distanceDiff : (0, _naturalCompare.naturalCompare)(a, b);
      });
    }
    var LexicalDistance = class {
      constructor(input) {
        this._input = input;
        this._inputLowerCase = input.toLowerCase();
        this._inputArray = stringToArray(this._inputLowerCase);
        this._rows = [
          new Array(input.length + 1).fill(0),
          new Array(input.length + 1).fill(0),
          new Array(input.length + 1).fill(0)
        ];
      }
      measure(option, threshold) {
        if (this._input === option) {
          return 0;
        }
        const optionLowerCase = option.toLowerCase();
        if (this._inputLowerCase === optionLowerCase) {
          return 1;
        }
        let a = stringToArray(optionLowerCase);
        let b = this._inputArray;
        if (a.length < b.length) {
          const tmp = a;
          a = b;
          b = tmp;
        }
        const aLength = a.length;
        const bLength = b.length;
        if (aLength - bLength > threshold) {
          return void 0;
        }
        const rows = this._rows;
        for (let j = 0; j <= bLength; j++) {
          rows[0][j] = j;
        }
        for (let i = 1; i <= aLength; i++) {
          const upRow = rows[(i - 1) % 3];
          const currentRow = rows[i % 3];
          let smallestCell = currentRow[0] = i;
          for (let j = 1; j <= bLength; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            let currentCell = Math.min(
              upRow[j] + 1,
              // delete
              currentRow[j - 1] + 1,
              // insert
              upRow[j - 1] + cost
              // substitute
            );
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
              const doubleDiagonalCell = rows[(i - 2) % 3][j - 2];
              currentCell = Math.min(currentCell, doubleDiagonalCell + 1);
            }
            if (currentCell < smallestCell) {
              smallestCell = currentCell;
            }
            currentRow[j] = currentCell;
          }
          if (smallestCell > threshold) {
            return void 0;
          }
        }
        const distance = rows[aLength % 3][bLength];
        return distance <= threshold ? distance : void 0;
      }
    };
    function stringToArray(str) {
      const strLength = str.length;
      const array = new Array(strLength);
      for (let i = 0; i < strLength; ++i) {
        array[i] = str.charCodeAt(i);
      }
      return array;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/toObjMap.js
var require_toObjMap = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/toObjMap.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.toObjMap = toObjMap;
    function toObjMap(obj) {
      if (obj == null) {
        return /* @__PURE__ */ Object.create(null);
      }
      if (Object.getPrototypeOf(obj) === null) {
        return obj;
      }
      const map = /* @__PURE__ */ Object.create(null);
      for (const [key, value] of Object.entries(obj)) {
        map[key] = value;
      }
      return map;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/printString.js
var require_printString = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/printString.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.printString = printString;
    function printString(str) {
      return `"${str.replace(escapedRegExp, escapedReplacer)}"`;
    }
    var escapedRegExp = /[\x00-\x1f\x22\x5c\x7f-\x9f]/g;
    function escapedReplacer(str) {
      return escapeSequences[str.charCodeAt(0)];
    }
    var escapeSequences = [
      "\\u0000",
      "\\u0001",
      "\\u0002",
      "\\u0003",
      "\\u0004",
      "\\u0005",
      "\\u0006",
      "\\u0007",
      "\\b",
      "\\t",
      "\\n",
      "\\u000B",
      "\\f",
      "\\r",
      "\\u000E",
      "\\u000F",
      "\\u0010",
      "\\u0011",
      "\\u0012",
      "\\u0013",
      "\\u0014",
      "\\u0015",
      "\\u0016",
      "\\u0017",
      "\\u0018",
      "\\u0019",
      "\\u001A",
      "\\u001B",
      "\\u001C",
      "\\u001D",
      "\\u001E",
      "\\u001F",
      "",
      "",
      '\\"',
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      // 2F
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      // 3F
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      // 4F
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "\\\\",
      "",
      "",
      "",
      // 5F
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      // 6F
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "\\u007F",
      "\\u0080",
      "\\u0081",
      "\\u0082",
      "\\u0083",
      "\\u0084",
      "\\u0085",
      "\\u0086",
      "\\u0087",
      "\\u0088",
      "\\u0089",
      "\\u008A",
      "\\u008B",
      "\\u008C",
      "\\u008D",
      "\\u008E",
      "\\u008F",
      "\\u0090",
      "\\u0091",
      "\\u0092",
      "\\u0093",
      "\\u0094",
      "\\u0095",
      "\\u0096",
      "\\u0097",
      "\\u0098",
      "\\u0099",
      "\\u009A",
      "\\u009B",
      "\\u009C",
      "\\u009D",
      "\\u009E",
      "\\u009F"
    ];
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/reducer.js
var require_reducer = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/reducer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.reduce = reduce;
    var _inspect = require_inspect();
    var _ast = require_ast();
    function reduce(root, reducer) {
      const stack = [];
      let frame = {
        parent: [root],
        keys: void 0,
        results: [],
        index: -1
      };
      let node2;
      do {
        let kind;
        frame.index++;
        const length = frame.keys === void 0 ? frame.parent.length : frame.keys.length;
        if (frame.index === length) {
          node2 = frame.results;
          kind = frame.keys === void 0 ? void 0 : frame.results.kind;
          frame = stack.pop();
        } else {
          node2 = frame.keys === void 0 ? frame.parent[frame.index] : frame.parent[frame.keys[frame.index]];
          if (node2 == null && stack.length !== 0) {
            continue;
          }
          if (Array.isArray(node2)) {
            if (node2.length !== 0) {
              stack.push(frame);
              frame = {
                parent: node2,
                keys: void 0,
                results: [],
                index: -1
              };
              continue;
            }
          } else {
            const parent = node2;
            kind = parent === null || parent === void 0 ? void 0 : parent.kind;
            const keys = typeof kind === "string" ? _ast.QueryDocumentKeys[kind] : void 0;
            if (!Array.isArray(keys)) {
              throw new Error(`Invalid AST Node: ${(0, _inspect.inspect)(node2)}.`);
            }
            if (keys.length !== 0) {
              stack.push(frame);
              frame = {
                parent,
                keys,
                results: { ...parent },
                index: -1
              };
              continue;
            }
          }
        }
        if (kind !== void 0) {
          const reduceNode = reducer[kind];
          node2 = reduceNode === null || reduceNode === void 0 ? void 0 : reduceNode(node2);
        }
        if (frame.keys === void 0) {
          frame.results.push(node2);
        } else {
          frame.results[frame.keys[frame.index]] = node2;
        }
      } while (stack.length !== 0);
      return node2;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/printer.js
var require_printer = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/printer.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.print = print2;
    exports.printForError = printForError;
    var _blockString = require_blockString();
    var _printString = require_printString();
    var _reducer = require_reducer();
    function print2(ast, options) {
      var _options$maxIndentDep;
      return render(
        (0, _reducer.reduce)(ast, printDocASTReducer),
        (_options$maxIndentDep = options === null || options === void 0 ? void 0 : options.maxIndentDepth) !== null && _options$maxIndentDep !== void 0 ? _options$maxIndentDep : Infinity
      );
    }
    function printForError(ast) {
      return print2(ast, {
        maxIndentDepth: 100
      });
    }
    var MAX_LINE_LENGTH = 80;
    var PrintBuffer = class _PrintBuffer {
      next = void 0;
      tail = this;
      indentBefore = false;
      dedentAfter = false;
      constructor(value = "", isBlockString = false) {
        this.length = value.length;
        this.lines = value.includes("\n") ? value.split("\n") : value;
        this.newlines = typeof this.lines === "string" ? 0 : this.lines.length - 1;
        this.isBlockString = isBlockString;
      }
      append(result) {
        if (result.length === 0) {
          return this;
        }
        const next = typeof result === "string" ? new _PrintBuffer(result) : result;
        this.tail.next = next;
        this.tail = next.tail;
        this.length += next.length;
        this.newlines += next.newlines;
        return this;
      }
      indent() {
        if (this.length === 0) {
          return this;
        }
        this.indentBefore = true;
        this.tail.dedentAfter = true;
        this.length += 2 * (this.newlines + 1);
        return this;
      }
    };
    var EMPTY = new PrintBuffer();
    function render(buffer, maxDepth) {
      let output = "";
      let text = "";
      let depth = 0;
      let indentation = "";
      let part = buffer;
      while (part !== void 0) {
        const lines = part.lines;
        if (part.indentBefore) {
          if (depth < maxDepth) {
            indentation += "  ";
            text += "  ";
          }
          depth++;
        }
        if (typeof lines === "string") {
          text += lines;
        } else {
          text += lines[0];
          const newline = !part.isBlockString && depth >= maxDepth ? " " : "\n" + indentation;
          for (let i = 1; i < lines.length; i++) {
            output += text;
            text = newline + lines[i];
          }
        }
        if (part.dedentAfter) {
          depth--;
          indentation = indentation.slice(0, depth * 2);
        }
        part = part.next;
      }
      return output + text;
    }
    var printDocASTReducer = {
      Name: (node2) => new PrintBuffer(node2.value),
      Variable: (node2) => join5(["$", node2.name]),
      // Document
      Document: (node2) => join5(node2.definitions, "\n\n"),
      OperationDefinition(node2) {
        const varDefs = hasMultilineItems(node2.variableDefinitions) ? wrap("(\n", join5(node2.variableDefinitions, "\n"), "\n)") : wrap("(", join5(node2.variableDefinitions, ", "), ")");
        const prefix = join5([
          wrap("", node2.description, "\n"),
          join5(
            [
              node2.operation,
              join5([node2.name, varDefs]),
              join5(node2.directives, " ")
            ],
            " "
          )
        ]);
        return join5([
          node2.operation === "query" && prefix.length === node2.operation.length ? "" : join5([prefix, " "]),
          node2.selectionSet
        ]);
      },
      VariableDefinition: ({
        variable,
        type,
        defaultValue,
        directives,
        description
      }) => join5([
        wrap("", description, "\n"),
        variable,
        ": ",
        type,
        wrap(" = ", defaultValue),
        wrap(" ", join5(directives, " "))
      ]),
      SelectionSet: ({ selections }) => block(selections),
      Field({ alias, name: name2, arguments: args, directives, selectionSet }) {
        const prefix = join5([wrap("", alias, ": "), name2], "");
        return join5([
          wrappedLineAndArgs(prefix, args),
          wrap(" ", join5(directives, " ")),
          wrap(" ", selectionSet)
        ]);
      },
      Argument: ({ name: name2, value }) => join5([name2, ": ", value]),
      // Fragments
      FragmentSpread: ({ name: name2, directives }) => join5(["...", name2, wrap(" ", join5(directives, " "))]),
      InlineFragment: ({ typeCondition, directives, selectionSet }) => join5(
        ["...", wrap("on ", typeCondition), join5(directives, " "), selectionSet],
        " "
      ),
      FragmentDefinition: ({
        name: name2,
        typeCondition,
        variableDefinitions,
        directives,
        selectionSet,
        description
      }) => join5([
        wrap("", description, "\n"),
        // Note: fragment variable definitions are experimental and may be changed
        // or removed in the future.
        "fragment ",
        name2,
        wrap("(", join5(variableDefinitions, ", "), ")"),
        " on ",
        typeCondition,
        " ",
        wrap("", join5(directives, " "), " "),
        selectionSet
      ]),
      // Value
      IntValue: ({ value }) => new PrintBuffer(value),
      FloatValue: ({ value }) => new PrintBuffer(value),
      StringValue: ({ value, block: isBlockString }) => new PrintBuffer(
        isBlockString === true ? (0, _blockString.printBlockString)(value) : (0, _printString.printString)(value),
        isBlockString === true
      ),
      BooleanValue: ({ value }) => new PrintBuffer(value ? "true" : "false"),
      NullValue: () => new PrintBuffer("null"),
      EnumValue: ({ value }) => new PrintBuffer(value),
      ListValue: ({ values }) => join5(["[", join5(values, ", "), "]"]),
      ObjectValue: ({ fields }) => join5(["{", join5(fields, ", "), "}"]),
      ObjectField: ({ name: name2, value }) => join5([name2, ": ", value]),
      // Directive
      Directive: ({ name: name2, arguments: args }) => join5(["@", name2, wrap("(", join5(args, ", "), ")")]),
      // Type
      NamedType: ({ name: name2 }) => name2,
      ListType: ({ type }) => join5(["[", type, "]"]),
      NonNullType: ({ type }) => join5([type, "!"]),
      // Type System Definitions
      SchemaDefinition: ({ description, directives, operationTypes }) => join5([
        wrap("", description, "\n"),
        join5(["schema", join5(directives, " "), block(operationTypes)], " ")
      ]),
      OperationTypeDefinition: ({ operation, type }) => join5([operation, ": ", type]),
      ScalarTypeDefinition: ({ description, name: name2, directives }) => join5([
        wrap("", description, "\n"),
        join5(["scalar", name2, join5(directives, " ")], " ")
      ]),
      ObjectTypeDefinition: ({
        description,
        name: name2,
        interfaces,
        directives,
        fields
      }) => join5([
        wrap("", description, "\n"),
        join5(
          [
            "type",
            name2,
            wrap("implements ", join5(interfaces, " & ")),
            join5(directives, " "),
            block(fields)
          ],
          " "
        )
      ]),
      FieldDefinition: ({ description, name: name2, arguments: args, type, directives }) => join5([
        wrap("", description, "\n"),
        name2,
        hasMultilineItems(args) ? wrap("(\n", join5(args, "\n").indent(), "\n)") : wrap("(", join5(args, ", "), ")"),
        ": ",
        type,
        wrap(" ", join5(directives, " "))
      ]),
      InputValueDefinition: ({
        description,
        name: name2,
        type,
        defaultValue,
        directives
      }) => join5([
        wrap("", description, "\n"),
        name2,
        ": ",
        type,
        wrap(" = ", defaultValue),
        wrap(" ", join5(directives, " "))
      ]),
      InterfaceTypeDefinition: ({
        description,
        name: name2,
        interfaces,
        directives,
        fields
      }) => join5([
        wrap("", description, "\n"),
        join5(
          [
            "interface",
            name2,
            wrap("implements ", join5(interfaces, " & ")),
            join5(directives, " "),
            block(fields)
          ],
          " "
        )
      ]),
      UnionTypeDefinition: ({ description, name: name2, directives, types }) => join5([
        wrap("", description, "\n"),
        join5(
          ["union", name2, join5(directives, " "), wrap("= ", join5(types, " | "))],
          " "
        )
      ]),
      EnumTypeDefinition: ({ description, name: name2, directives, values }) => join5([
        wrap("", description, "\n"),
        join5(["enum", name2, join5(directives, " "), block(values)], " ")
      ]),
      EnumValueDefinition: ({ description, name: name2, directives }) => join5([
        wrap("", description, "\n"),
        join5([name2, join5(directives, " ")], " ")
      ]),
      InputObjectTypeDefinition: ({ description, name: name2, directives, fields }) => join5([
        wrap("", description, "\n"),
        join5(["input", name2, join5(directives, " "), block(fields)], " ")
      ]),
      DirectiveDefinition: ({
        description,
        name: name2,
        arguments: args,
        directives,
        repeatable,
        locations
      }) => join5([
        wrap("", description, "\n"),
        "directive @",
        name2,
        hasMultilineItems(args) ? wrap("(\n", join5(args, "\n").indent(), "\n)") : wrap("(", join5(args, ", "), ")"),
        wrap(" ", join5(directives, " ")),
        repeatable ? " repeatable" : "",
        " on ",
        join5(locations, " | ")
      ]),
      SchemaExtension: ({ directives, operationTypes }) => join5(["extend schema", join5(directives, " "), block(operationTypes)], " "),
      ScalarTypeExtension: ({ name: name2, directives }) => join5(["extend scalar", name2, join5(directives, " ")], " "),
      ObjectTypeExtension: ({ name: name2, interfaces, directives, fields }) => join5(
        [
          "extend type",
          name2,
          wrap("implements ", join5(interfaces, " & ")),
          join5(directives, " "),
          block(fields)
        ],
        " "
      ),
      InterfaceTypeExtension: ({ name: name2, interfaces, directives, fields }) => join5(
        [
          "extend interface",
          name2,
          wrap("implements ", join5(interfaces, " & ")),
          join5(directives, " "),
          block(fields)
        ],
        " "
      ),
      UnionTypeExtension: ({ name: name2, directives, types }) => join5(
        [
          "extend union",
          name2,
          join5(directives, " "),
          wrap("= ", join5(types, " | "))
        ],
        " "
      ),
      EnumTypeExtension: ({ name: name2, directives, values }) => join5(["extend enum", name2, join5(directives, " "), block(values)], " "),
      InputObjectTypeExtension: ({ name: name2, directives, fields }) => join5(["extend input", name2, join5(directives, " "), block(fields)], " "),
      DirectiveExtension: ({ name: name2, directives }) => join5([join5(["extend directive @", name2]), join5(directives, " ")], " "),
      // Schema Coordinates
      TypeCoordinate: ({ name: name2 }) => name2,
      MemberCoordinate: ({ name: name2, memberName }) => join5([name2, wrap(".", memberName)]),
      ArgumentCoordinate: ({ name: name2, fieldName, argumentName }) => join5([name2, wrap(".", fieldName), wrap("(", argumentName, ":)")]),
      DirectiveCoordinate: ({ name: name2 }) => join5(["@", name2]),
      DirectiveArgumentCoordinate: ({ name: name2, argumentName }) => join5(["@", name2, wrap("(", argumentName, ":)")])
    };
    function join5(maybeArray, separator = "") {
      if (maybeArray == null || maybeArray.length === 0) {
        return EMPTY;
      }
      let result = EMPTY;
      for (const item of maybeArray) {
        if (item === void 0 || item.length === 0) {
          continue;
        }
        if (result.length === 0) {
          result = typeof item === "string" ? new PrintBuffer(item) : item;
        } else {
          if (separator !== "") {
            result.append(separator);
          }
          result.append(item);
        }
      }
      return result;
    }
    function joinedLength(array, separator) {
      let length = 0;
      for (const item of array) {
        if (item.length !== 0) {
          length += (length === 0 ? 0 : separator.length) + item.length;
        }
      }
      return length;
    }
    function block(array) {
      return wrap("{\n", join5(array, "\n").indent(), "\n}");
    }
    function wrap(start, maybeBuffer, end = "") {
      return maybeBuffer != null && maybeBuffer.length !== 0 ? start === "" ? maybeBuffer.append(end) : new PrintBuffer(start).append(maybeBuffer).append(end) : EMPTY;
    }
    function hasMultilineItems(maybeArray) {
      var _maybeArray$some;
      return (_maybeArray$some = maybeArray === null || maybeArray === void 0 ? void 0 : maybeArray.some((result) => result.newlines !== 0)) !== null && _maybeArray$some !== void 0 ? _maybeArray$some : false;
    }
    function wrappedLineAndArgs(prefix, args) {
      if (args == null || args.length === 0) {
        return prefix;
      }
      return join5([
        prefix,
        prefix.length + joinedLength(args, ", ") + 2 > MAX_LINE_LENGTH ? wrap("(\n", join5(args, "\n").indent(), "\n)") : wrap("(", join5(args, ", "), ")")
      ]);
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/valueFromASTUntyped.js
var require_valueFromASTUntyped = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/valueFromASTUntyped.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.valueFromASTUntyped = valueFromASTUntyped2;
    var _keyValMap = require_keyValMap();
    var _kinds = require_kinds();
    function valueFromASTUntyped2(valueNode, variables) {
      switch (valueNode.kind) {
        case _kinds.Kind.NULL:
          return null;
        case _kinds.Kind.INT:
          return parseInt(valueNode.value, 10);
        case _kinds.Kind.FLOAT:
          return parseFloat(valueNode.value);
        case _kinds.Kind.STRING:
        case _kinds.Kind.ENUM:
        case _kinds.Kind.BOOLEAN:
          return valueNode.value;
        case _kinds.Kind.LIST:
          return valueNode.values.map(
            (node2) => valueFromASTUntyped2(node2, variables)
          );
        case _kinds.Kind.OBJECT:
          return (0, _keyValMap.keyValMap)(
            valueNode.fields,
            (field) => field.name.value,
            (field) => valueFromASTUntyped2(field.value, variables)
          );
        case _kinds.Kind.VARIABLE:
          return variables === null || variables === void 0 ? void 0 : variables[valueNode.name.value];
      }
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/type/assertName.js
var require_assertName = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/type/assertName.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.assertEnumValueName = assertEnumValueName;
    exports.assertName = assertName;
    var _devAssert = require_devAssert();
    var _GraphQLError = require_GraphQLError();
    var _characterClasses = require_characterClasses();
    function assertName(name2) {
      name2 != null || (0, _devAssert.devAssert)(false, "Must provide name.");
      typeof name2 === "string" || (0, _devAssert.devAssert)(false, "Expected name to be a string.");
      if (name2.length === 0) {
        throw new _GraphQLError.GraphQLError(
          "Expected name to be a non-empty string."
        );
      }
      for (let i = 1; i < name2.length; ++i) {
        if (!(0, _characterClasses.isNameContinue)(name2.charCodeAt(i))) {
          throw new _GraphQLError.GraphQLError(
            `Names must only contain [_a-zA-Z0-9] but "${name2}" does not.`
          );
        }
      }
      if (!(0, _characterClasses.isNameStart)(name2.charCodeAt(0))) {
        throw new _GraphQLError.GraphQLError(
          `Names must start with [_a-zA-Z] but "${name2}" does not.`
        );
      }
      return name2;
    }
    function assertEnumValueName(name2) {
      if (name2 === "true" || name2 === "false" || name2 === "null") {
        throw new _GraphQLError.GraphQLError(
          `Enum values cannot be named: ${name2}`
        );
      }
      return assertName(name2);
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/type/definition.js
var require_definition = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/type/definition.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.GraphQLUnionType = exports.GraphQLScalarType = exports.GraphQLObjectType = exports.GraphQLNonNull = exports.GraphQLList = exports.GraphQLInterfaceType = exports.GraphQLInputObjectType = exports.GraphQLEnumType = void 0;
    exports.argsToArgsConfig = argsToArgsConfig;
    exports.assertAbstractType = assertAbstractType;
    exports.assertCompositeType = assertCompositeType;
    exports.assertEnumType = assertEnumType;
    exports.assertInputObjectType = assertInputObjectType;
    exports.assertInputType = assertInputType;
    exports.assertInterfaceType = assertInterfaceType;
    exports.assertLeafType = assertLeafType;
    exports.assertListType = assertListType;
    exports.assertNamedType = assertNamedType;
    exports.assertNonNullType = assertNonNullType;
    exports.assertNullableType = assertNullableType;
    exports.assertObjectType = assertObjectType;
    exports.assertOutputType = assertOutputType;
    exports.assertScalarType = assertScalarType;
    exports.assertType = assertType;
    exports.assertUnionType = assertUnionType;
    exports.assertWrappingType = assertWrappingType;
    exports.defineArguments = defineArguments;
    exports.getNamedType = getNamedType2;
    exports.getNullableType = getNullableType;
    exports.isAbstractType = isAbstractType;
    exports.isCompositeType = isCompositeType;
    exports.isEnumType = isEnumType;
    exports.isInputObjectType = isInputObjectType;
    exports.isInputType = isInputType;
    exports.isInterfaceType = isInterfaceType2;
    exports.isLeafType = isLeafType;
    exports.isListType = isListType2;
    exports.isNamedType = isNamedType;
    exports.isNonNullType = isNonNullType2;
    exports.isNullableType = isNullableType;
    exports.isObjectType = isObjectType2;
    exports.isOutputType = isOutputType;
    exports.isRequiredArgument = isRequiredArgument;
    exports.isRequiredInputField = isRequiredInputField;
    exports.isScalarType = isScalarType;
    exports.isType = isType;
    exports.isUnionType = isUnionType2;
    exports.isWrappingType = isWrappingType;
    exports.resolveObjMapThunk = resolveObjMapThunk;
    exports.resolveReadonlyArrayThunk = resolveReadonlyArrayThunk;
    var _devAssert = require_devAssert();
    var _didYouMean = require_didYouMean();
    var _identityFunc = require_identityFunc();
    var _inspect = require_inspect();
    var _instanceOf = require_instanceOf();
    var _isObjectLike = require_isObjectLike();
    var _keyMap = require_keyMap();
    var _keyValMap = require_keyValMap();
    var _mapValue = require_mapValue();
    var _suggestionList = require_suggestionList();
    var _toObjMap = require_toObjMap();
    var _GraphQLError = require_GraphQLError();
    var _kinds = require_kinds();
    var _printer = require_printer();
    var _valueFromASTUntyped = require_valueFromASTUntyped();
    var _assertName = require_assertName();
    function isType(type) {
      return isScalarType(type) || isObjectType2(type) || isInterfaceType2(type) || isUnionType2(type) || isEnumType(type) || isInputObjectType(type) || isListType2(type) || isNonNullType2(type);
    }
    function assertType(type) {
      if (!isType(type)) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(type)} to be a GraphQL type.`
        );
      }
      return type;
    }
    function isScalarType(type) {
      return (0, _instanceOf.instanceOf)(type, GraphQLScalarType);
    }
    function assertScalarType(type) {
      if (!isScalarType(type)) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(type)} to be a GraphQL Scalar type.`
        );
      }
      return type;
    }
    function isObjectType2(type) {
      return (0, _instanceOf.instanceOf)(type, GraphQLObjectType);
    }
    function assertObjectType(type) {
      if (!isObjectType2(type)) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(type)} to be a GraphQL Object type.`
        );
      }
      return type;
    }
    function isInterfaceType2(type) {
      return (0, _instanceOf.instanceOf)(type, GraphQLInterfaceType);
    }
    function assertInterfaceType(type) {
      if (!isInterfaceType2(type)) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(type)} to be a GraphQL Interface type.`
        );
      }
      return type;
    }
    function isUnionType2(type) {
      return (0, _instanceOf.instanceOf)(type, GraphQLUnionType);
    }
    function assertUnionType(type) {
      if (!isUnionType2(type)) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(type)} to be a GraphQL Union type.`
        );
      }
      return type;
    }
    function isEnumType(type) {
      return (0, _instanceOf.instanceOf)(type, GraphQLEnumType);
    }
    function assertEnumType(type) {
      if (!isEnumType(type)) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(type)} to be a GraphQL Enum type.`
        );
      }
      return type;
    }
    function isInputObjectType(type) {
      return (0, _instanceOf.instanceOf)(type, GraphQLInputObjectType);
    }
    function assertInputObjectType(type) {
      if (!isInputObjectType(type)) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(
            type
          )} to be a GraphQL Input Object type.`
        );
      }
      return type;
    }
    function isListType2(type) {
      return (0, _instanceOf.instanceOf)(type, GraphQLList);
    }
    function assertListType(type) {
      if (!isListType2(type)) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(type)} to be a GraphQL List type.`
        );
      }
      return type;
    }
    function isNonNullType2(type) {
      return (0, _instanceOf.instanceOf)(type, GraphQLNonNull);
    }
    function assertNonNullType(type) {
      if (!isNonNullType2(type)) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(type)} to be a GraphQL Non-Null type.`
        );
      }
      return type;
    }
    function isInputType(type) {
      return isScalarType(type) || isEnumType(type) || isInputObjectType(type) || isWrappingType(type) && isInputType(type.ofType);
    }
    function assertInputType(type) {
      if (!isInputType(type)) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(type)} to be a GraphQL input type.`
        );
      }
      return type;
    }
    function isOutputType(type) {
      return isScalarType(type) || isObjectType2(type) || isInterfaceType2(type) || isUnionType2(type) || isEnumType(type) || isWrappingType(type) && isOutputType(type.ofType);
    }
    function assertOutputType(type) {
      if (!isOutputType(type)) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(type)} to be a GraphQL output type.`
        );
      }
      return type;
    }
    function isLeafType(type) {
      return isScalarType(type) || isEnumType(type);
    }
    function assertLeafType(type) {
      if (!isLeafType(type)) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(type)} to be a GraphQL leaf type.`
        );
      }
      return type;
    }
    function isCompositeType(type) {
      return isObjectType2(type) || isInterfaceType2(type) || isUnionType2(type);
    }
    function assertCompositeType(type) {
      if (!isCompositeType(type)) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(type)} to be a GraphQL composite type.`
        );
      }
      return type;
    }
    function isAbstractType(type) {
      return isInterfaceType2(type) || isUnionType2(type);
    }
    function assertAbstractType(type) {
      if (!isAbstractType(type)) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(type)} to be a GraphQL abstract type.`
        );
      }
      return type;
    }
    var GraphQLList = class {
      /** The type wrapped by this list or non-null type. */
      /**
       * Creates a GraphQLList instance.
       * @param ofType - The type to wrap.
       * @example
       * ```ts
       * import { GraphQLList, GraphQLString } from 'graphql/type';
       *
       * const stringList = new GraphQLList(GraphQLString);
       *
       * stringList.ofType; // => GraphQLString
       * String(stringList); // => '[String]'
       * ```
       */
      constructor(ofType) {
        isType(ofType) || (0, _devAssert.devAssert)(
          false,
          `Expected ${(0, _inspect.inspect)(ofType)} to be a GraphQL type.`
        );
        this.ofType = ofType;
      }
      /**
       * Returns the value used by `Object.prototype.toString`.
       * @returns The built-in string tag for this object.
       */
      get [Symbol.toStringTag]() {
        return "GraphQLList";
      }
      /**
       * Returns this wrapping type as a GraphQL type-reference string.
       * @returns The GraphQL type-reference string.
       * @example
       * ```ts
       * import { GraphQLList, GraphQLNonNull, GraphQLString } from 'graphql/type';
       *
       * const stringList = new GraphQLList(GraphQLString);
       * const requiredStringList = new GraphQLList(new GraphQLNonNull(GraphQLString));
       *
       * stringList.toString(); // => '[String]'
       * requiredStringList.toString(); // => '[String!]'
       * ```
       */
      toString() {
        return "[" + String(this.ofType) + "]";
      }
      /**
       * Returns the JSON representation used when this object is serialized.
       * @returns The JSON-serializable representation.
       * @example
       * ```ts
       * import { GraphQLList, GraphQLString } from 'graphql/type';
       *
       * const stringList = new GraphQLList(GraphQLString);
       *
       * stringList.toJSON(); // => '[String]'
       * JSON.stringify({ type: stringList }); // => '{"type":"[String]"}'
       * ```
       */
      toJSON() {
        return this.toString();
      }
    };
    exports.GraphQLList = GraphQLList;
    var GraphQLNonNull = class {
      /** The type wrapped by this list or non-null type. */
      /**
       * Creates a GraphQLNonNull instance.
       * @param ofType - The type to wrap.
       * @example
       * ```ts
       * import { GraphQLNonNull, GraphQLString } from 'graphql/type';
       *
       * const requiredString = new GraphQLNonNull(GraphQLString);
       *
       * requiredString.ofType; // => GraphQLString
       * String(requiredString); // => 'String!'
       * ```
       */
      constructor(ofType) {
        isNullableType(ofType) || (0, _devAssert.devAssert)(
          false,
          `Expected ${(0, _inspect.inspect)(
            ofType
          )} to be a GraphQL nullable type.`
        );
        this.ofType = ofType;
      }
      /**
       * Returns the value used by `Object.prototype.toString`.
       * @returns The built-in string tag for this object.
       */
      get [Symbol.toStringTag]() {
        return "GraphQLNonNull";
      }
      /**
       * Returns this wrapping type as a GraphQL type-reference string.
       * @returns The GraphQL type-reference string.
       * @example
       * ```ts
       * import { GraphQLList, GraphQLNonNull, GraphQLString } from 'graphql/type';
       *
       * const requiredString = new GraphQLNonNull(GraphQLString);
       * const requiredStringList = new GraphQLNonNull(new GraphQLList(GraphQLString));
       *
       * requiredString.toString(); // => 'String!'
       * requiredStringList.toString(); // => '[String]!'
       * ```
       */
      toString() {
        return String(this.ofType) + "!";
      }
      /**
       * Returns the JSON representation used when this object is serialized.
       * @returns The JSON-serializable representation.
       * @example
       * ```ts
       * import { GraphQLNonNull, GraphQLString } from 'graphql/type';
       *
       * const requiredString = new GraphQLNonNull(GraphQLString);
       *
       * requiredString.toJSON(); // => 'String!'
       * JSON.stringify({ type: requiredString }); // => '{"type":"String!"}'
       * ```
       */
      toJSON() {
        return this.toString();
      }
    };
    exports.GraphQLNonNull = GraphQLNonNull;
    function isWrappingType(type) {
      return isListType2(type) || isNonNullType2(type);
    }
    function assertWrappingType(type) {
      if (!isWrappingType(type)) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(type)} to be a GraphQL wrapping type.`
        );
      }
      return type;
    }
    function isNullableType(type) {
      return isType(type) && !isNonNullType2(type);
    }
    function assertNullableType(type) {
      if (!isNullableType(type)) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(type)} to be a GraphQL nullable type.`
        );
      }
      return type;
    }
    function getNullableType(type) {
      if (type) {
        return isNonNullType2(type) ? type.ofType : type;
      }
    }
    function isNamedType(type) {
      return isScalarType(type) || isObjectType2(type) || isInterfaceType2(type) || isUnionType2(type) || isEnumType(type) || isInputObjectType(type);
    }
    function assertNamedType(type) {
      if (!isNamedType(type)) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(type)} to be a GraphQL named type.`
        );
      }
      return type;
    }
    function getNamedType2(type) {
      if (type) {
        let unwrappedType = type;
        while (isWrappingType(unwrappedType)) {
          unwrappedType = unwrappedType.ofType;
        }
        return unwrappedType;
      }
    }
    function resolveReadonlyArrayThunk(thunk) {
      return typeof thunk === "function" ? thunk() : thunk;
    }
    function resolveObjMapThunk(thunk) {
      return typeof thunk === "function" ? thunk() : thunk;
    }
    var GraphQLScalarType = class {
      /** The GraphQL name for this schema element. */
      /** Human-readable description for this schema element, if provided. */
      /** URL identifying the behavior specified for this custom scalar. */
      /** Function that converts internal values to externally visible scalar values. */
      /** Function that converts variable input into this scalar's internal value. */
      /** Function that converts AST input literals into this scalar's internal value. */
      /** Custom extension fields reserved for users. */
      /** AST node from which this schema element was built, if available. */
      /** AST extension nodes applied to this schema element. */
      /**
       * Creates a GraphQLScalarType instance.
       * @param config - Configuration describing this object.
       * @example
       * ```ts
       * import assert from 'node:assert/strict';
       * import { Kind, parse } from 'graphql/language';
       * import { GraphQLScalarType } from 'graphql/type';
       *
       * const document = parse(`
       *   "Odd integer values."
       *   scalar Odd @specifiedBy(url: "https://example.com/odd")
       *
       *   extend scalar Odd @specifiedBy(url: "https://example.com/odd-v2")
       * `);
       * assert(document.definitions[0].kind === Kind.SCALAR_TYPE_DEFINITION);
       * assert(document.definitions[1].kind === Kind.SCALAR_TYPE_EXTENSION);
       *
       * const ensureOdd = (value: unknown) => {
       *   if (
       *     typeof value !== 'number' ||
       *     !Number.isInteger(value) ||
       *     value % 2 === 0
       *   ) {
       *     throw new TypeError('Odd can only accept odd integers.');
       *   }
       *   return value;
       * };
       *
       * const Odd = new GraphQLScalarType({
       *   name: 'Odd',
       *   description: 'Odd integer values.',
       *   specifiedByURL: 'https://example.com/odd',
       *   serialize: ensureOdd,
       *   parseValue: ensureOdd,
       *   parseLiteral: (ast) => {
       *     if (ast.kind !== Kind.INT) {
       *       throw new TypeError('Odd can only parse integer literals.');
       *     }
       *     return ensureOdd(Number(ast.value));
       *   },
       *   extensions: { numeric: true },
       *   astNode: document.definitions[0],
       *   extensionASTNodes: [document.definitions[1]],
       * });
       *
       * Odd.description; // => 'Odd integer values.'
       * Odd.specifiedByURL; // => 'https://example.com/odd'
       * Odd.serialize(3); // => 3
       * Odd.parseValue(5); // => 5
       * Odd.parseValue(2); // throws an error
       * Odd.parseValue(1.5); // throws an error
       * Odd.extensions; // => { numeric: true }
       * ```
       */
      constructor(config) {
        var _config$parseValue, _config$serialize, _config$parseLiteral, _config$extensionASTN;
        const parseValue = (_config$parseValue = config.parseValue) !== null && _config$parseValue !== void 0 ? _config$parseValue : _identityFunc.identityFunc;
        this.name = (0, _assertName.assertName)(config.name);
        this.description = config.description;
        this.specifiedByURL = config.specifiedByURL;
        this.serialize = (_config$serialize = config.serialize) !== null && _config$serialize !== void 0 ? _config$serialize : _identityFunc.identityFunc;
        this.parseValue = parseValue;
        this.parseLiteral = (_config$parseLiteral = config.parseLiteral) !== null && _config$parseLiteral !== void 0 ? _config$parseLiteral : (node2, variables) => parseValue(
          (0, _valueFromASTUntyped.valueFromASTUntyped)(node2, variables)
        );
        this.extensions = (0, _toObjMap.toObjMap)(config.extensions);
        this.astNode = config.astNode;
        this.extensionASTNodes = (_config$extensionASTN = config.extensionASTNodes) !== null && _config$extensionASTN !== void 0 ? _config$extensionASTN : [];
        config.specifiedByURL == null || typeof config.specifiedByURL === "string" || (0, _devAssert.devAssert)(
          false,
          `${this.name} must provide "specifiedByURL" as a string, but got: ${(0, _inspect.inspect)(config.specifiedByURL)}.`
        );
        config.serialize == null || typeof config.serialize === "function" || (0, _devAssert.devAssert)(
          false,
          `${this.name} must provide "serialize" function. If this custom Scalar is also used as an input type, ensure "parseValue" and "parseLiteral" functions are also provided.`
        );
        if (config.parseLiteral) {
          typeof config.parseValue === "function" && typeof config.parseLiteral === "function" || (0, _devAssert.devAssert)(
            false,
            `${this.name} must provide both "parseValue" and "parseLiteral" functions.`
          );
        }
      }
      /**
       * Returns the value used by `Object.prototype.toString`.
       * @returns The built-in string tag for this object.
       */
      get [Symbol.toStringTag]() {
        return "GraphQLScalarType";
      }
      /**
       * Returns a normalized configuration object for this object.
       * @returns A configuration object that can be used to recreate this object.
       * @example
       * ```ts
       * import { GraphQLScalarType } from 'graphql/type';
       *
       * const Url = new GraphQLScalarType({
       *   name: 'Url',
       *   description: 'An absolute URL string.',
       *   specifiedByURL: 'https://url.spec.whatwg.org/',
       * });
       *
       * const config = Url.toConfig();
       * const UrlCopy = new GraphQLScalarType(config);
       *
       * config.name; // => 'Url'
       * config.specifiedByURL; // => 'https://url.spec.whatwg.org/'
       * UrlCopy.name; // => Url.name
       * ```
       */
      toConfig() {
        return {
          name: this.name,
          description: this.description,
          specifiedByURL: this.specifiedByURL,
          serialize: this.serialize,
          parseValue: this.parseValue,
          parseLiteral: this.parseLiteral,
          extensions: this.extensions,
          astNode: this.astNode,
          extensionASTNodes: this.extensionASTNodes
        };
      }
      /**
       * Returns the schema coordinate identifying this scalar type.
       * @returns The schema coordinate for this scalar type.
       * @example
       * ```ts
       * import { GraphQLScalarType } from 'graphql/type';
       *
       * const DateTime = new GraphQLScalarType({ name: 'DateTime' });
       *
       * DateTime.toString(); // => 'DateTime'
       * String(DateTime); // => 'DateTime'
       * ```
       */
      toString() {
        return this.name;
      }
      /**
       * Returns the JSON representation used when this object is serialized.
       * @returns The JSON-serializable representation.
       * @example
       * ```ts
       * import { GraphQLScalarType } from 'graphql/type';
       *
       * const DateTime = new GraphQLScalarType({ name: 'DateTime' });
       *
       * DateTime.toJSON(); // => 'DateTime'
       * JSON.stringify({ type: DateTime }); // => '{"type":"DateTime"}'
       * ```
       */
      toJSON() {
        return this.toString();
      }
    };
    exports.GraphQLScalarType = GraphQLScalarType;
    var GraphQLObjectType = class {
      /** The GraphQL name for this schema element. */
      /** Human-readable description for this schema element, if provided. */
      /** Predicate used to determine whether a runtime value belongs to this object type. */
      /** Custom extension fields reserved for users. */
      /** AST node from which this schema element was built, if available. */
      /** AST extension nodes applied to this schema element. */
      /**
       * Creates a GraphQLObjectType instance.
       * @param config - Configuration describing this object.
       * @example
       * ```ts
       * import assert from 'node:assert/strict';
       * // Configure an object type with interfaces, fields, arguments, and metadata.
       * import { parse, Kind } from 'graphql/language';
       * import {
       *   GraphQLID,
       *   GraphQLInterfaceType,
       *   GraphQLNonNull,
       *   GraphQLObjectType,
       *   GraphQLString,
       * } from 'graphql/type';
       *
       * const document = parse(`
       *   type User implements Node {
       *     id: ID!
       *     name(format: String = "short"): String
       *   }
       *
       *   extend type User {
       *     displayName: String
       *   }
       * `);
       * assert(document.definitions[0].kind === Kind.OBJECT_TYPE_DEFINITION);
       * assert(document.definitions[1].kind === Kind.OBJECT_TYPE_EXTENSION);
       * const definition = document.definitions[0];
       * const nameField = definition.fields?.[1];
       * const formatArg = nameField?.arguments?.[0];
       *
       * const Node = new GraphQLInterfaceType({
       *   name: 'Node',
       *   fields: {
       *     id: { type: new GraphQLNonNull(GraphQLID) },
       *   },
       * });
       *
       * const User = new GraphQLObjectType({
       *   name: 'User',
       *   description: 'A registered user.',
       *   interfaces: [Node],
       *   fields: {
       *     id: { type: new GraphQLNonNull(GraphQLID) },
       *     name: {
       *       description: 'The formatted user name.',
       *       type: GraphQLString,
       *       args: {
       *         format: {
       *           description: 'Controls the name format.',
       *           type: GraphQLString,
       *           defaultValue: 'short',
       *           deprecationReason: 'Use locale instead.',
       *           extensions: { public: true },
       *           astNode: formatArg,
       *         },
       *       },
       *       resolve: (user, { format }) => {
       *         return format === 'long' ? user.fullName : user.name;
       *       },
       *       deprecationReason: 'Use displayName.',
       *       extensions: { cacheSeconds: 60 },
       *       astNode: nameField,
       *     },
       *   },
       *   isTypeOf: (value) => {
       *     return typeof value === 'object' && value != null && 'id' in value;
       *   },
       *   extensions: { entity: 'User' },
       *   astNode: definition,
       *   extensionASTNodes: [document.definitions[1]],
       * });
       *
       * User.name; // => 'User'
       * User.getInterfaces(); // => [Node]
       * Object.keys(User.getFields()); // => ['id', 'name']
       * User.getFields().name.args[0].defaultValue; // => 'short'
       * User.extensions; // => { entity: 'User' }
       * ```
       * @example
       * ```ts
       * // This variant configures a subscription field with subscribe and resolve functions.
       * import { GraphQLObjectType, GraphQLString } from 'graphql/type';
       *
       * const Subscription = new GraphQLObjectType({
       *   name: 'Subscription',
       *   fields: {
       *     greeting: {
       *       type: GraphQLString,
       *       subscribe: async function* () {
       *         yield { greeting: 'Hello!' };
       *       },
       *       resolve: (event) => {
       *         return event.greeting;
       *       },
       *     },
       *   },
       * });
       *
       * typeof Subscription.getFields().greeting.subscribe; // => 'function'
       * ```
       */
      constructor(config) {
        var _config$extensionASTN2;
        this.name = (0, _assertName.assertName)(config.name);
        this.description = config.description;
        this.isTypeOf = config.isTypeOf;
        this.extensions = (0, _toObjMap.toObjMap)(config.extensions);
        this.astNode = config.astNode;
        this.extensionASTNodes = (_config$extensionASTN2 = config.extensionASTNodes) !== null && _config$extensionASTN2 !== void 0 ? _config$extensionASTN2 : [];
        this._fields = () => defineFieldMap(config);
        this._interfaces = () => defineInterfaces(config);
        config.isTypeOf == null || typeof config.isTypeOf === "function" || (0, _devAssert.devAssert)(
          false,
          `${this.name} must provide "isTypeOf" as a function, but got: ${(0, _inspect.inspect)(config.isTypeOf)}.`
        );
      }
      /**
       * Returns the value used by `Object.prototype.toString`.
       * @returns The built-in string tag for this object.
       */
      get [Symbol.toStringTag]() {
        return "GraphQLObjectType";
      }
      /**
       * Returns the fields defined by this type.
       * @returns The fields keyed by field name.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       * import { assertObjectType } from 'graphql/type';
       *
       * const schema = buildSchema(`
       *   type User {
       *     id: ID!
       *     name: String
       *   }
       *
       *   type Query {
       *     viewer: User
       *   }
       * `);
       *
       * const User = assertObjectType(schema.getType('User'));
       * const fields = User.getFields();
       *
       * Object.keys(fields); // => ['id', 'name']
       * String(fields.id.type); // => 'ID!'
       * ```
       */
      getFields() {
        if (typeof this._fields === "function") {
          this._fields = this._fields();
        }
        return this._fields;
      }
      /**
       * Returns the interfaces implemented by this type.
       * @returns The implemented interfaces.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       * import { assertObjectType } from 'graphql/type';
       *
       * const schema = buildSchema(`
       *   interface Node {
       *     id: ID!
       *   }
       *
       *   type User implements Node {
       *     id: ID!
       *   }
       *
       *   type Query {
       *     viewer: User
       *   }
       * `);
       *
       * const User = assertObjectType(schema.getType('User'));
       *
       * User.getInterfaces().map((type) => type.name); // => ['Node']
       * ```
       */
      getInterfaces() {
        if (typeof this._interfaces === "function") {
          this._interfaces = this._interfaces();
        }
        return this._interfaces;
      }
      /**
       * Returns a normalized configuration object for this object.
       * @returns A configuration object that can be used to recreate this object.
       * @example
       * ```ts
       * import { GraphQLObjectType, GraphQLString } from 'graphql/type';
       *
       * const User = new GraphQLObjectType({
       *   name: 'User',
       *   fields: {
       *     name: { type: GraphQLString },
       *   },
       * });
       *
       * const config = User.toConfig();
       * const UserCopy = new GraphQLObjectType(config);
       *
       * config.fields.name.type; // => GraphQLString
       * UserCopy.getFields().name.type; // => GraphQLString
       * ```
       */
      toConfig() {
        return {
          name: this.name,
          description: this.description,
          interfaces: this.getInterfaces(),
          fields: fieldsToFieldsConfig(this.getFields()),
          isTypeOf: this.isTypeOf,
          extensions: this.extensions,
          astNode: this.astNode,
          extensionASTNodes: this.extensionASTNodes
        };
      }
      /**
       * Returns the schema coordinate identifying this object type.
       * @returns The schema coordinate for this object type.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       * import { assertObjectType } from 'graphql/type';
       *
       * const schema = buildSchema(`
       *   type User {
       *     name: String
       *   }
       *
       *   type Query {
       *     viewer: User
       *   }
       * `);
       *
       * const User = assertObjectType(schema.getType('User'));
       *
       * User.toString(); // => 'User'
       * ```
       */
      toString() {
        return this.name;
      }
      /**
       * Returns the JSON representation used when this object is serialized.
       * @returns The JSON-serializable representation.
       * @example
       * ```ts
       * import { GraphQLObjectType, GraphQLString } from 'graphql/type';
       *
       * const User = new GraphQLObjectType({
       *   name: 'User',
       *   fields: { name: { type: GraphQLString } },
       * });
       *
       * User.toJSON(); // => 'User'
       * JSON.stringify({ type: User }); // => '{"type":"User"}'
       * ```
       */
      toJSON() {
        return this.toString();
      }
    };
    exports.GraphQLObjectType = GraphQLObjectType;
    function defineInterfaces(config) {
      var _config$interfaces;
      const interfaces = resolveReadonlyArrayThunk(
        (_config$interfaces = config.interfaces) !== null && _config$interfaces !== void 0 ? _config$interfaces : []
      );
      Array.isArray(interfaces) || (0, _devAssert.devAssert)(
        false,
        `${config.name} interfaces must be an Array or a function which returns an Array.`
      );
      return interfaces;
    }
    function defineFieldMap(config) {
      const fieldMap = resolveObjMapThunk(config.fields);
      isPlainObj(fieldMap) || (0, _devAssert.devAssert)(
        false,
        `${config.name} fields must be an object with field names as keys or a function which returns such an object.`
      );
      return (0, _mapValue.mapValue)(fieldMap, (fieldConfig, fieldName) => {
        var _fieldConfig$args;
        isPlainObj(fieldConfig) || (0, _devAssert.devAssert)(
          false,
          `${config.name}.${fieldName} field config must be an object.`
        );
        fieldConfig.resolve == null || typeof fieldConfig.resolve === "function" || (0, _devAssert.devAssert)(
          false,
          `${config.name}.${fieldName} field resolver must be a function if provided, but got: ${(0, _inspect.inspect)(fieldConfig.resolve)}.`
        );
        const argsConfig = (_fieldConfig$args = fieldConfig.args) !== null && _fieldConfig$args !== void 0 ? _fieldConfig$args : {};
        isPlainObj(argsConfig) || (0, _devAssert.devAssert)(
          false,
          `${config.name}.${fieldName} args must be an object with argument names as keys.`
        );
        return {
          name: (0, _assertName.assertName)(fieldName),
          description: fieldConfig.description,
          type: fieldConfig.type,
          args: defineArguments(argsConfig),
          resolve: fieldConfig.resolve,
          subscribe: fieldConfig.subscribe,
          deprecationReason: fieldConfig.deprecationReason,
          extensions: (0, _toObjMap.toObjMap)(fieldConfig.extensions),
          astNode: fieldConfig.astNode
        };
      });
    }
    function defineArguments(config) {
      return Object.entries(config).map(([argName, argConfig]) => ({
        name: (0, _assertName.assertName)(argName),
        description: argConfig.description,
        type: argConfig.type,
        defaultValue: argConfig.defaultValue,
        deprecationReason: argConfig.deprecationReason,
        extensions: (0, _toObjMap.toObjMap)(argConfig.extensions),
        astNode: argConfig.astNode
      }));
    }
    function isPlainObj(obj) {
      return (0, _isObjectLike.isObjectLike)(obj) && !Array.isArray(obj);
    }
    function fieldsToFieldsConfig(fields) {
      return (0, _mapValue.mapValue)(fields, (field) => ({
        description: field.description,
        type: field.type,
        args: argsToArgsConfig(field.args),
        resolve: field.resolve,
        subscribe: field.subscribe,
        deprecationReason: field.deprecationReason,
        extensions: field.extensions,
        astNode: field.astNode
      }));
    }
    function argsToArgsConfig(args) {
      return (0, _keyValMap.keyValMap)(
        args,
        (arg) => arg.name,
        (arg) => ({
          description: arg.description,
          type: arg.type,
          defaultValue: arg.defaultValue,
          deprecationReason: arg.deprecationReason,
          extensions: arg.extensions,
          astNode: arg.astNode
        })
      );
    }
    function isRequiredArgument(arg) {
      return isNonNullType2(arg.type) && arg.defaultValue === void 0;
    }
    var GraphQLInterfaceType = class {
      /** The GraphQL name for this schema element. */
      /** Human-readable description for this schema element, if provided. */
      /** Function that resolves the concrete object type for this abstract type. */
      /** Custom extension fields reserved for users. */
      /** AST node from which this schema element was built, if available. */
      /** AST extension nodes applied to this schema element. */
      /**
       * Creates a GraphQLInterfaceType instance.
       * @param config - Configuration describing this object.
       * @example
       * ```ts
       * import assert from 'node:assert/strict';
       * import { parse, Kind } from 'graphql/language';
       * import { GraphQLID, GraphQLInterfaceType, GraphQLNonNull } from 'graphql/type';
       *
       * const document = parse(`
       *   interface Node {
       *     id: ID!
       *   }
       *
       *   interface Resource implements Node {
       *     id: ID!
       *   }
       *
       *   extend interface Resource {
       *     url: String
       *   }
       * `);
       * assert(document.definitions[1].kind === Kind.INTERFACE_TYPE_DEFINITION);
       * assert(document.definitions[2].kind === Kind.INTERFACE_TYPE_EXTENSION);
       *
       * const Node = new GraphQLInterfaceType({
       *   name: 'Node',
       *   fields: {
       *     id: { type: new GraphQLNonNull(GraphQLID) },
       *   },
       * });
       *
       * const Resource = new GraphQLInterfaceType({
       *   name: 'Resource',
       *   description: 'An addressable resource.',
       *   interfaces: [Node],
       *   fields: {
       *     id: { type: new GraphQLNonNull(GraphQLID) },
       *   },
       *   resolveType: (value) => {
       *     return typeof value === 'object' && value != null && 'url' in value
       *       ? 'WebPage'
       *       : undefined;
       *   },
       *   extensions: { abstract: true },
       *   astNode: document.definitions[1],
       *   extensionASTNodes: [document.definitions[2]],
       * });
       *
       * Resource.name; // => 'Resource'
       * Resource.getInterfaces(); // => [Node]
       * Object.keys(Resource.getFields()); // => ['id']
       * Resource.extensions; // => { abstract: true }
       * ```
       */
      constructor(config) {
        var _config$extensionASTN3;
        this.name = (0, _assertName.assertName)(config.name);
        this.description = config.description;
        this.resolveType = config.resolveType;
        this.extensions = (0, _toObjMap.toObjMap)(config.extensions);
        this.astNode = config.astNode;
        this.extensionASTNodes = (_config$extensionASTN3 = config.extensionASTNodes) !== null && _config$extensionASTN3 !== void 0 ? _config$extensionASTN3 : [];
        this._fields = defineFieldMap.bind(void 0, config);
        this._interfaces = defineInterfaces.bind(void 0, config);
        config.resolveType == null || typeof config.resolveType === "function" || (0, _devAssert.devAssert)(
          false,
          `${this.name} must provide "resolveType" as a function, but got: ${(0, _inspect.inspect)(config.resolveType)}.`
        );
      }
      /**
       * Returns the value used by `Object.prototype.toString`.
       * @returns The built-in string tag for this object.
       */
      get [Symbol.toStringTag]() {
        return "GraphQLInterfaceType";
      }
      /**
       * Returns the fields defined by this type.
       * @returns The fields keyed by field name.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       * import { assertInterfaceType } from 'graphql/type';
       *
       * const schema = buildSchema(`
       *   interface Node {
       *     id: ID!
       *   }
       *
       *   type User implements Node {
       *     id: ID!
       *   }
       *
       *   type Query {
       *     node: Node
       *   }
       * `);
       *
       * const Node = assertInterfaceType(schema.getType('Node'));
       * const fields = Node.getFields();
       *
       * Object.keys(fields); // => ['id']
       * String(fields.id.type); // => 'ID!'
       * ```
       */
      getFields() {
        if (typeof this._fields === "function") {
          this._fields = this._fields();
        }
        return this._fields;
      }
      /**
       * Returns the interfaces implemented by this type.
       * @returns The implemented interfaces.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       * import { assertInterfaceType } from 'graphql/type';
       *
       * const schema = buildSchema(`
       *   interface Resource {
       *     url: String!
       *   }
       *
       *   interface Image implements Resource {
       *     url: String!
       *     width: Int
       *   }
       *
       *   type Photo implements Resource & Image {
       *     url: String!
       *     width: Int
       *   }
       *
       *   type Query {
       *     image: Image
       *   }
       * `);
       *
       * const Image = assertInterfaceType(schema.getType('Image'));
       *
       * Image.getInterfaces().map((type) => type.name); // => ['Resource']
       * ```
       */
      getInterfaces() {
        if (typeof this._interfaces === "function") {
          this._interfaces = this._interfaces();
        }
        return this._interfaces;
      }
      /**
       * Returns a normalized configuration object for this object.
       * @returns A configuration object that can be used to recreate this object.
       * @example
       * ```ts
       * import { GraphQLID, GraphQLInterfaceType, GraphQLNonNull } from 'graphql/type';
       *
       * const Node = new GraphQLInterfaceType({
       *   name: 'Node',
       *   fields: {
       *     id: { type: new GraphQLNonNull(GraphQLID) },
       *   },
       * });
       *
       * const config = Node.toConfig();
       * const NodeCopy = new GraphQLInterfaceType(config);
       *
       * String(config.fields.id.type); // => 'ID!'
       * String(NodeCopy.getFields().id.type); // => 'ID!'
       * ```
       */
      toConfig() {
        return {
          name: this.name,
          description: this.description,
          interfaces: this.getInterfaces(),
          fields: fieldsToFieldsConfig(this.getFields()),
          resolveType: this.resolveType,
          extensions: this.extensions,
          astNode: this.astNode,
          extensionASTNodes: this.extensionASTNodes
        };
      }
      /**
       * Returns the schema coordinate identifying this interface type.
       * @returns The schema coordinate for this interface type.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       * import { assertInterfaceType } from 'graphql/type';
       *
       * const schema = buildSchema(`
       *   interface Node {
       *     id: ID!
       *   }
       *
       *   type User implements Node {
       *     id: ID!
       *   }
       *
       *   type Query {
       *     node: Node
       *   }
       * `);
       *
       * const Node = assertInterfaceType(schema.getType('Node'));
       *
       * Node.toString(); // => 'Node'
       * ```
       */
      toString() {
        return this.name;
      }
      /**
       * Returns the JSON representation used when this object is serialized.
       * @returns The JSON-serializable representation.
       * @example
       * ```ts
       * import { GraphQLInterfaceType, GraphQLString } from 'graphql/type';
       *
       * const Named = new GraphQLInterfaceType({
       *   name: 'Named',
       *   fields: { name: { type: GraphQLString } },
       * });
       *
       * Named.toJSON(); // => 'Named'
       * JSON.stringify({ type: Named }); // => '{"type":"Named"}'
       * ```
       */
      toJSON() {
        return this.toString();
      }
    };
    exports.GraphQLInterfaceType = GraphQLInterfaceType;
    var GraphQLUnionType = class {
      /** The GraphQL name for this schema element. */
      /** Human-readable description for this schema element, if provided. */
      /** Function that resolves the concrete object type for this abstract type. */
      /** Custom extension fields reserved for users. */
      /** AST node from which this schema element was built, if available. */
      /** AST extension nodes applied to this schema element. */
      /**
       * Creates a GraphQLUnionType instance.
       * @param config - Configuration describing this object.
       * @example
       * ```ts
       * import assert from 'node:assert/strict';
       * import { parse, Kind } from 'graphql/language';
       * import {
       *   GraphQLObjectType,
       *   GraphQLString,
       *   GraphQLUnionType,
       * } from 'graphql/type';
       *
       * const document = parse(`
       *   union Media = Photo | Video
       *
       *   extend union Media = Audio
       * `);
       * assert(document.definitions[0].kind === Kind.UNION_TYPE_DEFINITION);
       * assert(document.definitions[1].kind === Kind.UNION_TYPE_EXTENSION);
       *
       * const Photo = new GraphQLObjectType({
       *   name: 'Photo',
       *   fields: { url: { type: GraphQLString } },
       * });
       * const Video = new GraphQLObjectType({
       *   name: 'Video',
       *   fields: { url: { type: GraphQLString } },
       * });
       *
       * const Media = new GraphQLUnionType({
       *   name: 'Media',
       *   description: 'Media that can appear in a search result.',
       *   types: [Photo, Video],
       *   resolveType: (value) => {
       *     return typeof value === 'object' && value != null && 'duration' in value
       *       ? 'Video'
       *       : 'Photo';
       *   },
       *   extensions: { searchable: true },
       *   astNode: document.definitions[0],
       *   extensionASTNodes: [document.definitions[1]],
       * });
       *
       * Media.description; // => 'Media that can appear in a search result.'
       * Media.getTypes().map((type) => type.name); // => ['Photo', 'Video']
       * Media.extensions; // => { searchable: true }
       * ```
       */
      constructor(config) {
        var _config$extensionASTN4;
        this.name = (0, _assertName.assertName)(config.name);
        this.description = config.description;
        this.resolveType = config.resolveType;
        this.extensions = (0, _toObjMap.toObjMap)(config.extensions);
        this.astNode = config.astNode;
        this.extensionASTNodes = (_config$extensionASTN4 = config.extensionASTNodes) !== null && _config$extensionASTN4 !== void 0 ? _config$extensionASTN4 : [];
        this._types = defineTypes.bind(void 0, config);
        config.resolveType == null || typeof config.resolveType === "function" || (0, _devAssert.devAssert)(
          false,
          `${this.name} must provide "resolveType" as a function, but got: ${(0, _inspect.inspect)(config.resolveType)}.`
        );
      }
      /**
       * Returns the value used by `Object.prototype.toString`.
       * @returns The built-in string tag for this object.
       */
      get [Symbol.toStringTag]() {
        return "GraphQLUnionType";
      }
      /**
       * Returns the object types included in this union.
       * @returns The union member object types.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       * import { assertUnionType } from 'graphql/type';
       *
       * const schema = buildSchema(`
       *   type Photo {
       *     url: String!
       *   }
       *
       *   type Video {
       *     url: String!
       *   }
       *
       *   union Media = Photo | Video
       *
       *   type Query {
       *     media: [Media]
       *   }
       * `);
       *
       * const Media = assertUnionType(schema.getType('Media'));
       *
       * Media.getTypes().map((type) => type.name); // => ['Photo', 'Video']
       * ```
       */
      getTypes() {
        if (typeof this._types === "function") {
          this._types = this._types();
        }
        return this._types;
      }
      /**
       * Returns a normalized configuration object for this object.
       * @returns A configuration object that can be used to recreate this object.
       * @example
       * ```ts
       * import {
       *   GraphQLObjectType,
       *   GraphQLString,
       *   GraphQLUnionType,
       * } from 'graphql/type';
       *
       * const Photo = new GraphQLObjectType({
       *   name: 'Photo',
       *   fields: { url: { type: GraphQLString } },
       * });
       * const Video = new GraphQLObjectType({
       *   name: 'Video',
       *   fields: { url: { type: GraphQLString } },
       * });
       * const Media = new GraphQLUnionType({
       *   name: 'Media',
       *   types: [Photo, Video],
       * });
       *
       * const config = Media.toConfig();
       * const MediaCopy = new GraphQLUnionType(config);
       *
       * MediaCopy.getTypes().map((type) => type.name); // => ['Photo', 'Video']
       * ```
       */
      toConfig() {
        return {
          name: this.name,
          description: this.description,
          types: this.getTypes(),
          resolveType: this.resolveType,
          extensions: this.extensions,
          astNode: this.astNode,
          extensionASTNodes: this.extensionASTNodes
        };
      }
      /**
       * Returns the schema coordinate identifying this union type.
       * @returns The schema coordinate for this union type.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       * import { assertUnionType } from 'graphql/type';
       *
       * const schema = buildSchema(`
       *   type Photo {
       *     url: String!
       *   }
       *
       *   union SearchResult = Photo
       *
       *   type Query {
       *     search: [SearchResult]
       *   }
       * `);
       *
       * const SearchResult = assertUnionType(schema.getType('SearchResult'));
       *
       * SearchResult.toString(); // => 'SearchResult'
       * ```
       */
      toString() {
        return this.name;
      }
      /**
       * Returns the JSON representation used when this object is serialized.
       * @returns The JSON-serializable representation.
       * @example
       * ```ts
       * import {
       *   GraphQLObjectType,
       *   GraphQLString,
       *   GraphQLUnionType,
       * } from 'graphql/type';
       *
       * const Photo = new GraphQLObjectType({
       *   name: 'Photo',
       *   fields: { url: { type: GraphQLString } },
       * });
       * const SearchResult = new GraphQLUnionType({
       *   name: 'SearchResult',
       *   types: [Photo],
       * });
       *
       * SearchResult.toJSON(); // => 'SearchResult'
       * JSON.stringify({ type: SearchResult }); // => '{"type":"SearchResult"}'
       * ```
       */
      toJSON() {
        return this.toString();
      }
    };
    exports.GraphQLUnionType = GraphQLUnionType;
    function defineTypes(config) {
      const types = resolveReadonlyArrayThunk(config.types);
      Array.isArray(types) || (0, _devAssert.devAssert)(
        false,
        `Must provide Array of types or a function which returns such an array for Union ${config.name}.`
      );
      return types;
    }
    var GraphQLEnumType = class {
      /* <T> */
      /** The GraphQL name for this schema element. */
      /** Human-readable description for this schema element, if provided. */
      /** Custom extension fields reserved for users. */
      /** AST node from which this schema element was built, if available. */
      /** AST extension nodes applied to this schema element. */
      /**
       * Creates a GraphQLEnumType instance.
       * @param config - Configuration describing this object.
       * @example
       * ```ts
       * import assert from 'node:assert/strict';
       * import { parse, Kind } from 'graphql/language';
       * import { GraphQLEnumType } from 'graphql/type';
       *
       * const document = parse(`
       *   enum Episode {
       *     NEW_HOPE
       *     EMPIRE
       *     JEDI
       *   }
       *
       *   extend enum Episode {
       *     FORCE_AWAKENS
       *   }
       * `);
       * assert(document.definitions[0].kind === Kind.ENUM_TYPE_DEFINITION);
       * assert(document.definitions[1].kind === Kind.ENUM_TYPE_EXTENSION);
       * const definition = document.definitions[0];
       *
       * const Episode = new GraphQLEnumType({
       *   name: 'Episode',
       *   description: 'A Star Wars film episode.',
       *   values: {
       *     NEW_HOPE: {
       *       value: 4,
       *       description: 'Released in 1977.',
       *       extensions: { trilogy: 'original' },
       *       astNode: definition.values?.[0],
       *     },
       *     EMPIRE: { value: 5, astNode: definition.values?.[1] },
       *     JEDI: {
       *       value: 6,
       *       deprecationReason: 'Use RETURN_OF_THE_JEDI.',
       *       astNode: definition.values?.[2],
       *     },
       *   },
       *   extensions: { catalog: 'films' },
       *   astNode: definition,
       *   extensionASTNodes: [document.definitions[1]],
       * });
       *
       * Episode.description; // => 'A Star Wars film episode.'
       * Episode.serialize(5); // => 'EMPIRE'
       * Episode.parseValue('JEDI'); // => 6
       * Episode.getValue('JEDI')?.deprecationReason; // => 'Use RETURN_OF_THE_JEDI.'
       * Episode.extensions; // => { catalog: 'films' }
       * ```
       */
      constructor(config) {
        var _config$extensionASTN5;
        this.name = (0, _assertName.assertName)(config.name);
        this.description = config.description;
        this.extensions = (0, _toObjMap.toObjMap)(config.extensions);
        this.astNode = config.astNode;
        this.extensionASTNodes = (_config$extensionASTN5 = config.extensionASTNodes) !== null && _config$extensionASTN5 !== void 0 ? _config$extensionASTN5 : [];
        this._values = typeof config.values === "function" ? config.values : defineEnumValues(this.name, config.values);
        this._valueLookup = null;
        this._nameLookup = null;
      }
      /**
       * Returns the value used by `Object.prototype.toString`.
       * @returns The built-in string tag for this object.
       */
      get [Symbol.toStringTag]() {
        return "GraphQLEnumType";
      }
      /**
       * Returns the values defined by this enum type.
       * @returns Enum value definitions in schema order.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       * import { assertEnumType } from 'graphql/type';
       *
       * const schema = buildSchema(`
       *   enum Episode {
       *     NEW_HOPE
       *     EMPIRE
       *     JEDI
       *   }
       *
       *   type Query {
       *     episode: Episode
       *   }
       * `);
       *
       * const Episode = assertEnumType(schema.getType('Episode'));
       *
       * Episode.getValues().map((value) => value.name); // => ['NEW_HOPE', 'EMPIRE', 'JEDI']
       * ```
       */
      getValues() {
        if (typeof this._values === "function") {
          this._values = defineEnumValues(this.name, this._values());
        }
        return this._values;
      }
      /**
       * Returns the enum value definition for a value name.
       * @param name - The GraphQL name to look up.
       * @returns The matching enum value definition, if it exists.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       * import { assertEnumType } from 'graphql/type';
       *
       * const schema = buildSchema(`
       *   enum Episode {
       *     NEW_HOPE
       *     EMPIRE
       *   }
       *
       *   type Query {
       *     episode: Episode
       *   }
       * `);
       *
       * const Episode = assertEnumType(schema.getType('Episode'));
       *
       * Episode.getValue('EMPIRE')?.name; // => 'EMPIRE'
       * Episode.getValue('JEDI'); // => undefined
       * ```
       */
      getValue(name2) {
        if (this._nameLookup === null) {
          this._nameLookup = (0, _keyMap.keyMap)(
            this.getValues(),
            (value) => value.name
          );
        }
        return this._nameLookup[name2];
      }
      /**
       * Serializes a runtime enum value as a GraphQL enum name.
       * @param outputValue - Runtime enum value to serialize.
       * @returns The GraphQL enum name for the runtime value.
       * @example
       * ```ts
       * import { GraphQLEnumType } from 'graphql/type';
       *
       * const RGB = new GraphQLEnumType({
       *   name: 'RGB',
       *   values: {
       *     RED: { value: 0 },
       *     GREEN: { value: 1 },
       *     BLUE: { value: 2 },
       *   },
       * });
       *
       * RGB.serialize(1); // => 'GREEN'
       * RGB.serialize(3); // throws an error
       * ```
       */
      serialize(outputValue) {
        if (this._valueLookup === null) {
          this._valueLookup = new Map(
            this.getValues().map((enumValue2) => [enumValue2.value, enumValue2])
          );
        }
        const enumValue = this._valueLookup.get(outputValue);
        if (enumValue === void 0) {
          throw new _GraphQLError.GraphQLError(
            `Enum "${this.name}" cannot represent value: ${(0, _inspect.inspect)(
              outputValue
            )}`
          );
        }
        return enumValue.name;
      }
      /**
       * Parses a GraphQL enum name from variable input.
       * @param inputValue - Runtime input value to parse.
       * @param hideSuggestions - Omit suggestions from error messages.
       * @returns The internal enum value represented by the input name.
       * @example
       * ```ts
       * import { GraphQLEnumType } from 'graphql/type';
       *
       * const RGB = new GraphQLEnumType({
       *   name: 'RGB',
       *   values: {
       *     RED: { value: 0 },
       *     GREEN: { value: 1 },
       *     BLUE: { value: 2 },
       *   },
       * });
       *
       * RGB.parseValue('BLUE'); // => 2
       * RGB.parseValue('PURPLE'); // throws an error
       * RGB.parseValue(2); // throws an error
       * ```
       */
      parseValue(inputValue, hideSuggestions) {
        if (typeof inputValue !== "string") {
          const valueStr = (0, _inspect.inspect)(inputValue);
          throw new _GraphQLError.GraphQLError(
            `Enum "${this.name}" cannot represent non-string value: ${valueStr}.` + (hideSuggestions ? "" : didYouMeanEnumValue(this, valueStr))
          );
        }
        const enumValue = this.getValue(inputValue);
        if (enumValue == null) {
          throw new _GraphQLError.GraphQLError(
            `Value "${inputValue}" does not exist in "${this.name}" enum.` + (hideSuggestions ? "" : didYouMeanEnumValue(this, inputValue))
          );
        }
        return enumValue.value;
      }
      /**
       * Parses a GraphQL enum name from an AST value literal.
       * @param valueNode - AST value literal to parse.
       * @param _variables - Runtime variable values; ignored because enum literals cannot contain variables.
       * @param hideSuggestions - Omit suggestions from error messages.
       * @returns The internal enum value represented by the literal.
       * @example
       * ```ts
       * import { parseValue } from 'graphql/language';
       * import { GraphQLEnumType } from 'graphql/type';
       *
       * const RGB = new GraphQLEnumType({
       *   name: 'RGB',
       *   values: {
       *     RED: { value: 0 },
       *     GREEN: { value: 1 },
       *     BLUE: { value: 2 },
       *   },
       * });
       *
       * RGB.parseLiteral(parseValue('RED'), undefined); // => 0
       * RGB.parseLiteral(parseValue('"RED"'), undefined); // throws an error
       * ```
       */
      parseLiteral(valueNode, _variables, hideSuggestions) {
        if (valueNode.kind !== _kinds.Kind.ENUM) {
          const valueStr = (0, _printer.printForError)(valueNode);
          throw new _GraphQLError.GraphQLError(
            `Enum "${this.name}" cannot represent non-enum value: ${valueStr}.` + (hideSuggestions ? "" : didYouMeanEnumValue(this, valueStr)),
            {
              nodes: valueNode
            }
          );
        }
        const enumValue = this.getValue(valueNode.value);
        if (enumValue == null) {
          const valueStr = (0, _printer.printForError)(valueNode);
          throw new _GraphQLError.GraphQLError(
            `Value "${valueStr}" does not exist in "${this.name}" enum.` + (hideSuggestions ? "" : didYouMeanEnumValue(this, valueStr)),
            {
              nodes: valueNode
            }
          );
        }
        return enumValue.value;
      }
      /**
       * Returns a normalized configuration object for this object.
       * @returns A configuration object that can be used to recreate this object.
       * @example
       * ```ts
       * import { GraphQLEnumType } from 'graphql/type';
       *
       * const RGB = new GraphQLEnumType({
       *   name: 'RGB',
       *   values: {
       *     RED: { value: 0 },
       *     GREEN: { value: 1 },
       *     BLUE: { value: 2 },
       *   },
       * });
       *
       * const config = RGB.toConfig();
       * const RGBCopy = new GraphQLEnumType(config);
       *
       * config.values.GREEN.value; // => 1
       * RGBCopy.serialize(2); // => 'BLUE'
       * ```
       */
      toConfig() {
        const values = (0, _keyValMap.keyValMap)(
          this.getValues(),
          (value) => value.name,
          (value) => ({
            description: value.description,
            value: value.value,
            deprecationReason: value.deprecationReason,
            extensions: value.extensions,
            astNode: value.astNode
          })
        );
        return {
          name: this.name,
          description: this.description,
          values,
          extensions: this.extensions,
          astNode: this.astNode,
          extensionASTNodes: this.extensionASTNodes
        };
      }
      /**
       * Returns the schema coordinate identifying this enum type.
       * @returns The schema coordinate for this enum type.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       * import { assertEnumType } from 'graphql/type';
       *
       * const schema = buildSchema(`
       *   enum Episode {
       *     NEW_HOPE
       *   }
       *
       *   type Query {
       *     episode: Episode
       *   }
       * `);
       *
       * const Episode = assertEnumType(schema.getType('Episode'));
       *
       * Episode.toString(); // => 'Episode'
       * ```
       */
      toString() {
        return this.name;
      }
      /**
       * Returns the JSON representation used when this object is serialized.
       * @returns The JSON-serializable representation.
       * @example
       * ```ts
       * import { GraphQLEnumType } from 'graphql/type';
       *
       * const Episode = new GraphQLEnumType({
       *   name: 'Episode',
       *   values: {
       *     NEW_HOPE: {},
       *   },
       * });
       *
       * Episode.toJSON(); // => 'Episode'
       * JSON.stringify({ type: Episode }); // => '{"type":"Episode"}'
       * ```
       */
      toJSON() {
        return this.toString();
      }
    };
    exports.GraphQLEnumType = GraphQLEnumType;
    function didYouMeanEnumValue(enumType, unknownValueStr) {
      const allNames = enumType.getValues().map((value) => value.name);
      const suggestedValues = (0, _suggestionList.suggestionList)(
        unknownValueStr,
        allNames
      );
      return (0, _didYouMean.didYouMean)("the enum value", suggestedValues);
    }
    function defineEnumValues(typeName, valueMap) {
      isPlainObj(valueMap) || (0, _devAssert.devAssert)(
        false,
        `${typeName} values must be an object with value names as keys.`
      );
      return Object.entries(valueMap).map(([valueName, valueConfig]) => {
        isPlainObj(valueConfig) || (0, _devAssert.devAssert)(
          false,
          `${typeName}.${valueName} must refer to an object with a "value" key representing an internal value but got: ${(0, _inspect.inspect)(
            valueConfig
          )}.`
        );
        return {
          name: (0, _assertName.assertEnumValueName)(valueName),
          description: valueConfig.description,
          value: valueConfig.value !== void 0 ? valueConfig.value : valueName,
          deprecationReason: valueConfig.deprecationReason,
          extensions: (0, _toObjMap.toObjMap)(valueConfig.extensions),
          astNode: valueConfig.astNode
        };
      });
    }
    var GraphQLInputObjectType = class {
      /** The GraphQL name for this schema element. */
      /** Human-readable description for this schema element, if provided. */
      /** Custom extension fields reserved for users. */
      /** AST node from which this schema element was built, if available. */
      /** AST extension nodes applied to this schema element. */
      /** Whether this input object uses the experimental OneOf input object semantics. */
      /**
       * Creates a GraphQLInputObjectType instance.
       * @param config - Configuration describing this object.
       * @example
       * ```ts
       * import assert from 'node:assert/strict';
       * import { parse, Kind } from 'graphql/language';
       * import {
       *   GraphQLID,
       *   GraphQLInputObjectType,
       *   GraphQLInt,
       *   GraphQLNonNull,
       *   GraphQLString,
       * } from 'graphql/type';
       *
       * const document = parse(`
       *   input ReviewInput {
       *     stars: Int!
       *     commentary: String
       *   }
       *
       *   extend input ReviewInput {
       *     body: String
       *   }
       * `);
       * assert(document.definitions[0].kind === Kind.INPUT_OBJECT_TYPE_DEFINITION);
       * assert(document.definitions[1].kind === Kind.INPUT_OBJECT_TYPE_EXTENSION);
       * const definition = document.definitions[0];
       *
       * const ReviewInput = new GraphQLInputObjectType({
       *   name: 'ReviewInput',
       *   description: 'Input collected when reviewing a product.',
       *   fields: {
       *     stars: {
       *       description: 'Star rating from one to five.',
       *       type: new GraphQLNonNull(GraphQLInt),
       *       extensions: { min: 1, max: 5 },
       *       astNode: definition.fields?.[0],
       *     },
       *     commentary: {
       *       type: GraphQLString,
       *       defaultValue: '',
       *       deprecationReason: 'Use body.',
       *       astNode: definition.fields?.[1],
       *     },
       *   },
       *   extensions: { form: 'review' },
       *   astNode: definition,
       *   extensionASTNodes: [document.definitions[1]],
       *   isOneOf: false,
       * });
       * const SearchBy = new GraphQLInputObjectType({
       *   name: 'SearchBy',
       *   fields: {
       *     id: { type: GraphQLID },
       *     slug: { type: GraphQLString },
       *   },
       *   isOneOf: true,
       * });
       *
       * const fields = ReviewInput.getFields();
       *
       * ReviewInput.description; // => 'Input collected when reviewing a product.'
       * String(fields.stars.type); // => 'Int!'
       * fields.stars.extensions; // => { min: 1, max: 5 }
       * fields.commentary.defaultValue; // => ''
       * fields.commentary.deprecationReason; // => 'Use body.'
       * ReviewInput.isOneOf; // => false
       * SearchBy.isOneOf; // => true
       * ```
       */
      constructor(config) {
        var _config$extensionASTN6, _config$isOneOf;
        this.name = (0, _assertName.assertName)(config.name);
        this.description = config.description;
        this.extensions = (0, _toObjMap.toObjMap)(config.extensions);
        this.astNode = config.astNode;
        this.extensionASTNodes = (_config$extensionASTN6 = config.extensionASTNodes) !== null && _config$extensionASTN6 !== void 0 ? _config$extensionASTN6 : [];
        this.isOneOf = (_config$isOneOf = config.isOneOf) !== null && _config$isOneOf !== void 0 ? _config$isOneOf : false;
        this._fields = defineInputFieldMap.bind(void 0, config);
      }
      /**
       * Returns the value used by `Object.prototype.toString`.
       * @returns The built-in string tag for this object.
       */
      get [Symbol.toStringTag]() {
        return "GraphQLInputObjectType";
      }
      /**
       * Returns the fields defined by this type.
       * @returns The fields keyed by field name.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       * import { assertInputObjectType } from 'graphql/type';
       *
       * const schema = buildSchema(`
       *   input ReviewInput {
       *     stars: Int!
       *     commentary: String = ""
       *   }
       *
       *   type Query {
       *     reviews(filter: ReviewInput): [String]
       *   }
       * `);
       *
       * const ReviewInput = assertInputObjectType(schema.getType('ReviewInput'));
       * const fields = ReviewInput.getFields();
       *
       * Object.keys(fields); // => ['stars', 'commentary']
       * fields.commentary.defaultValue; // => ''
       * ```
       */
      getFields() {
        if (typeof this._fields === "function") {
          this._fields = this._fields();
        }
        return this._fields;
      }
      /**
       * Returns a normalized configuration object for this object.
       * @returns A configuration object that can be used to recreate this object.
       * @example
       * ```ts
       * import {
       *   GraphQLInputObjectType,
       *   GraphQLInt,
       *   GraphQLNonNull,
       * } from 'graphql/type';
       *
       * const ReviewInput = new GraphQLInputObjectType({
       *   name: 'ReviewInput',
       *   fields: {
       *     stars: { type: new GraphQLNonNull(GraphQLInt) },
       *   },
       * });
       *
       * const config = ReviewInput.toConfig();
       * const ReviewInputCopy = new GraphQLInputObjectType(config);
       *
       * String(config.fields.stars.type); // => 'Int!'
       * String(ReviewInputCopy.getFields().stars.type); // => 'Int!'
       * ```
       */
      toConfig() {
        const fields = (0, _mapValue.mapValue)(this.getFields(), (field) => ({
          description: field.description,
          type: field.type,
          defaultValue: field.defaultValue,
          deprecationReason: field.deprecationReason,
          extensions: field.extensions,
          astNode: field.astNode
        }));
        return {
          name: this.name,
          description: this.description,
          fields,
          extensions: this.extensions,
          astNode: this.astNode,
          extensionASTNodes: this.extensionASTNodes,
          isOneOf: this.isOneOf
        };
      }
      /**
       * Returns the schema coordinate identifying this input object type.
       * @returns The schema coordinate for this input object type.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       * import { assertInputObjectType } from 'graphql/type';
       *
       * const schema = buildSchema(`
       *   input ReviewInput {
       *     stars: Int!
       *   }
       *
       *   type Query {
       *     reviews(filter: ReviewInput): [String]
       *   }
       * `);
       *
       * const ReviewInput = assertInputObjectType(schema.getType('ReviewInput'));
       *
       * ReviewInput.toString(); // => 'ReviewInput'
       * ```
       */
      toString() {
        return this.name;
      }
      /**
       * Returns the JSON representation used when this object is serialized.
       * @returns The JSON-serializable representation.
       * @example
       * ```ts
       * import { GraphQLInputObjectType, GraphQLString } from 'graphql/type';
       *
       * const ReviewInput = new GraphQLInputObjectType({
       *   name: 'ReviewInput',
       *   fields: {
       *     commentary: { type: GraphQLString },
       *   },
       * });
       *
       * ReviewInput.toJSON(); // => 'ReviewInput'
       * JSON.stringify({ type: ReviewInput }); // => '{"type":"ReviewInput"}'
       * ```
       */
      toJSON() {
        return this.toString();
      }
    };
    exports.GraphQLInputObjectType = GraphQLInputObjectType;
    function defineInputFieldMap(config) {
      const fieldMap = resolveObjMapThunk(config.fields);
      isPlainObj(fieldMap) || (0, _devAssert.devAssert)(
        false,
        `${config.name} fields must be an object with field names as keys or a function which returns such an object.`
      );
      return (0, _mapValue.mapValue)(fieldMap, (fieldConfig, fieldName) => {
        !("resolve" in fieldConfig) || (0, _devAssert.devAssert)(
          false,
          `${config.name}.${fieldName} field has a resolve property, but Input Types cannot define resolvers.`
        );
        return {
          name: (0, _assertName.assertName)(fieldName),
          description: fieldConfig.description,
          type: fieldConfig.type,
          defaultValue: fieldConfig.defaultValue,
          deprecationReason: fieldConfig.deprecationReason,
          extensions: (0, _toObjMap.toObjMap)(fieldConfig.extensions),
          astNode: fieldConfig.astNode
        };
      });
    }
    function isRequiredInputField(field) {
      return isNonNullType2(field.type) && field.defaultValue === void 0;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/typeComparators.js
var require_typeComparators = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/typeComparators.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.doTypesOverlap = doTypesOverlap;
    exports.isEqualType = isEqualType;
    exports.isTypeSubTypeOf = isTypeSubTypeOf;
    var _definition = require_definition();
    function isEqualType(typeA, typeB) {
      if (typeA === typeB) {
        return true;
      }
      if ((0, _definition.isNonNullType)(typeA) && (0, _definition.isNonNullType)(typeB)) {
        return isEqualType(typeA.ofType, typeB.ofType);
      }
      if ((0, _definition.isListType)(typeA) && (0, _definition.isListType)(typeB)) {
        return isEqualType(typeA.ofType, typeB.ofType);
      }
      return false;
    }
    function isTypeSubTypeOf(schema, maybeSubType, superType) {
      if (maybeSubType === superType) {
        return true;
      }
      if ((0, _definition.isNonNullType)(superType)) {
        if ((0, _definition.isNonNullType)(maybeSubType)) {
          return isTypeSubTypeOf(schema, maybeSubType.ofType, superType.ofType);
        }
        return false;
      }
      if ((0, _definition.isNonNullType)(maybeSubType)) {
        return isTypeSubTypeOf(schema, maybeSubType.ofType, superType);
      }
      if ((0, _definition.isListType)(superType)) {
        if ((0, _definition.isListType)(maybeSubType)) {
          return isTypeSubTypeOf(schema, maybeSubType.ofType, superType.ofType);
        }
        return false;
      }
      if ((0, _definition.isListType)(maybeSubType)) {
        return false;
      }
      return (0, _definition.isAbstractType)(superType) && ((0, _definition.isInterfaceType)(maybeSubType) || (0, _definition.isObjectType)(maybeSubType)) && schema.isSubType(superType, maybeSubType);
    }
    function doTypesOverlap(schema, typeA, typeB) {
      if (typeA === typeB) {
        return true;
      }
      if ((0, _definition.isAbstractType)(typeA)) {
        if ((0, _definition.isAbstractType)(typeB)) {
          return schema.getPossibleTypes(typeA).some((type) => schema.isSubType(typeB, type));
        }
        return schema.isSubType(typeA, typeB);
      }
      if ((0, _definition.isAbstractType)(typeB)) {
        return schema.isSubType(typeB, typeA);
      }
      return false;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/type/scalars.js
var require_scalars = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/type/scalars.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.GraphQLString = exports.GraphQLInt = exports.GraphQLID = exports.GraphQLFloat = exports.GraphQLBoolean = exports.GRAPHQL_MIN_INT = exports.GRAPHQL_MAX_INT = void 0;
    exports.isSpecifiedScalarType = isSpecifiedScalarType;
    exports.specifiedScalarTypes = void 0;
    var _inspect = require_inspect();
    var _isObjectLike = require_isObjectLike();
    var _GraphQLError = require_GraphQLError();
    var _kinds = require_kinds();
    var _printer = require_printer();
    var _definition = require_definition();
    var GRAPHQL_MAX_INT = 2147483647;
    exports.GRAPHQL_MAX_INT = GRAPHQL_MAX_INT;
    var GRAPHQL_MIN_INT = -2147483648;
    exports.GRAPHQL_MIN_INT = GRAPHQL_MIN_INT;
    var GraphQLInt = new _definition.GraphQLScalarType({
      name: "Int",
      description: "The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1.",
      serialize(outputValue) {
        const coercedValue = serializeObject(outputValue);
        if (typeof coercedValue === "boolean") {
          return coercedValue ? 1 : 0;
        }
        let num = coercedValue;
        if (typeof coercedValue === "string" && coercedValue !== "") {
          num = Number(coercedValue);
        }
        if (typeof num !== "number" || !Number.isInteger(num)) {
          throw new _GraphQLError.GraphQLError(
            `Int cannot represent non-integer value: ${(0, _inspect.inspect)(
              coercedValue
            )}`
          );
        }
        if (num > GRAPHQL_MAX_INT || num < GRAPHQL_MIN_INT) {
          throw new _GraphQLError.GraphQLError(
            "Int cannot represent non 32-bit signed integer value: " + (0, _inspect.inspect)(coercedValue)
          );
        }
        return num;
      },
      parseValue(inputValue) {
        if (typeof inputValue !== "number" || !Number.isInteger(inputValue)) {
          throw new _GraphQLError.GraphQLError(
            `Int cannot represent non-integer value: ${(0, _inspect.inspect)(
              inputValue
            )}`
          );
        }
        if (inputValue > GRAPHQL_MAX_INT || inputValue < GRAPHQL_MIN_INT) {
          throw new _GraphQLError.GraphQLError(
            `Int cannot represent non 32-bit signed integer value: ${inputValue}`
          );
        }
        return inputValue;
      },
      parseLiteral(valueNode) {
        if (valueNode.kind !== _kinds.Kind.INT) {
          throw new _GraphQLError.GraphQLError(
            `Int cannot represent non-integer value: ${(0, _printer.printForError)(
              valueNode
            )}`,
            {
              nodes: valueNode
            }
          );
        }
        const num = parseInt(valueNode.value, 10);
        if (num > GRAPHQL_MAX_INT || num < GRAPHQL_MIN_INT) {
          throw new _GraphQLError.GraphQLError(
            `Int cannot represent non 32-bit signed integer value: ${valueNode.value}`,
            {
              nodes: valueNode
            }
          );
        }
        return num;
      }
    });
    exports.GraphQLInt = GraphQLInt;
    var GraphQLFloat = new _definition.GraphQLScalarType({
      name: "Float",
      description: "The `Float` scalar type represents signed double-precision fractional values as specified by [IEEE 754](https://en.wikipedia.org/wiki/IEEE_floating_point).",
      serialize(outputValue) {
        const coercedValue = serializeObject(outputValue);
        if (typeof coercedValue === "boolean") {
          return coercedValue ? 1 : 0;
        }
        let num = coercedValue;
        if (typeof coercedValue === "string" && coercedValue !== "") {
          num = Number(coercedValue);
        }
        if (typeof num !== "number" || !Number.isFinite(num)) {
          throw new _GraphQLError.GraphQLError(
            `Float cannot represent non numeric value: ${(0, _inspect.inspect)(
              coercedValue
            )}`
          );
        }
        return num;
      },
      parseValue(inputValue) {
        if (typeof inputValue !== "number" || !Number.isFinite(inputValue)) {
          throw new _GraphQLError.GraphQLError(
            `Float cannot represent non numeric value: ${(0, _inspect.inspect)(
              inputValue
            )}`
          );
        }
        return inputValue;
      },
      parseLiteral(valueNode) {
        if (valueNode.kind !== _kinds.Kind.FLOAT && valueNode.kind !== _kinds.Kind.INT) {
          throw new _GraphQLError.GraphQLError(
            `Float cannot represent non numeric value: ${(0, _printer.printForError)(valueNode)}`,
            valueNode
          );
        }
        return parseFloat(valueNode.value);
      }
    });
    exports.GraphQLFloat = GraphQLFloat;
    var GraphQLString = new _definition.GraphQLScalarType({
      name: "String",
      description: "The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.",
      serialize(outputValue) {
        const coercedValue = serializeObject(outputValue);
        if (typeof coercedValue === "string") {
          return coercedValue;
        }
        if (typeof coercedValue === "boolean") {
          return coercedValue ? "true" : "false";
        }
        if (typeof coercedValue === "number" && Number.isFinite(coercedValue)) {
          return coercedValue.toString();
        }
        throw new _GraphQLError.GraphQLError(
          `String cannot represent value: ${(0, _inspect.inspect)(outputValue)}`
        );
      },
      parseValue(inputValue) {
        if (typeof inputValue !== "string") {
          throw new _GraphQLError.GraphQLError(
            `String cannot represent a non string value: ${(0, _inspect.inspect)(
              inputValue
            )}`
          );
        }
        return inputValue;
      },
      parseLiteral(valueNode) {
        if (valueNode.kind !== _kinds.Kind.STRING) {
          throw new _GraphQLError.GraphQLError(
            `String cannot represent a non string value: ${(0, _printer.printForError)(valueNode)}`,
            {
              nodes: valueNode
            }
          );
        }
        return valueNode.value;
      }
    });
    exports.GraphQLString = GraphQLString;
    var GraphQLBoolean = new _definition.GraphQLScalarType({
      name: "Boolean",
      description: "The `Boolean` scalar type represents `true` or `false`.",
      serialize(outputValue) {
        const coercedValue = serializeObject(outputValue);
        if (typeof coercedValue === "boolean") {
          return coercedValue;
        }
        if (Number.isFinite(coercedValue)) {
          return coercedValue !== 0;
        }
        throw new _GraphQLError.GraphQLError(
          `Boolean cannot represent a non boolean value: ${(0, _inspect.inspect)(
            coercedValue
          )}`
        );
      },
      parseValue(inputValue) {
        if (typeof inputValue !== "boolean") {
          throw new _GraphQLError.GraphQLError(
            `Boolean cannot represent a non boolean value: ${(0, _inspect.inspect)(
              inputValue
            )}`
          );
        }
        return inputValue;
      },
      parseLiteral(valueNode) {
        if (valueNode.kind !== _kinds.Kind.BOOLEAN) {
          throw new _GraphQLError.GraphQLError(
            `Boolean cannot represent a non boolean value: ${(0, _printer.printForError)(valueNode)}`,
            {
              nodes: valueNode
            }
          );
        }
        return valueNode.value;
      }
    });
    exports.GraphQLBoolean = GraphQLBoolean;
    var GraphQLID = new _definition.GraphQLScalarType({
      name: "ID",
      description: 'The `ID` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `"4"`) or integer (such as `4`) input value will be accepted as an ID.',
      serialize(outputValue) {
        const coercedValue = serializeObject(outputValue);
        if (typeof coercedValue === "string") {
          return coercedValue;
        }
        if (Number.isInteger(coercedValue)) {
          return String(coercedValue);
        }
        throw new _GraphQLError.GraphQLError(
          `ID cannot represent value: ${(0, _inspect.inspect)(outputValue)}`
        );
      },
      parseValue(inputValue) {
        if (typeof inputValue === "string") {
          return inputValue;
        }
        if (typeof inputValue === "number" && Number.isInteger(inputValue)) {
          return inputValue.toString();
        }
        throw new _GraphQLError.GraphQLError(
          `ID cannot represent value: ${(0, _inspect.inspect)(inputValue)}`
        );
      },
      parseLiteral(valueNode) {
        if (valueNode.kind !== _kinds.Kind.STRING && valueNode.kind !== _kinds.Kind.INT) {
          throw new _GraphQLError.GraphQLError(
            "ID cannot represent a non-string and non-integer value: " + (0, _printer.printForError)(valueNode),
            {
              nodes: valueNode
            }
          );
        }
        return valueNode.value;
      }
    });
    exports.GraphQLID = GraphQLID;
    var specifiedScalarTypes = Object.freeze([
      GraphQLString,
      GraphQLInt,
      GraphQLFloat,
      GraphQLBoolean,
      GraphQLID
    ]);
    exports.specifiedScalarTypes = specifiedScalarTypes;
    function isSpecifiedScalarType(type) {
      return specifiedScalarTypes.some(({ name: name2 }) => type.name === name2);
    }
    function serializeObject(outputValue) {
      if ((0, _isObjectLike.isObjectLike)(outputValue)) {
        if (typeof outputValue.valueOf === "function") {
          const valueOfResult = outputValue.valueOf();
          if (!(0, _isObjectLike.isObjectLike)(valueOfResult)) {
            return valueOfResult;
          }
        }
        if (typeof outputValue.toJSON === "function") {
          return outputValue.toJSON();
        }
      }
      return outputValue;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/type/directives.js
var require_directives = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/type/directives.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.GraphQLSpecifiedByDirective = exports.GraphQLSkipDirective = exports.GraphQLOneOfDirective = exports.GraphQLIncludeDirective = exports.GraphQLDirective = exports.GraphQLDeprecatedDirective = exports.DEFAULT_DEPRECATION_REASON = void 0;
    exports.assertDirective = assertDirective;
    exports.isDirective = isDirective;
    exports.isSpecifiedDirective = isSpecifiedDirective;
    exports.specifiedDirectives = void 0;
    var _devAssert = require_devAssert();
    var _inspect = require_inspect();
    var _instanceOf = require_instanceOf();
    var _isObjectLike = require_isObjectLike();
    var _toObjMap = require_toObjMap();
    var _directiveLocation = require_directiveLocation();
    var _assertName = require_assertName();
    var _definition = require_definition();
    var _scalars = require_scalars();
    function isDirective(directive) {
      return (0, _instanceOf.instanceOf)(directive, GraphQLDirective);
    }
    function assertDirective(directive) {
      if (!isDirective(directive)) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(directive)} to be a GraphQL directive.`
        );
      }
      return directive;
    }
    var GraphQLDirective = class {
      /** The GraphQL name for this schema element. */
      /** Human-readable description for this schema element, if provided. */
      /** Locations where this directive may be applied. */
      /** Arguments accepted by this field or directive. */
      /** Whether this directive may appear more than once at the same location. */
      /** Reason this element is deprecated, if one was provided. */
      /** Custom extension fields reserved for users. */
      /** AST node from which this schema element was built, if available. */
      /** AST extension nodes applied to this schema element. */
      /**
       * Creates a GraphQLDirective instance.
       * @param config - Configuration describing this object.
       * @example
       * ```ts
       * import assert from 'node:assert/strict';
       * import { DirectiveLocation, parse, Kind } from 'graphql/language';
       * import {
       *   GraphQLBoolean,
       *   GraphQLDirective,
       *   GraphQLInt,
       *   GraphQLNonNull,
       * } from 'graphql/type';
       *
       * const document = parse(
       *   `
       *   directive @cacheControl(maxAge: Int) repeatable on FIELD_DEFINITION
       *   extend directive @cacheControl @tag
       * `,
       *   { experimentalDirectivesOnDirectiveDefinitions: true },
       * );
       * assert(document.definitions[0].kind === Kind.DIRECTIVE_DEFINITION);
       * assert(document.definitions[1].kind === Kind.DIRECTIVE_EXTENSION);
       * const definition = document.definitions[0];
       *
       * const cacheControl = new GraphQLDirective({
       *   name: 'cacheControl',
       *   description: 'Controls HTTP cache hints for a field.',
       *   locations: [DirectiveLocation.FIELD_DEFINITION],
       *   args: {
       *     inheritMaxAge: {
       *       description: 'Inherit the parent cache hint.',
       *       type: new GraphQLNonNull(GraphQLBoolean),
       *       defaultValue: false,
       *       deprecationReason: 'Use maxAge instead.',
       *       extensions: { scope: 'cache' },
       *     },
       *     maxAge: {
       *       type: GraphQLInt,
       *       astNode: definition.arguments?.[0],
       *     },
       *   },
       *   isRepeatable: true,
       *   deprecationReason: 'Use @cache instead.',
       *   extensions: { scope: 'cache' },
       *   astNode: definition,
       *   extensionASTNodes: [document.definitions[1]],
       * });
       *
       * cacheControl.name; // => 'cacheControl'
       * cacheControl.description; // => 'Controls HTTP cache hints for a field.'
       * cacheControl.args[0].name; // => 'inheritMaxAge'
       * cacheControl.args[0].defaultValue; // => false
       * cacheControl.isRepeatable; // => true
       * cacheControl.extensions; // => { scope: 'cache' }
       * ```
       */
      constructor(config) {
        var _config$isRepeatable, _config$extensionASTN, _config$args;
        this.name = (0, _assertName.assertName)(config.name);
        this.description = config.description;
        this.locations = config.locations;
        this.isRepeatable = (_config$isRepeatable = config.isRepeatable) !== null && _config$isRepeatable !== void 0 ? _config$isRepeatable : false;
        this.deprecationReason = config.deprecationReason;
        this.extensions = (0, _toObjMap.toObjMap)(config.extensions);
        this.astNode = config.astNode;
        this.extensionASTNodes = (_config$extensionASTN = config.extensionASTNodes) !== null && _config$extensionASTN !== void 0 ? _config$extensionASTN : [];
        Array.isArray(config.locations) || (0, _devAssert.devAssert)(
          false,
          `@${config.name} locations must be an Array.`
        );
        const args = (_config$args = config.args) !== null && _config$args !== void 0 ? _config$args : {};
        (0, _isObjectLike.isObjectLike)(args) && !Array.isArray(args) || (0, _devAssert.devAssert)(
          false,
          `@${config.name} args must be an object with argument names as keys.`
        );
        this.args = (0, _definition.defineArguments)(args);
      }
      /**
       * Returns the value used by `Object.prototype.toString`.
       * @returns The built-in string tag for this object.
       */
      get [Symbol.toStringTag]() {
        return "GraphQLDirective";
      }
      /**
       * Returns a normalized configuration object for this object.
       * @returns A configuration object that can be used to recreate this object.
       * @example
       * ```ts
       * import { DirectiveLocation } from 'graphql/language';
       * import { GraphQLDirective, GraphQLString } from 'graphql/type';
       *
       * const tag = new GraphQLDirective({
       *   name: 'tag',
       *   locations: [DirectiveLocation.FIELD_DEFINITION],
       *   args: {
       *     name: { type: GraphQLString },
       *   },
       * });
       *
       * const config = tag.toConfig();
       * const tagCopy = new GraphQLDirective(config);
       *
       * config.args.name.type; // => GraphQLString
       * tagCopy.args[0].name; // => 'name'
       * ```
       */
      toConfig() {
        return {
          name: this.name,
          description: this.description,
          locations: this.locations,
          args: (0, _definition.argsToArgsConfig)(this.args),
          isRepeatable: this.isRepeatable,
          deprecationReason: this.deprecationReason,
          extensions: this.extensions,
          astNode: this.astNode,
          extensionASTNodes: this.extensionASTNodes
        };
      }
      /**
       * Returns the schema coordinate identifying this directive.
       * @returns The directive schema coordinate.
       * @example
       * ```ts
       * import { DirectiveLocation } from 'graphql/language';
       * import { GraphQLDirective } from 'graphql/type';
       *
       * const tag = new GraphQLDirective({
       *   name: 'tag',
       *   locations: [DirectiveLocation.FIELD_DEFINITION],
       * });
       *
       * tag.toString(); // => '@tag'
       * ```
       */
      toString() {
        return "@" + this.name;
      }
      /**
       * Returns the JSON representation used when this object is serialized.
       * @returns The JSON-serializable representation.
       * @example
       * ```ts
       * import { DirectiveLocation } from 'graphql/language';
       * import { GraphQLDirective } from 'graphql/type';
       *
       * const tag = new GraphQLDirective({
       *   name: 'tag',
       *   locations: [DirectiveLocation.FIELD_DEFINITION],
       * });
       *
       * tag.toJSON(); // => '@tag'
       * JSON.stringify({ directive: tag }); // => '{"directive":"@tag"}'
       * ```
       */
      toJSON() {
        return this.toString();
      }
    };
    exports.GraphQLDirective = GraphQLDirective;
    var GraphQLIncludeDirective = new GraphQLDirective({
      name: "include",
      description: "Directs the executor to include this field or fragment only when the `if` argument is true.",
      locations: [
        _directiveLocation.DirectiveLocation.FIELD,
        _directiveLocation.DirectiveLocation.FRAGMENT_SPREAD,
        _directiveLocation.DirectiveLocation.INLINE_FRAGMENT
      ],
      args: {
        if: {
          type: new _definition.GraphQLNonNull(_scalars.GraphQLBoolean),
          description: "Included when true."
        }
      }
    });
    exports.GraphQLIncludeDirective = GraphQLIncludeDirective;
    var GraphQLSkipDirective = new GraphQLDirective({
      name: "skip",
      description: "Directs the executor to skip this field or fragment when the `if` argument is true.",
      locations: [
        _directiveLocation.DirectiveLocation.FIELD,
        _directiveLocation.DirectiveLocation.FRAGMENT_SPREAD,
        _directiveLocation.DirectiveLocation.INLINE_FRAGMENT
      ],
      args: {
        if: {
          type: new _definition.GraphQLNonNull(_scalars.GraphQLBoolean),
          description: "Skipped when true."
        }
      }
    });
    exports.GraphQLSkipDirective = GraphQLSkipDirective;
    var DEFAULT_DEPRECATION_REASON = "No longer supported";
    exports.DEFAULT_DEPRECATION_REASON = DEFAULT_DEPRECATION_REASON;
    var GraphQLDeprecatedDirective = new GraphQLDirective({
      name: "deprecated",
      description: "Marks an element of a GraphQL schema as no longer supported.",
      locations: [
        _directiveLocation.DirectiveLocation.FIELD_DEFINITION,
        _directiveLocation.DirectiveLocation.ARGUMENT_DEFINITION,
        _directiveLocation.DirectiveLocation.INPUT_FIELD_DEFINITION,
        _directiveLocation.DirectiveLocation.ENUM_VALUE,
        _directiveLocation.DirectiveLocation.DIRECTIVE_DEFINITION
      ],
      args: {
        reason: {
          type: _scalars.GraphQLString,
          description: "Explains why this element was deprecated, usually also including a suggestion for how to access supported similar data. Formatted using the Markdown syntax, as specified by [CommonMark](https://commonmark.org/).",
          defaultValue: DEFAULT_DEPRECATION_REASON
        }
      }
    });
    exports.GraphQLDeprecatedDirective = GraphQLDeprecatedDirective;
    var GraphQLSpecifiedByDirective = new GraphQLDirective({
      name: "specifiedBy",
      description: "Exposes a URL that specifies the behavior of this scalar.",
      locations: [_directiveLocation.DirectiveLocation.SCALAR],
      args: {
        url: {
          type: new _definition.GraphQLNonNull(_scalars.GraphQLString),
          description: "The URL that specifies the behavior of this scalar."
        }
      }
    });
    exports.GraphQLSpecifiedByDirective = GraphQLSpecifiedByDirective;
    var GraphQLOneOfDirective = new GraphQLDirective({
      name: "oneOf",
      description: "Indicates exactly one field must be supplied and this field must not be `null`.",
      locations: [_directiveLocation.DirectiveLocation.INPUT_OBJECT],
      args: {}
    });
    exports.GraphQLOneOfDirective = GraphQLOneOfDirective;
    var specifiedDirectives = Object.freeze([
      GraphQLIncludeDirective,
      GraphQLSkipDirective,
      GraphQLDeprecatedDirective,
      GraphQLSpecifiedByDirective,
      GraphQLOneOfDirective
    ]);
    exports.specifiedDirectives = specifiedDirectives;
    function isSpecifiedDirective(directive) {
      return specifiedDirectives.some(({ name: name2 }) => name2 === directive.name);
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/invariant.js
var require_invariant = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/invariant.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.invariant = invariant;
    function invariant(condition, message) {
      const booleanCondition = Boolean(condition);
      if (!booleanCondition) {
        throw new Error(
          message != null ? message : "Unexpected invariant triggered."
        );
      }
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/isIterableObject.js
var require_isIterableObject = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/isIterableObject.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.isIterableObject = isIterableObject;
    function isIterableObject(maybeIterable) {
      return typeof maybeIterable === "object" && typeof (maybeIterable === null || maybeIterable === void 0 ? void 0 : maybeIterable[Symbol.iterator]) === "function";
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/astFromValue.js
var require_astFromValue = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/astFromValue.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.astFromValue = astFromValue;
    var _inspect = require_inspect();
    var _invariant = require_invariant();
    var _isIterableObject = require_isIterableObject();
    var _isObjectLike = require_isObjectLike();
    var _kinds = require_kinds();
    var _definition = require_definition();
    var _scalars = require_scalars();
    function astFromValue(value, type) {
      if ((0, _definition.isNonNullType)(type)) {
        const astValue = astFromValue(value, type.ofType);
        if ((astValue === null || astValue === void 0 ? void 0 : astValue.kind) === _kinds.Kind.NULL) {
          return null;
        }
        return astValue;
      }
      if (value === null) {
        return {
          kind: _kinds.Kind.NULL
        };
      }
      if (value === void 0) {
        return null;
      }
      if ((0, _definition.isListType)(type)) {
        const itemType = type.ofType;
        if ((0, _isIterableObject.isIterableObject)(value)) {
          const valuesNodes = [];
          for (const item of value) {
            const itemNode = astFromValue(item, itemType);
            if (itemNode != null) {
              valuesNodes.push(itemNode);
            }
          }
          return {
            kind: _kinds.Kind.LIST,
            values: valuesNodes
          };
        }
        return astFromValue(value, itemType);
      }
      if ((0, _definition.isInputObjectType)(type)) {
        if (!(0, _isObjectLike.isObjectLike)(value)) {
          return null;
        }
        const fieldNodes = [];
        for (const field of Object.values(type.getFields())) {
          const fieldValue = astFromValue(value[field.name], field.type);
          if (fieldValue) {
            fieldNodes.push({
              kind: _kinds.Kind.OBJECT_FIELD,
              name: {
                kind: _kinds.Kind.NAME,
                value: field.name
              },
              value: fieldValue
            });
          }
        }
        return {
          kind: _kinds.Kind.OBJECT,
          fields: fieldNodes
        };
      }
      if ((0, _definition.isLeafType)(type)) {
        const serialized = type.serialize(value);
        if (serialized == null) {
          return null;
        }
        if (typeof serialized === "boolean") {
          return {
            kind: _kinds.Kind.BOOLEAN,
            value: serialized
          };
        }
        if (typeof serialized === "number" && Number.isFinite(serialized)) {
          const stringNum = String(serialized);
          return integerStringRegExp.test(stringNum) ? {
            kind: _kinds.Kind.INT,
            value: stringNum
          } : {
            kind: _kinds.Kind.FLOAT,
            value: stringNum
          };
        }
        if (typeof serialized === "string") {
          if ((0, _definition.isEnumType)(type)) {
            return {
              kind: _kinds.Kind.ENUM,
              value: serialized
            };
          }
          if (type === _scalars.GraphQLID && integerStringRegExp.test(serialized)) {
            return {
              kind: _kinds.Kind.INT,
              value: serialized
            };
          }
          return {
            kind: _kinds.Kind.STRING,
            value: serialized
          };
        }
        throw new TypeError(
          `Cannot convert value to AST: ${(0, _inspect.inspect)(serialized)}.`
        );
      }
      (0, _invariant.invariant)(
        false,
        "Unexpected input type: " + (0, _inspect.inspect)(type)
      );
    }
    var integerStringRegExp = /^-?(?:0|[1-9][0-9]*)$/;
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/type/introspection.js
var require_introspection = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/type/introspection.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.introspectionTypes = exports.__TypeKind = exports.__Type = exports.__Schema = exports.__InputValue = exports.__Field = exports.__EnumValue = exports.__DirectiveLocation = exports.__Directive = exports.TypeNameMetaFieldDef = exports.TypeMetaFieldDef = exports.TypeKind = exports.SchemaMetaFieldDef = void 0;
    exports.isIntrospectionType = isIntrospectionType;
    var _inspect = require_inspect();
    var _invariant = require_invariant();
    var _directiveLocation = require_directiveLocation();
    var _printer = require_printer();
    var _astFromValue = require_astFromValue();
    var _definition = require_definition();
    var _scalars = require_scalars();
    var __Schema = new _definition.GraphQLObjectType({
      name: "__Schema",
      description: "A GraphQL Schema defines the capabilities of a GraphQL server. It exposes all available types and directives on the server, as well as the entry points for query, mutation, and subscription operations.",
      fields: () => ({
        description: {
          type: _scalars.GraphQLString,
          resolve: (schema) => schema.description
        },
        types: {
          description: "A list of all types supported by this server.",
          type: new _definition.GraphQLNonNull(
            new _definition.GraphQLList(new _definition.GraphQLNonNull(__Type))
          ),
          resolve(schema) {
            return Object.values(schema.getTypeMap());
          }
        },
        queryType: {
          description: "The type that query operations will be rooted at.",
          type: new _definition.GraphQLNonNull(__Type),
          resolve: (schema) => schema.getQueryType()
        },
        mutationType: {
          description: "If this server supports mutation, the type that mutation operations will be rooted at.",
          type: __Type,
          resolve: (schema) => schema.getMutationType()
        },
        subscriptionType: {
          description: "If this server support subscription, the type that subscription operations will be rooted at.",
          type: __Type,
          resolve: (schema) => schema.getSubscriptionType()
        },
        directives: {
          description: "A list of all directives supported by this server.",
          type: new _definition.GraphQLNonNull(
            new _definition.GraphQLList(
              new _definition.GraphQLNonNull(__Directive)
            )
          ),
          args: {
            includeDeprecated: {
              type: new _definition.GraphQLNonNull(_scalars.GraphQLBoolean),
              defaultValue: false
            }
          },
          resolve: (schema, { includeDeprecated }) => includeDeprecated ? schema.getDirectives() : schema.getDirectives().filter((directive) => directive.deprecationReason == null)
        }
      })
    });
    exports.__Schema = __Schema;
    var __Directive = new _definition.GraphQLObjectType({
      name: "__Directive",
      description: "A Directive provides a way to describe alternate runtime execution and type validation behavior in a GraphQL document.\n\nIn some cases, you need to provide options to alter GraphQL's execution behavior in ways field arguments will not suffice, such as conditionally including or skipping a field. Directives provide this by describing additional information to the executor.",
      fields: () => ({
        name: {
          type: new _definition.GraphQLNonNull(_scalars.GraphQLString),
          resolve: (directive) => directive.name
        },
        description: {
          type: _scalars.GraphQLString,
          resolve: (directive) => directive.description
        },
        isRepeatable: {
          type: new _definition.GraphQLNonNull(_scalars.GraphQLBoolean),
          resolve: (directive) => directive.isRepeatable
        },
        locations: {
          type: new _definition.GraphQLNonNull(
            new _definition.GraphQLList(
              new _definition.GraphQLNonNull(__DirectiveLocation)
            )
          ),
          resolve: (directive) => directive.locations
        },
        args: {
          type: new _definition.GraphQLNonNull(
            new _definition.GraphQLList(
              new _definition.GraphQLNonNull(__InputValue)
            )
          ),
          args: {
            includeDeprecated: {
              type: _scalars.GraphQLBoolean,
              defaultValue: false
            }
          },
          resolve(field, { includeDeprecated }) {
            return includeDeprecated ? field.args : field.args.filter((arg) => arg.deprecationReason == null);
          }
        },
        isDeprecated: {
          type: new _definition.GraphQLNonNull(_scalars.GraphQLBoolean),
          resolve: (directive) => directive.deprecationReason != null
        },
        deprecationReason: {
          type: _scalars.GraphQLString,
          resolve: (directive) => directive.deprecationReason
        }
      })
    });
    exports.__Directive = __Directive;
    var __DirectiveLocation = new _definition.GraphQLEnumType({
      name: "__DirectiveLocation",
      description: "A Directive can be adjacent to many parts of the GraphQL language, a __DirectiveLocation describes one such possible adjacencies.",
      values: {
        QUERY: {
          value: _directiveLocation.DirectiveLocation.QUERY,
          description: "Location adjacent to a query operation."
        },
        MUTATION: {
          value: _directiveLocation.DirectiveLocation.MUTATION,
          description: "Location adjacent to a mutation operation."
        },
        SUBSCRIPTION: {
          value: _directiveLocation.DirectiveLocation.SUBSCRIPTION,
          description: "Location adjacent to a subscription operation."
        },
        FIELD: {
          value: _directiveLocation.DirectiveLocation.FIELD,
          description: "Location adjacent to a field."
        },
        FRAGMENT_DEFINITION: {
          value: _directiveLocation.DirectiveLocation.FRAGMENT_DEFINITION,
          description: "Location adjacent to a fragment definition."
        },
        FRAGMENT_SPREAD: {
          value: _directiveLocation.DirectiveLocation.FRAGMENT_SPREAD,
          description: "Location adjacent to a fragment spread."
        },
        INLINE_FRAGMENT: {
          value: _directiveLocation.DirectiveLocation.INLINE_FRAGMENT,
          description: "Location adjacent to an inline fragment."
        },
        VARIABLE_DEFINITION: {
          value: _directiveLocation.DirectiveLocation.VARIABLE_DEFINITION,
          description: "Location adjacent to a variable definition."
        },
        SCHEMA: {
          value: _directiveLocation.DirectiveLocation.SCHEMA,
          description: "Location adjacent to a schema definition."
        },
        SCALAR: {
          value: _directiveLocation.DirectiveLocation.SCALAR,
          description: "Location adjacent to a scalar definition."
        },
        OBJECT: {
          value: _directiveLocation.DirectiveLocation.OBJECT,
          description: "Location adjacent to an object type definition."
        },
        FIELD_DEFINITION: {
          value: _directiveLocation.DirectiveLocation.FIELD_DEFINITION,
          description: "Location adjacent to a field definition."
        },
        ARGUMENT_DEFINITION: {
          value: _directiveLocation.DirectiveLocation.ARGUMENT_DEFINITION,
          description: "Location adjacent to an argument definition."
        },
        INTERFACE: {
          value: _directiveLocation.DirectiveLocation.INTERFACE,
          description: "Location adjacent to an interface definition."
        },
        UNION: {
          value: _directiveLocation.DirectiveLocation.UNION,
          description: "Location adjacent to a union definition."
        },
        ENUM: {
          value: _directiveLocation.DirectiveLocation.ENUM,
          description: "Location adjacent to an enum definition."
        },
        ENUM_VALUE: {
          value: _directiveLocation.DirectiveLocation.ENUM_VALUE,
          description: "Location adjacent to an enum value definition."
        },
        INPUT_OBJECT: {
          value: _directiveLocation.DirectiveLocation.INPUT_OBJECT,
          description: "Location adjacent to an input object type definition."
        },
        INPUT_FIELD_DEFINITION: {
          value: _directiveLocation.DirectiveLocation.INPUT_FIELD_DEFINITION,
          description: "Location adjacent to an input object field definition."
        },
        DIRECTIVE_DEFINITION: {
          value: _directiveLocation.DirectiveLocation.DIRECTIVE_DEFINITION,
          description: "Location adjacent to a directive definition."
        }
      }
    });
    exports.__DirectiveLocation = __DirectiveLocation;
    var __Type = new _definition.GraphQLObjectType({
      name: "__Type",
      description: "The fundamental unit of any GraphQL Schema is the type. There are many kinds of types in GraphQL as represented by the `__TypeKind` enum.\n\nDepending on the kind of a type, certain fields describe information about that type. Scalar types provide no information beyond a name, description and optional `specifiedByURL`, while Enum types provide their values. Object and Interface types provide the fields they describe. Abstract types, Union and Interface, provide the Object types possible at runtime. List and NonNull types compose other types.",
      fields: () => ({
        kind: {
          type: new _definition.GraphQLNonNull(__TypeKind),
          resolve(type) {
            if ((0, _definition.isScalarType)(type)) {
              return TypeKind.SCALAR;
            }
            if ((0, _definition.isObjectType)(type)) {
              return TypeKind.OBJECT;
            }
            if ((0, _definition.isInterfaceType)(type)) {
              return TypeKind.INTERFACE;
            }
            if ((0, _definition.isUnionType)(type)) {
              return TypeKind.UNION;
            }
            if ((0, _definition.isEnumType)(type)) {
              return TypeKind.ENUM;
            }
            if ((0, _definition.isInputObjectType)(type)) {
              return TypeKind.INPUT_OBJECT;
            }
            if ((0, _definition.isListType)(type)) {
              return TypeKind.LIST;
            }
            if ((0, _definition.isNonNullType)(type)) {
              return TypeKind.NON_NULL;
            }
            (0, _invariant.invariant)(
              false,
              `Unexpected type: "${(0, _inspect.inspect)(type)}".`
            );
          }
        },
        name: {
          type: _scalars.GraphQLString,
          resolve: (type) => "name" in type ? type.name : void 0
        },
        description: {
          type: _scalars.GraphQLString,
          resolve: (type) => (
            /* c8 ignore next */
            "description" in type ? type.description : void 0
          )
        },
        specifiedByURL: {
          type: _scalars.GraphQLString,
          resolve: (obj) => "specifiedByURL" in obj ? obj.specifiedByURL : void 0
        },
        fields: {
          type: new _definition.GraphQLList(
            new _definition.GraphQLNonNull(__Field)
          ),
          args: {
            includeDeprecated: {
              type: _scalars.GraphQLBoolean,
              defaultValue: false
            }
          },
          resolve(type, { includeDeprecated }) {
            if ((0, _definition.isObjectType)(type) || (0, _definition.isInterfaceType)(type)) {
              const fields = Object.values(type.getFields());
              return includeDeprecated ? fields : fields.filter((field) => field.deprecationReason == null);
            }
          }
        },
        interfaces: {
          type: new _definition.GraphQLList(new _definition.GraphQLNonNull(__Type)),
          resolve(type) {
            if ((0, _definition.isObjectType)(type) || (0, _definition.isInterfaceType)(type)) {
              return type.getInterfaces();
            }
          }
        },
        possibleTypes: {
          type: new _definition.GraphQLList(new _definition.GraphQLNonNull(__Type)),
          resolve(type, _args, _context, { schema }) {
            if ((0, _definition.isAbstractType)(type)) {
              return schema.getPossibleTypes(type);
            }
          }
        },
        enumValues: {
          type: new _definition.GraphQLList(
            new _definition.GraphQLNonNull(__EnumValue)
          ),
          args: {
            includeDeprecated: {
              type: _scalars.GraphQLBoolean,
              defaultValue: false
            }
          },
          resolve(type, { includeDeprecated }) {
            if ((0, _definition.isEnumType)(type)) {
              const values = type.getValues();
              return includeDeprecated ? values : values.filter((field) => field.deprecationReason == null);
            }
          }
        },
        inputFields: {
          type: new _definition.GraphQLList(
            new _definition.GraphQLNonNull(__InputValue)
          ),
          args: {
            includeDeprecated: {
              type: _scalars.GraphQLBoolean,
              defaultValue: false
            }
          },
          resolve(type, { includeDeprecated }) {
            if ((0, _definition.isInputObjectType)(type)) {
              const values = Object.values(type.getFields());
              return includeDeprecated ? values : values.filter((field) => field.deprecationReason == null);
            }
          }
        },
        ofType: {
          type: __Type,
          resolve: (type) => "ofType" in type ? type.ofType : void 0
        },
        isOneOf: {
          type: _scalars.GraphQLBoolean,
          resolve: (type) => {
            if ((0, _definition.isInputObjectType)(type)) {
              return type.isOneOf;
            }
          }
        }
      })
    });
    exports.__Type = __Type;
    var __Field = new _definition.GraphQLObjectType({
      name: "__Field",
      description: "Object and Interface types are described by a list of Fields, each of which has a name, potentially a list of arguments, and a return type.",
      fields: () => ({
        name: {
          type: new _definition.GraphQLNonNull(_scalars.GraphQLString),
          resolve: (field) => field.name
        },
        description: {
          type: _scalars.GraphQLString,
          resolve: (field) => field.description
        },
        args: {
          type: new _definition.GraphQLNonNull(
            new _definition.GraphQLList(
              new _definition.GraphQLNonNull(__InputValue)
            )
          ),
          args: {
            includeDeprecated: {
              type: _scalars.GraphQLBoolean,
              defaultValue: false
            }
          },
          resolve(field, { includeDeprecated }) {
            return includeDeprecated ? field.args : field.args.filter((arg) => arg.deprecationReason == null);
          }
        },
        type: {
          type: new _definition.GraphQLNonNull(__Type),
          resolve: (field) => field.type
        },
        isDeprecated: {
          type: new _definition.GraphQLNonNull(_scalars.GraphQLBoolean),
          resolve: (field) => field.deprecationReason != null
        },
        deprecationReason: {
          type: _scalars.GraphQLString,
          resolve: (field) => field.deprecationReason
        }
      })
    });
    exports.__Field = __Field;
    var __InputValue = new _definition.GraphQLObjectType({
      name: "__InputValue",
      description: "Arguments provided to Fields or Directives and the input fields of an InputObject are represented as Input Values which describe their type and optionally a default value.",
      fields: () => ({
        name: {
          type: new _definition.GraphQLNonNull(_scalars.GraphQLString),
          resolve: (inputValue) => inputValue.name
        },
        description: {
          type: _scalars.GraphQLString,
          resolve: (inputValue) => inputValue.description
        },
        type: {
          type: new _definition.GraphQLNonNull(__Type),
          resolve: (inputValue) => inputValue.type
        },
        defaultValue: {
          type: _scalars.GraphQLString,
          description: "A GraphQL-formatted string representing the default value for this input value.",
          resolve(inputValue) {
            const { type, defaultValue } = inputValue;
            const valueAST = (0, _astFromValue.astFromValue)(defaultValue, type);
            return valueAST ? (0, _printer.print)(valueAST) : null;
          }
        },
        isDeprecated: {
          type: new _definition.GraphQLNonNull(_scalars.GraphQLBoolean),
          resolve: (field) => field.deprecationReason != null
        },
        deprecationReason: {
          type: _scalars.GraphQLString,
          resolve: (obj) => obj.deprecationReason
        }
      })
    });
    exports.__InputValue = __InputValue;
    var __EnumValue = new _definition.GraphQLObjectType({
      name: "__EnumValue",
      description: "One possible value for a given Enum. Enum values are unique values, not a placeholder for a string or numeric value. However an Enum value is returned in a JSON response as a string.",
      fields: () => ({
        name: {
          type: new _definition.GraphQLNonNull(_scalars.GraphQLString),
          resolve: (enumValue) => enumValue.name
        },
        description: {
          type: _scalars.GraphQLString,
          resolve: (enumValue) => enumValue.description
        },
        isDeprecated: {
          type: new _definition.GraphQLNonNull(_scalars.GraphQLBoolean),
          resolve: (enumValue) => enumValue.deprecationReason != null
        },
        deprecationReason: {
          type: _scalars.GraphQLString,
          resolve: (enumValue) => enumValue.deprecationReason
        }
      })
    });
    exports.__EnumValue = __EnumValue;
    var TypeKind;
    exports.TypeKind = TypeKind;
    (function(TypeKind2) {
      TypeKind2["SCALAR"] = "SCALAR";
      TypeKind2["OBJECT"] = "OBJECT";
      TypeKind2["INTERFACE"] = "INTERFACE";
      TypeKind2["UNION"] = "UNION";
      TypeKind2["ENUM"] = "ENUM";
      TypeKind2["INPUT_OBJECT"] = "INPUT_OBJECT";
      TypeKind2["LIST"] = "LIST";
      TypeKind2["NON_NULL"] = "NON_NULL";
    })(TypeKind || (exports.TypeKind = TypeKind = {}));
    var __TypeKind = new _definition.GraphQLEnumType({
      name: "__TypeKind",
      description: "An enum describing what kind of type a given `__Type` is.",
      values: {
        SCALAR: {
          value: TypeKind.SCALAR,
          description: "Indicates this type is a scalar."
        },
        OBJECT: {
          value: TypeKind.OBJECT,
          description: "Indicates this type is an object. `fields` and `interfaces` are valid fields."
        },
        INTERFACE: {
          value: TypeKind.INTERFACE,
          description: "Indicates this type is an interface. `fields`, `interfaces`, and `possibleTypes` are valid fields."
        },
        UNION: {
          value: TypeKind.UNION,
          description: "Indicates this type is a union. `possibleTypes` is a valid field."
        },
        ENUM: {
          value: TypeKind.ENUM,
          description: "Indicates this type is an enum. `enumValues` is a valid field."
        },
        INPUT_OBJECT: {
          value: TypeKind.INPUT_OBJECT,
          description: "Indicates this type is an input object. `inputFields` is a valid field."
        },
        LIST: {
          value: TypeKind.LIST,
          description: "Indicates this type is a list. `ofType` is a valid field."
        },
        NON_NULL: {
          value: TypeKind.NON_NULL,
          description: "Indicates this type is a non-null. `ofType` is a valid field."
        }
      }
    });
    exports.__TypeKind = __TypeKind;
    var SchemaMetaFieldDef = {
      name: "__schema",
      type: new _definition.GraphQLNonNull(__Schema),
      description: "Access the current type schema of this server.",
      args: [],
      resolve: (_source, _args, _context, { schema }) => schema,
      deprecationReason: void 0,
      extensions: /* @__PURE__ */ Object.create(null),
      astNode: void 0
    };
    exports.SchemaMetaFieldDef = SchemaMetaFieldDef;
    var TypeMetaFieldDef = {
      name: "__type",
      type: __Type,
      description: "Request the type information of a single type.",
      args: [
        {
          name: "name",
          description: void 0,
          type: new _definition.GraphQLNonNull(_scalars.GraphQLString),
          defaultValue: void 0,
          deprecationReason: void 0,
          extensions: /* @__PURE__ */ Object.create(null),
          astNode: void 0
        }
      ],
      resolve: (_source, { name: name2 }, _context, { schema }) => schema.getType(name2),
      deprecationReason: void 0,
      extensions: /* @__PURE__ */ Object.create(null),
      astNode: void 0
    };
    exports.TypeMetaFieldDef = TypeMetaFieldDef;
    var TypeNameMetaFieldDef = {
      name: "__typename",
      type: new _definition.GraphQLNonNull(_scalars.GraphQLString),
      description: "The name of the current Object type at runtime.",
      args: [],
      resolve: (_source, _args, _context, { parentType }) => parentType.name,
      deprecationReason: void 0,
      extensions: /* @__PURE__ */ Object.create(null),
      astNode: void 0
    };
    exports.TypeNameMetaFieldDef = TypeNameMetaFieldDef;
    var introspectionTypes = Object.freeze([
      __Schema,
      __Directive,
      __DirectiveLocation,
      __Type,
      __Field,
      __InputValue,
      __EnumValue,
      __TypeKind
    ]);
    exports.introspectionTypes = introspectionTypes;
    function isIntrospectionType(type) {
      return introspectionTypes.some(({ name: name2 }) => type.name === name2);
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/type/schema.js
var require_schema = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/type/schema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.GraphQLSchema = void 0;
    exports.assertSchema = assertSchema;
    exports.isSchema = isSchema;
    var _devAssert = require_devAssert();
    var _inspect = require_inspect();
    var _instanceOf = require_instanceOf();
    var _isObjectLike = require_isObjectLike();
    var _toObjMap = require_toObjMap();
    var _ast = require_ast();
    var _definition = require_definition();
    var _directives = require_directives();
    var _introspection = require_introspection();
    function isSchema(schema) {
      return (0, _instanceOf.instanceOf)(schema, GraphQLSchema);
    }
    function assertSchema(schema) {
      if (!isSchema(schema)) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(schema)} to be a GraphQL schema.`
        );
      }
      return schema;
    }
    var GraphQLSchema = class {
      /** Human-readable description for this schema element, if provided. */
      /** Custom extension fields reserved for users. */
      /** AST node from which this schema element was built, if available. */
      /** AST extension nodes applied to this schema element. */
      /**
       * Cached schema validation errors, if validation has already run.
       * @internal
       */
      /**
       * Creates a GraphQLSchema instance.
       * @param config - Configuration describing this object.
       * @example
       * ```ts
       * // Create a schema with the required query root.
       * import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql/type';
       *
       * const Query = new GraphQLObjectType({
       *   name: 'Query',
       *   fields: {
       *     greeting: {
       *       type: GraphQLString,
       *       resolve: () => 'Hello',
       *     },
       *   },
       * });
       *
       * const schema = new GraphQLSchema({
       *   description: 'The application schema.',
       *   query: Query,
       * });
       *
       * schema.getQueryType(); // => Query
       * schema.description; // => 'The application schema.'
       * ```
       * @example
       * ```ts
       * import assert from 'node:assert/strict';
       * // This variant configures every schema option, including directives and extensions.
       * import { DirectiveLocation, parse, Kind } from 'graphql/language';
       * import {
       *   GraphQLBoolean,
       *   GraphQLDirective,
       *   GraphQLObjectType,
       *   GraphQLSchema,
       *   GraphQLString,
       * } from 'graphql/type';
       *
       * const Query = new GraphQLObjectType({
       *   name: 'Query',
       *   fields: { greeting: { type: GraphQLString } },
       * });
       * const Mutation = new GraphQLObjectType({
       *   name: 'Mutation',
       *   fields: { setGreeting: { type: GraphQLString } },
       * });
       * const Subscription = new GraphQLObjectType({
       *   name: 'Subscription',
       *   fields: { greetingChanged: { type: GraphQLString } },
       * });
       * const AuditEvent = new GraphQLObjectType({
       *   name: 'AuditEvent',
       *   fields: { message: { type: GraphQLString } },
       * });
       * const authDirective = new GraphQLDirective({
       *   name: 'auth',
       *   locations: [DirectiveLocation.FIELD_DEFINITION],
       *   args: { required: { type: GraphQLBoolean } },
       * });
       * const schemaDocument = parse(`
       *   schema {
       *     query: Query
       *     mutation: Mutation
       *     subscription: Subscription
       *   }
       *
       *   extend schema @auth
       * `);
       * assert(schemaDocument.definitions[0].kind === Kind.SCHEMA_DEFINITION);
       * assert(schemaDocument.definitions[1].kind === Kind.SCHEMA_EXTENSION);
       *
       * const schema = new GraphQLSchema({
       *   description: 'Operations exposed by the application.',
       *   query: Query,
       *   mutation: Mutation,
       *   subscription: Subscription,
       *   types: [AuditEvent],
       *   directives: [authDirective],
       *   extensions: { owner: 'platform' },
       *   astNode: schemaDocument.definitions[0],
       *   extensionASTNodes: [schemaDocument.definitions[1]],
       *   assumeValid: true,
       * });
       *
       * schema.getMutationType(); // => Mutation
       * schema.getSubscriptionType(); // => Subscription
       * schema.getType('AuditEvent'); // => AuditEvent
       * schema.getDirective('auth'); // => authDirective
       * schema.extensions; // => { owner: 'platform' }
       * ```
       */
      constructor(config) {
        var _config$extensionASTN, _config$directives;
        this.__validationErrors = config.assumeValid === true ? [] : void 0;
        (0, _isObjectLike.isObjectLike)(config) || (0, _devAssert.devAssert)(false, "Must provide configuration object.");
        !config.types || Array.isArray(config.types) || (0, _devAssert.devAssert)(
          false,
          `"types" must be Array if provided but got: ${(0, _inspect.inspect)(
            config.types
          )}.`
        );
        !config.directives || Array.isArray(config.directives) || (0, _devAssert.devAssert)(
          false,
          `"directives" must be Array if provided but got: ${(0, _inspect.inspect)(config.directives)}.`
        );
        this.description = config.description;
        this.extensions = (0, _toObjMap.toObjMap)(config.extensions);
        this.astNode = config.astNode;
        this.extensionASTNodes = (_config$extensionASTN = config.extensionASTNodes) !== null && _config$extensionASTN !== void 0 ? _config$extensionASTN : [];
        this._queryType = config.query;
        this._mutationType = config.mutation;
        this._subscriptionType = config.subscription;
        this._directives = (_config$directives = config.directives) !== null && _config$directives !== void 0 ? _config$directives : _directives.specifiedDirectives;
        const allReferencedTypes = new Set(config.types);
        if (config.types != null) {
          for (const type of config.types) {
            allReferencedTypes.delete(type);
            collectReferencedTypes(type, allReferencedTypes);
          }
        }
        if (this._queryType != null) {
          collectReferencedTypes(this._queryType, allReferencedTypes);
        }
        if (this._mutationType != null) {
          collectReferencedTypes(this._mutationType, allReferencedTypes);
        }
        if (this._subscriptionType != null) {
          collectReferencedTypes(this._subscriptionType, allReferencedTypes);
        }
        for (const directive of this._directives) {
          if ((0, _directives.isDirective)(directive)) {
            for (const arg of directive.args) {
              collectReferencedTypes(arg.type, allReferencedTypes);
            }
          }
        }
        collectReferencedTypes(_introspection.__Schema, allReferencedTypes);
        this._typeMap = /* @__PURE__ */ Object.create(null);
        this._subTypeMap = /* @__PURE__ */ Object.create(null);
        this._implementationsMap = /* @__PURE__ */ Object.create(null);
        for (const namedType of allReferencedTypes) {
          if (namedType == null) {
            continue;
          }
          const typeName = namedType.name;
          typeName || (0, _devAssert.devAssert)(
            false,
            "One of the provided types for building the Schema is missing a name."
          );
          if (this._typeMap[typeName] !== void 0) {
            throw new Error(
              `Schema must contain uniquely named types but contains multiple types named "${typeName}".`
            );
          }
          this._typeMap[typeName] = namedType;
          if ((0, _definition.isInterfaceType)(namedType)) {
            for (const iface of namedType.getInterfaces()) {
              if ((0, _definition.isInterfaceType)(iface)) {
                let implementations = this._implementationsMap[iface.name];
                if (implementations === void 0) {
                  implementations = this._implementationsMap[iface.name] = {
                    objects: [],
                    interfaces: []
                  };
                }
                implementations.interfaces.push(namedType);
              }
            }
          } else if ((0, _definition.isObjectType)(namedType)) {
            for (const iface of namedType.getInterfaces()) {
              if ((0, _definition.isInterfaceType)(iface)) {
                let implementations = this._implementationsMap[iface.name];
                if (implementations === void 0) {
                  implementations = this._implementationsMap[iface.name] = {
                    objects: [],
                    interfaces: []
                  };
                }
                implementations.objects.push(namedType);
              }
            }
          }
        }
      }
      /**
       * Returns the value used by `Object.prototype.toString`.
       * @returns The built-in string tag for this object.
       */
      get [Symbol.toStringTag]() {
        return "GraphQLSchema";
      }
      /**
       * Returns the root object type for query operations.
       * @returns The query root type, if this schema defines one.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     greeting: String
       *   }
       * `);
       *
       * schema.getQueryType()?.name; // => 'Query'
       * ```
       */
      getQueryType() {
        return this._queryType;
      }
      /**
       * Returns the root object type for mutation operations.
       * @returns The mutation root type, if this schema defines one.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     greeting: String
       *   }
       *
       *   type Mutation {
       *     setGreeting(value: String!): String
       *   }
       * `);
       *
       * schema.getMutationType()?.name; // => 'Mutation'
       * ```
       */
      getMutationType() {
        return this._mutationType;
      }
      /**
       * Returns the root object type for subscription operations.
       * @returns The subscription root type, if this schema defines one.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     greeting: String
       *   }
       *
       *   type Subscription {
       *     greetings: String
       *   }
       * `);
       *
       * schema.getSubscriptionType()?.name; // => 'Subscription'
       * ```
       */
      getSubscriptionType() {
        return this._subscriptionType;
      }
      /**
       * Returns the root object type for the requested operation kind.
       * @param operation - Operation kind to resolve.
       * @returns The root object type for the operation kind, if this schema defines one.
       * @example
       * ```ts
       * import { OperationTypeNode } from 'graphql/language';
       * import { buildSchema } from 'graphql/utilities';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     greeting: String
       *   }
       *
       *   type Mutation {
       *     setGreeting(value: String!): String
       *   }
       * `);
       *
       * schema.getRootType(OperationTypeNode.QUERY)?.name; // => 'Query'
       * schema.getRootType(OperationTypeNode.MUTATION)?.name; // => 'Mutation'
       * schema.getRootType(OperationTypeNode.SUBSCRIPTION); // => undefined
       * ```
       */
      getRootType(operation) {
        switch (operation) {
          case _ast.OperationTypeNode.QUERY:
            return this.getQueryType();
          case _ast.OperationTypeNode.MUTATION:
            return this.getMutationType();
          case _ast.OperationTypeNode.SUBSCRIPTION:
            return this.getSubscriptionType();
        }
      }
      /**
       * Returns all named types known to this schema.
       * @returns A map of schema types keyed by type name.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       *
       * const schema = buildSchema(`
       *   type User {
       *     name: String
       *   }
       *
       *   type Query {
       *     viewer: User
       *   }
       * `);
       *
       * const typeMap = schema.getTypeMap();
       *
       * typeMap.User.name; // => 'User'
       * typeMap.Query.name; // => 'Query'
       * typeMap.String.name; // => 'String'
       * ```
       */
      getTypeMap() {
        return this._typeMap;
      }
      /**
       * Returns the named type with the provided name.
       * @param name - The GraphQL name to look up.
       * @returns The named schema type, if one exists.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       *
       * const schema = buildSchema(`
       *   type User {
       *     name: String
       *   }
       *
       *   type Query {
       *     viewer: User
       *   }
       * `);
       *
       * schema.getType('User')?.toString(); // => 'User'
       * schema.getType('Missing'); // => undefined
       * ```
       */
      getType(name2) {
        return this.getTypeMap()[name2];
      }
      /**
       * Returns object types that may be returned for an abstract type.
       * @param abstractType - Interface or union type to inspect.
       * @returns Object types that may satisfy the abstract type.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       * import { assertInterfaceType, assertUnionType } from 'graphql/type';
       *
       * const schema = buildSchema(`
       *   interface Node {
       *     id: ID!
       *   }
       *
       *   type User implements Node {
       *     id: ID!
       *   }
       *
       *   type Organization implements Node {
       *     id: ID!
       *   }
       *
       *   union SearchResult = User | Organization
       *
       *   type Query {
       *     node: Node
       *     search: [SearchResult]
       *   }
       * `);
       *
       * const Node = assertInterfaceType(schema.getType('Node'));
       * const SearchResult = assertUnionType(schema.getType('SearchResult'));
       *
       * schema.getPossibleTypes(Node).map((type) => type.name); // => ['User', 'Organization']
       * schema.getPossibleTypes(SearchResult).map((type) => type.name); // => ['User', 'Organization']
       * ```
       */
      getPossibleTypes(abstractType) {
        return (0, _definition.isUnionType)(abstractType) ? abstractType.getTypes() : this.getImplementations(abstractType).objects;
      }
      /**
       * Returns objects and interfaces that implement an interface type.
       * @param interfaceType - Interface type to inspect.
       * @returns Object and interface implementations of the interface.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       * import { assertInterfaceType } from 'graphql/type';
       *
       * const schema = buildSchema(`
       *   interface Resource {
       *     url: String!
       *   }
       *
       *   interface Image implements Resource {
       *     url: String!
       *     width: Int
       *   }
       *
       *   type Photo implements Resource & Image {
       *     url: String!
       *     width: Int
       *   }
       *
       *   type Query {
       *     resource: Resource
       *   }
       * `);
       *
       * const Resource = assertInterfaceType(schema.getType('Resource'));
       * const implementations = schema.getImplementations(Resource);
       *
       * implementations.interfaces.map((type) => type.name); // => ['Image']
       * implementations.objects.map((type) => type.name); // => ['Photo']
       * ```
       */
      getImplementations(interfaceType) {
        const implementations = this._implementationsMap[interfaceType.name];
        return implementations !== null && implementations !== void 0 ? implementations : {
          objects: [],
          interfaces: []
        };
      }
      /**
       * Returns whether one type is a possible runtime subtype of an abstract type.
       * @param abstractType - Interface or union type to inspect.
       * @param maybeSubType - Object or interface type to test as a possible subtype.
       * @returns True when the subtype may satisfy the abstract type.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       * import { assertInterfaceType, assertObjectType } from 'graphql/type';
       *
       * const schema = buildSchema(`
       *   interface Node {
       *     id: ID!
       *   }
       *
       *   type User implements Node {
       *     id: ID!
       *   }
       *
       *   type Review {
       *     body: String
       *   }
       *
       *   type Query {
       *     node: Node
       *     review: Review
       *   }
       * `);
       *
       * const Node = assertInterfaceType(schema.getType('Node'));
       * const User = assertObjectType(schema.getType('User'));
       * const Review = assertObjectType(schema.getType('Review'));
       *
       * schema.isSubType(Node, User); // => true
       * schema.isSubType(Node, Review); // => false
       * ```
       */
      isSubType(abstractType, maybeSubType) {
        let map = this._subTypeMap[abstractType.name];
        if (map === void 0) {
          map = /* @__PURE__ */ Object.create(null);
          if ((0, _definition.isUnionType)(abstractType)) {
            for (const type of abstractType.getTypes()) {
              map[type.name] = true;
            }
          } else {
            const implementations = this.getImplementations(abstractType);
            for (const type of implementations.objects) {
              map[type.name] = true;
            }
            for (const type of implementations.interfaces) {
              map[type.name] = true;
            }
          }
          this._subTypeMap[abstractType.name] = map;
        }
        return map[maybeSubType.name] !== void 0;
      }
      /**
       * Returns directives available in this schema.
       * @returns Directives available in this schema.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       *
       * const schema = buildSchema(`
       *   directive @upper on FIELD_DEFINITION
       *
       *   type Query {
       *     greeting: String @upper
       *   }
       * `);
       *
       * schema.getDirectives().map((directive) => directive.name); // => ['upper', 'include', 'skip', 'deprecated', 'specifiedBy', 'oneOf']
       * ```
       */
      getDirectives() {
        return this._directives;
      }
      /**
       * Returns the current directive definition.
       * @param name - The GraphQL name to look up.
       * @returns The current directive definition, if known.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       *
       * const schema = buildSchema(`
       *   directive @upper on FIELD_DEFINITION
       *
       *   type Query {
       *     greeting: String @upper
       *   }
       * `);
       *
       * schema.getDirective('upper')?.name; // => 'upper'
       * schema.getDirective('missing'); // => undefined
       * ```
       */
      getDirective(name2) {
        return this.getDirectives().find((directive) => directive.name === name2);
      }
      /**
       * Returns a normalized configuration object for this object.
       *
       * The returned config preserves the original `assumeValid` flag so the schema
       * can be recreated with the same validation behavior.
       * @returns A configuration object that can be used to recreate this object.
       * @example
       * ```ts
       * import { buildSchema } from 'graphql/utilities';
       * import { GraphQLSchema } from 'graphql/type';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     greeting: String
       *   }
       * `);
       *
       * const config = schema.toConfig();
       * const schemaCopy = new GraphQLSchema(config);
       *
       * config.query?.name; // => 'Query'
       * schemaCopy.getQueryType()?.name; // => 'Query'
       * ```
       */
      toConfig() {
        return {
          description: this.description,
          query: this.getQueryType(),
          mutation: this.getMutationType(),
          subscription: this.getSubscriptionType(),
          types: Object.values(this.getTypeMap()),
          directives: this.getDirectives(),
          extensions: this.extensions,
          astNode: this.astNode,
          extensionASTNodes: this.extensionASTNodes,
          assumeValid: this.__validationErrors !== void 0
        };
      }
    };
    exports.GraphQLSchema = GraphQLSchema;
    function collectReferencedTypes(type, typeSet) {
      const namedType = (0, _definition.getNamedType)(type);
      if (!typeSet.has(namedType)) {
        typeSet.add(namedType);
        if ((0, _definition.isUnionType)(namedType)) {
          for (const memberType of namedType.getTypes()) {
            collectReferencedTypes(memberType, typeSet);
          }
        } else if ((0, _definition.isObjectType)(namedType) || (0, _definition.isInterfaceType)(namedType)) {
          for (const interfaceType of namedType.getInterfaces()) {
            collectReferencedTypes(interfaceType, typeSet);
          }
          for (const field of Object.values(namedType.getFields())) {
            collectReferencedTypes(field.type, typeSet);
            for (const arg of field.args) {
              collectReferencedTypes(arg.type, typeSet);
            }
          }
        } else if ((0, _definition.isInputObjectType)(namedType)) {
          for (const field of Object.values(namedType.getFields())) {
            collectReferencedTypes(field.type, typeSet);
          }
        }
      }
      return typeSet;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/type/validate.js
var require_validate = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/type/validate.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.assertValidSchema = assertValidSchema;
    exports.validateSchema = validateSchema;
    var _inspect = require_inspect();
    var _GraphQLError = require_GraphQLError();
    var _ast = require_ast();
    var _typeComparators = require_typeComparators();
    var _definition = require_definition();
    var _directives = require_directives();
    var _introspection = require_introspection();
    var _schema = require_schema();
    function validateSchema(schema) {
      (0, _schema.assertSchema)(schema);
      if (schema.__validationErrors) {
        return schema.__validationErrors;
      }
      const context = new SchemaValidationContext(schema);
      validateRootTypes(context);
      validateDirectives(context);
      validateTypes(context);
      const errors = context.getErrors();
      schema.__validationErrors = errors;
      return errors;
    }
    function assertValidSchema(schema) {
      const errors = validateSchema(schema);
      if (errors.length !== 0) {
        throw new Error(errors.map((error) => error.message).join("\n\n"));
      }
    }
    var SchemaValidationContext = class {
      constructor(schema) {
        this._errors = [];
        this.schema = schema;
      }
      reportError(message, nodes) {
        const _nodes = Array.isArray(nodes) ? nodes.filter(Boolean) : nodes;
        this._errors.push(
          new _GraphQLError.GraphQLError(message, {
            nodes: _nodes
          })
        );
      }
      getErrors() {
        return this._errors;
      }
    };
    function validateRootTypes(context) {
      const schema = context.schema;
      const queryType = schema.getQueryType();
      if (!queryType) {
        context.reportError("Query root type must be provided.", schema.astNode);
      } else if (!(0, _definition.isObjectType)(queryType)) {
        var _getOperationTypeNode;
        context.reportError(
          `Query root type must be Object type, it cannot be ${(0, _inspect.inspect)(queryType)}.`,
          (_getOperationTypeNode = getOperationTypeNode(
            schema,
            _ast.OperationTypeNode.QUERY
          )) !== null && _getOperationTypeNode !== void 0 ? _getOperationTypeNode : queryType.astNode
        );
      }
      const mutationType = schema.getMutationType();
      if (mutationType && !(0, _definition.isObjectType)(mutationType)) {
        var _getOperationTypeNode2;
        context.reportError(
          `Mutation root type must be Object type if provided, it cannot be ${(0, _inspect.inspect)(mutationType)}.`,
          (_getOperationTypeNode2 = getOperationTypeNode(
            schema,
            _ast.OperationTypeNode.MUTATION
          )) !== null && _getOperationTypeNode2 !== void 0 ? _getOperationTypeNode2 : mutationType.astNode
        );
      }
      const subscriptionType = schema.getSubscriptionType();
      if (subscriptionType && !(0, _definition.isObjectType)(subscriptionType)) {
        var _getOperationTypeNode3;
        context.reportError(
          `Subscription root type must be Object type if provided, it cannot be ${(0, _inspect.inspect)(subscriptionType)}.`,
          (_getOperationTypeNode3 = getOperationTypeNode(
            schema,
            _ast.OperationTypeNode.SUBSCRIPTION
          )) !== null && _getOperationTypeNode3 !== void 0 ? _getOperationTypeNode3 : subscriptionType.astNode
        );
      }
    }
    function getOperationTypeNode(schema, operation) {
      var _flatMap$find;
      return (_flatMap$find = [schema.astNode, ...schema.extensionASTNodes].flatMap(
        // FIXME: https://github.com/graphql/graphql-js/issues/2203
        (schemaNode) => {
          var _schemaNode$operation;
          return (
            /* c8 ignore next */
            (_schemaNode$operation = schemaNode === null || schemaNode === void 0 ? void 0 : schemaNode.operationTypes) !== null && _schemaNode$operation !== void 0 ? _schemaNode$operation : []
          );
        }
      ).find((operationNode) => operationNode.operation === operation)) === null || _flatMap$find === void 0 ? void 0 : _flatMap$find.type;
    }
    function validateDirectives(context) {
      for (const directive of context.schema.getDirectives()) {
        if (!(0, _directives.isDirective)(directive)) {
          context.reportError(
            `Expected directive but got: ${(0, _inspect.inspect)(directive)}.`,
            directive === null || directive === void 0 ? void 0 : directive.astNode
          );
          continue;
        }
        validateName(context, directive);
        if (directive.locations.length === 0) {
          context.reportError(
            `Directive @${directive.name} must include 1 or more locations.`,
            directive.astNode
          );
        }
        for (const arg of directive.args) {
          validateName(context, arg);
          if (!(0, _definition.isInputType)(arg.type)) {
            context.reportError(
              `The type of @${directive.name}(${arg.name}:) must be Input Type but got: ${(0, _inspect.inspect)(arg.type)}.`,
              arg.astNode
            );
          }
          if ((0, _definition.isRequiredArgument)(arg) && arg.deprecationReason != null) {
            var _arg$astNode;
            context.reportError(
              `Required argument @${directive.name}(${arg.name}:) cannot be deprecated.`,
              [
                getDeprecatedDirectiveNode(arg.astNode),
                (_arg$astNode = arg.astNode) === null || _arg$astNode === void 0 ? void 0 : _arg$astNode.type
              ]
            );
          }
        }
      }
    }
    function validateName(context, node2) {
      if (node2.name.startsWith("__")) {
        context.reportError(
          `Name "${node2.name}" must not begin with "__", which is reserved by GraphQL introspection.`,
          node2.astNode
        );
      }
    }
    function validateTypes(context) {
      const validateInputObjectCircularRefs = createInputObjectCircularRefsValidator(context);
      const typeMap = context.schema.getTypeMap();
      for (const type of Object.values(typeMap)) {
        if (!(0, _definition.isNamedType)(type)) {
          context.reportError(
            `Expected GraphQL named type but got: ${(0, _inspect.inspect)(type)}.`,
            type.astNode
          );
          continue;
        }
        if (!(0, _introspection.isIntrospectionType)(type)) {
          validateName(context, type);
        }
        if ((0, _definition.isObjectType)(type)) {
          validateFields(context, type);
          validateInterfaces(context, type);
        } else if ((0, _definition.isInterfaceType)(type)) {
          validateFields(context, type);
          validateInterfaces(context, type);
        } else if ((0, _definition.isUnionType)(type)) {
          validateUnionMembers(context, type);
        } else if ((0, _definition.isEnumType)(type)) {
          validateEnumValues(context, type);
        } else if ((0, _definition.isInputObjectType)(type)) {
          validateInputFields(context, type);
          validateInputObjectCircularRefs(type);
        }
      }
    }
    function validateFields(context, type) {
      const fields = Object.values(type.getFields());
      if (fields.length === 0) {
        context.reportError(`Type ${type.name} must define one or more fields.`, [
          type.astNode,
          ...type.extensionASTNodes
        ]);
      }
      for (const field of fields) {
        validateName(context, field);
        if (!(0, _definition.isOutputType)(field.type)) {
          var _field$astNode;
          context.reportError(
            `The type of ${type.name}.${field.name} must be Output Type but got: ${(0, _inspect.inspect)(field.type)}.`,
            (_field$astNode = field.astNode) === null || _field$astNode === void 0 ? void 0 : _field$astNode.type
          );
        }
        for (const arg of field.args) {
          const argName = arg.name;
          validateName(context, arg);
          if (!(0, _definition.isInputType)(arg.type)) {
            var _arg$astNode2;
            context.reportError(
              `The type of ${type.name}.${field.name}(${argName}:) must be Input Type but got: ${(0, _inspect.inspect)(arg.type)}.`,
              (_arg$astNode2 = arg.astNode) === null || _arg$astNode2 === void 0 ? void 0 : _arg$astNode2.type
            );
          }
          if ((0, _definition.isRequiredArgument)(arg) && arg.deprecationReason != null) {
            var _arg$astNode3;
            context.reportError(
              `Required argument ${type.name}.${field.name}(${argName}:) cannot be deprecated.`,
              [
                getDeprecatedDirectiveNode(arg.astNode),
                (_arg$astNode3 = arg.astNode) === null || _arg$astNode3 === void 0 ? void 0 : _arg$astNode3.type
              ]
            );
          }
        }
      }
    }
    function validateInterfaces(context, type) {
      const ifaceTypeNames = /* @__PURE__ */ Object.create(null);
      for (const iface of type.getInterfaces()) {
        if (!(0, _definition.isInterfaceType)(iface)) {
          context.reportError(
            `Type ${(0, _inspect.inspect)(
              type
            )} must only implement Interface types, it cannot implement ${(0, _inspect.inspect)(iface)}.`,
            getAllImplementsInterfaceNodes(type, iface)
          );
          continue;
        }
        if (type === iface) {
          context.reportError(
            `Type ${type.name} cannot implement itself because it would create a circular reference.`,
            getAllImplementsInterfaceNodes(type, iface)
          );
          continue;
        }
        if (ifaceTypeNames[iface.name]) {
          context.reportError(
            `Type ${type.name} can only implement ${iface.name} once.`,
            getAllImplementsInterfaceNodes(type, iface)
          );
          continue;
        }
        ifaceTypeNames[iface.name] = true;
        validateTypeImplementsAncestors(context, type, iface);
        validateTypeImplementsInterface(context, type, iface);
      }
    }
    function validateTypeImplementsInterface(context, type, iface) {
      const typeFieldMap = type.getFields();
      for (const ifaceField of Object.values(iface.getFields())) {
        const fieldName = ifaceField.name;
        const typeField = typeFieldMap[fieldName];
        if (!typeField) {
          context.reportError(
            `Interface field ${iface.name}.${fieldName} expected but ${type.name} does not provide it.`,
            [ifaceField.astNode, type.astNode, ...type.extensionASTNodes]
          );
          continue;
        }
        if (!(0, _typeComparators.isTypeSubTypeOf)(
          context.schema,
          typeField.type,
          ifaceField.type
        )) {
          var _ifaceField$astNode, _typeField$astNode;
          context.reportError(
            `Interface field ${iface.name}.${fieldName} expects type ${(0, _inspect.inspect)(ifaceField.type)} but ${type.name}.${fieldName} is type ${(0, _inspect.inspect)(typeField.type)}.`,
            [
              (_ifaceField$astNode = ifaceField.astNode) === null || _ifaceField$astNode === void 0 ? void 0 : _ifaceField$astNode.type,
              (_typeField$astNode = typeField.astNode) === null || _typeField$astNode === void 0 ? void 0 : _typeField$astNode.type
            ]
          );
        }
        for (const ifaceArg of ifaceField.args) {
          const argName = ifaceArg.name;
          const typeArg = typeField.args.find((arg) => arg.name === argName);
          if (!typeArg) {
            context.reportError(
              `Interface field argument ${iface.name}.${fieldName}(${argName}:) expected but ${type.name}.${fieldName} does not provide it.`,
              [ifaceArg.astNode, typeField.astNode]
            );
            continue;
          }
          if (!(0, _typeComparators.isEqualType)(ifaceArg.type, typeArg.type)) {
            var _ifaceArg$astNode, _typeArg$astNode;
            context.reportError(
              `Interface field argument ${iface.name}.${fieldName}(${argName}:) expects type ${(0, _inspect.inspect)(ifaceArg.type)} but ${type.name}.${fieldName}(${argName}:) is type ${(0, _inspect.inspect)(typeArg.type)}.`,
              [
                (_ifaceArg$astNode = ifaceArg.astNode) === null || _ifaceArg$astNode === void 0 ? void 0 : _ifaceArg$astNode.type,
                (_typeArg$astNode = typeArg.astNode) === null || _typeArg$astNode === void 0 ? void 0 : _typeArg$astNode.type
              ]
            );
          }
        }
        for (const typeArg of typeField.args) {
          const argName = typeArg.name;
          const ifaceArg = ifaceField.args.find((arg) => arg.name === argName);
          if (!ifaceArg && (0, _definition.isRequiredArgument)(typeArg)) {
            context.reportError(
              `Object field ${type.name}.${fieldName} includes required argument ${argName} that is missing from the Interface field ${iface.name}.${fieldName}.`,
              [typeArg.astNode, ifaceField.astNode]
            );
          }
        }
      }
    }
    function validateTypeImplementsAncestors(context, type, iface) {
      const ifaceInterfaces = type.getInterfaces();
      for (const transitive of iface.getInterfaces()) {
        if (!ifaceInterfaces.includes(transitive)) {
          context.reportError(
            transitive === type ? `Type ${type.name} cannot implement ${iface.name} because it would create a circular reference.` : `Type ${type.name} must implement ${transitive.name} because it is implemented by ${iface.name}.`,
            [
              ...getAllImplementsInterfaceNodes(iface, transitive),
              ...getAllImplementsInterfaceNodes(type, iface)
            ]
          );
        }
      }
    }
    function validateUnionMembers(context, union) {
      const memberTypes = union.getTypes();
      if (memberTypes.length === 0) {
        context.reportError(
          `Union type ${union.name} must define one or more member types.`,
          [union.astNode, ...union.extensionASTNodes]
        );
      }
      const includedTypeNames = /* @__PURE__ */ Object.create(null);
      for (const memberType of memberTypes) {
        if (includedTypeNames[memberType.name]) {
          context.reportError(
            `Union type ${union.name} can only include type ${memberType.name} once.`,
            getUnionMemberTypeNodes(union, memberType.name)
          );
          continue;
        }
        includedTypeNames[memberType.name] = true;
        if (!(0, _definition.isObjectType)(memberType)) {
          context.reportError(
            `Union type ${union.name} can only include Object types, it cannot include ${(0, _inspect.inspect)(memberType)}.`,
            getUnionMemberTypeNodes(union, String(memberType))
          );
        }
      }
    }
    function validateEnumValues(context, enumType) {
      const enumValues = enumType.getValues();
      if (enumValues.length === 0) {
        context.reportError(
          `Enum type ${enumType.name} must define one or more values.`,
          [enumType.astNode, ...enumType.extensionASTNodes]
        );
      }
      for (const enumValue of enumValues) {
        validateName(context, enumValue);
      }
    }
    function validateInputFields(context, inputObj) {
      const fields = Object.values(inputObj.getFields());
      if (fields.length === 0) {
        context.reportError(
          `Input Object type ${inputObj.name} must define one or more fields.`,
          [inputObj.astNode, ...inputObj.extensionASTNodes]
        );
      }
      for (const field of fields) {
        validateName(context, field);
        if (!(0, _definition.isInputType)(field.type)) {
          var _field$astNode2;
          context.reportError(
            `The type of ${inputObj.name}.${field.name} must be Input Type but got: ${(0, _inspect.inspect)(field.type)}.`,
            (_field$astNode2 = field.astNode) === null || _field$astNode2 === void 0 ? void 0 : _field$astNode2.type
          );
        }
        if ((0, _definition.isRequiredInputField)(field) && field.deprecationReason != null) {
          var _field$astNode3;
          context.reportError(
            `Required input field ${inputObj.name}.${field.name} cannot be deprecated.`,
            [
              getDeprecatedDirectiveNode(field.astNode),
              (_field$astNode3 = field.astNode) === null || _field$astNode3 === void 0 ? void 0 : _field$astNode3.type
            ]
          );
        }
        if (inputObj.isOneOf) {
          validateOneOfInputObjectField(inputObj, field, context);
        }
      }
    }
    function validateOneOfInputObjectField(type, field, context) {
      if ((0, _definition.isNonNullType)(field.type)) {
        var _field$astNode4;
        context.reportError(
          `OneOf input field ${type.name}.${field.name} must be nullable.`,
          (_field$astNode4 = field.astNode) === null || _field$astNode4 === void 0 ? void 0 : _field$astNode4.type
        );
      }
      if (field.defaultValue !== void 0) {
        context.reportError(
          `OneOf input field ${type.name}.${field.name} cannot have a default value.`,
          field.astNode
        );
      }
    }
    function createInputObjectCircularRefsValidator(context) {
      const visitedTypes = /* @__PURE__ */ Object.create(null);
      const fieldPath = [];
      const fieldPathIndexByTypeName = /* @__PURE__ */ Object.create(null);
      return detectCycleRecursive;
      function detectCycleRecursive(inputObj) {
        if (visitedTypes[inputObj.name]) {
          return;
        }
        visitedTypes[inputObj.name] = true;
        fieldPathIndexByTypeName[inputObj.name] = fieldPath.length;
        const fields = Object.values(inputObj.getFields());
        for (const field of fields) {
          if ((0, _definition.isNonNullType)(field.type) && (0, _definition.isInputObjectType)(field.type.ofType)) {
            const fieldType = field.type.ofType;
            const cycleIndex = fieldPathIndexByTypeName[fieldType.name];
            fieldPath.push(field);
            if (cycleIndex === void 0) {
              detectCycleRecursive(fieldType);
            } else {
              const cyclePath = fieldPath.slice(cycleIndex);
              const pathStr = cyclePath.map((fieldObj) => fieldObj.name).join(".");
              context.reportError(
                `Cannot reference Input Object "${fieldType.name}" within itself through a series of non-null fields: "${pathStr}".`,
                cyclePath.map((fieldObj) => fieldObj.astNode)
              );
            }
            fieldPath.pop();
          }
        }
        fieldPathIndexByTypeName[inputObj.name] = void 0;
      }
    }
    function getAllImplementsInterfaceNodes(type, iface) {
      const { astNode, extensionASTNodes } = type;
      const nodes = astNode != null ? [astNode, ...extensionASTNodes] : extensionASTNodes;
      return nodes.flatMap((typeNode) => {
        var _typeNode$interfaces;
        return (
          /* c8 ignore next */
          (_typeNode$interfaces = typeNode.interfaces) !== null && _typeNode$interfaces !== void 0 ? _typeNode$interfaces : []
        );
      }).filter((ifaceNode) => ifaceNode.name.value === iface.name);
    }
    function getUnionMemberTypeNodes(union, typeName) {
      const { astNode, extensionASTNodes } = union;
      const nodes = astNode != null ? [astNode, ...extensionASTNodes] : extensionASTNodes;
      return nodes.flatMap((unionNode) => {
        var _unionNode$types;
        return (
          /* c8 ignore next */
          (_unionNode$types = unionNode.types) !== null && _unionNode$types !== void 0 ? _unionNode$types : []
        );
      }).filter((typeNode) => typeNode.name.value === typeName);
    }
    function getDeprecatedDirectiveNode(definitionNode) {
      var _definitionNode$direc;
      return definitionNode === null || definitionNode === void 0 ? void 0 : (_definitionNode$direc = definitionNode.directives) === null || _definitionNode$direc === void 0 ? void 0 : _definitionNode$direc.find(
        (node2) => node2.name.value === _directives.GraphQLDeprecatedDirective.name
      );
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/visitor.js
var require_visitor = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/visitor.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.BREAK = void 0;
    exports.getEnterLeaveForKind = getEnterLeaveForKind;
    exports.getVisitFn = getVisitFn;
    exports.visit = visit2;
    exports.visitInParallel = visitInParallel;
    var _devAssert = require_devAssert();
    var _inspect = require_inspect();
    var _ast = require_ast();
    var _kinds = require_kinds();
    var BREAK = Object.freeze({});
    exports.BREAK = BREAK;
    function visit2(root, visitor, visitorKeys = _ast.QueryDocumentKeys) {
      const enterLeaveMap = /* @__PURE__ */ new Map();
      for (const kind of Object.values(_kinds.Kind)) {
        enterLeaveMap.set(kind, getEnterLeaveForKind(visitor, kind));
      }
      let stack = void 0;
      let inArray = Array.isArray(root);
      let keys = [root];
      let index = -1;
      let edits = [];
      let node2 = root;
      let key = void 0;
      let parent = void 0;
      const path = [];
      const ancestors = [];
      do {
        index++;
        const isLeaving = index === keys.length;
        const isEdited = isLeaving && edits.length !== 0;
        if (isLeaving) {
          key = ancestors.length === 0 ? void 0 : path[path.length - 1];
          node2 = parent;
          parent = ancestors.pop();
          if (isEdited) {
            if (inArray) {
              node2 = node2.slice();
              let editOffset = 0;
              for (const [editKey, editValue] of edits) {
                const arrayKey = editKey - editOffset;
                if (editValue === null) {
                  node2.splice(arrayKey, 1);
                  editOffset++;
                } else {
                  node2[arrayKey] = editValue;
                }
              }
            } else {
              node2 = { ...node2 };
              for (const [editKey, editValue] of edits) {
                node2[editKey] = editValue;
              }
            }
          }
          index = stack.index;
          keys = stack.keys;
          edits = stack.edits;
          inArray = stack.inArray;
          stack = stack.prev;
        } else if (parent) {
          key = inArray ? index : keys[index];
          node2 = parent[key];
          if (node2 === null || node2 === void 0) {
            continue;
          }
          path.push(key);
        }
        let result;
        if (!Array.isArray(node2)) {
          var _enterLeaveMap$get, _enterLeaveMap$get2;
          (0, _ast.isNode)(node2) || (0, _devAssert.devAssert)(
            false,
            `Invalid AST Node: ${(0, _inspect.inspect)(node2)}.`
          );
          const visitFn = isLeaving ? (_enterLeaveMap$get = enterLeaveMap.get(node2.kind)) === null || _enterLeaveMap$get === void 0 ? void 0 : _enterLeaveMap$get.leave : (_enterLeaveMap$get2 = enterLeaveMap.get(node2.kind)) === null || _enterLeaveMap$get2 === void 0 ? void 0 : _enterLeaveMap$get2.enter;
          result = visitFn === null || visitFn === void 0 ? void 0 : visitFn.call(visitor, node2, key, parent, path, ancestors);
          if (result === BREAK) {
            break;
          }
          if (result === false) {
            if (!isLeaving) {
              path.pop();
              continue;
            }
          } else if (result !== void 0) {
            edits.push([key, result]);
            if (!isLeaving) {
              if ((0, _ast.isNode)(result)) {
                node2 = result;
              } else {
                path.pop();
                continue;
              }
            }
          }
        }
        if (result === void 0 && isEdited) {
          edits.push([key, node2]);
        }
        if (isLeaving) {
          path.pop();
        } else {
          var _node$kind;
          stack = {
            inArray,
            index,
            keys,
            edits,
            prev: stack
          };
          inArray = Array.isArray(node2);
          keys = inArray ? node2 : (_node$kind = visitorKeys[node2.kind]) !== null && _node$kind !== void 0 ? _node$kind : [];
          index = -1;
          edits = [];
          if (parent) {
            ancestors.push(parent);
          }
          parent = node2;
        }
      } while (stack !== void 0);
      if (edits.length !== 0) {
        return edits[edits.length - 1][1];
      }
      return root;
    }
    function visitInParallel(visitors) {
      const skipping = new Array(visitors.length).fill(null);
      const mergedVisitor = /* @__PURE__ */ Object.create(null);
      for (const kind of Object.values(_kinds.Kind)) {
        let hasVisitor = false;
        const enterList = new Array(visitors.length).fill(void 0);
        const leaveList = new Array(visitors.length).fill(void 0);
        for (let i = 0; i < visitors.length; ++i) {
          const { enter, leave } = getEnterLeaveForKind(visitors[i], kind);
          hasVisitor || (hasVisitor = enter != null || leave != null);
          enterList[i] = enter;
          leaveList[i] = leave;
        }
        if (!hasVisitor) {
          continue;
        }
        const mergedEnterLeave = {
          enter(...args) {
            const node2 = args[0];
            for (let i = 0; i < visitors.length; i++) {
              if (skipping[i] === null) {
                var _enterList$i;
                const result = (_enterList$i = enterList[i]) === null || _enterList$i === void 0 ? void 0 : _enterList$i.apply(visitors[i], args);
                if (result === false) {
                  skipping[i] = node2;
                } else if (result === BREAK) {
                  skipping[i] = BREAK;
                } else if (result !== void 0) {
                  return result;
                }
              }
            }
          },
          leave(...args) {
            const node2 = args[0];
            for (let i = 0; i < visitors.length; i++) {
              if (skipping[i] === null) {
                var _leaveList$i;
                const result = (_leaveList$i = leaveList[i]) === null || _leaveList$i === void 0 ? void 0 : _leaveList$i.apply(visitors[i], args);
                if (result === BREAK) {
                  skipping[i] = BREAK;
                } else if (result !== void 0 && result !== false) {
                  return result;
                }
              } else if (skipping[i] === node2) {
                skipping[i] = null;
              }
            }
          }
        };
        mergedVisitor[kind] = mergedEnterLeave;
      }
      return mergedVisitor;
    }
    function getEnterLeaveForKind(visitor, kind) {
      const kindVisitor = visitor[kind];
      if (typeof kindVisitor === "object") {
        return kindVisitor;
      } else if (typeof kindVisitor === "function") {
        return {
          enter: kindVisitor,
          leave: void 0
        };
      }
      return {
        enter: visitor.enter,
        leave: visitor.leave
      };
    }
    function getVisitFn(visitor, kind, isLeaving) {
      const { enter, leave } = getEnterLeaveForKind(visitor, kind);
      return isLeaving ? leave : enter;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/typeFromAST.js
var require_typeFromAST = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/typeFromAST.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.typeFromAST = typeFromAST;
    var _kinds = require_kinds();
    var _definition = require_definition();
    function typeFromAST(schema, typeNode) {
      switch (typeNode.kind) {
        case _kinds.Kind.LIST_TYPE: {
          const innerType = typeFromAST(schema, typeNode.type);
          return innerType && new _definition.GraphQLList(innerType);
        }
        case _kinds.Kind.NON_NULL_TYPE: {
          const innerType = typeFromAST(schema, typeNode.type);
          return innerType && new _definition.GraphQLNonNull(innerType);
        }
        case _kinds.Kind.NAMED_TYPE:
          return schema.getType(typeNode.name.value);
      }
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/TypeInfo.js
var require_TypeInfo = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/TypeInfo.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.TypeInfo = void 0;
    exports.visitWithTypeInfo = visitWithTypeInfo2;
    var _ast = require_ast();
    var _kinds = require_kinds();
    var _visitor = require_visitor();
    var _definition = require_definition();
    var _introspection = require_introspection();
    var _typeFromAST = require_typeFromAST();
    var TypeInfo2 = class {
      /**
       * Creates a TypeInfo instance.
       * @param schema - Schema used for type lookups.
       * @param initialType - Optional type to use at the start of traversal.
       * @param getFieldDefFn - Optional field definition lookup override.
       * @example
       * ```ts
       * // Track field types during a visitWithTypeInfo traversal.
       * import { parse, visit } from 'graphql/language';
       * import { buildSchema } from 'graphql/utilities';
       * import { TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     greeting: String
       *   }
       * `);
       * const typeInfo = new TypeInfo(schema);
       * const seenTypes: Array<string> = [];
       *
       * visit(
       *   parse('{ greeting }'),
       *   visitWithTypeInfo(typeInfo, {
       *     Field: () => {
       *       seenTypes.push(String(typeInfo.getType()));
       *     },
       *   }),
       * );
       *
       * seenTypes; // => ['String']
       * ```
       * @example
       * ```ts
       * // This variant starts from an initial type and supplies a field definition resolver.
       * import { Kind } from 'graphql/language';
       * import { GraphQLString } from 'graphql/type';
       * import { buildSchema, TypeInfo } from 'graphql/utilities';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     greeting: String
       *   }
       * `);
       * const typeInfo = new TypeInfo(schema, schema.getQueryType(), () => ({
       *   name: 'virtualGreeting',
       *   description: undefined,
       *   type: GraphQLString,
       *   args: [],
       *   resolve: undefined,
       *   subscribe: undefined,
       *   deprecationReason: undefined,
       *   extensions: Object.create(null),
       *   astNode: undefined,
       * }));
       *
       * typeInfo.enter({
       *   kind: Kind.SELECTION_SET,
       *   selections: [],
       * });
       * typeInfo.enter({
       *   kind: Kind.FIELD,
       *   name: { kind: Kind.NAME, value: 'ignored' },
       * });
       *
       * typeInfo.getFieldDef()?.name; // => 'virtualGreeting'
       * String(typeInfo.getType()); // => 'String'
       * ```
       */
      constructor(schema, initialType, getFieldDefFn) {
        this._schema = schema;
        this._typeStack = [];
        this._parentTypeStack = [];
        this._inputTypeStack = [];
        this._fieldDefStack = [];
        this._defaultValueStack = [];
        this._directive = null;
        this._argument = null;
        this._enumValue = null;
        this._getFieldDef = getFieldDefFn !== null && getFieldDefFn !== void 0 ? getFieldDefFn : getFieldDef;
        if (initialType) {
          if ((0, _definition.isInputType)(initialType)) {
            this._inputTypeStack.push(initialType);
          }
          if ((0, _definition.isCompositeType)(initialType)) {
            this._parentTypeStack.push(initialType);
          }
          if ((0, _definition.isOutputType)(initialType)) {
            this._typeStack.push(initialType);
          }
        }
      }
      /**
       * Returns the value used by `Object.prototype.toString`.
       * @returns The built-in string tag for this object.
       */
      get [Symbol.toStringTag]() {
        return "TypeInfo";
      }
      /**
       * Returns the current output type at this point in traversal.
       * @returns The current output type, if known.
       * @example
       * ```ts
       * import { parse, visit } from 'graphql/language';
       * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     viewer: User
       *   }
       *
       *   type User {
       *     name: String
       *   }
       * `);
       * const typeInfo = new TypeInfo(schema);
       * const fieldTypes: Record<string, string> = {};
       *
       * visit(
       *   parse('{ viewer { name } }'),
       *   visitWithTypeInfo(typeInfo, {
       *     Field: (node) => {
       *       fieldTypes[node.name.value] = String(typeInfo.getType());
       *     },
       *   }),
       * );
       *
       * fieldTypes; // => { viewer: 'User', name: 'String' }
       * ```
       */
      getType() {
        if (this._typeStack.length > 0) {
          return this._typeStack[this._typeStack.length - 1];
        }
      }
      /**
       * Returns the current parent composite type.
       * @returns The current parent composite type, if known.
       * @example
       * ```ts
       * import { parse, visit } from 'graphql/language';
       * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     viewer: User
       *   }
       *
       *   type User {
       *     name: String
       *   }
       * `);
       * const typeInfo = new TypeInfo(schema);
       * const parentTypes: Record<string, string> = {};
       *
       * visit(
       *   parse('{ viewer { name } }'),
       *   visitWithTypeInfo(typeInfo, {
       *     Field: (node) => {
       *       parentTypes[node.name.value] = String(typeInfo.getParentType());
       *     },
       *   }),
       * );
       *
       * parentTypes; // => { viewer: 'Query', name: 'User' }
       * ```
       */
      getParentType() {
        if (this._parentTypeStack.length > 0) {
          return this._parentTypeStack[this._parentTypeStack.length - 1];
        }
      }
      /**
       * Returns the current input type at this point in traversal.
       * @returns The current input type, if known.
       * @example
       * ```ts
       * import { parse, visit } from 'graphql/language';
       * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     reviews(stars: Int!, sort: Sort = NEWEST): [String]
       *   }
       *
       *   enum Sort {
       *     NEWEST
       *     OLDEST
       *   }
       * `);
       * const typeInfo = new TypeInfo(schema);
       * const inputTypes: Record<string, string> = {};
       *
       * visit(
       *   parse('{ reviews(stars: 5, sort: OLDEST) }'),
       *   visitWithTypeInfo(typeInfo, {
       *     Argument: (node) => {
       *       inputTypes[node.name.value] = String(typeInfo.getInputType());
       *     },
       *   }),
       * );
       *
       * inputTypes; // => { stars: 'Int!', sort: 'Sort' }
       * ```
       */
      getInputType() {
        if (this._inputTypeStack.length > 0) {
          return this._inputTypeStack[this._inputTypeStack.length - 1];
        }
      }
      /**
       * Returns the parent input type for the current input position.
       * @returns The parent input type, if known.
       * @example
       * ```ts
       * import { parse, visit } from 'graphql/language';
       * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
       *
       * const schema = buildSchema(`
       *   input ReviewFilter {
       *     stars: Int!
       *   }
       *
       *   type Query {
       *     reviews(filter: ReviewFilter): [String]
       *   }
       * `);
       * const typeInfo = new TypeInfo(schema);
       * const parentInputTypes: Record<string, string> = {};
       *
       * visit(
       *   parse('{ reviews(filter: { stars: 5 }) }'),
       *   visitWithTypeInfo(typeInfo, {
       *     ObjectField: (node) => {
       *       parentInputTypes[node.name.value] = String(typeInfo.getParentInputType());
       *     },
       *   }),
       * );
       *
       * parentInputTypes; // => { stars: 'ReviewFilter' }
       * ```
       */
      getParentInputType() {
        if (this._inputTypeStack.length > 1) {
          return this._inputTypeStack[this._inputTypeStack.length - 2];
        }
      }
      /**
       * Returns the current field definition.
       * @returns The current field definition, if known.
       * @example
       * ```ts
       * import { parse, visit } from 'graphql/language';
       * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     greeting: String
       *   }
       * `);
       * const typeInfo = new TypeInfo(schema);
       * let fieldName;
       *
       * visit(
       *   parse('{ greeting }'),
       *   visitWithTypeInfo(typeInfo, {
       *     Field: () => {
       *       fieldName = typeInfo.getFieldDef()?.name;
       *     },
       *   }),
       * );
       *
       * fieldName; // => 'greeting'
       * ```
       */
      getFieldDef() {
        if (this._fieldDefStack.length > 0) {
          return this._fieldDefStack[this._fieldDefStack.length - 1];
        }
      }
      /**
       * Returns the default value for the current input position.
       * @returns The current default value, if one is available.
       * @example
       * ```ts
       * import { parse, visit } from 'graphql/language';
       * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     reviews(limit: Int = 10): [String]
       *   }
       * `);
       * const typeInfo = new TypeInfo(schema);
       * let defaultLimit: unknown;
       *
       * visit(
       *   parse('{ reviews(limit: 5) }'),
       *   visitWithTypeInfo(typeInfo, {
       *     Argument: () => {
       *       defaultLimit = typeInfo.getDefaultValue();
       *     },
       *   }),
       * );
       *
       * defaultLimit; // => 10
       * ```
       */
      getDefaultValue() {
        if (this._defaultValueStack.length > 0) {
          return this._defaultValueStack[this._defaultValueStack.length - 1];
        }
      }
      /**
       * Returns the current directive definition.
       * @returns The current directive definition, if known.
       * @example
       * ```ts
       * import { parse, visit } from 'graphql/language';
       * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     greeting: String
       *   }
       * `);
       * const typeInfo = new TypeInfo(schema);
       * let directiveName;
       *
       * visit(
       *   parse('{ greeting @include(if: true) }'),
       *   visitWithTypeInfo(typeInfo, {
       *     Directive: () => {
       *       directiveName = typeInfo.getDirective()?.name;
       *     },
       *   }),
       * );
       *
       * directiveName; // => 'include'
       * ```
       */
      getDirective() {
        return this._directive;
      }
      /**
       * Returns the current argument definition.
       * @returns The current argument definition, if known.
       * @example
       * ```ts
       * import { parse, visit } from 'graphql/language';
       * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     reviews(limit: Int = 10): [String]
       *   }
       * `);
       * const typeInfo = new TypeInfo(schema);
       * let argumentName;
       *
       * visit(
       *   parse('{ reviews(limit: 5) }'),
       *   visitWithTypeInfo(typeInfo, {
       *     Argument: () => {
       *       argumentName = typeInfo.getArgument()?.name;
       *     },
       *   }),
       * );
       *
       * argumentName; // => 'limit'
       * ```
       */
      getArgument() {
        return this._argument;
      }
      /**
       * Returns the current enum value definition.
       * @returns The current enum value definition, if known.
       * @example
       * ```ts
       * import { parse, visit } from 'graphql/language';
       * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
       *
       * const schema = buildSchema(`
       *   enum Sort {
       *     NEWEST
       *     OLDEST
       *   }
       *
       *   type Query {
       *     reviews(sort: Sort = NEWEST): [String]
       *   }
       * `);
       * const typeInfo = new TypeInfo(schema);
       * let enumValueName;
       *
       * visit(
       *   parse('{ reviews(sort: OLDEST) }'),
       *   visitWithTypeInfo(typeInfo, {
       *     EnumValue: () => {
       *       enumValueName = typeInfo.getEnumValue()?.name;
       *     },
       *   }),
       * );
       *
       * enumValueName; // => 'OLDEST'
       * ```
       */
      getEnumValue() {
        return this._enumValue;
      }
      /**
       * Updates this TypeInfo instance for an entered AST node.
       * @param node - AST node being entered.
       * @returns Nothing.
       * @example
       * ```ts
       * import assert from 'node:assert/strict';
       * import { Kind, parse } from 'graphql/language';
       * import { buildSchema, TypeInfo } from 'graphql/utilities';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     greeting: String
       *   }
       * `);
       * const document = parse('{ greeting }');
       * const operation = document.definitions[0];
       * assert(operation.kind === Kind.OPERATION_DEFINITION);
       * const selectionSet = operation.selectionSet;
       * const field = selectionSet.selections[0];
       * const typeInfo = new TypeInfo(schema);
       *
       * typeInfo.enter(operation);
       * typeInfo.enter(selectionSet);
       * typeInfo.enter(field);
       *
       * field.kind; // => Kind.FIELD
       * typeInfo.getParentType()?.name; // => 'Query'
       * String(typeInfo.getType()); // => 'String'
       * ```
       */
      enter(node2) {
        const schema = this._schema;
        switch (node2.kind) {
          case _kinds.Kind.SELECTION_SET: {
            const namedType = (0, _definition.getNamedType)(this.getType());
            this._parentTypeStack.push(
              (0, _definition.isCompositeType)(namedType) ? namedType : void 0
            );
            break;
          }
          case _kinds.Kind.FIELD: {
            const parentType = this.getParentType();
            let fieldDef;
            let fieldType;
            if (parentType) {
              fieldDef = this._getFieldDef(schema, parentType, node2);
              if (fieldDef) {
                fieldType = fieldDef.type;
              }
            }
            this._fieldDefStack.push(fieldDef);
            this._typeStack.push(
              (0, _definition.isOutputType)(fieldType) ? fieldType : void 0
            );
            break;
          }
          case _kinds.Kind.DIRECTIVE:
            this._directive = schema.getDirective(node2.name.value);
            break;
          case _kinds.Kind.OPERATION_DEFINITION: {
            const rootType = schema.getRootType(node2.operation);
            this._typeStack.push(
              (0, _definition.isObjectType)(rootType) ? rootType : void 0
            );
            break;
          }
          case _kinds.Kind.INLINE_FRAGMENT:
          case _kinds.Kind.FRAGMENT_DEFINITION: {
            const typeConditionAST = node2.typeCondition;
            const outputType = typeConditionAST ? (0, _typeFromAST.typeFromAST)(schema, typeConditionAST) : (0, _definition.getNamedType)(this.getType());
            this._typeStack.push(
              (0, _definition.isOutputType)(outputType) ? outputType : void 0
            );
            break;
          }
          case _kinds.Kind.VARIABLE_DEFINITION: {
            const inputType = (0, _typeFromAST.typeFromAST)(schema, node2.type);
            this._inputTypeStack.push(
              (0, _definition.isInputType)(inputType) ? inputType : void 0
            );
            break;
          }
          case _kinds.Kind.ARGUMENT: {
            var _this$getDirective;
            let argDef;
            let argType;
            const fieldOrDirective = (_this$getDirective = this.getDirective()) !== null && _this$getDirective !== void 0 ? _this$getDirective : this.getFieldDef();
            if (fieldOrDirective) {
              argDef = fieldOrDirective.args.find(
                (arg) => arg.name === node2.name.value
              );
              if (argDef) {
                argType = argDef.type;
              }
            }
            this._argument = argDef;
            this._defaultValueStack.push(argDef ? argDef.defaultValue : void 0);
            this._inputTypeStack.push(
              (0, _definition.isInputType)(argType) ? argType : void 0
            );
            break;
          }
          case _kinds.Kind.LIST: {
            const listType = (0, _definition.getNullableType)(this.getInputType());
            const itemType = (0, _definition.isListType)(listType) ? listType.ofType : listType;
            this._defaultValueStack.push(void 0);
            this._inputTypeStack.push(
              (0, _definition.isInputType)(itemType) ? itemType : void 0
            );
            break;
          }
          case _kinds.Kind.OBJECT_FIELD: {
            const objectType = (0, _definition.getNamedType)(this.getInputType());
            let inputFieldType;
            let inputField;
            if ((0, _definition.isInputObjectType)(objectType)) {
              inputField = objectType.getFields()[node2.name.value];
              if (inputField) {
                inputFieldType = inputField.type;
              }
            }
            this._defaultValueStack.push(
              inputField ? inputField.defaultValue : void 0
            );
            this._inputTypeStack.push(
              (0, _definition.isInputType)(inputFieldType) ? inputFieldType : void 0
            );
            break;
          }
          case _kinds.Kind.ENUM: {
            const enumType = (0, _definition.getNamedType)(this.getInputType());
            let enumValue;
            if ((0, _definition.isEnumType)(enumType)) {
              enumValue = enumType.getValue(node2.value);
            }
            this._enumValue = enumValue;
            break;
          }
          default:
        }
      }
      /**
       * Updates this TypeInfo instance when leaving an AST node.
       * @param node - AST node being left.
       * @returns Nothing.
       * @example
       * ```ts
       * import assert from 'node:assert/strict';
       * import { parse, Kind } from 'graphql/language';
       * import { buildSchema, TypeInfo } from 'graphql/utilities';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     greeting: String
       *   }
       * `);
       * const document = parse('{ greeting }');
       * const operation = document.definitions[0];
       * assert(operation.kind === Kind.OPERATION_DEFINITION);
       * const selectionSet = operation.selectionSet;
       * const field = selectionSet.selections[0];
       * const typeInfo = new TypeInfo(schema);
       *
       * typeInfo.enter(operation);
       * typeInfo.enter(selectionSet);
       * typeInfo.enter(field);
       * String(typeInfo.getType()); // => 'String'
       *
       * typeInfo.leave(field);
       * String(typeInfo.getType()); // => 'Query'
       * ```
       */
      leave(node2) {
        switch (node2.kind) {
          case _kinds.Kind.SELECTION_SET:
            this._parentTypeStack.pop();
            break;
          case _kinds.Kind.FIELD:
            this._fieldDefStack.pop();
            this._typeStack.pop();
            break;
          case _kinds.Kind.DIRECTIVE:
            this._directive = null;
            break;
          case _kinds.Kind.OPERATION_DEFINITION:
          case _kinds.Kind.INLINE_FRAGMENT:
          case _kinds.Kind.FRAGMENT_DEFINITION:
            this._typeStack.pop();
            break;
          case _kinds.Kind.VARIABLE_DEFINITION:
            this._inputTypeStack.pop();
            break;
          case _kinds.Kind.ARGUMENT:
            this._argument = null;
            this._defaultValueStack.pop();
            this._inputTypeStack.pop();
            break;
          case _kinds.Kind.LIST:
          case _kinds.Kind.OBJECT_FIELD:
            this._defaultValueStack.pop();
            this._inputTypeStack.pop();
            break;
          case _kinds.Kind.ENUM:
            this._enumValue = null;
            break;
          default:
        }
      }
    };
    exports.TypeInfo = TypeInfo2;
    function getFieldDef(schema, parentType, fieldNode) {
      const name2 = fieldNode.name.value;
      if (name2 === _introspection.SchemaMetaFieldDef.name && schema.getQueryType() === parentType) {
        return _introspection.SchemaMetaFieldDef;
      }
      if (name2 === _introspection.TypeMetaFieldDef.name && schema.getQueryType() === parentType) {
        return _introspection.TypeMetaFieldDef;
      }
      if (name2 === _introspection.TypeNameMetaFieldDef.name && (0, _definition.isCompositeType)(parentType)) {
        return _introspection.TypeNameMetaFieldDef;
      }
      if ((0, _definition.isObjectType)(parentType) || (0, _definition.isInterfaceType)(parentType)) {
        return parentType.getFields()[name2];
      }
    }
    function visitWithTypeInfo2(typeInfo, visitor) {
      return {
        enter(...args) {
          const node2 = args[0];
          typeInfo.enter(node2);
          const fn = (0, _visitor.getEnterLeaveForKind)(visitor, node2.kind).enter;
          if (fn) {
            const result = fn.apply(visitor, args);
            if (result !== void 0) {
              typeInfo.leave(node2);
              if ((0, _ast.isNode)(result)) {
                typeInfo.enter(result);
              }
            }
            return result;
          }
        },
        leave(...args) {
          const node2 = args[0];
          const fn = (0, _visitor.getEnterLeaveForKind)(visitor, node2.kind).leave;
          let result;
          if (fn) {
            result = fn.apply(visitor, args);
          }
          typeInfo.leave(node2);
          return result;
        }
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/predicates.js
var require_predicates = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/predicates.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.isConstValueNode = isConstValueNode;
    exports.isDefinitionNode = isDefinitionNode;
    exports.isExecutableDefinitionNode = isExecutableDefinitionNode;
    exports.isSchemaCoordinateNode = isSchemaCoordinateNode;
    exports.isSelectionNode = isSelectionNode;
    exports.isTypeDefinitionNode = isTypeDefinitionNode;
    exports.isTypeExtensionNode = isTypeExtensionNode;
    exports.isTypeNode = isTypeNode;
    exports.isTypeSystemDefinitionNode = isTypeSystemDefinitionNode;
    exports.isTypeSystemExtensionNode = isTypeSystemExtensionNode;
    exports.isValueNode = isValueNode;
    var _kinds = require_kinds();
    function isDefinitionNode(node2) {
      return isExecutableDefinitionNode(node2) || isTypeSystemDefinitionNode(node2) || isTypeSystemExtensionNode(node2);
    }
    function isExecutableDefinitionNode(node2) {
      return node2.kind === _kinds.Kind.OPERATION_DEFINITION || node2.kind === _kinds.Kind.FRAGMENT_DEFINITION;
    }
    function isSelectionNode(node2) {
      return node2.kind === _kinds.Kind.FIELD || node2.kind === _kinds.Kind.FRAGMENT_SPREAD || node2.kind === _kinds.Kind.INLINE_FRAGMENT;
    }
    function isValueNode(node2) {
      return node2.kind === _kinds.Kind.VARIABLE || node2.kind === _kinds.Kind.INT || node2.kind === _kinds.Kind.FLOAT || node2.kind === _kinds.Kind.STRING || node2.kind === _kinds.Kind.BOOLEAN || node2.kind === _kinds.Kind.NULL || node2.kind === _kinds.Kind.ENUM || node2.kind === _kinds.Kind.LIST || node2.kind === _kinds.Kind.OBJECT;
    }
    function isConstValueNode(node2) {
      return isValueNode(node2) && (node2.kind === _kinds.Kind.LIST ? node2.values.some(isConstValueNode) : node2.kind === _kinds.Kind.OBJECT ? node2.fields.some((field) => isConstValueNode(field.value)) : node2.kind !== _kinds.Kind.VARIABLE);
    }
    function isTypeNode(node2) {
      return node2.kind === _kinds.Kind.NAMED_TYPE || node2.kind === _kinds.Kind.LIST_TYPE || node2.kind === _kinds.Kind.NON_NULL_TYPE;
    }
    function isTypeSystemDefinitionNode(node2) {
      return node2.kind === _kinds.Kind.SCHEMA_DEFINITION || isTypeDefinitionNode(node2) || node2.kind === _kinds.Kind.DIRECTIVE_DEFINITION;
    }
    function isTypeDefinitionNode(node2) {
      return node2.kind === _kinds.Kind.SCALAR_TYPE_DEFINITION || node2.kind === _kinds.Kind.OBJECT_TYPE_DEFINITION || node2.kind === _kinds.Kind.INTERFACE_TYPE_DEFINITION || node2.kind === _kinds.Kind.UNION_TYPE_DEFINITION || node2.kind === _kinds.Kind.ENUM_TYPE_DEFINITION || node2.kind === _kinds.Kind.INPUT_OBJECT_TYPE_DEFINITION;
    }
    function isTypeSystemExtensionNode(node2) {
      return node2.kind === _kinds.Kind.SCHEMA_EXTENSION || node2.kind === _kinds.Kind.DIRECTIVE_EXTENSION || isTypeExtensionNode(node2);
    }
    function isTypeExtensionNode(node2) {
      return node2.kind === _kinds.Kind.SCALAR_TYPE_EXTENSION || node2.kind === _kinds.Kind.OBJECT_TYPE_EXTENSION || node2.kind === _kinds.Kind.INTERFACE_TYPE_EXTENSION || node2.kind === _kinds.Kind.UNION_TYPE_EXTENSION || node2.kind === _kinds.Kind.ENUM_TYPE_EXTENSION || node2.kind === _kinds.Kind.INPUT_OBJECT_TYPE_EXTENSION;
    }
    function isSchemaCoordinateNode(node2) {
      return node2.kind === _kinds.Kind.TYPE_COORDINATE || node2.kind === _kinds.Kind.MEMBER_COORDINATE || node2.kind === _kinds.Kind.ARGUMENT_COORDINATE || node2.kind === _kinds.Kind.DIRECTIVE_COORDINATE || node2.kind === _kinds.Kind.DIRECTIVE_ARGUMENT_COORDINATE;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/ExecutableDefinitionsRule.js
var require_ExecutableDefinitionsRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/ExecutableDefinitionsRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.ExecutableDefinitionsRule = ExecutableDefinitionsRule;
    var _GraphQLError = require_GraphQLError();
    var _kinds = require_kinds();
    var _predicates = require_predicates();
    function ExecutableDefinitionsRule(context) {
      return {
        Document(node2) {
          for (const definition of node2.definitions) {
            if (!(0, _predicates.isExecutableDefinitionNode)(definition)) {
              const defName = definition.kind === _kinds.Kind.SCHEMA_DEFINITION || definition.kind === _kinds.Kind.SCHEMA_EXTENSION ? "schema" : '"' + definition.name.value + '"';
              context.reportError(
                new _GraphQLError.GraphQLError(
                  `The ${defName} definition is not executable.`,
                  {
                    nodes: definition
                  }
                )
              );
            }
          }
          return false;
        }
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/FieldsOnCorrectTypeRule.js
var require_FieldsOnCorrectTypeRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/FieldsOnCorrectTypeRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.FieldsOnCorrectTypeRule = FieldsOnCorrectTypeRule;
    var _didYouMean = require_didYouMean();
    var _naturalCompare = require_naturalCompare();
    var _suggestionList = require_suggestionList();
    var _GraphQLError = require_GraphQLError();
    var _definition = require_definition();
    function FieldsOnCorrectTypeRule(context) {
      return {
        Field(node2) {
          const type = context.getParentType();
          if (type) {
            const fieldDef = context.getFieldDef();
            if (!fieldDef) {
              const schema = context.getSchema();
              const fieldName = node2.name.value;
              let suggestion = (0, _didYouMean.didYouMean)(
                "to use an inline fragment on",
                context.hideSuggestions ? [] : getSuggestedTypeNames(schema, type, fieldName)
              );
              if (suggestion === "") {
                suggestion = (0, _didYouMean.didYouMean)(
                  context.hideSuggestions ? [] : getSuggestedFieldNames(type, fieldName)
                );
              }
              context.reportError(
                new _GraphQLError.GraphQLError(
                  `Cannot query field "${fieldName}" on type "${type.name}".` + suggestion,
                  {
                    nodes: node2
                  }
                )
              );
            }
          }
        }
      };
    }
    function getSuggestedTypeNames(schema, type, fieldName) {
      if (!(0, _definition.isAbstractType)(type)) {
        return [];
      }
      const suggestedTypes = /* @__PURE__ */ new Set();
      const usageCount = /* @__PURE__ */ Object.create(null);
      for (const possibleType of schema.getPossibleTypes(type)) {
        if (!possibleType.getFields()[fieldName]) {
          continue;
        }
        suggestedTypes.add(possibleType);
        usageCount[possibleType.name] = 1;
        for (const possibleInterface of possibleType.getInterfaces()) {
          var _usageCount$possibleI;
          if (!possibleInterface.getFields()[fieldName]) {
            continue;
          }
          suggestedTypes.add(possibleInterface);
          usageCount[possibleInterface.name] = ((_usageCount$possibleI = usageCount[possibleInterface.name]) !== null && _usageCount$possibleI !== void 0 ? _usageCount$possibleI : 0) + 1;
        }
      }
      return [...suggestedTypes].sort((typeA, typeB) => {
        const usageCountDiff = usageCount[typeB.name] - usageCount[typeA.name];
        if (usageCountDiff !== 0) {
          return usageCountDiff;
        }
        if ((0, _definition.isInterfaceType)(typeA) && schema.isSubType(typeA, typeB)) {
          return -1;
        }
        if ((0, _definition.isInterfaceType)(typeB) && schema.isSubType(typeB, typeA)) {
          return 1;
        }
        return (0, _naturalCompare.naturalCompare)(typeA.name, typeB.name);
      }).map((x) => x.name);
    }
    function getSuggestedFieldNames(type, fieldName) {
      if ((0, _definition.isObjectType)(type) || (0, _definition.isInterfaceType)(type)) {
        const possibleFieldNames = Object.keys(type.getFields());
        return (0, _suggestionList.suggestionList)(fieldName, possibleFieldNames);
      }
      return [];
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/FragmentsOnCompositeTypesRule.js
var require_FragmentsOnCompositeTypesRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/FragmentsOnCompositeTypesRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.FragmentsOnCompositeTypesRule = FragmentsOnCompositeTypesRule;
    var _GraphQLError = require_GraphQLError();
    var _printer = require_printer();
    var _definition = require_definition();
    var _typeFromAST = require_typeFromAST();
    function FragmentsOnCompositeTypesRule(context) {
      return {
        InlineFragment(node2) {
          const typeCondition = node2.typeCondition;
          if (typeCondition) {
            const type = (0, _typeFromAST.typeFromAST)(
              context.getSchema(),
              typeCondition
            );
            if (type && !(0, _definition.isCompositeType)(type)) {
              const typeStr = (0, _printer.print)(typeCondition);
              context.reportError(
                new _GraphQLError.GraphQLError(
                  `Fragment cannot condition on non composite type "${typeStr}".`,
                  {
                    nodes: typeCondition
                  }
                )
              );
            }
          }
        },
        FragmentDefinition(node2) {
          const type = (0, _typeFromAST.typeFromAST)(
            context.getSchema(),
            node2.typeCondition
          );
          if (type && !(0, _definition.isCompositeType)(type)) {
            const typeStr = (0, _printer.print)(node2.typeCondition);
            context.reportError(
              new _GraphQLError.GraphQLError(
                `Fragment "${node2.name.value}" cannot condition on non composite type "${typeStr}".`,
                {
                  nodes: node2.typeCondition
                }
              )
            );
          }
        }
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/KnownArgumentNamesRule.js
var require_KnownArgumentNamesRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/KnownArgumentNamesRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.KnownArgumentNamesOnDirectivesRule = KnownArgumentNamesOnDirectivesRule;
    exports.KnownArgumentNamesRule = KnownArgumentNamesRule;
    var _didYouMean = require_didYouMean();
    var _suggestionList = require_suggestionList();
    var _GraphQLError = require_GraphQLError();
    var _kinds = require_kinds();
    var _directives = require_directives();
    function KnownArgumentNamesRule(context) {
      return {
        // eslint-disable-next-line new-cap
        ...KnownArgumentNamesOnDirectivesRule(context),
        Argument(argNode) {
          const argDef = context.getArgument();
          const fieldDef = context.getFieldDef();
          const parentType = context.getParentType();
          if (!argDef && fieldDef && parentType) {
            const argName = argNode.name.value;
            const suggestions = context.hideSuggestions ? [] : (0, _suggestionList.suggestionList)(
              argName,
              fieldDef.args.map((arg) => arg.name)
            );
            context.reportError(
              new _GraphQLError.GraphQLError(
                `Unknown argument "${argName}" on field "${parentType.name}.${fieldDef.name}".` + (0, _didYouMean.didYouMean)(suggestions),
                {
                  nodes: argNode
                }
              )
            );
          }
        }
      };
    }
    function KnownArgumentNamesOnDirectivesRule(context) {
      const directiveArgs = /* @__PURE__ */ Object.create(null);
      const schema = context.getSchema();
      const definedDirectives = schema ? schema.getDirectives() : _directives.specifiedDirectives;
      for (const directive of definedDirectives) {
        directiveArgs[directive.name] = new Set(
          directive.args.map((arg) => arg.name)
        );
      }
      const astDefinitions = context.getDocument().definitions;
      for (const def of astDefinitions) {
        if (def.kind === _kinds.Kind.DIRECTIVE_DEFINITION) {
          var _def$arguments;
          const argsNodes = (_def$arguments = def.arguments) !== null && _def$arguments !== void 0 ? _def$arguments : [];
          directiveArgs[def.name.value] = new Set(
            argsNodes.map((arg) => arg.name.value)
          );
        }
      }
      return {
        Directive(directiveNode) {
          const directiveName = directiveNode.name.value;
          const knownArgs = directiveArgs[directiveName];
          if (directiveNode.arguments && knownArgs) {
            for (const argNode of directiveNode.arguments) {
              const argName = argNode.name.value;
              if (!knownArgs.has(argName)) {
                const suggestions = context.hideSuggestions ? [] : (0, _suggestionList.suggestionList)(
                  argName,
                  Array.from(knownArgs)
                );
                context.reportError(
                  new _GraphQLError.GraphQLError(
                    `Unknown argument "${argName}" on directive "@${directiveName}".` + (context.hideSuggestions ? "" : (0, _didYouMean.didYouMean)(suggestions)),
                    {
                      nodes: argNode
                    }
                  )
                );
              }
            }
          }
          return false;
        }
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/KnownDirectivesRule.js
var require_KnownDirectivesRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/KnownDirectivesRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.KnownDirectivesRule = KnownDirectivesRule;
    var _inspect = require_inspect();
    var _invariant = require_invariant();
    var _GraphQLError = require_GraphQLError();
    var _ast = require_ast();
    var _directiveLocation = require_directiveLocation();
    var _kinds = require_kinds();
    var _directives = require_directives();
    function KnownDirectivesRule(context) {
      const locationsMap = /* @__PURE__ */ Object.create(null);
      const schema = context.getSchema();
      const definedDirectives = schema ? schema.getDirectives() : _directives.specifiedDirectives;
      for (const directive of definedDirectives) {
        locationsMap[directive.name] = directive.locations;
      }
      const astDefinitions = context.getDocument().definitions;
      for (const def of astDefinitions) {
        if (def.kind === _kinds.Kind.DIRECTIVE_DEFINITION) {
          locationsMap[def.name.value] = def.locations.map((name2) => name2.value);
        }
      }
      return {
        Directive(node2, _key, _parent, _path, ancestors) {
          const name2 = node2.name.value;
          const locations = locationsMap[name2];
          if (!locations) {
            context.reportError(
              new _GraphQLError.GraphQLError(`Unknown directive "@${name2}".`, {
                nodes: node2
              })
            );
            return;
          }
          const candidateLocation = getDirectiveLocationForASTPath(ancestors);
          if (candidateLocation && !locations.includes(candidateLocation)) {
            context.reportError(
              new _GraphQLError.GraphQLError(
                `Directive "@${name2}" may not be used on ${candidateLocation}.`,
                {
                  nodes: node2
                }
              )
            );
          }
        }
      };
    }
    function getDirectiveLocationForASTPath(ancestors) {
      const appliedTo = ancestors[ancestors.length - 1];
      "kind" in appliedTo || (0, _invariant.invariant)(false);
      switch (appliedTo.kind) {
        case _kinds.Kind.OPERATION_DEFINITION:
          return getDirectiveLocationForOperation(appliedTo.operation);
        case _kinds.Kind.FIELD:
          return _directiveLocation.DirectiveLocation.FIELD;
        case _kinds.Kind.FRAGMENT_SPREAD:
          return _directiveLocation.DirectiveLocation.FRAGMENT_SPREAD;
        case _kinds.Kind.INLINE_FRAGMENT:
          return _directiveLocation.DirectiveLocation.INLINE_FRAGMENT;
        case _kinds.Kind.FRAGMENT_DEFINITION:
          return _directiveLocation.DirectiveLocation.FRAGMENT_DEFINITION;
        case _kinds.Kind.VARIABLE_DEFINITION:
          return _directiveLocation.DirectiveLocation.VARIABLE_DEFINITION;
        case _kinds.Kind.SCHEMA_DEFINITION:
        case _kinds.Kind.SCHEMA_EXTENSION:
          return _directiveLocation.DirectiveLocation.SCHEMA;
        case _kinds.Kind.SCALAR_TYPE_DEFINITION:
        case _kinds.Kind.SCALAR_TYPE_EXTENSION:
          return _directiveLocation.DirectiveLocation.SCALAR;
        case _kinds.Kind.OBJECT_TYPE_DEFINITION:
        case _kinds.Kind.OBJECT_TYPE_EXTENSION:
          return _directiveLocation.DirectiveLocation.OBJECT;
        case _kinds.Kind.FIELD_DEFINITION:
          return _directiveLocation.DirectiveLocation.FIELD_DEFINITION;
        case _kinds.Kind.INTERFACE_TYPE_DEFINITION:
        case _kinds.Kind.INTERFACE_TYPE_EXTENSION:
          return _directiveLocation.DirectiveLocation.INTERFACE;
        case _kinds.Kind.UNION_TYPE_DEFINITION:
        case _kinds.Kind.UNION_TYPE_EXTENSION:
          return _directiveLocation.DirectiveLocation.UNION;
        case _kinds.Kind.ENUM_TYPE_DEFINITION:
        case _kinds.Kind.ENUM_TYPE_EXTENSION:
          return _directiveLocation.DirectiveLocation.ENUM;
        case _kinds.Kind.ENUM_VALUE_DEFINITION:
          return _directiveLocation.DirectiveLocation.ENUM_VALUE;
        case _kinds.Kind.INPUT_OBJECT_TYPE_DEFINITION:
        case _kinds.Kind.INPUT_OBJECT_TYPE_EXTENSION:
          return _directiveLocation.DirectiveLocation.INPUT_OBJECT;
        case _kinds.Kind.INPUT_VALUE_DEFINITION: {
          const parentNode = ancestors[ancestors.length - 3];
          "kind" in parentNode || (0, _invariant.invariant)(false);
          return parentNode.kind === _kinds.Kind.INPUT_OBJECT_TYPE_DEFINITION ? _directiveLocation.DirectiveLocation.INPUT_FIELD_DEFINITION : _directiveLocation.DirectiveLocation.ARGUMENT_DEFINITION;
        }
        case _kinds.Kind.DIRECTIVE_DEFINITION:
        case _kinds.Kind.DIRECTIVE_EXTENSION:
          return _directiveLocation.DirectiveLocation.DIRECTIVE_DEFINITION;
        // Not reachable, all possible types have been considered.
        /* c8 ignore next */
        default:
          (0, _invariant.invariant)(
            false,
            "Unexpected kind: " + (0, _inspect.inspect)(appliedTo.kind)
          );
      }
    }
    function getDirectiveLocationForOperation(operation) {
      switch (operation) {
        case _ast.OperationTypeNode.QUERY:
          return _directiveLocation.DirectiveLocation.QUERY;
        case _ast.OperationTypeNode.MUTATION:
          return _directiveLocation.DirectiveLocation.MUTATION;
        case _ast.OperationTypeNode.SUBSCRIPTION:
          return _directiveLocation.DirectiveLocation.SUBSCRIPTION;
      }
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/KnownFragmentNamesRule.js
var require_KnownFragmentNamesRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/KnownFragmentNamesRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.KnownFragmentNamesRule = KnownFragmentNamesRule;
    var _GraphQLError = require_GraphQLError();
    function KnownFragmentNamesRule(context) {
      return {
        FragmentSpread(node2) {
          const fragmentName = node2.name.value;
          const fragment = context.getFragment(fragmentName);
          if (!fragment) {
            context.reportError(
              new _GraphQLError.GraphQLError(
                `Unknown fragment "${fragmentName}".`,
                {
                  nodes: node2.name
                }
              )
            );
          }
        }
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/KnownTypeNamesRule.js
var require_KnownTypeNamesRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/KnownTypeNamesRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.KnownTypeNamesRule = KnownTypeNamesRule;
    var _didYouMean = require_didYouMean();
    var _suggestionList = require_suggestionList();
    var _GraphQLError = require_GraphQLError();
    var _predicates = require_predicates();
    var _introspection = require_introspection();
    var _scalars = require_scalars();
    function KnownTypeNamesRule(context) {
      const schema = context.getSchema();
      const existingTypesMap = schema ? schema.getTypeMap() : /* @__PURE__ */ Object.create(null);
      const definedTypes = /* @__PURE__ */ Object.create(null);
      for (const def of context.getDocument().definitions) {
        if ((0, _predicates.isTypeDefinitionNode)(def)) {
          definedTypes[def.name.value] = true;
        }
      }
      const typeNames = [
        ...Object.keys(existingTypesMap),
        ...Object.keys(definedTypes)
      ];
      return {
        NamedType(node2, _1, parent, _2, ancestors) {
          const typeName = node2.name.value;
          if (!existingTypesMap[typeName] && !definedTypes[typeName]) {
            var _ancestors$;
            const definitionNode = (_ancestors$ = ancestors[2]) !== null && _ancestors$ !== void 0 ? _ancestors$ : parent;
            const isSDL = definitionNode != null && isSDLNode(definitionNode);
            if (isSDL && standardTypeNames.includes(typeName)) {
              return;
            }
            const suggestedTypes = context.hideSuggestions ? [] : (0, _suggestionList.suggestionList)(
              typeName,
              isSDL ? standardTypeNames.concat(typeNames) : typeNames
            );
            context.reportError(
              new _GraphQLError.GraphQLError(
                `Unknown type "${typeName}".` + (0, _didYouMean.didYouMean)(suggestedTypes),
                {
                  nodes: node2
                }
              )
            );
          }
        }
      };
    }
    var standardTypeNames = [
      ..._scalars.specifiedScalarTypes,
      ..._introspection.introspectionTypes
    ].map((type) => type.name);
    function isSDLNode(value) {
      return "kind" in value && ((0, _predicates.isTypeSystemDefinitionNode)(value) || (0, _predicates.isTypeSystemExtensionNode)(value));
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/LoneAnonymousOperationRule.js
var require_LoneAnonymousOperationRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/LoneAnonymousOperationRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.LoneAnonymousOperationRule = LoneAnonymousOperationRule;
    var _GraphQLError = require_GraphQLError();
    var _kinds = require_kinds();
    function LoneAnonymousOperationRule(context) {
      let operationCount = 0;
      return {
        Document(node2) {
          operationCount = node2.definitions.filter(
            (definition) => definition.kind === _kinds.Kind.OPERATION_DEFINITION
          ).length;
        },
        OperationDefinition(node2) {
          if (!node2.name && operationCount > 1) {
            context.reportError(
              new _GraphQLError.GraphQLError(
                "This anonymous operation must be the only defined operation.",
                {
                  nodes: node2
                }
              )
            );
          }
        }
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/LoneSchemaDefinitionRule.js
var require_LoneSchemaDefinitionRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/LoneSchemaDefinitionRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.LoneSchemaDefinitionRule = LoneSchemaDefinitionRule;
    var _GraphQLError = require_GraphQLError();
    function LoneSchemaDefinitionRule(context) {
      var _ref, _ref2, _oldSchema$astNode;
      const oldSchema = context.getSchema();
      const alreadyDefined = (_ref = (_ref2 = (_oldSchema$astNode = oldSchema === null || oldSchema === void 0 ? void 0 : oldSchema.astNode) !== null && _oldSchema$astNode !== void 0 ? _oldSchema$astNode : oldSchema === null || oldSchema === void 0 ? void 0 : oldSchema.getQueryType()) !== null && _ref2 !== void 0 ? _ref2 : oldSchema === null || oldSchema === void 0 ? void 0 : oldSchema.getMutationType()) !== null && _ref !== void 0 ? _ref : oldSchema === null || oldSchema === void 0 ? void 0 : oldSchema.getSubscriptionType();
      let schemaDefinitionsCount = 0;
      return {
        SchemaDefinition(node2) {
          if (alreadyDefined) {
            context.reportError(
              new _GraphQLError.GraphQLError(
                "Cannot define a new schema within a schema extension.",
                {
                  nodes: node2
                }
              )
            );
            return;
          }
          if (schemaDefinitionsCount > 0) {
            context.reportError(
              new _GraphQLError.GraphQLError(
                "Must provide only one schema definition.",
                {
                  nodes: node2
                }
              )
            );
          }
          ++schemaDefinitionsCount;
        }
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/MaxIntrospectionDepthRule.js
var require_MaxIntrospectionDepthRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/MaxIntrospectionDepthRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.MaxIntrospectionDepthRule = MaxIntrospectionDepthRule;
    var _GraphQLError = require_GraphQLError();
    var _kinds = require_kinds();
    var MAX_LISTS_DEPTH = 3;
    function MaxIntrospectionDepthRule(context) {
      const checkedFragments = /* @__PURE__ */ Object.create(null);
      const exceededFragments = /* @__PURE__ */ Object.create(null);
      function checkDepth(node2, visitedFragments, depth = 0) {
        if (node2.kind === _kinds.Kind.FRAGMENT_SPREAD) {
          const fragmentName = node2.name.value;
          const exceededEntryDepth = exceededFragments[fragmentName];
          if (exceededEntryDepth !== void 0 && exceededEntryDepth <= depth) {
            return true;
          }
          const visitedEntryDepth = visitedFragments[fragmentName];
          const checkedEntryDepth = checkedFragments[fragmentName];
          if (visitedEntryDepth !== void 0 && visitedEntryDepth >= depth || checkedEntryDepth !== void 0 && checkedEntryDepth >= depth) {
            return false;
          }
          const fragment = context.getFragment(fragmentName);
          if (!fragment) {
            return false;
          }
          visitedFragments[fragmentName] = depth;
          if (checkDepth(fragment, visitedFragments, depth)) {
            exceededFragments[fragmentName] = depth;
            return true;
          }
          checkedFragments[fragmentName] = depth;
          return false;
        }
        if (node2.kind === _kinds.Kind.FIELD && // check all introspection lists
        (node2.name.value === "fields" || node2.name.value === "interfaces" || node2.name.value === "possibleTypes" || node2.name.value === "inputFields")) {
          depth++;
          if (depth >= MAX_LISTS_DEPTH) {
            return true;
          }
        }
        if ("selectionSet" in node2 && node2.selectionSet) {
          for (const child2 of node2.selectionSet.selections) {
            if (checkDepth(child2, visitedFragments, depth)) {
              return true;
            }
          }
        }
        return false;
      }
      return {
        Field(node2) {
          if (node2.name.value === "__schema" || node2.name.value === "__type") {
            const visitedFragments = /* @__PURE__ */ Object.create(null);
            if (checkDepth(node2, visitedFragments)) {
              context.reportError(
                new _GraphQLError.GraphQLError(
                  "Maximum introspection depth exceeded",
                  {
                    nodes: [node2]
                  }
                )
              );
              return false;
            }
          }
        }
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/NoFragmentCyclesRule.js
var require_NoFragmentCyclesRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/NoFragmentCyclesRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.NoFragmentCyclesRule = NoFragmentCyclesRule;
    var _GraphQLError = require_GraphQLError();
    function NoFragmentCyclesRule(context) {
      const visitedFrags = /* @__PURE__ */ Object.create(null);
      const spreadPath = [];
      const spreadPathIndexByName = /* @__PURE__ */ Object.create(null);
      return {
        OperationDefinition: () => false,
        FragmentDefinition(node2) {
          detectCycleRecursive(node2);
          return false;
        }
      };
      function detectCycleRecursive(fragment) {
        if (visitedFrags[fragment.name.value]) {
          return;
        }
        const fragmentName = fragment.name.value;
        visitedFrags[fragmentName] = true;
        const spreadNodes = context.getFragmentSpreads(fragment.selectionSet);
        if (spreadNodes.length === 0) {
          return;
        }
        spreadPathIndexByName[fragmentName] = spreadPath.length;
        for (const spreadNode of spreadNodes) {
          const spreadName = spreadNode.name.value;
          const cycleIndex = spreadPathIndexByName[spreadName];
          spreadPath.push(spreadNode);
          if (cycleIndex === void 0) {
            const spreadFragment = context.getFragment(spreadName);
            if (spreadFragment) {
              detectCycleRecursive(spreadFragment);
            }
          } else {
            const cyclePath = spreadPath.slice(cycleIndex);
            const viaPath = cyclePath.slice(0, -1).map((s) => '"' + s.name.value + '"').join(", ");
            context.reportError(
              new _GraphQLError.GraphQLError(
                `Cannot spread fragment "${spreadName}" within itself` + (viaPath !== "" ? ` via ${viaPath}.` : "."),
                {
                  nodes: cyclePath
                }
              )
            );
          }
          spreadPath.pop();
        }
        spreadPathIndexByName[fragmentName] = void 0;
      }
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/NoUndefinedVariablesRule.js
var require_NoUndefinedVariablesRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/NoUndefinedVariablesRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.NoUndefinedVariablesRule = NoUndefinedVariablesRule;
    var _GraphQLError = require_GraphQLError();
    function NoUndefinedVariablesRule(context) {
      let variableNameDefined = /* @__PURE__ */ Object.create(null);
      return {
        OperationDefinition: {
          enter() {
            variableNameDefined = /* @__PURE__ */ Object.create(null);
          },
          leave(operation) {
            const usages = context.getRecursiveVariableUsages(operation);
            for (const { node: node2 } of usages) {
              const varName = node2.name.value;
              if (variableNameDefined[varName] !== true) {
                context.reportError(
                  new _GraphQLError.GraphQLError(
                    operation.name ? `Variable "$${varName}" is not defined by operation "${operation.name.value}".` : `Variable "$${varName}" is not defined.`,
                    {
                      nodes: [node2, operation]
                    }
                  )
                );
              }
            }
          }
        },
        VariableDefinition(node2) {
          variableNameDefined[node2.variable.name.value] = true;
        }
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/NoUnusedFragmentsRule.js
var require_NoUnusedFragmentsRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/NoUnusedFragmentsRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.NoUnusedFragmentsRule = NoUnusedFragmentsRule;
    var _GraphQLError = require_GraphQLError();
    function NoUnusedFragmentsRule(context) {
      const operationDefs = [];
      const fragmentDefs = [];
      return {
        OperationDefinition(node2) {
          operationDefs.push(node2);
          return false;
        },
        FragmentDefinition(node2) {
          fragmentDefs.push(node2);
          return false;
        },
        Document: {
          leave() {
            const fragmentNameUsed = new Set(
              context.getRecursivelyReferencedFragmentsForOperations(operationDefs).map((fragment) => fragment.name.value)
            );
            for (const fragmentDef of fragmentDefs) {
              const fragName = fragmentDef.name.value;
              if (!fragmentNameUsed.has(fragName)) {
                context.reportError(
                  new _GraphQLError.GraphQLError(
                    `Fragment "${fragName}" is never used.`,
                    {
                      nodes: fragmentDef
                    }
                  )
                );
              }
            }
          }
        }
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/NoUnusedVariablesRule.js
var require_NoUnusedVariablesRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/NoUnusedVariablesRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.NoUnusedVariablesRule = NoUnusedVariablesRule;
    var _GraphQLError = require_GraphQLError();
    function NoUnusedVariablesRule(context) {
      let variableDefs = [];
      return {
        OperationDefinition: {
          enter() {
            variableDefs = [];
          },
          leave(operation) {
            const variableNameUsed = /* @__PURE__ */ Object.create(null);
            const usages = context.getRecursiveVariableUsages(operation);
            for (const { node: node2 } of usages) {
              variableNameUsed[node2.name.value] = true;
            }
            for (const variableDef of variableDefs) {
              const variableName = variableDef.variable.name.value;
              if (variableNameUsed[variableName] !== true) {
                context.reportError(
                  new _GraphQLError.GraphQLError(
                    operation.name ? `Variable "$${variableName}" is never used in operation "${operation.name.value}".` : `Variable "$${variableName}" is never used.`,
                    {
                      nodes: variableDef
                    }
                  )
                );
              }
            }
          }
        },
        VariableDefinition(def) {
          variableDefs.push(def);
        }
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/validationAbortedError.js
var require_validationAbortedError = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/validationAbortedError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.validationAbortedError = void 0;
    var _GraphQLError = require_GraphQLError();
    var validationAbortedError = new _GraphQLError.GraphQLError(
      "Validation aborted."
    );
    exports.validationAbortedError = validationAbortedError;
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/OverlappingFieldsCanBeMergedRule.js
var require_OverlappingFieldsCanBeMergedRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/OverlappingFieldsCanBeMergedRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.OverlappingFieldsCanBeMergedRule = OverlappingFieldsCanBeMergedRule;
    var _inspect = require_inspect();
    var _GraphQLError = require_GraphQLError();
    var _ast = require_ast();
    var _kinds = require_kinds();
    var _definition = require_definition();
    var _typeFromAST = require_typeFromAST();
    var _validationAbortedError = require_validationAbortedError();
    var MAX_CONFLICT_DETAIL_LENGTH = 1e3;
    var MAX_CONFLICT_NODES = 20;
    var MAX_COMPLEXITY_BUDGET = 5e5;
    function OverlappingFieldsCanBeMergedRule(validationContext) {
      const ruleContext = {
        // A memoization for when two fragments are compared for conflicts.
        // Comparisons may be made many times, so memoizing this can dramatically
        // improve the performance of this validator.
        comparedFragmentPairs: new PairSet(),
        // A cache for the "field map" and list of fragment names found in any given
        // selection set.
        cachedCollectFieldsResults: /* @__PURE__ */ new Map(),
        stringifiedValues: /* @__PURE__ */ new Map(),
        remainingComplexityBudget: MAX_COMPLEXITY_BUDGET
      };
      return {
        SelectionSet(selectionSet, _key, parent) {
          var _selectionSet$selecti;
          if (parent && "kind" in parent && parent.kind === _kinds.Kind.INLINE_FRAGMENT) {
            return;
          }
          if (selectionSet.selections.length <= 1 && ((_selectionSet$selecti = selectionSet.selections[0]) === null || _selectionSet$selecti === void 0 ? void 0 : _selectionSet$selecti.kind) !== _kinds.Kind.INLINE_FRAGMENT) {
            return;
          }
          const conflicts = findConflictsWithinSelectionSet(
            validationContext,
            ruleContext,
            validationContext.getParentType(),
            selectionSet
          );
          for (const { responseName, reason, fields1, fields2 } of conflicts) {
            validationContext.reportError(
              new _GraphQLError.GraphQLError(
                `Fields "${maybeAbbreviate(
                  responseName
                )}" conflict because ${reason}. Use different aliases on the fields to fetch both if this was intentional.`,
                {
                  nodes: fields1.concat(fields2)
                }
              )
            );
          }
        }
      };
    }
    function findConflictsWithinSelectionSet(validationContext, ruleContext, parentType, selectionSet) {
      const conflicts = [];
      const collectFieldsResult = collectFields(
        validationContext,
        ruleContext,
        parentType,
        selectionSet
      );
      collectConflictsWithin(
        validationContext,
        conflicts,
        ruleContext,
        collectFieldsResult.groupedFieldSet
      );
      if (collectFieldsResult.fragmentNames.length !== 0 && (collectFieldsResult.groupedFieldSet.size !== 0 || collectFieldsResult.fragmentNames.length > 1)) {
        for (let i = 0; i < collectFieldsResult.fragmentNames.length; i++) {
          collectConflictsBetweenFieldsAndFragment(
            validationContext,
            conflicts,
            ruleContext,
            false,
            collectFieldsResult,
            collectFieldsResult.fragmentNames[i]
          );
          for (let j = i + 1; j < collectFieldsResult.fragmentNames.length; j++) {
            collectConflictsBetweenFragments(
              validationContext,
              conflicts,
              ruleContext,
              false,
              collectFieldsResult.fragmentNames[i],
              collectFieldsResult.fragmentNames[j]
            );
          }
        }
      }
      return conflicts;
    }
    function collectConflictsBetweenFieldsAndFragment(validationContext, conflicts, ruleContext, areMutuallyExclusive, collectFieldsResult, fragmentName) {
      var _collectFieldsResult$;
      spendComplexityBudget(ruleContext, 1);
      if (collectFieldsResult.groupedFieldSet.size === 0) {
        return;
      }
      const comparedFragments = (_collectFieldsResult$ = collectFieldsResult.comparedFragments) !== null && _collectFieldsResult$ !== void 0 ? _collectFieldsResult$ : collectFieldsResult.comparedFragments = /* @__PURE__ */ new Map();
      const compared = comparedFragments.get(fragmentName);
      if (compared === false || areMutuallyExclusive && compared === true) {
        return;
      }
      comparedFragments.set(fragmentName, areMutuallyExclusive);
      const fragment = validationContext.getFragment(fragmentName);
      if (!fragment) {
        return;
      }
      const collectFieldsResult2 = collectFragmentFields(
        validationContext,
        ruleContext,
        fragment
      );
      if (collectFieldsResult === collectFieldsResult2) {
        return;
      }
      collectConflictsBetween(
        validationContext,
        conflicts,
        ruleContext,
        areMutuallyExclusive,
        collectFieldsResult,
        collectFieldsResult2
      );
      for (const referencedFragmentName of collectFieldsResult2.fragmentNames) {
        collectConflictsBetweenFieldsAndFragment(
          validationContext,
          conflicts,
          ruleContext,
          areMutuallyExclusive,
          collectFieldsResult,
          referencedFragmentName
        );
      }
    }
    function collectConflictsBetweenFragments(validationContext, conflicts, ruleContext, areMutuallyExclusive, fragmentName1, fragmentName2) {
      spendComplexityBudget(ruleContext, 2);
      const { comparedFragmentPairs } = ruleContext;
      if (fragmentName1 === fragmentName2) {
        return;
      }
      if (comparedFragmentPairs.has(
        fragmentName1,
        fragmentName2,
        areMutuallyExclusive
      )) {
        return;
      }
      comparedFragmentPairs.add(fragmentName1, fragmentName2, areMutuallyExclusive);
      const fragment1 = validationContext.getFragment(fragmentName1);
      const fragment2 = validationContext.getFragment(fragmentName2);
      if (!fragment1 || !fragment2) {
        return;
      }
      const collectFieldsResult1 = collectFragmentFields(
        validationContext,
        ruleContext,
        fragment1
      );
      const collectFieldsResult2 = collectFragmentFields(
        validationContext,
        ruleContext,
        fragment2
      );
      collectConflictsBetween(
        validationContext,
        conflicts,
        ruleContext,
        areMutuallyExclusive,
        collectFieldsResult1,
        collectFieldsResult2
      );
      for (const referencedFragmentName2 of collectFieldsResult2.fragmentNames) {
        collectConflictsBetweenFragments(
          validationContext,
          conflicts,
          ruleContext,
          areMutuallyExclusive,
          fragmentName1,
          referencedFragmentName2
        );
      }
      for (const referencedFragmentName1 of collectFieldsResult1.fragmentNames) {
        collectConflictsBetweenFragments(
          validationContext,
          conflicts,
          ruleContext,
          areMutuallyExclusive,
          referencedFragmentName1,
          fragmentName2
        );
      }
    }
    function findConflictsBetweenSubSelectionSets(validationContext, ruleContext, areMutuallyExclusive, parentType1, selectionSet1, parentType2, selectionSet2) {
      const conflicts = [];
      const collectFieldsResult1 = collectFields(
        validationContext,
        ruleContext,
        parentType1,
        selectionSet1
      );
      const collectFieldsResult2 = collectFields(
        validationContext,
        ruleContext,
        parentType2,
        selectionSet2
      );
      collectConflictsBetween(
        validationContext,
        conflicts,
        ruleContext,
        areMutuallyExclusive,
        collectFieldsResult1,
        collectFieldsResult2
      );
      for (const fragmentName2 of collectFieldsResult2.fragmentNames) {
        collectConflictsBetweenFieldsAndFragment(
          validationContext,
          conflicts,
          ruleContext,
          areMutuallyExclusive,
          collectFieldsResult1,
          fragmentName2
        );
      }
      for (const fragmentName1 of collectFieldsResult1.fragmentNames) {
        collectConflictsBetweenFieldsAndFragment(
          validationContext,
          conflicts,
          ruleContext,
          areMutuallyExclusive,
          collectFieldsResult2,
          fragmentName1
        );
      }
      for (const fragmentName1 of collectFieldsResult1.fragmentNames) {
        for (const fragmentName2 of collectFieldsResult2.fragmentNames) {
          collectConflictsBetweenFragments(
            validationContext,
            conflicts,
            ruleContext,
            areMutuallyExclusive,
            fragmentName1,
            fragmentName2
          );
        }
      }
      return conflicts;
    }
    function collectConflictsWithin(validationContext, conflicts, ruleContext, groupedFieldSet) {
      for (const [responseName, fields] of groupedFieldSet) {
        if (fields.length > 1) {
          for (let i = 0; i < fields.length; i++) {
            for (let j = i + 1; j < fields.length; j++) {
              const conflict = findConflict(
                validationContext,
                ruleContext,
                false,
                responseName,
                fields[i],
                fields[j]
              );
              if (conflict) {
                conflicts.push(conflict);
              }
            }
          }
        }
      }
    }
    function collectConflictsBetween(validationContext, conflicts, ruleContext, parentFieldsAreMutuallyExclusive, collectFieldsResult1, collectFieldsResult2) {
      if (collectFieldsResult1.groupedFieldSet.size === 0 || collectFieldsResult2.groupedFieldSet.size === 0) {
        return;
      }
      for (const { responseName, fields1, fields2 } of getOverlappingFields(
        ruleContext,
        collectFieldsResult1,
        collectFieldsResult2
      )) {
        for (const field1 of fields1) {
          for (const field2 of fields2) {
            const conflict = findConflict(
              validationContext,
              ruleContext,
              parentFieldsAreMutuallyExclusive,
              responseName,
              field1,
              field2
            );
            if (conflict) {
              conflicts.push(conflict);
            }
          }
        }
      }
    }
    function getOverlappingFields(ruleContext, collectFieldsResult1, collectFieldsResult2) {
      var _collectFieldsResult;
      const byCollectFieldsResult = (_collectFieldsResult = collectFieldsResult1.overlappingFields) !== null && _collectFieldsResult !== void 0 ? _collectFieldsResult : collectFieldsResult1.overlappingFields = /* @__PURE__ */ new Map();
      const cached = byCollectFieldsResult.get(collectFieldsResult2);
      if (cached !== void 0) {
        return cached;
      }
      const overlappingFields = [];
      for (const [responseName, fields1] of collectFieldsResult1.groupedFieldSet) {
        spendComplexityBudget(ruleContext, 1);
        const fields2 = collectFieldsResult2.groupedFieldSet.get(responseName);
        if (fields2 !== void 0) {
          overlappingFields.push({
            responseName,
            fields1,
            fields2
          });
        }
      }
      byCollectFieldsResult.set(collectFieldsResult2, overlappingFields);
      return overlappingFields;
    }
    function findConflict(validationContext, ruleContext, parentFieldsAreMutuallyExclusive, responseName, fieldDetails1, fieldDetails2) {
      const {
        parentType: parentType1,
        node: node1,
        definition: def1
      } = fieldDetails1;
      const {
        parentType: parentType2,
        node: node2,
        definition: def2
      } = fieldDetails2;
      const areMutuallyExclusive = parentFieldsAreMutuallyExclusive || parentType1 !== parentType2 && (0, _definition.isObjectType)(parentType1) && (0, _definition.isObjectType)(parentType2);
      spendComplexityBudget(ruleContext, 2);
      if (fieldDetails1.isSimpleLeaf && fieldDetails2.isSimpleLeaf && (def1 === null || def1 === void 0 ? void 0 : def1.type) === (def2 === null || def2 === void 0 ? void 0 : def2.type) && node1.name.value === node2.name.value) {
        return;
      }
      if (!areMutuallyExclusive) {
        const fieldInfo1 = getFieldInfo(fieldDetails1);
        const fieldInfo2 = getFieldInfo(fieldDetails2);
        let reason = fieldInfo1.comparisons.get(fieldInfo2);
        if (reason === void 0) {
          const name1 = node1.name.value;
          const name2 = node2.name.value;
          reason = name1 !== name2 ? `"${maybeAbbreviate(name1)}" and "${maybeAbbreviate(
            name2
          )}" are different fields` : sameArguments(
            ruleContext,
            fieldInfo1.arguments,
            fieldInfo2.arguments
          ) ? null : "they have differing arguments";
          fieldInfo1.comparisons.set(fieldInfo2, reason);
        }
        if (reason !== null) {
          return {
            responseName,
            reason,
            fields1: [node1],
            fields2: [node2]
          };
        }
      }
      const type1 = def1 === null || def1 === void 0 ? void 0 : def1.type;
      const type2 = def2 === null || def2 === void 0 ? void 0 : def2.type;
      if (type1 && type2 && doTypesConflict(ruleContext, type1, type2)) {
        var _fieldInfo1$typeStrin, _fieldInfo2$typeStrin;
        const fieldInfo1 = getFieldInfo(fieldDetails1);
        const fieldInfo2 = getFieldInfo(fieldDetails2);
        const type1String = (_fieldInfo1$typeStrin = fieldInfo1.typeString) !== null && _fieldInfo1$typeStrin !== void 0 ? _fieldInfo1$typeStrin : fieldInfo1.typeString = (0, _inspect.inspect)(type1);
        const type2String = (_fieldInfo2$typeStrin = fieldInfo2.typeString) !== null && _fieldInfo2$typeStrin !== void 0 ? _fieldInfo2$typeStrin : fieldInfo2.typeString = (0, _inspect.inspect)(type2);
        return {
          responseName,
          reason: `they return conflicting types "${type1String}" and "${type2String}"`,
          fields1: [node1],
          fields2: [node2]
        };
      }
      const selectionSet1 = node1.selectionSet;
      const selectionSet2 = node2.selectionSet;
      if (selectionSet1 && selectionSet2) {
        const conflicts = findConflictsBetweenSubSelectionSets(
          validationContext,
          ruleContext,
          areMutuallyExclusive,
          getFieldInfo(fieldDetails1).namedType,
          selectionSet1,
          getFieldInfo(fieldDetails2).namedType,
          selectionSet2
        );
        return subfieldConflicts(conflicts, responseName, node1, node2);
      }
    }
    function getFieldInfo(fieldDetails) {
      if (fieldDetails.info === void 0) {
        var _fieldDetails$definit;
        fieldDetails.info = {
          comparisons: /* @__PURE__ */ new Map(),
          namedType: (0, _definition.getNamedType)(
            (_fieldDetails$definit = fieldDetails.definition) === null || _fieldDetails$definit === void 0 ? void 0 : _fieldDetails$definit.type
          ),
          arguments: getArgumentInfo(fieldDetails.node.arguments)
        };
      }
      return fieldDetails.info;
    }
    function getArgumentInfo(args) {
      if (args === void 0 || args.length === 0) {
        return;
      }
      const values = /* @__PURE__ */ new Map();
      for (const { name: name2, value } of args) {
        values.set(name2.value, value);
      }
      return {
        nodes: args,
        values
      };
    }
    function sameArguments(ruleContext, argumentInfo1, argumentInfo2) {
      if (argumentInfo1 === void 0) {
        return argumentInfo2 === void 0;
      }
      if (argumentInfo1.nodes.length !== (argumentInfo2 === null || argumentInfo2 === void 0 ? void 0 : argumentInfo2.nodes.length)) {
        return false;
      }
      const values2 = argumentInfo2.values;
      return argumentInfo1.nodes.every((arg1) => {
        spendComplexityBudget(ruleContext, 1);
        const value2 = values2.get(arg1.name.value);
        if (value2 === void 0) {
          return false;
        }
        return stringifyValue(ruleContext, arg1.value) === stringifyValue(ruleContext, value2);
      });
    }
    function stringifyValue(ruleContext, value) {
      const cached = ruleContext.stringifiedValues.get(value);
      if (cached !== void 0) {
        return cached;
      }
      const result = JSON.stringify(value, (_key, node2) => {
        if (!(0, _ast.isNode)(node2)) {
          return node2;
        }
        switch (node2.kind) {
          case _kinds.Kind.VARIABLE:
            return [node2.kind, node2.name.value];
          case _kinds.Kind.OBJECT:
            return [
              node2.kind,
              node2.fields.slice().sort(
                (first, second) => first.name.value < second.name.value ? -1 : first.name.value > second.name.value ? 1 : 0
              )
            ];
          case _kinds.Kind.OBJECT_FIELD:
            return [node2.name.value, node2.value];
          case _kinds.Kind.LIST:
            return [node2.kind, node2.values];
          case _kinds.Kind.STRING:
            return [node2.kind, node2.value, node2.block === true];
          default:
            return [node2.kind, "value" in node2 ? node2.value : null];
        }
      });
      ruleContext.stringifiedValues.set(value, result);
      return result;
    }
    function doTypesConflict(ruleContext, type1, type2) {
      if (type1 === type2) {
        return false;
      }
      spendComplexityBudget(ruleContext, 1);
      if ((0, _definition.isListType)(type1)) {
        return (0, _definition.isListType)(type2) ? doTypesConflict(ruleContext, type1.ofType, type2.ofType) : true;
      }
      if ((0, _definition.isListType)(type2)) {
        return true;
      }
      if ((0, _definition.isNonNullType)(type1)) {
        return (0, _definition.isNonNullType)(type2) ? doTypesConflict(ruleContext, type1.ofType, type2.ofType) : true;
      }
      if ((0, _definition.isNonNullType)(type2)) {
        return true;
      }
      if ((0, _definition.isLeafType)(type1) || (0, _definition.isLeafType)(type2)) {
        return type1 !== type2;
      }
      return false;
    }
    function collectFields(validationContext, ruleContext, parentType, selectionSet) {
      const { cachedCollectFieldsResults } = ruleContext;
      let bySelectionSet = cachedCollectFieldsResults.get(parentType);
      if (bySelectionSet === void 0) {
        bySelectionSet = /* @__PURE__ */ new Map();
        cachedCollectFieldsResults.set(parentType, bySelectionSet);
      }
      const cached = bySelectionSet.get(selectionSet);
      if (cached) {
        return cached;
      }
      const fieldDetails = /* @__PURE__ */ new Map();
      const fragmentNames = /* @__PURE__ */ new Set();
      collectFieldsImpl(
        validationContext,
        parentType,
        selectionSet,
        fieldDetails,
        fragmentNames
      );
      const result = {
        groupedFieldSet: fieldDetails,
        fragmentNames: [...fragmentNames]
      };
      bySelectionSet.set(selectionSet, result);
      return result;
    }
    function collectFragmentFields(validationContext, ruleContext, fragment) {
      const fragmentType = (0, _typeFromAST.typeFromAST)(
        validationContext.getSchema(),
        fragment.typeCondition
      );
      return collectFields(
        validationContext,
        ruleContext,
        fragmentType,
        fragment.selectionSet
      );
    }
    function collectFieldsImpl(validationContext, parentType, selectionSet, fieldDetails, fragmentNames) {
      for (const selection of selectionSet.selections) {
        switch (selection.kind) {
          case _kinds.Kind.FIELD: {
            var _selection$arguments$, _selection$arguments;
            const fieldName = selection.name.value;
            let fieldDef;
            if ((0, _definition.isObjectType)(parentType) || (0, _definition.isInterfaceType)(parentType)) {
              fieldDef = parentType.getFields()[fieldName];
            }
            const responseName = selection.alias ? selection.alias.value : fieldName;
            let fieldDetailsList = fieldDetails.get(responseName);
            if (fieldDetailsList === void 0) {
              fieldDetailsList = [];
              fieldDetails.set(responseName, fieldDetailsList);
            }
            fieldDetailsList.push({
              parentType,
              node: selection,
              definition: fieldDef,
              isSimpleLeaf: ((_selection$arguments$ = (_selection$arguments = selection.arguments) === null || _selection$arguments === void 0 ? void 0 : _selection$arguments.length) !== null && _selection$arguments$ !== void 0 ? _selection$arguments$ : 0) === 0 && !selection.selectionSet
            });
            break;
          }
          case _kinds.Kind.FRAGMENT_SPREAD:
            fragmentNames.add(selection.name.value);
            break;
          case _kinds.Kind.INLINE_FRAGMENT: {
            const typeCondition = selection.typeCondition;
            const inlineFragmentType = typeCondition ? (0, _typeFromAST.typeFromAST)(
              validationContext.getSchema(),
              typeCondition
            ) : parentType;
            collectFieldsImpl(
              validationContext,
              inlineFragmentType,
              selection.selectionSet,
              fieldDetails,
              fragmentNames
            );
            break;
          }
        }
      }
    }
    function subfieldConflicts(conflicts, responseName, node1, node2) {
      if (conflicts.length > 0) {
        let message = "";
        for (const { responseName: name2, reason } of conflicts) {
          message += (message === "" ? "" : " and ") + `subfields "${maybeAbbreviate(name2)}" conflict because ${reason}`;
          if (message.length > MAX_CONFLICT_DETAIL_LENGTH) {
            break;
          }
        }
        return {
          responseName,
          reason: maybeAbbreviate(message),
          fields1: collectConflictNodes(node1, conflicts, "fields1"),
          fields2: collectConflictNodes(node2, conflicts, "fields2")
        };
      }
    }
    function collectConflictNodes(node2, conflicts, side) {
      const nodes = [node2];
      for (const conflict of conflicts) {
        const remaining = MAX_CONFLICT_NODES - nodes.length;
        const retainedNodes = conflict[side].slice(-remaining);
        nodes.push(...retainedNodes);
        if (nodes.length === MAX_CONFLICT_NODES) {
          break;
        }
      }
      return nodes;
    }
    function maybeAbbreviate(text) {
      return text.length > MAX_CONFLICT_DETAIL_LENGTH ? text.slice(0, MAX_CONFLICT_DETAIL_LENGTH) + "..." : text;
    }
    function spendComplexityBudget(ruleContext, cost) {
      ruleContext.remainingComplexityBudget -= cost;
      if (ruleContext.remainingComplexityBudget < 0) {
        throw _validationAbortedError.validationAbortedError;
      }
    }
    var PairSet = class {
      constructor() {
        this._data = /* @__PURE__ */ new Map();
      }
      has(a, b, weaklyPresent) {
        return this._has(a, b, weaklyPresent) || this._has(b, a, weaklyPresent);
      }
      _has(a, b, weaklyPresent) {
        var _this$_data$get;
        const result = (_this$_data$get = this._data.get(a)) === null || _this$_data$get === void 0 ? void 0 : _this$_data$get.get(b);
        if (result === void 0) {
          return false;
        }
        return weaklyPresent ? true : weaklyPresent === result;
      }
      add(a, b, weaklyPresent) {
        const map = this._data.get(a);
        if (map === void 0) {
          this._data.set(a, /* @__PURE__ */ new Map([[b, weaklyPresent]]));
        } else {
          map.set(b, weaklyPresent);
        }
      }
    };
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/PossibleFragmentSpreadsRule.js
var require_PossibleFragmentSpreadsRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/PossibleFragmentSpreadsRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.PossibleFragmentSpreadsRule = PossibleFragmentSpreadsRule;
    var _inspect = require_inspect();
    var _GraphQLError = require_GraphQLError();
    var _definition = require_definition();
    var _typeComparators = require_typeComparators();
    var _typeFromAST = require_typeFromAST();
    function PossibleFragmentSpreadsRule(context) {
      return {
        InlineFragment(node2) {
          const fragType = context.getType();
          const parentType = context.getParentType();
          if ((0, _definition.isCompositeType)(fragType) && (0, _definition.isCompositeType)(parentType) && !(0, _typeComparators.doTypesOverlap)(
            context.getSchema(),
            fragType,
            parentType
          )) {
            const parentTypeStr = (0, _inspect.inspect)(parentType);
            const fragTypeStr = (0, _inspect.inspect)(fragType);
            context.reportError(
              new _GraphQLError.GraphQLError(
                `Fragment cannot be spread here as objects of type "${parentTypeStr}" can never be of type "${fragTypeStr}".`,
                {
                  nodes: node2
                }
              )
            );
          }
        },
        FragmentSpread(node2) {
          const fragName = node2.name.value;
          const fragType = getFragmentType(context, fragName);
          const parentType = context.getParentType();
          if (fragType && parentType && !(0, _typeComparators.doTypesOverlap)(
            context.getSchema(),
            fragType,
            parentType
          )) {
            const parentTypeStr = (0, _inspect.inspect)(parentType);
            const fragTypeStr = (0, _inspect.inspect)(fragType);
            context.reportError(
              new _GraphQLError.GraphQLError(
                `Fragment "${fragName}" cannot be spread here as objects of type "${parentTypeStr}" can never be of type "${fragTypeStr}".`,
                {
                  nodes: node2
                }
              )
            );
          }
        }
      };
    }
    function getFragmentType(context, name2) {
      const frag = context.getFragment(name2);
      if (frag) {
        const type = (0, _typeFromAST.typeFromAST)(
          context.getSchema(),
          frag.typeCondition
        );
        if ((0, _definition.isCompositeType)(type)) {
          return type;
        }
      }
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/PossibleTypeExtensionsRule.js
var require_PossibleTypeExtensionsRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/PossibleTypeExtensionsRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.PossibleTypeExtensionsRule = PossibleTypeExtensionsRule;
    var _didYouMean = require_didYouMean();
    var _inspect = require_inspect();
    var _invariant = require_invariant();
    var _suggestionList = require_suggestionList();
    var _GraphQLError = require_GraphQLError();
    var _kinds = require_kinds();
    var _predicates = require_predicates();
    var _definition = require_definition();
    function PossibleTypeExtensionsRule(context) {
      const schema = context.getSchema();
      const definedTypes = /* @__PURE__ */ Object.create(null);
      for (const def of context.getDocument().definitions) {
        if ((0, _predicates.isTypeDefinitionNode)(def)) {
          definedTypes[def.name.value] = def;
        }
      }
      return {
        ScalarTypeExtension: checkExtension,
        ObjectTypeExtension: checkExtension,
        InterfaceTypeExtension: checkExtension,
        UnionTypeExtension: checkExtension,
        EnumTypeExtension: checkExtension,
        InputObjectTypeExtension: checkExtension
      };
      function checkExtension(node2) {
        const typeName = node2.name.value;
        const defNode = definedTypes[typeName];
        const existingType = schema === null || schema === void 0 ? void 0 : schema.getType(typeName);
        let expectedKind;
        if (defNode) {
          expectedKind = defKindToExtKind[defNode.kind];
        } else if (existingType) {
          expectedKind = typeToExtKind(existingType);
        }
        if (expectedKind) {
          if (expectedKind !== node2.kind) {
            const kindStr = extensionKindToTypeName(node2.kind);
            context.reportError(
              new _GraphQLError.GraphQLError(
                `Cannot extend non-${kindStr} type "${typeName}".`,
                {
                  nodes: defNode ? [defNode, node2] : node2
                }
              )
            );
          }
        } else {
          const allTypeNames = Object.keys({
            ...definedTypes,
            ...schema === null || schema === void 0 ? void 0 : schema.getTypeMap()
          });
          const suggestedTypes = (0, _suggestionList.suggestionList)(
            typeName,
            allTypeNames
          );
          context.reportError(
            new _GraphQLError.GraphQLError(
              `Cannot extend type "${typeName}" because it is not defined.` + (0, _didYouMean.didYouMean)(suggestedTypes),
              {
                nodes: node2.name
              }
            )
          );
        }
      }
    }
    var defKindToExtKind = {
      [_kinds.Kind.SCALAR_TYPE_DEFINITION]: _kinds.Kind.SCALAR_TYPE_EXTENSION,
      [_kinds.Kind.OBJECT_TYPE_DEFINITION]: _kinds.Kind.OBJECT_TYPE_EXTENSION,
      [_kinds.Kind.INTERFACE_TYPE_DEFINITION]: _kinds.Kind.INTERFACE_TYPE_EXTENSION,
      [_kinds.Kind.UNION_TYPE_DEFINITION]: _kinds.Kind.UNION_TYPE_EXTENSION,
      [_kinds.Kind.ENUM_TYPE_DEFINITION]: _kinds.Kind.ENUM_TYPE_EXTENSION,
      [_kinds.Kind.INPUT_OBJECT_TYPE_DEFINITION]: _kinds.Kind.INPUT_OBJECT_TYPE_EXTENSION
    };
    function typeToExtKind(type) {
      if ((0, _definition.isScalarType)(type)) {
        return _kinds.Kind.SCALAR_TYPE_EXTENSION;
      }
      if ((0, _definition.isObjectType)(type)) {
        return _kinds.Kind.OBJECT_TYPE_EXTENSION;
      }
      if ((0, _definition.isInterfaceType)(type)) {
        return _kinds.Kind.INTERFACE_TYPE_EXTENSION;
      }
      if ((0, _definition.isUnionType)(type)) {
        return _kinds.Kind.UNION_TYPE_EXTENSION;
      }
      if ((0, _definition.isEnumType)(type)) {
        return _kinds.Kind.ENUM_TYPE_EXTENSION;
      }
      if ((0, _definition.isInputObjectType)(type)) {
        return _kinds.Kind.INPUT_OBJECT_TYPE_EXTENSION;
      }
      (0, _invariant.invariant)(
        false,
        "Unexpected type: " + (0, _inspect.inspect)(type)
      );
    }
    function extensionKindToTypeName(kind) {
      switch (kind) {
        case _kinds.Kind.SCALAR_TYPE_EXTENSION:
          return "scalar";
        case _kinds.Kind.OBJECT_TYPE_EXTENSION:
          return "object";
        case _kinds.Kind.INTERFACE_TYPE_EXTENSION:
          return "interface";
        case _kinds.Kind.UNION_TYPE_EXTENSION:
          return "union";
        case _kinds.Kind.ENUM_TYPE_EXTENSION:
          return "enum";
        case _kinds.Kind.INPUT_OBJECT_TYPE_EXTENSION:
          return "input object";
        // Not reachable. All possible types have been considered
        /* c8 ignore next */
        default:
          (0, _invariant.invariant)(
            false,
            "Unexpected kind: " + (0, _inspect.inspect)(kind)
          );
      }
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/ProvidedRequiredArgumentsRule.js
var require_ProvidedRequiredArgumentsRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/ProvidedRequiredArgumentsRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.ProvidedRequiredArgumentsOnDirectivesRule = ProvidedRequiredArgumentsOnDirectivesRule;
    exports.ProvidedRequiredArgumentsRule = ProvidedRequiredArgumentsRule;
    var _inspect = require_inspect();
    var _keyMap = require_keyMap();
    var _GraphQLError = require_GraphQLError();
    var _kinds = require_kinds();
    var _printer = require_printer();
    var _definition = require_definition();
    var _directives = require_directives();
    function ProvidedRequiredArgumentsRule(context) {
      return {
        // eslint-disable-next-line new-cap
        ...ProvidedRequiredArgumentsOnDirectivesRule(context),
        Field: {
          // Validate on leave to allow for deeper errors to appear first.
          leave(fieldNode) {
            var _fieldNode$arguments;
            const fieldDef = context.getFieldDef();
            if (!fieldDef) {
              return false;
            }
            const providedArgs = new Set(
              // FIXME: https://github.com/graphql/graphql-js/issues/2203
              /* c8 ignore next */
              (_fieldNode$arguments = fieldNode.arguments) === null || _fieldNode$arguments === void 0 ? void 0 : _fieldNode$arguments.map((arg) => arg.name.value)
            );
            for (const argDef of fieldDef.args) {
              if (!providedArgs.has(argDef.name) && (0, _definition.isRequiredArgument)(argDef)) {
                const argTypeStr = (0, _inspect.inspect)(argDef.type);
                context.reportError(
                  new _GraphQLError.GraphQLError(
                    `Field "${fieldDef.name}" argument "${argDef.name}" of type "${argTypeStr}" is required, but it was not provided.`,
                    {
                      nodes: fieldNode
                    }
                  )
                );
              }
            }
          }
        }
      };
    }
    function ProvidedRequiredArgumentsOnDirectivesRule(context) {
      var _schema$getDirectives;
      const requiredArgsMap = /* @__PURE__ */ Object.create(null);
      const schema = context.getSchema();
      const definedDirectives = (_schema$getDirectives = schema === null || schema === void 0 ? void 0 : schema.getDirectives()) !== null && _schema$getDirectives !== void 0 ? _schema$getDirectives : _directives.specifiedDirectives;
      for (const directive of definedDirectives) {
        requiredArgsMap[directive.name] = (0, _keyMap.keyMap)(
          directive.args.filter(_definition.isRequiredArgument),
          (arg) => arg.name
        );
      }
      const astDefinitions = context.getDocument().definitions;
      for (const def of astDefinitions) {
        if (def.kind === _kinds.Kind.DIRECTIVE_DEFINITION) {
          var _def$arguments;
          const argNodes = (_def$arguments = def.arguments) !== null && _def$arguments !== void 0 ? _def$arguments : [];
          requiredArgsMap[def.name.value] = (0, _keyMap.keyMap)(
            argNodes.filter(isRequiredArgumentNode),
            (arg) => arg.name.value
          );
        }
      }
      return {
        Directive: {
          // Validate on leave to allow for deeper errors to appear first.
          leave(directiveNode) {
            const directiveName = directiveNode.name.value;
            const requiredArgs = requiredArgsMap[directiveName];
            if (requiredArgs) {
              var _directiveNode$argume;
              const argNodes = (_directiveNode$argume = directiveNode.arguments) !== null && _directiveNode$argume !== void 0 ? _directiveNode$argume : [];
              const argNodeMap = new Set(argNodes.map((arg) => arg.name.value));
              for (const [argName, argDef] of Object.entries(requiredArgs)) {
                if (!argNodeMap.has(argName)) {
                  const argType = (0, _definition.isType)(argDef.type) ? (0, _inspect.inspect)(argDef.type) : (0, _printer.print)(argDef.type);
                  context.reportError(
                    new _GraphQLError.GraphQLError(
                      `Directive "@${directiveName}" argument "${argName}" of type "${argType}" is required, but it was not provided.`,
                      {
                        nodes: directiveNode
                      }
                    )
                  );
                }
              }
            }
          }
        }
      };
    }
    function isRequiredArgumentNode(arg) {
      return arg.type.kind === _kinds.Kind.NON_NULL_TYPE && arg.defaultValue == null;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/ScalarLeafsRule.js
var require_ScalarLeafsRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/ScalarLeafsRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.ScalarLeafsRule = ScalarLeafsRule;
    var _inspect = require_inspect();
    var _GraphQLError = require_GraphQLError();
    var _definition = require_definition();
    function ScalarLeafsRule(context) {
      return {
        Field(node2) {
          const type = context.getType();
          const selectionSet = node2.selectionSet;
          if (type) {
            if ((0, _definition.isLeafType)((0, _definition.getNamedType)(type))) {
              if (selectionSet) {
                const fieldName = node2.name.value;
                const typeStr = (0, _inspect.inspect)(type);
                context.reportError(
                  new _GraphQLError.GraphQLError(
                    `Field "${fieldName}" must not have a selection since type "${typeStr}" has no subfields.`,
                    {
                      nodes: selectionSet
                    }
                  )
                );
              }
            } else if (!selectionSet) {
              const fieldName = node2.name.value;
              const typeStr = (0, _inspect.inspect)(type);
              context.reportError(
                new _GraphQLError.GraphQLError(
                  `Field "${fieldName}" of type "${typeStr}" must have a selection of subfields. Did you mean "${fieldName} { ... }"?`,
                  {
                    nodes: node2
                  }
                )
              );
            } else if (selectionSet.selections.length === 0) {
              const fieldName = node2.name.value;
              const typeStr = (0, _inspect.inspect)(type);
              context.reportError(
                new _GraphQLError.GraphQLError(
                  `Field "${fieldName}" of type "${typeStr}" must have at least one field selected.`,
                  {
                    nodes: node2
                  }
                )
              );
            }
          }
        }
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/printPathArray.js
var require_printPathArray = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/printPathArray.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.printPathArray = printPathArray;
    function printPathArray(path) {
      return path.map(
        (key) => typeof key === "number" ? "[" + key.toString() + "]" : "." + key
      ).join("");
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/Path.js
var require_Path = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/Path.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.addPath = addPath;
    exports.pathToArray = pathToArray;
    function addPath(prev, key, typename) {
      return {
        prev,
        key,
        typename
      };
    }
    function pathToArray(path) {
      const flattened = [];
      let curr = path;
      while (curr) {
        flattened.push(curr.key);
        curr = curr.prev;
      }
      return flattened.reverse();
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/coerceInputValue.js
var require_coerceInputValue = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/coerceInputValue.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.coerceInputValue = coerceInputValue;
    var _didYouMean = require_didYouMean();
    var _inspect = require_inspect();
    var _invariant = require_invariant();
    var _isIterableObject = require_isIterableObject();
    var _isObjectLike = require_isObjectLike();
    var _Path = require_Path();
    var _printPathArray = require_printPathArray();
    var _suggestionList = require_suggestionList();
    var _GraphQLError = require_GraphQLError();
    var _definition = require_definition();
    function coerceInputValue(inputValue, type, onError = defaultOnError, hideSuggestions) {
      return coerceInputValueImpl(
        inputValue,
        type,
        onError,
        void 0,
        hideSuggestions
      );
    }
    function defaultOnError(path, invalidValue, error) {
      let errorPrefix = "Invalid value " + (0, _inspect.inspect)(invalidValue);
      if (path.length > 0) {
        errorPrefix += ` at "value${(0, _printPathArray.printPathArray)(path)}"`;
      }
      error.message = errorPrefix + ": " + error.message;
      throw error;
    }
    function coerceInputValueImpl(inputValue, type, onError, path, hideSuggestions) {
      if ((0, _definition.isNonNullType)(type)) {
        if (inputValue != null) {
          return coerceInputValueImpl(
            inputValue,
            type.ofType,
            onError,
            path,
            hideSuggestions
          );
        }
        onError(
          (0, _Path.pathToArray)(path),
          inputValue,
          new _GraphQLError.GraphQLError(
            `Expected non-nullable type "${(0, _inspect.inspect)(
              type
            )}" not to be null.`
          )
        );
        return;
      }
      if (inputValue == null) {
        return null;
      }
      if ((0, _definition.isListType)(type)) {
        const itemType = type.ofType;
        if ((0, _isIterableObject.isIterableObject)(inputValue)) {
          return Array.from(inputValue, (itemValue, index) => {
            const itemPath = (0, _Path.addPath)(path, index, void 0);
            return coerceInputValueImpl(
              itemValue,
              itemType,
              onError,
              itemPath,
              hideSuggestions
            );
          });
        }
        return [
          coerceInputValueImpl(
            inputValue,
            itemType,
            onError,
            path,
            hideSuggestions
          )
        ];
      }
      if ((0, _definition.isInputObjectType)(type)) {
        if (!(0, _isObjectLike.isObjectLike)(inputValue) || Array.isArray(inputValue)) {
          onError(
            (0, _Path.pathToArray)(path),
            inputValue,
            new _GraphQLError.GraphQLError(
              `Expected type "${type.name}" to be an object.`
            )
          );
          return;
        }
        const coercedValue = /* @__PURE__ */ Object.create(null);
        const fieldDefs = type.getFields();
        for (const field of Object.values(fieldDefs)) {
          const fieldValue = inputValue[field.name];
          if (fieldValue === void 0) {
            if (field.defaultValue !== void 0) {
              coercedValue[field.name] = field.defaultValue;
            } else if ((0, _definition.isNonNullType)(field.type)) {
              const typeStr = (0, _inspect.inspect)(field.type);
              onError(
                (0, _Path.pathToArray)(path),
                inputValue,
                new _GraphQLError.GraphQLError(
                  `Field "${field.name}" of required type "${typeStr}" was not provided.`
                )
              );
            }
            continue;
          }
          coercedValue[field.name] = coerceInputValueImpl(
            fieldValue,
            field.type,
            onError,
            (0, _Path.addPath)(path, field.name, type.name),
            hideSuggestions
          );
        }
        for (const fieldName of Object.keys(inputValue)) {
          if (!fieldDefs[fieldName]) {
            const suggestions = hideSuggestions ? [] : (0, _suggestionList.suggestionList)(
              fieldName,
              Object.keys(type.getFields())
            );
            onError(
              (0, _Path.pathToArray)(path),
              inputValue,
              new _GraphQLError.GraphQLError(
                `Field "${fieldName}" is not defined by type "${type.name}".` + (0, _didYouMean.didYouMean)(suggestions)
              )
            );
          }
        }
        if (type.isOneOf) {
          const keys = Object.keys(coercedValue);
          if (keys.length !== 1) {
            onError(
              (0, _Path.pathToArray)(path),
              inputValue,
              new _GraphQLError.GraphQLError(
                `Exactly one key must be specified for OneOf type "${type.name}".`
              )
            );
          }
          const key = keys[0];
          const value = coercedValue[key];
          if (value === null) {
            onError(
              (0, _Path.pathToArray)(path).concat(key),
              value,
              new _GraphQLError.GraphQLError(`Field "${key}" must be non-null.`)
            );
          }
        }
        return { ...coercedValue };
      }
      if ((0, _definition.isLeafType)(type)) {
        let parseResult;
        try {
          parseResult = (0, _definition.isEnumType)(type) ? type.parseValue(inputValue, hideSuggestions) : type.parseValue(inputValue);
        } catch (error) {
          if (error instanceof _GraphQLError.GraphQLError) {
            onError((0, _Path.pathToArray)(path), inputValue, error);
          } else {
            onError(
              (0, _Path.pathToArray)(path),
              inputValue,
              new _GraphQLError.GraphQLError(
                `Expected type "${type.name}". ` + error.message,
                {
                  originalError: error
                }
              )
            );
          }
          return;
        }
        if (parseResult === void 0) {
          onError(
            (0, _Path.pathToArray)(path),
            inputValue,
            new _GraphQLError.GraphQLError(`Expected type "${type.name}".`)
          );
        }
        return parseResult;
      }
      (0, _invariant.invariant)(
        false,
        "Unexpected input type: " + (0, _inspect.inspect)(type)
      );
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/valueFromAST.js
var require_valueFromAST = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/valueFromAST.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.valueFromAST = valueFromAST;
    var _inspect = require_inspect();
    var _invariant = require_invariant();
    var _keyMap = require_keyMap();
    var _kinds = require_kinds();
    var _definition = require_definition();
    function valueFromAST(valueNode, type, variables) {
      if (!valueNode) {
        return;
      }
      if (valueNode.kind === _kinds.Kind.VARIABLE) {
        const variableName = valueNode.name.value;
        if (variables == null || !hasOwnProperty(variables, variableName) || variables[variableName] === void 0) {
          return;
        }
        const variableValue = variables[variableName];
        if (variableValue === null && (0, _definition.isNonNullType)(type)) {
          return;
        }
        return variableValue;
      }
      if ((0, _definition.isNonNullType)(type)) {
        if (valueNode.kind === _kinds.Kind.NULL) {
          return;
        }
        return valueFromAST(valueNode, type.ofType, variables);
      }
      if (valueNode.kind === _kinds.Kind.NULL) {
        return null;
      }
      if ((0, _definition.isListType)(type)) {
        const itemType = type.ofType;
        if (valueNode.kind === _kinds.Kind.LIST) {
          const coercedValues = [];
          for (const itemNode of valueNode.values) {
            if (isMissingVariable(itemNode, variables)) {
              if ((0, _definition.isNonNullType)(itemType)) {
                return;
              }
              coercedValues.push(null);
            } else {
              const itemValue = valueFromAST(itemNode, itemType, variables);
              if (itemValue === void 0) {
                return;
              }
              coercedValues.push(itemValue);
            }
          }
          return coercedValues;
        }
        const coercedValue = valueFromAST(valueNode, itemType, variables);
        if (coercedValue === void 0) {
          return;
        }
        return [coercedValue];
      }
      if ((0, _definition.isInputObjectType)(type)) {
        if (valueNode.kind !== _kinds.Kind.OBJECT) {
          return;
        }
        const coercedObj = /* @__PURE__ */ Object.create(null);
        const fieldNodes = (0, _keyMap.keyMap)(
          valueNode.fields,
          (field) => field.name.value
        );
        for (const field of Object.values(type.getFields())) {
          const fieldNode = fieldNodes[field.name];
          if (!fieldNode || isMissingVariable(fieldNode.value, variables)) {
            if (field.defaultValue !== void 0) {
              coercedObj[field.name] = field.defaultValue;
            } else if ((0, _definition.isNonNullType)(field.type)) {
              return;
            }
            continue;
          }
          const fieldValue = valueFromAST(fieldNode.value, field.type, variables);
          if (fieldValue === void 0) {
            return;
          }
          coercedObj[field.name] = fieldValue;
        }
        if (type.isOneOf) {
          const keys = Object.keys(coercedObj);
          if (keys.length !== 1) {
            return;
          }
          if (coercedObj[keys[0]] === null) {
            return;
          }
        }
        return coercedObj;
      }
      if ((0, _definition.isLeafType)(type)) {
        let result;
        try {
          result = type.parseLiteral(valueNode, variables);
        } catch (_error) {
          return;
        }
        if (result === void 0) {
          return;
        }
        return result;
      }
      (0, _invariant.invariant)(
        false,
        "Unexpected input type: " + (0, _inspect.inspect)(type)
      );
    }
    function isMissingVariable(valueNode, variables) {
      return valueNode.kind === _kinds.Kind.VARIABLE && (variables == null || !hasOwnProperty(variables, valueNode.name.value) || variables[valueNode.name.value] === void 0);
    }
    function hasOwnProperty(obj, prop) {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/execution/values.js
var require_values = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/execution/values.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.getArgumentValues = getArgumentValues;
    exports.getDirectiveValues = getDirectiveValues;
    exports.getVariableValues = getVariableValues;
    var _inspect = require_inspect();
    var _keyMap = require_keyMap();
    var _printPathArray = require_printPathArray();
    var _GraphQLError = require_GraphQLError();
    var _kinds = require_kinds();
    var _printer = require_printer();
    var _definition = require_definition();
    var _coerceInputValue = require_coerceInputValue();
    var _typeFromAST = require_typeFromAST();
    var _valueFromAST = require_valueFromAST();
    function getVariableValues(schema, varDefNodes, inputs, options) {
      const errors = [];
      const maxErrors = options === null || options === void 0 ? void 0 : options.maxErrors;
      try {
        const coerced = coerceVariableValues(
          schema,
          varDefNodes,
          inputs,
          (error) => {
            if (maxErrors != null && errors.length >= maxErrors) {
              throw new _GraphQLError.GraphQLError(
                "Too many errors processing variables, error limit reached. Execution aborted."
              );
            }
            errors.push(error);
          },
          options === null || options === void 0 ? void 0 : options.hideSuggestions
        );
        if (errors.length === 0) {
          return {
            coerced
          };
        }
      } catch (error) {
        errors.push(error);
      }
      return {
        errors
      };
    }
    function coerceVariableValues(schema, varDefNodes, inputs, onError, hideSuggestions) {
      const coercedValues = /* @__PURE__ */ Object.create(null);
      for (const varDefNode of varDefNodes) {
        const varName = varDefNode.variable.name.value;
        const varType = (0, _typeFromAST.typeFromAST)(schema, varDefNode.type);
        if (!(0, _definition.isInputType)(varType)) {
          const varTypeStr = (0, _printer.printForError)(varDefNode.type);
          onError(
            new _GraphQLError.GraphQLError(
              `Variable "$${varName}" expected value of type "${varTypeStr}" which cannot be used as an input type.`,
              {
                nodes: varDefNode.type
              }
            )
          );
          continue;
        }
        if (!hasOwnProperty(inputs, varName)) {
          if (varDefNode.defaultValue) {
            coercedValues[varName] = (0, _valueFromAST.valueFromAST)(
              varDefNode.defaultValue,
              varType
            );
          } else if ((0, _definition.isNonNullType)(varType)) {
            const varTypeStr = (0, _inspect.inspect)(varType);
            onError(
              new _GraphQLError.GraphQLError(
                `Variable "$${varName}" of required type "${varTypeStr}" was not provided.`,
                {
                  nodes: varDefNode
                }
              )
            );
          }
          continue;
        }
        const value = inputs[varName];
        if (value === null && (0, _definition.isNonNullType)(varType)) {
          const varTypeStr = (0, _inspect.inspect)(varType);
          onError(
            new _GraphQLError.GraphQLError(
              `Variable "$${varName}" of non-null type "${varTypeStr}" must not be null.`,
              {
                nodes: varDefNode
              }
            )
          );
          continue;
        }
        coercedValues[varName] = (0, _coerceInputValue.coerceInputValue)(
          value,
          varType,
          (path, invalidValue, error) => {
            let prefix = `Variable "$${varName}" got invalid value ` + (0, _inspect.inspect)(invalidValue);
            if (path.length > 0) {
              prefix += ` at "${varName}${(0, _printPathArray.printPathArray)(
                path
              )}"`;
            }
            onError(
              new _GraphQLError.GraphQLError(prefix + "; " + error.message, {
                nodes: varDefNode,
                originalError: error
              })
            );
          },
          hideSuggestions
        );
      }
      return { ...coercedValues };
    }
    function getArgumentValues(def, node2, variableValues) {
      var _node$arguments;
      const coercedValues = /* @__PURE__ */ Object.create(null);
      const argumentNodes = (_node$arguments = node2.arguments) !== null && _node$arguments !== void 0 ? _node$arguments : [];
      const argNodeMap = (0, _keyMap.keyMap)(
        argumentNodes,
        (arg) => arg.name.value
      );
      for (const argDef of def.args) {
        const name2 = argDef.name;
        const argType = argDef.type;
        const argumentNode = argNodeMap[name2];
        if (!argumentNode) {
          if (argDef.defaultValue !== void 0) {
            coercedValues[name2] = argDef.defaultValue;
          } else if ((0, _definition.isNonNullType)(argType)) {
            throw new _GraphQLError.GraphQLError(
              `Argument "${name2}" of required type "${(0, _inspect.inspect)(
                argType
              )}" was not provided.`,
              {
                nodes: node2
              }
            );
          }
          continue;
        }
        const valueNode = argumentNode.value;
        let isNull = valueNode.kind === _kinds.Kind.NULL;
        if (valueNode.kind === _kinds.Kind.VARIABLE) {
          const variableName = valueNode.name.value;
          if (variableValues == null || !hasOwnProperty(variableValues, variableName)) {
            if (argDef.defaultValue !== void 0) {
              coercedValues[name2] = argDef.defaultValue;
            } else if ((0, _definition.isNonNullType)(argType)) {
              throw new _GraphQLError.GraphQLError(
                `Argument "${name2}" of required type "${(0, _inspect.inspect)(
                  argType
                )}" was provided the variable "$${variableName}" which was not provided a runtime value.`,
                {
                  nodes: valueNode
                }
              );
            }
            continue;
          }
          isNull = variableValues[variableName] == null;
        }
        if (isNull && (0, _definition.isNonNullType)(argType)) {
          throw new _GraphQLError.GraphQLError(
            `Argument "${name2}" of non-null type "${(0, _inspect.inspect)(
              argType
            )}" must not be null.`,
            {
              nodes: valueNode
            }
          );
        }
        const coercedValue = (0, _valueFromAST.valueFromAST)(
          valueNode,
          argType,
          variableValues
        );
        if (coercedValue === void 0) {
          throw new _GraphQLError.GraphQLError(
            `Argument "${name2}" has invalid value ${(0, _printer.printForError)(
              valueNode
            )}.`,
            {
              nodes: valueNode
            }
          );
        }
        coercedValues[name2] = coercedValue;
      }
      return { ...coercedValues };
    }
    function getDirectiveValues(directiveDef, node2, variableValues) {
      var _node$directives;
      const directiveNode = (_node$directives = node2.directives) === null || _node$directives === void 0 ? void 0 : _node$directives.find(
        (directive) => directive.name.value === directiveDef.name
      );
      if (directiveNode) {
        return getArgumentValues(directiveDef, directiveNode, variableValues);
      }
    }
    function hasOwnProperty(obj, prop) {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/execution/collectFields.js
var require_collectFields = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/execution/collectFields.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.collectFields = collectFields;
    exports.collectSubfields = collectSubfields;
    var _kinds = require_kinds();
    var _definition = require_definition();
    var _directives = require_directives();
    var _typeFromAST = require_typeFromAST();
    var _values = require_values();
    function collectFields(schema, fragments, variableValues, runtimeType, selectionSet, onSelectionSet) {
      const fields = /* @__PURE__ */ new Map();
      collectFieldsImpl(
        schema,
        fragments,
        variableValues,
        runtimeType,
        selectionSet,
        fields,
        /* @__PURE__ */ new Set(),
        onSelectionSet
      );
      return fields;
    }
    function collectSubfields(schema, fragments, variableValues, returnType, fieldNodes) {
      const subFieldNodes = /* @__PURE__ */ new Map();
      const visitedFragmentNames = /* @__PURE__ */ new Set();
      for (const node2 of fieldNodes) {
        if (node2.selectionSet) {
          collectFieldsImpl(
            schema,
            fragments,
            variableValues,
            returnType,
            node2.selectionSet,
            subFieldNodes,
            visitedFragmentNames
          );
        }
      }
      return subFieldNodes;
    }
    function collectFieldsImpl(schema, fragments, variableValues, runtimeType, selectionSet, fields, visitedFragmentNames, onSelectionSet) {
      onSelectionSet === null || onSelectionSet === void 0 ? void 0 : onSelectionSet(selectionSet);
      for (const selection of selectionSet.selections) {
        switch (selection.kind) {
          case _kinds.Kind.FIELD: {
            if (!shouldIncludeNode(variableValues, selection)) {
              continue;
            }
            const name2 = getFieldEntryKey(selection);
            const fieldList = fields.get(name2);
            if (fieldList !== void 0) {
              fieldList.push(selection);
            } else {
              fields.set(name2, [selection]);
            }
            break;
          }
          case _kinds.Kind.INLINE_FRAGMENT: {
            if (!shouldIncludeNode(variableValues, selection) || !doesFragmentConditionMatch(schema, selection, runtimeType)) {
              continue;
            }
            collectFieldsImpl(
              schema,
              fragments,
              variableValues,
              runtimeType,
              selection.selectionSet,
              fields,
              visitedFragmentNames,
              onSelectionSet
            );
            break;
          }
          case _kinds.Kind.FRAGMENT_SPREAD: {
            const fragName = selection.name.value;
            if (visitedFragmentNames.has(fragName) || !shouldIncludeNode(variableValues, selection)) {
              continue;
            }
            visitedFragmentNames.add(fragName);
            const fragment = fragments[fragName];
            if (!fragment || !doesFragmentConditionMatch(schema, fragment, runtimeType)) {
              continue;
            }
            collectFieldsImpl(
              schema,
              fragments,
              variableValues,
              runtimeType,
              fragment.selectionSet,
              fields,
              visitedFragmentNames,
              onSelectionSet
            );
            break;
          }
        }
      }
    }
    function shouldIncludeNode(variableValues, node2) {
      const skip = (0, _values.getDirectiveValues)(
        _directives.GraphQLSkipDirective,
        node2,
        variableValues
      );
      if ((skip === null || skip === void 0 ? void 0 : skip.if) === true) {
        return false;
      }
      const include = (0, _values.getDirectiveValues)(
        _directives.GraphQLIncludeDirective,
        node2,
        variableValues
      );
      if ((include === null || include === void 0 ? void 0 : include.if) === false) {
        return false;
      }
      return true;
    }
    function doesFragmentConditionMatch(schema, fragment, type) {
      const typeConditionNode = fragment.typeCondition;
      if (!typeConditionNode) {
        return true;
      }
      const conditionalType = (0, _typeFromAST.typeFromAST)(
        schema,
        typeConditionNode
      );
      if (conditionalType === type) {
        return true;
      }
      if ((0, _definition.isAbstractType)(conditionalType)) {
        return schema.isSubType(conditionalType, type);
      }
      return false;
    }
    function getFieldEntryKey(node2) {
      return node2.alias ? node2.alias.value : node2.name.value;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/SingleFieldSubscriptionsRule.js
var require_SingleFieldSubscriptionsRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/SingleFieldSubscriptionsRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.SingleFieldSubscriptionsRule = SingleFieldSubscriptionsRule;
    var _GraphQLError = require_GraphQLError();
    var _kinds = require_kinds();
    var _collectFields = require_collectFields();
    function SingleFieldSubscriptionsRule(context) {
      let fragments;
      function reserveSelectionSetWork(selectionSet) {
        context.spendFragmentWork(selectionSet.selections.length);
        for (const selection of selectionSet.selections) {
          const directives = selection.directives;
          if (directives !== void 0) {
            context.spendFragmentWork(directives.length);
            for (const directive of directives) {
              if (directive.name.value === "skip" || directive.name.value === "include") {
                var _directive$arguments$, _directive$arguments;
                context.spendFragmentWork(
                  (_directive$arguments$ = (_directive$arguments = directive.arguments) === null || _directive$arguments === void 0 ? void 0 : _directive$arguments.length) !== null && _directive$arguments$ !== void 0 ? _directive$arguments$ : 0
                );
              }
            }
          }
        }
      }
      return {
        OperationDefinition(node2) {
          if (node2.operation === "subscription") {
            const schema = context.getSchema();
            const subscriptionType = schema.getSubscriptionType();
            if (subscriptionType) {
              const operationName = node2.name ? node2.name.value : null;
              const variableValues = /* @__PURE__ */ Object.create(null);
              if (fragments === void 0) {
                fragments = /* @__PURE__ */ Object.create(null);
                const definitions = context.getDocument().definitions;
                context.spendFragmentWork(definitions.length);
                for (const definition of definitions) {
                  if (definition.kind === _kinds.Kind.FRAGMENT_DEFINITION) {
                    fragments[definition.name.value] = definition;
                  }
                }
              }
              const fields = (0, _collectFields.collectFields)(
                schema,
                fragments,
                variableValues,
                subscriptionType,
                node2.selectionSet,
                reserveSelectionSetWork
              );
              if (fields.size > 1) {
                const fieldSelectionLists = [...fields.values()];
                const extraFieldSelectionLists = fieldSelectionLists.slice(1);
                const extraFieldSelections = extraFieldSelectionLists.flat();
                context.reportError(
                  new _GraphQLError.GraphQLError(
                    operationName != null ? `Subscription "${operationName}" must select only one top level field.` : "Anonymous Subscription must select only one top level field.",
                    {
                      nodes: extraFieldSelections
                    }
                  )
                );
              }
              for (const fieldNodes of fields.values()) {
                const field = fieldNodes[0];
                const fieldName = field.name.value;
                if (fieldName.startsWith("__")) {
                  context.reportError(
                    new _GraphQLError.GraphQLError(
                      operationName != null ? `Subscription "${operationName}" must not select an introspection top level field.` : "Anonymous Subscription must not select an introspection top level field.",
                      {
                        nodes: fieldNodes
                      }
                    )
                  );
                }
              }
            }
          }
        }
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/groupBy.js
var require_groupBy = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/groupBy.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.groupBy = groupBy;
    function groupBy(list2, keyFn) {
      const result = /* @__PURE__ */ new Map();
      for (const item of list2) {
        const key = keyFn(item);
        const group = result.get(key);
        if (group === void 0) {
          result.set(key, [item]);
        } else {
          group.push(item);
        }
      }
      return result;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueArgumentDefinitionNamesRule.js
var require_UniqueArgumentDefinitionNamesRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueArgumentDefinitionNamesRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.UniqueArgumentDefinitionNamesRule = UniqueArgumentDefinitionNamesRule;
    var _groupBy = require_groupBy();
    var _GraphQLError = require_GraphQLError();
    function UniqueArgumentDefinitionNamesRule(context) {
      return {
        DirectiveDefinition(directiveNode) {
          var _directiveNode$argume;
          const argumentNodes = (_directiveNode$argume = directiveNode.arguments) !== null && _directiveNode$argume !== void 0 ? _directiveNode$argume : [];
          return checkArgUniqueness(`@${directiveNode.name.value}`, argumentNodes);
        },
        InterfaceTypeDefinition: checkArgUniquenessPerField,
        InterfaceTypeExtension: checkArgUniquenessPerField,
        ObjectTypeDefinition: checkArgUniquenessPerField,
        ObjectTypeExtension: checkArgUniquenessPerField
      };
      function checkArgUniquenessPerField(typeNode) {
        var _typeNode$fields;
        const typeName = typeNode.name.value;
        const fieldNodes = (_typeNode$fields = typeNode.fields) !== null && _typeNode$fields !== void 0 ? _typeNode$fields : [];
        for (const fieldDef of fieldNodes) {
          var _fieldDef$arguments;
          const fieldName = fieldDef.name.value;
          const argumentNodes = (_fieldDef$arguments = fieldDef.arguments) !== null && _fieldDef$arguments !== void 0 ? _fieldDef$arguments : [];
          checkArgUniqueness(`${typeName}.${fieldName}`, argumentNodes);
        }
        return false;
      }
      function checkArgUniqueness(parentName, argumentNodes) {
        const seenArgs = (0, _groupBy.groupBy)(
          argumentNodes,
          (arg) => arg.name.value
        );
        for (const [argName, argNodes] of seenArgs) {
          if (argNodes.length > 1) {
            context.reportError(
              new _GraphQLError.GraphQLError(
                `Argument "${parentName}(${argName}:)" can only be defined once.`,
                {
                  nodes: argNodes.map((node2) => node2.name)
                }
              )
            );
          }
        }
        return false;
      }
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueArgumentNamesRule.js
var require_UniqueArgumentNamesRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueArgumentNamesRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.UniqueArgumentNamesRule = UniqueArgumentNamesRule;
    var _groupBy = require_groupBy();
    var _GraphQLError = require_GraphQLError();
    function UniqueArgumentNamesRule(context) {
      return {
        Field: checkArgUniqueness,
        Directive: checkArgUniqueness
      };
      function checkArgUniqueness(parentNode) {
        var _parentNode$arguments;
        const argumentNodes = (_parentNode$arguments = parentNode.arguments) !== null && _parentNode$arguments !== void 0 ? _parentNode$arguments : [];
        const seenArgs = (0, _groupBy.groupBy)(
          argumentNodes,
          (arg) => arg.name.value
        );
        for (const [argName, argNodes] of seenArgs) {
          if (argNodes.length > 1) {
            context.reportError(
              new _GraphQLError.GraphQLError(
                `There can be only one argument named "${argName}".`,
                {
                  nodes: argNodes.map((node2) => node2.name)
                }
              )
            );
          }
        }
      }
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueDirectiveNamesRule.js
var require_UniqueDirectiveNamesRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueDirectiveNamesRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.UniqueDirectiveNamesRule = UniqueDirectiveNamesRule;
    var _GraphQLError = require_GraphQLError();
    function UniqueDirectiveNamesRule(context) {
      const knownDirectiveNames = /* @__PURE__ */ Object.create(null);
      const schema = context.getSchema();
      return {
        DirectiveDefinition(node2) {
          const directiveName = node2.name.value;
          if (schema !== null && schema !== void 0 && schema.getDirective(directiveName)) {
            context.reportError(
              new _GraphQLError.GraphQLError(
                `Directive "@${directiveName}" already exists in the schema. It cannot be redefined.`,
                {
                  nodes: node2.name
                }
              )
            );
            return;
          }
          if (knownDirectiveNames[directiveName]) {
            context.reportError(
              new _GraphQLError.GraphQLError(
                `There can be only one directive named "@${directiveName}".`,
                {
                  nodes: [knownDirectiveNames[directiveName], node2.name]
                }
              )
            );
          } else {
            knownDirectiveNames[directiveName] = node2.name;
          }
          return false;
        }
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueDirectivesPerLocationRule.js
var require_UniqueDirectivesPerLocationRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueDirectivesPerLocationRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.UniqueDirectivesPerLocationRule = UniqueDirectivesPerLocationRule;
    var _GraphQLError = require_GraphQLError();
    var _kinds = require_kinds();
    var _predicates = require_predicates();
    var _directives = require_directives();
    function UniqueDirectivesPerLocationRule(context) {
      const uniqueDirectiveMap = /* @__PURE__ */ Object.create(null);
      const schema = context.getSchema();
      const definedDirectives = schema ? schema.getDirectives() : _directives.specifiedDirectives;
      for (const directive of definedDirectives) {
        uniqueDirectiveMap[directive.name] = !directive.isRepeatable;
      }
      const astDefinitions = context.getDocument().definitions;
      for (const def of astDefinitions) {
        if (def.kind === _kinds.Kind.DIRECTIVE_DEFINITION) {
          uniqueDirectiveMap[def.name.value] = !def.repeatable;
        }
      }
      const schemaDirectives = /* @__PURE__ */ Object.create(null);
      const typeDirectivesMap = /* @__PURE__ */ Object.create(null);
      const directiveDirectivesMap = /* @__PURE__ */ Object.create(null);
      return {
        // Many different AST nodes may contain directives. Rather than listing
        // them all, just listen for entering any node, and check to see if it
        // defines any directives.
        enter(node2) {
          if (!("directives" in node2) || !node2.directives) {
            return;
          }
          let seenDirectives;
          if (node2.kind === _kinds.Kind.SCHEMA_DEFINITION || node2.kind === _kinds.Kind.SCHEMA_EXTENSION) {
            seenDirectives = schemaDirectives;
          } else if ((0, _predicates.isTypeDefinitionNode)(node2) || (0, _predicates.isTypeExtensionNode)(node2)) {
            const typeName = node2.name.value;
            seenDirectives = typeDirectivesMap[typeName];
            if (seenDirectives === void 0) {
              typeDirectivesMap[typeName] = seenDirectives = /* @__PURE__ */ Object.create(null);
            }
          } else if (node2.kind === _kinds.Kind.DIRECTIVE_DEFINITION || node2.kind === _kinds.Kind.DIRECTIVE_EXTENSION) {
            const directiveName = node2.name.value;
            seenDirectives = directiveDirectivesMap[directiveName];
            if (seenDirectives === void 0) {
              directiveDirectivesMap[directiveName] = seenDirectives = /* @__PURE__ */ Object.create(null);
            }
          } else {
            seenDirectives = /* @__PURE__ */ Object.create(null);
          }
          for (const directive of node2.directives) {
            const directiveName = directive.name.value;
            if (uniqueDirectiveMap[directiveName]) {
              if (seenDirectives[directiveName]) {
                context.reportError(
                  new _GraphQLError.GraphQLError(
                    `The directive "@${directiveName}" can only be used once at this location.`,
                    {
                      nodes: [seenDirectives[directiveName], directive]
                    }
                  )
                );
              } else {
                seenDirectives[directiveName] = directive;
              }
            }
          }
        }
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueEnumValueNamesRule.js
var require_UniqueEnumValueNamesRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueEnumValueNamesRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.UniqueEnumValueNamesRule = UniqueEnumValueNamesRule;
    var _GraphQLError = require_GraphQLError();
    var _definition = require_definition();
    function UniqueEnumValueNamesRule(context) {
      const schema = context.getSchema();
      const existingTypeMap = schema ? schema.getTypeMap() : /* @__PURE__ */ Object.create(null);
      const knownValueNames = /* @__PURE__ */ Object.create(null);
      return {
        EnumTypeDefinition: checkValueUniqueness,
        EnumTypeExtension: checkValueUniqueness
      };
      function checkValueUniqueness(node2) {
        var _node$values;
        const typeName = node2.name.value;
        if (!knownValueNames[typeName]) {
          knownValueNames[typeName] = /* @__PURE__ */ Object.create(null);
        }
        const valueNodes = (_node$values = node2.values) !== null && _node$values !== void 0 ? _node$values : [];
        const valueNames = knownValueNames[typeName];
        for (const valueDef of valueNodes) {
          const valueName = valueDef.name.value;
          const existingType = existingTypeMap[typeName];
          if ((0, _definition.isEnumType)(existingType) && existingType.getValue(valueName)) {
            context.reportError(
              new _GraphQLError.GraphQLError(
                `Enum value "${typeName}.${valueName}" already exists in the schema. It cannot also be defined in this type extension.`,
                {
                  nodes: valueDef.name
                }
              )
            );
          } else if (valueNames[valueName]) {
            context.reportError(
              new _GraphQLError.GraphQLError(
                `Enum value "${typeName}.${valueName}" can only be defined once.`,
                {
                  nodes: [valueNames[valueName], valueDef.name]
                }
              )
            );
          } else {
            valueNames[valueName] = valueDef.name;
          }
        }
        return false;
      }
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueFieldDefinitionNamesRule.js
var require_UniqueFieldDefinitionNamesRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueFieldDefinitionNamesRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.UniqueFieldDefinitionNamesRule = UniqueFieldDefinitionNamesRule;
    var _GraphQLError = require_GraphQLError();
    var _definition = require_definition();
    function UniqueFieldDefinitionNamesRule(context) {
      const schema = context.getSchema();
      const existingTypeMap = schema ? schema.getTypeMap() : /* @__PURE__ */ Object.create(null);
      const knownFieldNames = /* @__PURE__ */ Object.create(null);
      return {
        InputObjectTypeDefinition: checkFieldUniqueness,
        InputObjectTypeExtension: checkFieldUniqueness,
        InterfaceTypeDefinition: checkFieldUniqueness,
        InterfaceTypeExtension: checkFieldUniqueness,
        ObjectTypeDefinition: checkFieldUniqueness,
        ObjectTypeExtension: checkFieldUniqueness
      };
      function checkFieldUniqueness(node2) {
        var _node$fields;
        const typeName = node2.name.value;
        if (!knownFieldNames[typeName]) {
          knownFieldNames[typeName] = /* @__PURE__ */ Object.create(null);
        }
        const fieldNodes = (_node$fields = node2.fields) !== null && _node$fields !== void 0 ? _node$fields : [];
        const fieldNames = knownFieldNames[typeName];
        for (const fieldDef of fieldNodes) {
          const fieldName = fieldDef.name.value;
          if (hasField(existingTypeMap[typeName], fieldName)) {
            context.reportError(
              new _GraphQLError.GraphQLError(
                `Field "${typeName}.${fieldName}" already exists in the schema. It cannot also be defined in this type extension.`,
                {
                  nodes: fieldDef.name
                }
              )
            );
          } else if (fieldNames[fieldName]) {
            context.reportError(
              new _GraphQLError.GraphQLError(
                `Field "${typeName}.${fieldName}" can only be defined once.`,
                {
                  nodes: [fieldNames[fieldName], fieldDef.name]
                }
              )
            );
          } else {
            fieldNames[fieldName] = fieldDef.name;
          }
        }
        return false;
      }
    }
    function hasField(type, fieldName) {
      if ((0, _definition.isObjectType)(type) || (0, _definition.isInterfaceType)(type) || (0, _definition.isInputObjectType)(type)) {
        return type.getFields()[fieldName] != null;
      }
      return false;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueFragmentNamesRule.js
var require_UniqueFragmentNamesRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueFragmentNamesRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.UniqueFragmentNamesRule = UniqueFragmentNamesRule;
    var _GraphQLError = require_GraphQLError();
    function UniqueFragmentNamesRule(context) {
      const knownFragmentNames = /* @__PURE__ */ Object.create(null);
      return {
        OperationDefinition: () => false,
        FragmentDefinition(node2) {
          const fragmentName = node2.name.value;
          if (knownFragmentNames[fragmentName]) {
            context.reportError(
              new _GraphQLError.GraphQLError(
                `There can be only one fragment named "${fragmentName}".`,
                {
                  nodes: [knownFragmentNames[fragmentName], node2.name]
                }
              )
            );
          } else {
            knownFragmentNames[fragmentName] = node2.name;
          }
          return false;
        }
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueInputFieldNamesRule.js
var require_UniqueInputFieldNamesRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueInputFieldNamesRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.UniqueInputFieldNamesRule = UniqueInputFieldNamesRule;
    var _invariant = require_invariant();
    var _GraphQLError = require_GraphQLError();
    function UniqueInputFieldNamesRule(context) {
      const knownNameStack = [];
      let knownNames = /* @__PURE__ */ Object.create(null);
      return {
        ObjectValue: {
          enter() {
            knownNameStack.push(knownNames);
            knownNames = /* @__PURE__ */ Object.create(null);
          },
          leave() {
            const prevKnownNames = knownNameStack.pop();
            prevKnownNames || (0, _invariant.invariant)(false);
            knownNames = prevKnownNames;
          }
        },
        ObjectField(node2) {
          const fieldName = node2.name.value;
          if (knownNames[fieldName]) {
            context.reportError(
              new _GraphQLError.GraphQLError(
                `There can be only one input field named "${fieldName}".`,
                {
                  nodes: [knownNames[fieldName], node2.name]
                }
              )
            );
          } else {
            knownNames[fieldName] = node2.name;
          }
        }
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueOperationNamesRule.js
var require_UniqueOperationNamesRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueOperationNamesRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.UniqueOperationNamesRule = UniqueOperationNamesRule;
    var _GraphQLError = require_GraphQLError();
    function UniqueOperationNamesRule(context) {
      const knownOperationNames = /* @__PURE__ */ Object.create(null);
      return {
        OperationDefinition(node2) {
          const operationName = node2.name;
          if (operationName) {
            if (knownOperationNames[operationName.value]) {
              context.reportError(
                new _GraphQLError.GraphQLError(
                  `There can be only one operation named "${operationName.value}".`,
                  {
                    nodes: [
                      knownOperationNames[operationName.value],
                      operationName
                    ]
                  }
                )
              );
            } else {
              knownOperationNames[operationName.value] = operationName;
            }
          }
          return false;
        },
        FragmentDefinition: () => false
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueOperationTypesRule.js
var require_UniqueOperationTypesRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueOperationTypesRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.UniqueOperationTypesRule = UniqueOperationTypesRule;
    var _GraphQLError = require_GraphQLError();
    function UniqueOperationTypesRule(context) {
      const schema = context.getSchema();
      const definedOperationTypes = /* @__PURE__ */ Object.create(null);
      const existingOperationTypes = schema ? {
        query: schema.getQueryType(),
        mutation: schema.getMutationType(),
        subscription: schema.getSubscriptionType()
      } : {};
      return {
        SchemaDefinition: checkOperationTypes,
        SchemaExtension: checkOperationTypes
      };
      function checkOperationTypes(node2) {
        var _node$operationTypes;
        const operationTypesNodes = (_node$operationTypes = node2.operationTypes) !== null && _node$operationTypes !== void 0 ? _node$operationTypes : [];
        for (const operationType of operationTypesNodes) {
          const operation = operationType.operation;
          const alreadyDefinedOperationType = definedOperationTypes[operation];
          if (existingOperationTypes[operation]) {
            context.reportError(
              new _GraphQLError.GraphQLError(
                `Type for ${operation} already defined in the schema. It cannot be redefined.`,
                {
                  nodes: operationType
                }
              )
            );
          } else if (alreadyDefinedOperationType) {
            context.reportError(
              new _GraphQLError.GraphQLError(
                `There can be only one ${operation} type in schema.`,
                {
                  nodes: [alreadyDefinedOperationType, operationType]
                }
              )
            );
          } else {
            definedOperationTypes[operation] = operationType;
          }
        }
        return false;
      }
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueTypeNamesRule.js
var require_UniqueTypeNamesRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueTypeNamesRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.UniqueTypeNamesRule = UniqueTypeNamesRule;
    var _GraphQLError = require_GraphQLError();
    function UniqueTypeNamesRule(context) {
      const knownTypeNames = /* @__PURE__ */ Object.create(null);
      const schema = context.getSchema();
      return {
        ScalarTypeDefinition: checkTypeName,
        ObjectTypeDefinition: checkTypeName,
        InterfaceTypeDefinition: checkTypeName,
        UnionTypeDefinition: checkTypeName,
        EnumTypeDefinition: checkTypeName,
        InputObjectTypeDefinition: checkTypeName
      };
      function checkTypeName(node2) {
        const typeName = node2.name.value;
        if (schema !== null && schema !== void 0 && schema.getType(typeName)) {
          context.reportError(
            new _GraphQLError.GraphQLError(
              `Type "${typeName}" already exists in the schema. It cannot also be defined in this type definition.`,
              {
                nodes: node2.name
              }
            )
          );
          return;
        }
        if (knownTypeNames[typeName]) {
          context.reportError(
            new _GraphQLError.GraphQLError(
              `There can be only one type named "${typeName}".`,
              {
                nodes: [knownTypeNames[typeName], node2.name]
              }
            )
          );
        } else {
          knownTypeNames[typeName] = node2.name;
        }
        return false;
      }
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueVariableNamesRule.js
var require_UniqueVariableNamesRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/UniqueVariableNamesRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.UniqueVariableNamesRule = UniqueVariableNamesRule;
    var _groupBy = require_groupBy();
    var _GraphQLError = require_GraphQLError();
    function UniqueVariableNamesRule(context) {
      return {
        OperationDefinition(operationNode) {
          var _operationNode$variab;
          const variableDefinitions = (_operationNode$variab = operationNode.variableDefinitions) !== null && _operationNode$variab !== void 0 ? _operationNode$variab : [];
          const seenVariableDefinitions = (0, _groupBy.groupBy)(
            variableDefinitions,
            (node2) => node2.variable.name.value
          );
          for (const [variableName, variableNodes] of seenVariableDefinitions) {
            if (variableNodes.length > 1) {
              context.reportError(
                new _GraphQLError.GraphQLError(
                  `There can be only one variable named "$${variableName}".`,
                  {
                    nodes: variableNodes.map((node2) => node2.variable.name)
                  }
                )
              );
            }
          }
        }
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/ValuesOfCorrectTypeRule.js
var require_ValuesOfCorrectTypeRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/ValuesOfCorrectTypeRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.ValuesOfCorrectTypeRule = ValuesOfCorrectTypeRule;
    var _didYouMean = require_didYouMean();
    var _inspect = require_inspect();
    var _keyMap = require_keyMap();
    var _suggestionList = require_suggestionList();
    var _GraphQLError = require_GraphQLError();
    var _kinds = require_kinds();
    var _printer = require_printer();
    var _definition = require_definition();
    function ValuesOfCorrectTypeRule(context) {
      return {
        ListValue(node2) {
          const type = (0, _definition.getNullableType)(
            context.getParentInputType()
          );
          if (!(0, _definition.isListType)(type)) {
            isValidValueNode(context, node2);
            return false;
          }
        },
        ObjectValue(node2) {
          const type = (0, _definition.getNamedType)(context.getInputType());
          if (!(0, _definition.isInputObjectType)(type)) {
            isValidValueNode(context, node2);
            return false;
          }
          const fieldNodeMap = (0, _keyMap.keyMap)(
            node2.fields,
            (field) => field.name.value
          );
          for (const fieldDef of Object.values(type.getFields())) {
            const fieldNode = fieldNodeMap[fieldDef.name];
            if (!fieldNode && (0, _definition.isRequiredInputField)(fieldDef)) {
              const typeStr = (0, _inspect.inspect)(fieldDef.type);
              context.reportError(
                new _GraphQLError.GraphQLError(
                  `Field "${type.name}.${fieldDef.name}" of required type "${typeStr}" was not provided.`,
                  {
                    nodes: node2
                  }
                )
              );
            }
          }
          if (type.isOneOf) {
            validateOneOfInputObject(context, node2, type, fieldNodeMap);
          }
        },
        ObjectField(node2) {
          const parentType = (0, _definition.getNamedType)(
            context.getParentInputType()
          );
          const fieldType = context.getInputType();
          if (!fieldType && (0, _definition.isInputObjectType)(parentType)) {
            const suggestions = context.hideSuggestions ? [] : (0, _suggestionList.suggestionList)(
              node2.name.value,
              Object.keys(parentType.getFields())
            );
            context.reportError(
              new _GraphQLError.GraphQLError(
                `Field "${node2.name.value}" is not defined by type "${parentType.name}".` + (0, _didYouMean.didYouMean)(suggestions),
                {
                  nodes: node2
                }
              )
            );
          }
        },
        NullValue(node2) {
          const type = context.getInputType();
          if ((0, _definition.isNonNullType)(type)) {
            context.reportError(
              new _GraphQLError.GraphQLError(
                `Expected value of type "${(0, _inspect.inspect)(
                  type
                )}", found ${(0, _printer.printForError)(node2)}.`,
                {
                  nodes: node2
                }
              )
            );
          }
        },
        EnumValue: (node2) => isValidValueNode(context, node2),
        IntValue: (node2) => isValidValueNode(context, node2),
        FloatValue: (node2) => isValidValueNode(context, node2),
        // Descriptions are string values that would not validate according
        // to the below logic, but since (per the specification) descriptions must
        // not affect validation, they are ignored entirely when visiting the AST
        // and do not require special handling.
        // See https://spec.graphql.org/draft/#sec-Descriptions
        StringValue: (node2) => isValidValueNode(context, node2),
        BooleanValue: (node2) => isValidValueNode(context, node2)
      };
    }
    function isValidValueNode(context, node2) {
      const locationType = context.getInputType();
      if (!locationType) {
        return;
      }
      const type = (0, _definition.getNamedType)(locationType);
      if (!(0, _definition.isLeafType)(type)) {
        const typeStr = (0, _inspect.inspect)(locationType);
        context.reportError(
          new _GraphQLError.GraphQLError(
            `Expected value of type "${typeStr}", found ${(0, _printer.printForError)(node2)}.`,
            {
              nodes: node2
            }
          )
        );
        return;
      }
      try {
        const parseResult = (0, _definition.isEnumType)(type) ? type.parseLiteral(
          node2,
          void 0,
          /* variables */
          context.hideSuggestions
        ) : type.parseLiteral(
          node2,
          void 0
          /* variables */
        );
        if (parseResult === void 0) {
          const typeStr = (0, _inspect.inspect)(locationType);
          context.reportError(
            new _GraphQLError.GraphQLError(
              `Expected value of type "${typeStr}", found ${(0, _printer.printForError)(node2)}.`,
              {
                nodes: node2
              }
            )
          );
        }
      } catch (error) {
        const typeStr = (0, _inspect.inspect)(locationType);
        if (error instanceof _GraphQLError.GraphQLError) {
          context.reportError(error);
        } else {
          context.reportError(
            new _GraphQLError.GraphQLError(
              `Expected value of type "${typeStr}", found ${(0, _printer.printForError)(node2)}; ` + error.message,
              {
                nodes: node2,
                originalError: error
              }
            )
          );
        }
      }
    }
    function validateOneOfInputObject(context, node2, type, fieldNodeMap) {
      var _fieldNodeMap$keys$;
      const keys = Object.keys(fieldNodeMap);
      const isNotExactlyOneField = keys.length !== 1;
      if (isNotExactlyOneField) {
        context.reportError(
          new _GraphQLError.GraphQLError(
            `OneOf Input Object "${type.name}" must specify exactly one key.`,
            {
              nodes: [node2]
            }
          )
        );
        return;
      }
      const value = (_fieldNodeMap$keys$ = fieldNodeMap[keys[0]]) === null || _fieldNodeMap$keys$ === void 0 ? void 0 : _fieldNodeMap$keys$.value;
      const isNullLiteral = !value || value.kind === _kinds.Kind.NULL;
      if (isNullLiteral) {
        context.reportError(
          new _GraphQLError.GraphQLError(
            `Field "${type.name}.${keys[0]}" must be non-null.`,
            {
              nodes: [node2]
            }
          )
        );
      }
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/VariablesAreInputTypesRule.js
var require_VariablesAreInputTypesRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/VariablesAreInputTypesRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.VariablesAreInputTypesRule = VariablesAreInputTypesRule;
    var _GraphQLError = require_GraphQLError();
    var _printer = require_printer();
    var _definition = require_definition();
    var _typeFromAST = require_typeFromAST();
    function VariablesAreInputTypesRule(context) {
      return {
        VariableDefinition(node2) {
          const type = (0, _typeFromAST.typeFromAST)(
            context.getSchema(),
            node2.type
          );
          if (type !== void 0 && !(0, _definition.isInputType)(type)) {
            const variableName = node2.variable.name.value;
            const typeName = (0, _printer.print)(node2.type);
            context.reportError(
              new _GraphQLError.GraphQLError(
                `Variable "$${variableName}" cannot be non-input type "${typeName}".`,
                {
                  nodes: node2.type
                }
              )
            );
          }
        }
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/VariablesInAllowedPositionRule.js
var require_VariablesInAllowedPositionRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/VariablesInAllowedPositionRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.VariablesInAllowedPositionRule = VariablesInAllowedPositionRule;
    var _inspect = require_inspect();
    var _GraphQLError = require_GraphQLError();
    var _kinds = require_kinds();
    var _definition = require_definition();
    var _typeComparators = require_typeComparators();
    var _typeFromAST = require_typeFromAST();
    function VariablesInAllowedPositionRule(context) {
      let varDefMap = /* @__PURE__ */ Object.create(null);
      return {
        OperationDefinition: {
          enter() {
            varDefMap = /* @__PURE__ */ Object.create(null);
          },
          leave(operation) {
            const usages = context.getRecursiveVariableUsages(operation);
            for (const { node: node2, type, defaultValue, parentType } of usages) {
              const varName = node2.name.value;
              const varDef = varDefMap[varName];
              if (varDef && type) {
                const schema = context.getSchema();
                const varType = (0, _typeFromAST.typeFromAST)(schema, varDef.type);
                if (varType && !allowedVariableUsage(
                  schema,
                  varType,
                  varDef.defaultValue,
                  type,
                  defaultValue
                )) {
                  const varTypeStr = (0, _inspect.inspect)(varType);
                  const typeStr = (0, _inspect.inspect)(type);
                  context.reportError(
                    new _GraphQLError.GraphQLError(
                      `Variable "$${varName}" of type "${varTypeStr}" used in position expecting type "${typeStr}".`,
                      {
                        nodes: [varDef, node2]
                      }
                    )
                  );
                }
                if ((0, _definition.isInputObjectType)(parentType) && parentType.isOneOf && (0, _definition.isNullableType)(varType)) {
                  context.reportError(
                    new _GraphQLError.GraphQLError(
                      `Variable "$${varName}" is of type "${varType}" but must be non-nullable to be used for OneOf Input Object "${parentType}".`,
                      {
                        nodes: [varDef, node2]
                      }
                    )
                  );
                }
              }
            }
          }
        },
        VariableDefinition(node2) {
          varDefMap[node2.variable.name.value] = node2;
        }
      };
    }
    function allowedVariableUsage(schema, varType, varDefaultValue, locationType, locationDefaultValue) {
      if ((0, _definition.isNonNullType)(locationType) && !(0, _definition.isNonNullType)(varType)) {
        const hasNonNullVariableDefaultValue = varDefaultValue != null && varDefaultValue.kind !== _kinds.Kind.NULL;
        const hasLocationDefaultValue = locationDefaultValue !== void 0;
        if (!hasNonNullVariableDefaultValue && !hasLocationDefaultValue) {
          return false;
        }
        const nullableLocationType = locationType.ofType;
        return (0, _typeComparators.isTypeSubTypeOf)(
          schema,
          varType,
          nullableLocationType
        );
      }
      return (0, _typeComparators.isTypeSubTypeOf)(schema, varType, locationType);
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/specifiedRules.js
var require_specifiedRules = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/specifiedRules.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.specifiedSDLRules = exports.specifiedRules = exports.recommendedRules = void 0;
    var _ExecutableDefinitionsRule = require_ExecutableDefinitionsRule();
    var _FieldsOnCorrectTypeRule = require_FieldsOnCorrectTypeRule();
    var _FragmentsOnCompositeTypesRule = require_FragmentsOnCompositeTypesRule();
    var _KnownArgumentNamesRule = require_KnownArgumentNamesRule();
    var _KnownDirectivesRule = require_KnownDirectivesRule();
    var _KnownFragmentNamesRule = require_KnownFragmentNamesRule();
    var _KnownTypeNamesRule = require_KnownTypeNamesRule();
    var _LoneAnonymousOperationRule = require_LoneAnonymousOperationRule();
    var _LoneSchemaDefinitionRule = require_LoneSchemaDefinitionRule();
    var _MaxIntrospectionDepthRule = require_MaxIntrospectionDepthRule();
    var _NoFragmentCyclesRule = require_NoFragmentCyclesRule();
    var _NoUndefinedVariablesRule = require_NoUndefinedVariablesRule();
    var _NoUnusedFragmentsRule = require_NoUnusedFragmentsRule();
    var _NoUnusedVariablesRule = require_NoUnusedVariablesRule();
    var _OverlappingFieldsCanBeMergedRule = require_OverlappingFieldsCanBeMergedRule();
    var _PossibleFragmentSpreadsRule = require_PossibleFragmentSpreadsRule();
    var _PossibleTypeExtensionsRule = require_PossibleTypeExtensionsRule();
    var _ProvidedRequiredArgumentsRule = require_ProvidedRequiredArgumentsRule();
    var _ScalarLeafsRule = require_ScalarLeafsRule();
    var _SingleFieldSubscriptionsRule = require_SingleFieldSubscriptionsRule();
    var _UniqueArgumentDefinitionNamesRule = require_UniqueArgumentDefinitionNamesRule();
    var _UniqueArgumentNamesRule = require_UniqueArgumentNamesRule();
    var _UniqueDirectiveNamesRule = require_UniqueDirectiveNamesRule();
    var _UniqueDirectivesPerLocationRule = require_UniqueDirectivesPerLocationRule();
    var _UniqueEnumValueNamesRule = require_UniqueEnumValueNamesRule();
    var _UniqueFieldDefinitionNamesRule = require_UniqueFieldDefinitionNamesRule();
    var _UniqueFragmentNamesRule = require_UniqueFragmentNamesRule();
    var _UniqueInputFieldNamesRule = require_UniqueInputFieldNamesRule();
    var _UniqueOperationNamesRule = require_UniqueOperationNamesRule();
    var _UniqueOperationTypesRule = require_UniqueOperationTypesRule();
    var _UniqueTypeNamesRule = require_UniqueTypeNamesRule();
    var _UniqueVariableNamesRule = require_UniqueVariableNamesRule();
    var _ValuesOfCorrectTypeRule = require_ValuesOfCorrectTypeRule();
    var _VariablesAreInputTypesRule = require_VariablesAreInputTypesRule();
    var _VariablesInAllowedPositionRule = require_VariablesInAllowedPositionRule();
    var recommendedRules = Object.freeze([
      _MaxIntrospectionDepthRule.MaxIntrospectionDepthRule
    ]);
    exports.recommendedRules = recommendedRules;
    var specifiedRules = Object.freeze([
      _ExecutableDefinitionsRule.ExecutableDefinitionsRule,
      _UniqueOperationNamesRule.UniqueOperationNamesRule,
      _LoneAnonymousOperationRule.LoneAnonymousOperationRule,
      _SingleFieldSubscriptionsRule.SingleFieldSubscriptionsRule,
      _KnownTypeNamesRule.KnownTypeNamesRule,
      _FragmentsOnCompositeTypesRule.FragmentsOnCompositeTypesRule,
      _VariablesAreInputTypesRule.VariablesAreInputTypesRule,
      _ScalarLeafsRule.ScalarLeafsRule,
      _FieldsOnCorrectTypeRule.FieldsOnCorrectTypeRule,
      _UniqueFragmentNamesRule.UniqueFragmentNamesRule,
      _KnownFragmentNamesRule.KnownFragmentNamesRule,
      _NoUnusedFragmentsRule.NoUnusedFragmentsRule,
      _PossibleFragmentSpreadsRule.PossibleFragmentSpreadsRule,
      _NoFragmentCyclesRule.NoFragmentCyclesRule,
      _UniqueVariableNamesRule.UniqueVariableNamesRule,
      _NoUndefinedVariablesRule.NoUndefinedVariablesRule,
      _NoUnusedVariablesRule.NoUnusedVariablesRule,
      _KnownDirectivesRule.KnownDirectivesRule,
      _UniqueDirectivesPerLocationRule.UniqueDirectivesPerLocationRule,
      _KnownArgumentNamesRule.KnownArgumentNamesRule,
      _UniqueArgumentNamesRule.UniqueArgumentNamesRule,
      _ValuesOfCorrectTypeRule.ValuesOfCorrectTypeRule,
      _ProvidedRequiredArgumentsRule.ProvidedRequiredArgumentsRule,
      _VariablesInAllowedPositionRule.VariablesInAllowedPositionRule,
      _OverlappingFieldsCanBeMergedRule.OverlappingFieldsCanBeMergedRule,
      _UniqueInputFieldNamesRule.UniqueInputFieldNamesRule,
      ...recommendedRules
    ]);
    exports.specifiedRules = specifiedRules;
    var specifiedSDLRules = Object.freeze([
      _LoneSchemaDefinitionRule.LoneSchemaDefinitionRule,
      _UniqueOperationTypesRule.UniqueOperationTypesRule,
      _UniqueTypeNamesRule.UniqueTypeNamesRule,
      _UniqueEnumValueNamesRule.UniqueEnumValueNamesRule,
      _UniqueFieldDefinitionNamesRule.UniqueFieldDefinitionNamesRule,
      _UniqueArgumentDefinitionNamesRule.UniqueArgumentDefinitionNamesRule,
      _UniqueDirectiveNamesRule.UniqueDirectiveNamesRule,
      _KnownTypeNamesRule.KnownTypeNamesRule,
      _KnownDirectivesRule.KnownDirectivesRule,
      _UniqueDirectivesPerLocationRule.UniqueDirectivesPerLocationRule,
      _PossibleTypeExtensionsRule.PossibleTypeExtensionsRule,
      _KnownArgumentNamesRule.KnownArgumentNamesOnDirectivesRule,
      _UniqueArgumentNamesRule.UniqueArgumentNamesRule,
      _UniqueInputFieldNamesRule.UniqueInputFieldNamesRule,
      _ProvidedRequiredArgumentsRule.ProvidedRequiredArgumentsOnDirectivesRule
    ]);
    exports.specifiedSDLRules = specifiedSDLRules;
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/SetMap.js
var require_SetMap = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/SetMap.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.SetMap = void 0;
    var SetMap = class {
      constructor() {
        this._entries = /* @__PURE__ */ new Map();
        this._memberIds = /* @__PURE__ */ new Map();
        this._nextMemberId = 0;
      }
      get(members) {
        return this._entries.get(this._key(members));
      }
      set(members, value) {
        this._entries.set(this._key(members), value);
      }
      _key(members) {
        const ids = [];
        for (const member of members) {
          let id = this._memberIds.get(member);
          if (id === void 0) {
            id = this._nextMemberId++;
            this._memberIds.set(member, id);
          }
          ids.push(id);
        }
        ids.sort((id1, id2) => id1 - id2);
        return ids.join(",");
      }
    };
    exports.SetMap = SetMap;
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/ValidationContext.js
var require_ValidationContext = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/ValidationContext.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.ValidationContext = exports.SDLValidationContext = exports.ASTValidationContext = void 0;
    var _SetMap = require_SetMap();
    var _kinds = require_kinds();
    var _visitor = require_visitor();
    var _TypeInfo = require_TypeInfo();
    var _validationAbortedError = require_validationAbortedError();
    var ASTValidationContext = class {
      _remainingFragmentWork = 5e4;
      constructor(ast, onError) {
        this._ast = ast;
        this._fragments = void 0;
        this._fragmentSpreads = /* @__PURE__ */ new Map();
        this._recursivelyReferencedFragments = new _SetMap.SetMap();
        this._onError = onError;
      }
      get [Symbol.toStringTag]() {
        return "ASTValidationContext";
      }
      reportError(error) {
        this._onError(error);
      }
      getDocument() {
        return this._ast;
      }
      getFragment(name2) {
        let fragments;
        if (this._fragments) {
          fragments = this._fragments;
        } else {
          fragments = /* @__PURE__ */ Object.create(null);
          for (const defNode of this.getDocument().definitions) {
            if (defNode.kind === _kinds.Kind.FRAGMENT_DEFINITION) {
              fragments[defNode.name.value] = defNode;
            }
          }
          this._fragments = fragments;
        }
        return fragments[name2];
      }
      getFragmentSpreads(node2) {
        let spreads = this._fragmentSpreads.get(node2);
        if (!spreads) {
          spreads = [];
          const setsToVisit = [node2];
          let set;
          while (set = setsToVisit.pop()) {
            for (const selection of set.selections) {
              if (selection.kind === _kinds.Kind.FRAGMENT_SPREAD) {
                spreads.push(selection);
              } else if (selection.selectionSet) {
                setsToVisit.push(selection.selectionSet);
              }
            }
          }
          this._fragmentSpreads.set(node2, spreads);
        }
        return spreads;
      }
      // TODO: In the next major version, accept multiple operations here and
      // remove getRecursivelyReferencedFragmentsForOperations.
      getRecursivelyReferencedFragments(operation) {
        return this.getRecursivelyReferencedFragmentsForOperations([operation]);
      }
      getRecursivelyReferencedFragmentsForOperations(operations) {
        const fragmentNames = new Set(
          operations.flatMap(
            ({ selectionSet }) => this.getFragmentSpreads(selectionSet).map(({ name: name2 }) => name2.value)
          )
        );
        let fragments = this._recursivelyReferencedFragments.get(fragmentNames);
        if (!fragments) {
          fragments = [];
          this.spendFragmentWork(fragmentNames.size);
          const collectedNames = new Set(fragmentNames);
          for (const fragName of collectedNames) {
            const fragment = this.getFragment(fragName);
            if (fragment) {
              fragments.push(fragment);
              const spreads = this.getFragmentSpreads(fragment.selectionSet);
              this.spendFragmentWork(spreads.length);
              for (const spread of spreads) {
                collectedNames.add(spread.name.value);
              }
            }
          }
          this._recursivelyReferencedFragments.set(fragmentNames, fragments);
        }
        return fragments;
      }
      /** @internal */
      spendFragmentWork(cost) {
        this._remainingFragmentWork -= cost;
        if (this._remainingFragmentWork < 0) {
          throw _validationAbortedError.validationAbortedError;
        }
      }
    };
    exports.ASTValidationContext = ASTValidationContext;
    var SDLValidationContext = class extends ASTValidationContext {
      constructor(ast, schema, onError) {
        super(ast, onError);
        this._schema = schema;
      }
      get hideSuggestions() {
        return false;
      }
      get [Symbol.toStringTag]() {
        return "SDLValidationContext";
      }
      getSchema() {
        return this._schema;
      }
    };
    exports.SDLValidationContext = SDLValidationContext;
    var ValidationContext = class extends ASTValidationContext {
      /**
       * Creates a ValidationContext instance.
       * @param schema - Schema used to validate the document.
       * @param ast - Document AST being validated.
       * @param typeInfo - TypeInfo instance used to track traversal state.
       * @param onError - Callback invoked for each validation error.
       * @param hideSuggestions - Omit suggestions from error messages.
       * @example
       * ```ts
       * import { parse } from 'graphql/language';
       * import { GraphQLError } from 'graphql/error';
       * import { buildSchema, TypeInfo } from 'graphql/utilities';
       * import { ValidationContext } from 'graphql/validation';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     greeting: String
       *   }
       * `);
       * const document = parse('{ greeting }');
       * const errors: Array<GraphQLError> = [];
       * const context = new ValidationContext(
       *   schema,
       *   document,
       *   new TypeInfo(schema),
       *   (error) => errors.push(error),
       * );
       *
       * context.reportError(new GraphQLError('Example validation error.'));
       *
       * context.getSchema(); // => schema
       * errors[0].message; // => 'Example validation error.'
       * ```
       */
      constructor(schema, ast, typeInfo, onError, hideSuggestions) {
        super(ast, onError);
        this._hideSuggestions = hideSuggestions !== null && hideSuggestions !== void 0 ? hideSuggestions : false;
        this._schema = schema;
        this._typeInfo = typeInfo;
        this._variableUsages = /* @__PURE__ */ new Map();
        this._recursiveVariableUsages = /* @__PURE__ */ new Map();
      }
      /**
       * Whether suggestions should be omitted from validation errors.
       * @returns True when validation error suggestions are disabled.
       */
      get hideSuggestions() {
        return this._hideSuggestions;
      }
      /**
       * Returns the value used by `Object.prototype.toString`.
       * @returns The built-in string tag for this object.
       */
      get [Symbol.toStringTag]() {
        return "ValidationContext";
      }
      /**
       * Returns the schema being used by this validation context.
       * @returns The schema being validated against.
       * @example
       * ```ts
       * import { parse } from 'graphql/language';
       * import { buildSchema, TypeInfo } from 'graphql/utilities';
       * import { ValidationContext } from 'graphql/validation';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     greeting: String
       *   }
       * `);
       * const context = new ValidationContext(
       *   schema,
       *   parse('{ greeting }'),
       *   new TypeInfo(schema),
       *   () => {},
       * );
       *
       * context.getSchema().getQueryType()?.name; // => 'Query'
       * ```
       */
      getSchema() {
        return this._schema;
      }
      /**
       * Returns variable usages found directly within this node.
       * @param node - The AST node to inspect or visit.
       * @returns Variable usages found directly within this node.
       * @example
       * ```ts
       * import assert from 'node:assert/strict';
       * import { parse, Kind } from 'graphql/language';
       * import { buildSchema, TypeInfo } from 'graphql/utilities';
       * import { ValidationContext } from 'graphql/validation';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     greeting(name: String): String
       *   }
       * `);
       * const document = parse('query ($name: String) { greeting(name: $name) }');
       * const operation = document.definitions[0];
       * assert(operation.kind === Kind.OPERATION_DEFINITION);
       * const context = new ValidationContext(
       *   schema,
       *   document,
       *   new TypeInfo(schema),
       *   () => {},
       * );
       *
       * const usages = context.getVariableUsages(operation);
       *
       * usages[0].node.name.value; // => 'name'
       * String(usages[0].type); // => 'String'
       * ```
       */
      getVariableUsages(node2) {
        let usages = this._variableUsages.get(node2);
        if (!usages) {
          const newUsages = [];
          const typeInfo = new _TypeInfo.TypeInfo(this._schema);
          (0, _visitor.visit)(
            node2,
            (0, _TypeInfo.visitWithTypeInfo)(typeInfo, {
              VariableDefinition: () => false,
              Variable(variable) {
                newUsages.push({
                  node: variable,
                  type: typeInfo.getInputType(),
                  defaultValue: typeInfo.getDefaultValue(),
                  parentType: typeInfo.getParentInputType()
                });
              }
            })
          );
          usages = newUsages;
          this._variableUsages.set(node2, usages);
        }
        return usages;
      }
      /**
       * Returns variable usages for an operation, including variables used by referenced fragments.
       * @param operation - Operation definition to inspect.
       * @returns Variable usages reachable from the operation.
       * @example
       * ```ts
       * import assert from 'node:assert/strict';
       * import { parse, Kind } from 'graphql/language';
       * import { buildSchema, TypeInfo } from 'graphql/utilities';
       * import { ValidationContext } from 'graphql/validation';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     viewer: User
       *   }
       *
       *   type User {
       *     name(prefix: String): String
       *   }
       * `);
       * const document = parse(`
       *   query ($prefix: String) {
       *     viewer {
       *       ...UserName
       *     }
       *   }
       *
       *   fragment UserName on User {
       *     name(prefix: $prefix)
       *   }
       * `);
       * const operation = document.definitions[0];
       * assert(operation.kind === Kind.OPERATION_DEFINITION);
       * const context = new ValidationContext(
       *   schema,
       *   document,
       *   new TypeInfo(schema),
       *   () => {},
       * );
       *
       * const usages = context.getRecursiveVariableUsages(operation);
       *
       * usages.map((usage) => usage.node.name.value); // => ['prefix']
       * ```
       */
      getRecursiveVariableUsages(operation) {
        let usages = this._recursiveVariableUsages.get(operation);
        if (!usages) {
          const fragments = this.getRecursivelyReferencedFragments(operation);
          let fragmentUsages = this._recursiveVariableUsages.get(fragments);
          if (!fragmentUsages) {
            this.spendFragmentWork(fragments.length);
            fragmentUsages = fragments.flatMap((frag) => {
              const localUsages = this.getVariableUsages(frag);
              this.spendFragmentWork(localUsages.length);
              return localUsages;
            });
            this._recursiveVariableUsages.set(fragments, fragmentUsages);
          }
          this.spendFragmentWork(fragmentUsages.length);
          usages = this.getVariableUsages(operation).concat(fragmentUsages);
          this._recursiveVariableUsages.set(operation, usages);
        }
        return usages;
      }
      /**
       * Returns the current output type at this point in traversal.
       * @returns The current output type, if known.
       * @example
       * ```ts
       * import { parse, visit } from 'graphql/language';
       * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
       * import { ValidationContext } from 'graphql/validation';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     greeting: String
       *   }
       * `);
       * const document = parse('{ greeting }');
       * const typeInfo = new TypeInfo(schema);
       * const context = new ValidationContext(schema, document, typeInfo, () => {});
       * let typeName;
       *
       * visit(
       *   document,
       *   visitWithTypeInfo(typeInfo, {
       *     Field: () => {
       *       typeName = String(context.getType());
       *     },
       *   }),
       * );
       *
       * typeName; // => 'String'
       * ```
       */
      getType() {
        return this._typeInfo.getType();
      }
      /**
       * Returns the current parent composite type.
       * @returns The current parent composite type, if known.
       * @example
       * ```ts
       * import { parse, visit } from 'graphql/language';
       * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
       * import { ValidationContext } from 'graphql/validation';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     greeting: String
       *   }
       * `);
       * const document = parse('{ greeting }');
       * const typeInfo = new TypeInfo(schema);
       * const context = new ValidationContext(schema, document, typeInfo, () => {});
       * let parentTypeName;
       *
       * visit(
       *   document,
       *   visitWithTypeInfo(typeInfo, {
       *     Field: () => {
       *       parentTypeName = context.getParentType()?.name;
       *     },
       *   }),
       * );
       *
       * parentTypeName; // => 'Query'
       * ```
       */
      getParentType() {
        return this._typeInfo.getParentType();
      }
      /**
       * Returns the current input type at this point in traversal.
       * @returns The current input type, if known.
       * @example
       * ```ts
       * import { parse, visit } from 'graphql/language';
       * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
       * import { ValidationContext } from 'graphql/validation';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     reviews(limit: Int): [String]
       *   }
       * `);
       * const document = parse('{ reviews(limit: 5) }');
       * const typeInfo = new TypeInfo(schema);
       * const context = new ValidationContext(schema, document, typeInfo, () => {});
       * let inputTypeName;
       *
       * visit(
       *   document,
       *   visitWithTypeInfo(typeInfo, {
       *     Argument: () => {
       *       inputTypeName = String(context.getInputType());
       *     },
       *   }),
       * );
       *
       * inputTypeName; // => 'Int'
       * ```
       */
      getInputType() {
        return this._typeInfo.getInputType();
      }
      /**
       * Returns the parent input type for the current input position.
       * @returns The parent input type, if known.
       * @example
       * ```ts
       * import { parse, visit } from 'graphql/language';
       * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
       * import { ValidationContext } from 'graphql/validation';
       *
       * const schema = buildSchema(`
       *   input ReviewFilter {
       *     stars: Int
       *   }
       *
       *   type Query {
       *     reviews(filter: ReviewFilter): [String]
       *   }
       * `);
       * const document = parse('{ reviews(filter: { stars: 5 }) }');
       * const typeInfo = new TypeInfo(schema);
       * const context = new ValidationContext(schema, document, typeInfo, () => {});
       * let parentInputTypeName;
       *
       * visit(
       *   document,
       *   visitWithTypeInfo(typeInfo, {
       *     ObjectField: () => {
       *       parentInputTypeName = String(context.getParentInputType());
       *     },
       *   }),
       * );
       *
       * parentInputTypeName; // => 'ReviewFilter'
       * ```
       */
      getParentInputType() {
        return this._typeInfo.getParentInputType();
      }
      /**
       * Returns the current field definition.
       * @returns The current field definition, if known.
       * @example
       * ```ts
       * import { parse, visit } from 'graphql/language';
       * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
       * import { ValidationContext } from 'graphql/validation';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     greeting: String
       *   }
       * `);
       * const document = parse('{ greeting }');
       * const typeInfo = new TypeInfo(schema);
       * const context = new ValidationContext(schema, document, typeInfo, () => {});
       * let fieldName;
       *
       * visit(
       *   document,
       *   visitWithTypeInfo(typeInfo, {
       *     Field: () => {
       *       fieldName = context.getFieldDef()?.name;
       *     },
       *   }),
       * );
       *
       * fieldName; // => 'greeting'
       * ```
       */
      getFieldDef() {
        return this._typeInfo.getFieldDef();
      }
      /**
       * Returns the current directive definition.
       * @returns The current directive definition, if known.
       * @example
       * ```ts
       * import { parse, visit } from 'graphql/language';
       * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
       * import { ValidationContext } from 'graphql/validation';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     greeting: String
       *   }
       * `);
       * const document = parse('{ greeting @include(if: true) }');
       * const typeInfo = new TypeInfo(schema);
       * const context = new ValidationContext(schema, document, typeInfo, () => {});
       * let directiveName;
       *
       * visit(
       *   document,
       *   visitWithTypeInfo(typeInfo, {
       *     Directive: () => {
       *       directiveName = context.getDirective()?.name;
       *     },
       *   }),
       * );
       *
       * directiveName; // => 'include'
       * ```
       */
      getDirective() {
        return this._typeInfo.getDirective();
      }
      /**
       * Returns the current argument definition.
       * @returns The current argument definition, if known.
       * @example
       * ```ts
       * import { parse, visit } from 'graphql/language';
       * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
       * import { ValidationContext } from 'graphql/validation';
       *
       * const schema = buildSchema(`
       *   type Query {
       *     reviews(limit: Int): [String]
       *   }
       * `);
       * const document = parse('{ reviews(limit: 5) }');
       * const typeInfo = new TypeInfo(schema);
       * const context = new ValidationContext(schema, document, typeInfo, () => {});
       * let argumentName;
       *
       * visit(
       *   document,
       *   visitWithTypeInfo(typeInfo, {
       *     Argument: () => {
       *       argumentName = context.getArgument()?.name;
       *     },
       *   }),
       * );
       *
       * argumentName; // => 'limit'
       * ```
       */
      getArgument() {
        return this._typeInfo.getArgument();
      }
      /**
       * Returns the current enum value definition.
       * @returns The current enum value definition, if known.
       * @example
       * ```ts
       * import { parse, visit } from 'graphql/language';
       * import { buildSchema, TypeInfo, visitWithTypeInfo } from 'graphql/utilities';
       * import { ValidationContext } from 'graphql/validation';
       *
       * const schema = buildSchema(`
       *   enum Sort {
       *     NEWEST
       *     OLDEST
       *   }
       *
       *   type Query {
       *     reviews(sort: Sort): [String]
       *   }
       * `);
       * const document = parse('{ reviews(sort: OLDEST) }');
       * const typeInfo = new TypeInfo(schema);
       * const context = new ValidationContext(schema, document, typeInfo, () => {});
       * let enumValueName;
       *
       * visit(
       *   document,
       *   visitWithTypeInfo(typeInfo, {
       *     EnumValue: () => {
       *       enumValueName = context.getEnumValue()?.name;
       *     },
       *   }),
       * );
       *
       * enumValueName; // => 'OLDEST'
       * ```
       */
      getEnumValue() {
        return this._typeInfo.getEnumValue();
      }
    };
    exports.ValidationContext = ValidationContext;
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/validate.js
var require_validate2 = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/validate.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.assertValidSDL = assertValidSDL;
    exports.assertValidSDLExtension = assertValidSDLExtension;
    exports.validate = validate2;
    exports.validateSDL = validateSDL;
    var _devAssert = require_devAssert();
    var _mapValue = require_mapValue();
    var _GraphQLError = require_GraphQLError();
    var _ast = require_ast();
    var _visitor = require_visitor();
    var _validate = require_validate();
    var _TypeInfo = require_TypeInfo();
    var _specifiedRules = require_specifiedRules();
    var _validationAbortedError = require_validationAbortedError();
    var _ValidationContext = require_ValidationContext();
    var QueryDocumentKeysToValidate = (0, _mapValue.mapValue)(
      _ast.QueryDocumentKeys,
      (keys) => keys.filter((key) => key !== "description")
    );
    function validate2(schema, documentAST, rules = _specifiedRules.specifiedRules, options, typeInfo = new _TypeInfo.TypeInfo(schema)) {
      var _options$maxErrors, _options$hideSuggesti;
      const maxErrors = (_options$maxErrors = options === null || options === void 0 ? void 0 : options.maxErrors) !== null && _options$maxErrors !== void 0 ? _options$maxErrors : 100;
      const hideSuggestions = (_options$hideSuggesti = options === null || options === void 0 ? void 0 : options.hideSuggestions) !== null && _options$hideSuggesti !== void 0 ? _options$hideSuggesti : false;
      documentAST || (0, _devAssert.devAssert)(false, "Must provide document.");
      (0, _validate.assertValidSchema)(schema);
      const abortObj = Object.freeze({});
      const errors = [];
      const context = new _ValidationContext.ValidationContext(
        schema,
        documentAST,
        typeInfo,
        (error) => {
          if (errors.length >= maxErrors) {
            errors.push(
              new _GraphQLError.GraphQLError(
                "Too many validation errors, error limit reached. Validation aborted."
              )
            );
            throw abortObj;
          }
          errors.push(error);
        },
        hideSuggestions
      );
      const visitor = (0, _visitor.visitInParallel)(
        rules.map((rule) => rule(context))
      );
      try {
        (0, _visitor.visit)(
          documentAST,
          (0, _TypeInfo.visitWithTypeInfo)(typeInfo, visitor),
          QueryDocumentKeysToValidate
        );
      } catch (e) {
        if (e === _validationAbortedError.validationAbortedError) {
          errors.push(_validationAbortedError.validationAbortedError);
        } else if (e !== abortObj) {
          throw e;
        }
      }
      return errors;
    }
    function validateSDL(documentAST, schemaToExtend, rules = _specifiedRules.specifiedSDLRules) {
      const errors = [];
      const context = new _ValidationContext.SDLValidationContext(
        documentAST,
        schemaToExtend,
        (error) => {
          errors.push(error);
        }
      );
      const visitors = rules.map((rule) => rule(context));
      (0, _visitor.visit)(documentAST, (0, _visitor.visitInParallel)(visitors));
      return errors;
    }
    function assertValidSDL(documentAST) {
      const errors = validateSDL(documentAST);
      if (errors.length !== 0) {
        throw new Error(errors.map((error) => error.message).join("\n\n"));
      }
    }
    function assertValidSDLExtension(documentAST, schema) {
      const errors = validateSDL(documentAST, schema);
      if (errors.length !== 0) {
        throw new Error(errors.map((error) => error.message).join("\n\n"));
      }
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/memoize3.js
var require_memoize3 = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/memoize3.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.memoize3 = memoize3;
    function memoize3(fn) {
      let cache0;
      return function memoized(a1, a2, a3) {
        if (cache0 === void 0) {
          cache0 = /* @__PURE__ */ new WeakMap();
        }
        let cache1 = cache0.get(a1);
        if (cache1 === void 0) {
          cache1 = /* @__PURE__ */ new WeakMap();
          cache0.set(a1, cache1);
        }
        let cache2 = cache1.get(a2);
        if (cache2 === void 0) {
          cache2 = /* @__PURE__ */ new WeakMap();
          cache1.set(a2, cache2);
        }
        let fnResult = cache2.get(a3);
        if (fnResult === void 0) {
          fnResult = fn(a1, a2, a3);
          cache2.set(a3, fnResult);
        }
        return fnResult;
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/promiseForObject.js
var require_promiseForObject = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/promiseForObject.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.promiseForObject = promiseForObject;
    function promiseForObject(object) {
      return Promise.all(Object.values(object)).then((resolvedValues) => {
        const resolvedObject = /* @__PURE__ */ Object.create(null);
        for (const [i, key] of Object.keys(object).entries()) {
          resolvedObject[key] = resolvedValues[i];
        }
        return resolvedObject;
      });
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/promiseReduce.js
var require_promiseReduce = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/promiseReduce.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.promiseReduce = promiseReduce;
    var _isPromise = require_isPromise();
    function promiseReduce(values, callbackFn, initialValue) {
      let accumulator = initialValue;
      for (const value of values) {
        accumulator = (0, _isPromise.isPromise)(accumulator) ? accumulator.then((resolved) => callbackFn(resolved, value)) : callbackFn(accumulator, value);
      }
      return accumulator;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/toError.js
var require_toError = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/toError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.toError = toError;
    var _inspect = require_inspect();
    function toError(thrownValue) {
      return thrownValue instanceof Error ? thrownValue : new NonErrorThrown(thrownValue);
    }
    var NonErrorThrown = class extends Error {
      constructor(thrownValue) {
        super("Unexpected error value: " + (0, _inspect.inspect)(thrownValue));
        this.name = "NonErrorThrown";
        this.thrownValue = thrownValue;
      }
    };
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/error/locatedError.js
var require_locatedError = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/error/locatedError.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.locatedError = locatedError;
    var _toError = require_toError();
    var _GraphQLError = require_GraphQLError();
    function locatedError(rawOriginalError, nodes, path) {
      var _nodes;
      const originalError = (0, _toError.toError)(rawOriginalError);
      if (isLocatedGraphQLError(originalError)) {
        return originalError;
      }
      return new _GraphQLError.GraphQLError(originalError.message, {
        nodes: (_nodes = originalError.nodes) !== null && _nodes !== void 0 ? _nodes : nodes,
        source: originalError.source,
        positions: originalError.positions,
        path,
        originalError
      });
    }
    function isLocatedGraphQLError(error) {
      return Array.isArray(error.path);
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/execution/execute.js
var require_execute = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/execution/execute.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.assertValidExecutionArguments = assertValidExecutionArguments;
    exports.buildExecutionContext = buildExecutionContext;
    exports.buildResolveInfo = buildResolveInfo;
    exports.defaultTypeResolver = exports.defaultFieldResolver = void 0;
    exports.execute = execute;
    exports.executeSync = executeSync;
    exports.getFieldDef = getFieldDef;
    var _devAssert = require_devAssert();
    var _inspect = require_inspect();
    var _invariant = require_invariant();
    var _isIterableObject = require_isIterableObject();
    var _isObjectLike = require_isObjectLike();
    var _isPromise = require_isPromise();
    var _memoize = require_memoize3();
    var _Path = require_Path();
    var _promiseForObject = require_promiseForObject();
    var _promiseReduce = require_promiseReduce();
    var _GraphQLError = require_GraphQLError();
    var _locatedError = require_locatedError();
    var _ast = require_ast();
    var _kinds = require_kinds();
    var _definition = require_definition();
    var _introspection = require_introspection();
    var _validate = require_validate();
    var _collectFields = require_collectFields();
    var _values = require_values();
    var collectSubfields = (0, _memoize.memoize3)(
      (exeContext, returnType, fieldNodes) => (0, _collectFields.collectSubfields)(
        exeContext.schema,
        exeContext.fragments,
        exeContext.variableValues,
        returnType,
        fieldNodes
      )
    );
    var CollectedErrors = class {
      constructor() {
        this._errorPositions = /* @__PURE__ */ new Set();
        this._errors = [];
      }
      get errors() {
        return this._errors;
      }
      add(error, path) {
        if (this._hasNulledPosition(path)) {
          return;
        }
        this._errorPositions.add(path);
        this._errors.push(error);
      }
      _hasNulledPosition(startPath) {
        let path = startPath;
        while (path !== void 0) {
          if (this._errorPositions.has(path)) {
            return true;
          }
          path = path.prev;
        }
        return this._errorPositions.has(void 0);
      }
    };
    function execute(args) {
      arguments.length < 2 || (0, _devAssert.devAssert)(
        false,
        "graphql@16 dropped long-deprecated support for positional arguments, please pass an object instead."
      );
      const { schema, document, variableValues, rootValue } = args;
      assertValidExecutionArguments(schema, document, variableValues);
      const exeContext = buildExecutionContext(args);
      if (!("schema" in exeContext)) {
        return {
          errors: exeContext
        };
      }
      try {
        const { operation } = exeContext;
        const result = executeOperation(exeContext, operation, rootValue);
        if ((0, _isPromise.isPromise)(result)) {
          return result.then(
            (data) => buildResponse(data, exeContext.collectedErrors.errors),
            (error) => {
              exeContext.collectedErrors.add(error, void 0);
              return buildResponse(null, exeContext.collectedErrors.errors);
            }
          );
        }
        return buildResponse(result, exeContext.collectedErrors.errors);
      } catch (error) {
        exeContext.collectedErrors.add(error, void 0);
        return buildResponse(null, exeContext.collectedErrors.errors);
      }
    }
    function executeSync(args) {
      const result = execute(args);
      if ((0, _isPromise.isPromise)(result)) {
        throw new Error("GraphQL execution failed to complete synchronously.");
      }
      return result;
    }
    function buildResponse(data, errors) {
      return errors.length === 0 ? {
        data
      } : {
        errors,
        data
      };
    }
    function assertValidExecutionArguments(schema, document, rawVariableValues) {
      document || (0, _devAssert.devAssert)(false, "Must provide document.");
      (0, _validate.assertValidSchema)(schema);
      rawVariableValues == null || (0, _isObjectLike.isObjectLike)(rawVariableValues) || (0, _devAssert.devAssert)(
        false,
        "Variables must be provided as an Object where each property is a variable value. Perhaps look to see if an unparsed JSON string was provided."
      );
    }
    function buildExecutionContext(args) {
      var _definition$name, _operation$variableDe, _options$maxCoercionE, _args$hideSuggestions;
      const {
        schema,
        document,
        rootValue,
        contextValue,
        variableValues: rawVariableValues,
        operationName,
        fieldResolver: fieldResolver2,
        typeResolver,
        subscribeFieldResolver,
        options
      } = args;
      let operation;
      const fragments = /* @__PURE__ */ Object.create(null);
      for (const definition of document.definitions) {
        switch (definition.kind) {
          case _kinds.Kind.OPERATION_DEFINITION:
            if (operationName == null) {
              if (operation !== void 0) {
                return [
                  new _GraphQLError.GraphQLError(
                    "Must provide operation name if query contains multiple operations."
                  )
                ];
              }
              operation = definition;
            } else if (((_definition$name = definition.name) === null || _definition$name === void 0 ? void 0 : _definition$name.value) === operationName) {
              operation = definition;
            }
            break;
          case _kinds.Kind.FRAGMENT_DEFINITION:
            fragments[definition.name.value] = definition;
            break;
          default:
        }
      }
      if (!operation) {
        if (operationName != null) {
          return [
            new _GraphQLError.GraphQLError(
              `Unknown operation named "${operationName}".`
            )
          ];
        }
        return [new _GraphQLError.GraphQLError("Must provide an operation.")];
      }
      const variableDefinitions = (_operation$variableDe = operation.variableDefinitions) !== null && _operation$variableDe !== void 0 ? _operation$variableDe : [];
      const coercedVariableValues = (0, _values.getVariableValues)(
        schema,
        variableDefinitions,
        rawVariableValues !== null && rawVariableValues !== void 0 ? rawVariableValues : {},
        {
          maxErrors: (_options$maxCoercionE = options === null || options === void 0 ? void 0 : options.maxCoercionErrors) !== null && _options$maxCoercionE !== void 0 ? _options$maxCoercionE : 50,
          hideSuggestions: (_args$hideSuggestions = args.hideSuggestions) !== null && _args$hideSuggestions !== void 0 ? _args$hideSuggestions : false
        }
      );
      if (coercedVariableValues.errors) {
        return coercedVariableValues.errors;
      }
      return {
        schema,
        fragments,
        rootValue,
        contextValue,
        operation,
        variableValues: coercedVariableValues.coerced,
        fieldResolver: fieldResolver2 !== null && fieldResolver2 !== void 0 ? fieldResolver2 : defaultFieldResolver,
        typeResolver: typeResolver !== null && typeResolver !== void 0 ? typeResolver : defaultTypeResolver,
        subscribeFieldResolver: subscribeFieldResolver !== null && subscribeFieldResolver !== void 0 ? subscribeFieldResolver : defaultFieldResolver,
        collectedErrors: new CollectedErrors()
      };
    }
    function executeOperation(exeContext, operation, rootValue) {
      const rootType = exeContext.schema.getRootType(operation.operation);
      if (rootType == null) {
        throw new _GraphQLError.GraphQLError(
          `Schema is not configured to execute ${operation.operation} operation.`,
          {
            nodes: operation
          }
        );
      }
      const rootFields = (0, _collectFields.collectFields)(
        exeContext.schema,
        exeContext.fragments,
        exeContext.variableValues,
        rootType,
        operation.selectionSet
      );
      const path = void 0;
      switch (operation.operation) {
        case _ast.OperationTypeNode.QUERY:
          return executeFields(exeContext, rootType, rootValue, path, rootFields);
        case _ast.OperationTypeNode.MUTATION:
          return executeFieldsSerially(
            exeContext,
            rootType,
            rootValue,
            path,
            rootFields
          );
        case _ast.OperationTypeNode.SUBSCRIPTION:
          return executeFields(exeContext, rootType, rootValue, path, rootFields);
      }
    }
    function executeFieldsSerially(exeContext, parentType, sourceValue, path, fields) {
      return (0, _promiseReduce.promiseReduce)(
        fields.entries(),
        (results, [responseName, fieldNodes]) => {
          const fieldPath = (0, _Path.addPath)(path, responseName, parentType.name);
          const result = executeField(
            exeContext,
            parentType,
            sourceValue,
            fieldNodes,
            fieldPath
          );
          if (result === void 0) {
            return results;
          }
          if ((0, _isPromise.isPromise)(result)) {
            return result.then((resolvedResult) => {
              results[responseName] = resolvedResult;
              return results;
            });
          }
          results[responseName] = result;
          return results;
        },
        /* @__PURE__ */ Object.create(null)
      );
    }
    function executeFields(exeContext, parentType, sourceValue, path, fields) {
      const results = /* @__PURE__ */ Object.create(null);
      let containsPromise = false;
      try {
        for (const [responseName, fieldNodes] of fields.entries()) {
          const fieldPath = (0, _Path.addPath)(path, responseName, parentType.name);
          const result = executeField(
            exeContext,
            parentType,
            sourceValue,
            fieldNodes,
            fieldPath
          );
          if (result !== void 0) {
            results[responseName] = result;
            if ((0, _isPromise.isPromise)(result)) {
              containsPromise = true;
            }
          }
        }
      } catch (error) {
        if (containsPromise) {
          return (0, _promiseForObject.promiseForObject)(results).finally(() => {
            throw error;
          });
        }
        throw error;
      }
      if (!containsPromise) {
        return results;
      }
      return (0, _promiseForObject.promiseForObject)(results);
    }
    function executeField(exeContext, parentType, source, fieldNodes, path) {
      var _fieldDef$resolve;
      const fieldDef = getFieldDef(exeContext.schema, parentType, fieldNodes[0]);
      if (!fieldDef) {
        return;
      }
      const returnType = fieldDef.type;
      const resolveFn = (_fieldDef$resolve = fieldDef.resolve) !== null && _fieldDef$resolve !== void 0 ? _fieldDef$resolve : exeContext.fieldResolver;
      const info = buildResolveInfo(
        exeContext,
        fieldDef,
        fieldNodes,
        parentType,
        path
      );
      try {
        const args = (0, _values.getArgumentValues)(
          fieldDef,
          fieldNodes[0],
          exeContext.variableValues
        );
        const contextValue = exeContext.contextValue;
        const result = resolveFn(source, args, contextValue, info);
        let completed;
        if ((0, _isPromise.isPromise)(result)) {
          completed = result.then(
            (resolved) => completeValue(exeContext, returnType, fieldNodes, info, path, resolved)
          );
        } else {
          completed = completeValue(
            exeContext,
            returnType,
            fieldNodes,
            info,
            path,
            result
          );
        }
        if ((0, _isPromise.isPromise)(completed)) {
          return completed.then(void 0, (rawError) => {
            const error = (0, _locatedError.locatedError)(
              rawError,
              fieldNodes,
              (0, _Path.pathToArray)(path)
            );
            return handleFieldError(error, returnType, path, exeContext);
          });
        }
        return completed;
      } catch (rawError) {
        const error = (0, _locatedError.locatedError)(
          rawError,
          fieldNodes,
          (0, _Path.pathToArray)(path)
        );
        return handleFieldError(error, returnType, path, exeContext);
      }
    }
    function buildResolveInfo(exeContext, fieldDef, fieldNodes, parentType, path) {
      return {
        fieldName: fieldDef.name,
        fieldNodes,
        returnType: fieldDef.type,
        parentType,
        path,
        schema: exeContext.schema,
        fragments: exeContext.fragments,
        rootValue: exeContext.rootValue,
        operation: exeContext.operation,
        variableValues: exeContext.variableValues
      };
    }
    function handleFieldError(error, returnType, path, exeContext) {
      if ((0, _definition.isNonNullType)(returnType)) {
        throw error;
      }
      exeContext.collectedErrors.add(error, path);
      return null;
    }
    function completeValue(exeContext, returnType, fieldNodes, info, path, result) {
      if (result instanceof Error) {
        throw result;
      }
      if ((0, _definition.isNonNullType)(returnType)) {
        const completed = completeValue(
          exeContext,
          returnType.ofType,
          fieldNodes,
          info,
          path,
          result
        );
        if (completed === null) {
          throw new Error(
            `Cannot return null for non-nullable field ${info.parentType.name}.${info.fieldName}.`
          );
        }
        return completed;
      }
      if (result == null) {
        return null;
      }
      if ((0, _definition.isListType)(returnType)) {
        return completeListValue(
          exeContext,
          returnType,
          fieldNodes,
          info,
          path,
          result
        );
      }
      if ((0, _definition.isLeafType)(returnType)) {
        return completeLeafValue(returnType, result);
      }
      if ((0, _definition.isAbstractType)(returnType)) {
        return completeAbstractValue(
          exeContext,
          returnType,
          fieldNodes,
          info,
          path,
          result
        );
      }
      if ((0, _definition.isObjectType)(returnType)) {
        return completeObjectValue(
          exeContext,
          returnType,
          fieldNodes,
          info,
          path,
          result
        );
      }
      (0, _invariant.invariant)(
        false,
        "Cannot complete value of unexpected output type: " + (0, _inspect.inspect)(returnType)
      );
    }
    function completeListValue(exeContext, returnType, fieldNodes, info, path, result) {
      if (!(0, _isIterableObject.isIterableObject)(result)) {
        throw new _GraphQLError.GraphQLError(
          `Expected Iterable, but did not find one for field "${info.parentType.name}.${info.fieldName}".`
        );
      }
      const itemType = returnType.ofType;
      let containsPromise = false;
      const completedResults = Array.from(result, (item, index) => {
        const itemPath = (0, _Path.addPath)(path, index, void 0);
        try {
          let completedItem;
          if ((0, _isPromise.isPromise)(item)) {
            completedItem = item.then(
              (resolved) => completeValue(
                exeContext,
                itemType,
                fieldNodes,
                info,
                itemPath,
                resolved
              )
            );
          } else {
            completedItem = completeValue(
              exeContext,
              itemType,
              fieldNodes,
              info,
              itemPath,
              item
            );
          }
          if ((0, _isPromise.isPromise)(completedItem)) {
            containsPromise = true;
            return completedItem.then(void 0, (rawError) => {
              const error = (0, _locatedError.locatedError)(
                rawError,
                fieldNodes,
                (0, _Path.pathToArray)(itemPath)
              );
              return handleFieldError(error, itemType, itemPath, exeContext);
            });
          }
          return completedItem;
        } catch (rawError) {
          const error = (0, _locatedError.locatedError)(
            rawError,
            fieldNodes,
            (0, _Path.pathToArray)(itemPath)
          );
          return handleFieldError(error, itemType, itemPath, exeContext);
        }
      });
      return containsPromise ? Promise.all(completedResults) : completedResults;
    }
    function completeLeafValue(returnType, result) {
      const serializedResult = returnType.serialize(result);
      if (serializedResult == null) {
        throw new Error(
          `Expected \`${(0, _inspect.inspect)(returnType)}.serialize(${(0, _inspect.inspect)(result)})\` to return non-nullable value, returned: ${(0, _inspect.inspect)(
            serializedResult
          )}`
        );
      }
      return serializedResult;
    }
    function completeAbstractValue(exeContext, returnType, fieldNodes, info, path, result) {
      var _returnType$resolveTy;
      const resolveTypeFn = (_returnType$resolveTy = returnType.resolveType) !== null && _returnType$resolveTy !== void 0 ? _returnType$resolveTy : exeContext.typeResolver;
      const contextValue = exeContext.contextValue;
      const runtimeType = resolveTypeFn(result, contextValue, info, returnType);
      if ((0, _isPromise.isPromise)(runtimeType)) {
        return runtimeType.then(
          (resolvedRuntimeType) => completeObjectValue(
            exeContext,
            ensureValidRuntimeType(
              resolvedRuntimeType,
              exeContext,
              returnType,
              fieldNodes,
              info,
              result
            ),
            fieldNodes,
            info,
            path,
            result
          )
        );
      }
      return completeObjectValue(
        exeContext,
        ensureValidRuntimeType(
          runtimeType,
          exeContext,
          returnType,
          fieldNodes,
          info,
          result
        ),
        fieldNodes,
        info,
        path,
        result
      );
    }
    function ensureValidRuntimeType(runtimeTypeName, exeContext, returnType, fieldNodes, info, result) {
      if (runtimeTypeName == null) {
        throw new _GraphQLError.GraphQLError(
          `Abstract type "${returnType.name}" must resolve to an Object type at runtime for field "${info.parentType.name}.${info.fieldName}". Either the "${returnType.name}" type should provide a "resolveType" function or each possible type should provide an "isTypeOf" function.`,
          fieldNodes
        );
      }
      if ((0, _definition.isObjectType)(runtimeTypeName)) {
        throw new _GraphQLError.GraphQLError(
          "Support for returning GraphQLObjectType from resolveType was removed in graphql-js@16.0.0 please return type name instead."
        );
      }
      if (typeof runtimeTypeName !== "string") {
        throw new _GraphQLError.GraphQLError(
          `Abstract type "${returnType.name}" must resolve to an Object type at runtime for field "${info.parentType.name}.${info.fieldName}" with value ${(0, _inspect.inspect)(result)}, received "${(0, _inspect.inspect)(runtimeTypeName)}".`
        );
      }
      const runtimeType = exeContext.schema.getType(runtimeTypeName);
      if (runtimeType == null) {
        throw new _GraphQLError.GraphQLError(
          `Abstract type "${returnType.name}" was resolved to a type "${runtimeTypeName}" that does not exist inside the schema.`,
          {
            nodes: fieldNodes
          }
        );
      }
      if (!(0, _definition.isObjectType)(runtimeType)) {
        throw new _GraphQLError.GraphQLError(
          `Abstract type "${returnType.name}" was resolved to a non-object type "${runtimeTypeName}".`,
          {
            nodes: fieldNodes
          }
        );
      }
      if (!exeContext.schema.isSubType(returnType, runtimeType)) {
        throw new _GraphQLError.GraphQLError(
          `Runtime Object type "${runtimeType.name}" is not a possible type for "${returnType.name}".`,
          {
            nodes: fieldNodes
          }
        );
      }
      return runtimeType;
    }
    function completeObjectValue(exeContext, returnType, fieldNodes, info, path, result) {
      const subFieldNodes = collectSubfields(exeContext, returnType, fieldNodes);
      if (returnType.isTypeOf) {
        const isTypeOf = returnType.isTypeOf(result, exeContext.contextValue, info);
        if ((0, _isPromise.isPromise)(isTypeOf)) {
          return isTypeOf.then((resolvedIsTypeOf) => {
            if (!resolvedIsTypeOf) {
              throw invalidReturnTypeError(returnType, result, fieldNodes);
            }
            return executeFields(
              exeContext,
              returnType,
              result,
              path,
              subFieldNodes
            );
          });
        }
        if (!isTypeOf) {
          throw invalidReturnTypeError(returnType, result, fieldNodes);
        }
      }
      return executeFields(exeContext, returnType, result, path, subFieldNodes);
    }
    function invalidReturnTypeError(returnType, result, fieldNodes) {
      return new _GraphQLError.GraphQLError(
        `Expected value of type "${returnType.name}" but got: ${(0, _inspect.inspect)(result)}.`,
        {
          nodes: fieldNodes
        }
      );
    }
    var defaultTypeResolver = function(value, contextValue, info, abstractType) {
      if ((0, _isObjectLike.isObjectLike)(value) && typeof value.__typename === "string") {
        return value.__typename;
      }
      const possibleTypes = info.schema.getPossibleTypes(abstractType);
      const promisedIsTypeOfResults = [];
      try {
        for (let i = 0; i < possibleTypes.length; i++) {
          const type = possibleTypes[i];
          if (type.isTypeOf) {
            const isTypeOfResult = type.isTypeOf(value, contextValue, info);
            if ((0, _isPromise.isPromise)(isTypeOfResult)) {
              promisedIsTypeOfResults[i] = isTypeOfResult;
            } else if (isTypeOfResult) {
              if (promisedIsTypeOfResults.length) {
                Promise.allSettled(promisedIsTypeOfResults).catch(() => {
                });
              }
              return type.name;
            }
          }
        }
      } catch (error) {
        if (promisedIsTypeOfResults.length) {
          return Promise.allSettled(promisedIsTypeOfResults).then(() => {
            throw error;
          });
        }
        throw error;
      }
      if (promisedIsTypeOfResults.length) {
        return Promise.all(promisedIsTypeOfResults).then((isTypeOfResults) => {
          for (let i = 0; i < isTypeOfResults.length; i++) {
            if (isTypeOfResults[i]) {
              return possibleTypes[i].name;
            }
          }
        });
      }
    };
    exports.defaultTypeResolver = defaultTypeResolver;
    var defaultFieldResolver = function(source, args, contextValue, info) {
      if ((0, _isObjectLike.isObjectLike)(source) || typeof source === "function") {
        const property = source[info.fieldName];
        if (typeof property === "function") {
          return source[info.fieldName](args, contextValue, info);
        }
        return property;
      }
    };
    exports.defaultFieldResolver = defaultFieldResolver;
    function getFieldDef(schema, parentType, fieldNode) {
      const fieldName = fieldNode.name.value;
      if (fieldName === _introspection.SchemaMetaFieldDef.name && schema.getQueryType() === parentType) {
        return _introspection.SchemaMetaFieldDef;
      } else if (fieldName === _introspection.TypeMetaFieldDef.name && schema.getQueryType() === parentType) {
        return _introspection.TypeMetaFieldDef;
      } else if (fieldName === _introspection.TypeNameMetaFieldDef.name) {
        return _introspection.TypeNameMetaFieldDef;
      }
      return parentType.getFields()[fieldName];
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/graphql.js
var require_graphql = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/graphql.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.graphql = graphql;
    exports.graphqlSync = graphqlSync;
    var _devAssert = require_devAssert();
    var _isPromise = require_isPromise();
    var _parser = require_parser();
    var _validate = require_validate();
    var _validate2 = require_validate2();
    var _execute = require_execute();
    function graphql(args) {
      return new Promise((resolve) => resolve(graphqlImpl(args)));
    }
    function graphqlSync(args) {
      const result = graphqlImpl(args);
      if ((0, _isPromise.isPromise)(result)) {
        throw new Error("GraphQL execution failed to complete synchronously.");
      }
      return result;
    }
    function graphqlImpl(args) {
      arguments.length < 2 || (0, _devAssert.devAssert)(
        false,
        "graphql@16 dropped long-deprecated support for positional arguments, please pass an object instead."
      );
      const {
        schema,
        source,
        rootValue,
        contextValue,
        variableValues,
        operationName,
        fieldResolver: fieldResolver2,
        typeResolver,
        hideSuggestions
      } = args;
      const schemaValidationErrors = (0, _validate.validateSchema)(schema);
      if (schemaValidationErrors.length > 0) {
        return {
          errors: schemaValidationErrors
        };
      }
      let document;
      try {
        document = (0, _parser.parse)(source);
      } catch (syntaxError) {
        return {
          errors: [syntaxError]
        };
      }
      const validationErrors = (0, _validate2.validate)(
        schema,
        document,
        void 0,
        {
          hideSuggestions
        }
      );
      if (validationErrors.length > 0) {
        return {
          errors: validationErrors
        };
      }
      return (0, _execute.execute)({
        schema,
        document,
        rootValue,
        contextValue,
        variableValues,
        operationName,
        fieldResolver: fieldResolver2,
        typeResolver,
        hideSuggestions
      });
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/type/index.js
var require_type = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/type/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "DEFAULT_DEPRECATION_REASON", {
      enumerable: true,
      get: function() {
        return _directives.DEFAULT_DEPRECATION_REASON;
      }
    });
    Object.defineProperty(exports, "GRAPHQL_MAX_INT", {
      enumerable: true,
      get: function() {
        return _scalars.GRAPHQL_MAX_INT;
      }
    });
    Object.defineProperty(exports, "GRAPHQL_MIN_INT", {
      enumerable: true,
      get: function() {
        return _scalars.GRAPHQL_MIN_INT;
      }
    });
    Object.defineProperty(exports, "GraphQLBoolean", {
      enumerable: true,
      get: function() {
        return _scalars.GraphQLBoolean;
      }
    });
    Object.defineProperty(exports, "GraphQLDeprecatedDirective", {
      enumerable: true,
      get: function() {
        return _directives.GraphQLDeprecatedDirective;
      }
    });
    Object.defineProperty(exports, "GraphQLDirective", {
      enumerable: true,
      get: function() {
        return _directives.GraphQLDirective;
      }
    });
    Object.defineProperty(exports, "GraphQLEnumType", {
      enumerable: true,
      get: function() {
        return _definition.GraphQLEnumType;
      }
    });
    Object.defineProperty(exports, "GraphQLFloat", {
      enumerable: true,
      get: function() {
        return _scalars.GraphQLFloat;
      }
    });
    Object.defineProperty(exports, "GraphQLID", {
      enumerable: true,
      get: function() {
        return _scalars.GraphQLID;
      }
    });
    Object.defineProperty(exports, "GraphQLIncludeDirective", {
      enumerable: true,
      get: function() {
        return _directives.GraphQLIncludeDirective;
      }
    });
    Object.defineProperty(exports, "GraphQLInputObjectType", {
      enumerable: true,
      get: function() {
        return _definition.GraphQLInputObjectType;
      }
    });
    Object.defineProperty(exports, "GraphQLInt", {
      enumerable: true,
      get: function() {
        return _scalars.GraphQLInt;
      }
    });
    Object.defineProperty(exports, "GraphQLInterfaceType", {
      enumerable: true,
      get: function() {
        return _definition.GraphQLInterfaceType;
      }
    });
    Object.defineProperty(exports, "GraphQLList", {
      enumerable: true,
      get: function() {
        return _definition.GraphQLList;
      }
    });
    Object.defineProperty(exports, "GraphQLNonNull", {
      enumerable: true,
      get: function() {
        return _definition.GraphQLNonNull;
      }
    });
    Object.defineProperty(exports, "GraphQLObjectType", {
      enumerable: true,
      get: function() {
        return _definition.GraphQLObjectType;
      }
    });
    Object.defineProperty(exports, "GraphQLOneOfDirective", {
      enumerable: true,
      get: function() {
        return _directives.GraphQLOneOfDirective;
      }
    });
    Object.defineProperty(exports, "GraphQLScalarType", {
      enumerable: true,
      get: function() {
        return _definition.GraphQLScalarType;
      }
    });
    Object.defineProperty(exports, "GraphQLSchema", {
      enumerable: true,
      get: function() {
        return _schema.GraphQLSchema;
      }
    });
    Object.defineProperty(exports, "GraphQLSkipDirective", {
      enumerable: true,
      get: function() {
        return _directives.GraphQLSkipDirective;
      }
    });
    Object.defineProperty(exports, "GraphQLSpecifiedByDirective", {
      enumerable: true,
      get: function() {
        return _directives.GraphQLSpecifiedByDirective;
      }
    });
    Object.defineProperty(exports, "GraphQLString", {
      enumerable: true,
      get: function() {
        return _scalars.GraphQLString;
      }
    });
    Object.defineProperty(exports, "GraphQLUnionType", {
      enumerable: true,
      get: function() {
        return _definition.GraphQLUnionType;
      }
    });
    Object.defineProperty(exports, "SchemaMetaFieldDef", {
      enumerable: true,
      get: function() {
        return _introspection.SchemaMetaFieldDef;
      }
    });
    Object.defineProperty(exports, "TypeKind", {
      enumerable: true,
      get: function() {
        return _introspection.TypeKind;
      }
    });
    Object.defineProperty(exports, "TypeMetaFieldDef", {
      enumerable: true,
      get: function() {
        return _introspection.TypeMetaFieldDef;
      }
    });
    Object.defineProperty(exports, "TypeNameMetaFieldDef", {
      enumerable: true,
      get: function() {
        return _introspection.TypeNameMetaFieldDef;
      }
    });
    Object.defineProperty(exports, "__Directive", {
      enumerable: true,
      get: function() {
        return _introspection.__Directive;
      }
    });
    Object.defineProperty(exports, "__DirectiveLocation", {
      enumerable: true,
      get: function() {
        return _introspection.__DirectiveLocation;
      }
    });
    Object.defineProperty(exports, "__EnumValue", {
      enumerable: true,
      get: function() {
        return _introspection.__EnumValue;
      }
    });
    Object.defineProperty(exports, "__Field", {
      enumerable: true,
      get: function() {
        return _introspection.__Field;
      }
    });
    Object.defineProperty(exports, "__InputValue", {
      enumerable: true,
      get: function() {
        return _introspection.__InputValue;
      }
    });
    Object.defineProperty(exports, "__Schema", {
      enumerable: true,
      get: function() {
        return _introspection.__Schema;
      }
    });
    Object.defineProperty(exports, "__Type", {
      enumerable: true,
      get: function() {
        return _introspection.__Type;
      }
    });
    Object.defineProperty(exports, "__TypeKind", {
      enumerable: true,
      get: function() {
        return _introspection.__TypeKind;
      }
    });
    Object.defineProperty(exports, "assertAbstractType", {
      enumerable: true,
      get: function() {
        return _definition.assertAbstractType;
      }
    });
    Object.defineProperty(exports, "assertCompositeType", {
      enumerable: true,
      get: function() {
        return _definition.assertCompositeType;
      }
    });
    Object.defineProperty(exports, "assertDirective", {
      enumerable: true,
      get: function() {
        return _directives.assertDirective;
      }
    });
    Object.defineProperty(exports, "assertEnumType", {
      enumerable: true,
      get: function() {
        return _definition.assertEnumType;
      }
    });
    Object.defineProperty(exports, "assertEnumValueName", {
      enumerable: true,
      get: function() {
        return _assertName.assertEnumValueName;
      }
    });
    Object.defineProperty(exports, "assertInputObjectType", {
      enumerable: true,
      get: function() {
        return _definition.assertInputObjectType;
      }
    });
    Object.defineProperty(exports, "assertInputType", {
      enumerable: true,
      get: function() {
        return _definition.assertInputType;
      }
    });
    Object.defineProperty(exports, "assertInterfaceType", {
      enumerable: true,
      get: function() {
        return _definition.assertInterfaceType;
      }
    });
    Object.defineProperty(exports, "assertLeafType", {
      enumerable: true,
      get: function() {
        return _definition.assertLeafType;
      }
    });
    Object.defineProperty(exports, "assertListType", {
      enumerable: true,
      get: function() {
        return _definition.assertListType;
      }
    });
    Object.defineProperty(exports, "assertName", {
      enumerable: true,
      get: function() {
        return _assertName.assertName;
      }
    });
    Object.defineProperty(exports, "assertNamedType", {
      enumerable: true,
      get: function() {
        return _definition.assertNamedType;
      }
    });
    Object.defineProperty(exports, "assertNonNullType", {
      enumerable: true,
      get: function() {
        return _definition.assertNonNullType;
      }
    });
    Object.defineProperty(exports, "assertNullableType", {
      enumerable: true,
      get: function() {
        return _definition.assertNullableType;
      }
    });
    Object.defineProperty(exports, "assertObjectType", {
      enumerable: true,
      get: function() {
        return _definition.assertObjectType;
      }
    });
    Object.defineProperty(exports, "assertOutputType", {
      enumerable: true,
      get: function() {
        return _definition.assertOutputType;
      }
    });
    Object.defineProperty(exports, "assertScalarType", {
      enumerable: true,
      get: function() {
        return _definition.assertScalarType;
      }
    });
    Object.defineProperty(exports, "assertSchema", {
      enumerable: true,
      get: function() {
        return _schema.assertSchema;
      }
    });
    Object.defineProperty(exports, "assertType", {
      enumerable: true,
      get: function() {
        return _definition.assertType;
      }
    });
    Object.defineProperty(exports, "assertUnionType", {
      enumerable: true,
      get: function() {
        return _definition.assertUnionType;
      }
    });
    Object.defineProperty(exports, "assertValidSchema", {
      enumerable: true,
      get: function() {
        return _validate.assertValidSchema;
      }
    });
    Object.defineProperty(exports, "assertWrappingType", {
      enumerable: true,
      get: function() {
        return _definition.assertWrappingType;
      }
    });
    Object.defineProperty(exports, "getNamedType", {
      enumerable: true,
      get: function() {
        return _definition.getNamedType;
      }
    });
    Object.defineProperty(exports, "getNullableType", {
      enumerable: true,
      get: function() {
        return _definition.getNullableType;
      }
    });
    Object.defineProperty(exports, "introspectionTypes", {
      enumerable: true,
      get: function() {
        return _introspection.introspectionTypes;
      }
    });
    Object.defineProperty(exports, "isAbstractType", {
      enumerable: true,
      get: function() {
        return _definition.isAbstractType;
      }
    });
    Object.defineProperty(exports, "isCompositeType", {
      enumerable: true,
      get: function() {
        return _definition.isCompositeType;
      }
    });
    Object.defineProperty(exports, "isDirective", {
      enumerable: true,
      get: function() {
        return _directives.isDirective;
      }
    });
    Object.defineProperty(exports, "isEnumType", {
      enumerable: true,
      get: function() {
        return _definition.isEnumType;
      }
    });
    Object.defineProperty(exports, "isInputObjectType", {
      enumerable: true,
      get: function() {
        return _definition.isInputObjectType;
      }
    });
    Object.defineProperty(exports, "isInputType", {
      enumerable: true,
      get: function() {
        return _definition.isInputType;
      }
    });
    Object.defineProperty(exports, "isInterfaceType", {
      enumerable: true,
      get: function() {
        return _definition.isInterfaceType;
      }
    });
    Object.defineProperty(exports, "isIntrospectionType", {
      enumerable: true,
      get: function() {
        return _introspection.isIntrospectionType;
      }
    });
    Object.defineProperty(exports, "isLeafType", {
      enumerable: true,
      get: function() {
        return _definition.isLeafType;
      }
    });
    Object.defineProperty(exports, "isListType", {
      enumerable: true,
      get: function() {
        return _definition.isListType;
      }
    });
    Object.defineProperty(exports, "isNamedType", {
      enumerable: true,
      get: function() {
        return _definition.isNamedType;
      }
    });
    Object.defineProperty(exports, "isNonNullType", {
      enumerable: true,
      get: function() {
        return _definition.isNonNullType;
      }
    });
    Object.defineProperty(exports, "isNullableType", {
      enumerable: true,
      get: function() {
        return _definition.isNullableType;
      }
    });
    Object.defineProperty(exports, "isObjectType", {
      enumerable: true,
      get: function() {
        return _definition.isObjectType;
      }
    });
    Object.defineProperty(exports, "isOutputType", {
      enumerable: true,
      get: function() {
        return _definition.isOutputType;
      }
    });
    Object.defineProperty(exports, "isRequiredArgument", {
      enumerable: true,
      get: function() {
        return _definition.isRequiredArgument;
      }
    });
    Object.defineProperty(exports, "isRequiredInputField", {
      enumerable: true,
      get: function() {
        return _definition.isRequiredInputField;
      }
    });
    Object.defineProperty(exports, "isScalarType", {
      enumerable: true,
      get: function() {
        return _definition.isScalarType;
      }
    });
    Object.defineProperty(exports, "isSchema", {
      enumerable: true,
      get: function() {
        return _schema.isSchema;
      }
    });
    Object.defineProperty(exports, "isSpecifiedDirective", {
      enumerable: true,
      get: function() {
        return _directives.isSpecifiedDirective;
      }
    });
    Object.defineProperty(exports, "isSpecifiedScalarType", {
      enumerable: true,
      get: function() {
        return _scalars.isSpecifiedScalarType;
      }
    });
    Object.defineProperty(exports, "isType", {
      enumerable: true,
      get: function() {
        return _definition.isType;
      }
    });
    Object.defineProperty(exports, "isUnionType", {
      enumerable: true,
      get: function() {
        return _definition.isUnionType;
      }
    });
    Object.defineProperty(exports, "isWrappingType", {
      enumerable: true,
      get: function() {
        return _definition.isWrappingType;
      }
    });
    Object.defineProperty(exports, "resolveObjMapThunk", {
      enumerable: true,
      get: function() {
        return _definition.resolveObjMapThunk;
      }
    });
    Object.defineProperty(exports, "resolveReadonlyArrayThunk", {
      enumerable: true,
      get: function() {
        return _definition.resolveReadonlyArrayThunk;
      }
    });
    Object.defineProperty(exports, "specifiedDirectives", {
      enumerable: true,
      get: function() {
        return _directives.specifiedDirectives;
      }
    });
    Object.defineProperty(exports, "specifiedScalarTypes", {
      enumerable: true,
      get: function() {
        return _scalars.specifiedScalarTypes;
      }
    });
    Object.defineProperty(exports, "validateSchema", {
      enumerable: true,
      get: function() {
        return _validate.validateSchema;
      }
    });
    var _schema = require_schema();
    var _definition = require_definition();
    var _directives = require_directives();
    var _scalars = require_scalars();
    var _introspection = require_introspection();
    var _validate = require_validate();
    var _assertName = require_assertName();
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/index.js
var require_language = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/language/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "BREAK", {
      enumerable: true,
      get: function() {
        return _visitor.BREAK;
      }
    });
    Object.defineProperty(exports, "DirectiveLocation", {
      enumerable: true,
      get: function() {
        return _directiveLocation.DirectiveLocation;
      }
    });
    Object.defineProperty(exports, "Kind", {
      enumerable: true,
      get: function() {
        return _kinds.Kind;
      }
    });
    Object.defineProperty(exports, "Lexer", {
      enumerable: true,
      get: function() {
        return _lexer.Lexer;
      }
    });
    Object.defineProperty(exports, "Location", {
      enumerable: true,
      get: function() {
        return _ast.Location;
      }
    });
    Object.defineProperty(exports, "OperationTypeNode", {
      enumerable: true,
      get: function() {
        return _ast.OperationTypeNode;
      }
    });
    Object.defineProperty(exports, "Source", {
      enumerable: true,
      get: function() {
        return _source.Source;
      }
    });
    Object.defineProperty(exports, "Token", {
      enumerable: true,
      get: function() {
        return _ast.Token;
      }
    });
    Object.defineProperty(exports, "TokenKind", {
      enumerable: true,
      get: function() {
        return _tokenKind.TokenKind;
      }
    });
    Object.defineProperty(exports, "getEnterLeaveForKind", {
      enumerable: true,
      get: function() {
        return _visitor.getEnterLeaveForKind;
      }
    });
    Object.defineProperty(exports, "getLocation", {
      enumerable: true,
      get: function() {
        return _location.getLocation;
      }
    });
    Object.defineProperty(exports, "getVisitFn", {
      enumerable: true,
      get: function() {
        return _visitor.getVisitFn;
      }
    });
    Object.defineProperty(exports, "isConstValueNode", {
      enumerable: true,
      get: function() {
        return _predicates.isConstValueNode;
      }
    });
    Object.defineProperty(exports, "isDefinitionNode", {
      enumerable: true,
      get: function() {
        return _predicates.isDefinitionNode;
      }
    });
    Object.defineProperty(exports, "isExecutableDefinitionNode", {
      enumerable: true,
      get: function() {
        return _predicates.isExecutableDefinitionNode;
      }
    });
    Object.defineProperty(exports, "isSchemaCoordinateNode", {
      enumerable: true,
      get: function() {
        return _predicates.isSchemaCoordinateNode;
      }
    });
    Object.defineProperty(exports, "isSelectionNode", {
      enumerable: true,
      get: function() {
        return _predicates.isSelectionNode;
      }
    });
    Object.defineProperty(exports, "isTypeDefinitionNode", {
      enumerable: true,
      get: function() {
        return _predicates.isTypeDefinitionNode;
      }
    });
    Object.defineProperty(exports, "isTypeExtensionNode", {
      enumerable: true,
      get: function() {
        return _predicates.isTypeExtensionNode;
      }
    });
    Object.defineProperty(exports, "isTypeNode", {
      enumerable: true,
      get: function() {
        return _predicates.isTypeNode;
      }
    });
    Object.defineProperty(exports, "isTypeSystemDefinitionNode", {
      enumerable: true,
      get: function() {
        return _predicates.isTypeSystemDefinitionNode;
      }
    });
    Object.defineProperty(exports, "isTypeSystemExtensionNode", {
      enumerable: true,
      get: function() {
        return _predicates.isTypeSystemExtensionNode;
      }
    });
    Object.defineProperty(exports, "isValueNode", {
      enumerable: true,
      get: function() {
        return _predicates.isValueNode;
      }
    });
    Object.defineProperty(exports, "parse", {
      enumerable: true,
      get: function() {
        return _parser.parse;
      }
    });
    Object.defineProperty(exports, "parseConstValue", {
      enumerable: true,
      get: function() {
        return _parser.parseConstValue;
      }
    });
    Object.defineProperty(exports, "parseSchemaCoordinate", {
      enumerable: true,
      get: function() {
        return _parser.parseSchemaCoordinate;
      }
    });
    Object.defineProperty(exports, "parseType", {
      enumerable: true,
      get: function() {
        return _parser.parseType;
      }
    });
    Object.defineProperty(exports, "parseValue", {
      enumerable: true,
      get: function() {
        return _parser.parseValue;
      }
    });
    Object.defineProperty(exports, "print", {
      enumerable: true,
      get: function() {
        return _printer.print;
      }
    });
    Object.defineProperty(exports, "printLocation", {
      enumerable: true,
      get: function() {
        return _printLocation.printLocation;
      }
    });
    Object.defineProperty(exports, "printSourceLocation", {
      enumerable: true,
      get: function() {
        return _printLocation.printSourceLocation;
      }
    });
    Object.defineProperty(exports, "visit", {
      enumerable: true,
      get: function() {
        return _visitor.visit;
      }
    });
    Object.defineProperty(exports, "visitInParallel", {
      enumerable: true,
      get: function() {
        return _visitor.visitInParallel;
      }
    });
    var _source = require_source();
    var _location = require_location();
    var _printLocation = require_printLocation();
    var _kinds = require_kinds();
    var _tokenKind = require_tokenKind();
    var _lexer = require_lexer();
    var _parser = require_parser();
    var _printer = require_printer();
    var _visitor = require_visitor();
    var _ast = require_ast();
    var _predicates = require_predicates();
    var _directiveLocation = require_directiveLocation();
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/isAsyncIterable.js
var require_isAsyncIterable = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/jsutils/isAsyncIterable.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.isAsyncIterable = isAsyncIterable;
    function isAsyncIterable(maybeAsyncIterable) {
      return typeof (maybeAsyncIterable === null || maybeAsyncIterable === void 0 ? void 0 : maybeAsyncIterable[Symbol.asyncIterator]) === "function";
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/execution/mapAsyncIterator.js
var require_mapAsyncIterator = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/execution/mapAsyncIterator.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.mapAsyncIterator = mapAsyncIterator;
    function mapAsyncIterator(iterable, callback) {
      const iterator = iterable[Symbol.asyncIterator]();
      async function mapResult(result) {
        if (result.done) {
          return result;
        }
        try {
          return {
            value: await callback(result.value),
            done: false
          };
        } catch (error) {
          await returnIgnoringErrors();
          throw error;
        }
      }
      async function returnIgnoringErrors() {
        if (typeof iterator.return === "function") {
          try {
            await iterator.return();
          } catch (_error) {
          }
        }
      }
      return {
        async next() {
          return mapResult(await iterator.next());
        },
        async return() {
          return typeof iterator.return === "function" ? mapResult(await iterator.return()) : {
            value: void 0,
            done: true
          };
        },
        async throw(error) {
          if (typeof iterator.throw === "function") {
            return mapResult(await iterator.throw(error));
          }
          await returnIgnoringErrors();
          throw error;
        },
        [Symbol.asyncIterator]() {
          return this;
        }
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/execution/subscribe.js
var require_subscribe = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/execution/subscribe.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.createSourceEventStream = createSourceEventStream;
    exports.subscribe = subscribe;
    var _devAssert = require_devAssert();
    var _inspect = require_inspect();
    var _isAsyncIterable = require_isAsyncIterable();
    var _Path = require_Path();
    var _GraphQLError = require_GraphQLError();
    var _locatedError = require_locatedError();
    var _collectFields = require_collectFields();
    var _execute = require_execute();
    var _mapAsyncIterator = require_mapAsyncIterator();
    var _values = require_values();
    async function subscribe(args) {
      arguments.length < 2 || (0, _devAssert.devAssert)(
        false,
        "graphql@16 dropped long-deprecated support for positional arguments, please pass an object instead."
      );
      const resultOrStream = await createSourceEventStream(args);
      if (!(0, _isAsyncIterable.isAsyncIterable)(resultOrStream)) {
        return resultOrStream;
      }
      const mapSourceToResponse = (payload) => (0, _execute.execute)({ ...args, rootValue: payload });
      return (0, _mapAsyncIterator.mapAsyncIterator)(
        resultOrStream,
        mapSourceToResponse
      );
    }
    function toNormalizedArgs(args) {
      const firstArg = args[0];
      if (firstArg && "document" in firstArg) {
        return firstArg;
      }
      return {
        schema: firstArg,
        // FIXME: when underlying TS bug fixed, see https://github.com/microsoft/TypeScript/issues/31613
        document: args[1],
        rootValue: args[2],
        contextValue: args[3],
        variableValues: args[4],
        operationName: args[5],
        subscribeFieldResolver: args[6]
      };
    }
    async function createSourceEventStream(...rawArgs) {
      const args = toNormalizedArgs(rawArgs);
      const { schema, document, variableValues } = args;
      (0, _execute.assertValidExecutionArguments)(schema, document, variableValues);
      const exeContext = (0, _execute.buildExecutionContext)(args);
      if (!("schema" in exeContext)) {
        return {
          errors: exeContext
        };
      }
      try {
        const eventStream = await executeSubscription(exeContext);
        if (!(0, _isAsyncIterable.isAsyncIterable)(eventStream)) {
          throw new Error(
            `Subscription field must return Async Iterable. Received: ${(0, _inspect.inspect)(eventStream)}.`
          );
        }
        return eventStream;
      } catch (error) {
        if (error instanceof _GraphQLError.GraphQLError) {
          return {
            errors: [error]
          };
        }
        throw error;
      }
    }
    async function executeSubscription(exeContext) {
      const { schema, fragments, operation, variableValues, rootValue } = exeContext;
      const rootType = schema.getSubscriptionType();
      if (rootType == null) {
        throw new _GraphQLError.GraphQLError(
          "Schema is not configured to execute subscription operation.",
          {
            nodes: operation
          }
        );
      }
      const rootFields = (0, _collectFields.collectFields)(
        schema,
        fragments,
        variableValues,
        rootType,
        operation.selectionSet
      );
      const [responseName, fieldNodes] = [...rootFields.entries()][0];
      const fieldDef = (0, _execute.getFieldDef)(schema, rootType, fieldNodes[0]);
      if (!fieldDef) {
        const fieldName = fieldNodes[0].name.value;
        throw new _GraphQLError.GraphQLError(
          `The subscription field "${fieldName}" is not defined.`,
          {
            nodes: fieldNodes
          }
        );
      }
      const path = (0, _Path.addPath)(void 0, responseName, rootType.name);
      const info = (0, _execute.buildResolveInfo)(
        exeContext,
        fieldDef,
        fieldNodes,
        rootType,
        path
      );
      try {
        var _fieldDef$subscribe;
        const args = (0, _values.getArgumentValues)(
          fieldDef,
          fieldNodes[0],
          variableValues
        );
        const contextValue = exeContext.contextValue;
        const resolveFn = (_fieldDef$subscribe = fieldDef.subscribe) !== null && _fieldDef$subscribe !== void 0 ? _fieldDef$subscribe : exeContext.subscribeFieldResolver;
        const eventStream = await resolveFn(rootValue, args, contextValue, info);
        if (eventStream instanceof Error) {
          throw eventStream;
        }
        return eventStream;
      } catch (error) {
        throw (0, _locatedError.locatedError)(
          error,
          fieldNodes,
          (0, _Path.pathToArray)(path)
        );
      }
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/execution/index.js
var require_execution = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/execution/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "createSourceEventStream", {
      enumerable: true,
      get: function() {
        return _subscribe.createSourceEventStream;
      }
    });
    Object.defineProperty(exports, "defaultFieldResolver", {
      enumerable: true,
      get: function() {
        return _execute.defaultFieldResolver;
      }
    });
    Object.defineProperty(exports, "defaultTypeResolver", {
      enumerable: true,
      get: function() {
        return _execute.defaultTypeResolver;
      }
    });
    Object.defineProperty(exports, "execute", {
      enumerable: true,
      get: function() {
        return _execute.execute;
      }
    });
    Object.defineProperty(exports, "executeSync", {
      enumerable: true,
      get: function() {
        return _execute.executeSync;
      }
    });
    Object.defineProperty(exports, "getArgumentValues", {
      enumerable: true,
      get: function() {
        return _values.getArgumentValues;
      }
    });
    Object.defineProperty(exports, "getDirectiveValues", {
      enumerable: true,
      get: function() {
        return _values.getDirectiveValues;
      }
    });
    Object.defineProperty(exports, "getVariableValues", {
      enumerable: true,
      get: function() {
        return _values.getVariableValues;
      }
    });
    Object.defineProperty(exports, "responsePathAsArray", {
      enumerable: true,
      get: function() {
        return _Path.pathToArray;
      }
    });
    Object.defineProperty(exports, "subscribe", {
      enumerable: true,
      get: function() {
        return _subscribe.subscribe;
      }
    });
    var _Path = require_Path();
    var _execute = require_execute();
    var _subscribe = require_subscribe();
    var _values = require_values();
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/custom/NoDeprecatedCustomRule.js
var require_NoDeprecatedCustomRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/custom/NoDeprecatedCustomRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.NoDeprecatedCustomRule = NoDeprecatedCustomRule;
    var _invariant = require_invariant();
    var _GraphQLError = require_GraphQLError();
    var _definition = require_definition();
    function NoDeprecatedCustomRule(context) {
      return {
        Field(node2) {
          const fieldDef = context.getFieldDef();
          const deprecationReason = fieldDef === null || fieldDef === void 0 ? void 0 : fieldDef.deprecationReason;
          if (fieldDef && deprecationReason != null) {
            const parentType = context.getParentType();
            parentType != null || (0, _invariant.invariant)(false);
            context.reportError(
              new _GraphQLError.GraphQLError(
                `The field ${parentType.name}.${fieldDef.name} is deprecated. ${deprecationReason}`,
                {
                  nodes: node2
                }
              )
            );
          }
        },
        Argument(node2) {
          const argDef = context.getArgument();
          const deprecationReason = argDef === null || argDef === void 0 ? void 0 : argDef.deprecationReason;
          if (argDef && deprecationReason != null) {
            const directiveDef = context.getDirective();
            if (directiveDef != null) {
              context.reportError(
                new _GraphQLError.GraphQLError(
                  `Directive "@${directiveDef.name}" argument "${argDef.name}" is deprecated. ${deprecationReason}`,
                  {
                    nodes: node2
                  }
                )
              );
            } else {
              const parentType = context.getParentType();
              const fieldDef = context.getFieldDef();
              parentType != null && fieldDef != null || (0, _invariant.invariant)(false);
              context.reportError(
                new _GraphQLError.GraphQLError(
                  `Field "${parentType.name}.${fieldDef.name}" argument "${argDef.name}" is deprecated. ${deprecationReason}`,
                  {
                    nodes: node2
                  }
                )
              );
            }
          }
        },
        ObjectField(node2) {
          const inputObjectDef = (0, _definition.getNamedType)(
            context.getParentInputType()
          );
          if ((0, _definition.isInputObjectType)(inputObjectDef)) {
            const inputFieldDef = inputObjectDef.getFields()[node2.name.value];
            const deprecationReason = inputFieldDef === null || inputFieldDef === void 0 ? void 0 : inputFieldDef.deprecationReason;
            if (deprecationReason != null) {
              context.reportError(
                new _GraphQLError.GraphQLError(
                  `The input field ${inputObjectDef.name}.${inputFieldDef.name} is deprecated. ${deprecationReason}`,
                  {
                    nodes: node2
                  }
                )
              );
            }
          }
        },
        EnumValue(node2) {
          const enumValueDef = context.getEnumValue();
          const deprecationReason = enumValueDef === null || enumValueDef === void 0 ? void 0 : enumValueDef.deprecationReason;
          if (enumValueDef && deprecationReason != null) {
            const enumTypeDef = (0, _definition.getNamedType)(
              context.getInputType()
            );
            enumTypeDef != null || (0, _invariant.invariant)(false);
            context.reportError(
              new _GraphQLError.GraphQLError(
                `The enum value "${enumTypeDef.name}.${enumValueDef.name}" is deprecated. ${deprecationReason}`,
                {
                  nodes: node2
                }
              )
            );
          }
        }
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/custom/NoSchemaIntrospectionCustomRule.js
var require_NoSchemaIntrospectionCustomRule = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/rules/custom/NoSchemaIntrospectionCustomRule.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.NoSchemaIntrospectionCustomRule = NoSchemaIntrospectionCustomRule;
    var _GraphQLError = require_GraphQLError();
    var _definition = require_definition();
    var _introspection = require_introspection();
    function NoSchemaIntrospectionCustomRule(context) {
      return {
        Field(node2) {
          const type = (0, _definition.getNamedType)(context.getType());
          if (type && (0, _introspection.isIntrospectionType)(type)) {
            context.reportError(
              new _GraphQLError.GraphQLError(
                `GraphQL introspection has been disabled, but the requested query contained the field "${node2.name.value}".`,
                {
                  nodes: node2
                }
              )
            );
          }
        }
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/index.js
var require_validation = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/validation/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "ExecutableDefinitionsRule", {
      enumerable: true,
      get: function() {
        return _ExecutableDefinitionsRule.ExecutableDefinitionsRule;
      }
    });
    Object.defineProperty(exports, "FieldsOnCorrectTypeRule", {
      enumerable: true,
      get: function() {
        return _FieldsOnCorrectTypeRule.FieldsOnCorrectTypeRule;
      }
    });
    Object.defineProperty(exports, "FragmentsOnCompositeTypesRule", {
      enumerable: true,
      get: function() {
        return _FragmentsOnCompositeTypesRule.FragmentsOnCompositeTypesRule;
      }
    });
    Object.defineProperty(exports, "KnownArgumentNamesRule", {
      enumerable: true,
      get: function() {
        return _KnownArgumentNamesRule.KnownArgumentNamesRule;
      }
    });
    Object.defineProperty(exports, "KnownDirectivesRule", {
      enumerable: true,
      get: function() {
        return _KnownDirectivesRule.KnownDirectivesRule;
      }
    });
    Object.defineProperty(exports, "KnownFragmentNamesRule", {
      enumerable: true,
      get: function() {
        return _KnownFragmentNamesRule.KnownFragmentNamesRule;
      }
    });
    Object.defineProperty(exports, "KnownTypeNamesRule", {
      enumerable: true,
      get: function() {
        return _KnownTypeNamesRule.KnownTypeNamesRule;
      }
    });
    Object.defineProperty(exports, "LoneAnonymousOperationRule", {
      enumerable: true,
      get: function() {
        return _LoneAnonymousOperationRule.LoneAnonymousOperationRule;
      }
    });
    Object.defineProperty(exports, "LoneSchemaDefinitionRule", {
      enumerable: true,
      get: function() {
        return _LoneSchemaDefinitionRule.LoneSchemaDefinitionRule;
      }
    });
    Object.defineProperty(exports, "MaxIntrospectionDepthRule", {
      enumerable: true,
      get: function() {
        return _MaxIntrospectionDepthRule.MaxIntrospectionDepthRule;
      }
    });
    Object.defineProperty(exports, "NoDeprecatedCustomRule", {
      enumerable: true,
      get: function() {
        return _NoDeprecatedCustomRule.NoDeprecatedCustomRule;
      }
    });
    Object.defineProperty(exports, "NoFragmentCyclesRule", {
      enumerable: true,
      get: function() {
        return _NoFragmentCyclesRule.NoFragmentCyclesRule;
      }
    });
    Object.defineProperty(exports, "NoSchemaIntrospectionCustomRule", {
      enumerable: true,
      get: function() {
        return _NoSchemaIntrospectionCustomRule.NoSchemaIntrospectionCustomRule;
      }
    });
    Object.defineProperty(exports, "NoUndefinedVariablesRule", {
      enumerable: true,
      get: function() {
        return _NoUndefinedVariablesRule.NoUndefinedVariablesRule;
      }
    });
    Object.defineProperty(exports, "NoUnusedFragmentsRule", {
      enumerable: true,
      get: function() {
        return _NoUnusedFragmentsRule.NoUnusedFragmentsRule;
      }
    });
    Object.defineProperty(exports, "NoUnusedVariablesRule", {
      enumerable: true,
      get: function() {
        return _NoUnusedVariablesRule.NoUnusedVariablesRule;
      }
    });
    Object.defineProperty(exports, "OverlappingFieldsCanBeMergedRule", {
      enumerable: true,
      get: function() {
        return _OverlappingFieldsCanBeMergedRule.OverlappingFieldsCanBeMergedRule;
      }
    });
    Object.defineProperty(exports, "PossibleFragmentSpreadsRule", {
      enumerable: true,
      get: function() {
        return _PossibleFragmentSpreadsRule.PossibleFragmentSpreadsRule;
      }
    });
    Object.defineProperty(exports, "PossibleTypeExtensionsRule", {
      enumerable: true,
      get: function() {
        return _PossibleTypeExtensionsRule.PossibleTypeExtensionsRule;
      }
    });
    Object.defineProperty(exports, "ProvidedRequiredArgumentsRule", {
      enumerable: true,
      get: function() {
        return _ProvidedRequiredArgumentsRule.ProvidedRequiredArgumentsRule;
      }
    });
    Object.defineProperty(exports, "ScalarLeafsRule", {
      enumerable: true,
      get: function() {
        return _ScalarLeafsRule.ScalarLeafsRule;
      }
    });
    Object.defineProperty(exports, "SingleFieldSubscriptionsRule", {
      enumerable: true,
      get: function() {
        return _SingleFieldSubscriptionsRule.SingleFieldSubscriptionsRule;
      }
    });
    Object.defineProperty(exports, "UniqueArgumentDefinitionNamesRule", {
      enumerable: true,
      get: function() {
        return _UniqueArgumentDefinitionNamesRule.UniqueArgumentDefinitionNamesRule;
      }
    });
    Object.defineProperty(exports, "UniqueArgumentNamesRule", {
      enumerable: true,
      get: function() {
        return _UniqueArgumentNamesRule.UniqueArgumentNamesRule;
      }
    });
    Object.defineProperty(exports, "UniqueDirectiveNamesRule", {
      enumerable: true,
      get: function() {
        return _UniqueDirectiveNamesRule.UniqueDirectiveNamesRule;
      }
    });
    Object.defineProperty(exports, "UniqueDirectivesPerLocationRule", {
      enumerable: true,
      get: function() {
        return _UniqueDirectivesPerLocationRule.UniqueDirectivesPerLocationRule;
      }
    });
    Object.defineProperty(exports, "UniqueEnumValueNamesRule", {
      enumerable: true,
      get: function() {
        return _UniqueEnumValueNamesRule.UniqueEnumValueNamesRule;
      }
    });
    Object.defineProperty(exports, "UniqueFieldDefinitionNamesRule", {
      enumerable: true,
      get: function() {
        return _UniqueFieldDefinitionNamesRule.UniqueFieldDefinitionNamesRule;
      }
    });
    Object.defineProperty(exports, "UniqueFragmentNamesRule", {
      enumerable: true,
      get: function() {
        return _UniqueFragmentNamesRule.UniqueFragmentNamesRule;
      }
    });
    Object.defineProperty(exports, "UniqueInputFieldNamesRule", {
      enumerable: true,
      get: function() {
        return _UniqueInputFieldNamesRule.UniqueInputFieldNamesRule;
      }
    });
    Object.defineProperty(exports, "UniqueOperationNamesRule", {
      enumerable: true,
      get: function() {
        return _UniqueOperationNamesRule.UniqueOperationNamesRule;
      }
    });
    Object.defineProperty(exports, "UniqueOperationTypesRule", {
      enumerable: true,
      get: function() {
        return _UniqueOperationTypesRule.UniqueOperationTypesRule;
      }
    });
    Object.defineProperty(exports, "UniqueTypeNamesRule", {
      enumerable: true,
      get: function() {
        return _UniqueTypeNamesRule.UniqueTypeNamesRule;
      }
    });
    Object.defineProperty(exports, "UniqueVariableNamesRule", {
      enumerable: true,
      get: function() {
        return _UniqueVariableNamesRule.UniqueVariableNamesRule;
      }
    });
    Object.defineProperty(exports, "ValidationContext", {
      enumerable: true,
      get: function() {
        return _ValidationContext.ValidationContext;
      }
    });
    Object.defineProperty(exports, "ValuesOfCorrectTypeRule", {
      enumerable: true,
      get: function() {
        return _ValuesOfCorrectTypeRule.ValuesOfCorrectTypeRule;
      }
    });
    Object.defineProperty(exports, "VariablesAreInputTypesRule", {
      enumerable: true,
      get: function() {
        return _VariablesAreInputTypesRule.VariablesAreInputTypesRule;
      }
    });
    Object.defineProperty(exports, "VariablesInAllowedPositionRule", {
      enumerable: true,
      get: function() {
        return _VariablesInAllowedPositionRule.VariablesInAllowedPositionRule;
      }
    });
    Object.defineProperty(exports, "recommendedRules", {
      enumerable: true,
      get: function() {
        return _specifiedRules.recommendedRules;
      }
    });
    Object.defineProperty(exports, "specifiedRules", {
      enumerable: true,
      get: function() {
        return _specifiedRules.specifiedRules;
      }
    });
    Object.defineProperty(exports, "validate", {
      enumerable: true,
      get: function() {
        return _validate.validate;
      }
    });
    var _validate = require_validate2();
    var _ValidationContext = require_ValidationContext();
    var _specifiedRules = require_specifiedRules();
    var _ExecutableDefinitionsRule = require_ExecutableDefinitionsRule();
    var _FieldsOnCorrectTypeRule = require_FieldsOnCorrectTypeRule();
    var _FragmentsOnCompositeTypesRule = require_FragmentsOnCompositeTypesRule();
    var _KnownArgumentNamesRule = require_KnownArgumentNamesRule();
    var _KnownDirectivesRule = require_KnownDirectivesRule();
    var _KnownFragmentNamesRule = require_KnownFragmentNamesRule();
    var _KnownTypeNamesRule = require_KnownTypeNamesRule();
    var _LoneAnonymousOperationRule = require_LoneAnonymousOperationRule();
    var _NoFragmentCyclesRule = require_NoFragmentCyclesRule();
    var _NoUndefinedVariablesRule = require_NoUndefinedVariablesRule();
    var _NoUnusedFragmentsRule = require_NoUnusedFragmentsRule();
    var _NoUnusedVariablesRule = require_NoUnusedVariablesRule();
    var _OverlappingFieldsCanBeMergedRule = require_OverlappingFieldsCanBeMergedRule();
    var _PossibleFragmentSpreadsRule = require_PossibleFragmentSpreadsRule();
    var _ProvidedRequiredArgumentsRule = require_ProvidedRequiredArgumentsRule();
    var _ScalarLeafsRule = require_ScalarLeafsRule();
    var _SingleFieldSubscriptionsRule = require_SingleFieldSubscriptionsRule();
    var _UniqueArgumentNamesRule = require_UniqueArgumentNamesRule();
    var _UniqueDirectivesPerLocationRule = require_UniqueDirectivesPerLocationRule();
    var _UniqueFragmentNamesRule = require_UniqueFragmentNamesRule();
    var _UniqueInputFieldNamesRule = require_UniqueInputFieldNamesRule();
    var _UniqueOperationNamesRule = require_UniqueOperationNamesRule();
    var _UniqueVariableNamesRule = require_UniqueVariableNamesRule();
    var _ValuesOfCorrectTypeRule = require_ValuesOfCorrectTypeRule();
    var _VariablesAreInputTypesRule = require_VariablesAreInputTypesRule();
    var _VariablesInAllowedPositionRule = require_VariablesInAllowedPositionRule();
    var _MaxIntrospectionDepthRule = require_MaxIntrospectionDepthRule();
    var _LoneSchemaDefinitionRule = require_LoneSchemaDefinitionRule();
    var _UniqueOperationTypesRule = require_UniqueOperationTypesRule();
    var _UniqueTypeNamesRule = require_UniqueTypeNamesRule();
    var _UniqueEnumValueNamesRule = require_UniqueEnumValueNamesRule();
    var _UniqueFieldDefinitionNamesRule = require_UniqueFieldDefinitionNamesRule();
    var _UniqueArgumentDefinitionNamesRule = require_UniqueArgumentDefinitionNamesRule();
    var _UniqueDirectiveNamesRule = require_UniqueDirectiveNamesRule();
    var _PossibleTypeExtensionsRule = require_PossibleTypeExtensionsRule();
    var _NoDeprecatedCustomRule = require_NoDeprecatedCustomRule();
    var _NoSchemaIntrospectionCustomRule = require_NoSchemaIntrospectionCustomRule();
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/error/index.js
var require_error = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/error/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "GraphQLError", {
      enumerable: true,
      get: function() {
        return _GraphQLError.GraphQLError;
      }
    });
    Object.defineProperty(exports, "formatError", {
      enumerable: true,
      get: function() {
        return _GraphQLError.formatError;
      }
    });
    Object.defineProperty(exports, "locatedError", {
      enumerable: true,
      get: function() {
        return _locatedError.locatedError;
      }
    });
    Object.defineProperty(exports, "printError", {
      enumerable: true,
      get: function() {
        return _GraphQLError.printError;
      }
    });
    Object.defineProperty(exports, "syntaxError", {
      enumerable: true,
      get: function() {
        return _syntaxError.syntaxError;
      }
    });
    var _GraphQLError = require_GraphQLError();
    var _syntaxError = require_syntaxError();
    var _locatedError = require_locatedError();
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/getIntrospectionQuery.js
var require_getIntrospectionQuery = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/getIntrospectionQuery.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.getIntrospectionQuery = getIntrospectionQuery;
    function getIntrospectionQuery(options) {
      const optionsWithDefault = {
        descriptions: true,
        specifiedByUrl: false,
        directiveIsRepeatable: false,
        schemaDescription: false,
        inputValueDeprecation: false,
        experimentalDirectiveDeprecation: false,
        oneOf: false,
        typeDepth: 9,
        ...options
      };
      const descriptions = optionsWithDefault.descriptions ? "description" : "";
      const specifiedByUrl = optionsWithDefault.specifiedByUrl ? "specifiedByURL" : "";
      const directiveIsRepeatable = optionsWithDefault.directiveIsRepeatable ? "isRepeatable" : "";
      const schemaDescription = optionsWithDefault.schemaDescription ? descriptions : "";
      function inputDeprecation(str) {
        return optionsWithDefault.inputValueDeprecation ? str : "";
      }
      function experimentalDirectiveDeprecation(str) {
        return optionsWithDefault.experimentalDirectiveDeprecation ? str : "";
      }
      const oneOf = optionsWithDefault.oneOf ? "isOneOf" : "";
      function ofType(level, indent) {
        if (level <= 0) {
          return "";
        }
        if (level > 100) {
          throw new Error(
            "Please set typeDepth to a reasonable value between 0 and 100; the default is 9."
          );
        }
        return `
${indent}ofType {
${indent}  name
${indent}  kind${ofType(level - 1, indent + "  ")}
${indent}}`;
      }
      return `
    query IntrospectionQuery {
      __schema {
        ${schemaDescription}
        queryType { name kind }
        mutationType { name kind }
        subscriptionType { name kind }
        types {
          ...FullType
        }
        directives${experimentalDirectiveDeprecation(
        "(includeDeprecated: true)"
      )} {
          name
          ${descriptions}
          ${directiveIsRepeatable}
          ${experimentalDirectiveDeprecation("isDeprecated")}
          ${experimentalDirectiveDeprecation("deprecationReason")}
          locations
          args${inputDeprecation("(includeDeprecated: true)")} {
            ...InputValue
          }
        }
      }
    }

    fragment FullType on __Type {
      kind
      name
      ${descriptions}
      ${specifiedByUrl}
      ${oneOf}
      fields(includeDeprecated: true) {
        name
        ${descriptions}
        args${inputDeprecation("(includeDeprecated: true)")} {
          ...InputValue
        }
        type {
          ...TypeRef
        }
        isDeprecated
        deprecationReason
      }
      inputFields${inputDeprecation("(includeDeprecated: true)")} {
        ...InputValue
      }
      interfaces {
        ...TypeRef
      }
      enumValues(includeDeprecated: true) {
        name
        ${descriptions}
        isDeprecated
        deprecationReason
      }
      possibleTypes {
        ...TypeRef
      }
    }

    fragment InputValue on __InputValue {
      name
      ${descriptions}
      type { ...TypeRef }
      defaultValue
      ${inputDeprecation("isDeprecated")}
      ${inputDeprecation("deprecationReason")}
    }

    fragment TypeRef on __Type {
      kind
      name${ofType(optionsWithDefault.typeDepth, "      ")}
    }
  `;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/getOperationAST.js
var require_getOperationAST = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/getOperationAST.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.getOperationAST = getOperationAST;
    var _kinds = require_kinds();
    function getOperationAST(documentAST, operationName) {
      let operation = null;
      for (const definition of documentAST.definitions) {
        if (definition.kind === _kinds.Kind.OPERATION_DEFINITION) {
          var _definition$name;
          if (operationName == null) {
            if (operation) {
              return null;
            }
            operation = definition;
          } else if (((_definition$name = definition.name) === null || _definition$name === void 0 ? void 0 : _definition$name.value) === operationName) {
            return definition;
          }
        }
      }
      return operation;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/getOperationRootType.js
var require_getOperationRootType = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/getOperationRootType.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.getOperationRootType = getOperationRootType;
    var _GraphQLError = require_GraphQLError();
    function getOperationRootType(schema, operation) {
      if (operation.operation === "query") {
        const queryType = schema.getQueryType();
        if (!queryType) {
          throw new _GraphQLError.GraphQLError(
            "Schema does not define the required query root type.",
            {
              nodes: operation
            }
          );
        }
        return queryType;
      }
      if (operation.operation === "mutation") {
        const mutationType = schema.getMutationType();
        if (!mutationType) {
          throw new _GraphQLError.GraphQLError(
            "Schema is not configured for mutations.",
            {
              nodes: operation
            }
          );
        }
        return mutationType;
      }
      if (operation.operation === "subscription") {
        const subscriptionType = schema.getSubscriptionType();
        if (!subscriptionType) {
          throw new _GraphQLError.GraphQLError(
            "Schema is not configured for subscriptions.",
            {
              nodes: operation
            }
          );
        }
        return subscriptionType;
      }
      throw new _GraphQLError.GraphQLError(
        "Can only have query, mutation and subscription operations.",
        {
          nodes: operation
        }
      );
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/introspectionFromSchema.js
var require_introspectionFromSchema = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/introspectionFromSchema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.introspectionFromSchema = introspectionFromSchema;
    var _invariant = require_invariant();
    var _parser = require_parser();
    var _execute = require_execute();
    var _getIntrospectionQuery = require_getIntrospectionQuery();
    function introspectionFromSchema(schema, options) {
      const optionsWithDefaults = {
        specifiedByUrl: true,
        directiveIsRepeatable: true,
        schemaDescription: true,
        inputValueDeprecation: true,
        experimentalDirectiveDeprecation: true,
        oneOf: true,
        ...options
      };
      const document = (0, _parser.parse)(
        (0, _getIntrospectionQuery.getIntrospectionQuery)(optionsWithDefaults)
      );
      const result = (0, _execute.executeSync)({
        schema,
        document
      });
      !result.errors && result.data || (0, _invariant.invariant)(false);
      return result.data;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/buildClientSchema.js
var require_buildClientSchema = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/buildClientSchema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.buildClientSchema = buildClientSchema;
    var _devAssert = require_devAssert();
    var _inspect = require_inspect();
    var _isObjectLike = require_isObjectLike();
    var _keyValMap = require_keyValMap();
    var _parser = require_parser();
    var _definition = require_definition();
    var _directives = require_directives();
    var _introspection = require_introspection();
    var _scalars = require_scalars();
    var _schema = require_schema();
    var _valueFromAST = require_valueFromAST();
    function buildClientSchema(introspection, options) {
      (0, _isObjectLike.isObjectLike)(introspection) && (0, _isObjectLike.isObjectLike)(introspection.__schema) || (0, _devAssert.devAssert)(
        false,
        `Invalid or incomplete introspection result. Ensure that you are passing "data" property of introspection response and no "errors" was returned alongside: ${(0, _inspect.inspect)(introspection)}.`
      );
      const schemaIntrospection = introspection.__schema;
      const typeMap = (0, _keyValMap.keyValMap)(
        schemaIntrospection.types,
        (typeIntrospection) => typeIntrospection.name,
        (typeIntrospection) => buildType(typeIntrospection)
      );
      for (const stdType of [
        ..._scalars.specifiedScalarTypes,
        ..._introspection.introspectionTypes
      ]) {
        if (typeMap[stdType.name]) {
          typeMap[stdType.name] = stdType;
        }
      }
      const queryType = schemaIntrospection.queryType ? getObjectType(schemaIntrospection.queryType) : null;
      const mutationType = schemaIntrospection.mutationType ? getObjectType(schemaIntrospection.mutationType) : null;
      const subscriptionType = schemaIntrospection.subscriptionType ? getObjectType(schemaIntrospection.subscriptionType) : null;
      const directives = schemaIntrospection.directives ? schemaIntrospection.directives.map(buildDirective) : [];
      return new _schema.GraphQLSchema({
        description: schemaIntrospection.description,
        query: queryType,
        mutation: mutationType,
        subscription: subscriptionType,
        types: Object.values(typeMap),
        directives,
        assumeValid: options === null || options === void 0 ? void 0 : options.assumeValid
      });
      function getType(typeRef) {
        if (typeRef.kind === _introspection.TypeKind.LIST) {
          const itemRef = typeRef.ofType;
          if (!itemRef) {
            throw new Error("Decorated type deeper than introspection query.");
          }
          return new _definition.GraphQLList(getType(itemRef));
        }
        if (typeRef.kind === _introspection.TypeKind.NON_NULL) {
          const nullableRef = typeRef.ofType;
          if (!nullableRef) {
            throw new Error("Decorated type deeper than introspection query.");
          }
          const nullableType = getType(nullableRef);
          return new _definition.GraphQLNonNull(
            (0, _definition.assertNullableType)(nullableType)
          );
        }
        return getNamedType2(typeRef);
      }
      function getNamedType2(typeRef) {
        const typeName = typeRef.name;
        if (!typeName) {
          throw new Error(
            `Unknown type reference: ${(0, _inspect.inspect)(typeRef)}.`
          );
        }
        const type = typeMap[typeName];
        if (!type) {
          throw new Error(
            `Invalid or incomplete schema, unknown type: ${typeName}. Ensure that a full introspection query is used in order to build a client schema.`
          );
        }
        return type;
      }
      function getObjectType(typeRef) {
        return (0, _definition.assertObjectType)(getNamedType2(typeRef));
      }
      function getInterfaceType(typeRef) {
        return (0, _definition.assertInterfaceType)(getNamedType2(typeRef));
      }
      function buildType(type) {
        if (type != null && type.name != null && type.kind != null) {
          switch (type.kind) {
            case _introspection.TypeKind.SCALAR:
              return buildScalarDef(type);
            case _introspection.TypeKind.OBJECT:
              return buildObjectDef(type);
            case _introspection.TypeKind.INTERFACE:
              return buildInterfaceDef(type);
            case _introspection.TypeKind.UNION:
              return buildUnionDef(type);
            case _introspection.TypeKind.ENUM:
              return buildEnumDef(type);
            case _introspection.TypeKind.INPUT_OBJECT:
              return buildInputObjectDef(type);
          }
        }
        const typeStr = (0, _inspect.inspect)(type);
        throw new Error(
          `Invalid or incomplete introspection result. Ensure that a full introspection query is used in order to build a client schema: ${typeStr}.`
        );
      }
      function buildScalarDef(scalarIntrospection) {
        return new _definition.GraphQLScalarType({
          name: scalarIntrospection.name,
          description: scalarIntrospection.description,
          specifiedByURL: scalarIntrospection.specifiedByURL
        });
      }
      function buildImplementationsList(implementingIntrospection) {
        if (implementingIntrospection.interfaces === null && implementingIntrospection.kind === _introspection.TypeKind.INTERFACE) {
          return [];
        }
        if (!implementingIntrospection.interfaces) {
          const implementingIntrospectionStr = (0, _inspect.inspect)(
            implementingIntrospection
          );
          throw new Error(
            `Introspection result missing interfaces: ${implementingIntrospectionStr}.`
          );
        }
        return implementingIntrospection.interfaces.map(getInterfaceType);
      }
      function buildObjectDef(objectIntrospection) {
        return new _definition.GraphQLObjectType({
          name: objectIntrospection.name,
          description: objectIntrospection.description,
          interfaces: () => buildImplementationsList(objectIntrospection),
          fields: () => buildFieldDefMap(objectIntrospection)
        });
      }
      function buildInterfaceDef(interfaceIntrospection) {
        return new _definition.GraphQLInterfaceType({
          name: interfaceIntrospection.name,
          description: interfaceIntrospection.description,
          interfaces: () => buildImplementationsList(interfaceIntrospection),
          fields: () => buildFieldDefMap(interfaceIntrospection)
        });
      }
      function buildUnionDef(unionIntrospection) {
        if (!unionIntrospection.possibleTypes) {
          const unionIntrospectionStr = (0, _inspect.inspect)(unionIntrospection);
          throw new Error(
            `Introspection result missing possibleTypes: ${unionIntrospectionStr}.`
          );
        }
        return new _definition.GraphQLUnionType({
          name: unionIntrospection.name,
          description: unionIntrospection.description,
          types: () => unionIntrospection.possibleTypes.map(getObjectType)
        });
      }
      function buildEnumDef(enumIntrospection) {
        if (!enumIntrospection.enumValues) {
          const enumIntrospectionStr = (0, _inspect.inspect)(enumIntrospection);
          throw new Error(
            `Introspection result missing enumValues: ${enumIntrospectionStr}.`
          );
        }
        return new _definition.GraphQLEnumType({
          name: enumIntrospection.name,
          description: enumIntrospection.description,
          values: (0, _keyValMap.keyValMap)(
            enumIntrospection.enumValues,
            (valueIntrospection) => valueIntrospection.name,
            (valueIntrospection) => ({
              description: valueIntrospection.description,
              deprecationReason: valueIntrospection.deprecationReason
            })
          )
        });
      }
      function buildInputObjectDef(inputObjectIntrospection) {
        if (!inputObjectIntrospection.inputFields) {
          const inputObjectIntrospectionStr = (0, _inspect.inspect)(
            inputObjectIntrospection
          );
          throw new Error(
            `Introspection result missing inputFields: ${inputObjectIntrospectionStr}.`
          );
        }
        return new _definition.GraphQLInputObjectType({
          name: inputObjectIntrospection.name,
          description: inputObjectIntrospection.description,
          fields: () => buildInputValueDefMap(inputObjectIntrospection.inputFields),
          isOneOf: inputObjectIntrospection.isOneOf
        });
      }
      function buildFieldDefMap(typeIntrospection) {
        if (!typeIntrospection.fields) {
          throw new Error(
            `Introspection result missing fields: ${(0, _inspect.inspect)(
              typeIntrospection
            )}.`
          );
        }
        return (0, _keyValMap.keyValMap)(
          typeIntrospection.fields,
          (fieldIntrospection) => fieldIntrospection.name,
          buildField
        );
      }
      function buildField(fieldIntrospection) {
        const type = getType(fieldIntrospection.type);
        if (!(0, _definition.isOutputType)(type)) {
          const typeStr = (0, _inspect.inspect)(type);
          throw new Error(
            `Introspection must provide output type for fields, but received: ${typeStr}.`
          );
        }
        if (!fieldIntrospection.args) {
          const fieldIntrospectionStr = (0, _inspect.inspect)(fieldIntrospection);
          throw new Error(
            `Introspection result missing field args: ${fieldIntrospectionStr}.`
          );
        }
        return {
          description: fieldIntrospection.description,
          deprecationReason: fieldIntrospection.deprecationReason,
          type,
          args: buildInputValueDefMap(fieldIntrospection.args)
        };
      }
      function buildInputValueDefMap(inputValueIntrospections) {
        return (0, _keyValMap.keyValMap)(
          inputValueIntrospections,
          (inputValue) => inputValue.name,
          buildInputValue
        );
      }
      function buildInputValue(inputValueIntrospection) {
        const type = getType(inputValueIntrospection.type);
        if (!(0, _definition.isInputType)(type)) {
          const typeStr = (0, _inspect.inspect)(type);
          throw new Error(
            `Introspection must provide input type for arguments, but received: ${typeStr}.`
          );
        }
        const defaultValue = inputValueIntrospection.defaultValue != null ? (0, _valueFromAST.valueFromAST)(
          (0, _parser.parseValue)(inputValueIntrospection.defaultValue),
          type
        ) : void 0;
        return {
          description: inputValueIntrospection.description,
          type,
          defaultValue,
          deprecationReason: inputValueIntrospection.deprecationReason
        };
      }
      function buildDirective(directiveIntrospection) {
        if (!directiveIntrospection.args) {
          const directiveIntrospectionStr = (0, _inspect.inspect)(
            directiveIntrospection
          );
          throw new Error(
            `Introspection result missing directive args: ${directiveIntrospectionStr}.`
          );
        }
        if (!directiveIntrospection.locations) {
          const directiveIntrospectionStr = (0, _inspect.inspect)(
            directiveIntrospection
          );
          throw new Error(
            `Introspection result missing directive locations: ${directiveIntrospectionStr}.`
          );
        }
        return new _directives.GraphQLDirective({
          name: directiveIntrospection.name,
          description: directiveIntrospection.description,
          isRepeatable: directiveIntrospection.isRepeatable,
          deprecationReason: directiveIntrospection.deprecationReason,
          locations: directiveIntrospection.locations.slice(),
          args: buildInputValueDefMap(directiveIntrospection.args)
        });
      }
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/extendSchema.js
var require_extendSchema = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/extendSchema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.extendSchema = extendSchema;
    exports.extendSchemaImpl = extendSchemaImpl;
    var _devAssert = require_devAssert();
    var _inspect = require_inspect();
    var _invariant = require_invariant();
    var _keyMap = require_keyMap();
    var _mapValue = require_mapValue();
    var _kinds = require_kinds();
    var _predicates = require_predicates();
    var _definition = require_definition();
    var _directives = require_directives();
    var _introspection = require_introspection();
    var _scalars = require_scalars();
    var _schema = require_schema();
    var _validate = require_validate2();
    var _values = require_values();
    var _valueFromAST = require_valueFromAST();
    function extendSchema(schema, documentAST, options) {
      (0, _schema.assertSchema)(schema);
      documentAST != null && documentAST.kind === _kinds.Kind.DOCUMENT || (0, _devAssert.devAssert)(false, "Must provide valid Document AST.");
      if ((options === null || options === void 0 ? void 0 : options.assumeValid) !== true && (options === null || options === void 0 ? void 0 : options.assumeValidSDL) !== true) {
        (0, _validate.assertValidSDLExtension)(documentAST, schema);
      }
      const schemaConfig = schema.toConfig();
      const extendedConfig = extendSchemaImpl(schemaConfig, documentAST, options);
      return schemaConfig === extendedConfig ? schema : new _schema.GraphQLSchema(extendedConfig);
    }
    function extendSchemaImpl(schemaConfig, documentAST, options) {
      var _schemaDef, _schemaDef$descriptio, _schemaDef2, _options$assumeValid;
      const typeDefs = [];
      const typeExtensionsMap = /* @__PURE__ */ Object.create(null);
      const directiveExtensionsMap = /* @__PURE__ */ Object.create(null);
      const directiveDefs = [];
      let schemaDef;
      const schemaExtensions = [];
      for (const def of documentAST.definitions) {
        if (def.kind === _kinds.Kind.SCHEMA_DEFINITION) {
          schemaDef = def;
        } else if (def.kind === _kinds.Kind.SCHEMA_EXTENSION) {
          schemaExtensions.push(def);
        } else if ((0, _predicates.isTypeDefinitionNode)(def)) {
          typeDefs.push(def);
        } else if ((0, _predicates.isTypeExtensionNode)(def)) {
          const extendedTypeName = def.name.value;
          const existingTypeExtensions = typeExtensionsMap[extendedTypeName];
          typeExtensionsMap[extendedTypeName] = existingTypeExtensions ? existingTypeExtensions.concat([def]) : [def];
        } else if (def.kind === _kinds.Kind.DIRECTIVE_DEFINITION) {
          directiveDefs.push(def);
        } else if (def.kind === _kinds.Kind.DIRECTIVE_EXTENSION) {
          const extendedDirectiveName = def.name.value;
          const existingDirectiveExtensions = directiveExtensionsMap[extendedDirectiveName];
          directiveExtensionsMap[extendedDirectiveName] = existingDirectiveExtensions ? existingDirectiveExtensions.concat([def]) : [def];
        }
      }
      if (Object.keys(typeExtensionsMap).length === 0 && typeDefs.length === 0 && Object.keys(directiveExtensionsMap).length === 0 && directiveDefs.length === 0 && schemaExtensions.length === 0 && schemaDef == null) {
        return schemaConfig;
      }
      const typeMap = /* @__PURE__ */ Object.create(null);
      for (const existingType of schemaConfig.types) {
        typeMap[existingType.name] = extendNamedType(existingType);
      }
      for (const typeNode of typeDefs) {
        var _stdTypeMap$name;
        const name2 = typeNode.name.value;
        typeMap[name2] = (_stdTypeMap$name = stdTypeMap[name2]) !== null && _stdTypeMap$name !== void 0 ? _stdTypeMap$name : buildType(typeNode);
      }
      const directiveMap = /* @__PURE__ */ Object.create(null);
      for (const existingDirective of schemaConfig.directives) {
        directiveMap[existingDirective.name] = extendDirective(existingDirective);
      }
      const operationTypes = {
        // Get the extended root operation types.
        query: schemaConfig.query && replaceNamedType(schemaConfig.query),
        mutation: schemaConfig.mutation && replaceNamedType(schemaConfig.mutation),
        subscription: schemaConfig.subscription && replaceNamedType(schemaConfig.subscription),
        // Then, incorporate schema definition and all schema extensions.
        ...schemaDef && getOperationTypes([schemaDef]),
        ...getOperationTypes(schemaExtensions)
      };
      const directives = Object.values(directiveMap);
      return {
        description: (_schemaDef = schemaDef) === null || _schemaDef === void 0 ? void 0 : (_schemaDef$descriptio = _schemaDef.description) === null || _schemaDef$descriptio === void 0 ? void 0 : _schemaDef$descriptio.value,
        ...operationTypes,
        types: Object.values(typeMap),
        directives: [
          ...directives.map(replaceDirective),
          ...directiveDefs.map(buildDirective)
        ],
        extensions: /* @__PURE__ */ Object.create(null),
        astNode: (_schemaDef2 = schemaDef) !== null && _schemaDef2 !== void 0 ? _schemaDef2 : schemaConfig.astNode,
        extensionASTNodes: schemaConfig.extensionASTNodes.concat(schemaExtensions),
        assumeValid: (_options$assumeValid = options === null || options === void 0 ? void 0 : options.assumeValid) !== null && _options$assumeValid !== void 0 ? _options$assumeValid : false
      };
      function replaceType(type) {
        if ((0, _definition.isListType)(type)) {
          return new _definition.GraphQLList(replaceType(type.ofType));
        }
        if ((0, _definition.isNonNullType)(type)) {
          return new _definition.GraphQLNonNull(replaceType(type.ofType));
        }
        return replaceNamedType(type);
      }
      function replaceNamedType(type) {
        return typeMap[type.name];
      }
      function replaceDirective(directive) {
        const config = directive.toConfig();
        return new _directives.GraphQLDirective({
          ...config,
          args: (0, _mapValue.mapValue)(config.args, extendArg)
        });
      }
      function extendNamedType(type) {
        if ((0, _introspection.isIntrospectionType)(type) || (0, _scalars.isSpecifiedScalarType)(type)) {
          return type;
        }
        if ((0, _definition.isScalarType)(type)) {
          return extendScalarType(type);
        }
        if ((0, _definition.isObjectType)(type)) {
          return extendObjectType(type);
        }
        if ((0, _definition.isInterfaceType)(type)) {
          return extendInterfaceType(type);
        }
        if ((0, _definition.isUnionType)(type)) {
          return extendUnionType(type);
        }
        if ((0, _definition.isEnumType)(type)) {
          return extendEnumType(type);
        }
        if ((0, _definition.isInputObjectType)(type)) {
          return extendInputObjectType(type);
        }
        (0, _invariant.invariant)(
          false,
          "Unexpected type: " + (0, _inspect.inspect)(type)
        );
      }
      function extendInputObjectType(type) {
        var _typeExtensionsMap$co;
        const config = type.toConfig();
        const extensions = (_typeExtensionsMap$co = typeExtensionsMap[config.name]) !== null && _typeExtensionsMap$co !== void 0 ? _typeExtensionsMap$co : [];
        return new _definition.GraphQLInputObjectType({
          ...config,
          fields: () => ({
            ...(0, _mapValue.mapValue)(config.fields, (field) => ({
              ...field,
              type: replaceType(field.type)
            })),
            ...buildInputFieldMap(extensions)
          }),
          extensionASTNodes: config.extensionASTNodes.concat(extensions)
        });
      }
      function extendEnumType(type) {
        var _typeExtensionsMap$ty;
        const config = type.toConfig();
        const extensions = (_typeExtensionsMap$ty = typeExtensionsMap[type.name]) !== null && _typeExtensionsMap$ty !== void 0 ? _typeExtensionsMap$ty : [];
        return new _definition.GraphQLEnumType({
          ...config,
          values: { ...config.values, ...buildEnumValueMap(extensions) },
          extensionASTNodes: config.extensionASTNodes.concat(extensions)
        });
      }
      function extendScalarType(type) {
        var _typeExtensionsMap$co2;
        const config = type.toConfig();
        const extensions = (_typeExtensionsMap$co2 = typeExtensionsMap[config.name]) !== null && _typeExtensionsMap$co2 !== void 0 ? _typeExtensionsMap$co2 : [];
        let specifiedByURL = config.specifiedByURL;
        for (const extensionNode of extensions) {
          var _getSpecifiedByURL;
          specifiedByURL = (_getSpecifiedByURL = getSpecifiedByURL(extensionNode)) !== null && _getSpecifiedByURL !== void 0 ? _getSpecifiedByURL : specifiedByURL;
        }
        return new _definition.GraphQLScalarType({
          ...config,
          specifiedByURL,
          extensionASTNodes: config.extensionASTNodes.concat(extensions)
        });
      }
      function extendObjectType(type) {
        var _typeExtensionsMap$co3;
        const config = type.toConfig();
        const extensions = (_typeExtensionsMap$co3 = typeExtensionsMap[config.name]) !== null && _typeExtensionsMap$co3 !== void 0 ? _typeExtensionsMap$co3 : [];
        return new _definition.GraphQLObjectType({
          ...config,
          interfaces: () => [
            ...type.getInterfaces().map(replaceNamedType),
            ...buildInterfaces(extensions)
          ],
          fields: () => ({
            ...(0, _mapValue.mapValue)(config.fields, extendField),
            ...buildFieldMap(extensions)
          }),
          extensionASTNodes: config.extensionASTNodes.concat(extensions)
        });
      }
      function extendInterfaceType(type) {
        var _typeExtensionsMap$co4;
        const config = type.toConfig();
        const extensions = (_typeExtensionsMap$co4 = typeExtensionsMap[config.name]) !== null && _typeExtensionsMap$co4 !== void 0 ? _typeExtensionsMap$co4 : [];
        return new _definition.GraphQLInterfaceType({
          ...config,
          interfaces: () => [
            ...type.getInterfaces().map(replaceNamedType),
            ...buildInterfaces(extensions)
          ],
          fields: () => ({
            ...(0, _mapValue.mapValue)(config.fields, extendField),
            ...buildFieldMap(extensions)
          }),
          extensionASTNodes: config.extensionASTNodes.concat(extensions)
        });
      }
      function extendUnionType(type) {
        var _typeExtensionsMap$co5;
        const config = type.toConfig();
        const extensions = (_typeExtensionsMap$co5 = typeExtensionsMap[config.name]) !== null && _typeExtensionsMap$co5 !== void 0 ? _typeExtensionsMap$co5 : [];
        return new _definition.GraphQLUnionType({
          ...config,
          types: () => [
            ...type.getTypes().map(replaceNamedType),
            ...buildUnionTypes(extensions)
          ],
          extensionASTNodes: config.extensionASTNodes.concat(extensions)
        });
      }
      function extendField(field) {
        return {
          ...field,
          type: replaceType(field.type),
          args: field.args && (0, _mapValue.mapValue)(field.args, extendArg)
        };
      }
      function extendArg(arg) {
        return { ...arg, type: replaceType(arg.type) };
      }
      function getOperationTypes(nodes) {
        const opTypes = {};
        for (const node2 of nodes) {
          var _node$operationTypes;
          const operationTypesNodes = (
            /* c8 ignore next */
            (_node$operationTypes = node2.operationTypes) !== null && _node$operationTypes !== void 0 ? _node$operationTypes : []
          );
          for (const operationType of operationTypesNodes) {
            opTypes[operationType.operation] = getNamedType2(operationType.type);
          }
        }
        return opTypes;
      }
      function extendDirective(directive) {
        var _directiveExtensionsM, _config$deprecationRe;
        const config = directive.toConfig();
        const extensions = (_directiveExtensionsM = directiveExtensionsMap[config.name]) !== null && _directiveExtensionsM !== void 0 ? _directiveExtensionsM : [];
        const deprecationReason = (_config$deprecationRe = config.deprecationReason) !== null && _config$deprecationRe !== void 0 ? _config$deprecationRe : extensions.map((ext) => getDeprecationReason(ext)).find((reason) => reason != null);
        return new _directives.GraphQLDirective({
          ...config,
          deprecationReason,
          extensionASTNodes: config.extensionASTNodes.concat(extensions)
        });
      }
      function getNamedType2(node2) {
        var _stdTypeMap$name2;
        const name2 = node2.name.value;
        const type = (_stdTypeMap$name2 = stdTypeMap[name2]) !== null && _stdTypeMap$name2 !== void 0 ? _stdTypeMap$name2 : typeMap[name2];
        if (type === void 0) {
          throw new Error(`Unknown type: "${name2}".`);
        }
        return type;
      }
      function getWrappedType(node2) {
        if (node2.kind === _kinds.Kind.LIST_TYPE) {
          return new _definition.GraphQLList(getWrappedType(node2.type));
        }
        if (node2.kind === _kinds.Kind.NON_NULL_TYPE) {
          return new _definition.GraphQLNonNull(getWrappedType(node2.type));
        }
        return getNamedType2(node2);
      }
      function buildDirective(node2) {
        var _directiveExtensionsM2, _getDeprecationReason, _node$description;
        const extensions = (_directiveExtensionsM2 = directiveExtensionsMap[node2.name.value]) !== null && _directiveExtensionsM2 !== void 0 ? _directiveExtensionsM2 : [];
        const deprecationReason = (_getDeprecationReason = getDeprecationReason(node2)) !== null && _getDeprecationReason !== void 0 ? _getDeprecationReason : extensions.map((ext) => getDeprecationReason(ext)).find((reason) => reason != null);
        return new _directives.GraphQLDirective({
          name: node2.name.value,
          description: (_node$description = node2.description) === null || _node$description === void 0 ? void 0 : _node$description.value,
          // @ts-expect-error
          locations: node2.locations.map(({ value }) => value),
          isRepeatable: node2.repeatable,
          args: buildArgumentMap(node2.arguments),
          deprecationReason,
          astNode: node2,
          extensionASTNodes: extensions
        });
      }
      function buildFieldMap(nodes) {
        const fieldConfigMap = /* @__PURE__ */ Object.create(null);
        for (const node2 of nodes) {
          var _node$fields;
          const nodeFields = (
            /* c8 ignore next */
            (_node$fields = node2.fields) !== null && _node$fields !== void 0 ? _node$fields : []
          );
          for (const field of nodeFields) {
            var _field$description;
            fieldConfigMap[field.name.value] = {
              // Note: While this could make assertions to get the correctly typed
              // value, that would throw immediately while type system validation
              // with validateSchema() will produce more actionable results.
              type: getWrappedType(field.type),
              description: (_field$description = field.description) === null || _field$description === void 0 ? void 0 : _field$description.value,
              args: buildArgumentMap(field.arguments),
              deprecationReason: getDeprecationReason(field),
              astNode: field
            };
          }
        }
        return fieldConfigMap;
      }
      function buildArgumentMap(args) {
        const argsNodes = (
          /* c8 ignore next */
          args !== null && args !== void 0 ? args : []
        );
        const argConfigMap = /* @__PURE__ */ Object.create(null);
        for (const arg of argsNodes) {
          var _arg$description;
          const type = getWrappedType(arg.type);
          argConfigMap[arg.name.value] = {
            type,
            description: (_arg$description = arg.description) === null || _arg$description === void 0 ? void 0 : _arg$description.value,
            defaultValue: (0, _valueFromAST.valueFromAST)(arg.defaultValue, type),
            deprecationReason: getDeprecationReason(arg),
            astNode: arg
          };
        }
        return argConfigMap;
      }
      function buildInputFieldMap(nodes) {
        const inputFieldMap = /* @__PURE__ */ Object.create(null);
        for (const node2 of nodes) {
          var _node$fields2;
          const fieldsNodes = (
            /* c8 ignore next */
            (_node$fields2 = node2.fields) !== null && _node$fields2 !== void 0 ? _node$fields2 : []
          );
          for (const field of fieldsNodes) {
            var _field$description2;
            const type = getWrappedType(field.type);
            inputFieldMap[field.name.value] = {
              type,
              description: (_field$description2 = field.description) === null || _field$description2 === void 0 ? void 0 : _field$description2.value,
              defaultValue: (0, _valueFromAST.valueFromAST)(
                field.defaultValue,
                type
              ),
              deprecationReason: getDeprecationReason(field),
              astNode: field
            };
          }
        }
        return inputFieldMap;
      }
      function buildEnumValueMap(nodes) {
        const enumValueMap = /* @__PURE__ */ Object.create(null);
        for (const node2 of nodes) {
          var _node$values;
          const valuesNodes = (
            /* c8 ignore next */
            (_node$values = node2.values) !== null && _node$values !== void 0 ? _node$values : []
          );
          for (const value of valuesNodes) {
            var _value$description;
            enumValueMap[value.name.value] = {
              description: (_value$description = value.description) === null || _value$description === void 0 ? void 0 : _value$description.value,
              deprecationReason: getDeprecationReason(value),
              astNode: value
            };
          }
        }
        return enumValueMap;
      }
      function buildInterfaces(nodes) {
        return nodes.flatMap(
          // FIXME: https://github.com/graphql/graphql-js/issues/2203
          (node2) => {
            var _node$interfaces$map, _node$interfaces;
            return (
              /* c8 ignore next */
              (_node$interfaces$map = (_node$interfaces = node2.interfaces) === null || _node$interfaces === void 0 ? void 0 : _node$interfaces.map(getNamedType2)) !== null && _node$interfaces$map !== void 0 ? _node$interfaces$map : []
            );
          }
        );
      }
      function buildUnionTypes(nodes) {
        return nodes.flatMap(
          // FIXME: https://github.com/graphql/graphql-js/issues/2203
          (node2) => {
            var _node$types$map, _node$types;
            return (
              /* c8 ignore next */
              (_node$types$map = (_node$types = node2.types) === null || _node$types === void 0 ? void 0 : _node$types.map(getNamedType2)) !== null && _node$types$map !== void 0 ? _node$types$map : []
            );
          }
        );
      }
      function buildType(astNode) {
        var _typeExtensionsMap$na;
        const name2 = astNode.name.value;
        const extensionASTNodes = (_typeExtensionsMap$na = typeExtensionsMap[name2]) !== null && _typeExtensionsMap$na !== void 0 ? _typeExtensionsMap$na : [];
        switch (astNode.kind) {
          case _kinds.Kind.OBJECT_TYPE_DEFINITION: {
            var _astNode$description;
            const allNodes = [astNode, ...extensionASTNodes];
            return new _definition.GraphQLObjectType({
              name: name2,
              description: (_astNode$description = astNode.description) === null || _astNode$description === void 0 ? void 0 : _astNode$description.value,
              interfaces: () => buildInterfaces(allNodes),
              fields: () => buildFieldMap(allNodes),
              astNode,
              extensionASTNodes
            });
          }
          case _kinds.Kind.INTERFACE_TYPE_DEFINITION: {
            var _astNode$description2;
            const allNodes = [astNode, ...extensionASTNodes];
            return new _definition.GraphQLInterfaceType({
              name: name2,
              description: (_astNode$description2 = astNode.description) === null || _astNode$description2 === void 0 ? void 0 : _astNode$description2.value,
              interfaces: () => buildInterfaces(allNodes),
              fields: () => buildFieldMap(allNodes),
              astNode,
              extensionASTNodes
            });
          }
          case _kinds.Kind.ENUM_TYPE_DEFINITION: {
            var _astNode$description3;
            const allNodes = [astNode, ...extensionASTNodes];
            return new _definition.GraphQLEnumType({
              name: name2,
              description: (_astNode$description3 = astNode.description) === null || _astNode$description3 === void 0 ? void 0 : _astNode$description3.value,
              values: buildEnumValueMap(allNodes),
              astNode,
              extensionASTNodes
            });
          }
          case _kinds.Kind.UNION_TYPE_DEFINITION: {
            var _astNode$description4;
            const allNodes = [astNode, ...extensionASTNodes];
            return new _definition.GraphQLUnionType({
              name: name2,
              description: (_astNode$description4 = astNode.description) === null || _astNode$description4 === void 0 ? void 0 : _astNode$description4.value,
              types: () => buildUnionTypes(allNodes),
              astNode,
              extensionASTNodes
            });
          }
          case _kinds.Kind.SCALAR_TYPE_DEFINITION: {
            var _astNode$description5;
            return new _definition.GraphQLScalarType({
              name: name2,
              description: (_astNode$description5 = astNode.description) === null || _astNode$description5 === void 0 ? void 0 : _astNode$description5.value,
              specifiedByURL: getSpecifiedByURL(astNode),
              astNode,
              extensionASTNodes
            });
          }
          case _kinds.Kind.INPUT_OBJECT_TYPE_DEFINITION: {
            var _astNode$description6;
            const allNodes = [astNode, ...extensionASTNodes];
            return new _definition.GraphQLInputObjectType({
              name: name2,
              description: (_astNode$description6 = astNode.description) === null || _astNode$description6 === void 0 ? void 0 : _astNode$description6.value,
              fields: () => buildInputFieldMap(allNodes),
              astNode,
              extensionASTNodes,
              isOneOf: isOneOf(astNode)
            });
          }
        }
      }
    }
    var stdTypeMap = (0, _keyMap.keyMap)(
      [..._scalars.specifiedScalarTypes, ..._introspection.introspectionTypes],
      (type) => type.name
    );
    function getDeprecationReason(node2) {
      const deprecated = (0, _values.getDirectiveValues)(
        _directives.GraphQLDeprecatedDirective,
        node2
      );
      return deprecated === null || deprecated === void 0 ? void 0 : deprecated.reason;
    }
    function getSpecifiedByURL(node2) {
      const specifiedBy = (0, _values.getDirectiveValues)(
        _directives.GraphQLSpecifiedByDirective,
        node2
      );
      return specifiedBy === null || specifiedBy === void 0 ? void 0 : specifiedBy.url;
    }
    function isOneOf(node2) {
      return Boolean(
        (0, _values.getDirectiveValues)(_directives.GraphQLOneOfDirective, node2)
      );
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/buildASTSchema.js
var require_buildASTSchema = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/buildASTSchema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.buildASTSchema = buildASTSchema2;
    exports.buildSchema = buildSchema;
    var _devAssert = require_devAssert();
    var _kinds = require_kinds();
    var _parser = require_parser();
    var _directives = require_directives();
    var _schema = require_schema();
    var _validate = require_validate2();
    var _extendSchema = require_extendSchema();
    function buildASTSchema2(documentAST, options) {
      documentAST != null && documentAST.kind === _kinds.Kind.DOCUMENT || (0, _devAssert.devAssert)(false, "Must provide valid Document AST.");
      if ((options === null || options === void 0 ? void 0 : options.assumeValid) !== true && (options === null || options === void 0 ? void 0 : options.assumeValidSDL) !== true) {
        (0, _validate.assertValidSDL)(documentAST);
      }
      const emptySchemaConfig = {
        description: void 0,
        types: [],
        directives: [],
        extensions: /* @__PURE__ */ Object.create(null),
        extensionASTNodes: [],
        assumeValid: false
      };
      const config = (0, _extendSchema.extendSchemaImpl)(
        emptySchemaConfig,
        documentAST,
        options
      );
      if (config.astNode == null) {
        for (const type of config.types) {
          switch (type.name) {
            // Note: While this could make early assertions to get the correctly
            // typed values below, that would throw immediately while type system
            // validation with validateSchema() will produce more actionable results.
            case "Query":
              config.query = type;
              break;
            case "Mutation":
              config.mutation = type;
              break;
            case "Subscription":
              config.subscription = type;
              break;
          }
        }
      }
      const directives = [
        ...config.directives,
        // If specified directives were not explicitly declared, add them.
        ..._directives.specifiedDirectives.filter(
          (stdDirective) => config.directives.every(
            (directive) => directive.name !== stdDirective.name
          )
        )
      ];
      return new _schema.GraphQLSchema({ ...config, directives });
    }
    function buildSchema(source, options) {
      const document = (0, _parser.parse)(source, options);
      return buildASTSchema2(document, {
        assumeValidSDL: options === null || options === void 0 ? void 0 : options.assumeValidSDL,
        assumeValid: options === null || options === void 0 ? void 0 : options.assumeValid
      });
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/lexicographicSortSchema.js
var require_lexicographicSortSchema = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/lexicographicSortSchema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.lexicographicSortSchema = lexicographicSortSchema;
    var _inspect = require_inspect();
    var _invariant = require_invariant();
    var _keyValMap = require_keyValMap();
    var _naturalCompare = require_naturalCompare();
    var _definition = require_definition();
    var _directives = require_directives();
    var _introspection = require_introspection();
    var _schema = require_schema();
    function lexicographicSortSchema(schema) {
      const schemaConfig = schema.toConfig();
      const typeMap = (0, _keyValMap.keyValMap)(
        sortByName(schemaConfig.types),
        (type) => type.name,
        sortNamedType
      );
      return new _schema.GraphQLSchema({
        ...schemaConfig,
        types: Object.values(typeMap),
        directives: sortByName(schemaConfig.directives).map(sortDirective),
        query: replaceMaybeType(schemaConfig.query),
        mutation: replaceMaybeType(schemaConfig.mutation),
        subscription: replaceMaybeType(schemaConfig.subscription)
      });
      function replaceType(type) {
        if ((0, _definition.isListType)(type)) {
          return new _definition.GraphQLList(replaceType(type.ofType));
        } else if ((0, _definition.isNonNullType)(type)) {
          return new _definition.GraphQLNonNull(replaceType(type.ofType));
        }
        return replaceNamedType(type);
      }
      function replaceNamedType(type) {
        return typeMap[type.name];
      }
      function replaceMaybeType(maybeType) {
        return maybeType && replaceNamedType(maybeType);
      }
      function sortDirective(directive) {
        const config = directive.toConfig();
        return new _directives.GraphQLDirective({
          ...config,
          locations: sortBy(config.locations, (x) => x),
          args: sortArgs(config.args)
        });
      }
      function sortArgs(args) {
        return sortObjMap(args, (arg) => ({ ...arg, type: replaceType(arg.type) }));
      }
      function sortFields(fieldsMap) {
        return sortObjMap(fieldsMap, (field) => ({
          ...field,
          type: replaceType(field.type),
          args: field.args && sortArgs(field.args)
        }));
      }
      function sortInputFields(fieldsMap) {
        return sortObjMap(fieldsMap, (field) => ({
          ...field,
          type: replaceType(field.type)
        }));
      }
      function sortTypes(array) {
        return sortByName(array).map(replaceNamedType);
      }
      function sortNamedType(type) {
        if ((0, _definition.isScalarType)(type) || (0, _introspection.isIntrospectionType)(type)) {
          return type;
        }
        if ((0, _definition.isObjectType)(type)) {
          const config = type.toConfig();
          return new _definition.GraphQLObjectType({
            ...config,
            interfaces: () => sortTypes(config.interfaces),
            fields: () => sortFields(config.fields)
          });
        }
        if ((0, _definition.isInterfaceType)(type)) {
          const config = type.toConfig();
          return new _definition.GraphQLInterfaceType({
            ...config,
            interfaces: () => sortTypes(config.interfaces),
            fields: () => sortFields(config.fields)
          });
        }
        if ((0, _definition.isUnionType)(type)) {
          const config = type.toConfig();
          return new _definition.GraphQLUnionType({
            ...config,
            types: () => sortTypes(config.types)
          });
        }
        if ((0, _definition.isEnumType)(type)) {
          const config = type.toConfig();
          return new _definition.GraphQLEnumType({
            ...config,
            values: sortObjMap(config.values, (value) => value)
          });
        }
        if ((0, _definition.isInputObjectType)(type)) {
          const config = type.toConfig();
          return new _definition.GraphQLInputObjectType({
            ...config,
            fields: () => sortInputFields(config.fields)
          });
        }
        (0, _invariant.invariant)(
          false,
          "Unexpected type: " + (0, _inspect.inspect)(type)
        );
      }
    }
    function sortObjMap(map, sortValueFn) {
      const sortedMap = /* @__PURE__ */ Object.create(null);
      for (const key of Object.keys(map).sort(_naturalCompare.naturalCompare)) {
        sortedMap[key] = sortValueFn(map[key]);
      }
      return sortedMap;
    }
    function sortByName(array) {
      return sortBy(array, (obj) => obj.name);
    }
    function sortBy(array, mapToKey) {
      return array.slice().sort((obj1, obj2) => {
        const key1 = mapToKey(obj1);
        const key2 = mapToKey(obj2);
        return (0, _naturalCompare.naturalCompare)(key1, key2);
      });
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/printSchema.js
var require_printSchema = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/printSchema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.printIntrospectionSchema = printIntrospectionSchema;
    exports.printSchema = printSchema;
    exports.printType = printType;
    var _inspect = require_inspect();
    var _invariant = require_invariant();
    var _blockString = require_blockString();
    var _kinds = require_kinds();
    var _printer = require_printer();
    var _definition = require_definition();
    var _directives = require_directives();
    var _introspection = require_introspection();
    var _scalars = require_scalars();
    var _astFromValue = require_astFromValue();
    function printSchema(schema) {
      return printFilteredSchema(
        schema,
        (n) => !(0, _directives.isSpecifiedDirective)(n),
        isDefinedType
      );
    }
    function printIntrospectionSchema(schema) {
      return printFilteredSchema(
        schema,
        _directives.isSpecifiedDirective,
        _introspection.isIntrospectionType
      );
    }
    function isDefinedType(type) {
      return !(0, _scalars.isSpecifiedScalarType)(type) && !(0, _introspection.isIntrospectionType)(type);
    }
    function printFilteredSchema(schema, directiveFilter, typeFilter) {
      const directives = schema.getDirectives().filter(directiveFilter);
      const types = Object.values(schema.getTypeMap()).filter(typeFilter);
      return [
        printSchemaDefinition(schema),
        ...directives.map((directive) => printDirective(directive)),
        ...types.map((type) => printType(type))
      ].filter(Boolean).join("\n\n");
    }
    function printSchemaDefinition(schema) {
      if (schema.description == null && isSchemaOfCommonNames(schema)) {
        return;
      }
      const operationTypes = [];
      const queryType = schema.getQueryType();
      if (queryType) {
        operationTypes.push(`  query: ${queryType.name}`);
      }
      const mutationType = schema.getMutationType();
      if (mutationType) {
        operationTypes.push(`  mutation: ${mutationType.name}`);
      }
      const subscriptionType = schema.getSubscriptionType();
      if (subscriptionType) {
        operationTypes.push(`  subscription: ${subscriptionType.name}`);
      }
      return printDescription(schema) + `schema {
${operationTypes.join("\n")}
}`;
    }
    function isSchemaOfCommonNames(schema) {
      const queryType = schema.getQueryType();
      if (queryType && queryType.name !== "Query") {
        return false;
      }
      const mutationType = schema.getMutationType();
      if (mutationType && mutationType.name !== "Mutation") {
        return false;
      }
      const subscriptionType = schema.getSubscriptionType();
      if (subscriptionType && subscriptionType.name !== "Subscription") {
        return false;
      }
      return true;
    }
    function printType(type) {
      if ((0, _definition.isScalarType)(type)) {
        return printScalar(type);
      }
      if ((0, _definition.isObjectType)(type)) {
        return printObject(type);
      }
      if ((0, _definition.isInterfaceType)(type)) {
        return printInterface(type);
      }
      if ((0, _definition.isUnionType)(type)) {
        return printUnion(type);
      }
      if ((0, _definition.isEnumType)(type)) {
        return printEnum(type);
      }
      if ((0, _definition.isInputObjectType)(type)) {
        return printInputObject(type);
      }
      (0, _invariant.invariant)(
        false,
        "Unexpected type: " + (0, _inspect.inspect)(type)
      );
    }
    function printScalar(type) {
      return printDescription(type) + `scalar ${type.name}` + printSpecifiedByURL(type);
    }
    function printImplementedInterfaces(type) {
      const interfaces = type.getInterfaces();
      return interfaces.length ? " implements " + interfaces.map((i) => i.name).join(" & ") : "";
    }
    function printObject(type) {
      return printDescription(type) + `type ${type.name}` + printImplementedInterfaces(type) + printFields(type);
    }
    function printInterface(type) {
      return printDescription(type) + `interface ${type.name}` + printImplementedInterfaces(type) + printFields(type);
    }
    function printUnion(type) {
      const types = type.getTypes();
      const possibleTypes = types.length ? " = " + types.join(" | ") : "";
      return printDescription(type) + "union " + type.name + possibleTypes;
    }
    function printEnum(type) {
      const values = type.getValues().map(
        (value, i) => printDescription(value, "  ", !i) + "  " + value.name + printDeprecated(value.deprecationReason)
      );
      return printDescription(type) + `enum ${type.name}` + printBlock(values);
    }
    function printInputObject(type) {
      const fields = Object.values(type.getFields()).map(
        (f, i) => printDescription(f, "  ", !i) + "  " + printInputValue(f)
      );
      return printDescription(type) + `input ${type.name}` + (type.isOneOf ? " @oneOf" : "") + printBlock(fields);
    }
    function printFields(type) {
      const fields = Object.values(type.getFields()).map(
        (f, i) => printDescription(f, "  ", !i) + "  " + f.name + printArgs(f.args, "  ") + ": " + String(f.type) + printDeprecated(f.deprecationReason)
      );
      return printBlock(fields);
    }
    function printBlock(items) {
      return items.length !== 0 ? " {\n" + items.join("\n") + "\n}" : "";
    }
    function printArgs(args, indentation = "") {
      if (args.length === 0) {
        return "";
      }
      if (args.every((arg) => !arg.description)) {
        return "(" + args.map(printInputValue).join(", ") + ")";
      }
      return "(\n" + args.map(
        (arg, i) => printDescription(arg, "  " + indentation, !i) + "  " + indentation + printInputValue(arg)
      ).join("\n") + "\n" + indentation + ")";
    }
    function printInputValue(arg) {
      const defaultAST = (0, _astFromValue.astFromValue)(
        arg.defaultValue,
        arg.type
      );
      let argDecl = arg.name + ": " + String(arg.type);
      if (defaultAST) {
        argDecl += ` = ${(0, _printer.print)(defaultAST)}`;
      }
      return argDecl + printDeprecated(arg.deprecationReason);
    }
    function printDirective(directive) {
      return printDescription(directive) + "directive @" + directive.name + printArgs(directive.args) + printDeprecated(directive.deprecationReason) + (directive.isRepeatable ? " repeatable" : "") + " on " + directive.locations.join(" | ");
    }
    function printDeprecated(reason) {
      if (reason == null) {
        return "";
      }
      if (reason !== _directives.DEFAULT_DEPRECATION_REASON) {
        const astValue = (0, _printer.print)({
          kind: _kinds.Kind.STRING,
          value: reason
        });
        return ` @deprecated(reason: ${astValue})`;
      }
      return " @deprecated";
    }
    function printSpecifiedByURL(scalar) {
      if (scalar.specifiedByURL == null) {
        return "";
      }
      const astValue = (0, _printer.print)({
        kind: _kinds.Kind.STRING,
        value: scalar.specifiedByURL
      });
      return ` @specifiedBy(url: ${astValue})`;
    }
    function printDescription(def, indentation = "", firstInBlock = true) {
      const { description } = def;
      if (description == null) {
        return "";
      }
      const blockString = (0, _printer.print)({
        kind: _kinds.Kind.STRING,
        value: description,
        block: (0, _blockString.isPrintableAsBlockString)(description)
      });
      const prefix = indentation && !firstInBlock ? "\n" + indentation : indentation;
      return prefix + blockString.replace(/\n/g, "\n" + indentation) + "\n";
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/concatAST.js
var require_concatAST = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/concatAST.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.concatAST = concatAST;
    var _kinds = require_kinds();
    function concatAST(documents) {
      const definitions = [];
      for (const doc of documents) {
        definitions.push(...doc.definitions);
      }
      return {
        kind: _kinds.Kind.DOCUMENT,
        definitions
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/separateOperations.js
var require_separateOperations = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/separateOperations.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.separateOperations = separateOperations;
    var _kinds = require_kinds();
    var _visitor = require_visitor();
    function separateOperations(documentAST) {
      const operations = [];
      const depGraph = /* @__PURE__ */ Object.create(null);
      for (const definitionNode of documentAST.definitions) {
        switch (definitionNode.kind) {
          case _kinds.Kind.OPERATION_DEFINITION:
            operations.push(definitionNode);
            break;
          case _kinds.Kind.FRAGMENT_DEFINITION:
            depGraph[definitionNode.name.value] = collectDependencies(
              definitionNode.selectionSet
            );
            break;
          default:
        }
      }
      const separatedDocumentASTs = /* @__PURE__ */ Object.create(null);
      for (const operation of operations) {
        const dependencies = /* @__PURE__ */ new Set();
        for (const fragmentName of collectDependencies(operation.selectionSet)) {
          collectTransitiveDependencies(dependencies, depGraph, fragmentName);
        }
        const operationName = operation.name ? operation.name.value : "";
        separatedDocumentASTs[operationName] = {
          kind: _kinds.Kind.DOCUMENT,
          definitions: documentAST.definitions.filter(
            (node2) => node2 === operation || node2.kind === _kinds.Kind.FRAGMENT_DEFINITION && dependencies.has(node2.name.value)
          )
        };
      }
      return separatedDocumentASTs;
    }
    function collectTransitiveDependencies(collected, depGraph, fromName) {
      if (!collected.has(fromName)) {
        collected.add(fromName);
        const immediateDeps = depGraph[fromName];
        if (immediateDeps !== void 0) {
          for (const toName of immediateDeps) {
            collectTransitiveDependencies(collected, depGraph, toName);
          }
        }
      }
    }
    function collectDependencies(selectionSet) {
      const dependencies = [];
      (0, _visitor.visit)(selectionSet, {
        FragmentSpread(node2) {
          dependencies.push(node2.name.value);
        }
      });
      return dependencies;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/stripIgnoredCharacters.js
var require_stripIgnoredCharacters = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/stripIgnoredCharacters.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.stripIgnoredCharacters = stripIgnoredCharacters;
    var _blockString = require_blockString();
    var _lexer = require_lexer();
    var _source = require_source();
    var _tokenKind = require_tokenKind();
    function stripIgnoredCharacters(source) {
      const sourceObj = (0, _source.isSource)(source) ? source : new _source.Source(source);
      const body = sourceObj.body;
      const lexer = new _lexer.Lexer(sourceObj);
      let strippedBody = "";
      let wasLastAddedTokenNonPunctuator = false;
      while (lexer.advance().kind !== _tokenKind.TokenKind.EOF) {
        const currentToken = lexer.token;
        const tokenKind = currentToken.kind;
        const isNonPunctuator = !(0, _lexer.isPunctuatorTokenKind)(
          currentToken.kind
        );
        if (wasLastAddedTokenNonPunctuator) {
          if (isNonPunctuator || currentToken.kind === _tokenKind.TokenKind.SPREAD) {
            strippedBody += " ";
          }
        }
        const tokenBody = body.slice(currentToken.start, currentToken.end);
        if (tokenKind === _tokenKind.TokenKind.BLOCK_STRING) {
          strippedBody += (0, _blockString.printBlockString)(currentToken.value, {
            minimize: true
          });
        } else {
          strippedBody += tokenBody;
        }
        wasLastAddedTokenNonPunctuator = isNonPunctuator;
      }
      return strippedBody;
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/assertValidName.js
var require_assertValidName = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/assertValidName.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.assertValidName = assertValidName;
    exports.isValidNameError = isValidNameError;
    var _devAssert = require_devAssert();
    var _GraphQLError = require_GraphQLError();
    var _assertName = require_assertName();
    function assertValidName(name2) {
      const error = isValidNameError(name2);
      if (error) {
        throw error;
      }
      return name2;
    }
    function isValidNameError(name2) {
      typeof name2 === "string" || (0, _devAssert.devAssert)(false, "Expected name to be a string.");
      if (name2.startsWith("__")) {
        return new _GraphQLError.GraphQLError(
          `Name "${name2}" must not begin with "__", which is reserved by GraphQL introspection.`
        );
      }
      try {
        (0, _assertName.assertName)(name2);
      } catch (error) {
        return error;
      }
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/sortValueNode.js
var require_sortValueNode = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/sortValueNode.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.sortValueNode = sortValueNode;
    var _naturalCompare = require_naturalCompare();
    var _kinds = require_kinds();
    function sortValueNode(valueNode) {
      switch (valueNode.kind) {
        case _kinds.Kind.OBJECT:
          return { ...valueNode, fields: sortFields(valueNode.fields) };
        case _kinds.Kind.LIST:
          return { ...valueNode, values: valueNode.values.map(sortValueNode) };
        case _kinds.Kind.INT:
        case _kinds.Kind.FLOAT:
        case _kinds.Kind.STRING:
        case _kinds.Kind.BOOLEAN:
        case _kinds.Kind.NULL:
        case _kinds.Kind.ENUM:
        case _kinds.Kind.VARIABLE:
          return valueNode;
      }
    }
    function sortFields(fields) {
      return fields.map((fieldNode) => ({
        ...fieldNode,
        value: sortValueNode(fieldNode.value)
      })).sort(
        (fieldA, fieldB) => (0, _naturalCompare.naturalCompare)(fieldA.name.value, fieldB.name.value)
      );
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/findBreakingChanges.js
var require_findBreakingChanges = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/findBreakingChanges.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.DangerousChangeType = exports.BreakingChangeType = void 0;
    exports.findBreakingChanges = findBreakingChanges;
    exports.findDangerousChanges = findDangerousChanges;
    var _inspect = require_inspect();
    var _invariant = require_invariant();
    var _keyMap = require_keyMap();
    var _printer = require_printer();
    var _definition = require_definition();
    var _scalars = require_scalars();
    var _astFromValue = require_astFromValue();
    var _sortValueNode = require_sortValueNode();
    var BreakingChangeType;
    exports.BreakingChangeType = BreakingChangeType;
    (function(BreakingChangeType2) {
      BreakingChangeType2["TYPE_REMOVED"] = "TYPE_REMOVED";
      BreakingChangeType2["TYPE_CHANGED_KIND"] = "TYPE_CHANGED_KIND";
      BreakingChangeType2["TYPE_REMOVED_FROM_UNION"] = "TYPE_REMOVED_FROM_UNION";
      BreakingChangeType2["VALUE_REMOVED_FROM_ENUM"] = "VALUE_REMOVED_FROM_ENUM";
      BreakingChangeType2["REQUIRED_INPUT_FIELD_ADDED"] = "REQUIRED_INPUT_FIELD_ADDED";
      BreakingChangeType2["IMPLEMENTED_INTERFACE_REMOVED"] = "IMPLEMENTED_INTERFACE_REMOVED";
      BreakingChangeType2["FIELD_REMOVED"] = "FIELD_REMOVED";
      BreakingChangeType2["FIELD_CHANGED_KIND"] = "FIELD_CHANGED_KIND";
      BreakingChangeType2["REQUIRED_ARG_ADDED"] = "REQUIRED_ARG_ADDED";
      BreakingChangeType2["ARG_REMOVED"] = "ARG_REMOVED";
      BreakingChangeType2["ARG_CHANGED_KIND"] = "ARG_CHANGED_KIND";
      BreakingChangeType2["DIRECTIVE_REMOVED"] = "DIRECTIVE_REMOVED";
      BreakingChangeType2["DIRECTIVE_ARG_REMOVED"] = "DIRECTIVE_ARG_REMOVED";
      BreakingChangeType2["REQUIRED_DIRECTIVE_ARG_ADDED"] = "REQUIRED_DIRECTIVE_ARG_ADDED";
      BreakingChangeType2["DIRECTIVE_REPEATABLE_REMOVED"] = "DIRECTIVE_REPEATABLE_REMOVED";
      BreakingChangeType2["DIRECTIVE_LOCATION_REMOVED"] = "DIRECTIVE_LOCATION_REMOVED";
    })(
      BreakingChangeType || (exports.BreakingChangeType = BreakingChangeType = {})
    );
    var DangerousChangeType;
    exports.DangerousChangeType = DangerousChangeType;
    (function(DangerousChangeType2) {
      DangerousChangeType2["VALUE_ADDED_TO_ENUM"] = "VALUE_ADDED_TO_ENUM";
      DangerousChangeType2["TYPE_ADDED_TO_UNION"] = "TYPE_ADDED_TO_UNION";
      DangerousChangeType2["OPTIONAL_INPUT_FIELD_ADDED"] = "OPTIONAL_INPUT_FIELD_ADDED";
      DangerousChangeType2["OPTIONAL_ARG_ADDED"] = "OPTIONAL_ARG_ADDED";
      DangerousChangeType2["IMPLEMENTED_INTERFACE_ADDED"] = "IMPLEMENTED_INTERFACE_ADDED";
      DangerousChangeType2["ARG_DEFAULT_VALUE_CHANGE"] = "ARG_DEFAULT_VALUE_CHANGE";
    })(
      DangerousChangeType || (exports.DangerousChangeType = DangerousChangeType = {})
    );
    function findBreakingChanges(oldSchema, newSchema) {
      return findSchemaChanges(oldSchema, newSchema).filter(
        (change) => change.type in BreakingChangeType
      );
    }
    function findDangerousChanges(oldSchema, newSchema) {
      return findSchemaChanges(oldSchema, newSchema).filter(
        (change) => change.type in DangerousChangeType
      );
    }
    function findSchemaChanges(oldSchema, newSchema) {
      return [
        ...findTypeChanges(oldSchema, newSchema),
        ...findDirectiveChanges(oldSchema, newSchema)
      ];
    }
    function findDirectiveChanges(oldSchema, newSchema) {
      const schemaChanges = [];
      const directivesDiff = diff(
        oldSchema.getDirectives(),
        newSchema.getDirectives()
      );
      for (const oldDirective of directivesDiff.removed) {
        schemaChanges.push({
          type: BreakingChangeType.DIRECTIVE_REMOVED,
          description: `${oldDirective.name} was removed.`
        });
      }
      for (const [oldDirective, newDirective] of directivesDiff.persisted) {
        const argsDiff = diff(oldDirective.args, newDirective.args);
        for (const newArg of argsDiff.added) {
          if ((0, _definition.isRequiredArgument)(newArg)) {
            schemaChanges.push({
              type: BreakingChangeType.REQUIRED_DIRECTIVE_ARG_ADDED,
              description: `A required arg ${newArg.name} on directive ${oldDirective.name} was added.`
            });
          }
        }
        for (const oldArg of argsDiff.removed) {
          schemaChanges.push({
            type: BreakingChangeType.DIRECTIVE_ARG_REMOVED,
            description: `${oldArg.name} was removed from ${oldDirective.name}.`
          });
        }
        if (oldDirective.isRepeatable && !newDirective.isRepeatable) {
          schemaChanges.push({
            type: BreakingChangeType.DIRECTIVE_REPEATABLE_REMOVED,
            description: `Repeatable flag was removed from ${oldDirective.name}.`
          });
        }
        for (const location of oldDirective.locations) {
          if (!newDirective.locations.includes(location)) {
            schemaChanges.push({
              type: BreakingChangeType.DIRECTIVE_LOCATION_REMOVED,
              description: `${location} was removed from ${oldDirective.name}.`
            });
          }
        }
      }
      return schemaChanges;
    }
    function findTypeChanges(oldSchema, newSchema) {
      const schemaChanges = [];
      const typesDiff = diff(
        Object.values(oldSchema.getTypeMap()),
        Object.values(newSchema.getTypeMap())
      );
      for (const oldType of typesDiff.removed) {
        schemaChanges.push({
          type: BreakingChangeType.TYPE_REMOVED,
          description: (0, _scalars.isSpecifiedScalarType)(oldType) ? `Standard scalar ${oldType.name} was removed because it is not referenced anymore.` : `${oldType.name} was removed.`
        });
      }
      for (const [oldType, newType] of typesDiff.persisted) {
        if ((0, _definition.isEnumType)(oldType) && (0, _definition.isEnumType)(newType)) {
          schemaChanges.push(...findEnumTypeChanges(oldType, newType));
        } else if ((0, _definition.isUnionType)(oldType) && (0, _definition.isUnionType)(newType)) {
          schemaChanges.push(...findUnionTypeChanges(oldType, newType));
        } else if ((0, _definition.isInputObjectType)(oldType) && (0, _definition.isInputObjectType)(newType)) {
          schemaChanges.push(...findInputObjectTypeChanges(oldType, newType));
        } else if ((0, _definition.isObjectType)(oldType) && (0, _definition.isObjectType)(newType)) {
          schemaChanges.push(
            ...findFieldChanges(oldType, newType),
            ...findImplementedInterfacesChanges(oldType, newType)
          );
        } else if ((0, _definition.isInterfaceType)(oldType) && (0, _definition.isInterfaceType)(newType)) {
          schemaChanges.push(
            ...findFieldChanges(oldType, newType),
            ...findImplementedInterfacesChanges(oldType, newType)
          );
        } else if (oldType.constructor !== newType.constructor) {
          schemaChanges.push({
            type: BreakingChangeType.TYPE_CHANGED_KIND,
            description: `${oldType.name} changed from ${typeKindName(oldType)} to ${typeKindName(newType)}.`
          });
        }
      }
      return schemaChanges;
    }
    function findInputObjectTypeChanges(oldType, newType) {
      const schemaChanges = [];
      const fieldsDiff = diff(
        Object.values(oldType.getFields()),
        Object.values(newType.getFields())
      );
      for (const newField of fieldsDiff.added) {
        if ((0, _definition.isRequiredInputField)(newField)) {
          schemaChanges.push({
            type: BreakingChangeType.REQUIRED_INPUT_FIELD_ADDED,
            description: `A required field ${newField.name} on input type ${oldType.name} was added.`
          });
        } else {
          schemaChanges.push({
            type: DangerousChangeType.OPTIONAL_INPUT_FIELD_ADDED,
            description: `An optional field ${newField.name} on input type ${oldType.name} was added.`
          });
        }
      }
      for (const oldField of fieldsDiff.removed) {
        schemaChanges.push({
          type: BreakingChangeType.FIELD_REMOVED,
          description: `${oldType.name}.${oldField.name} was removed.`
        });
      }
      for (const [oldField, newField] of fieldsDiff.persisted) {
        const isSafe = isChangeSafeForInputObjectFieldOrFieldArg(
          oldField.type,
          newField.type
        );
        if (!isSafe) {
          schemaChanges.push({
            type: BreakingChangeType.FIELD_CHANGED_KIND,
            description: `${oldType.name}.${oldField.name} changed type from ${String(oldField.type)} to ${String(newField.type)}.`
          });
        }
      }
      return schemaChanges;
    }
    function findUnionTypeChanges(oldType, newType) {
      const schemaChanges = [];
      const possibleTypesDiff = diff(oldType.getTypes(), newType.getTypes());
      for (const newPossibleType of possibleTypesDiff.added) {
        schemaChanges.push({
          type: DangerousChangeType.TYPE_ADDED_TO_UNION,
          description: `${newPossibleType.name} was added to union type ${oldType.name}.`
        });
      }
      for (const oldPossibleType of possibleTypesDiff.removed) {
        schemaChanges.push({
          type: BreakingChangeType.TYPE_REMOVED_FROM_UNION,
          description: `${oldPossibleType.name} was removed from union type ${oldType.name}.`
        });
      }
      return schemaChanges;
    }
    function findEnumTypeChanges(oldType, newType) {
      const schemaChanges = [];
      const valuesDiff = diff(oldType.getValues(), newType.getValues());
      for (const newValue of valuesDiff.added) {
        schemaChanges.push({
          type: DangerousChangeType.VALUE_ADDED_TO_ENUM,
          description: `${newValue.name} was added to enum type ${oldType.name}.`
        });
      }
      for (const oldValue of valuesDiff.removed) {
        schemaChanges.push({
          type: BreakingChangeType.VALUE_REMOVED_FROM_ENUM,
          description: `${oldValue.name} was removed from enum type ${oldType.name}.`
        });
      }
      return schemaChanges;
    }
    function findImplementedInterfacesChanges(oldType, newType) {
      const schemaChanges = [];
      const interfacesDiff = diff(oldType.getInterfaces(), newType.getInterfaces());
      for (const newInterface of interfacesDiff.added) {
        schemaChanges.push({
          type: DangerousChangeType.IMPLEMENTED_INTERFACE_ADDED,
          description: `${newInterface.name} added to interfaces implemented by ${oldType.name}.`
        });
      }
      for (const oldInterface of interfacesDiff.removed) {
        schemaChanges.push({
          type: BreakingChangeType.IMPLEMENTED_INTERFACE_REMOVED,
          description: `${oldType.name} no longer implements interface ${oldInterface.name}.`
        });
      }
      return schemaChanges;
    }
    function findFieldChanges(oldType, newType) {
      const schemaChanges = [];
      const fieldsDiff = diff(
        Object.values(oldType.getFields()),
        Object.values(newType.getFields())
      );
      for (const oldField of fieldsDiff.removed) {
        schemaChanges.push({
          type: BreakingChangeType.FIELD_REMOVED,
          description: `${oldType.name}.${oldField.name} was removed.`
        });
      }
      for (const [oldField, newField] of fieldsDiff.persisted) {
        schemaChanges.push(...findArgChanges(oldType, oldField, newField));
        const isSafe = isChangeSafeForObjectOrInterfaceField(
          oldField.type,
          newField.type
        );
        if (!isSafe) {
          schemaChanges.push({
            type: BreakingChangeType.FIELD_CHANGED_KIND,
            description: `${oldType.name}.${oldField.name} changed type from ${String(oldField.type)} to ${String(newField.type)}.`
          });
        }
      }
      return schemaChanges;
    }
    function findArgChanges(oldType, oldField, newField) {
      const schemaChanges = [];
      const argsDiff = diff(oldField.args, newField.args);
      for (const oldArg of argsDiff.removed) {
        schemaChanges.push({
          type: BreakingChangeType.ARG_REMOVED,
          description: `${oldType.name}.${oldField.name} arg ${oldArg.name} was removed.`
        });
      }
      for (const [oldArg, newArg] of argsDiff.persisted) {
        const isSafe = isChangeSafeForInputObjectFieldOrFieldArg(
          oldArg.type,
          newArg.type
        );
        if (!isSafe) {
          schemaChanges.push({
            type: BreakingChangeType.ARG_CHANGED_KIND,
            description: `${oldType.name}.${oldField.name} arg ${oldArg.name} has changed type from ${String(oldArg.type)} to ${String(newArg.type)}.`
          });
        } else if (oldArg.defaultValue !== void 0) {
          if (newArg.defaultValue === void 0) {
            schemaChanges.push({
              type: DangerousChangeType.ARG_DEFAULT_VALUE_CHANGE,
              description: `${oldType.name}.${oldField.name} arg ${oldArg.name} defaultValue was removed.`
            });
          } else {
            const oldValueStr = stringifyValue(oldArg.defaultValue, oldArg.type);
            const newValueStr = stringifyValue(newArg.defaultValue, newArg.type);
            if (oldValueStr !== newValueStr) {
              schemaChanges.push({
                type: DangerousChangeType.ARG_DEFAULT_VALUE_CHANGE,
                description: `${oldType.name}.${oldField.name} arg ${oldArg.name} has changed defaultValue from ${oldValueStr} to ${newValueStr}.`
              });
            }
          }
        }
      }
      for (const newArg of argsDiff.added) {
        if ((0, _definition.isRequiredArgument)(newArg)) {
          schemaChanges.push({
            type: BreakingChangeType.REQUIRED_ARG_ADDED,
            description: `A required arg ${newArg.name} on ${oldType.name}.${oldField.name} was added.`
          });
        } else {
          schemaChanges.push({
            type: DangerousChangeType.OPTIONAL_ARG_ADDED,
            description: `An optional arg ${newArg.name} on ${oldType.name}.${oldField.name} was added.`
          });
        }
      }
      return schemaChanges;
    }
    function isChangeSafeForObjectOrInterfaceField(oldType, newType) {
      if ((0, _definition.isListType)(oldType)) {
        return (
          // if they're both lists, make sure the underlying types are compatible
          (0, _definition.isListType)(newType) && isChangeSafeForObjectOrInterfaceField(
            oldType.ofType,
            newType.ofType
          ) || // moving from nullable to non-null of the same underlying type is safe
          (0, _definition.isNonNullType)(newType) && isChangeSafeForObjectOrInterfaceField(oldType, newType.ofType)
        );
      }
      if ((0, _definition.isNonNullType)(oldType)) {
        return (0, _definition.isNonNullType)(newType) && isChangeSafeForObjectOrInterfaceField(oldType.ofType, newType.ofType);
      }
      return (
        // if they're both named types, see if their names are equivalent
        (0, _definition.isNamedType)(newType) && oldType.name === newType.name || // moving from nullable to non-null of the same underlying type is safe
        (0, _definition.isNonNullType)(newType) && isChangeSafeForObjectOrInterfaceField(oldType, newType.ofType)
      );
    }
    function isChangeSafeForInputObjectFieldOrFieldArg(oldType, newType) {
      if ((0, _definition.isListType)(oldType)) {
        return (0, _definition.isListType)(newType) && isChangeSafeForInputObjectFieldOrFieldArg(oldType.ofType, newType.ofType);
      }
      if ((0, _definition.isNonNullType)(oldType)) {
        return (
          // if they're both non-null, make sure the underlying types are
          // compatible
          (0, _definition.isNonNullType)(newType) && isChangeSafeForInputObjectFieldOrFieldArg(
            oldType.ofType,
            newType.ofType
          ) || // moving from non-null to nullable of the same underlying type is safe
          !(0, _definition.isNonNullType)(newType) && isChangeSafeForInputObjectFieldOrFieldArg(oldType.ofType, newType)
        );
      }
      return (0, _definition.isNamedType)(newType) && oldType.name === newType.name;
    }
    function typeKindName(type) {
      if ((0, _definition.isScalarType)(type)) {
        return "a Scalar type";
      }
      if ((0, _definition.isObjectType)(type)) {
        return "an Object type";
      }
      if ((0, _definition.isInterfaceType)(type)) {
        return "an Interface type";
      }
      if ((0, _definition.isUnionType)(type)) {
        return "a Union type";
      }
      if ((0, _definition.isEnumType)(type)) {
        return "an Enum type";
      }
      if ((0, _definition.isInputObjectType)(type)) {
        return "an Input type";
      }
      (0, _invariant.invariant)(
        false,
        "Unexpected type: " + (0, _inspect.inspect)(type)
      );
    }
    function stringifyValue(value, type) {
      const ast = (0, _astFromValue.astFromValue)(value, type);
      ast != null || (0, _invariant.invariant)(false);
      return (0, _printer.print)((0, _sortValueNode.sortValueNode)(ast));
    }
    function diff(oldArray, newArray) {
      const added = [];
      const removed = [];
      const persisted = [];
      const oldMap = (0, _keyMap.keyMap)(oldArray, ({ name: name2 }) => name2);
      const newMap = (0, _keyMap.keyMap)(newArray, ({ name: name2 }) => name2);
      for (const oldItem of oldArray) {
        const newItem = newMap[oldItem.name];
        if (newItem === void 0) {
          removed.push(oldItem);
        } else {
          persisted.push([oldItem, newItem]);
        }
      }
      for (const newItem of newArray) {
        if (oldMap[newItem.name] === void 0) {
          added.push(newItem);
        }
      }
      return {
        added,
        persisted,
        removed
      };
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/resolveSchemaCoordinate.js
var require_resolveSchemaCoordinate = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/resolveSchemaCoordinate.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.resolveASTSchemaCoordinate = resolveASTSchemaCoordinate;
    exports.resolveSchemaCoordinate = resolveSchemaCoordinate;
    var _inspect = require_inspect();
    var _kinds = require_kinds();
    var _parser = require_parser();
    var _definition = require_definition();
    function resolveSchemaCoordinate(schema, schemaCoordinate) {
      return resolveASTSchemaCoordinate(
        schema,
        (0, _parser.parseSchemaCoordinate)(schemaCoordinate)
      );
    }
    function resolveTypeCoordinate(schema, schemaCoordinate) {
      const typeName = schemaCoordinate.name.value;
      const type = schema.getType(typeName);
      if (type == null) {
        return;
      }
      return {
        kind: "NamedType",
        type
      };
    }
    function resolveMemberCoordinate(schema, schemaCoordinate) {
      const typeName = schemaCoordinate.name.value;
      const type = schema.getType(typeName);
      if (!type) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(
            typeName
          )} to be defined as a type in the schema.`
        );
      }
      if (!(0, _definition.isEnumType)(type) && !(0, _definition.isInputObjectType)(type) && !(0, _definition.isObjectType)(type) && !(0, _definition.isInterfaceType)(type)) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(
            typeName
          )} to be an Enum, Input Object, Object or Interface type.`
        );
      }
      if ((0, _definition.isEnumType)(type)) {
        const enumValueName = schemaCoordinate.memberName.value;
        const enumValue = type.getValue(enumValueName);
        if (enumValue == null) {
          return;
        }
        return {
          kind: "EnumValue",
          type,
          enumValue
        };
      }
      if ((0, _definition.isInputObjectType)(type)) {
        const inputFieldName = schemaCoordinate.memberName.value;
        const inputField = type.getFields()[inputFieldName];
        if (inputField == null) {
          return;
        }
        return {
          kind: "InputField",
          type,
          inputField
        };
      }
      const fieldName = schemaCoordinate.memberName.value;
      const field = type.getFields()[fieldName];
      if (field == null) {
        return;
      }
      return {
        kind: "Field",
        type,
        field
      };
    }
    function resolveArgumentCoordinate(schema, schemaCoordinate) {
      const typeName = schemaCoordinate.name.value;
      const type = schema.getType(typeName);
      if (type == null) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(
            typeName
          )} to be defined as a type in the schema.`
        );
      }
      if (!(0, _definition.isObjectType)(type) && !(0, _definition.isInterfaceType)(type)) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(
            typeName
          )} to be an object type or interface type.`
        );
      }
      const fieldName = schemaCoordinate.fieldName.value;
      const field = type.getFields()[fieldName];
      if (field == null) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(
            fieldName
          )} to exist as a field of type ${(0, _inspect.inspect)(
            typeName
          )} in the schema.`
        );
      }
      const fieldArgumentName = schemaCoordinate.argumentName.value;
      const fieldArgument = field.args.find(
        (arg) => arg.name === fieldArgumentName
      );
      if (fieldArgument == null) {
        return;
      }
      return {
        kind: "FieldArgument",
        type,
        field,
        fieldArgument
      };
    }
    function resolveDirectiveCoordinate(schema, schemaCoordinate) {
      const directiveName = schemaCoordinate.name.value;
      const directive = schema.getDirective(directiveName);
      if (!directive) {
        return;
      }
      return {
        kind: "Directive",
        directive
      };
    }
    function resolveDirectiveArgumentCoordinate(schema, schemaCoordinate) {
      const directiveName = schemaCoordinate.name.value;
      const directive = schema.getDirective(directiveName);
      if (!directive) {
        throw new Error(
          `Expected ${(0, _inspect.inspect)(
            directiveName
          )} to be defined as a directive in the schema.`
        );
      }
      const {
        argumentName: { value: directiveArgumentName }
      } = schemaCoordinate;
      const directiveArgument = directive.args.find(
        (arg) => arg.name === directiveArgumentName
      );
      if (!directiveArgument) {
        return;
      }
      return {
        kind: "DirectiveArgument",
        directive,
        directiveArgument
      };
    }
    function resolveASTSchemaCoordinate(schema, schemaCoordinate) {
      switch (schemaCoordinate.kind) {
        case _kinds.Kind.TYPE_COORDINATE:
          return resolveTypeCoordinate(schema, schemaCoordinate);
        case _kinds.Kind.MEMBER_COORDINATE:
          return resolveMemberCoordinate(schema, schemaCoordinate);
        case _kinds.Kind.ARGUMENT_COORDINATE:
          return resolveArgumentCoordinate(schema, schemaCoordinate);
        case _kinds.Kind.DIRECTIVE_COORDINATE:
          return resolveDirectiveCoordinate(schema, schemaCoordinate);
        case _kinds.Kind.DIRECTIVE_ARGUMENT_COORDINATE:
          return resolveDirectiveArgumentCoordinate(schema, schemaCoordinate);
      }
    }
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/index.js
var require_utilities = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/utilities/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "BreakingChangeType", {
      enumerable: true,
      get: function() {
        return _findBreakingChanges.BreakingChangeType;
      }
    });
    Object.defineProperty(exports, "DangerousChangeType", {
      enumerable: true,
      get: function() {
        return _findBreakingChanges.DangerousChangeType;
      }
    });
    Object.defineProperty(exports, "TypeInfo", {
      enumerable: true,
      get: function() {
        return _TypeInfo.TypeInfo;
      }
    });
    Object.defineProperty(exports, "assertValidName", {
      enumerable: true,
      get: function() {
        return _assertValidName.assertValidName;
      }
    });
    Object.defineProperty(exports, "astFromValue", {
      enumerable: true,
      get: function() {
        return _astFromValue.astFromValue;
      }
    });
    Object.defineProperty(exports, "buildASTSchema", {
      enumerable: true,
      get: function() {
        return _buildASTSchema.buildASTSchema;
      }
    });
    Object.defineProperty(exports, "buildClientSchema", {
      enumerable: true,
      get: function() {
        return _buildClientSchema.buildClientSchema;
      }
    });
    Object.defineProperty(exports, "buildSchema", {
      enumerable: true,
      get: function() {
        return _buildASTSchema.buildSchema;
      }
    });
    Object.defineProperty(exports, "coerceInputValue", {
      enumerable: true,
      get: function() {
        return _coerceInputValue.coerceInputValue;
      }
    });
    Object.defineProperty(exports, "concatAST", {
      enumerable: true,
      get: function() {
        return _concatAST.concatAST;
      }
    });
    Object.defineProperty(exports, "doTypesOverlap", {
      enumerable: true,
      get: function() {
        return _typeComparators.doTypesOverlap;
      }
    });
    Object.defineProperty(exports, "extendSchema", {
      enumerable: true,
      get: function() {
        return _extendSchema.extendSchema;
      }
    });
    Object.defineProperty(exports, "findBreakingChanges", {
      enumerable: true,
      get: function() {
        return _findBreakingChanges.findBreakingChanges;
      }
    });
    Object.defineProperty(exports, "findDangerousChanges", {
      enumerable: true,
      get: function() {
        return _findBreakingChanges.findDangerousChanges;
      }
    });
    Object.defineProperty(exports, "getIntrospectionQuery", {
      enumerable: true,
      get: function() {
        return _getIntrospectionQuery.getIntrospectionQuery;
      }
    });
    Object.defineProperty(exports, "getOperationAST", {
      enumerable: true,
      get: function() {
        return _getOperationAST.getOperationAST;
      }
    });
    Object.defineProperty(exports, "getOperationRootType", {
      enumerable: true,
      get: function() {
        return _getOperationRootType.getOperationRootType;
      }
    });
    Object.defineProperty(exports, "introspectionFromSchema", {
      enumerable: true,
      get: function() {
        return _introspectionFromSchema.introspectionFromSchema;
      }
    });
    Object.defineProperty(exports, "isEqualType", {
      enumerable: true,
      get: function() {
        return _typeComparators.isEqualType;
      }
    });
    Object.defineProperty(exports, "isTypeSubTypeOf", {
      enumerable: true,
      get: function() {
        return _typeComparators.isTypeSubTypeOf;
      }
    });
    Object.defineProperty(exports, "isValidNameError", {
      enumerable: true,
      get: function() {
        return _assertValidName.isValidNameError;
      }
    });
    Object.defineProperty(exports, "lexicographicSortSchema", {
      enumerable: true,
      get: function() {
        return _lexicographicSortSchema.lexicographicSortSchema;
      }
    });
    Object.defineProperty(exports, "printIntrospectionSchema", {
      enumerable: true,
      get: function() {
        return _printSchema.printIntrospectionSchema;
      }
    });
    Object.defineProperty(exports, "printSchema", {
      enumerable: true,
      get: function() {
        return _printSchema.printSchema;
      }
    });
    Object.defineProperty(exports, "printType", {
      enumerable: true,
      get: function() {
        return _printSchema.printType;
      }
    });
    Object.defineProperty(exports, "resolveASTSchemaCoordinate", {
      enumerable: true,
      get: function() {
        return _resolveSchemaCoordinate.resolveASTSchemaCoordinate;
      }
    });
    Object.defineProperty(exports, "resolveSchemaCoordinate", {
      enumerable: true,
      get: function() {
        return _resolveSchemaCoordinate.resolveSchemaCoordinate;
      }
    });
    Object.defineProperty(exports, "separateOperations", {
      enumerable: true,
      get: function() {
        return _separateOperations.separateOperations;
      }
    });
    Object.defineProperty(exports, "stripIgnoredCharacters", {
      enumerable: true,
      get: function() {
        return _stripIgnoredCharacters.stripIgnoredCharacters;
      }
    });
    Object.defineProperty(exports, "typeFromAST", {
      enumerable: true,
      get: function() {
        return _typeFromAST.typeFromAST;
      }
    });
    Object.defineProperty(exports, "valueFromAST", {
      enumerable: true,
      get: function() {
        return _valueFromAST.valueFromAST;
      }
    });
    Object.defineProperty(exports, "valueFromASTUntyped", {
      enumerable: true,
      get: function() {
        return _valueFromASTUntyped.valueFromASTUntyped;
      }
    });
    Object.defineProperty(exports, "visitWithTypeInfo", {
      enumerable: true,
      get: function() {
        return _TypeInfo.visitWithTypeInfo;
      }
    });
    var _getIntrospectionQuery = require_getIntrospectionQuery();
    var _getOperationAST = require_getOperationAST();
    var _getOperationRootType = require_getOperationRootType();
    var _introspectionFromSchema = require_introspectionFromSchema();
    var _buildClientSchema = require_buildClientSchema();
    var _buildASTSchema = require_buildASTSchema();
    var _extendSchema = require_extendSchema();
    var _lexicographicSortSchema = require_lexicographicSortSchema();
    var _printSchema = require_printSchema();
    var _typeFromAST = require_typeFromAST();
    var _valueFromAST = require_valueFromAST();
    var _valueFromASTUntyped = require_valueFromASTUntyped();
    var _astFromValue = require_astFromValue();
    var _TypeInfo = require_TypeInfo();
    var _coerceInputValue = require_coerceInputValue();
    var _concatAST = require_concatAST();
    var _separateOperations = require_separateOperations();
    var _stripIgnoredCharacters = require_stripIgnoredCharacters();
    var _typeComparators = require_typeComparators();
    var _assertValidName = require_assertValidName();
    var _findBreakingChanges = require_findBreakingChanges();
    var _resolveSchemaCoordinate = require_resolveSchemaCoordinate();
  }
});

// node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/index.js
var require_graphql2 = __commonJS({
  "node_modules/.pnpm/graphql@16.15.0/node_modules/graphql/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    Object.defineProperty(exports, "BREAK", {
      enumerable: true,
      get: function() {
        return _index2.BREAK;
      }
    });
    Object.defineProperty(exports, "BreakingChangeType", {
      enumerable: true,
      get: function() {
        return _index6.BreakingChangeType;
      }
    });
    Object.defineProperty(exports, "DEFAULT_DEPRECATION_REASON", {
      enumerable: true,
      get: function() {
        return _index.DEFAULT_DEPRECATION_REASON;
      }
    });
    Object.defineProperty(exports, "DangerousChangeType", {
      enumerable: true,
      get: function() {
        return _index6.DangerousChangeType;
      }
    });
    Object.defineProperty(exports, "DirectiveLocation", {
      enumerable: true,
      get: function() {
        return _index2.DirectiveLocation;
      }
    });
    Object.defineProperty(exports, "ExecutableDefinitionsRule", {
      enumerable: true,
      get: function() {
        return _index4.ExecutableDefinitionsRule;
      }
    });
    Object.defineProperty(exports, "FieldsOnCorrectTypeRule", {
      enumerable: true,
      get: function() {
        return _index4.FieldsOnCorrectTypeRule;
      }
    });
    Object.defineProperty(exports, "FragmentsOnCompositeTypesRule", {
      enumerable: true,
      get: function() {
        return _index4.FragmentsOnCompositeTypesRule;
      }
    });
    Object.defineProperty(exports, "GRAPHQL_MAX_INT", {
      enumerable: true,
      get: function() {
        return _index.GRAPHQL_MAX_INT;
      }
    });
    Object.defineProperty(exports, "GRAPHQL_MIN_INT", {
      enumerable: true,
      get: function() {
        return _index.GRAPHQL_MIN_INT;
      }
    });
    Object.defineProperty(exports, "GraphQLBoolean", {
      enumerable: true,
      get: function() {
        return _index.GraphQLBoolean;
      }
    });
    Object.defineProperty(exports, "GraphQLDeprecatedDirective", {
      enumerable: true,
      get: function() {
        return _index.GraphQLDeprecatedDirective;
      }
    });
    Object.defineProperty(exports, "GraphQLDirective", {
      enumerable: true,
      get: function() {
        return _index.GraphQLDirective;
      }
    });
    Object.defineProperty(exports, "GraphQLEnumType", {
      enumerable: true,
      get: function() {
        return _index.GraphQLEnumType;
      }
    });
    Object.defineProperty(exports, "GraphQLError", {
      enumerable: true,
      get: function() {
        return _index5.GraphQLError;
      }
    });
    Object.defineProperty(exports, "GraphQLFloat", {
      enumerable: true,
      get: function() {
        return _index.GraphQLFloat;
      }
    });
    Object.defineProperty(exports, "GraphQLID", {
      enumerable: true,
      get: function() {
        return _index.GraphQLID;
      }
    });
    Object.defineProperty(exports, "GraphQLIncludeDirective", {
      enumerable: true,
      get: function() {
        return _index.GraphQLIncludeDirective;
      }
    });
    Object.defineProperty(exports, "GraphQLInputObjectType", {
      enumerable: true,
      get: function() {
        return _index.GraphQLInputObjectType;
      }
    });
    Object.defineProperty(exports, "GraphQLInt", {
      enumerable: true,
      get: function() {
        return _index.GraphQLInt;
      }
    });
    Object.defineProperty(exports, "GraphQLInterfaceType", {
      enumerable: true,
      get: function() {
        return _index.GraphQLInterfaceType;
      }
    });
    Object.defineProperty(exports, "GraphQLList", {
      enumerable: true,
      get: function() {
        return _index.GraphQLList;
      }
    });
    Object.defineProperty(exports, "GraphQLNonNull", {
      enumerable: true,
      get: function() {
        return _index.GraphQLNonNull;
      }
    });
    Object.defineProperty(exports, "GraphQLObjectType", {
      enumerable: true,
      get: function() {
        return _index.GraphQLObjectType;
      }
    });
    Object.defineProperty(exports, "GraphQLOneOfDirective", {
      enumerable: true,
      get: function() {
        return _index.GraphQLOneOfDirective;
      }
    });
    Object.defineProperty(exports, "GraphQLScalarType", {
      enumerable: true,
      get: function() {
        return _index.GraphQLScalarType;
      }
    });
    Object.defineProperty(exports, "GraphQLSchema", {
      enumerable: true,
      get: function() {
        return _index.GraphQLSchema;
      }
    });
    Object.defineProperty(exports, "GraphQLSkipDirective", {
      enumerable: true,
      get: function() {
        return _index.GraphQLSkipDirective;
      }
    });
    Object.defineProperty(exports, "GraphQLSpecifiedByDirective", {
      enumerable: true,
      get: function() {
        return _index.GraphQLSpecifiedByDirective;
      }
    });
    Object.defineProperty(exports, "GraphQLString", {
      enumerable: true,
      get: function() {
        return _index.GraphQLString;
      }
    });
    Object.defineProperty(exports, "GraphQLUnionType", {
      enumerable: true,
      get: function() {
        return _index.GraphQLUnionType;
      }
    });
    Object.defineProperty(exports, "Kind", {
      enumerable: true,
      get: function() {
        return _index2.Kind;
      }
    });
    Object.defineProperty(exports, "KnownArgumentNamesRule", {
      enumerable: true,
      get: function() {
        return _index4.KnownArgumentNamesRule;
      }
    });
    Object.defineProperty(exports, "KnownDirectivesRule", {
      enumerable: true,
      get: function() {
        return _index4.KnownDirectivesRule;
      }
    });
    Object.defineProperty(exports, "KnownFragmentNamesRule", {
      enumerable: true,
      get: function() {
        return _index4.KnownFragmentNamesRule;
      }
    });
    Object.defineProperty(exports, "KnownTypeNamesRule", {
      enumerable: true,
      get: function() {
        return _index4.KnownTypeNamesRule;
      }
    });
    Object.defineProperty(exports, "Lexer", {
      enumerable: true,
      get: function() {
        return _index2.Lexer;
      }
    });
    Object.defineProperty(exports, "Location", {
      enumerable: true,
      get: function() {
        return _index2.Location;
      }
    });
    Object.defineProperty(exports, "LoneAnonymousOperationRule", {
      enumerable: true,
      get: function() {
        return _index4.LoneAnonymousOperationRule;
      }
    });
    Object.defineProperty(exports, "LoneSchemaDefinitionRule", {
      enumerable: true,
      get: function() {
        return _index4.LoneSchemaDefinitionRule;
      }
    });
    Object.defineProperty(exports, "MaxIntrospectionDepthRule", {
      enumerable: true,
      get: function() {
        return _index4.MaxIntrospectionDepthRule;
      }
    });
    Object.defineProperty(exports, "NoDeprecatedCustomRule", {
      enumerable: true,
      get: function() {
        return _index4.NoDeprecatedCustomRule;
      }
    });
    Object.defineProperty(exports, "NoFragmentCyclesRule", {
      enumerable: true,
      get: function() {
        return _index4.NoFragmentCyclesRule;
      }
    });
    Object.defineProperty(exports, "NoSchemaIntrospectionCustomRule", {
      enumerable: true,
      get: function() {
        return _index4.NoSchemaIntrospectionCustomRule;
      }
    });
    Object.defineProperty(exports, "NoUndefinedVariablesRule", {
      enumerable: true,
      get: function() {
        return _index4.NoUndefinedVariablesRule;
      }
    });
    Object.defineProperty(exports, "NoUnusedFragmentsRule", {
      enumerable: true,
      get: function() {
        return _index4.NoUnusedFragmentsRule;
      }
    });
    Object.defineProperty(exports, "NoUnusedVariablesRule", {
      enumerable: true,
      get: function() {
        return _index4.NoUnusedVariablesRule;
      }
    });
    Object.defineProperty(exports, "OperationTypeNode", {
      enumerable: true,
      get: function() {
        return _index2.OperationTypeNode;
      }
    });
    Object.defineProperty(exports, "OverlappingFieldsCanBeMergedRule", {
      enumerable: true,
      get: function() {
        return _index4.OverlappingFieldsCanBeMergedRule;
      }
    });
    Object.defineProperty(exports, "PossibleFragmentSpreadsRule", {
      enumerable: true,
      get: function() {
        return _index4.PossibleFragmentSpreadsRule;
      }
    });
    Object.defineProperty(exports, "PossibleTypeExtensionsRule", {
      enumerable: true,
      get: function() {
        return _index4.PossibleTypeExtensionsRule;
      }
    });
    Object.defineProperty(exports, "ProvidedRequiredArgumentsRule", {
      enumerable: true,
      get: function() {
        return _index4.ProvidedRequiredArgumentsRule;
      }
    });
    Object.defineProperty(exports, "ScalarLeafsRule", {
      enumerable: true,
      get: function() {
        return _index4.ScalarLeafsRule;
      }
    });
    Object.defineProperty(exports, "SchemaMetaFieldDef", {
      enumerable: true,
      get: function() {
        return _index.SchemaMetaFieldDef;
      }
    });
    Object.defineProperty(exports, "SingleFieldSubscriptionsRule", {
      enumerable: true,
      get: function() {
        return _index4.SingleFieldSubscriptionsRule;
      }
    });
    Object.defineProperty(exports, "Source", {
      enumerable: true,
      get: function() {
        return _index2.Source;
      }
    });
    Object.defineProperty(exports, "Token", {
      enumerable: true,
      get: function() {
        return _index2.Token;
      }
    });
    Object.defineProperty(exports, "TokenKind", {
      enumerable: true,
      get: function() {
        return _index2.TokenKind;
      }
    });
    Object.defineProperty(exports, "TypeInfo", {
      enumerable: true,
      get: function() {
        return _index6.TypeInfo;
      }
    });
    Object.defineProperty(exports, "TypeKind", {
      enumerable: true,
      get: function() {
        return _index.TypeKind;
      }
    });
    Object.defineProperty(exports, "TypeMetaFieldDef", {
      enumerable: true,
      get: function() {
        return _index.TypeMetaFieldDef;
      }
    });
    Object.defineProperty(exports, "TypeNameMetaFieldDef", {
      enumerable: true,
      get: function() {
        return _index.TypeNameMetaFieldDef;
      }
    });
    Object.defineProperty(exports, "UniqueArgumentDefinitionNamesRule", {
      enumerable: true,
      get: function() {
        return _index4.UniqueArgumentDefinitionNamesRule;
      }
    });
    Object.defineProperty(exports, "UniqueArgumentNamesRule", {
      enumerable: true,
      get: function() {
        return _index4.UniqueArgumentNamesRule;
      }
    });
    Object.defineProperty(exports, "UniqueDirectiveNamesRule", {
      enumerable: true,
      get: function() {
        return _index4.UniqueDirectiveNamesRule;
      }
    });
    Object.defineProperty(exports, "UniqueDirectivesPerLocationRule", {
      enumerable: true,
      get: function() {
        return _index4.UniqueDirectivesPerLocationRule;
      }
    });
    Object.defineProperty(exports, "UniqueEnumValueNamesRule", {
      enumerable: true,
      get: function() {
        return _index4.UniqueEnumValueNamesRule;
      }
    });
    Object.defineProperty(exports, "UniqueFieldDefinitionNamesRule", {
      enumerable: true,
      get: function() {
        return _index4.UniqueFieldDefinitionNamesRule;
      }
    });
    Object.defineProperty(exports, "UniqueFragmentNamesRule", {
      enumerable: true,
      get: function() {
        return _index4.UniqueFragmentNamesRule;
      }
    });
    Object.defineProperty(exports, "UniqueInputFieldNamesRule", {
      enumerable: true,
      get: function() {
        return _index4.UniqueInputFieldNamesRule;
      }
    });
    Object.defineProperty(exports, "UniqueOperationNamesRule", {
      enumerable: true,
      get: function() {
        return _index4.UniqueOperationNamesRule;
      }
    });
    Object.defineProperty(exports, "UniqueOperationTypesRule", {
      enumerable: true,
      get: function() {
        return _index4.UniqueOperationTypesRule;
      }
    });
    Object.defineProperty(exports, "UniqueTypeNamesRule", {
      enumerable: true,
      get: function() {
        return _index4.UniqueTypeNamesRule;
      }
    });
    Object.defineProperty(exports, "UniqueVariableNamesRule", {
      enumerable: true,
      get: function() {
        return _index4.UniqueVariableNamesRule;
      }
    });
    Object.defineProperty(exports, "ValidationContext", {
      enumerable: true,
      get: function() {
        return _index4.ValidationContext;
      }
    });
    Object.defineProperty(exports, "ValuesOfCorrectTypeRule", {
      enumerable: true,
      get: function() {
        return _index4.ValuesOfCorrectTypeRule;
      }
    });
    Object.defineProperty(exports, "VariablesAreInputTypesRule", {
      enumerable: true,
      get: function() {
        return _index4.VariablesAreInputTypesRule;
      }
    });
    Object.defineProperty(exports, "VariablesInAllowedPositionRule", {
      enumerable: true,
      get: function() {
        return _index4.VariablesInAllowedPositionRule;
      }
    });
    Object.defineProperty(exports, "__Directive", {
      enumerable: true,
      get: function() {
        return _index.__Directive;
      }
    });
    Object.defineProperty(exports, "__DirectiveLocation", {
      enumerable: true,
      get: function() {
        return _index.__DirectiveLocation;
      }
    });
    Object.defineProperty(exports, "__EnumValue", {
      enumerable: true,
      get: function() {
        return _index.__EnumValue;
      }
    });
    Object.defineProperty(exports, "__Field", {
      enumerable: true,
      get: function() {
        return _index.__Field;
      }
    });
    Object.defineProperty(exports, "__InputValue", {
      enumerable: true,
      get: function() {
        return _index.__InputValue;
      }
    });
    Object.defineProperty(exports, "__Schema", {
      enumerable: true,
      get: function() {
        return _index.__Schema;
      }
    });
    Object.defineProperty(exports, "__Type", {
      enumerable: true,
      get: function() {
        return _index.__Type;
      }
    });
    Object.defineProperty(exports, "__TypeKind", {
      enumerable: true,
      get: function() {
        return _index.__TypeKind;
      }
    });
    Object.defineProperty(exports, "assertAbstractType", {
      enumerable: true,
      get: function() {
        return _index.assertAbstractType;
      }
    });
    Object.defineProperty(exports, "assertCompositeType", {
      enumerable: true,
      get: function() {
        return _index.assertCompositeType;
      }
    });
    Object.defineProperty(exports, "assertDirective", {
      enumerable: true,
      get: function() {
        return _index.assertDirective;
      }
    });
    Object.defineProperty(exports, "assertEnumType", {
      enumerable: true,
      get: function() {
        return _index.assertEnumType;
      }
    });
    Object.defineProperty(exports, "assertEnumValueName", {
      enumerable: true,
      get: function() {
        return _index.assertEnumValueName;
      }
    });
    Object.defineProperty(exports, "assertInputObjectType", {
      enumerable: true,
      get: function() {
        return _index.assertInputObjectType;
      }
    });
    Object.defineProperty(exports, "assertInputType", {
      enumerable: true,
      get: function() {
        return _index.assertInputType;
      }
    });
    Object.defineProperty(exports, "assertInterfaceType", {
      enumerable: true,
      get: function() {
        return _index.assertInterfaceType;
      }
    });
    Object.defineProperty(exports, "assertLeafType", {
      enumerable: true,
      get: function() {
        return _index.assertLeafType;
      }
    });
    Object.defineProperty(exports, "assertListType", {
      enumerable: true,
      get: function() {
        return _index.assertListType;
      }
    });
    Object.defineProperty(exports, "assertName", {
      enumerable: true,
      get: function() {
        return _index.assertName;
      }
    });
    Object.defineProperty(exports, "assertNamedType", {
      enumerable: true,
      get: function() {
        return _index.assertNamedType;
      }
    });
    Object.defineProperty(exports, "assertNonNullType", {
      enumerable: true,
      get: function() {
        return _index.assertNonNullType;
      }
    });
    Object.defineProperty(exports, "assertNullableType", {
      enumerable: true,
      get: function() {
        return _index.assertNullableType;
      }
    });
    Object.defineProperty(exports, "assertObjectType", {
      enumerable: true,
      get: function() {
        return _index.assertObjectType;
      }
    });
    Object.defineProperty(exports, "assertOutputType", {
      enumerable: true,
      get: function() {
        return _index.assertOutputType;
      }
    });
    Object.defineProperty(exports, "assertScalarType", {
      enumerable: true,
      get: function() {
        return _index.assertScalarType;
      }
    });
    Object.defineProperty(exports, "assertSchema", {
      enumerable: true,
      get: function() {
        return _index.assertSchema;
      }
    });
    Object.defineProperty(exports, "assertType", {
      enumerable: true,
      get: function() {
        return _index.assertType;
      }
    });
    Object.defineProperty(exports, "assertUnionType", {
      enumerable: true,
      get: function() {
        return _index.assertUnionType;
      }
    });
    Object.defineProperty(exports, "assertValidName", {
      enumerable: true,
      get: function() {
        return _index6.assertValidName;
      }
    });
    Object.defineProperty(exports, "assertValidSchema", {
      enumerable: true,
      get: function() {
        return _index.assertValidSchema;
      }
    });
    Object.defineProperty(exports, "assertWrappingType", {
      enumerable: true,
      get: function() {
        return _index.assertWrappingType;
      }
    });
    Object.defineProperty(exports, "astFromValue", {
      enumerable: true,
      get: function() {
        return _index6.astFromValue;
      }
    });
    Object.defineProperty(exports, "buildASTSchema", {
      enumerable: true,
      get: function() {
        return _index6.buildASTSchema;
      }
    });
    Object.defineProperty(exports, "buildClientSchema", {
      enumerable: true,
      get: function() {
        return _index6.buildClientSchema;
      }
    });
    Object.defineProperty(exports, "buildSchema", {
      enumerable: true,
      get: function() {
        return _index6.buildSchema;
      }
    });
    Object.defineProperty(exports, "coerceInputValue", {
      enumerable: true,
      get: function() {
        return _index6.coerceInputValue;
      }
    });
    Object.defineProperty(exports, "concatAST", {
      enumerable: true,
      get: function() {
        return _index6.concatAST;
      }
    });
    Object.defineProperty(exports, "createSourceEventStream", {
      enumerable: true,
      get: function() {
        return _index3.createSourceEventStream;
      }
    });
    Object.defineProperty(exports, "defaultFieldResolver", {
      enumerable: true,
      get: function() {
        return _index3.defaultFieldResolver;
      }
    });
    Object.defineProperty(exports, "defaultTypeResolver", {
      enumerable: true,
      get: function() {
        return _index3.defaultTypeResolver;
      }
    });
    Object.defineProperty(exports, "doTypesOverlap", {
      enumerable: true,
      get: function() {
        return _index6.doTypesOverlap;
      }
    });
    Object.defineProperty(exports, "execute", {
      enumerable: true,
      get: function() {
        return _index3.execute;
      }
    });
    Object.defineProperty(exports, "executeSync", {
      enumerable: true,
      get: function() {
        return _index3.executeSync;
      }
    });
    Object.defineProperty(exports, "extendSchema", {
      enumerable: true,
      get: function() {
        return _index6.extendSchema;
      }
    });
    Object.defineProperty(exports, "findBreakingChanges", {
      enumerable: true,
      get: function() {
        return _index6.findBreakingChanges;
      }
    });
    Object.defineProperty(exports, "findDangerousChanges", {
      enumerable: true,
      get: function() {
        return _index6.findDangerousChanges;
      }
    });
    Object.defineProperty(exports, "formatError", {
      enumerable: true,
      get: function() {
        return _index5.formatError;
      }
    });
    Object.defineProperty(exports, "getArgumentValues", {
      enumerable: true,
      get: function() {
        return _index3.getArgumentValues;
      }
    });
    Object.defineProperty(exports, "getDirectiveValues", {
      enumerable: true,
      get: function() {
        return _index3.getDirectiveValues;
      }
    });
    Object.defineProperty(exports, "getEnterLeaveForKind", {
      enumerable: true,
      get: function() {
        return _index2.getEnterLeaveForKind;
      }
    });
    Object.defineProperty(exports, "getIntrospectionQuery", {
      enumerable: true,
      get: function() {
        return _index6.getIntrospectionQuery;
      }
    });
    Object.defineProperty(exports, "getLocation", {
      enumerable: true,
      get: function() {
        return _index2.getLocation;
      }
    });
    Object.defineProperty(exports, "getNamedType", {
      enumerable: true,
      get: function() {
        return _index.getNamedType;
      }
    });
    Object.defineProperty(exports, "getNullableType", {
      enumerable: true,
      get: function() {
        return _index.getNullableType;
      }
    });
    Object.defineProperty(exports, "getOperationAST", {
      enumerable: true,
      get: function() {
        return _index6.getOperationAST;
      }
    });
    Object.defineProperty(exports, "getOperationRootType", {
      enumerable: true,
      get: function() {
        return _index6.getOperationRootType;
      }
    });
    Object.defineProperty(exports, "getVariableValues", {
      enumerable: true,
      get: function() {
        return _index3.getVariableValues;
      }
    });
    Object.defineProperty(exports, "getVisitFn", {
      enumerable: true,
      get: function() {
        return _index2.getVisitFn;
      }
    });
    Object.defineProperty(exports, "graphql", {
      enumerable: true,
      get: function() {
        return _graphql.graphql;
      }
    });
    Object.defineProperty(exports, "graphqlSync", {
      enumerable: true,
      get: function() {
        return _graphql.graphqlSync;
      }
    });
    Object.defineProperty(exports, "introspectionFromSchema", {
      enumerable: true,
      get: function() {
        return _index6.introspectionFromSchema;
      }
    });
    Object.defineProperty(exports, "introspectionTypes", {
      enumerable: true,
      get: function() {
        return _index.introspectionTypes;
      }
    });
    Object.defineProperty(exports, "isAbstractType", {
      enumerable: true,
      get: function() {
        return _index.isAbstractType;
      }
    });
    Object.defineProperty(exports, "isCompositeType", {
      enumerable: true,
      get: function() {
        return _index.isCompositeType;
      }
    });
    Object.defineProperty(exports, "isConstValueNode", {
      enumerable: true,
      get: function() {
        return _index2.isConstValueNode;
      }
    });
    Object.defineProperty(exports, "isDefinitionNode", {
      enumerable: true,
      get: function() {
        return _index2.isDefinitionNode;
      }
    });
    Object.defineProperty(exports, "isDirective", {
      enumerable: true,
      get: function() {
        return _index.isDirective;
      }
    });
    Object.defineProperty(exports, "isEnumType", {
      enumerable: true,
      get: function() {
        return _index.isEnumType;
      }
    });
    Object.defineProperty(exports, "isEqualType", {
      enumerable: true,
      get: function() {
        return _index6.isEqualType;
      }
    });
    Object.defineProperty(exports, "isExecutableDefinitionNode", {
      enumerable: true,
      get: function() {
        return _index2.isExecutableDefinitionNode;
      }
    });
    Object.defineProperty(exports, "isInputObjectType", {
      enumerable: true,
      get: function() {
        return _index.isInputObjectType;
      }
    });
    Object.defineProperty(exports, "isInputType", {
      enumerable: true,
      get: function() {
        return _index.isInputType;
      }
    });
    Object.defineProperty(exports, "isInterfaceType", {
      enumerable: true,
      get: function() {
        return _index.isInterfaceType;
      }
    });
    Object.defineProperty(exports, "isIntrospectionType", {
      enumerable: true,
      get: function() {
        return _index.isIntrospectionType;
      }
    });
    Object.defineProperty(exports, "isLeafType", {
      enumerable: true,
      get: function() {
        return _index.isLeafType;
      }
    });
    Object.defineProperty(exports, "isListType", {
      enumerable: true,
      get: function() {
        return _index.isListType;
      }
    });
    Object.defineProperty(exports, "isNamedType", {
      enumerable: true,
      get: function() {
        return _index.isNamedType;
      }
    });
    Object.defineProperty(exports, "isNonNullType", {
      enumerable: true,
      get: function() {
        return _index.isNonNullType;
      }
    });
    Object.defineProperty(exports, "isNullableType", {
      enumerable: true,
      get: function() {
        return _index.isNullableType;
      }
    });
    Object.defineProperty(exports, "isObjectType", {
      enumerable: true,
      get: function() {
        return _index.isObjectType;
      }
    });
    Object.defineProperty(exports, "isOutputType", {
      enumerable: true,
      get: function() {
        return _index.isOutputType;
      }
    });
    Object.defineProperty(exports, "isRequiredArgument", {
      enumerable: true,
      get: function() {
        return _index.isRequiredArgument;
      }
    });
    Object.defineProperty(exports, "isRequiredInputField", {
      enumerable: true,
      get: function() {
        return _index.isRequiredInputField;
      }
    });
    Object.defineProperty(exports, "isScalarType", {
      enumerable: true,
      get: function() {
        return _index.isScalarType;
      }
    });
    Object.defineProperty(exports, "isSchema", {
      enumerable: true,
      get: function() {
        return _index.isSchema;
      }
    });
    Object.defineProperty(exports, "isSchemaCoordinateNode", {
      enumerable: true,
      get: function() {
        return _index2.isSchemaCoordinateNode;
      }
    });
    Object.defineProperty(exports, "isSelectionNode", {
      enumerable: true,
      get: function() {
        return _index2.isSelectionNode;
      }
    });
    Object.defineProperty(exports, "isSpecifiedDirective", {
      enumerable: true,
      get: function() {
        return _index.isSpecifiedDirective;
      }
    });
    Object.defineProperty(exports, "isSpecifiedScalarType", {
      enumerable: true,
      get: function() {
        return _index.isSpecifiedScalarType;
      }
    });
    Object.defineProperty(exports, "isType", {
      enumerable: true,
      get: function() {
        return _index.isType;
      }
    });
    Object.defineProperty(exports, "isTypeDefinitionNode", {
      enumerable: true,
      get: function() {
        return _index2.isTypeDefinitionNode;
      }
    });
    Object.defineProperty(exports, "isTypeExtensionNode", {
      enumerable: true,
      get: function() {
        return _index2.isTypeExtensionNode;
      }
    });
    Object.defineProperty(exports, "isTypeNode", {
      enumerable: true,
      get: function() {
        return _index2.isTypeNode;
      }
    });
    Object.defineProperty(exports, "isTypeSubTypeOf", {
      enumerable: true,
      get: function() {
        return _index6.isTypeSubTypeOf;
      }
    });
    Object.defineProperty(exports, "isTypeSystemDefinitionNode", {
      enumerable: true,
      get: function() {
        return _index2.isTypeSystemDefinitionNode;
      }
    });
    Object.defineProperty(exports, "isTypeSystemExtensionNode", {
      enumerable: true,
      get: function() {
        return _index2.isTypeSystemExtensionNode;
      }
    });
    Object.defineProperty(exports, "isUnionType", {
      enumerable: true,
      get: function() {
        return _index.isUnionType;
      }
    });
    Object.defineProperty(exports, "isValidNameError", {
      enumerable: true,
      get: function() {
        return _index6.isValidNameError;
      }
    });
    Object.defineProperty(exports, "isValueNode", {
      enumerable: true,
      get: function() {
        return _index2.isValueNode;
      }
    });
    Object.defineProperty(exports, "isWrappingType", {
      enumerable: true,
      get: function() {
        return _index.isWrappingType;
      }
    });
    Object.defineProperty(exports, "lexicographicSortSchema", {
      enumerable: true,
      get: function() {
        return _index6.lexicographicSortSchema;
      }
    });
    Object.defineProperty(exports, "locatedError", {
      enumerable: true,
      get: function() {
        return _index5.locatedError;
      }
    });
    Object.defineProperty(exports, "parse", {
      enumerable: true,
      get: function() {
        return _index2.parse;
      }
    });
    Object.defineProperty(exports, "parseConstValue", {
      enumerable: true,
      get: function() {
        return _index2.parseConstValue;
      }
    });
    Object.defineProperty(exports, "parseSchemaCoordinate", {
      enumerable: true,
      get: function() {
        return _index2.parseSchemaCoordinate;
      }
    });
    Object.defineProperty(exports, "parseType", {
      enumerable: true,
      get: function() {
        return _index2.parseType;
      }
    });
    Object.defineProperty(exports, "parseValue", {
      enumerable: true,
      get: function() {
        return _index2.parseValue;
      }
    });
    Object.defineProperty(exports, "print", {
      enumerable: true,
      get: function() {
        return _index2.print;
      }
    });
    Object.defineProperty(exports, "printError", {
      enumerable: true,
      get: function() {
        return _index5.printError;
      }
    });
    Object.defineProperty(exports, "printIntrospectionSchema", {
      enumerable: true,
      get: function() {
        return _index6.printIntrospectionSchema;
      }
    });
    Object.defineProperty(exports, "printLocation", {
      enumerable: true,
      get: function() {
        return _index2.printLocation;
      }
    });
    Object.defineProperty(exports, "printSchema", {
      enumerable: true,
      get: function() {
        return _index6.printSchema;
      }
    });
    Object.defineProperty(exports, "printSourceLocation", {
      enumerable: true,
      get: function() {
        return _index2.printSourceLocation;
      }
    });
    Object.defineProperty(exports, "printType", {
      enumerable: true,
      get: function() {
        return _index6.printType;
      }
    });
    Object.defineProperty(exports, "recommendedRules", {
      enumerable: true,
      get: function() {
        return _index4.recommendedRules;
      }
    });
    Object.defineProperty(exports, "resolveASTSchemaCoordinate", {
      enumerable: true,
      get: function() {
        return _index6.resolveASTSchemaCoordinate;
      }
    });
    Object.defineProperty(exports, "resolveObjMapThunk", {
      enumerable: true,
      get: function() {
        return _index.resolveObjMapThunk;
      }
    });
    Object.defineProperty(exports, "resolveReadonlyArrayThunk", {
      enumerable: true,
      get: function() {
        return _index.resolveReadonlyArrayThunk;
      }
    });
    Object.defineProperty(exports, "resolveSchemaCoordinate", {
      enumerable: true,
      get: function() {
        return _index6.resolveSchemaCoordinate;
      }
    });
    Object.defineProperty(exports, "responsePathAsArray", {
      enumerable: true,
      get: function() {
        return _index3.responsePathAsArray;
      }
    });
    Object.defineProperty(exports, "separateOperations", {
      enumerable: true,
      get: function() {
        return _index6.separateOperations;
      }
    });
    Object.defineProperty(exports, "specifiedDirectives", {
      enumerable: true,
      get: function() {
        return _index.specifiedDirectives;
      }
    });
    Object.defineProperty(exports, "specifiedRules", {
      enumerable: true,
      get: function() {
        return _index4.specifiedRules;
      }
    });
    Object.defineProperty(exports, "specifiedScalarTypes", {
      enumerable: true,
      get: function() {
        return _index.specifiedScalarTypes;
      }
    });
    Object.defineProperty(exports, "stripIgnoredCharacters", {
      enumerable: true,
      get: function() {
        return _index6.stripIgnoredCharacters;
      }
    });
    Object.defineProperty(exports, "subscribe", {
      enumerable: true,
      get: function() {
        return _index3.subscribe;
      }
    });
    Object.defineProperty(exports, "syntaxError", {
      enumerable: true,
      get: function() {
        return _index5.syntaxError;
      }
    });
    Object.defineProperty(exports, "typeFromAST", {
      enumerable: true,
      get: function() {
        return _index6.typeFromAST;
      }
    });
    Object.defineProperty(exports, "validate", {
      enumerable: true,
      get: function() {
        return _index4.validate;
      }
    });
    Object.defineProperty(exports, "validateSchema", {
      enumerable: true,
      get: function() {
        return _index.validateSchema;
      }
    });
    Object.defineProperty(exports, "valueFromAST", {
      enumerable: true,
      get: function() {
        return _index6.valueFromAST;
      }
    });
    Object.defineProperty(exports, "valueFromASTUntyped", {
      enumerable: true,
      get: function() {
        return _index6.valueFromASTUntyped;
      }
    });
    Object.defineProperty(exports, "version", {
      enumerable: true,
      get: function() {
        return _version.version;
      }
    });
    Object.defineProperty(exports, "versionInfo", {
      enumerable: true,
      get: function() {
        return _version.versionInfo;
      }
    });
    Object.defineProperty(exports, "visit", {
      enumerable: true,
      get: function() {
        return _index2.visit;
      }
    });
    Object.defineProperty(exports, "visitInParallel", {
      enumerable: true,
      get: function() {
        return _index2.visitInParallel;
      }
    });
    Object.defineProperty(exports, "visitWithTypeInfo", {
      enumerable: true,
      get: function() {
        return _index6.visitWithTypeInfo;
      }
    });
    var _version = require_version();
    var _graphql = require_graphql();
    var _index = require_type();
    var _index2 = require_language();
    var _index3 = require_execution();
    var _index4 = require_validation();
    var _index5 = require_error();
    var _index6 = require_utilities();
  }
});

// src/skills/exo-content-bindings/commands/discover.mjs
var discover_exports = {};
__export(discover_exports, {
  run: () => run,
  usage: () => usage
});
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// src/skills/exo-content-bindings/lib/client.mjs
import { readFileSync, appendFileSync as appendFileSync2 } from "node:fs";

// src/skills/exo-content-bindings/lib/schema.mjs
var import_graphql = __toESM(require_graphql2(), 1);
import { appendFileSync } from "node:fs";
var CONTENT_SOURCE = "crn:contentful:::content:spaces/$self/environments/$self";
var typeLink = (id) => ({ sys: { type: "ResourceLink", linkType: "Contentful:ContentType", urn: `${CONTENT_SOURCE}/contentTypes/${id}` } });
var ASSET_LINK = { sys: { type: "ResourceLink", linkType: "Contentful:Asset", urn: `${CONTENT_SOURCE}/assets` } };
var entryRef = (id) => {
  const ref = typeLink(id);
  return { type: "TypeRef", ref, source: ref.sys.urn };
};
var SKIP = /* @__PURE__ */ new Set(["node-interface-field", "metadata", "linked-from-namespace", "linked-from-collections", "sys-field"]);
var LIST_ANY = /* @__PURE__ */ new Set(["nested-collection", "nested-cursor-collection"]);
var LIST_ALLOWED = /* @__PURE__ */ new Set(["nested-collection-with-content-types", "nested-cursor-collection-with-content-types"]);
var CURSOR = /* @__PURE__ */ new Set(["nested-cursor-collection", "nested-cursor-collection-with-content-types"]);
var CARRIES_REQUIRED = /* @__PURE__ */ new Set(["primitive-field", "rich-text", "entry-link-field", "asset-link-field", ...LIST_ANY, ...LIST_ALLOWED]);
var SCALARS = { String: "String", DateTime: "DateTime", Int: "Integer", Float: "Number", Boolean: "Boolean", JSON: "JSON" };
function fieldResolver(node2) {
  const d = node2?.directives?.find((x) => x.name.value === "fieldResolver");
  if (!d?.arguments) return null;
  let kind, data;
  for (const a of d.arguments) {
    if (a.name.value === "kind" && a.value.kind === import_graphql.Kind.STRING) kind = a.value.value;
    else if (a.name.value === "data" && a.value.kind === import_graphql.Kind.OBJECT) data = (0, import_graphql.valueFromASTUntyped)(a.value);
  }
  return kind == null ? null : { kind, data: data || {} };
}
var typeIdentifier = (type) => {
  const a = type.astNode?.directives?.find((d) => d.name.value === "typeIdentifier")?.arguments?.find((x) => x.name.value === "contentTypeId");
  return a?.value.kind === import_graphql.Kind.STRING ? a.value.value : void 0;
};
var hasList = (t) => (0, import_graphql.isNonNullType)(t) ? hasList(t.ofType) : (0, import_graphql.isListType)(t);
async function fetchSdl({ token, spaceId, environmentId, baseUrl }, logPath) {
  const t0 = Date.now();
  const url = `${baseUrl}/spaces/${encodeURIComponent(spaceId)}/environments/${encodeURIComponent(environmentId)}/graphql_schema`;
  let res;
  for (let attempt = 0; ; attempt++) {
    res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status !== 429 || attempt >= 5) break;
    await new Promise((r) => setTimeout(r, Math.max(Number(res.headers.get("x-contentful-ratelimit-reset")) || 0, 2 ** attempt) * 1e3 + Math.random() * 500));
  }
  if (logPath) appendFileSync(logPath, JSON.stringify({ ts: (/* @__PURE__ */ new Date()).toISOString(), method: "GET", path: "/graphql_schema", status: res.status, ms: Date.now() - t0 }) + "\n");
  if (res.status === 401 || res.status === 403) throw new Error(`HTTP ${res.status} reading the GraphQL schema: check the management token and its access to this space.`);
  if (res.status === 404) throw new Error("GraphQL schema not found (404): check the space and environment ids.");
  if (!res.ok) throw new Error(`HTTP ${res.status} reading the GraphQL schema from ${url.split("?")[0]}`);
  return res.text();
}
async function loadSchema(creds, logPath) {
  return schemaFromSdl(await fetchSdl(creds, logPath));
}
function schemaFromSdl(sdl) {
  const gql = (0, import_graphql.buildASTSchema)((0, import_graphql.parse)(sdl));
  const types = Object.values(gql.getTypeMap());
  const entryInterface = gql.getType("Entry");
  const entryNames = new Set((0, import_graphql.isInterfaceType)(entryInterface) ? gql.getPossibleTypes(entryInterface).map((t) => t.name) : []);
  const delegated = /* @__PURE__ */ new Set();
  const resourceLink = gql.getType("ResourceLink");
  if ((0, import_graphql.isInterfaceType)(resourceLink)) for (const t of gql.getPossibleTypes(resourceLink)) {
    const node2 = t.getFields().node && (0, import_graphql.getNamedType)(t.getFields().node.type);
    if ((0, import_graphql.isUnionType)(node2)) for (const m of node2.getTypes()) delegated.add(m.name);
  }
  const idToName = /* @__PURE__ */ new Map(), nameToId = /* @__PURE__ */ new Map();
  for (const t of types) {
    if (!(0, import_graphql.isObjectType)(t) || delegated.has(t.name)) continue;
    const id = typeIdentifier(t);
    if (id === void 0) continue;
    idToName.set(id, t.name);
    nameToId.set(t.name, id);
  }
  const proxies = /* @__PURE__ */ new Map();
  for (const name2 of entryNames) for (const f of Object.values(gql.getType(name2).getFields())) {
    const r = fieldResolver(f.astNode);
    if (!r || !LIST_ALLOWED.has(r.kind)) continue;
    const members = [...new Set((Array.isArray(r.data.proxiedContentTypesIds) ? r.data.proxiedContentTypesIds : []).filter((x) => typeof x === "string"))];
    if (typeof r.data.creatingContentTypeId === "string" && members.length) proxies.set(r.data.creatingContentTypeId, members);
  }
  const expand = (ids) => {
    const out = [];
    for (const id of ids) for (const m of proxies.get(id) || [id]) if (!out.includes(m)) out.push(m);
    return out;
  };
  const roots = [];
  for (const f of Object.values(gql.getQueryType()?.getFields() || {})) {
    const r = fieldResolver(f.astNode);
    const name2 = (0, import_graphql.getNamedType)(f.type).name;
    if (r?.kind === "entry" && nameToId.has(name2)) {
      const ref = typeLink(nameToId.get(name2));
      roots.push({ name: name2, type: "TypeRef", ref, source: ref.sys.urn });
    } else if (r?.kind === "asset") roots.push({ name: name2, type: "TypeRef", ref: ASSET_LINK });
  }
  const unsupported = [];
  function required(r) {
    if (r.kind === "asset-url") return true;
    if (r.kind === "asset-subfield") return r.data.subfieldName === "assetFileName";
    if (!CARRIES_REQUIRED.has(r.kind)) return false;
    if (r.kind === "primitive-field" && !r.data.contentTypeId) return r.data.id === "title";
    return r.data.required === true;
  }
  function describe(name2, f, r, ownerName) {
    if (SKIP.has(r.kind)) return null;
    if (r.kind === "asset-subfield" && (!r.data.subfieldName || r.data.subfieldName === "assetContentType")) return null;
    if (r.kind.startsWith("resource-link")) {
      unsupported.push({ type: ownerName, field: name2, reason: "references another space or an external resource" });
      return null;
    }
    const named = (0, import_graphql.getNamedType)(f.type), list2 = hasList(f.type), req = required(r);
    const withReq = (item) => req ? { ...item, required: true } : item;
    if (named.name === "Asset" || entryNames.has(named.name)) {
      const item = named.name === "Asset" ? { type: "TypeRef", ref: ASSET_LINK } : nameToId.has(named.name) ? entryRef(nameToId.get(named.name)) : null;
      if (!item) return null;
      return list2 ? { id: name2, name: name2, type: "Array", items: withReq(item), required: req } : { id: name2, name: name2, type: "TypeRef", ref: item.ref, ...item.source && { source: item.source }, required: req };
    }
    const many = LIST_ANY.has(r.kind) || LIST_ALLOWED.has(r.kind);
    const target = many && (0, import_graphql.isObjectType)(named) && named.getFields().items ? (0, import_graphql.getNamedType)(named.getFields().items.type) : named;
    let declared = [];
    if (LIST_ALLOWED.has(r.kind)) {
      const p = r.data.proxiedContentTypesIds;
      declared = Array.isArray(p) && p.length ? p.filter((x) => typeof x === "string") : [r.data.creatingContentTypeId];
    } else if (r.kind === "entry-link-field" && typeof r.data.contentTypeId === "string") declared = [r.data.contentTypeId];
    const open = !declared.length && !(0, import_graphql.isUnionType)(named) && (r.kind === "entry-link-field" && named.name === "Entry" || many);
    const ids = expand(declared.length ? declared : (0, import_graphql.isUnionType)(named) ? named.getTypes().filter((m) => entryNames.has(m.name)).map((m) => nameToId.get(m.name)).filter((x) => x !== void 0) : open ? [...entryNames].map((n) => nameToId.get(n)).filter((x) => x !== void 0) : []).filter((id) => idToName.has(id));
    if (ids.length) {
      const shape = ids.length === 1 ? entryRef(ids[0]) : { type: "DiscriminatedUnion", discriminator: "urn", members: ids.map(entryRef) };
      const apiName = name2.replace(/CursorCollection$|Collection$/, "");
      const extra = { ...open && { isOpenEnded: true }, ...((0, import_graphql.isUnionType)(target) || (0, import_graphql.isInterfaceType)(target)) && { branch: true } };
      if (many) return { id: name2, name: apiName, type: "Array", items: withReq(shape), required: req, ...extra };
      if (shape.type === "TypeRef") return { id: name2, name: apiName, type: "TypeRef", ref: shape.ref, source: shape.source, required: req, ...extra };
      return { id: name2, name: apiName, type: "DiscriminatedUnion", discriminator: "urn", members: shape.members, required: req, ...extra };
    }
    if (r.kind === "rich-text") return { id: name2, name: name2, type: "RichText", required: req };
    if (r.kind !== "primitive-field" && r.kind !== "asset-url" && r.kind !== "asset-subfield") return null;
    const leaf = SCALARS[named.name];
    if (!leaf) return null;
    return list2 ? { id: name2, name: name2, type: "Array", items: withReq({ type: leaf }), required: req } : { id: name2, name: name2, type: leaf, required: req };
  }
  const cache = /* @__PURE__ */ new Map();
  function getFields(ref) {
    const urn = ref?.sys?.urn;
    if (cache.has(urn)) return cache.get(urn);
    const isAsset = ref?.sys?.linkType === "Contentful:Asset";
    const contentTypeId = isAsset ? null : urn?.startsWith(`${CONTENT_SOURCE}/contentTypes/`) ? urn.split("/").pop() : void 0;
    const type = isAsset ? gql.getType("Asset") : gql.getType(idToName.get(contentTypeId));
    if (!(0, import_graphql.isObjectType)(type) || !isAsset && !entryNames.has(type.name)) throw new Error(`"${urn}" is not a content type or the asset type of this environment.`);
    const out = {}, seen = /* @__PURE__ */ new Map();
    for (const [name2, f] of Object.entries(type.getFields())) {
      const r = fieldResolver(f.astNode);
      if (!r) continue;
      const owner = r.data.parentContentTypeId ?? r.data.contentTypeId;
      if (contentTypeId !== null && typeof owner === "string" && owner !== contentTypeId) continue;
      const mapped = describe(name2, f, r, type.name);
      if (!mapped) continue;
      const cmsId = r.kind === "asset-url" || r.kind === "asset-subfield" ? name2 : r.data.fieldId ?? r.data.id;
      if (typeof cmsId !== "string") continue;
      const cursor = CURSOR.has(r.kind), prev = seen.get(cmsId);
      if (prev) {
        if (prev.cursor || !cursor) continue;
        delete out[prev.name];
      }
      seen.set(cmsId, { name: name2, cursor });
      out[name2] = { ...mapped, fieldId: cmsId, ...contentTypeId !== null && { contentTypeId } };
    }
    cache.set(urn, out);
    return out;
  }
  const rootByName = Object.fromEntries(roots.map((r) => [r.name, r]));
  const rootById = Object.fromEntries(roots.filter((r) => r.source).map((r) => [r.ref.sys.urn.split("/").pop(), r]));
  return { gql, roots, rootByName, rootById, assetRoot: roots.find((r) => r.ref.sys.linkType === "Contentful:Asset") || null, idToName, nameToId, getFields, unsupported };
}

// src/skills/exo-content-bindings/lib/recipe.mjs
var import_graphql2 = __toESM(require_graphql2(), 1);
var isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
var OPS = ["$from", "$on", "$literal", "$object"];
var isOp = (v) => isObj(v) && OPS.some((o) => o in v);
var listParams = (p) => Array.isArray(p) ? p : Object.entries(p || {}).map(([id, x]) => ({ id, ...x }));
var COLLECTION_ROOT = /^[a-z][A-Za-z0-9_]*?CursorCollection$/;
var isCollectionName = (n) => /CursorCollection$|Collection$/.test(n);
var collectionField = (typeName) => typeName.charAt(0).toLowerCase() + typeName.slice(1) + "CursorCollection";
var typeOfCollectionField = (f) => {
  const m = f.match(/^([a-z][A-Za-z0-9_]*?)CursorCollection$/);
  return m ? m[1].charAt(0).toUpperCase() + m[1].slice(1) : null;
};
var daIdOf = (link) => link?.sys?.urn?.split("/").pop() ?? null;
var canonical = (v) => JSON.stringify(v ?? null, (k, x) => isObj(x) ? Object.fromEntries(Object.entries(x).sort()) : x);
var squash = (q) => (q || "").replace(/\s+/g, " ").trim();
function compileCollection(name2, config) {
  const order = config.order || [];
  if (order.some((o) => typeof o !== "string")) throw new Error(`collection "${name2}": order must be a list of GraphQL order values such as "sys_publishedAt_DESC"`);
  if (config.limit !== void 0 && !(Number.isInteger(config.limit) && config.limit > 0)) throw new Error(`collection "${name2}": limit must be a positive whole number`);
  const args = [config.limit !== void 0 ? "limit: $limit" : null, order.length ? `order: [${order.join(", ")}]` : null].filter(Boolean);
  const query = (0, import_graphql2.print)((0, import_graphql2.parse)(`query ${config.limit !== void 0 ? "($limit: Int!) " : ""}{ ${collectionField(config.contentTypeName)}${args.length ? `(${args.join(", ")})` : ""} { items { __typename } } }`));
  const hasLimit = config.limit !== void 0;
  return {
    resolverType: "graphql",
    kind: "collection",
    query,
    parameters: hasLimit ? { limit: `$parameters/${name2}/limit` } : {},
    contentTypeName: config.contentTypeName,
    parameterDefinition: hasLimit ? { type: "Record", locked: config.locked ?? true, fields: [{ type: "Number", id: "limit", fallbackValue: config.limit }] } : void 0
  };
}
var node = () => ({ f: /* @__PURE__ */ new Map(), on: /* @__PURE__ */ new Map() });
var child = (n, name2) => {
  if (!n.f.has(name2)) n.f.set(name2, node());
  return n.f.get(name2);
};
var arm = (n, type) => {
  if (!n.on.has(type)) n.on.set(type, node());
  return n.on.get(type);
};
var descend = (n, path) => {
  for (const s of path) n = child(n, s);
  return n;
};
var segs = (p) => String(p).split("/").filter(Boolean);
function merge(into, from) {
  for (const [k, v] of from.f) merge(child(into, k), v);
  for (const [k, v] of from.on) merge(arm(into, k), v);
}
function addSelect(n, sel, where) {
  if (typeof sel === "string") {
    descend(n, segs(sel));
    return;
  }
  if (!isObj(sel)) throw new Error(`${where}: a selection must be a field path, a map of them, $on or $from`);
  if ("$literal" in sel) return;
  if ("$object" in sel) throw new Error(`${where}: $object is not supported; write the object shape directly`);
  if ("$on" in sel) {
    for (const [t, sub] of Object.entries(sel.$on?.type || {})) addSelect(arm(n, t), sub, where);
    return;
  }
  if ("$from" in sel) {
    const f = sel.$from;
    const source = typeof f === "string" ? f : f?.source;
    if (typeof source !== "string" || source.startsWith("$")) throw new Error(`${where}: inside a selection, $from.source is a field path relative to the entry being read`);
    const at = descend(n, segs(source));
    if (isObj(f) && f.select !== void 0) addSelect(at, f.select, where);
    return;
  }
  for (const v of Object.values(sel)) addSelect(n, v, where);
}
function printNode(n) {
  const parts = [];
  for (const name2 of [...n.f.keys()].sort()) {
    const c = n.f.get(name2);
    parts.push(c.f.size || c.on.size ? `${name2} { ${c.on.size ? "__typename " : ""}${printNode(c)} }` : name2);
  }
  for (const t of [...n.on.keys()].sort((a, b) => a.localeCompare(b))) parts.push(`... on ${t} { ${printNode(n.on.get(t))} }`);
  return parts.join(" ");
}
function withRichText(doc, gql) {
  const info = new import_graphql2.TypeInfo(gql);
  return (0, import_graphql2.visit)(doc, (0, import_graphql2.visitWithTypeInfo)(info, { Field(f) {
    if (f.selectionSet || fieldResolver(info.getFieldDef()?.astNode)?.kind !== "rich-text") return void 0;
    return { ...f, selectionSet: { kind: import_graphql2.Kind.SELECTION_SET, selections: [{ kind: import_graphql2.Kind.FIELD, alias: { kind: import_graphql2.Kind.NAME, value: "document" }, name: { kind: import_graphql2.Kind.NAME, value: "json" } }] } };
  } }));
}
function finishQuery(text, rid, gql) {
  const doc = withRichText((0, import_graphql2.parse)(text), gql);
  const problems = (0, import_graphql2.validate)(gql, doc);
  if (problems.length) {
    const msgs = [...new Set(problems.map((e) => e.message))];
    const hint = msgs.some((m) => /inline fragment|on type "\w+(Item|Collection)?"/.test(m) && /Cannot query field/.test(m)) ? " A reference the schema types as a union must be selected with $on { type: { <TypeName>: \u2026 } }, even when only one content type is allowed." : "";
    throw new Error(`the query for resolver "${rid}" does not fit this environment's schema: ${msgs.slice(0, 3).join(" | ")}.${hint}`);
  }
  return (0, import_graphql2.print)(doc);
}
function buildBody(interim, { schema, referenced = {} }) {
  const params = listParams(interim.parameters);
  const ids = /* @__PURE__ */ new Set();
  for (const p of params) {
    if (ids.has(p.id)) throw new Error(`duplicate parameter id "${p.id}"`);
    ids.add(p.id);
  }
  const parameters = params.map(({ id, required, ...p }) => {
    if (!("allowedTypes" in p)) return { id, required: required ?? true, ...p };
    const base = { id, required: required ?? true, name: p.name, ...p.description !== void 0 && { description: p.description } };
    if (p.type === "Contentful:Asset") return { ...base, type: "ResourceLink", allowedResources: [{ type: "Contentful:Asset", source: CONTENT_SOURCE }] };
    const allowedTypes = p.allowedTypes.map((t) => {
      const cid = schema.nameToId.get(t);
      if (cid === void 0) throw new Error(`parameter ${id}: "${t}" is not a content type in this environment`);
      return cid;
    });
    return { ...base, type: "ResourceLink", allowedResources: [{ type: "Contentful:Entry", source: p.source || CONTENT_SOURCE, allowedTypes }] };
  });
  const resolvers = interim.resolvers || {};
  const kindOf = (rid) => {
    const r = resolvers[rid];
    return !r ? null : r.resolverType === "dataAssembly" ? "nested" : r.kind === "collection" ? "collection" : r.resolverType === "graphql" ? "entry" : null;
  };
  const trees = new Map(Object.keys(resolvers).map((rid) => [rid, node()]));
  const splitPtr = (ptr, where) => {
    const [scope, rid, ...rest] = segs(ptr);
    if (scope !== "$resolvers" || !rid) throw new Error(`${where}: must start from a resolver ($resolvers/<name>\u2026)`);
    if (!kindOf(rid)) throw new Error(`${where}: unknown or unsupported resolver "${rid}"`);
    return { rid, rest };
  };
  const ret = {};
  for (const [key, v] of Object.entries(interim.return || {})) {
    const f = isObj(v) ? v.$from : void 0;
    if (typeof f === "string") {
      const { rid: rid2, rest: rest2 } = splitPtr(f, key);
      if (kindOf(rid2) !== "nested" || rest2.length) throw new Error(`${key}: { $from: "${f}" } takes a whole nested recipe; "${rid2}" ${kindOf(rid2) === "nested" ? "cannot be read field by field" : "is not one"}`);
      ret[key] = { $from: `$resolvers/${rid2}` };
      continue;
    }
    if (!isObj(f) || typeof f.source !== "string" || f.select === void 0) throw new Error(`${key}: write it as { $from: { source: "$resolvers/<name>\u2026", select } } or { $from: "$resolvers/<nested recipe>" }`);
    const { rid, rest } = splitPtr(f.source, key);
    if (kindOf(rid) === "nested") throw new Error(`${key}: a nested recipe is taken whole: { $from: "$resolvers/${rid}" }`);
    addSelect(descend(trees.get(rid), rest), f.select, key);
    ret[key] = { $from: { source: ["$resolvers", rid, ...kindOf(rid) === "entry" ? ["_node"] : [], ...rest].join("/"), select: f.select } };
  }
  const feeds = {};
  for (const [rid, r] of Object.entries(resolvers)) {
    if (kindOf(rid) !== "nested") continue;
    const childParams = listParams(referenced[daIdOf(r.dataAssembly)]?.parameters);
    const takesEntity = (name2) => {
      const d = childParams.find((p) => p.id === name2);
      return d?.type === "ResourceLink" && (d.allowedResources || []).some((a) => a.type === "Contentful:Entry" || a.type === "Contentful:Asset");
    };
    feeds[rid] = {};
    for (const [name2, b] of Object.entries(isObj(r.parameters) ? r.parameters : {})) {
      const where = `resolver ${rid}, parameter ${name2}`;
      if (typeof b === "string") {
        if (!b.startsWith("$")) throw new Error(`${where}: expected a pointer ($parameters/\u2026 or $resolvers/\u2026)`);
        feeds[rid][name2] = b;
        continue;
      }
      const f = isObj(b) ? b.$from : void 0;
      if (!isObj(f) || typeof f.source !== "string") throw new Error(`${where}: write it as "$parameters/<pick>" or { $from: { source: "$resolvers/<entry resolver>", select: "<reference field>" } }`);
      const { rid: src, rest } = splitPtr(f.source, where);
      if (kindOf(src) !== "entry") throw new Error(`${where}: can only be fed from an entry resolver`);
      const id = takesEntity(name2) ? ["_id"] : [];
      if (typeof f.select === "string" || f.select === void 0) {
        const path = [...rest, ...segs(f.select || ""), ...id];
        if (!path.length) throw new Error(`${where}: select the reference field to pass on`);
        descend(trees.get(src), path);
        feeds[rid][name2] = ["$resolvers", src, "_node", ...path].join("/");
      } else if (isObj(f.select) && isObj(f.select.$on?.type) && Object.values(f.select.$on.type).every((x) => typeof x === "string")) {
        const select = { $on: { type: Object.fromEntries(Object.entries(f.select.$on.type).map(([t, p]) => [t, [...segs(p), ...id].join("/")])) } };
        addSelect(descend(trees.get(src), rest), select, where);
        feeds[rid][name2] = { $from: { source: ["$resolvers", src, "_node", ...rest].join("/"), select } };
      } else throw new Error(`${where}: select must be a field path, or $on with one field path per content type`);
    }
  }
  const out = {};
  for (const [rid, r] of Object.entries(resolvers)) {
    const kind = kindOf(rid), tree = trees.get(rid);
    if (kind === "nested") {
      out[rid] = { source: "Contentful:DataAssembly", dataAssembly: r.dataAssembly, parameters: feeds[rid] };
      continue;
    }
    if (kind === "collection") {
      const doc = (0, import_graphql2.parse)(r.query);
      const root = doc.definitions[0]?.selectionSet.selections[0];
      const field = root?.name?.value;
      const items = tree.f.get(field)?.f.get("items");
      if ([...tree.f.keys()].some((k) => k !== field) || tree.on.size) throw new Error(`resolver ${rid}: a collection is read as $resolvers/${rid}/${field}/items`);
      const extra = items ? printNode(items) : "";
      out[rid] = { source: "Contentful:GraphQL", query: finishQuery((0, import_graphql2.print)(doc).replace(/items \{\s*__typename\s*\}/, `items { __typename ${extra} }`), rid, schema.gql), parameters: r.parameters || {} };
      continue;
    }
    if (kind !== "entry") throw new Error(`resolver ${rid}: describe it as an entry resolver, a nested recipe or the collection shorthand; hand-written queries are not accepted`);
    if (!tree.f.size && !tree.on.size) continue;
    if (!isObj(r.parameters) || !("id" in r.parameters)) throw new Error(`resolver ${rid}: parameters.id must point at the editor pick it reads ($parameters/<id>)`);
    if (tree.f.size) {
      const pick = params.find((p) => `$parameters/${p.id}` === r.parameters.id);
      if (pick?.allowedTypes?.length !== 1) throw new Error(`resolver ${rid}: its editor pick allows ${pick?.allowedTypes?.length ? "several content types" : "no known content type"}; select with $on { type: { <TypeName>: \u2026 } }`);
      const fields = node();
      fields.f = tree.f;
      tree.f = /* @__PURE__ */ new Map();
      merge(arm(tree, pick.allowedTypes[0]), fields);
    }
    out[rid] = { source: "Contentful:GraphQL", query: finishQuery(`query ($id: ID!) { _node(id: $id) { __typename ${printNode(tree)} } }`, rid, schema.gql), parameters: r.parameters };
  }
  return { metadata: interim.metadata ?? { tags: [] }, name: interim.name ?? "", description: interim.description ?? "", parameters, resolvers: out, return: ret };
}
function parseCollection(resolver, daParams) {
  const doc = (0, import_graphql2.parse)(resolver.query);
  const ops = doc.definitions.filter((d) => d.kind === import_graphql2.Kind.OPERATION_DEFINITION);
  const roots = ops.length === 1 ? ops[0].selectionSet.selections.filter((s) => s.kind === import_graphql2.Kind.FIELD) : [];
  if (roots.length !== 1 || !COLLECTION_ROOT.test(roots[0].name.value)) return null;
  const contentTypeName = typeOfCollectionField(roots[0].name.value);
  if (!contentTypeName) return null;
  const record = (variable) => {
    const b = isObj(resolver.parameters) ? resolver.parameters[variable] : void 0;
    const m = typeof b === "string" ? b.match(/^\$parameters\/([^/]+)\/([^/]+)$/) : null;
    if (!m || m[2] !== variable) return void 0;
    const def = listParams(daParams).find((p) => p.id === m[1]);
    return def?.type === "Record" ? def : void 0;
  };
  const config = { contentTypeName, field: roots[0].name.value };
  for (const a of roots[0].arguments || []) {
    if (a.name.value === "limit") {
      if (a.value.kind === import_graphql2.Kind.INT) {
        config.limit = parseInt(a.value.value, 10);
        continue;
      }
      if (a.value.kind !== import_graphql2.Kind.VARIABLE) return null;
      const v = a.value.name.value;
      const b = isObj(resolver.parameters) ? resolver.parameters[v] : void 0;
      if (typeof b === "string") {
        const fld = (record(v)?.fields || []).find((x) => x?.id === v);
        if (!fld) throw new Error(`limit is bound to ${b}, which is not a field of a Record parameter`);
        if (isObj(fld.validation) && typeof fld.validation.min === "number" && typeof fld.validation.max === "number") {
          config.limit = fld.validation.max;
          config.limitRange = fld.validation;
        } else if (Number.isInteger(fld.fallbackValue)) config.limit = fld.fallbackValue;
        else if (!Array.isArray(fld.fallbackValue)) throw new Error("limit has a non-integer fallback value");
        config.parameter = b.split("/")[1];
        continue;
      }
      if (isObj(b) && Number.isInteger(b.$literal)) {
        config.limit = b.$literal;
        config.literalLimit = true;
        continue;
      }
      return null;
    }
    if (a.name.value === "order") {
      if (a.value.kind === import_graphql2.Kind.VARIABLE) {
        const fld = (record(a.value.name.value)?.fields || []).find((x) => x?.id === a.value.name.value && x.type === "OrderExpression");
        if (!Array.isArray(fld?.fallbackValue)) return null;
        config.order = fld.fallbackValue;
        config.editableOrder = true;
        continue;
      }
      if (a.value.kind !== import_graphql2.Kind.LIST || a.value.values.some((x) => x.kind !== import_graphql2.Kind.ENUM)) return null;
      config.order = a.value.values.map((x) => x.value);
      continue;
    }
    return null;
  }
  const lim = record("limit");
  if (lim?.locked === false) config.locked = false;
  return config;
}
function isEntityQuery(doc) {
  const [d] = doc.definitions;
  if (doc.definitions.length !== 1 || d.kind !== import_graphql2.Kind.OPERATION_DEFINITION || d.operation !== "query" || d.variableDefinitions?.length !== 1 || d.selectionSet.selections.length !== 1) return false;
  const v = d.variableDefinitions[0];
  if (v.variable.name.value !== "id" || v.type.kind !== import_graphql2.Kind.NON_NULL_TYPE || v.type.type.kind !== import_graphql2.Kind.NAMED_TYPE || v.type.type.name.value !== "ID") return false;
  const s = d.selectionSet.selections[0];
  return s.kind === import_graphql2.Kind.FIELD && s.name.value === "_node" && s.arguments?.length === 1 && s.arguments[0].name.value === "id" && s.arguments[0].value.kind === import_graphql2.Kind.VARIABLE && s.arguments[0].value.name.value === "id";
}
var hasCollectionRoot = (doc) => doc.definitions.some((d) => d.kind === import_graphql2.Kind.OPERATION_DEFINITION && d.selectionSet.selections.some((s) => s.kind === import_graphql2.Kind.FIELD && COLLECTION_ROOT.test(s.name.value)));
function readRecipe(da, { schema }) {
  const parameters = listParams(da.parameters).map((p) => {
    const entry = p.type === "ResourceLink" && (p.allowedResources || []).length === 1 && p.allowedResources[0].type === "Contentful:Entry" && p.allowedResources[0].source === CONTENT_SOURCE ? p.allowedResources[0] : null;
    if (!entry) return { ...p };
    const { allowedResources, type, ...rest } = p;
    return { ...rest, allowedTypes: (entry.allowedTypes || []).map((id) => schema.idToName.get(id) ?? id), type: "Contentful:Entry", source: entry.source };
  });
  const resolvers = {};
  const kinds = {};
  for (const [rid, r] of Object.entries(da.resolvers || {})) {
    if (r.source === "Contentful:DataAssembly") {
      kinds[rid] = "nested";
      resolvers[rid] = null;
      continue;
    }
    if (r.source !== "Contentful:GraphQL") throw new Error(`resolver "${rid}" has an unfamiliar source "${r.source}"`);
    const doc = (0, import_graphql2.parse)(r.query);
    if (hasCollectionRoot(doc)) {
      const c = parseCollection(r, da.parameters);
      if (!c) throw new Error(`resolver "${rid}" is a collection query with arguments other than limit and order`);
      kinds[rid] = "collection";
      const { parameterDefinition, ...compiled } = compileCollection(c.parameter || rid, { contentTypeName: c.contentTypeName, limit: c.limit, order: c.editableOrder ? void 0 : c.order, locked: c.locked });
      resolvers[rid] = { ...compiled, parameters: r.parameters || {}, order: c.order, limit: c.limit, field: c.field };
    } else {
      if (!isEntityQuery(doc)) throw new Error(`resolver "${rid}" is a hand-written query (not _node(id: $id))`);
      kinds[rid] = "entry";
      resolvers[rid] = { resolverType: "graphql", parameters: r.parameters };
    }
  }
  const split = (ptr) => {
    const [scope, rid, ...rest] = segs(ptr);
    if (scope !== "$resolvers" || !kinds[rid]) throw new Error(`"${ptr}" does not start from a resolver of this recipe`);
    return { rid, path: kinds[rid] === "entry" && rest[0] === "_node" ? rest.slice(1) : rest };
  };
  for (const [rid, r] of Object.entries(da.resolvers || {})) {
    if (kinds[rid] !== "nested") continue;
    const feeds = {};
    for (const [name2, b] of Object.entries(isObj(r.parameters) ? r.parameters : {})) {
      const strip = (p) => segs(p).filter((s, i, a) => !(i === a.length - 1 && s === "_id")).join("/");
      if (typeof b === "string" && b.startsWith("$resolvers/")) {
        const { rid: src, path } = split(b);
        feeds[name2] = { $from: { source: `$resolvers/${src}`, select: strip(path.join("/")) } };
      } else if (isObj(b?.$from) && typeof b.$from.source === "string" && isObj(b.$from.select?.$on?.type)) {
        const { rid: src, path } = split(b.$from.source);
        feeds[name2] = { $from: { source: ["$resolvers", src, ...path].join("/"), select: { $on: { type: Object.fromEntries(Object.entries(b.$from.select.$on.type).map(([t, p]) => [t, typeof p === "string" ? strip(p) : p])) } } } };
      } else feeds[name2] = b;
    }
    resolvers[rid] = { resolverType: "dataAssembly", dataAssembly: r.dataAssembly, parameters: feeds };
  }
  const ret = {};
  for (const [key, v] of Object.entries(da.return || {})) {
    if (typeof v !== "string" && !isObj(v)) continue;
    const ptr = typeof v === "string" ? v : typeof v?.$from === "string" ? v.$from : null;
    if (ptr !== null) {
      const { rid: rid2, path: path2 } = split(ptr);
      ret[key] = kinds[rid2] === "nested" && !path2.length ? { $from: `$resolvers/${rid2}` } : { $from: { source: `$resolvers/${rid2}`, select: path2.join("/") } };
      continue;
    }
    if (!isObj(v?.$from) || typeof v.$from.source !== "string") throw new Error(`content property "${key}" is not read from a resolver`);
    const { rid, path } = split(v.$from.source);
    ret[key] = { $from: { source: ["$resolvers", rid, ...path].join("/"), ...v.$from.select !== void 0 && { select: v.$from.select } } };
  }
  return { id: da.sys?.id ?? "", name: da.name, description: da.description, metadata: da.metadata, parameters, resolvers, return: ret, kinds };
}
var DEPTH = 4;
function lintExpression(v, where, inSelect, da, causes) {
  const bad = (why) => causes.push({ where, why });
  const pointer = (p) => {
    const s = segs(p);
    if (/\/\d+(\/|$)/.test(p)) bad(`takes one item out of a list by position (${p}). The editor cannot show "the Nth item"; make it its own editor pick, or feed a nested recipe from a parameter`);
    if (s[0] === "$parameters") {
      if (!inSelect) bad("reads a parameter directly; read the picked entry through a resolver");
      if (s.length - 2 > DEPTH) bad(`selects more than ${DEPTH} levels deep (${p}); move part of the path into a nested recipe`);
      return "parameters";
    }
    if (s[0] === "$resolvers") {
      if (s.length - 3 > DEPTH) bad(`selects more than ${DEPTH} levels deep (${p}); move part of the path into a nested recipe`);
      return s[1] ? "resolver" : null;
    }
    if (s.length > DEPTH) bad(`selects more than ${DEPTH} levels deep (${p}); move part of the path into a nested recipe`);
    return null;
  };
  if (typeof v === "string") {
    pointer(v);
    return;
  }
  if (!isObj(v)) return;
  if ("$literal" in v) {
    if (!inSelect) bad("returns a fixed value. The editor cannot show constants; leave the property unbound so the component default applies, or fill it from a field");
    return;
  }
  if ("$object" in v) {
    if (!inSelect) bad("uses an explicit $object; write the object shape directly");
    for (const x of Object.values(isObj(v.$object) ? v.$object : {})) lintExpression(x, where, inSelect, da, causes);
    return;
  }
  if ("$on" in v) {
    for (const x of Object.values(v.$on?.type || {})) lintExpression(x, where, inSelect, da, causes);
    if (v.$on?.default !== void 0) lintExpression(v.$on.default, where, inSelect, da, causes);
    return;
  }
  if ("$from" in v) {
    const f = v.$from;
    if (typeof f === "string") {
      pointer(f);
      return;
    }
    const scope = pointer(f?.source ?? "");
    if (f?.select !== void 0) lintExpression(f.select, where, inSelect || scope === "resolver", da, causes);
    return;
  }
  for (const x of Object.values(v)) lintExpression(x, where, inSelect, da, causes);
}
var unparsable = (v) => typeof v === "string" ? false : !isObj(v) ? true : isOp(v) ? false : Object.values(v).some(unparsable);
function lintShorthand(v, where, da, schema, causes) {
  if (isObj(v) && !isOp(v)) {
    for (const x of Object.values(v)) lintShorthand(x, where, da, schema, causes);
    return;
  }
  if (typeof v !== "string") return;
  const [scope, rid, ...rest] = segs(v);
  const r = scope === "$resolvers" ? da.resolvers?.[rid] : null;
  if (!r) return;
  if (r.source === "Contentful:DataAssembly") {
    if (rest.length) causes.push({ where, why: `reads one value out of nested recipe "${rid}"; a nested recipe is taken whole ({ "$from": "$resolvers/${rid}" })` });
    return;
  }
  if (r.source !== "Contentful:GraphQL" || !queryIsValid(r.query, schema)) return;
  if (!rest.length) {
    causes.push({ where, why: `returns everything resolver "${rid}" fetched; map a field` });
    return;
  }
  const picks = (isObj(r.parameters) ? Object.values(r.parameters) : [r.parameters]).map((p) => typeof p === "string" && /^\$parameters\/[^/]+$/.test(p) ? p.split("/")[1] : isObj(p) && typeof p.$from === "string" && /^\$parameters\/[^/]+$/.test(p.$from) ? p.$from.split("/")[1] : null).filter(Boolean);
  const several = picks.some((id) => {
    const d = listParams(da.parameters).find((p) => p.id === id);
    const e = (d?.allowedResources || []).find((a) => a.type === "Contentful:Entry" && a.source === CONTENT_SOURCE);
    return (e?.allowedTypes || []).filter((t) => schema.idToName.has(t)).length > 1;
  });
  if (several) causes.push({ where, why: `is a bare path on a pick that allows several content types; select with $on { type: { <TypeName>: \u2026 } }` });
}
function queryIsValid(query, schema) {
  try {
    return (0, import_graphql2.validate)(schema.gql, (0, import_graphql2.parse)(query)).length === 0;
  } catch {
    return false;
  }
}
function lintReferenceLimits(doc, causes, where) {
  const seen = /* @__PURE__ */ new Map();
  const walk = (set, path, depth, tainted) => {
    for (const s of set.selections) {
      if (s.kind === import_graphql2.Kind.INLINE_FRAGMENT) {
        walk(s.selectionSet, s.typeCondition ? [...path, `on ${s.typeCondition.name.value}`] : path, depth, tainted || !!s.directives?.length);
        continue;
      }
      if (s.kind !== import_graphql2.Kind.FIELD) continue;
      const here = depth === 0 && s.name.value === "_node" ? path : [...path, s.name.value];
      const t = tainted || !!(s.alias || s.directives?.length);
      const limit = depth > 0 && isCollectionName(s.name.value) ? s.arguments?.find((a) => a.name.value === "limit") : null;
      if (limit) {
        const n = limit.value.kind === import_graphql2.Kind.INT ? Number(limit.value.value) : NaN;
        const key = here.join("/");
        if (s.arguments.length > 1) causes.push({ where, why: `limits the reference list "${s.name.value}" together with other arguments` });
        else if (t || !Number.isInteger(n) || n < 1 || n > 1e3) causes.push({ where, why: `limits the reference list "${s.name.value}" with something other than a whole number from 1 to 1000 on a plain selection` });
        else if (seen.has(key) && seen.get(key) !== n) causes.push({ where, why: `gives the reference list "${s.name.value}" two different limits` });
        else seen.set(key, n);
      }
      if (s.selectionSet) walk(s.selectionSet, here, depth + 1, t);
    }
  };
  for (const d of doc.definitions) {
    if (d.kind === import_graphql2.Kind.OPERATION_DEFINITION) walk(d.selectionSet, [], 0, false);
    else if (d.kind === import_graphql2.Kind.FRAGMENT_DEFINITION) (0, import_graphql2.visit)(d, { Field(f) {
      if (isCollectionName(f.name.value) && f.arguments?.some((a) => a.name.value === "limit")) causes.push({ where, why: "limits a reference list inside a named fragment" });
    } });
  }
}
function editorCheck(schema, da, refs = {}) {
  const causes = [];
  const skipExpressionRules = unparsable(da.return || {});
  for (const [k, v] of Object.entries(da.return || {})) {
    const where = `content property "${k}"`;
    if (!skipExpressionRules) lintExpression(v, where, false, da, causes);
    lintShorthand(v, where, da, schema, causes);
  }
  for (const [rid, r] of Object.entries(da.resolvers || {})) {
    const where = `resolver "${rid}"`;
    if (r.source === "Contentful:GraphQL") {
      let doc;
      try {
        doc = (0, import_graphql2.parse)(r.query);
      } catch (e) {
        causes.push({ where, why: `has a query that does not parse (${e.message.slice(0, 80)})` });
        continue;
      }
      lintReferenceLimits(doc, causes, where);
      if (hasCollectionRoot(doc)) {
        let c;
        try {
          c = queryIsValid(r.query, schema) ? parseCollection(r, da.parameters) : void 0;
        } catch {
          c = void 0;
        }
        if (c === null) causes.push({ where, why: "is a collection query the editor cannot describe (it understands one <type>CursorCollection with a limit and an order, nothing else); use the collection shorthand" });
      } else if (!isEntityQuery(doc)) {
        const root = doc.definitions.find((d) => d.kind === import_graphql2.Kind.OPERATION_DEFINITION)?.selectionSet.selections.find((s) => s.kind === import_graphql2.Kind.FIELD)?.name.value;
        causes.push({ where, why: `uses a hand-written query${root && root !== "_node" ? ` rooted at "${root}(\u2026)"` : ""} instead of query ($id: ID!) { _node(id: $id) \u2026 }; describe it as an entry resolver or the collection shorthand and let build.mjs write the query` });
      } else if (!isObj(r.parameters) || isOp(r.parameters) || !("id" in r.parameters)) causes.push({ where, why: "does not bind the query's id to an editor pick (parameters.id)" });
    }
    if (r.parameters !== void 0) {
      const before = causes.length;
      lintExpression(isObj(r.parameters) && !isOp(r.parameters) ? r.parameters : { _: r.parameters }, where, true, da, causes);
      for (const c of causes.slice(before)) c.why = `feeds a parameter that ${c.why}`;
    }
  }
  const unique = causes.filter((c, i) => causes.findIndex((x) => x.where === c.where && x.why === c.why) === i);
  if (unique.length) return { state: "apiOnly", editable: false, causes: unique, rewrites: [], note: null };
  let plan;
  try {
    plan = readRecipe(da, { schema });
  } catch (e) {
    return { state: "apiOnly", editable: false, causes: [{ where: "recipe", why: `breaks no single rule but cannot be read back as field mappings (${e.message.slice(0, 160)}); the editor is unlikely to open it` }], rewrites: [] };
  }
  let rewrites = [];
  try {
    const rebuilt = buildBody(plan, { schema, referenced: refs });
    const q = (rs) => Object.fromEntries(Object.entries(rs || {}).map(([k, r]) => [k, { ...r, query: squash(r.query) }]));
    if (canonical(rebuilt.return) !== canonical(da.return)) rewrites.push("return");
    if (canonical(q(rebuilt.resolvers)) !== canonical(q(da.resolvers))) rewrites.push("resolvers");
    if (canonical(rebuilt.parameters) !== canonical(listParams(da.parameters).map((p) => ({ ...p, required: p.required ?? true })))) rewrites.push("parameters");
  } catch {
    rewrites = ["return", "resolvers", "parameters"];
  }
  return { state: rewrites.length ? "unverified" : "editable", editable: true, causes: [], rewrites };
}

// src/skills/exo-content-bindings/lib/client.mjs
var EXPERIENCE_SOURCE = "crn:contentful:::experience:spaces/$self/environments/$self";
function loadEnv(path) {
  const env = { ...process.env };
  if (path) {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const [k, ...v] = t.split("=");
      env[k.trim()] = v.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
  const token = env.CONTENTFUL_MANAGEMENT_TOKEN || env.CMA_TOKEN;
  const spaceId = env.EXO_SPACE_ID || env.SPACE_ID;
  const environmentId = env.EXO_ENVIRONMENT_ID || env.ENVIRONMENT_ID || "master";
  const baseUrl = env.API_BASE_URL || "https://api.contentful.com";
  if (!token || !spaceId) throw new Error("Need CONTENTFUL_MANAGEMENT_TOKEN and EXO_SPACE_ID (in the env file or the environment). Pass the path of a credentials file with --env-file; never pass a token as an argument.");
  if (!baseUrl.startsWith("https://")) throw new Error("API_BASE_URL must start with https://");
  return { token, spaceId, environmentId, baseUrl };
}
function cma({ token, spaceId, environmentId, baseUrl }, logPath) {
  const base = `${baseUrl}/spaces/${spaceId}/environments/${environmentId}`;
  async function call(method, path, { body, version } = {}) {
    const headers = { Authorization: `Bearer ${token}` };
    if (body !== void 0) headers["Content-Type"] = "application/json";
    if (version !== void 0) headers["X-Contentful-Version"] = String(version);
    const t0 = Date.now();
    let res;
    for (let attempt = 0; ; attempt++) {
      res = await fetch(base + path, { method, headers, body: body === void 0 ? void 0 : JSON.stringify(body) });
      if (res.status !== 429 || attempt >= 5) break;
      await new Promise((r) => setTimeout(r, Math.max(Number(res.headers.get("x-contentful-ratelimit-reset")) || 0, 2 ** attempt) * 1e3 + Math.random() * 500));
    }
    const text = await res.text();
    let json = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      json = { raw: text.slice(0, 500) };
    }
    if (logPath) appendFileSync2(logPath, JSON.stringify({ ts: (/* @__PURE__ */ new Date()).toISOString(), method, path: path.split("?")[0], status: res.status, ms: Date.now() - t0, error: res.ok ? void 0 : json.message || json.sys?.id, details: res.ok ? void 0 : json.details }) + "\n");
    return { status: res.status, ok: res.ok, json };
  }
  async function list2(path) {
    const items = [];
    let cursor = null;
    let skip = 0;
    for (; ; ) {
      const q = new URLSearchParams({ limit: "100" });
      if (cursor) q.set("pageNext", cursor);
      else if (skip) q.set("skip", String(skip));
      const { ok, status, json } = await call("GET", `${path}?${q}`);
      if (!ok) return { items: null, status };
      items.push(...json.items || []);
      if ("total" in json) {
        skip = json.skip + json.items.length;
        if (skip >= json.total) break;
      } else {
        cursor = json.pages?.next;
        if (!cursor) break;
      }
    }
    return { items, status: 200 };
  }
  return { call, list: list2, base };
}
var typeIdFromUrn = (urn) => urn.split("/").pop();
var annotationOf = (entity) => (entity.metadata?.annotations?.ComponentType || entity.metadata?.annotations?.Template || [])[0]?.sys?.id || null;

// src/skills/exo-content-bindings/lib/cli.mjs
import { parseArgs } from "node:util";
var CliError = class extends Error {
  constructor(message, code = 1) {
    super(message);
    this.code = code;
  }
};
function flags(argv2, options, required = []) {
  let values;
  try {
    ({ values } = parseArgs({ args: argv2, options, allowPositionals: false, strict: true }));
  } catch (e) {
    throw new CliError(e.message, 2);
  }
  const missing = required.filter((name2) => values[name2] === void 0);
  if (missing.length) throw new CliError(`missing ${missing.map((n) => `--${n}`).join(", ")}`, 2);
  return values;
}
var list = (value) => (value || "").split(",").map((s) => s.trim()).filter(Boolean);
function emit(result) {
  process.stdout.write(JSON.stringify(result, null, 2) + "\n");
}

// src/skills/exo-content-bindings/commands/discover.mjs
var usage = `discover --env-file <file> --out-dir <dir>

Read an ExO environment (read-only) and describe it for binding design.

  --env-file <file>   credentials file: CONTENTFUL_MANAGEMENT_TOKEN, EXO_SPACE_ID, EXO_ENVIRONMENT_ID
  --out-dir <dir>     working directory for this run (created if missing)

Writes <dir>/discovery.md (read this: components, content model, every existing binding set in plain language),
<dir>/discovery.json (full detail) and <dir>/api_log.jsonl. Prints a JSON summary with counts and file paths.
Exit 1 when the environment cannot be read completely (permissions, rate limit).`;
async function run(argv2) {
  const { "env-file": envFile, "out-dir": outDir } = flags(argv2, { "env-file": { type: "string" }, "out-dir": { type: "string" } }, ["env-file", "out-dir"]);
  mkdirSync(outDir, { recursive: true });
  const creds = loadEnv(envFile);
  const api = cma(creds, join(outDir, "api_log.jsonl"));
  const probe = await api.call("GET", "/components?limit=1");
  if (probe.status === 401 || probe.status === 403) {
    throw new CliError(`Pre-flight failed: HTTP ${probe.status} on /components. The token's user lacks Experience Orchestration access (by default only space admins, or the Experience Editor / Presentation Editor roles). This is a permissions problem, not an empty environment.`);
  }
  if (!probe.ok) throw new CliError(`Pre-flight failed: HTTP ${probe.status} ${probe.json.message || ""}`);
  const [components, templates, dataAssemblies, fragments, experiences, contentTypes, entries, assets, published] = await Promise.all([
    api.list("/components"),
    api.list("/experience_templates"),
    api.list("/data_assemblies"),
    api.list("/experience_fragments"),
    api.list("/experiences"),
    api.list("/content_types"),
    api.list("/entries"),
    api.list("/assets"),
    api.list("/public/data_assemblies")
  ]);
  const failedLists = Object.entries({ "/components": components, "/experience_templates": templates, "/data_assemblies": dataAssemblies, "/experience_fragments": fragments, "/experiences": experiences, "/content_types": contentTypes, "/entries": entries, "/assets": assets }).filter(([, r]) => r.items === null);
  if (failedLists.length) {
    throw new CliError(`Discovery is incomplete: ${failedLists.map(([p, r]) => `${p} returned HTTP ${r.status}`).join(", ")}. ${failedLists.some(([, r]) => r.status === 429) ? "The space is rate-limited; wait a few seconds and run discover again." : "Check the token's access and run discover again."} Nothing was written to discovery.json.`);
  }
  const schema = await loadSchema(creds, join(outDir, "api_log.jsonl"));
  const roots = schema.roots;
  const rootById = Object.fromEntries(roots.map((r) => [typeIdFromUrn(r.ref.sys.urn), r]));
  const ctNames = Object.fromEntries((contentTypes.items || []).map((c) => [c.sys.id, c.name]));
  const ctFieldMeta = Object.fromEntries((contentTypes.items || []).map((c) => [c.sys.id, Object.fromEntries(c.fields.map((f) => [f.id, f]))]));
  const pop = {}, count = {};
  for (const e of entries.items || []) {
    const ct = e.sys.contentType.sys.id;
    count[ct] = (count[ct] || 0) + 1;
    pop[ct] ||= {};
    for (const [k, v] of Object.entries(e.fields || {})) {
      const val = Object.values(v)[0];
      if (val !== void 0 && val !== null && val !== "" && !(Array.isArray(val) && !val.length)) pop[ct][k] = (pop[ct][k] || 0) + 1;
    }
  }
  const referencedBy = {};
  function describeField(f) {
    if (f.type === "TypeRef") {
      const lt = f.ref.sys.linkType;
      return lt === "Contentful:Asset" ? "Asset" : `\u2192 ${rootById[typeIdFromUrn(f.ref.sys.urn)]?.name || typeIdFromUrn(f.ref.sys.urn)}`;
    }
    if (f.type === "Array") {
      const it = f.items || {};
      if (it.type === "DiscriminatedUnion") return `[\u2192 ${unionLabel(it.members)}]`;
      if (it.type === "TypeRef") return it.ref.sys.linkType === "Contentful:Asset" ? "[Asset]" : `[\u2192 ${rootById[typeIdFromUrn(it.ref.sys.urn)]?.name}]`;
      return `[${it.type}]`;
    }
    if (f.type === "DiscriminatedUnion") return `\u2192 ${unionLabel(f.members)}`;
    return f.type;
  }
  const entryRootCount = roots.filter((r) => r.ref.sys.linkType !== "Contentful:Asset").length;
  function unionLabel(members) {
    const names = members.map((m) => rootById[typeIdFromUrn(m.ref.sys.urn)]?.name || typeIdFromUrn(m.ref.sys.urn));
    return names.length >= entryRootCount ? `any entry type (${names.length}; the allowed list names types missing from this environment)` : names.join(" | ");
  }
  const contentModel = {};
  for (const r of roots) {
    const id = typeIdFromUrn(r.ref.sys.urn);
    if (r.ref.sys.linkType === "Contentful:Asset") continue;
    const fields = schema.getFields(r.ref);
    const n = count[id] || 0;
    contentModel[r.name] = {
      contentTypeId: id,
      displayName: ctNames[id] || r.name,
      entries: n,
      fields: Object.values(fields).map((f) => {
        const meta = ctFieldMeta[id]?.[f.fieldId] || ctFieldMeta[id]?.[f.id] || ctFieldMeta[id]?.[f.name] || {};
        const targets = [];
        if (f.type === "TypeRef" && f.ref.sys.linkType !== "Contentful:Asset") targets.push(typeIdFromUrn(f.ref.sys.urn));
        if (f.type === "Array" && f.items?.type === "DiscriminatedUnion" && f.items.members.length < entryRootCount) targets.push(...f.items.members.map((m) => typeIdFromUrn(m.ref.sys.urn)));
        if (f.type === "Array" && f.items?.type === "TypeRef" && f.items.ref.sys.linkType !== "Contentful:Asset") targets.push(typeIdFromUrn(f.items.ref.sys.urn));
        if (f.type === "DiscriminatedUnion" && f.members.length < entryRootCount) targets.push(...f.members.map((m) => typeIdFromUrn(m.ref.sys.urn)));
        for (const t of targets) (referencedBy[t] ||= /* @__PURE__ */ new Set()).add(`${r.name}.${f.id}`);
        return {
          id: f.id,
          fieldId: meta.id || f.fieldId,
          name: meta.name || f.name,
          type: describeField(f),
          required: !!f.required,
          filled: n ? `${pop[id]?.[meta.id || f.id] || 0}/${n}` : "no entries",
          allowedValues: (meta.validations || []).find((v) => v.in)?.in,
          disabled: meta.disabled || meta.omitted || void 0
        };
      })
    };
  }
  for (const [id, set] of Object.entries(referencedBy)) if (rootById[id]) contentModel[rootById[id].name].referencedBy = [...set].sort();
  const publishedIds = new Set((published.items || []).map((d) => d.sys.id));
  function humanPointer(p) {
    return typeof p === "string" ? p.replace(/^\$resolvers\/[^/]+\/?/, "").replace(/^_node\/?/, "") || "(whole result)" : JSON.stringify(p);
  }
  function summariseDa(def) {
    let interim = null, note = null;
    try {
      interim = readRecipe(def, { schema });
    } catch (e) {
      note = `not in a shape this skill can describe field by field (${e.message.slice(0, 120)}); the raw mapping is shown`;
    }
    const params = interim ? Array.isArray(interim.parameters) ? interim.parameters : Object.entries(interim.parameters || {}).map(([id, p]) => ({ id, ...p })) : [];
    const picks = params.map((p) => p.allowedTypes ? `${p.name || p.id}: one ${p.allowedTypes.join(" or ")} entry${p.required === false ? " (optional)" : ""}` : `${p.name || p.id}: ${p.type}${p.fields ? " {" + p.fields.map((f) => f.id + (f.fallbackValue !== void 0 ? "=" + JSON.stringify(f.fallbackValue) : "")).join(", ") + "}" : ""}${p.locked ? " (locked)" : ""}`);
    const kinds = Object.values(interim?.resolvers || {}).map((r) => r.resolverType === "dataAssembly" ? `child recipe ${typeIdFromUrn(r.dataAssembly.sys.urn)}` : r.kind === "collection" ? `query: ${r.contentTypeName} collection` : "entry").filter((v, i, a) => a.indexOf(v) === i);
    const fills = Object.entries(interim?.return || def.return || {}).map(([k, v]) => {
      const f = v?.$from;
      const sel = f?.select ?? v;
      return `${k} \u2190 ${typeof sel === "string" ? humanPointer(sel) : f?.source ? humanPointer(f.source) + (sel ? " " + JSON.stringify(sel) : "") : JSON.stringify(v)}`;
    });
    const editor = editorCheck(schema, def, allDas);
    return { id: def.sys.id, name: def.name, description: def.description, published: publishedIds.has(def.sys.id), editorPicks: picks, resolverKinds: kinds, fills, note, editableInUi: editor.editable, editorState: editor.state, editorCauses: editor.causes, editorRewrites: editor.rewrites, interim };
  }
  const allDas = Object.fromEntries((dataAssemblies.items || []).map((d) => [d.sys.id, d]));
  const existing = (dataAssemblies.items || []).map(summariseDa);
  const existingById = Object.fromEntries(existing.map((d) => [d.id, d]));
  const usedInTrees = {};
  function walk(nodes, ownerId) {
    for (const n of nodes || []) {
      if ((n.component || n.componentType)?.sys?.urn) (usedInTrees[typeIdFromUrn((n.component || n.componentType).sys.urn)] ||= /* @__PURE__ */ new Set()).add(ownerId);
      for (const slotNodes of Object.values(n.slots || {})) walk(slotNodes, ownerId);
      if (n.componentTree) walk(n.componentTree, ownerId);
    }
  }
  for (const c of [...components.items || [], ...templates.items || []]) walk(c.componentTree, c.sys.id);
  function prop(p) {
    const base = { id: p.id, name: p.name, type: p.type, required: !!p.required };
    if (p.type === "Array" && p.items) base.itemFields = (p.items.fields || []).map((f) => `${f.id}:${f.type}${f.required ? "!" : ""}`);
    if (p.type === "TypeRef" && p.ref) base.ref = typeIdFromUrn(p.ref.sys.urn);
    return base;
  }
  function surface(c, kind) {
    const bindingSets = (c.dataAssemblies || []).map((l) => typeIdFromUrn(l.sys.urn));
    return {
      kind,
      id: c.sys.id,
      name: c.name,
      description: c.description || "",
      implementation: (annotationOf(c) || "").replace("Contentful:", "").replace("Implementation", "") || (c.componentTree?.length ? "Composed" : "Coded"),
      published: !!c.sys.publishedVersion,
      // unpublished now, but it was published at some point: not the same as never published
      wasPublished: !c.sys.publishedVersion && !!(c.sys.firstPublishedAt || c.sys.publishedCounter),
      // the published definition is what editors see; links added since then are invisible until someone publishes
      unpublishedChanges: !!c.sys.publishedVersion && c.sys.version > c.sys.publishedVersion + 1,
      contentProperties: (c.contentProperties || []).map(prop),
      designProperties: (c.designProperties || []).map((d) => d.id),
      slots: (c.slots || []).map((s) => ({ id: s.id, name: s.name, allows: (s.allowedResources || []).flatMap((r) => r.allowedTypes || []), max: (s.validations || []).find((v) => v.size)?.size?.max })),
      treeChildren: [...new Set((function collect(nodes, acc = []) {
        for (const n of nodes || []) {
          if (n.component || n.componentType) acc.push(typeIdFromUrn((n.component || n.componentType).sys.urn));
          if (n.nodeType === "Looper") acc.push(`Looper(${n.items})`);
          for (const s of Object.values(n.slots || {})) collect(s, acc);
          collect(n.componentTree, acc);
        }
        return acc;
      })(c.componentTree))],
      usedInside: [...usedInTrees[c.sys.id] || []].sort(),
      bindingSets: bindingSets.map((id) => existingById[id] ? { id, name: existingById[id].name, editorPicks: existingById[id].editorPicks, resolverKinds: existingById[id].resolverKinds, editableInUi: existingById[id].editableInUi } : { id, name: "(not found in this environment)" })
    };
  }
  const componentSurfaces = (components.items || []).map((c) => surface(c, "components"));
  const templateSurfaces = (templates.items || []).map((t) => surface(t, "templates"));
  const instances = {
    fragments: (fragments.items || []).map((f) => {
      const id = f.contentBindings?.sys?.urn ? typeIdFromUrn(f.contentBindings.sys.urn) : null;
      return { id: f.sys.id, name: f.name, selectedBindingSet: id, bindingStatus: !id ? "no binding set selected" : existingById[id] ? "uses " + existingById[id].name : `selects "${id}" which no longer exists` };
    }),
    experiences: (experiences.items || []).map((e) => ({ id: e.sys.id, name: e.name, template: e.template?.sys?.urn ? typeIdFromUrn(e.template.sys.urn) : null }))
  };
  const discovery = {
    source: { spaceId: creds.spaceId, environmentId: creds.environmentId, at: (/* @__PURE__ */ new Date()).toISOString() },
    components: componentSurfaces,
    templates: templateSurfaces,
    contentModel,
    existingBindingSets: existing,
    instances,
    raw: { components: components.items, templates: templates.items, dataAssemblies: dataAssemblies.items, contentTypes: contentTypes.items },
    unsupportedFields: schema.unsupported,
    counts: { entries: entries.items?.length ?? null, assets: assets.items?.length ?? null, publishedBindingSets: publishedIds.size },
    availability: { publishedDataAssemblies: published.status }
  };
  writeFileSync(join(outDir, "discovery.json"), JSON.stringify(discovery, null, 2));
  const report = [];
  const line = (s = "") => report.push(s);
  line(`# Discovery: ${creds.spaceId} / ${creds.environmentId}`);
  line(`${componentSurfaces.length} components, ${templateSurfaces.length} templates, ${existing.length} binding sets (${publishedIds.size} published), ${Object.keys(contentModel).length} content types, ${discovery.counts.entries} entries, ${instances.fragments.length} fragments, ${instances.experiences.length} experiences`);
  for (const group of [templateSurfaces, componentSurfaces]) {
    if (!group.length) continue;
    line(`
## ${group[0].kind === "templates" ? "Templates" : "Components"}`);
    for (const c of group) {
      line(`
### ${c.name}  (${c.id}, ${c.implementation}${c.published ? c.unpublishedChanges ? ", has unpublished changes \u2014 editors see the older published version" : "" : c.wasPublished ? ", not published at the moment (it was published before) \u2014 editors cannot use it until it is published again" : ", never published \u2014 editors cannot use it yet"})`);
      if (c.contentProperties.length) line(`  bindable content properties: ` + c.contentProperties.map((p) => `${p.id}${p.required ? "!" : ""}:${p.type}${p.ref ? "\u2192" + p.ref : ""}${p.itemFields ? "{" + p.itemFields.join(", ") + "}" : ""}`).join(", "));
      else line(`  no content properties \u2192 nothing to bind here`);
      if (c.designProperties.length) line(`  design properties (never bound): ${c.designProperties.join(", ")}`);
      if (c.slots.length) line(`  slots: ` + c.slots.map((s) => `${s.id}${s.allows.length ? " allows " + s.allows.join("|") : ""}${s.max ? " max " + s.max : ""}`).join("; ") + "  \u2190 occupants bring their own recipes");
      if (c.treeChildren.length) line(`  built from: ${c.treeChildren.join(", ")}`);
      if (c.usedInside.length) line(`  appears inside: ${c.usedInside.join(", ")}`);
      if (c.bindingSets.length) for (const b of c.bindingSets) line(`  existing binding set "${b.name}" [${b.id}]${b.editableInUi === false ? " [API ONLY in the editor]" : ""}${b.editorPicks ? " \u2014 editor picks " + b.editorPicks.join("; ") + " \u2014 " + b.resolverKinds.join(", ") : ""}`);
      else if (c.contentProperties.length) line(`  existing binding sets: none`);
    }
  }
  line(`
## Content model (field: type, filled/entries)`);
  for (const [name2, ct] of Object.entries(contentModel)) {
    line(`
### ${name2}  (${ct.contentTypeId} "${ct.displayName}", ${ct.entries} entries${ct.referencedBy ? ", referenced by " + ct.referencedBy.join(", ") : ""})`);
    line("  " + ct.fields.filter((f) => !f.disabled).map((f) => `${f.id}${f.required ? "!" : ""}: ${f.type}${f.allowedValues ? " in[" + f.allowedValues.join("|") + "]" : ""} ${f.filled}`).join("\n  "));
  }
  if (existing.length) {
    line(`
## Existing binding sets (house conventions \u2014 read these before proposing anything)`);
    for (const d of existing) {
      line(`
### ${d.name} [${d.id}]${d.published ? "" : " (draft)"} \u2014 ${d.resolverKinds.join(", ")}${d.editableInUi ? "" : " \u2014 API ONLY: editors see it read-only in the component editor; do not copy its shape"}`);
      if (!d.editableInUi) for (const c of d.editorCauses) line(`  api-only because ${c.where} ${c.why}`);
      if (d.editorState === "unverified") line(`  not written by the component editor: it fits the editor's rules, but its ${d.editorRewrites.join(", ")} differ from the shape the editor saves and would be rewritten on first save there. Confirm it opens in the component editor before building on it`);
      if (d.editorPicks.length) line(`  editor picks: ${d.editorPicks.join("; ")}`);
      for (const f of d.fills) line(`  ${f}`);
      if (d.note) line(`  ${d.note}`);
    }
  }
  if (schema.unsupported.length) {
    line(`
## Fields this skill cannot bind (${schema.unsupported.length})`);
    for (const u of schema.unsupported) line(`  ${u.type}.${u.field}: ${u.reason}`);
  }
  if (instances.fragments.length || instances.experiences.length) {
    line(`
## Instances (context only; this skill does not edit them). Fragments show the binding set they select; which binding sets an experience's placed components use is NOT read here, so "no experience uses it" cannot be concluded from this list`);
    for (const f of instances.fragments) line(`  fragment "${f.name}" [${f.id}]: ${f.bindingStatus}`);
    for (const e of instances.experiences) line(`  experience "${e.name}" [${e.id}]${e.template ? " on template " + e.template : ""}`);
  }
  line(`
Full detail: ${join(outDir, "discovery.json")}`);
  writeFileSync(join(outDir, "discovery.md"), report.join("\n") + "\n");
  emit({
    ok: true,
    source: discovery.source,
    counts: { components: componentSurfaces.length, templates: templateSurfaces.length, bindingSets: existing.length, publishedBindingSets: publishedIds.size, contentTypes: Object.keys(contentModel).length, entries: discovery.counts.entries, fragments: instances.fragments.length, experiences: instances.experiences.length },
    apiOnlyBindingSets: existing.filter((d) => !d.editableInUi).map((d) => d.id),
    notWrittenByTheEditor: existing.filter((d) => d.editorState === "unverified").map((d) => d.id),
    fieldsThisSkillCannotBind: schema.unsupported.length,
    files: { summary: join(outDir, "discovery.md"), discovery: join(outDir, "discovery.json"), apiLog: join(outDir, "api_log.jsonl") },
    next: "Read files.summary before proposing anything."
  });
}

// src/skills/exo-content-bindings/commands/build.mjs
var build_exports = {};
__export(build_exports, {
  run: () => run2,
  usage: () => usage2
});
import { mkdirSync as mkdirSync2, readFileSync as readFileSync2, writeFileSync as writeFileSync2 } from "node:fs";
import { join as join2 } from "node:path";
var usage2 = `build --env-file <file> --plan <plan.json> --out-dir <dir>

Validate a plan against the live schema and generate request bodies. Writes nothing to Contentful.

  --env-file <file>   credentials file (see discover)
  --plan <file>       the plan (references/plan-format.md)
  --out-dir <dir>     the working directory discover wrote to (needs discovery.json)

Writes <dir>/payloads/<id>.json for every recipe without errors and <dir>/build.json (full report). Prints JSON:
per recipe its errors, warnings, what fills each property, and whether the component editor can edit it
("editable" or "apiOnly"). Exit 1 when any recipe has errors.`;
async function run2(argv2) {
  const { "env-file": envFile, plan: planFile, "out-dir": outDir } = flags(argv2, { "env-file": { type: "string" }, plan: { type: "string" }, "out-dir": { type: "string" } }, ["env-file", "plan", "out-dir"]);
  const creds = loadEnv(envFile);
  const plan = JSON.parse(readFileSync2(planFile, "utf8"));
  const discovery = JSON.parse(readFileSync2(join2(outDir, "discovery.json"), "utf8"));
  mkdirSync2(join2(outDir, "payloads"), { recursive: true });
  const schema = await loadSchema(creds, join2(outDir, "api_log.jsonl"));
  const roots = schema.roots;
  const rootByName = Object.fromEntries(roots.map((r) => [r.name, r]));
  const rootById = Object.fromEntries(roots.map((r) => [typeIdFromUrn(r.ref.sys.urn), r]));
  const toPascal = (t) => rootByName[t] ? t : rootById[t] ? rootById[t].name : t;
  const owners = Object.fromEntries([...discovery.components, ...discovery.templates].map((s) => [`${s.kind}/${s.id}`, s]));
  const existingDas = Object.fromEntries((discovery.raw.dataAssemblies || []).map((d) => [d.sys.id, d]));
  const allowedTypesOf = {};
  for (const ct of discovery.raw.contentTypes || []) for (const f of ct.fields || []) {
    const v = [...f.validations || [], ...(f.items || {}).validations || []].find((x) => x.linkContentType);
    if (v) allowedTypesOf[`${ct.sys.id}.${f.id}`] = v.linkContentType;
  }
  function normaliseParameters(params) {
    const list2 = Array.isArray(params) ? params : Object.entries(params || {}).map(([id, p]) => ({ id, ...p }));
    return list2.map((p) => {
      const q = { required: true, ...p };
      if (q.allowedTypes) {
        q.type ||= "Contentful:Entry";
        q.source ||= CONTENT_SOURCE;
        q.allowedTypes = q.allowedTypes.map(toPascal);
      }
      return q;
    });
  }
  function applyCollectionShorthand(recipe) {
    const c = recipe.collection;
    if (!c) return recipe;
    const name2 = c.resolver || "collection";
    const order = (c.order || []).map((o) => typeof o === "string" ? o : `${o.path.replace(/\./g, "_")}_${String(o.direction).toUpperCase()}`);
    const compiled = compileCollection(name2, { contentTypeName: toPascal(c.contentTypeName), limit: c.limit, order: order.length ? order : void 0, locked: c.locked });
    const { parameterDefinition, ...resolver } = compiled;
    const params = normaliseParameters(recipe.parameters);
    if (parameterDefinition && !params.some((p) => p.id === name2)) params.push({ id: name2, required: true, name: c.name || `${c.contentTypeName} query`, ...parameterDefinition });
    return { ...recipe, parameters: params, resolvers: { ...recipe.resolvers, [name2]: resolver } };
  }
  function defaultResolvers(recipe) {
    if (recipe.resolvers && Object.keys(recipe.resolvers).length) return recipe.resolvers;
    const first = normaliseParameters(recipe.parameters).find((p) => p.allowedTypes);
    return first ? { main: { resolverType: "graphql", parameters: { id: `$parameters/${first.id}` } } } : {};
  }
  const fieldCache = /* @__PURE__ */ new Map();
  const fieldsOf = (ref) => {
    const k = ref.sys.urn;
    if (!fieldCache.has(k)) fieldCache.set(k, schema.getFields(ref));
    return fieldCache.get(k);
  };
  const memberName = (m) => m.missing ? `${m.missing} (not in this environment)` : rootById[typeIdFromUrn(m.ref.sys.urn)]?.name || typeIdFromUrn(m.ref.sys.urn);
  function follow(ref, path) {
    const segs2 = path.split("/").filter(Boolean);
    let cur = { ref, field: null, union: null, isArray: false };
    for (let i = 0; i < segs2.length; i++) {
      const seg = segs2[i];
      if (cur.isArray) {
        if (seg !== "items") throw new Error(`expected "items" after collection "${segs2[i - 1]}", got "${seg}"`);
        cur = { ...cur, isArray: false };
        continue;
      }
      if (cur.union) throw new Error(`"${segs2.slice(0, i).join("/")}" can be one of ${cur.union.map(memberName).join(" | ")}; select it with $on { type: { <TypeName>: ... } } before reading "${seg}"`);
      if (!cur.ref) throw new Error(`"${segs2.slice(0, i).join("/")}" is a ${cur.field?.type}; cannot select "${seg}" inside it`);
      const fields = fieldsOf(cur.ref);
      const f = fields[seg];
      if (!f) throw new Error(`"${seg}" is not a field of ${rootById[typeIdFromUrn(cur.ref.sys.urn)]?.name || "Asset"} (has: ${Object.keys(fields).join(", ")})`);
      if (f.type === "TypeRef" && f.ref.sys.linkType !== "Contentful:Asset" && f.branch) {
        const list2 = allowedTypesOf[`${typeIdFromUrn(cur.ref.sys.urn)}.${seg}`] || [typeIdFromUrn(f.ref.sys.urn)];
        cur = { ref: null, field: f, union: list2.map((t) => rootById[t] ? { ref: rootById[t].ref } : { ref: { sys: { urn: `missing/${t}` } }, missing: t }), isArray: false, branchReason: `"${seg}" allows ${list2.join(" | ")}` };
      } else if (f.type === "TypeRef") cur = { ref: f.ref, field: f, union: null, isArray: false };
      else if (f.type === "DiscriminatedUnion") cur = { ref: null, field: f, union: f.members, isArray: false };
      else if (f.type === "Array") {
        const it = f.items || {};
        if (it.type === "DiscriminatedUnion") cur = { ref: null, field: f, union: it.members, isArray: true };
        else if (it.type === "TypeRef" && f.branch) cur = { ref: null, field: f, union: [{ ref: it.ref }], isArray: true };
        else if (it.type === "TypeRef") cur = { ref: it.ref, field: f, union: null, isArray: true };
        else cur = { ref: null, field: { ...f, leafType: it.type }, union: null, isArray: true };
      } else cur = { ref: null, field: f, union: null, isArray: false };
    }
    return cur;
  }
  const leafType = (cur) => cur.field ? cur.field.type === "TypeRef" ? cur.field.ref.sys.linkType === "Contentful:Asset" ? "Asset" : "Entry" : cur.field.type === "Array" ? "Array" : cur.field.type : "Entry";
  function checkSelect(expr, start, target, out, errors, warnings) {
    if (typeof expr === "string") {
      try {
        const leaf = follow(start.ref ? start.ref : { sys: { urn: "x" } }, expr);
        out.push({ target, type: leafType(leaf), path: expr });
      } catch (e) {
        if (start.ref) errors.push(`${target}: ${e.message}`);
        else errors.push(`${target}: cannot select "${expr}" here \u2014 ${start.union ? "branch with $on first" : "not an entry"}`);
      }
      return;
    }
    if (!expr || typeof expr !== "object") {
      out.push({ target, type: "Literal", path: JSON.stringify(expr) });
      return;
    }
    if ("$literal" in expr) {
      out.push({ target, type: "Literal", path: JSON.stringify(expr.$literal) });
      return;
    }
    if ("$on" in expr) {
      const branches = expr.$on.type || {};
      const present = (start.union || []).filter((m) => !m.missing).map(memberName);
      const members = present;
      if (start.isArray || (start.union || []).length === present.length) {
        for (const m of present) if (!(m in branches)) errors.push(`${target}: can be a ${m} but no $on branch maps it \u2014 the API rejects a multi-type selection with a missing branch`);
      }
      for (const [name2, sub] of Object.entries(branches)) {
        const root = rootByName[name2];
        if (!root) {
          errors.push(`${target}: $on branch "${name2}" is not a content type in this environment`);
          continue;
        }
        if (members.length && !members.includes(name2)) warnings.push(`${target}: $on branch "${name2}" can never occur here (allowed: ${members.join(", ")})`);
        checkSelect(sub, { ref: root.ref }, target, out, errors, warnings);
      }
      return;
    }
    if ("$from" in expr) {
      const f = expr.$from;
      if (typeof f === "string") {
        out.push({ target, type: "Resolver", path: f });
        return;
      }
      let next = start;
      if (f.source && !f.source.startsWith("$") && !start.ref) {
        errors.push(`${target}: cannot select "${f.source}" here \u2014 ${start.union ? "branch with $on first" : "not an entry"}`);
        return;
      }
      if (f.source && !f.source.startsWith("$")) {
        try {
          const leaf = follow(start.ref, f.source);
          next = { ref: leaf.ref, union: leaf.union, isArray: leaf.isArray };
        } catch (e) {
          errors.push(`${target}: ${e.message}`);
          return;
        }
      }
      if (f.select === void 0) {
        out.push({ target, type: leafType(next.field ? next : { field: null }), path: f.source });
        return;
      }
      checkSelect(f.select, next, target, out, errors, warnings);
      return;
    }
    if (!start.ref && start.union) {
      const names = start.union.map(memberName);
      errors.push(`${target}: ${start.isArray ? "each item" : "this reference"} can be ${names.join(" | ")} and the schema types it as a union, so the mapping must be wrapped: { "$on": { "type": { "${names[0]}": { \u2026 } } } }`);
      return;
    }
    for (const [k, v] of Object.entries(expr)) checkSelect(v, start, `${target}.${k}`, out, errors, warnings);
  }
  const compatible = { String: ["String", "Date", "DateTime", "Symbol", "Text", "Literal"], RichText: ["RichText"], Boolean: ["Boolean", "Literal"], Number: ["Number", "Integer", "Literal"], Array: ["Array"], TypeRef: ["Resolver"], Record: ["Entry", "Asset", "Resolver"] };
  const report = { recipes: [], ok: true };
  const planDas = {};
  const apiOnlyIds = new Set(Object.values(existingDas).filter((d) => !editorCheck(schema, d, existingDas).editable).map((d) => d.sys.id));
  for (let recipe of plan.recipes || []) {
    const errors = [], warnings = [], leaves = [];
    let editor = null, existingNote = null, unchanged = false;
    const id = recipe.id;
    if (!id) {
      errors.push("recipe has no id");
    }
    const targets = (recipe.linkTo || []).map((t) => owners[`${t.kind}/${t.id}`] || (errors.push(`linkTo ${t.kind}/${t.id} not found in discovery`), null)).filter(Boolean);
    if (!recipe.linkTo?.length) warnings.push("no linkTo: the recipe will exist but no component or template will offer it");
    for (const o of targets) {
      if (!o.published) warnings.push(`${o.kind}/${o.id} ${o.wasPublished ? "is not published at the moment (it was published before)" : "has never been published"}: editors cannot use it or this recipe until it is`);
      else if (o.unpublishedChanges) warnings.push(`${o.kind}/${o.id} has unpublished changes: editors see the older published version until someone publishes it, and this recipe will not appear for them before that`);
    }
    const prior = existingDas[id];
    if (prior) {
      const users = (discovery.instances?.fragments || []).filter((f) => f.selectedBindingSet === id).map((f) => `fragment "${f.name}"`);
      existingNote = { at: warnings.length, users };
      warnings.push(`"${id}" already exists in this environment ("${prior.name}"${prior.sys.publishedVersion ? ", published" : ""}); applying will UPDATE it${users.length ? " and affect " + users.join(", ") : ""}. If an alternative recipe is intended, use a new id.`);
    }
    try {
      recipe = applyCollectionShorthand(recipe);
      const parameters = normaliseParameters(recipe.parameters);
      const resolvers = defaultResolvers({ ...recipe, parameters });
      for (const [rid, r] of Object.entries(resolvers)) if (!["graphql", "dataAssembly"].includes(r.resolverType)) errors.push(`resolver ${rid}: write it as { resolverType: "graphql", parameters: { id: "$parameters/<pick>" } }, { resolverType: "dataAssembly", dataAssembly, parameters } or the collection shorthand; hand-written queries and raw API resolvers are not accepted (the editor cannot edit them)`);
      for (const p of parameters) for (const t of p.allowedTypes || []) if (!rootByName[t]) errors.push(`parameter ${p.id}: allowed type "${t}" is not a content type in this environment`);
      const referenced = {};
      for (const [rid, r] of Object.entries(resolvers)) if (r.resolverType === "dataAssembly") {
        const cid = typeIdFromUrn(r.dataAssembly.sys.urn);
        const child2 = existingDas[cid] || planDas[cid];
        if (!child2) errors.push(`resolver ${rid}: child recipe "${cid}" is neither in the environment nor earlier in this plan (order matters)`);
        else referenced[cid] = child2;
      }
      const startOf = {};
      for (const [rid, r] of Object.entries(resolvers)) {
        if (r.resolverType === "dataAssembly") {
          startOf[rid] = { resolverOnly: true };
          continue;
        }
        if (r.kind === "collection") {
          const root = rootByName[r.contentTypeName];
          startOf[rid] = { ref: root?.ref, collectionField: r.query.match(/\n\s*(\w+CursorCollection)/)?.[1] };
          continue;
        }
        const idPtr = r.parameters?.id;
        const pid = typeof idPtr === "string" ? idPtr.replace("$parameters/", "") : null;
        const p = parameters.find((x) => x.id === pid);
        if (!p) {
          errors.push(`resolver ${rid}: parameters.id must point at an entry parameter ($parameters/<id>)`);
          continue;
        }
        const types = (p.allowedTypes || []).map((t) => rootByName[t]).filter(Boolean);
        startOf[rid] = types.length === 1 ? { ref: types[0].ref } : { union: types.map((t) => ({ ref: t.ref })) };
      }
      for (const [key, expr] of Object.entries(recipe.return || {})) {
        const f = expr?.$from;
        const src = typeof f === "object" ? f.source : typeof f === "string" ? f : typeof expr === "string" ? expr : null;
        if (!src || !src.startsWith("$resolvers/")) {
          errors.push(`${key}: return must start from a resolver ($resolvers/<name>\u2026)`);
          continue;
        }
        const [, rid, ...rest] = src.split("/");
        const st = startOf[rid];
        if (!st) {
          errors.push(`${key}: unknown resolver "${rid}"`);
          continue;
        }
        if (st.resolverOnly) {
          leaves.push({ target: key, type: "Resolver", path: src });
          continue;
        }
        let start = st;
        if (st.collectionField) {
          if (rest[0] !== st.collectionField || rest[1] !== "items") {
            errors.push(`${key}: a collection resolver is read as $resolvers/${rid}/${st.collectionField}/items`);
            continue;
          }
          start = { ref: st.ref };
          rest.splice(0, 2);
        }
        if (rest.length) {
          try {
            const leaf = follow(start.ref, rest.join("/"));
            start = { ref: leaf.ref, union: leaf.union, isArray: leaf.isArray };
          } catch (e) {
            errors.push(`${key}: ${e.message}`);
            continue;
          }
        }
        const sel = typeof f === "object" ? f.select : void 0;
        if (sel === void 0) leaves.push({ target: key, type: start.union ? "Union" : "Entry", path: src });
        else checkSelect(sel, start, key, leaves, errors, warnings);
      }
      for (const o of targets) {
        const props = Object.fromEntries(o.contentProperties.map((p) => [p.id, p]));
        for (const key of Object.keys(recipe.return || {})) {
          const p = props[key];
          if (!p) {
            errors.push(`${key}: not a content property of ${o.kind}/${o.id} (has: ${Object.keys(props).join(", ")})`);
            continue;
          }
          const mine = leaves.filter((l) => l.target === key || l.target.startsWith(key + "."));
          if (p.type === "Array") {
            const itemIds = (o.contentProperties.find((x) => x.id === key)?.itemFields || []).map((s) => s.split(":")[0]);
            for (const l of mine) {
              const sub = l.target.slice(key.length + 1);
              if (sub && !itemIds.includes(sub)) errors.push(`${l.target}: "${sub}" is not an item field of ${key} (has: ${itemIds.join(", ")})`);
            }
          } else if (p.type !== "TypeRef") {
            for (const l of mine) if (l.type !== "Resolver" && !(compatible[p.type] || []).includes(l.type)) errors.push(`${key}: ${o.id} expects ${p.type} but "${l.path}" is ${l.type}`);
          }
        }
        for (const p of o.contentProperties) if (!(p.id in (recipe.return || {}))) {
          const why = recipe.review?.notUsed?.[p.id];
          (p.required && !why ? errors : warnings).push(`${o.kind}/${o.id}.${p.id}${p.required ? " (required)" : ""} is not filled by this recipe${why ? ": " + why : " \u2014 fill it or explain it in review.notUsed"}`);
        }
        if (o.designProperties.some((d) => d in (recipe.return || {}))) errors.push(`return touches a design property of ${o.id}; design properties are never bound`);
      }
      let body = null;
      if (!errors.length) {
        const typeOf = (rid) => {
          const st = startOf[rid];
          return st?.ref ? rootById[typeIdFromUrn(st.ref.sys.urn)]?.name : null;
        };
        const needsBranchAt = (ref, segs2) => {
          try {
            let cur = ref;
            for (let i = 0; i < segs2.length; i++) {
              const f = fieldsOf(cur)[segs2[i]];
              if (!f) return false;
              if (i === segs2.length - 1) return f.type === "DiscriminatedUnion" || f.type === "Array" && f.items?.type === "DiscriminatedUnion" || !!f.branch;
              if (f.type === "TypeRef") cur = f.ref;
              else return false;
            }
            return false;
          } catch {
            return false;
          }
        };
        const canon = {};
        for (const [key, v] of Object.entries(recipe.return || {})) {
          if (typeof v === "string") {
            canon[key] = { $from: v };
            continue;
          }
          const f = v?.$from;
          if (!f || typeof f === "string" || typeof f.source !== "string" || f.select === void 0) {
            canon[key] = v;
            continue;
          }
          const [, rid, ...rest] = f.source.split("/");
          const T = typeOf(rid);
          if (!T || resolvers[rid]?.kind === "collection") {
            canon[key] = v;
            continue;
          }
          const already = !rest.length && f.select && typeof f.select === "object" && f.select.$on && Object.keys(f.select.$on.type || {}).every((k) => k === T);
          if (already) {
            canon[key] = v;
            continue;
          }
          let sel = f.select;
          if (rest.length && sel && typeof sel === "object" && sel.$on && !needsBranchAt(startOf[rid]?.ref, rest)) {
            const branches = Object.values(sel.$on.type || {});
            if (branches.length === 1 && typeof branches[0] === "string") sel = branches[0];
          }
          const inner = rest.length ? typeof sel === "string" ? `${rest.join("/")}/${sel}` : { $from: { source: rest.join("/"), select: sel } } : sel;
          canon[key] = { $from: { source: `$resolvers/${rid}`, select: { $on: { type: { [T]: inner } } } } };
        }
        const interim = { id, name: recipe.name || id, description: recipe.description || "", metadata: recipe.metadata || { tags: [] }, parameters, resolvers, return: canon };
        body = buildBody(interim, { schema, referenced });
        const rawProps = Object.fromEntries((targets[0] ? (discovery.raw[targets[0].kind === "templates" ? "templates" : "components"] || []).find((c) => c.sys.id === targets[0].id)?.contentProperties || [] : []).map((p) => [p.id, p]));
        const childDaFor = (key) => {
          const v = recipe.return[key];
          const ptr = typeof v === "string" ? v : typeof v?.$from === "string" ? v.$from : v?.$from?.source;
          const rid = ptr?.startsWith("$resolvers/") ? ptr.split("/")[1] : null;
          return rid ? resolvers[rid]?.dataAssembly : null;
        };
        const dataType = targets[0] ? targets[0].contentProperties.map((p) => {
          const raw = rawProps[p.id] || {};
          const entry = { name: p.name, required: p.required, type: p.type, id: p.id };
          if (p.type === "Array" && raw.items) entry.items = raw.items;
          if (p.type === "TypeRef") {
            const child2 = childDaFor(p.id);
            if (child2) entry.ref = child2;
            else {
              errors.push(`${p.id}: a TypeRef property must be filled by a child recipe (resolverType "dataAssembly") so the editor can resolve it`);
              entry.ref = raw.ref;
            }
          }
          return entry;
        }) : [];
        const payload = { sys: { id, type: "DataAssembly", dataType }, ...body };
        if (existingNote) {
          const norm = (d) => JSON.stringify({ parameters: (Array.isArray(d.parameters) ? d.parameters : Object.entries(d.parameters || {}).map(([pid, p]) => ({ id: pid, ...p }))).map((p) => ({ ...p, required: p.required ?? true })), resolvers: Object.fromEntries(Object.entries(d.resolvers || {}).map(([k, r]) => [k, { ...r, query: (r.query || "").replace(/\s+/g, " ").trim() }])), return: d.return }, (k, x) => x && typeof x === "object" && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort()) : x);
          const part = (k) => norm({ [k]: prior[k] }) !== norm({ [k]: body[k] });
          const changed = [part("return") && "what fills the properties", part("resolvers") && "what is fetched", part("parameters") && "what the editor picks", prior.name !== body.name && "its name"].filter(Boolean);
          warnings[existingNote.at] = changed.length ? `"${id}" already exists in this environment ("${prior.name}"${prior.sys.publishedVersion ? ", published" : ""}); applying will UPDATE it (changes: ${changed.join(", ")})${existingNote.users.length ? " and affect " + existingNote.users.join(", ") : ""}. If an alternative recipe is intended, use a new id.` : `"${id}" already exists in this environment ("${prior.name}"${prior.sys.publishedVersion ? ", published" : ""}) and this plan builds the same recipe: applying would change nothing.`;
          unchanged = !changed.length;
        }
        editor = editorCheck(schema, payload, { ...existingDas, ...planDas, [id]: payload });
        for (const cid of Object.keys(referenced)) if (apiOnlyIds.has(cid)) editor.causes.push({ where: `child recipe "${cid}"`, why: "is itself API only, so editors cannot change what this recipe feeds into it" });
        const where = editor.causes.map((c) => `${c.where} ${c.why}`).join("; ");
        if (!editor.editable) {
          apiOnlyIds.add(id);
          if (recipe.apiOnly?.reason) warnings.push(`API ONLY (declared): the component editor will show this binding set read-only. ${where}. Reason given: ${recipe.apiOnly.reason.replace(/\.$/, "")}. Needs the user's explicit confirmation; apply needs --allow-api-only ${id}`);
          else errors.push(`API ONLY: the component editor would show this binding set read-only, so it could not be reviewed, changed or removed in the UI. ${where}. Redesign it; if no editable design meets the need, set apiOnly.reason and ask the user to confirm`);
        } else {
          if (editor.causes.length) warnings.push(`editable itself, but ${where}`);
          if (recipe.apiOnly) warnings.push("declares apiOnly but the editor can open it: remove apiOnly");
          if (editor.state !== "editable") errors.push(`could not confirm the component editor can edit this binding set: its ${editor.rewrites.join(", ")} did not read back the way it was written. This is a fault in the skill's scripts, not in the plan; report it and do not apply this recipe`);
        }
        planDas[id] = { ...payload };
        if (!errors.length) writeFileSync2(join2(outDir, "payloads", `${id}.json`), JSON.stringify({ linkTo: recipe.linkTo || [], editor: { state: editor.state, editable: editor.editable, causes: editor.causes, apiOnlyReason: recipe.apiOnly?.reason || null }, body: payload }, null, 2));
      }
      report.recipes.push({ id, name: recipe.name, linkTo: recipe.linkTo || [], editor: editor && { state: editor.state, editable: editor.editable, causes: editor.causes, rewrites: editor.rewrites, apiOnlyReason: recipe.apiOnly?.reason || null }, modifiesExisting: prior ? { name: prior.name, published: !!prior.sys.publishedVersion, unchanged } : null, errors, warnings, fills: leaves.map((l) => `${l.target} \u2190 ${l.path} (${l.type})`), queries: body ? Object.fromEntries(Object.entries(body.resolvers).filter(([, r]) => r.query).map(([k, r]) => [k, r.query])) : null, review: recipe.review || null });
    } catch (e) {
      errors.push(`build failed: ${e.message}`);
      report.recipes.push({ id, name: recipe.name, linkTo: recipe.linkTo || [], errors, warnings, fills: [], queries: null, review: recipe.review || null });
    }
    if (errors.length) report.ok = false;
  }
  writeFileSync2(join2(outDir, "build.json"), JSON.stringify(report, null, 2));
  emit({
    ok: report.ok,
    recipes: report.recipes.map((r) => ({ id: r.id, offeredBy: r.linkTo.map((t) => `${t.kind}/${t.id}`), built: !r.errors.length, editor: r.editor ? r.editor.editable ? "editable" : "apiOnly" : null, changesExisting: r.modifiesExisting ? !r.modifiesExisting.unchanged : false, errors: r.errors, warnings: r.warnings, fills: r.fills })),
    files: { report: join2(outDir, "build.json"), payloads: join2(outDir, "payloads") },
    next: report.ok ? "Run propose, then show the proposal to the user. Nothing has been written to Contentful." : "Fix the errors in the plan and build again. Nothing has been written to Contentful."
  });
  return report.ok ? 0 : 1;
}

// src/skills/exo-content-bindings/commands/propose.mjs
var propose_exports = {};
__export(propose_exports, {
  run: () => run3,
  usage: () => usage3
});
import { existsSync, readFileSync as readFileSync3, writeFileSync as writeFileSync3 } from "node:fs";
import { join as join3 } from "node:path";
var usage3 = `propose --plan <plan.json> --out-dir <dir> [--title <text>]

Render the plan as proposal.html: a review page for the person who approves the binding sets.

  --plan <file>      the plan (references/plan-format.md)
  --out-dir <dir>    the working directory (needs discovery.json; uses build.json when present)
  --title <text>     page title (default "Binding proposal")

Writes <dir>/proposal.html and prints JSON with its path. No network access.`;
async function run3(argv2) {
  const { plan: planFile, "out-dir": outDir, title = "Binding proposal" } = flags(argv2, { plan: { type: "string" }, "out-dir": { type: "string" }, title: { type: "string" } }, ["plan", "out-dir"]);
  const plan = JSON.parse(readFileSync3(planFile, "utf8"));
  const discovery = JSON.parse(readFileSync3(join3(outDir, "discovery.json"), "utf8"));
  const build = existsSync(join3(outDir, "build.json")) ? JSON.parse(readFileSync3(join3(outDir, "build.json"), "utf8")) : null;
  const owners = Object.fromEntries([...discovery.components, ...discovery.templates].map((s) => [`${s.kind}/${s.id}`, s]));
  const ctByName = { ...discovery.contentModel, ...Object.fromEntries(Object.values(discovery.contentModel).map((c) => [c.contentTypeId, c])) };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const human = (path) => path.replace(/CursorCollection\/items/g, " (each item)").replace(/\/url$/, " image URL").replace(/\//g, " \u2192 ");
  function fillsOf(recipe) {
    const out = [];
    const walk = (expr, target, prefix = "") => {
      if (typeof expr === "string") {
        out.push({ target, path: prefix + expr });
        return;
      }
      if (!expr || typeof expr !== "object") {
        out.push({ target, path: `fixed value ${JSON.stringify(expr)}` });
        return;
      }
      if ("$literal" in expr) {
        out.push({ target, path: `fixed value ${JSON.stringify(expr.$literal)}` });
        return;
      }
      if ("$on" in expr) {
        for (const [t, sub] of Object.entries(expr.$on.type || {})) walk(sub, target, `${prefix}[when it is a ${ctByName[t]?.displayName || t}] `);
        return;
      }
      if ("$from" in expr) {
        const f = expr.$from;
        if (typeof f === "string") {
          out.push({ target, path: `everything from ${f.replace("$resolvers/", "child recipe ")}` });
          return;
        }
        const src = (f.source || "").startsWith("$resolvers/") ? "" : f.source ? f.source + "/" : "";
        if (f.select === void 0) {
          out.push({ target, path: prefix + (f.source || "").replace("$resolvers/", "child recipe ") });
          return;
        }
        walk(f.select, target, prefix + src);
        return;
      }
      for (const [k, v] of Object.entries(expr)) walk(v, `${target}.${k}`, prefix);
    };
    for (const [k, v] of Object.entries(recipe.return || {})) walk(v, k);
    return out;
  }
  const params = (p) => Array.isArray(p) ? p : Object.entries(p || {}).map(([id, x]) => ({ id, ...x }));
  let cards = "";
  for (const recipe of plan.recipes || []) {
    const targets = (recipe.linkTo || []).map((t) => owners[`${t.kind}/${t.id}`]).filter(Boolean);
    const propName = (key) => {
      const [root, sub] = key.split(".");
      const p = targets[0]?.contentProperties.find((x) => x.id === root);
      return (p?.name || root) + (sub ? ` \u203A ${sub}` : "");
    };
    const b = build?.recipes.find((r) => r.id === recipe.id);
    const rv = recipe.review || {};
    const picks = params(recipe.parameters).map((p) => p.allowedTypes ? `<li><b>${esc(p.name || p.id)}</b> \u2014 one <i>${esc(p.allowedTypes.map((t) => ctByName[t]?.displayName || t).join(" or "))}</i> entry${p.required === false ? " (optional)" : ""}</li>` : `<li><b>${esc(p.name || p.id)}</b> \u2014 ${esc(p.type)}${p.fields ? ": " + esc(p.fields.map((f) => `${f.id}${f.fallbackValue !== void 0 ? " = " + JSON.stringify(f.fallbackValue) : ""}`).join(", ")) : ""}${p.locked !== false && p.type === "Record" ? " (fixed, not editable per page)" : ""}</li>`);
    if (recipe.collection) picks.push(`<li><b>Nothing to pick</b> \u2014 items come from a query: ${esc(ctByName[recipe.collection.contentTypeName]?.displayName || recipe.collection.contentTypeName)}, ${recipe.collection.limit ? "up to " + esc(JSON.stringify(recipe.collection.limit)) + ", " : ""}${recipe.collection.order ? "ordered by " + esc(recipe.collection.order.map((o) => typeof o === "string" ? o : `${o.path} ${String(o.direction).toLowerCase() === "desc" ? "newest first" : "oldest first"}`).join(", ")) : "default order"}</li>`);
    const fills = fillsOf(recipe).map((f) => `<tr><td>${esc(propName(f.target))}</td><td>${esc(human(f.path))}</td><td class="note">${esc(rv.derived?.[f.target] || rv.derived?.[f.target.split(".")[0]] || "")}</td></tr>`).join("");
    const notUsed = Object.entries(rv.notUsed || {}).map(([k, why]) => `<li><b>${esc(propName(k))}</b> \u2014 ${esc(why)}</li>`).join("");
    const unfilled = targets.flatMap((t) => t.contentProperties.filter((p) => !(p.id in (recipe.return || {})) && !(rv.notUsed || {})[p.id]).map((p) => `<li class="warn"><b>${esc(p.name)}</b>${p.required ? " (required)" : ""} \u2014 not filled and not explained</li>`)).join("");
    const alts = (rv.alternatives || []).map((a) => `<li>${esc(a)}</li>`).join("");
    const qs = (rv.questions || []).map((q) => `<li>${esc(q)}</li>`).join("");
    const modifies = b?.modifiesExisting?.unchanged ? `<span class="pill">same as existing recipe \u201C${esc(b.modifiesExisting.name)}\u201D: nothing would change</span> ` : b?.modifiesExisting ? `<span class="pill warn">changes existing recipe \u201C${esc(b.modifiesExisting.name)}\u201D${b.modifiesExisting.published ? " (published)" : ""}</span> ` : (discovery.existingBindingSets || []).some((d) => d.id === recipe.id) ? `<span class="pill warn">changes an existing recipe</span> ` : "";
    const ed = b?.editor;
    const uiPill = !ed ? "" : ed.editable ? '<span class="pill ok">editable in the UI</span> ' : `<span class="pill bad">API only${ed.apiOnlyReason ? " \u2014 needs your confirmation" : ""}</span> `;
    const apiOnlyBlock = ed && !ed.editable ? `<div class="apionly"><h3>API only: read-only in the component editor</h3><p>Editors will see this binding set but cannot review, change or remove it in the UI; every later change needs the API (or this skill). Why: </p><ul>${ed.causes.map((c) => `<li><b>${esc(c.where)}</b> ${esc(c.why)}</li>`).join("")}</ul>${ed.apiOnlyReason ? `<p><b>Why we still propose it:</b> ${esc(ed.apiOnlyReason)}</p><p class="ask">Confirm explicitly if you want this. Otherwise we choose an editable design instead.</p>` : '<p class="ask">This will not be created as it stands. It needs an editable redesign, or your explicit agreement to an API-only recipe.</p>'}</div>` : "";
    const status = modifies + uiPill + (b ? b.errors.length ? `<span class="pill bad">${b.errors.length} problem${b.errors.length > 1 ? "s" : ""}</span>` : `<span class="pill ok">validated against the schema</span>` : `<span class="pill">not built yet</span>`);
    const issues = b ? [...b.errors.map((e) => `<li class="bad">${esc(e)}</li>`), ...b.warnings.map((w) => `<li class="warn">${esc(w)}</li>`)].join("") : "";
    cards += `
<section class="card" id="${esc(recipe.id)}">
  <header><h2>${esc(targets.map((t) => t.name).join(", ") || "(no component)")} <small>${esc(targets.map((t) => `${t.implementation.toLowerCase()} ${t.kind.slice(0, -1)}`).join(", "))}</small></h2>
  <div>Binding set <b>${esc(recipe.name || recipe.id)}</b> ${status}</div></header>
  ${rv.summary ? `<p class="summary">${esc(rv.summary)}</p>` : ""}
  ${apiOnlyBlock}
  <div class="cols">
    <div><h3>The editor picks</h3><ul>${picks.join("") || "<li>nothing \u2014 fully derived</li>"}</ul>${rv.picks ? `<p class="note">${esc(rv.picks)}</p>` : ""}</div>
    <div><h3>Filled automatically</h3><table><thead><tr><th>Property</th><th>Comes from</th><th></th></tr></thead><tbody>${fills}</tbody></table></div>
  </div>
  ${notUsed || unfilled ? `<h3>Left alone</h3><ul>${notUsed}${unfilled}</ul>` : ""}
  ${alts ? `<h3>Alternatives considered</h3><ul>${alts}</ul>` : ""}
  ${qs ? `<h3 class="ask">Questions for you</h3><ul class="ask">${qs}</ul>` : ""}
  ${issues ? `<h3>Validation</h3><ul>${issues}</ul>` : ""}
  ${b?.queries ? `<details><summary>Technical detail (generated queries)</summary><pre>${esc(Object.entries(b.queries).map(([k, q]) => `# ${k}
${q}`).join("\n\n"))}</pre></details>` : ""}
</section>`;
  }
  const untouched = [...discovery.components, ...discovery.templates].filter((s) => s.contentProperties.length && !(s.bindingSets || []).length && !(plan.recipes || []).some((r) => (r.linkTo || []).some((t) => t.id === s.id)));
  const noProps = [...discovery.components, ...discovery.templates].filter((s) => !s.contentProperties.length);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>
:root{--bg:#fff;--fg:#1c1c1e;--muted:#6b6f76;--line:#e3e5e8;--ok:#1b7f3b;--bad:#b3261e;--warn:#9a6700;--ask:#2a5bd7;--card:#fafafa}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#111214;--fg:#e8e8ea;--muted:#9a9ea6;--line:#2a2d33;--card:#17181b;--ok:#4fbf72;--bad:#f28b82;--warn:#e3b341;--ask:#8ab4f8}}
body{margin:0;padding:24px 16px;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:1100px;margin-inline:auto}
h1{font-size:24px;margin:0 0 4px}h2{font-size:18px;margin:0}h2 small{color:var(--muted);font-weight:400;font-size:13px;margin-left:6px}h3{font-size:14px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin:18px 0 6px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:18px 20px;margin:18px 0}
.card header{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;border-bottom:1px solid var(--line);padding-bottom:10px}
.cols{display:grid;grid-template-columns:1fr 2fr;gap:20px}@media(max-width:760px){.cols{grid-template-columns:1fr}}
table{border-collapse:collapse;width:100%}td,th{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top}th{color:var(--muted);font-weight:500;font-size:13px}
ul{margin:0;padding-left:18px}li{margin:3px 0}.note{color:var(--muted);font-size:13px}.summary{font-size:16px;margin:12px 0 4px}
.pill{display:inline-block;font-size:12px;padding:2px 8px;border-radius:999px;border:1px solid var(--line);color:var(--muted)}.pill.ok{color:var(--ok);border-color:var(--ok)}.pill.bad{color:var(--bad);border-color:var(--bad)}.pill.warn{color:var(--warn);border-color:var(--warn)}
li.bad{color:var(--bad)}li.warn{color:var(--warn)}.ask,ul.ask li{color:var(--ask)}
.apionly{border:1px solid var(--bad);border-radius:8px;padding:4px 14px 10px;margin:12px 0}.apionly h3{color:var(--bad)}
details{margin-top:12px}summary{cursor:pointer;color:var(--muted);font-size:13px}pre{font-size:12px;overflow:auto;background:var(--bg);border:1px solid var(--line);padding:10px;border-radius:6px}
.toc{columns:2;font-size:14px}@media(max-width:600px){.toc{columns:1}}
</style></head><body>
<h1>${esc(title)}</h1>
<p class="note">${esc(discovery.source.spaceId)} / ${esc(discovery.source.environmentId)} \xB7 ${(plan.recipes || []).length} binding set${(plan.recipes || []).length === 1 ? "" : "s"} proposed \xB7 nothing has been created yet</p>
${plan.intent ? `<section class="card"><h3>What we are enabling</h3><p class="summary">${esc(plan.intent.summary || "")}</p>${plan.intent.contract ? `<ul>${Object.entries(plan.intent.contract).map(([k, v]) => `<li><b>${esc(k)}:</b> ${esc(v)}</li>`).join("")}</ul>` : ""}${plan.intent.assumptions?.length ? `<h3>Assumptions to confirm</h3><ul class="ask">${plan.intent.assumptions.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` : ""}</section>` : ""}
<ul class="toc">${(plan.recipes || []).map((r) => `<li><a href="#${esc(r.id)}">${esc((r.linkTo || []).map((t) => owners[`${t.kind}/${t.id}`]?.name || t.id).join(", "))}</a> \u2014 ${esc(r.name || r.id)}</li>`).join("")}</ul>
${cards}
${untouched.length ? `<section class="card"><h3>Not part of this proposal: has content properties and no binding set yet</h3><ul>${untouched.map((s) => `<li><b>${esc(s.name)}</b> (${esc(s.kind.slice(0, -1))}) \u2014 ${esc(s.contentProperties.map((p) => p.name).join(", "))}</li>`).join("")}</ul></section>` : ""}
${noProps.length ? `<p class="note">Layout only, nothing to bind: ${esc(noProps.map((s) => s.name).join(", "))}.</p>` : ""}
</body></html>`;
  writeFileSync3(join3(outDir, "proposal.html"), html);
  emit({ ok: true, files: { proposal: join3(outDir, "proposal.html") }, next: "Open the proposal for the user, or describe it, and wait for their decision." });
}

// src/skills/exo-content-bindings/commands/apply.mjs
var apply_exports = {};
__export(apply_exports, {
  run: () => run4,
  usage: () => usage4
});
import { readdirSync, readFileSync as readFileSync4, writeFileSync as writeFileSync4 } from "node:fs";
import { join as join4 } from "node:path";
var usage4 = `apply --env-file <file> --out-dir <dir> --approved [--only <id,id>] [--no-publish]
      [--allow-api-only <id,id>] [--publish-owners]

Create or update the binding sets build generated, publish them, and offer them on their components/templates.
THIS WRITES TO CONTENTFUL. Run it only after the user approved the proposal.

  --env-file <file>          credentials file (see discover)
  --out-dir <dir>            the working directory build wrote payloads to
  --approved                 required: confirms the user approved these recipes in this conversation
  --only <id,id>             apply only these recipes (the ones the user approved)
  --no-publish               save as drafts
  --allow-api-only <id,id>   recipes the user explicitly agreed to keep read-only in the component editor
  --publish-owners           also publish the components/templates, children first (a visible change for editors)

Prints JSON: per recipe what was saved, published and linked, then a read-back check including whether the
component editor can edit what the server stored. Exit 2 when refused (no --approved, an API-only recipe without
--allow-api-only), exit 1 when a write or the read-back check failed.`;
async function run4(argv2) {
  const f = flags(argv2, { "env-file": { type: "string" }, "out-dir": { type: "string" }, approved: { type: "boolean" }, only: { type: "string" }, "no-publish": { type: "boolean" }, "allow-api-only": { type: "string" }, "publish-owners": { type: "boolean" } }, ["env-file", "out-dir"]);
  const envFile = f["env-file"], outDir = f["out-dir"];
  const flag = (n) => !!f[n.replace(/^--/, "")];
  const only = list(f.only), allowApiOnly = list(f["allow-api-only"]);
  if (!flag("--approved")) throw new CliError("Refusing to write: pass --approved after the user has approved the proposal.", 2);
  const creds = loadEnv(envFile);
  const api = cma(creds, join4(outDir, "api_log.jsonl"));
  const payloads = readdirSync(join4(outDir, "payloads")).filter((f2) => f2.endsWith(".json")).map((f2) => JSON.parse(readFileSync4(join4(outDir, "payloads", f2), "utf8"))).filter((p) => !only.length || only.includes(p.body.sys.id));
  const blocked = payloads.filter((p) => !p.editor || !p.editor.editable && !allowApiOnly.includes(p.body.sys.id));
  if (blocked.length) throw new CliError(blocked.map((p) => p.editor ? `Refusing ${p.body.sys.id}: API only \u2014 the component editor would show it read-only (${p.editor.causes.map((c) => `${c.where} ${c.why}`).join("; ")}). Pass --allow-api-only ${p.body.sys.id} only after the user explicitly confirmed this recipe, or leave it out with --only.` : `Refusing ${p.body.sys.id}: payload has no editor check. Run build again.`).join("\n"), 2);
  const ids = new Set(payloads.map((p) => p.body.sys.id));
  const dependsOn = (p) => Object.values(p.body.resolvers || {}).filter((r) => r.source === "Contentful:DataAssembly").map((r) => r.dataAssembly?.sys?.urn && typeIdFromUrn(r.dataAssembly.sys.urn)).filter((d) => ids.has(d));
  const ordered = [];
  const seen = /* @__PURE__ */ new Set();
  const visit2 = (p) => {
    if (seen.has(p.body.sys.id)) return;
    seen.add(p.body.sys.id);
    for (const d of dependsOn(p)) visit2(payloads.find((x) => x.body.sys.id === d));
    ordered.push(p);
  };
  payloads.forEach(visit2);
  const schema = await loadSchema(creds, join4(outDir, "api_log.jsonl"));
  const results = [];
  for (const { body, linkTo } of ordered) {
    const id = body.sys.id;
    const r = { id, linkTo: linkTo.map((t) => `${t.kind}/${t.id}`) };
    const existing = await api.call("GET", `/data_assemblies/${id}`);
    const put = await api.call("PUT", `/data_assemblies/${id}`, { body, version: existing.ok ? existing.json.sys.version : void 0 });
    r.save = existing.ok ? `updated (${put.status})` : `created (${put.status})`;
    if (!put.ok) {
      r.error = put.json.message;
      r.details = put.json.details?.errors?.map((e) => e.message);
      results.push(r);
      continue;
    }
    let version = put.json.sys.version;
    if (!flag("--no-publish")) {
      const pub = await api.call("PUT", `/data_assemblies/${id}/published`, { version });
      r.publish = pub.status;
      if (!pub.ok) r.error = pub.json.message;
    }
    r.link = [];
    for (const t of linkTo) {
      const path = `/${t.kind === "templates" ? "experience_templates" : "components"}/${t.id}`;
      const cur = await api.call("GET", path);
      if (!cur.ok) {
        r.link.push(`${t.id}: GET ${cur.status}`);
        continue;
      }
      const links = cur.json.dataAssemblies || [];
      if (links.some((l) => typeIdFromUrn(l.sys.urn) === id)) {
        r.link.push(`${t.id}: already linked`);
        continue;
      }
      links.push({ sys: { type: "ResourceLink", linkType: "Contentful:DataAssembly", urn: `${EXPERIENCE_SOURCE}/dataAssemblies/${id}` } });
      const { sys, ...rest } = cur.json;
      const upd = await api.call("PUT", path, { body: { ...rest, dataAssemblies: links }, version: sys.version });
      r.link.push(`${t.id}: ${upd.ok ? "linked" : "FAILED " + upd.status + " " + (upd.json.message || "")}`);
      if (upd.ok && sys.publishedVersion) r.link.push(`${t.id}: note \u2014 this ${t.kind.slice(0, -1)} has a published version that does not include the new link; publish it when ready`);
    }
    results.push(r);
  }
  const published = [];
  if (flag("--publish-owners")) {
    const all = (await api.list("/components")).items || [];
    const kids = (nodes, acc = /* @__PURE__ */ new Set()) => {
      for (const n of nodes || []) {
        const u = (n.component || n.componentType)?.sys?.urn;
        if (u) acc.add(typeIdFromUrn(u));
        for (const s of Object.values(n.slots || {})) kids(Array.isArray(s) ? s : [s], acc);
        if (n.componentTree) kids(n.componentTree, acc);
      }
      return acc;
    };
    const slotKids = (c) => (c.slots || []).flatMap((s) => (s.allowedResources || []).flatMap((r) => r.allowedTypes || []));
    const deps = Object.fromEntries(all.map((c) => [c.sys.id, [.../* @__PURE__ */ new Set([...kids(c.componentTree), ...slotKids(c)])]]));
    const wanted = [...new Set(ordered.flatMap((p) => p.linkTo.filter((t) => t.kind === "components").map((t) => t.id)))];
    const order = [], seen2 = /* @__PURE__ */ new Set();
    const visit3 = (id) => {
      if (seen2.has(id)) return;
      seen2.add(id);
      for (const d of deps[id] || []) visit3(d);
      order.push(id);
    };
    wanted.forEach(visit3);
    for (const id of order) {
      const s = (await api.call("GET", `/components/${id}`)).json.sys;
      if (s.publishedVersion === s.version - 1) {
        published.push({ kind: "components", id, result: "already up to date" });
        continue;
      }
      const pub = await api.call("PUT", `/components/${id}/published`, { version: s.version });
      published.push({ kind: "components", id, result: pub.ok ? "published" : "FAILED " + (pub.json.details?.errors?.map((e) => e.message || e.details).join("; ") || pub.json.message) });
    }
    for (const t of ordered.flatMap((p) => p.linkTo.filter((t2) => t2.kind === "templates"))) {
      const s = (await api.call("GET", `/experience_templates/${t.id}`)).json.sys;
      if (s.publishedVersion === s.version - 1) continue;
      const pub = await api.call("PUT", `/experience_templates/${t.id}/published`, { version: s.version });
      published.push({ kind: "templates", id: t.id, result: pub.ok ? "published" : "FAILED " + (pub.json.message || pub.status) });
    }
  }
  const verify = [];
  const savedDas = Object.fromEntries(((await api.list("/data_assemblies")).items || []).map((d) => [d.sys.id, d]));
  for (const { body, linkTo } of ordered) {
    const id = body.sys.id;
    const got = await api.call("GET", `/data_assemblies/${id}`);
    const v = { id, exists: got.ok, published: got.ok && !!got.json.sys.publishedVersion, upToDate: got.ok && got.json.sys.publishedVersion === got.json.sys.version - 1, linkedFrom: [] };
    if (got.ok) {
      const e = editorCheck(schema, got.json, savedDas);
      v.editableInUi = e.editable;
      v.editorState = e.state;
      v.editorCauses = e.causes;
      v.expectedApiOnly = allowApiOnly.includes(id);
    }
    for (const t of linkTo) {
      const o = await api.call("GET", `/${t.kind === "templates" ? "experience_templates" : "components"}/${t.id}`);
      if (o.ok && (o.json.dataAssemblies || []).some((l) => typeIdFromUrn(l.sys.urn) === id)) v.linkedFrom.push(t.id);
    }
    verify.push(v);
  }
  const surprise = verify.filter((v) => v.editableInUi === false && !v.expectedApiOnly);
  const failed = results.filter((r) => r.error).length + surprise.length + published.filter((p) => p.result.startsWith("FAILED")).length;
  const outcome = {
    ok: !failed,
    at: (/* @__PURE__ */ new Date()).toISOString(),
    results,
    publishedOwners: published,
    verify: verify.map((v) => ({ ...v, state: !v.exists ? "MISSING" : v.editableInUi ? "editable in the component editor" : v.expectedApiOnly ? "API only (confirmed by the user)" : "API ONLY \u2014 NOT EXPECTED" })),
    problems: surprise.length ? [`${surprise.length} saved recipe(s) are API only although build found them editable: tell the user, and fix or remove them (${surprise.map((v) => v.id).join(", ")}).`] : [],
    files: { report: join4(outDir, "apply.json"), apiLog: join4(outDir, "api_log.jsonl") },
    next: "Ask the user to open each component in the component editor and confirm the new binding sets can be edited there."
  };
  writeFileSync4(join4(outDir, "apply.json"), JSON.stringify(outcome, null, 2));
  emit(outcome);
  return failed ? 1 : 0;
}

// src/skills/exo-content-bindings/main.mjs
var commands = { discover: discover_exports, build: build_exports, propose: propose_exports, apply: apply_exports };
var overview = `Usage: node main.js <command> [flags]

Design and create binding sets (Data Assemblies) for Contentful Experience Orchestration.

Commands, in the order a run uses them:
  discover   read the environment (read-only)
  build      validate a plan against the live schema and generate request bodies (read-only)
  propose    render the plan as a review page for the user (no network)
  apply      write the approved binding sets to Contentful (needs --approved)

Run "node main.js <command> --help" for a command's flags.
Every command prints one JSON document to stdout; messages go to stderr.
Credentials are read from a file passed with --env-file; never pass a token as an argument.`;
var [name, ...argv] = process.argv.slice(2);
var wantsHelp = (args) => args.includes("--help") || args.includes("-h");
if (!name || wantsHelp([name])) {
  console.error(overview);
  process.exit(name ? 0 : 2);
}
var command = commands[name];
if (!command) {
  console.error(`error: unknown command "${name}"

${overview}`);
  process.exit(2);
}
if (wantsHelp(argv)) {
  console.error(`Usage: node main.js ${command.usage}`);
  process.exit(0);
}
if (Number(process.versions.node.split(".")[0]) < 20) {
  console.error(`error: Node.js 20 or newer is required (this is ${process.versions.node}).`);
  process.exit(1);
}
try {
  process.exitCode = await command.run(argv) ?? 0;
} catch (e) {
  console.error(`error: ${e instanceof Error ? e.message : String(e)}`);
  if (e instanceof CliError && e.code === 2) console.error(`
Usage: node main.js ${command.usage}`);
  process.exitCode = e instanceof CliError ? e.code : 1;
}

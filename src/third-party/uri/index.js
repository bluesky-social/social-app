"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  ATP_URI_REGEX: () => ATP_URI_REGEX,
  AtUri: () => AtUri
});
module.exports = __toCommonJS(src_exports);
var ATP_URI_REGEX = /^(at:\/\/)?((?:did:[a-z0-9:%-]+)|(?:[a-z][a-z0-9.:-]*))(\/[^?#\s]*)?(\?[^#\s]+)?(#[^\s]+)?$/i;
var RELATIVE_REGEX = /^(\/[^?#\s]*)?(\?[^#\s]+)?(#[^\s]+)?$/i;
var AtUri = class {
  constructor(uri, base) {
    let parsed;
    if (base) {
      parsed = parse(base);
      if (!parsed) {
        throw new Error(`Invalid at uri: ${base}`);
      }
      const relativep = parseRelative(uri);
      if (!relativep) {
        throw new Error(`Invalid path: ${uri}`);
      }
      Object.assign(parsed, relativep);
    } else {
      parsed = parse(uri);
      if (!parsed) {
        throw new Error(`Invalid at uri: ${uri}`);
      }
    }
    this.hash = parsed.hash;
    this.host = parsed.host;
    this.pathname = parsed.pathname;
    this.searchParams = parsed.searchParams;
  }
  get protocol() {
    return "at:";
  }
  get origin() {
    return `at://${this.host}`;
  }
  get hostname() {
    return this.host;
  }
  set hostname(v) {
    this.host = v;
  }
  get search() {
    return this.searchParams.toString();
  }
  set search(v) {
    this.searchParams = new URLSearchParams(v);
  }
  get collection() {
    return this.pathname.split("/").filter(Boolean)[0] || "";
  }
  set collection(v) {
    const parts = this.pathname.split("/").filter(Boolean);
    parts[0] = v;
    this.pathname = parts.join("/");
  }
  get rkey() {
    return this.pathname.split("/").filter(Boolean)[1] || "";
  }
  set rkey(v) {
    const parts = this.pathname.split("/").filter(Boolean);
    if (!parts[0])
      parts[0] = "undefined";
    parts[1] = v;
    this.pathname = parts.join("/");
  }
  get href() {
    return this.toString();
  }
  toString() {
    let path = this.pathname || "/";
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }
    let qs = this.searchParams.toString();
    if (qs && !qs.startsWith("?")) {
      qs = `?${qs}`;
    }
    let hash = this.hash;
    if (hash && !hash.startsWith("#")) {
      hash = `#${hash}`;
    }
    return `at://${this.host}${path}${qs}${hash}`;
  }
};
function parse(str) {
  const match = ATP_URI_REGEX.exec(str);
  if (match) {
    return {
      hash: match[5] || "",
      host: match[2] || "",
      pathname: match[3] || "",
      searchParams: new URLSearchParams(match[4] || "")
    };
  }
  return void 0;
}
function parseRelative(str) {
  const match = RELATIVE_REGEX.exec(str);
  if (match) {
    return {
      hash: match[3] || "",
      pathname: match[1] || "",
      searchParams: new URLSearchParams(match[2] || "")
    };
  }
  return void 0;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ATP_URI_REGEX,
  AtUri
});
//# sourceMappingURL=index.js.map

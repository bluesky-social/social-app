"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod2, isNodeMode, target) => (target = mod2 != null ? __create(__getProtoOf(mod2)) : {}, __copyProps(
  isNodeMode || !mod2 || !mod2.__esModule ? __defProp(target, "default", { value: mod2, enumerable: true }) : target,
  mod2
));
var __toCommonJS = (mod2) => __copyProps(__defProp({}, "__esModule", { value: true }), mod2);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  APP_BSKY_GRAPH: () => APP_BSKY_GRAPH,
  APP_BSKY_SYSTEM: () => APP_BSKY_SYSTEM,
  AccountNS: () => AccountNS,
  ActorNS: () => ActorNS,
  AppBskyActorCreateScene: () => createScene_exports,
  AppBskyActorGetProfile: () => getProfile_exports,
  AppBskyActorGetSuggestions: () => getSuggestions_exports,
  AppBskyActorProfile: () => profile_exports,
  AppBskyActorRef: () => ref_exports,
  AppBskyActorSearch: () => search_exports,
  AppBskyActorSearchTypeahead: () => searchTypeahead_exports,
  AppBskyActorUpdateProfile: () => updateProfile_exports,
  AppBskyEmbedExternal: () => external_exports,
  AppBskyEmbedImages: () => images_exports,
  AppBskyFeedFeedViewPost: () => feedViewPost_exports,
  AppBskyFeedGetAuthorFeed: () => getAuthorFeed_exports,
  AppBskyFeedGetPostThread: () => getPostThread_exports,
  AppBskyFeedGetRepostedBy: () => getRepostedBy_exports,
  AppBskyFeedGetTimeline: () => getTimeline_exports,
  AppBskyFeedGetVotes: () => getVotes_exports,
  AppBskyFeedPost: () => post_exports,
  AppBskyFeedRepost: () => repost_exports,
  AppBskyFeedSetVote: () => setVote_exports,
  AppBskyFeedTrend: () => trend_exports,
  AppBskyFeedVote: () => vote_exports,
  AppBskyGraphAssertCreator: () => assertCreator_exports,
  AppBskyGraphAssertMember: () => assertMember_exports,
  AppBskyGraphAssertion: () => assertion_exports,
  AppBskyGraphConfirmation: () => confirmation_exports,
  AppBskyGraphFollow: () => follow_exports,
  AppBskyGraphGetAssertions: () => getAssertions_exports,
  AppBskyGraphGetFollowers: () => getFollowers_exports,
  AppBskyGraphGetFollows: () => getFollows_exports,
  AppBskyGraphGetMembers: () => getMembers_exports,
  AppBskyGraphGetMemberships: () => getMemberships_exports,
  AppBskyNotificationGetCount: () => getCount_exports,
  AppBskyNotificationList: () => list_exports,
  AppBskyNotificationUpdateSeen: () => updateSeen_exports,
  AppBskySystemActorScene: () => actorScene_exports,
  AppBskySystemActorUser: () => actorUser_exports,
  AppBskySystemDeclRef: () => declRef_exports,
  AppBskySystemDeclaration: () => declaration_exports,
  AppNS: () => AppNS,
  AssertionRecord: () => AssertionRecord,
  AtprotoNS: () => AtprotoNS,
  BlobNS: () => BlobNS,
  BskyNS: () => BskyNS,
  Client: () => Client2,
  ComAtprotoAccountCreate: () => create_exports,
  ComAtprotoAccountCreateInviteCode: () => createInviteCode_exports,
  ComAtprotoAccountDelete: () => delete_exports,
  ComAtprotoAccountGet: () => get_exports,
  ComAtprotoAccountRequestPasswordReset: () => requestPasswordReset_exports,
  ComAtprotoAccountResetPassword: () => resetPassword_exports,
  ComAtprotoBlobUpload: () => upload_exports,
  ComAtprotoHandleResolve: () => resolve_exports,
  ComAtprotoRepoBatchWrite: () => batchWrite_exports,
  ComAtprotoRepoCreateRecord: () => createRecord_exports,
  ComAtprotoRepoDeleteRecord: () => deleteRecord_exports,
  ComAtprotoRepoDescribe: () => describe_exports,
  ComAtprotoRepoGetRecord: () => getRecord_exports,
  ComAtprotoRepoListRecords: () => listRecords_exports,
  ComAtprotoRepoPutRecord: () => putRecord_exports,
  ComAtprotoRepoStrongRef: () => strongRef_exports,
  ComAtprotoServerGetAccountsConfig: () => getAccountsConfig_exports,
  ComAtprotoSessionCreate: () => create_exports2,
  ComAtprotoSessionDelete: () => delete_exports2,
  ComAtprotoSessionGet: () => get_exports2,
  ComAtprotoSessionRefresh: () => refresh_exports,
  ComAtprotoSyncGetRepo: () => getRepo_exports,
  ComAtprotoSyncGetRoot: () => getRoot_exports,
  ComAtprotoSyncUpdateRepo: () => updateRepo_exports,
  ComNS: () => ComNS,
  ConfirmationRecord: () => ConfirmationRecord,
  DeclarationRecord: () => DeclarationRecord,
  EmbedNS: () => EmbedNS,
  FeedNS: () => FeedNS,
  FollowRecord: () => FollowRecord,
  GraphNS: () => GraphNS,
  HandleNS: () => HandleNS,
  NotificationNS: () => NotificationNS,
  PostRecord: () => PostRecord,
  ProfileRecord: () => ProfileRecord,
  RepoNS: () => RepoNS,
  RepostRecord: () => RepostRecord,
  ServerNS: () => ServerNS,
  ServiceClient: () => ServiceClient2,
  SessionClient: () => SessionClient,
  SessionManager: () => SessionManager,
  SessionNS: () => SessionNS,
  SessionServiceClient: () => SessionServiceClient,
  SessionXrpcServiceClient: () => SessionXrpcServiceClient,
  SyncNS: () => SyncNS,
  SystemNS: () => SystemNS,
  TrendRecord: () => TrendRecord,
  VoteRecord: () => VoteRecord,
  default: () => client_default,
  sessionClient: () => session_default
});
module.exports = __toCommonJS(src_exports);

// ../../node_modules/zod/lib/index.mjs
var util;
(function(util2) {
  util2.assertEqual = (val) => val;
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object2) => {
    const keys = [];
    for (const key in object2) {
      if (Object.prototype.hasOwnProperty.call(object2, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && isFinite(val) && Math.floor(val) === val;
  function joinValues(array2, separator = " | ") {
    return array2.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class extends Error {
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  get errors() {
    return this.issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
        fieldErrors[sub.path[0]].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be greater than ${issue.inclusive ? `or equal to ` : ``}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be greater than ${issue.inclusive ? `or equal to ` : ``}${new Date(issue.minimum)}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be less than ${issue.inclusive ? `or equal to ` : ``}${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be smaller than ${issue.inclusive ? `or equal to ` : ``}${new Date(issue.maximum)}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var overrideErrorMap = errorMap;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}
var makeIssue = (params2) => {
  const { data, path, errorMaps, issueData } = params2;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: issueData.message || errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      ctx.schemaErrorMap,
      getErrorMap(),
      errorMap
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      syncPairs.push({
        key: await pair.key,
        value: await pair.value
      });
    }
    return ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (typeof value.value !== "undefined" || pair.alwaysSet) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== void 0 && x instanceof Promise;
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message === null || message === void 0 ? void 0 : message.message;
})(errorUtil || (errorUtil = {}));
var ParseInputLazyPath = class {
  constructor(parent, value, path, key) {
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    return this._path.concat(this._key);
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    const error = new ZodError(ctx.common.issues);
    return { success: false, error };
  }
};
function processCreateParams(params2) {
  if (!params2)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params2;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    if (typeof ctx.data === "undefined") {
      return { message: required_error !== null && required_error !== void 0 ? required_error : ctx.defaultError };
    }
    return { message: invalid_type_error !== null && invalid_type_error !== void 0 ? invalid_type_error : ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  constructor(def) {
    this.spa = this.safeParseAsync;
    this.superRefine = this._refinement;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.default = this.default.bind(this);
    this.describe = this.describe.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
  }
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params2) {
    const result = this.safeParse(data, params2);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params2) {
    var _a;
    const ctx = {
      common: {
        issues: [],
        async: (_a = params2 === null || params2 === void 0 ? void 0 : params2.async) !== null && _a !== void 0 ? _a : false,
        contextualErrorMap: params2 === null || params2 === void 0 ? void 0 : params2.errorMap
      },
      path: (params2 === null || params2 === void 0 ? void 0 : params2.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  async parseAsync(data, params2) {
    const result = await this.safeParseAsync(data, params2);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params2) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params2 === null || params2 === void 0 ? void 0 : params2.errorMap,
        async: true
      },
      path: (params2 === null || params2 === void 0 ? void 0 : params2.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: [], parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  optional() {
    return ZodOptional.create(this);
  }
  nullable() {
    return ZodNullable.create(this);
  }
  nullish() {
    return this.optional().nullable();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this);
  }
  or(option) {
    return ZodUnion.create([this, option]);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming);
  }
  transform(transform) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(void 0)
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var uuidRegex = /^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}|00000000-0000-0000-0000-000000000000)$/i;
var emailRegex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
var ZodString = class extends ZodType {
  constructor() {
    super(...arguments);
    this._regex = (regex, validation, message) => this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
    this.nonempty = (message) => this.min(1, errorUtil.errToObj(message));
    this.trim = () => new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(
        ctx2,
        {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.string,
          received: ctx2.parsedType
        }
      );
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch (_a) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _addCheck(check) {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this.min(len, message).max(len, message);
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params2) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    ...processCreateParams(params2)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / Math.pow(10, decCount);
}
var ZodNumber = class extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int");
  }
};
ZodNumber.create = (params2) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    ...processCreateParams(params2)
  });
};
var ZodBigInt = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.bigint,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBigInt.create = (params2) => {
  return new ZodBigInt({
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    ...processCreateParams(params2)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params2) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    ...processCreateParams(params2)
  });
};
var ZodDate = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params2) => {
  return new ZodDate({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params2)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params2) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params2)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params2) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params2)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params2) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params2)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params2) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params2)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params2) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params2)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params2) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params2)
  });
};
var ZodArray = class extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all(ctx.data.map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = ctx.data.map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return this.min(len, message).max(len, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params2) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params2)
  });
};
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
    };
  };
})(objectUtil || (objectUtil = {}));
var AugmentFactory = (def) => (augmentation) => {
  return new ZodObject({
    ...def,
    shape: () => ({
      ...def.shape(),
      ...augmentation
    })
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return ZodArray.create(deepPartialify(schema.element));
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = AugmentFactory(this._def);
    this.extend = AugmentFactory(this._def);
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    return this._cached = { shape, keys };
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip")
        ;
      else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          syncPairs.push({
            key,
            value: await pair.value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          var _a, _b, _c, _d;
          const defaultError = (_c = (_b = (_a = this._def).errorMap) === null || _b === void 0 ? void 0 : _b.call(_a, issue, ctx).message) !== null && _c !== void 0 ? _c : ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: (_d = errorUtil.errToObj(message).message) !== null && _d !== void 0 ? _d : defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  merge(merging) {
    const merged = new ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  catchall(index) {
    return new ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    util.objectKeys(mask).map((key) => {
      if (this.shape[key])
        shape[key] = this.shape[key];
    });
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    util.objectKeys(this.shape).map((key) => {
      if (util.objectKeys(mask).indexOf(key) === -1) {
        shape[key] = this.shape[key];
      }
    });
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    if (mask) {
      util.objectKeys(this.shape).map((key) => {
        if (util.objectKeys(mask).indexOf(key) === -1) {
          newShape[key] = this.shape[key];
        } else {
          newShape[key] = this.shape[key].optional();
        }
      });
      return new ZodObject({
        ...this._def,
        shape: () => newShape
      });
    } else {
      for (const key in this.shape) {
        const fieldSchema = this.shape[key];
        newShape[key] = fieldSchema.optional();
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required() {
    const newShape = {};
    for (const key in this.shape) {
      const fieldSchema = this.shape[key];
      let newField = fieldSchema;
      while (newField instanceof ZodOptional) {
        newField = newField._def.innerType;
      }
      newShape[key] = newField;
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params2) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params2)
  });
};
ZodObject.strictCreate = (shape, params2) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params2)
  });
};
ZodObject.lazycreate = (shape, params2) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params2)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params2) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params2)
  });
};
var ZodDiscriminatedUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.options.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: this.validDiscriminatorValues,
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get validDiscriminatorValues() {
    return Array.from(this.options.keys());
  }
  get options() {
    return this._def.options;
  }
  static create(discriminator, types, params2) {
    const options = /* @__PURE__ */ new Map();
    try {
      types.forEach((type) => {
        const discriminatorValue = type.shape[discriminator].value;
        options.set(discriminatorValue, type);
      });
    } catch (e) {
      throw new Error("The discriminator value could not be extracted from all the provided schemas");
    }
    if (options.size !== types.length) {
      throw new Error("Some of the discriminator values are not unique");
    }
    return new ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      ...processCreateParams(params2)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params2) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params2)
  });
};
var ZodTuple = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        type: "array"
      });
      status.dirty();
    }
    const items = ctx.data.map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas2, params2) => {
  if (!Array.isArray(schemas2)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas2,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params2)
  });
};
var ZodRecord = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key))
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params2) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params2)
  });
};
var ZodSet = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params2) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params2)
  });
};
var ZodFunction = class extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [
          ctx.common.contextualErrorMap,
          ctx.schemaErrorMap,
          getErrorMap(),
          errorMap
        ].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [
          ctx.common.contextualErrorMap,
          ctx.schemaErrorMap,
          getErrorMap(),
          errorMap
        ].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params2 = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      return OK(async (...args) => {
        const error = new ZodError([]);
        const parsedArgs = await this._def.args.parseAsync(args, params2).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await fn(...parsedArgs);
        const parsedReturns = await this._def.returns._def.type.parseAsync(result, params2).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      return OK((...args) => {
        const parsedArgs = this._def.args.safeParse(args, params2);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = fn(...parsedArgs.data);
        const parsedReturns = this._def.returns.safeParse(result, params2);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params2) {
    return new ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params2)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params2) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params2)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params2) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params2)
  });
};
function createZodEnum(values, params2) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params2)
  });
}
var ZodEnum = class extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (this._def.values.indexOf(input.data) === -1) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (nativeEnumValues.indexOf(input.data) === -1) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params2) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params2)
  });
};
var ZodPromise = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params2) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params2)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data);
      if (ctx.common.async) {
        return Promise.resolve(processed).then((processed2) => {
          return this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
        });
      } else {
        return this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
      }
    }
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return base;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return base;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({ status: status.value, value: result }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params2) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params2)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params2) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params2)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params2) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params2)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params2) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params2)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params2) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params2)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params2) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params2)
  });
};
var BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var custom = (check, params2 = {}, fatal) => {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      if (!check(data)) {
        const p = typeof params2 === "function" ? params2(data) : params2;
        const p2 = typeof p === "string" ? { message: p } : p;
        ctx.addIssue({ code: "custom", ...p2, fatal });
      }
    });
  return ZodAny.create();
};
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params2 = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params2, true);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var NEVER = INVALID;
var mod = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  getParsedType,
  ZodParsedType,
  defaultErrorMap: errorMap,
  setErrorMap,
  getErrorMap,
  makeIssue,
  EMPTY_PATH,
  addIssueToContext,
  ParseStatus,
  INVALID,
  DIRTY,
  OK,
  isAborted,
  isDirty,
  isValid,
  isAsync,
  ZodType,
  ZodString,
  ZodNumber,
  ZodBigInt,
  ZodBoolean,
  ZodDate,
  ZodUndefined,
  ZodNull,
  ZodAny,
  ZodUnknown,
  ZodNever,
  ZodVoid,
  ZodArray,
  get objectUtil() {
    return objectUtil;
  },
  ZodObject,
  ZodUnion,
  ZodDiscriminatedUnion,
  ZodIntersection,
  ZodTuple,
  ZodRecord,
  ZodMap,
  ZodSet,
  ZodFunction,
  ZodLazy,
  ZodLiteral,
  ZodEnum,
  ZodNativeEnum,
  ZodPromise,
  ZodEffects,
  ZodTransformer: ZodEffects,
  ZodOptional,
  ZodNullable,
  ZodDefault,
  ZodNaN,
  BRAND,
  ZodBranded,
  custom,
  Schema: ZodType,
  ZodSchema: ZodType,
  late,
  get ZodFirstPartyTypeKind() {
    return ZodFirstPartyTypeKind;
  },
  any: anyType,
  array: arrayType,
  bigint: bigIntType,
  boolean: booleanType,
  date: dateType,
  discriminatedUnion: discriminatedUnionType,
  effect: effectsType,
  "enum": enumType,
  "function": functionType,
  "instanceof": instanceOfType,
  intersection: intersectionType,
  lazy: lazyType,
  literal: literalType,
  map: mapType,
  nan: nanType,
  nativeEnum: nativeEnumType,
  never: neverType,
  "null": nullType,
  nullable: nullableType,
  number: numberType,
  object: objectType,
  oboolean,
  onumber,
  optional: optionalType,
  ostring,
  preprocess: preprocessType,
  promise: promiseType,
  record: recordType,
  set: setType,
  strictObject: strictObjectType,
  string: stringType,
  transformer: effectsType,
  tuple: tupleType,
  "undefined": undefinedType,
  union: unionType,
  unknown: unknownType,
  "void": voidType,
  NEVER,
  ZodIssueCode,
  quotelessJson,
  ZodError
});

// ../xrpc/src/types.ts
var errorResponseBody = mod.object({
  error: mod.string().optional(),
  message: mod.string().optional()
});
var ResponseType = /* @__PURE__ */ ((ResponseType2) => {
  ResponseType2[ResponseType2["Unknown"] = 1] = "Unknown";
  ResponseType2[ResponseType2["InvalidResponse"] = 2] = "InvalidResponse";
  ResponseType2[ResponseType2["Success"] = 200] = "Success";
  ResponseType2[ResponseType2["InvalidRequest"] = 400] = "InvalidRequest";
  ResponseType2[ResponseType2["AuthRequired"] = 401] = "AuthRequired";
  ResponseType2[ResponseType2["Forbidden"] = 403] = "Forbidden";
  ResponseType2[ResponseType2["XRPCNotSupported"] = 404] = "XRPCNotSupported";
  ResponseType2[ResponseType2["PayloadTooLarge"] = 413] = "PayloadTooLarge";
  ResponseType2[ResponseType2["RateLimitExceeded"] = 429] = "RateLimitExceeded";
  ResponseType2[ResponseType2["InternalServerError"] = 500] = "InternalServerError";
  ResponseType2[ResponseType2["MethodNotImplemented"] = 501] = "MethodNotImplemented";
  ResponseType2[ResponseType2["UpstreamFailure"] = 502] = "UpstreamFailure";
  ResponseType2[ResponseType2["NotEnoughResouces"] = 503] = "NotEnoughResouces";
  ResponseType2[ResponseType2["UpstreamTimeout"] = 504] = "UpstreamTimeout";
  return ResponseType2;
})(ResponseType || {});
var ResponseTypeNames = {
  [2 /* InvalidResponse */]: "InvalidResponse",
  [200 /* Success */]: "Success",
  [400 /* InvalidRequest */]: "InvalidRequest",
  [401 /* AuthRequired */]: "AuthenticationRequired",
  [403 /* Forbidden */]: "Forbidden",
  [404 /* XRPCNotSupported */]: "XRPCNotSupported",
  [413 /* PayloadTooLarge */]: "PayloadTooLarge",
  [429 /* RateLimitExceeded */]: "RateLimitExceeded",
  [500 /* InternalServerError */]: "InternalServerError",
  [501 /* MethodNotImplemented */]: "MethodNotImplemented",
  [502 /* UpstreamFailure */]: "UpstreamFailure",
  [503 /* NotEnoughResouces */]: "NotEnoughResouces",
  [504 /* UpstreamTimeout */]: "UpstreamTimeout"
};
var ResponseTypeStrings = {
  [2 /* InvalidResponse */]: "Invalid Response",
  [200 /* Success */]: "Success",
  [400 /* InvalidRequest */]: "Invalid Request",
  [401 /* AuthRequired */]: "Authentication Required",
  [403 /* Forbidden */]: "Forbidden",
  [404 /* XRPCNotSupported */]: "XRPC Not Supported",
  [413 /* PayloadTooLarge */]: "Payload Too Large",
  [429 /* RateLimitExceeded */]: "Rate Limit Exceeded",
  [500 /* InternalServerError */]: "Internal Server Error",
  [501 /* MethodNotImplemented */]: "Method Not Implemented",
  [502 /* UpstreamFailure */]: "Upstream Failure",
  [503 /* NotEnoughResouces */]: "Not Enough Resouces",
  [504 /* UpstreamTimeout */]: "Upstream Timeout"
};
var XRPCResponse = class {
  constructor(data, headers) {
    this.data = data;
    this.headers = headers;
    this.success = true;
  }
};
var XRPCError = class extends Error {
  constructor(status, error, message) {
    super(message || error || ResponseTypeStrings[status]);
    this.status = status;
    this.error = error;
    this.success = false;
    if (!this.error) {
      this.error = ResponseTypeNames[status];
    }
  }
};

// ../nsid/src/index.ts
var SEGMENT_RE = /^[a-zA-Z]([a-zA-Z0-9-])*$/;
var NSID = class {
  constructor(nsid) {
    this.segments = [];
    const segments = nsid.split(".");
    if (segments.length <= 2) {
      throw new Error(`Invalid NSID: ${nsid}`);
    }
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      if (SEGMENT_RE.test(segment)) {
        continue;
      }
      if (i === segments.length - 1 && segment === "*") {
        continue;
      }
      throw new Error(`Invalid NSID: invalid character in segment "${segment}"`);
    }
    this.segments = segments;
  }
  static parse(nsid) {
    return new NSID(nsid);
  }
  static create(authority, name) {
    const segments = [...authority.split(".").reverse(), name].join(".");
    return new NSID(segments);
  }
  static isValid(nsid) {
    try {
      NSID.parse(nsid);
      return true;
    } catch (e) {
      return false;
    }
  }
  get authority() {
    return this.segments.slice(0, this.segments.length - 1).reverse().join(".");
  }
  get name() {
    return this.segments.at(this.segments.length - 1);
  }
  toString() {
    return this.segments.join(".");
  }
};

// ../lexicon/src/types.ts
var lexBoolean = mod.object({
  type: mod.literal("boolean"),
  description: mod.string().optional(),
  default: mod.boolean().optional(),
  const: mod.boolean().optional()
});
var lexNumber = mod.object({
  type: mod.literal("number"),
  description: mod.string().optional(),
  default: mod.number().optional(),
  minimum: mod.number().optional(),
  maximum: mod.number().optional(),
  enum: mod.number().array().optional(),
  const: mod.number().optional()
});
var lexInteger = mod.object({
  type: mod.literal("integer"),
  description: mod.string().optional(),
  default: mod.number().int().optional(),
  minimum: mod.number().int().optional(),
  maximum: mod.number().int().optional(),
  enum: mod.number().int().array().optional(),
  const: mod.number().int().optional()
});
var lexString = mod.object({
  type: mod.literal("string"),
  description: mod.string().optional(),
  default: mod.string().optional(),
  minLength: mod.number().int().optional(),
  maxLength: mod.number().int().optional(),
  enum: mod.string().array().optional(),
  const: mod.string().optional(),
  knownValues: mod.string().array().optional()
});
var lexDatetime = mod.object({
  type: mod.literal("datetime"),
  description: mod.string().optional()
});
var lexUnknown = mod.object({
  type: mod.literal("unknown"),
  description: mod.string().optional()
});
var lexPrimitive = mod.union([
  lexBoolean,
  lexNumber,
  lexInteger,
  lexString,
  lexDatetime,
  lexUnknown
]);
var lexRef = mod.object({
  type: mod.literal("ref"),
  description: mod.string().optional(),
  ref: mod.string()
});
var lexRefUnion = mod.object({
  type: mod.literal("union"),
  description: mod.string().optional(),
  refs: mod.string().array(),
  closed: mod.boolean().optional()
});
var lexRefVariant = mod.union([lexRef, lexRefUnion]);
var lexBlob = mod.object({
  type: mod.literal("blob"),
  description: mod.string().optional(),
  accept: mod.string().array().optional(),
  maxSize: mod.number().optional()
});
var lexImage = mod.object({
  type: mod.literal("image"),
  description: mod.string().optional(),
  accept: mod.string().array().optional(),
  maxSize: mod.number().optional(),
  maxWidth: mod.number().int().optional(),
  maxHeight: mod.number().int().optional()
});
var lexVideo = mod.object({
  type: mod.literal("video"),
  description: mod.string().optional(),
  accept: mod.string().array().optional(),
  maxSize: mod.number().optional(),
  maxWidth: mod.number().int().optional(),
  maxHeight: mod.number().int().optional(),
  maxLength: mod.number().int().optional()
});
var lexAudio = mod.object({
  type: mod.literal("audio"),
  description: mod.string().optional(),
  accept: mod.string().array().optional(),
  maxSize: mod.number().optional(),
  maxLength: mod.number().int().optional()
});
var lexBlobVariant = mod.union([lexBlob, lexImage, lexVideo, lexAudio]);
var lexArray = mod.object({
  type: mod.literal("array"),
  description: mod.string().optional(),
  items: mod.union([lexPrimitive, lexBlobVariant, lexRefVariant]),
  minLength: mod.number().int().optional(),
  maxLength: mod.number().int().optional()
});
var lexToken = mod.object({
  type: mod.literal("token"),
  description: mod.string().optional()
});
var lexObject = mod.object({
  type: mod.literal("object"),
  description: mod.string().optional(),
  required: mod.string().array().optional(),
  properties: mod.record(mod.union([lexRefVariant, lexArray, lexBlobVariant, lexPrimitive])).optional()
});
var lexXrpcParameters = mod.object({
  type: mod.literal("params"),
  description: mod.string().optional(),
  required: mod.string().array().optional(),
  properties: mod.record(lexPrimitive)
});
var lexXrpcBody = mod.object({
  description: mod.string().optional(),
  encoding: mod.string(),
  schema: mod.union([lexRefVariant, lexObject]).optional()
});
var lexXrpcError = mod.object({
  name: mod.string(),
  description: mod.string().optional()
});
var lexXrpcQuery = mod.object({
  type: mod.literal("query"),
  description: mod.string().optional(),
  parameters: lexXrpcParameters.optional(),
  output: lexXrpcBody.optional(),
  errors: lexXrpcError.array().optional()
});
var lexXrpcProcedure = mod.object({
  type: mod.literal("procedure"),
  description: mod.string().optional(),
  parameters: lexXrpcParameters.optional(),
  input: lexXrpcBody.optional(),
  output: lexXrpcBody.optional(),
  errors: lexXrpcError.array().optional()
});
var lexRecord = mod.object({
  type: mod.literal("record"),
  description: mod.string().optional(),
  key: mod.string().optional(),
  record: lexObject
});
var lexUserType = mod.union([
  lexRecord,
  lexXrpcQuery,
  lexXrpcProcedure,
  lexBlob,
  lexImage,
  lexVideo,
  lexAudio,
  lexArray,
  lexToken,
  lexObject,
  lexBoolean,
  lexNumber,
  lexInteger,
  lexString,
  lexDatetime,
  lexUnknown
]);
var lexiconDoc = mod.object({
  lexicon: mod.literal(1),
  id: mod.string().refine((v) => NSID.isValid(v), {
    message: "Must be a valid NSID"
  }),
  revision: mod.number().optional(),
  description: mod.string().optional(),
  defs: mod.record(lexUserType)
}).superRefine((doc, ctx) => {
  for (const defId in doc.defs) {
    const def = doc.defs[defId];
    if (defId !== "main" && (def.type === "record" || def.type === "procedure" || def.type === "query")) {
      ctx.addIssue({
        code: mod.ZodIssueCode.custom,
        message: `Records, procedures, and queries must be the main definition.`
      });
    }
  }
});
function isObj(obj) {
  return !!obj && typeof obj === "object";
}
function hasProp(data, prop) {
  return prop in data;
}
var discriminatedObject = mod.object({ $type: mod.string() });
function isDiscriminatedObject(value) {
  return discriminatedObject.safeParse(value).success;
}
var LexiconDocMalformedError = class extends Error {
  constructor(message, schemaDef, issues) {
    super(message);
    this.schemaDef = schemaDef;
    this.issues = issues;
    this.schemaDef = schemaDef;
    this.issues = issues;
  }
};
var ValidationError = class extends Error {
};
var InvalidLexiconError = class extends Error {
};
var LexiconDefNotFoundError = class extends Error {
};

// ../lexicon/src/validators/primitives.ts
function validate(lexicons2, path, def, value) {
  switch (def.type) {
    case "boolean":
      return boolean(lexicons2, path, def, value);
    case "number":
      return number(lexicons2, path, def, value);
    case "integer":
      return integer(lexicons2, path, def, value);
    case "string":
      return string(lexicons2, path, def, value);
    case "datetime":
      return datetime(lexicons2, path, def, value);
    case "unknown":
      return unknown(lexicons2, path, def, value);
    default:
      return {
        success: false,
        error: new ValidationError(`Unexpected lexicon type: ${def.type}`)
      };
  }
}
function boolean(lexicons2, path, def, value) {
  def = def;
  const type = typeof value;
  if (type == "undefined") {
    if (typeof def.default === "boolean") {
      return { success: true };
    }
    return {
      success: false,
      error: new ValidationError(`${path} must be a boolean`)
    };
  } else if (type !== "boolean") {
    return {
      success: false,
      error: new ValidationError(`${path} must be a boolean`)
    };
  }
  if (typeof def.const === "boolean") {
    if (value !== def.const) {
      return {
        success: false,
        error: new ValidationError(`${path} must be ${def.const}`)
      };
    }
  }
  return { success: true };
}
function number(lexicons2, path, def, value) {
  def = def;
  const type = typeof value;
  if (type == "undefined") {
    if (typeof def.default === "number") {
      return { success: true };
    }
    return {
      success: false,
      error: new ValidationError(`${path} must be a number`)
    };
  } else if (type !== "number") {
    return {
      success: false,
      error: new ValidationError(`${path} must be a number`)
    };
  }
  if (typeof def.const === "number") {
    if (value !== def.const) {
      return {
        success: false,
        error: new ValidationError(`${path} must be ${def.const}`)
      };
    }
  }
  if (Array.isArray(def.enum)) {
    if (!def.enum.includes(value)) {
      return {
        success: false,
        error: new ValidationError(
          `${path} must be one of (${def.enum.join("|")})`
        )
      };
    }
  }
  if (typeof def.maximum === "number") {
    if (value > def.maximum) {
      return {
        success: false,
        error: new ValidationError(
          `${path} can not be greater than ${def.maximum}`
        )
      };
    }
  }
  if (typeof def.minimum === "number") {
    if (value < def.minimum) {
      return {
        success: false,
        error: new ValidationError(
          `${path} can not be less than ${def.minimum}`
        )
      };
    }
  }
  return { success: true };
}
function integer(lexicons2, path, def, value) {
  def = def;
  const numRes = number(lexicons2, path, def, value);
  if (!numRes.success) {
    return numRes;
  }
  if (!Number.isInteger(value)) {
    return {
      success: false,
      error: new ValidationError(`${path} must be an integer`)
    };
  }
  return { success: true };
}
function string(lexicons2, path, def, value) {
  def = def;
  const type = typeof value;
  if (type == "undefined") {
    if (typeof def.default === "string") {
      return { success: true };
    }
    return {
      success: false,
      error: new ValidationError(`${path} must be a string`)
    };
  } else if (type !== "string") {
    return {
      success: false,
      error: new ValidationError(`${path} must be a string`)
    };
  }
  if (typeof def.const === "string") {
    if (value !== def.const) {
      return {
        success: false,
        error: new ValidationError(`${path} must be ${def.const}`)
      };
    }
  }
  if (Array.isArray(def.enum)) {
    if (!def.enum.includes(value)) {
      return {
        success: false,
        error: new ValidationError(
          `${path} must be one of (${def.enum.join("|")})`
        )
      };
    }
  }
  if (typeof def.maxLength === "number") {
    if (value.length > def.maxLength) {
      return {
        success: false,
        error: new ValidationError(
          `${path} must not be longer than ${def.maxLength} characters`
        )
      };
    }
  }
  if (typeof def.minLength === "number") {
    if (value.length < def.minLength) {
      return {
        success: false,
        error: new ValidationError(
          `${path} must not be shorter than ${def.minLength} characters`
        )
      };
    }
  }
  return { success: true };
}
function datetime(lexicons2, path, def, value) {
  def = def;
  const type = typeof value;
  if (type !== "string") {
    return {
      success: false,
      error: new ValidationError(`${path} must be a string`)
    };
  }
  {
    try {
      const date = new Date(Date.parse(value));
      if (value !== date.toISOString()) {
        throw new ValidationError(
          `${path} must be an iso8601 formatted datetime`
        );
      }
    } catch {
      throw new ValidationError(`${path} must be an iso8601 formatted datetime`);
    }
  }
  return { success: true };
}
function unknown(lexicons2, path, def, value) {
  if (!value || typeof value !== "object") {
    return {
      success: false,
      error: new ValidationError(`${path} must be an object`)
    };
  }
  return { success: true };
}

// ../lexicon/src/validators/blob.ts
function blob(lexicons2, path, def, value) {
  if (!isObj(value)) {
    return {
      success: false,
      error: new ValidationError(`${path} should be an object`)
    };
  }
  if (!hasProp(value, "cid") || typeof value.cid !== "string") {
    return {
      success: false,
      error: new ValidationError(`${path}/cid should be a string`)
    };
  }
  if (!hasProp(value, "mimeType") || typeof value.mimeType !== "string") {
    return {
      success: false,
      error: new ValidationError(`${path}/mimeType should be a string`)
    };
  }
  return { success: true };
}
function image(lexicons2, path, def, value) {
  return blob(lexicons2, path, def, value);
}
function video(lexicons2, path, def, value) {
  return blob(lexicons2, path, def, value);
}
function audio(lexicons2, path, def, value) {
  return blob(lexicons2, path, def, value);
}

// ../lexicon/src/validators/complex.ts
function validate2(lexicons2, path, def, value) {
  switch (def.type) {
    case "boolean":
      return boolean(lexicons2, path, def, value);
    case "number":
      return number(lexicons2, path, def, value);
    case "integer":
      return integer(lexicons2, path, def, value);
    case "string":
      return string(lexicons2, path, def, value);
    case "datetime":
      return datetime(lexicons2, path, def, value);
    case "unknown":
      return unknown(lexicons2, path, def, value);
    case "object":
      return object(lexicons2, path, def, value);
    case "array":
      return array(lexicons2, path, def, value);
    case "blob":
      return blob(lexicons2, path, def, value);
    case "image":
      return image(lexicons2, path, def, value);
    case "video":
      return video(lexicons2, path, def, value);
    case "audio":
      return audio(lexicons2, path, def, value);
    default:
      return {
        success: false,
        error: new ValidationError(`Unexpected lexicon type: ${def.type}`)
      };
  }
}
function array(lexicons2, path, def, value) {
  def = def;
  if (!Array.isArray(value)) {
    return {
      success: false,
      error: new ValidationError(`${path} must be an array`)
    };
  }
  if (typeof def.maxLength === "number") {
    if (value.length > def.maxLength) {
      return {
        success: false,
        error: new ValidationError(
          `${path} must not have more than ${def.maxLength} elements`
        )
      };
    }
  }
  if (typeof def.minLength === "number") {
    if (value.length < def.minLength) {
      return {
        success: false,
        error: new ValidationError(
          `${path} must not have fewer than ${def.minLength} elements`
        )
      };
    }
  }
  const itemsDef = def.items;
  for (let i = 0; i < value.length; i++) {
    const itemValue = value[i];
    const itemPath = `${path}/${i}`;
    const res = validateOneOf(lexicons2, itemPath, itemsDef, itemValue);
    if (!res.success) {
      return res;
    }
  }
  return { success: true };
}
function object(lexicons2, path, def, value) {
  def = def;
  if (!value || typeof value !== "object") {
    return {
      success: false,
      error: new ValidationError(`${path} must be an object`)
    };
  }
  if (Array.isArray(def.required)) {
    for (const key of def.required) {
      if (!(key in value)) {
        return {
          success: false,
          error: new ValidationError(`${path} must have the property "${key}"`)
        };
      }
    }
  }
  if (typeof def.properties === "object") {
    for (const key in def.properties) {
      const propValue = value[key];
      if (typeof propValue === "undefined") {
        continue;
      }
      const propDef = def.properties[key];
      const propPath = `${path}/${key}`;
      const res = validateOneOf(lexicons2, propPath, propDef, propValue);
      if (!res.success) {
        return res;
      }
    }
  }
  return { success: true };
}

// ../lexicon/src/util.ts
function toLexUri(str, baseUri) {
  if (str.startsWith("lex:")) {
    return str;
  }
  if (str.startsWith("#")) {
    if (!baseUri) {
      throw new Error(`Unable to resolve uri without anchor: ${str}`);
    }
    return `${baseUri}${str}`;
  }
  return `lex:${str}`;
}
function validateOneOf(lexicons2, path, def, value, mustBeObj = false) {
  let error;
  let concreteDefs;
  if (def.type === "union") {
    if (!isDiscriminatedObject(value)) {
      return {
        success: false,
        error: new ValidationError(
          `${path} must be an object which includes the "$type" property`
        )
      };
    }
    if (!def.refs.includes(toLexUri(value.$type))) {
      if (def.closed) {
        return {
          success: false,
          error: new ValidationError(
            `${path} $type must be one of ${def.refs.join(", ")}`
          )
        };
      }
      return { success: true };
    } else {
      concreteDefs = toConcreteTypes(lexicons2, {
        type: "ref",
        ref: value.$type
      });
    }
  } else {
    concreteDefs = toConcreteTypes(lexicons2, def);
  }
  for (const concreteDef of concreteDefs) {
    const result = mustBeObj ? object(lexicons2, path, concreteDef, value) : validate2(lexicons2, path, concreteDef, value);
    if (result.success) {
      return result;
    }
    error ?? (error = result.error);
  }
  if (concreteDefs.length > 1) {
    return {
      success: false,
      error: new ValidationError(
        `${path} did not match any of the expected definitions`
      )
    };
  }
  return { success: false, error };
}
function assertValidOneOf(lexicons2, path, def, value, mustBeObj = false) {
  const res = validateOneOf(lexicons2, path, def, value, mustBeObj);
  if (!res.success) {
    throw res.error;
  }
}
function toConcreteTypes(lexicons2, def) {
  if (def.type === "ref") {
    return [lexicons2.getDefOrThrow(def.ref)];
  } else if (def.type === "union") {
    return def.refs.map((ref) => lexicons2.getDefOrThrow(ref)).flat();
  } else {
    return [def];
  }
}

// ../lexicon/src/validators/xrpc.ts
function params(lexicons2, path, def, value) {
  def = def;
  if (!value || typeof value !== "object") {
    value = {};
  }
  if (Array.isArray(def.required)) {
    for (const key of def.required) {
      if (!(key in value)) {
        return {
          success: false,
          error: new ValidationError(`${path} must have the property "${key}"`)
        };
      }
    }
  }
  for (const key in def.properties) {
    if (typeof value[key] === "undefined") {
      continue;
    }
    const paramDef = def.properties[key];
    const res = validate(
      lexicons2,
      key,
      paramDef,
      value[key]
    );
    if (!res.success) {
      return res;
    }
  }
  return { success: true };
}

// ../lexicon/src/validation.ts
function assertValidRecord(lexicons2, def, value) {
  const res = object(lexicons2, "Record", def.record, value);
  if (!res.success)
    throw res.error;
}
function assertValidXrpcParams(lexicons2, def, value) {
  if (def.parameters) {
    const res = params(lexicons2, "Params", def.parameters, value);
    if (!res.success)
      throw res.error;
  }
}
function assertValidXrpcInput(lexicons2, def, value) {
  if (def.input?.schema) {
    assertValidOneOf(lexicons2, "Input", def.input.schema, value, true);
  }
}
function assertValidXrpcOutput(lexicons2, def, value) {
  if (def.output?.schema) {
    assertValidOneOf(lexicons2, "Output", def.output.schema, value, true);
  }
}

// ../lexicon/src/lexicons.ts
var Lexicons = class {
  constructor(docs) {
    this.docs = /* @__PURE__ */ new Map();
    this.defs = /* @__PURE__ */ new Map();
    if (docs?.length) {
      for (const doc of docs) {
        this.add(doc);
      }
    }
  }
  add(doc) {
    try {
      lexiconDoc.parse(doc);
    } catch (e) {
      if (e instanceof ZodError) {
        throw new LexiconDocMalformedError(
          `Failed to parse schema definition ${doc.id}`,
          doc,
          e.issues
        );
      } else {
        throw e;
      }
    }
    const validatedDoc = doc;
    const uri = toLexUri(validatedDoc.id);
    if (this.docs.has(uri)) {
      throw new Error(`${uri} has already been registered`);
    }
    resolveRefUris(validatedDoc, uri);
    this.docs.set(uri, validatedDoc);
    for (const [defUri, def] of iterDefs(validatedDoc)) {
      this.defs.set(defUri, def);
    }
  }
  remove(uri) {
    uri = toLexUri(uri);
    const doc = this.docs.get(uri);
    if (!doc) {
      throw new Error(`Unable to remove "${uri}": does not exist`);
    }
    for (const [defUri, _def] of iterDefs(doc)) {
      this.defs.delete(defUri);
    }
    this.docs.delete(uri);
  }
  get(uri) {
    uri = toLexUri(uri);
    return this.docs.get(uri);
  }
  getDef(uri) {
    uri = toLexUri(uri);
    return this.defs.get(uri);
  }
  getDefOrThrow(uri, types) {
    const def = this.getDef(uri);
    if (!def) {
      throw new LexiconDefNotFoundError(`Lexicon not found: ${uri}`);
    }
    if (types && !types.includes(def.type)) {
      throw new InvalidLexiconError(
        `Not a ${types.join(" or ")} lexicon: ${uri}`
      );
    }
    return def;
  }
  assertValidRecord(lexUri, value) {
    lexUri = toLexUri(lexUri);
    const def = this.getDefOrThrow(lexUri, ["record"]);
    if (!isObj(value)) {
      throw new ValidationError(`Record must be an object`);
    }
    if (!hasProp(value, "$type") || typeof value.$type !== "string") {
      throw new ValidationError(`Record/$type must be a string`);
    }
    const $type = value.$type || "";
    if (toLexUri($type) !== lexUri) {
      throw new ValidationError(
        `Invalid $type: must be ${lexUri}, got ${$type}`
      );
    }
    assertValidRecord(this, def, value);
  }
  assertValidXrpcParams(lexUri, value) {
    lexUri = toLexUri(lexUri);
    const def = this.getDefOrThrow(lexUri, ["query", "procedure"]);
    assertValidXrpcParams(this, def, value);
  }
  assertValidXrpcInput(lexUri, value) {
    lexUri = toLexUri(lexUri);
    const def = this.getDefOrThrow(lexUri, ["procedure"]);
    assertValidXrpcInput(this, def, value);
  }
  assertValidXrpcOutput(lexUri, value) {
    lexUri = toLexUri(lexUri);
    const def = this.getDefOrThrow(lexUri, ["query", "procedure"]);
    assertValidXrpcOutput(this, def, value);
  }
};
function* iterDefs(doc) {
  for (const defId in doc.defs) {
    yield [`lex:${doc.id}#${defId}`, doc.defs[defId]];
    if (defId === "main") {
      yield [`lex:${doc.id}`, doc.defs[defId]];
    }
  }
}
function resolveRefUris(obj, baseUri) {
  for (const k in obj) {
    if (obj.type === "ref") {
      obj.ref = toLexUri(obj.ref, baseUri);
    } else if (obj.type === "union") {
      obj.refs = obj.refs.map((ref) => toLexUri(ref, baseUri));
    } else if (Array.isArray(obj[k])) {
      obj[k] = obj[k].map((item) => {
        if (typeof item === "string") {
          return item.startsWith("#") ? toLexUri(item, baseUri) : item;
        } else if (item && typeof item === "object") {
          return resolveRefUris(item, baseUri);
        }
        return item;
      });
    } else if (obj[k] && typeof obj[k] === "object") {
      obj[k] = resolveRefUris(obj[k], baseUri);
    }
  }
  return obj;
}

// ../xrpc/src/util.ts
function getMethodSchemaHTTPMethod(schema) {
  if (schema.type === "procedure") {
    return "post";
  }
  return "get";
}
function constructMethodCallUri(nsid, schema, serviceUri, params2) {
  const uri = new URL(serviceUri);
  uri.pathname = `/xrpc/${nsid}`;
  if (params2) {
    for (const [key, value] of Object.entries(params2)) {
      const paramSchema = schema.parameters?.properties?.[key];
      if (!paramSchema) {
        throw new Error(`Invalid query parameter: ${key}`);
      }
      if (value !== void 0) {
        uri.searchParams.set(key, encodeQueryParam(paramSchema.type, value));
      }
    }
  }
  return uri.toString();
}
function encodeQueryParam(type, value) {
  if (type === "string" || type === "unknown") {
    return String(value);
  }
  if (type === "number") {
    return String(Number(value));
  } else if (type === "integer") {
    return String(Number(value) | 0);
  } else if (type === "boolean") {
    return value ? "true" : "false";
  } else if (type === "datetime") {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return String(value);
  }
  throw new Error(`Unsupported query param type: ${type}`);
}
function constructMethodCallHeaders(schema, data, opts) {
  const headers = opts?.headers || {};
  if (schema.type === "procedure") {
    if (opts?.encoding) {
      headers["Content-Type"] = opts.encoding;
    }
    if (data && typeof data === "object") {
      if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }
    }
  }
  return headers;
}
function encodeMethodCallBody(headers, data) {
  if (!headers["Content-Type"] || typeof data === "undefined") {
    return void 0;
  }
  if (data instanceof ArrayBuffer) {
    return data;
  }
  if (headers["Content-Type"].startsWith("text/")) {
    return new TextEncoder().encode(data.toString());
  }
  if (headers["Content-Type"].startsWith("application/json")) {
    return new TextEncoder().encode(JSON.stringify(data));
  }
  return data;
}
function httpResponseCodeToEnum(status) {
  let resCode;
  if (status in ResponseType) {
    resCode = status;
  } else if (status >= 100 && status < 200) {
    resCode = 404 /* XRPCNotSupported */;
  } else if (status >= 200 && status < 300) {
    resCode = 200 /* Success */;
  } else if (status >= 300 && status < 400) {
    resCode = 404 /* XRPCNotSupported */;
  } else if (status >= 400 && status < 500) {
    resCode = 400 /* InvalidRequest */;
  } else {
    resCode = 500 /* InternalServerError */;
  }
  return resCode;
}
function httpResponseBodyParse(mimeType, data) {
  if (mimeType) {
    if (mimeType.includes("application/json") && data?.byteLength) {
      try {
        const str = new TextDecoder().decode(data);
        return JSON.parse(str);
      } catch (e) {
        throw new XRPCError(
          2 /* InvalidResponse */,
          `Failed to parse response body: ${String(e)}`
        );
      }
    }
    if (mimeType.startsWith("text/") && data?.byteLength) {
      try {
        return new TextDecoder().decode(data);
      } catch (e) {
        throw new XRPCError(
          2 /* InvalidResponse */,
          `Failed to parse response body: ${String(e)}`
        );
      }
    }
  }
  return data;
}

// ../xrpc/src/client.ts
var Client = class {
  constructor() {
    this.fetch = defaultFetchHandler;
    this.lex = new Lexicons();
  }
  async call(serviceUri, methodNsid, params2, data, opts) {
    return this.service(serviceUri).call(methodNsid, params2, data, opts);
  }
  service(serviceUri) {
    return new ServiceClient(this, serviceUri);
  }
  addLexicon(doc) {
    this.lex.add(doc);
  }
  addLexicons(docs) {
    for (const doc of docs) {
      this.addLexicon(doc);
    }
  }
  removeLexicon(uri) {
    this.lex.remove(uri);
  }
};
var ServiceClient = class {
  constructor(baseClient, serviceUri) {
    this.headers = {};
    this.baseClient = baseClient;
    this.uri = typeof serviceUri === "string" ? new URL(serviceUri) : serviceUri;
  }
  setHeader(key, value) {
    this.headers[key] = value;
  }
  unsetHeader(key) {
    delete this.headers[key];
  }
  async call(methodNsid, params2, data, opts) {
    const def = this.baseClient.lex.getDefOrThrow(methodNsid);
    if (!def || def.type !== "query" && def.type !== "procedure") {
      throw new Error(
        `Invalid lexicon: ${methodNsid}. Must be a query or procedure.`
      );
    }
    const httpMethod = getMethodSchemaHTTPMethod(def);
    const httpUri = constructMethodCallUri(methodNsid, def, this.uri, params2);
    const httpHeaders = constructMethodCallHeaders(def, data, {
      headers: {
        ...this.headers,
        ...opts?.headers
      },
      encoding: opts?.encoding
    });
    const res = await this.baseClient.fetch(
      httpUri,
      httpMethod,
      httpHeaders,
      data
    );
    const resCode = httpResponseCodeToEnum(res.status);
    if (resCode === 200 /* Success */) {
      return new XRPCResponse(res.body, res.headers);
    } else {
      if (res.body && isErrorResponseBody(res.body)) {
        throw new XRPCError(resCode, res.body.error, res.body.message);
      } else {
        throw new XRPCError(resCode);
      }
    }
  }
};
async function defaultFetchHandler(httpUri, httpMethod, httpHeaders, httpReqBody) {
  try {
    const res = await fetch(httpUri, {
      method: httpMethod,
      headers: httpHeaders,
      body: encodeMethodCallBody(httpHeaders, httpReqBody)
    });
    const resBody = await res.arrayBuffer();
    return {
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      body: httpResponseBodyParse(res.headers.get("content-type"), resBody)
    };
  } catch (e) {
    throw new XRPCError(1 /* Unknown */, String(e));
  }
}
function isErrorResponseBody(v) {
  return errorResponseBody.safeParse(v).success;
}

// ../xrpc/src/index.ts
var defaultInst = new Client();

// src/client/lexicons.ts
var schemaDict = {
  ComAtprotoAccountCreate: {
    lexicon: 1,
    id: "com.atproto.account.create",
    defs: {
      main: {
        type: "procedure",
        description: "Create an account.",
        input: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["handle", "email", "password"],
            properties: {
              email: {
                type: "string"
              },
              handle: {
                type: "string"
              },
              inviteCode: {
                type: "string"
              },
              password: {
                type: "string"
              },
              recoveryKey: {
                type: "string"
              }
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["accessJwt", "refreshJwt", "handle", "did"],
            properties: {
              accessJwt: {
                type: "string"
              },
              refreshJwt: {
                type: "string"
              },
              handle: {
                type: "string"
              },
              did: {
                type: "string"
              }
            }
          }
        },
        errors: [
          {
            name: "InvalidHandle"
          },
          {
            name: "InvalidPassword"
          },
          {
            name: "InvalidInviteCode"
          },
          {
            name: "HandleNotAvailable"
          }
        ]
      }
    }
  },
  ComAtprotoAccountCreateInviteCode: {
    lexicon: 1,
    id: "com.atproto.account.createInviteCode",
    defs: {
      main: {
        type: "procedure",
        description: "Create an invite code.",
        input: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["useCount"],
            properties: {
              useCount: {
                type: "integer"
              }
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["code"],
            properties: {
              code: {
                type: "string"
              }
            }
          }
        }
      }
    }
  },
  ComAtprotoAccountDelete: {
    lexicon: 1,
    id: "com.atproto.account.delete",
    defs: {
      main: {
        type: "procedure",
        description: "Delete an account."
      }
    }
  },
  ComAtprotoAccountGet: {
    lexicon: 1,
    id: "com.atproto.account.get",
    defs: {
      main: {
        type: "query",
        description: "Get information about an account."
      }
    }
  },
  ComAtprotoAccountRequestPasswordReset: {
    lexicon: 1,
    id: "com.atproto.account.requestPasswordReset",
    defs: {
      main: {
        type: "procedure",
        description: "Initiate a user account password reset via email.",
        input: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["email"],
            properties: {
              email: {
                type: "string"
              }
            }
          }
        }
      }
    }
  },
  ComAtprotoAccountResetPassword: {
    lexicon: 1,
    id: "com.atproto.account.resetPassword",
    defs: {
      main: {
        type: "procedure",
        description: "Reset a user account password using a token.",
        input: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["token", "password"],
            properties: {
              token: {
                type: "string"
              },
              password: {
                type: "string"
              }
            }
          }
        },
        errors: [
          {
            name: "ExpiredToken"
          },
          {
            name: "InvalidToken"
          }
        ]
      }
    }
  },
  ComAtprotoBlobUpload: {
    lexicon: 1,
    id: "com.atproto.blob.upload",
    defs: {
      main: {
        type: "procedure",
        description: "Upload a new blob to be added to repo in a later request.",
        input: {
          encoding: "*/*"
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["cid"],
            properties: {
              cid: {
                type: "string"
              }
            }
          }
        }
      }
    }
  },
  ComAtprotoHandleResolve: {
    lexicon: 1,
    id: "com.atproto.handle.resolve",
    defs: {
      main: {
        type: "query",
        description: "Provides the DID of a repo.",
        parameters: {
          type: "params",
          properties: {
            handle: {
              type: "string",
              description: "The handle to resolve. If not supplied, will resolve the host's own handle."
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["did"],
            properties: {
              did: {
                type: "string"
              }
            }
          }
        }
      }
    }
  },
  ComAtprotoRepoBatchWrite: {
    lexicon: 1,
    id: "com.atproto.repo.batchWrite",
    defs: {
      main: {
        type: "procedure",
        description: "Apply a batch transaction of creates, puts, and deletes.",
        input: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["did", "writes"],
            properties: {
              did: {
                type: "string",
                description: "The DID of the repo."
              },
              validate: {
                type: "boolean",
                default: true,
                description: "Validate the records?"
              },
              writes: {
                type: "array",
                items: {
                  type: "union",
                  refs: [
                    "lex:com.atproto.repo.batchWrite#create",
                    "lex:com.atproto.repo.batchWrite#update",
                    "lex:com.atproto.repo.batchWrite#delete"
                  ],
                  closed: true
                }
              }
            }
          }
        }
      },
      create: {
        type: "object",
        required: ["action", "collection", "value"],
        properties: {
          action: {
            type: "string",
            const: "create"
          },
          collection: {
            type: "string"
          },
          rkey: {
            type: "string"
          },
          value: {
            type: "unknown"
          }
        }
      },
      update: {
        type: "object",
        required: ["action", "collection", "rkey", "value"],
        properties: {
          action: {
            type: "string",
            const: "update"
          },
          collection: {
            type: "string"
          },
          rkey: {
            type: "string"
          },
          value: {
            type: "unknown"
          }
        }
      },
      delete: {
        type: "object",
        required: ["action", "collection", "rkey"],
        properties: {
          action: {
            type: "string",
            const: "delete"
          },
          collection: {
            type: "string"
          },
          rkey: {
            type: "string"
          }
        }
      }
    }
  },
  ComAtprotoRepoCreateRecord: {
    lexicon: 1,
    id: "com.atproto.repo.createRecord",
    defs: {
      main: {
        type: "procedure",
        description: "Create a new record.",
        input: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["did", "collection", "record"],
            properties: {
              did: {
                type: "string",
                description: "The DID of the repo."
              },
              collection: {
                type: "string",
                description: "The NSID of the record collection."
              },
              validate: {
                type: "boolean",
                default: true,
                description: "Validate the record?"
              },
              record: {
                type: "unknown",
                description: "The record to create."
              }
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["uri", "cid"],
            properties: {
              uri: {
                type: "string"
              },
              cid: {
                type: "string"
              }
            }
          }
        }
      }
    }
  },
  ComAtprotoRepoDeleteRecord: {
    lexicon: 1,
    id: "com.atproto.repo.deleteRecord",
    defs: {
      main: {
        type: "procedure",
        description: "Delete a record.",
        input: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["did", "collection", "rkey"],
            properties: {
              did: {
                type: "string",
                description: "The DID of the repo."
              },
              collection: {
                type: "string",
                description: "The NSID of the record collection."
              },
              rkey: {
                type: "string",
                description: "The key of the record."
              }
            }
          }
        }
      }
    }
  },
  ComAtprotoRepoDescribe: {
    lexicon: 1,
    id: "com.atproto.repo.describe",
    defs: {
      main: {
        type: "query",
        description: "Get information about the repo, including the list of collections.",
        parameters: {
          type: "params",
          required: ["user"],
          properties: {
            user: {
              type: "string",
              description: "The handle or DID of the repo."
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: [
              "handle",
              "did",
              "didDoc",
              "collections",
              "handleIsCorrect"
            ],
            properties: {
              handle: {
                type: "string"
              },
              did: {
                type: "string"
              },
              didDoc: {
                type: "unknown"
              },
              collections: {
                type: "array",
                items: {
                  type: "string"
                }
              },
              handleIsCorrect: {
                type: "boolean"
              }
            }
          }
        }
      }
    }
  },
  ComAtprotoRepoGetRecord: {
    lexicon: 1,
    id: "com.atproto.repo.getRecord",
    defs: {
      main: {
        type: "query",
        description: "Fetch a record.",
        parameters: {
          type: "params",
          required: ["user", "collection", "rkey"],
          properties: {
            user: {
              type: "string",
              description: "The handle or DID of the repo."
            },
            collection: {
              type: "string",
              description: "The NSID of the collection."
            },
            rkey: {
              type: "string",
              description: "The key of the record."
            },
            cid: {
              type: "string",
              description: "The CID of the version of the record. If not specified, then return the most recent version."
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["uri", "value"],
            properties: {
              uri: {
                type: "string"
              },
              cid: {
                type: "string"
              },
              value: {
                type: "unknown"
              }
            }
          }
        }
      }
    }
  },
  ComAtprotoRepoListRecords: {
    lexicon: 1,
    id: "com.atproto.repo.listRecords",
    defs: {
      main: {
        type: "query",
        description: "List a range of records in a collection.",
        parameters: {
          type: "params",
          required: ["user", "collection"],
          properties: {
            user: {
              type: "string",
              description: "The handle or DID of the repo."
            },
            collection: {
              type: "string",
              description: "The NSID of the record type."
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 50,
              description: "The number of records to return."
            },
            before: {
              type: "string",
              description: "A TID to filter the range of records returned."
            },
            after: {
              type: "string",
              description: "A TID to filter the range of records returned."
            },
            reverse: {
              type: "boolean",
              description: "Reverse the order of the returned records?"
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["records"],
            properties: {
              cursor: {
                type: "string"
              },
              records: {
                type: "array",
                items: {
                  type: "ref",
                  ref: "lex:com.atproto.repo.listRecords#record"
                }
              }
            }
          }
        }
      },
      record: {
        type: "object",
        required: ["uri", "cid", "value"],
        properties: {
          uri: {
            type: "string"
          },
          cid: {
            type: "string"
          },
          value: {
            type: "unknown"
          }
        }
      }
    }
  },
  ComAtprotoRepoPutRecord: {
    lexicon: 1,
    id: "com.atproto.repo.putRecord",
    defs: {
      main: {
        type: "procedure",
        description: "Write a record.",
        input: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["did", "collection", "rkey", "record"],
            properties: {
              did: {
                type: "string",
                description: "The DID of the repo."
              },
              collection: {
                type: "string",
                description: "The NSID of the record type."
              },
              rkey: {
                type: "string",
                description: "The TID of the record."
              },
              validate: {
                type: "boolean",
                default: true,
                description: "Validate the record?"
              },
              record: {
                type: "unknown",
                description: "The record to create."
              }
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["uri", "cid"],
            properties: {
              uri: {
                type: "string"
              },
              cid: {
                type: "string"
              }
            }
          }
        }
      }
    }
  },
  ComAtprotoRepoStrongRef: {
    lexicon: 1,
    id: "com.atproto.repo.strongRef",
    description: "A URI with a content-hash fingerprint.",
    defs: {
      main: {
        type: "object",
        required: ["uri", "cid"],
        properties: {
          uri: {
            type: "string"
          },
          cid: {
            type: "string"
          }
        }
      }
    }
  },
  ComAtprotoServerGetAccountsConfig: {
    lexicon: 1,
    id: "com.atproto.server.getAccountsConfig",
    defs: {
      main: {
        type: "query",
        description: "Get a document describing the service's accounts configuration.",
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["availableUserDomains"],
            properties: {
              inviteCodeRequired: {
                type: "boolean"
              },
              availableUserDomains: {
                type: "array",
                items: {
                  type: "string"
                }
              },
              links: {
                type: "ref",
                ref: "lex:com.atproto.server.getAccountsConfig#links"
              }
            }
          }
        }
      },
      links: {
        type: "object",
        properties: {
          privacyPolicy: {
            type: "string"
          },
          termsOfService: {
            type: "string"
          }
        }
      }
    }
  },
  ComAtprotoSessionCreate: {
    lexicon: 1,
    id: "com.atproto.session.create",
    defs: {
      main: {
        type: "procedure",
        description: "Create an authentication session.",
        input: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["handle", "password"],
            properties: {
              handle: {
                type: "string"
              },
              password: {
                type: "string"
              }
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["accessJwt", "refreshJwt", "handle", "did"],
            properties: {
              accessJwt: {
                type: "string"
              },
              refreshJwt: {
                type: "string"
              },
              handle: {
                type: "string"
              },
              did: {
                type: "string"
              }
            }
          }
        }
      }
    }
  },
  ComAtprotoSessionDelete: {
    lexicon: 1,
    id: "com.atproto.session.delete",
    defs: {
      main: {
        type: "procedure",
        description: "Delete the current session."
      }
    }
  },
  ComAtprotoSessionGet: {
    lexicon: 1,
    id: "com.atproto.session.get",
    defs: {
      main: {
        type: "query",
        description: "Get information about the current session.",
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["handle", "did"],
            properties: {
              handle: {
                type: "string"
              },
              did: {
                type: "string"
              }
            }
          }
        }
      }
    }
  },
  ComAtprotoSessionRefresh: {
    lexicon: 1,
    id: "com.atproto.session.refresh",
    defs: {
      main: {
        type: "procedure",
        description: "Refresh an authentication session.",
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["accessJwt", "refreshJwt", "handle", "did"],
            properties: {
              accessJwt: {
                type: "string"
              },
              refreshJwt: {
                type: "string"
              },
              handle: {
                type: "string"
              },
              did: {
                type: "string"
              }
            }
          }
        }
      }
    }
  },
  ComAtprotoSyncGetRepo: {
    lexicon: 1,
    id: "com.atproto.sync.getRepo",
    defs: {
      main: {
        type: "query",
        description: "Gets the repo state.",
        parameters: {
          type: "params",
          required: ["did"],
          properties: {
            did: {
              type: "string",
              description: "The DID of the repo."
            },
            from: {
              type: "string",
              description: "A past commit CID."
            }
          }
        },
        output: {
          encoding: "application/cbor"
        }
      }
    }
  },
  ComAtprotoSyncGetRoot: {
    lexicon: 1,
    id: "com.atproto.sync.getRoot",
    defs: {
      main: {
        type: "query",
        description: "Gets the current root CID of a repo.",
        parameters: {
          type: "params",
          required: ["did"],
          properties: {
            did: {
              type: "string",
              description: "The DID of the repo."
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["root"],
            properties: {
              root: {
                type: "string"
              }
            }
          }
        }
      }
    }
  },
  ComAtprotoSyncUpdateRepo: {
    lexicon: 1,
    id: "com.atproto.sync.updateRepo",
    defs: {
      main: {
        type: "procedure",
        description: "Writes commits to a repo.",
        parameters: {
          type: "params",
          required: ["did"],
          properties: {
            did: {
              type: "string",
              description: "The DID of the repo."
            }
          }
        },
        input: {
          encoding: "application/cbor"
        }
      }
    }
  },
  AppBskyActorCreateScene: {
    lexicon: 1,
    id: "app.bsky.actor.createScene",
    defs: {
      main: {
        type: "procedure",
        description: "Create a scene.",
        input: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["handle"],
            properties: {
              handle: {
                type: "string"
              },
              recoveryKey: {
                type: "string"
              }
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["handle", "did", "declaration"],
            properties: {
              handle: {
                type: "string"
              },
              did: {
                type: "string"
              },
              declaration: {
                type: "ref",
                ref: "lex:app.bsky.system.declRef"
              }
            }
          }
        },
        errors: [
          {
            name: "InvalidHandle"
          },
          {
            name: "HandleNotAvailable"
          }
        ]
      }
    }
  },
  AppBskyActorGetProfile: {
    lexicon: 1,
    id: "app.bsky.actor.getProfile",
    defs: {
      main: {
        type: "query",
        parameters: {
          type: "params",
          required: ["actor"],
          properties: {
            actor: {
              type: "string"
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: [
              "did",
              "declaration",
              "handle",
              "creator",
              "followersCount",
              "followsCount",
              "membersCount",
              "postsCount"
            ],
            properties: {
              did: {
                type: "string"
              },
              declaration: {
                type: "ref",
                ref: "lex:app.bsky.system.declRef"
              },
              handle: {
                type: "string"
              },
              creator: {
                type: "string"
              },
              displayName: {
                type: "string",
                maxLength: 64
              },
              description: {
                type: "string",
                maxLength: 256
              },
              avatar: {
                type: "string"
              },
              banner: {
                type: "string"
              },
              followersCount: {
                type: "integer"
              },
              followsCount: {
                type: "integer"
              },
              membersCount: {
                type: "integer"
              },
              postsCount: {
                type: "integer"
              },
              myState: {
                type: "ref",
                ref: "lex:app.bsky.actor.getProfile#myState"
              }
            }
          }
        }
      },
      myState: {
        type: "object",
        properties: {
          follow: {
            type: "string"
          },
          member: {
            type: "string"
          }
        }
      }
    }
  },
  AppBskyActorGetSuggestions: {
    lexicon: 1,
    id: "app.bsky.actor.getSuggestions",
    defs: {
      main: {
        type: "query",
        description: "Get a list of actors suggested for following. Used in discovery UIs.",
        parameters: {
          type: "params",
          properties: {
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 50
            },
            cursor: {
              type: "string"
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["actors"],
            properties: {
              cursor: {
                type: "string"
              },
              actors: {
                type: "array",
                items: {
                  type: "ref",
                  ref: "lex:app.bsky.actor.getSuggestions#actor"
                }
              }
            }
          }
        }
      },
      actor: {
        type: "object",
        required: ["did", "declaration", "handle"],
        properties: {
          did: {
            type: "string"
          },
          declaration: {
            type: "ref",
            ref: "lex:app.bsky.system.declRef"
          },
          handle: {
            type: "string"
          },
          displayName: {
            type: "string",
            maxLength: 64
          },
          description: {
            type: "string"
          },
          avatar: {
            type: "string"
          },
          indexedAt: {
            type: "datetime"
          },
          myState: {
            type: "ref",
            ref: "lex:app.bsky.actor.getSuggestions#myState"
          }
        }
      },
      myState: {
        type: "object",
        properties: {
          follow: {
            type: "string"
          }
        }
      }
    }
  },
  AppBskyActorProfile: {
    lexicon: 1,
    id: "app.bsky.actor.profile",
    defs: {
      main: {
        type: "record",
        key: "literal:self",
        record: {
          type: "object",
          required: ["displayName"],
          properties: {
            displayName: {
              type: "string",
              maxLength: 64
            },
            description: {
              type: "string",
              maxLength: 256
            },
            avatar: {
              type: "image",
              accept: ["image/png", "image/jpeg"],
              maxWidth: 500,
              maxHeight: 500,
              maxSize: 3e5
            },
            banner: {
              type: "image",
              accept: ["image/png", "image/jpeg"],
              maxWidth: 1500,
              maxHeight: 500,
              maxSize: 5e5
            }
          }
        }
      }
    }
  },
  AppBskyActorRef: {
    lexicon: 1,
    id: "app.bsky.actor.ref",
    description: "A reference to an actor in the network.",
    defs: {
      main: {
        type: "object",
        required: ["did", "declarationCid"],
        properties: {
          did: {
            type: "string"
          },
          declarationCid: {
            type: "string"
          }
        }
      },
      withInfo: {
        type: "object",
        required: ["did", "declaration", "handle"],
        properties: {
          did: {
            type: "string"
          },
          declaration: {
            type: "ref",
            ref: "lex:app.bsky.system.declRef"
          },
          handle: {
            type: "string"
          },
          displayName: {
            type: "string",
            maxLength: 64
          },
          avatar: {
            type: "string"
          }
        }
      }
    }
  },
  AppBskyActorSearch: {
    lexicon: 1,
    id: "app.bsky.actor.search",
    defs: {
      main: {
        type: "query",
        description: "Find users matching search criteria.",
        parameters: {
          type: "params",
          required: ["term"],
          properties: {
            term: {
              type: "string"
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 50
            },
            before: {
              type: "string"
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["users"],
            properties: {
              cursor: {
                type: "string"
              },
              users: {
                type: "array",
                items: {
                  type: "ref",
                  ref: "lex:app.bsky.actor.search#user"
                }
              }
            }
          }
        }
      },
      user: {
        type: "object",
        required: ["did", "declaration", "handle"],
        properties: {
          did: {
            type: "string"
          },
          declaration: {
            type: "ref",
            ref: "lex:app.bsky.system.declRef"
          },
          handle: {
            type: "string"
          },
          displayName: {
            type: "string",
            maxLength: 64
          },
          avatar: {
            type: "string"
          },
          description: {
            type: "string"
          },
          indexedAt: {
            type: "datetime"
          }
        }
      }
    }
  },
  AppBskyActorSearchTypeahead: {
    lexicon: 1,
    id: "app.bsky.actor.searchTypeahead",
    defs: {
      main: {
        type: "query",
        description: "Find user suggestions for a search term.",
        parameters: {
          type: "params",
          required: ["term"],
          properties: {
            term: {
              type: "string"
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 50
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["users"],
            properties: {
              users: {
                type: "array",
                items: {
                  type: "ref",
                  ref: "lex:app.bsky.actor.searchTypeahead#user"
                }
              }
            }
          }
        }
      },
      user: {
        type: "object",
        required: ["did", "declaration", "handle"],
        properties: {
          did: {
            type: "string"
          },
          declaration: {
            type: "ref",
            ref: "lex:app.bsky.system.declRef"
          },
          handle: {
            type: "string"
          },
          displayName: {
            type: "string",
            maxLength: 64
          },
          avatar: {
            type: "string"
          }
        }
      }
    }
  },
  AppBskyActorUpdateProfile: {
    lexicon: 1,
    id: "app.bsky.actor.updateProfile",
    defs: {
      main: {
        type: "procedure",
        description: "Notify server that the user has seen notifications.",
        input: {
          encoding: "application/json",
          schema: {
            type: "object",
            properties: {
              did: {
                type: "string"
              },
              displayName: {
                type: "string",
                maxLength: 64
              },
              description: {
                type: "string",
                maxLength: 256
              },
              avatar: {
                type: "image",
                accept: ["image/png", "image/jpeg"],
                maxWidth: 500,
                maxHeight: 500,
                maxSize: 1e5
              },
              banner: {
                type: "image",
                accept: ["image/png", "image/jpeg"],
                maxWidth: 1500,
                maxHeight: 500,
                maxSize: 5e5
              }
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["uri", "cid", "record"],
            properties: {
              uri: {
                type: "string"
              },
              cid: {
                type: "string"
              },
              record: {
                type: "unknown"
              }
            }
          }
        },
        errors: [
          {
            name: "InvalidBlob"
          },
          {
            name: "BlobTooLarge"
          },
          {
            name: "InvalidMimeType"
          },
          {
            name: "InvalidImageDimensions"
          }
        ]
      }
    }
  },
  AppBskyEmbedExternal: {
    lexicon: 1,
    id: "app.bsky.embed.external",
    description: "An representation of some externally linked content, embedded in another form of content",
    defs: {
      main: {
        type: "object",
        required: ["external"],
        properties: {
          external: {
            type: "ref",
            ref: "lex:app.bsky.embed.external#external"
          }
        }
      },
      external: {
        type: "object",
        required: ["uri", "title", "description"],
        properties: {
          uri: {
            type: "string"
          },
          title: {
            type: "string"
          },
          description: {
            type: "string"
          },
          thumb: {
            type: "image",
            accept: ["image/*"],
            maxWidth: 250,
            maxHeight: 250,
            maxSize: 1e5
          }
        }
      },
      presented: {
        type: "object",
        required: ["external"],
        properties: {
          external: {
            type: "ref",
            ref: "lex:app.bsky.embed.external#presentedExternal"
          }
        }
      },
      presentedExternal: {
        type: "object",
        required: ["uri", "title", "description"],
        properties: {
          uri: {
            type: "string"
          },
          title: {
            type: "string"
          },
          description: {
            type: "string"
          },
          thumb: {
            type: "string"
          }
        }
      }
    }
  },
  AppBskyEmbedImages: {
    lexicon: 1,
    id: "app.bsky.embed.images",
    description: "A set of images embedded in some other form of content",
    defs: {
      main: {
        type: "object",
        required: ["images"],
        properties: {
          images: {
            type: "array",
            items: {
              type: "ref",
              ref: "lex:app.bsky.embed.images#image"
            },
            maxLength: 4
          }
        }
      },
      image: {
        type: "object",
        required: ["image", "alt"],
        properties: {
          image: {
            type: "image",
            accept: ["image/*"],
            maxWidth: 500,
            maxHeight: 500,
            maxSize: 3e5
          },
          alt: {
            type: "string"
          }
        }
      },
      presented: {
        type: "object",
        required: ["images"],
        properties: {
          images: {
            type: "array",
            items: {
              type: "ref",
              ref: "lex:app.bsky.embed.images#presentedImage"
            },
            maxLength: 4
          }
        }
      },
      presentedImage: {
        type: "object",
        required: ["thumb", "fullsize", "alt"],
        properties: {
          thumb: {
            type: "string"
          },
          fullsize: {
            type: "string"
          },
          alt: {
            type: "string"
          }
        }
      }
    }
  },
  AppBskyFeedFeedViewPost: {
    lexicon: 1,
    id: "app.bsky.feed.feedViewPost",
    defs: {
      main: {
        type: "object",
        required: ["post"],
        properties: {
          post: {
            type: "ref",
            ref: "lex:app.bsky.feed.post#view"
          },
          reply: {
            type: "ref",
            ref: "lex:app.bsky.feed.feedViewPost#replyRef"
          },
          reason: {
            type: "union",
            refs: [
              "lex:app.bsky.feed.feedViewPost#reasonTrend",
              "lex:app.bsky.feed.feedViewPost#reasonRepost"
            ]
          }
        }
      },
      replyRef: {
        type: "object",
        required: ["root", "parent"],
        properties: {
          root: {
            type: "ref",
            ref: "lex:app.bsky.feed.post#view"
          },
          parent: {
            type: "ref",
            ref: "lex:app.bsky.feed.post#view"
          }
        }
      },
      reasonTrend: {
        type: "object",
        required: ["by", "indexedAt"],
        properties: {
          by: {
            type: "ref",
            ref: "lex:app.bsky.actor.ref#withInfo"
          },
          indexedAt: {
            type: "datetime"
          }
        }
      },
      reasonRepost: {
        type: "object",
        required: ["by", "indexedAt"],
        properties: {
          by: {
            type: "ref",
            ref: "lex:app.bsky.actor.ref#withInfo"
          },
          indexedAt: {
            type: "datetime"
          }
        }
      }
    }
  },
  AppBskyFeedGetAuthorFeed: {
    lexicon: 1,
    id: "app.bsky.feed.getAuthorFeed",
    defs: {
      main: {
        type: "query",
        description: "A view of a user's feed.",
        parameters: {
          type: "params",
          required: ["author"],
          properties: {
            author: {
              type: "string"
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 50
            },
            before: {
              type: "string"
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["feed"],
            properties: {
              cursor: {
                type: "string"
              },
              feed: {
                type: "array",
                items: {
                  type: "ref",
                  ref: "lex:app.bsky.feed.feedViewPost"
                }
              }
            }
          }
        }
      }
    }
  },
  AppBskyFeedGetPostThread: {
    lexicon: 1,
    id: "app.bsky.feed.getPostThread",
    defs: {
      main: {
        type: "query",
        parameters: {
          type: "params",
          required: ["uri"],
          properties: {
            uri: {
              type: "string"
            },
            depth: {
              type: "integer"
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["thread"],
            properties: {
              thread: {
                type: "union",
                refs: [
                  "lex:app.bsky.feed.getPostThread#threadViewPost",
                  "lex:app.bsky.feed.getPostThread#notFoundPost"
                ]
              }
            }
          }
        },
        errors: [
          {
            name: "NotFound"
          }
        ]
      },
      threadViewPost: {
        type: "object",
        required: ["post"],
        properties: {
          post: {
            type: "ref",
            ref: "lex:app.bsky.feed.post#view"
          },
          parent: {
            type: "union",
            refs: [
              "lex:app.bsky.feed.getPostThread#threadViewPost",
              "lex:app.bsky.feed.getPostThread#notFoundPost"
            ]
          },
          replies: {
            type: "array",
            items: {
              type: "union",
              refs: [
                "lex:app.bsky.feed.getPostThread#threadViewPost",
                "lex:app.bsky.feed.getPostThread#notFoundPost"
              ]
            }
          }
        }
      },
      notFoundPost: {
        type: "object",
        required: ["uri", "notFound"],
        properties: {
          uri: {
            type: "string"
          },
          notFound: {
            type: "boolean",
            const: true
          }
        }
      }
    }
  },
  AppBskyFeedGetRepostedBy: {
    lexicon: 1,
    id: "app.bsky.feed.getRepostedBy",
    defs: {
      main: {
        type: "query",
        parameters: {
          type: "params",
          required: ["uri"],
          properties: {
            uri: {
              type: "string"
            },
            cid: {
              type: "string"
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 50
            },
            before: {
              type: "string"
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["uri", "repostedBy"],
            properties: {
              uri: {
                type: "string"
              },
              cid: {
                type: "string"
              },
              cursor: {
                type: "string"
              },
              repostedBy: {
                type: "array",
                items: {
                  type: "ref",
                  ref: "lex:app.bsky.feed.getRepostedBy#repostedBy"
                }
              }
            }
          }
        }
      },
      repostedBy: {
        type: "object",
        required: ["did", "declaration", "handle", "indexedAt"],
        properties: {
          did: {
            type: "string"
          },
          declaration: {
            type: "ref",
            ref: "lex:app.bsky.system.declRef"
          },
          handle: {
            type: "string"
          },
          displayName: {
            type: "string",
            maxLength: 64
          },
          avatar: {
            type: "string"
          },
          createdAt: {
            type: "datetime"
          },
          indexedAt: {
            type: "datetime"
          }
        }
      }
    }
  },
  AppBskyFeedGetTimeline: {
    lexicon: 1,
    id: "app.bsky.feed.getTimeline",
    defs: {
      main: {
        type: "query",
        description: "A view of the user's home timeline.",
        parameters: {
          type: "params",
          properties: {
            algorithm: {
              type: "string"
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 50
            },
            before: {
              type: "string"
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["feed"],
            properties: {
              cursor: {
                type: "string"
              },
              feed: {
                type: "array",
                items: {
                  type: "ref",
                  ref: "lex:app.bsky.feed.feedViewPost"
                }
              }
            }
          }
        }
      }
    }
  },
  AppBskyFeedGetVotes: {
    lexicon: 1,
    id: "app.bsky.feed.getVotes",
    defs: {
      main: {
        type: "query",
        parameters: {
          type: "params",
          required: ["uri"],
          properties: {
            uri: {
              type: "string"
            },
            cid: {
              type: "string"
            },
            direction: {
              type: "string",
              enum: ["up", "down"]
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 50
            },
            before: {
              type: "string"
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["uri", "votes"],
            properties: {
              uri: {
                type: "string"
              },
              cid: {
                type: "string"
              },
              cursor: {
                type: "string"
              },
              votes: {
                type: "array",
                items: {
                  type: "ref",
                  ref: "lex:app.bsky.feed.getVotes#vote"
                }
              }
            }
          }
        }
      },
      vote: {
        type: "object",
        required: ["direction", "indexedAt", "createdAt", "actor"],
        properties: {
          direction: {
            type: "string",
            enum: ["up", "down"]
          },
          indexedAt: {
            type: "datetime"
          },
          createdAt: {
            type: "datetime"
          },
          actor: {
            type: "ref",
            ref: "lex:app.bsky.actor.ref#withInfo"
          }
        }
      }
    }
  },
  AppBskyFeedPost: {
    lexicon: 1,
    id: "app.bsky.feed.post",
    defs: {
      main: {
        type: "record",
        key: "tid",
        record: {
          type: "object",
          required: ["text", "createdAt"],
          properties: {
            text: {
              type: "string",
              maxLength: 256
            },
            entities: {
              type: "array",
              items: {
                type: "ref",
                ref: "lex:app.bsky.feed.post#entity"
              }
            },
            reply: {
              type: "ref",
              ref: "lex:app.bsky.feed.post#replyRef"
            },
            embed: {
              type: "union",
              refs: [
                "lex:app.bsky.embed.images",
                "lex:app.bsky.embed.external"
              ]
            },
            createdAt: {
              type: "datetime"
            }
          }
        }
      },
      replyRef: {
        type: "object",
        required: ["root", "parent"],
        properties: {
          root: {
            type: "ref",
            ref: "lex:com.atproto.repo.strongRef"
          },
          parent: {
            type: "ref",
            ref: "lex:com.atproto.repo.strongRef"
          }
        }
      },
      entity: {
        type: "object",
        required: ["index", "type", "value"],
        properties: {
          index: {
            type: "ref",
            ref: "lex:app.bsky.feed.post#textSlice"
          },
          type: {
            type: "string",
            description: "Expected values are 'mention', 'hashtag', and 'link'."
          },
          value: {
            type: "string"
          }
        }
      },
      textSlice: {
        type: "object",
        required: ["start", "end"],
        properties: {
          start: {
            type: "integer",
            minimum: 0
          },
          end: {
            type: "integer",
            minimum: 0
          }
        }
      },
      view: {
        type: "object",
        required: [
          "uri",
          "cid",
          "author",
          "record",
          "replyCount",
          "repostCount",
          "upvoteCount",
          "downvoteCount",
          "indexedAt",
          "viewer"
        ],
        properties: {
          uri: {
            type: "string"
          },
          cid: {
            type: "string"
          },
          author: {
            type: "ref",
            ref: "lex:app.bsky.actor.ref#withInfo"
          },
          record: {
            type: "unknown"
          },
          embed: {
            type: "union",
            refs: [
              "lex:app.bsky.embed.images#presented",
              "lex:app.bsky.embed.external#presented"
            ]
          },
          replyCount: {
            type: "integer"
          },
          repostCount: {
            type: "integer"
          },
          upvoteCount: {
            type: "integer"
          },
          downvoteCount: {
            type: "integer"
          },
          indexedAt: {
            type: "datetime"
          },
          viewer: {
            type: "ref",
            ref: "lex:app.bsky.feed.post#viewerState"
          }
        }
      },
      viewerState: {
        type: "object",
        properties: {
          repost: {
            type: "string"
          },
          upvote: {
            type: "string"
          },
          downvote: {
            type: "string"
          }
        }
      }
    }
  },
  AppBskyFeedRepost: {
    lexicon: 1,
    id: "app.bsky.feed.repost",
    defs: {
      main: {
        type: "record",
        key: "tid",
        record: {
          type: "object",
          required: ["subject", "createdAt"],
          properties: {
            subject: {
              type: "ref",
              ref: "lex:com.atproto.repo.strongRef"
            },
            createdAt: {
              type: "datetime"
            }
          }
        }
      }
    }
  },
  AppBskyFeedSetVote: {
    lexicon: 1,
    id: "app.bsky.feed.setVote",
    defs: {
      main: {
        type: "procedure",
        description: "Upvote, downvote, or clear the user's vote for a post.",
        input: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["subject", "direction"],
            properties: {
              subject: {
                type: "ref",
                ref: "lex:com.atproto.repo.strongRef"
              },
              direction: {
                type: "string",
                enum: ["up", "down", "none"]
              }
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            properties: {
              upvote: {
                type: "string"
              },
              downvote: {
                type: "string"
              }
            }
          }
        }
      }
    }
  },
  AppBskyFeedTrend: {
    lexicon: 1,
    id: "app.bsky.feed.trend",
    defs: {
      main: {
        type: "record",
        key: "tid",
        record: {
          type: "object",
          required: ["subject", "createdAt"],
          properties: {
            subject: {
              type: "ref",
              ref: "lex:com.atproto.repo.strongRef"
            },
            createdAt: {
              type: "datetime"
            }
          }
        }
      }
    }
  },
  AppBskyFeedVote: {
    lexicon: 1,
    id: "app.bsky.feed.vote",
    defs: {
      main: {
        type: "record",
        key: "tid",
        record: {
          type: "object",
          required: ["subject", "direction", "createdAt"],
          properties: {
            subject: {
              type: "ref",
              ref: "lex:com.atproto.repo.strongRef"
            },
            direction: {
              type: "string",
              enum: ["up", "down"]
            },
            createdAt: {
              type: "datetime"
            }
          }
        }
      }
    }
  },
  AppBskyGraphAssertCreator: {
    lexicon: 1,
    id: "app.bsky.graph.assertCreator",
    defs: {
      main: {
        type: "token",
        description: "Assertion type: Creator. Defined for app.bsky.graph.assertions's assertion."
      }
    }
  },
  AppBskyGraphAssertMember: {
    lexicon: 1,
    id: "app.bsky.graph.assertMember",
    defs: {
      main: {
        type: "token",
        description: "Assertion type: Member. Defined for app.bsky.graph.assertions's assertion."
      }
    }
  },
  AppBskyGraphAssertion: {
    lexicon: 1,
    id: "app.bsky.graph.assertion",
    defs: {
      main: {
        type: "record",
        key: "tid",
        record: {
          type: "object",
          required: ["assertion", "subject", "createdAt"],
          properties: {
            assertion: {
              type: "string"
            },
            subject: {
              type: "ref",
              ref: "lex:app.bsky.actor.ref"
            },
            createdAt: {
              type: "datetime"
            }
          }
        }
      }
    }
  },
  AppBskyGraphConfirmation: {
    lexicon: 1,
    id: "app.bsky.graph.confirmation",
    defs: {
      main: {
        type: "record",
        key: "tid",
        record: {
          type: "object",
          required: ["originator", "assertion", "createdAt"],
          properties: {
            originator: {
              type: "ref",
              ref: "lex:app.bsky.actor.ref"
            },
            assertion: {
              type: "ref",
              ref: "lex:com.atproto.repo.strongRef"
            },
            createdAt: {
              type: "datetime"
            }
          }
        }
      }
    }
  },
  AppBskyGraphFollow: {
    lexicon: 1,
    id: "app.bsky.graph.follow",
    defs: {
      main: {
        type: "record",
        description: "A social follow.",
        key: "tid",
        record: {
          type: "object",
          required: ["subject", "createdAt"],
          properties: {
            subject: {
              type: "ref",
              ref: "lex:app.bsky.actor.ref"
            },
            createdAt: {
              type: "datetime"
            }
          }
        }
      }
    }
  },
  AppBskyGraphGetAssertions: {
    lexicon: 1,
    id: "app.bsky.graph.getAssertions",
    defs: {
      main: {
        type: "query",
        description: "General-purpose query for assertions.",
        parameters: {
          type: "params",
          properties: {
            author: {
              type: "string"
            },
            subject: {
              type: "string"
            },
            assertion: {
              type: "string"
            },
            confirmed: {
              type: "boolean"
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 50
            },
            before: {
              type: "string"
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["assertions"],
            properties: {
              cursor: {
                type: "string"
              },
              assertions: {
                type: "array",
                items: {
                  type: "ref",
                  ref: "lex:app.bsky.graph.getAssertions#assertion"
                }
              }
            }
          }
        }
      },
      assertion: {
        type: "object",
        required: [
          "uri",
          "cid",
          "assertion",
          "author",
          "subject",
          "indexedAt",
          "createdAt"
        ],
        properties: {
          uri: {
            type: "string"
          },
          cid: {
            type: "string"
          },
          assertion: {
            type: "string"
          },
          confirmation: {
            type: "ref",
            ref: "lex:app.bsky.graph.getAssertions#confirmation"
          },
          author: {
            type: "ref",
            ref: "lex:app.bsky.actor.ref#withInfo"
          },
          subject: {
            type: "ref",
            ref: "lex:app.bsky.actor.ref#withInfo"
          },
          indexedAt: {
            type: "datetime"
          },
          createdAt: {
            type: "datetime"
          }
        }
      },
      confirmation: {
        type: "object",
        required: ["uri", "cid", "indexedAt", "createdAt"],
        properties: {
          uri: {
            type: "string"
          },
          cid: {
            type: "string"
          },
          indexedAt: {
            type: "datetime"
          },
          createdAt: {
            type: "datetime"
          }
        }
      }
    }
  },
  AppBskyGraphGetFollowers: {
    lexicon: 1,
    id: "app.bsky.graph.getFollowers",
    defs: {
      main: {
        type: "query",
        description: "Who is following a user?",
        parameters: {
          type: "params",
          required: ["user"],
          properties: {
            user: {
              type: "string"
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 50
            },
            before: {
              type: "string"
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["subject", "followers"],
            properties: {
              subject: {
                type: "ref",
                ref: "lex:app.bsky.actor.ref#withInfo"
              },
              cursor: {
                type: "string"
              },
              followers: {
                type: "array",
                items: {
                  type: "ref",
                  ref: "lex:app.bsky.graph.getFollowers#follower"
                }
              }
            }
          }
        }
      },
      follower: {
        type: "object",
        required: ["did", "declaration", "handle", "indexedAt"],
        properties: {
          did: {
            type: "string"
          },
          declaration: {
            type: "ref",
            ref: "lex:app.bsky.system.declRef"
          },
          handle: {
            type: "string"
          },
          displayName: {
            type: "string",
            maxLength: 64
          },
          avatar: {
            type: "string"
          },
          createdAt: {
            type: "datetime"
          },
          indexedAt: {
            type: "datetime"
          }
        }
      }
    }
  },
  AppBskyGraphGetFollows: {
    lexicon: 1,
    id: "app.bsky.graph.getFollows",
    defs: {
      main: {
        type: "query",
        description: "Who is a user following?",
        parameters: {
          type: "params",
          required: ["user"],
          properties: {
            user: {
              type: "string"
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 50
            },
            before: {
              type: "string"
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["subject", "follows"],
            properties: {
              subject: {
                type: "ref",
                ref: "lex:app.bsky.actor.ref#withInfo"
              },
              cursor: {
                type: "string"
              },
              follows: {
                type: "array",
                items: {
                  type: "ref",
                  ref: "lex:app.bsky.graph.getFollows#follow"
                }
              }
            }
          }
        }
      },
      follow: {
        type: "object",
        required: ["did", "declaration", "handle", "indexedAt"],
        properties: {
          did: {
            type: "string"
          },
          declaration: {
            type: "ref",
            ref: "lex:app.bsky.system.declRef"
          },
          handle: {
            type: "string"
          },
          displayName: {
            type: "string",
            maxLength: 64
          },
          createdAt: {
            type: "datetime"
          },
          indexedAt: {
            type: "datetime"
          }
        }
      }
    }
  },
  AppBskyGraphGetMembers: {
    lexicon: 1,
    id: "app.bsky.graph.getMembers",
    defs: {
      main: {
        type: "query",
        description: "Who is a member of the group?",
        parameters: {
          type: "params",
          required: ["actor"],
          properties: {
            actor: {
              type: "string"
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 50
            },
            before: {
              type: "string"
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["subject", "members"],
            properties: {
              subject: {
                type: "ref",
                ref: "lex:app.bsky.actor.ref#withInfo"
              },
              cursor: {
                type: "string"
              },
              members: {
                type: "array",
                items: {
                  type: "ref",
                  ref: "lex:app.bsky.graph.getMembers#member"
                }
              }
            }
          }
        }
      },
      member: {
        type: "object",
        required: ["did", "declaration", "handle", "indexedAt"],
        properties: {
          did: {
            type: "string"
          },
          declaration: {
            type: "ref",
            ref: "lex:app.bsky.system.declRef"
          },
          handle: {
            type: "string"
          },
          displayName: {
            type: "string",
            maxLength: 64
          },
          createdAt: {
            type: "datetime"
          },
          indexedAt: {
            type: "datetime"
          }
        }
      }
    }
  },
  AppBskyGraphGetMemberships: {
    lexicon: 1,
    id: "app.bsky.graph.getMemberships",
    defs: {
      main: {
        type: "query",
        description: "Which groups is the actor a member of?",
        parameters: {
          type: "params",
          required: ["actor"],
          properties: {
            actor: {
              type: "string"
            },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 50
            },
            before: {
              type: "string"
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["subject", "memberships"],
            properties: {
              subject: {
                type: "ref",
                ref: "lex:app.bsky.actor.ref#withInfo"
              },
              cursor: {
                type: "string"
              },
              memberships: {
                type: "array",
                items: {
                  type: "ref",
                  ref: "lex:app.bsky.graph.getMemberships#membership"
                }
              }
            }
          }
        }
      },
      membership: {
        type: "object",
        required: ["did", "declaration", "handle", "indexedAt"],
        properties: {
          did: {
            type: "string"
          },
          declaration: {
            type: "ref",
            ref: "lex:app.bsky.system.declRef"
          },
          handle: {
            type: "string"
          },
          displayName: {
            type: "string",
            maxLength: 64
          },
          createdAt: {
            type: "datetime"
          },
          indexedAt: {
            type: "datetime"
          }
        }
      }
    }
  },
  AppBskyNotificationGetCount: {
    lexicon: 1,
    id: "app.bsky.notification.getCount",
    defs: {
      main: {
        type: "query",
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["count"],
            properties: {
              count: {
                type: "integer"
              }
            }
          }
        }
      }
    }
  },
  AppBskyNotificationList: {
    lexicon: 1,
    id: "app.bsky.notification.list",
    defs: {
      main: {
        type: "query",
        parameters: {
          type: "params",
          properties: {
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 50
            },
            before: {
              type: "string"
            }
          }
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["notifications"],
            properties: {
              cursor: {
                type: "string"
              },
              notifications: {
                type: "array",
                items: {
                  type: "ref",
                  ref: "lex:app.bsky.notification.list#notification"
                }
              }
            }
          }
        }
      },
      notification: {
        type: "object",
        required: [
          "uri",
          "cid",
          "author",
          "reason",
          "record",
          "isRead",
          "indexedAt"
        ],
        properties: {
          uri: {
            type: "string"
          },
          cid: {
            type: "string"
          },
          author: {
            type: "ref",
            ref: "lex:app.bsky.actor.ref#withInfo"
          },
          reason: {
            type: "string",
            description: "Expected values are 'vote', 'repost', 'trend', 'follow', 'invite', 'mention' and 'reply'.",
            knownValues: [
              "vote",
              "repost",
              "trend",
              "follow",
              "invite",
              "mention",
              "reply"
            ]
          },
          reasonSubject: {
            type: "string"
          },
          record: {
            type: "unknown"
          },
          isRead: {
            type: "boolean"
          },
          indexedAt: {
            type: "datetime"
          }
        }
      }
    }
  },
  AppBskyNotificationUpdateSeen: {
    lexicon: 1,
    id: "app.bsky.notification.updateSeen",
    defs: {
      main: {
        type: "procedure",
        description: "Notify server that the user has seen notifications.",
        input: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["seenAt"],
            properties: {
              seenAt: {
                type: "datetime"
              }
            }
          }
        }
      }
    }
  },
  AppBskySystemActorScene: {
    lexicon: 1,
    id: "app.bsky.system.actorScene",
    defs: {
      main: {
        type: "token",
        description: "Actor type: Scene. Defined for app.bsky.system.declaration's actorType."
      }
    }
  },
  AppBskySystemActorUser: {
    lexicon: 1,
    id: "app.bsky.system.actorUser",
    defs: {
      main: {
        type: "token",
        description: "Actor type: User. Defined for app.bsky.system.declaration's actorType."
      }
    }
  },
  AppBskySystemDeclRef: {
    lexicon: 1,
    id: "app.bsky.system.declRef",
    defs: {
      main: {
        description: "A reference to a app.bsky.system.declaration record.",
        type: "object",
        required: ["cid", "actorType"],
        properties: {
          cid: {
            type: "string"
          },
          actorType: {
            type: "string",
            knownValues: [
              "app.bsky.system.actorUser",
              "app.bsky.system.actorScene"
            ]
          }
        }
      }
    }
  },
  AppBskySystemDeclaration: {
    lexicon: 1,
    id: "app.bsky.system.declaration",
    defs: {
      main: {
        description: "Context for an account that is considered intrinsic to it and alters the fundamental understanding of an account of changed. A declaration should be treated as immutable.",
        type: "record",
        key: "literal:self",
        record: {
          type: "object",
          required: ["actorType"],
          properties: {
            actorType: {
              type: "string",
              knownValues: [
                "app.bsky.system.actorUser",
                "app.bsky.system.actorScene"
              ]
            }
          }
        }
      }
    }
  }
};
var schemas = Object.values(schemaDict);
var lexicons = new Lexicons(schemas);

// src/client/types/com/atproto/account/create.ts
var create_exports = {};
__export(create_exports, {
  HandleNotAvailableError: () => HandleNotAvailableError,
  InvalidHandleError: () => InvalidHandleError,
  InvalidInviteCodeError: () => InvalidInviteCodeError,
  InvalidPasswordError: () => InvalidPasswordError,
  toKnownErr: () => toKnownErr
});
var InvalidHandleError = class extends XRPCError {
  constructor(src) {
    super(src.status, src.error, src.message);
  }
};
var InvalidPasswordError = class extends XRPCError {
  constructor(src) {
    super(src.status, src.error, src.message);
  }
};
var InvalidInviteCodeError = class extends XRPCError {
  constructor(src) {
    super(src.status, src.error, src.message);
  }
};
var HandleNotAvailableError = class extends XRPCError {
  constructor(src) {
    super(src.status, src.error, src.message);
  }
};
function toKnownErr(e) {
  if (e instanceof XRPCError) {
    if (e.error === "InvalidHandle")
      return new InvalidHandleError(e);
    if (e.error === "InvalidPassword")
      return new InvalidPasswordError(e);
    if (e.error === "InvalidInviteCode")
      return new InvalidInviteCodeError(e);
    if (e.error === "HandleNotAvailable")
      return new HandleNotAvailableError(e);
  }
  return e;
}

// src/client/types/com/atproto/account/createInviteCode.ts
var createInviteCode_exports = {};
__export(createInviteCode_exports, {
  toKnownErr: () => toKnownErr2
});
function toKnownErr2(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/com/atproto/account/delete.ts
var delete_exports = {};
__export(delete_exports, {
  toKnownErr: () => toKnownErr3
});
function toKnownErr3(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/com/atproto/account/get.ts
var get_exports = {};
__export(get_exports, {
  toKnownErr: () => toKnownErr4
});
function toKnownErr4(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/com/atproto/account/requestPasswordReset.ts
var requestPasswordReset_exports = {};
__export(requestPasswordReset_exports, {
  toKnownErr: () => toKnownErr5
});
function toKnownErr5(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/com/atproto/account/resetPassword.ts
var resetPassword_exports = {};
__export(resetPassword_exports, {
  ExpiredTokenError: () => ExpiredTokenError,
  InvalidTokenError: () => InvalidTokenError,
  toKnownErr: () => toKnownErr6
});
var ExpiredTokenError = class extends XRPCError {
  constructor(src) {
    super(src.status, src.error, src.message);
  }
};
var InvalidTokenError = class extends XRPCError {
  constructor(src) {
    super(src.status, src.error, src.message);
  }
};
function toKnownErr6(e) {
  if (e instanceof XRPCError) {
    if (e.error === "ExpiredToken")
      return new ExpiredTokenError(e);
    if (e.error === "InvalidToken")
      return new InvalidTokenError(e);
  }
  return e;
}

// src/client/types/com/atproto/blob/upload.ts
var upload_exports = {};
__export(upload_exports, {
  toKnownErr: () => toKnownErr7
});
function toKnownErr7(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/com/atproto/handle/resolve.ts
var resolve_exports = {};
__export(resolve_exports, {
  toKnownErr: () => toKnownErr8
});
function toKnownErr8(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/com/atproto/repo/batchWrite.ts
var batchWrite_exports = {};
__export(batchWrite_exports, {
  toKnownErr: () => toKnownErr9
});
function toKnownErr9(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/com/atproto/repo/createRecord.ts
var createRecord_exports = {};
__export(createRecord_exports, {
  toKnownErr: () => toKnownErr10
});
function toKnownErr10(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/com/atproto/repo/deleteRecord.ts
var deleteRecord_exports = {};
__export(deleteRecord_exports, {
  toKnownErr: () => toKnownErr11
});
function toKnownErr11(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/com/atproto/repo/describe.ts
var describe_exports = {};
__export(describe_exports, {
  toKnownErr: () => toKnownErr12
});
function toKnownErr12(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/com/atproto/repo/getRecord.ts
var getRecord_exports = {};
__export(getRecord_exports, {
  toKnownErr: () => toKnownErr13
});
function toKnownErr13(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/com/atproto/repo/listRecords.ts
var listRecords_exports = {};
__export(listRecords_exports, {
  toKnownErr: () => toKnownErr14
});
function toKnownErr14(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/com/atproto/repo/putRecord.ts
var putRecord_exports = {};
__export(putRecord_exports, {
  toKnownErr: () => toKnownErr15
});
function toKnownErr15(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/com/atproto/server/getAccountsConfig.ts
var getAccountsConfig_exports = {};
__export(getAccountsConfig_exports, {
  toKnownErr: () => toKnownErr16
});
function toKnownErr16(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/com/atproto/session/create.ts
var create_exports2 = {};
__export(create_exports2, {
  toKnownErr: () => toKnownErr17
});
function toKnownErr17(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/com/atproto/session/delete.ts
var delete_exports2 = {};
__export(delete_exports2, {
  toKnownErr: () => toKnownErr18
});
function toKnownErr18(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/com/atproto/session/get.ts
var get_exports2 = {};
__export(get_exports2, {
  toKnownErr: () => toKnownErr19
});
function toKnownErr19(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/com/atproto/session/refresh.ts
var refresh_exports = {};
__export(refresh_exports, {
  toKnownErr: () => toKnownErr20
});
function toKnownErr20(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/com/atproto/sync/getRepo.ts
var getRepo_exports = {};
__export(getRepo_exports, {
  toKnownErr: () => toKnownErr21
});
function toKnownErr21(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/com/atproto/sync/getRoot.ts
var getRoot_exports = {};
__export(getRoot_exports, {
  toKnownErr: () => toKnownErr22
});
function toKnownErr22(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/com/atproto/sync/updateRepo.ts
var updateRepo_exports = {};
__export(updateRepo_exports, {
  toKnownErr: () => toKnownErr23
});
function toKnownErr23(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/app/bsky/actor/createScene.ts
var createScene_exports = {};
__export(createScene_exports, {
  HandleNotAvailableError: () => HandleNotAvailableError2,
  InvalidHandleError: () => InvalidHandleError2,
  toKnownErr: () => toKnownErr24
});
var InvalidHandleError2 = class extends XRPCError {
  constructor(src) {
    super(src.status, src.error, src.message);
  }
};
var HandleNotAvailableError2 = class extends XRPCError {
  constructor(src) {
    super(src.status, src.error, src.message);
  }
};
function toKnownErr24(e) {
  if (e instanceof XRPCError) {
    if (e.error === "InvalidHandle")
      return new InvalidHandleError2(e);
    if (e.error === "HandleNotAvailable")
      return new HandleNotAvailableError2(e);
  }
  return e;
}

// src/client/types/app/bsky/actor/getProfile.ts
var getProfile_exports = {};
__export(getProfile_exports, {
  toKnownErr: () => toKnownErr25
});
function toKnownErr25(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/app/bsky/actor/getSuggestions.ts
var getSuggestions_exports = {};
__export(getSuggestions_exports, {
  toKnownErr: () => toKnownErr26
});
function toKnownErr26(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/app/bsky/actor/search.ts
var search_exports = {};
__export(search_exports, {
  toKnownErr: () => toKnownErr27
});
function toKnownErr27(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/app/bsky/actor/searchTypeahead.ts
var searchTypeahead_exports = {};
__export(searchTypeahead_exports, {
  toKnownErr: () => toKnownErr28
});
function toKnownErr28(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/app/bsky/actor/updateProfile.ts
var updateProfile_exports = {};
__export(updateProfile_exports, {
  BlobTooLargeError: () => BlobTooLargeError,
  InvalidBlobError: () => InvalidBlobError,
  InvalidImageDimensionsError: () => InvalidImageDimensionsError,
  InvalidMimeTypeError: () => InvalidMimeTypeError,
  toKnownErr: () => toKnownErr29
});
var InvalidBlobError = class extends XRPCError {
  constructor(src) {
    super(src.status, src.error, src.message);
  }
};
var BlobTooLargeError = class extends XRPCError {
  constructor(src) {
    super(src.status, src.error, src.message);
  }
};
var InvalidMimeTypeError = class extends XRPCError {
  constructor(src) {
    super(src.status, src.error, src.message);
  }
};
var InvalidImageDimensionsError = class extends XRPCError {
  constructor(src) {
    super(src.status, src.error, src.message);
  }
};
function toKnownErr29(e) {
  if (e instanceof XRPCError) {
    if (e.error === "InvalidBlob")
      return new InvalidBlobError(e);
    if (e.error === "BlobTooLarge")
      return new BlobTooLargeError(e);
    if (e.error === "InvalidMimeType")
      return new InvalidMimeTypeError(e);
    if (e.error === "InvalidImageDimensions")
      return new InvalidImageDimensionsError(e);
  }
  return e;
}

// src/client/types/app/bsky/feed/getAuthorFeed.ts
var getAuthorFeed_exports = {};
__export(getAuthorFeed_exports, {
  toKnownErr: () => toKnownErr30
});
function toKnownErr30(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/app/bsky/feed/getPostThread.ts
var getPostThread_exports = {};
__export(getPostThread_exports, {
  NotFoundError: () => NotFoundError,
  toKnownErr: () => toKnownErr31
});
var NotFoundError = class extends XRPCError {
  constructor(src) {
    super(src.status, src.error, src.message);
  }
};
function toKnownErr31(e) {
  if (e instanceof XRPCError) {
    if (e.error === "NotFound")
      return new NotFoundError(e);
  }
  return e;
}

// src/client/types/app/bsky/feed/getRepostedBy.ts
var getRepostedBy_exports = {};
__export(getRepostedBy_exports, {
  toKnownErr: () => toKnownErr32
});
function toKnownErr32(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/app/bsky/feed/getTimeline.ts
var getTimeline_exports = {};
__export(getTimeline_exports, {
  toKnownErr: () => toKnownErr33
});
function toKnownErr33(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/app/bsky/feed/getVotes.ts
var getVotes_exports = {};
__export(getVotes_exports, {
  toKnownErr: () => toKnownErr34
});
function toKnownErr34(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/app/bsky/feed/setVote.ts
var setVote_exports = {};
__export(setVote_exports, {
  toKnownErr: () => toKnownErr35
});
function toKnownErr35(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/app/bsky/graph/getAssertions.ts
var getAssertions_exports = {};
__export(getAssertions_exports, {
  toKnownErr: () => toKnownErr36
});
function toKnownErr36(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/app/bsky/graph/getFollowers.ts
var getFollowers_exports = {};
__export(getFollowers_exports, {
  toKnownErr: () => toKnownErr37
});
function toKnownErr37(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/app/bsky/graph/getFollows.ts
var getFollows_exports = {};
__export(getFollows_exports, {
  toKnownErr: () => toKnownErr38
});
function toKnownErr38(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/app/bsky/graph/getMembers.ts
var getMembers_exports = {};
__export(getMembers_exports, {
  toKnownErr: () => toKnownErr39
});
function toKnownErr39(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/app/bsky/graph/getMemberships.ts
var getMemberships_exports = {};
__export(getMemberships_exports, {
  toKnownErr: () => toKnownErr40
});
function toKnownErr40(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/app/bsky/notification/getCount.ts
var getCount_exports = {};
__export(getCount_exports, {
  toKnownErr: () => toKnownErr41
});
function toKnownErr41(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/app/bsky/notification/list.ts
var list_exports = {};
__export(list_exports, {
  toKnownErr: () => toKnownErr42
});
function toKnownErr42(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/app/bsky/notification/updateSeen.ts
var updateSeen_exports = {};
__export(updateSeen_exports, {
  toKnownErr: () => toKnownErr43
});
function toKnownErr43(e) {
  if (e instanceof XRPCError) {
  }
  return e;
}

// src/client/types/com/atproto/repo/strongRef.ts
var strongRef_exports = {};

// src/client/types/app/bsky/actor/profile.ts
var profile_exports = {};

// src/client/types/app/bsky/actor/ref.ts
var ref_exports = {};

// src/client/types/app/bsky/embed/external.ts
var external_exports = {};

// src/client/types/app/bsky/embed/images.ts
var images_exports = {};

// src/client/types/app/bsky/feed/feedViewPost.ts
var feedViewPost_exports = {};

// src/client/types/app/bsky/feed/post.ts
var post_exports = {};

// src/client/types/app/bsky/feed/repost.ts
var repost_exports = {};

// src/client/types/app/bsky/feed/trend.ts
var trend_exports = {};

// src/client/types/app/bsky/feed/vote.ts
var vote_exports = {};

// src/client/types/app/bsky/graph/assertCreator.ts
var assertCreator_exports = {};
__export(assertCreator_exports, {
  MAIN: () => MAIN
});
var MAIN = "app.bsky.graph.assertCreator#main";

// src/client/types/app/bsky/graph/assertMember.ts
var assertMember_exports = {};
__export(assertMember_exports, {
  MAIN: () => MAIN2
});
var MAIN2 = "app.bsky.graph.assertMember#main";

// src/client/types/app/bsky/graph/assertion.ts
var assertion_exports = {};

// src/client/types/app/bsky/graph/confirmation.ts
var confirmation_exports = {};

// src/client/types/app/bsky/graph/follow.ts
var follow_exports = {};

// src/client/types/app/bsky/system/actorScene.ts
var actorScene_exports = {};
__export(actorScene_exports, {
  MAIN: () => MAIN3
});
var MAIN3 = "app.bsky.system.actorScene#main";

// src/client/types/app/bsky/system/actorUser.ts
var actorUser_exports = {};
__export(actorUser_exports, {
  MAIN: () => MAIN4
});
var MAIN4 = "app.bsky.system.actorUser#main";

// src/client/types/app/bsky/system/declRef.ts
var declRef_exports = {};

// src/client/types/app/bsky/system/declaration.ts
var declaration_exports = {};

// src/client/index.ts
var APP_BSKY_GRAPH = {
  AssertCreator: "app.bsky.graph.assertCreator",
  AssertMember: "app.bsky.graph.assertMember"
};
var APP_BSKY_SYSTEM = {
  ActorScene: "app.bsky.system.actorScene",
  ActorUser: "app.bsky.system.actorUser"
};
var Client2 = class {
  constructor() {
    this.xrpc = new Client();
    this.xrpc.addLexicons(schemas);
  }
  service(serviceUri) {
    return new ServiceClient2(this, this.xrpc.service(serviceUri));
  }
};
var defaultInst2 = new Client2();
var client_default = defaultInst2;
var ServiceClient2 = class {
  constructor(baseClient, xrpcService) {
    this._baseClient = baseClient;
    this.xrpc = xrpcService;
    this.com = new ComNS(this);
    this.app = new AppNS(this);
  }
  setHeader(key, value) {
    this.xrpc.setHeader(key, value);
  }
};
var ComNS = class {
  constructor(service) {
    this._service = service;
    this.atproto = new AtprotoNS(service);
  }
};
var AtprotoNS = class {
  constructor(service) {
    this._service = service;
    this.account = new AccountNS(service);
    this.blob = new BlobNS(service);
    this.handle = new HandleNS(service);
    this.repo = new RepoNS(service);
    this.server = new ServerNS(service);
    this.session = new SessionNS(service);
    this.sync = new SyncNS(service);
  }
};
var AccountNS = class {
  constructor(service) {
    this._service = service;
  }
  create(data, opts) {
    return this._service.xrpc.call("com.atproto.account.create", opts?.qp, data, opts).catch((e) => {
      throw toKnownErr(e);
    });
  }
  createInviteCode(data, opts) {
    return this._service.xrpc.call("com.atproto.account.createInviteCode", opts?.qp, data, opts).catch((e) => {
      throw toKnownErr2(e);
    });
  }
  delete(data, opts) {
    return this._service.xrpc.call("com.atproto.account.delete", opts?.qp, data, opts).catch((e) => {
      throw toKnownErr3(e);
    });
  }
  get(params2, opts) {
    return this._service.xrpc.call("com.atproto.account.get", params2, void 0, opts).catch((e) => {
      throw toKnownErr4(e);
    });
  }
  requestPasswordReset(data, opts) {
    return this._service.xrpc.call("com.atproto.account.requestPasswordReset", opts?.qp, data, opts).catch((e) => {
      throw toKnownErr5(e);
    });
  }
  resetPassword(data, opts) {
    return this._service.xrpc.call("com.atproto.account.resetPassword", opts?.qp, data, opts).catch((e) => {
      throw toKnownErr6(e);
    });
  }
};
var BlobNS = class {
  constructor(service) {
    this._service = service;
  }
  upload(data, opts) {
    return this._service.xrpc.call("com.atproto.blob.upload", opts?.qp, data, opts).catch((e) => {
      throw toKnownErr7(e);
    });
  }
};
var HandleNS = class {
  constructor(service) {
    this._service = service;
  }
  resolve(params2, opts) {
    return this._service.xrpc.call("com.atproto.handle.resolve", params2, void 0, opts).catch((e) => {
      throw toKnownErr8(e);
    });
  }
};
var RepoNS = class {
  constructor(service) {
    this._service = service;
  }
  batchWrite(data, opts) {
    return this._service.xrpc.call("com.atproto.repo.batchWrite", opts?.qp, data, opts).catch((e) => {
      throw toKnownErr9(e);
    });
  }
  createRecord(data, opts) {
    return this._service.xrpc.call("com.atproto.repo.createRecord", opts?.qp, data, opts).catch((e) => {
      throw toKnownErr10(e);
    });
  }
  deleteRecord(data, opts) {
    return this._service.xrpc.call("com.atproto.repo.deleteRecord", opts?.qp, data, opts).catch((e) => {
      throw toKnownErr11(e);
    });
  }
  describe(params2, opts) {
    return this._service.xrpc.call("com.atproto.repo.describe", params2, void 0, opts).catch((e) => {
      throw toKnownErr12(e);
    });
  }
  getRecord(params2, opts) {
    return this._service.xrpc.call("com.atproto.repo.getRecord", params2, void 0, opts).catch((e) => {
      throw toKnownErr13(e);
    });
  }
  listRecords(params2, opts) {
    return this._service.xrpc.call("com.atproto.repo.listRecords", params2, void 0, opts).catch((e) => {
      throw toKnownErr14(e);
    });
  }
  putRecord(data, opts) {
    return this._service.xrpc.call("com.atproto.repo.putRecord", opts?.qp, data, opts).catch((e) => {
      throw toKnownErr15(e);
    });
  }
};
var ServerNS = class {
  constructor(service) {
    this._service = service;
  }
  getAccountsConfig(params2, opts) {
    return this._service.xrpc.call("com.atproto.server.getAccountsConfig", params2, void 0, opts).catch((e) => {
      throw toKnownErr16(e);
    });
  }
};
var SessionNS = class {
  constructor(service) {
    this._service = service;
  }
  create(data, opts) {
    return this._service.xrpc.call("com.atproto.session.create", opts?.qp, data, opts).catch((e) => {
      throw toKnownErr17(e);
    });
  }
  delete(data, opts) {
    return this._service.xrpc.call("com.atproto.session.delete", opts?.qp, data, opts).catch((e) => {
      throw toKnownErr18(e);
    });
  }
  get(params2, opts) {
    return this._service.xrpc.call("com.atproto.session.get", params2, void 0, opts).catch((e) => {
      throw toKnownErr19(e);
    });
  }
  refresh(data, opts) {
    return this._service.xrpc.call("com.atproto.session.refresh", opts?.qp, data, opts).catch((e) => {
      throw toKnownErr20(e);
    });
  }
};
var SyncNS = class {
  constructor(service) {
    this._service = service;
  }
  getRepo(params2, opts) {
    return this._service.xrpc.call("com.atproto.sync.getRepo", params2, void 0, opts).catch((e) => {
      throw toKnownErr21(e);
    });
  }
  getRoot(params2, opts) {
    return this._service.xrpc.call("com.atproto.sync.getRoot", params2, void 0, opts).catch((e) => {
      throw toKnownErr22(e);
    });
  }
  updateRepo(data, opts) {
    return this._service.xrpc.call("com.atproto.sync.updateRepo", opts?.qp, data, opts).catch((e) => {
      throw toKnownErr23(e);
    });
  }
};
var AppNS = class {
  constructor(service) {
    this._service = service;
    this.bsky = new BskyNS(service);
  }
};
var BskyNS = class {
  constructor(service) {
    this._service = service;
    this.actor = new ActorNS(service);
    this.embed = new EmbedNS(service);
    this.feed = new FeedNS(service);
    this.graph = new GraphNS(service);
    this.notification = new NotificationNS(service);
    this.system = new SystemNS(service);
  }
};
var ActorNS = class {
  constructor(service) {
    this._service = service;
    this.profile = new ProfileRecord(service);
  }
  createScene(data, opts) {
    return this._service.xrpc.call("app.bsky.actor.createScene", opts?.qp, data, opts).catch((e) => {
      throw toKnownErr24(e);
    });
  }
  getProfile(params2, opts) {
    return this._service.xrpc.call("app.bsky.actor.getProfile", params2, void 0, opts).catch((e) => {
      throw toKnownErr25(e);
    });
  }
  getSuggestions(params2, opts) {
    return this._service.xrpc.call("app.bsky.actor.getSuggestions", params2, void 0, opts).catch((e) => {
      throw toKnownErr26(e);
    });
  }
  search(params2, opts) {
    return this._service.xrpc.call("app.bsky.actor.search", params2, void 0, opts).catch((e) => {
      throw toKnownErr27(e);
    });
  }
  searchTypeahead(params2, opts) {
    return this._service.xrpc.call("app.bsky.actor.searchTypeahead", params2, void 0, opts).catch((e) => {
      throw toKnownErr28(e);
    });
  }
  updateProfile(data, opts) {
    return this._service.xrpc.call("app.bsky.actor.updateProfile", opts?.qp, data, opts).catch((e) => {
      throw toKnownErr29(e);
    });
  }
};
var ProfileRecord = class {
  constructor(service) {
    this._service = service;
  }
  async list(params2) {
    const res = await this._service.xrpc.call("com.atproto.repo.listRecords", {
      collection: "app.bsky.actor.profile",
      ...params2
    });
    return res.data;
  }
  async get(params2) {
    const res = await this._service.xrpc.call("com.atproto.repo.getRecord", {
      collection: "app.bsky.actor.profile",
      ...params2
    });
    return res.data;
  }
  async create(params2, record, headers) {
    record.$type = "app.bsky.actor.profile";
    const res = await this._service.xrpc.call(
      "com.atproto.repo.createRecord",
      void 0,
      { collection: "app.bsky.actor.profile", ...params2, record },
      { encoding: "application/json", headers }
    );
    return res.data;
  }
  async delete(params2, headers) {
    await this._service.xrpc.call(
      "com.atproto.repo.deleteRecord",
      void 0,
      { collection: "app.bsky.actor.profile", ...params2 },
      { headers }
    );
  }
};
var EmbedNS = class {
  constructor(service) {
    this._service = service;
  }
};
var FeedNS = class {
  constructor(service) {
    this._service = service;
    this.post = new PostRecord(service);
    this.repost = new RepostRecord(service);
    this.trend = new TrendRecord(service);
    this.vote = new VoteRecord(service);
  }
  getAuthorFeed(params2, opts) {
    return this._service.xrpc.call("app.bsky.feed.getAuthorFeed", params2, void 0, opts).catch((e) => {
      throw toKnownErr30(e);
    });
  }
  getPostThread(params2, opts) {
    return this._service.xrpc.call("app.bsky.feed.getPostThread", params2, void 0, opts).catch((e) => {
      throw toKnownErr31(e);
    });
  }
  getRepostedBy(params2, opts) {
    return this._service.xrpc.call("app.bsky.feed.getRepostedBy", params2, void 0, opts).catch((e) => {
      throw toKnownErr32(e);
    });
  }
  getTimeline(params2, opts) {
    return this._service.xrpc.call("app.bsky.feed.getTimeline", params2, void 0, opts).catch((e) => {
      throw toKnownErr33(e);
    });
  }
  getVotes(params2, opts) {
    return this._service.xrpc.call("app.bsky.feed.getVotes", params2, void 0, opts).catch((e) => {
      throw toKnownErr34(e);
    });
  }
  setVote(data, opts) {
    return this._service.xrpc.call("app.bsky.feed.setVote", opts?.qp, data, opts).catch((e) => {
      throw toKnownErr35(e);
    });
  }
};
var PostRecord = class {
  constructor(service) {
    this._service = service;
  }
  async list(params2) {
    const res = await this._service.xrpc.call("com.atproto.repo.listRecords", {
      collection: "app.bsky.feed.post",
      ...params2
    });
    return res.data;
  }
  async get(params2) {
    const res = await this._service.xrpc.call("com.atproto.repo.getRecord", {
      collection: "app.bsky.feed.post",
      ...params2
    });
    return res.data;
  }
  async create(params2, record, headers) {
    record.$type = "app.bsky.feed.post";
    const res = await this._service.xrpc.call(
      "com.atproto.repo.createRecord",
      void 0,
      { collection: "app.bsky.feed.post", ...params2, record },
      { encoding: "application/json", headers }
    );
    return res.data;
  }
  async delete(params2, headers) {
    await this._service.xrpc.call(
      "com.atproto.repo.deleteRecord",
      void 0,
      { collection: "app.bsky.feed.post", ...params2 },
      { headers }
    );
  }
};
var RepostRecord = class {
  constructor(service) {
    this._service = service;
  }
  async list(params2) {
    const res = await this._service.xrpc.call("com.atproto.repo.listRecords", {
      collection: "app.bsky.feed.repost",
      ...params2
    });
    return res.data;
  }
  async get(params2) {
    const res = await this._service.xrpc.call("com.atproto.repo.getRecord", {
      collection: "app.bsky.feed.repost",
      ...params2
    });
    return res.data;
  }
  async create(params2, record, headers) {
    record.$type = "app.bsky.feed.repost";
    const res = await this._service.xrpc.call(
      "com.atproto.repo.createRecord",
      void 0,
      { collection: "app.bsky.feed.repost", ...params2, record },
      { encoding: "application/json", headers }
    );
    return res.data;
  }
  async delete(params2, headers) {
    await this._service.xrpc.call(
      "com.atproto.repo.deleteRecord",
      void 0,
      { collection: "app.bsky.feed.repost", ...params2 },
      { headers }
    );
  }
};
var TrendRecord = class {
  constructor(service) {
    this._service = service;
  }
  async list(params2) {
    const res = await this._service.xrpc.call("com.atproto.repo.listRecords", {
      collection: "app.bsky.feed.trend",
      ...params2
    });
    return res.data;
  }
  async get(params2) {
    const res = await this._service.xrpc.call("com.atproto.repo.getRecord", {
      collection: "app.bsky.feed.trend",
      ...params2
    });
    return res.data;
  }
  async create(params2, record, headers) {
    record.$type = "app.bsky.feed.trend";
    const res = await this._service.xrpc.call(
      "com.atproto.repo.createRecord",
      void 0,
      { collection: "app.bsky.feed.trend", ...params2, record },
      { encoding: "application/json", headers }
    );
    return res.data;
  }
  async delete(params2, headers) {
    await this._service.xrpc.call(
      "com.atproto.repo.deleteRecord",
      void 0,
      { collection: "app.bsky.feed.trend", ...params2 },
      { headers }
    );
  }
};
var VoteRecord = class {
  constructor(service) {
    this._service = service;
  }
  async list(params2) {
    const res = await this._service.xrpc.call("com.atproto.repo.listRecords", {
      collection: "app.bsky.feed.vote",
      ...params2
    });
    return res.data;
  }
  async get(params2) {
    const res = await this._service.xrpc.call("com.atproto.repo.getRecord", {
      collection: "app.bsky.feed.vote",
      ...params2
    });
    return res.data;
  }
  async create(params2, record, headers) {
    record.$type = "app.bsky.feed.vote";
    const res = await this._service.xrpc.call(
      "com.atproto.repo.createRecord",
      void 0,
      { collection: "app.bsky.feed.vote", ...params2, record },
      { encoding: "application/json", headers }
    );
    return res.data;
  }
  async delete(params2, headers) {
    await this._service.xrpc.call(
      "com.atproto.repo.deleteRecord",
      void 0,
      { collection: "app.bsky.feed.vote", ...params2 },
      { headers }
    );
  }
};
var GraphNS = class {
  constructor(service) {
    this._service = service;
    this.assertion = new AssertionRecord(service);
    this.confirmation = new ConfirmationRecord(service);
    this.follow = new FollowRecord(service);
  }
  getAssertions(params2, opts) {
    return this._service.xrpc.call("app.bsky.graph.getAssertions", params2, void 0, opts).catch((e) => {
      throw toKnownErr36(e);
    });
  }
  getFollowers(params2, opts) {
    return this._service.xrpc.call("app.bsky.graph.getFollowers", params2, void 0, opts).catch((e) => {
      throw toKnownErr37(e);
    });
  }
  getFollows(params2, opts) {
    return this._service.xrpc.call("app.bsky.graph.getFollows", params2, void 0, opts).catch((e) => {
      throw toKnownErr38(e);
    });
  }
  getMembers(params2, opts) {
    return this._service.xrpc.call("app.bsky.graph.getMembers", params2, void 0, opts).catch((e) => {
      throw toKnownErr39(e);
    });
  }
  getMemberships(params2, opts) {
    return this._service.xrpc.call("app.bsky.graph.getMemberships", params2, void 0, opts).catch((e) => {
      throw toKnownErr40(e);
    });
  }
};
var AssertionRecord = class {
  constructor(service) {
    this._service = service;
  }
  async list(params2) {
    const res = await this._service.xrpc.call("com.atproto.repo.listRecords", {
      collection: "app.bsky.graph.assertion",
      ...params2
    });
    return res.data;
  }
  async get(params2) {
    const res = await this._service.xrpc.call("com.atproto.repo.getRecord", {
      collection: "app.bsky.graph.assertion",
      ...params2
    });
    return res.data;
  }
  async create(params2, record, headers) {
    record.$type = "app.bsky.graph.assertion";
    const res = await this._service.xrpc.call(
      "com.atproto.repo.createRecord",
      void 0,
      { collection: "app.bsky.graph.assertion", ...params2, record },
      { encoding: "application/json", headers }
    );
    return res.data;
  }
  async delete(params2, headers) {
    await this._service.xrpc.call(
      "com.atproto.repo.deleteRecord",
      void 0,
      { collection: "app.bsky.graph.assertion", ...params2 },
      { headers }
    );
  }
};
var ConfirmationRecord = class {
  constructor(service) {
    this._service = service;
  }
  async list(params2) {
    const res = await this._service.xrpc.call("com.atproto.repo.listRecords", {
      collection: "app.bsky.graph.confirmation",
      ...params2
    });
    return res.data;
  }
  async get(params2) {
    const res = await this._service.xrpc.call("com.atproto.repo.getRecord", {
      collection: "app.bsky.graph.confirmation",
      ...params2
    });
    return res.data;
  }
  async create(params2, record, headers) {
    record.$type = "app.bsky.graph.confirmation";
    const res = await this._service.xrpc.call(
      "com.atproto.repo.createRecord",
      void 0,
      { collection: "app.bsky.graph.confirmation", ...params2, record },
      { encoding: "application/json", headers }
    );
    return res.data;
  }
  async delete(params2, headers) {
    await this._service.xrpc.call(
      "com.atproto.repo.deleteRecord",
      void 0,
      { collection: "app.bsky.graph.confirmation", ...params2 },
      { headers }
    );
  }
};
var FollowRecord = class {
  constructor(service) {
    this._service = service;
  }
  async list(params2) {
    const res = await this._service.xrpc.call("com.atproto.repo.listRecords", {
      collection: "app.bsky.graph.follow",
      ...params2
    });
    return res.data;
  }
  async get(params2) {
    const res = await this._service.xrpc.call("com.atproto.repo.getRecord", {
      collection: "app.bsky.graph.follow",
      ...params2
    });
    return res.data;
  }
  async create(params2, record, headers) {
    record.$type = "app.bsky.graph.follow";
    const res = await this._service.xrpc.call(
      "com.atproto.repo.createRecord",
      void 0,
      { collection: "app.bsky.graph.follow", ...params2, record },
      { encoding: "application/json", headers }
    );
    return res.data;
  }
  async delete(params2, headers) {
    await this._service.xrpc.call(
      "com.atproto.repo.deleteRecord",
      void 0,
      { collection: "app.bsky.graph.follow", ...params2 },
      { headers }
    );
  }
};
var NotificationNS = class {
  constructor(service) {
    this._service = service;
  }
  getCount(params2, opts) {
    return this._service.xrpc.call("app.bsky.notification.getCount", params2, void 0, opts).catch((e) => {
      throw toKnownErr41(e);
    });
  }
  list(params2, opts) {
    return this._service.xrpc.call("app.bsky.notification.list", params2, void 0, opts).catch((e) => {
      throw toKnownErr42(e);
    });
  }
  updateSeen(data, opts) {
    return this._service.xrpc.call("app.bsky.notification.updateSeen", opts?.qp, data, opts).catch((e) => {
      throw toKnownErr43(e);
    });
  }
};
var SystemNS = class {
  constructor(service) {
    this._service = service;
    this.declaration = new DeclarationRecord(service);
  }
};
var DeclarationRecord = class {
  constructor(service) {
    this._service = service;
  }
  async list(params2) {
    const res = await this._service.xrpc.call("com.atproto.repo.listRecords", {
      collection: "app.bsky.system.declaration",
      ...params2
    });
    return res.data;
  }
  async get(params2) {
    const res = await this._service.xrpc.call("com.atproto.repo.getRecord", {
      collection: "app.bsky.system.declaration",
      ...params2
    });
    return res.data;
  }
  async create(params2, record, headers) {
    record.$type = "app.bsky.system.declaration";
    const res = await this._service.xrpc.call(
      "com.atproto.repo.createRecord",
      void 0,
      { collection: "app.bsky.system.declaration", ...params2, record },
      { encoding: "application/json", headers }
    );
    return res.data;
  }
  async delete(params2, headers) {
    await this._service.xrpc.call(
      "com.atproto.repo.deleteRecord",
      void 0,
      { collection: "app.bsky.system.declaration", ...params2 },
      { headers }
    );
  }
};

// src/session.ts
var import_events = __toESM(require("events"));
var CREATE_SESSION = "com.atproto.session.create";
var REFRESH_SESSION = "com.atproto.session.refresh";
var DELETE_SESSION = "com.atproto.session.delete";
var CREATE_ACCOUNT = "com.atproto.account.create";
var SessionClient = class extends Client2 {
  service(serviceUri) {
    const xrpcService = new SessionXrpcServiceClient(this.xrpc, serviceUri);
    return new SessionServiceClient(this, xrpcService);
  }
};
var defaultInst3 = new SessionClient();
var session_default = defaultInst3;
var SessionServiceClient = class extends ServiceClient2 {
  constructor(baseClient, xrpcService) {
    super(baseClient, xrpcService);
    this.sessionManager = this.xrpc.sessionManager;
  }
};
var SessionXrpcServiceClient = class extends ServiceClient {
  constructor(baseClient, serviceUri) {
    super(baseClient, serviceUri);
    this.sessionManager = new SessionManager();
    this.sessionManager.on("session", () => {
      const accessHeaders = this.sessionManager.accessHeaders();
      if (accessHeaders) {
        this.setHeader("authorization", accessHeaders.authorization);
      } else {
        this.unsetHeader("authorization");
      }
    });
  }
  async call(methodNsid, params2, data, opts) {
    const original = (overrideOpts) => super.call(methodNsid, params2, data, overrideOpts ?? opts);
    if (opts?.headers?.authorization) {
      return await original();
    }
    if (methodNsid === REFRESH_SESSION) {
      return await this.refresh(opts);
    }
    await this.refreshing;
    if (methodNsid === CREATE_SESSION || methodNsid === CREATE_ACCOUNT) {
      const result = await original();
      const { accessJwt, refreshJwt } = result.data;
      this.sessionManager.set({ accessJwt, refreshJwt });
      return result;
    }
    if (methodNsid === DELETE_SESSION) {
      const result = await original({
        ...opts,
        headers: {
          ...opts?.headers,
          ...this.sessionManager.refreshHeaders()
        }
      });
      this.sessionManager.unset();
      return result;
    }
    try {
      return await original();
    } catch (err) {
      if (err instanceof XRPCError && err.status === 400 /* InvalidRequest */ && err.error === "ExpiredToken" && this.sessionManager.active()) {
        await this.refresh(opts);
        return await original();
      }
      throw err;
    }
  }
  async refresh(opts) {
    this.refreshing ?? (this.refreshing = this._refresh(opts));
    try {
      return await this.refreshing;
    } finally {
      this.refreshing = void 0;
    }
  }
  async _refresh(opts) {
    try {
      const result = await super.call(REFRESH_SESSION, void 0, void 0, {
        ...opts,
        headers: {
          ...opts?.headers,
          ...this.sessionManager.refreshHeaders()
        }
      });
      const { accessJwt, refreshJwt } = result.data;
      this.sessionManager.set({ accessJwt, refreshJwt });
      return result;
    } catch (err) {
      if (err instanceof XRPCError && err.status === 400 /* InvalidRequest */ && (err.error === "ExpiredToken" || err.error === "InvalidToken")) {
        this.sessionManager.unset();
      }
      throw err;
    }
  }
};
var SessionManager = class extends import_events.default {
  get() {
    return this.session;
  }
  set(session) {
    this.session = session;
    this.emit("session", session);
  }
  unset() {
    this.session = void 0;
    this.emit("session", void 0);
  }
  active() {
    return !!this.session;
  }
  accessHeaders() {
    return this.session && {
      authorization: `Bearer ${this.session.accessJwt}`
    };
  }
  refreshHeaders() {
    return this.session && {
      authorization: `Bearer ${this.session.refreshJwt}`
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  APP_BSKY_GRAPH,
  APP_BSKY_SYSTEM,
  AccountNS,
  ActorNS,
  AppBskyActorCreateScene,
  AppBskyActorGetProfile,
  AppBskyActorGetSuggestions,
  AppBskyActorProfile,
  AppBskyActorRef,
  AppBskyActorSearch,
  AppBskyActorSearchTypeahead,
  AppBskyActorUpdateProfile,
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyFeedFeedViewPost,
  AppBskyFeedGetAuthorFeed,
  AppBskyFeedGetPostThread,
  AppBskyFeedGetRepostedBy,
  AppBskyFeedGetTimeline,
  AppBskyFeedGetVotes,
  AppBskyFeedPost,
  AppBskyFeedRepost,
  AppBskyFeedSetVote,
  AppBskyFeedTrend,
  AppBskyFeedVote,
  AppBskyGraphAssertCreator,
  AppBskyGraphAssertMember,
  AppBskyGraphAssertion,
  AppBskyGraphConfirmation,
  AppBskyGraphFollow,
  AppBskyGraphGetAssertions,
  AppBskyGraphGetFollowers,
  AppBskyGraphGetFollows,
  AppBskyGraphGetMembers,
  AppBskyGraphGetMemberships,
  AppBskyNotificationGetCount,
  AppBskyNotificationList,
  AppBskyNotificationUpdateSeen,
  AppBskySystemActorScene,
  AppBskySystemActorUser,
  AppBskySystemDeclRef,
  AppBskySystemDeclaration,
  AppNS,
  AssertionRecord,
  AtprotoNS,
  BlobNS,
  BskyNS,
  Client,
  ComAtprotoAccountCreate,
  ComAtprotoAccountCreateInviteCode,
  ComAtprotoAccountDelete,
  ComAtprotoAccountGet,
  ComAtprotoAccountRequestPasswordReset,
  ComAtprotoAccountResetPassword,
  ComAtprotoBlobUpload,
  ComAtprotoHandleResolve,
  ComAtprotoRepoBatchWrite,
  ComAtprotoRepoCreateRecord,
  ComAtprotoRepoDeleteRecord,
  ComAtprotoRepoDescribe,
  ComAtprotoRepoGetRecord,
  ComAtprotoRepoListRecords,
  ComAtprotoRepoPutRecord,
  ComAtprotoRepoStrongRef,
  ComAtprotoServerGetAccountsConfig,
  ComAtprotoSessionCreate,
  ComAtprotoSessionDelete,
  ComAtprotoSessionGet,
  ComAtprotoSessionRefresh,
  ComAtprotoSyncGetRepo,
  ComAtprotoSyncGetRoot,
  ComAtprotoSyncUpdateRepo,
  ComNS,
  ConfirmationRecord,
  DeclarationRecord,
  EmbedNS,
  FeedNS,
  FollowRecord,
  GraphNS,
  HandleNS,
  NotificationNS,
  PostRecord,
  ProfileRecord,
  RepoNS,
  RepostRecord,
  ServerNS,
  ServiceClient,
  SessionClient,
  SessionManager,
  SessionNS,
  SessionServiceClient,
  SessionXrpcServiceClient,
  SyncNS,
  SystemNS,
  TrendRecord,
  VoteRecord,
  sessionClient
});
//# sourceMappingURL=index.js.map

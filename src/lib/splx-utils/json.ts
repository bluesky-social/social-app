export type JsonKey = string | number | symbol;
export interface Json {
  [key: JsonKey]: any;
}

export type Literal<T, A = string> = T extends A
  ? string extends T
    ? never
    : T
  : never

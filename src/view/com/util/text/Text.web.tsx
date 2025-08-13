import { Text as RNText,type TextProps as RNTextProps } from 'react-native';

export type CustomTextProps = RNTextProps & {
  type?: string;
  lineHeight?: number;
  title?: string;
  dataSet?: Record<string, string | number>;
  selectable?: boolean;
  emoji?: boolean;
};

export function Text(props: CustomTextProps) {
  // Emoji and other custom props are ignored for web
  return <RNText {...props}>{props.children}</RNText>;
}


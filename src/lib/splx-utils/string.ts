import MD5 from 'crypto-js/md5';

export function md5(str: string, cfg?: object): string {
  return MD5(str, cfg).toString();
}
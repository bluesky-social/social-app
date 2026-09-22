import Head from 'expo-router/head'

export function RouteTitle({title}: {title?: string}) {
  return title ? (
    <Head>
      <title>{title}</title>
    </Head>
  ) : null
}

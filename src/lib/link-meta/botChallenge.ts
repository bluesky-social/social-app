/**
 * Page titles of bot-challenge interstitials. If cardyb reports one of these
 * as a page's title, it scraped the interstitial rather than the page, and
 * the resulting card would be useless.
 */
const BOT_CHALLENGE_TITLES = new Set(
  [
    /*
     * Anubis (https://anubis.techaro.lol), every locale it ships, from
     * lib/localization/locales/*.json "making_sure_not_bot".
     */
    'Bekrefter at du ikke er en bot!',
    'Bot olmadığınızdan emin oluyoruz!',
    'Certificando de que você não é um bot!',
    'Controllo se sei un robot...',
    'Dein Browser wird geprüft!',
    'Even checken of je een bot bent!',
    'Geng úr skugga um að þú sért ekki botti!',
    "Je m'assure que vous n'êtes pas un robot !",
    'Kollar så att du inte är en bot!',
    'Kontrollime, et sa ei ole bott!',
    "Making sure you're not a bot!",
    'Provjeravamo da niste bot!',
    'Robota ez zarela ziurtatzen!',
    'Sinisigurado na hindi ka isang bot!',
    'Sprawdzamy, czy nie jesteś botem!',
    'Stadfester at du ikkje er bot!',
    'Stengiamasi užtikrinti, jog jūs nesate robotas!',
    'Ujišťujeme se, že nejste robot!',
    'Varmistetaan ettet ole robotti!',
    '¡Asegurándonos de que no eres un robot!',
    'Đảm bảo bạn không phải là bot!',
    'Перевірка, чи ви не бот!',
    'Проверяем, что вы не бот!',
    'Уверяваме се, че не си бот!',
    'ตรวจสอบให้แน่ใจว่าคุณไม่ใช่บอท!',
    'あなたがボットでないことを確認しています！',
    '正在确认你是不是机器人！',
    '正在確認你是不是機器人！',
    // Cloudflare managed challenge (served with `cf-mitigated: challenge`)
    'Just a moment...',
  ].map(normalizeTitle),
)

/**
 * Whether a page title is that of a known bot-challenge interstitial.
 */
export function isBotChallengeTitle(title: string | undefined): boolean {
  if (!title) return false
  return BOT_CHALLENGE_TITLES.has(normalizeTitle(title))
}

/*
 * The interstitials' titles are HTML-escaped at the source (Anubis sends
 * "you&#39;re"), so tolerate that and typographic variants in case they
 * survive scraping.
 */
function normalizeTitle(title: string): string {
  return title
    .replace(/&(#39|#x27|apos);/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, '...')
    .trim()
}

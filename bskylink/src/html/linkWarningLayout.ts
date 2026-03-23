import escapeHTML from 'escape-html'

export function linkWarningLayout(
  title: string,
  containerContents: string,
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta
          http-equiv="Cache-Control"
          content="no-store, no-cache, must-revalidate, max-age=0" />
        <meta http-equiv="Pragma" content="no-cache" />
        <meta http-equiv="Expires" content="0" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHTML(title)}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family:
              -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial,
              sans-serif;
            background-color: #ffffff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            width: 100%;
            max-width: 400px;
            text-align: center;
          }
          .warning-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          h1 {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #000000;
          }
          .warning-text {
            font-size: 15px;
            color: #536471;
            line-height: 1.4;
            margin-bottom: 24px;
            padding: 0 20px;
          }
          .blocked-site {
            background-color: #f7f9fa;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
            text-align: left;
            word-break: break-all;
          }
          .site-name {
            font-size: 16px;
            font-weight: 500;
            color: #000000;
            margin-bottom: 4px;
            word-break: break-word;
            display: block;
            text-align: center;
          }
          .site-url {
            font-size: 14px;
            color: #536471;
            word-break: break-all;
            display: block;
            text-align: center;
          }
          .button {
            border: none;
            border-radius: 24px;
            padding: 12px 32px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            max-width: 280px;
            transition: background-color 0.2s;
          }
          .primary {
            background-color: #1d9bf0;
            color: white;
          }
          .secondary {
          }
          .back-button:hover {
            background-color: #1a8cd8;
          }
          .back-button:active {
            background-color: #1681c4;
          }
          @media (max-width: 480px) {
            .warning-text {
              padding: 0 10px;
            }
            .blocked-site {
              padding: 8px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">${containerContents}</div>
      </body>
    </html>
  `
}

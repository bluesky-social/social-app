import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, basename } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function csvToJson(csv, filename) {
  const res = {
    filename,
    data: []
  }
  const [header, ...rows] = csv.split('\n').filter(Boolean)
  const headers = header.split('\t')

  for (const row of rows) {
    const o = {}
    const columns = row.split('\t')
    for (let i = 0; i < columns.length; i++) {
      const [header, type] = headers[i].split(':')
      o[header] = applyColumnType(sanitize(type), sanitize(columns[i]))
    }
    res.data.push(o)
  }

  return res
}

function sanitize(value) {
  return value.trim().replace(/(\r\n|\n|\r)/gm, "")
}

function applyColumnType(type, value) {
  switch (type) {
    case 'number':
      return Number(value)
    case 'boolean':
      return value === 'true'
    case 'array':
      return value.split(',').map(v => v.trim())
    default:
      return value
  }
}

const tsvs = readdirSync(join(__dirname, 'tsvs'))
  .filter(f => f.endsWith('.tsv'))
  .map(f => join(__dirname, 'tsvs', f));

const jsons = tsvs.map(f => {
  return csvToJson(readFileSync(f, 'utf8'), f);
})

jsons.map(json => {
  const out = join(__dirname, 'outputs', `${basename(json.filename, '.tsv')}.json`)
  const file = JSON.stringify(json.data, null, 2)
  writeFileSync(out, file)
})

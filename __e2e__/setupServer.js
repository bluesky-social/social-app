// eslint-disable-next-line no-undef
var res = http.post('http://localhost:1986/' + SERVER_PATH, {
  headers: {'Content-Type': 'text/plain'},
  body: '',
})

// eslint-disable-next-line no-undef
output.result = json(res.body).appviewDid

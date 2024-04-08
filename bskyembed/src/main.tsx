import './index.css'

import {h, render} from 'preact'

import {App} from './app'

const root = document.getElementById('app')
if (!root) throw new Error('No root element')
render(<App />, root)

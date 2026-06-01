#!/usr/bin/env node
/**
 * Generate PNG app icons from resources/lenden-app-icon.svg
 * Usage: node scripts/generate-lenden-icons.mjs
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Resvg } from '@resvg/resvg-js'

const root = process.cwd()
const svgPath = resolve(root, 'resources/lenden-app-icon.svg')
const publicIconsDir = resolve(root, 'public/icons')
const iosIconPath = resolve(
  root,
  'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png',
)

if (!existsSync(svgPath)) {
  console.error('Missing resources/lenden-app-icon.svg')
  process.exit(1)
}

mkdirSync(publicIconsDir, { recursive: true })

const svg = readFileSync(svgPath)

function renderPng(outputPath, width) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
  })
  const pngData = resvg.render()
  writeFileSync(outputPath, pngData.asPng())
}

renderPng(resolve(publicIconsDir, 'icon-192.png'), 192)
renderPng(resolve(publicIconsDir, 'icon-512.png'), 512)
renderPng(iosIconPath, 1024)

writeFileSync(
  resolve(publicIconsDir, 'apple-touch-icon.png'),
  readFileSync(resolve(publicIconsDir, 'icon-512.png')),
)

console.log('Generated LenDen icons:')
console.log(' - public/icons/icon-192.png')
console.log(' - public/icons/icon-512.png')
console.log(' - public/icons/apple-touch-icon.png')
console.log(' - ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png')

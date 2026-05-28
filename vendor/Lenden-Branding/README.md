# Lenden Branding

Brand tokens for the Lenden investing app — growing graph mark, logo typography, colors.

## Sync from GitHub

When the remote repo is available:

```bash
cd vendor
rm -rf Lenden-Branding
git clone https://github.com/mxm6990/Lenden-Branding.git
cd Lenden-Branding
npm install
```

Then from the main LenDen app root:

```bash
npm install
```

## Dev preview

```bash
npm run dev
```

## Usage

```ts
import { colors, brandMarkPaths, logoLockups } from '@lenden/branding'

const logo = logoLockups.englishDark
```

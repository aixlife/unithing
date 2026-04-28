import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const appDir = join(process.cwd(), 'src', 'app');

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function svgText(text, attrs = '') {
  return `<text ${attrs}>${escapeXml(text)}</text>`;
}

function shareSvg({ twitter = false } = {}) {
  const detailOpacity = twitter ? '0.92' : '1';
  return `
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#F8FBFF"/>
      <stop offset="0.52" stop-color="#EEF6FF"/>
      <stop offset="1" stop-color="#F7FCF7"/>
    </linearGradient>
    <linearGradient id="blue" x1="94" y1="112" x2="430" y2="466" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#1B64DA"/>
      <stop offset="1" stop-color="#0046A6"/>
    </linearGradient>
    <linearGradient id="mint" x1="735" y1="151" x2="1042" y2="474" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#41D6A4"/>
      <stop offset="1" stop-color="#0E8F75"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#154179" flood-opacity="0.16"/>
    </filter>
  </defs>

  <rect width="1200" height="630" rx="0" fill="url(#bg)"/>
  <circle cx="1038" cy="96" r="176" fill="#D8F5EA" opacity="0.68"/>
  <circle cx="112" cy="536" r="156" fill="#DCEBFF" opacity="0.72"/>

  <g filter="url(#shadow)">
    <rect x="82" y="76" width="1036" height="478" rx="38" fill="white"/>
    <rect x="82" y="76" width="1036" height="478" rx="38" stroke="#D9E6F5" stroke-width="2"/>
  </g>

  <g transform="translate(126 126)">
    <rect width="96" height="96" rx="26" fill="url(#blue)"/>
    <path d="M29 28V57C29 75 40.4 84 56.5 84C72.6 84 84 75 84 57V28H69.5V56.2C69.5 65.7 64.8 70.4 56.5 70.4C48.1 70.4 43.5 65.7 43.5 56.2V28H29Z" fill="white"/>
    <circle cx="84" cy="21" r="10" fill="#41D6A4"/>
  </g>

  ${svgText('UNITHING', 'x="126" y="286" fill="#111827" font-family="Arial, Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="82" font-weight="900" letter-spacing="1"')}
  ${svgText('AI 생기부 분석과 진학 상담을 한 화면에', 'x="130" y="348" fill="#273449" font-family="Arial, Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="34" font-weight="800"')}
  ${svgText('대학 찾기 · 과목 가이드 · 세특 설계 · 상담 로드맵', 'x="130" y="398" fill="#667085" font-family="Arial, Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="24" font-weight="700"')}

  <g transform="translate(126 444)" opacity="${detailOpacity}">
    <rect width="142" height="42" rx="21" fill="#EBF2FF"/>
    ${svgText('생기부 분석', 'x="28" y="28" fill="#1B64DA" font-family="Arial, Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="17" font-weight="800"')}
    <rect x="154" width="120" height="42" rx="21" fill="#EAFBF4"/>
    ${svgText('진학 상담', 'x="181" y="28" fill="#0E8F75" font-family="Arial, Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="17" font-weight="800"')}
    <rect x="286" width="118" height="42" rx="21" fill="#FFF2DE"/>
    ${svgText('선생님용', 'x="313" y="28" fill="#B45309" font-family="Arial, Apple SD Gothic Neo, Noto Sans KR, sans-serif" font-size="17" font-weight="800"')}
  </g>

  <g transform="translate(720 142)" filter="url(#shadow)">
    <rect x="0" y="22" width="286" height="344" rx="28" fill="#FFFFFF" stroke="#D9E6F5" stroke-width="2"/>
    <rect x="28" y="54" width="156" height="18" rx="9" fill="#D5E6FF"/>
    <rect x="28" y="93" width="224" height="12" rx="6" fill="#E6EDF6"/>
    <rect x="28" y="119" width="196" height="12" rx="6" fill="#E6EDF6"/>
    <rect x="28" y="145" width="232" height="12" rx="6" fill="#E6EDF6"/>
    <rect x="28" y="190" width="230" height="58" rx="16" fill="#F3F7FC" stroke="#E0E8F2"/>
    <rect x="48" y="210" width="94" height="12" rx="6" fill="#1B64DA"/>
    <rect x="48" y="230" width="154" height="10" rx="5" fill="#B8D1F7"/>
    <rect x="28" y="270" width="230" height="58" rx="16" fill="#F1FCF7" stroke="#D2F2E4"/>
    <rect x="48" y="290" width="112" height="12" rx="6" fill="#0E8F75"/>
    <rect x="48" y="310" width="146" height="10" rx="5" fill="#A6E7D2"/>
  </g>

  <g transform="translate(965 115)">
    <circle cx="70" cy="70" r="70" fill="url(#mint)"/>
    <path d="M46 72L64 90L100 48" stroke="white" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <g transform="translate(657 408)">
    <rect width="118" height="118" rx="30" fill="#FEF3C7"/>
    <path d="M32 80C47 48 68 48 84 64C93 73 99 70 106 54" stroke="#D97706" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="32" cy="80" r="10" fill="#D97706"/>
    <circle cx="84" cy="64" r="10" fill="#D97706"/>
    <circle cx="106" cy="54" r="10" fill="#D97706"/>
    <path d="M36 35H82" stroke="#B45309" stroke-width="8" stroke-linecap="round"/>
  </g>
</svg>`;
}

function iconSvg(size = 512) {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="iconBg" x1="90" y1="54" x2="420" y2="456" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#1B64DA"/>
      <stop offset="1" stop-color="#0046A6"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#iconBg)"/>
  <path d="M154 142V292C154 388 215 436 301 436C387 436 448 388 448 292V142H370V288C370 338 345 363 301 363C256 363 232 338 232 288V142H154Z" fill="white"/>
  <circle cx="416" cy="100" r="48" fill="#41D6A4"/>
  <path d="M394 101L410 117L441 80" stroke="white" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

async function pngFromSvg(svg, output, options = {}) {
  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .resize(options.resize)
    .toFile(join(appDir, output));
}

function makeIco(entries) {
  const headerSize = 6 + entries.length * 16;
  let offset = headerSize;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  entries.forEach(({ size, data }, index) => {
    const pos = 6 + index * 16;
    header.writeUInt8(size >= 256 ? 0 : size, pos);
    header.writeUInt8(size >= 256 ? 0 : size, pos + 1);
    header.writeUInt8(0, pos + 2);
    header.writeUInt8(0, pos + 3);
    header.writeUInt16LE(1, pos + 4);
    header.writeUInt16LE(32, pos + 6);
    header.writeUInt32LE(data.length, pos + 8);
    header.writeUInt32LE(offset, pos + 12);
    offset += data.length;
  });

  return Buffer.concat([header, ...entries.map(entry => entry.data)]);
}

async function faviconFromSvg(svg) {
  const entries = await Promise.all(
    [16, 32, 48].map(async size => ({
      size,
      data: await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer(),
    })),
  );
  await writeFile(join(appDir, 'favicon.ico'), makeIco(entries));
}

await pngFromSvg(shareSvg(), 'opengraph-image.png');
await pngFromSvg(shareSvg({ twitter: true }), 'twitter-image.png');
await pngFromSvg(iconSvg(512), 'icon.png');
await pngFromSvg(iconSvg(180), 'apple-icon.png', { resize: { width: 180, height: 180 } });
await faviconFromSvg(iconSvg(256));

await writeFile(
  join(appDir, 'opengraph-image.alt.txt'),
  'UNITHING - AI 생기부 분석과 진학 상담을 한 화면에',
);
await writeFile(
  join(appDir, 'twitter-image.alt.txt'),
  'UNITHING - AI 생기부 분석과 진학 상담을 한 화면에',
);

console.log('Generated UNITHING share and icon assets.');

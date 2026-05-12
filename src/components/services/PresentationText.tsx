'use client';

import { Fragment } from 'react';
import type { CSSProperties } from 'react';

const DEFAULT_TEXT = '#191F28';
const DEFAULT_FONT = "'Pretendard Variable', Pretendard, sans-serif";

export function stripPresentationMarkdown(value: string) {
  return value
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .trim();
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatPrintInlineHtml(value: string) {
  return escapeHtml(value.replace(/^#{1,6}\s+/gm, ''))
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />');
}

export function formatPrintHtmlBlock(value: string, emptyText = '-') {
  const paragraphs = (value || emptyText)
    .replace(/^#{1,6}\s+/gm, '')
    .split(/\n{2,}/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const safeParagraphs = paragraphs.length > 0 ? paragraphs : [emptyText];
  return safeParagraphs
    .map((paragraph) => `<p>${formatPrintInlineHtml(paragraph)}</p>`)
    .join('');
}

export function renderInlineMarkdown(value: string) {
  const normalized = value.replace(/^#{1,6}\s+/, '');
  return normalized.split(/(\*\*.+?\*\*)/g).filter(Boolean).map((part, index) => {
    const bold = part.match(/^\*\*(.+?)\*\*$/);
    if (bold) return <strong key={index}>{bold[1]}</strong>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}

export function PresentationText({
  value,
  emptyText = '-',
  fontSize = 15,
  color = DEFAULT_TEXT,
  lineHeight = 1.75,
  paragraphGap = 10,
  style,
}: {
  value: string;
  emptyText?: string;
  fontSize?: number;
  color?: string;
  lineHeight?: number;
  paragraphGap?: number;
  style?: CSSProperties;
}) {
  const paragraphs = (value || emptyText)
    .replace(/^#{1,6}\s+/gm, '')
    .split(/\n{2,}/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const safeParagraphs = paragraphs.length > 0 ? paragraphs : [emptyText];

  return (
    <>
      {safeParagraphs.map((paragraph, index) => (
        <p
          key={`${index}-${paragraph.slice(0, 24)}`}
          style={{
            margin: index === 0 ? 0 : `${paragraphGap}px 0 0`,
            fontSize,
            color,
            lineHeight,
            fontFamily: DEFAULT_FONT,
            ...style,
          }}
        >
          {paragraph.split('\n').map((line, lineIndex) => (
            <Fragment key={`${lineIndex}-${line.slice(0, 16)}`}>
              {lineIndex > 0 && <br />}
              {renderInlineMarkdown(line)}
            </Fragment>
          ))}
        </p>
      ))}
    </>
  );
}

import { useEffect } from 'react';
import { formatJstDateWithWeekday } from '../logic/dateTimeDisplay';

const dateTimePattern = /(\d{4}-\d{2}-\d{2})(?:（[日月火水木金土]）)?\s?(\d{2}:\d{2}) 日本時間/g;
const plainDatePattern = /^(\d{4}-\d{2}-\d{2})$/;

const calendarHelperText = '端末やブラウザによっては、ダウンロード後にカレンダーアプリで開く操作が必要です。通知時間はカレンダーアプリ側で調整してください。';

const formatVisibleText = (text: string): string => {
  const withDateTime = text.replace(dateTimePattern, (_match: string, date: string, time: string) => `${formatJstDateWithWeekday(date)}${time} 日本時間`);
  const plainDate = withDateTime.match(plainDatePattern);
  return plainDate?.[1] ? formatJstDateWithWeekday(plainDate[1]) : withDateTime;
};

const findElementByText = (text: string): HTMLElement | null => {
  const elements = Array.from(document.querySelectorAll<HTMLElement>('h1, h2, h3, p, span, button'));
  return elements.find((element) => element.textContent?.trim() === text) ?? null;
};

const ensureSiblingAfter = (anchor: HTMLElement, marker: string, tagName: 'p' | 'span', className: string, text: string): HTMLElement => {
  const parent = anchor.parentElement;
  const existing = parent?.querySelector<HTMLElement>(`[data-beta-polish="${marker}"]`);
  if (existing) {
    existing.textContent = text;
    return existing;
  }

  const element = document.createElement(tagName);
  element.dataset.betaPolish = marker;
  element.className = className;
  element.textContent = text;
  anchor.insertAdjacentElement('afterend', element);
  return element;
};

const polishTextNodes = () => {
  const root = document.getElementById('root');
  if (!root) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent || parent.closest('script, style')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  nodes.forEach((node) => {
    const nextText = formatVisibleText(node.nodeValue ?? '');
    if (node.nodeValue !== nextText) node.nodeValue = nextText;
  });
};

const polishStaticCopy = () => {
  const headerEyebrow = findElementByText('日本時間で見るW杯ガイド');
  if (headerEyebrow) {
    ensureSiblingAfter(
      headerEyebrow,
      'tournament-badge',
      'span',
      'mt-2 inline-flex w-fit rounded-full border border-cyan-300/40 bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-200',
      '2026 FIFA World Cup 対応',
    );
  }

  const thirdPlaceText = findElementByText('8位を現在の通過ラインとして表示します。');
  if (thirdPlaceText) {
    thirdPlaceText.textContent = '各組3位のうち、成績上位8チームが通過します。ここでは現在の8番目をボーダーとして表示します。';
  }

  const scheduleDescription = findElementByText('見たい切り口を選んで、全72試合から必要な試合だけを絞り込めます。');
  if (scheduleDescription) {
    ensureSiblingAfter(scheduleDescription, 'schedule-jst-note', 'p', 'text-xs leading-5 text-cyan-200', '日付と時刻はすべて日本時間で表示しています。');
  }

  const settingsDescription = findElementByText('応援する国の設定はこの端末のブラウザに保存されます。');
  if (settingsDescription) {
    settingsDescription.textContent = '応援する国の設定はこの端末のブラウザに保存されます。応援する国を設定すると、Homeのおすすめ試合や日程フィルターに反映されます。メインで応援する国はおすすめ試合の優先度に強く反映されます。一緒に追いかける国は、日程フィルターや関連試合に反映されます。';
  }

  document.querySelectorAll<HTMLButtonElement>('button').forEach((button) => {
    const label = button.textContent?.trim();
    if (label === 'この試合を共有') {
      ensureSiblingAfter(button, 'share-helper', 'p', 'text-xs leading-5 text-slate-400', 'XやLINEに貼れる共有文をコピーします。');
    }

    if (label === 'カレンダーに追加') {
      ensureSiblingAfter(button, 'calendar-helper', 'p', 'text-xs leading-5 text-slate-400', calendarHelperText);
    }
  });
};

export function BetaDisplayPolish() {
  useEffect(() => {
    let scheduled = false;

    const polish = () => {
      scheduled = false;
      polishStaticCopy();
      polishTextNodes();
    };

    const schedulePolish = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(polish);
    };

    polish();
    const observer = new MutationObserver(schedulePolish);
    observer.observe(document.getElementById('root') ?? document.body, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, []);

  return null;
}

/**
 * 涿鹿方言音调标注渲染系统
 * 将词条 headword 中的音调标记解析并渲染为带样式的 HTML
 */

const ToneRenderer = {
  /**
   * 渲染词条的词头，将音调标记转为带样式的HTML
   * 识别: k/K(入声), 1-4(四声), ~(长音), 儿(儿化)
   */
  render(headword) {
    if (!headword) return '';
    const tokens = this.tokenize(headword);
    return tokens.map(t => this.tokenToHTML(t)).join('');
  },

  /**
   * 词法分析：将文本拆分为 token 流
   * 每个 token: { text, type } 其中 type = char|tone1-4|rusheng|long|erhua|paren
   */
  tokenize(text) {
    const tokens = [];
    let i = 0;
    while (i < text.length) {
      const ch = text[i];
      const prev = tokens.length > 0 ? tokens[tokens.length - 1] : null;

      // 括号内的拼音标注，如 (nga)、（XIAO2）
      if (ch === '(' || ch === '（') {
        let j = i + 1;
        while (j < text.length && text[j] !== ')' && text[j] !== '）') j++;
        const inner = text.substring(i, j + 1);
        tokens.push({ text: inner, type: 'paren' });
        i = j + 1;
        continue;
      }

      // 入声标记 k/K（前面必须是汉字类 token）
      if ((ch === 'k' || ch === 'K') && prev && prev.type === 'char') {
        tokens.push({ text: 'k', type: 'rusheng' });
        i++;
        continue;
      }

      // 声调数字 1-4（前面有 token 且不在括号/拼音中）
      if ('1234'.includes(ch) && prev && (prev.type === 'char' || prev.type === 'rusheng')) {
        tokens.push({ text: ch, type: 'tone' + ch });
        i++;
        continue;
      }

      // 长音标记
      if (ch === '~') {
        tokens.push({ text: '~', type: 'long' });
        i++;
        continue;
      }

      // 儿化音（前面是汉字）
      if (ch === '儿' && prev && prev.type === 'char') {
        tokens.push({ text: '儿', type: 'erhua' });
        i++;
        continue;
      }

      // 空格跳过
      if (ch === ' ' || ch === '\u3000') {
        i++;
        continue;
      }

      // 普通字符
      if (ch.trim()) {
        tokens.push({ text: ch, type: 'char' });
      }
      i++;
    }
    return tokens;
  },

  /**
   * 将单个 token 转为 HTML 字符串
   */
  tokenToHTML(token) {
    switch (token.type) {
      case 'char':
        return `<span class="tone-char">${this.esc(token.text)}</span>`;
      case 'tone1':
        return `<sup class="tone-badge t1">1</sup>`;
      case 'tone2':
        return `<sup class="tone-badge t2">2</sup>`;
      case 'tone3':
        return `<sup class="tone-badge t3">3</sup>`;
      case 'tone4':
        return `<sup class="tone-badge t4">4</sup>`;
      case 'rusheng':
        return `<sup class="tone-badge rusheng">入</sup>`;
      case 'long':
        return `<span class="tone-badge long">～</span>`;
      case 'erhua':
        return `<span class="tone-badge erhua">儿</span>`;
      case 'paren':
        return `<span class="tone-paren" style="font-size:.75em;color:var(--text3)">${this.esc(token.text)}</span>`;
      default:
        return this.esc(token.text);
    }
  },

  esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
};

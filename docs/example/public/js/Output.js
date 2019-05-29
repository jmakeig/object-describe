function Output() {
  const outputEl = document.querySelector('#output');
  return {
    set hierarchy(h) {
      outputEl.innerHTML = render.renderHTML(h);
    },
    set message({ text, type }) {
      if (text) {
        outputEl.innerHTML = `
          <div class="message ${type}">
            ${text}
          </div>
        `;
      } else {
        outputEl.innerHTML = '';
      }
    }
  };
}

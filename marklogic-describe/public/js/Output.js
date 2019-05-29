function Output() {
  const outputEl = document.querySelector('#output');
  return {
    set hierarchy(h) {
      outputEl.innerHTML = render.renderHTML(h);
    },
    set message({ text, type }) {
      outputEl.innerHTML = `
      <div class="message ${type}">
        ${text}
      </div>
      `;
    }
  };
}

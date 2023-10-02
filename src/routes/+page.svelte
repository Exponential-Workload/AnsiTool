<script lang="ts">
  import optimizeAnsi from '$lib/optimizeAnsi';

  // Import statements
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';

  // Variables
  let textareaContent = `Hello!`;
  const copyCount = writable(0);

  type Mode = {
    displayName: string;
    name: string;
    extendedColours: boolean;
    extendedFormatting: boolean;
    badge?: string | null;
  };

  const modes: Record<string, Mode> = {
    'style-vscode-default': {
      displayName: 'VSCode',
      name: 'style-vscode-default',
      extendedColours: true,
      extendedFormatting: true,
      badge: 'Extended',
    },
    'style-pastel': {
      displayName: 'Pastel',
      name: 'style-pastel',
      extendedColours: true,
      extendedFormatting: true,
      badge: 'Extended',
    },
    'style-gnome': {
      displayName: 'Gnome',
      name: 'style-gnome',
      extendedColours: true,
      extendedFormatting: true,
      badge: 'Extended',
    },
    'style-discord': {
      displayName: 'Discord',
      name: 'style-discord',
      extendedColours: false,
      extendedFormatting: false,
      badge: null,
    },
  };
  let mode = modes['style-pastel'];

  let assigned = false;
  $: {
    if (typeof localStorage !== 'undefined') {
      const storedMode = localStorage.getItem('mode');
      if (storedMode && !assigned)
        // @ts-ignore
        mode = modes[storedMode] ?? mode;
      else localStorage.setItem('mode', mode.name);
    }
  }

  let textarea: HTMLDivElement;

  // Function to convert nodes to ANSI text
  const nodesToANSI = (nodes: Node[], states: any[]) => {
    let text = '';
    for (const node of nodes) {
      if (node.nodeType === 3) {
        text += node.textContent;
        continue;
      }
      if (node.nodeName === 'BR') {
        text += '\n';
        continue;
      }
      // @ts-ignore
      const ansiCode = +node.className.split('-')[1];
      const newState = { ...states.at(-1) };

      if (ansiCode < 30) newState.st = ansiCode;
      if (ansiCode >= 30 && ansiCode < 40) newState.fg = ansiCode;
      if (ansiCode >= 40) newState.bg = ansiCode;

      states.push(newState);
      const val2 = ansiCode >= 40 ? newState.bg : newState.fg;
      text += `\x1b[${newState.st}${val2 !== 0 ? `;${val2}` : ''}m`;

      // @ts-ignore
      text += nodesToANSI(node.childNodes, states);
      states.pop();
      text += '\x1b[0m';
      if (states.at(-1).fg !== 2)
        text += `\x1b[${states.at(-1).st};${states.at(-1).fg}m`;
      if (states.at(-1).bg !== 2)
        text += `\x1b[${states.at(-1).st};${states.at(-1).bg}m`;
    }
    return text;
  };

  // On Mount
  onMount(() => {
    // Input event listener
    textarea.addEventListener('input', () => {
      const base = textarea.innerHTML.replace(
        /<(\/?(br|span|span class="ansi-[0-9]*"))>/g,
        '[$1]'
      );
      if (base.includes('<') || base.includes('>')) {
        textarea.innerHTML = base
          .replace(/<.*?>/g, '')
          .replace(/[<>]/g, '')
          .replace(/\[(\/?(br|span|span class="ansi-[0-9]*"))\]/g, '<$1>');
      }
    });

    // Keydown event listener
    textarea.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        document.execCommand('insertLineBreak');
        event.preventDefault();
      }
    });

    // Style buttons event listeners
    const styleButtons = document.querySelectorAll(
      '.style-button'
    ) as NodeListOf<HTMLButtonElement>;
    styleButtons.forEach((btn: HTMLButtonElement) => {
      btn.addEventListener('click', () => {
        textarea.focus();

        if (!btn.dataset.ansi) {
          textarea.innerText = textarea.innerText;
          return;
        }

        const selection = window.getSelection()!;
        const text = window.getSelection()!.toString();

        const span = document.createElement('span');
        span.innerText = text;
        span.classList.add(`ansi-${btn.dataset.ansi}`);

        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(span);

        range.selectNodeContents(span);
        selection.removeAllRanges();
        selection.addRange(range);
      });
    });
  });
  const insertTextAtCursor = (text: string) => {
    textarea.focus();
    const selection = window.getSelection();
    if (!selection) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    range.selectNodeContents(range.endContainer);
    selection.removeAllRanges();
    selection.addRange(range);
    // make selection collapse to end
    range.collapse(false);
    textarea.focus();
  };
  let lsBlink = false;
  onMount(() => {
    if (typeof localStorage !== 'undefined') {
      const storedBlink = localStorage.getItem('blink');
      if (storedBlink) lsBlink = storedBlink === 'true';
      else localStorage.setItem('blink', 'false');
    }
  });

  let copybtnNoEscape: HTMLButtonElement;
  let copybtnEscape: HTMLButtonElement;
  const copy = (escape: boolean, copybtn: HTMLButtonElement) => {
    let toCopy = nodesToANSI(
      [...textarea.childNodes],
      [{ fg: 0, bg: 0, st: 0 }]
    );
    if (localStorage.getItem('optimize-ansi') !== 'false') {
      localStorage.setItem('optimize-ansi', 'true');
      toCopy = optimizeAnsi(toCopy);
    } else localStorage.setItem('optimize-ansi', 'false');
    if (escape) toCopy = toCopy.replace(/\x1b/g, '\\x1b');
    if (mode.name === 'style-discord')
      toCopy = `\`\`\`ansi
${toCopy}
\`\`\``;

    navigator.clipboard
      .writeText(toCopy)
      .then(() => {
        // @ts-ignore
        if (copyTimeout) clearTimeout(copyTimeout);

        const funnyCopyMessages = [
          'copied',
          'you did it!',
          'nice one!',
          'success!',
          'awesome!',
          'way to go!',
          'got it!',
          'well done!',
          'keep it up!',
        ];

        copybtn.textContent =
          funnyCopyMessages[
            // @ts-ignore
            Math.min(copyCount + 1, funnyCopyMessages.length - 1)
          ];

        // @ts-ignore
        if (copyCount <= 8) {
          copybtn.style.backgroundColor = '#3BA55D';
        } else {
          copybtn.style.backgroundColor = '#ED4245';
        }

        // @ts-ignore
        copyCount.set(Math.min(11, copyCount + 1));

        const copyTimeout = setTimeout(() => {
          copyCount.set(0);
          copybtn.style.backgroundColor = '';
          copybtn.textContent = 'Copy Ansi';
        }, 2000);
      })
      .catch((err) => {
        // @ts-ignore
        if (copyCount > 2) return;
        alert(toCopy);
      });
  };
</script>

<div class="tool {mode.name}">
  <h2 style="display:flex;align-items:center;justify-content:center;gap:8px;">
    Ansi tool
  </h2>
  <div class="topbtns">
    {#each Object.values(modes) as thisMode}
      <button
        class:success={mode.name === thisMode.name}
        on:click={() => {
          // @ts-ignore
          mode = modes[thisMode.name];
          if (typeof localStorage !== 'undefined')
            localStorage.setItem('mode', mode.name);
        }}
      >
        {thisMode.displayName}
        {#if thisMode.badge}
          <span class="badge">{thisMode.badge}</span>
        {/if}
      </button>&nbsp;
    {/each}
    <br />
    <br />
    <button data-ansi="0" class="style-button">Reset All</button>
    <button data-ansi="1" class="style-button ansi-1">Bold</button>
    <button
      data-ansi="2"
      class="style-button"
      disabled={!mode.extendedFormatting}
      title={mode.extendedFormatting
        ? ''
        : 'You need to use an Extended Ansi Preset for this style!'}
      ><span class="ansi-2">Dim</span></button
    >
    <button
      data-ansi="3"
      class="style-button ansi-3"
      disabled={!mode.extendedFormatting}
      title={mode.extendedFormatting
        ? ''
        : 'You need to use an Extended Ansi Preset for this style!'}
      >Italic</button
    >
    <button data-ansi="4" class="style-button ansi-4">Underline</button>
    {#if lsBlink}
      <button
        data-ansi="5"
        class="style-button"
        disabled={!mode.extendedFormatting}
        title={mode.extendedFormatting
          ? ''
          : 'You need to use an Extended Ansi Preset for this style!'}
        ><span class="ansi-5">Blink</span></button
      >
    {/if}
  </div>
  <br /><br />
  <strong>FG</strong>
  <!-- Loop through buttons here -->
  {#each Array.from({ length: 8 }, (_, i) => i + 30) as ansiCode}
    <button
      data-ansi={ansiCode}
      class="button style-button ansi-{ansiCode}-bg default">&nbsp;</button
    >
  {/each}
  <!-- extended -->
  {#each Array.from({ length: 8 }, (_, i) => i + 90) as ansiCode}
    <button
      data-ansi={ansiCode}
      class="button style-button ansi-{ansiCode}-bg default"
      disabled={!mode.extendedColours}
      title={mode.extendedColours
        ? ''
        : 'You need to use an Extended Ansi Preset for this colour!'}
      >&nbsp;</button
    >
  {/each}
  <br /><br />
  <strong>BG</strong>
  <!-- Loop through buttons here -->
  {#each Array.from({ length: 8 }, (_, i) => i + 40) as ansiCode}
    <button
      data-ansi={ansiCode}
      class="button style-button ansi-{ansiCode} default">&nbsp;</button
    >
  {/each}
  {#each Array.from({ length: 8 }, (_, i) => i + 100) as ansiCode}
    <button
      data-ansi={ansiCode}
      class="button style-button ansi-{ansiCode} default"
      disabled={!mode.extendedColours}
      title={mode.extendedColours
        ? ''
        : 'You need to use an Extended Ansi Preset for this colour!'}
      >&nbsp;</button
    >
  {/each}
  <br /><br />
  <button on:click={() => insertTextAtCursor('❮')}> ❮ </button>
  <button on:click={() => insertTextAtCursor('❯')}> ❯ </button>
  <button on:click={() => insertTextAtCursor('⟨')}> ⟨ </button>
  <button on:click={() => insertTextAtCursor('⟩')}> ⟩ </button>
  <button on:click={() => insertTextAtCursor('◀')}> ◀ </button>
  <button on:click={() => insertTextAtCursor('▶')}> ▶ </button>
  <button on:click={() => insertTextAtCursor('➜')}> ➜ </button>
  <button on:click={() => insertTextAtCursor('➤')}> ➤ </button>
  <br /><br />
  <div class="flex">
    <div
      id="textarea"
      contenteditable="true"
      bind:innerHTML={textareaContent}
      bind:this={textarea}
    >
      hi!
    </div>
  </div>
  <br />
  <button
    class="copy"
    on:click={() => copy(false, copybtnNoEscape)}
    bind:this={copybtnNoEscape}>Copy Ansi</button
  >
  <button
    class="copy"
    on:click={() => copy(true, copybtnEscape)}
    bind:this={copybtnEscape}>Escaped Copy</button
  >
  <a href="https://github.com/Exponential-Workload/ansi-cheatsheet">
    <button class="copy">Ansi Cheatsheet</button>
  </a>
  <br /><br />
  <p style="font-size: 0.7rem">
    This is a rewrite of
    <a href="https://rebane2001.com/discord-colored-text-generator/"
      >this tool</a
    >. This is not endorsed by it's original creator, nor by discord.<br />
    Confused? Type some text, then select a formatting option.
  </p>
</div>

<style lang="scss">
  @use '$lib/stylelib.scss' as lib;
  #textarea {
    @include lib.inputEl;
  }
  .topbtns {
    display: contents;
    pointer-events: none;
    button {
      pointer-events: all;
    }
  }
  button {
    min-width: 36px;
    height: 36px;
    &.style-button {
      margin-right: 4px;
    }
  }
</style>

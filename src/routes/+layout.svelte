<script lang="ts">
  import Fonts from '../util/fonts/Fonts.svelte';
  import './global.scss';
</script>

<svelte:head>
  <Fonts fonts={['Inter']} />
</svelte:head>

<div id="appRoot">
  <slot />
</div>

<style lang="scss">
  #appRoot {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: #1a1a1a;
    color: #fff;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
      Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue',
      sans-serif;
  }
</style>

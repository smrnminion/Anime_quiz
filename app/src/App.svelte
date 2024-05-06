<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';
  import { createSmartappDebugger, createAssistant } from '@sberdevices/assistant-client';
  import { setTheme } from './themes';
  import { logger } from "./utils";

  let assistant;
  let isDisabled = false;
  let isHidden = false;


  function handleKeyEvents(event: KeyboardEvent) {
    const key = event.key;
    const numberOfButtons = state.variants.length;
    if (key === 'ArrowRight' || key === 'ArrowLeft') {
      let newIndex = focusedIndex;
      do {
        if (key === 'ArrowRight') {
          newIndex = (newIndex + 1) % numberOfButtons;
        } else if (key === 'ArrowLeft') {
          newIndex = (newIndex - 1 + numberOfButtons) % numberOfButtons;
        }
      } while (state.variants[newIndex].used && newIndex !== focusedIndex); // Continue until a non-used button is found or returns to the start

      if (!state.variants[newIndex].used) {
        focusedIndex = newIndex;
      }
    }
  // Загрузка состояния из localStorage или установка начального состояния
  let state = JSON.parse(localStorage.getItem('appState')) || {
    count: 0,
    curr_anim: { name: 'Токийский гуль', iso: '1' },
    variants: [
      { name: 'Аниме 1', used: false },
      { name: 'Аниме 2', used: false },
      { name: 'Аниме 3', used: false }
    ],
    lifes: 3,
    total: 313337,
    endGame: false
  };

  let initPhrase = 'запусти викторину по аниме';
  let character = 'eva';
  $: setTheme(character);

  onMount(() => {
    assistant = createAssistant({ getState: () => ({ state }) });
    assistant.on('start', () => logger.log('SmartApp started'));
    assistant.on('data', handleData);

    // Добавление обработчика события visibilitychange
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyEvents);
  });

  onDestroy(() => {
    localStorage.setItem('appState', JSON.stringify(state));
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('keydown', handleKeyEvents);
  });

  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      logger.log('Returning from screensaver');
      autoClickOnEntry();
      setTimeout(() => isHidden = false, 500);
    }
    if (document.visibilityState === 'hidden') {
      isHidden = true;
    }
  }

  async function autoClickOnEntry() {
    handleInvisibleClick();
  }

  function handleInvisibleClick() {
    logger.log('Invisible button clicked');
    assistant.sendData({
        action: {
          action_id: 'click',
          data: "Invisible"
        }
      }
    );
  }

  function handleData(event) {
    if (!event.type) return;
    if (event.type === 'character') character = event.character.id;
    if (event.type === 'smart_app_data') {
      state = event.smart_app_data;
    }
    logger.log('Data event:', event);
  }

  function handleClick(i) {
    if (state.endGame) return; 

    const isCorrect = state.variants[i].name === state.curr_anim.name;
    if (!isCorrect) {
      state.variants[i].used = true; 
    } else {
      state.count += 1; 
    }

    isDisabled = true; 
    setTimeout(() => isDisabled = false, 500); 

    assistant.sendData({
      action: {
        action_id: 'click',
        data: state.variants[i].name
      }
    });
  }
</script>

<main>
  {#if !isHidden}
  <div class="card">
    <div class="header">
      <h2>Правильные ответы: {state.count} из {state.total}</h2>
      <h2>Жизни: {state.lifes}</h2>
    </div>
    <div class="content">
      <img alt="img" src="/photos/{state.curr_anim.iso}.webp" />
      <div class="buttons">
        {#each state.variants as {name, used}, i}
          <button id='button-{i}' disabled={isDisabled || used} class:used={used} tabindex={used ? -1 : 0} on:click={() => {handleClick(i)}}>{name}</button>
        {/each}
        <button id="invisible-button" on:click={handleInvisibleClick} style="display: none;">Invisible</button>
      </div>
    </div>
  </div>
  {:else}
  <div class="lds-dual-ring"></div>
  {/if}
</main>


<style>
  main {
    width: 100%;
    height: 100%;
    font-family: "Oswald", sans-serif !important;
    display: grid;
    place-items: center;
    background-color: var(--plasma-colors-background);
    background-image: var(--plasma-colors-gradient);
    background-repeat: no-repeat;
    color: var(--plasma-colors-text);
  }
  img {
    width: 60%;
    border-radius: 9px;
    margin-left: 3%;
  }
  .card {
    background-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 30px 1px rgba(0, 0, 0, 0.2);
    border-radius: 20px;
    padding: 5px 5px;
    width: 95%;
    display: flex;
    align-items: center;
    flex-direction: column;
    height: 95%;
  }
  .header {
    width: 100%;
    text-align: center;
  }
  .content {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    flex-direction: row; /* default direction */
  }
  .buttons {
    display: grid;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    width: 90%;
    min-width: 160px;
    margin-top: 10px;
    margin-left: 20px;
  }
  button {
    padding: calc(7px + (15 - 7) * ((150vw - 200px) / (1440 - 200)));
    background: var(--plasma-colors-buttonAccent);
    color: var(--plasma-colors-buttonPrimary);
    font-weight: 600;
    font-size: calc(15px + (18 - 12) * ((150vw - 200px) / (1440 - 200)));
    transition: background ease 0.5s;
    border: 1px solid transparent;
    border-radius: 9px;
    user-select: none;
    outline: none;
  }
disabled={isDisabled || used}
  button:focus, button.focused { /* Styles for focused state */
    transform: scale(1.1); /* Scales the button to increase visibility */
    border-color: var(--plasma-colors-buttonFocus);
    box-shadow: 0 0 8px 3px var(--plasma-colors-buttonFocus);
    z-index: 10; /* Ensures the button is visibly on top when scaled */
  }

  .used {
    background-color: var(--plasma-colors-buttonCritical); /* Ensure this variable is defined and has a visible color */
    color: white; /* Adjust text color for better visibility if needed */
  }
  
  h2 {
    text-align: center;
    margin: 0;
    font-weight: 200;
    font-size: calc(20px + (26 - 20) * ((150vw - 200px) / (1440 - 200)));
  }
  .lds-dual-ring {
    color: #ffffff
  }
  .lds-dual-ring,
  .lds-dual-ring:after {
    box-sizing: border-box;
  }
  .lds-dual-ring {
    display: inline-block;
    width: 80px;
    height: 80px;
  }
  .lds-dual-ring:after {
    content: " ";
    display: block;
    width: 64px;
    height: 64px;
    margin: 8px;
    border-radius: 50%;
    border: 6.4px solid currentColor;
    border-color: currentColor transparent currentColor transparent;
    animation: lds-dual-ring 1.2s linear infinite;
  }
  @media (min-width: 1920px) {
    .content {
      flex-direction: column;
    }
    .buttons {
      width: 100%; /* Adjust width to fit below the image */
      margin-left: 0; /* Adjust alignment */
    }
  }
</style>
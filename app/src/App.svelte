<script lang="ts">
  import {onMount} from 'svelte';
  import {createSmartappDebugger, createAssistant} from '@sberdevices/assistant-client';
  import {setTheme} from './themes';
  import {logger} from "./utils";

  let assistant;
  let state = {
    count: 0,
    place: {name: 'Токийский гуль', iso: '1'},
    variants: [
      {name: 'Аниме 1', used: false},
      {name: 'Аниме 2', used: false},
      {name: 'Аниме 3', used: false},
      {name: 'Аниме 4', used: false}
    ],
    lifes: 3,
    endGame: false
  };

  let initPhrase = 'запусти викторину по аниме';

  let character = 'eva';
  $: setTheme(character);
  
  let buttons = [];

  onMount(() => {
    function getState() {
      return {state}
    }

    const init = () => {
      return createAssistant({getState});
    };
    assistant = init();

    assistant.on('start', () => {
      logger.log('SmartApp started');
    });

    assistant.on('data', event => {
      if (!event.type) {
        return;
      }

      if (event.type === 'character') {
        character = event.character.id;
      }

      if (event.type === 'smart_app_data') {
        if (event.smart_app_data.type === 'close_app') {
          logger.log('Closing app')
          assistant.close();
          return;
        }
        state = event.smart_app_data;
      }
      logger.log('data event:', event);
    });
  });

  function handleClick(i) {
    if (state.endGame){
      return;
    }
    if (state.variants[i].name !== state.place.name) {
      state.variants[i].used = true;
    }
    assistant.sendData({
      action: {
        action_id: 'click',
        data: state.variants[i].name
      }
    })
  }
</script>

<main>
  <div class="card">
    <h2>Правильные ответы: {state.count}</h2>
    <h2>НР: {state.lifes}</h2>
      <!-- svelte-ignore a11y-missing-attribute -->
      <img src="/photos/{state.place.iso}.webp" />
      <div class="buttons">
        {#each state.variants as {name, used}, i}
          <button id='button-{i}' class:used on:click={() => {handleClick(i)}}>{name}</button>
        {/each}
      </div>
  </div>
</main>


<style>
  main {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    background-color: var(--plasma-colors-background);
    background-image: var(--plasma-colors-gradient);
    color: var(--plasma-colors-text);
  }
  img {
    width: 50%;
    margin: 20px;
    border-radius: 9px;
  }
  .card {
    background-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 30px 1px rgba(0, 0, 0, 0.2);
    border-radius: 20px;
    padding: 30px 10px;
    width: 100vw;
    max-width: 1000px;
    display: flex;
    align-items: center;
    flex-direction: column;
    margin-top: -5%;
  }
  .used {
    background-color: var(--plasma-colors-buttonCritical);
  }
  .used:hover, .used:focus {
    background: var(--plasma-colors-buttonCritical);
    border: 1px solid var(--plasma-colors-buttonWarning)
  }
  .buttons {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    width: 90%;
    min-width: 160px;
  }
  button {
    margin: 2%;
    padding: calc(7px + (15 - 7) * ((100vw - 200px) / (1440 - 200)));
    background: var(--plasma-colors-buttonAccent);
    color: var(--plasma-colors-buttonPrimary);
    font-weight: 700;
    font-size: calc(12px + (18 - 12) * ((100vw - 200px) / (1440 - 200)));
    transition: background ease 0.5s;
    border: 1px solid transparent;
    border-radius: 9px;
    user-select: none;
  }
  button:hover, button:focus {
    background: var(--plasma-colors-buttonFocused);
  }
  h2 {
    text-align: center;
    margin: 0;
    font-size: calc(20px + (26 - 20) * ((100vw - 200px) / (1440 - 200)));
  }
</style>
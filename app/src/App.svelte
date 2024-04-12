<script lang="ts">
  import {onMount} from 'svelte';
  import {createSmartappDebugger, createAssistant} from '@sberdevices/assistant-client';
  import {setTheme} from './themes';
  import {logger} from "./utils";

  let assistant;
  let isDisabled = false;
  let state = {
    count: 0,
    curr_anim: {name: 'Токийский гуль', iso: '1'},
    variants: [
      {name: 'Аниме 1', used: false},
      {name: 'Аниме 2', used: false},
      {name: 'Аниме 3', used: false}
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

  function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }

  function handleClick(i) {
    sleep(100);
    if (state.endGame){
      return;
    }
    if (state.variants[i].name !== state.curr_anim.name) {
      state.variants[i].used = true;
    }
    isDisabled = true;
    setTimeout(() => {
      isDisabled = false;
    }, 500);
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
      <img src="/photos/{state.curr_anim.iso}.webp" />
      <div class="buttons">
        {#each state.variants as {name, used}, i}
          <button  id='button-{i}' disabled={isDisabled} class:used on:click={() => {handleClick(i)}}>{name}</button>
        {/each}
      </div>
  </div>
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
    width: 40%;
    border-radius: 9px;
  }
  .card {
    background-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 30px 1px rgba(0, 0, 0, 0.2);
    border-radius: 20px;
    padding: 5px 5px;
    max-width: 1000px;
    display: flex;
    align-items: center;
    flex-direction: column;
    margin-top: -30px;
    height: 90%;
  }
  .used {
    background-color: var(--plasma-colors-buttonCritical);
  }
  .used:hover, .used:focus {
    background: var(--plasma-colors-buttonCritical);
    border: 1px solid var(--plasma-colors-buttonWarning)
  }
  .buttons {
    display: grid;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    width: 90%;
    min-width: 160px;
    margin-top: 10px;
  }
  button {
    
    padding: calc(7px + (15 - 7) * ((150vw - 200px) / (1440 - 200)));
    background: var(--plasma-colors-buttonAccent);
    color: var(--plasma-colors-buttonPrimary);
    font-weight: 600;
    font-size: calc(8px + (18 - 12) * ((150vw - 200px) / (1440 - 200)));
    transition: background ease 0.5s;
    border: 1px solid transparent;
    border-radius: 9px;
    user-select: none;
  }
  button:focus, button:target, button:active, button:visited {
    background: #4cc0ff;
  }
  h2 {
    text-align: center;
    margin: 0;
    font-weight: 200;
    font-size: calc(20px + (26 - 20) * ((150vw - 200px) / (1440 - 200)));
  }
</style>

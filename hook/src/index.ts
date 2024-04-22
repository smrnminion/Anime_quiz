import { Dialute, SberRequest } from 'dialute';
import { data } from './data';


const anime = data;


function choice(choices: any, drop = false) {
  const index = Math.floor(Math.random() * choices.length);
  let chosen = choices[index];
  if (drop) {
    choices.splice(index, 1);
  }
  return chosen;
}

function shuffle(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function* script(r: SberRequest) {
  const rsp = r.buildRsp();
  
  let unusedanime = [...anime];
  const state = {
    count: 0,
    curr_anim: {name: '', iso: ''},
    variants: [] as any[],
    lifes: 3,
    endGame: false
  }

  function updateState() {
    let curr_anim = choice(unusedanime, true);
    let variants = [] as any[];
    let temp_variants = [] as any[]
    variants.push({name: curr_anim.name, used: false});
    temp_variants.push(curr_anim.name);
    
    let i = 0
    while (i < 2){
      let temp = choice(anime);
      if (temp_variants.includes(temp.name)){
        continue
      }
      variants.push({name: temp.name, used: false});
      temp_variants.push(temp.name);
      i++;
    } 

    shuffle(variants);
    state.curr_anim = curr_anim;
    state.variants = variants;
    rsp.data = state;
  }

  function newGame(){
    //rsp.end = false
    state.endGame = false;
    unusedanime = [...anime];
    state.count = 0;
    state.curr_anim = {name: '', iso: ''};
    state.variants = [] as any[];
    state.lifes = 3;
  }

  function loseGame(){
    rsp.msg = 'К сожалению, вы проиграли. Вы можете начать заново, сказав «Заново»';
    rsp.msgJ = 'Эх, ты проиграл. Ты можешь начать заново, сказав «Заново»';
    rsp.kbrd = ['Заново']
    state.endGame = true;
    //rsp.end = true;
  }

  function useButton(curr_anim: any) {
    rsp.msg = ""
    rsp.msgJ = ""
    for (const [i, v] of state.variants.entries()) {
      if (curr_anim.toLowerCase() === v.name.toLowerCase()) {
        state.variants[i].used = true;
      }
    }
  }

  function afterCorrect() {
    updateState();
    state.count++;
    rsp.msg = choice(['Правильно ', 'Здорово ', 'Потрясающе ', 'Угадали ', 'Браво ', 'Вы молодец ']);
    rsp.msgJ = choice(['Правильно ', 'Здорово ', 'Потрясающе ', 'Верно ', 'Браво ', 'Молодец ']);
  }

  function afterWrong(useButtons = true){
    if (r.type == 'SERVER_ACTION'){
      if (useButtons){
        useButton(r.act.data);
      }
    } else{
      if (useButtons){
        useButton(r.msg);
      }
    }
    rsp.msg = choice(['Не угадали ', 'Неверно ', 'Неправильно ']);
    rsp.msgJ = choice(['Не угадал ', 'Неверно ', 'Неправильно ']);
    state.lifes -= 1;
    if (state.lifes <= 0){
      loseGame();
    }
  }

  updateState();
  rsp.msg = 'Добро пожаловать в викторину по Аниме. ' +
  'Вы должны угадать аниме по кадру. Если возникнут вопросы, скажите Помощь. ' +
  'Вопросы можно пропускать, сказав Пропуск, а вот и первый кадр ';
  rsp.msgJ = 'Привет! Ты в в викторине по Аниме. ' +
  'Ты должен угадать аниме по кадру. Если возникнут вопросы, скажи Помощь. ' +
  'Вопросы можно пропускать, сказав Пропуск, но ты потеряешь жизнь.';
  rsp.kbrd = ['Помощь', 'Пропуск'];

  yield rsp;

  while (unusedanime.length >= 1){
    if (r.type === 'SERVER_ACTION'){
      if (r.act?.action_id == 'click'){
        rsp.msg = ''
        rsp.msgJ = ''
        if (r.act.data == state.curr_anim.name){
          afterCorrect();
        }
        else{ 
          for (let i = 0; i < state.variants.length; i++){ 
            if(state.variants[i].name === r.act.data){
              if(!(state.variants[i].used)){
                afterWrong();
              }
            }
          }
        }
      }
      yield rsp;
      continue;
    }
    if (r.msg.toString().replace(/-/g, ' ').toLowerCase() === state.curr_anim.name.toString().replace(/-/g, ' ').toLowerCase()) {
      afterCorrect();
    }
    else if (r.nlu.lemmaIntersection(['выход', 'выйти', 'выйди'])) {
      rsp.msg = 'Всего вам доброго! '
      rsp.msgJ = 'Еще увидимся. Пока! '
      //rsp.end = true;
      rsp.data = {'type': 'close_app'}
    }

    else if (r.nlu.lemmaIntersection(['помощь', 'помочь'])) {
      rsp.msg = 'Вы должны угадать аниме по кадру. ' +
      'Вопросы можно пропускать, сказав Пропуск, но Вы потеряете жизнь. ';
      rsp.msgJ = 'Ты должен угадать аниме по кадру. ' +
      'Вопросы можно пропускать, сказав Пропуск, но ты потеряешь жизнь.';
    }

    else if (r.nlu.lemmaIntersection(['следующий', 'пропуск']) || ['пропуск', 'следующий'].includes(r.msg.toLowerCase())) {
      if(state.endGame){
        rsp.msg = 'Ты можешь начать заново, сказав Заново '
        rsp.msgJ = 'Вы можете начать заново, сказав Заново '
      }
      else{ 
        state.lifes -= 1;
        updateState();
        if (state.lifes <= 0){
          loseGame();
        }
        else{ 
          rsp.msg = 'Обновляю'
        }
      }
    }
    else if (r.nlu.lemmaIntersection(['заново', 'начать заново', 'новая игра'])){
      newGame();
      updateState(); 
      rsp.msg = 'Добро пожаловать в викторину по Аниме. ' +
      'Вы должны угадать аниме по кадру. Если возникнут вопросы, скажите Помощь. ' +
      'Вопросы можно пропускать, сказав Пропуск, но Вы потеряете жизнь, а вот и первый кадр ';
      rsp.msgJ = 'Привет! Ты в в викторине по Аниме. ' +
      'Ты должен угадать аниме по кадру. Если возникнут вопросы, скажи Помощь. ' +
      'Вопросы можно пропускать, сказав Пропуск, но ты потеряешь жизнь, а вот и первый кадр ';
      rsp.kbrd = ['Помощь', 'Пропуск'];
    }
    else if(r.msg.toString().toLowerCase() === 'запусти викторину по аниме'){
      rsp.msg = 'Добро пожаловать обратно в игру'
      rsp.msgJ = 'Давно не виделись! Продолжай играть'
    }
    else{
      if(state.endGame){
        rsp.msg = 'Ты можешь начать заново, сказав «Заново» '
        rsp.msgJ = 'Вы можете начать заново, сказав «Заново» '
      } 
      else{
        let temp = true;
        for (let i = 0; i < state.variants.length; i++){ 
          if(state.variants[i].name.replace(/-/g, ' ').toLowerCase() === r.msg.toString().replace(/-/g, ' ').toLowerCase()){
            if(!(state.variants[i].used)){
              afterWrong();
              temp = false;
            }
          }
        }
        if(temp){
          rsp.msg = 'Вы можете сказать пропуск, чтобы пропустить вопрос или сказать заново, чтобы начать игру сначала'
          rsp.msgJ = 'Ты можешь сказать пропуск, чтобы пропустить вопрос или сказать заново, чтобы начать игру сначала'
        }
        
      }
    }
    yield rsp;
  }
  rsp.msg = 'Поздравляю! Вы прошли аниме квиз! Вы можете начать заново, сказав Заново '
  rsp.msgJ = 'Поздравляю! Ты прошёл аниме квиз! Ты можешь начать заново, сказав Заново '
  state.count++;
  state.endGame = true;
  rsp.kbrd = ['Заново'];
  //rsp.end = true;
  
  yield rsp;
}

Dialute
  .fromEntrypoint(script as GeneratorFunction)
  .shareApp('../app/public')
  .start();

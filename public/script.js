const textInput = document.getElementById('textInput');
const datetimepicker = document.getElementById('datetimepicker');
const chat = document.getElementById('chat');
const objScrDiv = document.getElementById("chat-column");
var datasHabilitadas = []; //['2019-10-20'];
var allowTimes = []; //['10:00', '12:00', '13:00', '15:00', '17:00', '17:05', '17:20', '19:00', '20:00']
var allowTimesCod = [];
/* var dateInput = document.getElementById('date'); */
let objSalvarBanco = {};
let paramcDecricao = 1; //OK
let	paramCodHorarios = undefined; //OK
let	paramnCdTpConsulta = 1;
let context = {};
let intent = {};
let intencao;
let mensagemBD;
let objSalvar = {};


/**
 * Monta as div do chat
 * @param {*} message  mensagem
 * @param {*} from atualiza a class user ou lucca
 */
const templateChatMessage = (message, from) => `
  <div class="from-${from}">
    <div class="message-inner">
      <p>${message}</p>
    </div>
  </div>
  `;
// insere mensagem no html da aplicação (lucca)
const InsertTemplateInTheChat = (template) => {
    const div = document.createElement('div');
    div.innerHTML = template;
    chat.appendChild(div);
};

/**
 * //chama a transação do watson inciado com text vazio
 * @param {*} text recebe a mesagem do frot
 */
const getWatsonMessageAndInsertTemplate = async(text = '') => {
  const uri = 'http://localhost:3000/conversation/';
  const response = await (await fetch(uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context, intent }),
  })).json();
  
  context = response.context; // importante para manter o contexto
  idEspecialidade = response.context.especialidades;
  objSalvar.especialidade = response.context.especialidades;
  objSalvar.hospital = response.context.unidades;
  
  let autorizaChat = true; // "chave" para bloquei de resposta durante validações
  let acao = response.context.acao; // acao solicitada
  if (acao != undefined) // caso esteja definida alguma ação
      if (acao == 'validarCPF' && response.context.cpf != undefined) {
        let mens = await procuraCPF(response.context.cpf);
        if (mens === false) {
            autorizaChat = mens;
            mens = 'CPF nao encontrado na base de dados, para os usuários não cadastrados minha única função é tirar dúvidas.';
        } else {
            mens = mens.split(' ')
            mens = 'Olá, ' + mens[0] + '!';
            response.context.acao = undefined;
        }
        const template = templateChatMessage(mens, 'lucca');
        InsertTemplateInTheChat(template);
        chat.scrollTop = chat.scrollHeight;
      }
      else if (acao == 'verificarData' && response.context.data != undefined) {}

  if(objSalvar.especialidade != undefined){
    objSalvar.nCdEspecialidade = await retornaEspecialidade(objSalvar.especialidade);
    console.log("codigo da especialidade: " + objSalvar.nCdEspecialidade);
  }
  if (objSalvar.hospital != undefined) {
    objSalvar.nCdHospital = await retornaHospital(objSalvar.hospital);
    paramCodHospital = objSalvar.nCdHospital;
    console.log('testando o codigo do hospital: ' + paramCodHospital);
    paramCodHorarios = '53467';
  }
  if (objSalvar.hospital != undefined && objSalvar.especialidade != undefined) {
    let objEsp = {espe : objSalvar.nCdEspecialidade, hosp: objSalvar.nCdHospital};
    retornaDatasDisponiveis(objEsp);
    document.querySelector('#div_data').classList.remove('d-none');
    document.querySelector('#textInput').classList.add('d-none');
  }
  if(paramCodHorarios != undefined){
    let consultahorarios = await retornaHorarios(paramCodHorarios);
    let tipoConsulta = await retornaTipoConsulta(paramnCdTpConsulta);
  }

  if (autorizaChat)
    // Retona a resposta do watson
    for (let item in response.output.text) {
      // console.log(response.output.text[item]);
      const template = templateChatMessage(response.output.text[item], 'lucca');
      InsertTemplateInTheChat(template);
      chat.scrollTop = chat.scrollHeight;
    }
};
/**
 * captura entrada de dados do front "Mensagem"
 */
textInput.addEventListener('keydown', (event) => {
    if (event.keyCode === 13 && textInput.value) {
        getWatsonMessageAndInsertTemplate(textInput.value);
        /**
         * Envia a Mensagem usuário ao watson
         */
        const template = templateChatMessage(textInput.value, 'user');
        InsertTemplateInTheChat(template);

        textInput.value = '';
        chat.scrollTop = chat.scrollHeight;
    }''
});

/* dateInput.addEventListener('change', (event) => {
    document.getElementById('timepicker').classList.remove('d-none');
    console.log(event);
    //select de dados do banco
    calendario = ["10-19-2019", "10-13-2019", "10-30-2019"]; //dados do banco (mm-dd-yyyy)
}) */

let procuraCPF = async(text) => {
    const uri = 'http://localhost:3000/paciente/cpf/';
    const response = await (await fetch(uri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    })).json();

    if (response.mensagem.message === "nada foi encontrado") {
      // var template = templateChatMessage('cpf nao encontrado', 'lucca');
      // InsertTemplateInTheChat(template);
      // chat.scrollTop = chat.scrollHeight;
      return false;
    } else {
      Object.defineProperty(objSalvarBanco, "nCdPaciente", {
        get: function () { return nCdPaciente; },
        set: function (value) { nCdPaciente = value; },
        enumerable: true
      });

      objSalvar.nCdPaciente =  response.mensagem.nCdPaciente;
      console.log('parametro id de usuário do cpf: ' + objSalvar.nCdPaciente);
      
      // var template = templateChatMessage('cpf encontrado', 'lucca');
      // InsertTemplateInTheChat(template);
      // chat.scrollTop = chat.scrollHeight;
      return response.mensagem.cNmPaciente;
    }
};

let retornaEspecialidade = async(text) => {
    const uri = 'http://localhost:3000/especialidade/';

    const response = await (await fetch(uri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    })).json();


    if (response.mensagem === undefined) {
      var template = templateChatMessage('especialidade nao encontrado', 'lucca');
      InsertTemplateInTheChat(template);
      chat.scrollTop = chat.scrollHeight;
      return false;
    } else {
      // var template = templateChatMessage('especialidade encontrado', 'lucca');
      // InsertTemplateInTheChat(template);
      // chat.scrollTop = chat.scrollHeight;
      return response.mensagem.nCdEspecialidade;
    }
};

let retornaHospital = async(text) => {
      const uri = 'http://localhost:3000/hospital/';

      const response = await (await fetch(uri, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
      })).json();

      if (response.mensagem === undefined) {
        var template = templateChatMessage('hospital nao encontrado', 'lucca');
        InsertTemplateInTheChat(template);
        chat.scrollTop = chat.scrollHeight;
        return false;
      } else {
        Object.defineProperty(objSalvarBanco, "nCdHospital", {
          get: function () { return nCdHospital; },
          set: function (value) { nCdHospital = value; },
          enumerable: true
        });
        objSalvarBanco.nCdHospital = response.mensagem.nCdHospital;
        // var template = templateChatMessage('hospital encontrado', 'lucca');
        // InsertTemplateInTheChat(template);
        // chat.scrollTop = chat.scrollHeight;
        return response.mensagem.nCdHospital;
      }
  };

  let retornaHorarios = async(text) => {
      const uri = 'http://localhost:3000/horarios/';

      const response = await (await fetch(uri, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
      })).json();

      if (response.mensagem === undefined) {
        var template = templateChatMessage('horarios nao encontrado', 'lucca');
        InsertTemplateInTheChat(template);
        chat.scrollTop = chat.scrollHeight;
        return false;
      } else {
        Object.defineProperty(objSalvarBanco, "nCdMedico", {
          get: function () { return nCdMedico; },
          set: function (value) { nCdMedico = value; },
          enumerable: true
        });

        Object.defineProperty(objSalvarBanco, "nCdHorario", {
          get: function () { return nCdHorario; },
          set: function (value) { nCdHorario = value; },
          enumerable: true
        });

        Object.defineProperty(objSalvarBanco, "dHoraInicial", {
          get: function () { return dHoraInicial; },
          set: function (value) { dHoraInicial = value; },
          enumerable: true
        });

        Object.defineProperty(objSalvarBanco, "dHoraFinal", {
          get: function () { return dHoraFinal; },
          set: function (value) { dHoraFinal = value; },
          enumerable: true
        });
        Object.defineProperty(objSalvarBanco, "cDecricao", {
          get: function () { return cDecricao; },
          set: function (value) { cDecricao = value; },
          enumerable: true
        });

          paramcDecricao = 1;
          objSalvarBanco.nCdHorario = response.mensagem.nCdHorario;
          objSalvarBanco.dHoraInicial = response.mensagem.dHoraInicial;
          objSalvarBanco.dHoraFinal = response.mensagem.dHoraFinal;
          objSalvarBanco.nCdMedico = response.mensagem.nCdMedico;
          objSalvarBanco.cDecricao = 1;
          
          var template = templateChatMessage('horarios encontrado', 'lucca');
          InsertTemplateInTheChat(template);
          chat.scrollTop = chat.scrollHeight;
          return response.mensagem.nCdHorario;
      }
  };

  let retornaTipoConsulta = async(text) => {
        const uri = 'http://localhost:3000/tipoConsulta/';

        const response = await (await fetch(uri, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        })).json();

        if (response.mensagem === undefined) {
          var template = templateChatMessage('tipoConsulta nao encontrado', 'lucca');
          InsertTemplateInTheChat(template);
          chat.scrollTop = chat.scrollHeight;
          return false;
        } else {
          Object.defineProperty(objSalvarBanco, "nCdTpConsulta", {
            get: function () { return nCdTpConsulta; },
            set: function (value) { nCdTpConsulta = value; },
            enumerable: true
          });
            objSalvarBanco.nCdTpConsulta = response.mensagem.nCdTpConsulta;
            var template = templateChatMessage('tipoConsulta encontrado', 'lucca');
            InsertTemplateInTheChat(template);
            chat.scrollTop = chat.scrollHeight;
            return response.mensagem.cNmTpConsulta
        }
    };
console.log(JSON.stringify(objSalvarBanco));
/*========= CALENDAR JQUERY =========*/
/* utility functions */
function nationalDays(date) {
    var m = date.getMonth(),
        d = date.getDate(),
        y = date.getFullYear();
    //console.log('Checking (raw): ' + m + '-' + d + '-' + y);
    for (i = 0; i < disabledDays.length; i++) {
        if ($.inArray((m + 1) + '-' + d + '-' + y, disabledDays) != -1 || new Date() > date) {
            //console.log('bad:  ' + (m+1) + '-' + d + '-' + y + ' / ' + disabledDays[i]);
            return [false];
        }
    }
    //console.log('good:  ' + (m+1) + '-' + d + '-' + y);
    return [true];
}
function noWeekendsOrHolidays(date) {
    var noWeekend = jQuery.datepicker.noWeekends(date);
    return noWeekend[0] ? nationalDays(date) : noWeekend;
}
/*========= FIM CALENDAR JQUERY =========*/
// executando o bot pela primeira vez (para iniciar a conversa)
getWatsonMessageAndInsertTemplate();

let pegarHorarioIndisponiveis = async(text) => {
  const uri = 'http://localhost:3000/horarios';

  const response = await (await fetch(uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
  })).json();
  var data = []
  var dataIndiposniveis = []
  for (let i = 0; i < response.mensagem.length; i++) {
      data[i] = response.mensagem[i].dHoraInicial.substring(0, 10);
      var ano = data[i].slice(0, 4);
      var mes = data[i].slice(5, 7);
      var dia = data[i].slice(8, 10);
      dataIndiposniveis[i] = ano + "/" + mes + "/" + dia;
  }
   disabe = dataIndiposniveis;
};

//RETORNA DATA
let retornaDatasDisponiveis = async(text) => {
  const uri = 'http://localhost:3000/r/horarios/datas-disponiveis';

  const response = await (await fetch(uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
  })).json();

  if (response.mensagem.message === "nada foi encontrado") { return false; }
  else {
    for (let index = 0; index < response.mensagem.length; index++) {
      let aux = response.mensagem[index].DATA.split('/');
      aux[3] = aux[2] +'/'+ aux[1] +'/'+ aux[0];
      datasHabilitadas[index] = aux[3];
    }
    apresentaDatePicker(datasHabilitadas);
    document.querySelector('.xdsoft_datetimepicker').style.width = "auto";
    let template = templateChatMessage('Retornando datas disponiveis...', 'lucca');
    InsertTemplateInTheChat(template);
    chat.scrollTop = chat.scrollHeight;
    let aux = datasHabilitadas[0].split('/');
    datetimepicker.value = aux[2]+'/'+aux[1]+'/'+aux[0];
    changeDateTimePicker(); 
  }
};

let retornaHorasDisponiveis = async(text) => {
  const uri = 'http://localhost:3000/r/horarios/horasdisponiveis';

  const response = await (await fetch(uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
  })).json();

  if (response.mensagem.message === "nada foi encontrado") {
    return false;
  } else {
    allowTimes=[];
    allowTimesCod=[];
    for (let index = 0; index < response.mensagem.length; index++) {
      allowTimes[index] = response.mensagem[index].HORA_INICIAL.replace(/(?<=\d+:\d+):\d+/, '');
      allowTimesCod[index] = response.mensagem[index].nCdHorario;
    }
    apresentaDatePicker(datasHabilitadas, allowTimes);
  }
};

let changeDateTimePicker = () => {
  console.log('datetimepicker.value: ' + datetimepicker.value);
  let dados = datetimepicker.value.split(' ');
  //retorna horarios ao mudar dia
  if(objSalvar.ultimaData!==dados[0]){
    let aux = dados[0].split('/');
    objSalvar.ultimaData = dados[0];
    objSalvar.data = aux[2]+aux[1]+aux[0];
    retornaHorasDisponiveis(objSalvar);
  }
  //"grava" horario
  else if(objSalvar.ultimaHora !== dados[1]){
    if(!allowTimes.includes(dados[1])){ delete objSalvar.horario; return false; }
    objSalvar.ultimaHora = dados[1];
    objSalvar.dHoraInicial = datetimepicker.value;
    objSalvar.nCdHorario = allowTimesCod[allowTimes.indexOf(dados[1])];
    DocumentTimeline.querySelector('#div_data button').removeAttribute("class");
    console.log('objSalvar');
  }
}

let selecionaHorario = () => {
  let template = templateChatMessage(`${datetimepicker.value}`, 'user');
  InsertTemplateInTheChat(template);

  let dados = datetimepicker.value.split(' ');
  let mens = `Confirmado, agendando sua consulta para o dia ${dados[0]} às ${dados[1]} no ${objSalvar.hospital}.`;
  template = templateChatMessage(mens, 'lucca');
  InsertTemplateInTheChat(template);

  // query para gravar no banco
  gravarDados();
    //retorno do protocolo
  //resposta com protocolo
  

  document.querySelector('#div_data').classList.add('d-none');
  document.querySelector('#textInput').classList.remove('d-none');

  textInput.value = '';
  chat.scrollTop = chat.scrollHeight;
}

///GRAVAR NO BANCO ALELUA AMÉM
let gravarDados = async() => {
  const uri = 'http://localhost:3000/gravarDados';
  //74819
  let teste = {
      "nCdHorario": objSalvar.nCdHorario,
      "nCdPaciente": objSalvar.nCdPaciente,
      "nCdEspecialidade": objSalvar.nCdEspecialidade
  }

  const response = await (await fetch(uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teste }),
  })).json();

  objSalvar.ncdConsulta = response.mensagem[0].nCdConsulta;
  let mens = `Sua consulta foi agendada com sucesso! Seu protocolo é: CONS-${objSalvar.ncdConsulta}.`;
  let template = templateChatMessage(mens, 'lucca');
  InsertTemplateInTheChat(template);
  chat.scrollTop = chat.scrollHeight;

  if (response.mensagem.message === "nada foi encontrado") {
    return false;
  } 
};
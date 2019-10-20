const textInput = document.getElementById('textInput');
const datetimepicker = document.getElementById('datetimepicker');
const chat = document.getElementById('chat');
const objScrDiv = document.getElementById("chat-column");
var allowTimes = [] //['10:00', '12:00', '13:00', '15:00', '17:00', '17:05', '17:20', '19:00', '20:00']
var datasHabilitadas = []; //['2019-10-20'];
/* var dateInput = document.getElementById('date'); */
let objSalvarBanco = {}
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
  idHospital = response.context.unidades;
  
  let autorizaChat = true; // "chave" para bloquei de resposta durante validações
  let acao = response.context.acao; // acao solicitada
  if (acao != undefined) // caso esteja definida alguma ação
      if (acao == 'validarCPF' && response.context.cpf != undefined) {
        let mens = await procuraCPF(response.context.cpf);
        if (mens === false) {
            autorizaChat = mens;
            mens = 'Desculpe, para usuários não cadastrados minha única função é tirar dúvidas.';
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

  if(idEspecialidade != undefined){
    objSalvar.especialidade = await retornaEspecialidade(idEspecialidade);
    console.log("codigo da especialidade: " + objSalvar.especialidade);
  }
  if (idHospital != undefined) {
    objSalvar.hospital = await retornaHospital(idHospital);
    paramCodHospital = objSalvar.hospital;
    console.log('testando o codigo do hospital: ' + paramCodHospital);
    paramCodHorarios = '53467';
    
    let objEsp = {espe : objSalvar.especialidade, hosp: objSalvar.hospital};
    retornaDatasDisponiveis(objEsp);
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
      if(response.output.text[item]=='Entendi, para qual data você deseja marcar a consulta?'){
        document.querySelector('#div_data').classList.remove('d-none');
        document.querySelector('#textInput, .xdsoft_timepicker.active').classList.add('d-none');
        console.log('d-none');
      }
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
      var template = ('cpf nao encontrado', 'lucca');
      InsertTemplateInTheChat(template);
      chat.scrollTop = chat.scrollHeight;
      return false;
    } else {
      Object.defineProperty(objSalvarBanco, "nCdPaciente", {
        get: function () { return nCdPaciente; },
        set: function (value) { nCdPaciente = value; },
        enumerable: true
      });

      objSalvarBanco.nCdPaciente =  response.mensagem.nCdPaciente;
      console.log('parametro id de usuário do cpf: ' + objSalvarBanco.nCdPaciente);
      
      var template = templateChatMessage('cpf encontrado', 'lucca');
      InsertTemplateInTheChat(template);
      chat.scrollTop = chat.scrollHeight;
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
      var template = templateChatMessage('especialidade encontrado', 'lucca');
      InsertTemplateInTheChat(template);
      chat.scrollTop = chat.scrollHeight;
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
        var template = templateChatMessage('hospital encontrado', 'lucca');
        InsertTemplateInTheChat(template);
        chat.scrollTop = chat.scrollHeight;
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

  if (response.mensagem.message === "nada foi encontrado") {
    // var template = ('cpf nao encontrado', 'lucca');
    // InsertTemplateInTheChat(template);
    // chat.scrollTop = chat.scrollHeight;
    return false;
  } else {
    for (let index = 0; index < response.mensagem.length; index++) {
      // const element = array[index];
      // console.log(response.mensagem[index].cDATAFORMATADA);´
      let aux = response.mensagem[index].cDATAFORMATADA.split('/');
      aux[3] = aux[2] +'/'+ aux[1] +'/'+ aux[0];
      datasHabilitadas[index] = aux[3];
    }
    apresentaDatePicker(datasHabilitadas, []);
    let template = templateChatMessage('retornando Datas Disponiveis', 'lucca');
    InsertTemplateInTheChat(template);
    chat.scrollTop = chat.scrollHeight;
    return response.mensagem.cNmPaciente;
  }
};

datetimepicker.addEventListener("change", (data='01/01/2001') => {
  alert('resgatar horarios: '+data);
  console.log('resgatar horarios: '+data);
  //pega array horarios
  //foreach no resultado
  //hora.replace(/(\d+:\d+)(?=:)/, '\1');
  //chama funcao do datepicker passando, alem das datas, um novo parametro(allowHorarios)
  //
});
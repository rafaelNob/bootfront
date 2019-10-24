const textInput = document.getElementById('textInput');
const datetimepicker = document.getElementById('datetimepicker');
const chat = document.getElementById('chat');
const objScrDiv = document.getElementById("chat-column");
var datasHabilitadas = []; 
var allowTimes = [];
var allowTimesCod = [];
let objSalvarBanco = {};
let paramcDecricao = 1;
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
let watsonResp;
const getWatsonMessageAndInsertTemplate = async(text = '') => {
  const uri = 'http://localhost:3000/conversation/';
  const response = await (await fetch(uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context, intent }),
  })).json();

  if(response.intents[0] !== undefined ){
    if(response.intents[0].intent == "agendarExame"){
      //response.entities[0].value
      //response.entities[0].entity
      objSalvar.agendarExame = response.intents[0].intent;
    
    }else if(response.intents[0].intent == "agendarConsulta"){
      //response.entities[0].value
      //response.entities[0].entity
      objSalvar.agendarConsulta = response.intents[0].intent;
    
    }
    
  }
  /**
   * RETORNO O CODIGO DO EXAME
   */
 
  if(response.intents.length >= 0 && objSalvar.nCdPaciente !== undefined &&   objSalvar.agendarExame === "agendarExame" 
      && response.entities[0] != undefined){
    if(response.entities[0].entity === "tipo_exames"){
      objSalvar.nomeExame = response.entities[0].value;
      objSalvar.codExame = await retornaExame(objSalvar.nomeExame);                        
    }
  /**
   * RETORNA O CODIGO DA UNIDADE
   */
    if(response.entities[0].entity === "unidades"){  
      objSalvar.nomeUnidade = response.entities[0].value;
      objSalvar.nCdHospital = await retornaHospital(objSalvar.nomeUnidade);
    }                      
  }
 
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
            context.system.dialog_stack[0].dialog_node = "root";
            response.context.acao = undefined;
            response.context.cpf  = undefined;
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
  }
  /**
   *  RETONA DATAS DISPONÍVEIS
   */
  if (objSalvar.hospital != undefined && objSalvar.especialidade != undefined  && objSalvar.nCdPaciente != undefined) {
    let objEsp = {espe : objSalvar.nCdEspecialidade, hosp: objSalvar.nCdHospital};
    
    document.querySelector('#textInput').classList.add('d-none');

    let template =  templateChatMessage('Buscando datas disponiveis...', 'lucca');
    InsertTemplateInTheChat(template);
    chat.scrollTop = chat.scrollHeight;
    
    await retornaDatasDisponiveis(objEsp);
  }

  

  /**
   * RECUPERA DATAS EXAME
   */
  if (objSalvar.nCdHospital != undefined && objSalvar.codExame != undefined  && objSalvar.nCdPaciente != undefined) {
    let objEsp = { hosp: objSalvar.nCdHospital};
    
    document.querySelector('#textInput').classList.add('d-none');

    let template =  templateChatMessage('Buscando datas disponiveis...', 'lucca');
    InsertTemplateInTheChat(template);
    chat.scrollTop = chat.scrollHeight;
    
    await retornaDatasDisponiveisExame(objEsp);
  }

  if (autorizaChat)
    // Retona a resposta do watson
    for (let item in response.output.text) {
      if(
        response.output.text[item] == "Eu posso ajudar em mais alguma coisa?" || 
        response.output.text[item] == "Aguarde só um momento em quanto eu realizo o agendamento.") continue;
      
      // console.log(response.output.text[item]);
      const template = templateChatMessage(response.output.text[item], 'lucca');
      InsertTemplateInTheChat(template);
      chat.scrollTop = chat.scrollHeight;
    }
    if(objSalvar.agendarExame !== undefined){
      objSalvar.agendarExame;
    }
};

/**
 * LOGICA PARA GRAVAR EXAME
 */

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

let procuraCPF = async(text) => {
    const uri = 'http://localhost:3000/paciente/cpf/';
    const response = await (await fetch(uri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    })).json();

    if (response.mensagem.message === "nada foi encontrado") {
      return false;
    } else {
      

      objSalvar.nCdPaciente =  response.mensagem.nCdPaciente;
      console.log('parametro id de usuário do cpf: ' + objSalvar.nCdPaciente);
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
        
        objSalvarBanco.nCdHospital = response.mensagem.nCdHospital;
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
          
            objSalvarBanco.nCdTpConsulta = response.mensagem.nCdTpConsulta;
            var template = templateChatMessage('tipoConsulta encontrado', 'lucca');
            InsertTemplateInTheChat(template);
            chat.scrollTop = chat.scrollHeight;
            return response.mensagem.cNmTpConsulta
        }
    };

// executando o bot pela primeira vez (para iniciar a conversa)
getWatsonMessageAndInsertTemplate();

/**
 * METODO PARA GRAVAR DADOS DA CONSULTA
 */

/**
 * METODOS CONSULTAR EXAMES
 */
      let gravarDados = async() => {
        let gravar ={}
        let uri ;
        if(objSalvar.codExame === undefined){

          uri = 'http://localhost:3000/gravarDados';
           gravar = {
              "nCdHorario": objSalvar.nCdHorario,
              "nCdPaciente": objSalvar.nCdPaciente,
              "nCdEspecialidade":(objSalvar.codExame === undefined)? objSalvar.nCdEspecialidade : objSalvar.codExame
  
              
              
          }

        }else{
           uri = 'http://localhost:3000/exame/gravarDados';
           gravar = {
              "nCdHorario": objSalvar.nCdHorario,
              "nCdPaciente": objSalvar.nCdPaciente,
              "nCdExame":(objSalvar.codExame === undefined)? objSalvar.nCdEspecialidade : objSalvar.codExame
  
              
              
          }


        }

        const resposta = await (await fetch(uri, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gravar }),
        })).json();
      //nCdExame
        objSalvar.ncdConsulta =  (objSalvar.codExame === undefined)? resposta.mensagem[0].nCdConsulta :resposta.mensagem[0].nCdExame;
       /*  objSalvar.ncdConsulta = response.mensagem[0].nCdConsulta; */
        let mens = ` ${(objSalvar.codExame === undefined)? 'sua CONSULTA' : 'seu EXAME'} foi agendada com sucesso! Seu protocolo é: ${(objSalvar.codExame === undefined)? 'CONS-':'EXM-' } ${objSalvar.ncdConsulta}.`;
        let template = templateChatMessage(mens, 'lucca');
        InsertTemplateInTheChat(template);

        /* document.querySelector('#div_data').classList.remove('d-none');
        document.querySelector('#textInput').classList.add('d-none'); */

        textInput.value = '';
        chat.scrollTop = chat.scrollHeight;
        context.system.dialog_stack[0].dialog_node = "root";
        
          if(objSalvar.codExame === undefined){
            context.cpf  = undefined;
            context.unidades = undefined;
            context.especialidades = undefined;
            context.objSalvar = undefined;
            context.contextintent = undefined;
            context.entities = undefined;
            
            
          }else{
            context.cpf  = undefined;
            context.tipo_exames = undefined;
            context.unidades = undefined;
            objSalvar = undefined;
            context.intent = undefined;
            context.entities = undefined;


          }
          template = templateChatMessage("Posso ajudar em mais alguma coisa?", 'lucca');
          InsertTemplateInTheChat(template);
        if (resposta.mensagem.message === "nada foi encontrado") {
          return false;
        } 
      };

      /**
       * SELECIONA HORARIO DISPONÍVEL
       */
      let selecionaHorario = () => {
        let template = templateChatMessage(`${datetimepicker.value}`, 'user');
        InsertTemplateInTheChat(template);
      
        let dados = datetimepicker.value.split(' ');
        
        let mens = `Confirmado, agendando ${(objSalvar.codExame === undefined)? 'sua CONSULTA' :'SEU EXAME'} para o dia ${dados[0]} às ${dados[1]} no ${objSalvar.hospital}.`;
        template = templateChatMessage(mens, 'lucca');
        InsertTemplateInTheChat(template);
      
        let timer = setInterval(temporizador, 5000);
        function temporizador() {
          gravarDados();
          clearInterval(timer);
        }
      
        document.querySelector('#div_data').classList.add('d-none');
        document.querySelector('#textInput').classList.remove('d-none');
      
        textInput.value = '';

        
      
        chat.scrollTop = chat.scrollHeight;
      }

      let changeDateTimePicker = () => {
        console.log('datetimepicker.value: ' + datetimepicker.value);
        let dados = datetimepicker.value.split(' ');
        //retorna horarios ao mudar dia
        
        if(objSalvar.ultimaData!==dados[0]){
          let aux = dados[0].split('/');
          objSalvar.ultimaData = dados[0];
          objSalvar.data = aux[2]+aux[1]+aux[0];
          if( objSalvar.codExame === undefined){
            retornaHorasDisponiveis(objSalvar);

          }else{
            retornaHorasDisponiveisExame(objSalvar);
          }
        }
        //"grava" horario
        else if(objSalvar.ultimaHora !== dados[1]){
          if(!allowTimes.includes(dados[1])){ delete objSalvar.horario; return false; }
          objSalvar.ultimaHora = dados[1];
          objSalvar.dHoraInicial = datetimepicker.value;
          objSalvar.nCdHorario = allowTimesCod[allowTimes.indexOf(dados[1])];
          document.querySelector('#div_data button').removeAttribute("disabled");
          console.log('objSalvar');
        }
      }
      let retornaDatasDisponiveis = async(text) => {
        const uri = 'http://localhost:3000/r/horarios/datas-disponiveis';
      
        const response = await (await fetch(uri, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        })).json();
      
        document.querySelector('#div_data').classList.remove('d-none');
        if (response.mensagem.message === "nada foi encontrado") {
          let template =  templateChatMessage('Não encontramos datas', 'lucca');
          InsertTemplateInTheChat(template);
          chat.scrollTop = chat.scrollHeight;
          return false;
        }
        else {
          for (let index = 0; index < response.mensagem.length; index++) {
            let aux = response.mensagem[index].DATA.split('/');
            aux[3] = aux[2] +'/'+ aux[1] +'/'+ aux[0];
            datasHabilitadas[index] = aux[3];
          }
          
          apresentaDatePicker(datasHabilitadas);
          document.querySelector('.xdsoft_datetimepicker').style.width = "auto";
          
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
      /**
       * CONSULTA HORARIOS INDISPONÍVEIS
       * @param {*} text 
       */
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

      //FIM METODOS CONSULTA
 /**
  * 
 * METODOS PARA EXAME
 */
let retornaExame = async(text) => {
  const uri = 'http://localhost:3000/exame/';
  

    const response = await (await fetch(uri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    })).json();
 
  


  if (response.mensagem === undefined) {
    var template = templateChatMessage('exame nao encontrado', 'lucca');
    InsertTemplateInTheChat(template);
    chat.scrollTop = chat.scrollHeight;
    return false;
  } else {
    return response.mensagem.nCdTpExame;
  }
};

let retornaDatasDisponiveisExame = async(text) => {
  const uri = 'http://localhost:3000/r/horarios/exame/datas-disponiveis';

  const response = await (await fetch(uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
  })).json();

  document.querySelector('#div_data').classList.remove('d-none');
  if (response.mensagem.message === "nada foi encontrado") {
    let template =  templateChatMessage('Não encontramos datas', 'lucca');
    InsertTemplateInTheChat(template);
    chat.scrollTop = chat.scrollHeight;
    return false;
  }
  else {
    for (let index = 0; index < response.mensagem.length; index++) {
      let aux = response.mensagem[index].DATA.split('/');
      aux[3] = aux[2] +'/'+ aux[1] +'/'+ aux[0];
      datasHabilitadas[index] = aux[3];
    }
    
    apresentaDatePicker(datasHabilitadas);
    document.querySelector('.xdsoft_datetimepicker').style.width = "auto";
    
    let aux = datasHabilitadas[0].split('/');
    datetimepicker.value = aux[2]+'/'+aux[1]+'/'+aux[0];
    changeDateTimePicker(); 
  }
};

//retorna horas

let retornaHorasDisponiveisExame = async(text) => {
  const uri = 'http://localhost:3000/r/horarios/exame/horasdisponiveis';

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
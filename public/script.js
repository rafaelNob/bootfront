const textInput = document.getElementById('textInput');
const chat = document.getElementById('chat');
const objScrDiv = document.getElementById("chat-column");
var allowTimes = ['10:00', '12:00', '13:00', '15:00',
    '17:00', '17:05', '17:20', '19:00', '20:00'
]
let context = {};
let intent = {};
let intencao;
let mensagemBD;
/* var calendario = ["10-19-2019", "10-13-2019", "10-30-2019"] */
var calendario = []
var disabe = ['2019/10/21', '2019/10/23', '2019/10/29'];


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

    let autorizaChat = true; // "chave" para bloquei de resposta durante validações
    let acao = (typeof response.context.acao === undefined) ? 'sem-acao' : response.context.acao; // acao solicitada
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
    } else if (acao == 'verificarData' && response.context.data != undefined) {}

    if (autorizaChat)
    // Retona a resposta do watson
        for (let item in response.output.text) {
        // console.log(response.output.text[item]);
        const template = templateChatMessage(response.output.text[item], 'lucca');
        InsertTemplateInTheChat(template);
        chat.scrollTop = chat.scrollHeight;
        if (response.output.text[item] == 'Entendi, para qual data você deseja marcar a consulta?') {
            pegarHorarioIndisponiveis("");

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
    }
});


let procuraCPF = async(text) => {
    const uri = 'http://localhost:3000/consulta/';

    const response = await (await fetch(uri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    })).json();
    console.log(response.mensagem.cNmPaciente);

    if (response.mensagem === undefined) {
        return false;
        var template = templateChatMessage('cpf nao encontrado', 'lucca');
        InsertTemplateInTheChat(template);
        chat.scrollTop = chat.scrollHeight;
    } else {
        return response.mensagem.cNmPaciente;
        var template = templateChatMessage('cpf encontrado', 'lucca');
        InsertTemplateInTheChat(template);
        chat.scrollTop = chat.scrollHeight;
    }
};

/*========= CALENDAR JQUERY =========*/

/* utility functions */
function nationalDays(date) {
    var disabledDays = []
    disabledDays = calendario;
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

let pegarHorario = async(text) => {
    const uri = 'http://localhost:3000/r/horario/';

    const response = await (await fetch(uri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
    })).json();
    let i = 0;

    response.mensagem.forEach(element => {
        let res = element.dHoraInicial.replace(/T/, ' ').replace(/T/, '').replace(/\d+:\d+.\d+Z/, '');
        let min = element.dHoraInicial.replace(/\d+-\d+-\d+T\d+:/, '').replace(/:\d+.\d+Z/, '');
        if (i == 0) {
            i = 1;
            console.log(element.dHoraInicial);
            console.log('res: ' + res);
            console.log('min: ' + min);
        }
        res = res.replace(' ', 'T');
        if (min < 30) { res += '00:00.000Z'; } else { res += '30:00.000Z'; }
        console.log(res);
    });
};
//update horarios
let updateHora = async(id) => {
    console.log('updateHora');

    const uri = 'http://localhost:3000/u/horario/1234';
    var text1 = { "dHoraInicial": "2019-10-05" }
    const response = (await fetch(uri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text1
        }),
    }));
    // })).json();
    console.log('response: ' + JSON.stringify(response));
};

let pegarHorarioIndisponiveis = async(text) => {
    const uri = 'http://localhost:3000/r/horario';

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
    // disabe = dataIndiposniveis;

};
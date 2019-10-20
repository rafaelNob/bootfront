const AssistantV1 = require('ibm-watson/assistant/v1');
const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const app = express();

//const conn = require('./public/connection')

app.use(bodyParser.json());
app.use(express.static('./public'));

const port = 3000;

const assistant = new AssistantV1({
    version: '2019-02-28',
    iam_apikey: 'tcEJKkSN3_wHgaejqnMMFr3KPiz7COW8UFXC1tQu2Duo', //boot lucca
    url: 'https://gateway.watsonplatform.net/assistant/api' //boot lucca
});

app.post('/conversation/', (req, res) => {
    const { text, context = {} } = req.body;
    const params = {
        input: { text },
        workspace_id: 'a2f9322e-3a8e-4cab-87cf-4ec3ccd10f82', //boot lucca
        // workspace_id: 'aebf828d-83b0-43ff-96b8-5eef9996c00c',    // pizzaria
        context
    };

    assistant.message(params, (err, response) => {
        if (err) {
            console.error(err);
            res.status(500).json(err);
        } else { res.json(response); }
    });
})

app.post("/paciente/cpf/", (req, res) => {
    const { text } = req.body;
    console.log("id = " + text);

    // res.send({mensagem : "resposta obtida"})
    request('http://localhost:3001/paciente/' + text, function(request, response, body) {
        let json = JSON.parse(body);

        if (json != undefined) {
            res.send({ mensagem: json });
        } else {
            res.send({ mensagem: "erro na query" });
        }
        console.log(json);
    })
});

app.post("/especialidade", (req, res) => {
    let { text } = req.body;
    console.log("id =" + text);
    text = text.replace('/', '-');
      request('http://localhost:3001/especialidade/' + text, function(request, response, body) {
        let json = JSON.parse(body);
        if (json != undefined) {
            res.send({ mensagem: json });
        } else {
            res.send({ mensagem: "erro na query" });
        }
    })
});

app.post("/horarios", (req, res) => {
    const { text } = req.body.text;
    console.log("id =" + text);
      request('http://localhost:3001/horarios', function(request, response, body) {
    })
});

app.post("/tipoConsulta", (req, res) => {
    const { text } = req.body;
    console.log("id =" + text);

      request('http://localhost:3001/tipoConsulta/' + text, function(request, response, body) {
        let json = JSON.parse(body);
        if (json != undefined) {
            res.send({ mensagem: json });
        } else {
            res.send({ mensagem: "erro na query" });
        }
    })
});

app.post("/hospital", (req, res) => {
    const { text } = req.body;
    console.log("id =" + text);
      request('http://localhost:3001/hospital/' + text, function(request, response, body) {
        let json = JSON.parse(body);
        if (json != undefined) {
            res.send({ mensagem: json });
        } else {
            res.send({ mensagem: "erro na query" });
        }
    })
});

app.post("/create", (req, res) => {
    const { text } = req.body;
    console.log("struct = " + text);
    var text1 = {
            "cNaturalidade": "CHILENO",
            "cNmPaciente": "Rafael",
            "cRG": "439061027",
            "dCadastro": "2019-09-23 09:24:19",
            "dNascimento": "19970709",
            "nCPF": 3384632807
        }
        // res.send({mensagem : "resposta obtida"})
    request({ url: 'http://localhost:3001/create', method: 'POST', json: true, body: text1 }, function(request, response, body) {
        let json = JSON.parse(body);
        if (json != undefined) {
            res.send({ mensagem: json });
        } else {
            res.send({ mensagem: "erro na query" });
        }
        console.log(json);
    })
});

//RETORNA DATAS DISPONIVEIS
app.post("/r/horarios/datas-disponiveis", (req, res) => {
    const { text } = req.body;
    console.log("id = " + text);
    let uri = `http://localhost:3001/r/horarios/datasdisponiveis/${text.espe}/${text.hosp}`;
    // res.send({mensagem : "resposta obtida"})
    request({url :uri,  method: 'GET'  },function(request, response, body) {
        let json = JSON.parse(body);

        if (json != undefined) {
            res.send({ mensagem: json });
        } else {
            res.send({ mensagem: "erro na query" });
        }
        console.log(json);
    })
});

//RETORNA HORAS POR DATAS DISPONIVEIS
app.post("/r/horarios/horasdisponiveis", (req, res) => {
    const { text } = req.body;
    console.log("id = " + text);
    let uri = `http://localhost:3001/r/horarios/horasdisponiveis/${text.nCdEspecialidade}/${text.nCdHospital}/${text.data}`;
    
    console.log(uri);
    request({url :uri,  method: 'GET'  },function(request, response, body) {
        let json = JSON.parse(body);

        if (json != undefined) {
            res.send({ mensagem: json });
        } else {
            res.send({ mensagem: "erro na query" });
        }
        console.log(json);
    })
});
app.listen(port, () => console.log(`Running on port ${port}`));
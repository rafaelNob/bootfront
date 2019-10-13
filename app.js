const AssistantV1 = require('ibm-watson/assistant/v1');
const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');

//const conn = require('./public/connection')

app.use(bodyParser.json());
app.use(express.static('./public'));

const port = 3000;

const assistant = new AssistantV1({
    version: '2019-02-28',
    iam_apikey: 'tcEJKkSN3_wHgaejqnMMFr3KPiz7COW8UFXC1tQu2Duo', //boot lucca
    url: 'https://gateway.watsonplatform.net/assistant/api' //boot lucca
        // iam_apikey: 'Ss9p4PBVvy_rJXHo44MzwldtHcIXnpQqn3gB5tU0_wVD',  // pizzaria
        // url: 'https://gateway.watsonplatform.net/assistant/api'      // pizzaria
});
app.use(cors());
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

/* app.post("/teste", (req, res) => {
    const { text } = req.body;
    console.log("id = " + text);

    // res.send({mensagem : "resposta obtida"})
    request('http://localhost:8081/api/v1/paciente/' + text, function(request, response, body) {
        let json = JSON.parse(body);
        res.send({ mensagem: json });
        console.log(json.cNmPaciente);
        console.log(json.dNascimento);
    })
}); */

app.post("/consulta", (req, res) => {
    const { text } = req.body;
    console.log("id = " + text);

    // res.send({mensagem : "resposta obtida"})
    request('http://localhost:3001/r/paciente/' + text, function(request, response, body) {
        let json = JSON.parse(body);

        if (json != undefined) {
            res.send({ mensagem: json });
        } else {
            res.send({ mensagem: "erro na query" });
        }
        console.log(json);
    })
});

app.post("/r/horario", (req, res) => {
    const { text } = req.body;
    console.log("id post= " + text);

    // res.send({mensagem : "resposta obtida"})
    request('http://localhost:3001/r/horario/' + text, function(request, response, body) {
        let json = JSON.parse(body);

        if (json != undefined) {
            res.send({ mensagem: json });
        } else {
            res.send({ mensagem: "erro na query" });
        }
        console.log(json);
    })
});

app.post("/u/horario/:id", (req, res) => {
    console.log("=====================");
    console.log(req.params);
    var s = req.params.id;
    const text  = req.body.text1;
    const text1  = req.body.dHoraInicial;

   
    console.log("text ===: " + text);
    console.log("text1: " + JSON.stringify(text1));
    var u =`http://localhost:3001/u/horario/53467`;

    request({ url: u, method: 'PUT', json: true, body: text }, function(request, response, body) {
        /* console.log("request: " + request);
       console.log("response: " + JSON.stringify(response.body));  */
       res.send(JSON.stringify(response.body));
    })
    console.log("fINALIZOU");
});

app.post("/c/paciente", (req, res) => {
    const { text } = req.body;
    console.log("struct = " + text);
    var text1 = {
            "cNaturalidade": "ARGENTINO",
            "cNmPaciente": "FUNCIONOU",
            "cRG": "439061027",
            "dCadastro": "2019-09-23 09:24:19",
            "dNascimento": "19970709",
            "nCPF": 71011420015
        }
        // res.send({mensagem : "resposta obtida"})

    request({ url: 'http://localhost:3001/c/paciente', method: 'POST', json: true, body: text1 }, function(request, response, body) {
        
    })
});
app.listen(port, () => console.log(`Running on port ${port}`));
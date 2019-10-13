const connStr = "Server=DESKTOP-CQ0RDGE\\SQLEXPRESS;Database=dbLucca;User Id=sa;Password=1234;";
const sql = require("mssql");

const express = require('express');
const app = express();         
const bodyParser = require('body-parser');
const port = 3001; //porta padrão


sql.connect(connStr)
.then(conn => global.conn = conn)
.catch(err => console.log(err));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



function execSQLQuery(sqlQry, res){
    GLOBAL.conn.request()
               .query(sqlQry)
               .then(result => res.json(result.recordset))
               .catch(err => res.json(err));
}

exports.pegarPorCpf = function(id){

    let pegaCpf = `SELECT * FROM PACIENTE WHERE nCPF = ${id}`;
    console.log("PEGOU "+pegaCpf);
    
    return  app.get('/paciente', (req, res) =>{
        
       return execSQLQuery(pegaCpf, res);
    })


}

app.listen(port, () => console.log(`Running on port ${port}`));
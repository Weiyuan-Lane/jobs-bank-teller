const PAGE_LIMIT = 100;
const PAGE_START_AT = 1;
const PAGE_URL = 'https://api.mycareersfuture.gov.sg/v2/jobs?sortBy=new_posting_date&omitCountWithSchemes=true';
const WRITE_DATA_PATH = "dumpdata"

const https = require('https');
const fs = require('fs');

let hasMoreResults = true;
let page = PAGE_START_AT;
let allData = [];

async function getDataLoop() {
    return new Promise((resolve, reject) => {
        https.get(`${PAGE_URL}&limit=${PAGE_LIMIT}&page=${page}`, (res) => {
            let body = '';

            res.on('data', function(chunk){
                body += chunk;
            });

            res.on('end', function(){
                const parsedData = JSON.parse(body);
                resolve(parsedData.results);
            });
        }).on('error', (e) => {
            reject(e);
        })
    });
}

async function main() {
    let currentData = [];
    while (hasMoreResults) {
        currentData = await getDataLoop();

        if (currentData.length > 0) {
            allData = allData.concat(currentData);
            page++;
        } else {
            hasMoreResults = false;
        }
    }

    fs.writeFile(WRITE_DATA_PATH, allData, (err) => {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    }); 
}

main();

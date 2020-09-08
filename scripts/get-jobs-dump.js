const PAGE_LIMIT = 100;
const PAGE_START_AT = 1;
const ERROR_TOLERANCE = 10;
const PAGE_URL = 'https://api.mycareersfuture.gov.sg/v2/jobs?sortBy=new_posting_date&omitCountWithSchemes=true';
const WRITE_DATA_PATH = 'dumpdata';

const https = require('https');
const fs = require('fs');

let hasMoreResults = true;
let page = PAGE_START_AT;
let allData = [];
let errorCount = 0;

async function getDataLoop() {
    return new Promise((resolve, reject) => {
        https.get(`${PAGE_URL}&limit=${PAGE_LIMIT}&page=${page}`, (res) => {
            let body = '';

            res.on('data', function(chunk){
                body += chunk;
            });

            res.on('end', function(){
                try {
                    const parsedData = JSON.parse(body);
                    resolve(parsedData.results);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', (e) => {
            reject(e);
        })
    });
}

async function main() {
    let currentData = [];
    while (hasMoreResults) {
        console.log(`Getting page #${page}`);
        try {
            currentData = await getDataLoop();
        }
        catch (e) {
            errorCount++;

            console.log(`Encountered "getDataLoop" error ${errorCount}`, e);
            if (errorCount > ERROR_TOLERANCE) {
                console.log('Error tolerance exceeded, exiting');
                break;
            } else {
                console.log('Error tolerance not exceeded, retrying');
                continue;
            }
        }

        // Cleanup, remove redundant data
        const processedData = currentData.map((entity) => {
            let processedEntity = entity;
            delete processedEntity.description;

            if (processedEntity && processedEntity.postedCompany && typeof(processedEntity.postedCompany.description) !== 'undefined') {
                delete processedEntity.postedCompany.description;
            }
            if (processedEntity && processedEntity.hiringCompany && typeof(processedEntity.hiringCompany.description) !== 'undefined') {
                delete processedEntity.hiringCompany.description;
            }

            return processedEntity;
        });

        if (currentData.length > 0) {
            allData = allData.concat(processedData);
            page++;
        } else {
            hasMoreResults = false;
        }

        if (page > 5) {
            break;
        }
    }

    fs.writeFile(WRITE_DATA_PATH, JSON.stringify(allData), (err) => {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
    }); 
}

main();

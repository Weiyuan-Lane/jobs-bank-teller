
const WRITE_DATA_PATH = 'dumpdata';
const MINIMUM_SAL_AMT = 200;

/**
 *  All valid employment types:
 *
 * 'Permanent'
 * 'Full Time'
 * 'Part Time'
 * 'Contract'
 * 'Flexi-work'
 * 'Temporary'
 * 'Freelance'
 * 'Internship/Traineeship'
 */
const EMPLOYMENT_TYPES = [
    'Permanent',
    'Full Time',
];

/**
 *  All valid job levels:
 *
 * 'Senior Management'
 * 'Middle Management'
 * 'Manager'
 * 'Professional'
 * 'Senior Executive'
 * 'Executive'
 * 'Junior Executive'
 * 'Non-executive'
 * 'Fresh/entry level'
 */

const JOB_LEVELS = [
    'Executive',
];


/**
 * All valid skills to be filtered against
 */

const NEEDED_SKILLS = [
    'Software Development',
    'Software Engineering',
];

/**********/

const fs = require('fs');

const filters = [
    { entityKey: 'positionLevels', propKey: 'position', filterVals: JOB_LEVELS },
    // { entityKey: 'employmentType', propKey: 'employmentType', filterVals: EMPLOYMENT_TYPES },
    // { entityKey: 'skills', propKey: 'skill', filterVals: NEEDED_SKILLS },
]

function isEntityFoundFrom(entityData, filter) {
    let found = false;

    if (entityData[filter.entityKey]) {
        const filterPropList = entityData[filter.entityKey];

        found = filterPropList.some((filterProp) => {
            return filter.filterVals.includes(filterProp[filter.propKey]);
        });
    }

    return found;
}

function matchEntitiesFoundFrom(entitesData, filter) {
    const found = entitesData.filter((entityData) => {
        return isEntityFoundFrom(entityData, filter);
    });

    return found;
}

function searchData(data) {
    let filteredData = data;

    filters.forEach((filter) => {
        filteredData = matchEntitiesFoundFrom(filteredData, filter);
    });

    return filteredData;
}

function getNumericalStatsFrom(numberList) {
    if (numberList.length === 0) {
        return null
    }

    let lowest = numberList[0];
    let highest = numberList[0];
    let total = 0;
    const numberMap = {};

    numberList.forEach((number) => {
        if (number < lowest) {
            lowest = number;
        }

        if (number > highest) {
            highest = number;
        }

        total += number;

        if (typeof(numberMap[number]) !== 'undefined') {
            numberMap[number]++;
        } else {
            numberMap[number] = 0;
        }
    });

    const mean = Math.ceil(total / numberList.length);
    const numberMapKeys = Object.keys(numberMap);
    const mode = numberMapKeys.reduce((foundKey, currentKey) => {
        if (numberMap[foundKey] > numberMap[currentKey]) {
            return foundKey;
        }

        return currentKey;
    }, numberMapKeys[0]);

    return {
        lowest,
        highest,
        mean,
        mode,
    }
}

function getSalaryStatsFrom(entitiesData) { 
    const minimumList = entitiesData.filter((entityData) => {
        return entityData.salary.minimum >= MINIMUM_SAL_AMT 
            && entityData.salary.type.salaryType === 'Monthly';
    }).map((entityData) => {
        return entityData.salary.minimum;
    });
    const maximumList = entitiesData.filter((entityData) => {
        if (entityData.salary.maximum >= 100000) {
            console.log(JSON.stringify(entityData));
        }

        return entityData.salary.maximum >= MINIMUM_SAL_AMT 
            && entityData.salary.type.salaryType === 'Monthly';
    }).map((entityData) => {
        return entityData.salary.maximum;
    });
    const middleList = entitiesData.filter((entityData) => {
        return entityData.salary.maximum >= MINIMUM_SAL_AMT
            && entityData.salary.minimum >= MINIMUM_SAL_AMT 
            && entityData.salary.type.salaryType === 'Monthly';
    }).map((entityData) => {
        const middle = (entityData.salary.maximum - entityData.salary.minimum) / 2 + entityData.salary.minimum;
        return Math.ceil(middle);
    });

    return {
        minimum: getNumericalStatsFrom(minimumList),
        maximum: getNumericalStatsFrom(maximumList),
        middle: getNumericalStatsFrom(middleList),
    }
}

function process(data) {
    let processedContent = {};

    processedContent.all = {
        length: data.length,
    };

    const filteredData = searchData(data);
    processedContent.filtered = {
        length: filteredData.length,
        stats: getSalaryStatsFrom(filteredData),
    }

    return processedContent;
}

async function main() {
    fs.readFile(WRITE_DATA_PATH, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            const parsedData = JSON.parse(data);
            const stats = process(parsedData); 
            console.log(JSON.stringify(stats));
        }
    });
}

main();

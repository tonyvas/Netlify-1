const URL = "https://api.spacexdata.com/v3/"; // The root of the SpaceX API

const NEXT_PATH = "launches/next";
const PAST_PATH = "launches/past?limit=";
const ROCKET_ID_PATH = "rockets/";
const rocket_Ids = {f1: "falcon1", f9: "falcon9", fh: "falconheavy", ss: "starship"};

const FETCH_TYPE = {next: 0, past: 1, byId: 2};
const USER_INPUT_FIELD = "txtInp";
const TEXT_OUTPUT_FIELD_CONTAINER = "table_container";

const SELECT_INFO_ID = "select_info";

let globalArr = [];
let shouldSelectMenuExist = false;

function goFetch(path, type){
    if (type == FETCH_TYPE.past){
        let returned = readUserInput();
        if (returned == false){
            alert("Invalid Input");
            return;
        }
        else
            path += returned;
    }
    
    fetch(URL + path)
    .then(response => response.json())
    .then(data => {
        doStuff(data)
    })
    // If there is any error you will catch them here.
    .catch(function(error) {alert(error);});

    function readUserInput(){
        let input = document.getElementById(USER_INPUT_FIELD).value;
        
        if (isNaN(input) == false && Math.floor(input) == input)
            return input;
        else
            return false;
    }

    function doStuff(data) {
        // If the request was successful then data will have everything you asked for.
        if (type == FETCH_TYPE.next)
            doNextStuff(data);
        else if (type == FETCH_TYPE.past)
            doPastStuff(data);
        else if (type == FETCH_TYPE.byId)
            doByIdStuff(data);

        window.scrollTo(0, document.body.scrollHeight);
    }
}

function doNextStuff(obj){
    let tableData = [];
    let tableRows = [];

    tableData.push("CREW");
    tableData.push("DETAILS");
    tableData.push("FLIGHT NUMBER");
    tableData.push("IS TENTATIVE");
    
    tableRows.push(tableData);
    tableData = [];

    tableData.push(obj.crew);
    tableData.push(obj.details);
    tableData.push(obj.flight_number);
    tableData.push(obj.is_tentative);

    tableRows.push(tableData);
    tableData = [];

    tableData.push("DATE");
    tableData.push("LAUNCH SITE ID");
    tableData.push("LAUNCH SITE NAME");
    tableData.push("LAUNCH YEAR");
    
    tableRows.push(tableData);
    tableData = [];

    tableData.push(obj.launch_date_utc);
    tableData.push(obj.launch_site.site_id);
    tableData.push(obj.launch_site.site_name_long);
    tableData.push(obj.launch_year);

    tableRows.push(tableData);
    tableData = [];

    tableData.push("MISSION NAME");
    tableData.push("ROCKET ID");
    tableData.push("ROCKET NAME");
    tableData.push("ROCKET TYPE");

    tableRows.push(tableData);
    tableData = [];

    tableData.push(obj.mission_name);
    tableData.push(obj.rocket.rocket_id);
    tableData.push(obj.rocket.rocket_name);
    tableData.push(obj.rocket.rocket_type);

    tableRows.push(tableData);

    shouldSelectMenuExist = false;
    doTable(tableRows);
}

function doPastStuff(arr){
    let tables = [];
    arr.forEach(obj => {
        let tableData = [];
        let tableRows = [];

        tableData.push("CREW");
        tableData.push("DETAILS");
        tableData.push("FLIGHT NUMBER");
        tableData.push("IS TENTATIVE");
        
        tableRows.push(tableData);
        tableData = [];

        tableData.push(obj.crew);
        tableData.push(obj.details);
        tableData.push(obj.flight_number);
        tableData.push(obj.is_tentative);

        tableRows.push(tableData);
        tableData = [];

        tableData.push("DATE");
        tableData.push("LAUNCH SITE ID");
        tableData.push("LAUNCH SITE NAME");
        tableData.push("LAUNCH YEAR");
        
        tableRows.push(tableData);
        tableData = [];

        tableData.push(obj.launch_date_utc);
        tableData.push(obj.launch_site.site_id);
        tableData.push(obj.launch_site.site_name_long);
        tableData.push(obj.launch_year);

        tableRows.push(tableData);
        tableData = [];

        tableData.push("MISSION NAME");
        tableData.push("ROCKET ID");
        tableData.push("ROCKET NAME");
        tableData.push("ROCKET TYPE");

        tableRows.push(tableData);
        tableData = [];

        tableData.push(obj.mission_name);
        tableData.push(obj.rocket.rocket_id);
        tableData.push(obj.rocket.rocket_name);
        tableData.push(obj.rocket.rocket_type);

        tableRows.push(tableData);
        tableData = [];

        tableData.push("LAUNCH SUCCESS");
        if (obj.launch_success == false){
            tableData.push("TIME");
            tableData.push("ALTITUDE");
            tableData.push("REASON");
        }

        tableRows.push(tableData);
        tableData = [];

        tableData.push(obj.launch_success);
        if (obj.launch_success == false){
            tableData.push(obj.launch_failure_details.time);
            tableData.push(obj.launch_failure_details.altitude);
            tableData.push(obj.launch_failure_details.reason);
        }

        tableRows.push(tableData);

        tables.push(tableRows);
        tableRows = [];

        globalArr = tables;
    });

    doSelectMenu(tables);

    function doSelectMenu(arr){
        let container = document.getElementById(TEXT_OUTPUT_FIELD_CONTAINER);
        let selectMenu = document.createElement('select');
        let selectInfo = document.createElement('p');
        selectInfo.innerHTML = "Select which result you wish to see";
        selectInfo.id = SELECT_INFO_ID;
        selectMenu.addEventListener('change', updateTable);
        

        for (let i = 0; i < arr.length; i++){
            let option = document.createElement('option');
            option.value = i + 1;
            option.innerHTML = i + 1;
            selectMenu.appendChild(option);
        }
        container.appendChild(selectInfo);
        container.appendChild(selectMenu);

        shouldSelectMenuExist = true;
        deleteTable();
    }
}

function updateTable(e){
    doTable(globalArr[e.target.value - 1]);
}

function doByIdStuff(obj){
    let tableData = [];
    let tableRows = [];

    tableData.push("ACTIVE");
    tableData.push("BOOSTERS");
    tableData.push("COMPANY");
    tableData.push("COST PER LAUNCH");
    
    tableRows.push(tableData);
    tableData = [];

    tableData.push(obj.active);
    tableData.push(obj.boosters);
    tableData.push(obj.company);
    tableData.push("$" + obj.cost_per_launch);

    tableRows.push(tableData);
    tableData = [];

    tableData.push("COUNTRY");
    tableData.push("DESCRIPTION");
    tableData.push("DIAMETER");
    tableData.push("ENGINES");
    
    tableRows.push(tableData);
    tableData = [];

    tableData.push(obj.country);
    tableData.push(obj.description);
    tableData.push(obj.diameter.meters + "m/" + obj.diameter.feet + "ft");
    tableData.push(obj.engines.number);

    tableRows.push(tableData);
    tableData = [];

    tableData.push("FIRST FLIGHT");
    tableData.push("HEIGHT");
    tableData.push("MASS");
    tableData.push("ROCKET ID");

    tableRows.push(tableData);
    tableData = [];

    tableData.push(obj.first_flight);
    tableData.push(obj.height.meters + "m/" + obj.height.feet + "ft");
    tableData.push(obj.mass.kg + "kg/" + obj.mass.lb + "lb");
    tableData.push(obj.rocket_id);

    tableRows.push(tableData);
    tableData = [];

    tableData.push("ROCKET NAME");
    tableData.push("ROCKET TYPE");
    tableData.push("STAGES");
    tableData.push("SUCCESS RATE");

    tableRows.push(tableData);
    tableData = [];

    tableData.push(obj.rocket_name);
    tableData.push(obj.rocket_type);
    tableData.push(obj.stages);
    tableData.push(obj.success_rate_pct + "%");
    
    tableRows.push(tableData);

    shouldSelectMenuExist = false;
    doTable(tableRows);
}

function deleteSelectMenu(){
    try {
        globalArr = [];
        let selectMenu = document.getElementsByTagName('select')[0];
        let selectInfo = document.getElementById(SELECT_INFO_ID);
        selectInfo.parentNode.removeChild(selectInfo);
        selectMenu.parentNode.removeChild(selectMenu);
    } catch (error) {}
}
function deleteTable(){
    try {
        let table = document.getElementsByTagName('table')[0];
        table.parentNode.removeChild(table);
    } catch (error) {}
}

function doTable(arr){
    if (shouldSelectMenuExist == false)
        deleteSelectMenu();
    deleteTable();

    let isHead = true;

    let container = document.getElementById(TEXT_OUTPUT_FIELD_CONTAINER);
    let table;
    let tpart;
    let tr;
    let cell;

    table = document.createElement('table');

    for (let i = 0; i < arr.length; i++){
        if (i != 0 && i % arr[i].length == 0)
            isHead = !isHead;

        if (isHead)
            tpart = document.createElement('thead');
        else
            tpart = document.createElement('tbody');
        tr = document.createElement('tr');

        for (let j = 0; j < arr[i].length; j++){
            if (isHead){
                cell = document.createElement('th');
            }
            else{
                cell = document.createElement('td');
            }
            
            if (arr[i][j] != null)
                cell.innerHTML = arr[i][j];
            else
                cell.innerHTML = "unknown";

            tr.appendChild(cell);
        }

        tpart.appendChild(tr);
        table.appendChild(tpart);
    }

    container.appendChild(table);
}
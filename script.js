//api base
const apiBase = 'https://api.spacexdata.com/v4/'

//arrays to store data from each endpoint
let launches = [];
let rockets = [];
let launchpads = [];

//obj where rocket "id" is a key (object[id] = rocketInfo)
//--------------------------------------------------------
//using the below to reference rockets and launchpads because:
//luanches is the primary endpoint, launches.json stores rockets and launchpads by their id
//therefore if i want to find a lauches rocket info i need to search for its ID in the rocket.json
//making the id a key makes searching easier and efficient
//id is made the key in the start method after fetching (IIFE)
let rocketsById = {};
let launchpadsById = {};

const statusText = document.getElementById("statusText");
const launchList = document.getElementById("launchList");

//filter ids
const outcomeFilterSelect = document.getElementById("outcomeFilter");
const LocationFilterSelect = document.getElementById("launchLocation")
const searchInput = document.getElementById("searchInput");
//set detault filter values
let currentOutcomeFilter = "all";
let currentSearchTerm = "";
let currentLocationfilter = "all";


// gets endpoint data and returns JSON
async function fetchJSON(endpoint) {
    //get data
    let response = await fetch(`${apiBase}${endpoint}`);
    //chekc for error
    if (!response.ok) {
        throw new Error("HTTP error: " + response.status);
    }
    //convert to JSON
    const data = await response.json();
    return data
}

//applies filters to launches array, returns filtered array
function filterLaunches(filtered){
    //--------- Filter by launch location--------- 
    if (currentLocationfilter !== "all") {
        // filtered = filter launch (where the launches => launchpad region is === to current selected filter)
        filtered = filtered.filter(launch => launchpadsById[launch.launchpad].region === currentLocationfilter);
    }
    
    //--------- filter by mission outcome (success/failed/upcoming)--------- 
    if (currentOutcomeFilter === "success") {
        filtered = filtered.filter(launch => launch.success === true);
    } 
    else if (currentOutcomeFilter === "failed") {
        filtered = filtered.filter(launch => launch.success === false);
    } 
    else if (currentOutcomeFilter === "upcoming") {
        filtered = filtered.filter(launch => launch.upcoming === true);
    }
    //(if all does nothing)

    //--------- Filter with search box--------- 
    const keyword = currentSearchTerm.trim();

    if (keyword !== "") {
        //begin filter func. 
        filtered = filtered.filter((launch) => {
            //get mission and rocket name
            // || "" checks for null values to prevent crash
            const missionName = (launch.name || "").toLowerCase();

            const rocket = rocketsById[launch.rocket];
            const rocketName = rocket ? (rocket.name || "").toLowerCase() : "";

            // return launch if mission or rocket name includes the keyword
            return missionName.includes(keyword) || rocketName.includes(keyword);
        });
    }

    return filtered;
}

//filters array, creates a card for each object and appends data to it
function RenderLaunches() {
    launchList.innerHTML = ""; //clear output

    // -------------- FILTER --------------
    let filtered = filterLaunches(launches);
    
    // -------------- RENDER LOOP --------------
    filtered.forEach((launch) => {
        //-------------- make card --------------
        const launchCard = document.createElement('div');
        launchCard.setAttribute('class', 'launches-card');

        //make card sections && labels && add classes
        //-------------------------------------------
        const cardHeader = document.createElement('div');
        cardHeader.setAttribute('class', 'card-header-section');

        //launch section
        const launchSection = document.createElement('div');
        launchSection.setAttribute('class', 'card-section');

        const launchSectionHeader = document.createElement('label');
        launchSectionHeader.textContent = "Launch Info";
        launchSectionHeader.classList.add('section-header');

        launchSection.appendChild(launchSectionHeader);

        //rocket section
        const rocketSection = document.createElement('div');
        rocketSection.setAttribute('class', 'card-section');
        const rocketSectionHeader = document.createElement('label');
        rocketSectionHeader.textContent = "Rocket Info";
        rocketSectionHeader.classList.add('section-header');

        rocketSection.appendChild(rocketSectionHeader);

        //launchpad section
        const launchpadSection = document.createElement('div');
        launchpadSection.setAttribute('class', 'card-section');
        const padSectionHeader = document.createElement('label');
        padSectionHeader.textContent = "Launchpad Info";
        padSectionHeader.classList.add('section-header');
        launchpadSection.appendChild(padSectionHeader);

        //---------create card elements--------------
        //--- header ---
        const titlediv = document.createElement('div');
        titlediv.classList.add('titlediv')
        //inside titlediv:
        const missionName = document.createElement('h2');
        missionName.textContent = launch.name || "Unnamed mission" ;

        const dateObj = new Date(launch.date_utc);
        const date = document.createElement('p');
        date.textContent = isNaN(dateObj) ? "Unknown" : (dateObj.toLocaleDateString()); //formats to date and time>

        const outcome = document.createElement('p');
        outcome.classList.add('outcome-pill')
        if (launch.upcoming){
            outcome.textContent = "Upcoming";
            outcome.classList.add('outcome-upcoming');
        }
        else if (launch.success){
            outcome.textContent = "Success";
            outcome.classList.add('success-bubble');
        }
        else if (launch.success == false){
            outcome.textContent = "Failed";
            outcome.classList.add('fail-bubble');
        }
        else{ // if sucess: null
            outcome.textContent = "Unknown";
        }
    
        //--- launch info ---
        //flight no
        const flightNo = document.createElement('p');
        flightNo.textContent = "Flight No: #" + launch.flight_number;
        //outcome details
        const failDetails = document.createElement('div');
            failDetails.textContent = (launch.details || "No extra details available for this mission.").slice(0, 150) + "...";
            failDetails.classList.add('details-bubble');
        if(launch.success == false){
            failDetails.classList.add('fail-bubble');
        }
        else if(launch.success && !launch.details == ""){
            failDetails.classList.add('success-bubble');
        }

        //--- rocket details ---
        //name
        const rocketName = document.createElement('p');
        rocketName.textContent = "Rocket Name: "+ rocketsById[launch.rocket].name;
        //mass
        const mass = document.createElement('p');
        mass.textContent = "Mass: "+ rocketsById[launch.rocket].mass.kg.toLocaleString() + " kg";
        //height
        const height = document.createElement('p');
        height.textContent = "Height: "+ rocketsById[launch.rocket].height.meters + " m";
        //cost to launch
        const launchCost = document.createElement('p');
        launchCost.textContent = "Cost per launch: $"+ rocketsById[launch.rocket].cost_per_launch.toLocaleString();
        //company
        const company = document.createElement('p');
        company.textContent = "Company: " + rocketsById[launch.rocket].company;
        //description
        const rocketDesc = document.createElement('p');
        rocketDesc.textContent = rocketsById[launch.rocket].description;
        //image
        const rocketImg = document.createElement('img');
        rocketImg.src = rocketsById[launch.rocket].flickr_images;
        // shorthand event listener, if image load has error, it uses placeholder img
        rocketImg.onerror = () => {
        rocketImg.src = "https://placehold.co/350x150/2F3E4D/CFE8FF?text=NO+IMAGE"; 
        };
        rocketImg.alt = rocketsById[launch.rocket].name +" Rocket image";


        //--- launchpad details ---
        //full name
        const padName = document.createElement('p');
        padName.textContent = "Full Name: " + launchpadsById[launch.launchpad].full_name;
        //region
        const padRegion = document.createElement('p');
        padRegion.textContent = "Region: " + launchpadsById[launch.launchpad].region;
        //locality
        const padLocality = document.createElement('p');
        padLocality.textContent = "Locality: " + launchpadsById[launch.launchpad].locality;
        //desc
        const padDetails = document.createElement('p');
        padDetails.textContent = launchpadsById[launch.launchpad].details;

        
        //add elements to card section && add card to doc
        //append sections to card
        launchCard.appendChild(cardHeader);
        launchCard.appendChild(launchSection);
        launchCard.appendChild(rocketSection);
        launchCard.appendChild(launchpadSection);
        //header section
        cardHeader.appendChild(titlediv);
        titlediv.appendChild(missionName);
        titlediv.appendChild(date);
        cardHeader.appendChild(outcome);
        //launch info section
        launchSection.appendChild(flightNo);
        launchSection.appendChild(failDetails); 
        //rocket section
        rocketSection.appendChild(rocketName);
        rocketSection.appendChild(mass);
        rocketSection.appendChild(height);
        rocketSection.appendChild(launchCost);
        rocketSection.appendChild(company);
        rocketSection.appendChild(rocketDesc);
        rocketSection.appendChild(rocketImg);
        //launchpad sectioon
        launchpadSection.appendChild(padName);
        launchpadSection.appendChild(padRegion);
        launchpadSection.appendChild(padLocality);
        launchpadSection.appendChild(padDetails);

        launchList.appendChild(launchCard);

    });
    statusText.textContent = `Showing ${filtered.length} launches`;
    if (filtered.length == 0){
        statusText.textContent = statusText.textContent + ", adjust filters";
    }
}

//IIFE - begins fetching
(async function start() {
    try {
        //try fetch data and get JSON for each endpoint

        // ----- Fetch Launches Data -----
        console.log("Fetching launches...");
        launches = await fetchJSON('launches');

        // ----- Fetch Rockets Data -----
        console.log("Fetching rockets...");
        rockets = await fetchJSON('rockets');
        //new obj that rearranges rocket obj to where "id" is the key (makes a dictionary)
        
        rockets.forEach(rocket => {
            //make rocket id the key = and inside the key is rocket info 
            rocketsById[rocket.id] = rocket;
        });

        // ----- Fetch Launchpad Data -----
        console.log("Fetching launchpads...");
        launchpads = await fetchJSON('launchpads');
        //new obj that rearranges launchpads obj to where "id" is the key (makes a dictionary)  

        launchpads.forEach(lp => {
            //make LPad id the key = and inside the key is LPad info 
            launchpadsById[lp.id] = lp;
        });

        console.log("all data fetched.")

        console.log(launches);
        console.log(rockets);
        console.log(launchpads);

        RenderLaunches(); // render method start

    } catch (err) {

        console.error('Error fetching data:', err);
        statusText.textContent = "Unable to fetch data at this time."
    }
})();

//EVENT LISTENERS
// when user changes the outcome dropdown
outcomeFilterSelect.addEventListener("change", () => {
    //update filter value
    currentOutcomeFilter = outcomeFilterSelect.value;
    RenderLaunches();  // re-filter and re-render
});
// when user changes location filter
LocationFilterSelect.addEventListener("change", () => {
    //update filter value
    currentLocationfilter = LocationFilterSelect.value;
    RenderLaunches();  // re-filter and re-render
});

// when user types in the search box
searchInput.addEventListener("input", () => {
    //update search variable
    currentSearchTerm = searchInput.value.toLowerCase();
    RenderLaunches();  // re-filter and re-render
});

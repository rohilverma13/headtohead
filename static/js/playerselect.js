import { RadarChart } from './radarChart.js';
//import { autocomplete } from './autocomplete.js';

document.addEventListener('DOMContentLoaded', () => {
    const playerNames = JSON.parse(document.getElementById('playerNamesData').textContent);
    const floatColumns = ['PTS', 'AST', 'TRB', 'FG', '3P', 'eFG%', 'FGA', 'FG%', '3PA', '3P%', '2P', '2PA', '2P%', 'FT', 'FTA', 'FT%', 'ORB', 'DRB', 'STL', 'BLK', 'MP'];

    const minFeatures = 3;
    const maxFeatures = 8;

    var color1 = "#13EC64"
    var color2 =  "#EC139B"

    function autocomplete(inp, arr) {
        let currentFocus;
        
        inp.addEventListener("input", function(e) {
            let a, b, i, val = this.value;
            closeAllLists();
            if (!val) { return false; }
            currentFocus = -1;
            a = document.createElement("DIV");
            a.setAttribute("id", this.id + "autocomplete-list");
            a.setAttribute("class", "autocomplete-items");
            this.parentNode.appendChild(a);
            let count = 0;
            for (i = 0; i < arr.length && count < 5; i++) {
                // Normalize both the input value and the array item to ensure matching works with apostrophes
                if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                    b = document.createElement("DIV");
                    b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                    b.innerHTML += arr[i].substr(val.length);
                    b.innerHTML += "<input type='hidden' value=\"" + arr[i] + "\">"; // Use double quotes to handle single quotes in the value
                    b.addEventListener("click", function(e) {
                        // Set the input field's value to the selected name
                        inp.value = this.getElementsByTagName("input")[0].value;
                        console.log(inp.value);
                        closeAllLists();
                        fetchSeasons(inp.value, inp.getAttribute('data-season-dropdown'));
                        fetchPlayerImage(inp.value, inp.getAttribute('data-image-element'));
                        fetchTeamInfo(inp.value, inp.getAttribute('container-element'), inp.getAttribute('logo-element'));
                        fetchPlayerInfo(document.getElementById('player1').value, document.getElementById('player2').value, document.getElementById('season1-dropdown').value, document.getElementById('season2-dropdown').value);
                    });
                    a.appendChild(b);
                    count++;
                }
            }
        });
        
        inp.addEventListener("keydown", function(e) {
            let x = document.getElementById(this.id + "autocomplete-list");
            if (x) x = x.getElementsByTagName("div");
            if (e.keyCode == 40) { // Down key
                currentFocus++;
                addActive(x);
            } else if (e.keyCode == 38) { // Up key
                currentFocus--;
                addActive(x);
            } else if (e.keyCode == 13) { // Enter key
                e.preventDefault();
                if (currentFocus > -1) {
                    if (x) x[currentFocus].click();
                }
            }
        });
        
        function addActive(x) {
            if (!x) return false;
            removeActive(x);
            if (currentFocus >= x.length) currentFocus = 0;
            if (currentFocus < 0) currentFocus = (x.length - 1);
            x[currentFocus].classList.add("autocomplete-active");
        }
        
        function removeActive(x) {
            for (let i = 0; i < x.length; i++) {
                x[i].classList.remove("autocomplete-active");
            }
        }
        
        function closeAllLists(elmnt) {
            let x = document.getElementsByClassName("autocomplete-items");
            for (let i = 0; i < x.length; i++) {
                if (elmnt != x[i] && elmnt != inp) {
                    x[i].parentNode.removeChild(x[i]);
                }
            }
        }
        
        document.addEventListener("click", function(e) {
            closeAllLists(e.target);
        });
    }
    

    function handleFeatureButtonClick() {
        const buttons = document.querySelectorAll('.feature-button');
        const selectedFeatures = Array.from(buttons).filter(button => button.classList.contains('selected')).map(button => button.getAttribute('data-feature'));

        if (selectedFeatures.length < minFeatures) {
            buttons.forEach(button => {
                if (!selectedFeatures.includes(button.getAttribute('data-feature'))) {
                    button.classList.add('disabled');
                }
            });
        } else {
            buttons.forEach(button => {
                button.classList.remove('disabled');
            });
        }

        if (selectedFeatures.length >= maxFeatures) {
            buttons.forEach(button => {
                if (!button.classList.contains('selected')) {
                    button.classList.add('disabled');
                }
            });
        }

        fetchPlayerInfo(document.getElementById('player1').value, document.getElementById('player2').value, document.getElementById('season1-dropdown').value, document.getElementById('season2-dropdown').value);
    }

    function createFeatureButtons() {
        const container = document.getElementById('feature-buttons');
        container.innerHTML = ''; // Clear existing buttons
    
        // Function to handle button placement based on selection
        function handleButtonPlacement(button) {
            // Remove the button from its current position
            container.removeChild(button);
    
            if (button.classList.contains('selected')) {
                // Insert the button after the last selected button
                const selectedButtons = Array.from(container.querySelectorAll('.feature-button.selected'));
                const lastSelectedButton = selectedButtons[selectedButtons.length - 1];
                if (lastSelectedButton) {
                    container.insertBefore(button, lastSelectedButton.nextSibling);
                } else {
                    container.prepend(button);
                }
            } else {
                // Insert the button after the last active button or at the end of the container
                const selectedButtons = Array.from(container.querySelectorAll('.feature-button.selected'));
                if (selectedButtons.length > 0) {
                    const lastSelectedButton = selectedButtons[selectedButtons.length - 1];
                    container.insertBefore(button, lastSelectedButton.nextSibling);
                } else {
                    container.appendChild(button);
                }
            }
        }
    
        // Create buttons for each feature
        floatColumns.forEach(col => {
            const button = document.createElement('div');
            button.classList.add('feature-button');
            button.textContent = col;
            button.setAttribute('data-feature', col);
    
            button.addEventListener('click', () => {
                const selectedCount = container.querySelectorAll('.feature-button.selected').length;
    
                if (button.classList.contains('selected')) {
                    if (selectedCount > minFeatures) {
                        button.classList.remove('selected');
                    }
                } else {
                    if (selectedCount < maxFeatures) {
                        button.classList.add('selected');
                    }
                }
    
                handleButtonPlacement(button);
                handleFeatureButtonClick();
            });
    
            container.appendChild(button);
        });
    
        // Initialize PTS, AST, and TRB as selected and move them to the front
        ['PTS', 'AST', 'TRB'].forEach(feature => {
            const button = container.querySelector(`.feature-button[data-feature="${feature}"]`);
            if (button) {
                button.classList.add('selected');
                container.removeChild(button);
                container.prepend(button);
            }
        });
    }
    
    
    
    
    

    

    function fetchSeasons(playerName, dropdownId) {
        fetch('/playerseasons', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ player_name: playerName }),
        })
        .then(response => response.json())
        .then(data => {
            populateDropdown(data, dropdownId);
        })
        .catch(error => console.error('Error fetching seasons:', error));
    }

    function populateDropdown(data, dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        dropdown.innerHTML = ''; // Clear existing options

        console.log("SEASONS: " + data.regular_seasons)

        const option = document.createElement('option')
        option.value = 'Career'
        option.text = 'Career'
        dropdown.appendChild(option)

        if(data.playoff_seasons.length != 0){
            const option = document.createElement('option')
            option.value = 'Playoff Career'
            option.text = 'Playoff Career'
            dropdown.appendChild(option)
        }

        const regularSeasonsGroup = document.createElement('optgroup');
        regularSeasonsGroup.label = "Regular Seasons";
        data.regular_seasons.forEach(season => {
            const option = document.createElement('option');
            option.value = season;
            option.text = season;
            regularSeasonsGroup.appendChild(option);
        });

        const playoffSeasonsGroup = document.createElement('optgroup');
        playoffSeasonsGroup.label = "Playoff Seasons";
        data.playoff_seasons.forEach(season => {
            const option = document.createElement('option');
            option.value = season;
            option.text = season;
            playoffSeasonsGroup.appendChild(option);
        });

        dropdown.appendChild(regularSeasonsGroup);
        dropdown.appendChild(playoffSeasonsGroup);

        
    }

    function fetchPlayerInfo(player1Name, player2Name, season1, season2) {
        fetch('/playerinfo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ player1_name: player1Name, player2_name: player2Name, season1: season1, season2: season2 }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error(data.error);
            } else {
                displayRadarChart(data);
            }
        })
        .catch(error => console.error('Error fetching player data:', error));
    }

    function fetchPlayerImage(playerName, imgElementId) {
        fetch('/playerimage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ player_name: playerName }),
        })
        .then(response => response.json())
        .then(data => {
            const imgElement = document.getElementById(imgElementId);
            if (!imgElement) {
                console.error(`Image element with id ${imgElementId} not found.`);
                return;
            }

            if (data.error) {
                imgElement.src = '';
                imgElement.alt = data.error;
            } else {
                imgElement.src = `data:image/png;base64,${data.image}`;
                imgElement.alt = playerName;
            }
        })
        .catch(error => console.error('Error fetching player image:', error));
    }

    function fetchTeamInfo(playerName, containerId, logoImgID) {
        fetch('/teaminfo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ player_name: playerName }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error(data.error);
            } else {
                setTeamGradient(data.gradient_url, containerId);
                setTeamLogo(data.logo_url, logoImgID);
            }
        })
        .catch(error => console.error('Error fetching team info:', error));
    }

    function setTeamGradient(gradientUrl, containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container element with id ${containerId} not found.`);
            return;
        }
        container.style.backgroundImage = `url(${gradientUrl})`;
    }

    function setTeamLogo(logoUrl, logoImgID) {
        const logoElement = document.getElementById(logoImgID);
        if (!logoElement) {
            console.error(`Logo element not found in container with id ${containerId}`);
            return;
        }
        logoElement.src = logoUrl;
    }

    function displayRadarChart(data) {
        const player1 = data.player1;
        const player2 = data.player2;

        const categories = Array.from(document.querySelectorAll('.feature-button.selected')).map(button => button.getAttribute('data-feature'));
        const player1Values = categories.map(cat => player1.normalized[cat]);
        const player2Values = categories.map(cat => player2.normalized[cat]);

        const filterData = (data, categories) => {
            return categories.reduce((filtered, category) => {
                filtered[category] = data[category];
                return filtered;
            }, {});
        };

        const player1FilteredAverages = filterData(player1.averages, categories);
        const player1FilteredNormalized = filterData(player1.normalized, categories);
        const player2FilteredAverages = filterData(player2.averages, categories);
        const player2FilteredNormalized = filterData(player2.normalized, categories);

        const chartData = {
            [player1.name]: {
                "original": player1FilteredAverages,
                "normalized": player1FilteredNormalized
            },
            [player2.name]: {
                "original": player2FilteredAverages,
                "normalized": player2FilteredNormalized
            }
        };

        var radarChartOptions = {
            maxValue: 100,
            roundStrokes: true,
            levels: 5,
            margin: { top: 60, right: 80, bottom: 80, left: 80 },
            color: d3.scale.ordinal().range([color1, color2]),
        };

        function drawChart() {
            RadarChart(".radarChart", chartData, radarChartOptions);
        }

        

        drawChart();
    }

    autocomplete(document.getElementById("player1"), playerNames);
    autocomplete(document.getElementById("player2"), playerNames);

    createFeatureButtons();

    // Fetch default player info
    const p1 = 'Luka Doncic'
    const p2 = 'LeBron James'
    document.getElementById('player1').value = p1;
    document.getElementById('player2').value = p2;
    fetchPlayerInfo(p1, p2, 'Career', 'Career');
    fetchSeasons(p1, 'season1-dropdown');
    fetchSeasons(p2, 'season2-dropdown');
    // fetchPlayerImage(p1, 'player1-image');
    // fetchPlayerImage(p2, 'player2-image');
    // fetchTeamInfo(p1, 'player1-image-container', 'player1-logo');
    // fetchTeamInfo(p2, 'player2-image-container', 'player2-logo');
    

    // Add event listeners to the season dropdowns
    document.getElementById('season1-dropdown').addEventListener('change', () => {
        console.log("SEASON 1 CHANGE");
        //fetchSeasons(document.getElementById('player1').value, document.getElementById('season1-dropdown'));
        fetchPlayerInfo(document.getElementById('player1').value, document.getElementById('player2').value, document.getElementById('season1-dropdown').value, document.getElementById('season2-dropdown').value);
    });

    document.getElementById('season2-dropdown').addEventListener('change', () => {
        fetchPlayerInfo(document.getElementById('player1').value, document.getElementById('player2').value, document.getElementById('season1-dropdown').value, document.getElementById('season2-dropdown').value);
    });

    const color1picker = document.querySelector("#color1-picker");

    color1picker.addEventListener("change",(event)=>{
        color1 = color1picker.value;
        fetchPlayerInfo(document.getElementById('player1').value, document.getElementById('player2').value, document.getElementById('season1-dropdown').value, document.getElementById('season2-dropdown').value);
    });

    const color2picker = document.querySelector("#color2-picker");

    color2picker.addEventListener("change",(event)=>{
        color2 = color2picker.value;
        fetchPlayerInfo(document.getElementById('player1').value, document.getElementById('player2').value, document.getElementById('season1-dropdown').value, document.getElementById('season2-dropdown').value);
    });
});

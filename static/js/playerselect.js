import { RadarChart } from './radarChart.js';
//import { autocomplete } from './autocomplete.js';

document.addEventListener('DOMContentLoaded', () => {
    const playerNames = JSON.parse(document.getElementById('playerNamesData').textContent);
    const floatColumns = ['PTS', 'AST', 'TRB', 'FG%', 'eFG%', '3P%', 'STL', 'BLK', 'FT%', 'FG', 'FGA', '3P', '3PA', 'FT', 'FTA',  'ORB', 'DRB', 'MP'];

    const minFeatures = 3;
    const maxFeatures = 8;

    var color1 = "#00b542"
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
    
            for (i = 0; i < arr.length; i++) {
                // Normalize both the input value and the array item to ensure matching works with both first and last names
                let normalizedVal = val.toUpperCase();
                let normalizedFullName = arr[i].toUpperCase();
    
                // Check if the input value is included anywhere in the full name (not just at the beginning of a part)
                if (normalizedFullName.includes(normalizedVal)) {
                    b = document.createElement("DIV");
                    let startIdx = normalizedFullName.indexOf(normalizedVal); // Find where the match starts
    
                    // Highlight the matching part
                    b.innerHTML = arr[i].substr(0, startIdx) + "<strong>" + arr[i].substr(startIdx, val.length) + "</strong>" + arr[i].substr(startIdx + val.length);
    
                    b.innerHTML += "<input type='hidden' value=\"" + arr[i] + "\">"; // Use double quotes to handle single quotes in the value
                    b.addEventListener("click", function(e) {
                        // Set the input field's value to the selected name
                        inp.value = this.getElementsByTagName("input")[0].value;
                        console.log(inp.value);
                        closeAllLists();
                        document.getElementById(inp.getAttribute('data-season-dropdown')).value = 'Career';
                        fetchSeasons(inp.value, inp.getAttribute('data-season-dropdown'));
                        fetchPlayerImage(inp.value, inp.getAttribute('data-image-element'));
                        fetchTeamInfo(inp.value, 'Career', inp.getAttribute('container-element'), inp.getAttribute('logo-element'));
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
        ['FG%', '3P%', 'TRB', 'AST', 'PTS'].forEach(feature => {
            const button = container.querySelector(`.feature-button[data-feature="${feature}"]`);
            if (button) {
                button.classList.add('selected');
                container.removeChild(button);
                container.prepend(button);
            }
        });
    }
    
    
    function makeTableRowsDraggable() {
        const statTable = document.getElementById('stat-table');
    
        let dragSrcRow = null;
        let touchStartY = 0;
        let placeholderRow = null;
        let isDragging = false; // Flag to indicate if dragging is in progress
    
        // Handle mouse drag start
        function handleDragStart(e) {
            if (!isDragging) return; // Only drag if initiated from the stat name cell
            dragSrcRow = this;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', this.innerHTML);
            this.style.opacity = '0.4'; // Make the row semi-transparent
        }
    
        // Handle mouse drag over
        function handleDragOver(e) {
            if (!isDragging) return;
            if (e.preventDefault) {
                e.preventDefault(); // Necessary to allow dropping
            }
            e.dataTransfer.dropEffect = 'move'; // Show move cursor
            return false;
        }
    
        // Handle mouse drop
        function handleDrop(e) {
            if (!isDragging) return;
            if (e.stopPropagation) {
                e.stopPropagation(); // Stops some browsers from redirecting
            }
    
            // Swap the rows if a different row is being dropped
            if (dragSrcRow !== this) {
                dragSrcRow.innerHTML = this.innerHTML;
                this.innerHTML = e.dataTransfer.getData('text/html');
    
                // Re-add event listeners to the swapped rows
                addDnDHandlers(dragSrcRow);
                addDnDHandlers(this);
            }
    
            return false;
        }
    
        // Handle mouse drag end
        function handleDragEnd() {
            if (!isDragging) return;
            // Reset the opacity of all rows
            const rows = statTable.querySelectorAll('tr');
            rows.forEach(function (row) {
                row.style.opacity = '1';
            });
            isDragging = false;
        }
    
        // Handle touch start
        function handleTouchStart(e) {
            // Only start dragging if the touch starts on the first cell (stat name cell)
            if (e.target.tagName !== 'TD' || e.target.cellIndex !== 0) {
                return;
            }
    
            isDragging = true; // Set dragging to true
            dragSrcRow = this;
            touchStartY = e.touches[0].clientY;
    
            // Create a placeholder row
            placeholderRow = document.createElement('tr');
            placeholderRow.style.height = `${dragSrcRow.clientHeight}px`;
            placeholderRow.style.backgroundColor = '#ccc';
            dragSrcRow.parentNode.insertBefore(placeholderRow, dragSrcRow);
        }
    
        // Handle touch move
        function handleTouchMove(e) {
            if (!isDragging) return;
            e.preventDefault(); // Prevent scrolling during dragging
            const touchY = e.touches[0].clientY;
    
            // Determine the row under the current touch point
            const rowUnderTouch = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY);
            if (rowUnderTouch && rowUnderTouch.tagName === 'TD') {
                const targetRow = rowUnderTouch.parentNode;
                if (targetRow !== dragSrcRow && targetRow.parentNode === statTable) {
                    // Move the placeholder row
                    const targetRect = targetRow.getBoundingClientRect();
                    const targetRowCenterY = targetRect.top + targetRect.height / 2;
                    if (touchY > targetRowCenterY) {
                        targetRow.parentNode.insertBefore(placeholderRow, targetRow.nextSibling);
                    } else {
                        targetRow.parentNode.insertBefore(placeholderRow, targetRow);
                    }
                }
            }
        }
    
        // Handle touch end
        function handleTouchEnd() {
            if (!isDragging) return;
            if (placeholderRow) {
                // Insert the dragged row in place of the placeholder
                placeholderRow.parentNode.replaceChild(dragSrcRow, placeholderRow);
                placeholderRow = null;
            }
            isDragging = false;
        }
    
        // Handle mouse down on the stat name cell to enable dragging on desktop
        function handleMouseDown(e) {
            // Only start dragging if the mouse is down on the first cell (stat name cell)
            if (e.target.tagName === 'TD' && e.target.cellIndex === 0) {
                isDragging = true;
            }
        }
    
        // Add drag and drop handlers
        function addDnDHandlers(row) {
            // Mouse events for desktop
            row.addEventListener('mousedown', handleMouseDown, false);
            row.addEventListener('dragstart', handleDragStart, false);
            row.addEventListener('dragover', handleDragOver, false);
            row.addEventListener('drop', handleDrop, false);
            row.addEventListener('dragend', handleDragEnd, false);
    
            // Touch events for mobile
            row.addEventListener('touchstart', handleTouchStart, false);
            row.addEventListener('touchmove', handleTouchMove, false);
            row.addEventListener('touchend', handleTouchEnd, false);
        }
    
        // Apply drag and drop to each row in the table
        const rows = statTable.querySelectorAll('tr');
        rows.forEach(function (row) {
            row.setAttribute('draggable', true); // Make rows draggable for desktop
            addDnDHandlers(row);
        });
    }
    
    // Call this function after the table is populated or updated
    function updateStatTable(player1, player2) {
        const statTable = document.getElementById('stat-table');
        statTable.innerHTML = ''; // Clear the previous content
        
        // Create the header row
        const headerRow = document.createElement('tr');
        const statHeader = document.createElement('th');
        statHeader.textContent = '';
        headerRow.appendChild(statHeader);
        
        // Player 1 Header
        const player1Header = document.createElement('th');
        const player1Image = document.createElement('img');
        player1Image.setAttribute("class", "table-image");
        player1Image.setAttribute("id", "p1-table-image");
        fetchPlayerImage(player1.name.slice(0, -1), "p1-table-image");
        player1Header.appendChild(player1Image);
        
        player1Image.onerror = function () {
            player1Image.style.display = 'none';
            const player1Name = document.createElement('p');
            player1Name.textContent = player1.name.slice(0, -1);
            player1Header.insertBefore(player1Name, player1Header.firstChild);
        };
        
        const player1Season = document.createElement('p');
        player1Season.setAttribute("class", "table-season");
        player1Season.textContent = document.getElementById('season1-dropdown').value;
        player1Header.appendChild(player1Season);
        headerRow.appendChild(player1Header);
        
        // Player 2 Header
        const player2Header = document.createElement('th');
        const player2Image = document.createElement('img');
        player2Image.setAttribute("class", "table-image");
        player2Image.setAttribute("id", "p2-table-image");
        fetchPlayerImage(player2.name.slice(0, -1), "p2-table-image");
        player2Header.appendChild(player2Image);
        
        player2Image.onerror = function () {
            player2Image.style.display = 'none';
            const player2Name = document.createElement('p');
            player2Name.textContent = player2.name.slice(0, -1);
            player2Header.insertBefore(player2Name, player2Header.firstChild);
        };
        
        const player2Season = document.createElement('p');
        player2Season.setAttribute("class", "table-season");
        player2Season.textContent = document.getElementById('season2-dropdown').value;
        player2Header.appendChild(player2Season);
        headerRow.appendChild(player2Header);
        
        statTable.appendChild(headerRow);
        
        // Create rows for each selected stat
        const stats = floatColumns;
        
        stats.forEach(stat => {
            const row = document.createElement('tr');
        
            const statNameCell = document.createElement('td');
            statNameCell.textContent = stat;
            statNameCell.style.color = "white";
            statNameCell.style.fontWeight = 'bold';
            statNameCell.style.backgroundColor = "#464646";
            row.appendChild(statNameCell);
        
            const player1StatValue = player1.averages[stat] || 0;
            const player2StatValue = player2.averages[stat] || 0;
        
            const player1StatCell = document.createElement('td');
            const player2StatCell = document.createElement('td');
        
            player1StatCell.textContent = player1StatValue;
            player2StatCell.textContent = player2StatValue;
        
            if (player1StatValue > player2StatValue) {
                player1StatCell.style.backgroundColor = color1;
            } else if (player2StatValue > player1StatValue) {
                player2StatCell.style.backgroundColor = color2;
            } else {
                player1StatCell.style.backgroundColor = color1;
                player2StatCell.style.backgroundColor = color2;
            }
        
            row.appendChild(player1StatCell);
            row.appendChild(player2StatCell);
        
            statTable.appendChild(row);
        });
    
        // Make the rows draggable
        makeTableRowsDraggable();
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
                updateStatTable(data.player1, data.player2);
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

    function fetchTeamInfo(playerName, season, containerId, logoImgID) {
        fetch('/teaminfo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ player_name: playerName, season: season }),
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

        

        function drawChart() {

            var radarChartOptions = {
                maxValue: 100,
                levels: 5,
                margin: { top: 60, right: 80, bottom: 80, left: 80 },
                color: d3.scale.ordinal().range([color1, color2]),
                showvalues: document.getElementById('show-values-checkbox').checked,
                tooltipSize: "18px"
            };
            
            d3.select(".radarChart").select("svg").remove();
        
            if (window.innerWidth < 768) {
                
                radarChartOptions.w = Math.min(window.innerWidth * 1, 600); 
                
                if (window.innerWidth < 430){
                    radarChartOptions.margin = { top: 0, right: 80, bottom: 0, left: 80 };
                    radarChartOptions.h = Math.min(10000, 400); 
                }
                else {
                    radarChartOptions.margin = { top: 0, right: 80, bottom: 0, left: 80 };
                    radarChartOptions.h = Math.min(10000, 500); 
                }

                radarChartOptions.tooltipSize = "15px";

            } else {
                radarChartOptions.w = Math.min(window.innerWidth * 0.55, 100000);  
                radarChartOptions.h = Math.min(window.innerHeight * 0.65, 10000); 
                radarChartOptions.margin = { top: 50, right: 0, bottom: 80, left: 0 };
                
            }
            
            RadarChart(".radarChart", chartData, radarChartOptions);
        }
        
        

        drawChart();

        function resize(){
            if(window.innerWidth > 430){
                drawChart()
            }
        }

        window.addEventListener('resize', resize);
        document.getElementById('show-values-checkbox').addEventListener('change', drawChart);
    }

    autocomplete(document.getElementById("player1"), playerNames);
    autocomplete(document.getElementById("player2"), playerNames);

    createFeatureButtons();

    // Fetch default player info
    const p1 = 'Luka Doncic'
    const p2 = 'Anthony Davis'
    document.getElementById('player1').value = p1;
    document.getElementById('player2').value = p2;
    fetchPlayerInfo(p1, p2, 'Career', 'Career');
    fetchSeasons(p1, 'season1-dropdown');
    fetchSeasons(p2, 'season2-dropdown');
    fetchPlayerImage(p1, 'player1-image');
    fetchPlayerImage(p2, 'player2-image');
    fetchTeamInfo(p1, 'Career', 'player1-image-container', 'player1-logo');
    fetchTeamInfo(p2, 'Career', 'player2-image-container', 'player2-logo');
    

    // Add event listeners to the season dropdowns
    document.getElementById('season1-dropdown').addEventListener('change', () => {
        // console.log("SEASON 1 CHANGE");
        //fetchSeasons(document.getElementById('player1').value, document.getElementById('season1-dropdown'));
        fetchTeamInfo(document.getElementById('player1').value, document.getElementById('season1-dropdown').value, 'player1-image-container', 'player1-logo');
        fetchPlayerInfo(document.getElementById('player1').value, document.getElementById('player2').value, document.getElementById('season1-dropdown').value, document.getElementById('season2-dropdown').value);
    });

    document.getElementById('season2-dropdown').addEventListener('change', () => {
        fetchTeamInfo(document.getElementById('player2').value, document.getElementById('season2-dropdown').value, 'player2-image-container', 'player2-logo');
        fetchPlayerInfo(document.getElementById('player1').value, document.getElementById('player2').value, document.getElementById('season1-dropdown').value, document.getElementById('season2-dropdown').value);
    });

    document.getElementById('clear-player1').addEventListener('click', function() {
        document.getElementById('player1').value = '';
    });
    
    document.getElementById('clear-player2').addEventListener('click', function() {
        document.getElementById('player2').value = '';
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

    document.getElementById('download-chart').addEventListener('click', function () {
        const svgElement = document.querySelector('.radarChart svg'); // Select the radar chart SVG
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
    
        const width = svgElement.viewBox.baseVal.width || svgElement.getBoundingClientRect().width;
        const height = svgElement.viewBox.baseVal.height || svgElement.getBoundingClientRect().height;
    
        // Set canvas size with increased resolution (2x or 3x for higher quality)
        const scaleFactor = 3; // Adjust this factor for higher/lower resolution
        canvas.width = width * scaleFactor;
        canvas.height = height * scaleFactor;
        ctx.scale(scaleFactor, scaleFactor); // Scale the canvas context to match the resolution
    
        img.onload = function () {
            ctx.drawImage(img, 0, 0, width, height); // Draw the image at full size
            URL.revokeObjectURL(url);
        
            // Create a link element and trigger a download
            const link = document.createElement('a');
            link.download = 'radar_chart.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
        
        img.src = url;
    });

    document.querySelector('.share-container').addEventListener('click', function () {
        // Show the share popup
        document.getElementById('share-popup').classList.remove('hidden');
        
        const svgElement = document.querySelector('.radarChart svg'); // Select the radar chart SVG
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
    
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
    
        const width = svgElement.viewBox.baseVal.width || svgElement.getBoundingClientRect().width;
        const height = svgElement.viewBox.baseVal.height || svgElement.getBoundingClientRect().height;
    
        // Set canvas size with higher resolution
        const scaleFactor = 3; 
        canvas.width = width * scaleFactor;
        canvas.height = height * scaleFactor;
        ctx.scale(scaleFactor, scaleFactor);
    
        img.onload = function () {
            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);
    
            // Convert canvas to data URL (png format)
            const pngData = canvas.toDataURL('image/png');
    
            // Twitter share URL
            const twitterUrl = `https://twitter.com/intent/tweet?text=Check out this radar chart!&url=${encodeURIComponent(window.location.href)}`;
    
            // Instagram does not support direct image upload via URL, so we can prompt the user to download the image
            const instagramUrl = pngData;
    
            // Facebook share URL
            const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    
            // Assign URLs to share buttons
            document.getElementById('share-twitter').setAttribute('href', twitterUrl);
            document.getElementById('share-facebook').setAttribute('href', facebookUrl);
            document.getElementById('share-instagram').addEventListener('click', function () {
                const downloadLink = document.createElement('a');
                downloadLink.href = pngData;
                downloadLink.download = 'radar_chart.png';
                downloadLink.click();
            });
        };
    
        img.src = url;
    });
    
    
    // Close the share popup
    document.getElementById('close-share-popup').addEventListener('click', function () {
        document.getElementById('share-popup').classList.add('hidden');
    });

    
});

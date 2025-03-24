document.addEventListener('DOMContentLoaded', () => {
    // Get game data from localStorage
    const gameData = JSON.parse(localStorage.getItem('gameData'));
    if (!gameData) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize UI elements
    const playerSearch = document.getElementById('playerSearch');
    const searchResults = document.getElementById('searchResults');
    const team1Players = document.getElementById('team1Players');
    const team2Players = document.getElementById('team2Players');
    const team1Name = document.getElementById('team1Name');
    const team2Name = document.getElementById('team2Name');
    const currentTurn = document.getElementById('currentTurn');
    const timerElement = document.getElementById('timer');
    const tossButton = document.getElementById('tossButton');
    const errorModal = document.getElementById('errorModal');
    const formatModal = document.getElementById('formatModal');
    const selectedStadiumDisplay = document.getElementById('selectedStadiumDisplay');
    const randomPlayersBtn = document.getElementById('randomPlayersBtn');

    // Set team names and stadium info
    team1Name.textContent = `${gameData.player1}'s Team`;
    team2Name.textContent = `${gameData.player2}'s Team`;
    selectedStadiumDisplay.textContent = `Stadium: ${gameData.stadium}`;

    // Game state
    let currentPlayer = 1;
    const team1SelectedPlayers = new Set();
    const team2SelectedPlayers = new Set();
    let team1Count = 0;
    let team2Count = 0;
    let timerInterval;
    let selectedTime = null;
    let selectedFormat = null;
    const timeOptions = {
        'unlimited': Infinity,
        '2min': 120,
        '3min': 180,
        '5min': 300
    };
    let searchTimeout;

    // Legendary players list for quick access
    const legendaryPlayers = [
        { name: "Sachin Tendulkar", stats: "Most international centuries (100) | Test matches: 200" },
        { name: "Don Bradman", stats: "Test average: 99.94 | Test matches: 52" },
        { name: "Brian Lara", stats: "Highest Test score: 400* | Test matches: 131" },
        { name: "Shane Warne", stats: "Test wickets: 708 | Test matches: 145" },
        { name: "Vivian Richards", stats: "Test average: 50.23 | ODI average: 47" },
        { name: "Wasim Akram", stats: "Test wickets: 414 | ODI wickets: 502" },
        { name: "Jacques Kallis", stats: "Test runs: 13,289 | Test wickets: 292" },
        { name: "Ricky Ponting", stats: "Test runs: 13,378 | ODI runs: 13,704" },
        { name: "MS Dhoni", stats: "ODI average: 50.57 | Matches as captain: 332" },
        { name: "Virat Kohli", stats: "ODI centuries: 46 | Test average: 48.72" }
    ];

    // Famous cricket players from around the world
    const famousPlayers = [
        // Batsmen with batting stats
        { name: "Sachin Tendulkar", stats: "Batting Avg: 54.6" },
        { name: "Brian Lara", stats: "Batting Avg: 52.9" },
        { name: "Ricky Ponting", stats: "Batting Avg: 51.8" },
        { name: "Virat Kohli", stats: "Batting Avg: 53.7" },
        { name: "Steve Smith", stats: "Batting Avg: 61.4" },
        { name: "Kane Williamson", stats: "Batting Avg: 52.7" },
        { name: "Joe Root", stats: "Batting Avg: 50.2" },
        { name: "Rohit Sharma", stats: "Batting Avg: 45.8" },
        { name: "Babar Azam", stats: "Batting Avg: 45.9" },
        { name: "David Warner", stats: "Batting Avg: 48.2" },
        { name: "AB de Villiers", stats: "Batting Avg: 50.7" },
        { name: "Hashim Amla", stats: "Batting Avg: 49.5" },
        
        // Bowlers with bowling stats
        { name: "James Anderson", stats: "Bowling Avg: 26.8" },
        { name: "Dale Steyn", stats: "Bowling Avg: 22.9" },
        { name: "Shane Warne", stats: "Bowling Avg: 25.4" },
        { name: "Muttiah Muralitharan", stats: "Bowling Avg: 22.7" },
        { name: "Wasim Akram", stats: "Bowling Avg: 23.6" },
        { name: "Glenn McGrath", stats: "Bowling Avg: 21.6" },
        { name: "Jasprit Bumrah", stats: "Bowling Avg: 21.1" },
        { name: "Kagiso Rabada", stats: "Bowling Avg: 22.5" },
        { name: "Pat Cummins", stats: "Bowling Avg: 21.8" },
        { name: "Ravichandran Ashwin", stats: "Bowling Avg: 24.3" },
        { name: "Nathan Lyon", stats: "Bowling Avg: 31.6" },
        { name: "Trent Boult", stats: "Bowling Avg: 26.9" }
    ];

    // Function to search Wikipedia for cricket players
    async function searchWikipedia(searchText) {
        try {
            // First check legendary players with partial matching
            const legendaryMatches = legendaryPlayers.filter(player => {
                const searchLower = searchText.toLowerCase();
                const nameLower = player.name.toLowerCase();
                // Match full name, first name, or partial name
                return nameLower.includes(searchLower) || 
                      nameLower.split(' ')[0].startsWith(searchLower) ||
                      nameLower.split(' ').some(part => part.startsWith(searchLower));
            });

            // Search Wikipedia API
            const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchText + " cricket player")}&format=json&origin=*`;
            const response = await fetch(searchUrl);
            const data = await response.json();
            
            // Get detailed info for each search result
            const wikiResults = await Promise.all(
                data.query.search.slice(0, 10).map(async result => {
                    try {
                        const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&titles=${encodeURIComponent(result.title)}&format=json&origin=*`;
                        const pageResponse = await fetch(pageUrl);
                        const pageData = await pageResponse.json();
                        const page = Object.values(pageData.query.pages)[0];
                        
                        // Create temporary element to parse HTML and extract text
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = page.extract;
                        const extract = tempDiv.textContent.slice(0, 150);

                        // Enhanced cricket keyword check
                        const cricketKeywords = [
                            'cricket', 'batsman', 'bowler', 'wicket', 
                            'test match', 'odi', 't20', 'ipl', 'all-rounder',
                            'cricketer', 'batting', 'bowling', 'runs', 'centuries',
                            'international cricket', 'team india', 'australian team',
                            'cricket career', 'world cup'
                        ];
                        
                        const isCricketer = cricketKeywords.some(keyword => 
                            extract.toLowerCase().includes(keyword) || 
                            result.snippet.toLowerCase().includes(keyword)
                        );

                        if (isCricketer) {
                            return {
                                name: result.title.replace(/ \(.*?\)/g, ''), // Remove parenthetical descriptions
                                stats: extract.split('.')[0], // First sentence of the extract
                                id: result.pageid
                            };
                        }
                        return null;
                    } catch (error) {
                        console.error('Error fetching player details:', error);
                        return null;
                    }
                })
            );

            // Combine legendary players with Wikipedia results
            const allPlayers = [
                ...legendaryMatches,
                ...wikiResults.filter(result => 
                    result && 
                    !legendaryMatches.some(lp => lp.name === result.name)
                )
            ];

            return allPlayers;
        } catch (error) {
            console.error('Error searching Wikipedia:', error);
            return legendaryPlayers.filter(player => 
                player.name.toLowerCase().includes(searchText.toLowerCase())
            );
        }
    }

    function displaySearchResults(results, container) {
        container.innerHTML = '';
        
        if (results.length === 0) {
            container.innerHTML = '<div class="no-results">No cricket players found</div>';
            return;
        }

        results.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.className = 'player-result';
            playerElement.innerHTML = `
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-stats">${player.stats || ''}</div>
                </div>
            `;
            
            playerElement.addEventListener('click', () => {
                if (!selectedTime) {
                    showErrorModal('Please select a time limit first!');
                    return;
                }

                const targetTeamContainer = currentPlayer === 1 ? 
                    document.getElementById('team1Players') : 
                    document.getElementById('team2Players');
                
                addPlayerToTeam(player, targetTeamContainer);
            });
            
            container.appendChild(playerElement);
        });
    }

    // Initialize player slots
    function initializePlayerSlots() {
        const createSlots = (container, count) => {
            const slotsContainer = container.querySelector('.player-slots');
            slotsContainer.innerHTML = '';
            for (let i = 1; i <= count; i++) {
                slotsContainer.innerHTML += `
                    <div class="player-slot empty" data-slot="${i}">
                        <span class="slot-number">${i}</span>
                        <span class="empty-text">Empty Slot</span>
                    </div>
                `;
            }
        };

        createSlots(team1Players, 11);
        createSlots(team2Players, 11);
    }

    // Update timer display
    function updateTimer() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Show error modal with animation
    function showErrorModal(message = "Time's up! This game is not made for noobs.") {
        errorModal.classList.add('active');
        const modalContent = errorModal.querySelector('.modal-content');
        modalContent.classList.add('shake-animation');
        
        // Update error message
        const errorText = modalContent.querySelector('p');
        errorText.textContent = message;
        errorText.classList.add('glitch-text');
        
        // Remove animation classes after animation completes
        setTimeout(() => {
            modalContent.classList.remove('shake-animation');
            errorText.classList.remove('glitch-text');
        }, 1000);
    }

    // Start timer for player turn
    function startTimer() {
        if (timerInterval || !selectedTime) return;
        
        if (selectedTime === Infinity) {
            updateTimerDisplay(Infinity);
            return;
        }

        let timeLeft = selectedTime;
        updateTimerDisplay(timeLeft);
        
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay(timeLeft);
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                showErrorModal();
            }
        }, 1000);
    }

    function updateTimerDisplay(seconds) {
        const timerElement = document.querySelector('.timer');
        
        if (selectedTime === Infinity) {
            timerElement.innerHTML = `<span class="infinity-symbol">∞</span>`;
            timerElement.classList.add('unlimited');
            return;
        }
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        timerElement.classList.remove('unlimited');
        timerElement.innerHTML = `
            <div class="countdown">
                <span class="minutes">${minutes}</span>
                <span class="separator">:</span>
                <span class="seconds">${remainingSeconds.toString().padStart(2, '0')}</span>
            </div>
        `;
    }

    // Show format selection modal on page load
    formatModal.classList.add('active');

    // Disable player search initially
    playerSearch.classList.add('disabled');
    playerSearch.placeholder = 'Select time limit first';

    // Update the format selection handler
    document.querySelector('.format-options').addEventListener('click', (e) => {
        if (e.target.matches('.format-btn')) {
            // Remove selected class from all format buttons
            document.querySelectorAll('.format-btn').forEach(btn => 
                btn.classList.remove('selected'));
            
            // Add selected class to clicked button
            e.target.classList.add('selected');
            
            // Store selected format
            selectedFormat = e.target.dataset.format;
            
            // Update format display
            const formatDisplay = document.getElementById('formatDisplay');
            const formatNames = {
                'test': 'Test Match',
                'odi': 'ODI',
                't20': 'T-20'  // Update to match format used elsewhere
            };
            formatDisplay.textContent = `Format: ${formatNames[selectedFormat]}`;
            
            // Update game data with selected format and save to localStorage immediately
            gameData.format = formatNames[selectedFormat];
            localStorage.setItem('gameData', JSON.stringify(gameData));
            
            console.log('Format selected:', gameData.format);
            
            // Close format modal
            formatModal.classList.remove('active');
        }
    });

    // Function to handle format selection
    function handleFormatSelection(e) {
        if (e.target.matches('.format-btn')) {
            // Remove selected class from all format buttons
            document.querySelectorAll('.format-btn').forEach(btn => 
                btn.classList.remove('selected'));
            
            // Add selected class to clicked button
            e.target.classList.add('selected');
            
            // Store selected format
            selectedFormat = e.target.dataset.format;
            
            // Update format display
            const formatDisplay = document.getElementById('formatDisplay');
            const formatNames = {
                'test': 'Test Match',
                'odi': 'ODI',
                't20': 'T-20'
            };
            formatDisplay.textContent = `Format: ${formatNames[selectedFormat]}`;
            
            // Update game data with selected format and save to localStorage immediately
            gameData.format = formatNames[selectedFormat];
            localStorage.setItem('gameData', JSON.stringify(gameData));
            
            console.log('Format selected:', gameData.format);
            
            // Close format modal
            formatModal.classList.remove('active');
        }
    }

    // Update handleTimeSelection function
    function handleTimeSelection(event) {
        if (!event.target.matches('.time-btn')) return;
        
        // Remove selected class from all buttons
        document.querySelectorAll('.time-btn').forEach(btn => 
            btn.classList.remove('selected'));
        
        // Add selected class to clicked button
        event.target.classList.add('selected');
        
        // Clear existing timer if any
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        
        // Set the selected time
        const timeChoice = event.target.dataset.time;
        selectedTime = timeChoice === 'unlimited' ? Infinity : parseInt(timeChoice);
        
        // Enable player search
        playerSearch.classList.remove('disabled');
        playerSearch.placeholder = 'Search for players...';
        
        // Start the timer
        startTimer();
    }

    // Update team count display
    function updateTeamCountDisplay() {
        // Update Team 1 count
        team1Name.textContent = `${gameData.player1}'s Team (${team1Count}/11)`;
        
        // Update Team 2 count
        team2Name.textContent = `${gameData.player2}'s Team (${team2Count}/11)`;
        
        // Update toss button state
        if (team1Count === 11 && team2Count === 11) {
            tossButton.disabled = false;
            tossButton.classList.add('active');
        } else {
            tossButton.disabled = true;
            tossButton.classList.remove('active');
        }
    }

    // Function to add player to team
    function addPlayerToTeam(player, teamContainer) {
        // Check if player is already in the current team
        const currentTeamPlayers = teamContainer.id === 'team1Players' ? team1SelectedPlayers : team2SelectedPlayers;
        if (currentTeamPlayers.has(player.name)) {
            showErrorModal('This player is already in your team!');
            return;
        }

        const nextEmptySlot = teamContainer.querySelector('.player-slot.empty');
        if (nextEmptySlot) {
            nextEmptySlot.classList.remove('empty');
            nextEmptySlot.classList.add('filled');
            nextEmptySlot.innerHTML = `
                <span class="slot-number">${nextEmptySlot.dataset.slot}</span>
                <div class="player-info">
                    <span class="player-name">${player.name}</span>
                    <span class="player-stats">${player.stats}</span>
                </div>
            `;
            
            // Add player to the appropriate team's Set
            if (teamContainer.id === 'team1Players') {
                team1SelectedPlayers.add(player.name);
                team1Count++;
            } else {
                team2SelectedPlayers.add(player.name);
                team2Count++;
            }

            // Update team counts display
            updateTeamCountDisplay();

            // Update current player's turn
            currentPlayer = currentPlayer === 1 ? 2 : 1;
            currentTurn.textContent = `Player ${currentPlayer}'s Turn`;

            // Clear search
            playerSearch.value = '';
            searchResults.classList.remove('active');
        }
    }

    // Function to handle removing a player
    function handleRemovePlayer(e) {
        const button = e.target;
        const teamId = button.dataset.team;
        const slotNumber = button.dataset.slot;
        const playerSlot = button.closest('.player-slot');
        const playerName = playerSlot.querySelector('.player-name').textContent;
        
        // Remove player from set and update count
        if (teamId === '1') {
            team1SelectedPlayers.delete(playerName);
            team1Count--;
        } else {
            team2SelectedPlayers.delete(playerName);
            team2Count--;
        }
        
        // Update UI
        playerSlot.className = 'player-slot empty';
        playerSlot.innerHTML = `
            <span class="slot-number">${slotNumber}</span>
            <span class="empty-text">Empty Slot</span>
        `;
        
        // Update team counts display
        updateTeamCountDisplay();
    }

    // Function to fill both teams with random players
    function fillWithRandomPlayers() {
        console.log('Filling with random players');
        
        // Check if time is selected first
        if (!selectedTime) {
            showErrorModal('Please select a time limit first!');
            return;
        }
        
        // Clear existing players first (if any)
        team1SelectedPlayers.clear();
        team2SelectedPlayers.clear();
        team1Count = 0;
        team2Count = 0;
        
        // Reset all slots to empty state
        document.querySelectorAll('#team1Players .player-slot, #team2Players .player-slot').forEach(slot => {
            slot.className = 'player-slot empty';
            slot.innerHTML = `
                <span class="slot-number">${slot.dataset.slot}</span>
                <span class="empty-text">Empty Slot</span>
            `;
        });

        // Shuffle the players array for Team 1
        const shuffledPlayers1 = [...famousPlayers].sort(() => Math.random() - 0.5);
        
        // Fill Team 1 with first 11 players
        const team1PlayerSlots = document.querySelectorAll('#team1Players .player-slot');
        team1PlayerSlots.forEach((slot, index) => {
            if (index < 11) {
                const player = shuffledPlayers1[index];
                slot.className = 'player-slot filled';
                slot.innerHTML = `
                    <span class="slot-number">${index + 1}</span>
                    <div class="player-info">
                        <span class="player-name">${player.name}</span>
                        <span class="player-stats">${player.stats}</span>
                    </div>
                `;
                team1SelectedPlayers.add(player.name);
                team1Count++;
            }
        });
        
        // Shuffle again for Team 2 to ensure different players
        const team1Names = new Set(team1SelectedPlayers);
        const remainingPlayers = famousPlayers.filter(player => !team1Names.has(player.name));
        const shuffledPlayers2 = [...remainingPlayers].sort(() => Math.random() - 0.5);
        
        // Fill Team 2 with different players
        const team2PlayerSlots = document.querySelectorAll('#team2Players .player-slot');
        team2PlayerSlots.forEach((slot, index) => {
            if (index < 11) {
                const player = shuffledPlayers2[index] || shuffledPlayers1[index + 11]; // Fallback if not enough unique players
                slot.className = 'player-slot filled';
                slot.innerHTML = `
                    <span class="slot-number">${index + 1}</span>
                    <div class="player-info">
                        <span class="player-name">${player.name}</span>
                        <span class="player-stats">${player.stats}</span>
                    </div>
                `;
                team2SelectedPlayers.add(player.name);
                team2Count++;
            }
        });
        
        // Update UI to reflect filled teams
        updateTeamCountDisplay();
        currentPlayer = 1;
        currentTurn.textContent = `Player ${currentPlayer}'s Turn`;
        
        console.log('Teams filled with random players', { team1: team1Count, team2: team2Count });
    }

    // Update playerSearch event listener
    playerSearch.addEventListener('input', (e) => {
        // If time is not selected, show error
        if (!selectedTime) {
            showErrorModal('Please select a time limit first!');
            e.target.value = '';
            return;
        }

        const searchText = e.target.value.trim();
        if (searchText === '') {
            searchResults.classList.remove('active');
            return;
        }

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        searchResults.innerHTML = '<div class="loading">Searching...</div>';
        searchResults.classList.add('active');

        searchTimeout = setTimeout(async () => {
            const players = await searchWikipedia(searchText);
            
            if (players.length > 0) {
                displaySearchResults(players, searchResults);
            } else {
                searchResults.innerHTML = '<div class="no-results">No players found</div>';
            }
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!playerSearch.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });

    tossButton.addEventListener('click', (e) => {
        // Prevent default to avoid form submission behavior
        e.preventDefault();
        
        // Verify both teams have 11 players selected
        if (team1Count !== 11 || team2Count !== 11) {
            showErrorModal('Both teams must have 11 players selected!');
            return;
        }
        
        // Create teams data object
        const teamsData = {
            team1: {
                name: gameData.player1,
                players: Array.from(document.querySelectorAll('#team1Players .player-slot.filled')).map(slot => ({
                    name: slot.querySelector('.player-name').textContent,
                    stats: slot.querySelector('.player-stats').textContent
                }))
            },
            team2: {
                name: gameData.player2,
                players: Array.from(document.querySelectorAll('#team2Players .player-slot.filled')).map(slot => ({
                    name: slot.querySelector('.player-name').textContent,
                    stats: slot.querySelector('.player-stats').textContent
                }))
            },
            stadium: gameData.stadium
        };
        
        console.log('Teams data saved:', teamsData);
        console.log('Game data:', gameData);
        
        // Store the teams data in localStorage
        localStorage.setItem('teamsData', JSON.stringify(teamsData));
        
        // Make sure the gameData has all required information
        if (!gameData.stadium) {
            gameData.stadium = 'Default Stadium';
        }
        localStorage.setItem('gameData', JSON.stringify(gameData));
        
        // Redirect to toss page after a short delay
        setTimeout(() => {
            window.location.href = 'toss.html';
        }, 100);
    });

    // Add event listener for time selection
    document.querySelector('.time-options').addEventListener('click', handleTimeSelection);
    
    // Update initial timer display
    document.querySelector('.timer').textContent = 'Select Time';

    // Initialize the page
    initializePlayerSlots();
    
    // Add event listeners for format selection
    document.querySelectorAll('.format-btn').forEach(button => {
        button.addEventListener('click', handleFormatSelection);
    });

    // Add event listener for Random Players button
    if (randomPlayersBtn) {
        randomPlayersBtn.addEventListener('click', fillWithRandomPlayers);
        console.log('Random players button listener added');
    } else {
        console.error('Random players button not found');
    }
}); 
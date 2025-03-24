document.addEventListener('DOMContentLoaded', () => {
    // Clear any existing game data to prevent old data persistence
    const teamsData = JSON.parse(localStorage.getItem('teamsData'));
    const gameData = JSON.parse(localStorage.getItem('gameData')) || {};
    
    // Validate required data and team selection
    if (!teamsData || !teamsData.team1 || !teamsData.team2 || 
        !teamsData.team1.players || !teamsData.team2.players ||
        !gameData.format) {
        console.error('Missing required data');
        window.location.href = 'team-selection.html';
        return;
    }

    // Initialize UI elements
    const formatDisplay = document.getElementById('formatDisplay');
    const selectedStadiumDisplay = document.getElementById('selectedStadiumDisplay');
    const team1Name = document.getElementById('team1Name');
    const team2Name = document.getElementById('team2Name');
    const team1Captain = document.getElementById('team1Captain');
    const team2Captain = document.getElementById('team2Captain');
    const team1CaptainSelect = document.getElementById('team1CaptainSelect');
    const team2CaptainSelect = document.getElementById('team2CaptainSelect');
    const currentPlayerTurn = document.getElementById('currentPlayerTurn');
    const coin = document.getElementById('coin');
    const tossResult = document.getElementById('tossResult');
    const tossWinner = document.getElementById('tossWinner');
    const decisionButtons = document.querySelector('.decision-buttons');
    const matchSummary = document.querySelector('.match-summary');
    const matchSummaryText = document.getElementById('matchSummary');
    const startMatchBtn = document.getElementById('startMatchBtn');
    const choiceButtons = document.querySelectorAll('.choice-btn');
    const validationMessage = document.getElementById('validationMessage');

    // Game state
    let tossWinnerName = '';
    let tossChoice = '';
    let battingTeam = '';
    let bowlingTeam = '';
    let currentTossPlayer = Math.random() < 0.5 ? 1 : 2; // Randomize first turn

    // Populate captain dropdowns with players from each team
    function populateCaptainDropdowns() {
        // Clear existing options except the default one
        team1CaptainSelect.innerHTML = '<option value="">Choose captain...</option>';
        team2CaptainSelect.innerHTML = '<option value="">Choose captain...</option>';
        
        // Add players from team 1 to dropdown
        teamsData.team1.players.forEach(player => {
            const option = document.createElement('option');
            option.value = player.name;
            option.textContent = player.name;
            team1CaptainSelect.appendChild(option);
        });
        
        // Add players from team 2 to dropdown
        teamsData.team2.players.forEach(player => {
            const option = document.createElement('option');
            option.value = player.name;
            option.textContent = player.name;
            team2CaptainSelect.appendChild(option);
        });
        
        // Set initial selection if captains exist
        if (teamsData.team1.captain) {
            team1CaptainSelect.value = teamsData.team1.captain;
            team1Captain.textContent = teamsData.team1.captain;
        }
        
        if (teamsData.team2.captain) {
            team2CaptainSelect.value = teamsData.team2.captain;
            team2Captain.textContent = teamsData.team2.captain;
        }
    }
    
    // Add event listeners for captain selection
    team1CaptainSelect.addEventListener('change', function() {
        const selectedCaptain = this.value;
        if (selectedCaptain) {
            teamsData.team1.captain = selectedCaptain;
            team1Captain.textContent = selectedCaptain;
            localStorage.setItem('teamsData', JSON.stringify(teamsData));
            checkCaptainsSelected();
        }
    });
    
    team2CaptainSelect.addEventListener('change', function() {
        const selectedCaptain = this.value;
        if (selectedCaptain) {
            teamsData.team2.captain = selectedCaptain;
            team2Captain.textContent = selectedCaptain;
            localStorage.setItem('teamsData', JSON.stringify(teamsData));
            checkCaptainsSelected();
        }
    });
    
    // Check if both captains are selected and enable toss buttons if they are
    function checkCaptainsSelected() {
        const captainsSelected = teamsData.team1.captain && teamsData.team2.captain;
        
        choiceButtons.forEach(btn => {
            btn.disabled = !captainsSelected;
        });
        
        validationMessage.classList.toggle('hidden', captainsSelected);
        
        return captainsSelected;
    }

    // Initialize the page
    function initializePage() {
        // Set format display with proper formatting
        const format = gameData.format || 'Unknown';
        formatDisplay.textContent = `Format: ${format}`;
        
        // Set stadium display
        selectedStadiumDisplay.textContent = `Stadium: ${gameData.stadium || 'Not selected'}`;
        
        // Set team names
        team1Name.textContent = teamsData.team1.name;
        team2Name.textContent = teamsData.team2.name;
        
        // Populate captain dropdowns
        populateCaptainDropdowns();
        
        // Set captain names
        team1Captain.textContent = teamsData.team1.captain || 'Not selected';
        team2Captain.textContent = teamsData.team2.captain || 'Not selected';
        
        // Save cleaned data back to localStorage
        localStorage.setItem('teamsData', JSON.stringify(teamsData));
        
        updateCurrentPlayerTurn();
        
        // Check if captains are selected
        if (!checkCaptainsSelected()) {
            // If not, ensure captain validation message is shown
            validationMessage.classList.remove('hidden');
        }
    }

    // Update current player turn display
    function updateCurrentPlayerTurn() {
        const currentTeamName = currentTossPlayer === 1 ? teamsData.team1.name : teamsData.team2.name;
        currentPlayerTurn.textContent = `${currentTeamName}'s Turn`;
    }

    // Handle coin toss choice
    document.querySelector('.choice-buttons').addEventListener('click', (e) => {
        if (!e.target.matches('.choice-btn') || e.target.disabled) return;

        tossChoice = e.target.dataset.choice;
        choiceButtons.forEach(btn => btn.disabled = true);

        // Flip the coin
        flipCoin().then(result => {
            tossWinnerName = result === 'heads' ? teamsData.team1.name : teamsData.team2.name;
            tossResult.classList.remove('hidden');
            tossWinner.textContent = `${tossWinnerName} won the toss! (${result.toUpperCase()})`;
            decisionButtons.classList.remove('hidden');
            
            // Store toss result
            gameData.tossWinner = tossWinnerName;
            localStorage.setItem('gameData', JSON.stringify(gameData));
        });
    });

    // Add these helper functions at the top of the file
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function generateRandomRotation() {
        // Generate random number of complete rotations (5-10 rotations)
        const completeRotations = getRandomInt(5, 10) * 360;
        // Add random extra degrees
        const extraDegrees = getRandomInt(0, 359);
        return completeRotations + extraDegrees;
    }

    function flipCoin() {
        const coin = document.getElementById('coin');
        
        // Generate random rotations for different axes
        const randomY = generateRandomRotation();
        const randomX = getRandomInt(-45, 45); // Random tilt
        const randomZ = getRandomInt(-30, 30); // Random spin
        
        // Set multiple rotation values
        coin.style.setProperty('--final-rotation', `${randomY}deg`);
        coin.style.setProperty('--final-tilt', `${randomX}deg`);
        coin.style.setProperty('--final-spin', `${randomZ}deg`);
        
        // Add flip class with enhanced animation
        coin.classList.add('flip');
        
        // Calculate result based on final rotation
        // Using complex calculation to make it more random
        const totalRotation = (randomY + randomX + randomZ) % 360;
        const result = Math.abs(totalRotation) < 180 ? 'heads' : 'tails';
        
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(result);
            }, 3000); // Match this with CSS animation duration
        });
    }

    // Handle batting/bowling decision
    document.querySelector('.decision-buttons').addEventListener('click', (e) => {
        if (!e.target.matches('.decision-btn')) return;
        
        const decision = e.target.dataset.decision;
        if (decision === 'bat') {
            battingTeam = tossWinnerName;
            bowlingTeam = tossWinnerName === teamsData.team1.name ? teamsData.team2.name : teamsData.team1.name;
        } else {
            bowlingTeam = tossWinnerName;
            battingTeam = tossWinnerName === teamsData.team1.name ? teamsData.team2.name : teamsData.team1.name;
        }

        // Update match summary
        updateMatchSummary();
    });

    // Update match summary
    function updateMatchSummary() {
        matchSummaryText.innerHTML = `
            <p><strong>${tossWinnerName}</strong> won the toss and chose to <strong>${battingTeam === tossWinnerName ? 'BAT' : 'BOWL'}</strong> first.</p>
            <p><strong>${battingTeam}</strong> will bat first.</p>
            <p><strong>${bowlingTeam}</strong> will bowl first.</p>
        `;
        
        // Store batting order
        gameData.battingTeam = battingTeam;
        gameData.bowlingTeam = bowlingTeam;
        localStorage.setItem('gameData', JSON.stringify(gameData));
        
        matchSummary.classList.remove('hidden');
        decisionButtons.classList.add('hidden');
    }

    // Handle start match button
    startMatchBtn.addEventListener('click', async () => {
        // Collect all inputs from all pages
        const allInputs = {
            // From page 1 (stored in localStorage)
            player1Name: teamsData.team1.name,
            player2Name: teamsData.team2.name,
            stadiumName: gameData.stadium,
            
            // From page 2
            format: gameData.format,
            team1Players: teamsData.team1.players.map(player => player.name),
            team2Players: teamsData.team2.players.map(player => player.name),
            
            // From page 3
            team1Captain: teamsData.team1.captain,
            team2Captain: teamsData.team2.captain,
            tossWinner: gameData.tossWinner,
            tossDecision: battingTeam === gameData.tossWinner ? 'bat' : 'bowl'
        };

        try {
            // Show loading indicator
            startMatchBtn.disabled = true;
            startMatchBtn.textContent = 'Preparing match data...';
            
            // Create data object with processing flag and hardcoded deepseek model
            const matchData = {
                _processing: true,
                _selectedModel: 'deepseek',
                _inputs: allInputs,
                // Add basic information for fallback display
                format: allInputs.format,
                venue: allInputs.stadiumName,
                team1: {
                    name: allInputs.player1Name,
                    battingStats: [],
                    bowlingStats: []
                },
                team2: {
                    name: allInputs.player2Name,
                    battingStats: [],
                    bowlingStats: []
                }
            };
            
            // Store the data for processing on the summary page
            localStorage.setItem('matchData', JSON.stringify(matchData));
            
            // Redirect to summary page where AI processing will happen
            window.location.href = 'summary.html';
        } catch (error) {
            console.error('Error preparing match data:', error);
            startMatchBtn.disabled = false;
            startMatchBtn.textContent = 'Start Match';
            alert('There was an error preparing the match data. Please try again.');
        }
    });

    // Initialize the page
    initializePage();
}); 
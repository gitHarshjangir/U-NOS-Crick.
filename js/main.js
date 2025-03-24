document.addEventListener('DOMContentLoaded', () => {
    const player1Input = document.getElementById('player1');
    const player2Input = document.getElementById('player2');
    const stadiumSearch = document.getElementById('stadiumSearch');
    const stadiumList = document.getElementById('stadiumList');
    const selectedStadium = document.getElementById('selectedStadium');
    const startGameButton = document.getElementById('startGame');
    const rulesBtn = document.getElementById('rulesBtn');
    const rulesModal = document.getElementById('rulesModal');
    const closeRulesModal = document.getElementById('closeRulesModal');

    // List of cricket stadiums worldwide
    const stadiums = [
        "Eden Gardens, Kolkata",
        "Lord's Cricket Ground, London",
        "Melbourne Cricket Ground, Melbourne",
        "Wankhede Stadium, Mumbai",
        "Sydney Cricket Ground, Sydney",
        "The Oval, London",
        "M. Chinnaswamy Stadium, Bangalore",
        "Adelaide Oval, Adelaide",
        "Feroz Shah Kotla, Delhi",
        "Newlands Cricket Ground, Cape Town",
        "Old Trafford, Manchester",
        "MA Chidambaram Stadium, Chennai",
        "WACA Ground, Perth",
        "Galle International Stadium, Galle",
        "Kensington Oval, Bridgetown",
        "Dubai International Cricket Stadium, Dubai",
        "Wanderers Stadium, Johannesburg",
        "Trent Bridge, Nottingham",
        "R. Premadasa Stadium, Colombo",
        "Sabina Park, Kingston"
    ];

    let selectedStadiumValue = null;

    // Function to check if form is valid
    const checkFormValidity = () => {
        const isNamesValid = player1Input.value.trim() !== '' && 
                           player2Input.value.trim() !== '';
        startGameButton.disabled = !(isNamesValid && selectedStadiumValue);
    };

    // Function to filter stadiums based on search
    const filterStadiums = (searchText) => {
        const filtered = stadiums.filter(stadium => 
            stadium.toLowerCase().includes(searchText.toLowerCase())
        );
        
        stadiumList.innerHTML = '';
        
        if (filtered.length > 0 && searchText.trim() !== '') {
            stadiumList.classList.add('active');
            filtered.forEach(stadium => {
                const div = document.createElement('div');
                div.className = 'stadium-item';
                div.textContent = stadium;
                div.addEventListener('click', () => selectStadium(stadium));
                stadiumList.appendChild(div);
            });
        } else {
            stadiumList.classList.remove('active');
        }
    };

    // Function to select a stadium
    const selectStadium = (stadium) => {
        selectedStadiumValue = stadium;
        selectedStadium.innerHTML = `<p>${stadium}</p>`;
        selectedStadium.classList.add('has-stadium');
        stadiumSearch.value = '';
        stadiumList.classList.remove('active');
        checkFormValidity();
    };

    // Event listeners for player name inputs
    [player1Input, player2Input].forEach(input => {
        input.addEventListener('input', checkFormValidity);
    });

    // Event listener for stadium search
    stadiumSearch.addEventListener('input', (e) => {
        filterStadiums(e.target.value);
    });

    // Close stadium list when clicking outside
    document.addEventListener('click', (e) => {
        if (!stadiumSearch.contains(e.target) && !stadiumList.contains(e.target)) {
            stadiumList.classList.remove('active');
        }
    });

    // Event listener for start game button
    startGameButton.addEventListener('click', () => {
        const gameData = {
            player1: player1Input.value.trim(),
            player2: player2Input.value.trim(),
            stadium: selectedStadiumValue
        };
        
        // Store game data in localStorage for use in team selection page
        localStorage.setItem('gameData', JSON.stringify(gameData));
        
        // Redirect to team selection page
        window.location.href = 'team-selection.html';
    });
    
    // Rules Modal Functionality
    if (rulesBtn && rulesModal) {
        // Show rules modal when rules button is clicked
        rulesBtn.addEventListener('click', () => {
            rulesModal.classList.add('active');
        });
        
        // Close rules modal when close button is clicked
        if (closeRulesModal) {
            closeRulesModal.addEventListener('click', () => {
                rulesModal.classList.remove('active');
            });
        }
        
        // Close rules modal when clicking outside the modal content
        rulesModal.addEventListener('click', (e) => {
            if (e.target === rulesModal) {
                rulesModal.classList.remove('active');
            }
        });
        
        // Close rules modal when escape key is pressed
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && rulesModal.classList.contains('active')) {
                rulesModal.classList.remove('active');
            }
        });
    }
}); 
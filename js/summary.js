/**
 * Initialize the application
 */
function initializeApp() {
    console.log('Initializing cricket match summary app...');
    
    // Create the simulation engine instance
    window.simulationEngine = new SimpleSimulationEngine();
    
    // Set up event listeners
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM loaded, setting up event listeners');
        
        // Add debug panel in development mode
        if (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' || 
            window.location.search.includes('debug=true')) {
            addDebugPanel();
        }
        
        // Set up the match start button
        const startButton = document.getElementById('startMatch');
        if (startButton) {
            startButton.addEventListener('click', startMatch);
        }
        
        // Initialize other UI elements
        initializeUI();
    });
}

// Start the application
initializeApp();

// No need for another event listener as initializeApp already handles it
// Remove this event listener:
// document.addEventListener('DOMContentLoaded', async () => {
//     // Check for debug parameter in URL
//     if (window.location.search.includes('debug=true')) {
//         addDebugPanel();
//     }
//     
//     // Setup start match button
//     const startButton = document.getElementById('startMatch');
//     if (startButton) {
//         startButton.addEventListener('click', startMatch);
//     }
//     
//     // Show local storage data in debug panel
//     showLocalStorageData();
// });

async function processMatchDataWithAI(matchData) {
    // We're now using a local simulation engine instead of an external API
    console.log('Processing match data with simulation engine');
    
    try {
        // Get the simulation engine
        const engine = window.simulationEngine || new SimpleSimulationEngine();
        
        // Process the match data
        const processedData = await engine.processMatch(matchData);
        
        // Store in localStorage
        localStorage.setItem('matchData', JSON.stringify(processedData));
        
        return processedData;
    } catch (error) {
        console.error('Error processing match data:', error);
        throw error;
    }
}

function generateFallbackData(matchData) {
    console.log('Generating fallback match data');
    
    // Extract input data
    const format = matchData.format || 'T20';
    const player1 = matchData.player1Name || matchData.player1 || 'Team 1';
    const player2 = matchData.player2Name || matchData.player2 || 'Team 2';
    const stadium = matchData.stadium || 'Default Stadium';
    
    // Extract player names or create defaults
    const team1Players = Array.isArray(matchData.team1Players) && matchData.team1Players.length > 0 
        ? matchData.team1Players.map(p => typeof p === 'object' ? p.name : p)
        : generateDefaultPlayerNames(player1, 11);

    const team2Players = Array.isArray(matchData.team2Players) && matchData.team2Players.length > 0 
        ? matchData.team2Players.map(p => typeof p === 'object' ? p.name : p)
        : generateDefaultPlayerNames(player2, 11);
    
    // Get current date
    const currentDate = new Date().toLocaleDateString();
    
    // Randomly decide if this will be a tied match (1 in 10 chance)
    const isTiedMatch = Math.random() < 0.1;
    
    // Generate random scores based on format
    let team1MaxRuns, team2MaxRuns, team1MaxOvers, team2MaxOvers;
    
    if (/t20|t-20/i.test(format)) {
        team1MaxRuns = Math.floor(Math.random() * 100) + 120;
        team2MaxRuns = isTiedMatch ? team1MaxRuns : Math.floor(Math.random() * 100) + 120;
        team1MaxOvers = 20;
        team2MaxOvers = 20;
    } else if (/odi/i.test(format)) {
        team1MaxRuns = Math.floor(Math.random() * 150) + 200;
        team2MaxRuns = isTiedMatch ? team1MaxRuns : Math.floor(Math.random() * 150) + 200;
        team1MaxOvers = 50;
        team2MaxOvers = 50;
    } else { // Test match
        team1MaxRuns = Math.floor(Math.random() * 200) + 250;
        team2MaxRuns = isTiedMatch ? team1MaxRuns : Math.floor(Math.random() * 200) + 250;
        team1MaxOvers = Math.floor(Math.random() * 30) + 70; // 70-100 overs
        team2MaxOvers = Math.floor(Math.random() * 30) + 70; // 70-100 overs
    }
    
    // Calculate how many overs to use (80-100% of max)
    const team1UsedOvers = (team1MaxOvers * (0.8 + Math.random() * 0.2)).toFixed(1);
    const team2UsedOvers = (team2MaxOvers * (0.8 + Math.random() * 0.2)).toFixed(1);
    
    // Function to generate realistic batting stats
    const generateBattingStats = (teamName, playerNames, teamMaxRuns) => {
        // First, determine how many wickets fell (5-9)
        const wicketsFallen = Math.floor(Math.random() * 5) + 5;
        
        // Generate individual batting stats
        const battingStats = playerNames.slice(0, 11).map((player, index) => {
            // Only players before the wicket count get actual runs
            if (index < wicketsFallen) {
                const runs = Math.floor(Math.random() * (teamMaxRuns / 3)) + 10;
                const balls = Math.min(Math.floor(runs * 1.2) + 5, 120);
                const fours = Math.min(Math.floor(runs / 8), 8);
                const sixes = Math.min(Math.floor(runs / 15), 4);
                return {
                    name: player,
                    runs: runs,
                    balls: balls,
                    fours: fours,
                    sixes: sixes,
                    strikeRate: balls > 0 ? ((runs / balls) * 100).toFixed(2) : "0.00",
                    dismissal: index === 0 ? 'c & b' : index % 2 === 0 ? 'bowled' : 'caught'
                };
            } else {
                // Did not bat
                return {
                    name: player,
                    runs: 0,
                    balls: 0,
                    fours: 0,
                    sixes: 0,
                    strikeRate: "0.00",
                    dismissal: 'did not bat'
                };
            }
        });
        
        // Calculate the initial total of individual scores
        let totalRuns = battingStats.reduce((sum, player) => sum + player.runs, 0);
        
        // Add extras (5-15% of total)
        const extras = Math.floor(totalRuns * (0.05 + Math.random() * 0.1));
        totalRuns += extras;
        
        // Ensure total runs matches our target for tied games
        if (isTiedMatch) {
            // Adjust the highest scorer to make totals match exactly
            const highestScorer = battingStats.reduce((prev, current) => 
                (prev.runs > current.runs) ? prev : current);
            const adjustment = teamMaxRuns - totalRuns;
            highestScorer.runs += adjustment;
            totalRuns = teamMaxRuns;
        }
        
        return { battingStats, totalRuns, wicketsFallen, extras };
    };
    
    // Function to generate realistic bowling stats
    const generateBowlingStats = (teamName, playerNames, opposingRuns, opposingWickets, opposingOvers) => {
        // Convert overs to balls for calculation
        const totalOvers = parseFloat(opposingOvers);
        const totalBalls = Math.floor(totalOvers) * 6 + Math.round((totalOvers % 1) * 10);
        
        // Use 5-7 bowlers
        const bowlerCount = Math.floor(Math.random() * 3) + 5;
        const bowlers = playerNames.slice(5, 11); // Use mainly the last 6 players as bowlers
        
        // Generate bowling stats
        const bowlingStats = [];
        let remainingWickets = opposingWickets;
        let remainingRuns = opposingRuns;
        let remainingOvers = totalOvers;
        
        for (let i = 0; i < bowlerCount; i++) {
            // Randomize overs bowled by each player
            const maxOversBowled = Math.min(remainingOvers, 10); // Max 10 overs per bowler in limited overs
            const oversBowled = i === bowlerCount - 1 
                ? remainingOvers.toFixed(1)
                : Math.min((1 + Math.random() * 9), maxOversBowled).toFixed(1);
            
            remainingOvers -= parseFloat(oversBowled);
                
            const maidens = Math.min(Math.floor(Math.random() * 2), parseInt(oversBowled));
            
            // Distribute wickets and runs
            const wickets = i === bowlerCount - 1 ? remainingWickets : Math.min(Math.floor(Math.random() * 3), remainingWickets);
            remainingWickets -= wickets;
            
            const runsConceded = i === bowlerCount - 1 ? remainingRuns : Math.min(Math.floor(Math.random() * 40) + 10, remainingRuns);
            remainingRuns -= runsConceded;
            
            bowlingStats.push({
                name: bowlers[i % bowlers.length], // Cycle through available bowlers
                overs: oversBowled,
                maidens: maidens,
                runs: runsConceded,
                wickets: wickets,
                economy: parseFloat(oversBowled) > 0 ? (runsConceded / parseFloat(oversBowled)).toFixed(2) : "0.00"
            });
        }
        
        return bowlingStats;
    };
    
    // Generate team stats
    const team1Stats = generateBattingStats(player1, team1Players, team1MaxRuns);
    const team2Stats = generateBattingStats(player2, team2Players, team2MaxRuns);
    
    // Generate bowling stats based on opponents' batting
    const team1BowlingStats = generateBowlingStats(player1, team1Players, team2Stats.totalRuns, team2Stats.wicketsFallen, team2UsedOvers);
    const team2BowlingStats = generateBowlingStats(player2, team2Players, team1Stats.totalRuns, team1Stats.wicketsFallen, team1UsedOvers);
    
    // Determine match result
    let winner, margin, method;
    
    if (isTiedMatch || team1Stats.totalRuns === team2Stats.totalRuns) {
        winner = 'Match Tied';
        margin = 'Scores level';
        method = 'Tie';
    } else if (team1Stats.totalRuns > team2Stats.totalRuns) {
        winner = player1;
        margin = `${team1Stats.totalRuns - team2Stats.totalRuns} runs`;
        method = '';
    } else {
        winner = player2;
        margin = `${10 - Math.floor(Math.random() * 5)} wickets`; // Random number of wickets (5-10)
        method = '';
    }
    
    // Find best batsman for player of the match
    const team1BestBatsman = team1Stats.battingStats.reduce((prev, current) => 
        (prev.runs > current.runs) ? prev : current, { runs: 0 });
    const team2BestBatsman = team2Stats.battingStats.reduce((prev, current) => 
        (prev.runs > current.runs) ? prev : current, { runs: 0 });
    const playerOfMatch = team1BestBatsman.runs > team2BestBatsman.runs ? 
        team1BestBatsman : team2BestBatsman;
    
    // Generate key performers
    const topBatsmen = [
        ...team1Stats.battingStats,
        ...team2Stats.battingStats
    ]
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 4)
    .map(player => ({
        name: player.name,
        team: player.name.includes(player1) ? player1 : player2,
        performance: `${player.runs} runs (${player.balls} balls, ${player.fours} fours, ${player.sixes} sixes)`
    }));
    
    const topBowlers = [
        ...team1BowlingStats,
        ...team2BowlingStats
    ]
    .sort((a, b) => b.wickets - a.wickets || a.runs - b.runs)
    .slice(0, 4)
    .map(player => ({
        name: player.name,
        team: team1Players.includes(player.name) ? player1 : player2,
        performance: `${player.wickets} wickets for ${player.runs} runs`
    }));
    
    return {
        format: format,
        venue: stadium,
        date: currentDate,
        toss: {
            winner: Math.random() > 0.5 ? player1 : player2,
            decision: Math.random() > 0.5 ? 'bat' : 'bowl'
        },
        team1: {
            name: player1,
            score: { runs: team1Stats.totalRuns, wickets: team1Stats.wicketsFallen },
            overs: team1UsedOvers,
            battingStats: team1Stats.battingStats,
            bowlingStats: team1BowlingStats,
            extras: team1Stats.extras
        },
        team2: {
            name: player2,
            score: { runs: team2Stats.totalRuns, wickets: team2Stats.wicketsFallen },
            overs: team2UsedOvers,
            battingStats: team2Stats.battingStats,
            bowlingStats: team2BowlingStats,
            extras: team2Stats.extras
        },
        result: {
            winner: winner,
            margin: margin,
            method: method
        },
        playerOfMatch: {
            name: playerOfMatch.name,
            team: team1Players.includes(playerOfMatch.name) ? player1 : player2,
            performance: `${playerOfMatch.runs} runs (${playerOfMatch.balls} balls)`
        },
        keyPerformers: {
            batting: topBatsmen,
            bowling: topBowlers
        },
        analysis: 'This match was simulated with generated data. The score distribution and player performances are based on typical cricket statistics.',
        _apiProcessed: false,
        _fallbackData: true
    };
}

/**
 * Generate default player names when no names are provided
 */
function generateDefaultPlayerNames(teamName, count) {
    const playerNames = [];
    
    // Common cricket player positions/roles
    const positions = [
        'Captain', 'Opener', 'Batsman', 'All-rounder', 
        'Wicket-keeper', 'Bowler', 'Spinner', 'Fast Bowler'
    ];
    
    for (let i = 1; i <= count; i++) {
        let position = '';
        if (i === 1) position = 'Captain';
        else if (i === 5) position = 'Wicket-keeper';
        else if (i <= 4) position = 'Batsman';
        else if (i <= 7) position = 'All-rounder';
        else position = 'Bowler';
        
        playerNames.push(`${teamName} ${position} ${i}`);
    }
    
    return playerNames;
}

function showMatchData(matchData) {
    // Create the structure if it doesn't exist
    ensureUIStructure();
    
    // Initialize UI components with match data
    initializeMatchInfo(matchData);
    initializeTeamScores(matchData);
    initializeTopPerformers(matchData);
    initializeBattingScores(matchData);
    initializeBowlingScores(matchData);
    initializeMatchResult(matchData);
    setupInDepthButton(matchData);
    
    // Add data source indicator
    addDataSourceIndicator(matchData);
    
    // Store the data for future use
    localStorage.setItem('matchResult', JSON.stringify(matchData));
}

/**
 * Ensure that all UI elements exist in the DOM before populating with data
 */
function ensureUIStructure() {
    const contentContainer = document.getElementById('contentContainer');
    if (!contentContainer) return;
    
    // Create the basic structure if it doesn't exist
    if (!document.getElementById('matchInfo')) {
        const matchInfo = document.createElement('div');
        matchInfo.id = 'matchInfo';
        contentContainer.appendChild(matchInfo);
    }
    
    if (!document.getElementById('scoreCard')) {
        const scoreCard = document.createElement('div');
        scoreCard.id = 'scoreCard';
        scoreCard.className = 'score-card';
        
        const team1Score = document.createElement('div');
        team1Score.id = 'team1Score';
        team1Score.className = 'team-score';
        
        const team2Score = document.createElement('div');
        team2Score.id = 'team2Score';
        team2Score.className = 'team-score';
        
        scoreCard.appendChild(team1Score);
        scoreCard.appendChild(team2Score);
        
        contentContainer.appendChild(scoreCard);
    }
    
    if (!document.getElementById('matchResult')) {
        const matchResult = document.createElement('div');
        matchResult.id = 'matchResult';
        contentContainer.appendChild(matchResult);
    }
    
    if (!document.getElementById('battingSection')) {
        const battingSection = document.createElement('div');
        battingSection.id = 'battingSection';
        battingSection.className = 'batting-section';
        
        const team1Batting = document.createElement('div');
        team1Batting.id = 'team1Batting';
        
        const team2Batting = document.createElement('div');
        team2Batting.id = 'team2Batting';
        
        battingSection.appendChild(team1Batting);
        battingSection.appendChild(team2Batting);
        
        contentContainer.appendChild(battingSection);
    }
    
    if (!document.getElementById('bowlingSection')) {
        const bowlingSection = document.createElement('div');
        bowlingSection.id = 'bowlingSection';
        bowlingSection.className = 'bowling-section';
        
        const team1Bowling = document.createElement('div');
        team1Bowling.id = 'team1Bowling';
        
        const team2Bowling = document.createElement('div');
        team2Bowling.id = 'team2Bowling';
        
        bowlingSection.appendChild(team1Bowling);
        bowlingSection.appendChild(team2Bowling);
        
        contentContainer.appendChild(bowlingSection);
    }
    
    if (!document.getElementById('matchAnalysis')) {
        const matchAnalysis = document.createElement('div');
        matchAnalysis.id = 'matchAnalysis';
        contentContainer.appendChild(matchAnalysis);
    }
}

function initializeMatchInfo(data) {
    const matchInfoElement = document.getElementById('matchInfo');
    matchInfoElement.innerHTML = `
        <h2>${data.team1.name} vs ${data.team2.name}</h2>
        <p>${data.format} Match at ${data.venue}</p>
        <p>Toss: ${data.toss?.winner || 'Unknown'} won the toss and elected to ${data.toss?.decision || 'bat'}</p>
    `;
}

function initializeTeamScores(data) {
    const team1ScoreElement = document.getElementById('team1Score');
    const team2ScoreElement = document.getElementById('team2Score');
    
    team1ScoreElement.innerHTML = `
        <h3>${data.team1.name}</h3>
        <p class="score">${formatScore(data.team1.score)} (${formatOvers(data.team1.overs)})</p>
    `;
    
    team2ScoreElement.innerHTML = `
        <h3>${data.team2.name}</h3>
        <p class="score">${formatScore(data.team2.score)} (${formatOvers(data.team2.overs)})</p>
    `;
}

function initializeTopPerformers(data) {
    // Create a new section for top performers if it doesn't exist
    let topPerformersElement = document.getElementById('topPerformers');
    if (!topPerformersElement) {
        topPerformersElement = document.createElement('div');
        topPerformersElement.id = 'topPerformers';
        topPerformersElement.className = 'card';
        
        // Insert it after the match result section
        const matchResultElement = document.getElementById('matchResult');
        matchResultElement.parentNode.insertBefore(topPerformersElement, matchResultElement.nextSibling);
    }
    
    // Check if we have key performers data
    if (data.keyPerformers) {
        let html = '<h3>Top Performers</h3>';
        
        // Add batting performers
        html += '<div class="performers-section"><h4>Batting</h4><ul class="performers-list">';
        data.keyPerformers.batting.forEach((player, index) => {
            html += `<li data-rank="${index + 1}"><span class="player-name">${player.name}</span> (${player.team}) - ${player.performance}</li>`;
        });
        html += '</ul></div>';
        
        // Add bowling performers
        html += '<div class="performers-section"><h4>Bowling</h4><ul class="performers-list">';
        data.keyPerformers.bowling.forEach((player, index) => {
            html += `<li data-rank="${index + 1}"><span class="player-name">${player.name}</span> (${player.team}) - ${player.performance}</li>`;
        });
        html += '</ul></div>';
        
        topPerformersElement.innerHTML = html;
    } else {
        // No key performers data, hide the section
        topPerformersElement.style.display = 'none';
    }
}

function initializeBattingScores(data) {
    const team1BattingElement = document.getElementById('team1Batting');
    const team2BattingElement = document.getElementById('team2Batting');
    
    // Create table for team 1 batting
    team1BattingElement.innerHTML = createBattingTable(data.team1);
    
    // Create table for team 2 batting
    team2BattingElement.innerHTML = createBattingTable(data.team2);
}

function createBattingTable(team) {
    // Table headers
    let html = `
        <h3>${team.name} Batting</h3>
        <div class="table-container">
            <table class="batting-table">
                <thead>
                    <tr>
                        <th>Batsman</th>
                        <th>Dismissal</th>
                        <th>Runs</th>
                        <th>Balls</th>
                        <th>4s</th>
                        <th>6s</th>
                        <th>SR</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Add batting rows
    team.battingStats.forEach(stat => {
        html += `
            <tr>
                <td>${stat.name}</td>
                <td>${stat.dismissal || 'not out'}</td>
                <td>${stat.runs}</td>
                <td>${stat.balls}</td>
                <td>${stat.fours || 0}</td>
                <td>${stat.sixes || 0}</td>
                <td>${stat.strikeRate || '-'}</td>
            </tr>
        `;
    });
    
    // Add extras and total
    html += `
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2">Extras</td>
                        <td colspan="5">${team.extras || '0 (lb 0, w 0, nb 0, b 0)'}</td>
                    </tr>
                    <tr>
                        <td colspan="2">Total</td>
                        <td colspan="5">${formatScore(team.score)} (${formatOvers(team.overs)})</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
    
    return html;
}

function initializeBowlingScores(data) {
    const team1BowlingElement = document.getElementById('team1Bowling');
    const team2BowlingElement = document.getElementById('team2Bowling');
    
    // Create table for team 1 bowling
    team2BowlingElement.innerHTML = createBowlingTable(data.team2, data.team1.name);
    
    // Create table for team 2 bowling
    team1BowlingElement.innerHTML = createBowlingTable(data.team1, data.team2.name);
}

function createBowlingTable(team, opposingTeam) {
    // Table headers
    let html = `
        <h3>${team.name} Bowling</h3>
        <div class="table-container">
            <table class="bowling-table">
                <thead>
                    <tr>
                        <th>Bowler</th>
                        <th>O</th>
                        <th>M</th>
                        <th>R</th>
                        <th>W</th>
                        <th>Econ</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Add bowling rows
    team.bowlingStats.forEach(stat => {
        html += `
            <tr>
                <td>${stat.name}</td>
                <td>${stat.overs}</td>
                <td>${stat.maidens || 0}</td>
                <td>${stat.runs}</td>
                <td>${stat.wickets}</td>
                <td>${stat.economy || '-'}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    return html;
}

function initializeMatchResult(data) {
    const resultElement = document.getElementById('matchResult');
    const analysisElement = document.getElementById('matchAnalysis');
    
    // Set match result
    if (data.result) {
        resultElement.innerHTML = `
            <h3>Result</h3>
            <p>${data.result.winner} won by ${data.result.margin}${data.result.method ? ' ' + data.result.method : ''}</p>
            ${data.playerOfMatch ? `<p>Player of the Match: ${data.playerOfMatch.name} (${data.playerOfMatch.team})${data.playerOfMatch.performance ? ' - ' + data.playerOfMatch.performance : ''}</p>` : ''}
        `;
    } else {
        resultElement.innerHTML = `<h3>Result</h3><p>Match result not available</p>`;
    }
    
    // Set match analysis
    if (data.analysis) {
        analysisElement.innerHTML = `
            <h3>Match Analysis</h3>
            <p>${data.analysis}</p>
        `;
    } else {
        analysisElement.style.display = 'none';
    }
}

function formatScore(score) {
    if (!score) return '0/0';
    return `${score.runs}/${score.wickets || 0}`;
}

function formatOvers(overs) {
    if (!overs) return '0.0';
    return overs;
}

// Add this new function to handle the in-depth conclusion button
function setupInDepthButton(data) {
    const inDepthBtn = document.getElementById('inDepthBtn');
    if (!inDepthBtn) return;
    
    inDepthBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Get the analysis element
        const analysisElement = document.getElementById('matchAnalysis');
        
        // Toggle expanded class to show more detailed analysis
        if (analysisElement.classList.contains('expanded')) {
            // If already expanded, collapse it
            analysisElement.classList.remove('expanded');
            inDepthBtn.textContent = 'In Depth Conclusion';
            
            // Scroll back to normal position
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } else {
            // If not expanded, expand it and show full analysis
            analysisElement.classList.add('expanded');
            inDepthBtn.textContent = 'Collapse Analysis';
            
            // Generate a more detailed analysis if needed
            if (!analysisElement.querySelector('.full-analysis')) {
                const fullAnalysisDiv = document.createElement('div');
                fullAnalysisDiv.className = 'full-analysis';
                
                // Generate more detailed analysis
                const detailedAnalysis = generateDetailedAnalysis(data);
                fullAnalysisDiv.innerHTML = detailedAnalysis;
                
                // Append to the analysis element
                analysisElement.appendChild(fullAnalysisDiv);
            }
            
            // Scroll to the analysis section
            analysisElement.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
}

// Function to generate a more detailed analysis
function generateDetailedAnalysis(data) {
    // If we already have a detailed analysis in the data, use it
    if (data.detailedAnalysis) {
        return data.detailedAnalysis;
    }
    
    // Otherwise, generate a more detailed version of the regular analysis
    let html = '<h3>In-Depth Match Analysis</h3>';
    
    // Add general match context
    html += `<div class="analysis-section">
        <h4>Match Context</h4>
        <p>This ${data.format} match at ${data.venue} saw ${data.team1.name} face off against ${data.team2.name}. 
        ${data.toss?.winner || 'One team'} won the toss and elected to ${data.toss?.decision || 'bat'} first.</p>
    </div>`;
    
    // Add team performance analysis
    html += `<div class="analysis-section">
        <h4>Team Performances</h4>
        <p><strong>${data.team1.name}:</strong> Scored ${formatScore(data.team1.score)} in ${data.team1.overs} overs. 
        ${getTeamPerformanceSummary(data.team1)}</p>
        <p><strong>${data.team2.name}:</strong> Scored ${formatScore(data.team2.score)} in ${data.team2.overs} overs. 
        ${getTeamPerformanceSummary(data.team2)}</p>
    </div>`;
    
    // Add key players section
    html += `<div class="analysis-section">
        <h4>Key Performers</h4>
        ${getKeyPerformersSummary(data)}
    </div>`;
    
    // Add match turning points if we can determine them
    html += `<div class="analysis-section">
        <h4>Conclusion</h4>
        <p>${data.result.winner} emerged victorious by ${data.result.margin}, 
        ${getMatchConclusionSummary(data)}</p>
    </div>`;
    
    return html;
}

function getTeamPerformanceSummary(team) {
    // Find the top batsman
    const topBatsman = team.battingStats.reduce((prev, current) => 
        (prev.runs > current.runs) ? prev : current, {runs: 0});
    
    // Find the top bowler if available
    let topBowler = {wickets: 0, name: ''};
    if (team.bowlingStats && team.bowlingStats.length > 0) {
        topBowler = team.bowlingStats.reduce((prev, current) => 
            (prev.wickets > current.wickets) ? prev : current, {wickets: 0});
    }
    
    // Generate a summary
    return `Their innings was highlighted by ${topBatsman.name}'s ${topBatsman.runs} runs` + 
        (topBowler.wickets > 0 ? ` and ${topBowler.name}'s bowling figures of ${topBowler.wickets}-${topBowler.runs}.` : '.');
}

function getKeyPerformersSummary(data) {
    let html = '<ul>';
    
    // Add player of the match
    if (data.playerOfMatch) {
        html += `<li><strong>Player of the Match:</strong> ${data.playerOfMatch.name} (${data.playerOfMatch.team})
                ${data.playerOfMatch.performance ? '- ' + data.playerOfMatch.performance : ''}</li>`;
    }
    
    // Find top run scorer
    const team1TopBatsman = data.team1.battingStats.reduce((prev, current) => 
        (prev.runs > current.runs) ? prev : current, {runs: 0});
    const team2TopBatsman = data.team2.battingStats.reduce((prev, current) => 
        (prev.runs > current.runs) ? prev : current, {runs: 0});
    
    // Add top run scorer
    const topRunScorer = team1TopBatsman.runs > team2TopBatsman.runs ? team1TopBatsman : team2TopBatsman;
    html += `<li><strong>Top Run Scorer:</strong> ${topRunScorer.name} - ${topRunScorer.runs} runs 
            (${topRunScorer.balls} balls, ${topRunScorer.fours || 0} fours, ${topRunScorer.sixes || 0} sixes)</li>`;
    
    // Find top wicket taker if bowling stats are available
    if ((data.team1.bowlingStats && data.team1.bowlingStats.length > 0) ||
        (data.team2.bowlingStats && data.team2.bowlingStats.length > 0)) {
        
        const team1TopBowler = data.team1.bowlingStats && data.team1.bowlingStats.length > 0 ? 
            data.team1.bowlingStats.reduce((prev, current) => 
                (prev.wickets > current.wickets) ? prev : current, {wickets: 0}) : {wickets: 0};
            
        const team2TopBowler = data.team2.bowlingStats && data.team2.bowlingStats.length > 0 ? 
            data.team2.bowlingStats.reduce((prev, current) => 
                (prev.wickets > current.wickets) ? prev : current, {wickets: 0}) : {wickets: 0};
        
        const topWicketTaker = team1TopBowler.wickets > team2TopBowler.wickets ? team1TopBowler : team2TopBowler;
        if (topWicketTaker.wickets > 0) {
            html += `<li><strong>Top Wicket Taker:</strong> ${topWicketTaker.name} - ${topWicketTaker.wickets} wickets 
                    (${topWicketTaker.overs} overs, ${topWicketTaker.runs} runs)</li>`;
        }
    }
    
    html += '</ul>';
    return html;
}

function getMatchConclusionSummary(data) {
    // Create a conclusion based on the analysis or result
    if (data.analysis) {
        return data.analysis;
    }
    
    // Default conclusion if no detailed analysis available
    return `showcasing a strong cricket performance. The match demonstrated the importance of 
            strategic play and individual performances in the ${data.format} format.`;
}

/**
 * Add a data source indicator to show simulation mode
 * @param {Object} matchData - Match data to display in the indicator
 */
function addDataSourceIndicator(matchData) {
    const container = document.querySelector('.container') || document.body;
    
    // Create or update data source indicator
    let indicator = document.querySelector('.data-source-indicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'data-source-indicator';
        
        // Insert after header if exists, otherwise at the top of container
        const header = container.querySelector('.header');
        if (header) {
            header.after(indicator);
        } else {
            container.insertBefore(indicator, container.firstChild);
        }
    }
    
    // Get simulation settings
    const isRealisticMode = localStorage.getItem('realisticMode') === 'true';
    const allowTies = localStorage.getItem('allowTies') === 'true';
    
    // Set content based on data source and simulation mode
    const source = matchData._generatedBy || 'Cricket Simulation';
    const modeLabel = isRealisticMode ? 'Realistic Mode' : 'Standard Mode';
    
    // Create tooltip text
    let tooltipText = `Simulation: ${modeLabel}`;
    tooltipText += allowTies ? ' (Ties allowed)' : '';
    
    indicator.innerHTML = `
        <span title="${tooltipText}">
            ${source}
        </span>
    `;
}

// New function to verify the quality of the API data
function verifyDataQuality(data) {
    const issues = [];
    
    // Check basic match data
    if (!data || !data.team1 || !data.team2 || !data.result) {
        issues.push('Missing essential match data');
        return issues;
    }
    
    // Check for proper score data
    const team1Runs = data.team1.score?.runs || 0;
    const team2Runs = data.team2.score?.runs || 0;
    
    // Validate ties
    if (team1Runs === team2Runs) {
        if (data.result.winner !== 'Match Tied' && 
            data.result.winner !== 'Tie' &&
            data.result.winner !== 'tie' &&
            !String(data.result.winner || '').includes('tie') &&
            !String(data.result.winner || '').includes('Tie')) {
            
            issues.push('Equal scores should be a tie');
            
            // Fix invalid tie result
            data.result.winner = 'Match Tied';
            data.result.margin = 'Scores level';
            data.result.method = 'Tie';
            
            console.log('Fixed incorrect match result (equal scores should be a tie)');
        }
    }
    
    // Fix invalid margin
    if (data.result.margin === '0 runs' || data.result.margin === '0 wickets') {
        issues.push('Invalid result margin (0 runs/wickets)');
        
        if (team1Runs === team2Runs) {
            // This should be a tie
            data.result.winner = 'Match Tied';
            data.result.margin = 'Scores level';
            data.result.method = 'Tie';
        } else if (data.result.margin === '0 wickets') {
            // Fix with a reasonable margin
            data.result.margin = '10 wickets';
        }
    }
    
    // Format checks
    if (data.format) {
        if (/t[^\w]*20|t-20/i.test(data.format)) {
            // T20 checks
            if (team1Runs > 300) issues.push(`T20 score too high: ${team1Runs}`);
            if (team2Runs > 300) issues.push(`T20 score too high: ${team2Runs}`);
            
            if (data.team1.overs && parseFloat(data.team1.overs) > 20) {
                issues.push('T20 overs exceed 20');
            }
            if (data.team2.overs && parseFloat(data.team2.overs) > 20) {
                issues.push('T20 overs exceed 20');
            }
        } else if (/odi/i.test(data.format)) {
            // ODI checks
            if (team1Runs > 500) issues.push(`ODI score too high: ${team1Runs}`);
            if (team2Runs > 500) issues.push(`ODI score too high: ${team2Runs}`);
            
            if (data.team1.overs && parseFloat(data.team1.overs) > 50) {
                issues.push('ODI overs exceed 50');
            }
            if (data.team2.overs && parseFloat(data.team2.overs) > 50) {
                issues.push('ODI overs exceed 50');
            }
        }
    }
    
    return issues;
}

// Function to add a debug toggle to the page
function addDebugToggle() {
    const debugToggle = document.createElement('div');
    debugToggle.className = 'debug-toggle';
    debugToggle.innerHTML = `
        <a href="?debug=true" id="enableDebug">Debug</a>
    `;
    document.body.appendChild(debugToggle);
}

/**
 * Add debug panel for testing and simulation options
 */
function addDebugPanel() {
    console.log('Adding debug panel...');
    
    // Create debug toggle button that's always visible
    const debugToggle = document.createElement('button');
    debugToggle.id = 'debug-toggle-btn';
    debugToggle.className = 'debug-toggle-button';
    debugToggle.innerHTML = '<span>🔧</span>';
    debugToggle.title = 'Toggle Debug Panel';
    document.body.appendChild(debugToggle);
    
    // Create the debug panel (hidden by default)
    const debugPanel = document.createElement('div');
    debugPanel.id = 'debug-panel';
    debugPanel.className = 'debug-panel';
    debugPanel.style.display = 'none'; // Hidden by default
    debugPanel.innerHTML = `
        <div class="debug-header">
            <h3>Debug Panel</h3>
            <button id="close-debug" class="debug-close">×</button>
        </div>
        <div class="debug-content">
            <div class="debug-section">
                <h4>Simulation Testing</h4>
                <div class="debug-buttons">
                    <button id="test-simulation" class="debug-button">Test Simulation</button>
                    <button id="generate-fallback" class="debug-button">Generate Sample Data</button>
                </div>
                <div id="api-test-result" class="api-test-result"></div>
            </div>
            <div class="debug-section">
                <h4>Simulation Settings</h4>
                <div class="debug-settings">
                    <label>
                        <input type="checkbox" id="enable-realistic-mode"> 
                        Enable realistic simulation
                    </label>
                    <br>
                    <label>
                        <input type="checkbox" id="enable-tie-chance"> 
                        Allow tied matches (rare)
                    </label>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(debugPanel);
    
    // Toggle debug panel when the small button is clicked
    debugToggle.addEventListener('click', function() {
        const panel = document.getElementById('debug-panel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    
    // Close debug panel with the X button
    document.getElementById('close-debug').addEventListener('click', function() {
        document.getElementById('debug-panel').style.display = 'none';
    });
    
    // Simulation test button
    document.getElementById('test-simulation').addEventListener('click', function() {
        testSimulation();
    });
    
    // Data generation button
    document.getElementById('generate-fallback').addEventListener('click', function() {
        const dummyMatch = {
            player1Name: 'India',
            player2Name: 'Australia',
            stadium: 'MCG',
            format: 'T20',
            team1Players: ['Rohit Sharma', 'Virat Kohli', 'KL Rahul', 'Rishabh Pant', 'Hardik Pandya'],
            team2Players: ['David Warner', 'Steve Smith', 'Glenn Maxwell', 'Pat Cummins', 'Mitchell Starc']
        };
        
        const fallbackData = generateFallbackData(dummyMatch);
        console.log('Generated sample data:', fallbackData);
        alert('Sample data generated and logged to console');
    });
    
    // Simulation settings
    document.getElementById('enable-realistic-mode').addEventListener('change', function() {
        localStorage.setItem('realisticMode', this.checked);
        console.log('Realistic mode set to:', this.checked);
    });
    
    document.getElementById('enable-tie-chance').addEventListener('change', function() {
        localStorage.setItem('allowTies', this.checked);
        console.log('Allow ties set to:', this.checked);
    });
    
    // Initialize checkbox states
    document.getElementById('enable-realistic-mode').checked = 
        localStorage.getItem('realisticMode') === 'true';
    document.getElementById('enable-tie-chance').checked = 
        localStorage.getItem('allowTies') === 'true';
    
    // Add CSS for debug panel and toggle button
    const style = document.createElement('style');
    style.textContent = `
        /* Debug Toggle Button */
        .debug-toggle-button {
            position: fixed;
            bottom: 10px;
            right: 10px;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background-color: #2c3e50;
            color: white;
            border: none;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            cursor: pointer;
            z-index: 1001;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            transition: all 0.3s ease;
        }
        
        .debug-toggle-button:hover {
            background-color: #3498db;
            transform: scale(1.1);
        }
        
        /* Debug Panel */
        .debug-panel {
            position: fixed;
            bottom: 50px;
            right: 10px;
            width: 350px;
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 0 15px rgba(0,0,0,0.1);
            z-index: 1000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        
        .debug-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            background-color: #2c3e50;
            color: white;
        }
        
        .debug-header h3 {
            margin: 0;
            font-size: 16px;
        }
        
        .debug-close {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            line-height: 1;
        }
        
        .debug-content {
            padding: 15px;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .debug-section {
            margin-bottom: 20px;
        }
        
        .debug-section h4 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: #333;
        }
        
        .debug-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 10px;
        }
        
        .debug-button {
            padding: 8px 12px;
            background-color: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }
        
        .debug-button:hover {
            background-color: #2980b9;
        }
        
        .debug-settings {
            padding: 10px;
            background-color: #f8f8f8;
            border-radius: 4px;
        }
        
        .debug-settings label {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            cursor: pointer;
        }
        
        .debug-settings input[type="checkbox"] {
            margin-right: 8px;
        }
        
        .api-test-result {
            margin-top: 10px;
            padding: 10px;
            background-color: #f9f9f9;
            border-radius: 4px;
            font-size: 12px;
        }
    `;
    document.head.appendChild(style);
    
    console.log('Debug panel added');
}

/**
 * Test the simulation engine
 */
function testSimulation() {
    const resultElement = document.getElementById('api-test-result');
    if (!resultElement) {
        console.error('Result element not found for displaying test results');
        return;
    }
    
    resultElement.innerHTML = '<div class="loading">Testing local simulation...</div>';
    resultElement.className = 'test-running';
    
    // Create sample match data
    const sampleMatchData = {
        player1Name: 'India',
        player2Name: 'Australia',
        stadium: 'MCG, Melbourne',
        format: 'T20',
        team1Players: ['Rohit Sharma', 'Virat Kohli', 'KL Rahul', 'Rishabh Pant', 'Hardik Pandya'],
        team2Players: ['David Warner', 'Steve Smith', 'Glenn Maxwell', 'Pat Cummins', 'Mitchell Starc']
    };
    
    // Instantiate simulation engine if not already done
    const engine = window.simulationEngine || new SimpleSimulationEngine();
    
    // Process the sample data
    engine.processMatch(sampleMatchData)
        .then(result => {
            console.log('Simulation test result:', result);
            
            // Display a summary of the result
            resultElement.innerHTML = `
                <div class="success">✓ Simulation successful</div>
                <div class="response-box">
                    <p><strong>Match result:</strong> ${result.result && result.result.winner ? result.result.winner : 'Unknown'}</p>
                    <p><strong>Margin:</strong> ${result.result && result.result.margin ? result.result.margin : 'N/A'}</p>
                    <p><strong>Scorecard:</strong></p>
                    <ul>
                        <li>${result.team1 || 'Team 1'}: ${result.scorecard?.team1?.total || 0}/${result.scorecard?.team1?.wickets || 0} (${result.scorecard?.team1?.overs || 0} overs)</li>
                        <li>${result.team2 || 'Team 2'}: ${result.scorecard?.team2?.total || 0}/${result.scorecard?.team2?.wickets || 0} (${result.scorecard?.team2?.overs || 0} overs)</li>
                    </ul>
                </div>
                <div class="info">The simulation engine is working properly.</div>
            `;
            resultElement.className = 'test-success';
        })
        .catch(error => {
            console.error('Error during simulation test:', error);
            
            resultElement.innerHTML = `
                <div class="error">✗ Simulation failed: ${error.message}</div>
                <div class="info">
                    <p>There was an error in the simulation process.</p>
                </div>
            `;
            resultElement.className = 'test-error';
        });
}

// Show local storage data in debug panel
function showLocalStorageData() {
    const container = document.getElementById('localStorageData');
    if (!container) return;
    
    // Get all keys from localStorage
    const keys = Object.keys(localStorage);
    let html = '';
    
    keys.forEach(key => {
        try {
            const value = localStorage.getItem(key);
            let displayValue = value;
            
            // Try to parse JSON if it looks like JSON
            if (value?.startsWith('{') || value?.startsWith('[')) {
                try {
                    const parsed = JSON.parse(value);
                    displayValue = `Object with keys: ${Object.keys(parsed).join(', ')}`;
                } catch (e) {
                    // Not valid JSON, use as is
                }
            }
            
            html += `<div>${key}: ${displayValue}</div>`;
        } catch (e) {
            html += `<div>${key}: [Error reading value]</div>`;
        }
    });
    
    container.innerHTML = html || 'No data in localStorage';
}

// For debug testing - remove in production
function testTieVerification() {
    // Create test data with tied scores but incorrect result
    const testData = {
        format: 'T20',
        team1: {
            name: 'Team A',
            score: { runs: 150, wickets: 8 },
            overs: '20.0'
        },
        team2: {
            name: 'Team B',
            score: { runs: 150, wickets: 9 },
            overs: '20.0'
        },
        result: {
            winner: 'Team A', // This is wrong - should be a tie
            margin: '0 runs',
            method: 'normal'
        }
    };
    
    console.log('TESTING TIE VERIFICATION');
    console.log('Before verification:', JSON.stringify(testData.result));
    
    // Verify data quality
    const issues = verifyDataQuality(testData);
    console.log('Issues found:', issues);
    console.log('After verification:', JSON.stringify(testData.result));
    
    // Test fallback generation
    console.log('TESTING FALLBACK GENERATION');
    const matchData = {
        format: 'T20',
        player1Name: 'India',
        player2Name: 'Australia',
        stadium: 'MCG'
    };
    
    // Force a tied match for testing
    const oldRandom = Math.random;
    Math.random = () => 0.05; // This will trigger the tied match condition
    
    const fallbackData = generateFallbackData(matchData);
    console.log('Fallback data tied match test:', 
        fallbackData.team1.score.runs === fallbackData.team2.score.runs,
        fallbackData.result.winner === 'Match Tied');
    
    // Restore random function
    Math.random = oldRandom;
}

// Run tests if debug=true in URL params
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'true' && urlParams.get('test') === 'true') {
        setTimeout(testTieVerification, 1000);
    }
});

/**
 * Initialize the UI components and load match data if available
 */
function initializeUI() {
    console.log('Initializing UI...');
    
    // Get UI elements
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingStatus = document.getElementById('loadingStatus');
    const contentContainer = document.getElementById('contentContainer');
    
    if (!loadingOverlay || !loadingStatus || !contentContainer) {
        console.log('Match summary UI elements not found, may be on a different page');
        return;
    }
    
    // Check if match data exists
    const matchDataString = localStorage.getItem('matchData');
    if (!matchDataString) {
        // No match data found, redirect to team selection page
        console.log('No match data found in localStorage');
        
        // Only redirect if we're on the summary page
        if (window.location.pathname.includes('summary.html')) {
            alert('No match data found. Starting a new match.');
            window.location.href = 'team-selection.html';
        }
        return;
    }
    
    try {
        // Parse the match data
        const matchData = JSON.parse(matchDataString);
        console.log('Match data loaded from localStorage:', matchData);
        
        // Add data source indicator
        addDataSourceIndicator(matchData);
        
        // Check if data needs to be processed
        if (matchData._processing) {
            // Show loading overlay
            loadingOverlay.style.display = 'flex';
            contentContainer.style.display = 'none';
            
            // Update loading status
            loadingStatus.textContent = 'Analyzing match data with AI...';
            
            // Process data with AI
            processMatchDataWithAI(matchData)
                .then(processedData => {
                    // Hide loading overlay and show content
                    loadingOverlay.style.display = 'none';
                    contentContainer.style.display = 'block';
                    
                    // Add data source indicator
                    addDataSourceIndicator(processedData);
                    
                    // Show match data
                    showMatchData(processedData);
                })
                .catch(processingError => {
                    console.error('Error processing match with AI:', processingError);
                    
                    // Generate fallback data
                    const fallbackData = generateFallbackData(matchData);
                    
                    // Hide loading overlay and show content
                    loadingOverlay.style.display = 'none';
                    contentContainer.style.display = 'block';
                    
                    // Add data source indicator
                    addDataSourceIndicator(fallbackData);
                    
                    // Show fallback match data
                    showMatchData(fallbackData);
                });
        } else {
            // Data already processed, show directly
            loadingOverlay.style.display = 'none';
            contentContainer.style.display = 'block';
            
            // Add data source indicator
            addDataSourceIndicator(matchData);
            
            // Show the match data
            showMatchData(matchData);
        }
    } catch (error) {
        console.error('Error loading match data:', error);
        
        if (window.location.pathname.includes('summary.html')) {
            alert('Error loading match data. Starting a new match.');
            window.location.href = 'team-selection.html';
        }
    }
} 